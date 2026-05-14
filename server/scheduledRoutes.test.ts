import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerScheduledRoutes } from "./scheduledRoutes";

// Mock the SDK auth to allow cookie-based tests to pass
vi.mock("./_core/sdk", () => ({
  sdk: {
    verifySession: vi.fn().mockResolvedValue({ openId: "scheduled-task", appId: "test", name: "Scheduled" }),
  },
}));

// Mock the db module
vi.mock("./db", () => ({
  createDailyFeedItems: vi.fn().mockResolvedValue(undefined),
  createEdition: vi.fn().mockResolvedValue(undefined),
  // Deduplication guard helpers -- return empty/null so tests are not blocked by dedup
  getDailyFeedItems: vi.fn().mockResolvedValue([]),
  getEditionByNumber: vi.fn().mockResolvedValue(null),
}));

const TEST_API_KEY = "test-scheduled-api-key-12345";

function createTestApp() {
  const app = express();
  app.use(express.json());
  registerScheduledRoutes(app);
  return app;
}

beforeEach(() => {
  process.env.SCHEDULED_API_KEY = TEST_API_KEY;
});

describe("API key authentication", () => {
  it("authenticates via X-Scheduled-Key header", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          { title: "Test", source: "Reuters", summary: "Summary", category: "MACRO", feedDate: "2026-04-26" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects query param ?key= auth (header-only policy)", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post(`/api/ingest/daily-feed?key=${TEST_API_KEY}`)
      .send({
        items: [
          { title: "Test", source: "Reuters", summary: "Summary", category: "MACRO", feedDate: "2026-04-26" },
        ],
      });

    // Query param auth is not accepted; only X-Scheduled-Key header is valid
    expect(res.status).toBe(401);
  });

  it("rejects wrong API key", async () => {
    const { sdk } = await import("./_core/sdk");
    vi.mocked(sdk.verifySession).mockResolvedValueOnce(null);

    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", "wrong-key")
      .send({
        items: [
          { title: "Test", source: "Reuters", summary: "Summary", category: "MACRO", feedDate: "2026-04-26" },
        ],
      });

    expect(res.status).toBe(401);
  });

  it("rejects requests with no auth at all", async () => {
    const { sdk } = await import("./_core/sdk");
    vi.mocked(sdk.verifySession).mockResolvedValueOnce(null);

    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .send({
        items: [
          { title: "Test", source: "Reuters", summary: "Summary", category: "MACRO", feedDate: "2026-04-26" },
        ],
      });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/ingest/daily-feed", () => {
  it("accepts valid feed items", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          {
            title: "Test headline",
            source: "Reuters",
            sourceUrl: "https://reuters.com/test",
            summary: "A test summary",
            category: "MACRO",
            partnerTag: "Brokers: This is a very long partner tag that explains why this matters to mortgage brokers in detail",
            sayThis: "Drop this in your next broker call",
            feedDate: "2026-04-25",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it("rejects empty items array", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("items array is required");
  });

  it("returns per-item validation errors for mixed valid/invalid items", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          { title: "Valid item", source: "Reuters", summary: "Summary", category: "MACRO", feedDate: "2026-04-25" },
          { title: "Missing fields" }, // invalid - missing source, summary, category, feedDate
          { title: "Also valid", source: "Bloomberg", summary: "Summary 2", category: "AI", feedDate: "2026-04-25" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.failed).toBe(1);
    expect(res.body.results).toBeDefined();
    expect(res.body.results[1].success).toBe(false);
    expect(res.body.results[1].field).toBe("source");
  });

  it("rejects when ALL items fail validation", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          { title: "No other fields" },
          { summary: "No title" },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("All items failed validation");
    expect(res.body.results).toHaveLength(2);
  });

  it("validates field length constraints", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          {
            title: "A".repeat(600), // exceeds 512
            source: "Reuters",
            summary: "Summary",
            category: "MACRO",
            feedDate: "2026-04-25",
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.results[0].field).toBe("title");
    expect(res.body.results[0].error).toContain("512 character limit");
  });

  it("accepts multiple items at once", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          { title: "Item 1", source: "Reuters", summary: "Summary 1", category: "AI", feedDate: "2026-04-25" },
          { title: "Item 2", source: "Bloomberg", summary: "Summary 2", category: "PROPERTY", feedDate: "2026-04-25" },
          { title: "Item 3", source: "AFR", summary: "Summary 3", category: "MACRO", feedDate: "2026-04-25" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(3);
  });

  it("uppercases category values", async () => {
    const app = createTestApp();
    const { createDailyFeedItems } = await import("./db");
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          { title: "Test", source: "Test", summary: "Test", category: "macro", feedDate: "2026-04-25" },
        ],
      });

    expect(res.status).toBe(200);
    expect(createDailyFeedItems).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ category: "MACRO" }),
      ])
    );
  });

  it("sanitizes Unicode characters in text fields", async () => {
    const app = createTestApp();
    const { createDailyFeedItems } = await import("./db");
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          {
            title: "RBA cuts rates \u2014 what it means",
            source: "AFR",
            summary: "The RBA\u2019s decision to cut rates\u2026",
            category: "MACRO",
            feedDate: "2026-04-25",
            sayThis: "Did you see the RBA\u2019s move \u2014 pretty significant for brokers",
            partnerTag: "Brokers: RBA rate cut \u2014 direct impact on borrowing capacity",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(createDailyFeedItems).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: "RBA cuts rates - what it means",
          summary: "The RBA's decision to cut rates...",
          sayThis: "Did you see the RBA's move - pretty significant for brokers",
          partnerTag: "Brokers: RBA rate cut - direct impact on borrowing capacity",
        }),
      ])
    );
  });
});

