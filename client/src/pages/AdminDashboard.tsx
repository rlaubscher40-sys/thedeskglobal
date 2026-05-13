import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Clock,
  Database,
  FileText,
  Loader2,
  Lock,
  Newspaper,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";

const CATEGORY_COLORS: Record<string, string> = {
  PROPERTY: "#34d399",
  MACRO: "#f59e0b",
  AI: "#60a5fa",
  MARKETS: "#fb923c",
  POLICY: "#a78bfa",
  SCIENCE: "#fb7185",
  TECH: "#38bdf8",
  OTHER: "#94a3b8",
};

function catColor(cat: string) {
  return CATEGORY_COLORS[(cat || "OTHER").toUpperCase()] ?? CATEGORY_COLORS.OTHER;
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "Never";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "rgba(245,166,35,0.8)",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/8 p-5"
      style={{ background: "oklch(0.135 0.018 258)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}18` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <div className="font-mono text-3xl font-bold text-foreground leading-none mb-1">{value}</div>
      <div className="text-sm font-medium text-foreground/80">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="p-4 rounded-full" style={{ background: "rgba(245,166,35,0.1)" }}>
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-semibold">Sign in required</h2>
        <p className="text-muted-foreground max-w-sm">
          The admin dashboard requires authentication.
        </p>
        <a
          href={getLoginUrl()}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: "rgba(245,166,35,0.15)", color: "oklch(0.76 0.16 78)", border: "1px solid rgba(245,166,35,0.25)" }}
        >
          Sign in
        </a>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="p-4 rounded-full" style={{ background: "rgba(239,68,68,0.1)" }}>
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-serif text-2xl font-semibold">Access denied</h2>
        <p className="text-muted-foreground max-w-sm">
          This page is restricted to admin users only.
        </p>
      </div>
    );
  }

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const sortedCategories = Object.entries(stats.categoryCounts || {}).sort(
    ([, a], [, b]) => b - a
  );
  const maxCount = sortedCategories[0]?.[1] ?? 1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ background: "rgba(245,166,35,0.12)" }}>
            <Database className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">Admin Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Ingestion history, category coverage, and system health for The Desk.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Newspaper className="w-5 h-5" />}
          label="Total Feed Items"
          value={stats.totalFeedItems}
          sub="Last 200 items tracked"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Weekly Editions"
          value={stats.totalEditions}
          color="rgba(96,165,250,0.8)"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Last Daily Post"
          value={stats.lastDailyPosted ? formatDate(stats.lastDailyPosted).split(",")[0] : "Never"}
          sub={stats.lastDailyPosted ? formatDate(stats.lastDailyPosted).split(",")[1]?.trim() : undefined}
          color="rgba(52,211,153,0.8)"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Last Weekly Post"
          value={stats.lastWeeklyPosted ? formatDate(stats.lastWeeklyPosted).split(",")[0] : "Never"}
          sub={stats.lastWeeklyPosted ? formatDate(stats.lastWeeklyPosted).split(",")[1]?.trim() : undefined}
          color="rgba(167,139,250,0.8)"
        />
      </div>

      {/* Category coverage */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-white/8 p-6"
        style={{ background: "oklch(0.135 0.018 258)" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="font-serif text-lg font-semibold">Category Coverage</h2>
          <span className="text-xs text-muted-foreground ml-1">(last 200 feed items)</span>
        </div>
        <div className="space-y-3">
          {sortedCategories.map(([cat, count], i) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3"
            >
              <div className="w-20 text-right">
                <Badge
                  variant="outline"
                  className="text-xs font-mono px-1.5 py-0.5 border-0"
                  style={{ background: `${catColor(cat)}18`, color: catColor(cat) }}
                >
                  {cat}
                </Badge>
              </div>
              <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + 0.05 * i, ease: "easeOut" }}
                  className="h-full rounded-md"
                  style={{ background: `${catColor(cat)}40`, borderRight: `2px solid ${catColor(cat)}` }}
                />
              </div>
              <div className="w-8 text-right font-mono text-sm font-semibold" style={{ color: catColor(cat) }}>
                {count}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Ingestion history - daily feed */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-white/8 p-6"
          style={{ background: "oklch(0.135 0.018 258)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Newspaper className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-lg font-semibold">Daily Feed History</h2>
          </div>
          {stats.recentFeedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feed items ingested yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentFeedDates.map((entry, i) => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <span className="font-mono text-sm text-foreground/80">{entry.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(entry.count, 8) }).map((_, j) => (
                        <div
                          key={j}
                          className="w-2 h-4 rounded-sm"
                          style={{ background: j < entry.count ? "rgba(245,166,35,0.6)" : "rgba(255,255,255,0.06)" }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-primary font-semibold w-6 text-right">
                      {entry.count}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Weekly editions history */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/8 p-6"
          style={{ background: "oklch(0.135 0.018 258)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4" style={{ color: "rgba(96,165,250,0.8)" }} />
            <h2 className="font-serif text-lg font-semibold">Weekly Editions</h2>
          </div>
          {stats.recentEditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No editions ingested yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentEditions.map((ed, i) => (
                <motion.div
                  key={ed.editionNumber}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-start justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(96,165,250,0.12)", color: "rgba(96,165,250,0.9)" }}
                      >
                        #{ed.editionNumber}
                      </span>
                      <span className="text-sm text-foreground/80">{ed.weekOf}</span>
                    </div>
                    {ed.weekRange && (
                      <span className="text-xs text-muted-foreground mt-0.5 block">{ed.weekRange}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap ml-2">
                    {formatDate(ed.publishedAt).split(",")[0]}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
