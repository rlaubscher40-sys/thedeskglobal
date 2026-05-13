import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Editions ───
  editions: router({
    list: publicProcedure.query(async () => {
      const rows = await db.getEditions();
      return rows.map(ed => ({
        ...ed,
        title: `Edition ${ed.editionNumber}: ${ed.weekRange}`,
      }));
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEditionById(input.id);
      }),
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.searchEditions(input.query);
      }),
    updateRubensTake: protectedProcedure
      .input(z.object({ editionId: z.number(), rubensTake: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
        await db.updateEditionRubensTake(input.editionId, input.rubensTake);
        return { success: true };
      }),
    generateRubensTake: protectedProcedure
      .input(z.object({ editionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
        const edition = await db.getEditionById(input.editionId);
        if (!edition) throw new Error('Edition not found');
        const topics = (edition.topics as Array<{ title: string; summary?: string; category?: string }>) || [];
        const topicLines = topics
          .slice(0, 5)
          .map((t, i) => `${i + 1}. ${t.title} (${t.category || 'general'}): ${t.summary || ''}`)
          .join('\n');
        const keyMetrics = edition.keyMetrics as Record<string, any> | null;
        const metricsText = keyMetrics
          ? Object.entries(keyMetrics).slice(0, 4).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')
          : 'not provided';
        const prompt = `You are writing "Ruben's Take" for The Desk, a daily intelligence tool for property investment professionals run by Ruben Laubscher, Head of Partnerships at InvestorKit.\n\nThis week's edition covers: ${edition.weekRange}\n\nTop topics this week:\n${topicLines}\n\nKey market metrics: ${metricsText}\n\nWrite Ruben's Take: 2 to 4 sentences that sound like the opening of a Substack essay. Rules:\n- Opens with a scene, observation, or counterintuitive reframe -- NOT a summary of the news\n- Short punchy sentences mixed with one longer analytical sentence\n- Calm authority, not loud. Anti-noise. Anti-certainty-performance.\n- Australian English, no em dashes, no bullet points\n- No marketing language, no "exciting" or "incredible"\n- Ends with a question or an invitation to think further -- never a CTA\n- The angle should be non-obvious: what does this week's news mean for property investors that most people are missing?\n- Output ONLY the 2-4 sentences. No title, no label, no preamble.`;
        const result = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are writing in the voice of Ruben Laubscher: calm, direct, commercially sharp, and contrarian. Output only the requested sentences.' },
            { role: 'user', content: prompt },
          ],
        });
        const content = (result as any)?.choices?.[0]?.message?.content?.trim();
        if (!content || content.length < 20) throw new Error('LLM returned empty content');
        await db.updateEditionRubensTake(input.editionId, content);
        return { rubensTake: content };
      }),
    backfillRubensTake: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
        const allEditions = await db.getEditions();
        const missing = allEditions.filter((e) => !e.rubensTake);
        const results: Array<{ editionId: number; editionNumber: number; success: boolean; error?: string }> = [];
        for (const edition of missing) {
          try {
            const topics = (edition.topics as Array<{ title: string; summary?: string; category?: string }>) || [];
            const topicLines = topics.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} (${t.category || 'general'}): ${t.summary || ''}`).join('\n');
            const keyMetrics = edition.keyMetrics as Record<string, any> | null;
            const metricsText = keyMetrics ? Object.entries(keyMetrics).slice(0, 4).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ') : 'not provided';
            const prompt = `You are writing "Ruben's Take" for The Desk, a daily intelligence tool for property investment professionals run by Ruben Laubscher, Head of Partnerships at InvestorKit.\n\nThis week's edition covers: ${edition.weekRange}\n\nTop topics this week:\n${topicLines}\n\nKey market metrics: ${metricsText}\n\nWrite Ruben's Take: 2 to 4 sentences that sound like the opening of a Substack essay. Rules:\n- Opens with a scene, observation, or counterintuitive reframe -- NOT a summary of the news\n- Short punchy sentences mixed with one longer analytical sentence\n- Calm authority, not loud. Anti-noise. Anti-certainty-performance.\n- Australian English, no em dashes, no bullet points\n- No marketing language, no "exciting" or "incredible"\n- Ends with a question or an invitation to think further -- never a CTA\n- The angle should be non-obvious: what does this week's news mean for property investors that most people are missing?\n- Output ONLY the 2-4 sentences. No title, no label, no preamble.`;
            const result = await invokeLLM({ messages: [{ role: 'system', content: 'You are writing in the voice of Ruben Laubscher: calm, direct, commercially sharp, and contrarian. Output only the requested sentences.' }, { role: 'user', content: prompt }] });
            const content = (result as any)?.choices?.[0]?.message?.content?.trim();
            if (!content || content.length < 20) throw new Error('LLM returned empty content');
            await db.updateEditionRubensTake(edition.id, content);
            results.push({ editionId: edition.id, editionNumber: edition.editionNumber, success: true });
          } catch (err: any) {
            results.push({ editionId: edition.id, editionNumber: edition.editionNumber, success: false, error: err?.message });
          }
        }
        return { processed: missing.length, results };
      }),

    generateSubstackDraft: protectedProcedure
      .input(z.object({ editionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
        const edition = await db.getEditionById(input.editionId);
        if (!edition) throw new Error('Edition not found');
        const topics = (edition.topics as Array<{ title: string; summary?: string; category?: string; body?: string; keyTakeaway?: string }>) || [];
        const topicLines = topics.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} (${t.category || 'general'})\n   Summary: ${t.summary || ''}\n   ${t.body ? 'Analysis: ' + t.body.slice(0, 300) : ''}\n   ${t.keyTakeaway ? 'Key takeaway: ' + t.keyTakeaway : ''}`).join('\n\n');
        const keyMetrics = edition.keyMetrics as Record<string, any> | null;
        const metricsText = keyMetrics ? Object.entries(keyMetrics).slice(0, 6).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ') : 'not provided';
        const rubensTake = edition.rubensTake || '';

        const essayPrompt = `You are ghostwriting a Substack essay for Ruben Laubscher. Ruben is 25, Head of Partnerships at InvestorKit (Australia's most awarded buyer's agency), building the national partnerships division from scratch since March 2026. Based in Sydney. He writes about leadership, property investment, and the decisions that compound.

This essay is based on his weekly intelligence edition: ${edition.weekRange}

Ruben's Take (editorial hook, already written by Ruben): ${rubensTake || '(not yet written -- write your own scene-setting opener)'}

Top topics from this edition:
${topicLines}

Key market metrics: ${metricsText}

---

RUBEN'S VOICE (non-negotiable):
Direct, personal, conversational but sharp. Short declarative sentences. Confident without arrogance. Uses specific real detail -- places, numbers, moments -- rather than abstractions. Vulnerability is factual, never dramatic. Lessons emerge from the story naturally, never stated upfront. The essay reads like a conversation Ruben is having with one intelligent person, not a broadcast.

ABSOLUTE BANS:
- No em dashes (never use --)
- No exclamation marks
- No motivational fluff ("incredible", "exciting", "game-changer", "level up", "blessed")
- No corporate jargon ("leverage", "ecosystem", "synergies", "value proposition")
- No AI tells ("Here's the thing:", "Let me be clear.", "In today's fast-paced world.", repetitive parallel structure)
- No bullet points or lists within the essay body
- No section headings within the essay (section breaks only with ---)
- No old IK stats (never use 2,400+ or $1B+)
- Australian English throughout (organisation, recognise, behaviour, colour)

CURRENT IK STATS (only use these if referencing IK):
- 2,600+ properties purchased
- $1.6B+ acquisitions
- $500M+ equity generated for clients
- 3x Buyer's Agency of the Year (2023/2024/2026)
- 700+ 5-star Google reviews
- 91% market forecasting accuracy

REAL SUBSTACK ESSAY EXAMPLES (study these for structure and voice):

Essay 1 opening ("The Things You Stop Doing First"):
"Before I burned out in real estate, I stopped going to the gym.

That was the first thing to go. Not dramatically. I didn't make a conscious decision to quit training. I just started skipping sessions because there was a call to make or an open home to prepare for or a client who needed something. One missed session became two. Two became a week. A week became the new normal.

Then I stopped walking. Not because I didn't want to. Because the mornings got swallowed by work before I'd had the chance to think about it."

Essay 2 opening ("The 3-Day Decision That Cost Me $230K"):
"I was on a trip through Europe when I made the decision. I was supposed to be on holiday but my phone wouldn't stop. My boss calling. Clients calling. People who only had time for their real estate agent when they weren't working, so evenings, weekends, holidays. My time off wasn't mine.

I was earning around 300k a year. By most measures, things were going well. But standing in a different country, watching my phone light up for the third time before lunch, something clicked. Not slowly. Not over weeks of deliberation. It just landed.

This isn't where I'm going."

NOTICE: opens with a specific moment, not the lesson. Short sentences. The thesis emerges from the story. The reader arrives at it before Ruben states it.

Substack closing CTA (always end the essay with this exact line in italics):
"If this landed, I write two of these a week. Subscribe and I'll send them straight to your inbox."

---

ESSAY STRUCTURE (600-800 words):

1. Opening (2-3 sentences): Use Ruben's Take if provided, or write a specific scene-setting moment. NEVER open with the lesson or a summary of the news.
2. The Signal (1 paragraph): What is the most important thing happening in property markets right now that most people are missing or misreading?
3. What it means (2 paragraphs): Unpack the implications. Be specific. Reference the actual data from this edition. Connect to what investors and advisers should actually be doing.
4. The pattern (1 paragraph): Connect this week to a longer trend. What does someone who has been watching markets for years see that others don't?
5. Closing (1 paragraph in italics): A question or observation that invites the reader to think further. Then the subscriber CTA on a new line.

Section breaks between sections use --- on its own line.

Also provide:
- A title: short, punchy, often a reframe or a tension. Like "The Fear Trade", "Same Objection, Different Person", "The Things You Stop Doing First", "The 3-Day Decision That Cost Me $230K". Never a question. Never clickbait.
- A subtitle: one plain sentence that frames the angle. Like "Burnout doesn't start at work. It starts with everything you quietly give up outside of it."

Output as JSON with keys: title, subtitle, body (the full essay as plain text with paragraph breaks as \n\n and section breaks as \n\n---\n\n)`;

        const essayResult = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a ghostwriter for Ruben Laubscher. You write in his exact voice: calm, direct, commercially sharp, non-obvious, Australian English. No em dashes, no exclamation marks, no AI tells, no motivational language, no bullet points. Output only valid JSON with keys title, subtitle, body.' },
            { role: 'user', content: essayPrompt },
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'substack_draft', strict: true, schema: { type: 'object', properties: { title: { type: 'string' }, subtitle: { type: 'string' }, body: { type: 'string' } }, required: ['title', 'subtitle', 'body'], additionalProperties: false } } },
        });

        const essayRaw = (essayResult as any)?.choices?.[0]?.message?.content?.trim();
        if (!essayRaw) throw new Error('LLM returned empty essay');
        let parsed: { title: string; subtitle: string; body: string };
        try { parsed = JSON.parse(essayRaw); } catch { throw new Error('LLM returned invalid JSON'); }
        // Strip any em dashes that slipped through
        parsed.body = parsed.body.replace(/\u2014/g, ',').replace(/\u2013/g, ',');
        parsed.title = parsed.title.replace(/\u2014/g, ',').replace(/\u2013/g, ',');
        parsed.subtitle = parsed.subtitle.replace(/\u2014/g, ',').replace(/\u2013/g, ',');

        // Generate a Substack-style hero image
        const dominantCategory = ((topics[0]?.category || 'MACRO')).toUpperCase();
        const catPrompts: Record<string, string> = {
          MACRO: 'dark editorial illustration of economic data and financial markets, deep navy and amber tones, abstract data visualisation, Substack blog hero style',
          PROPERTY: 'aerial architectural photography of Australian suburban houses, dark moody editorial style, navy and warm gold tones, Substack blog hero style',
          AI: 'abstract neural network visualisation with glowing nodes, dark background, electric blue and amber accents, Substack blog hero style',
          TECH: 'abstract technology circuit board and data flow, dark editorial style, blue and amber light, Substack blog hero style',
          POLICY: 'government building columns and legal documents, dark editorial photography style, navy and gold, Substack blog hero style',
          GEOPOLITICS: 'world map with geopolitical tension indicators, dark editorial illustration, navy and red accents, Substack blog hero style',
          SCIENCE: 'abstract scientific research imagery, microscopic patterns and data, dark editorial style, Substack blog hero style',
          MARKETS: 'stock market data visualisation, trading charts and financial graphs, dark editorial style, amber and green, Substack blog hero style',
        };
        const catPrompt = catPrompts[dominantCategory] || 'dark editorial intelligence briefing illustration, abstract data and information flows, navy background with amber accents, Substack blog hero style';
        const imagePrompt = `Substack essay hero image. Topic: ${parsed.title}. Style: ${catPrompt}. Wide format, cinematic, high contrast, no text, no words, no labels.`;
        let imageUrl: string | null = null;
        try {
          const { url } = await generateImage({ prompt: imagePrompt });
          imageUrl = url ?? null;
        } catch (imgErr) {
          console.warn('[Substack] Hero image generation failed:', imgErr);
        }

        // Auto-save the draft to the edition record
        await db.updateEditionSubstackDraft(input.editionId, {
          title: parsed.title,
          subtitle: parsed.subtitle,
          body: parsed.body,
          imageUrl,
        });

        return { title: parsed.title, subtitle: parsed.subtitle, body: parsed.body, imageUrl };
      }),

    saveSubstackDraft: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        title: z.string(),
        subtitle: z.string(),
        body: z.string(),
        imageUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
        await db.updateEditionSubstackDraft(input.editionId, {
          title: input.title,
          subtitle: input.subtitle,
          body: input.body,
          imageUrl: input.imageUrl ?? null,
        });
        return { success: true };
      }),

    generateHeroImage: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        dominantCategory: z.string(),
        weekRange: z.string(),
        topicTitles: z.array(z.string()).max(3),
      }))
      .mutation(async ({ input }) => {
        const catPrompts: Record<string, string> = {
          MACRO: "dark editorial illustration of economic data, interest rate charts, and financial markets, deep navy and amber tones, abstract data visualisation",
          PROPERTY: "aerial architectural photography of Australian suburban houses and city skyline, dark moody editorial style, navy and warm gold tones",
          AI: "abstract neural network visualisation with glowing nodes and data streams, dark background, electric blue and amber accents",
          TECH: "abstract technology circuit board and data flow, dark editorial style, blue and amber light",
          POLICY: "government building columns and legal documents, dark editorial photography style, navy and gold",
          GEOPOLITICS: "world map with geopolitical tension indicators, dark editorial illustration, navy and red accents",
          SCIENCE: "abstract scientific research imagery, microscopic patterns and data, dark editorial style",
          MARKETS: "stock market data visualisation, trading charts and financial graphs, dark editorial style, amber and green",
        };
        const catKey = (input.dominantCategory || "").toUpperCase();
        const catPrompt = catPrompts[catKey] || "dark editorial intelligence briefing illustration, abstract data and information flows, navy background with amber accents";
        const topicsText = input.topicTitles.slice(0, 2).join(" and ");
        const prompt = `Editorial intelligence briefing hero image for a weekly research archive. Week: ${input.weekRange}. Topics: ${topicsText}. Style: ${catPrompt}. No text, no words, no labels. Cinematic, high contrast, dark background.`;
        const { url } = await generateImage({ prompt });
        if (url) {
          await db.updateEditionHeroImage(input.editionId, url);
        }
        return { url: url ?? null };
      }),
  }),

  // ─── Daily Feed ───
  feed: router({
    getItems: publicProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getDailyFeedItems(input?.date);
      }),
    getRecentDates: publicProcedure.query(async () => {
      return db.getRecentFeedDates();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDailyFeedItemById(input.id);
      }),
    backfillSayThis: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
        const allItems = await db.getDailyFeedItems();
        const missing = allItems.filter(item => !item.sayThis);
        let generated = 0;
        let failed = 0;
        for (const item of missing) {
          try {
            const sayThisPrompt = `You are writing a "Say This" conversation starter for a property investment intelligence tool used by Ruben Laubscher, Head of Partnerships at InvestorKit.\n\nThe audience is mortgage brokers, financial advisers, and accountants who refer investment property clients to InvestorKit. They need a one-liner they can use in a client meeting to open a property conversation naturally.\n\nStory title: ${item.title}\nSummary: ${item.summary || "(no summary)"}\n\nWrite ONE sentence (max 25 words) that:\n- Sounds like something a professional would say naturally in a meeting, not read from a script\n- Opens a property investment conversation without being salesy\n- Is specific to this story -- not generic\n- Australian English, no em dashes, no exclamation marks, no question marks (statement only)\n- Does NOT start with "Have you seen...", "Did you know...", or "I was reading..."\n\nOutput ONLY the single sentence, nothing else.`;
            const result = await invokeLLM({
              messages: [
                { role: 'system', content: 'You are a commercially sharp property investment intelligence writer. Output only the requested single sentence. No preamble, no explanation, no quotes around the sentence.' },
                { role: 'user', content: sayThisPrompt },
              ],
            });
            const content = (result as any)?.choices?.[0]?.message?.content?.trim();
            if (content && content.length >= 10 && content.length <= 200) {
              const cleaned = content.replace(/\u2014/g, ',').replace(/\u2013/g, ',');
              await db.updateDailyFeedItemSayThis(item.id, cleaned);
              generated++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }
        return { generated, failed, total: missing.length };
      }),
  }),

  // ─── Reading Queue ───
  // ─── Topic Threads ───
  topics: router({
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        const [feedItems, editionResults] = await Promise.all([
          db.getFeedItemsByCategory(input.category),
          db.getEditionsByCategory(input.category),
        ]);
        return { feedItems, editions: editionResults };
      }),
    categories: publicProcedure.query(async () => {
      return db.getAllCategories();
    }),
    categoryItemCounts: publicProcedure.query(async () => {
      // Reuse getCategoryHeat with a long window to get all-time counts
      return db.getCategoryHeat(3650);
    }),
    recentByCategory: publicProcedure.query(async () => {
      // Returns up to 3 most recent feed items per category for the Topics overview
      const allItems = await db.getDailyFeedItems();
      const grouped: Record<string, typeof allItems> = {};
      for (const item of allItems) {
        const cat = (item.category || 'OTHER').toUpperCase();
        if (!grouped[cat]) grouped[cat] = [];
        if (grouped[cat].length < 3) grouped[cat].push(item);
      }
      return grouped;
    }),
  }),

  readingQueue: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getEnrichedReadingQueue(ctx.user.id);
    }),
    add: protectedProcedure
      .input(z.object({
        feedItemId: z.number().optional(),
        customUrl: z.string().optional(),
        customTitle: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // If bookmarking a feed item, resolve its metadata for rich display
        let resolvedTitle = input.customTitle ?? null;
        let resolvedUrl = input.customUrl ?? null;
        if (input.feedItemId) {
          const feedItem = await db.getDailyFeedItemById(input.feedItemId);
          if (feedItem) {
            resolvedTitle = resolvedTitle || feedItem.title;
            resolvedUrl = resolvedUrl || feedItem.sourceUrl || null;
          }
        }
        await db.addToReadingQueue({
          userId: ctx.user.id,
          feedItemId: input.feedItemId ?? null,
          customUrl: resolvedUrl,
          customTitle: resolvedTitle,
        });
        return { success: true };
      }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markReadingQueueItemRead(input.id, ctx.user.id);
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromReadingQueue(input.id, ctx.user.id);
        return { success: true };
      }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getEnrichedReadingQueue(ctx.user.id);
      return items.filter((i) => !i.isRead).length;
    }),
    clearAll: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearAllReadingQueue(ctx.user.id);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllReadingQueueRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Weekly Notes ───
  notes: router({
    get: protectedProcedure
      .input(z.object({ weekId: z.string() }))
      .query(async ({ ctx, input }) => {
        const note = await db.getWeeklyNote(ctx.user.id, input.weekId);
        return note ?? { id: 0, userId: ctx.user.id, weekId: input.weekId, content: "", createdAt: new Date(), updatedAt: new Date() };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllWeeklyNotes(ctx.user.id);
    }),
    save: protectedProcedure
      .input(z.object({
        weekId: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertWeeklyNote({
          userId: ctx.user.id,
          weekId: input.weekId,
          content: input.content,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ weekId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteWeeklyNote(ctx.user.id, input.weekId);
        return { success: true };
      }),
  }),

  // ─── Conversation Tracker ───
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getConversationEntries(ctx.user.id);
    }),
    track: protectedProcedure
      .input(z.object({
        editionId: z.number().optional(),
        lineText: z.string(),
        usedWithCategory: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addConversationEntry({
          userId: ctx.user.id,
          editionId: input.editionId ?? null,
          lineText: input.lineText,
          usedWithCategory: input.usedWithCategory ?? null,
        });
        return { success: true };
      }),
  }),

  // ─── Weekly Comparison ───
  weeklyComparison: router({
    recent: publicProcedure
      .input(z.object({ limit: z.number().min(2).max(8).optional() }).optional())
      .query(async ({ input }) => {
        return db.getRecentEditionsWithMetrics(input?.limit ?? 4);
      }),
  }),

  // ─── Trends ───
  trends: router({
    metricHistory: publicProcedure
      .input(z.object({ limit: z.number().min(2).max(20).optional() }).optional())
      .query(async ({ input }) => {
        return db.getMetricHistory(input?.limit ?? 12);
      }),
    categoryHeat: publicProcedure
      .input(z.object({ days: z.number().min(7).max(90).optional() }).optional())
      .query(async ({ input }) => {
        return db.getCategoryHeat(input?.days ?? 30);
      }),
    signalFrequency: publicProcedure
      .input(z.object({ editionLimit: z.number().min(2).max(20).optional() }).optional())
      .query(async ({ input }) => {
        return db.getSignalFrequency(input?.editionLimit ?? 8);
      }),
  }),

  // ─── Full-text Search ───
  search: router({
    all: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.searchAllContent(input.query);
      }),
  }),

  // ─── Admin Dashboard ───
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
      return db.getAdminStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
