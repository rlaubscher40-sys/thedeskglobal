/**
 * Ambient SVG illustrations for secondary page headers.
 * Each is a small decorative scene rendered in the top-right of the PageHeader.
 * All use the amber/cream palette and are semi-transparent by design.
 */

/** Notes page: open notebook with pen and ink dots */
export function NotesIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Notebook body */}
      <rect x="18" y="10" width="72" height="58" rx="4" fill="rgba(245,166,35,0.08)" stroke="rgba(245,166,35,0.25)" strokeWidth="1.2" />
      {/* Spine */}
      <rect x="18" y="10" width="10" height="58" rx="2" fill="rgba(245,166,35,0.14)" />
      {/* Lines */}
      <line x1="36" y1="26" x2="80" y2="26" stroke="rgba(245,238,220,0.18)" strokeWidth="1" />
      <line x1="36" y1="34" x2="80" y2="34" stroke="rgba(245,238,220,0.18)" strokeWidth="1" />
      <line x1="36" y1="42" x2="80" y2="42" stroke="rgba(245,238,220,0.18)" strokeWidth="1" />
      <line x1="36" y1="50" x2="64" y2="50" stroke="rgba(245,238,220,0.18)" strokeWidth="1" />
      {/* Pen */}
      <rect x="82" y="14" width="5" height="36" rx="2.5" fill="rgba(245,166,35,0.35)" transform="rotate(18 82 14)" />
      <polygon points="88,48 91,58 85,48" fill="rgba(245,166,35,0.5)" transform="rotate(18 88 48)" />
      {/* Ink dots */}
      <circle cx="96" cy="62" r="1.5" fill="rgba(245,166,35,0.4)" />
      <circle cx="102" cy="58" r="1" fill="rgba(245,166,35,0.25)" />
      <circle cx="99" cy="68" r="1" fill="rgba(245,166,35,0.2)" />
    </svg>
  );
}

/** Conversations page: speech bubbles with signal dots */
export function ConversationsIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Large bubble */}
      <rect x="12" y="8" width="62" height="36" rx="10" fill="rgba(245,166,35,0.08)" stroke="rgba(245,166,35,0.28)" strokeWidth="1.2" />
      <polygon points="22,44 16,54 30,44" fill="rgba(245,166,35,0.12)" />
      {/* Small bubble */}
      <rect x="52" y="36" width="48" height="28" rx="8" fill="rgba(245,238,220,0.05)" stroke="rgba(245,238,220,0.18)" strokeWidth="1" />
      <polygon points="90,64 96,72 82,64" fill="rgba(245,238,220,0.06)" />
      {/* Dots in large bubble */}
      <circle cx="30" cy="26" r="3" fill="rgba(245,166,35,0.5)" />
      <circle cx="43" cy="26" r="3" fill="rgba(245,166,35,0.35)" />
      <circle cx="56" cy="26" r="3" fill="rgba(245,166,35,0.25)" />
      {/* Text lines in small bubble */}
      <line x1="62" y1="46" x2="90" y2="46" stroke="rgba(245,238,220,0.22)" strokeWidth="1" />
      <line x1="62" y1="52" x2="84" y2="52" stroke="rgba(245,238,220,0.15)" strokeWidth="1" />
    </svg>
  );
}

/** Reading Queue page: stacked books with bookmark ribbon */
export function ReadingQueueIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom book */}
      <rect x="20" y="52" width="68" height="14" rx="3" fill="rgba(245,166,35,0.12)" stroke="rgba(245,166,35,0.28)" strokeWidth="1" />
      {/* Middle book */}
      <rect x="24" y="38" width="62" height="16" rx="3" fill="rgba(245,238,220,0.06)" stroke="rgba(245,238,220,0.2)" strokeWidth="1" />
      {/* Top book */}
      <rect x="28" y="22" width="56" height="18" rx="3" fill="rgba(245,166,35,0.09)" stroke="rgba(245,166,35,0.3)" strokeWidth="1.2" />
      {/* Bookmark ribbon on top book */}
      <rect x="72" y="14" width="6" height="22" rx="1" fill="rgba(245,166,35,0.55)" />
      <polygon points="72,36 78,36 75,42" fill="rgba(245,166,35,0.55)" />
      {/* Spine lines */}
      <line x1="28" y1="22" x2="28" y2="40" stroke="rgba(245,166,35,0.35)" strokeWidth="2" />
      <line x1="24" y1="38" x2="24" y2="54" stroke="rgba(245,238,220,0.2)" strokeWidth="2" />
      <line x1="20" y1="52" x2="20" y2="66" stroke="rgba(245,166,35,0.2)" strokeWidth="2" />
    </svg>
  );
}

