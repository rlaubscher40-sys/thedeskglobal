import { trpc } from "@/lib/trpc";
import { normaliseKeyMetrics, getTrendColour, getMetricTooltip, asStringArray } from "@/lib/normaliseKeyMetrics";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  BookOpen,
  Clock,
  Users,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Bookmark,
  BookmarkCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { SignalEmptyState } from "@/components/SignalEmptyState";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import type { Edition as EditionType } from "../../../drizzle/schema";
import EditionReader from "@/components/EditionReader";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  MACRO:              "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PROPERTY:           "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  TECH:               "bg-sky-500/15 text-sky-400 border-sky-500/30",
  AI:                 "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  POLICY:             "bg-purple-500/15 text-purple-400 border-purple-500/30",
  SCIENCE:            "bg-rose-500/15 text-rose-400 border-rose-500/30",
  MARKETS:            "bg-orange-500/15 text-orange-400 border-orange-500/30",
  GEOPOLITICS:        "bg-red-500/15 text-red-400 border-red-500/30",
  ECONOMICS:          "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CULTURE:            "bg-pink-500/15 text-pink-400 border-pink-500/30",
  SPORT:              "bg-lime-500/15 text-lime-400 border-lime-500/30",
  SPORTS:             "bg-lime-500/15 text-lime-400 border-lime-500/30",
  "GLOBAL PUBLIC PULSE": "bg-violet-500/15 text-violet-400 border-violet-500/30",
  GLOBALPUBLICPULSE:  "bg-violet-500/15 text-violet-400 border-violet-500/30",
  CRYPTO:             "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  HEALTH:             "bg-teal-500/15 text-teal-400 border-teal-500/30",
  CLIMATE:            "bg-green-500/15 text-green-400 border-green-500/30",
  OTHER:              "bg-slate-500/15 text-slate-400 border-slate-500/30",
};
function parseNumericVal(val: string | number | undefined): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
function buildSparklineData(
  editions: Array<{ editionNumber: number; keyMetrics: unknown }>,
  metricKey: string,
  currentEditionNumber: number,
  limit: number = 5
): Array<{ v: number | null }> {
  // Get up to `limit` editions ending at the current edition, sorted ascending
  const sorted = [...editions]
    .filter((e) => e.editionNumber <= currentEditionNumber)
    .sort((a, b) => a.editionNumber - b.editionNumber)
    .slice(-limit);
  return sorted.map((e) => {
    const metrics = normaliseKeyMetrics(e.keyMetrics);
    return { v: parseNumericVal(metrics[metricKey]) };
  });
}


function CategoryPill({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category?.toUpperCase()] || "bg-white/10 text-white/60 border-white/20";
  return (
    <Link href={`/topics/${category.toLowerCase()}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-medium tracking-widest uppercase border rounded-sm cursor-pointer hover:opacity-80 transition-opacity ${colors}`}>
        {category}
      </span>
    </Link>
  );
}

const FALLBACK_HERO = "/manus-storage/Generatedimage1_68df9cf5.png";

