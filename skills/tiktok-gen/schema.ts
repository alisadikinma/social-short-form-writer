/**
 * schema.ts — Zod schema for /tiktok-gen orchestrator output.
 *
 * The skill emits exactly one JSON envelope to stdout matching this schema.
 *
 * Discriminated union on `status`:
 *   - 'complete' → CompleteEnvelope (caption + hashtags + suggested_time)
 *   - 'failed'   → FailedEnvelope (error reason)
 *
 * Hard rules encoded here:
 *   - hashtags: 5-8 items
 *   - title (first-line hook): ≤100 chars (TikTok shorter than IG)
 *   - caption: ≤2200 chars; FIRST 150 chars CRITICAL for search index
 *   - link in caption is OK (TikTok allows it; many creators do this)
 *   - NO music_suggestion field (Publer auto-handles trending music)
 *   - English authoring
 */

import { z } from 'zod';

const HashtagSchema = z
  .string()
  .regex(/^#?[A-Za-z0-9_]{1,30}$/, {
    message: 'hashtag must be alphanumeric+underscore, ≤30 chars, with optional leading #',
  });

export const TiktokSuggestedTimeSlotSchema = z.object({
  day_of_week: z.enum([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]),
  hour: z.number().int().min(0).max(23),
  timezone: z.string().min(1).default('Asia/Jakarta'),
  rationale: z.string().min(1).max(200).optional(),
});

export const TiktokValidationSchema = z.object({
  passed: z.boolean(),
  failures: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

// Bare object schemas (no .superRefine) so they can be used in
// z.discriminatedUnion. Cross-field invariants applied below on the union.
export const TiktokCompleteEnvelopeSchema = z
  .object({
    status: z.literal('complete'),
    title: z
      .string()
      .min(1)
      .max(90, { message: 'title must be ≤90 chars (Publer TikTok photo carousel hard cap)' }),
    caption: z
      .string()
      .min(1)
      .max(2200, { message: 'caption must be ≤2200 chars' }),
    hashtags: z
      .array(HashtagSchema)
      .min(5, { message: 'TikTok hashtags must be ≥5 (search index relies on hashtags)' })
      .max(8, { message: 'TikTok hashtags must be ≤8 (more dilutes signal)' }),
    suggested_time_slot: TiktokSuggestedTimeSlotSchema.optional(),
    validation: TiktokValidationSchema,
  })
  .strict();

export const TiktokFailedEnvelopeSchema = z
  .object({
    status: z.literal('failed'),
    error: z.string().min(1).max(500),
    error_code: z
      .enum(['parse_error', 'rag_missing', 'guideline_conflict', 'timeout', 'unknown'])
      .default('unknown'),
  })
  .strict();

export const TiktokOutputEnvelopeSchema = z
  .discriminatedUnion('status', [
    TiktokCompleteEnvelopeSchema,
    TiktokFailedEnvelopeSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.status !== 'complete') return;

    // First 100 chars of caption is the SEARCH INDEX zone on TikTok 2026.
    // Reject openers that are mostly emoji + whitespace padding (e.g. an
    // "✨🚀✨" decorative opener that pushes the actual keyword past the
    // search-index window). Heuristic: strip emoji + whitespace, count
    // remaining substantive chars; <20 → fail.
    const first100 = data.caption.slice(0, 100);
    const substantive = first100
      // Strip common emoji ranges (Misc Symbols + Pictographs, Emoticons,
      // Transport, Supplemental Symbols, Dingbats).
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu, '')
      .replace(/\s+/g, '');
    if (substantive.length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['caption'],
        message:
          'first 100 chars of caption are critical for TikTok search index — strip emoji + whitespace and you should have ≥20 substantive chars (primary keyword should appear early)',
      });
    }
  });

export type TiktokSuggestedTimeSlot = z.infer<typeof TiktokSuggestedTimeSlotSchema>;
export type TiktokValidation = z.infer<typeof TiktokValidationSchema>;
export type TiktokCompleteEnvelope = z.infer<typeof TiktokCompleteEnvelopeSchema>;
export type TiktokFailedEnvelope = z.infer<typeof TiktokFailedEnvelopeSchema>;
export type TiktokOutputEnvelope = z.infer<typeof TiktokOutputEnvelopeSchema>;
