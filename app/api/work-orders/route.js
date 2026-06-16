import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  let query = supabase.from('work_orders').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { id, status } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const validStatuses = ['new', 'scheduled', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('work_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
