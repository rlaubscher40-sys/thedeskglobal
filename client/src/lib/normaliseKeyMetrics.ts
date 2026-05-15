/**
 * Safely coerce any value to a string[]. Handles:
 * - Already an array  -> returned as-is (filtered to non-empty strings)
 * - A non-empty string -> wrapped in a single-element array
 * - null / undefined  -> empty array
 */
export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return (value as unknown[]).filter((v) => typeof v === "string" && (v as string).trim().length > 0) as string[];
  if (typeof value === "string" && value.trim().length > 0) return [value.trim()];
  return [];
}

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

/**
 * Convert a raw DB key like AUS_PROPERTY_TAX or OIL_DEMAND into a
 * human-readable label like "Aus Property Tax" or "Oil Demand".
 * If the key already looks like a human label (contains spaces or mixed case), return as-is.
 */
export function formatMetricLabel(key: string): string {
  // Already human-readable (has spaces or is not all-caps/underscores)
  if (key.includes(' ')) return key;
  // Convert SCREAMING_SNAKE_CASE to Title Case
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * If a metric value is a long sentence (>25 chars), extract the first short token
 * (a number, percentage, currency value, or date) as the display value.
 * Returns { display, note } where note is the full sentence if truncated, else null.
 */
export function extractShortValue(raw: string): { display: string; note: string | null } {
  if (!raw || raw.length <= 25) return { display: raw, note: null };
  // Try to extract a leading number/percentage/currency/date token
  const match = raw.match(/^([A-Z]{1,3}\$?[\d,.]+%?|[\d,.]+%?|[\d]{1,2}\/[\d]{1,2}\/[\d]{2,4}|[\d]{4}-[\d]{2}-[\d]{2})/);
  if (match) return { display: match[1], note: raw };
  // Try to find a number anywhere in the first 40 chars
  const numMatch = raw.substring(0, 60).match(/([A-Z]{1,3}\$?[\d,.]+%?|[\d,.]+%?)/);
  if (numMatch) return { display: numMatch[1], note: raw };
  // Fallback: truncate to first 20 chars with ellipsis
  return { display: raw.substring(0, 20) + '…', note: raw };
}

export function normaliseKeyMetrics(
  raw: unknown
): Record<string, string> {
  if (!raw) return {};

  // Array format: [{label, value, ...}]
  if (Array.isArray(raw)) {
    const result: Record<string, string> = {};
    for (const item of raw as MetricItem[]) {
      if (item && typeof item.label === "string" && item.label.trim() !== "" && item.value !== undefined) {
        result[item.label] = String(item.value);
      }
    }
    return result;
  }

  // Flat object format: {key: value} or {key: {value, note, trend}}
  if (typeof raw === "object") {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (k.trim() === "") continue;
      if (v !== null && typeof v === "object" && "value" in (v as object)) {
        // Structured {value, note, trend} from server sanitiser
        result[k] = String((v as any).value);
      } else if (v !== null && typeof v !== "object") {
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
      .filter(([k]) => k.trim() !== "")
      .map(([label, v]) => {
        if (v !== null && typeof v === "object" && "value" in (v as object)) {
          // Structured {value, note, trend} from server sanitiser
          const structured = v as { value: string; note?: string; trend?: string };
          return {
            label,
            value: String(structured.value),
            note: structured.note,
            trend: (structured.trend as MetricItem["trend"]) ?? undefined,
          };
        }
        if (v !== null && typeof v !== "object") {
          return { label, value: String(v) };
        }
        return null;
      })
      .filter(Boolean) as MetricItem[];
  }

  return [];
}
