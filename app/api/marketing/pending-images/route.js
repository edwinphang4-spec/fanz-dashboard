import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

/**
 * Posts in the imagery phase, for the Dashboard image review page.
 *   image_ready  — image generated, awaiting human review
 *   image_retry  — regeneration requested/queued (bot worker will process)
 *   copy_approved — imagery not yet generated (queued if plan is in_production)
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('content_calendar')
    .select('id, topic, pillar, image_url, scene_image_url, image_status, image_source, status, plan_id, suggested_date, review_notes, created_at')
    .in('status', ['image_ready', 'image_retry', 'copy_approved'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch pending image reviews:', error.message);
    return NextResponse.json({ error: 'Failed to fetch pending image reviews.' }, { status: 500 });
  }

  // Attach plan month labels so the UI can group by plan
  const rows = data || [];
  const planIds = [...new Set(rows.map((r) => r.plan_id).filter(Boolean))];
  let planMap = {};
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from('content_plans')
      .select('id, month, status')
      .in('id', planIds);
    for (const p of plans || []) planMap[p.id] = { month: p.month, status: p.status };
  }

  return NextResponse.json(rows.map((r) => ({
    ...r,
    plan: r.plan_id ? planMap[r.plan_id] || null : null,
  })));
}
