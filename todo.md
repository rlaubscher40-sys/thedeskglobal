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
- [ ] Add imageUrl column to dailyFeedItems schema and migrate DB
- [ ] Add coverImageUrl column to editions schema and migrate DB
- [ ] Generate hero image per feed item at ingest time (background, stored in S3)
- [ ] Generate cover image per weekly edition at ingest time (stored in S3)
- [ ] Display thumbnail in feed card UI
- [ ] Display full hero image in feed item detail modal
- [ ] Add homepage hero banner image (static editorial)
- [ ] Display edition cover image in weekly edition reader
