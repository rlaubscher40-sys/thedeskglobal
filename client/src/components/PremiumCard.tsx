import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  /** Left border accent colour (CSS colour value) */
  accentColor?: string;
  /** Whether to show a hover lift effect */
  hoverable?: boolean;
  /** Whether to animate in on mount */
  animate?: boolean;
  /** Framer Motion delay for staggered lists */
  delay?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Shared premium card surface used across all pages.
 * Provides consistent glassmorphism depth, directional hover shadow, and optional
 * left-border category accent.
 */
export function PremiumCard({
  children,
  className = "",
  accentColor,
  hoverable = false,
  animate = true,
  delay = 0,
  onClick,
  style,
}: PremiumCardProps) {
  const base = {
    background: "oklch(0.135 0.018 260 / 0.92)",
    border: "1px solid rgba(255,255,255,0.065)",
    borderRadius: "12px",
    boxShadow: "0 2px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    overflow: "hidden",
    position: "relative" as const,
    transition: "box-shadow 0.25s ease, background 0.25s ease",
    ...(accentColor && { borderLeft: `3px solid ${accentColor}` }),
    ...style,
  };

  const hoverStyle = hoverable
    ? {
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.45), -4px -4px 20px rgba(245,166,35,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        background: "oklch(0.155 0.018 260 / 0.95)",
      }
    : undefined;

  const content = (
    <div
      className={`${className} ${hoverable ? "cursor-pointer" : ""}`}
      style={base}
      onClick={onClick}
      onMouseEnter={
        hoverable
          ? (e) => {
              if (hoverStyle) {
                Object.assign(e.currentTarget.style, hoverStyle);
              }
            }
          : undefined
      }
      onMouseLeave={
        hoverable
          ? (e) => {
              e.currentTarget.style.boxShadow = base.boxShadow as string;
              e.currentTarget.style.background = base.background as string;
            }
          : undefined
      }
    >
      {/* Subtle inner top highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: accentColor ? 3 : 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, rgba(255,255,255,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hoverable ? { y: -2, transition: { duration: 0.15 } } : undefined}
    >
      {content}
    </motion.div>
  );
}
