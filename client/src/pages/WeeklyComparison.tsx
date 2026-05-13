import { trpc } from "@/lib/trpc";
import { normaliseKeyMetrics, getTrendColour, isGoodWhenUp } from "@/lib/normaliseKeyMetrics";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2, Flame, Activity, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { SignalEmptyState } from "@/components/SignalEmptyState";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const CAT_COLORS: Record<string, string> = {
  MACRO: "#f59e0b", PROPERTY: "#34d399", AI: "#60a5fa", TECH: "#60a5fa",
  POLICY: "#a78bfa", GEOPOLITICS: "#f87171", SCIENCE: "#fb7185", MARKETS: "#fb923c", OTHER: "#94a3b8",
};
function catColor(cat: string) { return CAT_COLORS[(cat || "").toUpperCase()] ?? CAT_COLORS.OTHER; }

const CHARTED_METRICS = [
  { key: "RBA Cash Rate", label: "RBA Cash Rate", color: "#f59e0b" },
  { key: "AU CPI", label: "AU CPI", color: "#34d399" },
  { key: "AUD/USD", label: "AUD/USD", color: "#60a5fa" },
  { key: "ASX 200", label: "ASX 200", color: "#a78bfa" },
  { key: "S&P 500", label: "S&P 500", color: "#f87171" },
  { key: "Sydney Clearance", label: "Syd Clearance", color: "#fb923c" },
  { key: "Melbourne Clearance", label: "Melb Clearance", color: "#fb7185" },
  { key: "Oil (Brent)", label: "Oil (Brent)", color: "#94a3b8" },
];

