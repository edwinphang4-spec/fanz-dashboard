import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

const BUCKET = 'content-images'; // same public bucket the bot's store-image module uses
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * "Upload own image" exit of the image review (M-5).
 * multipart/form-data: { id: rowId, file: image }
 * Uploads to Supabase Storage, then moves the row to approved with
 * image_source='user_uploaded' (mirrors the Telegram upload-own exit).
 */
export async function POST(request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const id = form.get('id');
  const file = form.get('file');

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: `Unsupported file type "${file.type}". Use JPEG, PNG or WebP.` }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB).' }, { status: 400 });
  }

  // Row must be in the imagery phase
  const { data: current, error: readError } = await supabase
    .from('content_calendar')
    .select('id, status')
    .eq('id', id)
    .single();

  if (readError || !current) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 });
  }
  if (!['image_ready', 'image_retry'].includes(current.status)) {
    return NextResponse.json({
      error: `Cannot upload — row is in "${current.status}" state`,
      currentStatus: current.status,
    }, { status: 409 });
  }

  // Upload to storage (random suffix avoids same-ms path collisions)
  const shortId = id.replace(/-/g, '').slice(0, 12);
  const suffix = crypto.randomUUID().slice(0, 8);
  const storagePath = `user-uploads/${shortId}-${Date.now()}-${suffix}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('image-upload storage error:', uploadError.message);
    return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = pub?.publicUrl;
  if (!publicUrl) {
    return NextResponse.json({ error: 'Could not resolve public URL for uploaded image' }, { status: 500 });
  }

  // Approve the row with the uploaded image (TOCTOU guard)
  const { data: updated, error: updateError } = await supabase
    .from('content_calendar')
    .update({
      status: 'approved',
      image_url: publicUrl,
      image_source: 'user_uploaded',
    })
    .eq('id', id)
    .eq('status', current.status)
    .select();

  if (updateError || !updated || updated.length === 0) {
    // Row update lost — remove the now-orphaned storage object (best effort)
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    if (updateError) {
      console.error('image-upload row update failed:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Conflict — row status changed before update completed' }, { status: 409 });
  }

  return NextResponse.json({ success: true, imageUrl: publicUrl, row: updated[0] });
}
