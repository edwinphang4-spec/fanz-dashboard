import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: plans, error } = await supabase
    .from('content_plans')
    .select('id, month, status, total_posts, created_at, notes')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch plans:', error.message);
    return NextResponse.json({ error: 'Failed to fetch plans.' }, { status: 500 });
  }

  // For each plan, get status counts from content_calendar
  const planIds = (plans || []).map(p => p.id);
  let statusCounts = {};
  if (planIds.length > 0) {
    const { data: counts, error: countError } = await supabase
      .from('content_calendar')
      .select('plan_id, status')
      .in('plan_id', planIds);

    if (!countError && counts) {
      for (const row of counts) {
        const pid = row.plan_id;
        if (!statusCounts[pid]) statusCounts[pid] = { total: 0, pending: 0, approved: 0, imagery_pending: 0, other: 0 };
        statusCounts[pid].total++;
        if (row.status === 'copy_done') statusCounts[pid].pending++;
        else if (row.status === 'copy_approved') statusCounts[pid].approved++;
        else if (row.status === 'image_ready' || row.status === 'image_retry') statusCounts[pid].imagery_pending++;
        else statusCounts[pid].other++;
      }
    }
  }

  const result = (plans || []).map(plan => ({
    id: plan.id,
    month: plan.month,
    status: plan.status,
    total_posts: plan.total_posts,
    created_at: plan.created_at,
    counts: statusCounts[plan.id] || { total: 0, pending: 0, approved: 0, imagery_pending: 0, other: 0 },
  }));

  return NextResponse.json(result);
}
