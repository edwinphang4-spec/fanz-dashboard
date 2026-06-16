'use client';

import { useState } from 'react';
import { ShieldCheck, Search, AlertCircle, CheckCircle } from 'lucide-react';

export default function WarrantyPage() {
  const [invoice, setInvoice] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    if (!invoice.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/warranty?invoice=${encodeURIComponent(invoice.trim())}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError('Failed to look up invoice.');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#1c1e21' }}>
          Warranty Query
        </h1>
        <p className="text-[14px] mt-1.5" style={{ color: '#65676b' }}>
          Look up warranty status by invoice number.
        </p>
      </div>

      <div
        className="p-6 rounded-lg mb-5"
        style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
      >
        <label
          className="block text-[13px] font-semibold mb-2"
          style={{ color: '#1c1e21' }}
        >
          Invoice Number
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder="e.g. INV-2025-0009"
            className="flex-1 px-3 py-2 rounded-md text-[14px] outline-none transition-shadow"
            style={{
              border: '1px solid #dadde1',
              backgroundColor: '#ffffff',
              color: '#1c1e21',
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = '1px solid #1877f2';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,119,242,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '1px solid #dadde1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={lookup}
            disabled={loading || !invoice.trim()}
            className="px-4 py-2 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1877f2', color: '#ffffff' }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#166fe5';
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#1877f2';
            }}
          >
            <Search size={15} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg p-4 mb-5 flex items-start gap-3"
          style={{ backgroundColor: '#fde2e1', border: '1px solid #f5b1ae' }}
        >
          <AlertCircle size={18} style={{ color: '#c62828', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: '#a01818' }}>
              Error
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: '#a01818' }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {result && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
        >
          {result.found ? (
            <div>
              <div
                className="p-4"
                style={
                  result.warrantyStatus === 'in_warranty'
                    ? { backgroundColor: '#e3f1d8', borderBottom: '1px solid #cbe4b9' }
                    : { backgroundColor: '#fff4d6', borderBottom: '1px solid #f0dca0' }
                }
              >
                <div className="flex items-center gap-2">
                  {result.warrantyStatus === 'in_warranty' ? (
                    <CheckCircle size={18} style={{ color: '#2e7d32' }} />
                  ) : (
                    <AlertCircle size={18} style={{ color: '#b26b00' }} />
                  )}
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: result.warrantyStatus === 'in_warranty' ? '#1f5a23' : '#7a4900' }}
                  >
                    {result.warrantyStatus === 'in_warranty' ? 'In Warranty' : 'Out of Warranty'}
                  </span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
                <div>
                  <div style={{ color: '#65676b' }}>Invoice Number</div>
                  <div className="font-medium mt-0.5" style={{ color: '#1c1e21' }}>
                    {result.invoiceNumber}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#65676b' }}>Customer</div>
                  <div className="font-medium mt-0.5" style={{ color: '#1c1e21' }}>
                    {result.customerName}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#65676b' }}>Model</div>
                  <div className="font-medium mt-0.5" style={{ color: '#1c1e21' }}>
                    {result.model}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#65676b' }}>Purchase Date</div>
                  <div className="font-medium mt-0.5" style={{ color: '#1c1e21' }}>
                    {result.purchaseDate}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#65676b' }}>Warranty Expiry</div>
                  <div className="font-medium mt-0.5" style={{ color: '#1c1e21' }}>
                    {result.warrantyExpiry}
                  </div>
                </div>
              </div>
              {result.warrantyNote && (
                <div className="px-6 pb-5">
                  <p className="text-[11px] italic" style={{ color: '#8a8d91' }}>
                    {result.warrantyNote}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center">
              <ShieldCheck size={36} className="mx-auto mb-3" style={{ color: '#dadde1' }} />
              <p className="text-[14px] font-semibold" style={{ color: '#1c1e21' }}>
                Invoice Not Found
              </p>
              <p className="text-[13px] mt-1" style={{ color: '#65676b' }}>
                {result.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
