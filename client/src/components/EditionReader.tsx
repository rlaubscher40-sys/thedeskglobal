/**
 * EditionReader -- full-viewport newspaper broadsheet overlay
 *
 * Layout:
 *   1. Sticky close bar (full width)
 *   2. Masthead (full bleed, large serif, amber rule, edition meta)
 *   3. Editor's Briefing (2-column body text, wide container)
 *   4. Market Snapshot bar (full-bleed dark strip, horizontal metric tiles)
 *   5. Deep Dives:
 *      - Lead story: full-width hero card with large headline + 2-col body
 *      - Remaining topics: responsive 3-col grid (2 on md, 3 on xl)
 *      - Each topic: body, key takeaway callout, what to watch, talking points
 *   6. Signals briefs: 3-col grid
 *   7. Footer rule
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Bookmark,
  BookmarkCheck,
  Radio,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Eye,
  MessageSquare,
  Zap,
  Share2,
  Pen,
  ExternalLink,
  Linkedin,
  Check,
  Copy,
} from "lucide-react";
import type { Edition, EditionTopic } from "../../../drizzle/schema";
import { getTrendColour, getMetricTooltip } from "@/lib/normaliseKeyMetrics";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LinkedInPostModal } from "@/components/LinkedInPostModal";

// ─── Category colour map ──────────────────────────────────────────────────────

const CAT: Record<string, { bg: string; text: string; border: string; dot: string; accent: string }> = {
  MACRO:       { bg: "rgba(245,166,35,0.1)",  text: "rgba(245,166,35,0.95)",  border: "rgba(245,166,35,0.25)",  dot: "#f5a623", accent: "rgba(245,166,35,0.6)" },
  PROPERTY:    { bg: "rgba(52,211,153,0.1)",  text: "rgba(52,211,153,0.95)",  border: "rgba(52,211,153,0.25)",  dot: "#34d399", accent: "rgba(52,211,153,0.6)" },
  TECH:        { bg: "rgba(96,165,250,0.1)",  text: "rgba(96,165,250,0.95)",  border: "rgba(96,165,250,0.25)",  dot: "#60a5fa", accent: "rgba(96,165,250,0.6)" },
  POLICY:      { bg: "rgba(167,139,250,0.1)", text: "rgba(167,139,250,0.95)", border: "rgba(167,139,250,0.25)", dot: "#a78bfa", accent: "rgba(167,139,250,0.6)" },
  SCIENCE:     { bg: "rgba(251,113,133,0.1)", text: "rgba(251,113,133,0.95)", border: "rgba(251,113,133,0.25)", dot: "#fb7185", accent: "rgba(251,113,133,0.6)" },
  MARKETS:     { bg: "rgba(251,146,60,0.1)",  text: "rgba(251,146,60,0.95)",  border: "rgba(251,146,60,0.25)",  dot: "#fb923c", accent: "rgba(251,146,60,0.6)" },
  AI:          { bg: "rgba(34,211,238,0.1)",  text: "rgba(34,211,238,0.95)",  border: "rgba(34,211,238,0.25)",  dot: "#22d3ee", accent: "rgba(34,211,238,0.6)" },
  GEOPOLITICS: { bg: "rgba(248,113,113,0.1)", text: "rgba(248,113,113,0.95)", border: "rgba(248,113,113,0.25)", dot: "#f87171", accent: "rgba(248,113,113,0.6)" },
  ECONOMICS:   { bg: "rgba(245,166,35,0.1)",  text: "rgba(245,166,35,0.95)",  border: "rgba(245,166,35,0.25)",  dot: "#f5a623", accent: "rgba(245,166,35,0.6)" },
};

function getCat(category: string) {
  return CAT[category?.toUpperCase()] ?? {
    bg: "rgba(255,255,255,0.06)", text: "rgba(245,238,220,0.7)",
    border: "rgba(255,255,255,0.1)", dot: "rgba(245,238,220,0.4)", accent: "rgba(245,238,220,0.4)",
  };
}

function CategoryPill({ category }: { category: string }) {
  const s = getCat(category);
  return (
    <span
      className="inline-block px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-[0.2em] uppercase rounded-sm border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {category}
    </span>
  );
}

function TrendIcon({ trend, label = "" }: { trend: "up" | "down" | "flat" | null; label?: string }) {
  if (trend === "flat") return <Minus className="w-3.5 h-3.5 text-white/25 shrink-0" />;
  if (trend !== "up" && trend !== "down") return null;
  const icon = trend === "up"
    ? <TrendingUp   className={`w-3.5 h-3.5 shrink-0 ${getTrendColour(label, "up")}`} />
    : <TrendingDown className={`w-3.5 h-3.5 shrink-0 ${getTrendColour(label, "down")}`} />;
  const tip = label ? getMetricTooltip(label, trend) : null;
  if (!tip) return icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="cursor-help shrink-0">{icon}</span></TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-snug bg-[rgba(10,12,24,0.97)] text-[rgba(245,238,220,0.9)] border border-white/10 px-3 py-2 rounded-lg shadow-xl">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Lead Story (full width hero) ────────────────────────────────────────────

interface LeadStoryProps {
  topic: EditionTopic;
  editionNumber: number;
  bookmarked: Set<string>;
  onBookmark: (title: string, summary: string) => void;
  onLinkedInPost?: (text: string, label: string) => void;
}

function LeadStory({ topic, editionNumber, bookmarked, onBookmark, onLinkedInPost }: LeadStoryProps) {
  const [expanded, setExpanded] = useState(true);
  const s = getCat(topic.category);
  const isSaved = bookmarked.has(topic.title);
  const hasDeep = !!(topic.body || topic.keyTakeaway || topic.whatToWatch?.length || topic.talkingPoints);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(10,12,24,0.95) 0%, rgba(14,16,28,0.9) 100%)",
        border: `1px solid ${s.border}`,
        borderLeft: `4px solid ${s.dot}`,
        boxShadow: `0 0 60px rgba(0,0,0,0.5), 0 0 120px ${s.bg}`,
      }}
    >
      {/* Hero header */}
      <div className="p-8 md:p-12 pb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }} />
            <CategoryPill category={topic.category} />
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase px-2 py-0.5 rounded-sm"
              style={{ color: "rgba(245,166,35,0.8)", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
              Lead Story
            </span>
          </div>
          <button
            onClick={() => onBookmark(topic.title, topic.summary)}
            disabled={isSaved}
            title={isSaved ? "Saved" : "Save to Reading Queue"}
            className="p-2 rounded-lg transition-all shrink-0"
            style={{
              color: isSaved ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.4)",
              background: isSaved ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isSaved ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {/* Large headline */}
        <h2
          className="font-serif font-black leading-none mb-6"
          style={{
            fontSize: "clamp(28px, 4.5vw, 56px)",
            color: "rgba(245,238,220,0.98)",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          {topic.title}
        </h2>

        {/* 2-column summary layout on wide screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
          <p
            className="leading-relaxed text-base"
            style={{ color: "rgba(245,238,220,0.72)", lineHeight: 1.85, fontSize: "15px" }}
          >
            {topic.summary}
          </p>
          {topic.keyTakeaway && (
            <div
              className="flex items-start gap-3 p-5 rounded-xl self-start"
              style={{
                background: "rgba(245,166,35,0.07)",
                border: "1px solid rgba(245,166,35,0.22)",
                boxShadow: "0 0 24px rgba(245,166,35,0.05)",
              }}
            >
              <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "rgba(245,166,35,0.85)" }} />
              <div>
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: "rgba(245,166,35,0.65)" }}>
                  Key Takeaway
                </p>
                <p className="text-sm font-medium leading-relaxed" style={{ color: "rgba(245,238,220,0.92)", lineHeight: 1.7 }}>
                  {topic.keyTakeaway}
                </p>
              </div>
            </div>
          )}
        </div>

        {topic.partnerRelevance && topic.partnerRelevance.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(96,165,250,0.7)" }} />
            <p className="text-xs" style={{ color: "rgba(96,165,250,0.7)" }}>
              {topic.partnerRelevance.join(" · ")}
            </p>
          </div>
        )}
      </div>

      {/* Deep dive toggle */}
      {hasDeep && (
        <>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-8 md:px-12 py-3 transition-all"
            style={{
              background: expanded ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(245,238,220,0.45)",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.18em",
            }}
          >
            <span className="uppercase">{expanded ? "Collapse deep dive" : "Read deep dive"}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <DeepContent topic={topic} wide onLinkedInPost={onLinkedInPost} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Secondary topic card ─────────────────────────────────────────────────────

interface TopicCardProps {
  topic: EditionTopic;
  editionNumber: number;
  bookmarked: Set<string>;
  onBookmark: (title: string, summary: string) => void;
  onLinkedInPost?: (text: string, label: string) => void;
}

function TopicCard({ topic, editionNumber, bookmarked, onBookmark, onLinkedInPost }: TopicCardProps) {
  const [expanded, setExpanded] = useState(false);
  const s = getCat(topic.category);
  const isSaved = bookmarked.has(topic.title);
  const hasDeep = !!(topic.body || topic.keyTakeaway || topic.whatToWatch?.length || topic.talkingPoints);

  return (
    <div
      className="rounded-xl overflow-hidden break-inside-avoid mb-5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${s.border}`,
        borderTop: `3px solid ${s.dot}`,
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
            <CategoryPill category={topic.category} />
          </div>
          <button
            onClick={() => onBookmark(topic.title, topic.summary)}
            disabled={isSaved}
            title={isSaved ? "Saved" : "Save"}
            className="p-1.5 rounded-md transition-all shrink-0"
            style={{
              color: isSaved ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.3)",
              background: isSaved ? "rgba(245,166,35,0.1)" : "transparent",
              border: `1px solid ${isSaved ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        <h3
          className="font-serif font-bold leading-tight mb-3"
          style={{ fontSize: "clamp(17px, 2vw, 22px)", color: "rgba(245,238,220,0.97)", letterSpacing: "-0.018em" }}
        >
          {topic.title}
        </h3>

        <p className="text-sm leading-relaxed" style={{ color: "rgba(245,238,220,0.62)", lineHeight: 1.8 }}>
          {topic.summary}
        </p>

        {topic.partnerRelevance && topic.partnerRelevance.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-4">
            <Users className="w-3 h-3 shrink-0" style={{ color: "rgba(96,165,250,0.65)" }} />
            <p className="text-[11px]" style={{ color: "rgba(96,165,250,0.65)" }}>
              {topic.partnerRelevance.join(" · ")}
            </p>
          </div>
        )}
      </div>

      {hasDeep && (
        <>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-2.5 transition-all"
            style={{
              background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(245,238,220,0.4)",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.15em",
            }}
          >
            <span className="uppercase">{expanded ? "Collapse" : "Read deep dive"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <DeepContent topic={topic} onLinkedInPost={onLinkedInPost} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Shared deep-dive content ─────────────────────────────────────────────────

function DeepContent({ topic, wide = false, onLinkedInPost }: { topic: EditionTopic; wide?: boolean; onLinkedInPost?: (text: string, label: string) => void }) {
  const s = getCat(topic.category);
  return (
    <div
      className="space-y-6"
      style={{
        padding: wide ? "32px 48px 40px" : "20px 24px 28px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Body analysis */}
      {topic.body && (
        <div className={wide ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : ""}>
          <div>
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase mb-3" style={{ color: s.accent }}>
              Analysis
            </p>
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "rgba(245,238,220,0.72)", lineHeight: 1.9, fontSize: wide ? "14.5px" : "13.5px" }}
            >
              {topic.body}
            </div>
          </div>

          {/* What to watch -- sits beside body on wide layout */}
          {wide && topic.whatToWatch && topic.whatToWatch.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-3.5 h-3.5" style={{ color: "rgba(96,165,250,0.75)" }} />
                <p className="font-mono text-[9px] tracking-[0.28em] uppercase" style={{ color: "rgba(96,165,250,0.75)" }}>
                  What to Watch
                </p>
              </div>
              <ul className="space-y-3">
                {topic.whatToWatch.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: "rgba(96,165,250,0.5)" }} />
                    <p className="text-sm" style={{ color: "rgba(245,238,220,0.65)", lineHeight: 1.7 }}>{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* What to watch -- stacked layout (non-wide) */}
      {!wide && topic.whatToWatch && topic.whatToWatch.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-3.5 h-3.5" style={{ color: "rgba(96,165,250,0.75)" }} />
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase" style={{ color: "rgba(96,165,250,0.75)" }}>
              What to Watch
            </p>
          </div>
          <ul className="space-y-2.5">
            {topic.whatToWatch.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: "rgba(96,165,250,0.5)" }} />
                <p className="text-sm" style={{ color: "rgba(245,238,220,0.62)", lineHeight: 1.65 }}>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key takeaway -- only shown in stacked (non-wide) layout; wide layout shows it in the header */}
      {!wide && topic.keyTakeaway && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "rgba(245,166,35,0.07)",
            border: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(245,166,35,0.8)" }} />
          <div>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase mb-1.5" style={{ color: "rgba(245,166,35,0.65)" }}>
              Key Takeaway
            </p>
            <p className="text-sm font-medium" style={{ color: "rgba(245,238,220,0.9)", lineHeight: 1.65 }}>
              {topic.keyTakeaway}
            </p>
          </div>
        </div>
      )}

      {/* Talking points */}
      {topic.talkingPoints && Object.keys(topic.talkingPoints).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-3.5 h-3.5" style={{ color: "rgba(52,211,153,0.75)" }} />
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase" style={{ color: "rgba(52,211,153,0.75)" }}>
              Talking Points by Partner Type
            </p>
          </div>
          <div className={`grid gap-3 ${wide ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
            {Object.entries(topic.talkingPoints).map(([partner, point], pIdx) => (
              <div
                key={partner || `partner-${pIdx}`}
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(52,211,153,0.05)",
                  border: "1px solid rgba(52,211,153,0.12)",
                }}
              >
                <p className="font-mono text-[9px] tracking-wide uppercase mb-2" style={{ color: "rgba(52,211,153,0.75)" }}>
                  {partner}
                </p>
                <p className="text-sm mb-2.5" style={{ color: "rgba(245,238,220,0.68)", lineHeight: 1.65 }}>
                  {point as string}
                </p>
                <button
                  onClick={() => {
                    // LinkedIn post format: single-line paragraphs, hook first, source attribution, no hashtags
                    const pointText = (point as string).trim();
                    const topicTitle = topic.title || '';
                    const text = `${pointText}\n\nThis week in property: ${topicTitle}\n\nFrom The Desk -- weekly intelligence for property investment professionals.\n\nLink in comments.\n\n@Arjun Paliwal @InvestorKit`;
                    onLinkedInPost?.(text, partner);
                  }}
                  className="inline-flex items-center gap-1 font-mono uppercase tracking-widest transition-colors"
                  style={{ fontSize: '8px', color: 'rgba(52,211,153,0.5)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(52,211,153,0.9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(52,211,153,0.5)')}
                >
                  <Zap className="w-2.5 h-2.5" />
                  Post to LinkedIn
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EditionReaderProps {
  edition: Edition;
  allEditions: Edition[];
  bookmarked: Set<string>;
  onBookmark: (title: string, summary: string) => void;
  onClose: () => void;
}

export default function EditionReader({ edition, allEditions, bookmarked, onBookmark, onClose }: EditionReaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [editingTake, setEditingTake] = useState(false);
  const [takeText, setTakeText] = useState(edition.rubensTake ?? '');
  const [showSubstackPrompt, setShowSubstackPrompt] = useState(false);
  const [substackDismissed, setSubstackDismissed] = useState(false);
  const updateTake = trpc.editions.updateRubensTake.useMutation({
    onSuccess: () => setEditingTake(false),
  });
  const generateTakeMutation = trpc.editions.generateRubensTake.useMutation({
    onSuccess: (data) => {
      setTakeText(data.rubensTake);
      // Optimistically show the new take without closing the edit mode
      setEditingTake(true);
    },
  });

  // Substack draft modal state
  const [showSubstackDraft, setShowSubstackDraft] = useState(false);
  const [substackDraft, setSubstackDraft] = useState<{ title: string; subtitle: string; body: string; imageUrl: string | null } | null>(() => {
    // Pre-populate from saved draft if it exists
    if (edition.substackDraftTitle && edition.substackDraftBody) {
      return {
        title: edition.substackDraftTitle,
        subtitle: edition.substackDraftSubtitle ?? '',
        body: edition.substackDraftBody,
        imageUrl: edition.substackDraftImageUrl ?? null,
      };
    }
    return null;
  });
  // Editable draft fields
  const [draftTitle, setDraftTitle] = useState(edition.substackDraftTitle ?? '');
  const [draftSubtitle, setDraftSubtitle] = useState(edition.substackDraftSubtitle ?? '');
  const [draftBody, setDraftBody] = useState(edition.substackDraftBody ?? '');
  const [draftCopied, setDraftCopied] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [liModalOpen, setLiModalOpen] = useState(false);
  const [liPostText, setLiPostText] = useState("");
  const [liLabel, setLiLabel] = useState("LinkedIn Post");
  const saveSubstackDraft = trpc.editions.saveSubstackDraft.useMutation({
    onSuccess: () => { setDraftSaved(true); setTimeout(() => setDraftSaved(false), 2500); },
  });
  const generateSubstackDraft = trpc.editions.generateSubstackDraft.useMutation({
    onSuccess: (data) => {
      setSubstackDraft(data);
      setDraftTitle(data.title);
      setDraftSubtitle(data.subtitle);
      setDraftBody(data.body);
      setShowSubstackDraft(true);
    },
  });
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const pct = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    if (pct > 0.85 && !substackDismissed) setShowSubstackPrompt(true);
  };

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const topics = (edition.topics as EditionTopic[]) ?? [];
  const signals = (edition.signals as string[]) ?? [];

  // Normalise keyMetrics: accept both array [{label,value,trend?,note?}] and flat {key:value} formats
  type MetricItem = { label: string; value: string; trend?: string; note?: string };
  const rawMetrics = edition.keyMetrics;
  const metricItems: MetricItem[] = Array.isArray(rawMetrics)
    ? (rawMetrics as MetricItem[])
    : rawMetrics && typeof rawMetrics === "object"
    ? Object.entries(rawMetrics as Record<string, string | number>).map(([label, value]) => ({ label, value: String(value) }))
    : [];

  const idx = allEditions.findIndex((e) => e.id === edition.id);
  const prevEdition = idx < allEditions.length - 1 ? allEditions[idx + 1] : null;
  const prevRawMetrics = prevEdition?.keyMetrics;
  const prevMetricMap: Record<string, string> = Array.isArray(prevRawMetrics)
    ? Object.fromEntries((prevRawMetrics as MetricItem[]).map((m) => [m.label, m.value]))
    : prevRawMetrics && typeof prevRawMetrics === "object"
    ? Object.fromEntries(Object.entries(prevRawMetrics as Record<string, string | number>).map(([k, v]) => [k, String(v)]))
    : {};

  const publishDate = new Date(edition.publishedAt).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <AnimatePresence>
      <motion.div
        key="edition-reader-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "#06080f" }}
      >
        {/* ── Sticky close bar ── */}
        <div
          className="flex-none flex items-center justify-between px-6 md:px-10 py-3"
          style={{
            background: "rgba(6,8,15,0.97)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-3">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[10px] tracking-[0.28em] uppercase" style={{ color: "rgba(245,166,35,0.85)" }}>
              The Desk
            </span>
            <span className="font-mono text-[10px]" style={{ color: "rgba(245,238,220,0.22)" }}>
              Edition #{String(edition.editionNumber).padStart(2, "0")}
            </span>
            {edition.readingTime && (
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px]" style={{ color: "rgba(245,238,220,0.28)" }}>
                <Clock className="w-3 h-3" />
                {edition.readingTime}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close edition reader"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all"
            style={{ color: "rgba(245,238,220,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(245,238,220,0.9)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(245,238,220,0.5)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>

          {/* ── Masthead (full bleed) ── */}
          <div
            className="w-full text-center"
            style={{
              padding: "56px 24px 40px",
              background: "linear-gradient(180deg, rgba(10,8,4,0.9) 0%, rgba(6,8,15,0) 100%)",
              borderBottom: "2px solid rgba(245,166,35,0.5)",
            }}
          >
            <div
              className="w-32 h-[2px] mx-auto mb-6"
              style={{ background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.9), transparent)" }}
            />
            <p className="font-mono text-[9px] tracking-[0.5em] uppercase mb-4" style={{ color: "rgba(245,166,35,0.7)" }}>
              Weekly Intelligence Briefing
            </p>
            <h1
              className="font-serif font-black tracking-tight"
              style={{
                fontSize: "clamp(52px, 9vw, 110px)",
                color: "rgba(245,238,220,0.98)",
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
              }}
            >
              THE DESK
            </h1>
            <div className="w-full h-px my-5 mx-auto max-w-2xl" style={{ background: "rgba(245,238,220,0.1)" }} />
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <span className="font-mono text-[12px]" style={{ color: "rgba(245,238,220,0.5)" }}>{publishDate}</span>
              <span className="font-mono text-[12px]" style={{ color: "rgba(245,238,220,0.18)" }}>|</span>
              <span className="font-mono text-[12px]" style={{ color: "rgba(245,238,220,0.5)" }}>{edition.weekRange}</span>
              {topics.length > 0 && (
                <>
                  <span className="font-mono text-[12px]" style={{ color: "rgba(245,238,220,0.18)" }}>|</span>
                  <span className="font-mono text-[12px]" style={{ color: "rgba(245,238,220,0.5)" }}>
                    {topics.length} deep dive{topics.length !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Hero Image (when available) ── */}
          {edition.heroImageUrl && (
            <div className="relative w-full" style={{ maxHeight: "420px", overflow: "hidden" }}>
              <img
                src={edition.heroImageUrl}
                alt={`Edition ${edition.editionNumber} cover`}
                className="w-full object-cover"
                style={{ maxHeight: "420px", display: "block" }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, rgba(6,8,15,0.15) 0%, rgba(6,8,15,0.0) 40%, rgba(6,8,15,0.85) 100%)",
                }}
              />
            </div>
          )}

          {/* ── Ruben's Take ── */}
          <div
            style={{
              padding: "40px 5vw 36px",
              borderBottom: "1px solid rgba(245,166,35,0.15)",
              background: "linear-gradient(135deg, rgba(245,166,35,0.04) 0%, rgba(6,8,15,0) 60%)",
            }}
          >
            <div className="max-w-3xl mx-auto">
              {/* Header row */}
              <div className="flex items-center gap-4 mb-5">
                <img
                  src="/manus-storage/ruben_headshot_a071a9dd.jpeg"
                  alt="Ruben Laubscher"
                  className="w-10 h-10 rounded-full object-cover object-top flex-none"
                  style={{ border: "2px solid rgba(245,166,35,0.4)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[9px] tracking-[0.35em] uppercase mb-0.5" style={{ color: "rgba(245,166,35,0.75)" }}>
                    Ruben's Take
                  </p>
                  <p className="font-mono text-[10px]" style={{ color: "rgba(245,238,220,0.35)" }}>
                    Ruben Laubscher &middot; Head of Partnerships, InvestorKit
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateTakeMutation.mutate({ editionId: edition.id })}
                      disabled={generateTakeMutation.isPending}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-all"
                      style={{ color: "rgba(52,211,153,0.6)", border: "1px solid rgba(52,211,153,0.2)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "rgba(52,211,153,0.9)"; e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(52,211,153,0.6)"; e.currentTarget.style.borderColor = "rgba(52,211,153,0.2)"; }}
                      title="Auto-generate Ruben's Take using AI"
                    >
                      <Zap className="w-3 h-3" />
                      {generateTakeMutation.isPending ? 'Generating...' : 'AI Generate'}
                    </button>
                    <button
                      onClick={() => setEditingTake(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-all"
                      style={{ color: "rgba(245,166,35,0.6)", border: "1px solid rgba(245,166,35,0.2)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,166,35,0.9)"; e.currentTarget.style.borderColor = "rgba(245,166,35,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,166,35,0.6)"; e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)"; }}
                    >
                      <Pen className="w-3 h-3" />
                      {edition.rubensTake ? 'Edit' : 'Add Take'}
                    </button>
                  </div>
                )}
              </div>
              {/* Content */}
              {editingTake ? (
                <div className="space-y-3">
                  <textarea
                    value={takeText}
                    onChange={e => setTakeText(e.target.value)}
                    placeholder="Write your take on this edition's biggest signal. 2-4 sentences, plain language, no marketing. What does this week mean for property investors?"
                    rows={4}
                    className="w-full rounded-lg px-4 py-3 text-sm font-sans resize-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(245,166,35,0.3)",
                      color: "rgba(245,238,220,0.9)",
                      outline: "none",
                      lineHeight: 1.7,
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTake.mutate({ editionId: edition.id, rubensTake: takeText })}
                      disabled={updateTake.isPending}
                      className="px-4 py-2 rounded text-xs font-mono"
                      style={{ background: "rgba(245,166,35,0.9)", color: "#0a0804" }}
                    >
                      {updateTake.isPending ? 'Saving...' : 'Save Take'}
                    </button>
                    <button
                      onClick={() => { setEditingTake(false); setTakeText(edition.rubensTake ?? ''); }}
                      className="px-4 py-2 rounded text-xs font-mono"
                      style={{ color: "rgba(245,238,220,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : edition.rubensTake ? (
                <p
                  className="font-serif text-base leading-relaxed"
                  style={{ color: "rgba(245,238,220,0.82)", fontStyle: "italic", lineHeight: 1.75 }}
                >
                  "{edition.rubensTake}"
                </p>
              ) : isAdmin ? (
                <p className="text-sm" style={{ color: "rgba(245,238,220,0.3)", fontStyle: "italic" }}>
                  No take written yet. Click "Add Take" to share your perspective on this edition.
                </p>
              ) : null}
              {/* Share + Substack row */}
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                {edition.rubensTake && (
                  <button
                    onClick={() => {
                      const take = edition.rubensTake!;
                      const topicList = topics.slice(0,3).map((t: any) => t.title).join('\n');
                      // LinkedIn format: hook (Ruben's Take), context lines, question, attribution
                      const post = `${take}\n\nThis week's edition covered:\n\n${topicList}\n\nIf you work in property, financial advice, or mortgage broking, the pattern here is worth watching.\n\nWhat's the most underrated signal in property right now?\n\nLink in comments.\n\n@Arjun Paliwal @InvestorKit`;
                      setLiPostText(post);
                      setLiLabel("Ruben's Take");
                      setLiModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-mono transition-all px-3 py-1.5 rounded"
                    style={{ color: "rgba(10,132,255,0.8)", border: "1px solid rgba(10,132,255,0.2)", background: "rgba(10,132,255,0.06)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "rgba(10,132,255,1)"; e.currentTarget.style.borderColor = "rgba(10,132,255,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(10,132,255,0.8)"; e.currentTarget.style.borderColor = "rgba(10,132,255,0.2)"; }}
                  >
                    <Linkedin className="w-3 h-3" />
                    Post this take
                  </button>
                )}
                <button
                  onClick={() => {
                    // LinkedIn format: hook, edition context, topics, question, attribution
                    const topicList = topics.slice(0,3).map((t: any) => t.title).join('\n');
                    const take = edition.rubensTake ? `${edition.rubensTake}\n\n` : '';
                    const text = `${take}Edition ${edition.editionNumber} of The Desk is out.\n\n${edition.weekRange}\n\nThis week covered:\n\n${topicList}\n\nIf you work in property, financial advice, or mortgage broking, there is something in here worth reading.\n\nLink in comments.\n\n@Arjun Paliwal @InvestorKit`;
                    setLiPostText(text);
                    setLiLabel('Share Edition');
                    setLiModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-mono transition-all"
                  style={{ color: "rgba(245,238,220,0.4)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(96,165,250,0.9)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,238,220,0.4)")}
                >
                  <Share2 className="w-3 h-3" />
                  Share Edition
                </button>
                <a
                  href="https://rubenlaubscher.substack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono transition-all"
                  style={{ color: "rgba(245,238,220,0.4)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,166,35,0.9)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,238,220,0.4)")}
                >
                  <ExternalLink className="w-3 h-3" />
                  Substack
                </a>
              </div>
            </div>
          </div>
          {/* ── Editor's Briefing ── */}
          {edition.fullText && (
            <div
              className="w-full"
              style={{
                padding: "48px 5vw 40px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1" style={{ background: "rgba(245,238,220,0.07)" }} />
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(245,166,35,0.7)" }}>
                  Editor's Briefing
                </p>
                <div className="h-px flex-1" style={{ background: "rgba(245,238,220,0.07)" }} />
              </div>
              {/* 2-column body on wide screens */}
              <div
                className="text-sm whitespace-pre-wrap"
                style={{
                  color: "rgba(245,238,220,0.7)",
                  lineHeight: 1.95,
                  fontSize: "15px",
                  columns: "auto 360px",
                  columnGap: "48px",
                  columnRule: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {edition.fullText}
              </div>
            </div>
          )}

          {/* ── Market Snapshot (full-bleed dark strip) ── */}
          {metricItems.length > 0 && (
            <div
              className="w-full"
              style={{
                padding: "28px 5vw",
                background: "rgba(0,0,0,0.35)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase mb-5 text-center" style={{ color: "rgba(245,238,220,0.3)" }}>
                Market Snapshot
                {Object.keys(prevMetricMap).length > 0 && (
                  <span className="ml-2 normal-case tracking-normal" style={{ color: "rgba(245,238,220,0.18)" }}>
                    vs previous edition
                  </span>
                )}
              </p>
              {/* Horizontal scrolling metric strip */}
              <div
                className="flex gap-3 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {metricItems.filter((m) => m.label && m.label.trim() !== "").map((metric, metricIdx) => {
                  const prevValue = prevMetricMap[metric.label];
                  const currentNum = parseFloat(String(metric.value).replace(/[^0-9.-]/g, ""));
                  const prevNum = prevValue ? parseFloat(String(prevValue).replace(/[^0-9.-]/g, "")) : null;
                  let trend: "up" | "down" | "flat" | null =
                    (metric.trend as "up" | "down" | "flat" | null) ?? null;
                  if (!trend && prevNum !== null && !isNaN(currentNum) && !isNaN(prevNum)) {
                    if (currentNum > prevNum) trend = "up";
                    else if (currentNum < prevNum) trend = "down";
                    else trend = "flat";
                  }
                  return (
                    <div
                      key={metric.label || `metric-${metricIdx}`}
                      className="flex-none px-5 py-4 rounded-xl text-center"
                      style={{
                        minWidth: "130px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <p className="font-mono text-[9px] tracking-wide uppercase mb-2" style={{ color: "rgba(245,238,220,0.35)" }}>
                        {metric.label}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="font-mono text-xl font-bold" style={{ color: "rgba(245,238,220,0.92)" }}>
                          {metric.value}
                        </p>
                        <TrendIcon trend={trend} label={metric.label} />
                      </div>
                      {metric.note && (
                        <p className="font-mono text-[9px] mt-1.5 leading-tight" style={{ color: "rgba(245,238,220,0.25)" }}>
                          {metric.note}
                        </p>
                      )}
                      {!metric.note && prevValue && trend && (
                        <p className="font-mono text-[9px] mt-1.5" style={{ color: "rgba(245,238,220,0.25)" }}>
                          was {prevValue}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Deep Dives ── */}
          {topics.length > 0 && (
            <div
              className="w-full"
              style={{ padding: "48px 5vw", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1" style={{ background: "rgba(245,238,220,0.07)" }} />
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(245,166,35,0.7)" }}>
                  Deep Dives
                </p>
                <div className="h-px flex-1" style={{ background: "rgba(245,238,220,0.07)" }} />
              </div>

              {/* Lead story -- full width */}
              {topics[0] && (
                <div className="mb-8">
                  <LeadStory
                    topic={topics[0]}
                    editionNumber={edition.editionNumber}
                    bookmarked={bookmarked}
                    onBookmark={onBookmark}
                    onLinkedInPost={(text, label) => { setLiPostText(text); setLiLabel(label); setLiModalOpen(true); }}
                  />
                </div>
              )}

              {/* Remaining topics -- masonry columns so expanding one card doesn't create whitespace in adjacent cards */}
              {topics.length > 1 && (
                <div className="columns-1 md:columns-2 xl:columns-3 gap-5">
                  {topics.slice(1).map((topic, i) => (
                    <TopicCard
                      key={i}
                      topic={topic}
                      editionNumber={edition.editionNumber}
                      bookmarked={bookmarked}
                      onBookmark={onBookmark}
                      onLinkedInPost={(text, label) => { setLiPostText(text); setLiLabel(label); setLiModalOpen(true); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Signals Briefs ── */}
          {signals.length > 0 && (() => {
            // Build category groups for signals
            const CAT_META_R: Record<string, { label: string; accentColor: string; dotColor: string; headerColor: string }> = {
              MACRO:       { label: "Macro",       accentColor: "rgba(251,191,36,0.45)",  dotColor: "#fbbf24", headerColor: "rgba(251,191,36,0.9)"  },
              PROPERTY:    { label: "Property",    accentColor: "rgba(52,211,153,0.45)",  dotColor: "#34d399", headerColor: "rgba(52,211,153,0.9)"  },
              TECH:        { label: "Tech / AI",   accentColor: "rgba(96,165,250,0.45)",  dotColor: "#60a5fa", headerColor: "rgba(96,165,250,0.9)"  },
              AI:          { label: "Tech / AI",   accentColor: "rgba(96,165,250,0.45)",  dotColor: "#60a5fa", headerColor: "rgba(96,165,250,0.9)"  },
              POLICY:      { label: "Policy",      accentColor: "rgba(167,139,250,0.45)", dotColor: "#a78bfa", headerColor: "rgba(167,139,250,0.9)" },
              SCIENCE:     { label: "Science",     accentColor: "rgba(251,113,133,0.45)", dotColor: "#fb7185", headerColor: "rgba(251,113,133,0.9)" },
              GEOPOLITICS: { label: "Geopolitics", accentColor: "rgba(248,113,113,0.45)", dotColor: "#f87171", headerColor: "rgba(248,113,113,0.9)" },
              MARKETS:     { label: "Markets",     accentColor: "rgba(251,146,60,0.45)",  dotColor: "#fb923c", headerColor: "rgba(251,146,60,0.9)"  },
            };
            const grouped: Record<string, { meta: typeof CAT_META_R[string]; items: { signal: string; idx: number }[] }> = {};
            signals.forEach((signal, i) => {
              const matchTopic = topics[i % Math.max(topics.length, 1)];
              const rawCat = (matchTopic?.category ?? "").toUpperCase().trim();
              const catKey = rawCat !== "" ? rawCat : "OTHER";
              const meta = CAT_META_R[catKey] || { label: catKey, accentColor: "rgba(255,255,255,0.2)", dotColor: "#ffffff", headerColor: "rgba(255,255,255,0.6)" };
              if (!grouped[catKey]) grouped[catKey] = { meta, items: [] };
              grouped[catKey].items.push({ signal, idx: i });
            });
            return (
              <div
                className="w-full"
                style={{ padding: "40px 5vw", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Section header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1" style={{ background: "rgba(245,238,220,0.07)" }} />
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" style={{ color: "rgba(245,166,35,0.7)" }} />
                    <p className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(245,166,35,0.7)" }}>
                      Key Signals
                    </p>
                  </div>
                  <div className="h-px flex-1" style={{ background: "rgba(245,238,220,0.07)" }} />
                </div>
                {/* Category groups */}
                <div className="space-y-8">
                  {Object.entries(grouped).map(([catKey, group]) => (
                    <div key={catKey}>
                      {/* Category header row */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: group.meta.dotColor, boxShadow: `0 0 8px ${group.meta.dotColor}60` }}
                        />
                        <span
                          className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold"
                          style={{ color: group.meta.headerColor }}
                        >
                          {group.meta.label}
                        </span>
                        <div className="h-px flex-1" style={{ background: `${group.meta.accentColor}30` }} />
                        <span className="font-mono text-[9px]" style={{ color: "rgba(245,238,220,0.25)" }}>
                          {group.items.length} signal{group.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {/* Signals grid under this category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {group.items.map(({ signal, idx }) => {
                          const isSaved = bookmarked.has(signal);
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-4 rounded-xl"
                              style={{
                                background: "rgba(255,255,255,0.022)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderLeft: `3px solid ${group.meta.accentColor}`,
                              }}
                            >
                              <p className="text-sm flex-1" style={{ color: "rgba(245,238,220,0.72)", lineHeight: 1.65 }}>
                                {signal}
                              </p>
                              <button
                                onClick={() => onBookmark(signal, `Signal from Edition #${edition.editionNumber}`)}
                                disabled={isSaved}
                                title={isSaved ? "Saved" : "Save to Reading Queue"}
                                className="p-1 rounded transition-colors shrink-0 mt-0.5"
                                style={{ color: isSaved ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.2)" }}
                              >
                                {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Substack Subscribe Prompt ── */}
          {showSubstackPrompt && (
            <div
              className="sticky bottom-0 left-0 right-0 z-10"
              style={{
                padding: "16px 24px",
                background: "linear-gradient(180deg, rgba(6,8,15,0.0) 0%, rgba(6,8,15,0.97) 20%)",
                borderTop: "1px solid rgba(245,166,35,0.2)",
              }}
            >
              <div className="max-w-2xl mx-auto flex items-center gap-4 flex-wrap">
                <img
                  src="/manus-storage/ruben_headshot_a071a9dd.jpeg"
                  alt="Ruben Laubscher"
                  className="w-8 h-8 rounded-full object-cover object-top flex-none"
                  style={{ border: "1.5px solid rgba(245,166,35,0.4)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono" style={{ color: "rgba(245,238,220,0.7)" }}>
                    Enjoyed this edition? Get Ruben's weekly essay on business, property and the systems that compound.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <a
                    href="https://rubenlaubscher.substack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded text-xs font-mono font-semibold"
                    style={{ background: "rgba(245,166,35,0.9)", color: "#0a0804" }}
                  >
                    Subscribe free
                  </a>
                  <button
                    onClick={() => { setShowSubstackPrompt(false); setSubstackDismissed(true); }}
                    className="p-1.5 rounded"
                    style={{ color: "rgba(245,238,220,0.35)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ── Footer ── */}
          <div className="text-center" style={{ padding: "32px 24px 48px" }}>
            <div
              className="w-full h-px mb-5 mx-auto"
              style={{ background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)" }}
            />
            <p className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: "rgba(245,238,220,0.18)" }}>
              The Desk -- Edition #{String(edition.editionNumber).padStart(2, "0")} -- {edition.weekRange}
            </p>
          </div>

        </div>
      </motion.div>

      {/* ── Substack Draft Modal ── */}
      <AnimatePresence>
        {showSubstackDraft && substackDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSubstackDraft(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col overflow-hidden"
              style={{
                width: "min(780px, 96vw)",
                maxHeight: "90vh",
                borderRadius: "20px",
                background: "rgba(10,12,20,0.98)",
                border: "1px solid rgba(245,166,35,0.25)",
                boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(245,166,35,0.06)",
              }}
            >
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(245,166,35,0.15)" }}>
                    <ExternalLink className="w-3 h-3" style={{ color: "rgba(245,166,35,0.9)" }} />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(245,166,35,0.65)" }}>Substack Draft</p>
                    <p className="text-xs font-medium" style={{ color: "rgba(245,238,220,0.85)" }}>Ready to publish</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubstackDraft(false)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: "rgba(245,238,220,0.4)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,238,220,0.9)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,238,220,0.4)")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal sub-header: saved vs fresh indicator */}
              <div className="flex items-center gap-2 px-6 py-2 shrink-0" style={{ background: "rgba(245,166,35,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {edition.substackDraftTitle ? (
                  <span className="text-[10px] font-mono" style={{ color: "rgba(52,211,153,0.7)" }}>Saved draft loaded -- edit below</span>
                ) : (
                  <span className="text-[10px] font-mono" style={{ color: "rgba(245,238,220,0.3)" }}>Fresh draft -- edit and save before closing</span>
                )}
                <button
                  onClick={() => generateSubstackDraft.mutate({ editionId: edition.id })}
                  disabled={generateSubstackDraft.isPending}
                  className="ml-auto flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded transition-all"
                  style={{ color: "rgba(245,166,35,0.6)", border: "1px solid rgba(245,166,35,0.2)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,166,35,0.9)"; e.currentTarget.style.borderColor = "rgba(245,166,35,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,166,35,0.6)"; e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)"; }}
                >
                  <Zap className="w-2.5 h-2.5" />
                  {generateSubstackDraft.isPending ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1" style={{ padding: "24px 28px" }}>
                {/* Hero image */}
                {substackDraft.imageUrl && (
                  <div className="mb-5 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img
                      src={substackDraft.imageUrl}
                      alt="Substack hero"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Editable title */}
                <div className="mb-3">
                  <label className="block font-mono text-[9px] tracking-[0.25em] uppercase mb-1.5" style={{ color: "rgba(245,166,35,0.5)" }}>Title</label>
                  <input
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-lg font-serif font-bold"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(245,238,220,0.95)",
                      outline: "none",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {/* Editable subtitle */}
                <div className="mb-5">
                  <label className="block font-mono text-[9px] tracking-[0.25em] uppercase mb-1.5" style={{ color: "rgba(245,166,35,0.5)" }}>Subtitle</label>
                  <input
                    value={draftSubtitle}
                    onChange={e => setDraftSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(245,238,220,0.6)",
                      fontStyle: "italic",
                      outline: "none",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {/* Editable essay body */}
                <div>
                  <label className="block font-mono text-[9px] tracking-[0.25em] uppercase mb-1.5" style={{ color: "rgba(245,166,35,0.5)" }}>Essay</label>
                  <textarea
                    value={draftBody}
                    onChange={e => setDraftBody(e.target.value)}
                    rows={18}
                    className="w-full px-3 py-3 rounded-lg text-sm resize-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(245,238,220,0.78)",
                      lineHeight: 1.85,
                      fontFamily: "'Source Sans 3', sans-serif",
                      outline: "none",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div
                className="flex items-center gap-3 px-6 py-4 shrink-0 flex-wrap"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
              >
                <button
                  onClick={() => saveSubstackDraft.mutate({ editionId: edition.id, title: draftTitle, subtitle: draftSubtitle, body: draftBody, imageUrl: substackDraft.imageUrl })}
                  disabled={saveSubstackDraft.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono transition-all"
                  style={{ background: draftSaved ? "rgba(52,211,153,0.15)" : "rgba(52,211,153,0.1)", color: draftSaved ? "rgba(52,211,153,0.9)" : "rgba(52,211,153,0.7)", border: `1px solid ${draftSaved ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.2)"}` }}
                >
                  {draftSaved ? <><Check className="w-3 h-3" /> Saved</> : saveSubstackDraft.isPending ? 'Saving...' : <><Check className="w-3 h-3" /> Save edits</>}
                </button>
                <button
                  onClick={() => {
                    const full = `${draftTitle}\n${draftSubtitle}\n\n${draftBody}`;
                    navigator.clipboard.writeText(full).then(() => { setDraftCopied(true); setTimeout(() => setDraftCopied(false), 2500); });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono transition-all"
                  style={{ background: draftCopied ? "rgba(52,211,153,0.15)" : "rgba(245,166,35,0.12)", color: draftCopied ? "rgba(52,211,153,0.9)" : "rgba(245,166,35,0.9)", border: `1px solid ${draftCopied ? "rgba(52,211,153,0.3)" : "rgba(245,166,35,0.25)"}` }}
                >
                  {draftCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy essay</>}
                </button>
                <a
                  href={`https://substack.com/publish/post/new?publication_url=rubenlaubscher`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono transition-all"
                  style={{ background: "rgba(255,102,0,0.12)", color: "rgba(255,140,60,0.9)", border: "1px solid rgba(255,102,0,0.25)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,102,0,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,102,0,0.12)"; }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Substack editor
                </a>
                <p className="text-[10px] font-mono ml-auto" style={{ color: "rgba(245,238,220,0.25)" }}>
                  Save edits first, then copy and paste into Substack
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LinkedIn post modal */}
      <LinkedInPostModal
        open={liModalOpen}
        onClose={() => setLiModalOpen(false)}
        postText={liPostText}
        label={liLabel}
      />

      {/* ── Draft button (admin floating) ── */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-2 items-end">
          {substackDraft ? (
            // Saved draft exists -- show View + Regenerate
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateSubstackDraft.mutate({ editionId: edition.id })}
                disabled={generateSubstackDraft.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono shadow-xl transition-all"
                style={{ background: "rgba(245,166,35,0.15)", color: "rgba(245,166,35,0.8)", border: "1px solid rgba(245,166,35,0.3)" }}
                title="Regenerate the Substack essay"
              >
                <Zap className="w-3 h-3" />
                {generateSubstackDraft.isPending ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={() => setShowSubstackDraft(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold shadow-2xl transition-all"
                style={{ background: "rgba(245,166,35,0.9)", color: "#0a0804", boxShadow: "0 8px 32px rgba(245,166,35,0.3)" }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Draft
              </button>
            </div>
          ) : (
            <button
              onClick={() => generateSubstackDraft.mutate({ editionId: edition.id })}
              disabled={generateSubstackDraft.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold shadow-2xl transition-all"
              style={{
                background: generateSubstackDraft.isPending ? "rgba(245,166,35,0.4)" : "rgba(245,166,35,0.9)",
                color: "#0a0804",
                boxShadow: "0 8px 32px rgba(245,166,35,0.3)",
              }}
              title="Generate a full Substack essay draft from this edition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {generateSubstackDraft.isPending ? 'Drafting essay...' : 'Draft Substack Essay'}
            </button>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
