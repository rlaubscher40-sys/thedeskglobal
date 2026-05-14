import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash,
  Search,
  Loader2,
  Inbox,
  ArrowLeft,
  BookOpen,
  Newspaper,
  Bookmark,
  BookmarkCheck,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ACCENT: Record<string, string> = {
  MACRO:    "rgba(245,166,35,0.8)",
  PROPERTY: "rgba(52,211,153,0.8)",
  TECH:     "rgba(96,165,250,0.8)",
  AI:       "rgba(96,165,250,0.8)",
  POLICY:   "rgba(167,139,250,0.8)",
  SCIENCE:  "rgba(251,113,133,0.8)",
  MARKETS:  "rgba(251,146,60,0.8)",
};
const CATEGORY_BG: Record<string, string> = {
  MACRO:    "rgba(245,166,35,0.06)",
  PROPERTY: "rgba(52,211,153,0.06)",
  TECH:     "rgba(96,165,250,0.06)",
  AI:       "rgba(96,165,250,0.06)",
  POLICY:   "rgba(167,139,250,0.06)",
  SCIENCE:  "rgba(251,113,133,0.06)",
  MARKETS:  "rgba(251,146,60,0.06)",
};
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  AI:       "Artificial intelligence, machine learning, and automation",
  TECH:     "Technology trends, platforms, and digital infrastructure",
  MACRO:    "Macroeconomic indicators, central bank policy, and global trends",
  PROPERTY: "Housing markets, construction, affordability, and real estate data",
  POLICY:   "Government policy, regulation, defence, and public spending",
  SCIENCE:  "Scientific breakthroughs, research, and innovation",
  MARKETS:  "Equity markets, commodities, and financial instruments",
};
const CATEGORY_PILL: Record<string, string> = {
  MACRO:    "text-amber-400 bg-amber-500/10 border-amber-500/25",
  PROPERTY: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  TECH:     "text-blue-400 bg-blue-500/10 border-blue-500/25",
  AI:       "text-blue-400 bg-blue-500/10 border-blue-500/25",
  POLICY:   "text-purple-400 bg-purple-500/10 border-purple-500/25",
  SCIENCE:  "text-rose-400 bg-rose-500/10 border-rose-500/25",
  MARKETS:  "text-orange-400 bg-orange-500/10 border-orange-500/25",
};
const ALL_CATEGORIES = ["PROPERTY", "MACRO", "MARKETS", "AI", "POLICY", "SCIENCE", "TECH"];

function getCatAccent(cat: string) {
  return CATEGORY_ACCENT[cat?.toUpperCase()] || "rgba(245,238,220,0.4)";
}
function getCatPill(cat: string) {
  return CATEGORY_PILL[cat?.toUpperCase()] || "text-white/40 bg-white/[0.04] border-white/[0.08]";
}

// ─── Feed item card (search results) ─────────────────────────────────────────