function parseNumeric(val: string | number | undefined): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function MetricTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,12,24,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", fontSize: "11px" }}>
      <div className="font-mono mb-2" style={{ color: "rgba(245,238,220,0.5)", fontSize: "10px" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "rgba(245,238,220,0.6)" }}>{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{p.value != null ? p.value : "\u2014"}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div style={{ color: "rgba(245,166,35,0.7)" }}>{icon}</div>
      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground leading-none">{label}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TrendBadge({ current, previous, label = "" }: { current: number | null; previous: number | null; label?: string }) {
  if (current === null || previous === null || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const up = pct > 0;
  if (Math.abs(pct) < 0.01) return <Minus style={{ width: 10, height: 10, color: "rgba(245,238,220,0.3)" }} />;
  const goodUp = isGoodWhenUp(label);
  const isPositive = (up && goodUp) || (!up && !goodUp);
  const colour = isPositive ? "rgba(52,211,153,0.9)" : "rgba(248,113,113,0.9)";
  return (
    <span className="font-mono text-[9px] flex items-center gap-0.5" style={{ color: colour }}>
      {up ? <TrendingUp style={{ width: 9, height: 9 }} /> : <TrendingDown style={{ width: 9, height: 9 }} />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

export default function WeeklyComparison() {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(["RBA Cash Rate", "AU CPI", "AUD/USD", "Sydney Clearance"]));
  const [heatDays, setHeatDays] = useState(30);

  const { data: metricHistory, isLoading: loadingMetrics } = trpc.trends.metricHistory.useQuery({ limit: 12 });
  const { data: categoryHeat, isLoading: loadingHeat } = trpc.trends.categoryHeat.useQuery({ days: heatDays });
  const { data: signalFreq, isLoading: loadingFreq } = trpc.trends.signalFrequency.useQuery({ editionLimit: 8 });

  const chartData = useMemo(() => {
    if (!metricHistory) return [];
    return metricHistory.map((ed) => {
      const metrics = normaliseKeyMetrics(ed.keyMetrics);
      const row: Record<string, any> = { label: `Ed ${ed.editionNumber}`, weekOf: ed.weekOf };
      for (const m of CHARTED_METRICS) row[m.key] = parseNumeric(metrics[m.key]);
      return row;
    });
  }, [metricHistory]);

  const freqChartData = useMemo(() => {
    if (!signalFreq) return [];
    const allCatsArr: string[] = [];
    const allCatsSet = new Set<string>();
    for (const row of signalFreq) Object.keys(row.categoryCounts).forEach((c) => { if (!allCatsSet.has(c)) { allCatsSet.add(c); allCatsArr.push(c); } });
    return signalFreq.map((row) => {
      const point: Record<string, any> = { label: `Ed ${row.editionNumber}` };
      for (const cat of allCatsArr) point[cat] = row.categoryCounts[cat] ?? 0;
      return point;
    });
  }, [signalFreq]);

  const freqCategories = useMemo(() => {
    if (!signalFreq) return [];
    const catsSet = new Set<string>();
    for (const row of signalFreq) Object.keys(row.categoryCounts).forEach((c) => catsSet.add(c));
    return Array.from(catsSet).sort();
  }, [signalFreq]);

  const maxHeat = useMemo(() => (!categoryHeat ? 1 : Math.max(...categoryHeat.map((c) => c.total), 1)), [categoryHeat]);
  const isLoading = loadingMetrics || loadingHeat || loadingFreq;

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); } else next.add(key);
      return next;
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-amber-400/60" /></div>;

  if ((metricHistory?.length ?? 0) === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <SignalEmptyState icon={<BarChart3 className="w-6 h-6" />} title="No editions yet"
          body="Trends will appear once weekly editions are published."
          bodySecondary="Metric charts, category heat, and signal frequency all build automatically from edition data." />
      </motion.div>
    );
  }

  const latestEdition = metricHistory?.[0];
  const latestPublishedAt = latestEdition ? (latestEdition as any).publishedAt : null;
  const lastUpdatedLabel = latestPublishedAt
    ? new Date(latestPublishedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
    : null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-12 pb-16">

      {/* Last updated / data source timestamp */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "rgba(245,238,220,0.3)" }}>
        <Clock style={{ width: 10, height: 10 }} />
        <span>
          {metricHistory?.length ?? 0} edition{(metricHistory?.length ?? 0) !== 1 ? "s" : ""} loaded
          {lastUpdatedLabel && <> &middot; latest published {lastUpdatedLabel} AEST</>}
        </span>
      </div>

      {/* Section 1: Metric Line Charts */}
      <section>
        <SectionHeader icon={<Activity className="w-4 h-4" />} label="Key Metric Trends" sub="Week-on-week movement across economic indicators from weekly editions" />
        <div className="flex flex-wrap gap-2 mb-5">
          {CHARTED_METRICS.map((m) => {
            const active = activeMetrics.has(m.key);
            if (!chartData.some((d) => d[m.key] != null)) return null;
            return (
              <button key={m.key} onClick={() => toggleMetric(m.key)} className="text-[10px] font-mono px-2.5 py-1 rounded-full transition-all duration-150"
                style={{ background: active ? m.color + "22" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? m.color + "66" : "rgba(255,255,255,0.08)"}`, color: active ? m.color : "rgba(245,238,220,0.4)" }}>
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(10,12,24,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(245,238,220,0.4)", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: "rgba(245,238,220,0.4)", fontFamily: "monospace" }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<MetricTooltip />} />
              {CHARTED_METRICS.filter((m) => activeMetrics.has(m.key)).map((m) => (
                <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2}
                  dot={{ r: 3, fill: m.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: m.color }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {chartData.length >= 2 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {CHARTED_METRICS.filter((m) => chartData[chartData.length - 1]?.[m.key] != null).map((m) => {
              const cur = chartData[chartData.length - 1]?.[m.key] as number | null;
              const pre = chartData[chartData.length - 2]?.[m.key] as number | null;
              return (
                <div key={m.key} className="rounded-lg p-3" style={{ background: "rgba(10,12,24,0.5)", border: `1px solid ${m.color}22` }}>
                  <div className="text-[10px] font-mono mb-1" style={{ color: "rgba(245,238,220,0.4)" }}>{m.label}</div>
                  <div className="font-mono text-sm font-semibold" style={{ color: m.color }}>{cur ?? "\u2014"}</div>
                  <div className="mt-1"><TrendBadge current={cur} previous={pre} label={m.key} /></div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Category Heat */}
      <section>
        <div className="flex items-start justify-between mb-6 gap-4">
          <SectionHeader icon={<Flame className="w-4 h-4" />} label="Coverage Heat" sub="Which topics are dominating across daily feed and weekly editions" />
          <div className="flex gap-2 shrink-0">
            {[7, 14, 30, 60].map((d) => (
              <button key={d} onClick={() => setHeatDays(d)} className="text-[10px] font-mono px-2.5 py-1 rounded-full transition-all duration-150"
                style={{ background: heatDays === d ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${heatDays === d ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`, color: heatDays === d ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.4)" }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        {(!categoryHeat || categoryHeat.length === 0) ? (
          <div className="rounded-xl p-6 text-center text-sm text-muted-foreground" style={{ background: "rgba(10,12,24,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}>No coverage data for the selected period.</div>
        ) : (
          <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(10,12,24,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {categoryHeat.filter((cat) => cat.category && cat.category.trim() !== "").map((cat, catIdx) => {
              const pct = (cat.total / maxHeat) * 100;
              const color = catColor(cat.category);
              return (
                <div key={cat.category || `cat-${catIdx}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-mono" style={{ color: "rgba(245,238,220,0.75)" }}>{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span>
                        {cat.daily > 0 && <span style={{ color: "rgba(96,165,250,0.7)" }}>{cat.daily} daily</span>}
                        {cat.daily > 0 && cat.weekly > 0 && <span style={{ color: "rgba(255,255,255,0.2)" }}> &middot; </span>}
                        {cat.weekly > 0 && <span style={{ color: "rgba(167,139,250,0.7)" }}>{cat.weekly} weekly</span>}
                      </span>
                      <span className="font-semibold" style={{ color, minWidth: "2rem", textAlign: "right" }}>{cat.total}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}cc, ${color}55)` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "rgba(96,165,250,0.6)" }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "rgba(96,165,250,0.6)" }} /> Daily feed items
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "rgba(167,139,250,0.6)" }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "rgba(167,139,250,0.6)" }} /> Weekly edition topics
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Signal Frequency */}
      {freqChartData.length >= 2 && (
        <section>
          <SectionHeader icon={<BarChart3 className="w-4 h-4" />} label="Topic Frequency by Edition" sub="How many deep dives per category appeared in each weekly edition" />
          <div className="rounded-xl p-4" style={{ background: "rgba(10,12,24,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={freqChartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(245,238,220,0.4)", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "rgba(245,238,220,0.4)", fontFamily: "monospace" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<MetricTooltip />} />
                <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(245,238,220,0.5)" }} />
                {freqCategories.filter((cat) => cat && cat.trim() !== "").map((cat, fIdx) => (
                  <Line key={cat || `freq-${fIdx}`} type="monotone" dataKey={cat} name={cat} stroke={catColor(cat)}
                    strokeWidth={1.5} dot={{ r: 3, fill: catColor(cat), strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {signalFreq && signalFreq.length >= 2 && (() => {
            const last = signalFreq[signalFreq.length - 1];
            const prev = signalFreq[signalFreq.length - 2];
            const rising: string[] = [];
            const falling: string[] = [];
            const allCats = Array.from(new Set([...Object.keys(last.categoryCounts), ...Object.keys(prev.categoryCounts)]));
            for (const cat of allCats) {
              const l = last.categoryCounts[cat] ?? 0;
              const p = prev.categoryCounts[cat] ?? 0;
              if (l > p) rising.push(cat);
              else if (l < p) falling.push(cat);
            }
            if (rising.length === 0 && falling.length === 0) return null;
            return (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {rising.length > 0 && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp style={{ width: 11, height: 11, color: "rgba(52,211,153,0.8)" }} />
                      <span className="text-[10px] font-mono" style={{ color: "rgba(52,211,153,0.8)" }}>RISING THIS EDITION</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rising.filter((cat) => cat && cat.trim() !== "").map((cat, rIdx) => (
                        <span key={cat || `rising-${rIdx}`} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                          style={{ background: catColor(cat) + "22", border: `1px solid ${catColor(cat)}44`, color: catColor(cat) }}>{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
                {falling.length > 0 && (
                  <div className="rounded-lg p-3" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingDown style={{ width: 11, height: 11, color: "rgba(248,113,113,0.8)" }} />
                      <span className="text-[10px] font-mono" style={{ color: "rgba(248,113,113,0.8)" }}>FALLING THIS EDITION</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {falling.filter((cat) => cat && cat.trim() !== "").map((cat, fIdx) => (
                        <span key={cat || `falling-${fIdx}`} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                          style={{ background: catColor(cat) + "22", border: `1px solid ${catColor(cat)}44`, color: catColor(cat) }}>{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}
    </motion.div>
  );
}
