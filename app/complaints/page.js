'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const statusStyles = {
  new: { bg: '#fde2e1', color: '#c62828', label: 'New' },
  in_progress: { bg: '#fff4d6', color: '#b26b00', label: 'In Progress' },
  resolved: { bg: '#e3f1d8', color: '#2e7d32', label: 'Resolved' },
};

const categoryStyles = {
  product: { bg: '#e7f3ff', color: '#1877f2' },
  installation: { bg: '#f0e7ff', color: '#7b3ff2' },
  logistics: { bg: '#fff4d6', color: '#b26b00' },
  other: { bg: '#f2f3f5', color: '#65676b' },
};

const nextStatus = {
  new: 'in_progress',
  in_progress: 'resolved',
  resolved: 'new',
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch('/api/complaints');
    setComplaints(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id, currentStatus) => {
    const next = nextStatus[currentStatus] || 'new';
    await fetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    fetchData();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#1c1e21' }}>
          Complaints
        </h1>
        <p className="text-[14px] mt-1.5" style={{ color: '#65676b' }}>
          Track and manage customer feedback and complaints.
        </p>
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
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Category</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Content</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Chat ID</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] uppercase tracking-wide">Date</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center" style={{ color: '#8a8d91' }}>
                    Loading...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center" style={{ color: '#8a8d91' }}>
                    No complaints found.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const s = statusStyles[c.status] || statusStyles.new;
                  const cat = categoryStyles[c.category] || categoryStyles.other;
                  const Icon =
                    c.status === 'new' ? AlertCircle : c.status === 'resolved' ? CheckCircle : AlertTriangle;
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid #ebedf0' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          <Icon size={11} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-1.5 py-0.5 rounded text-[11px] font-medium capitalize"
                          style={{ backgroundColor: cat.bg, color: cat.color }}
                        >
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: '#1c1e21' }}>
                        {c.content}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#65676b' }}>
                        {c.chat_id}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: '#65676b' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateStatus(c.id, c.status)}
                          className="px-2.5 py-1 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors"
                          style={{ backgroundColor: '#f2f3f5', color: '#1c1e21' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e4e6eb')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f2f3f5')}
                        >
                          {c.status === 'resolved' ? 'Reopen' : 'Advance'}
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
