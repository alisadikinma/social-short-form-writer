/**
 * schema.ts — Zod schema for /threads-gen orchestrator output.
 *
 * The skill emits exactly one JSON envelope to stdout matching this schema.
 * The consuming Laravel backend (Portfolio_v2 ThreadsGenerationService)
 * parses stdout, validates via this schema (or its TypeScript equivalent),
 * then advances FSM.
 *
 * Discriminated union on `status`:
 *   - 'complete' → CompleteEnvelope (caption + hashtags + suggested_time)
 *   - 'failed'   → FailedEnvelope (error reason)
 *
 * Hard rules encoded here (validated, not just documented):
 *   - hashtags: 0-3 items (HARDCAP — Threads algorithm penalizes 4+)
 *   - title (preview-cut hook): ≤140 chars (Threads "more" cutoff)
 *   - caption: ≤500 chars (Threads platform limit)
 *   - sweet spot: 280-450 chars
 *   - language: 'id' | 'en' | 'mixed' (default 'id' — Indonesian audience target)
 *   - NO link in caption (Threads de-prioritizes body URLs same as IG)
 *   - NO music_suggestion (no audio on Threads photo posts)
 */

import { z } from 'zod';

const HashtagSchema = z
  .string()
  .regex(/^#?[A-Za-z0-9_]{1,30}$/, {
    message: 'hashtag must be alphanumeric+underscore, ≤30 chars, with optional leading #',
  });

export const ThreadsSuggestedTimeSlotSchema = z.object({
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

export const ThreadsValidationSchema = z.object({
  passed: z.boolean(),
  failures: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

export const ThreadsCompleteEnvelopeSchema = z
  .object({
    status: z.literal('complete'),
    title: z
      .string()
      .min(1)
      .max(140, { message: 'title (preview-cut hook) must be ≤140 chars' }),
    caption: z
      .string()
      .min(1)
      .max(500, { message: 'caption must be ≤500 chars (Threads platform limit)' }),
    hashtags: z
      .array(HashtagSchema)
      .max(3, { message: 'Threads hashtags HARDCAP at 3 — algorithm penalty above' }),
    language: z.enum(['id', 'en', 'mixed']).default('id'),
    suggested_time_slot: ThreadsSuggestedTimeSlotSchema.optional(),
    validation: ThreadsValidationSchema,
  })
  .strict();

export const ThreadsFailedEnvelopeSchema = z
  .object({
    status: z.literal('failed'),
    error: z.string().min(1).max(500),
    error_code: z
      .enum(['parse_error', 'rag_missing', 'guideline_conflict', 'timeout', 'unknown'])
      .default('unknown'),
  })
  .strict();

export const ThreadsOutputEnvelopeSchema = z
  .discriminatedUnion('status', [
    ThreadsCompleteEnvelopeSchema,
    ThreadsFailedEnvelopeSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.status !== 'complete') return;

    // Caption must NOT contain a URL — Threads algorithm de-prioritizes
    // posts with body URLs same as IG. Link goes in first reply / bio.
    const urlPattern = /\bhttps?:\/\/[^\s)]+/i;
    if (urlPattern.test(data.caption)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['caption'],
        message: 'caption must not contain a URL — Threads link goes in first reply or bio',
      });
    }

    // Sweet spot reminder — non-blocking note (not a fail).
    // Caption < 200 chars is technically OK but reads thin.
    if (data.caption.length < 200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['caption'],
        message: 'caption is below 200 chars — Threads sweet spot is 280-450',
      });
    }
  });

export type ThreadsSuggestedTimeSlot = z.infer<typeof ThreadsSuggestedTimeSlotSchema>;
export type ThreadsValidation = z.infer<typeof ThreadsValidationSchema>;
export type ThreadsCompleteEnvelope = z.infer<typeof ThreadsCompleteEnvelopeSchema>;
export type ThreadsFailedEnvelope = z.infer<typeof ThreadsFailedEnvelopeSchema>;
export type ThreadsOutputEnvelope = z.infer<typeof ThreadsOutputEnvelopeSchema>;
