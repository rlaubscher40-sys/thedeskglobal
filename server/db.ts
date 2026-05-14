import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  editions, InsertEdition,
  dailyFeedItems, InsertDailyFeedItem,
  readingQueue, InsertReadingQueueItem,
  weeklyNotes, InsertWeeklyNote,
  conversationTracker, InsertConversationTrackerEntry,
  subscribers,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Editions ───

export async function getEditions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(editions).orderBy(desc(editions.editionNumber));
}

export async function getEditionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(editions).where(eq(editions.id, id)).limit(1);
  return result[0];
}

export async function getEditionByNumber(editionNumber: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(editions).where(eq(editions.editionNumber, editionNumber)).limit(1);
  return result[0];
}

export async function createEdition(data: InsertEdition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(editions).values(data);
  return result;
}

export async function updateEditionRubensTake(id: number, rubensTake: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(editions).set({ rubensTake }).where(eq(editions.id, id));
}

export async function updateEditionSubstackDraft(
  id: number,
  draft: { title: string; subtitle: string; body: string; imageUrl?: string | null }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(editions).set({
    substackDraftTitle: draft.title,
    substackDraftSubtitle: draft.subtitle,
    substackDraftBody: draft.body,
    ...(draft.imageUrl !== undefined ? { substackDraftImageUrl: draft.imageUrl } : {}),
  }).where(eq(editions.id, id));
}

export async function getRecentEditionsWithMetrics(limit: number = 4) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: editions.id,
    editionNumber: editions.editionNumber,
    weekOf: editions.weekOf,
    weekRange: editions.weekRange,
    keyMetrics: editions.keyMetrics,
    publishedAt: editions.publishedAt,
  }).from(editions)
    .orderBy(desc(editions.editionNumber))
    .limit(limit);
}

export async function searchEditions(query: string) {
  const db = await getDb();
  if (!db) return [];
  const pattern = `%${query}%`;
  return db.select().from(editions).where(
    or(
      like(editions.fullText, pattern),
      like(editions.weekOf, pattern),
    )
  ).orderBy(desc(editions.editionNumber));
}

// ─── Daily Feed ───

export async function getDailyFeedItems(date?: string) {
  const db = await getDb();
  if (!db) return [];
  if (date) {
    return db.select().from(dailyFeedItems)
      .where(eq(dailyFeedItems.feedDate, date))
      .orderBy(desc(dailyFeedItems.createdAt));
  }
  return db.select().from(dailyFeedItems)
    .orderBy(desc(dailyFeedItems.createdAt))
    .limit(30);
}

export async function getRecentFeedDates() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ feedDate: dailyFeedItems.feedDate })
    .from(dailyFeedItems)
    .orderBy(desc(dailyFeedItems.feedDate))
    .limit(14);
  return result.map(r => r.feedDate);
}

export async function createDailyFeedItem(data: InsertDailyFeedItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(dailyFeedItems).values(data);
}

export async function createDailyFeedItems(items: InsertDailyFeedItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (items.length === 0) return;
  return db.insert(dailyFeedItems).values(items);
}

export async function updateDailyFeedItemPartnerTag(id: number, partnerTag: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(dailyFeedItems).set({ partnerTag }).where(eq(dailyFeedItems.id, id));
}

export async function updateDailyFeedItemSayThis(id: number, sayThis: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(dailyFeedItems).set({ sayThis }).where(eq(dailyFeedItems.id, id));
}
export async function updateDailyFeedItemImageUrl(id: number, imageUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(dailyFeedItems).set({ imageUrl }).where(eq(dailyFeedItems.id, id));
}

export async function getDailyFeedItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyFeedItems).where(eq(dailyFeedItems.id, id)).limit(1);
  return result[0];
}

// ─── Topic Threads (by category) ───

export async function getFeedItemsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyFeedItems)
    .where(eq(dailyFeedItems.category, category))
    .orderBy(desc(dailyFeedItems.createdAt))
    .limit(100);
}

export async function getEditionsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  // Search editions whose topics JSON contains the category
  const pattern = `%"category":"${category}"%`;
  const patternLower = `%"category":"${category.toLowerCase()}"%`;
  const patternTitle = `%"category":"${category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}"%`;
  return db.select().from(editions).where(
    or(
      like(sql`CAST(${editions.topics} AS CHAR)`, pattern),
      like(sql`CAST(${editions.topics} AS CHAR)`, patternLower),
      like(sql`CAST(${editions.topics} AS CHAR)`, patternTitle),
    )
  ).orderBy(desc(editions.editionNumber));
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  // Get categories from daily feed items
  const feedResult = await db.selectDistinct({ category: dailyFeedItems.category })
    .from(dailyFeedItems)
    .orderBy(dailyFeedItems.category);
  const allCats = new Set<string>(feedResult.map(r => r.category?.toUpperCase()).filter(Boolean) as string[]);
  // Also extract categories from edition topics JSON
  const editionRows = await db.select({ topics: editions.topics }).from(editions);
  for (const row of editionRows) {
    if (!row.topics) continue;
    try {
      const parsed = typeof row.topics === 'string' ? JSON.parse(row.topics) : row.topics;
      if (Array.isArray(parsed)) {
        for (const t of parsed) {
          if (t?.category) allCats.add(String(t.category).toUpperCase());
        }
      }
    } catch { /* ignore */ }
  }
  return Array.from(allCats).sort();
}

