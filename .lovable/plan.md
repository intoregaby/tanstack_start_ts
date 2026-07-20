
# Global Culture & Language Learning Platform — Build Plan

Building the entire spec in one pass. Stack: TanStack Start + React + Tailwind, Lovable Cloud (Supabase) for auth/DB/storage, Lovable's built-in Stripe payments for subscriptions, Lovable AI Gateway for the assistant, Tavily for web search, Leaflet+OpenStreetMap for the events map, Framer Motion for animation.

## 1. Backend setup (first)

**Enable Lovable Cloud** (database, auth, storage, server functions).

**Schema migration** creates all tables from spec §11, plus:
- `app_role` enum (`admin`, `subscriber`) and `user_roles` table with `has_role()` security-definer function (never store roles on profiles).
- `profiles` table (id → auth.users, email, name, created_at) with auto-insert trigger on signup.
- Every table gets explicit `GRANT`s and RLS policies:
  - Public read on `countries`, `courses`, `modules`, `lessons` where `is_published=true` AND (`tier_required='free'` OR selecting metadata only).
  - Free-tier lesson content readable by anon; paid lesson content readable only when caller has active subscription (checked via `subscriptions.status='active'`).
  - `progress`, `flashcards` user progress, `ai_chat_logs` scoped to `auth.uid()`.
  - `events`, `event_gallery_images` public read when published; admin write via `has_role(auth.uid(),'admin')`.
- Storage buckets: `country-flags` (public), `lesson-videos` (signed URLs, subscriber-gated), `lesson-resources` (signed), `event-gallery` (public), `pronunciation-audio` (public).

**Seed migration** inserts 6 countries (Japan, France, Rwanda, Brazil, Germany, South Korea) with flag emojis/images and "Coming soon" placeholder courses so the homepage/catalog never looks empty.

**Google OAuth**: configured as a stretch — email/password is primary.

## 2. Payments (Stripe, Lovable-managed)

- Run `recommend_payment_provider`, then `enable_stripe_payments`.
- Create two products via `batch_create_product`: **Basic** and **Premium**, monthly recurring, digital-services tax code.
- Checkout server function creates a Stripe session; on success, webhook (`/api/public/webhooks/stripe`) verifies signature and upserts into `subscriptions` (tier, status, current_period_end).
- `requireActiveSubscription` middleware for protected server fns; client-side `<SubscriptionGate>` re-checks status on every protected route mount (not just at login) so lapsed access locks immediately.
- Flow: visitor → Pricing → Checkout → email/password signup → account activates on webhook → dashboard unlocked.

## 3. Routing (TanStack file routes)

```text
src/routes/
  __root.tsx                      # global chrome, animated page transitions
  index.tsx                       # animated globe/country carousel homepage
  countries.index.tsx             # explore countries grid
  countries.$slug.tsx             # country landing (intro + courses)
  courses.$courseId.tsx           # course overview + modules
  pricing.tsx
  auth.tsx                        # login/signup (public)
  about.tsx
  contact.tsx
  media.tsx                       # videos/media hub
  events.tsx                      # Leaflet map + filters
  events.$eventId.tsx             # event detail (trailer, gallery, add-to-cal)
  _authenticated/route.tsx        # managed gate (ssr:false → /auth)
  _authenticated/dashboard.tsx    # enrolled courses, streak, certs
  _authenticated/lessons.$lessonId.tsx  # lesson player + AI + flashcards
  _authenticated/_admin/route.tsx # extra has_role('admin') gate
  _authenticated/_admin/index.tsx
  _authenticated/_admin/countries.tsx
  _authenticated/_admin/courses.tsx
  _authenticated/_admin/events.tsx
  _authenticated/_admin/analytics.tsx
  api/public/webhooks/stripe.ts
  api/public/ics/$eventId.ts      # generated .ics download
```

Free courses/lessons are top-level accessible via `courses.$courseId` without auth. Paid course routes redirect unauthenticated users to `/pricing`.

## 4. Homepage (top design priority)

