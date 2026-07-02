'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Image as ImageIcon, CalendarDays } from 'lucide-react';

const TABS = [
  { href: '/marketing', label: 'Content Review', icon: FileText },
  { href: '/marketing/images', label: 'Image Review', icon: ImageIcon },
  { href: '/marketing/schedule', label: 'Schedule', icon: CalendarDays },
];

export default function MarketingTabs() {
  const pathname = usePathname();
  return (
    <div
      className="flex items-center gap-1 mb-5 rounded-lg p-1"
      style={{ backgroundColor: '#f0f2f5', border: '1px solid #dadde1', width: 'fit-content' }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
            style={{
              backgroundColor: active ? '#ffffff' : 'transparent',
              color: active ? '#1877f2' : '#65676b',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Icon size={14} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
