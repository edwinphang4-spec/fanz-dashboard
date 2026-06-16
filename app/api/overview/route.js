import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const [workOrders, complaints, complaintsPending, conversations] = await Promise.all([
    supabase.from('work_orders').select('id', { count: 'estimated', head: true }),
    supabase.from('complaints').select('id', { count: 'estimated', head: true }),
    supabase.from('complaints').select('id', { count: 'estimated', head: true }).eq('status', 'new'),
    supabase.from('conversations').select('id', { count: 'estimated', head: true }),
  ]);

  // Today's work orders (filter server-side since head=true can't filter count well)
  const { count: todayOrders } = await supabase
    .from('work_orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today);

  return NextResponse.json({
    todayOrders: todayOrders || 0,
    totalOrders: workOrders.count || 0,
    totalComplaints: complaints.count || 0,
    pendingComplaints: complaintsPending.count || 0,
    totalConversations: conversations.count || 0,
    contentPublished: 0, // Coming Soon — placeholder
  });
}