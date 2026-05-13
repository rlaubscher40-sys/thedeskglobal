/**
 * SignalEmptyState
 *
 * A composable empty-state component built on top of the ui/empty.tsx primitive.
 * Applies The Desk's dark-theme visual language: amber icon container, Playfair
 * serif heading, muted body text, and an optional amber CTA link.
 *
 * Usage:
 *   <SignalEmptyState
 *     icon={<FileText />}
 *     eyebrow="Archive"
 *     title="First edition coming soon"
 *     body="Weekly editions drop every Wednesday at 7am AEST."
 *     cta={{ label: "Get the weekly edition in your inbox →", href: "https://..." }}
 *   />
 */

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import type { ReactNode } from "react";

interface SignalEmptyStateProps {
  /** Lucide icon element, e.g. <FileText className="w-6 h-6" /> */
  icon: ReactNode;
  /** Small uppercase eyebrow label above the title */
  eyebrow?: string;
  /** Main heading — rendered in Playfair serif */
  title: string;
  /** Primary body copy */
  body: string;
  /** Optional secondary body copy */
  bodySecondary?: string;
  /** Optional CTA — renders as an amber bordered link */
  cta?: {
    label: string;
    href: string;
    external?: boolean;
  };
  className?: string;
}

export function SignalEmptyState({
  icon,
  eyebrow,
  title,
  body,
  bodySecondary,
  cta,
  className,
}: SignalEmptyStateProps) {
  return (
    <Empty className={`border-white/[0.05] bg-transparent py-24 ${className ?? ""}`}>
      <EmptyHeader>
        {/* Icon container */}
        <EmptyMedia className="w-14 h-14 rounded-xl bg-amber-500/[0.08] border border-amber-500/15 flex items-center justify-center text-amber-500/70 mb-1">
          {icon}
        </EmptyMedia>

        {/* Eyebrow */}
        {eyebrow && (
          <p className="text-[10px] font-semibold text-amber-500/60 tracking-[0.2em] uppercase">
            {eyebrow}
          </p>
        )}

        {/* Title */}
        <EmptyTitle
          className="font-serif text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {title}
        </EmptyTitle>
      </EmptyHeader>

      <EmptyContent>
        {/* Body */}
        <EmptyDescription className="text-sm text-muted-foreground leading-relaxed text-center">
          {body}
        </EmptyDescription>

        {/* Secondary body */}
        {bodySecondary && (
          <EmptyDescription className="text-xs text-muted-foreground/70 leading-relaxed text-center">
            {bodySecondary}
          </EmptyDescription>
        )}

        {/* CTA */}
        {cta && (
          <a
            href={cta.href}
            target={cta.external !== false ? "_blank" : undefined}
            rel={cta.external !== false ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-amber-400 bg-amber-500/[0.08] hover:bg-amber-500/[0.12] border border-amber-500/20 hover:border-amber-500/40 rounded-md transition-all mt-2"
          >
            {cta.label}
          </a>
        )}
      </EmptyContent>
    </Empty>
  );
}
