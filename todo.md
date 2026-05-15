# The Desk - Project TODO

## Database & Schema
- [x] Feed items table: feedDate, title, source, sourceUrl, summary, category, partnerTag, sayThis
- [x] Weekly editions table: editionNumber, weekOf, weekRange, topics (JSON), signals (JSON), keyMetrics (JSON), fullText
- [x] Apply migrations via webdev_execute_sql

## Server / API
- [x] POST /api/ingest/daily-feed endpoint (X-Scheduled-Key auth)
- [x] POST /api/ingest/weekly-edition endpoint (X-Scheduled-Key auth)
- [x] tRPC: feed.getItems (date filter, category filter)
- [x] tRPC: feed.getById
- [x] tRPC: editions.list
- [x] tRPC: editions.getById
- [x] tRPC: admin.stats (item counts per category, last posted date, ingestion history)
- [x] Secure scheduled key via environment secret (SCHEDULED_API_KEY)

## Frontend - Homepage / Feed Page
- [x] Category filter bar: ALL, PROPERTY, MACRO, AI, MARKETS, POLICY, SCIENCE, TECH
- [x] Feed item cards: title, summary, category badge, source, feedDate
- [x] Feed item detail modal/drawer: full partnerTag breakdown (Institutional, Broker, Adviser, Buyers Agent), prominent sayThis callout
- [x] Dark/premium editorial theme with animated background

## Frontend - Weekly Edition Page
- [x] Edition list / latest edition view
- [x] Deep-dive topics with body text
- [x] Signals list
- [x] keyMetrics table
- [x] fullText editor's letter
- [x] talkingPoints per partner persona

## Frontend - Admin Dashboard
- [x] Admin-only route guard (/admin)
- [x] Ingestion history log (daily feed dates + weekly editions)
- [x] Item counts per category (animated bar chart)
- [x] Last posted date per feed type (stat cards)
- [x] Admin nav item in sidebar (requiresAuth: true)

## Quality & Delivery
- [x] 60 vitest tests passing across 5 test files
- [x] Responsive design (mobile + desktop sidebar)
- [x] Checkpoint saved

## Image Generation
- [x] Add imageUrl column to dailyFeedItems schema and migrate DB
- [x] Add coverImageUrl column to editions schema and migrate DB (heroImageUrl)
- [x] Generate hero image per feed item at ingest time (background, stored in S3)
- [x] Generate cover image per weekly edition at ingest time (stored in S3)
- [x] Display thumbnail in feed card UI
- [x] Display full hero image in feed item detail modal (StoryPage + expanded card)
- [x] Add homepage hero banner image (DailyFeed is the homepage; IntelligenceSnapshot serves as hero)
- [x] Display edition cover image in weekly edition reader (EditionReader + Editions HeroParallaxBg)