function FeedItemCard({ item, i }: { item: any; i: number }) {
  const accent = getCatAccent(item.category || "");
  return (
    <Link href={`/story/${item.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        style={{
          padding: "16px 20px",
          background: "oklch(0.135 0.018 260 / 0.9)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderLeft: `3px solid ${accent}`,
          borderRadius: "10px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
          cursor: "pointer",
          transition: "box-shadow 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span className={`inline-flex items-center px-2 py-0.5 text-[8px] font-mono tracking-[0.15em] uppercase border rounded-full ${getCatPill(item.category)}`}>
            {item.category}
          </span>
          {item.source && (
            <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,238,220,0.28)" }}>
              {item.source}
            </span>
          )}
          {item.publishedAt && (
            <span className="font-mono ml-auto" style={{ fontSize: "9px", color: "rgba(245,238,220,0.2)" }}>
              {new Date(item.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.88)", marginBottom: "6px", lineHeight: 1.35 }}>
          {item.title}
        </h4>
        <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.42)", lineHeight: 1.6 }}>
          {item.summary}
        </p>
      </motion.div>
    </Link>
  );
}

// ─── Category thread (drill-down) ────────────────────────────────────────────

function CategoryThread({ category, onBack }: { category: string; onBack: () => void }) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.topics.getByCategory.useQuery({ category });
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());
  const addToQueue = trpc.readingQueue.add.useMutation({
    onSuccess: (_data: any, variables: any) => {
      if (variables.feedItemId) setSavedItems(prev => new Set(prev).add(variables.feedItemId!));
      toast.success("Saved to Reading Queue");
    },
    onError: () => toast.error("Failed to add to queue"),
  });
  const handleBookmark = (itemId: number) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (savedItems.has(itemId)) return;
    addToQueue.mutate({ feedItemId: itemId });
  };

  const accent = CATEGORY_ACCENT[category] || "rgba(245,238,220,0.5)";
  const desc = CATEGORY_DESCRIPTIONS[category] || "";
  const totalItems = (data?.feedItems?.length || 0) + (data?.editions?.length || 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Back link */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          color: "rgba(245,238,220,0.35)",
          cursor: "pointer",
          marginBottom: "20px",
          background: "none",
          border: "none",
          padding: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(245,238,220,0.65)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(245,238,220,0.35)"; }}
      >
        <ArrowLeft style={{ width: "12px", height: "12px" }} />
        All categories
      </button>

      {/* Category header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: CATEGORY_BG[category] || "rgba(255,255,255,0.05)",
            border: `1px solid ${accent.replace("0.8", "0.25")}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Hash style={{ width: "14px", height: "14px", color: accent }} />
          </div>
          <span className="font-mono uppercase tracking-[0.22em]" style={{ fontSize: "8px", fontWeight: 700, color: accent.replace("0.8", "0.65") }}>
            Category Thread
          </span>
        </div>
        <h1 className="font-serif font-bold" style={{ fontSize: "clamp(22px, 4vw, 30px)", letterSpacing: "-0.02em", lineHeight: 1.15, color: "rgba(245,238,220,0.95)", marginBottom: "8px" }}>
          {category}
        </h1>
        {desc && <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.42)", lineHeight: 1.6, marginBottom: "6px" }}>{desc}</p>}
        {!isLoading && (
          <p className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.25)" }}>
            {totalItems} item{totalItems !== 1 ? "s" : ""} across editions and daily feeds
          </p>
        )}
        <div style={{ height: "1px", background: `linear-gradient(90deg, ${accent.replace("0.8", "0.4")} 0%, ${accent.replace("0.8", "0.08")} 40%, transparent 80%)`, marginTop: "18px" }} />
      </div>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 style={{ width: "18px", height: "18px", color: "rgba(245,166,35,0.7)" }} className="animate-spin" />
        </div>
      )}

      {!isLoading && totalItems === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", background: "oklch(0.135 0.018 260 / 0.7)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "12px" }}>
          <Inbox style={{ width: "36px", height: "36px", color: "rgba(245,238,220,0.2)", marginBottom: "14px" }} />
          <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.6)", marginBottom: "6px" }}>No items in {category} yet</p>
          <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.3)" }}>Check back after the next daily briefing.</p>
        </div>
      )}

      {!isLoading && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Edition topics */}
          {data.editions.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <BookOpen style={{ width: "12px", height: "12px", color: "rgba(245,166,35,0.5)" }} />
                <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                  Weekly Editions ({data.editions.length})
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.editions.map((edition: any, i: number) => (
                  <Link key={`ed-${edition.id}`} href="/editions">
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ padding: "16px 20px", background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid rgba(245,166,35,0.5)", borderRadius: "10px", boxShadow: "0 2px 16px rgba(0,0,0,0.4)", cursor: "pointer", transition: "box-shadow 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,166,35,0.7)", fontWeight: 700, letterSpacing: "0.1em" }}>
                          Edition #{String(edition.editionNumber).padStart(2, "0")}
                        </span>
                        <span style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.1)" }} />
                        <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)" }}>{edition.weekRange}</span>
                      </div>
                      <h4 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.88)", marginBottom: "4px" }}>
                        Week of {edition.weekOf?.replace(/^week of /i, "")}
                      </h4>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* Feed items */}
          {data.feedItems.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Newspaper style={{ width: "12px", height: "12px", color: "rgba(245,166,35,0.5)" }} />
                <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                  Daily Feed ({data.feedItems.length})
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.feedItems.map((item: any, i: number) => {
                  const isSaved = savedItems.has(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ padding: "16px 20px", background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${accent}`, borderRadius: "10px", boxShadow: "0 2px 16px rgba(0,0,0,0.4)", transition: "box-shadow 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            {item.source && (
                              <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,238,220,0.28)" }}>{item.source}</span>
                            )}
                            {item.publishedAt && (
                              <span className="font-mono ml-auto" style={{ fontSize: "9px", color: "rgba(245,238,220,0.2)" }}>
                                {new Date(item.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                          <Link href={`/story/${item.id}`}>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.88)", marginBottom: "6px", lineHeight: 1.35, cursor: "pointer" }}>
                              {item.title}
                            </h4>
                          </Link>
                          <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.42)", lineHeight: 1.6 }}>{item.summary}</p>
                        </div>
                        <button
                          onClick={() => handleBookmark(item.id)}
                          style={{ background: "none", border: "none", cursor: isSaved ? "default" : "pointer", padding: "4px", flexShrink: 0, color: isSaved ? accent : "rgba(245,238,220,0.2)", transition: "color 0.15s" }}
                          onMouseEnter={e => { if (!isSaved) (e.currentTarget as HTMLElement).style.color = "rgba(245,238,220,0.5)"; }}
                          onMouseLeave={e => { if (!isSaved) (e.currentTarget as HTMLElement).style.color = "rgba(245,238,220,0.2)"; }}
                          title={isSaved ? "Saved" : "Save to Reading Queue"}
                        >
                          {isSaved ? <BookmarkCheck style={{ width: "14px", height: "14px" }} /> : <Bookmark style={{ width: "14px", height: "14px" }} />}
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
    </motion.div>
  );
}

// ─── Category grid ────────────────────────────────────────────────────────────

function CategoryGrid({
  onSelectCategory,
  itemCounts,
  recentByCategory,
}: {
  onSelectCategory: (cat: string) => void;
  itemCounts: Record<string, { daily: number; weekly: number; total: number }>;
  recentByCategory: Record<string, any[]>;
}) {
  // Determine trending category
  const trendingCat = useMemo(() => {
    let max = 0; let best = "";
    for (const [cat, counts] of Object.entries(itemCounts)) {
      if (counts.weekly > max) { max = counts.weekly; best = cat; }
    }
    return best;
  }, [itemCounts]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ALL_CATEGORIES.map((cat, i) => {
        const accent = CATEGORY_ACCENT[cat] || "rgba(245,238,220,0.4)";
        const bg = CATEGORY_BG[cat] || "rgba(255,255,255,0.04)";
        const desc = CATEGORY_DESCRIPTIONS[cat] || "";
        const counts = itemCounts[cat];
        const recentItems = recentByCategory[cat] || [];
        const isTrending = cat === trendingCat && counts?.weekly > 0;

        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -3, boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px ${accent.replace("0.8", "0.3")}` }}
            onClick={() => onSelectCategory(cat)}
            style={{
              background: "oklch(0.135 0.018 260 / 0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: `3px solid ${accent}`,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {isTrending && (
              <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: accent.replace("0.8", "0.12"), border: `1px solid ${accent.replace("0.8", "0.3")}`, borderRadius: "20px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: accent, animation: "pulse 2s infinite" }} />
                <span className="font-mono uppercase" style={{ fontSize: "7px", fontWeight: 700, color: accent, letterSpacing: "0.1em" }}>Trending</span>
              </div>
            )}
            <div style={{ padding: "16px 18px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: bg, border: `1px solid ${accent.replace("0.8", "0.2")}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Hash style={{ width: "11px", height: "11px", color: accent }} />
                </div>
                <span className="font-mono uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 700, color: accent }}>{cat}</span>
              </div>
              {desc && <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.38)", lineHeight: 1.5 }}>{desc}</p>}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 14px 10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "10px", color: accent, opacity: 0.6 }}>View thread →</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Explore page ────────────────────────────────────────────────────────

export default function ExplorePage() {
  // Route matching: /explore/:category
  const [matchCategory, params] = useRoute("/explore/:category");
  const [, setLocation] = useLocation();
  const routeCategory = matchCategory ? params?.category?.toUpperCase() || null : null;

  const [activeCategory, setActiveCategory] = useState<string | null>(routeCategory);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync route -> state
  useEffect(() => {
    setActiveCategory(routeCategory);
  }, [routeCategory]);

  // Data
  const { data: itemCounts } = trpc.topics.categoryItemCounts.useQuery();
  const { data: recentByCategory } = trpc.topics.recentByCategory.useQuery();
  const { data: searchResults, isLoading: searchLoading } = trpc.search.all.useQuery(
    { query: submittedQuery },
    { enabled: submittedQuery.length > 0 }
  );
  const { data: recentItems, isLoading: browseLoading } = trpc.feed.getItems.useQuery(
    undefined,
    { enabled: submittedQuery.length === 0 && !activeCategory }
  );

  const countMap = useMemo(() => {
    const m: Record<string, { daily: number; weekly: number; total: number }> = {};
    for (const row of itemCounts ?? []) m[row.category.toUpperCase()] = row;
    return m;
  }, [itemCounts]);

  const recentMap = useMemo(() => {
    const m: Record<string, any[]> = {};
    if (recentByCategory) {
      for (const [cat, items] of Object.entries(recentByCategory)) {
        m[cat.toUpperCase()] = items as any[];
      }
    }
    return m;
  }, [recentByCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmittedQuery(query.trim());
      setActiveCategory(null);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSubmittedQuery("");
    inputRef.current?.focus();
  };

  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    setSubmittedQuery("");
    setQuery("");
    setLocation(`/explore/${cat.toLowerCase()}`);
  };

  const handleBack = () => {
    setActiveCategory(null);
    setLocation("/explore");
  };

  // Search results filtered by active category
  const filteredSearch = useMemo(() => {
    if (!searchResults) return null;
    return {
      editions: searchResults.editions,
      feedItems: searchResults.feedItems,
    };
  }, [searchResults]);

  const isSearchMode = submittedQuery.length > 0;
  const totalResults = filteredSearch
    ? filteredSearch.editions.length + filteredSearch.feedItems.length
    : 0;
  const isLoading = isSearchMode ? searchLoading : browseLoading;

  return (
    <div className="max-w-4xl">
      {/* Page header */}
      <div className="mb-7">
        <p className="font-mono uppercase tracking-[0.22em] mb-3" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.6)" }}>
          Explore
        </p>
        <h1 className="font-serif font-bold tracking-tight mb-3" style={{ fontSize: "clamp(24px, 4vw, 32px)", letterSpacing: "-0.02em", color: "rgba(245,238,220,0.97)", lineHeight: 1.15 }}>
          {activeCategory ? activeCategory : "Explore The Desk"}
        </h1>
        {!activeCategory && (
          <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.38)", lineHeight: 1.6 }}>
            Browse by category or search across all editions and daily briefings.
          </p>
        )}
        <div style={{ marginTop: "18px", height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, rgba(245,166,35,0.08) 40%, transparent 80%)" }} />
      </div>

      {/* Search bar — always visible unless drilling into a category */}
      {!activeCategory && (
        <form onSubmit={handleSearch} className="mb-7">
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "rgba(245,238,220,0.3)", pointerEvents: "none" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search topics, data points, talking points..."
              style={{
                width: "100%",
                padding: "13px 48px 13px 46px",
                background: "oklch(0.135 0.018 260 / 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                color: "rgba(245,238,220,0.9)",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
              }}
              onFocus={e => {
                e.target.style.borderColor = "rgba(245,166,35,0.4)";
                e.target.style.boxShadow = "0 0 0 3px rgba(245,166,35,0.08), 0 2px 16px rgba(0,0,0,0.3)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "0 2px 16px rgba(0,0,0,0.3)";
              }}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(245,238,220,0.3)", padding: "4px", transition: "color 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(245,238,220,0.6)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(245,238,220,0.3)"; }}
              >
                <X style={{ width: "14px", height: "14px" }} />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Category drill-down */}
      {activeCategory && (
        <CategoryThread category={activeCategory} onBack={handleBack} />
      )}

      {/* Search results */}
      {!activeCategory && isSearchMode && (
        <AnimatePresence mode="wait">
          <motion.div key="search-results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {searchLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <Loader2 style={{ width: "18px", height: "18px", color: "rgba(245,166,35,0.7)" }} className="animate-spin" />
              </div>
            )}
            {!searchLoading && filteredSearch && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <p className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.3)" }}>
                    {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{submittedQuery}&rdquo;
                  </p>
                  <button
                    onClick={handleClear}
                    style={{ fontSize: "11px", color: "rgba(245,166,35,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Clear search
                  </button>
                </div>
                {totalResults === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px", textAlign: "center", background: "oklch(0.135 0.018 260 / 0.7)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "12px" }}>
                    <Inbox style={{ width: "36px", height: "36px", color: "rgba(245,238,220,0.2)", marginBottom: "14px" }} />
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.6)", marginBottom: "6px" }}>No results found</p>
                    <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.3)" }}>Try a different keyword or browse by category below.</p>
                  </div>
                )}
                {filteredSearch.editions.length > 0 && (
                  <div className="mb-7">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <BookOpen style={{ width: "12px", height: "12px", color: "rgba(245,166,35,0.5)" }} />
                      <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                        Weekly Editions ({filteredSearch.editions.length})
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {filteredSearch.editions.map((edition: any, i: number) => (
                        <Link key={`ed-${edition.id}`} href="/editions">
                          <motion.div
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ padding: "16px 20px", background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid rgba(245,166,35,0.5)", borderRadius: "10px", boxShadow: "0 2px 16px rgba(0,0,0,0.4)", cursor: "pointer", transition: "box-shadow 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4)"; }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                              <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,166,35,0.7)", fontWeight: 700 }}>Edition #{String(edition.editionNumber).padStart(2, "0")}</span>
                              <span style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.1)" }} />
                              <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)" }}>{edition.weekRange}</span>
                            </div>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.88)", marginBottom: "8px" }}>
                              Week of {edition.weekOf?.replace(/^week of /i, "")}
                            </h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {(edition.topics as any[])?.map((t: any, j: number) => (
                                <span key={j} className={`inline-flex items-center px-2 py-0.5 text-[8px] font-mono tracking-[0.15em] uppercase border rounded-full ${getCatPill(t.category)}`}>
                                  {t.category}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {filteredSearch.feedItems.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Newspaper style={{ width: "12px", height: "12px", color: "rgba(245,166,35,0.5)" }} />
                      <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                        Daily Feed ({filteredSearch.feedItems.length})
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {filteredSearch.feedItems.map((item: any, i: number) => (
                        <FeedItemCard key={item.id} item={item} i={i} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Default: category grid + recent browse */}
      {!activeCategory && !isSearchMode && (
        <AnimatePresence mode="wait">
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {/* Category grid */}
            <div className="mb-8">
              <p className="font-mono uppercase tracking-[0.18em] mb-5" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                Browse by category
              </p>
              <CategoryGrid
                onSelectCategory={handleSelectCategory}
                itemCounts={countMap}
                recentByCategory={recentMap}
              />
            </div>

            {/* Recent items */}
            <div>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "24px" }} />
              <p className="font-mono uppercase tracking-[0.18em] mb-5" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                Recent briefings
              </p>
              {browseLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
                  <Loader2 style={{ width: "18px", height: "18px", color: "rgba(245,166,35,0.7)" }} className="animate-spin" />
                </div>
              )}
              {!browseLoading && recentItems && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentItems.slice(0, 10).map((item: any, i: number) => (
                    <FeedItemCard key={item.id} item={item} i={i} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
