import { describe, it, expect } from 'vitest';
import {
  InstagramOutputEnvelopeSchema,
  InstagramCompleteEnvelopeSchema,
} from '../skills/instagram-gen/schema.js';

const VALID_COMPLETE = {
  status: 'complete' as const,
  title: '3 pola yang gue liat di setiap cerita $0 → $10k MRR',
  caption:
    'Mayoritas founder ngejar leverage point yang salah. Setelah liat 40+ launch SaaS solo di 2025, ada tiga pola yang konsisten muncul sebelum bulan $10k pertama — dan gak satupun soal marketing. Ini yang sebenernya berdampak. Comment stage lo, gue share pola mana yang cocok.',
  hashtags: ['#solopreneurID', '#aibuilders', '#vibecoding', '#buildinpublic'],
  suggested_time_slot: {
    day_of_week: 'tuesday' as const,
    hour: 19,
    timezone: 'Asia/Jakarta',
    rationale: 'B2B-tech audience peak per posting_time_rules',
  },
  validation: {
    passed: true,
    failures: [],
    notes: ['curiosity-gap hook + 4 hashtags within cap, Bahasa Indonesia'],
  },
};

const VALID_FAILED = {
  status: 'failed' as const,
  error: 'RAG file refs-instagram.md not found in compiled bundle',
  error_code: 'rag_missing' as const,
};

describe('InstagramOutputEnvelopeSchema — happy path', () => {
  it('accepts a well-formed complete envelope', () => {
    const result = InstagramOutputEnvelopeSchema.safeParse(VALID_COMPLETE);
    expect(result.success).toBe(true);
  });

  it('accepts a well-formed failed envelope', () => {
    const result = InstagramOutputEnvelopeSchema.safeParse(VALID_FAILED);
    expect(result.success).toBe(true);
  });
});

describe('InstagramOutputEnvelopeSchema — hashtag hardcap (Dec 2025 algo change)', () => {
  it('REJECTS 6 hashtags (over hardcap)', () => {
    const bad = {
      ...VALID_COMPLETE,
      hashtags: ['#a', '#b', '#c', '#d', '#e', '#f'],
    };
    const result = InstagramOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' | ');
      expect(messages).toMatch(/HARDCAP at 5/i);
    }
  });

  it('REJECTS 2 hashtags (below floor)', () => {
    const bad = { ...VALID_COMPLETE, hashtags: ['#a', '#b'] };
    const result = InstagramOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('accepts exactly 3 (min) and exactly 5 (max)', () => {
    expect(
      InstagramOutputEnvelopeSchema.safeParse({
        ...VALID_COMPLETE,
        hashtags: ['#a', '#b', '#c'],
      }).success,
    ).toBe(true);
    expect(
      InstagramOutputEnvelopeSchema.safeParse({
        ...VALID_COMPLETE,
        hashtags: ['#a', '#b', '#c', '#d', '#e'],
      }).success,
    ).toBe(true);
  });
});

describe('InstagramOutputEnvelopeSchema — caption + title length', () => {
  it('REJECTS title >125 chars', () => {
    const bad = { ...VALID_COMPLETE, title: 'a'.repeat(126) };
    const result = InstagramOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('REJECTS caption >2200 chars', () => {
    const bad = { ...VALID_COMPLETE, caption: 'a'.repeat(2201) };
    const result = InstagramOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('accepts exactly 125-char title and 2200-char caption', () => {
    const ok = {
      ...VALID_COMPLETE,
      title: 'a'.repeat(125),
      caption: 'a'.repeat(2200),
    };
    expect(InstagramOutputEnvelopeSchema.safeParse(ok).success).toBe(true);
  });
});

describe('InstagramOutputEnvelopeSchema — link-in-caption rule', () => {
  it('REJECTS caption containing http URL', () => {
    const bad = {
      ...VALID_COMPLETE,
      caption:
        'Cek artikel terbaru gue: https://alisadikinma.com/blog/example untuk detail framework 3-pola.',
    };
    const result = InstagramOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message).join(' | ')).toMatch(
        /must not contain a URL/i,
      );
    }
  });

  it('REJECTS caption containing https URL', () => {
    const bad = {
      ...VALID_COMPLETE,
      caption: 'Baca selengkapnya di https://example.com/article',
    };
    expect(InstagramOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts caption with no URL', () => {
    expect(InstagramOutputEnvelopeSchema.safeParse(VALID_COMPLETE).success).toBe(true);
  });
});

describe('InstagramOutputEnvelopeSchema — text_only_caption (FB reuse variant)', () => {
  it('accepts complete envelope with text_only_caption', () => {
    const ok = {
      ...VALID_COMPLETE,
      text_only_caption:
        'Mayoritas founder ngejar leverage point yang salah. Tiga pola yang konsisten muncul sebelum bulan $10k pertama — dan gak satupun soal marketing. Baca selengkapnya: https://alisadikinma.com/blog/3-patterns-mrr',
    };
    expect(InstagramOutputEnvelopeSchema.safeParse(ok).success).toBe(true);
  });

  it('accepts text_only_caption with body URL (FB tolerates body links)', () => {
    const ok = {
      ...VALID_COMPLETE,
      text_only_caption: 'Versi padat untuk FB. Baca: https://alisadikinma.com/blog/x',
    };
    expect(InstagramOutputEnvelopeSchema.safeParse(ok).success).toBe(true);
  });

  it('REJECTS text_only_caption >1000 chars', () => {
    const bad = {
      ...VALID_COMPLETE,
      text_only_caption: 'a'.repeat(1001),
    };
    const result = InstagramOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message).join(' | ')).toMatch(/≤1000 chars/i);
    }
  });

  it('accepts envelope WITHOUT text_only_caption (field is optional)', () => {
    expect(InstagramOutputEnvelopeSchema.safeParse(VALID_COMPLETE).success).toBe(true);
  });

  it('REJECTS empty-string text_only_caption', () => {
    const bad = { ...VALID_COMPLETE, text_only_caption: '' };
    expect(InstagramOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });
});

describe('InstagramOutputEnvelopeSchema — strict mode', () => {
  it('REJECTS unknown extra fields', () => {
    const bad = {
      ...VALID_COMPLETE,
      music_suggestion: 'Lo-fi beats',
    };
    const result = InstagramOutputEnvelopeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe('InstagramOutputEnvelopeSchema — discriminated union', () => {
  it('REJECTS envelope without status field', () => {
    const bad = { caption: 'x', hashtags: ['#a', '#b', '#c'] };
    expect(InstagramOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('REJECTS envelope with invalid status value', () => {
    const bad = { ...VALID_COMPLETE, status: 'pending' };
    expect(InstagramOutputEnvelopeSchema.safeParse(bad).success).toBe(false);
  });
});

describe('CompleteEnvelopeSchema standalone (used by parser)', () => {
  it('accepts the same valid envelope', () => {
    expect(InstagramCompleteEnvelopeSchema.safeParse(VALID_COMPLETE).success).toBe(true);
  });
});
