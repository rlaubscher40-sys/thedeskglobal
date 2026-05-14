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