describe("POST /api/ingest/weekly-edition", () => {
  it("accepts a valid edition", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/weekly-edition")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        editionNumber: 5,
        weekOf: "14 May 2026",
        weekRange: "8 May - 14 May 2026",
        topics: [
          { title: "RBA cuts rates", summary: "The RBA cut rates by 25bp", category: "MACRO", partnerRelevance: ["Brokers"] },
        ],
        signals: ["Rate cut signals dovish pivot"],
        fullText: "Full text of the edition...",
        keyMetrics: { "Brent Crude (USD)": "95", "Sydney Clearance Rate": "45.1%" },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.editionNumber).toBe(5);
  });

  it("rejects edition missing required fields", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/weekly-edition")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({ editionNumber: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Missing required fields");
  });

  it("rejects edition with empty topics", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/weekly-edition")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        editionNumber: 5,
        weekOf: "14 May 2026",
        weekRange: "8 May - 14 May 2026",
        topics: [],
        signals: ["Test signal"],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("topics must be a non-empty array");
  });

  it("rejects edition with invalid topic objects and returns details", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/weekly-edition")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        editionNumber: 5,
        weekOf: "14 May 2026",
        weekRange: "8 May - 14 May 2026",
        topics: [{ title: "Only title" }],
        signals: ["Test signal"],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid topics");
    expect(res.body.details).toBeDefined();
    expect(res.body.details[0]).toContain("index 0");
  });

  it("generates default pdfUrl if not provided", async () => {
    const app = createTestApp();
    const { createEdition } = await import("./db");
    const res = await request(app)
      .post("/api/ingest/weekly-edition")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        editionNumber: 6,
        weekOf: "21 May 2026",
        weekRange: "15 May - 21 May 2026",
        topics: [{ title: "Test", summary: "Test", category: "AI" }],
        signals: ["Test signal"],
      });

    expect(res.status).toBe(200);
    expect(createEdition).toHaveBeenCalledWith(
      expect.objectContaining({ pdfUrl: "signal://edition/6" })
    );
  });

  it("sanitizes Unicode in edition content", async () => {
    const app = createTestApp();
    const { createEdition } = await import("./db");
    const res = await request(app)
      .post("/api/ingest/weekly-edition")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        editionNumber: 7,
        weekOf: "28 May 2026",
        weekRange: "22 May \u2013 28 May 2026",
        topics: [{ title: "RBA\u2019s pivot", summary: "The RBA\u2014in a surprise move\u2014cut rates", category: "MACRO" }],
        signals: ["Rate cut \u2014 dovish pivot"],
        fullText: "Full text with em dashes \u2014 and curly quotes \u201Clike this\u201D",
      });

    expect(res.status).toBe(200);
    expect(createEdition).toHaveBeenCalledWith(
      expect.objectContaining({
        fullText: 'Full text with em dashes - and curly quotes "like this"',
        signals: ["Rate cut - dovish pivot"],
      })
    );
  });
});

describe("DB error handling", () => {
  it("returns structured error with code and field for ER_DATA_TOO_LONG", async () => {
    const { createDailyFeedItems } = await import("./db");
    const dbError = new Error("Data too long for column 'partnerTag' at row 1");
    (dbError as any).code = "ER_DATA_TOO_LONG";
    vi.mocked(createDailyFeedItems).mockRejectedValueOnce(dbError);

    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          { title: "Test", source: "Test", summary: "Test", category: "MACRO", feedDate: "2026-04-26" },
        ],
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Data too long");
    expect(res.body.code).toBe("ER_DATA_TOO_LONG");
    expect(res.body.field).toBe("partnerTag");
  });

  it("returns structured error for incorrect string value (charset issue)", async () => {
    const { createDailyFeedItems } = await import("./db");
    const dbError = new Error("Incorrect string value: '\\xE2\\x80\\x94' for column 'source' at row 1");
    (dbError as any).code = "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD";
    vi.mocked(createDailyFeedItems).mockRejectedValueOnce(dbError);

    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/daily-feed")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        items: [
          { title: "Test", source: "Test", summary: "Test", category: "MACRO", feedDate: "2026-04-26" },
        ],
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Invalid character encoding");
    expect(res.body.code).toBe("ER_TRUNCATED_WRONG_VALUE_FOR_FIELD");
    expect(res.body.field).toBe("source");
  });

  it("returns structured error for edition DB failures", async () => {
    const { createEdition } = await import("./db");
    const dbError = new Error("Duplicate entry '5' for key 'editions.editionNumber'");
    (dbError as any).code = "ER_DUP_ENTRY";
    vi.mocked(createEdition).mockRejectedValueOnce(dbError);

    const app = createTestApp();
    const res = await request(app)
      .post("/api/ingest/weekly-edition")
      .set("X-Scheduled-Key", TEST_API_KEY)
      .send({
        editionNumber: 5,
        weekOf: "14 May 2026",
        weekRange: "8 May - 14 May 2026",
        topics: [{ title: "Test", summary: "Test", category: "MACRO" }],
        signals: ["Test signal"],
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Duplicate entry");
    expect(res.body.code).toBe("ER_DUP_ENTRY");
  });
});
