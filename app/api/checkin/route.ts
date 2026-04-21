// app/api/checkin/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { datePlanId, userId } = await req.json();
    const supabase = createServiceClient();

    // Record check-in
    await supabase.from('checkins').insert({
      date_plan_id: datePlanId,
      user_id: userId,
    });

    // Check if both users checked in
    const { data: checkins } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('date_plan_id', datePlanId);

    // Get the match for this date plan
    const { data: plan } = await supabase
      .from('date_plans')
      .select('match_id')
      .eq('id', datePlanId)
      .single();

    if (checkins && checkins.length >= 2 && plan) {
      // Both checked in — unlock chat!
      await supabase
        .from('matches')
        .update({ status: 'chatting' })
        .eq('id', plan.match_id);

      await supabase
        .from('date_plans')
        .update({ status: 'completed' })
        .eq('id', datePlanId);

      return NextResponse.json({ status: 'both_checked_in', chatUnlocked: true });
    }

    return NextResponse.json({ status: 'waiting_for_partner', chatUnlocked: false });
  } catch (error: any) {
    console.error('Checkin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
