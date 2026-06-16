'use client';

import { Settings } from 'lucide-react';

const modules = [
  { title: 'Warranty Rules', desc: 'Configure warranty duration, coverage scope, and exclusions' },
  { title: 'WhatsApp Integration', desc: 'Connect WhatsApp Business API for dual-channel support' },
  { title: 'Team Members', desc: 'Manage dashboard access and permissions' },
  { title: 'Bot Responses', desc: 'Customize AI system prompts and fallback messages' },
];

export default function SettingsComingSoon() {
  return (
    <div className="flex flex-col items-center text-center pt-12 pb-20">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: '#e7f3ff' }}
      >
        <Settings size={26} strokeWidth={1.75} style={{ color: '#1877f2' }} />
      </div>
      <h1 className="text-[20px] font-semibold tracking-tight mb-2" style={{ color: '#1c1e21' }}>
        Settings
      </h1>
      <span
        className="px-2 py-0.5 rounded-full text-[11px] font-semibold mb-4"
        style={{ backgroundColor: '#f2f3f5', color: '#65676b' }}
      >
        Coming Soon
      </span>
      <p className="text-[14px] max-w-md" style={{ color: '#65676b' }}>
        System configuration for Fanz AI operations. Warranty rules, WhatsApp integration,
        and team member management will be available here.
      </p>
      <div
        className="mt-7 p-5 rounded-lg w-full max-w-md text-left"
        style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
      >
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: '#1c1e21' }}>
          Planned Modules
        </h3>
        <ul className="space-y-3 text-[13px]">
          {modules.map((m, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: '#1877f2', marginTop: 2 }}>•</span>
              <span>
                <span className="font-semibold" style={{ color: '#1c1e21' }}>
                  {m.title}
                </span>
                <span style={{ color: '#65676b' }}> — {m.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
