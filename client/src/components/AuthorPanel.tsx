/**
 * AuthorPanel — Ruben's bio, credibility signals, and subscribe CTA.
 * Shown in the sidebar (collapsed: avatar only; expanded: full panel).
 */
import { SubscribeForm } from "./SubscribeForm";
import { Linkedin, Building2 } from "lucide-react";

const IK_STATS = [
  { label: "Properties purchased", value: "2,900+" },
  { label: "Total acquisitions", value: "$1.6B+" },
  { label: "Equity generated", value: "$500M+" },
  { label: "Buyer's Agency of the Year", value: "3×" },
];

const HEADSHOT = "/manus-storage/ruben-headshot_4c885a17.jpeg";

interface AuthorPanelProps {
  collapsed?: boolean;
}

export function AuthorPanel({ collapsed = false }: AuthorPanelProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-3 gap-2">
        {/* Avatar only */}
        <div
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{
            border: "1.5px solid rgba(245,166,35,0.35)",
            background: "rgba(245,166,35,0.15)",
            position: "relative",
          }}
        >
          <img
            src={HEADSHOT}
            alt="Ruben Laubscher"
            className="w-full h-full object-cover"
            style={{ objectPosition: "50% 10%" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = parent.querySelector(".avatar-fallback") as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }
            }}
          />
          <span
            className="avatar-fallback font-mono font-bold"
            style={{ display: "none", fontSize: "10px", color: "rgba(245,166,35,0.9)", position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
          >RL</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-3 mb-3 rounded-xl overflow-hidden"
      style={{
        background: "rgba(245,166,35,0.04)",
        border: "1px solid rgba(245,166,35,0.12)",
      }}
    >
      {/* Header: photo + name */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{
            border: "2px solid rgba(245,166,35,0.4)",
            background: "rgba(245,166,35,0.15)",
            position: "relative",
          }}
        >
          <img
            src={HEADSHOT}
            alt="Ruben Laubscher"
            className="w-full h-full object-cover"
            style={{ objectPosition: "50% 10%" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = parent.querySelector(".avatar-fallback") as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }
            }}
          />
          <span
            className="avatar-fallback font-mono font-bold"
            style={{ display: "none", fontSize: "13px", color: "rgba(245,166,35,0.9)", position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
          >RL</span>
        </div>
        <div className="min-w-0">
          <p
            className="font-semibold leading-tight truncate"
            style={{ fontSize: "13px", color: "rgba(245,238,220,0.9)" }}
          >
            Ruben Laubscher
          </p>
          <p
            className="font-mono uppercase tracking-widest mt-0.5"
            style={{ fontSize: "8px", color: "rgba(245,166,35,0.7)" }}
          >
            Head of Partnerships
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-2.5 h-2.5 shrink-0" style={{ color: "rgba(245,238,220,0.3)" }} />
            <span style={{ fontSize: "9px", color: "rgba(245,238,220,0.35)" }}>InvestorKit</span>
          </div>
        </div>
      </div>

      {/* IK proof points */}
      <div
        className="px-4 py-3 grid grid-cols-2 gap-2"
        style={{ borderTop: "1px solid rgba(245,166,35,0.08)" }}
      >
        {IK_STATS.map((stat) => (
          <div key={stat.label}>
            <p
              className="font-semibold leading-none"
              style={{ fontSize: "13px", color: "rgba(245,166,35,0.9)" }}
            >
              {stat.value}
            </p>
            <p
              className="mt-0.5 leading-tight"
              style={{ fontSize: "8.5px", color: "rgba(245,238,220,0.35)" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* LinkedIn link */}
      <div
        className="px-4 py-2.5"
        style={{ borderTop: "1px solid rgba(245,166,35,0.08)" }}
      >
        <a
          href="https://www.linkedin.com/in/ruben-laubscher/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors"
          style={{ color: "rgba(245,238,220,0.3)", fontSize: "10px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,166,35,0.8)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.3)")}
        >
          <Linkedin className="w-3 h-3 shrink-0" />
          <span className="font-mono uppercase tracking-widest" style={{ fontSize: "7.5px" }}>
            Connect on LinkedIn
          </span>
        </a>
      </div>

      {/* Subscribe CTA */}
      <div
        className="px-4 pb-4 pt-3"
        style={{ borderTop: "1px solid rgba(245,166,35,0.08)" }}
      >
        <p
          className="font-mono uppercase tracking-widest mb-2"
          style={{ fontSize: "7.5px", color: "rgba(245,238,220,0.3)" }}
        >
          Get the daily briefing
        </p>
        <SubscribeForm source="sidebar" variant="compact" />
      </div>
    </div>
  );
}
