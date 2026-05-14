import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  Hash,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Inbox,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { toast } from "sonner";
import { TopicsIllustration } from "@/components/PageIllustrations";

const CATEGORY_ACCENT: Record<string, string> = {
  MACRO:               "rgba(245,166,35,0.8)",
  PROPERTY:            "rgba(52,211,153,0.8)",
  TECH:                "rgba(96,165,250,0.8)",
  AI:                  "rgba(34,211,238,0.8)",
  POLICY:              "rgba(167,139,250,0.8)",
  SCIENCE:             "rgba(251,113,133,0.8)",
  MARKETS:             "rgba(251,146,60,0.8)",
  ECONOMICS:           "rgba(245,166,35,0.8)",
  GEOPOLITICS:         "rgba(248,113,113,0.8)",
  CULTURE:             "rgba(244,114,182,0.8)",
  SPORT:               "rgba(163,230,53,0.8)",
  SPORTS:              "rgba(163,230,53,0.8)",
  "GLOBAL PUBLIC PULSE": "rgba(139,92,246,0.8)",
  CRYPTO:              "rgba(250,204,21,0.8)",
  HEALTH:              "rgba(45,212,191,0.8)",
  CLIMATE:             "rgba(74,222,128,0.8)",
  OTHER:               "rgba(148,163,184,0.8)",
};

const CATEGORY_BG: Record<string, string> = {
  MACRO:               "rgba(245,166,35,0.06)",
  PROPERTY:            "rgba(52,211,153,0.06)",
  TECH:                "rgba(96,165,250,0.06)",
  AI:                  "rgba(34,211,238,0.06)",
  POLICY:              "rgba(167,139,250,0.06)",
  SCIENCE:             "rgba(251,113,133,0.06)",
  MARKETS:             "rgba(251,146,60,0.06)",
  ECONOMICS:           "rgba(245,166,35,0.06)",
  GEOPOLITICS:         "rgba(248,113,113,0.06)",
  CULTURE:             "rgba(244,114,182,0.06)",
  SPORT:               "rgba(163,230,53,0.06)",
  SPORTS:              "rgba(163,230,53,0.06)",
  "GLOBAL PUBLIC PULSE": "rgba(139,92,246,0.06)",
  CRYPTO:              "rgba(250,204,21,0.06)",
  HEALTH:              "rgba(45,212,191,0.06)",
  CLIMATE:             "rgba(74,222,128,0.06)",
  OTHER:               "rgba(148,163,184,0.06)",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  AI:                  "Artificial intelligence, machine learning, and automation",
  TECH:                "Technology trends, platforms, and digital infrastructure",
  MACRO:               "Macroeconomic indicators, central bank policy, and global trends",
  PROPERTY:            "Housing markets, construction, affordability, and real estate data",
  POLICY:              "Government policy, regulation, defence, and public spending",
  SCIENCE:             "Scientific breakthroughs, research, and innovation",
  MARKETS:             "Equity markets, commodities, and financial instruments",
  ECONOMICS:           "Economic analysis, GDP, employment, and fiscal policy",
  GEOPOLITICS:         "International relations, conflict, diplomacy, and global power",
  CULTURE:             "Arts, entertainment, media, and cultural moments",
  SPORT:               "International sport, major events, and athlete news",
  SPORTS:              "International sport, major events, and athlete news",
  "GLOBAL PUBLIC PULSE": "What the world is talking about -- Reddit, X, and viral moments",
  CRYPTO:              "Cryptocurrency, blockchain, and digital assets",
  HEALTH:              "Public health, medicine, and wellness trends",
  CLIMATE:             "Climate events, natural disasters, and environmental news",
  OTHER:               "Stories that don't fit neatly into a single category",
};

const ALL_CATEGORIES = [
  "PROPERTY", "MACRO", "MARKETS", "AI", "POLICY", "SCIENCE", "TECH",
  "GEOPOLITICS", "CULTURE", "SPORT", "GLOBAL PUBLIC PULSE", "CRYPTO", "HEALTH", "CLIMATE", "OTHER",
];

export default function TopicThreads() {
  const [, params] = useRoute("/topics/:category");
  const category = params?.category?.toUpperCase() || null;

  if (!category) return <CategoryIndex />;
  return <CategoryThread category={category} />;
}

