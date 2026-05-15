import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { triggerPageBurst } from "./PageTransition";

const STORAGE_KEY = "signal_breaking_shown";

function getSydneyDateKey() {
  return new Date().toLocaleDateString("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).split("/").reverse().join("-"); // DD/MM/YYYY -> YYYY-MM-DD
}

interface BreakingSignalToastProps {
  headline: string | null | undefined;
  category: string | null | undefined;
  feedDate: string | null | undefined; // the actual feed date (YYYY-MM-DD) of the top item
  enabled: boolean;
}

export function BreakingSignalToast({ headline, category, feedDate, enabled }: BreakingSignalToastProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (!enabled || !headline || fired.current) return;

    // Use the feed item's actual date as the key; fall back to Sydney calendar date
    const todayKey = feedDate || getSydneyDateKey();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === todayKey) return;

    fired.current = true;
    localStorage.setItem(STORAGE_KEY, todayKey);

    // Short delay so the page has settled before the toast fires
      const timer = setTimeout(() => {
      // Trigger newspaper burst from bottom-right (where Sonner toasts appear)
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // On mobile (< 1024px) use top-center so the toast doesn't sit behind the fixed bottom nav
      const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

      if (!prefersReduced) {
        triggerPageBurst(window.innerWidth - 80, isMobile ? 80 : window.innerHeight - 80);
      }

      const cat = category?.toUpperCase() || "SIGNAL";
      const CAT_COLORS: Record<string, string> = {
        MACRO: "#f59e0b",
        PROPERTY: "#10b981",
        TECH: "#3b82f6",
        AI: "#06b6d4",
        POLICY: "#a855f7",
        SCIENCE: "#f43f5e",
        MARKETS: "#f97316",
        GEOPOLITICS: "#ef4444",
        CULTURE: "#ec4899",
        SPORT: "#84cc16",
        SPORTS: "#84cc16",
        "GLOBAL PUBLIC PULSE": "#8b5cf6",
        CRYPTO: "#eab308",
        HEALTH: "#14b8a6",
        CLIMATE: "#22c55e",
        OTHER: "#94a3b8",
      };
      const catColor = CAT_COLORS[cat] || "#f5a623";

      toast.custom(
        (toastId) => (
          <div
            onClick={() => toast.dismiss(toastId)}
            style={{
              cursor: "pointer",
              padding: "14px 18px",
              borderRadius: "12px",
              background: "rgba(8, 10, 22, 0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid rgba(245,166,35,0.25)`,
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,166,35,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              maxWidth: "340px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Amber top rule */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: `linear-gradient(90deg, ${catColor} 0%, rgba(245,166,35,0.2) 70%, transparent 100%)`,
                boxShadow: `0 0 12px ${catColor}60`,
              }}
            />
            {/* Eyebrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              {/* Pulse dot */}
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: catColor,
                  boxShadow: `0 0 8px ${catColor}`,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: catColor,
                  fontWeight: 600,
                }}
              >
                Breaking Signal
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(245,238,220,0.3)",
                  marginLeft: "auto",
                }}
              >
                {cat}
              </span>
            </div>
            {/* Headline */}
            <p
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "rgba(245,238,220,0.92)",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {headline}
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                color: "rgba(245,238,220,0.35)",
                marginTop: "6px",
              }}
            >
              Today's top signal. Tap to dismiss.
            </p>
          </div>
        ),
        {
          duration: 7000,
          position: typeof window !== "undefined" && window.innerWidth < 1024 ? "top-center" : "bottom-right",
        }
      );
    }, 1800);

    return () => clearTimeout(timer);
  }, [enabled, headline, category]);

  return null;
}
