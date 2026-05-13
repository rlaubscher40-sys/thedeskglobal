/**
 * Accessibility-relevant data validation tests.
 *
 * These tests verify that feed items and editions returned by the API
 * contain all fields required for accessible UI rendering:
 * - title (h3 heading text)
 * - summary (body copy)
 * - category (pill label + aria context)
 * - source (attribution text)
 *
 * This prevents regressions where missing fields would cause blank headings,
 * empty labels, or unlabelled interactive elements in the frontend.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: {},
      cookies: {},
    } as any,
    res: {
      setHeader: () => {},
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
}

describe("a11y: feed item data integrity", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    caller = appRouter.createCaller(createPublicContext());
  });

  it("feed items have non-empty title for heading text", async () => {
    const items = await caller.feed.getItems({ date: undefined });
    if (items.length === 0) return; // empty feed is valid
    for (const item of items) {
      expect(item.title, `Feed item id=${item.id} must have a title`).toBeTruthy();
      expect(typeof item.title).toBe("string");
      expect(item.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("feed items have non-empty summary for body copy", async () => {
    const items = await caller.feed.getItems({ date: undefined });
    if (items.length === 0) return;
    for (const item of items) {
      expect(item.summary, `Feed item id=${item.id} must have a summary`).toBeTruthy();
      expect(typeof item.summary).toBe("string");
      expect(item.summary.trim().length).toBeGreaterThan(0);
    }
  });

  it("feed items have non-empty category for pill label and aria context", async () => {
    const items = await caller.feed.getItems({ date: undefined });
    if (items.length === 0) return;
    for (const item of items) {
      expect(item.category, `Feed item id=${item.id} must have a category`).toBeTruthy();
      expect(typeof item.category).toBe("string");
      expect(item.category.trim().length).toBeGreaterThan(0);
    }
  });

  it("feed items have non-empty source for attribution text", async () => {
    const items = await caller.feed.getItems({ date: undefined });
    if (items.length === 0) return;
    for (const item of items) {
      expect(item.source, `Feed item id=${item.id} must have a source`).toBeTruthy();
      expect(typeof item.source).toBe("string");
      expect(item.source.trim().length).toBeGreaterThan(0);
    }
  });

  it("editions have non-empty title for heading text", async () => {
    const editions = await caller.editions.list();
    if (editions.length === 0) return;
    for (const ed of editions) {
      expect(ed.title, `Edition id=${ed.id} must have a title`).toBeTruthy();
      expect(typeof ed.title).toBe("string");
      expect(ed.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("editions have a valid editionNumber for labelling", async () => {
    const editions = await caller.editions.list();
    if (editions.length === 0) return;
    for (const ed of editions) {
      expect(typeof ed.editionNumber).toBe("number");
      expect(ed.editionNumber).toBeGreaterThan(0);
    }
  });
});
