import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Optional right-side slot for actions or badges */
  actions?: React.ReactNode;
  /** Optional ambient illustration rendered in the top-right of the header */
  illustration?: React.ReactNode;
  className?: string;
}

/**
 * Shared premium page header used across all secondary pages.
 * Provides consistent editorial chrome: icon + eyebrow label, serif title,
 * optional subtitle, amber rule, optional right-side actions, and optional
 * ambient illustration for visual richness.
 */
export function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions, illustration, className = "" }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`mb-8 relative overflow-hidden ${className}`}
    >
      {/* Ambient illustration (top-right, decorative) */}
      {illustration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 top-0 pointer-events-none"
          aria-hidden="true"
          style={{ opacity: 0.55 }}
        >
          {illustration}
        </motion.div>
      )}

      {/* Eyebrow row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: 13, height: 13, color: "rgba(245,166,35,0.9)" }} />
          </div>
          <span
            className="font-mono uppercase tracking-[0.2em]"
            style={{ fontSize: "9px", color: "rgba(245,166,35,0.65)", fontWeight: 700 }}
          >
            {eyebrow}
          </span>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Title */}
      <h1
        className="font-serif font-bold tracking-tight mb-2"
        style={{
          fontSize: "clamp(24px, 4vw, 36px)",
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          color: "rgba(245, 238, 220, 0.97)",
        }}
      >
        {title}
      </h1>

      {/* Subtitle -- lifted opacity for legibility */}
      {subtitle && (
        <p
          style={{
            fontSize: "14px",
            color: "rgba(245,238,220,0.58)",
            lineHeight: 1.65,
            maxWidth: "520px",
            marginBottom: "16px",
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Amber rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="origin-left"
        style={{
          height: "1px",
          background: "linear-gradient(90deg, rgba(245,166,35,0.55) 0%, rgba(245,166,35,0.12) 55%, transparent 100%)",
          maxWidth: "240px",
          marginTop: subtitle ? 0 : "12px",
        }}
      />
    </motion.div>
  );
}
