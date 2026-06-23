import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('content_calendar')
    .select('id, topic, pillar, image_url, status, created_at')
    .in('status', ['image_ready', 'image_retry'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch pending image reviews:', error.message);
    return NextResponse.json({ error: 'Failed to fetch pending image reviews.' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}