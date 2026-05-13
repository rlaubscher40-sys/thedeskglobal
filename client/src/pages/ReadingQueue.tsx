import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  Bookmark,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  Inbox,
  Plus,
  LogIn,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ReadingQueueIllustration } from "@/components/PageIllustrations";

const CATEGORY_COLORS: Record<string, string> = {
  MACRO: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PROPERTY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  TECH: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  POLICY: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  SCIENCE: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  MARKETS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  ECONOMICS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  AI: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export default function ReadingQueue() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-5 h-5 text-amber-500" />
            <span className="font-mono text-[11px] text-amber-500/80 tracking-[0.2em] uppercase">
              Reading Queue
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Saved for Later
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to save articles from the daily feed and track your reading list.
          </p>
          <motion.a
            href={getLoginUrl()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-md text-sm font-medium transition-all duration-200"
          >
            <LogIn className="w-4 h-4" />
            Sign in to access your queue
          </motion.a>
        </div>
      </div>
    );
  }

  return <AuthenticatedReadingQueue />;
}

function AuthenticatedReadingQueue() {
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.readingQueue.list.useQuery();
  const [showAddForm, setShowAddForm] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  const markRead = trpc.readingQueue.markRead.useMutation({
    onSuccess: () => {
      utils.readingQueue.list.invalidate();
      utils.readingQueue.unreadCount.invalidate();
      toast.success("Marked as read");
    },
  });

  const remove = trpc.readingQueue.remove.useMutation({
    onSuccess: () => {
      utils.readingQueue.list.invalidate();
      utils.readingQueue.unreadCount.invalidate();
      toast.success("Removed from queue");
    },
  });

  const markAllRead = trpc.readingQueue.markAllRead.useMutation({
    onSuccess: () => {
      utils.readingQueue.list.invalidate();
      utils.readingQueue.unreadCount.invalidate();
      toast.success("All items marked as read");
    },
  });

  const clearAll = trpc.readingQueue.clearAll.useMutation({
    onSuccess: () => {
      utils.readingQueue.list.invalidate();
      utils.readingQueue.unreadCount.invalidate();
      toast.success("Reading queue cleared");
    },
  });

  const addCustom = trpc.readingQueue.add.useMutation({
    onSuccess: () => {
      utils.readingQueue.list.invalidate();
      setCustomUrl("");
      setCustomTitle("");
      setShowAddForm(false);
      toast.success("Added to queue");
    },
  });

  const unreadItems = items?.filter((i) => !i.isRead) || [];
  const readItems = items?.filter((i) => i.isRead) || [];

  const getItemLink = (item: typeof unreadItems[0]): { href: string; external: boolean } => {
    if (item.feedSourceUrl) return { href: item.feedSourceUrl, external: true };
    if (item.customUrl && !item.customUrl.startsWith("signal://")) return { href: item.customUrl, external: true };
    if (item.customUrl?.startsWith("signal://edition/")) return { href: "/editions", external: false };
    return { href: "", external: false };
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
        style={{ position: "relative", overflow: "hidden" }}
      >
        {/* Ambient illustration */}
        <div style={{ position: "absolute", right: 0, top: 0, opacity: 0.5, pointerEvents: "none" }} aria-hidden="true">
          <ReadingQueueIllustration />
        </div>
        <p className="font-mono uppercase tracking-[0.22em] mb-3" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.6)" }}>
          Reading Queue
        </p>
        <h2 className="font-serif font-bold tracking-tight mb-3" style={{ fontSize: "clamp(24px, 4vw, 32px)", letterSpacing: "-0.02em", color: "rgba(245,238,220,0.97)", lineHeight: 1.15 }}>
          Saved for Later
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(245,238,220,0.58)", lineHeight: 1.65, marginBottom: "16px", maxWidth: "480px" }}>
          Articles and links you've bookmarked from the daily feed or added manually.
        </p>
        {items && items.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {unreadItems.length > 0 && (
              <motion.button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "7px", border: "1px solid rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.06)", color: "rgba(52,211,153,0.8)", cursor: "pointer", transition: "all 0.15s" }}
              >
                <Check style={{ width: "12px", height: "12px" }} />
                Mark all read
              </motion.button>
            )}
            <motion.button
              onClick={() => {
                if (confirm("Clear your entire reading queue? This cannot be undone.")) {
                  clearAll.mutate();
                }
              }}
              disabled={clearAll.isPending}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "7px", border: "1px solid rgba(251,113,133,0.2)", background: "rgba(251,113,133,0.05)", color: "rgba(251,113,133,0.7)", cursor: "pointer", transition: "all 0.15s" }}
            >
              <Trash2 style={{ width: "12px", height: "12px" }} />
              Clear all
            </motion.button>
          </div>
        )}
        <div style={{ marginTop: "20px", height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, rgba(245,166,35,0.08) 40%, transparent 80%)" }} />
      </motion.div>

      {/* Add custom link */}
      <div className="mb-6">
        {!showAddForm ? (
          <motion.button
            onClick={() => setShowAddForm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-amber-400 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add a link
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 border border-white/[0.08] rounded-lg bg-white/[0.02]"
          >
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full px-3 py-2 mb-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500/30"
            />
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 mb-3 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500/30"
            />
            <div className="flex gap-2">
              <motion.button
                onClick={() => {
                  if (customUrl) {
                    addCustom.mutate({ customUrl, customTitle: customTitle || undefined });
                  }
                }}
                disabled={!customUrl || addCustom.isPending}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md hover:bg-amber-500/20 disabled:opacity-50 transition-all"
              >
                Add
              </motion.button>
              <motion.button
                onClick={() => {
                  setShowAddForm(false);
                  setCustomUrl("");
                  setCustomTitle("");
                }}
                whileTap={{ scale: 0.96 }}
                className="px-3 py-1.5 text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent mb-6" />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", textAlign: "center" }}
        >
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Inbox style={{ width: "22px", height: "22px", color: "rgba(245,238,220,0.2)" }} />
          </div>
          <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.45)", marginBottom: "6px" }}>Your reading queue is empty.</p>
          <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.25)" }}>Bookmark items from the daily feed or add links manually.</p>
        </motion.div>
      )}

      {/* Unread items */}
      {unreadItems.length > 0 && (
        <div className="mb-8">
          <p className="font-mono uppercase tracking-[0.18em] mb-4" style={{ fontSize: "8px", color: "rgba(245,238,220,0.3)", fontWeight: 700 }}>
            To Read ({unreadItems.length})
          </p>
          <div className="space-y-3">
            {unreadItems.map((item, i) => {
              const link = getItemLink(item);
              const title = item.feedTitle || item.customTitle || `Feed item #${item.feedItemId}`;
              const summary = item.feedSummary || null;
              const category = item.feedCategory || null;
              const source = item.feedSource || null;
              const categoryColors = category ? (CATEGORY_COLORS[category.toUpperCase()] || "bg-white/10 text-white/60 border-white/20") : null;

              const cardContent = (
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {categoryColors && (
                      <Link href={`/topics/${category!.toLowerCase()}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-medium tracking-widest uppercase border rounded-sm cursor-pointer hover:opacity-80 ${categoryColors}`}>
                          {category}
                        </span>
                      </Link>
                    )}
                    {source && (
                      <span className="text-[10px] font-mono text-muted-foreground/60">{source}</span>
                    )}
                    {item.feedDate && (
                      <span className="text-[10px] font-mono text-muted-foreground/50">{item.feedDate}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-snug mb-1">{title}</h4>
                  {summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{summary}</p>
                  )}
                  {link.href && link.external && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-500/60">
                      <ExternalLink className="w-3 h-3" />
                      {(() => { try { return new URL(link.href).hostname; } catch { return "Source"; } })()}
                    </span>
                  )}
                </div>
              );

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.45), -3px -3px 16px rgba(245,166,35,0.04)" }}
                  whileTap={{ scale: 0.99 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 20px", background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid rgba(245,166,35,0.4)", borderRadius: "10px", boxShadow: "0 2px 16px rgba(0,0,0,0.4)" }}
                >
                  {link.href ? (
                    link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="flex-1 cursor-pointer">
                        {cardContent}
                      </a>
                    ) : (
                      <Link href={link.href}>
                        <div className="flex-1 cursor-pointer">{cardContent}</div>
                      </Link>
                    )
                  ) : (
                    <div className="flex-1">{cardContent}</div>
                  )}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <motion.button
                      onClick={() => markRead.mutate({ id: item.id })}
                      title="Mark as read"
                      aria-label="Mark as read"
                      whileHover={{ scale: 1.12, color: "rgba(52,211,153,0.9)" }}
                      whileTap={{ scale: 0.9 }}
                      style={{ padding: "7px", color: "rgba(255,255,255,0.3)", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "7px", cursor: "pointer" }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => remove.mutate({ id: item.id })}
                      title="Remove from queue"
                      aria-label="Remove from queue"
                      whileHover={{ scale: 1.12, color: "rgba(251,113,133,0.9)" }}
                      whileTap={{ scale: 0.9 }}
                      style={{ padding: "7px", color: "rgba(255,255,255,0.3)", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "7px", cursor: "pointer" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read items */}
      {readItems.length > 0 && (
        <div>
          <p className="font-mono uppercase tracking-[0.18em] mb-4" style={{ fontSize: "8px", color: "rgba(245,238,220,0.25)", fontWeight: 700 }}>
            Already Read ({readItems.length})
          </p>
          <div className="space-y-2">
            {readItems.map((item, i) => {
              const title = item.feedTitle || item.customTitle || `Feed item #${item.feedItemId}`;
              const link = getItemLink(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.35 }}
                  className="flex items-center gap-3 p-3 border border-white/[0.04] rounded-lg opacity-60"
                >
                  <Check className="w-4 h-4 text-emerald-500/50 shrink-0" />
                  {link.href ? (
                    link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground line-through hover:text-foreground/70 transition-colors flex-1">
                        {title}
                      </a>
                    ) : (
                      <Link href={link.href}>
                        <span className="text-sm text-muted-foreground line-through hover:text-foreground/70 transition-colors flex-1 cursor-pointer">{title}</span>
                      </Link>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground line-through flex-1">{title}</p>
                  )}
                  <motion.button
                    onClick={() => remove.mutate({ id: item.id })}
                    aria-label="Remove from queue"
                    title="Remove from queue"
                    whileHover={{ scale: 1.15, color: "rgba(251,113,133,0.9)" }}
                    whileTap={{ scale: 0.88 }}
                    className="ml-auto p-1.5 text-muted-foreground/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
