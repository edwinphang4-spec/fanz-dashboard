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

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  // Read current row
  const { data: current, error: readError } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('id', id)
    .single();

  if (readError || !current) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 });
  }

  // Status check
  if (current.status !== 'approved') {
    return NextResponse.json({
      error: `Cannot publish — row is "${current.status}"`,
      currentStatus: current.status,
    }, { status: 409 });
  }

  // Idempotency check — the table has fb_post_id + ig_post_id
  // (there is NO single post_id column; verified against the live schema)
  if (current.fb_post_id || current.ig_post_id) {
    const refs = [];
    if (current.fb_post_id) refs.push(`FB: ${current.fb_post_id}`);
    if (current.ig_post_id) refs.push(`IG: ${current.ig_post_id}`);
    return NextResponse.json({
      error: `Already published: ${refs.join(', ')}`,
      fb_post_id: current.fb_post_id,
      ig_post_id: current.ig_post_id,
    }, { status: 409 });
  }

  const DRY_RUN = process.env.DRYRUN !== 'false'; // default true (safe)

  let publishResult;
  if (DRY_RUN) {
    const ts = Date.now();
    publishResult = {
      fb_post_id: `DRYRUN-FB-${ts}`,
      ig_post_id: `DRYRUN-IG-${ts}`,
      dry_run: true,
    };
  } else {
    return NextResponse.json({
      error: 'Real Meta API publish not configured. Set DRYRUN=true or configure Meta credentials.',
    }, { status: 501 });
  }

  // Update DB with TOCTOU guard
  const { data: updated, error: updateError } = await supabase
    .from('content_calendar')
    .update({
      fb_post_id: publishResult.fb_post_id,
      ig_post_id: publishResult.ig_post_id,
      status: 'published',
    })
    .eq('id', id)
    .eq('status', 'approved')
    .select();

  if (updateError) {
    console.error('publish update failed:', updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({
      error: 'Conflict — row status changed before publish completed',
    }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    fb_post_id: publishResult.fb_post_id,
    ig_post_id: publishResult.ig_post_id,
    dry_run: publishResult.dry_run,
    row: updated[0],
  });
}
