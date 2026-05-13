/**
 * Normalise keyMetrics from any stored format into a flat Record<string, string>.
 *
 * The field has been stored in two different shapes over time:
 *   1. Flat object  – { "RBA Cash Rate": "4.35%", ... }
 *   2. Array        – [{ label: "RBA Cash Rate", value: "4.35%", trend: "up", note: "..." }, ...]
 *
 * This helper converts either format into a plain Record<string, string> so all
 * rendering code can use Object.entries() safely without crashing.
 */
export type MetricItem = {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat" | null;
  note?: string;
};

export function normaliseKeyMetrics(
  raw: unknown
): Record<string, string> {
  if (!raw) return {};

  // Array format: [{label, value, ...}]
  if (Array.isArray(raw)) {
    const result: Record<string, string> = {};
    for (const item of raw as MetricItem[]) {
      // Skip blank labels -- they would produce empty-string React keys
      if (item && typeof item.label === "string" && item.label.trim() !== "" && item.value !== undefined) {
        result[item.label] = String(item.value);
      }
    }
    return result;
  }

  // Flat object format: {key: value}
  if (typeof raw === "object") {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      // Guard: skip blank keys and object values (would cause React render crash)
      if (k.trim() !== "" && v !== null && typeof v !== "object") {
        result[k] = String(v);
      }
    }
    return result;
  }

  return {};
}

/**
 * Context-aware colour logic for metric trend arrows.
 * Returns true if an UPWARD move in this metric is GOOD for property investors.
 * Defaults to true (up = good) for unknown metrics.
 */
const GOOD_WHEN_DOWN_LABELS = [
  "au cpi", "cpi", "inflation",
  "rba cash rate", "rba rate", "cash rate", "interest rate",
  "oil", "oil (brent)", "brent", "crude",
  "unemployment", "jobless",
];

export function isGoodWhenUp(label: string): boolean {
  const lower = label.toLowerCase();
  return !GOOD_WHEN_DOWN_LABELS.some((bad) => lower.includes(bad));
}

/**
 * Returns Tailwind colour classes for a trend arrow based on metric context.
 * green = good for property investors, red = bad.
 */
export function getTrendColour(
  label: string,
  trend: "up" | "down" | "flat" | null | undefined
): string {
  if (!trend || trend === "flat") return "text-amber-400/60";
  const goodUp = isGoodWhenUp(label);
  const isPositive = (trend === "up" && goodUp) || (trend === "down" && !goodUp);
  return isPositive ? "text-emerald-400" : "text-red-400";
}

/**
 * Per-metric tooltip copy explaining why a trend direction is good or bad
 * for property investors. Keys are lowercase substrings to match against label.
 */
const METRIC_TOOLTIP_MAP: Record<string, { whenGood: string; whenBad: string }> = {
  "rba cash rate": {
    whenGood: "Lower rates reduce mortgage costs and boost borrowing capacity for buyers.",
    whenBad:  "Higher rates mean more expensive mortgages and tighter borrowing capacity.",
  },
  "rba rate": {
    whenGood: "Lower rates reduce mortgage costs and boost borrowing capacity for buyers.",
    whenBad:  "Higher rates mean more expensive mortgages and tighter borrowing capacity.",
  },
  "cash rate": {
    whenGood: "Lower rates reduce mortgage costs and boost borrowing capacity for buyers.",
    whenBad:  "Higher rates mean more expensive mortgages and tighter borrowing capacity.",
  },
  "interest rate": {
    whenGood: "Lower rates reduce mortgage costs and boost borrowing capacity for buyers.",
    whenBad:  "Higher rates mean more expensive mortgages and tighter borrowing capacity.",
  },
  "au cpi": {
    whenGood: "Falling inflation gives the RBA room to cut rates sooner.",
    whenBad:  "Rising inflation pressures the RBA to keep rates higher for longer.",
  },
  "cpi": {
    whenGood: "Falling inflation gives the RBA room to cut rates sooner.",
    whenBad:  "Rising inflation pressures the RBA to keep rates higher for longer.",
  },
  "inflation": {
    whenGood: "Falling inflation gives the RBA room to cut rates sooner.",
    whenBad:  "Rising inflation pressures the RBA to keep rates higher for longer.",
  },
  "oil (brent)": {
    whenGood: "Lower oil prices ease construction and logistics costs.",
    whenBad:  "Higher oil prices lift transport and construction costs, squeezing margins.",
  },
  "oil": {
    whenGood: "Lower oil prices ease construction and logistics costs.",
    whenBad:  "Higher oil prices lift transport and construction costs, squeezing margins.",
  },
  "brent": {
    whenGood: "Lower oil prices ease construction and logistics costs.",
    whenBad:  "Higher oil prices lift transport and construction costs, squeezing margins.",
  },
  "crude": {
    whenGood: "Lower oil prices ease construction and logistics costs.",
    whenBad:  "Higher oil prices lift transport and construction costs, squeezing margins.",
  },
  "unemployment": {
    whenGood: "Falling unemployment supports rental demand and household spending.",
    whenBad:  "Rising unemployment weakens consumer confidence and rental demand.",
  },
  "jobless": {
    whenGood: "Falling unemployment supports rental demand and household spending.",
    whenBad:  "Rising unemployment weakens consumer confidence and rental demand.",
  },
  "asx": {
    whenGood: "A rising ASX signals investor confidence and strong household wealth.",
    whenBad:  "A falling ASX can dampen consumer confidence and investor appetite.",
  },
  "aud": {
    whenGood: "A stronger AUD reduces import costs and signals economic confidence.",
    whenBad:  "A weaker AUD raises import costs and can signal economic uncertainty.",
  },
  "clearance": {
    whenGood: "Higher clearance rates signal strong buyer demand and competitive conditions.",
    whenBad:  "Falling clearance rates signal softening demand and buyer hesitation.",
  },
  "s&p": {
    whenGood: "A rising S&P 500 reflects global risk appetite and supports AU market sentiment.",
    whenBad:  "A falling S&P 500 can trigger risk-off sentiment and dampen AU markets.",
  },
};

/**
 * Returns a short explanation of why a metric's trend direction is good or bad
 * for property investors. Used in hover tooltips on trend arrows.
 * Returns null if no tooltip copy is available for the metric.
 */
export function getMetricTooltip(
  label: string,
  trend: "up" | "down" | "flat" | null | undefined
): string | null {
  if (!trend || trend === "flat") return null;
  const lower = label.toLowerCase();
  const entry = Object.entries(METRIC_TOOLTIP_MAP).find(([key]) => lower.includes(key));
  if (!entry) return null;
  const [, copy] = entry;
  const goodUp = isGoodWhenUp(label);
  const isPositive = (trend === "up" && goodUp) || (trend === "down" && !goodUp);
  return isPositive ? copy.whenGood : copy.whenBad;
}

/**
 * Convert raw keyMetrics into a typed MetricItem array, preserving trend and note
 * from the array format, and computing nothing for the flat format.
 */
export function normaliseKeyMetricsItems(raw: unknown): MetricItem[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return (raw as MetricItem[]).filter(
      (item) => item && typeof item.label === "string" && item.label.trim() !== ""
    );
  }

  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([k, v]) => k.trim() !== "" && v !== null && typeof v !== "object")
      .map(([label, value]) => ({ label, value: String(value) }));
  }

  return [];
}
