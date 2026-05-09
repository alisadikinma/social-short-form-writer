import { describe, it, expect } from 'vitest';
import {
  TiktokOutputEnvelopeSchema,
  TiktokCompleteEnvelopeSchema,
} from '../skills/tiktok-gen/schema.js';

const VALID_COMPLETE = {
  status: 'complete' as const,
  title: 'Kenapa AI agents lo selalu rusak di production (dan cara fix-nya)',
  caption:
    'AI agents gagal di production karena satu hal: prompt chain yang rapuh. Setelah ship 4 agents di 2025, ini pola yang beneran kerja — context-aware retry dengan structured fallback. 150 chars pertama matter buat TikTok search, jadi gue front-load keyword: AI agents production reliability. Baca selengkapnya: https://alisadikinma.com/blog/ai-agents-production',
  hashtags: ['#aibuilders', '#aiagents', '#claudecode', '#vibecoding', '#solopreneurID', '#buildinpublic'],
  suggested_time_slot: {
    day_of_week: 'wednesday' as const,
    hour: 20,
    timezone: 'Asia/Jakarta',
    rationale: 'B2B-tech audience peak per posting_time_rules',
  },
  validation: {
    passed: true,
    failures: [],
    notes: ['First 150 chars contains primary keyword "AI agents" twice, Bahasa Indonesia'],
  },
};

const VALID_FAILED = {
  status: 'failed' as const,
  error: 'RAG file refs-tiktok.md not found in compiled bundle',
  error_code: 'rag_missing' as const,
};

describe('TiktokOutputEnvelopeSchema — happy path', () => {
  it('accepts a well-formed complete envelope', () => {
    expect(TiktokOutputEnvelopeSchema.safeParse(VALID_COMPLETE).success).toBe(true);
  });

  it('accepts a well-formed failed envelope', () => {
    expect(TiktokOutputEnvelopeSchema.safeParse(VALID_FAILED).success).toBe(true);
  });
});

describe('TiktokOutputEnvelopeSchema — hashtag bounds (5-8)', () => {
  it('REJECTS 4 hashtags (below floor)', () => {
    const bad = { ...VALID_COMPLETE, hashtags: ['#a', '#b', '#c', '#d'] };
    expect(TiktokOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('REJECTS 9 hashtags (over ceiling)', () => {
    const bad = {
      ...VALID_COMPLETE,
      hashtags: ['#a', '#b', '#c', '#d', '#e', '#f', '#g', '#h', '#i'],
    };
    expect(TiktokOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts exactly 5 (min) and exactly 8 (max)', () => {
    expect(
      TiktokOutputEnvelopeSchema.safeParse({
        ...VALID_COMPLETE,
        hashtags: ['#a', '#b', '#c', '#d', '#e'],
      }).success,
    ).toBe(true);
    expect(
      TiktokOutputEnvelopeSchema.safeParse({
        ...VALID_COMPLETE,
        hashtags: ['#a', '#b', '#c', '#d', '#e', '#f', '#g', '#h'],
      }).success,
    ).toBe(true);
  });
});

describe('TiktokOutputEnvelopeSchema — title length (≤100, shorter than IG)', () => {
  it('REJECTS title >100 chars', () => {
    const bad = { ...VALID_COMPLETE, title: 'a'.repeat(101) };
    expect(TiktokOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts exactly 100-char title', () => {
    const ok = { ...VALID_COMPLETE, title: 'a'.repeat(100) };
    expect(TiktokOutputEnvelopeSchema.safeParse(ok).success).toBe(true);
  });
});

describe('TiktokOutputEnvelopeSchema — link-in-caption ALLOWED', () => {
  it('accepts caption with http URL (TikTok allows it)', () => {
    expect(TiktokOutputEnvelopeSchema.safeParse(VALID_COMPLETE).success).toBe(true);
  });
});

describe('TiktokOutputEnvelopeSchema — first-100-char search-index gate', () => {
  it('REJECTS caption with first 100 chars >95% emoji (pathological opener)', () => {
    const bad = {
      ...VALID_COMPLETE,
      // 95 ✨ + 5 'a' in first 100 chars — only 5 substantive chars
      caption: '✨'.repeat(95) + 'a'.repeat(200),
    };
    const result = TiktokOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message).join(' | ')).toMatch(
        /search index/i,
      );
    }
  });

  it('REJECTS caption with first 100 chars all whitespace', () => {
    const bad = {
      ...VALID_COMPLETE,
      // 100 chars whitespace, then content — substantive count = 0 in first 100
      caption: ' '.repeat(100) + 'a'.repeat(500),
    };
    expect(TiktokOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts caption with substantive opener (first 100 chars have ≥20 alpha)', () => {
    expect(TiktokOutputEnvelopeSchema.safeParse(VALID_COMPLETE).success).toBe(true);
  });
});

describe('TiktokOutputEnvelopeSchema — strict mode rejects music_suggestion', () => {
  it('REJECTS envelope with music_suggestion field', () => {
    const bad = {
      ...VALID_COMPLETE,
      music_suggestion: 'Lo-fi beats',
    };
    expect(TiktokOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });
});

describe('TiktokOutputEnvelopeSchema — discriminated union', () => {
  it('REJECTS envelope without status', () => {
    expect(TiktokOutputEnvelopeSchema.safeParse({ caption: 'x' }).success).toBe(false);
  });

  it('REJECTS envelope with invalid status value', () => {
    expect(
      TiktokOutputEnvelopeSchema.safeParse({ ...VALID_COMPLETE, status: 'pending' }).success,
    ).toBe(false);
  });
});

describe('CompleteEnvelopeSchema standalone (used by parser)', () => {
  it('accepts the same valid envelope', () => {
    expect(TiktokCompleteEnvelopeSchema.safeParse(VALID_COMPLETE).success).toBe(true);
  });
});
