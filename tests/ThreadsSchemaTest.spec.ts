import { describe, it, expect } from 'vitest';
import {
  ThreadsOutputEnvelopeSchema,
  ThreadsCompleteEnvelopeSchema,
} from '../skills/threads-gen/schema.js';

const VALID_COMPLETE = {
  status: 'complete' as const,
  title: "Mayoritas demo 'AI agent' cuma chatbot dengan langkah ekstra.",
  caption:
    "Mayoritas demo 'AI agent' cuma chatbot dengan langkah ekstra.\n\nAgent beneran punya 3 hal: planner, memory, tool registry.\nKurang satu — lo balik ke chat doang.\n\nBanyak founder Indonesia yang ngira udah bikin agent. Cek dulu komponen mana yang missing.\n\nKomponen agent mana yang paling sering diskip di project lo?",
  hashtags: ['#AIAgents', '#ClaudeCode'],
  language: 'id' as const,
  suggested_time_slot: {
    day_of_week: 'wednesday' as const,
    hour: 20,
    timezone: 'Asia/Jakarta',
    rationale: 'Threads B2B-tech peak: weekday evening 20:00 WIB',
  },
  validation: {
    passed: true,
    failures: [],
    notes: ['Hook + body coupling clean, 2 hashtags within cap, Bahasa Indonesia'],
  },
};

const VALID_FAILED = {
  status: 'failed' as const,
  error: 'RAG file refs-threads.md not found in compiled bundle',
  error_code: 'rag_missing' as const,
};

describe('ThreadsOutputEnvelopeSchema — happy path', () => {
  it('accepts a well-formed complete envelope', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse(VALID_COMPLETE);
    expect(result.success).toBe(true);
  });

  it('accepts a well-formed failed envelope', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse(VALID_FAILED);
    expect(result.success).toBe(true);
  });

  it('accepts complete envelope with zero hashtags (allowed on Threads)', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      hashtags: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts language='id' override", () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      language: 'id' as const,
    });
    expect(result.success).toBe(true);
  });

  it("accepts language='en' override", () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      language: 'en' as const,
    });
    expect(result.success).toBe(true);
  });
});

describe('ThreadsOutputEnvelopeSchema — hard rule violations', () => {
  it('rejects 4+ hashtags (algorithm spam signal)', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      hashtags: ['#AIAgents', '#ClaudeCode', '#vibecoding', '#solopreneurAI'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects title > 140 chars (preview-cut boundary)', () => {
    const longTitle = 'A'.repeat(141);
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      title: longTitle,
    });
    expect(result.success).toBe(false);
  });

  it('rejects caption > 500 chars (Threads platform limit)', () => {
    const longCaption = 'A'.repeat(501);
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      caption: longCaption,
    });
    expect(result.success).toBe(false);
  });

  it('rejects URL in caption body', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      caption:
        VALID_COMPLETE.caption + '\n\nFull article: https://alisadikinma.com/blog/ai-agents',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty caption', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      caption: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown language enum value', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      language: 'jv',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed status discriminator', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      status: 'in_progress',
    });
    expect(result.success).toBe(false);
  });

  it('rejects failed envelope without error message', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      status: 'failed' as const,
      error: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('ThreadsOutputEnvelopeSchema — defaults + edge cases', () => {
  it("defaults language to 'id' when omitted (Indonesian audience target)", () => {
    const { language: _, ...withoutLanguage } = VALID_COMPLETE;
    const result = ThreadsCompleteEnvelopeSchema.parse(withoutLanguage);
    expect(result.language).toBe('id');
  });

  it('accepts caption right at 500-char hard cap', () => {
    const exactCap = 'A'.repeat(500);
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      caption: exactCap,
    });
    expect(result.success).toBe(true);
  });

  it('accepts title at exactly 140-char preview boundary', () => {
    const exactBoundary = 'A'.repeat(140);
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      title: exactBoundary,
    });
    expect(result.success).toBe(true);
  });

  it('accepts exactly 3 hashtags (max boundary)', () => {
    const result = ThreadsOutputEnvelopeSchema.safeParse({
      ...VALID_COMPLETE,
      hashtags: ['#AIAgents', '#ClaudeCode', '#alisadikinma'],
    });
    expect(result.success).toBe(true);
  });
});
