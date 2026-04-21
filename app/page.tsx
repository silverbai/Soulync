// app/page.tsx
// Main Soulync app - handles the entire user journey

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Screen = 'welcome' | 'signup' | 'round1' | 'round2' | 'profile' | 'matching' | 'match' | 'plans' | 'confirmed' | 'checkin' | 'chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [user, setUser] = useState<any>(null);
  const [locale, setLocale] = useState<'en' | 'zh'>('en');

  // Onboarding state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [seeking, setSeeking] = useState('');
  const [city, setCity] = useState('');

  // AI Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [round, setRound] = useState(1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Profile state
  const [psychProfile, setPsychProfile] = useState<any>(null);

  // Match state
  const [match, setMatch] = useState<any>(null);
  const [datePlans, setDatePlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<any>(null);

  // Chat state (post-meeting)
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');

  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auth check ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        checkOnboardingStatus(data.session.user.id);
      }
    });
  }, []);

  async function checkOnboardingStatus(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', userId)
      .single();

    if (data?.onboarding_complete) {
      setScreen('matching');
    }
  }

  // ── Sign up ──
  async function handleSignup() {
    const email = `${name.toLowerCase().replace(/\s/g, '')}${Date.now()}@soulync.app`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: `soulync-${Date.now()}`,
    });

    if (error || !data.user) {
      alert('Signup failed. Please try again.');
      return;
    }

    await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      display_name: name,
      age: parseInt(age),
      gender,
      seeking,
      city,
      locale,
    });

    setUser(data.user);
    setScreen('round1');
    initiateAIChat(1);
  }

  // ── AI Chat ──
  async function initiateAIChat(roundNum: number) {
    setRound(roundNum);
    setMessages([]);
    setIsTyping(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'demo',
        round: roundNum,
        messages: [],
        userMessage: roundNum === 1
          ? (locale === 'zh' ? '你好，我准备好了。' : 'Hi, I\'m ready to start.')
          : (locale === 'zh' ? '我准备好了，开始第二轮。' : 'I\'m ready for round 2.'),
      }),
    });

    const data = await res.json();
    setMessages(data.messages || []);
    setIsTyping(false);
  }

  async function sendMessage() {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'demo',
        round,
        messages,
        userMessage: userMsg,
      }),
    });

    const data = await res.json();
    setMessages(data.messages || []);
    setIsTyping(false);

    if (data.isRoundComplete) {
      if (round === 1) {
        setTimeout(() => {
          setScreen('round2');
          initiateAIChat(2);
        }, 1500);
      } else if (data.psychProfile) {
        setPsychProfile(data.psychProfile);
        setTimeout(() => setScreen('profile'), 1500);
      }
    }
  }

  // ── Find Match ──
  async function findMatch() {
    setScreen('matching');

    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id }),
    });

    const data = await res.json();
    if (data.match) {
      setMatch(data.match);
      setScreen('match');
      generateDatePlans(data.match.id);
    } else {
      alert(data.error || 'No matches found yet. Try again later!');
    }
  }

  // ── Generate Date Plans ──
  async function generateDatePlans(matchId: string) {
    const res = await fetch('/api/date-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    });

    const data = await res.json();
    if (data.plans) {
      setDatePlans(data.plans);
    }
  }

  // ── Select Date Plan ──
  async function selectDatePlan(planId: string) {
    setSelectedPlan(planId);

    const res = await fetch('/api/date-plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        userId: user?.id,
        response: 'accepted',
        matchId: match?.id,
      }),
    });

    const data = await res.json();
    if (data.status === 'confirmed') {
      setConfirmedPlan(data.plan);
      setScreen('confirmed');
    }
  }

  // ── Check In ──
  async function handleCheckin() {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datePlanId: confirmedPlan?.id,
        userId: user?.id,
      }),
    });

    const data = await res.json();
    if (data.chatUnlocked) {
      setScreen('chat');
    }
  }

  // ── Render ──
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', fontFamily: "'DM Sans', 'Noto Sans SC', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Noto+Sans+SC:wght@400;500;700&family=Playfair+Display:wght@500;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 20px' }}>

        {/* ═══ WELCOME ═══ */}
        {screen === 'welcome' && (
          <div style={{ textAlign: 'center', paddingTop: 100 }}>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 48, fontWeight: 500, color: '#1a1a1a', margin: '0 0 8px', letterSpacing: -1 }}>
              Soulync
            </h1>
            <p style={{ color: '#888', fontSize: 15, margin: '0 0 48px' }}>
              {t('Meet in 48 hours. Not 48 messages.', '48小时内见面，而不是48条消息。')}
            </p>

            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #eee', textAlign: 'left', marginBottom: 24 }}>
              {[
                { n: '01', en: 'AI learns who you really are', zh: 'AI深度了解真实的你' },
                { n: '02', en: 'We find your best match', zh: '我们为你找到最佳匹配' },
                { n: '03', en: 'AI arranges your date. You show up.', zh: 'AI安排约会，你只需出现。' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < 2 ? 18 : 0 }}>
                  <span style={{ fontFamily: 'Playfair Display', fontSize: 20, color: '#C4A06A', fontWeight: 500, minWidth: 28 }}>{step.n}</span>
                  <p style={{ fontSize: 15, margin: '3px 0 0', color: '#333' }}>{t(step.en, step.zh)}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setLocale('en')} style={{ flex: 1, padding: '12px', border: locale === 'en' ? '2px solid #1a1a1a' : '1px solid #ddd', borderRadius: 10, background: locale === 'en' ? '#1a1a1a' : '#fff', color: locale === 'en' ? '#fff' : '#666', fontSize: 14, cursor: 'pointer' }}>English</button>
              <button onClick={() => setLocale('zh')} style={{ flex: 1, padding: '12px', border: locale === 'zh' ? '2px solid #1a1a1a' : '1px solid #ddd', borderRadius: 10, background: locale === 'zh' ? '#1a1a1a' : '#fff', color: locale === 'zh' ? '#fff' : '#666', fontSize: 14, cursor: 'pointer' }}>中文</button>
            </div>

            <button onClick={() => setScreen('signup')} style={{ width: '100%', padding: 16, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
              {t('Begin my journey', '开始我的旅程')}
            </button>
          </div>
        )}

        {/* ═══ SIGNUP ═══ */}
        {screen === 'signup' && (
          <div style={{ paddingTop: 60 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 500, margin: '0 0 8px' }}>
              {t('About you', '关于你')}
            </h2>
            <p style={{ color: '#888', fontSize: 14, margin: '0 0 32px' }}>
              {t('Just the basics. AI will learn the rest.', '先填基本信息，AI会了解更多。')}
            </p>

            {[
              { label: t('Name', '名字'), value: name, set: setName, placeholder: t('Your first name', '你的名字') },
              { label: t('Age', '年龄'), value: age, set: setAge, placeholder: '25', type: 'number' },
              { label: t('City', '城市'), value: city, set: setCity, placeholder: t('New York', '上海') },
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 6 }}>{field.label}</label>
                <input
                  type={(field as any).type || 'text'}
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  style={{ width: '100%', padding: '14px 16px', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 15, background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 8 }}>{t('I am', '我是')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['male', 'female', 'non-binary'].map(g => (
                  <button key={g} onClick={() => setGender(g)} style={{
                    flex: 1, padding: '12px 8px', border: gender === g ? '2px solid #1a1a1a' : '1px solid #ddd',
                    borderRadius: 10, background: gender === g ? '#1a1a1a' : '#fff', color: gender === g ? '#fff' : '#666',
                    fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                  }}>{t(g, g === 'male' ? '男' : g === 'female' ? '女' : '非二元')}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 8 }}>{t('Looking for', '寻找')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['male', 'female', 'everyone'].map(s => (
                  <button key={s} onClick={() => setSeeking(s)} style={{
                    flex: 1, padding: '12px 8px', border: seeking === s ? '2px solid #1a1a1a' : '1px solid #ddd',
                    borderRadius: 10, background: seeking === s ? '#1a1a1a' : '#fff', color: seeking === s ? '#fff' : '#666',
                    fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                  }}>{t(s, s === 'male' ? '男生' : s === 'female' ? '女生' : '不限')}</button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSignup}
              disabled={!name || !age || !gender || !seeking}
              style={{ width: '100%', padding: 16, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer', opacity: (!name || !age || !gender || !seeking) ? 0.4 : 1 }}
            >
              {t('Start AI Interview', '开始AI访谈')}
            </button>
          </div>
        )}

        {/* ═══ AI CHAT (Round 1 & 2) ═══ */}
        {(screen === 'round1' || screen === 'round2') && (
          <div style={{ paddingTop: 24, paddingBottom: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                  {t(`Round ${round} of 2`, `第 ${round} 轮，共 2 轮`)}
                </p>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 500, margin: '4px 0 0' }}>
                  {round === 1 ? t('Getting to know you', '了解你') : t('Going deeper', '深入了解')}
                </h2>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#C4A06A', fontSize: 14, fontWeight: 700 }}>S</span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: '#eee', borderRadius: 2, marginBottom: 24 }}>
              <div style={{
                height: '100%', background: '#C4A06A', borderRadius: 2, transition: 'width 0.5s',
                width: `${Math.min(100, (messages.filter(m => m.role === 'user').length / 5) * 100)}%`,
              }} />
            </div>

            {/* Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  background: msg.role === 'user' ? '#1a1a1a' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  border: msg.role === 'assistant' ? '1px solid #eee' : 'none',
                  fontSize: 15, lineHeight: 1.6,
                  animation: 'fadeIn 0.3s ease',
                }}>
                  {msg.content}
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 16, background: '#fff', border: '1px solid #eee', fontSize: 14, color: '#888' }}>
                  {t('Thinking...', '思考中...')}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#FAFAF7', padding: '12px 20px 24px', borderTop: '1px solid #eee' }}>
              <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={t('Type your answer...', '输入你的回答...')}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid #e0e0e0', borderRadius: 12, fontSize: 15, background: '#fff' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  style={{ padding: '14px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: (!input.trim() || isTyping) ? 0.4 : 1 }}
                >
                  {t('Send', '发送')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PROFILE RESULT ═══ */}
        {screen === 'profile' && psychProfile && (
          <div style={{ paddingTop: 40, paddingBottom: 40 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 500, margin: '0 0 8px' }}>
              {t('Your soul profile', '你的灵魂画像')}
            </h2>
            <p style={{ color: '#888', fontSize: 14, margin: '0 0 28px' }}>
              {t('Here\'s what I learned about you.', '这是我对你的了解。')}
            </p>

            {/* Summary card */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #eee', marginBottom: 16 }}>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333', margin: 0 }}>
                {locale === 'zh' ? psychProfile.summary_zh : psychProfile.summary_en}
              </p>
            </div>

            {/* Attachment style */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #eee', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('Attachment style', '依恋风格')}
              </p>
              <p style={{ fontSize: 18, fontWeight: 500, margin: '0 0 4px', color: '#1a1a1a', textTransform: 'capitalize' }}>
                {psychProfile.attachment_style}
              </p>
            </div>

            {/* Love language */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #eee', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('Love language', '爱的语言')}
              </p>
              <p style={{ fontSize: 18, fontWeight: 500, margin: 0, color: '#1a1a1a', textTransform: 'capitalize' }}>
                {psychProfile.love_language?.replace('_', ' ')}
              </p>
            </div>

            {/* Big Five mini chart */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #eee', marginBottom: 28 }}>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('Personality', '人格特质')}
              </p>
              {[
                { label: t('Openness', '开放性'), value: psychProfile.big_five?.openness },
                { label: t('Conscientiousness', '尽责性'), value: psychProfile.big_five?.conscientiousness },
                { label: t('Extraversion', '外向性'), value: psychProfile.big_five?.extraversion },
                { label: t('Agreeableness', '宜人性'), value: psychProfile.big_five?.agreeableness },
                { label: t('Neuroticism', '情绪敏感'), value: psychProfile.big_five?.neuroticism },
              ].map((trait, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#666' }}>{trait.label}</span>
                    <span style={{ fontWeight: 500 }}>{trait.value}/10</span>
                  </div>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(trait.value || 5) * 10}%`, background: '#C4A06A', borderRadius: 2, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={findMatch} style={{ width: '100%', padding: 16, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
              {t('Find my match', '找到我的匹配')}
            </button>
          </div>
        )}

        {/* ═══ MATCHING (loading) ═══ */}
        {screen === 'matching' && (
          <div style={{ textAlign: 'center', paddingTop: 160 }}>
            <div style={{ width: 48, height: 48, border: '3px solid #eee', borderTopColor: '#C4A06A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
            <p style={{ fontSize: 16, color: '#666' }}>{t('Finding your perfect match...', '正在寻找你的完美匹配...')}</p>
            <p style={{ fontSize: 13, color: '#aaa' }}>{t('AI is analyzing compatibility across 20+ dimensions', 'AI正在分析20+维度的匹配度')}</p>
          </div>
        )}

        {/* ═══ MATCH FOUND ═══ */}
        {screen === 'match' && match && (
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', border: '2px solid #C4A06A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 500, color: '#C4A06A' }}>
              {match.score}%
            </div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 500, margin: '0 0 4px' }}>
              {t(`You matched with ${match.partnerName}`, `你与 ${match.partnerName} 匹配成功`)}
            </h2>
            <p style={{ color: '#888', fontSize: 14, margin: '0 0 24px' }}>
              {t('AI compatibility score', 'AI匹配度评分')}
            </p>

            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #eee', textAlign: 'left', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('Why you match', '为什么你们匹配')}
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333', margin: 0 }}>
                {locale === 'zh' ? match.reason_zh : match.reason_en}
              </p>
            </div>

            <div style={{ background: '#FFF8EE', borderRadius: 16, padding: '16px 24px', border: '1px solid #F0E0C0', textAlign: 'left', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#996622', margin: 0 }}>
                {t('Full profile unlocks after your first date', '完整画像将在第一次约会后解锁')}
              </p>
            </div>

            {/* Date Plans */}
            {datePlans.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px', textAlign: 'left' }}>
                  {t('AI arranged 3 date options', 'AI安排了3个约会方案')}
                </h3>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px', textAlign: 'left' }}>
                  {t('Pick one. Your match is choosing too.', '选择一个，你的匹配对象也在选择。')}
                </p>

                {datePlans.map((plan, i) => (
                  <div
                    key={plan.id || i}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, cursor: 'pointer', textAlign: 'left',
                      border: selectedPlan === plan.id ? '2px solid #1a1a1a' : '1px solid #eee',
                      transition: 'all 0.15s',
                    }}
                  >
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 2px' }}>
                      {plan.proposed_date} · {plan.proposed_time}
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px', color: '#1a1a1a' }}>
                      {plan.venue_name}
                    </p>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                      {plan.venue_address}
                    </p>
                  </div>
                ))}

                <button
                  onClick={() => selectedPlan && selectDatePlan(selectedPlan)}
                  disabled={!selectedPlan}
                  style={{ width: '100%', padding: 16, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer', marginTop: 8, opacity: selectedPlan ? 1 : 0.4 }}
                >
                  {t('Confirm my choice', '确认我的选择')}
                </button>
              </>
            )}
          </div>
        )}

        {/* ═══ DATE CONFIRMED ═══ */}
        {screen === 'confirmed' && confirmedPlan && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 500, margin: '0 0 8px' }}>
              {t('Date confirmed!', '约会已确认！')}
            </h2>

            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #eee', textAlign: 'left', margin: '24px 0' }}>
              <p style={{ fontSize: 17, fontWeight: 500, margin: '0 0 4px' }}>
                {confirmedPlan.proposed_date}, {confirmedPlan.proposed_time}
              </p>
              <p style={{ fontSize: 15, color: '#666', margin: '0 0 16px' }}>
                {confirmedPlan.venue_name}
              </p>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('Secret phrase', '见面暗号')}
                </p>
                <p style={{ fontSize: 18, fontWeight: 500, color: '#C4A06A', margin: 0 }}>
                  "{locale === 'zh' ? confirmedPlan.secret_phrase_zh : confirmedPlan.secret_phrase_en}"
                </p>
              </div>
            </div>

            <button onClick={() => setScreen('checkin')} style={{ width: '100%', padding: 16, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
              {t('Got it! I\'ll be there', '明白了！我会去的')}
            </button>
          </div>
        )}

        {/* ═══ CHECK IN ═══ */}
        {screen === 'checkin' && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 500, margin: '0 0 8px' }}>
              {t('At the date?', '到约会地点了？')}
            </h2>
            <p style={{ color: '#888', fontSize: 14, margin: '0 0 32px' }}>
              {t('Tap to check in when you arrive', '到达后点击签到')}
            </p>
            <button
              onClick={handleCheckin}
              style={{ width: 140, height: 140, borderRadius: '50%', background: '#fff', border: '2px solid #1a1a1a', fontSize: 16, fontWeight: 500, cursor: 'pointer', color: '#1a1a1a', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#1a1a1a'; (e.target as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '#fff'; (e.target as HTMLElement).style.color = '#1a1a1a'; }}
            >
              {t("I'm here", '我到了')}
            </button>
          </div>
        )}

        {/* ═══ CHAT UNLOCKED ═══ */}
        {screen === 'chat' && (
          <div style={{ paddingTop: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF8EE', border: '1px solid #F0E0C0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4A06A" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0"/></svg>
              </div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: 24, fontWeight: 500, margin: '0 0 4px' }}>
                {t('Chat unlocked!', '私聊已解锁！')}
              </h2>
              <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
                {t(`You and ${match?.partnerName} can now chat freely.`, `你和 ${match?.partnerName} 现在可以自由聊天了。`)}
              </p>
            </div>

            {match?.icebreaker_en && (
              <div style={{ background: '#FFF8EE', borderRadius: 14, padding: '16px 20px', border: '1px solid #F0E0C0', marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: '#996622', margin: '0 0 6px', fontWeight: 500 }}>
                  {t('AI conversation starter', 'AI推荐话题')}
                </p>
                <p style={{ fontSize: 14, color: '#664400', margin: 0, lineHeight: 1.6 }}>
                  {locale === 'zh' ? match.icebreaker_zh : match.icebreaker_en}
                </p>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa' }}>
              {t('This is where the real conversation begins.', '真正的对话从这里开始。')}
            </p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: #1a1a1a !important; }
        button { transition: all 0.15s; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
