'use client';

import { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, MessageSquare, Megaphone, ArrowRight } from 'lucide-react';

export default function OverviewPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/overview')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: 'Today New Orders',
      value: stats?.todayOrders ?? '—',
      icon: Wrench,
    },
    {
      label: 'Pending Complaints',
      value: stats?.pendingComplaints ?? '—',
      icon: AlertTriangle,
    },
    {
      label: 'Total Conversations',
      value: stats?.totalConversations ?? '—',
      icon: MessageSquare,
    },
    {
      label: 'Content Published',
      value: stats?.contentPublished ?? '—',
      icon: Megaphone,
      note: 'Coming Soon',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#1c1e21' }}>
          Overview
        </h1>
        <p className="text-[14px] mt-1.5" style={{ color: '#65676b' }}>
          Real-time summary of Fanz AI operations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-5 rounded-lg"
              style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: '#f2f3f5' }}
                >
                  <Icon size={18} strokeWidth={1.75} style={{ color: '#1877f2' }} />
                </div>
                {card.note && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: '#f2f3f5', color: '#65676b' }}
                  >
                    {card.note}
                  </span>
                )}
              </div>
              <div
                className="text-[28px] font-semibold leading-tight"
                style={{ color: '#1c1e21' }}
              >
                {card.value}
              </div>
              <div className="text-[12px] mt-1" style={{ color: '#65676b' }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
        >
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: '#1c1e21' }}>
            Quick Actions
          </h2>
          <p className="text-[13px] mb-5" style={{ color: '#65676b' }}>
            Navigate to active modules.
          </p>
          <div className="space-y-1">
            {[
              { href: '/service-orders', label: 'View Service Orders' },
              { href: '/complaints', label: 'Manage Complaints' },
              { href: '/warranty', label: 'Query Warranty' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between px-3 py-2 -mx-3 rounded-md text-[13px] font-medium transition-colors"
                style={{ color: '#1877f2' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f3f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span>{link.label}</span>
                <ArrowRight size={14} />
              </a>
            ))}
          </div>
        </div>

        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
        >
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: '#1c1e21' }}>
            Warranty Rule
          </h2>
          <p className="text-[13px] mb-5" style={{ color: '#65676b' }}>
            Placeholder rule awaiting boss confirmation.
          </p>
          <dl
            className="rounded-md p-4 text-[13px] space-y-2"
            style={{ backgroundColor: '#f5f6f7', border: '1px solid #dadde1' }}
          >
            <div className="flex justify-between gap-3">
              <dt style={{ color: '#65676b' }}>Motor Warranty</dt>
              <dd className="font-medium text-right" style={{ color: '#1c1e21' }}>
                10 years from purchase
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt style={{ color: '#65676b' }}>Status</dt>
              <dd className="font-medium text-right" style={{ color: '#1c1e21' }}>
                Pending coverage scope
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt style={{ color: '#65676b' }}>Data</dt>
              <dd className="font-medium text-right" style={{ color: '#1c1e21' }}>
                10 demo sales records
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