function CategoryIndex() {
  const { data: categories, isLoading } = trpc.topics.categories.useQuery();
  const { data: itemCounts } = trpc.topics.categoryItemCounts.useQuery();
  const { data: recentByCategory } = trpc.topics.recentByCategory.useQuery();

  const countMap = useMemo(() => {
    const m: Record<string, { daily: number; weekly: number; total: number }> = {};
    for (const row of itemCounts ?? []) m[row.category.toUpperCase()] = row;
    return m;
  }, [itemCounts]);

  const allCats = useMemo(() => {
    const dbCats = (categories || []).map((c: string) => c.toUpperCase());
    const merged = new Set([...ALL_CATEGORIES, ...dbCats]);
    return Array.from(merged).sort();
  }, [categories]);

  // Determine "trending" category: highest weekly count
  const trendingCat = useMemo(() => {
    if (!itemCounts || itemCounts.length === 0) return null;
    return [...itemCounts].sort((a, b) => (b.weekly || 0) - (a.weekly || 0))[0]?.category?.toUpperCase() || null;
  }, [itemCounts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: "900px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, opacity: 0.5, pointerEvents: "none" }} aria-hidden="true">
          <TopicsIllustration />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Hash style={{ width: "14px", height: "14px", color: "rgba(245,166,35,0.85)" }} />
          </div>
          <span className="font-mono uppercase tracking-[0.22em]" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.65)" }}>Topic Threads</span>
        </div>
        <h1 className="font-serif font-bold" style={{ fontSize: "clamp(22px, 4vw, 30px)", letterSpacing: "-0.02em", lineHeight: 1.15, color: "rgba(245,238,220,0.95)", marginBottom: "8px" }}>
          Intelligence by Category
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(245,238,220,0.58)", lineHeight: 1.65, maxWidth: "480px" }}>
          Each category threads every edition and daily item over time. Click to open a full thread.
        </p>
        <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, rgba(245,166,35,0.08) 40%, transparent 80%)", marginTop: "18px" }} />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 style={{ width: "18px", height: "18px", color: "rgba(245,166,35,0.7)" }} className="animate-spin" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {allCats.map((cat, i) => {
            const accent = CATEGORY_ACCENT[cat] || "rgba(245,238,220,0.5)";
            const bg = CATEGORY_BG[cat] || "rgba(245,238,220,0.03)";
            const desc = CATEGORY_DESCRIPTIONS[cat] || "";
            const counts = countMap[cat];
            const isTrending = cat === trendingCat;
            const recentItems = (recentByCategory?.[cat] || []).slice(0, 3);
            return (
              <Link key={cat} href={`/topics/${cat.toLowerCase()}`}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -3, boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px ${accent.replace("0.8", "0.3")}` }}
                  style={{
                    padding: "0",
                    background: "oklch(0.135 0.018 260 / 0.9)",
                    border: `1px solid rgba(255,255,255,0.07)`,
                    borderTop: `3px solid ${accent}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* Trending badge */}
                  {isTrending && (
                    <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: accent.replace("0.8", "0.12"), border: `1px solid ${accent.replace("0.8", "0.3")}`, borderRadius: "20px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: accent, animation: "pulse 2s infinite" }} />
                      <span className="font-mono uppercase" style={{ fontSize: "7px", fontWeight: 700, color: accent, letterSpacing: "0.1em" }}>Trending</span>
                    </div>
                  )}

                  {/* Card header */}
                  <div style={{ padding: "16px 18px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: bg, border: `1px solid ${accent.replace("0.8", "0.2")}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Hash style={{ width: "11px", height: "11px", color: accent }} />
                      </div>
                      <span className="font-mono uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 700, color: accent }}>{cat}</span>
                    </div>
                    {desc && (
                      <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.38)", lineHeight: 1.5 }}>{desc}</p>
                    )}
                    {counts && (
                      <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                        {counts.total > 0 && (
                          <span className="font-mono" style={{ fontSize: "9px", color: accent, background: bg, border: `1px solid ${accent.replace("0.8", "0.15")}`, borderRadius: "4px", padding: "2px 7px" }}>
                            {counts.total} items
                          </span>
                        )}
                        {counts.weekly > 0 && (
                          <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,238,220,0.4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", padding: "2px 7px" }}>
                            {counts.weekly} this week
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recent items preview */}
                  {recentItems.length > 0 && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "10px 18px 14px" }}>
                      <p className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: "7px", color: "rgba(245,238,220,0.25)", fontWeight: 700, marginBottom: "8px" }}>Recent</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {recentItems.map((item: any) => (
                          <div key={item.id} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: accent, marginTop: "5px", flexShrink: 0 }} />
                            <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.55)", lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const }}>
                              {item.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer arrow */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 14px 10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "10px", color: accent, opacity: 0.6 }}>View thread →</span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function CategoryThread({ category }: { category: string }) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.topics.getByCategory.useQuery({ category });
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());

  const addToQueue = trpc.readingQueue.add.useMutation({
    onSuccess: (_data: any, variables: any) => {
      if (variables.feedItemId) {
        setSavedItems((prev) => new Set(prev).add(variables.feedItemId!));
      }
      toast.success("Saved to Reading Queue");
    },
    onError: () => toast.error("Failed to add to queue"),
  });

  const handleBookmark = (itemId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (savedItems.has(itemId)) return;
    addToQueue.mutate({ feedItemId: itemId });
  };

  const accent = CATEGORY_ACCENT[category] || "rgba(245,238,220,0.5)";
  const desc = CATEGORY_DESCRIPTIONS[category] || "";
  const totalItems = (data?.feedItems?.length || 0) + (data?.editions?.length || 0);
  const editionCount = data?.editions?.length ?? 0;
  const feedCount = data?.feedItems?.length ?? 0;
  const relatedCategories = Object.keys(CATEGORY_ACCENT).filter((c) => c !== category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-8 items-start"
    >
      {/* Main content column */}
      <div className="flex-1 min-w-0">
      {/* Back link */}
      <Link href="/topics">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: "rgba(245,238,220,0.35)",
            cursor: "pointer",
            marginBottom: "20px",
            transition: "color 0.15s",
          }}
        >
          <ArrowLeft style={{ width: "12px", height: "12px" }} />
          All categories
        </div>
      </Link>

      {/* Premium page header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: CATEGORY_BG[category] || "rgba(255,255,255,0.05)",
              border: `1px solid ${accent.replace("0.8", "0.25")}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Hash style={{ width: "14px", height: "14px", color: accent }} />
          </div>
          <span
            className="font-mono uppercase tracking-[0.22em]"
            style={{ fontSize: "8px", fontWeight: 700, color: accent.replace("0.8", "0.65") }}
          >
            Topic Thread
          </span>
        </div>
        <h1
          className="font-serif font-bold"
          style={{
            fontSize: "clamp(22px, 4vw, 30px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            color: "rgba(245,238,220,0.95)",
            marginBottom: "8px",
          }}
        >
          {category}
        </h1>
        {desc && (
          <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.42)", lineHeight: 1.6, marginBottom: "6px" }}>
            {desc}
          </p>
        )}
        {!isLoading && (
          <p className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.25)" }}>
            {totalItems} item{totalItems !== 1 ? "s" : ""} across editions and daily feeds
          </p>
        )}
        <div
          style={{
            height: "1px",
            background: `linear-gradient(90deg, ${accent.replace("0.8", "0.4")} 0%, ${accent.replace("0.8", "0.08")} 40%, transparent 80%)`,
            marginTop: "18px",
          }}
        />
      </div>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 style={{ width: "18px", height: "18px", color: "rgba(245,166,35,0.7)" }} className="animate-spin" />
        </div>
      )}

      {!isLoading && totalItems === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            textAlign: "center",
            background: "oklch(0.135 0.018 260 / 0.7)",
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: "12px",
          }}
        >
          <Inbox style={{ width: "36px", height: "36px", color: "rgba(245,238,220,0.2)", marginBottom: "14px" }} />
          <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.6)", marginBottom: "6px" }}>
            No items in {category} yet
          </p>
          <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.3)", lineHeight: 1.6, maxWidth: "300px" }}>
            Items will appear here as daily scans and weekly editions cover this category.
          </p>
        </div>
      )}

      {!isLoading && data && (
        <div>
          {/* Edition matches */}
          {data.editions.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <p
                className="font-mono uppercase tracking-[0.2em]"
                style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginBottom: "10px" }}
              >
                Weekly Editions ({data.editions.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.editions.map((edition: any, i: number) => {
                  const matchingTopics = (edition.topics as any[])?.filter(
                    (t: any) => t.category?.toUpperCase() === category
                  ) || [];
                  return (
                    <motion.div
                      key={edition.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href="/editions">
                        <div
                          style={{
                            padding: "16px 18px",
                            background: "oklch(0.135 0.018 260 / 0.9)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderLeft: "3px solid rgba(245,166,35,0.4)",
                            borderRadius: "10px",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
                            cursor: "pointer",
                            transition: "border-color 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                            <BookOpen style={{ width: "12px", height: "12px", color: "rgba(245,166,35,0.6)" }} />
                            <span className="font-mono" style={{ fontSize: "10px", color: "rgba(245,166,35,0.6)" }}>
                              Edition #{String(edition.editionNumber).padStart(2, "0")}
                            </span>
                            <span style={{ color: "rgba(245,238,220,0.2)", fontSize: "10px" }}>|</span>
                            <span className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.3)" }}>
                              {edition.weekRange}
                            </span>
                          </div>
                          {matchingTopics.map((topic: any, j: number) => (
                            <div key={j} style={{ marginBottom: j < matchingTopics.length - 1 ? "10px" : 0 }}>
                              <h4 style={{ fontSize: "13px", fontWeight: 600, color: "rgba(245,238,220,0.85)", marginBottom: "4px" }}>
                                {topic.title}
                              </h4>
                              <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.4)", lineHeight: 1.6 }}>
                                {topic.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feed items */}
          {data.feedItems.length > 0 && (
            <div>
              <p
                className="font-mono uppercase tracking-[0.2em]"
                style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginBottom: "10px" }}
              >
                Daily Feed ({data.feedItems.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.feedItems.map((item: any, i: number) => {
                  const isSaved = savedItems.has(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        padding: "16px 18px",
                        background: "oklch(0.135 0.018 260 / 0.9)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderLeft: `3px solid ${accent}`,
                        borderRadius: "10px",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <span className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.3)" }}>
                              {item.feedDate}
                            </span>
                          </div>
                          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "rgba(245,238,220,0.88)", lineHeight: 1.4, marginBottom: "6px" }}>
                            {item.title}
                          </h4>
                          <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.42)", lineHeight: 1.65, marginBottom: "8px" }}>
                            {item.summary}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.28)" }}>
                              {item.source}
                            </span>
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "10px",
                                  color: "rgba(245,166,35,0.5)",
                                  textDecoration: "none",
                                  transition: "color 0.15s",
                                }}
                              >
                                <ExternalLink style={{ width: "10px", height: "10px" }} />
                                Source
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleBookmark(item.id)}
                          disabled={addToQueue.isPending && !isSaved}
                          title={isSaved ? "Saved to Reading Queue" : "Save to Reading Queue"}
                          aria-label={isSaved ? "Saved to Reading Queue" : "Save to Reading Queue"}
                          style={{
                            padding: "8px",
                            flexShrink: 0,
                            borderRadius: "8px",
                            background: isSaved ? "rgba(245,166,35,0.1)" : "transparent",
                            border: isSaved ? "1px solid rgba(245,166,35,0.3)" : "1px solid rgba(255,255,255,0.07)",
                            cursor: "pointer",
                            color: isSaved ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.3)",
                            transition: "all 0.15s",
                          }}
                        >
                          {isSaved ? (
                            <BookmarkCheck style={{ width: "16px", height: "16px" }} />
                          ) : (
                            <Bookmark style={{ width: "16px", height: "16px" }} />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </div>{/* end main content column */}

      {/* Right sidebar */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-6 space-y-4">
        {/* Category stats */}
        <div
          style={{
            padding: "20px",
            background: "oklch(0.135 0.018 260 / 0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderTop: `3px solid ${accent}`,
            borderRadius: "10px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
          }}
        >
          <p className="font-mono uppercase tracking-[0.2em]" style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginBottom: "16px" }}>Coverage Stats</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "rgba(245,238,220,0.5)" }}>Weekly Editions</span>
              <span className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: accent }}>{editionCount}</span>
            </div>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "rgba(245,238,220,0.5)" }}>Daily Feed Items</span>
              <span className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: accent }}>{feedCount}</span>
            </div>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "rgba(245,238,220,0.5)" }}>Total Items</span>
              <span className="font-mono" style={{ fontSize: "16px", fontWeight: 700, color: "rgba(245,238,220,0.9)" }}>{totalItems}</span>
            </div>
          </div>
        </div>

        {/* Category description */}
        {desc && (
          <div
            style={{
              padding: "16px 18px",
              background: "oklch(0.135 0.018 260 / 0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
            }}
          >
            <p className="font-mono uppercase tracking-[0.2em]" style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginBottom: "10px" }}>About this category</p>
            <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.55)", lineHeight: 1.65 }}>{desc}</p>
          </div>
        )}

        {/* Related categories */}
        <div
          style={{
            padding: "16px 18px",
            background: "oklch(0.135 0.018 260 / 0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
          }}
        >
          <p className="font-mono uppercase tracking-[0.2em]" style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginBottom: "12px" }}>Other Categories</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {relatedCategories.map((cat) => {
              const catAccent = CATEGORY_ACCENT[cat] || "rgba(245,238,220,0.5)";
              return (
                <Link key={cat} href={`/topics/${cat.toLowerCase()}`}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: catAccent, flexShrink: 0 }} />
                    <span className="font-mono" style={{ fontSize: "11px", fontWeight: 600, color: catAccent }}>{cat}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </motion.div>
  );
}
