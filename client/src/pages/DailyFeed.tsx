import { trpc } from "@/lib/trpc";
import { normaliseKeyMetrics, getTrendColour, getMetricTooltip } from "@/lib/normaliseKeyMetrics";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, useInView } from "framer-motion";
import {
  Newspaper,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  TrendingUp,
  TrendingDown,
  Minus,
  Hash,
  BarChart3,
  BookOpen,
  MessageSquareQuote,
  ChevronDown,
  Copy,
  Linkedin,
  Share2,
  Check,
  Zap,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { LinkedInPostModal } from "@/components/LinkedInPostModal";
import { SubscribeForm } from "@/components/SubscribeForm";
import { keepPreviousData } from "@tanstack/react-query";
import { Link } from "wouter";
import { toast } from "sonner";
import { PersonaSelector, usePersona, parsePersonaTag } from "@/components/PersonaSelector";
import { BreakingSignalToast } from "@/components/BreakingSignalToast";

const CATEGORY_COLORS: Record<string, string> = {
  MACRO: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PROPERTY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  TECH: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  POLICY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  SCIENCE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  MARKETS: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ECONOMICS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  AI: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  GEOPOLITICS: "bg-red-500/10 text-red-400 border-red-500/20",
  CULTURE: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  SPORT: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  SPORTS: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  "GLOBAL PUBLIC PULSE": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  GLOBALPUBLICPULSE: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  CRYPTO: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HEALTH: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  CLIMATE: "bg-green-500/10 text-green-400 border-green-500/20",
  OTHER: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

// Left-border accent colour per category
const CATEGORY_ACCENT: Record<string, string> = {
  MACRO: "border-l-amber-500/50",
  PROPERTY: "border-l-emerald-500/50",
  TECH: "border-l-blue-500/50",
  POLICY: "border-l-purple-500/50",
  SCIENCE: "border-l-rose-500/50",
  MARKETS: "border-l-orange-500/50",
  ECONOMICS: "border-l-amber-500/50",
  AI: "border-l-cyan-500/50",
  GEOPOLITICS: "border-l-red-500/50",
  CULTURE: "border-l-pink-500/50",
  SPORT: "border-l-lime-500/50",
  SPORTS: "border-l-lime-500/50",
  "GLOBAL PUBLIC PULSE": "border-l-violet-500/50",
  GLOBALPUBLICPULSE: "border-l-violet-500/50",
  CRYPTO: "border-l-yellow-500/50",
  HEALTH: "border-l-teal-500/50",
  CLIMATE: "border-l-green-500/50",
  OTHER: "border-l-slate-500/50",
};

// Bar colours for Today's Topics widget (matches category pills)
const CATEGORY_BAR_COLORS: Record<string, string> = {
  MACRO: "bg-amber-500/40 group-hover/topic:bg-amber-500/60",
  PROPERTY: "bg-emerald-500/40 group-hover/topic:bg-emerald-500/60",
  TECH: "bg-blue-500/40 group-hover/topic:bg-blue-500/60",
  POLICY: "bg-purple-500/40 group-hover/topic:bg-purple-500/60",
  SCIENCE: "bg-rose-500/40 group-hover/topic:bg-rose-500/60",
  MARKETS: "bg-orange-500/40 group-hover/topic:bg-orange-500/60",
  ECONOMICS: "bg-amber-500/40 group-hover/topic:bg-amber-500/60",
  AI: "bg-cyan-500/40 group-hover/topic:bg-cyan-500/60",
  GEOPOLITICS: "bg-red-500/40 group-hover/topic:bg-red-500/60",
  CULTURE: "bg-pink-500/40 group-hover/topic:bg-pink-500/60",
  SPORT: "bg-lime-500/40 group-hover/topic:bg-lime-500/60",
  SPORTS: "bg-lime-500/40 group-hover/topic:bg-lime-500/60",
  "GLOBAL PUBLIC PULSE": "bg-violet-500/40 group-hover/topic:bg-violet-500/60",
  GLOBALPUBLICPULSE: "bg-violet-500/40 group-hover/topic:bg-violet-500/60",
  CRYPTO: "bg-yellow-500/40 group-hover/topic:bg-yellow-500/60",
  HEALTH: "bg-teal-500/40 group-hover/topic:bg-teal-500/60",
  CLIMATE: "bg-green-500/40 group-hover/topic:bg-green-500/60",
  OTHER: "bg-slate-500/40 group-hover/topic:bg-slate-500/60",
};

// ─── Animated Counter ───

function AnimatedCounter({ value, duration = 800 }: { value: string | number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  const isNumeric = !isNaN(numericValue) && String(value).match(/[0-9]/);
  const prefix = isNumeric ? String(value).match(/^[^0-9-]*/)?.[0] || "" : "";
  const suffix = isNumeric ? String(value).replace(/^[^0-9-]*[0-9.,]+/, "") : "";

  useEffect(() => {
    if (!isNumeric || !ref.current) return;
    const start = 0;
    const end = numericValue;
    const startTime = performance.now();
    let rafId: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      if (ref.current) {
        const formatted = Number.isInteger(end)
          ? Math.round(current).toLocaleString()
          : current.toFixed(1);
        ref.current.textContent = prefix + formatted + suffix;
      }
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isNumeric, numericValue, prefix, suffix, duration]);

  if (!isNumeric) return <span>{value}</span>;
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

function CategoryPill({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category?.toUpperCase()] || "bg-white/10 text-white/60 border-white/20";
  return (
    <Link href={`/topics/${category.toLowerCase()}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase border rounded-full cursor-pointer hover:opacity-80 transition-opacity ${colors}`}>
        {category}
      </span>
    </Link>
  );
}

// ─── Feed Card ───

function FeedCard({
  item,
  index,
  isSaved,
  onBookmark,
  isPending,
  defaultExpanded,
  size = "compact",
}: {
  item: any;
  index: number;
  isSaved: boolean;
  onBookmark: (id: number) => void;
  isPending: boolean;
  defaultExpanded?: boolean;
  size?: "medium" | "compact";
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [copied, setCopied] = useState(false);
  const [liModalOpen, setLiModalOpen] = useState(false);
  const [liPostText, setLiPostText] = useState("");

  const handleCopyTalkingPoint = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.sayThis) return;
    navigator.clipboard.writeText(item.sayThis).then(() => {
      setCopied(true);
      toast.success("Talking point copied");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [item.sayThis]);

  const handleLinkedInShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // LinkedIn format: hook (sayThis or title), context, question, attribution
    // Single-line paragraphs, no hashtags, no em dashes, ends with a specific question
    const sayThis = (item.sayThis || item.title || '').trim();
    const category = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase() : 'Property';
    const source = item.source ? `\n\nSource: ${item.source}` : '';
    const text = `${sayThis}${source}\n\nThis is the kind of signal worth tracking if you work in property investment, financial advice, or mortgage broking.\n\nWhat are you watching in ${category} right now?\n\nLink in comments.\n\n@Arjun Paliwal @InvestorKit`;
    setLiPostText(text);
    setLiModalOpen(true);
  }, [item]);

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    // Don't expand if clicking a link or button inside
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;
    setExpanded((prev) => !prev);
  }, []);

  const accentBorder = CATEGORY_ACCENT[item.category?.toUpperCase()] || "border-l-white/10";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ delay: Math.min(index * 0.07, 0.35), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.985 }}
      className="group relative"
      data-feed-card
      data-item-id={item.id}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(245,166,35,0.04) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      <div
        className={`relative border-l-[3px] ${accentBorder} cursor-pointer transition-all duration-300`}
        style={{
          padding: size === "medium" ? "clamp(16px, 4vw, 26px) clamp(14px, 4vw, 28px)" : "clamp(14px, 3.5vw, 22px) clamp(12px, 3.5vw, 24px)",
          background: size === "medium" ? "rgba(11, 13, 24, 0.82)" : "rgba(13, 15, 26, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderLeftWidth: size === "medium" ? "4px" : "3px",
          borderRadius: size === "medium" ? "18px" : "14px",
          boxShadow: size === "medium"
            ? "0 6px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(16, 18, 32, 0.85)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.45), -4px -4px 20px rgba(245,166,35,0.04), inset 0 1px 0 rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(13, 15, 26, 0.72)";
          e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)";
        }}
        onClick={toggleExpanded}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((p) => !p); } }}
      >
        {/* Hero image strip — full width when expanded, hidden when collapsed on compact */}
        {item.imageUrl && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-xl mb-4"
            style={{ marginLeft: "-1px", marginRight: "-1px" }}
          >
            <div className="relative w-full" style={{ paddingBottom: "42%" }}>
              <img
                src={item.imageUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ borderRadius: "10px" }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, transparent 40%, rgba(8,10,20,0.85) 100%)",
                  borderRadius: "10px",
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Top row: category + bookmark */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Category */}
            <div className="mb-3">
              <CategoryPill category={item.category} />
            </div>

            {/* Title - dominant */}
            <h3
              className="font-serif group-hover:text-white transition-colors"
              style={{
                fontSize: size === "medium" ? "22px" : "17px",
                fontWeight: 700,
                lineHeight: 1.28,
                letterSpacing: size === "medium" ? "-0.03em" : "-0.022em",
                color: "rgba(240, 235, 220, 0.95)",
                marginBottom: size === "medium" ? "10px" : "7px",
              }}
            >
              {item.title}
            </h3>

            {/* Summary - secondary */}
            <p
              style={{
                fontSize: size === "medium" ? "14px" : "13px",
                lineHeight: 1.65,
                color: size === "medium" ? "rgba(245,238,220,0.58)" : "rgba(245,238,220,0.44)",
                marginBottom: size === "medium" ? "16px" : "12px",
              }}
            >
              {item.summary}
            </p>

            {/* Expandable details: Say This + Partner Tag */}
            {item.sayThis && (
              <div className="space-y-2.5">
                {/* Say This - premium glowing block */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    padding: "16px 18px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, rgba(245,166,35,0.09) 0%, rgba(245,166,35,0.04) 100%)",
                    border: "1px solid rgba(245,166,35,0.22)",
                    boxShadow: "0 0 24px rgba(245,166,35,0.06), inset 0 1px 0 rgba(245,166,35,0.15)",
                  }}
                >
                  {/* Top highlight */}
                  <div
                    className="absolute top-0 left-0 right-0"
                    style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.5), transparent)" }}
                  />
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <MessageSquareQuote className="w-3 h-3" style={{ color: "rgba(245,166,35,0.7)" }} />
                    <span
                      className="font-mono uppercase tracking-widest"
                      style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.65)" }}
                    >
                      Say This
                    </span>
                  </div>
                  <p
                    className="font-serif"
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "rgba(255, 240, 200, 0.92)",
                      fontWeight: 500,
                      marginBottom: "12px",
                      fontStyle: "italic",
                    }}
                  >
                    "{item.sayThis}"
                  </p>
                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/10">
                    <button
                      onClick={handleCopyTalkingPoint}
                      aria-label="Copy talking point to clipboard"
                      className={`inline-flex items-center gap-1 text-[10px] font-mono transition-all duration-200 ${
                        copied
                          ? "text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded"
                          : "text-amber-500/60 hover:text-amber-400"
                      }`}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleLinkedInShare}
                      aria-label="Share talking point to LinkedIn"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-500/60 hover:text-amber-400 transition-colors"
                    >
                      <Linkedin className="w-3 h-3" />
                      Share
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/story/${item.id}`;
                        navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
                      }}
                      aria-label="Copy story link to clipboard"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-500/60 hover:text-amber-400 transition-colors"
                    >
                      <Share2 className="w-3 h-3" />
                      Copy link
                    </button>
                  </div>
                </div>

                {/* Partner context - expandable */}
                {item.partnerTag && (
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                      aria-label={expanded ? "Hide partner context" : "Show partner context"}
                      aria-expanded={expanded}
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                      {expanded ? "Hide context" : "Show context"}
                    </button>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-2"
                      >
                        <p className="text-[11px] font-mono text-sky-400/80 leading-relaxed">
                          {item.partnerTag}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: thumbnail (collapsed) + bookmark */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Thumbnail - only shown when NOT expanded and image exists */}
            {item.imageUrl && !expanded && (
              <div
                className="relative overflow-hidden rounded-lg"
                style={{
                  width: size === "medium" ? "88px" : "72px",
                  height: size === "medium" ? "60px" : "50px",
                  flexShrink: 0,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, rgba(8,10,20,0.3) 0%, transparent 60%)" }}
                />
              </div>
            )}
            {/* Bookmark button */}
            <button
              onClick={(e) => { e.stopPropagation(); onBookmark(item.id); }}
              disabled={isPending && !isSaved}
              aria-label={isSaved ? "Saved to Reading Queue" : "Save to Reading Queue"}
              title={isSaved ? "Saved to Reading Queue" : "Save to Reading Queue"}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isSaved
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-muted-foreground/70 hover:text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              {isSaved ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Footer: source favicon + link */}
        <div
          className="flex flex-wrap items-center gap-3 mt-4 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Read source article from ${item.source}`}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-amber-400 transition-colors group/src"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(item.sourceUrl).hostname}&sz=16`}
                alt=""
                aria-hidden="true"
                className="w-3.5 h-3.5 rounded-sm opacity-70 group-hover/src:opacity-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span>{item.source}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/src:opacity-100 transition-opacity" />
            </a>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">{item.source}</span>
          )}
        </div>
      </div>

      {/* LinkedIn post modal */}
      <LinkedInPostModal
        open={liModalOpen}
        onClose={() => setLiModalOpen(false)}
        postText={liPostText}
        label="Say This"
      />
    </motion.article>
  );
}

