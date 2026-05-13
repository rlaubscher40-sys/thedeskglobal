import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";

/**
 * Generate a 4-persona partnerTag for a feed item using the LLM.
 * Returns a string with exactly 4 labelled lines:
 *   Brokers: ...
 *   Financial Advisers: ...
 *   Accountants: ...
 *   SMSF Specialists: ...
 * Returns null on failure (non-fatal -- item is still saved).
 */
async function generateMultiPersonaTag(
  title: string,
  summary: string | null,
  existingTag?: string | null,
): Promise<string | null> {
  try {
    const prompt = `You are writing partner conversation angles for a property investment intelligence tool used by Ruben Laubscher, Head of Partnerships at InvestorKit (Australia's leading data-driven buyer agency).

InvestorKit buys investment properties for clients across Australia (houses only, $600K-$1.2M, 4%+ yield). Partners refer clients to InvestorKit; InvestorKit charges the client directly ($20K inc GST). Partners keep their primary advisory relationship.

Story title: ${title}
Summary: ${summary || "(no summary)"}
Existing angle: ${existingTag || "(none)"}

Write EXACTLY 4 lines, one per partner type, in this format:
Brokers: [one sentence, max 20 words, for mortgage brokers -- how does this create a lending conversation or borrowing capacity moment?]
Financial Advisers: [one sentence, max 20 words, for financial advisers -- how does this affect portfolio strategy, wealth planning, or client advice?]
Accountants: [one sentence, max 20 words, for accountants -- how does this affect tax, depreciation, SMSF structuring, or financial reporting?]
SMSF Specialists: [one sentence, max 20 words, for SMSF advisers -- how does this affect self-managed super fund property strategy or compliance?]

Rules:
- Each line must start with exactly the persona label followed by a colon
- Focus on how this news creates a specific conversation opportunity or client action trigger
- Be commercially sharp and specific -- not generic (e.g. "this affects borrowing capacity" is too vague; "fixed rate expiries in Q3 mean clients need to reassess serviceability now" is sharp)
- Australian English, no em dashes, no exclamation marks
- Output ONLY the 4 lines, nothing else`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a commercially sharp property investment intelligence writer. Output only the requested format. No preamble, no explanation, no extra lines." },
        { role: "user", content: prompt },
      ],
    });

    const content = (result as any)?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Validate all 4 personas are present
    const required = ["Brokers:", "Financial Advisers:", "Accountants:", "SMSF Specialists:"];
    const hasAll = required.every((p) => content.includes(p));
    if (!hasAll) {
      console.warn("[Ingest] generateMultiPersonaTag: missing personas in output:", content.slice(0, 200));
      return null;
    }

    return content;
  } catch (err) {
    console.error("[Ingest] generateMultiPersonaTag error:", err);
    return null;
  }
}

/**
 * Auto-generate a "Say This" one-liner for a feed item.
 * One sentence, commercially sharp, something a broker or adviser could say to a client in a meeting.
 * Returns null on failure (non-fatal).
 */
async function generateSayThis(
  title: string,
  summary: string | null,
): Promise<string | null> {
  try {
    const prompt = `You are writing a "Say This" conversation starter for a property investment intelligence tool used by Ruben Laubscher, Head of Partnerships at InvestorKit.

The audience is mortgage brokers, financial advisers, and accountants who refer investment property clients to InvestorKit. They need a one-liner they can use in a client meeting to open a property conversation naturally.

Story title: ${title}
Summary: ${summary || "(no summary)"}

Write ONE sentence (max 25 words) that:
- Sounds like something a professional would say naturally in a meeting, not read from a script
- Opens a property investment conversation without being salesy
- Is specific to this story -- not generic
- Australian English, no em dashes, no exclamation marks, no question marks (statement only)
- Does NOT start with "Have you seen...", "Did you know...", or "I was reading..."

Output ONLY the single sentence, nothing else.`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a commercially sharp property investment intelligence writer. Output only the requested single sentence. No preamble, no explanation, no quotes around the sentence." },
        { role: "user", content: prompt },
      ],
    });

    const content = (result as any)?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 10 || content.length > 200) return null;
    // Strip any em dashes that slipped through
    return content.replace(/\u2014/g, ',').replace(/\u2013/g, ',');
  } catch (err) {
    console.error("[Ingest] generateSayThis error:", err);
    return null;
  }
}

