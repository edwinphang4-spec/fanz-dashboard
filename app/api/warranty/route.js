import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const invoice = searchParams.get('invoice');

  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sales_records')
    .select('*')
    .ilike('invoice_number', invoice.trim())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ found: false, message: 'Invoice not found in our records.' });
  }

  // Calculate warranty status (placeholder rule: 10 years from purchase date)
  const purchased = new Date(data.purchase_date);
  const expires = new Date(purchased);
  expires.setFullYear(expires.getFullYear() + 10);
  const now = new Date();
  const warrantyStatus = now < expires ? 'in_warranty' : 'out_of_warranty';

  return NextResponse.json({
    found: true,
    invoiceNumber: data.invoice_number,
    model: data.model,
    customerName: data.customer_name,
    purchaseDate: data.purchase_date,
    warrantyStatus,
    warrantyExpiry: expires.toISOString().slice(0, 10),
    // Warranty rule: placeholder — 10 years from purchase date (to be confirmed by boss)
    warrantyNote: 'Warranty terms are placeholder. 10 years from purchase date. Final rules pending management confirmation.',
  });
}