// ─── Intelligence Snapshot Panel ───

function IntelligenceSnapshot({ items }: { items: any[] }) {
  const { data: editions } = trpc.editions.list.useQuery();
  const { isAuthenticated } = useAuth();
  const { data: queueItems } = trpc.readingQueue.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const latestEdition = editions?.[0];
  const keyMetrics = normaliseKeyMetrics(latestEdition?.keyMetrics);
  const prevEdition = editions?.[1];
  const prevMetrics = normaliseKeyMetrics(prevEdition?.keyMetrics);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.category?.toUpperCase() || "OTHER";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const recentBookmarks = useMemo(() => {
    if (!queueItems) return [];
    return queueItems.filter((i) => !i.isRead).slice(0, 3);
  }, [queueItems]);

  const unreadCount = useMemo(() => {
    if (!queueItems) return 0;
    return queueItems.filter((i) => !i.isRead).length;
  }, [queueItems]);

  const getMetricTrend = (key: string) => {
    if (!keyMetrics || !prevMetrics) return null;
    const current = keyMetrics[key];
    const prev = prevMetrics[key];
    if (current === undefined || prev === undefined) return null;
    const currentNum = typeof current === "number" ? current : parseFloat(String(current).replace(/[^0-9.-]/g, ""));
    const prevNum = typeof prev === "number" ? prev : parseFloat(String(prev).replace(/[^0-9.-]/g, ""));
    if (isNaN(currentNum) || isNaN(prevNum)) return null;
    if (currentNum > prevNum) return "up";
    if (currentNum < prevNum) return "down";
    return "flat";
  };

  const displayMetrics = useMemo(() => {
    if (!keyMetrics || Object.keys(keyMetrics).length === 0) return [];
    return Object.entries(keyMetrics).slice(0, 9);
  }, [keyMetrics]);

  return (
    <div className="space-y-4">
      {/* Key Metrics — reference design: 3-col grid, large value, trend arrow, sparkline */}
      {displayMetrics.length > 0 && (
        <div
          style={{
            padding: "20px",
            borderRadius: "14px",
            background: "rgba(13, 15, 26, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-500/80 tracking-[0.12em] uppercase">
                Key Metrics
              </span>
            </div>
            {latestEdition && (
              <span className="text-[9px] text-white/25 tracking-wider uppercase">
                vs previous edition
              </span>
            )}
          </div>
          {/* 3-column metric grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
            {displayMetrics.map(([key, value]) => {
              const trend = getMetricTrend(key);
              const prevVal = prevMetrics?.[key];
              const trendColour = getTrendColour(key, trend);
              const tip = (trend === "up" || trend === "down") ? getMetricTooltip(key, trend) : null;
              const barColour = trend === "up"
                ? (trendColour.includes("emerald") ? "#34d399" : "#f87171")
                : trend === "down"
                  ? (trendColour.includes("emerald") ? "#34d399" : "#f87171")
                  : "#f59e0b";
              const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
              const tileContent = (
                <div
                  key={key}
                  style={{ background: "rgba(13,15,26,0.9)", padding: "12px 12px 0 12px" }}
                  className="flex flex-col"
                >
                  {/* Label */}
                  <span className="text-[10px] font-mono text-white/40 tracking-[0.08em] uppercase truncate mb-1.5">
                    {key}
                  </span>
                  {/* Value + trend arrow */}
                  <div className="flex items-center gap-1.5 mb-1 min-w-0">
                    <span className="text-base font-bold text-white leading-none tracking-tight truncate min-w-0">
                      {value}
                    </span>
                    {trend && trend !== "flat" && (
                      <TrendIcon className={`w-4 h-4 shrink-0 ${trendColour}`} />
                    )}
                    {trend === "flat" && (
                      <Minus className="w-3.5 h-3.5 shrink-0 text-amber-400/50" />
                    )}
                  </div>
                  {/* Previous value */}
                  {prevVal !== undefined && (
                    <span className="text-[10px] text-white/30 mb-3">
                      was {prevVal}
                    </span>
                  )}
                  {!prevVal && <div className="mb-3" />}
                  {/* Sparkline bar */}
                  <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", marginLeft: "-16px", marginRight: "-16px" }}>
                    <div style={{ height: "2px", width: trend === "flat" || !trend ? "50%" : trend === "up" ? "75%" : "30%", background: barColour, transition: "width 0.8s cubic-bezier(0.23,1,0.32,1)" }} />
                  </div>
                </div>
              );
              return tip ? (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">{tileContent}</div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-snug bg-[rgba(10,12,24,0.97)] text-[rgba(245,238,220,0.9)] border border-white/10 px-3 py-2 rounded-lg shadow-xl">
                    {tip}
                  </TooltipContent>
                </Tooltip>
              ) : tileContent;
            })}
          </div>
          {latestEdition && (
            <Link href="/editions">
              <p className="text-[9px] text-amber-500/40 hover:text-amber-400 mt-3 cursor-pointer transition-colors tracking-wider uppercase">
                Edition {latestEdition.editionNumber} &middot; {latestEdition.weekOf}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Topic Activity - category-coloured bars */}
      {categoryCounts.length > 0 && (
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(13, 15, 26, 0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-3.5">
            <Hash className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-500/80 tracking-wider uppercase">
              Today's Topics
            </span>
          </div>
          <div className="space-y-2.5">
            {categoryCounts.map(([cat, count]) => {
              const textColor = CATEGORY_COLORS[cat]?.split(" ")[1] || "text-white/60";
              const barColor = CATEGORY_BAR_COLORS[cat] || "bg-white/20 group-hover/topic:bg-white/30";
              const maxCount = categoryCounts[0][1];
              const barWidth = Math.max(12, (count / maxCount) * 100);
              return (
                <Link key={cat} href={`/topics/${cat.toLowerCase()}`}>
                  <div className="group/topic cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-semibold tracking-wider uppercase ${textColor}`}>
                        {cat}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        {count}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link href="/topics">
            <p className="text-[10px] text-amber-500/60 hover:text-amber-400 mt-3.5 cursor-pointer transition-colors">
              Browse all topics &rarr;
            </p>
          </Link>
        </div>
      )}

      {/* Recent Bookmarks */}
      <div
        style={{
          padding: "16px",
          borderRadius: "14px",
          background: "rgba(13, 15, 26, 0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-500/80 tracking-wider uppercase">
              Reading Queue
            </span>
          </div>
          {unreadCount > 0 && (
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {isAuthenticated && recentBookmarks.length > 0 ? (
          <>
            <div className="space-y-2.5">
              {recentBookmarks.map((item) => (
                <div key={item.id} className="group/bm">
                  <p className="text-[12px] text-muted-foreground leading-snug line-clamp-2 group-hover/bm:text-foreground/80 transition-colors">
                    {item.feedTitle || item.customTitle || "Saved item"}
                  </p>
                  {item.feedCategory && (
                    <span className="text-[9px] font-mono text-muted-foreground/50 uppercase mt-0.5 inline-block">
                      {item.feedCategory}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Link href="/queue">
              <p className="text-[10px] text-amber-500/60 hover:text-amber-400 mt-3.5 cursor-pointer transition-colors">
                View all saved &rarr;
              </p>
            </Link>
          </>
        ) : (
          <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
            {isAuthenticated
              ? "Bookmark items from the feed to build your reading list."
              : "Sign in to save articles for later."}
          </p>
        )}
      </div>

      {/* Latest Edition */}
      {latestEdition && (
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(13, 15, 26, 0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-3.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-500/80 tracking-wider uppercase">
              Latest Edition
            </span>
          </div>
          <Link href="/editions">
            <div className="cursor-pointer group/ed">
              <p className="text-sm font-semibold text-foreground/90 group-hover/ed:text-foreground transition-colors mb-1">
                Edition {latestEdition.editionNumber}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mb-2.5">
                Week of {latestEdition.weekOf?.replace(/^week of /i, '')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(latestEdition.topics as any[])?.slice(0, 3).map((t: any, i: number) => {
                  const colors = CATEGORY_COLORS[t.category?.toUpperCase()] || "bg-white/10 text-white/60 border-white/20";
                  return (
                    <span key={i} className={`inline-block px-2 py-px text-[9px] font-semibold tracking-wider uppercase border rounded-full ${colors}`}>
                      {t.category}
                    </span>
                  );
                })}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Email subscribe CTA */}
      <div
        style={{
          padding: "16px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(245,166,35,0.07) 0%, rgba(245,166,35,0.02) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(245,166,35,0.18)",
          boxShadow: "0 0 20px rgba(245,166,35,0.05), inset 0 1px 0 rgba(245,166,35,0.12)",
        }}
      >
        <p className="text-[11px] text-amber-400/80 font-medium mb-1">
          Get the daily briefing
        </p>
        <p className="text-[10px] text-muted-foreground/60 mb-2 leading-relaxed">
          Property, macro, markets, and policy. 7am AEST. Free.
        </p>
        <SubscribeForm source="daily-feed" variant="compact" />
      </div>
    </div>
  );
}

// ─── Main DailyFeed Component ───

export default function DailyFeed() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [backfillingSayThis, setBackfillingSayThis] = useState(false);
  const backfillSayThis = trpc.feed.backfillSayThis.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.generated} Say This lines`, {
        description: data.failed > 0 ? `${data.failed} failed -- check server logs` : `All ${data.total} missing items now have a Say This line`,
        duration: 5000,
      });
      utils.feed.getItems.invalidate();
      setBackfillingSayThis(false);
    },
    onError: () => {
      toast.error('Say This backfill failed');
      setBackfillingSayThis(false);
    },
  });
  const { data: dates, isLoading: datesLoading } = trpc.feed.getRecentDates.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000, gcTime: Infinity, refetchOnWindowFocus: false, placeholderData: keepPreviousData }
  );
  const utils = trpc.useUtils();
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());
  const [persona] = usePersona();
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);
  const focusedCardIndexRef = useRef(0);
  const [heroExpanded, setHeroExpanded] = useState(true);
  const [heroCopied, setHeroCopied] = useState(false);
  const [heroLiModalOpen, setHeroLiModalOpen] = useState(false);
  const [heroLiPostText, setHeroLiPostText] = useState("");

  const selectedDate = dates?.[selectedDateIndex];

  const { data: items, isLoading: itemsLoading } = trpc.feed.getItems.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate, staleTime: 5 * 60 * 1000, gcTime: Infinity, refetchOnWindowFocus: false, placeholderData: keepPreviousData }
  );

  const addToQueue = trpc.readingQueue.add.useMutation({
    onSuccess: (_data, variables) => {
      if (variables.feedItemId) {
        setSavedItems((prev) => new Set(prev).add(variables.feedItemId!));
      }
      toast.success("Saved to Reading Queue", {
        description: "Find it in your queue anytime.",
        duration: 3000,
      });
      // Invalidate queue so sidebar count updates
      utils.readingQueue.list.invalidate();
    },
    onError: () => toast.error("Failed to add to queue"),
  });

  // Show skeleton only on the very first load (no cached data available).
  // gcTime: Infinity keeps the cache alive across unmounts so placeholderData
  // returns the previous result immediately on remount -- no blank flash.
  const isLoading = datesLoading || (itemsLoading && !items);
  const hasData = dates && dates.length > 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const today = new Date().toISOString().split("T")[0];

  const handleBookmark = (itemId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (savedItems.has(itemId)) return;
    addToQueue.mutate({ feedItemId: itemId });
  };

  // Keep ref in sync with state for use in keydown handler
  useEffect(() => {
    focusedCardIndexRef.current = focusedCardIndex;
  }, [focusedCardIndex]);

  // j/k/s keyboard shortcuts for card navigation and save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is inside an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      // Skip if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const cards = document.querySelectorAll("[data-feed-card]");
      if (cards.length === 0) return; // nothing to navigate

      if (e.key === "j") {
        e.preventDefault();
        setFocusedCardIndex((prev) => {
          const next = Math.min(prev + 1, cards.length - 1);
          (cards[next] as HTMLElement)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return next;
        });
      } else if (e.key === "k") {
        e.preventDefault();
        setFocusedCardIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          (cards[next] as HTMLElement)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return next;
        });
      } else if (e.key === "s") {
        // Save the currently focused card - clamp to valid range
        const clampedIndex = Math.min(Math.max(focusedCardIndexRef.current, 0), cards.length - 1);
        const card = cards[clampedIndex] as HTMLElement;
        if (card) {
          const itemId = card.getAttribute("data-item-id");
          if (itemId) handleBookmark(Number(itemId));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, savedItems]);

  const topItem = items?.[0];

  // ── Category filter state ──────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Derive the ordered list of categories present in today's items
  const presentCategories = useMemo(() => {
    if (!items) return [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    items.forEach((item) => {
      const cat = item.category?.toUpperCase() || "OTHER";
      if (!seen.has(cat)) { seen.add(cat); ordered.push(cat); }
    });
    return ordered;
  }, [items]);

  // Reset filter when date changes
  useEffect(() => { setActiveCategory("ALL"); }, [selectedDate]);

  // Filtered items (ALL = no filter)
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (activeCategory === "ALL") return items;
    return items.filter((item) => (item.category?.toUpperCase() || "OTHER") === activeCategory);
  }, [items, activeCategory]);

  return (
    <>
    <BreakingSignalToast
      headline={topItem?.title ?? null}
      category={topItem?.category ?? null}
      feedDate={topItem?.feedDate ?? null}
      enabled={!isLoading && !!topItem}
    />
    <div className="flex flex-col xl:flex-row gap-6 xl:gap-10 items-start w-full min-w-0">
      {/* Intelligence snapshot panel — shows above feed on mobile, sticky sidebar on xl */}
      <motion.aside
        className="w-full xl:hidden"
        aria-label="Intelligence snapshot"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <IntelligenceSnapshot items={filteredItems || []} />
      </motion.aside>

      {/* Main feed column */}
      <div className="flex-1 min-w-0">
        {/* ─── CINEMATIC MASTHEAD ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-10 overflow-hidden w-full"
          style={{ borderRadius: "24px" }}
        >
          {/* Intelligence desk photo */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663548646152/dCo7VYd4xNQxWrSX6SQCEW/hero-desk-fi2BqAQGCnmqhXJVov2MTd.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center 35%",
            }}
          />
          {/* Deep layered overlay for legibility */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(4,5,14,0.92) 0%, rgba(8,10,22,0.86) 40%, rgba(14,9,5,0.88) 100%)",
            }}
          />
          {/* Amber radial glow top-left */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-60px",
              left: "-40px",
              width: "500px",
              height: "400px",
              background: "radial-gradient(ellipse at 30% 30%, rgba(245,166,35,0.12) 0%, transparent 65%)",
              filter: "blur(40px)",
            }}
          />
          {/* Subtle blue counter-glow bottom-right */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "-40px",
              right: "0",
              width: "400px",
              height: "300px",
              background: "radial-gradient(ellipse at 70% 70%, rgba(59,130,246,0.07) 0%, transparent 65%)",
              filter: "blur(40px)",
            }}
          />
          {/* Top amber rule */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{ height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.7) 30%, rgba(245,166,35,0.9) 50%, rgba(245,166,35,0.7) 70%, transparent 100%)" }}
          />
          {/* Grid texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative overflow-hidden" style={{ padding: "clamp(16px, 4vw, 44px) clamp(14px, 4vw, 40px) clamp(24px, 4vw, 52px)" }}>
            {/* Top row: live badge + date */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    background: "rgba(245,166,35,0.08)",
                    border: "1px solid rgba(245,166,35,0.2)",
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                  </span>
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: "9px", fontWeight: 700, color: "rgba(245,166,35,0.85)" }}
                  >
                    Live Feed
                  </span>
                </div>
                <span
                  className="font-mono hidden sm:block"
                  style={{ fontSize: "10px", color: "rgba(245,238,220,0.22)", letterSpacing: "0.08em" }}
                >
                  {new Date().toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Australia/Sydney",
                  }).toUpperCase()}
                </span>
              </div>
              {/* Edition marker */}
              <div
                className="font-mono"
                style={{ fontSize: "9px", color: "rgba(245,238,220,0.18)", letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                7am AEST Daily
              </div>
            </div>

            {/* Hero headline block */}
            <div className="mb-6">
              {/* Overline label */}
              <div
                className="font-mono uppercase tracking-[0.22em] mb-3"
                style={{ fontSize: "9px", color: "rgba(245,166,35,0.5)" }}
              >
                The Desk / Daily Intelligence Brief
              </div>

              {/* The big headline */}
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
                }}
                className="font-serif font-bold tracking-tight"
                style={{
                  fontSize: "clamp(26px, 8vw, 80px)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  paddingBottom: "0.08em",
                  color: "rgba(245, 238, 220, 0.97)",
                  marginBottom: "0px",
                  overflow: "visible",
                }}
              >
                {["Today's"].map((word, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                    }}
                    style={{ display: "inline-block", marginRight: "0.25em" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif font-bold"
                style={{
                  fontSize: "clamp(26px, 8vw, 80px)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  paddingBottom: "0.12em",
                  background: "linear-gradient(135deg, #f5c842 0%, #f5a623 40%, #e8821a 70%, #f5c842 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundSize: "200% auto",
                  animation: "shimmer 8s linear infinite",
                  display: "block",
                  overflow: "visible",
                }}
              >
                Desk.
              </motion.div>
            </div>

            {/* Thin amber rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
              className="origin-left mb-6"
              style={{ height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.7) 0%, rgba(245,166,35,0.25) 65%, transparent 100%)", maxWidth: "360px" }}
            />

            {/* Descriptor + persona row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(245,238,220,0.65)",
                  lineHeight: 1.65,
                  maxWidth: "420px",
                  flexShrink: 0,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
                className="hidden sm:block"
              >
                What's cutting through right now. 60-second scan, updated every morning.
              </p>
              <a
                href="https://www.linkedin.com/in/ruben-laubscher/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono uppercase tracking-widest transition-colors"
                style={{ fontSize: "8px", color: "rgba(245,238,220,0.28)", letterSpacing: "0.14em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,166,35,0.65)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.28)")}
              >
                By Ruben Laubscher
              </a>
              {isAdmin && (
                <button
                  onClick={() => {
                    setBackfillingSayThis(true);
                    backfillSayThis.mutate();
                  }}
                  disabled={backfillingSayThis}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed self-start"
                  style={{
                    background: backfillingSayThis ? 'rgba(245,166,35,0.08)' : 'rgba(245,166,35,0.12)',
                    border: '1px solid rgba(245,166,35,0.25)',
                    color: 'rgba(245,166,35,0.85)',
                  }}
                  title="Generate Say This lines for all feed items missing one"
                >
                  {backfillingSayThis ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                  ) : (
                    <><Zap className="w-3 h-3" /> Gen All Say This</>
                  )}
                </button>
              )}
              <div className="w-full sm:flex-1">
                <PersonaSelector />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Date navigation */}
        {hasData && (
          <div
            className="flex items-center gap-2 mb-8 w-full min-w-0"
            style={{
              padding: "8px 10px",
              borderRadius: "12px",
              background: "rgba(13, 15, 26, 0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => setSelectedDateIndex(Math.min(selectedDateIndex + 1, (dates?.length || 1) - 1))}
              disabled={selectedDateIndex >= (dates?.length || 1) - 1}
              aria-label="Previous day"
              className="p-2 disabled:opacity-25 disabled:cursor-not-allowed transition-all rounded-lg active:scale-95"
              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(245,238,220,0.85)"; e.currentTarget.style.borderColor = "rgba(245,238,220,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,238,220,0.5)"; e.currentTarget.style.borderColor = "rgba(245,238,220,0.07)"; }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <div className="relative inline-flex flex-col items-center gap-1.5">
                <label htmlFor="date-jump" className="sr-only">Jump to date</label>
                <input
                  id="date-jump"
                  type="date"
                  value={selectedDate || ""}
                  min={dates?.[dates.length - 1] || ""}
                  max={today}
                  onChange={(e) => {
                    const idx = dates?.indexOf(e.target.value) ?? -1;
                    if (idx !== -1) setSelectedDateIndex(idx);
                  }}
                  className="appearance-none bg-transparent border-none font-semibold text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/40 rounded px-1 py-0.5 [color-scheme:dark]"
                  style={{ fontSize: "12px", color: "rgba(245,238,220,0.75)", letterSpacing: "-0.01em" }}
                  aria-label="Jump to a specific date"
                />
                {selectedDate === today && (
                  <span
                    className="inline-block font-mono uppercase tracking-widest"
                    style={{
                      fontSize: "8px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: "rgba(245,166,35,0.12)",
                      color: "rgba(245,166,35,0.85)",
                      border: "1px solid rgba(245,166,35,0.2)",
                    }}
                  >
                    Today
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedDateIndex(Math.max(selectedDateIndex - 1, 0))}
              disabled={selectedDateIndex <= 0}
              aria-label="Next day"
              className="p-2 disabled:opacity-25 disabled:cursor-not-allowed transition-all rounded-lg active:scale-95"
              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(245,238,220,0.85)"; e.currentTarget.style.borderColor = "rgba(245,238,220,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,238,220,0.5)"; e.currentTarget.style.borderColor = "rgba(245,238,220,0.07)"; }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Category filter bar ── */}
        {!isLoading && items && items.length > 0 && presentCategories.length > 1 && (
          <div
            className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            role="tablist"
            aria-label="Filter by category"
          >
            {["ALL", ...presentCategories].map((cat) => {
              const isActive = activeCategory === cat;
              const colors = CATEGORY_COLORS[cat];
              // Extract the text colour class for the active pill
              const textClass = colors?.split(" ")[1] || "text-white/70";
              const bgClass = colors?.split(" ")[0] || "bg-white/10";
              const borderClass = colors?.split(" ")[2] || "border-white/20";
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-none px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border transition-all duration-200 active:scale-95 ${
                    isActive
                      ? `${bgClass} ${textClass} ${borderClass} shadow-sm`
                      : "bg-transparent border-white/10 text-white/35 hover:text-white/60 hover:border-white/20"
                  }`}
                  style={isActive ? { boxShadow: "0 0 12px rgba(255,255,255,0.06)" } : {}}
                >
                  {cat === "ALL" ? "All" : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Feed items */}
        {isLoading && (
          <div className="space-y-4">
            {/* Hero card skeleton */}
            <div
              className="rounded-2xl animate-pulse"
              style={{
                padding: "32px",
                background: "rgba(10, 12, 24, 0.88)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: "4px solid rgba(245,166,35,0.2)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
              }}
            >
              {/* Category pill */}
              <div className="w-20 h-5 rounded-full mb-5" style={{ background: "rgba(245,166,35,0.12)" }} />
              {/* Title lines */}
              <div className="w-4/5 h-7 rounded mb-3" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="w-3/5 h-7 rounded mb-6" style={{ background: "rgba(255,255,255,0.05)" }} />
              {/* Summary lines */}
              <div className="w-full h-4 rounded mb-2" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="w-full h-4 rounded mb-2" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="w-2/3 h-4 rounded mb-6" style={{ background: "rgba(255,255,255,0.03)" }} />
              {/* Say This block */}
              <div className="w-full h-14 rounded-xl" style={{ background: "rgba(245,166,35,0.06)" }} />
            </div>
            {/* Standard card skeletons */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{
                  padding: "20px 24px",
                  background: "rgba(10, 12, 24, 0.75)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: "3px solid rgba(255,255,255,0.08)",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-16 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="w-24 h-4 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
                <div className="w-3/4 h-5 rounded mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="w-full h-4 rounded mb-1" style={{ background: "rgba(255,255,255,0.04)" }} />
                <div className="w-5/6 h-4 rounded" style={{ background: "rgba(255,255,255,0.03)" }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && hasData && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Inbox className="w-10 h-10 text-muted-foreground/25 mb-4" />
            <p className="text-sm font-medium text-muted-foreground/60 mb-1">No {activeCategory} stories today.</p>
            <button onClick={() => setActiveCategory("ALL")} className="text-[11px] text-amber-500/60 hover:text-amber-400 transition-colors mt-1">Show all categories</button>
          </motion.div>
        )}

        {!isLoading && !hasData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <Inbox className="w-12 h-12 text-muted-foreground/30 mb-5" />
            <p className="text-base font-medium text-muted-foreground/70 mb-2">
              No daily feed items yet.
            </p>
            <p className="text-sm text-muted-foreground/50">
              The daily scan runs every morning at 7am AEST. Check back tomorrow.
            </p>
          </motion.div>
        )}

        {!isLoading && filteredItems && filteredItems.length > 0 && (
          <div>
            {/* ─── FEATURED HERO STORY ─── */}
            {(() => {
              const hero = filteredItems[0];
              const personaInsight = parsePersonaTag(hero.partnerTag, persona);
              const heroAccent = CATEGORY_ACCENT[hero.category?.toUpperCase()] || "border-l-amber-500/50";
              return (
                <motion.article
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative mb-8"
                  data-feed-card
                  data-item-id={hero.id}
                >
                  {/* Hero hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse at 20% 40%, rgba(245,166,35,0.08) 0%, transparent 60%)",
                      filter: "blur(12px)",
                    }}
                  />
                  <div
                    className={`relative rounded-2xl border-l-[4px] ${heroAccent} cursor-pointer transition-all duration-300`}
                    style={{
                      padding: "clamp(18px, 5vw, 32px) clamp(16px, 5vw, 32px) clamp(18px, 5vw, 28px)",
                      background: "rgba(10, 12, 24, 0.88)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderLeftWidth: "4px",
                      borderRadius: "20px",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,166,35,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 16px 60px rgba(0,0,0,0.5), -6px -6px 24px rgba(245,166,35,0.05), 0 0 0 1px rgba(245,166,35,0.12), inset 0 1px 0 rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,166,35,0.05), inset 0 1px 0 rgba(255,255,255,0.06)";
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('a') || target.closest('button')) return;
                      setHeroExpanded(p => !p);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={heroExpanded}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHeroExpanded(p => !p); } }}
                  >
                    {/* Top: FEATURED label + category + bookmark */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="font-mono uppercase tracking-widest"
                          style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.7)", letterSpacing: "0.18em" }}
                        >
                          Featured
                        </span>
                        <div
                          style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.12)" }}
                        />
                        <CategoryPill category={hero.category} />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBookmark(hero.id); }}
                        disabled={addToQueue.isPending && !savedItems.has(hero.id)}
                        aria-label={savedItems.has(hero.id) ? "Saved to Reading Queue" : "Save to Reading Queue"}
                        className={`p-2 shrink-0 rounded-lg transition-all duration-200 ${savedItems.has(hero.id) ? "text-amber-400 bg-amber-500/10" : "text-muted-foreground/70 hover:text-amber-400 hover:bg-amber-500/10"}`}
                      >
                        {savedItems.has(hero.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Hero title - much larger */}
                    <h2
                      className="font-serif font-bold group-hover:text-white transition-colors mb-4"
                      style={{
                        fontSize: "clamp(22px, 3.5vw, 32px)",
                        lineHeight: 1.2,
                        letterSpacing: "-0.03em",
                        color: "rgba(245, 240, 225, 0.98)",
                      }}
                    >
                      {hero.title}
                    </h2>

                    {/* Summary */}
                    <p
                      style={{
                        fontSize: "15px",
                        lineHeight: 1.7,
                        color: "rgba(245,238,220,0.55)",
                        marginBottom: "24px",
                        maxWidth: "100%",
                      }}
                    >
                      {hero.summary}
                    </p>

                    {/* Say This block */}
                    {hero.sayThis && (
                      <div
                        className="relative overflow-hidden mb-5"
                        style={{
                          padding: "20px 22px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, rgba(245,166,35,0.11) 0%, rgba(245,166,35,0.05) 100%)",
                          border: "1px solid rgba(245,166,35,0.25)",
                          boxShadow: "0 0 32px rgba(245,166,35,0.08), inset 0 1px 0 rgba(245,166,35,0.18)",
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0"
                          style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.55), transparent)" }}
                        />
                        <div className="flex items-center gap-1.5 mb-3">
                          <MessageSquareQuote className="w-3.5 h-3.5" style={{ color: "rgba(245,166,35,0.75)" }} />
                          <span className="font-mono uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 700, color: "rgba(245,166,35,0.7)" }}>Say This</span>
                        </div>
                        <p
                          className="font-serif"
                          style={{ fontSize: "15px", lineHeight: 1.65, color: "rgba(255, 242, 200, 0.94)", fontWeight: 500, fontStyle: "italic", marginBottom: "14px" }}
                        >
                          "{hero.sayThis}"
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-500/10">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(hero.sayThis ?? '').then(() => { setHeroCopied(true); toast.success("Talking point copied"); setTimeout(() => setHeroCopied(false), 2000); }); }}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-mono transition-all duration-200 ${
                              heroCopied
                                ? "text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded"
                                : "text-amber-500/60 hover:text-amber-400"
                            }`}
                          >
                            {heroCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {heroCopied ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); const sayThis = (hero.sayThis || hero.title || '').trim(); const category = hero.category ? hero.category.charAt(0).toUpperCase() + hero.category.slice(1).toLowerCase() : 'Property'; const src = hero.source ? `\n\nSource: ${hero.source}` : ''; const text = `${sayThis}${src}\n\nThis is the kind of signal worth tracking if you work in property investment, financial advice, or mortgage broking.\n\nWhat are you watching in ${category} right now?\n\nLink in comments.\n\n@Arjun Paliwal @InvestorKit`; setHeroLiPostText(text); setHeroLiModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-500/60 hover:text-amber-400 transition-colors"
                          >
                            <Linkedin className="w-3 h-3" /> Share
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/story/${hero.id}`).then(() => toast.success("Link copied")); }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-500/60 hover:text-amber-400 transition-colors"
                          >
                            <Share2 className="w-3 h-3" /> Copy link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Partner context expandable */}
                    {personaInsight && (
                      <div className="mb-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setHeroExpanded(p => !p); }}
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${heroExpanded ? 'rotate-180' : ''}`} />
                          {heroExpanded ? 'Hide context' : 'Show context'}
                        </button>
                        {heroExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-2"
                          >
                            <p className="text-[11px] font-mono text-sky-400/80 leading-relaxed">{personaInsight}</p>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-wrap items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {hero.sourceUrl ? (
                        <a
                          href={hero.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-amber-400 transition-colors group/src"
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${new URL(hero.sourceUrl).hostname}&sz=16`}
                            alt="" aria-hidden="true"
                            className="w-3.5 h-3.5 rounded-sm opacity-70 group-hover/src:opacity-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span>{hero.source}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/src:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/70">{hero.source}</span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })()}

            {/* Remaining cards */}
            {filteredItems.length > 1 && (
              <>
                {/* Section divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.25), rgba(255,255,255,0.05))" }} />
                  <span
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: "8px", color: "rgba(245,166,35,0.45)", letterSpacing: "0.18em" }}
                  >
                    {activeCategory === "ALL" ? "More from today" : `More ${activeCategory}`}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "linear-gradient(270deg, rgba(245,166,35,0.25), rgba(255,255,255,0.05))" }} />
                </div>

                {/* Medium cards: 2-col grid on md+, single col on mobile */}
                {filteredItems.slice(1, 3).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    {filteredItems.slice(1, 3).map((item, i) => {
                      const personaInsight = parsePersonaTag(item.partnerTag, persona);
                      return (
                        <FeedCard
                          key={item.id}
                          item={{ ...item, partnerTag: personaInsight }}
                          index={i + 1}
                          isSaved={savedItems.has(item.id)}
                          onBookmark={handleBookmark}
                          isPending={addToQueue.isPending}
                          defaultExpanded={false}
                          size="medium"
                        />
                      );
                    })}
                  </div>
                )}

                {/* Compact cards below the medium tier */}
                {filteredItems.length > 3 && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
                      <span
                        className="font-mono uppercase tracking-widest"
                        style={{ fontSize: "7.5px", color: "rgba(245,238,220,0.18)", letterSpacing: "0.16em" }}
                      >
                        Further signals
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
                    </div>
                    <div className="space-y-5">
                      {filteredItems.slice(3).map((item, i) => {
                        const personaInsight = parsePersonaTag(item.partnerTag, persona);
                        return (
                          <FeedCard
                            key={item.id}
                            item={{ ...item, partnerTag: personaInsight }}
                            index={i + 3}
                            isSaved={savedItems.has(item.id)}
                            onBookmark={handleBookmark}
                            isPending={addToQueue.isPending}
                            defaultExpanded={false}
                            size="compact"
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Hero LinkedIn post modal */}
      <LinkedInPostModal
        open={heroLiModalOpen}
        onClose={() => setHeroLiModalOpen(false)}
        postText={heroLiPostText}
        label="Say This"
      />

      {/* Intelligence snapshot panel — sticky sidebar on xl only (mobile version is above) */}
      <motion.aside
        className="hidden xl:block xl:w-72 xl:shrink-0 xl:sticky xl:top-6"
        aria-label="Intelligence snapshot"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <IntelligenceSnapshot items={filteredItems || []} />
      </motion.aside>
    </div>
    </>
  );
}