/**
 * Auto-generate Ruben's Take for a new edition.
 * 2-4 sentences in Ruben's voice: calm authority, non-obvious angle, closes on a question or principle.
 * Returns null on failure (non-fatal).
 */
async function generateRubensTake(
  weekRange: string,
  topics: Array<{ title: string; summary?: string; category?: string }>,
  keyMetrics?: Record<string, any> | null,
): Promise<string | null> {
  try {
    const topicLines = topics
      .slice(0, 5)
      .map((t, i) => `${i + 1}. ${t.title} (${t.category || 'general'}): ${t.summary || ''}`)
      .join('\n');

    const metricsText = keyMetrics
      ? Object.entries(keyMetrics)
          .slice(0, 4)
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(', ')
      : 'not provided';

    const prompt = `You are writing "Ruben's Take" for The Desk -- a weekly intelligence briefing for property investment professionals curated by Ruben Laubscher, Head of Partnerships at InvestorKit (Australia's most awarded buyer's agency).

This week's edition covers: ${weekRange}

Top topics this week:
${topicLines}

Key market metrics: ${metricsText}

---

RUBEN'S VOICE (non-negotiable):
Ruben is 25, sharp, calm, commercially direct. He has been around long enough to see the patterns. He does not perform certainty. He does not do noise. He writes like he is having a conversation with one intelligent person, not broadcasting to a crowd.

ABSOLUTE BANS:
- No em dashes (never use --)
- No exclamation marks
- No motivational language ("incredible", "exciting", "game-changer", "level up")
- No corporate jargon ("leverage", "ecosystem", "synergies")
- No AI tells ("Here's the thing:", "Let me be clear.", "In today's fast-paced world.")
- No bullet points
- No summary of the news -- that is not a take, that is a recap
- Australian English throughout

REAL EXAMPLES OF RUBEN'S VOICE (study these openings):

Example 1: "Fear is the cheapest content in property right now. The budget dropped and within a day my feed was full of red arrows, booking links and DM me CTAs. Hot takes get clicks. Clicks get leads. Leads get clients. So they keep feeding it. But the engine is feeding the wrong thing."

Example 2: "The most useful thing I learned in my first BA role wasn't how to sell. It was how to stop trying to."

Example 3 (Substack opening): "Before I burned out in real estate, I stopped going to the gym. That was the first thing to go. Not dramatically. I didn't make a conscious decision to quit training. I just started skipping sessions because there was a call to make or an open home to prepare for or a client who needed something."

NOTICE: short declarative sentences. Specific. No abstraction. The lesson is never stated first. The angle is non-obvious.

---

Write Ruben's Take: 2 to 4 sentences that sound like the opening of a Substack essay.

Rules:
- Opens with a scene, observation, or counterintuitive reframe -- NOT a summary of the news
- Short punchy sentences mixed with one longer analytical sentence
- Calm authority. Anti-noise. Anti-certainty-performance.
- The angle should be non-obvious: what does this week's news mean for property investors that most people are missing?
- Ends with a question or an invitation to think further -- never a CTA
- Output ONLY the 2-4 sentences. No title, no label, no preamble, no explanation.`;

    const result = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a ghostwriter for Ruben Laubscher. You write in his voice: calm, direct, commercially sharp, non-obvious, Australian English. No em dashes, no exclamation marks, no AI tells, no motivational language. Output only the requested sentences, nothing else.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = (result as any)?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 20) return null;
    // Strip any em dashes that slipped through
    return content.replace(/\u2014/g, ',').replace(/\u2013/g, ',');
  } catch (err) {
    console.error('[Ingest] generateRubensTake error:', err);
    return null;
  }
}

