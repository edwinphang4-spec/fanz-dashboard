# Dashboard Marketing Module — Pending Review

## 1. API Route: GET /api/marketing/pending

File: `app/api/marketing/pending/route.js`

Returns list of content_calendar rows with status='pending_review'.
- Uses server-side supabase from `@/app/lib/supabase`
- Selects: id, topic, pillar, fb_content, ig_content, hashtags, status, created_at, review_notes
- Ordered by created_at desc
- 503 if supabase not configured
- 500 on error
- Returns JSON array

## 2. API Route: POST /api/marketing/review

File: `app/api/marketing/review/route.js`

Approves or rejects a pending_review row. TOCTOU guard required.

Request body: { id: number, action: 'approve' | 'reject', review_notes?: string }

Logic:
1. Validate inputs (id required, action one of approve/reject)
2. Read current row's status
3. If status !== 'pending_review' → 409 Conflict with message "Cannot {action} — row is already \"{status}\"" and currentStatus in body
4. Build update payload: { status: action==='approve' ? 'approved' : 'rejected' }
   If reject and review_notes present, add to payload
5. Update with TOCTOU guard: .eq('id', id).eq('status', 'pending_review').select()
6. If updated.length === 0 → 409 Conflict (concurrent modification)
7. Return { success: true, row: updated[0] }

Uses @supabase/supabase-js SDK (already in package.json).

## 3. Marketing Page UI

File: `app/marketing/page.js` (replace Coming Soon placeholder)

Full functional page with:

### Layout
- Same style as warranty page: `text-[24px] font-semibold tracking-tight` title "Marketing Content"
- Subtitle: "Review and approve social media content"

### Pending Review List
- Fetches from /api/marketing/pending on mount
- Loading state, empty state ("No pending reviews")
- Each pending item rendered as a card (white bg, 1px border, rounded-lg)

### Card layout
Each card shows:
- Topic title in bold
- Pillar badge (product=🛒, case=🏠, promo=🎉, story=📖)
- Created date
- FB content (expandable section)
- IG content (expandable section)
- Hashtags
- Approve button (green bg #2e7d32) and Request Changes button (orange bg #b26b00)
- When "Request Changes" clicked, show textarea for notes + Confirm Reject button

### Approve flow
- POST /api/marketing/review with { id, action: 'approve' }
- On success: card fades/removes from list
- On 409 error: show inline message "This post has already been [approved/rejected] by another user"
- On 500 error: show error message

### Reject flow
- User clicks "Request Changes"
- Textarea appears below the card for revision notes
- User clicks "Confirm Reject"
- POST /api/marketing/review with { id, action: 'reject', review_notes }
- On success: card removes from list
- On 409 error: show inline message

### Concurrency handling
- After successful action, remove card from local state (no refetch needed, avoids TOCTOU race)
- 409 errors show a user-friendly message
- Buttons disabled during pending request

### Design
Match existing Dashboard patterns:
- Use lucide-react icons (CheckCircle, MessageSquare, XCircle)
- Inline styles with style={{}} (not Tailwind classes for colors)
- CSS variables from globals.css (--color-brand, etc.)
- Card: backgroundColor '#ffffff', border '1px solid #dadde1', rounded-lg, p-4
- Title style: text-[24px] font-semibold tracking-tight
- Subtitle: text-[14px] mt-1.5 with color #65676b
- Button hover states handled with onMouseEnter/onMouseLeave

## Security
- All API routes are server-side only (Next.js App Router route.js)
- Supabase service_role key is NEVER exposed to browser
- API routes validate inputs before processing
- Browser only calls /api/* endpoints

## File structure
- app/api/marketing/pending/route.js — new
- app/api/marketing/review/route.js — new
- app/marketing/page.js — replace existing file