import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

/**
 * Image review endpoint — dual-entry with Telegram for imagery approval.
 *
 * Actions:
 *   'approve' → status: approved (all gates passed, ready to publish)
 *   'reject'  → status: image_retry (regenerate imagery)
 *   'skip'    → status: approved (skip imagery, publish copy-only)
 *   'retry'   → status: image_ready (regenerate — re-runs pipeline from image_retry)
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

  const { id, action } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  if (!['approve', 'reject', 'skip', 'retry'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approve", "reject", "skip", or "retry"' }, { status: 400 });
  }

  // Read current status
  const { data: current, error: readError } = await supabase
    .from('content_calendar')
    .select('id, status, image_url')
    .eq('id', id)
    .single();

  if (readError || !current) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 });
  }

  // For retry, accept image_retry state; for others require image_ready
  const allowedState = action === 'retry' ? 'image_retry' : 'image_ready';
  if (current.status !== allowedState) {
    return NextResponse.json({
      error: `Cannot ${action} — row is in "${current.status}" state (expected "${allowedState}")`,
      currentStatus: current.status,
    }, { status: 409 });
  }

  /**
   * Map action to target status:
   *   approve → approved (all gates passed)
   *   reject  → image_retry (trigger regeneration)
   *   skip    → approved (copy-only publish)
   *   retry   → image_ready (re-run imagery pipeline)
   */
  let targetStatus;
  switch (action) {
    case 'approve':
      targetStatus = 'approved';
      break;
    case 'reject':
      targetStatus = 'image_retry';
      break;
    case 'skip':
      targetStatus = 'approved';
      break;
    case 'retry':
      targetStatus = 'image_ready';
      break;
  }

  // TOCTOU guard: conditional PATCH with status filter
  const { data: updated, error: updateError } = await supabase
    .from('content_calendar')
    .update({ status: targetStatus })
    .eq('id', id)
    .eq('status', allowedState)
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    // Row was modified by another request between read and write
    const { data: actual } = await supabase
      .from('content_calendar')
      .select('status')
      .eq('id', id)
      .single();

    return NextResponse.json({
      error: 'Conflict — row status changed before update completed',
      currentStatus: actual?.status || 'unknown',
    }, { status: 409 });
  }

  return NextResponse.json({ success: true, row: updated[0] });
}