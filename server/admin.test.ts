import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("admin router", () => {
  it("admin.stats is accessible to admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.admin.stats();
    // Stats may be null if DB unavailable, but should not throw for admin
    if (stats === null) return;
    expect(stats).toHaveProperty("totalFeedItems");
    expect(stats).toHaveProperty("totalEditions");
    expect(stats).toHaveProperty("categoryCounts");
    expect(stats).toHaveProperty("lastDailyPosted");
    expect(stats).toHaveProperty("lastWeeklyPosted");
    expect(stats).toHaveProperty("recentFeedDates");
    expect(stats).toHaveProperty("recentEditions");
    expect(Array.isArray(stats.recentFeedDates)).toBe(true);
    expect(Array.isArray(stats.recentEditions)).toBe(true);
    expect(typeof stats.categoryCounts).toBe("object");
  });

  it("admin.stats is forbidden for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin.stats is forbidden for non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow("Forbidden");
  });

  it("SCHEDULED_API_KEY environment variable is set", () => {
    const key = process.env.SCHEDULED_API_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(10);
  });
});