// ─── Reading Queue (enriched) ───

export async function getEnrichedReadingQueue(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const queueItems = await db.select().from(readingQueue)
    .where(eq(readingQueue.userId, userId))
    .orderBy(desc(readingQueue.createdAt));

  // Enrich items that have a feedItemId with feed item metadata
  const enriched = await Promise.all(
    queueItems.map(async (item) => {
      if (item.feedItemId) {
        const feedItem = await db.select().from(dailyFeedItems)
          .where(eq(dailyFeedItems.id, item.feedItemId))
          .limit(1);
        if (feedItem[0]) {
          return {
            ...item,
            feedTitle: feedItem[0].title,
            feedSummary: feedItem[0].summary,
            feedCategory: feedItem[0].category,
            feedSource: feedItem[0].source,
            feedSourceUrl: feedItem[0].sourceUrl,
            feedDate: feedItem[0].feedDate,
          };
        }
      }
      return {
        ...item,
        feedTitle: null,
        feedSummary: null,
        feedCategory: null,
        feedSource: null,
        feedSourceUrl: null,
        feedDate: null,
      };
    })
  );
  return enriched;
}

// ─── Reading Queue ───

export async function getReadingQueue(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(readingQueue)
    .where(eq(readingQueue.userId, userId))
    .orderBy(desc(readingQueue.createdAt));
}

export async function addToReadingQueue(data: InsertReadingQueueItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(readingQueue).values(data);
}

export async function markReadingQueueItemRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(readingQueue)
    .set({ isRead: true })
    .where(and(eq(readingQueue.id, id), eq(readingQueue.userId, userId)));
}

export async function removeFromReadingQueue(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(readingQueue)
    .where(and(eq(readingQueue.id, id), eq(readingQueue.userId, userId)));
}

export async function clearAllReadingQueue(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(readingQueue)
    .where(eq(readingQueue.userId, userId));
}

export async function markAllReadingQueueRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(readingQueue)
    .set({ isRead: true })
    .where(eq(readingQueue.userId, userId));
}

// ─── Weekly Notes ───

export async function getWeeklyNote(userId: number, weekId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(weeklyNotes)
    .where(and(eq(weeklyNotes.userId, userId), eq(weeklyNotes.weekId, weekId)))
    .limit(1);
  return result[0];
}

export async function getAllWeeklyNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyNotes)
    .where(eq(weeklyNotes.userId, userId))
    .orderBy(desc(weeklyNotes.weekId));
}

export async function upsertWeeklyNote(data: InsertWeeklyNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Try to find existing
  const existing = await db.select().from(weeklyNotes)
    .where(and(eq(weeklyNotes.userId, data.userId), eq(weeklyNotes.weekId, data.weekId)))
    .limit(1);
  if (existing.length > 0) {
    return db.update(weeklyNotes)
      .set({ content: data.content })
      .where(eq(weeklyNotes.id, existing[0].id));
  }
  return db.insert(weeklyNotes).values(data);
}

export async function deleteWeeklyNote(userId: number, weekId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(weeklyNotes)
    .where(and(eq(weeklyNotes.userId, userId), eq(weeklyNotes.weekId, weekId)));
}

// ─── Conversation Tracker ───

export async function getConversationEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversationTracker)
    .where(eq(conversationTracker.userId, userId))
    .orderBy(desc(conversationTracker.usedAt));
}

export async function addConversationEntry(data: InsertConversationTrackerEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(conversationTracker).values(data);
}

// ─── Full-text Search ───

export async function searchAllContent(query: string) {
  const db = await getDb();
  if (!db) return { editions: [], feedItems: [] };
  const pattern = `%${query}%`;

  const editionResults = await db.select().from(editions).where(
    or(
      like(editions.fullText, pattern),
      like(editions.weekOf, pattern),
    )
  ).orderBy(desc(editions.editionNumber));

  const feedResults = await db.select().from(dailyFeedItems).where(
    or(
      like(dailyFeedItems.title, pattern),
      like(dailyFeedItems.summary, pattern),
    )
  ).orderBy(desc(dailyFeedItems.createdAt)).limit(50);

  return { editions: editionResults, feedItems: feedResults };
}

// ─── Trends ───

/**
 * Returns all editions (up to `limit`) with their keyMetrics and topics,
 * ordered oldest-first so charts render left-to-right chronologically.
 */
export async function getMetricHistory(limit: number = 12) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: editions.id,
    editionNumber: editions.editionNumber,
    weekOf: editions.weekOf,
    weekRange: editions.weekRange,
    publishedAt: editions.publishedAt,
    keyMetrics: editions.keyMetrics,
  }).from(editions)
    .orderBy(desc(editions.editionNumber))
    .limit(limit);
  return rows.reverse();
}

/**
 * Returns category counts from both daily feed items and edition topics
 * over the last `days` days, combined into a single heat map.
 */
