/**
 * schema.ts — Zod schema for /instagram-gen orchestrator output.
 *
 * The skill emits exactly one JSON envelope to stdout matching this schema.
 * The consuming Laravel backend (Portfolio_v2) parses stdout, validates via
 * this schema (or its TypeScript equivalent), then advances FSM.
 *
 * Discriminated union on `status`:
 *   - 'complete' → CompleteEnvelope (caption + hashtags + suggested_time)
 *   - 'failed'   → FailedEnvelope (error reason)
 *
 * Hard rules encoded here (validated, not just documented):
 *   - hashtags: 3-5 items (HARDCAP since Dec 2025 IG algorithm change)
 *   - title (first-line hook): ≤125 chars
 *   - caption: ≤2200 chars (IG hard limit)
 *   - NO link in caption (IG canonical workflow — link goes in bio or first comment)
 *   - NO music_suggestion field (IG carousel is photo-mode, no music)
 *   - Indonesian authoring (Bahasa Indonesia primary — Indonesian audience target)
 *   - text_only_caption (OPTIONAL): condensed FB-text variant for cross-post reuse,
 *     ≤1000 chars, body URL allowed (FB tolerates body links). Backend's
 *     FacebookGenerationService reads this for FB text posts.
 */

import { z } from 'zod';

const HashtagSchema = z
  .string()
  .regex(/^#?[A-Za-z0-9_]{1,30}$/, {
    message: 'hashtag must be alphanumeric+underscore, ≤30 chars, with optional leading #',
  });

export const InstagramSuggestedTimeSlotSchema = z.object({
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

export const InstagramValidationSchema = z.object({
  passed: z.boolean(),
  failures: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

// Bare object schemas (no .superRefine) so they can be used in
// z.discriminatedUnion. Cross-field invariants applied below on the union.
export const InstagramCompleteEnvelopeSchema = z
  .object({
    status: z.literal('complete'),
    title: z
      .string()
      .min(1)
      .max(125, { message: 'title (first-line hook) must be ≤125 chars' }),
    caption: z
      .string()
      .min(1)
      .max(2200, { message: 'caption must be ≤2200 chars (IG hard limit)' }),
    text_only_caption: z
      .string()
      .min(1)
      .max(1000, { message: 'text_only_caption must be ≤1000 chars (FB text-post variant)' })
      .optional(),
    hashtags: z
      .array(HashtagSchema)
      .min(3, { message: 'IG hashtags must be ≥3' })
      .max(5, { message: 'IG hashtags HARDCAP at 5 since Dec 2025 algorithm change' }),
    suggested_time_slot: InstagramSuggestedTimeSlotSchema.optional(),
    validation: InstagramValidationSchema,
  })
  .strict();

export const InstagramFailedEnvelopeSchema = z
  .object({
    status: z.literal('failed'),
    error: z.string().min(1).max(500),
    error_code: z
      .enum(['parse_error', 'rag_missing', 'guideline_conflict', 'timeout', 'unknown'])
      .default('unknown'),
  })
  .strict();

export const InstagramOutputEnvelopeSchema = z
  .discriminatedUnion('status', [
    InstagramCompleteEnvelopeSchema,
    InstagramFailedEnvelopeSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.status !== 'complete') return;

    // Caption must NOT contain a URL — IG canonical workflow puts link in
    // bio or first comment. Backend may relax this for FB-carousel reuse.
    const urlPattern = /\bhttps?:\/\/[^\s)]+/i;
    if (urlPattern.test(data.caption)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['caption'],
        message: 'caption must not contain a URL — IG link belongs in bio or first comment',
      });
    }

    // text_only_caption (FB reuse variant) — body URL is OK on FB, but
    // skill should keep this concise (FB engagement drops past ~800 chars).
    // No URL validation here — FB text posts allow body links.
  });

export type InstagramSuggestedTimeSlot = z.infer<typeof InstagramSuggestedTimeSlotSchema>;
export type InstagramValidation = z.infer<typeof InstagramValidationSchema>;
export type InstagramCompleteEnvelope = z.infer<typeof InstagramCompleteEnvelopeSchema>;
export type InstagramFailedEnvelope = z.infer<typeof InstagramFailedEnvelopeSchema>;
export type InstagramOutputEnvelope = z.infer<typeof InstagramOutputEnvelopeSchema>;