/** Isolated sub-component so useScroll only runs when the hero DOM node exists */
function HeroParallaxBg({ heroImageUrl }: { heroImageUrl?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  return (
    <motion.div
      ref={ref}
      className="absolute inset-0"
      style={{
        backgroundImage: `url('${heroImageUrl || FALLBACK_HERO}')`,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        y,
        scale: 1.15,
      }}
    />
  );
}

export default function Editions() {
  const { data: editions, isLoading } = trpc.editions.list.useQuery();
  const { isAuthenticated, user } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  // heroParallax is managed inside HeroParallaxBg sub-component to avoid ref-not-hydrated warning

  const utils = trpc.useUtils();
  const generateHeroImage = trpc.editions.generateHeroImage.useMutation({
    onSuccess: () => {
      toast.success("Hero image generated");
      utils.editions.list.invalidate();
    },
    onError: () => toast.error("Image generation failed"),
  });

  const [backfillProgress, setBackfillProgress] = useState<{ done: number; total: number } | null>(null);
  const [backfillDone, setBackfillDone] = useState(false);
  const backfillRubensTake = trpc.editions.backfillRubensTake.useMutation({
    onSuccess: (data) => {
      setBackfillProgress(null);
      setBackfillDone(true);
      utils.editions.list.invalidate();
      const msg = data as any;
      toast.success(`Generated ${msg?.generated ?? '?'} takes (${msg?.skipped ?? 0} already had one)`);
      setTimeout(() => setBackfillDone(false), 4000);
    },
    onError: () => toast.error("Backfill failed"),
  });

  const handleGenerateHeroImage = () => {
    if (!selected || !isAuthenticated) return;
    const topics = (selected.topics as any[]) || [];
    const dominantCategory = topics[0]?.category || "MACRO";
    const topicTitles = topics.slice(0, 3).map((t: any) => t.title as string);
    generateHeroImage.mutate({
      editionId: selected.id,
      dominantCategory,
      weekRange: selected.weekRange,
      topicTitles,
    });
  };

  const addToQueue = trpc.readingQueue.add.useMutation({
    onSuccess: (_data, variables) => {
      setBookmarked((prev) => new Set(prev).add(variables.customTitle || ""));
      toast.success("Saved to Reading Queue");
    },
    onError: () => toast.error("Failed to save"),
  });

  const handleBookmark = (title: string, summary: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (bookmarked.has(title)) return;
    addToQueue.mutate({ customTitle: title, customUrl: `signal://edition/${selected?.editionNumber}/${encodeURIComponent(title)}` });
  };

  const selected = useMemo(
    () => editions?.find((e) => e.id === selectedId) || editions?.[0],
    [editions, selectedId]
  );

  // Keyboard shortcut: ] to toggle editions sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "]" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);

  if (isLoading) {
    return (
      <div className="flex gap-0">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex flex-col shrink-0 w-56 border-r border-white/[0.06] mr-6 space-y-1 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mx-1 px-3 py-2.5 rounded-md animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-8 h-3 rounded mb-1.5" style={{ background: "rgba(245,166,35,0.15)" }} />
              <div className="w-24 h-3.5 rounded mb-1" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="flex gap-1 mt-1">
                <div className="w-10 h-3 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                <div className="w-10 h-3 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
              </div>
            </div>
          ))}
        </div>
        {/* Main content skeleton */}
        <div className="flex-1 max-w-5xl">
          {/* Hero skeleton */}
          <div
            className="rounded-2xl mb-8 animate-pulse overflow-hidden"
            style={{ height: "260px", background: "rgba(10,12,24,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="h-full flex flex-col justify-end p-8">
              <div className="w-28 h-4 rounded mb-3" style={{ background: "rgba(245,166,35,0.2)" }} />
              <div className="w-2/3 h-8 rounded mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="w-40 h-10 rounded-lg mt-4" style={{ background: "rgba(245,166,35,0.1)" }} />
            </div>
          </div>
          {/* Metrics skeleton */}
          <div className="p-5 rounded-xl mb-8 animate-pulse" style={{ background: "rgba(10,12,24,0.75)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-20 h-3 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map((i) => (
                <div key={i}>
                  <div className="w-16 h-3 rounded mb-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                  <div className="w-12 h-6 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                </div>
              ))}
            </div>
          </div>
          {/* Topic skeletons */}
          {[1,2,3].map((i) => (
            <div key={i} className="pl-5 border-l-2 border-white/[0.06] mb-6 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-16 h-4 rounded-sm mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="w-3/4 h-5 rounded mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="w-full h-4 rounded mb-1" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="w-5/6 h-4 rounded" style={{ background: "rgba(255,255,255,0.03)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!editions || editions.length === 0) {
    return (
      <SignalEmptyState
        icon={<FileText className="w-6 h-6" />}
        title="First edition coming soon"
        body="Weekly editions drop every Wednesday at 7am AEST."
        bodySecondary="Each edition includes key metrics, trend analysis, and ready-to-use talking points for your partner conversations."
        cta={{
          label: "Get the weekly edition in your inbox →",
          href: "https://rubenlaubscher.substack.com",
        }}
      />
    );
  }

  return (
    <div className="flex gap-0 -mx-5 sm:-mx-7 lg:-mx-8 -mt-5 sm:-mt-7 lg:-mt-8">
      {/* Collapsible Edition list sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 48 : 224 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col shrink-0 border-r border-white/[0.06] overflow-hidden mr-6"
      >
        {/* Sidebar header with toggle */}
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center py-2" : "justify-between px-1 pb-2"}`}>
          {!sidebarCollapsed && (
            <h3 className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.2em] uppercase">
              {editions.length} Edition{editions.length !== 1 ? "s" : ""}
            </h3>
          )}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand editions ( ] )" : "Collapse editions ( ] )"}
            aria-label={sidebarCollapsed ? "Expand editions sidebar" : "Collapse editions sidebar"}
            className="p-1.5 text-muted-foreground/70 hover:text-muted-foreground/80 transition-colors rounded-md hover:bg-white/[0.04]"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Edition list */}
        <nav className="space-y-1 overflow-y-auto flex-1">
          {editions.map((edition) => {
            const isActive = selected?.id === edition.id;

            if (sidebarCollapsed) {
              // Collapsed: show just edition number with colour dot
              return (
                <button
                  key={edition.id}
                  onClick={() => setSelectedId(edition.id)}
                  title={`#${String(edition.editionNumber).padStart(2, "0")} - ${edition.weekRange}`}
                  aria-label={`Edition ${edition.editionNumber} - ${edition.weekRange}`}
                  aria-pressed={selected?.id === edition.id}
                  className={`w-full flex flex-col items-center py-2.5 border-l-2 transition-all duration-200 ${
                    isActive
                      ? "border-amber-500 bg-amber-500/[0.08]"
                      : "border-transparent hover:border-white/[0.12] hover:bg-white/[0.03]"
                  }`}
                >
                  <span className={`font-mono text-[11px] font-semibold ${isActive ? "text-amber-400" : "text-muted-foreground/80"}`}>
                    {String(edition.editionNumber).padStart(2, "0")}
                  </span>
                  <div className="flex gap-0.5 mt-1">
                    {(edition.topics as any[])?.slice(0, 3).map((t: any, i: number) => {
                      const catKey = t.category?.toUpperCase();
                      const dotColor =
                        catKey === "MACRO" ? "bg-amber-400" :
                        catKey === "PROPERTY" ? "bg-emerald-400" :
                        catKey === "TECH" ? "bg-blue-400" :
                        catKey === "POLICY" ? "bg-purple-400" :
                        catKey === "SCIENCE" ? "bg-rose-400" :
                        "bg-white/30";
                      return <div key={`dot-${edition.id}-${i}`} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />;
                    })}
                  </div>
                </button>
              );
            }

            // Expanded: full detail
            return (
              <button
                key={edition.id}
                onClick={() => setSelectedId(edition.id)}
                className={`w-full text-left px-3 py-2.5 border-l-2 transition-all duration-200 rounded-r-md ${
                  isActive
                    ? "border-amber-500 bg-amber-500/[0.08]"
                    : "border-transparent hover:border-white/[0.12] hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-mono text-[11px] ${isActive ? "text-amber-400" : "text-muted-foreground/80"}`}>
                    #{String(edition.editionNumber).padStart(2, "0")}
                  </span>
                  {edition.id === editions[0]?.id && (
                    <span className="px-1.5 py-px text-[8px] font-mono font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-sm">
                      Latest
                    </span>
                  )}
                </div>
                <p className={`text-xs font-medium ${isActive ? "text-foreground" : "text-foreground/85"}`}>
                  {edition.weekRange}
                </p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {(edition.topics as any[])?.slice(0, 3).map((t: any, i: number) => (
                    <span
                      key={`cat-${edition.id}-${i}`}
                      className="inline-block px-1.5 py-px text-[8px] font-mono tracking-widest uppercase bg-white/[0.04] text-muted-foreground/70 rounded-sm"
                    >
                      {t.category}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </nav>
      </motion.div>

      {/* Edition detail + right sidebar */}
      {selected && (
        <div className="flex-1 flex gap-6 min-w-0 p-5 sm:p-7 lg:p-8">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 min-w-0"
        >
          {/* Mobile edition selector */}
          <div className="md:hidden mb-6">
            <select
              value={selected.id}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm text-foreground"
            >
              {editions.map((e) => (
                <option key={e.id} value={e.id}>
                  #{String(e.editionNumber).padStart(2, "0")} - {e.weekRange}
                </option>
              ))}
            </select>
          </div>

          {/* Hero Header with intelligence desk image */}
          <div
            className="relative rounded-2xl overflow-hidden mb-8"
            style={{ minHeight: "280px" }}
          >
            {/* Background image with parallax -- managed in sub-component to avoid ref-not-hydrated warning */}
            <HeroParallaxBg heroImageUrl={(selected as any).heroImageUrl} />
            {/* Layered dark overlays for text legibility */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(4,6,16,0.92) 0%, rgba(4,6,16,0.75) 50%, rgba(4,6,16,0.55) 100%)",
              }}
            />
            {/* Amber bottom glow */}
            <div
              className="absolute bottom-0 left-0 right-0 h-32"
              style={{
                background: "linear-gradient(to top, rgba(245,166,35,0.08) 0%, transparent 100%)",
              }}
            />
            {/* Amber top rule */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: "linear-gradient(90deg, rgba(245,166,35,0.9) 0%, rgba(245,166,35,0.3) 60%, transparent 100%)",
                boxShadow: "0 0 20px rgba(245,166,35,0.4)",
              }}
            />
            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col justify-end" style={{ minHeight: "280px" }}>
              {/* Eyebrow metadata */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span
                  className="font-mono text-[10px] tracking-[0.25em] uppercase px-2.5 py-1 rounded-sm"
                  style={{ background: "rgba(245,166,35,0.15)", color: "rgba(245,166,35,0.9)", border: "1px solid rgba(245,166,35,0.25)" }}
                >
                  Edition #{String(selected.editionNumber).padStart(2, "0")}
                </span>
                <span className="font-mono text-[11px]" style={{ color: "rgba(245,238,220,0.45)" }}>
                  {new Date(selected.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {selected.readingTime && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]" style={{ color: "rgba(245,238,220,0.45)" }}>
                    <Clock className="w-3 h-3" />
                    {selected.readingTime}
                  </span>
                )}
              </div>
              {/* Title */}
              <h2
                className="font-serif font-bold tracking-tight mb-1"
                style={{ fontSize: "clamp(22px, 3vw, 32px)", color: "rgba(245,238,220,0.95)", lineHeight: 1.2 }}
              >
                Week of {selected.weekOf?.replace(/^week of /i, '')}
              </h2>
              <p className="mb-5" style={{ fontSize: "13px", color: "rgba(245,238,220,0.45)" }}>
                {selected.weekRange} coverage period
              </p>
              {/* CTA row */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowReader(true)}
                  className="inline-flex items-center gap-2.5 transition-all duration-200"
                  style={{
                    padding: "10px 20px",
                    background: "rgba(245,166,35,0.12)",
                    border: "1px solid rgba(245,166,35,0.35)",
                    borderRadius: "8px",
                    color: "rgba(245,166,35,0.95)",
                    fontSize: "13px",
                    fontWeight: 500,
                    width: "fit-content",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(245,166,35,0.2)";
                    e.currentTarget.style.borderColor = "rgba(245,166,35,0.55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(245,166,35,0.12)";
                    e.currentTarget.style.borderColor = "rgba(245,166,35,0.35)";
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  Read Full Edition
                </button>
                {isAuthenticated && user?.role === "admin" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleGenerateHeroImage}
                      disabled={generateHeroImage.isPending}
                      title={(selected as any).heroImageUrl ? "Regenerate hero image" : "Generate AI hero image for this edition"}
                      className="inline-flex items-center gap-2 transition-all duration-200"
                      style={{
                        padding: "10px 16px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "8px",
                        color: "rgba(245,238,220,0.6)",
                        fontSize: "12px",
                        fontWeight: 500,
                        width: "fit-content",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    >
                      {generateHeroImage.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      {generateHeroImage.isPending ? "Generating..." : (selected as any).heroImageUrl ? "Regen Image" : "Gen Image"}
                    </button>

                    {/* Generate All Takes: backfill Ruben's Take for all editions */}
                    <button
                      onClick={() => {
                        setBackfillProgress({ done: 0, total: editions?.length ?? 0 });
                        backfillRubensTake.mutate();
                      }}
                      disabled={backfillRubensTake.isPending}
                      title="Generate Ruben's Take for all editions that are missing one"
                      className="inline-flex items-center gap-2 transition-all duration-200"
                      style={{
                        padding: "10px 16px",
                        background: backfillDone ? "rgba(52,211,153,0.12)" : "rgba(245,166,35,0.08)",
                        border: `1px solid ${backfillDone ? "rgba(52,211,153,0.3)" : "rgba(245,166,35,0.25)"}`,
                        borderRadius: "8px",
                        color: backfillDone ? "rgba(52,211,153,0.9)" : "rgba(245,166,35,0.75)",
                        fontSize: "12px",
                        fontWeight: 500,
                        width: "fit-content",
                      }}
                      onMouseEnter={(e) => { if (!backfillRubensTake.isPending) e.currentTarget.style.background = backfillDone ? "rgba(52,211,153,0.18)" : "rgba(245,166,35,0.14)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = backfillDone ? "rgba(52,211,153,0.12)" : "rgba(245,166,35,0.08)"; }}
                    >
                      {backfillRubensTake.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : backfillDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      {backfillRubensTake.isPending
                        ? (backfillProgress ? `Generating ${backfillProgress.done}/${backfillProgress.total}...` : 'Generating...')
                        : backfillDone
                        ? 'All Takes Generated'
                        : 'Generate All Takes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics Comparison */}
          {selected.keyMetrics && (() => {
            const currentMetrics = normaliseKeyMetrics(selected.keyMetrics);
            if (Object.keys(currentMetrics).length === 0) return null;
            const selectedIndex = editions.findIndex((e) => e.id === selected.id);
            const previousEdition = selectedIndex < editions.length - 1 ? editions[selectedIndex + 1] : null;
            const prevMetrics = normaliseKeyMetrics(previousEdition?.keyMetrics);

            return (
              <div
                className="mb-8 p-5 rounded-xl"
                style={{
                  background: "rgba(10, 12, 24, 0.75)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <h3 className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                  Key Metrics
                  {prevMetrics && (
                    <span className="text-muted-foreground/25 font-normal normal-case tracking-normal">
                      vs previous edition
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(currentMetrics)
                    .filter(([key]) => key && key.trim() !== "")
                    .map(([key, value], metricIdx) => {
                    const prevValue = prevMetrics?.[key];
                    const currentNum = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
                    const prevNum = prevValue ? parseFloat(String(prevValue).replace(/[^0-9.-]/g, "")) : null;
                    let trend: "up" | "down" | "flat" | null = null;
                    if (prevNum !== null && !isNaN(currentNum) && !isNaN(prevNum)) {
                      if (currentNum > prevNum) trend = "up";
                      else if (currentNum < prevNum) trend = "down";
                      else trend = "flat";
                    }

                    const sparkData = buildSparklineData(editions, key, selected.editionNumber, 5);
                    const hasSparkData = sparkData.filter((d) => d.v !== null).length >= 2;
                    const sparkColour = trend ? (getTrendColour(key, trend).includes("emerald") ? "#34d399" : getTrendColour(key, trend).includes("red") ? "#f87171" : "#f59e0b") : "rgba(245,238,220,0.25)";
                    // Long-text values (>40 chars) are descriptions, not metrics — render as compact note card
                    const isLongText = String(value).length > 40;
                    if (isLongText) {
                      return (
                        <div key={key || `metric-${metricIdx}`} className="col-span-2 sm:col-span-3 space-y-1 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="font-mono text-[10px] text-muted-foreground/70 tracking-wide uppercase">{key}</p>
                          <p className="text-[12px] text-foreground/80 leading-snug">{String(value)}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={key || `metric-${metricIdx}`} className="space-y-1">
                        <p className="font-mono text-[10px] text-muted-foreground/70 tracking-wide">
                          {key}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-foreground font-mono">
                            {String(value)}
                          </p>
                          {(trend === "up" || trend === "down") ? (() => {
                            const tip = getMetricTooltip(key, trend);
                            const icon = trend === "up"
                              ? <TrendingUp className={`w-3.5 h-3.5 ${getTrendColour(key, trend)}`} />
                              : <TrendingDown className={`w-3.5 h-3.5 ${getTrendColour(key, trend)}`} />;
                            return tip ? (
                              <Tooltip>
                                <TooltipTrigger asChild><span className="cursor-help">{icon}</span></TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-snug bg-[rgba(10,12,24,0.97)] text-[rgba(245,238,220,0.9)] border border-white/10 px-3 py-2 rounded-lg shadow-xl">
                                  {tip}
                                </TooltipContent>
                              </Tooltip>
                            ) : icon;
                          })() : trend === "flat" && <Minus className="w-3.5 h-3.5 text-muted-foreground/70" />}
                        </div>
                        {prevValue && trend && (
                          <p className="font-mono text-[9px] text-muted-foreground/60 flex items-center gap-1">
                            <span>was {String(prevValue)}</span>
                          </p>
                        )}
                        {hasSparkData && (
                          <div className="mt-2 h-8 w-full opacity-60 hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                <Line
                                  type="monotone"
                                  dataKey="v"
                                  stroke={sparkColour}
                                  strokeWidth={1.5}
                                  dot={false}
                                  connectNulls
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent mb-8" />

          {/* Topics */}
          <div className="space-y-6 mb-8">
            <h3 className="font-mono text-[11px] text-muted-foreground/80 tracking-[0.2em] uppercase">
              Deep Dives
            </h3>
            {(selected.topics as any[])?.map((topic: any, i: number) => {
              const catKey = (topic.category || "").toUpperCase();
              const accentBorder =
                catKey === "MACRO" ? "border-amber-500/40" :
                catKey === "PROPERTY" ? "border-emerald-500/40" :
                catKey === "TECH" || catKey === "AI" ? "border-blue-500/40" :
                catKey === "POLICY" ? "border-purple-500/40" :
                catKey === "SCIENCE" ? "border-rose-500/40" :
                catKey === "GEOPOLITICS" ? "border-red-500/40" :
                catKey === "MARKETS" ? "border-orange-500/40" :
                "border-white/[0.12]";
              return (
                <div
                  key={`deepdive-${selected.id}-${i}`}
                  id={`topic-${i}`}
                  className={`rounded-xl border-l-4 ${accentBorder} scroll-mt-6 transition-all duration-200 hover:border-opacity-70`}
                  style={{
                    background: "rgba(10,12,24,0.6)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderLeftWidth: "4px",
                    padding: "20px 20px 16px 20px",
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <CategoryPill category={topic.category} />
                      </div>
                      <h4 className="font-serif text-xl font-semibold text-foreground leading-snug">
                        {topic.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleBookmark(topic.title, topic.summary)}
                      disabled={addToQueue.isPending || bookmarked.has(topic.title)}
                      title={bookmarked.has(topic.title) ? "Saved to Reading Queue" : "Save to Reading Queue"}
                      className={`p-2 shrink-0 rounded-md transition-all duration-200 ${
                        bookmarked.has(topic.title)
                          ? "text-amber-400 bg-amber-500/10"
                          : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-500/30"
                      }`}
                    >
                      {bookmarked.has(topic.title) ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3" style={{ lineHeight: 1.75 }}>
                    {topic.summary}
                  </p>
                  {asStringArray(topic.partnerRelevance).length > 0 && (
                    <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <Users className="w-3 h-3 text-sky-400 shrink-0" />
                      <p className="text-[11px] text-sky-400 leading-relaxed">
                        {asStringArray(topic.partnerRelevance).join(" \u00b7 ")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Key Signals -- grouped by topic category */}
          {selected.signals && (selected.signals as string[]).length > 0 && (() => {
            const allTopics = (selected.topics as any[]) || [];
            const signals = selected.signals as string[];
            // Build category groups: assign each signal to the category of its matching topic (cycling)
            const CAT_META: Record<string, { label: string; borderColor: string; dotClass: string; bgClass: string; headerColor: string }> = {
              MACRO:              { label: "Macro",              borderColor: "rgba(251,191,36,0.3)",  dotClass: "bg-amber-400",   bgClass: "bg-amber-500/[0.06]",   headerColor: "rgba(251,191,36,0.85)"  },
              PROPERTY:           { label: "Property",           borderColor: "rgba(52,211,153,0.3)",  dotClass: "bg-emerald-400", bgClass: "bg-emerald-500/[0.06]", headerColor: "rgba(52,211,153,0.85)"  },
              TECH:               { label: "Tech / AI",          borderColor: "rgba(96,165,250,0.3)",  dotClass: "bg-blue-400",    bgClass: "bg-blue-500/[0.06]",    headerColor: "rgba(96,165,250,0.85)"  },
              AI:                 { label: "Tech / AI",          borderColor: "rgba(96,165,250,0.3)",  dotClass: "bg-blue-400",    bgClass: "bg-blue-500/[0.06]",    headerColor: "rgba(96,165,250,0.85)"  },
              POLICY:             { label: "Policy",             borderColor: "rgba(167,139,250,0.3)", dotClass: "bg-purple-400",  bgClass: "bg-purple-500/[0.06]",  headerColor: "rgba(167,139,250,0.85)" },
              SCIENCE:            { label: "Science",            borderColor: "rgba(251,113,133,0.3)", dotClass: "bg-rose-400",    bgClass: "bg-rose-500/[0.06]",    headerColor: "rgba(251,113,133,0.85)" },
              GEOPOLITICS:        { label: "Geopolitics",        borderColor: "rgba(248,113,113,0.3)", dotClass: "bg-red-400",     bgClass: "bg-red-500/[0.06]",     headerColor: "rgba(248,113,113,0.85)" },
              MARKETS:            { label: "Markets",            borderColor: "rgba(251,146,60,0.3)",  dotClass: "bg-orange-400",  bgClass: "bg-orange-500/[0.06]",  headerColor: "rgba(251,146,60,0.85)"  },
              CULTURE:            { label: "Culture",            borderColor: "rgba(236,72,153,0.3)",  dotClass: "bg-pink-400",    bgClass: "bg-pink-500/[0.06]",    headerColor: "rgba(236,72,153,0.85)"  },
              SPORT:              { label: "Sport",              borderColor: "rgba(132,204,22,0.3)",  dotClass: "bg-lime-400",    bgClass: "bg-lime-500/[0.06]",    headerColor: "rgba(132,204,22,0.85)"  },
              SPORTS:             { label: "Sport",              borderColor: "rgba(132,204,22,0.3)",  dotClass: "bg-lime-400",    bgClass: "bg-lime-500/[0.06]",    headerColor: "rgba(132,204,22,0.85)"  },
              "GLOBAL PUBLIC PULSE": { label: "Global Public Pulse", borderColor: "rgba(139,92,246,0.3)", dotClass: "bg-violet-400", bgClass: "bg-violet-500/[0.06]", headerColor: "rgba(139,92,246,0.85)" },
              GLOBALPUBLICPULSE:  { label: "Global Public Pulse", borderColor: "rgba(139,92,246,0.3)", dotClass: "bg-violet-400", bgClass: "bg-violet-500/[0.06]", headerColor: "rgba(139,92,246,0.85)" },
              CRYPTO:             { label: "Crypto",             borderColor: "rgba(234,179,8,0.3)",   dotClass: "bg-yellow-400",  bgClass: "bg-yellow-500/[0.06]",  headerColor: "rgba(234,179,8,0.85)"   },
              HEALTH:             { label: "Health",             borderColor: "rgba(20,184,166,0.3)",  dotClass: "bg-teal-400",    bgClass: "bg-teal-500/[0.06]",    headerColor: "rgba(20,184,166,0.85)"  },
              CLIMATE:            { label: "Climate",            borderColor: "rgba(34,197,94,0.3)",   dotClass: "bg-green-400",   bgClass: "bg-green-500/[0.06]",   headerColor: "rgba(34,197,94,0.85)"   },
              OTHER:              { label: "Other",              borderColor: "rgba(100,116,139,0.3)", dotClass: "bg-slate-400",   bgClass: "bg-slate-500/[0.06]",   headerColor: "rgba(100,116,139,0.85)" },
            };
            // Keyword-based signal categorisation — avoids all-same-category bug when only 1 topic exists
            function detectSignalCategory(text: string): string {
              const t = text.toLowerCase();
              if (/clearance|dwelling|housing|property|auction|rent|landlord|tenant|mortgage|suburb|sqm|vacancy|listing|home loan|buyer|seller|real estate/.test(t)) return "PROPERTY";
              if (/rba|interest rate|inflation|cpi|gdp|unemployment|recession|monetary|fiscal|budget|deficit|surplus|treasury|reserve bank|cash rate/.test(t)) return "MACRO";
              if (/asx|s&p|nasdaq|dow|share|stock|equity|bond|yield|spread|etf|fund|dividend|ipo|market cap|futures|options|commodity/.test(t)) return "MARKETS";
              if (/\bai\b|artificial intelligence|machine learning|llm|openai|google|microsoft|nvidia|automation|robot|algorithm|data centre|chip|semiconductor/.test(t)) return "AI";
              if (/government|policy|regulation|legislation|tax|reform|election|parliament|minister|ato|apra|asic|compliance|law|bill|senate/.test(t)) return "POLICY";
              if (/bitcoin|ethereum|crypto|blockchain|defi|nft|web3|solana|binance|coinbase/.test(t)) return "CRYPTO";
              if (/world cup|fifa|nba|nfl|afl|nrl|cricket|tennis|wimbledon|olympics|formula 1|\bf1\b|grand prix|sport|soccer|football|basketball|rugby|golf|ufc|mma/.test(t)) return "SPORT";
              if (/bts|k-pop|kpop|taylor swift|beyonc|oscar|grammy|emmy|netflix|spotify|music|film|movie|tv show|celebrity|fashion|art|concert|album|box office/.test(t)) return "CULTURE";
              if (/reddit|twitter|\bx\.com\b|trending|viral|meme|social media|tiktok|instagram|youtube|hashtag|thread|post went/.test(t)) return "GLOBAL PUBLIC PULSE";
              if (/pandemic|virus|covid|vaccine|outbreak|who|health|medical|hospital|disease|cancer|mental health/.test(t)) return "HEALTH";
              if (/climate|carbon|emission|net zero|solar|wind|renewable|drought|flood|wildfire|hurricane|earthquake|disaster/.test(t)) return "CLIMATE";
              if (/oil|brent|crude|iron ore|copper|gold|silver|lithium|coal|gas|lng|aud|usd|currency|exchange rate|trade|export|import/.test(t)) return "MARKETS";
              if (/science|research|study|discovery|space|nasa|quantum/.test(t)) return "SCIENCE";
              if (/tech|technology|software|app|platform|startup|digital/.test(t)) return "AI";
              if (/china|us |europe|global|geopolit|war|conflict|sanction|tariff|nato|\bun\b|imf|world bank|russia|ukraine|middle east|israel|iran/.test(t)) return "GEOPOLITICS";
              return "OTHER";
            }
            // Build flat list with meta for each signal
            const flatSignals = signals.map((signal, idx) => {
              const rawKey = detectSignalCategory(signal);
              const catKey = rawKey === "TECH" ? "AI" : rawKey;
              const meta = CAT_META[catKey] || { label: catKey, borderColor: "rgba(255,255,255,0.1)", dotClass: "bg-white/30", bgClass: "bg-white/[0.03]", headerColor: "rgba(255,255,255,0.5)" };
              return { signal, idx, catKey, meta };
            });
            const uniqueCats = Array.from(new Set(flatSignals.map(s => s.catKey))).length;
            return (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(10, 12, 24, 0.75)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
                  <h3 className="font-mono text-[11px] text-muted-foreground/80 tracking-[0.2em] uppercase">
                    Key Signals
                  </h3>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">{signals.length} signals across {uniqueCats} categories</p>
                </div>
                {/* Flat masonry grid — category badge on each card */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {flatSignals.map(({ signal, idx, meta }) => {
                    const isSaved = bookmarked.has(signal);
                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 px-3 py-2.5 rounded-lg"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderLeft: `2px solid ${meta.borderColor}`,
                        }}
                      >
                        {/* Category badge row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${meta.dotClass} shrink-0`} />
                            <span
                              className="font-mono text-[9px] tracking-[0.18em] uppercase font-semibold"
                              style={{ color: meta.headerColor }}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmark(signal, `Signal from Edition #${selected?.editionNumber}`);
                            }}
                            disabled={isSaved}
                            title={isSaved ? "Saved" : "Save to Reading Queue"}
                            className={`transition-colors shrink-0 ${
                              isSaved ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-400"
                            }`}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-3 h-3" />
                            ) : (
                              <Bookmark className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {/* Signal text */}
                        <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
                          {signal}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </motion.div>

        {/* Sticky right sidebar */}
        <aside className="hidden xl:block w-72 shrink-0">
          <div className="sticky top-6 space-y-4">
            {/* Edition at a glance */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: "rgba(10, 12, 24, 0.75)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <h4 className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.2em] uppercase mb-3">At a Glance</h4>
              <div className="space-y-1">
                {(selected.topics as any[])?.map((topic: any, i: number) => {
                  const catKey = topic.category?.toUpperCase();
                  const dotColor =
                    catKey === "MACRO" ? "bg-amber-400" :
                    catKey === "PROPERTY" ? "bg-emerald-400" :
                    catKey === "TECH" || catKey === "AI" ? "bg-blue-400" :
                    catKey === "POLICY" ? "bg-purple-400" :
                    catKey === "SCIENCE" ? "bg-rose-400" :
                    catKey === "GEOPOLITICS" ? "bg-red-400" :
                    catKey === "MARKETS" ? "bg-orange-400" :
                    "bg-white/30";
                  return (
                    <button
                      key={`toc-${selected.id}-${i}`}
                      onClick={() => {
                        const el = document.getElementById(`topic-${i}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="w-full text-left flex items-start gap-2.5 py-1.5 px-2 rounded-md hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                      <span className="text-[11px] text-muted-foreground/80 group-hover:text-foreground/90 transition-colors leading-snug line-clamp-2">
                        {topic.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category breakdown */}
            {(() => {
              const cats = (selected.topics as any[])?.reduce((acc: Record<string, number>, t: any) => {
                const rawK = t.category?.toUpperCase();
                const k = (rawK && rawK.trim() !== "") ? rawK : "OTHER";
                acc[k] = (acc[k] || 0) + 1;
                return acc;
              }, {});
              if (!cats || Object.keys(cats).length === 0) return null;
              return (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(10, 12, 24, 0.75)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <h4 className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.2em] uppercase mb-3">Coverage</h4>
                  <div className="space-y-2">
                    {Object.entries(cats).map(([cat, count]) => {
                      const barColor =
                        cat === "MACRO" ? "bg-amber-400" :
                        cat === "PROPERTY" ? "bg-emerald-400" :
                        cat === "TECH" || cat === "AI" ? "bg-blue-400" :
                        cat === "POLICY" ? "bg-purple-400" :
                        cat === "SCIENCE" ? "bg-rose-400" :
                        cat === "GEOPOLITICS" ? "bg-red-400" :
                        cat === "MARKETS" ? "bg-orange-400" :
                        "bg-white/30";
                      const total = (selected.topics as any[])?.length || 1;
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-mono text-[9px] text-muted-foreground/70 tracking-wider uppercase">{cat}</span>
                              <span className="font-mono text-[9px] text-muted-foreground/50">{count as number}</span>
                            </div>
                            <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barColor} rounded-full`}
                                style={{ width: `${((count as number) / total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Edition stats */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: "rgba(10, 12, 24, 0.75)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <h4 className="font-mono text-[9px] text-muted-foreground/70 tracking-[0.2em] uppercase mb-3">Edition Stats</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/70">Deep Dives</span>
                  <span className="font-mono text-[11px] text-foreground/90">{(selected.topics as any[])?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/70">Key Signals</span>
                  <span className="font-mono text-[11px] text-foreground/90">{(selected.signals as any[])?.length || 0}</span>
                </div>
                {selected.readingTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/70">Reading Time</span>
                    <span className="font-mono text-[11px] text-foreground/90">{selected.readingTime}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/70">Published</span>
                  <span className="font-mono text-[11px] text-foreground/90">
                    {new Date(selected.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Read Full Edition CTA */}
            <button
              onClick={() => setShowReader(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[12px] font-medium transition-all duration-200"
              style={{
                background: "rgba(245,166,35,0.12)",
                border: "1px solid rgba(245,166,35,0.35)",
                color: "rgba(245,166,35,0.95)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,166,35,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,166,35,0.12)"; }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Read Full Edition
            </button>
          </div>
        </aside>

        </div>
      )}

      {/* Full-page newspaper reader */}
      {showReader && selected && editions && (
        <EditionReader
          edition={selected as EditionType}
          allEditions={editions as EditionType[]}
          bookmarked={bookmarked}
          onBookmark={handleBookmark}
          onClose={() => setShowReader(false)}
        />
      )}
    </div>
  );
}