/** Trends/WeeklyComparison page: bar chart with upward trend line */
export function TrendsIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bars */}
      <rect x="16" y="52" width="12" height="18" rx="2" fill="rgba(245,166,35,0.2)" />
      <rect x="34" y="40" width="12" height="30" rx="2" fill="rgba(245,166,35,0.3)" />
      <rect x="52" y="30" width="12" height="40" rx="2" fill="rgba(245,166,35,0.4)" />
      <rect x="70" y="18" width="12" height="52" rx="2" fill="rgba(245,166,35,0.55)" />
      <rect x="88" y="10" width="12" height="60" rx="2" fill="rgba(245,166,35,0.7)" />
      {/* Trend line */}
      <polyline points="22,52 40,40 58,30 76,18 94,10" stroke="rgba(245,238,220,0.5)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
      {/* Dots on trend line */}
      <circle cx="22" cy="52" r="2.5" fill="rgba(245,166,35,0.8)" />
      <circle cx="40" cy="40" r="2.5" fill="rgba(245,166,35,0.8)" />
      <circle cx="58" cy="30" r="2.5" fill="rgba(245,166,35,0.8)" />
      <circle cx="76" cy="18" r="2.5" fill="rgba(245,166,35,0.8)" />
      <circle cx="94" cy="10" r="3" fill="rgba(245,238,220,0.9)" />
      {/* Baseline */}
      <line x1="10" y1="70" x2="108" y2="70" stroke="rgba(245,238,220,0.12)" strokeWidth="1" />
    </svg>
  );
}

/** Topics page: hash/tag grid with connecting lines */
export function TopicsIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hash symbol */}
      <line x1="34" y1="14" x2="28" y2="50" stroke="rgba(245,166,35,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="46" y1="14" x2="40" y2="50" stroke="rgba(245,166,35,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="26" x2="50" y2="26" stroke="rgba(245,166,35,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="38" x2="48" y2="38" stroke="rgba(245,166,35,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Tag bubbles */}
      <rect x="58" y="12" width="40" height="16" rx="8" fill="rgba(245,166,35,0.1)" stroke="rgba(245,166,35,0.3)" strokeWidth="1" />
      <rect x="62" y="34" width="32" height="14" rx="7" fill="rgba(245,238,220,0.05)" stroke="rgba(245,238,220,0.18)" strokeWidth="1" />
      <rect x="56" y="54" width="48" height="14" rx="7" fill="rgba(245,166,35,0.07)" stroke="rgba(245,166,35,0.2)" strokeWidth="1" />
      {/* Connecting dots */}
      <circle cx="54" cy="20" r="2" fill="rgba(245,166,35,0.4)" />
      <circle cx="54" cy="41" r="2" fill="rgba(245,238,220,0.25)" />
      <circle cx="54" cy="61" r="2" fill="rgba(245,166,35,0.3)" />
    </svg>
  );
}

/** Search page: magnifying glass with signal waves */
export function SearchIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifying glass */}
      <circle cx="50" cy="36" r="22" fill="rgba(245,166,35,0.06)" stroke="rgba(245,166,35,0.35)" strokeWidth="2" />
      <line x1="66" y1="52" x2="82" y2="68" stroke="rgba(245,166,35,0.45)" strokeWidth="3" strokeLinecap="round" />
      {/* Signal arcs inside glass */}
      <path d="M 38 36 Q 50 24 62 36" stroke="rgba(245,166,35,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 34 36 Q 50 18 66 36" stroke="rgba(245,166,35,0.25)" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="50" cy="36" r="3" fill="rgba(245,166,35,0.7)" />
    </svg>
  );
}