/**
 * Authenticate a scheduled task request.
 * Authentication is exclusively via the X-Scheduled-Key request header.
 * No query param or cookie fallback is accepted.
 */
async function authenticateScheduledRequest(req: Request): Promise<boolean> {
  // Header-only auth: X-Scheduled-Key
  const apiKey = process.env.SCHEDULED_API_KEY;
  if (apiKey) {
    const headerKey = req.headers["x-scheduled-key"] as string | undefined;
    if (headerKey && headerKey === apiKey) {
      console.log("[Ingest] Authenticated via API key");
      return true;
    }
  }

  console.warn("[Ingest] Missing or invalid X-Scheduled-Key header");
  return false;
}

/**
 * Sanitize a string to be safe for MySQL insertion.
 * Replaces problematic Unicode characters with safe ASCII equivalents.
 */
function sanitizeText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/\u2014/g, "-")   // em dash
    .replace(/\u2013/g, "-")   // en dash
    .replace(/\u2018/g, "'")   // left single quote
    .replace(/\u2019/g, "'")   // right single quote
    .replace(/\u201C/g, '"')   // left double quote
    .replace(/\u201D/g, '"')   // right double quote
    .replace(/\u2026/g, "...") // ellipsis
    .replace(/\u00A0/g, " ");  // non-breaking space
}

type ItemValidationResult = {
  index: number;
  success: boolean;
  error?: string;
  field?: string;
};

/**
 * Validate a single feed item and return a structured result.
 */
function validateFeedItem(item: any, index: number): ItemValidationResult {
  const requiredFields = ["title", "source", "summary", "category", "feedDate"];
  for (const field of requiredFields) {
    if (!item[field]) {
      return { index, success: false, error: `Missing required field '${field}'`, field };
    }
  }

  // Validate field lengths against schema constraints
  if (item.title && item.title.length > 512) {
    return { index, success: false, error: `title exceeds 512 character limit (got ${item.title.length})`, field: "title" };
  }
  if (item.source && item.source.length > 256) {
    return { index, success: false, error: `source exceeds 256 character limit (got ${item.source.length})`, field: "source" };
  }
  if (item.category && item.category.length > 64) {
    return { index, success: false, error: `category exceeds 64 character limit (got ${item.category.length})`, field: "category" };
  }
  if (item.feedDate && item.feedDate.length > 10) {
    return { index, success: false, error: `feedDate must be YYYY-MM-DD format (got '${item.feedDate}')`, field: "feedDate" };
  }

  return { index, success: true };
}

/**
 * Parse a MySQL/DB error into a structured response.
 */
function parseDbError(error: any): { message: string; code?: string; field?: string } {
  const errMsg = error?.message || String(error);

  // ER_DATA_TOO_LONG
  if (errMsg.includes("Data too long") || error?.code === "ER_DATA_TOO_LONG") {
    const fieldMatch = errMsg.match(/column '(\w+)'/);
    return {
      message: `Data too long for column '${fieldMatch?.[1] || "unknown"}'`,
      code: "ER_DATA_TOO_LONG",
      field: fieldMatch?.[1],
    };
  }

  // ER_DUP_ENTRY
  if (errMsg.includes("Duplicate entry") || error?.code === "ER_DUP_ENTRY") {
    return { message: "Duplicate entry", code: "ER_DUP_ENTRY" };
  }

  // ER_TRUNCATED_WRONG_VALUE / charset issues
  if (errMsg.includes("Incorrect string value") || error?.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD") {
    const fieldMatch = errMsg.match(/column '(\w+)'/);
    return {
      message: `Invalid character encoding for column '${fieldMatch?.[1] || "unknown"}'. Ensure text is UTF-8 compatible.`,
      code: "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD",
      field: fieldMatch?.[1],
    };
  }

  return { message: errMsg };
}