## Navigation Cleanup & Explore Page
- [x] Remove Notes page from nav, App.tsx routes, and delete Notes.tsx
- [x] Remove notes tRPC procedures from routers.ts and db.ts
- [x] Build unified Explore page (ExplorePage.tsx) with category grid + keyword search
- [x] Redirect /topics and /topics/:category to /explore?category=X
- [x] Update AppLayout.tsx nav: remove Topics, Search, Notes — add Explore
- [x] Update App.tsx routes: /search and /topics/* redirect to /explore

## Core Goal Features
- [x] Fix duplicate empty-string key errors on /editions page
- [x] Fix headshot display in AppLayout sidebar (larger, better crop)
- [x] Add subscribers DB table (email, name, confirmedAt, source, premiumAt)
- [x] Add subscribe tRPC procedures (subscribe, confirm, unsubscribe)
- [x] Add prominent subscribe CTA on homepage hero and story pages
- [x] Add inline subscribe form in AppLayout sidebar
- [x] Add shareable public story URL (/story/:id accessible without login)
- [x] Add "Share" button on story pages and feed cards (copy link + native share)
- [x] Add "Forward this briefing" email button on daily feed
- [x] Add Ruben author panel in AppLayout sidebar (headshot, title, IK stats, LinkedIn)
- [x] Add About page with Ruben bio, IK proof points, and media-kit-style layout
- [x] Add premium flag to users table for future monetisation gate

## Bug Fixes (Session 2)
- [x] Fix CATEGORY_COLORS/CATEGORY_ACCENT/CATEGORY_BAR_COLORS in DailyFeed.tsx — add GEOPOLITICS, CULTURE, SPORT, GLOBAL PUBLIC PULSE, CRYPTO, HEALTH, CLIMATE, OTHER
- [x] Fix CAT map in EditionReader.tsx — add CULTURE, SPORT, GLOBAL PUBLIC PULSE, CRYPTO, HEALTH, CLIMATE, OTHER
- [x] Fix CAT_META_R in EditionReader.tsx signals section — add CULTURE, SPORT, GLOBAL PUBLIC PULSE, CRYPTO, HEALTH, CLIMATE, OTHER
- [x] Fix detectSignalCategoryR in EditionReader.tsx — add CRYPTO, SPORT, CULTURE, GLOBAL PUBLIC PULSE, HEALTH, CLIMATE, GEOPOLITICS, OTHER fallback
- [x] Fix CAT_META in Editions.tsx signals section — add CULTURE, SPORT, GLOBAL PUBLIC PULSE, CRYPTO, HEALTH, CLIMATE, OTHER
- [x] Fix detectSignalCategory in Editions.tsx — add CRYPTO, SPORT, CULTURE, GLOBAL PUBLIC PULSE, HEALTH, CLIMATE, GEOPOLITICS, OTHER fallback
- [x] Fix Key Metrics rendering in Editions.tsx — long-text values (>40 chars) render as compact note card instead of large number
- [x] Fix Key Metrics rendering in EditionReader.tsx — long-text values (>40 chars) render as compact note tile in horizontal scroll strip
- [x] Add sanitiseKeyMetrics() server-side helper in scheduledRoutes.ts — strips metric values >60 chars before DB storage, logs warning

## Scheduled Task Auth Fix
- [x] Rewrite SCHEDULED_TASK_PROMPT.md to use X-Scheduled-Key header auth via /api/ingest/ endpoints (not cookie-auth /api/scheduled/ endpoints)
- [x] Remove all references to SCHEDULED_TASK_COOKIE from prompt and notes
- [x] Update curl commands to use $THEDESK_SCHEDULED_API_KEY from credential file
- [x] Update keyMetrics example in prompt to show correct short label:value format
- [x] Update weekly edition day from Wednesday to Thursday (Sydney time) to match actual schedule

## Mobile Responsiveness Fixes
- [x] DailyFeed: masthead hero text too large on mobile, reduce heading size below md breakpoint
- [x] DailyFeed: Key Metrics grid — 2-col on mobile (currently 2 xl:3), ensure tiles don't overflow
- [x] DailyFeed: category filter bar pills — ensure horizontal scroll works on mobile without clipping
- [x] DailyFeed: feed cards — ensure action buttons (Copy/Share/Copy link/Save) wrap or stack on mobile
- [x] DailyFeed: IntelligenceSnapshot panel — hidden on xl, needs to appear inline above feed on mobile
- [x] DailyFeed: admin toolbar (GEN ALL SAY THIS, persona buttons) — stack vertically on mobile
- [x] DailyFeed: date navigator — ensure it fits on narrow screens without overflow
- [x] Editions: Key Signals 3-col masonry grid — reduce to 1-col on mobile, 2-col on sm
- [x] Editions: edition list sidebar — ensure it doesn't overflow on mobile
- [x] EditionReader: Key Signals 3-col grid — reduce to 1-col on mobile
- [x] EditionReader: full-screen overlay — ensure it is scrollable and not cut off on mobile
- [x] AppLayout: mobile hamburger menu — verify it opens/closes correctly
- [x] AppLayout: bottom nav bar — ensure it doesn't overlap content on mobile
- [x] AppLayout: sidebar overlay — ensure backdrop closes on tap
- [x] General: ensure no horizontal scroll on any page at 390px width

## Horizontal Overflow Fix (Mobile Today Tab)
- [x] Add overflow-x-hidden to the root page wrapper in DailyFeed
- [x] Fix PersonaSelector pill track overflowing viewport width
- [x] Fix IntelligenceSnapshot Key Metrics tiles overflowing on mobile
- [x] Fix feed card inner content (title, summary, action row) not clamping to container width
- [x] Fix hero masthead inner padding causing overflow at 390px
- [x] Fix category filter bar not clipping to viewport
- [x] Add overflow-x-hidden to AppLayout main content wrapper

## Hero Card Overflow Fix
- [x] Fix hero card (featured top card) overflowing right edge on mobile — title, summary, Say This block, partner context all cut off

## Card Overflow + Key Metrics Collapse (Mobile)
- [x] Force all feed cards and hero card to max-width 100% / box-sizing border-box so they never exceed viewport width
- [x] Reduce page padding on mobile to p-2 (was p-4) to give cards more room
- [x] Fix feed list wrapper to be w-full overflow-hidden
- [x] Collapse Key Metrics panel on mobile into compact 2-row strip with See All toggle

## Mobile Intelligence Panel Collapse + Final Overflow Fix
- [x] Fix category filter bar horizontal overflow — constrain to viewport width with proper contain
- [x] Collapse entire intelligence panel on mobile into compact strip (2 key metrics + topic count + queue count) with expand toggle

## Editions Page Mobile Fix
- [x] Editions page: negative margins on outer wrapper causing edition cards to overflow on laptop — removed negative margins and compensating inner padding, layout now fits correctly at all widths
