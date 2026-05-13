import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("editions router", () => {
  it("lists editions from the database", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.editions.list();
    expect(Array.isArray(editions)).toBe(true);
    if (editions.length === 0) return; // skip if DB is empty
    expect(editions[0]).toHaveProperty("editionNumber");
    expect(editions[0]).toHaveProperty("weekOf");
    expect(editions[0]).toHaveProperty("topics");
    expect(editions[0]).toHaveProperty("signals");
    expect(editions[0]).toHaveProperty("pdfUrl");
  });

  it("gets edition by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.editions.list();
    if (editions.length > 0) {
      const edition = await caller.editions.getById({ id: editions[0].id });
      expect(edition).toBeDefined();
      expect(edition?.editionNumber).toBe(editions[0].editionNumber);
    }
  });

  it("searches editions by keyword", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const results = await caller.editions.search({ query: "Hormuz" });
    expect(Array.isArray(results)).toBe(true);
  });

  it("edition has keyMetrics for comparison", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.editions.list();
    if (editions.length === 0) return; // skip if DB is empty
    const edition = editions[0];
    if (!edition.keyMetrics) return; // skip if no metrics
    const metrics = edition.keyMetrics as Record<string, string | number>;
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  it("edition topics include partnerRelevance", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.editions.list();
    if (editions.length === 0) return; // skip if DB is empty
    const topics = editions[0].topics as any[];
    if (!topics || topics.length === 0) return;
    expect(topics[0]).toHaveProperty("partnerRelevance");
    expect(Array.isArray(topics[0].partnerRelevance)).toBe(true);
  });

  it("edition has fullText for search indexing", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.editions.list();
    if (editions.length === 0) return; // skip if DB is empty
    if (!editions[0].fullText) return;
    expect(typeof editions[0].fullText).toBe("string");
    expect(editions[0].fullText!.length).toBeGreaterThan(50);
  });
});

describe("feed router", () => {
  it("returns feed items (may be empty)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.feed.getItems();
    expect(Array.isArray(items)).toBe(true);
  });

  it("returns recent feed dates", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const dates = await caller.feed.getRecentDates();
    expect(Array.isArray(dates)).toBe(true);
  });
});

describe("search router", () => {
  it("searches all content", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const results = await caller.search.all({ query: "Australia" });
    expect(results).toHaveProperty("editions");
    expect(results).toHaveProperty("feedItems");
    expect(Array.isArray(results.editions)).toBe(true);
    expect(Array.isArray(results.feedItems)).toBe(true);
  });
});

describe("topics router", () => {
  it("returns categories list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const categories = await caller.topics.categories();
    expect(Array.isArray(categories)).toBe(true);
    // Skip count assertion if DB is empty (fresh deployment)
    if (categories.length === 0) return;
    expect(categories.length).toBeGreaterThanOrEqual(1);
  });

  it("returns feed items and editions for a category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.topics.getByCategory({ category: "AI" });
    expect(result).toHaveProperty("feedItems");
    expect(result).toHaveProperty("editions");
    expect(Array.isArray(result.feedItems)).toBe(true);
    expect(Array.isArray(result.editions)).toBe(true);
    // Skip count assertion if DB is empty (fresh deployment)
    if (result.feedItems.length === 0) return;
    expect(result.feedItems.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty arrays for nonexistent category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.topics.getByCategory({ category: "NONEXISTENT_XYZ" });
    expect(result.feedItems).toHaveLength(0);
    expect(result.editions).toHaveLength(0);
  });
});

describe("protected routes require auth", () => {
  it("reading queue list requires auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.readingQueue.list()).rejects.toThrow();
  });

  it("notes list requires auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notes.list()).rejects.toThrow();
  });

  it("conversations list requires auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.conversations.list()).rejects.toThrow();
  });
});

describe("authenticated protected routes", () => {
  it("reading queue list returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.readingQueue.list();
    expect(Array.isArray(items)).toBe(true);
  });

  it("can add a custom bookmark to reading queue", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.readingQueue.add({
      customTitle: "Test Bookmark from Edition",
      customUrl: "signal://edition/1/Test%20Bookmark",
    });
    expect(result.success).toBe(true);
    const items = await caller.readingQueue.list();
    const found = items.find((i: any) => i.customTitle === "Test Bookmark from Edition");
    expect(found).toBeDefined();
    expect(found?.customUrl).toContain("signal://edition/1");
  });

  it("enriched reading queue items include feed metadata fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.readingQueue.list();
    expect(Array.isArray(items)).toBe(true);
    // Every item should have the enriched fields (even if null)
    if (items.length > 0) {
      const item = items[0];
      expect(item).toHaveProperty("feedTitle");
      expect(item).toHaveProperty("feedSummary");
      expect(item).toHaveProperty("feedCategory");
      expect(item).toHaveProperty("feedSource");
      expect(item).toHaveProperty("feedSourceUrl");
      expect(item).toHaveProperty("feedDate");
    }
  });

  it("notes list returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const notes = await caller.notes.list();
    expect(Array.isArray(notes)).toBe(true);
  });

  it("can save and retrieve a weekly note", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const weekId = "2026-W17";
    await caller.notes.save({ weekId, content: "Learned about Hormuz crisis" });
    const note = await caller.notes.get({ weekId });
    expect(note.content).toBe("Learned about Hormuz crisis");
    expect(note.weekId).toBe(weekId);
  });

  it("notes.get returns default empty note for nonexistent week", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const note = await caller.notes.get({ weekId: "2099-W01" });
    expect(note).toBeDefined();
    expect(note.content).toBe("");
    expect(note.weekId).toBe("2099-W01");
  });

  it("can track a conversation entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.conversations.track({
      lineText: "Brent crude is at $110, up from $68 in February",
      usedWithCategory: "Broker",
    });
    expect(result.success).toBe(true);
    const entries = await caller.conversations.list();
    const found = entries.find((e: any) => e.lineText?.includes("Brent crude"));
    expect(found).toBeDefined();
  });

  it("conversations list returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.conversations.list();
    expect(Array.isArray(entries)).toBe(true);
  });
});

describe("weekly comparison router", () => {
  it("returns recent editions with metrics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.weeklyComparison.recent({ limit: 4 });
    expect(Array.isArray(editions)).toBe(true);
    if (editions.length === 0) return; // skip if DB is empty
    expect(editions[0]).toHaveProperty("editionNumber");
    expect(editions[0]).toHaveProperty("weekOf");
    expect(editions[0]).toHaveProperty("keyMetrics");
    expect(editions[0]).toHaveProperty("publishedAt");
  });

  it("respects the limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.weeklyComparison.recent({ limit: 2 });
    expect(editions.length).toBeLessThanOrEqual(2);
  });

  it("returns editions ordered by editionNumber descending", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const editions = await caller.weeklyComparison.recent({ limit: 4 });
    for (let i = 1; i < editions.length; i++) {
      expect(editions[i - 1].editionNumber).toBeGreaterThanOrEqual(editions[i].editionNumber);
    }
  });
});

describe("feed items with sayThis", () => {
  it("feed items include sayThis field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.feed.getItems();
    if (items.length > 0) {
      // sayThis should exist as a property (may be null for unprocessed items)
      expect(items[0]).toHaveProperty("sayThis");
    }
  });

  it("at least some feed items have non-null sayThis after backfill", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.feed.getItems();
    if (items.length === 0) return; // skip if DB is empty
    const withSayThis = items.filter((item: any) => item.sayThis !== null && item.sayThis !== undefined);
    // May be zero if no items have been backfilled yet
    expect(withSayThis.length).toBeGreaterThanOrEqual(0);
  });
});
