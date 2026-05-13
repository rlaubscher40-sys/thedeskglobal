import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Weekly editions (the PDF deep dives).
 * Stores metadata + full-text content for search.
 */
export const editions = mysqlTable("editions", {
  id: int("id").autoincrement().primaryKey(),
  editionNumber: int("editionNumber").notNull(),
  weekOf: varchar("weekOf", { length: 64 }).notNull(),
  weekRange: varchar("weekRange", { length: 128 }).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  readingTime: varchar("readingTime", { length: 32 }),
  /** JSON array of topic objects for the edition card */
  topics: json("topics").$type<EditionTopic[]>().notNull(),
  /** JSON array of signal strings */
  signals: json("signals").$type<string[]>().notNull(),
  /** Full text content of the PDF for search indexing */
  fullText: text("fullText"),
  /** JSON object with key metrics for week-over-week comparison */
  keyMetrics: json("keyMetrics").$type<Record<string, string | number>>(),
  /** AI-generated hero image URL for the edition card (stored in S3) */
  heroImageUrl: text("heroImageUrl"),
  /** Ruben's editorial take: 2-4 sentence opinion on the week's biggest signal */
  rubensTake: text("rubensTake"),
  /** Substack draft: AI-generated essay title */
  substackDraftTitle: text("substackDraftTitle"),
  /** Substack draft: AI-generated essay subtitle */
  substackDraftSubtitle: text("substackDraftSubtitle"),
  /** Substack draft: AI-generated essay body (~700 words) */
  substackDraftBody: text("substackDraftBody"),
  /** Substack draft: AI-generated hero image URL */
  substackDraftImageUrl: text("substackDraftImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EditionTopic = {
  title: string;
  /** 2-3 sentence lead summary shown on the edition card */
  summary: string;
  category: string;
  partnerRelevance?: string[];
  /** Multi-paragraph deep-dive body (3-6 paragraphs, 300-600 words) */
  body?: string;
  /** Single sentence: the one thing to remember from this topic */
  keyTakeaway?: string;
  /** What to watch next: 2-3 forward-looking indicators or events */
  whatToWatch?: string[];
  /** Ready-to-use talking points keyed by partner category */
  talkingPoints?: Record<string, string>;
};

export type Edition = typeof editions.$inferSelect;
export type InsertEdition = typeof editions.$inferInsert;

/**
 * Daily feed items (lightweight daily scan results).
 * 3-5 headlines per day with one-line context.
 */
export const dailyFeedItems = mysqlTable("daily_feed_items", {
  id: int("id").autoincrement().primaryKey(),
  /** Date string YYYY-MM-DD */
  feedDate: varchar("feedDate", { length: 10 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  source: varchar("source", { length: 256 }).notNull(),
  sourceUrl: text("sourceUrl"),
  summary: text("summary").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  /** Partner relevance tag e.g. "Brokers: one-line relevance" */
  partnerTag: text("partnerTag"),
  /** One-liner conversation starter for partner meetings */
  sayThis: text("sayThis"),
  /** Whether this item was promoted to the weekly deep dive */
  promotedToEdition: boolean("promotedToEdition").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyFeedItem = typeof dailyFeedItems.$inferSelect;
export type InsertDailyFeedItem = typeof dailyFeedItems.$inferInsert;

/**
 * Reading queue (bookmarked items from the daily feed).
 */
export const readingQueue = mysqlTable("reading_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  feedItemId: int("feedItemId"),
  /** Custom URL if bookmarked from outside the feed */
  customUrl: text("customUrl"),
  customTitle: varchar("customTitle", { length: 512 }),
  /** Full article text pulled when bookmarked */
  articleText: text("articleText"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReadingQueueItem = typeof readingQueue.$inferSelect;
export type InsertReadingQueueItem = typeof readingQueue.$inferInsert;

/**
 * Weekly notes ("What I learned this week").
 */
export const weeklyNotes = mysqlTable("weekly_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Week identifier e.g. "2026-W17" */
  weekId: varchar("weekId", { length: 16 }).notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyNote = typeof weeklyNotes.$inferSelect;
export type InsertWeeklyNote = typeof weeklyNotes.$inferInsert;

/**
 * Conversation tracker ("Used in conversation" ticks on Say This lines).
 */
export const conversationTracker = mysqlTable("conversation_tracker", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  editionId: int("editionId"),
  /** The "Say This" line text */
  lineText: text("lineText").notNull(),
  /** Which partner category it was used with */
  usedWithCategory: varchar("usedWithCategory", { length: 128 }),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

export type ConversationTrackerEntry = typeof conversationTracker.$inferSelect;
export type InsertConversationTrackerEntry = typeof conversationTracker.$inferInsert;
