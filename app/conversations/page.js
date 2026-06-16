'use client';

import { MessageSquare } from 'lucide-react';

const features = [
  'Real-time conversation log with filter by intent',
  'Search by chat ID, date range, or keywords',
  'Export to CSV for offline analysis',
  'AI sentiment analysis per conversation',
];

export default function ConversationsComingSoon() {
  return (
    <div className="flex flex-col items-center text-center pt-12 pb-20">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: '#e7f3ff' }}
      >
        <MessageSquare size={26} strokeWidth={1.75} style={{ color: '#1877f2' }} />
      </div>
      <h1 className="text-[20px] font-semibold tracking-tight mb-2" style={{ color: '#1c1e21' }}>
        Conversations
      </h1>
      <span
        className="px-2 py-0.5 rounded-full text-[11px] font-semibold mb-4"
        style={{ backgroundColor: '#f2f3f5', color: '#65676b' }}
      >
        Coming Soon
      </span>
      <p className="text-[14px] max-w-md" style={{ color: '#65676b' }}>
        This module will display all AI customer conversations with intent classification
        (enquiry / repair / complaint), search, and export capabilities.
      </p>
      <div
        className="mt-7 p-5 rounded-lg w-full max-w-md text-left"
        style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
      >
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: '#1c1e21' }}>
          Planned Features
        </h3>
        <ul className="space-y-2 text-[13px]" style={{ color: '#65676b' }}>
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: '#1877f2', marginTop: 2 }}>•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