- Hero: animated globe using `react-globe.gl` (or a CSS/SVG rotating globe fallback) with pins on the seeded countries; scroll-linked parallax.
- Below hero: horizontally-scrolling country card carousel (6 seeded + coming-soon placeholders), hover-tilt + Framer Motion scale.
- Feature strips with scroll-triggered reveals (`whileInView`) for: language + lifestyle, AI assistant, events, flashcards.
- Global page transitions via `AnimatePresence` in `__root.tsx`.
- Distinctive design system (not generic AI purple): warm sand + deep teal + accent coral, editorial serif display font (Fraunces) + Inter body, defined as semantic tokens in `src/styles.css`.

## 5. Course & lesson experience

- Country page → course list with Free/Paid/Premium badges.
- Course overview → module accordion → lesson list with progress ticks.
- Lesson player renders written (markdown), native video (Supabase Storage signed URL), or YouTube embed; mixed lessons stack all types.
- Sidebar: AI assistant panel + flashcards deck (spaced repetition using SM-2-lite algorithm stored per user).
- Pronunciation practice: native audio playback + MediaRecorder for user recording + local playback (no scoring).
- Progress tracked per lesson; streak = consecutive UTC days with ≥1 completion. Certificate generated as PDF on 100% course completion.

## 6. AI Assistant

- Server fn `askAssistant` (Premium-gated for full features; Basic gets lesson-only Q&A) using Lovable AI Gateway (`google/gemini-3.5-flash`).
- Tool: `web_search` calling Tavily API (requires `TAVILY_API_KEY` secret).
- System prompt includes current lesson content + country context.
- Extra server fns: `generatePrepChecklist({country, timeline})` and `generateQuiz({lessonId})` — both return structured output persisted for reuse.
- All calls logged to `ai_chat_logs`.

## 7. Events

- `/events`: Leaflet map (OpenStreetMap tiles, no key), filters by country/date; list + map split view.
- Event detail: trailer (native or YouTube), gallery carousel, short description, date/time/location, add-to-calendar buttons.
- `.ics` generated on the fly via `/api/public/ics/$eventId`; Google/Outlook links built client-side from event data.

## 8. Admin panel

Gated by `_authenticated/_admin/route.tsx` which checks `has_role(uid,'admin')` via a server fn; unauthorized → 403.
CRUD UIs (forms + tables) for countries, courses, modules, lessons (with YouTube URL paste OR file upload to storage), resources (PDF upload), events (with gallery uploads and lat/lng picker on a Leaflet map). Analytics tab: subscriber count, active subs, top courses (from `progress` counts).

## 9. Secrets & connections

- `TAVILY_API_KEY` — requested via `add_secret`; user obtains free key at tavily.com.
- Stripe: fully Lovable-managed, no user key entry.
- `LOVABLE_API_KEY` — auto-provisioned.
- The first admin: after signup, plan asks the user which email should be admin and I'll insert their `user_roles` row.

## 10. Non-negotiables enforced

- No hardcoded country logic anywhere; every country flows through the `countries` table.
- Subscription re-checked on every protected route mount + server-side on every protected server fn call.
- Free courses fully browsable and playable without login.
- Homepage/catalog show a global spread — no single country pinned as default.

## Tech details

- Motion: `framer-motion` for reveals, transitions, hover; `react-globe.gl` for the hero (with static fallback if package fails to install — falls back to an animated SVG world map).
- Markdown: `react-markdown` + `remark-gfm`.
- Map: `leaflet` + `react-leaflet`.
- ICS: hand-generated string (no dependency).
- PDF certs: `@react-pdf/renderer`.
- Audio: native `MediaRecorder` API, no library.

## Build order

1. Enable Cloud → schema + seed migration → RLS/grants.
2. Enable Stripe payments → create products → webhook + subscription sync.
3. Design system (`styles.css`) + `__root` chrome + auth pages.
4. Homepage (globe + carousel + reveals).
5. Countries → courses → lesson player + progress/flashcards/pronunciation.
6. AI assistant + Tavily tool.
7. Events map + detail + ICS.
8. Admin panel.
9. Dashboard (enrolled, streaks, certificates).
10. Polish: SEO head() per route, transitions, empty states.
