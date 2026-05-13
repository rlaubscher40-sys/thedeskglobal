import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { MessageCircle, Check, Loader2, Inbox, TrendingUp } from "lucide-react";
import { ConversationsIllustration } from "@/components/PageIllustrations";
import { toast } from "sonner";

const CATEGORY_ACCENT: Record<string, string> = {
  MACRO: "rgba(245,166,35,0.7)",
  PROPERTY: "rgba(52,211,153,0.7)",
  TECH: "rgba(96,165,250,0.7)",
  POLICY: "rgba(167,139,250,0.7)",
  SCIENCE: "rgba(251,113,133,0.7)",
  MARKETS: "rgba(251,146,60,0.7)",
};

const CATEGORY_BG: Record<string, string> = {
  MACRO: "rgba(245,166,35,0.08)",
  PROPERTY: "rgba(52,211,153,0.08)",
  TECH: "rgba(96,165,250,0.08)",
  POLICY: "rgba(167,139,250,0.08)",
  SCIENCE: "rgba(251,113,133,0.08)",
  MARKETS: "rgba(251,146,60,0.08)",
};

export default function ConversationTracker() {
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.conversations.list.useQuery();

  const markUsed = trpc.conversations.track.useMutation({
    onSuccess: () => {
      utils.conversations.list.invalidate();
      toast.success("Marked as used in conversation");
    },
  });

  const usedItems = items?.filter((i: any) => i.usedAt) || [];
  const unusedItems = items?.filter((i: any) => !i.usedAt) || [];
  const usedPercentage = items && items.length > 0
    ? Math.round((usedItems.length / items.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: "720px" }}
    >
      {/* Premium page header */}
      <div style={{ marginBottom: "32px", position: "relative", overflow: "hidden" }}>
        {/* Ambient illustration */}
        <div style={{ position: "absolute", right: 0, top: 0, opacity: 0.5, pointerEvents: "none" }} aria-hidden="true">
          <ConversationsIllustration />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MessageCircle style={{ width: "14px", height: "14px", color: "rgba(245,166,35,0.85)" }} />
          </div>
          <span
            className="font-mono uppercase tracking-[0.22em]"
            style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.65)" }}
          >
            Conversation Tracker
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
          Say This Lines
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(245,238,220,0.58)", lineHeight: 1.65, maxWidth: "480px" }}>
          Track which talking points you've actually used in partner conversations.
        </p>
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, rgba(245,166,35,0.08) 40%, transparent 80%)",
            marginTop: "18px",
          }}
        />
      </div>

      {/* Stats strip */}
      {items && items.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0",
            marginBottom: "28px",
            background: "oklch(0.135 0.018 260 / 0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            boxShadow: "0 2px 24px rgba(0,0,0,0.45)",
            overflow: "hidden",
          }}
        >
          {[
            { value: `${usedPercentage}%`, label: "Used", accent: "rgba(245,166,35,0.9)" },
            { value: `${usedItems.length}/${items.length}`, label: "Lines deployed", accent: "rgba(245,238,220,0.85)" },
            { value: usedItems.length > 0 ? "Active" : "Start tracking", label: "Status", accent: "rgba(52,211,153,0.8)", icon: true },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: "1 1 100px",
                padding: "18px 22px",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {stat.icon && <TrendingUp style={{ width: "13px", height: "13px", color: stat.accent }} />}
                <p
                  className="font-mono font-bold"
                  style={{ fontSize: "20px", color: stat.accent, lineHeight: 1 }}
                >
                  {stat.value}
                </p>
              </div>
              <p
                className="font-mono uppercase tracking-[0.15em]"
                style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginTop: "5px" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 style={{ width: "18px", height: "18px", color: "rgba(245,166,35,0.7)" }} className="animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!items || items.length === 0) && (
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
            No talking points yet
          </p>
          <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.3)", lineHeight: 1.6, maxWidth: "300px" }}>
            "Say This" lines from weekly editions will appear here automatically.
          </p>
        </div>
      )}

      {/* Unused lines */}
      {unusedItems.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <p
            className="font-mono uppercase tracking-[0.2em]"
            style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginBottom: "10px" }}
          >
            Ready to Use ({unusedItems.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {unusedItems.map((item: any, i: number) => {
              const catKey = item.category?.toUpperCase() || "";
              const accent = CATEGORY_ACCENT[catKey] || "rgba(245,238,220,0.4)";
              const bg = CATEGORY_BG[catKey] || "rgba(245,238,220,0.03)";
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2, boxShadow: `0 8px 32px rgba(0,0,0,0.45), -3px -3px 16px ${accent.replace("0.7", "0.04")}` }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "16px 18px",
                    background: "oklch(0.135 0.018 260 / 0.9)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: "10px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
                  }}
                >
                  <motion.button
                    onClick={() => markUsed.mutate({ lineText: item.talkingPoint, usedWithCategory: item.category })}
                    title="Mark as used in conversation"
                    aria-label="Mark as used in conversation"
                    whileHover={{ scale: 1.15, backgroundColor: "rgba(52,211,153,0.15)" }}
                    whileTap={{ scale: 0.88 }}
                    style={{
                      marginTop: "2px",
                      padding: "5px",
                      background: "rgba(52,211,153,0.06)",
                      border: "1px solid rgba(52,211,153,0.2)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Check style={{ width: "11px", height: "11px", color: "rgba(52,211,153,0.5)" }} />
                  </motion.button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.85)", lineHeight: 1.65 }}>
                      "{item.talkingPoint}"
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                      <span
                        className="font-mono uppercase tracking-[0.12em]"
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          background: bg,
                          color: accent,
                          border: `1px solid ${accent.replace("0.7", "0.25")}`,
                          borderRadius: "4px",
                        }}
                      >
                        {item.category}
                      </span>
                      {item.partnerType && (
                        <span className="font-mono" style={{ fontSize: "10px", color: "rgba(96,165,250,0.7)" }}>
                          {item.partnerType}
                        </span>
                      )}
                      <span className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.25)", marginLeft: "auto" }}>
                        Edition #{item.editionNumber}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Used lines */}
      {usedItems.length > 0 && (
        <div>
          <p
            className="font-mono uppercase tracking-[0.2em]"
            style={{ fontSize: "9px", color: "rgba(245,238,220,0.3)", marginBottom: "10px" }}
          >
            Used in Conversations ({usedItems.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {usedItems.map((item: any, i: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px" }}
                transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.35 }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 18px",
                  background: "oklch(0.12 0.015 260 / 0.7)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderLeft: "3px solid rgba(52,211,153,0.3)",
                  borderRadius: "10px",
                  opacity: 0.65,
                }}
              >
                <div
                  style={{
                    marginTop: "2px",
                    padding: "5px",
                    background: "rgba(52,211,153,0.1)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                >
                  <Check style={{ width: "11px", height: "11px", color: "rgba(52,211,153,0.8)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.5)", lineHeight: 1.65 }}>
                    "{item.talkingPoint}"
                  </p>
                  <p className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.25)", marginTop: "5px" }}>
                    Used {item.usedAt ? new Date(item.usedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : ""}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
