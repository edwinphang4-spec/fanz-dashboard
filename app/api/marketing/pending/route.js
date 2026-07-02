import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const { data, error } = await supabase
    .from('content_calendar')
    .select('id, topic, pillar, fb_content, ig_content, hashtags, status, created_at, review_notes')
    .eq('status', 'copy_done')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch pending reviews:', error.message);
    return NextResponse.json({ error: 'Failed to fetch pending reviews.' }, { status: 500 });
  }
  return NextResponse.json(data || []);
}
