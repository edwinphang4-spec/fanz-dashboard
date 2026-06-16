'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusStyles = {
  new: { bg: '#e7f3ff', color: '#1877f2', label: 'New' },
  scheduled: { bg: '#f0e7ff', color: '#7b3ff2', label: 'Scheduled' },
  in_progress: { bg: '#fff4d6', color: '#b26b00', label: 'In Progress' },
  completed: { bg: '#e3f1d8', color: '#2e7d32', label: 'Completed' },
};

const statusIcons = {
  new: AlertCircle,
  scheduled: Clock,
  in_progress: Clock,
  completed: CheckCircle,
};

const nextStatus = {
  new: 'scheduled',
  scheduled: 'in_progress',
  in_progress: 'completed',
  completed: 'new',
};

const warrantyPill = (s) => {
  if (s === 'in_warranty') return { bg: '#e3f1d8', color: '#2e7d32', label: 'In Warranty' };
  if (s === 'out_of_warranty') return { bg: '#fde2e1', color: '#c62828', label: 'Expired' };
  return { bg: '#f2f3f5', color: '#65676b', label: 'Unknown' };
};

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchOrders = async () => {
    const url = filter ? `/api/work-orders?status=${filter}` : '/api/work-orders';
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const updateStatus = async (id, currentStatus) => {
    const next = nextStatus[currentStatus] || 'new';
    await fetch('/api/work-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    fetchOrders();
  };

  const filterOptions = [
    { value: '', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#1c1e21' }}>
          Service Orders
        </h1>
        <p className="text-[14px] mt-1.5" style={{ color: '#65676b' }}>
          Manage repair and maintenance work orders.
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {filterOptions.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: '#1877f2', color: '#ffffff', border: '1px solid #1877f2' }
                  : { backgroundColor: '#ffffff', color: '#1c1e21', border: '1px solid #dadde1' }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr
                className="text-left"
                style={{ backgroundColor: '#f5f6f7', borderBottom: '1px solid #dadde1', color: '#65676b' }}
              >
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Model</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Issue</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Invoice</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Warranty</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Address</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Preferred</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Date</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center" style={{ color: '#8a8d91' }}>
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center" style={{ color: '#8a8d91' }}>
                    No work orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const StatusIcon = statusIcons[o.status] || AlertCircle;
                  const s = statusStyles[o.status] || statusStyles.new;
                  const w = warrantyPill(o.warranty_status);
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: '1px solid #ebedf0' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          <StatusIcon size={11} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#1c1e21' }}>
                        {o.model || '-'}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: '#1c1e21' }}>
                        {o.issue || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#1c1e21' }}>
                        {o.invoice_number || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                          style={{ backgroundColor: w.bg, color: w.color }}
                        >
                          {w.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate" style={{ color: '#1c1e21' }}>
                        {o.address || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#1c1e21' }}>
                        {o.preferred_time || '-'}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#65676b' }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateStatus(o.id, o.status)}
                          className="px-2.5 py-1 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors"
                          style={{ backgroundColor: '#f2f3f5', color: '#1c1e21' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e4e6eb')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f2f3f5')}
                        >
                          {o.status === 'completed' ? 'Reset' : 'Advance'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
