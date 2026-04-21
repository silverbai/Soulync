// components/SimulationResults.tsx
// Renders the "Black Mirror" simulation breakdown — scenario scores,
// AI-generated conversation snippets, red/green flags

'use client';

import { useState } from 'react';

interface ScenarioResult {
  name_en: string;
  name_zh: string;
  score: number;
}

interface SimulationData {
  score: number;
  simulationScore: number;
  scenarioResults: ScenarioResult[];
  redFlags: string[];
  greenFlags: string[];
  summary_en: string;
  summary_zh: string;
  sampleConversation: { speaker: string; text: string }[];
  partnerName: string;
}

export default function SimulationResults({
  data,
  locale,
  onContinue,
}: {
  data: SimulationData;
  locale: 'en' | 'zh';
  onContinue: () => void;
}) {
  const [showConvo, setShowConvo] = useState(false);
  const t = (en: string, zh: string) => (locale === 'zh' ? zh : en);

  const scenarioIcons: Record<string, string> = {
    'First date': '☕',
    'Opinion clash': '⚡',
    'Emotional vulnerability': '💧',
    'External pressure': '🌊',
    'Future planning': '🔮',
    '第一次约会': '☕',
    '意见分歧': '⚡',
    '情感脆弱时刻': '💧',
    '外部压力': '🌊',
    '未来规划': '🔮',
  };

  function getScoreColor(score: number): string {
    if (score >= 75) return '#2E7D32';
    if (score >= 55) return '#C4A06A';
    return '#B71C1C';
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Overall Score ── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', margin: '0 auto 16px',
          background: '#fff', border: `3px solid ${getScoreColor(data.score)}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 32, fontWeight: 500, color: getScoreColor(data.score), lineHeight: 1 }}>
            {data.score}%
          </span>
          <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {t('match', '匹配度')}
          </span>
        </div>

        <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, fontWeight: 500, margin: '0 0 4px' }}>
          {t(`You matched with ${data.partnerName}`, `你与 ${data.partnerName} 匹配成功`)}
        </h2>

        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
          {t(
            `AI simulated ${data.scenarioResults.length} relationship scenarios`,
            `AI模拟了${data.scenarioResults.length}个关系场景`
          )}
        </p>
      </div>

      {/* ── Summary ── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 24px',
        border: '1px solid #eee', marginBottom: 16,
      }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333', margin: 0 }}>
          {locale === 'zh' ? data.summary_zh : data.summary_en}
        </p>
      </div>

      {/* ── Scenario Breakdown ── */}
      <p style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '24px 0 12px' }}>
        {t('Scenario breakdown', '场景分析')}
      </p>

      {data.scenarioResults.map((s, i) => {
        const name = locale === 'zh' ? s.name_zh : s.name_en;
        const icon = scenarioIcons[name] || '🔹';
        return (
          <div key={i} style={{
            background: '#fff', borderRadius: 12, padding: '14px 18px',
            border: '1px solid #eee', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: '#1a1a1a' }}>{name}</p>
              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginTop: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 2, transition: 'width 0.8s ease',
                  width: `${s.score}%`,
                  background: getScoreColor(s.score),
                }} />
              </div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: getScoreColor(s.score), minWidth: 40, textAlign: 'right' }}>
              {s.score}%
            </span>
          </div>
        );
      })}

      {/* ── Green / Red Flags ── */}
      {data.greenFlags.length > 0 && (
        <div style={{
          background: '#F0F8F0', borderRadius: 12, padding: '14px 18px',
          border: '1px solid #D4E8D4', marginTop: 16, marginBottom: 8,
        }}>
          <p style={{ fontSize: 12, color: '#2E7D32', margin: '0 0 8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('Strengths', '优势')}
          </p>
          {data.greenFlags.map((f, i) => (
            <p key={i} style={{ fontSize: 14, color: '#1B5E20', margin: '0 0 4px', lineHeight: 1.5 }}>
              + {f}
            </p>
          ))}
        </div>
      )}

      {data.redFlags.length > 0 && (
        <div style={{
          background: '#FFF5F5', borderRadius: 12, padding: '14px 18px',
          border: '1px solid #F0D0D0', marginBottom: 8,
        }}>
          <p style={{ fontSize: 12, color: '#B71C1C', margin: '0 0 8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('Watch out for', '需要注意')}
          </p>
          {data.redFlags.map((f, i) => (
            <p key={i} style={{ fontSize: 14, color: '#791F1F', margin: '0 0 4px', lineHeight: 1.5 }}>
              ⚠ {f}
            </p>
          ))}
        </div>
      )}

      {/* ── Sample AI Conversation ── */}
      {data.sampleConversation.length > 0 && (
        <>
          <button
            onClick={() => setShowConvo(!showConvo)}
            style={{
              width: '100%', padding: '14px', background: 'transparent',
              border: '1px solid #ddd', borderRadius: 12, fontSize: 14,
              color: '#666', cursor: 'pointer', marginTop: 16, marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {showConvo
              ? t('Hide simulated conversation', '收起模拟对话')
              : t('👀 Peek at how your AI selves talked', '👀 看看你们的AI分身如何对话')}
          </button>

          {showConvo && (
            <div style={{
              background: '#FAFAF7', borderRadius: 12, padding: '16px',
              border: '1px solid #eee',
            }}>
              <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 12px', textAlign: 'center' }}>
                {t('AI simulation of your first date', 'AI模拟的第一次约会')}
              </p>
              {data.sampleConversation.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.speaker === 'A' ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
                    background: msg.speaker === 'A' ? '#1a1a1a' : '#fff',
                    color: msg.speaker === 'A' ? '#fff' : '#333',
                    border: msg.speaker === 'B' ? '1px solid #eee' : 'none',
                    fontSize: 14, lineHeight: 1.5,
                    borderBottomRightRadius: msg.speaker === 'A' ? 4 : 14,
                    borderBottomLeftRadius: msg.speaker === 'B' ? 4 : 14,
                  }}>
                    <span style={{ fontSize: 11, color: msg.speaker === 'A' ? '#C4A06A' : '#888', display: 'block', marginBottom: 2 }}>
                      {msg.speaker === 'A' ? t('You', '你') : data.partnerName}
                    </span>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Unlock message ── */}
      <div style={{
        background: '#FFF8EE', borderRadius: 14, padding: '16px 20px',
        border: '1px solid #F0E0C0', marginTop: 20, marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, color: '#996622', margin: 0, lineHeight: 1.6 }}>
          {t(
            `Full psychological profile and private chat unlock after your first in-person date with ${data.partnerName}.`,
            `完整心理画像和私聊功能将在你与 ${data.partnerName} 第一次线下见面后解锁。`
          )}
        </p>
      </div>

      {/* ── CTA ── */}
      <button
        onClick={onContinue}
        style={{
          width: '100%', padding: 16, background: '#1a1a1a', color: '#fff',
          border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer',
        }}
      >
        {t('View AI date plans', '查看AI约会方案')}
      </button>
    </div>
  );
}
