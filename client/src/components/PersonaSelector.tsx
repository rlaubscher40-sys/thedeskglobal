import { useState, useRef, useLayoutEffect } from "react";

export const PERSONAS = ["Institutional", "Broker", "Adviser", "Buyers Agent"] as const;
export type Persona = typeof PERSONAS[number];

export function usePersona(): [Persona, (p: Persona) => void] {
  const [persona, setPersona] = useState<Persona>(() => {
    const stored = localStorage.getItem("signal_persona") as Persona | null;
    return stored && PERSONAS.includes(stored as Persona) ? (stored as Persona) : "Institutional";
  });

  const update = (p: Persona) => {
    setPersona(p);
    localStorage.setItem("signal_persona", p);
  };

  return [persona, update];
}

/**
 * Parse a partnerTag string for a specific persona.
 *
 * New multi-persona format (4 lines):
 *   Institutional: Great for corporate partners.
 *   Broker: This expands borrowing capacity by ~$40K.
 *   Adviser: Frame this as a wealth conversation opener.
 *   Buyers Agent: Market timing signal for acquisition.
 *
 * Legacy single-persona format:
 *   "Brokers: rate cut expands borrowing capacity by ~$40K at median income"
 */
export function parsePersonaTag(
  tag: string | null | undefined,
  persona: Persona
): string | null {
  if (!tag) return null;

  const aliasMap: Record<string, Persona> = {
    Institutional: "Institutional",
    Broker: "Broker",
    Brokers: "Broker",
    Adviser: "Adviser",
    Advisers: "Adviser",
    "Financial Adviser": "Adviser",
    "Financial Advisers": "Adviser",
    "Buyers Agent": "Buyers Agent",
    "Buyer's Agent": "Buyers Agent",
    "Buyers Agents": "Buyers Agent",
  };

  // Try multi-line format first (2+ lines)
  const lines = tag.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    // First pass: exact persona match
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx <= 0) continue;
      const prefix = line.slice(0, colonIdx).trim();
      const insight = line.slice(colonIdx + 1).trim();
      const mapped = aliasMap[prefix];
      if (mapped === persona && insight) return insight;
    }
    // Fallback: return the first line's insight so the card always shows something
    const firstLine = lines[0];
    const firstColon = firstLine.indexOf(":");
    if (firstColon > 0) return firstLine.slice(firstColon + 1).trim();
    return firstLine;
  }

  // Legacy single-line: "Brokers: insight" — always show the insight regardless of persona
  const colonIdx = tag.indexOf(":");
  if (colonIdx > 0) {
    const prefix = tag.slice(0, colonIdx).trim();
    const insight = tag.slice(colonIdx + 1).trim();
    const mapped = aliasMap[prefix];
    // If it's a known persona prefix, show the insight to everyone (single-line = one angle)
    if (mapped) return insight;
  }

  // No prefix - show to everyone
  return tag;
}

interface PersonaSelectorProps {
  className?: string;
}

export function PersonaSelector({ className = "" }: PersonaSelectorProps) {
  const [persona, setPersona] = usePersona();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Measure the active button and position the sliding pill behind it
  useLayoutEffect(() => {
    const activeIdx = PERSONAS.indexOf(persona);
    const btn = buttonRefs.current[activeIdx];
    const container = containerRef.current;
    if (!btn || !container) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
    setMounted(true);
  }, [persona]);

  return (
    <div className={`flex flex-wrap items-center gap-2 min-w-0 w-full ${className}`}>
      <span
        className="font-mono uppercase tracking-widest shrink-0 mr-2"
        style={{ fontSize: "8px", color: "rgba(245,238,220,0.28)" }}
      >
        View as
      </span>

      {/* Pill track -- relative container so the sliding pill is positioned inside it */}
      <div
        ref={containerRef}
        className="relative flex items-center overflow-x-auto min-w-0 flex-1"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "999px",
          padding: "3px",
          gap: "0px",
          maxWidth: "100%",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Sliding amber pill */}
        {mounted && pillStyle && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "3px",
              bottom: "3px",
              left: `${pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              borderRadius: "999px",
              background: "rgba(245,166,35,0.13)",
              border: "1px solid rgba(245,166,35,0.32)",
              boxShadow: "0 0 16px rgba(245,166,35,0.18), inset 0 1px 0 rgba(245,166,35,0.12)",
              transition: "left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}

        {PERSONAS.map((p, i) => {
          const isActive = persona === p;
          return (
            <button
              key={p}
              ref={(el) => { buttonRefs.current[i] = el; }}
              onClick={() => setPersona(p)}
              aria-pressed={isActive}
              style={{
                position: "relative",
                zIndex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                padding: "4px 11px",
                borderRadius: "999px",
                border: "none",
                background: "transparent",
                color: isActive ? "rgba(245,166,35,0.97)" : "rgba(245,238,220,0.38)",
                cursor: "pointer",
                transition: "color 0.18s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "rgba(245,238,220,0.65)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "rgba(245,238,220,0.38)";
                }
              }}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

