import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

/**
 * Start batch image generation for a plan (M-4 -> M-5 handoff).
 *
 * Preconditions: every post reviewed (no copy_done left) and at least one
 * copy_approved post. Sets content_plans.status='in_production'; the bot's
 * background worker polls for that status and generates imagery for every
 * copy_approved row, then notifies the plan's Telegram chat.
 */
export async function POST(request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { planId } = body;
  if (!planId) {
    return NextResponse.json({ error: 'planId is required' }, { status: 400 });
  }

  const { data: plan, error: planError } = await supabase
    .from('content_plans')
    .select('id, month, status')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  if (plan.status === 'in_production') {
    return NextResponse.json({ success: true, alreadyRunning: true, planStatus: 'in_production' });
  }
  if (plan.status !== 'plan_approved') {
    return NextResponse.json({
      error: `Cannot start imagery — plan is "${plan.status}" (expected "plan_approved")`,
      planStatus: plan.status,
    }, { status: 409 });
  }

  const { data: rows, error: rowsError } = await supabase
    .from('content_calendar')
    .select('id, status')
    .eq('plan_id', planId);

  if (rowsError) {
    return NextResponse.json({ error: rowsError.message }, { status: 500 });
  }

  const active = (rows || []).filter((r) => r.status !== 'rejected');
  const pendingReview = active.filter((r) => r.status === 'copy_done').length;
  const readyForImagery = active.filter((r) => r.status === 'copy_approved').length;

  if (pendingReview > 0) {
    return NextResponse.json({
      error: `${pendingReview} post(s) still pending copy review. Review all copy before starting imagery.`,
    }, { status: 409 });
  }
  if (readyForImagery === 0) {
    return NextResponse.json({
      error: 'No approved posts ready for imagery.',
    }, { status: 409 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('content_plans')
    .update({ status: 'in_production' })
    .eq('id', planId)
    .eq('status', 'plan_approved') // TOCTOU guard
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'Conflict — plan status changed before update' }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    queued: readyForImagery,
    message: `Image generation queued for ${readyForImagery} post(s). The bot will notify Telegram when images are ready.`,
  });
}
