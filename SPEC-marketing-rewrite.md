# Fanz Dashboard — Marketing Review Page Implementation Spec

## Background

The Fanz marketing bot generates 13 posts per month in `content_calendar`. The Telegram-based review is inconvenient for the client (老板娘). This page replaces Telegram review with a web dashboard.

## Current state of data

content_calendar table real statuses used by the marketing bot:
- `copy_done` = content generated, pending review (replace old `pending_review`)
- `copy_approved` = content reviewed and approved (replace old `approved`)
- `image_ready` = imagery generated, pending image review
- `approved` = fully approved, ready to publish

There are 3 real July 2026 plans with 13 posts each. The API routes currently query for `pending_review` and `approved` which don't match real data.

## Files to create/modify

### 1. `app/api/marketing/plans/route.js` — NEW
Returns list of content_plans with their calendar row counts per status.

```js
GET /api/marketing/plans
Response: [{ id, month, status, created_at, total_posts, pending: N, approved: N, imagery_pending: N }]
```
- Join content_calendar to count rows by status per plan
- Ordered by created_at desc
- Include summary counts: pending=copy_done, approved=copy_approved

### 2. `app/api/marketing/plan/[id]/route.js` — NEW
Returns all calendar rows for a specific plan with full content.

```js
GET /api/marketing/plan/[id]
Response: [{ id, topic, pillar, fb_content, ig_content, hashtags, image_url, status, 
            suggested_date, review_notes, post_angle, image_status }]
```
- Select by plan_id
- Order by suggested_date ASC
- Include ALL statuses so the page can show progress

### 3. `app/api/marketing/pending/route.js` — FIX
Change query from `status = 'pending_review'` to `status = 'copy_done'`
Keep same select fields.

### 4. `app/api/marketing/approved/route.js` — FIX
Change query from `status = 'approved' AND post_id IS NULL` to `status = 'copy_approved'`
Remove `.is('post_id', null)` filter.

### 5. `app/api/marketing/review/route.js` — FIX
Change status check from `current.status !== 'pending_review'` to `current.status !== 'copy_done'`
Change approve payload from `status: 'approved'` to `status: 'copy_approved'`
Keep TOCTOU guard with `.eq('status', 'copy_done')`

### 6. `app/marketing/page.js` — REWRITE (this is the big one)

A full marketing review page with these sections:

#### Plan Selector (top)
- Dropdown/selector showing available plans: "July 2026 — 13 posts (5 pending, 8 approved)"
- Auto-select the most recent plan with pending items
- Show plan status summary

#### Monthly Overview Bar
- Summary stats: "13 posts • 5 pending review • 8 approved • 0 with imagery"
- Color-coded: pending (orange), approved (green), has imagery (blue)

#### Posts by Date List
- Show all 13 posts sorted by suggested_date
- Each post is a card showing:
  - Date (e.g., "July 1")
  - Pillar badge (product/case/educational/promo/story with color coding)
  - Topic title
  - Status badge (copy_done = "Pending Review" in orange, copy_approved = "Approved" in green, image_ready = "Image Ready" in blue, approved = "Ready to Publish" in dark green)
  
#### Expandable Content Card
- Clicking a post card expands it to show FULL content:
  - **FB Content** — full text, not truncated (this is what 老板娘 needs to read)
  - **IG Content** — full text
  - **Hashtags**
  - **Post Angle** (brief)
  - **Image status**: show image_url if exists, otherwise "Image not yet generated"
  
- **Action buttons** (only show for posts in 'copy_done' status):
  - **Approve** (green button) — POST /api/marketing/review { id, action: 'approve' }
  - **Request Changes** (orange button) — shows textarea for review_notes + Confirm button
  - Loading state + error display per action

- For approved posts (copy_approved):
  - Show green "Approved ✓" badge
  - No action buttons (already approved)

#### Schedule View (optional but desired)
- A second tab/view showing all 13 posts on a simple calendar layout
- Each date block shows the pillar and topic
- Grey out past dates, highlight today

#### Design
- Clean dashboard style matching existing warranty page
- Colors: white cards with subtle borders, rounded corners
- Pillar badges (same as current: product=green, case=blue, story=purple, promo=gold, educational=teal)
- Responsive layout (works on tablet for 老板娘)
- Loading skeleton while fetching
- Error states with retry

## Database Schema Reference

content_calendar columns:
- id (uuid), created_at, pillar, topic, fb_content, ig_content, hashtags
- image_url, scene_image_url, source_product_image, image_status
- status, review_notes
- plan_id, post_angle, suggested_date, scheduled_date
- chat_id

content_plans columns:
- id (uuid), created_at, month, status, total_posts, notes, chat_id

## Status transition for review
- copy_done → copy_approved (approve)
- copy_done (stays copy_done, sets review_notes) (reject)
- The bot handles the regeneration after reject

## Important
- All server-side code uses `@/app/lib/supabase` which reads env vars SUPABASE_URL and SUPABASE_SERVICE_KEY
- This is a Next.js App Router project
- Already has: supabase client, tailwind, lucide-react icons
- Use existing SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables (same as marketing bot)
- DO NOT hardcode any keys
