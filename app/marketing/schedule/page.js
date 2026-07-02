'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, CalendarDays } from 'lucide-react';
import MarketingTabs from '../tabs';

const PILLAR_EMOJI = {
  product: '🛒', case: '🏠', promo: '🎉', story: '📖', educational: '📚',
};

const STATUS_LABEL = {
  approved: { label: 'Ready', bg: '#e3f1d8', text: '#1b5e20' },
  published: { label: 'Published', bg: '#e8eaf6', text: '#3949ab' },
};

/** scheduled_date is timestamptz; render in MYT (UTC+8). */
function mytParts(ts) {
  const d = new Date(ts);
  const myt = new Date(d.getTime() + 8 * 3600_000);
  return {
    dateStr: myt.toISOString().slice(0, 10),
    day: myt.getUTCDate(),
    month: myt.getUTCMonth(), // 0-based
    year: myt.getUTCFullYear(),
    time: myt.toISOString().slice(11, 16),
  };
}

/** Build a Mon-first month grid: array of weeks, each week = 7 cells (day number or null). */
function buildMonthGrid(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let startCol = first.getUTCDay() - 1; // Mon=0 ... Sun=6
  if (startCol < 0) startCol = 6;
  const cells = [];
  for (let i = 0; i < startCol; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function SchedulePage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/marketing/plans');
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setPlans(list);
        const scheduled = list.find((p) => p.status === 'scheduled');
        setSelectedPlanId((scheduled || list[0])?.id || null);
      } catch {
        setError('Failed to load plans.');
        setLoading(false);
      }
    })();
  }, []);

  const fetchPosts = useCallback(async (planId) => {
    if (!planId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/marketing/plan/${planId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPlanInfo(data.plan || null);
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      }
    } catch {
      setError('Failed to load plan.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(selectedPlanId); }, [selectedPlanId, fetchPosts]);

  const scheduled = useMemo(
    () => posts.filter((p) => p.scheduled_date),
    [posts]
  );

  /** date (YYYY-MM-DD, MYT) -> posts */
  const byDate = useMemo(() => {
    const map = {};
    for (const p of scheduled) {
      const { dateStr } = mytParts(p.scheduled_date);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(p);
    }
    return map;
  }, [scheduled]);

  // One grid per distinct month present — end-of-month plans can overflow
  // into the next calendar month when the scheduler walks past month-end.
  const gridMetas = useMemo(() => {
    const seen = new Map();
    for (const p of scheduled) {
      const { year, month } = mytParts(p.scheduled_date);
      seen.set(`${year}-${month}`, { year, month });
    }
    return [...seen.values()]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map(({ year, month }) => ({ year, month, weeks: buildMonthGrid(year, month) }));
  }, [scheduled]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#1c1e21' }}>
          Publishing Schedule
        </h1>
        <p className="text-[14px] mt-1.5" style={{ color: '#65676b' }}>
          Scheduled publish dates (Malaysia time). The bot reminds you on each publish day.
        </p>
      </div>

      <MarketingTabs />

      {/* Plan selector */}
      <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}>
        <select
          value={selectedPlanId || ''}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-[14px] outline-none"
          style={{ border: '1px solid #dadde1', backgroundColor: '#ffffff', color: '#1c1e21' }}
        >
          {plans.length === 0 && <option value="">No plans available</option>}
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.month} — {p.status}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <Loader2 size={18} className="animate-spin" style={{ color: '#1877f2' }} />
          <span className="text-[14px]" style={{ color: '#65676b' }}>Loading schedule...</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg p-4 flex items-center gap-2" style={{ backgroundColor: '#fde2e1', border: '1px solid #f5c6c5' }}>
          <AlertCircle size={16} style={{ color: '#d32f2f' }} />
          <span className="text-[13px]" style={{ color: '#d32f2f' }}>{error}</span>
        </div>
      )}

      {!loading && !error && scheduled.length === 0 && (
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#f0f2f5' }}>
            <CalendarDays size={22} strokeWidth={1.75} style={{ color: '#65676b' }} />
          </div>
          <p className="text-[14px]" style={{ color: '#65676b' }}>
            No scheduled posts in this plan yet.
          </p>
          <p className="text-[13px] mt-1" style={{ color: '#8a8d91' }}>
            Posts are scheduled automatically once all images pass review.
          </p>
        </div>
      )}

      {!loading && !error && gridMetas.map((gridMeta) => (
        <div key={`${gridMeta.year}-${gridMeta.month}`} className="rounded-lg p-4 mb-5" style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}>
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1c1e21' }}>
            {new Date(Date.UTC(gridMeta.year, gridMeta.month, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </h2>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold py-1" style={{ color: '#8a8d91' }}>{d}</div>
            ))}
          </div>
          {gridMeta.weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, di) => {
                const dateStr = day
                  ? `${gridMeta.year}-${String(gridMeta.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  : null;
                const dayPosts = dateStr ? byDate[dateStr] || [] : [];
                return (
                  <div
                    key={di}
                    className="rounded-md p-1.5"
                    style={{
                      minHeight: 64,
                      backgroundColor: day ? (dayPosts.length ? '#e7f3ff' : '#fafbfc') : 'transparent',
                      border: day ? '1px solid #e4e6eb' : 'none',
                    }}
                  >
                    {day && (
                      <>
                        <div className="text-[11px] font-semibold" style={{ color: dayPosts.length ? '#1877f2' : '#8a8d91' }}>{day}</div>
                        {dayPosts.map((p) => (
                          <div key={p.id} className="text-[10.5px] leading-tight mt-0.5 truncate" style={{ color: '#1c1e21' }} title={p.topic}>
                            {PILLAR_EMOJI[p.pillar] || '📝'} {p.topic}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      {/* Chronological list */}
      {!loading && !error && scheduled.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}>
          {scheduled
            .slice()
            .sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''))
            .map((p) => {
              const { dateStr, time } = mytParts(p.scheduled_date);
              const st = STATUS_LABEL[p.status] || { label: p.status, bg: '#f0f2f5', text: '#65676b' };
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <span className="text-[12.5px] font-semibold w-24 flex-shrink-0" style={{ color: '#1c1e21' }}>{dateStr}</span>
                  <span className="text-[12px] w-14 flex-shrink-0" style={{ color: '#8a8d91' }}>{time} MYT</span>
                  <span className="text-[13px] flex-1 truncate" style={{ color: '#1c1e21' }}>
                    {PILLAR_EMOJI[p.pillar] || '📝'} {p.topic}
                  </span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0" style={{ backgroundColor: st.bg, color: st.text }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