export async function getCategoryHeat(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const feedRows = await db.select({
    category: dailyFeedItems.category,
    feedDate: dailyFeedItems.feedDate,
  }).from(dailyFeedItems)
    .where(sql`${dailyFeedItems.feedDate} >= ${cutoffStr}`)
    .orderBy(dailyFeedItems.feedDate);

  const editionRows = await db.select({
    topics: editions.topics,
    publishedAt: editions.publishedAt,
  }).from(editions)
    .where(sql`${editions.publishedAt} >= ${cutoff}`)
    .orderBy(desc(editions.publishedAt));

  const counts: Record<string, { daily: number; weekly: number; total: number }> = {};

  for (const row of feedRows) {
    const cat = (row.category || "OTHER").toUpperCase();
    if (!counts[cat]) counts[cat] = { daily: 0, weekly: 0, total: 0 };
    counts[cat].daily++;
    counts[cat].total++;
  }

  for (const row of editionRows) {
    const topics = (row.topics as any[]) || [];
    for (const t of topics) {
      const cat = (t.category || "OTHER").toUpperCase();
      if (!counts[cat]) counts[cat] = { daily: 0, weekly: 0, total: 0 };
      counts[cat].weekly++;
      counts[cat].total++;
    }
  }

  return Object.entries(counts)
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Returns per-edition category frequency from edition topics over the last
 * `editionLimit` editions, for the rising/falling signal chart.
 */
export async function getSignalFrequency(editionLimit: number = 8) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    editionNumber: editions.editionNumber,
    weekOf: editions.weekOf,
    topics: editions.topics,
    signals: editions.signals,
  }).from(editions)
    .orderBy(desc(editions.editionNumber))
    .limit(editionLimit);

  const ordered = rows.reverse();

  return ordered.map((row) => {
    const topics = (row.topics as any[]) || [];
    const categoryCounts: Record<string, number> = {};
    for (const t of topics) {
      const cat = (t.category || "OTHER").toUpperCase();
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const signalCount = ((row.signals as string[]) || []).length;
    return {
      editionNumber: row.editionNumber,
      weekOf: row.weekOf,
      categoryCounts,
      signalCount,
      topicCount: topics.length,
    };
  });
}

export async function updateEditionHeroImage(id: number, heroImageUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(editions).set({ heroImageUrl }).where(eq(editions.id, id));
}

// ─── Admin Stats ───
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;
  const [feedRows, editionRows] = await Promise.all([
    db.select().from(dailyFeedItems).orderBy(desc(dailyFeedItems.createdAt)).limit(200),
    db.select({
      id: editions.id,
      editionNumber: editions.editionNumber,
      weekOf: editions.weekOf,
      weekRange: editions.weekRange,
      publishedAt: editions.publishedAt,
      createdAt: editions.createdAt,
    }).from(editions).orderBy(desc(editions.editionNumber)).limit(20),
  ]);
  // Category counts from feed items
  const categoryCounts: Record<string, number> = {};
  for (const item of feedRows) {
    const cat = (item.category || 'OTHER').toUpperCase();
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  // Last posted dates
  const lastDailyPosted = feedRows[0]?.createdAt ?? null;
  const lastWeeklyPosted = editionRows[0]?.createdAt ?? null;
  // Ingestion history: last 20 daily feed dates and last 10 editions
  const recentFeedDates = Array.from(new Set(feedRows.map(r => r.feedDate))).slice(0, 14);
  const feedItemsPerDate: Record<string, number> = {};
  for (const item of feedRows) {
    feedItemsPerDate[item.feedDate] = (feedItemsPerDate[item.feedDate] || 0) + 1;
  }
  return {
    totalFeedItems: feedRows.length,
    totalEditions: editionRows.length,
    categoryCounts,
    lastDailyPosted,
    lastWeeklyPosted,
    recentFeedDates: recentFeedDates.map(date => ({
      date,
      count: feedItemsPerDate[date] || 0,
    })),
    recentEditions: editionRows.slice(0, 10).map(e => ({
      editionNumber: e.editionNumber,
      weekOf: e.weekOf,
      weekRange: e.weekRange,
      publishedAt: e.publishedAt,
    })),
  };
}

// ─── Subscribers ───

export async function upsertSubscriber(data: {
  email: string;
  name?: string | null;
  source?: string;
  confirmToken?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscribers).values({
    email: data.email,
    name: data.name ?? null,
    source: data.source ?? 'homepage',
    confirmToken: data.confirmToken ?? null,
  });
}

export async function confirmSubscriber(token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(subscribers)
    .where(eq(subscribers.confirmToken, token))
    .limit(1);
  if (!result[0]) return false;
  await db.update(subscribers)
    .set({ confirmedAt: new Date(), confirmToken: null })
    .where(eq(subscribers.confirmToken, token));
  return true;
}

export async function unsubscribeEmail(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(subscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(subscribers.email, email));
}

export async function listSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

export async function getSubscriberCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(subscribers)
    .where(and(
      sql`${subscribers.unsubscribedAt} IS NULL`,
    ));
  return Number(result[0]?.count ?? 0);
}
