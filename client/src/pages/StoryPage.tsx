import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bookmark, BookmarkCheck, Copy, ExternalLink, Share2, Linkedin, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { PersonaSelector, parsePersonaTag, usePersona, type Persona } from "@/components/PersonaSelector";

const CATEGORY_COLORS: Record<string, { pill: string; accent: string; border: string }> = {
  MACRO:      { pill: "text-amber-400 bg-amber-500/10 border-amber-500/25",   accent: "rgba(245,166,35,0.85)",  border: "rgba(245,166,35,0.7)" },
  PROPERTY:   { pill: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", accent: "rgba(52,211,153,0.85)", border: "rgba(52,211,153,0.7)" },
  TECH:       { pill: "text-blue-400 bg-blue-500/10 border-blue-500/25",       accent: "rgba(96,165,250,0.85)",  border: "rgba(96,165,250,0.7)" },
  POLICY:     { pill: "text-purple-400 bg-purple-500/10 border-purple-500/25", accent: "rgba(167,139,250,0.85)", border: "rgba(167,139,250,0.7)" },
  SCIENCE:    { pill: "text-rose-400 bg-rose-500/10 border-rose-500/25",       accent: "rgba(251,113,133,0.85)", border: "rgba(251,113,133,0.7)" },
  MARKETS:    { pill: "text-orange-400 bg-orange-500/10 border-orange-500/25", accent: "rgba(251,146,60,0.85)",  border: "rgba(251,146,60,0.7)" },
  ECONOMICS:  { pill: "text-amber-400 bg-amber-500/10 border-amber-500/25",   accent: "rgba(245,166,35,0.85)",  border: "rgba(245,166,35,0.7)" },
  AI:         { pill: "text-blue-400 bg-blue-500/10 border-blue-500/25",       accent: "rgba(96,165,250,0.85)",  border: "rgba(96,165,250,0.7)" },
};

function normaliseCat(raw: string): string {
  const map: Record<string, string> = {
    "Property Market": "PROPERTY",
    "Macro & Economy": "MACRO",
    "Policy & Regulation": "POLICY",
    "Finance & Lending": "MARKETS",
    "Lifestyle & Wealth": "MACRO",
  };
  return map[raw] || raw.toUpperCase().split(" ")[0];
}

function getCatStyle(raw: string) {
  const key = normaliseCat(raw);
  return CATEGORY_COLORS[key] || { pill: "text-muted-foreground bg-white/[0.04] border-white/[0.08]", accent: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.2)" };
}

// Minimal ambient canvas for StoryPage -- simpler than the full AnimatedBackground
function StoryAmbient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      o: Math.random() * 0.25 + 0.08,
    }));
    const tick = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,166,35,${p.o})`;
        ctx.fill();
      }
      // Faint connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(245,166,35,${0.04 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}

export default function StoryPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [persona] = usePersona();

  const { data: item, isLoading, error } = trpc.feed.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const utils = trpc.useUtils();
  const addToQueue = trpc.readingQueue.add.useMutation({
    onSuccess: () => {
      utils.readingQueue.unreadCount.invalidate();
      setBookmarked(true);
      toast.success("Saved to reading queue");
    },
  });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  };

  const copyTalkingPoint = () => {
    if (!item?.sayThis) return;
    navigator.clipboard.writeText(item.sayThis);
    setCopied(true);
    toast.success("Talking point copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinkedIn = () => {
    if (!item) return;
    const text = encodeURIComponent(
      `${item.sayThis || item.title}\n\nSource: ${item.source || "The Desk"}\n${window.location.href}`
    );
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${text}`,
      "_blank"
    );
  };

  const catStyle = item ? getCatStyle(item.category || "") : null;
  const partnerInsight = item?.partnerTag ? parsePersonaTag(item.partnerTag, persona as Persona) : null;

  if (isLoading) {
    return (
      <>
        <StoryAmbient />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
          <div className="space-y-5 animate-pulse">
            <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-7 w-3/4 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-3 w-5/6 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-3 w-4/6 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="mt-8 h-24 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        </div>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <StoryAmbient />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-sm mb-6" style={{ color: "rgba(245,238,220,0.38)" }}>
            Story not found or no longer available.
          </p>
          <Link href="/">
            <a className="inline-flex items-center gap-1.5 text-sm transition-colors"
               style={{ color: "rgba(245,166,35,0.8)" }}
               onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,166,35,1)")}
               onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,166,35,0.8)")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to today's feed
            </a>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <StoryAmbient />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-2xl mx-auto px-4 py-8"
      >
        {/* Breadcrumb nav */}
        <nav className="flex items-center gap-2 mb-8" aria-label="Breadcrumb">
          <Link href="/">
            <motion.span
              whileHover={{ color: "rgba(245,166,35,0.85)" }}
              className="inline-flex items-center gap-1.5 cursor-pointer font-mono uppercase tracking-widest transition-colors"
              style={{ fontSize: "10px", color: "rgba(245,238,220,0.35)" }}
            >
              <ArrowLeft className="w-3 h-3" />
              Today
            </motion.span>
          </Link>
          <span style={{ fontSize: "10px", color: "rgba(245,238,220,0.2)", fontFamily: "var(--font-mono)" }}>/</span>
          {item.category && (
            <>
              <Link href="/topics">
                <motion.span
                  whileHover={{ color: "rgba(245,166,35,0.85)" }}
                  className="cursor-pointer font-mono uppercase tracking-widest transition-colors"
                  style={{ fontSize: "10px", color: "rgba(245,238,220,0.35)" }}
                >
                  Topics
                </motion.span>
              </Link>
              <span style={{ fontSize: "10px", color: "rgba(245,238,220,0.2)", fontFamily: "var(--font-mono)" }}>/</span>
              <span
                className="font-mono uppercase tracking-widest"
                style={{ fontSize: "10px", color: catStyle?.accent || "rgba(245,166,35,0.7)" }}
              >
                {item.category}
              </span>
            </>
          )}
        </nav>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "oklch(0.135 0.018 260 / 0.94)",
            border: `1px solid rgba(255,255,255,0.07)`,
            borderLeft: catStyle ? `3px solid ${catStyle.accent}` : undefined,
            borderRadius: "14px",
            boxShadow: "0 4px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            overflow: "hidden",
          }}
        >
          {/* Top amber rule */}
          <div style={{ height: "2px", background: "linear-gradient(90deg, rgba(245,166,35,0.7) 0%, rgba(245,166,35,0.15) 50%, transparent 100%)" }} />

          <div className="p-7 sm:p-9">
            {/* Meta row */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {item.category && (
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] border rounded-full uppercase ${catStyle?.pill || ""}`}
                >
                  {normaliseCat(item.category)}
                </span>
              )}
              {item.feedDate && (
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase" style={{ color: "rgba(245,238,220,0.3)" }}>
                  {new Date(item.feedDate).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Australia/Sydney",
                  })}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-serif font-bold leading-tight mb-4"
              style={{
                fontSize: "clamp(22px, 3.5vw, 30px)",
                letterSpacing: "-0.02em",
                color: "rgba(245,238,220,0.97)",
                lineHeight: 1.2,
              }}
            >
              {item.title}
            </h1>

            {/* Summary */}
            {item.summary && (
              <p
                className="leading-relaxed mb-7"
                style={{ fontSize: "14px", color: "rgba(245,238,220,0.52)", lineHeight: 1.7 }}
              >
                {item.summary}
              </p>
            )}

            {/* Say This */}
            {item.sayThis && (
              <div
                className="mb-7 relative"
                style={{
                  padding: "20px 24px",
                  background: "linear-gradient(135deg, rgba(245,166,35,0.07) 0%, rgba(245,166,35,0.03) 100%)",
                  border: "1px solid rgba(245,166,35,0.22)",
                  borderRadius: "10px",
                }}
              >
                {/* Top highlight */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, transparent 70%)", borderRadius: "10px 10px 0 0" }} />
                <p className="font-mono uppercase tracking-[0.18em] mb-3" style={{ fontSize: "8px", color: "rgba(245,166,35,0.55)", fontWeight: 700 }}>
                  Say This
                </p>
                <p
                  className="font-serif italic leading-relaxed"
                  style={{ fontSize: "15px", color: "rgba(245,238,220,0.88)", lineHeight: 1.65 }}
                >
                  "{item.sayThis}"
                </p>
              </div>
            )}

            {/* Partner context with persona switcher */}
            {item.partnerTag && (
              <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
                    Partner Angle
                  </p>
                  <PersonaSelector />
                </div>
                <div
                  style={{
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    minHeight: "48px",
                  }}
                >
                  {partnerInsight ? (
                    <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.55)", lineHeight: 1.65 }}>
                      {partnerInsight}
                    </p>
                  ) : (
                    <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.25)", lineHeight: 1.65, fontStyle: "italic" }}>
                      No specific angle for this persona.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Source */}
            {item.source && (
              <div className="flex items-center gap-2 mb-7">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${item.sourceUrl ? new URL(item.sourceUrl).hostname : item.source}&sz=16`}
                  alt=""
                  className="w-3.5 h-3.5 rounded-sm"
                  style={{ opacity: 0.55 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 transition-colors"
                    style={{ fontSize: "11px", color: "rgba(245,238,220,0.35)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(245,166,35,0.75)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,238,220,0.35)")}
                  >
                    {item.source}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span style={{ fontSize: "11px", color: "rgba(245,238,220,0.35)" }}>{item.source}</span>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "20px" }} />

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <motion.button
                onClick={() => !bookmarked && addToQueue.mutate({ feedItemId: item.id })}
                disabled={bookmarked || addToQueue.isPending}
                whileHover={!bookmarked ? { scale: 1.04 } : {}}
                whileTap={!bookmarked ? { scale: 0.95 } : {}}
                className="inline-flex items-center gap-1.5 transition-all"
                style={{
                  padding: "7px 14px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "7px",
                  border: bookmarked ? "1px solid rgba(245,166,35,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  background: bookmarked ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.03)",
                  color: bookmarked ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.45)",
                  cursor: bookmarked ? "default" : "pointer",
                }}
              >
                {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {bookmarked ? "Saved" : "Save"}
              </motion.button>

              {item.sayThis && (
                <motion.button
                  onClick={copyTalkingPoint}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-1.5 transition-all"
                  style={{
                    padding: "7px 14px",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "7px",
                    border: copied ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.08)",
                    background: copied ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                    color: copied ? "rgba(52,211,153,0.9)" : "rgba(245,238,220,0.45)",
                    cursor: "pointer",
                  }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy talking point"}
                </motion.button>
              )}

              <motion.button
                onClick={copyLink}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 transition-all"
                style={{
                  padding: "7px 14px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "7px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(245,238,220,0.45)",
                  cursor: "pointer",
                }}
              >
                <Share2 className="w-3.5 h-3.5" />
                Copy link
              </motion.button>

              <motion.button
                onClick={shareLinkedIn}
                whileHover={{ scale: 1.04, color: "rgba(96,165,250,0.9)" }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 transition-all"
                style={{
                  padding: "7px 14px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "7px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(245,238,220,0.45)",
                  cursor: "pointer",
                }}
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
