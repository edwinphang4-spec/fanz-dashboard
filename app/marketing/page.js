'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronRight, Loader2, Rocket } from 'lucide-react';

const PILLAR_EMOJI = { product: '🛒', case: '🏠', promo: '🎉', story: '📖' };

function PillarBadge({ pillar }) {
  const emoji = PILLAR_EMOJI[pillar] || '📝';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        backgroundColor: pillar === 'promo' ? '#fff4d6' : pillar === 'case' ? '#e7f3ff' : pillar === 'story' ? '#f0e7ff' : '#e3f1d8',
        color: pillar === 'promo' ? '#b26b00' : pillar === 'case' ? '#1877f2' : pillar === 'story' ? '#7b3ff2' : '#2e7d32',
      }}
    >
      {emoji} {pillar}
    </span>
  );
}

export default function MarketingPendingPage() {
  // Pending review state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [expandedFb, setExpandedFb] = useState({});
  const [expandedIg, setExpandedIg] = useState({});
  const [rejecting, setRejecting] = useState({});
  const [rejectNotes, setRejectNotes] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});

  // Approved / publish state
  const [approvedItems, setApprovedItems] = useState([]);
  const [approvedLoading, setApprovedLoading] = useState(true);
  const [approvedError, setApprovedError] = useState('');
  const [expandedFbApproved, setExpandedFbApproved] = useState({});
  const [expandedIgApproved, setExpandedIgApproved] = useState({});
  const [publishingId, setPublishingId] = useState(null);
  const [publishError, setPublishError] = useState({});
  const [publishSuccess, setPublishSuccess] = useState({});

  useEffect(() => {
    fetchItems();
    fetchApprovedItems();
  }, []);

  // --- Pending Review ---

  const fetchItems = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/marketing/pending');
      const data = await res.json();
      if (data.error) {
        setFetchError(data.error);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      setFetchError('Failed to load pending reviews.');
    }
    setLoading(false);
  };

  const handleApprove = useCallback(async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch('/api/marketing/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          const statusLabel = data.currentStatus === 'approved' ? 'approved' : 'rejected';
          setActionError((prev) => ({
            ...prev,
            [id]: `This post was already ${statusLabel} by another user.`,
          }));
        } else {
          setActionError((prev) => ({ ...prev, [id]: data.error || 'An error occurred.' }));
        }
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id));
        // Refresh approved items since a new one might be available
        fetchApprovedItems();
      }
    } catch {
      setActionError((prev) => ({ ...prev, [id]: 'Failed to connect to server.' }));
    }
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  }, []);

  const handleReject = useCallback(async (id) => {
    const notes = rejectNotes[id] || '';
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    setActionError((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch('/api/marketing/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', review_notes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          const statusLabel = data.currentStatus === 'approved' ? 'approved' : 'rejected';
          setActionError((prev) => ({
            ...prev,
            [id]: `This post was already ${statusLabel} by another user.`,
          }));
        } else {
          setActionError((prev) => ({ ...prev, [id]: data.error || 'An error occurred.' }));
        }
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setRejecting((prev) => ({ ...prev, [id]: false }));
        setRejectNotes((prev) => ({ ...prev, [id]: '' }));
      }
    } catch {
      setActionError((prev) => ({ ...prev, [id]: 'Failed to connect to server.' }));
    }
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  }, [rejectNotes]);

  // --- Approved / Publish ---

  const fetchApprovedItems = async () => {
    setApprovedLoading(true);
    setApprovedError('');
    try {
      const res = await fetch('/api/marketing/approved');
      const data = await res.json();
      if (data.error) {
        setApprovedError(data.error);
      } else {
        setApprovedItems(Array.isArray(data) ? data : []);
      }
    } catch {
      setApprovedError('Failed to load approved items.');
    }
    setApprovedLoading(false);
  };

  const handlePublish = useCallback(async (id) => {
    setPublishingId(id);
    setPublishError((prev) => ({ ...prev, [id]: '' }));
    setPublishSuccess((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch('/api/marketing/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          if (data.post_id) {
            setPublishSuccess((prev) => ({
              ...prev,
              [id]: `Already published: ${data.post_id}`,
            }));
          } else {
            setPublishError((prev) => ({
              ...prev,
              [id]: data.error || 'Conflict — item was already modified.',
            }));
          }
        } else {
          setPublishError((prev) => ({ ...prev, [id]: data.error || 'An error occurred.' }));
        }
      } else {
        setPublishSuccess((prev) => ({
          ...prev,
          [id]: data.dry_run
            ? `Published (dry-run: ${data.post_id})`
            : `Published: ${data.post_id}`,
        }));
        // Remove from approved list
        setApprovedItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      setPublishError((prev) => ({ ...prev, [id]: 'Failed to connect to server.' }));
    }
    setPublishingId(null);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#1c1e21' }}>
          Marketing Content
        </h1>
        <p className="text-[14px] mt-1.5" style={{ color: '#65676b' }}>
          Review, approve, and publish social media content
        </p>
      </div>

      {/* ======================== */}
      {/* SECTION 1: Pending Review */}
      {/* ======================== */}
      <div className="mb-8">
        <h2 className="text-[18px] font-semibold mb-3" style={{ color: '#1c1e21' }}>
          Pending Review
        </h2>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: '#1877f2' }} />
          </div>
        )}

        {/* Fetch error */}
        {!loading && fetchError && (
          <div
            className="rounded-lg p-4 mb-5 flex items-start gap-3"
            style={{ backgroundColor: '#fde2e1', border: '1px solid #f5b1ae' }}
          >
            <XCircle size={18} style={{ color: '#c62828', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: '#a01818' }}>Error</p>
              <p className="text-[13px] mt-0.5" style={{ color: '#a01818' }}>{fetchError}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-12">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: '#e7f3ff' }}
            >
              <Megaphone size={22} strokeWidth={1.75} style={{ color: '#1877f2' }} />
            </div>
            <p className="text-[14px]" style={{ color: '#65676b' }}>
              No pending reviews
            </p>
          </div>
        )}

        {/* Pending review cards */}
        {!loading && items.length > 0 && (
          <div>
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-4 mb-3"
                style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
              >
                {/* Header: Topic + Pillar + Date */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-bold" style={{ color: '#1c1e21' }}>
                      {item.topic}
                    </h3>
                    <PillarBadge pillar={item.pillar} />
                  </div>
                  <span className="text-[12px] whitespace-nowrap ml-2" style={{ color: '#65676b' }}>
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {/* FB Content expandable */}
                {item.fb_content && (
                  <div className="mb-2">
                    <button
                      onClick={() =>
                        setExpandedFb((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="flex items-center gap-1.5 text-[13px] font-semibold w-full text-left"
                      style={{ color: '#65676b' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1c1e21'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#65676b'; }}
                    >
                      {expandedFb[item.id] ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      Facebook Content
                    </button>
                    {expandedFb[item.id] && (
                      <div
                        className="mt-1.5 p-3 rounded-md text-[13px] whitespace-pre-wrap"
                        style={{ backgroundColor: '#f7f8fa', color: '#1c1e21' }}
                      >
                        {item.fb_content}
                      </div>
                    )}
                  </div>
                )}

                {/* IG Content expandable */}
                {item.ig_content && (
                  <div className="mb-2">
                    <button
                      onClick={() =>
                        setExpandedIg((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="flex items-center gap-1.5 text-[13px] font-semibold w-full text-left"
                      style={{ color: '#65676b' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1c1e21'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#65676b'; }}
                    >
                      {expandedIg[item.id] ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      Instagram Content
                    </button>
                    {expandedIg[item.id] && (
                      <div
                        className="mt-1.5 p-3 rounded-md text-[13px] whitespace-pre-wrap"
                        style={{ backgroundColor: '#f7f8fa', color: '#1c1e21' }}
                      >
                        {item.ig_content}
                      </div>
                    )}
                  </div>
                )}

                {/* Hashtags */}
                {item.hashtags && (
                  <div className="mb-3">
                    <span className="text-[12px]" style={{ color: '#1877f2' }}>
                      {item.hashtags}
                    </span>
                  </div>
                )}

                {/* Action error */}
                {actionError[item.id] && (
                  <div
                    className="rounded-md p-3 mb-3 flex items-start gap-2"
                    style={{ backgroundColor: '#fde2e1', border: '1px solid #f5b1ae' }}
                  >
                    <XCircle size={15} style={{ color: '#c62828', flexShrink: 0, marginTop: 1 }} />
                    <p className="text-[12px]" style={{ color: '#a01818' }}>
                      {actionError[item.id]}
                    </p>
                  </div>
                )}

                {/* Reject textarea */}
                {rejecting[item.id] && (
                  <div className="mb-3">
                    <textarea
                      value={rejectNotes[item.id] || ''}
                      onChange={(e) =>
                        setRejectNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Describe what needs to change..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-md text-[13px] outline-none transition-shadow resize-none"
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
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={actionLoading[item.id]}
                    className="px-4 py-1.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2e7d32', color: '#ffffff' }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#1f5a23';
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#2e7d32';
                    }}
                  >
                    {actionLoading[item.id] ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Approve
                  </button>

                  {!rejecting[item.id] ? (
                    <button
                      onClick={() =>
                        setRejecting((prev) => ({ ...prev, [item.id]: true }))
                      }
                      disabled={actionLoading[item.id]}
                      className="px-4 py-1.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#b26b00', color: '#ffffff' }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#8a5100';
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#b26b00';
                      }}
                    >
                      <MessageSquare size={14} />
                      Request Changes
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={actionLoading[item.id]}
                        className="px-4 py-1.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#c62828', color: '#ffffff' }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#a01818';
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#c62828';
                        }}
                      >
                        {actionLoading[item.id] ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setRejecting((prev) => ({ ...prev, [item.id]: false }));
                          setRejectNotes((prev) => ({ ...prev, [item.id]: '' }));
                        }}
                        disabled={actionLoading[item.id]}
                        className="px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#f2f3f5', color: '#1c1e21' }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#e0e1e4';
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#f2f3f5';
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* SECTION 2: Approved / Publish  */}
      {/* ============================== */}
      <div>
        <h2 className="text-[18px] font-semibold mb-3" style={{ color: '#1c1e21' }}>
          Approved · Ready to Publish
        </h2>

        {/* Loading state */}
        {approvedLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin" style={{ color: '#1877f2' }} />
          </div>
        )}

        {/* Fetch error */}
        {!approvedLoading && approvedError && (
          <div
            className="rounded-lg p-4 mb-5 flex items-start gap-3"
            style={{ backgroundColor: '#fde2e1', border: '1px solid #f5b1ae' }}
          >
            <XCircle size={18} style={{ color: '#c62828', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: '#a01818' }}>Error</p>
              <p className="text-[13px] mt-0.5" style={{ color: '#a01818' }}>{approvedError}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!approvedLoading && !approvedError && approvedItems.length === 0 && (
          <div className="flex flex-col items-center text-center py-12">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: '#edf7ed' }}
            >
              <CheckCircle size={22} strokeWidth={1.75} style={{ color: '#2e7d32' }} />
            </div>
            <p className="text-[14px]" style={{ color: '#65676b' }}>
              No items ready to publish
            </p>
          </div>
        )}

        {/* Approved cards */}
        {!approvedLoading && approvedItems.length > 0 && (
          <div>
            {approvedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-4 mb-3"
                style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
              >
                {/* Header: Topic + Pillar + Date */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-bold" style={{ color: '#1c1e21' }}>
                      {item.topic}
                    </h3>
                    <PillarBadge pillar={item.pillar} />
                  </div>
                  <span className="text-[12px] whitespace-nowrap ml-2" style={{ color: '#65676b' }}>
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {/* FB Content expandable */}
                {item.fb_content && (
                  <div className="mb-2">
                    <button
                      onClick={() =>
                        setExpandedFbApproved((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="flex items-center gap-1.5 text-[13px] font-semibold w-full text-left"
                      style={{ color: '#65676b' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1c1e21'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#65676b'; }}
                    >
                      {expandedFbApproved[item.id] ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      Facebook Content
                    </button>
                    {expandedFbApproved[item.id] && (
                      <div
                        className="mt-1.5 p-3 rounded-md text-[13px] whitespace-pre-wrap"
                        style={{ backgroundColor: '#f7f8fa', color: '#1c1e21' }}
                      >
                        {item.fb_content}
                      </div>
                    )}
                  </div>
                )}

                {/* IG Content expandable */}
                {item.ig_content && (
                  <div className="mb-2">
                    <button
                      onClick={() =>
                        setExpandedIgApproved((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="flex items-center gap-1.5 text-[13px] font-semibold w-full text-left"
                      style={{ color: '#65676b' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1c1e21'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#65676b'; }}
                    >
                      {expandedIgApproved[item.id] ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      Instagram Content
                    </button>
                    {expandedIgApproved[item.id] && (
                      <div
                        className="mt-1.5 p-3 rounded-md text-[13px] whitespace-pre-wrap"
                        style={{ backgroundColor: '#f7f8fa', color: '#1c1e21' }}
                      >
                        {item.ig_content}
                      </div>
                    )}
                  </div>
                )}

                {/* Hashtags */}
                {item.hashtags && (
                  <div className="mb-3">
                    <span className="text-[12px]" style={{ color: '#1877f2' }}>
                      {item.hashtags}
                    </span>
                  </div>
                )}

                {/* Publish success message */}
                {publishSuccess[item.id] && (
                  <div
                    className="rounded-md p-3 mb-3 flex items-start gap-2"
                    style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7' }}
                  >
                    <CheckCircle size={15} style={{ color: '#2e7d32', flexShrink: 0, marginTop: 1 }} />
                    <p className="text-[12px]" style={{ color: '#1f5a23' }}>
                      {publishSuccess[item.id]}
                    </p>
                  </div>
                )}

                {/* Publish error message */}
                {publishError[item.id] && (
                  <div
                    className="rounded-md p-3 mb-3 flex items-start gap-2"
                    style={{ backgroundColor: '#fde2e1', border: '1px solid #f5b1ae' }}
                  >
                    <XCircle size={15} style={{ color: '#c62828', flexShrink: 0, marginTop: 1 }} />
                    <p className="text-[12px]" style={{ color: '#a01818' }}>
                      {publishError[item.id]}
                    </p>
                  </div>
                )}

                {/* Publish button */}
                {!publishSuccess[item.id] && (
                  <button
                    onClick={() => handlePublish(item.id)}
                    disabled={publishingId === item.id}
                    className="px-4 py-1.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#1877f2', color: '#ffffff' }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#1465c7';
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#1877f2';
                    }}
                  >
                    {publishingId === item.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Rocket size={14} />
                    )}
                    🚀 Publish
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}