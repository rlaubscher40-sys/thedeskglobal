import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, FileText, BookOpen, Newspaper } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";

const CATEGORY_COLORS: Record<string, { pill: string; accent: string }> = {
  MACRO:               { pill: "text-amber-400 bg-amber-500/10 border-amber-500/25",    accent: "rgba(245,166,35,0.7)" },
  PROPERTY:            { pill: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", accent: "rgba(52,211,153,0.7)" },
  TECH:                { pill: "text-blue-400 bg-blue-500/10 border-blue-500/25",        accent: "rgba(96,165,250,0.7)" },
  AI:                  { pill: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",        accent: "rgba(34,211,238,0.7)" },
  POLICY:              { pill: "text-purple-400 bg-purple-500/10 border-purple-500/25",  accent: "rgba(167,139,250,0.7)" },
  SCIENCE:             { pill: "text-rose-400 bg-rose-500/10 border-rose-500/25",        accent: "rgba(251,113,133,0.7)" },
  MARKETS:             { pill: "text-orange-400 bg-orange-500/10 border-orange-500/25",  accent: "rgba(251,146,60,0.7)" },
  ECONOMICS:           { pill: "text-amber-400 bg-amber-500/10 border-amber-500/25",    accent: "rgba(245,166,35,0.7)" },
  GEOPOLITICS:         { pill: "text-red-400 bg-red-500/10 border-red-500/25",           accent: "rgba(248,113,113,0.7)" },
  CULTURE:             { pill: "text-pink-400 bg-pink-500/10 border-pink-500/25",        accent: "rgba(244,114,182,0.7)" },
  SPORT:               { pill: "text-lime-400 bg-lime-500/10 border-lime-500/25",        accent: "rgba(163,230,53,0.7)" },
  SPORTS:              { pill: "text-lime-400 bg-lime-500/10 border-lime-500/25",        accent: "rgba(163,230,53,0.7)" },
  "GLOBAL PUBLIC PULSE": { pill: "text-violet-400 bg-violet-500/10 border-violet-500/25", accent: "rgba(139,92,246,0.7)" },
  CRYPTO:              { pill: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",  accent: "rgba(250,204,21,0.7)" },
  HEALTH:              { pill: "text-teal-400 bg-teal-500/10 border-teal-500/25",        accent: "rgba(45,212,191,0.7)" },
  CLIMATE:             { pill: "text-green-400 bg-green-500/10 border-green-500/25",     accent: "rgba(74,222,128,0.7)" },
  OTHER:               { pill: "text-slate-400 bg-slate-500/10 border-slate-500/25",     accent: "rgba(148,163,184,0.7)" },
};

const TOPIC_FILTERS = [
  "ALL", "PROPERTY", "MACRO", "MARKETS", "AI", "POLICY", "SCIENCE", "TECH",
  "GEOPOLITICS", "CULTURE", "SPORT", "GLOBAL PUBLIC PULSE", "CRYPTO", "HEALTH", "CLIMATE",
];

function getCatStyle(raw: string) {
  // Preserve multi-word categories instead of splitting on space
  const key = raw?.toUpperCase() || "";
  return CATEGORY_COLORS[key] || { pill: "text-white/40 bg-white/[0.04] border-white/[0.08]", accent: "rgba(245,238,220,0.2)" };
}

function FeedItemCard({ item, i }: { item: any; i: number }) {
  const cs = getCatStyle(item.category || "");
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      style={{
        padding: "16px 20px",
        background: "oklch(0.135 0.018 260 / 0.9)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${cs.accent}`,
        borderRadius: "10px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span className={`inline-flex items-center px-2 py-0.5 text-[8px] font-mono tracking-[0.15em] uppercase border rounded-full ${cs.pill}`}>
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
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data: results, isLoading: searchLoading } = trpc.search.all.useQuery(
    { query: submittedQuery },
    { enabled: submittedQuery.length > 0 }
  );

  // Browse mode: load recent items before any search
  const { data: recentItems, isLoading: browseLoading } = trpc.feed.getItems.useQuery(
    undefined,
    { enabled: submittedQuery.length === 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmittedQuery(query.trim());
  };

  const handleClear = () => {
    setQuery("");
    setSubmittedQuery("");
  };

  // Apply category filter to search results
  const filteredResults = useMemo(() => {
    if (!results) return null;
    if (activeFilter === "ALL") return results;
    return {
      editions: results.editions.filter((e: any) =>
        (e.topics as any[])?.some((t: any) => t.category?.toUpperCase() === activeFilter)
      ),
      feedItems: results.feedItems.filter((item: any) =>
        item.category?.toUpperCase() === activeFilter
      ),
    };
  }, [results, activeFilter]);

  // Apply category filter to browse items
  const filteredBrowse = useMemo(() => {
    if (!recentItems) return [];
    if (activeFilter === "ALL") return recentItems;
    return recentItems.filter((item: any) => item.category?.toUpperCase() === activeFilter);
  }, [recentItems, activeFilter]);

  const isSearchMode = submittedQuery.length > 0;
  const totalResults = filteredResults ? filteredResults.editions.length + filteredResults.feedItems.length : 0;
  const isLoading = isSearchMode ? searchLoading : browseLoading;

  return (
    <div className="max-w-3xl">
      {/* Page header */}
      <div className="mb-8">
        <p
          className="font-mono uppercase tracking-[0.22em] mb-3"
          style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.6)" }}
        >
          Search
        </p>
        <h1
          className="font-serif font-bold tracking-tight mb-3"
          style={{ fontSize: "clamp(24px, 4vw, 32px)", letterSpacing: "-0.02em", color: "rgba(245,238,220,0.97)", lineHeight: 1.15 }}
        >
          Search The Desk
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.38)", lineHeight: 1.6 }}>
          Find any topic, data point, or talking point across all editions and daily feeds.
        </p>
        {/* Amber rule */}
        <div style={{ marginTop: "20px", height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, rgba(245,166,35,0.08) 40%, transparent 80%)" }} />
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="mb-5">
        <div style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "rgba(245,238,220,0.3)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for RBA, CoreLogic, clearance rates, oil price..."
            style={{
              width: "100%",
              paddingLeft: "44px",
              paddingRight: "16px",
              paddingTop: "13px",
              paddingBottom: "13px",
              background: "oklch(0.135 0.018 260 / 0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              fontSize: "13px",
              color: "rgba(245,238,220,0.9)",
              outline: "none",
              boxShadow: "0 2px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "rgba(245,166,35,0.3)";
              e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4), 0 0 0 3px rgba(245,166,35,0.06), inset 0 1px 0 rgba(255,255,255,0.04)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(245,238,220,0.08)";
              e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)";
            }}
          />
          {query && (
            <button
              type="submit"
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "6px 14px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "rgba(245,166,35,0.12)",
                color: "rgba(245,166,35,0.9)",
                border: "1px solid rgba(245,166,35,0.3)",
                borderRadius: "7px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Search
            </button>
          )}
        </div>
      </form>

      {/* Category filters */}
      <div
        className="flex gap-2 mb-6 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
        role="tablist"
        aria-label="Filter by category"
      >
        {TOPIC_FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          const cs = filter === "ALL" ? null : getCatStyle(filter);
          // Extract the Tailwind colour classes from the pill string for active state
          const pillClasses = cs?.pill || "";
          const textClass = pillClasses.split(" ")[0] || "text-amber-400";
          const bgClass = pillClasses.split(" ")[1] || "bg-amber-500/10";
          const borderClass = pillClasses.split(" ")[2] || "border-amber-500/25";
          return (
            <button
              key={filter}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(filter)}
              className={`flex-none transition-all duration-200 active:scale-95 ${
                isActive
                  ? filter === "ALL"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                    : `${bgClass} ${textClass} ${borderClass}`
                  : "bg-transparent text-white/35 border-white/10 hover:text-white/60 hover:border-white/20"
              }`}
              style={{
                padding: "5px 13px",
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "999px",
                border: "1px solid",
                cursor: "pointer",
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 style={{ width: "20px", height: "20px", color: "rgba(245,166,35,0.7)", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Browse mode: show recent items before any search */}
      {!isSearchMode && !isLoading && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-mono uppercase tracking-[0.18em] mb-4" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
              {activeFilter === "ALL" ? "Recent signals" : `${activeFilter} signals`}
              {filteredBrowse.length > 0 && ` — ${filteredBrowse.length} item${filteredBrowse.length !== 1 ? "s" : ""}`}
            </p>
            {filteredBrowse.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.3)" }}>No items in {activeFilter} yet.</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredBrowse.slice(0, 30).map((item: any, i: number) => (
                <FeedItemCard key={item.id} item={item} i={i} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* No results */}
      {isSearchMode && !isLoading && filteredResults && totalResults === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", textAlign: "center" }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <FileText style={{ width: "22px", height: "22px", color: "rgba(245,238,220,0.2)" }} />
          </div>
          <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.45)", marginBottom: "6px" }}>
            No results for "{submittedQuery}"
          </p>
          <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.25)" }}>
            Try different keywords or remove the category filter.
          </p>
        </motion.div>
      )}

      {/* Search Results */}
      <AnimatePresence>
        {isSearchMode && !isLoading && filteredResults && totalResults > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p
              className="font-mono uppercase tracking-[0.18em] mb-5"
              style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}
            >
              {totalResults} result{totalResults !== 1 ? "s" : ""} for "{submittedQuery}"
              {activeFilter !== "ALL" && ` in ${activeFilter}`}
            </p>

            {/* Edition results */}
            {filteredResults.editions.length > 0 && (
              <div className="mb-7">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <BookOpen style={{ width: "12px", height: "12px", color: "rgba(245,166,35,0.5)" }} />
                  <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                    Weekly Editions ({filteredResults.editions.length})
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {filteredResults.editions.map((edition: any, i: number) => (
                    <motion.div
                      key={`edition-${edition.id}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        padding: "16px 20px",
                        background: "oklch(0.135 0.018 260 / 0.9)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderLeft: "3px solid rgba(245,166,35,0.5)",
                        borderRadius: "10px",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
                        cursor: "pointer",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)";
                        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "rgba(245,238,220,0.07)";
                        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.4)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,166,35,0.7)", fontWeight: 700, letterSpacing: "0.1em" }}>
                          Edition #{String(edition.editionNumber).padStart(2, "0")}
                        </span>
                        <span style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.1)" }} />
                        <span className="font-mono" style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)" }}>
                          {edition.weekRange}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(245,238,220,0.88)", marginBottom: "8px" }}>
                        Week of {edition.weekOf?.replace(/^week of /i, '')}
                      </h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(edition.topics as any[])?.map((t: any, j: number) => {
                          const cs = getCatStyle(t.category || "");
                          return (
                            <Link key={j} href={`/topics/${(t.category || "").toLowerCase()}`}>
                              <span className={`inline-flex items-center px-2 py-0.5 text-[8px] font-mono tracking-[0.15em] uppercase border rounded-full cursor-pointer hover:opacity-80 transition-opacity ${cs.pill}`}>
                                {t.category}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed item results */}
            {filteredResults.feedItems.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Newspaper style={{ width: "12px", height: "12px", color: "rgba(245,166,35,0.5)" }} />
                  <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                    Daily Feed ({filteredResults.feedItems.length})
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {filteredResults.feedItems.map((item: any, i: number) => (
                    <FeedItemCard key={item.id} item={item} i={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
