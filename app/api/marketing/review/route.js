import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

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

  const { id, action, review_notes } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  // Read current status
  const { data: current, error: readError } = await supabase
    .from('content_calendar')
    .select('status')
    .eq('id', id)
    .single();

  if (readError || !current) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 });
  }

  if (current.status !== 'copy_done') {
    return NextResponse.json({
      error: `Cannot ${action} — row is already "${current.status}"`,
      currentStatus: current.status,
    }, { status: 409 });
  }

  const updateData = action === 'approve'
    ? { status: 'copy_approved' }
    : { status: 'copy_done', ...(review_notes ? { review_notes } : {}) };

  // TOCTOU guard: conditional PATCH with status filter
  const { data: updated, error: updateError } = await supabase
    .from('content_calendar')
    .update(updateData)
    .eq('id', id)
    .eq('status', 'copy_done')
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    // Row was modified by another request between our read and write
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