export function registerScheduledRoutes(app: Express) {
  /**
   * POST /api/ingest/daily-feed
   * Accepts an array of feed items from the daily scan scheduled task.
   * Body: { items: Array<{ title, source, sourceUrl?, summary, category, partnerTag?, sayThis?, feedDate }> }
   *
   * Returns per-item results: { success, count, failed, results: [{ index, success, error?, field? }] }
   */
  app.post("/api/ingest/daily-feed", async (req: Request, res: Response) => {
    try {
      const authenticated = await authenticateScheduledRequest(req);
      if (!authenticated) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "items array is required and must not be empty" });
        return;
      }

      // Per-item validation
      const validationResults: ItemValidationResult[] = items.map((item: any, i: number) => validateFeedItem(item, i));
      const failedValidation = validationResults.filter((r) => !r.success);

      if (failedValidation.length === items.length) {
        // All items failed validation
        res.status(400).json({
          error: "All items failed validation",
          failed: failedValidation.length,
          results: failedValidation,
        });
        return;
      }

      // Build valid items, sanitizing text fields
      const validItems: any[] = [];
      const results: ItemValidationResult[] = [];

      for (let i = 0; i < items.length; i++) {
        const validation = validationResults[i];
        if (!validation.success) {
          results.push(validation);
          continue;
        }

        const item = items[i];
        validItems.push({
          feedDate: item.feedDate,
          title: sanitizeText(item.title) || item.title,
          source: sanitizeText(item.source) || item.source,
          sourceUrl: item.sourceUrl || null,
          summary: sanitizeText(item.summary) || item.summary,
          category: item.category.toUpperCase(),
          partnerTag: item.partnerTag
            ? (sanitizeText(typeof item.partnerTag === 'object' ? JSON.stringify(item.partnerTag) : item.partnerTag) || null)
            : null,
          sayThis: item.sayThis
            ? (sanitizeText(typeof item.sayThis === 'string' ? item.sayThis : String(item.sayThis)) || null)
            : null,
          promotedToEdition: false,
        });
        results.push({ index: i, success: true });
      }

      // Insert valid items
      if (validItems.length > 0) {
        try {
          await db.createDailyFeedItems(validItems);
        } catch (dbError: any) {
          const parsed = parseDbError(dbError);
          console.error("[Ingest] DB error inserting feed items:", parsed);
          res.status(500).json({
            error: parsed.message,
            code: parsed.code,
            field: parsed.field,
            validItemCount: validItems.length,
          });
          return;
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      console.log(`[Ingest] Ingested ${successCount} daily feed items (${failedCount} failed) for ${validItems[0]?.feedDate}`);

      // Respond immediately so the scheduled task doesn't time out.
      // 4-persona partnerTag enrichment runs asynchronously in the background.
      res.json({
        success: true,
        count: successCount,
        failed: failedCount,
        results: failedCount > 0 ? results : undefined,
      });

      // ── Background enrichment: generate 4-persona partnerTags ──────────────
      if (validItems.length > 0) {
        const feedDate = validItems[0].feedDate;
        setImmediate(async () => {
          try {
            // Fetch the just-inserted rows to get their auto-increment IDs
            const inserted = await db.getDailyFeedItems(feedDate);
            // Match by title (unique enough within a single day's batch)
            const titleToId = new Map<string, number>();
            for (const row of inserted) {
              if (row.title && row.id) titleToId.set(row.title, row.id);
            }

            let enriched = 0;
            let enrichFailed = 0;
            let sayThisEnriched = 0;
            for (const item of validItems) {
              const id = titleToId.get(item.title);
              if (!id) continue;

              // Generate 4-persona partnerTag
              const tag = await generateMultiPersonaTag(item.title, item.summary, item.partnerTag);
              if (tag) {
                await db.updateDailyFeedItemPartnerTag(id, tag);
                enriched++;
              } else {
                enrichFailed++;
              }

              // Generate sayThis one-liner if not already provided in the payload
              if (!item.sayThis) {
                const sayThis = await generateSayThis(item.title, item.summary);
                if (sayThis) {
                  await db.updateDailyFeedItemSayThis(id, sayThis);
                  sayThisEnriched++;
                }
              }
            }
            console.log(`[Ingest] Enriched ${enriched} partnerTags (${enrichFailed} failed), ${sayThisEnriched} sayThis lines for ${feedDate}`);
          } catch (enrichErr) {
            console.error("[Ingest] Background partnerTag enrichment error:", enrichErr);
          }
        });
      }
    } catch (error: any) {
      const parsed = parseDbError(error);
      console.error("[Ingest] daily-feed error:", parsed);
      res.status(500).json({
        error: parsed.message,
        code: parsed.code,
        field: parsed.field,
      });
    }
  });

  /**
   * POST /api/ingest/weekly-edition
   * Accepts a new weekly edition from the weekly scan scheduled task.
   * Body: { editionNumber, weekOf, weekRange, topics, signals, fullText?, keyMetrics?, readingTime? }
   */
  app.post("/api/ingest/weekly-edition", async (req: Request, res: Response) => {
    try {
      const authenticated = await authenticateScheduledRequest(req);
      if (!authenticated) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const body = req.body;
      if (!body.editionNumber || !body.weekOf || !body.weekRange || !body.topics || !body.signals) {
        res.status(400).json({ error: "Missing required fields: editionNumber, weekOf, weekRange, topics, signals" });
        return;
      }

      // Validate topics array
      if (!Array.isArray(body.topics) || body.topics.length === 0) {
        res.status(400).json({ error: "topics must be a non-empty array" });
        return;
      }

      const topicErrors: string[] = [];
      for (let i = 0; i < body.topics.length; i++) {
        const topic = body.topics[i];
        if (!topic.title || !topic.summary || !topic.category) {
          topicErrors.push(`Topic at index ${i} missing required fields (title, summary, category)`);
        }
      }
      if (topicErrors.length > 0) {
        res.status(400).json({ error: "Invalid topics", details: topicErrors });
        return;
      }

      // Validate signals array
      if (!Array.isArray(body.signals) || body.signals.length === 0) {
        res.status(400).json({ error: "signals must be a non-empty array" });
        return;
      }

      const editionData = {
        editionNumber: body.editionNumber,
        weekOf: body.weekOf,
        weekRange: body.weekRange,
        pdfUrl: body.pdfUrl || `signal://edition/${body.editionNumber}`,
        readingTime: body.readingTime || null,
        topics: body.topics.map((t: any) => ({
          title: sanitizeText(t.title) || t.title,
          summary: sanitizeText(t.summary) || t.summary,
          category: t.category.toUpperCase(),
          partnerRelevance: t.partnerRelevance || [],
          body: t.body ? (sanitizeText(t.body) || t.body) : undefined,
          keyTakeaway: t.keyTakeaway ? (sanitizeText(t.keyTakeaway) || t.keyTakeaway) : undefined,
          whatToWatch: Array.isArray(t.whatToWatch) ? t.whatToWatch : undefined,
          talkingPoints: t.talkingPoints && typeof t.talkingPoints === 'object' ? t.talkingPoints : undefined,
          partnerTag: t.partnerTag
            ? (sanitizeText(typeof t.partnerTag === 'object' ? JSON.stringify(t.partnerTag) : t.partnerTag) || null)
            : undefined,
        })),
        signals: body.signals.map((s: string) => sanitizeText(s) || s),
        fullText: sanitizeText(body.fullText) || null,
        keyMetrics: body.keyMetrics || null,
      };

      try {
        await db.createEdition(editionData);
      } catch (dbError: any) {
        const parsed = parseDbError(dbError);
        console.error("[Ingest] DB error inserting edition:", parsed);
        res.status(500).json({
          error: parsed.message,
          code: parsed.code,
          field: parsed.field,
        });
        return;
      }

      console.log(`[Ingest] Ingested Edition ${editionData.editionNumber}: ${editionData.weekOf}`);

      // Auto-generate hero image + Ruben's Take (non-blocking -- failure does not affect the ingest response)
      setImmediate(async () => {
        try {
          const inserted = await db.getEditionByNumber(editionData.editionNumber);
          if (!inserted) return;

          // Auto-generate Ruben's Take
          const take = await generateRubensTake(
            editionData.weekRange,
            editionData.topics as any[],
            editionData.keyMetrics as Record<string, any> | null,
          );
          if (take) {
            await db.updateEditionRubensTake(inserted.id, take);
            console.log(`[Ingest] Ruben's Take auto-generated for Edition ${editionData.editionNumber}`);
          } else {
            console.warn(`[Ingest] Ruben's Take generation returned null for Edition ${editionData.editionNumber}`);
          }
          const topics = (editionData.topics as any[]) || [];
          const dominantCategory = (topics[0]?.category || "MACRO").toUpperCase();

          // Build a rich, edition-specific image prompt using actual topic content
          const topicSummaries = topics.slice(0, 3).map((t: any) => {
            const title = String(t.title || "").trim();
            const summary = String(t.summary || "").trim().slice(0, 120);
            return summary ? `${title}: ${summary}` : title;
          }).filter(Boolean);

          const catVisualStyle: Record<string, string> = {
            MACRO: "economic data charts, interest rate curves, and abstract financial flows, deep navy and amber tones",
            PROPERTY: "aerial view of Australian suburban houses and city skyline at dusk, warm gold and navy tones",
            AI: "glowing neural network nodes and data streams, dark background, electric blue and amber light",
            TECH: "circuit board patterns and digital data flows, dark editorial style, blue and amber",
            POLICY: "government architecture and legal documents, dark editorial photography, navy and gold",
            GEOPOLITICS: "world map with tension indicators and trade routes, dark editorial illustration, navy and red",
            SCIENCE: "microscopic patterns and research data visualisation, dark editorial style, teal and amber",
            MARKETS: "trading charts, financial graphs, and market data, dark editorial style, amber and green",
          };
          const visualStyle = catVisualStyle[dominantCategory] || "abstract intelligence briefing illustration, data flows and information networks, navy background with amber accents";
          const topicsContext = topicSummaries.length > 0
            ? `This week covers: ${topicSummaries.join(" | ")}`
            : `Week: ${editionData.weekRange}`;

          const prompt = `Cinematic editorial hero image for a weekly intelligence briefing. ${topicsContext}. Visual style: ${visualStyle}. Dark background, high contrast, no text, no words, no labels, no numbers. Photorealistic or painterly, not cartoonish. Aspect ratio 16:9.`;
          const { url } = await generateImage({ prompt });
          if (url) {
            await db.updateEditionHeroImage(inserted.id, url);
            console.log(`[Ingest] Hero image auto-generated for Edition ${editionData.editionNumber}`);
          }
        } catch (imgError) {
          console.warn(`[Ingest] Hero image auto-generation failed for Edition ${editionData.editionNumber}:`, imgError);
        }
      });

      res.json({ success: true, editionNumber: editionData.editionNumber });
    } catch (error: any) {
      const parsed = parseDbError(error);
      console.error("[Ingest] weekly-edition error:", parsed);
      res.status(500).json({
        error: parsed.message,
        code: parsed.code,
        field: parsed.field,
      });
    }
  });

  console.log("[Ingest] Registered /api/ingest/daily-feed and /api/ingest/weekly-edition endpoints");
}
