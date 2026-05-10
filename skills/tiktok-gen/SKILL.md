---
name: tiktok-gen
description: Convert a blog post (with optional pre-rendered carousel slides JSON) into a native TikTok caption + 5-8 hashtags + suggested posting time slot. Photo-mode (9:16 portrait) or short video format. Bahasa Indonesia authoring (Indonesian audience target). First 150 chars of caption are CRITICAL for search index. Music selection deferred to Publer (auto-attaches trending). Emits ONE JSON envelope to stdout matching `TiktokOutputEnvelopeSchema`.
---

# /tiktok-gen — TikTok caption authoring skill

## What this skill does

Reads a blog post + (optionally) carousel slide JSON from upstream pipeline,
produces native TikTok caption matching 2026 algorithm rules. Emits ONE
JSON envelope to stdout. Pure content generation — does NOT call backend API.

## Hard Rules (validated by Zod schema — violations = failed envelope)

1. **Authoring Language: BAHASA INDONESIA.** Caption + title primarily
   Indonesian. English *terms* OK as cultural shorthand for tech concepts
   (e.g. "AI agents", "vibe coding", "stack", "shipping") since target
   audience already mixes EN tech vocabulary into ID conversation. But
   grammar + connective tissue MUST be Indonesian. Hashtag tags can be
   either ID (`#solopreneurID`, `#fyp`) or EN (`#aibuilders`, `#aiagents`)
   — pick whichever has stronger discovery on TikTok ID locale.

2. **Hashtag count: 5-8 items.** TikTok 2026 algorithm uses hashtags as
   primary search-index signal — fewer than 5 loses discoverability.
   More than 8 dilutes the signal (treated as spam).

3. **Caption length tier system** (TikTok hard limit ≤2200 chars).
   - **Default sweet spot: 80-150 chars** (~12-25 words). Per 2026 TikTok
     engagement data: captions 50-100 chars get +21% likes vs longer
     captions (TTS Vibes / Glow Social analytics). Front-load primary
     keyword in first 80-100 chars (preview cutoff zone).
   - **SEO-driven educational posts: 200-400 chars** ONLY when first-150
     search-index zone needs additional keyword density AND the value
     justifies longer dwell.
   - **AVOID 400+ chars** — TikTok users scroll faster than IG; longer
     captions get skipped before payoff lands.
   - **NEVER repeat slide content** — TikTok users skip captions when
     slides already deliver the value. Caption is the conversational frame.

4. **Title field: ≤90 chars.** Publer hard cap for TikTok photo carousel
   (REQUIRED field, not optional). Title is the carousel COVER header
   that TikTok displays prominently — it MUST NOT be duplicated as the
   caption first line. The caption has its own hook (rule 5).
   - WRONG: title="Grok bilang ada orang yang mau membunuhnya. Dia
     percaya." + caption="Grok bilang ada orang yang mau membunuhnya.
     Dia percaya.\n\nAdam download Grok..." (title echoed verbatim)
   - RIGHT: title="Grok memvalidasi delusi 414 orang. Ini buktinya."
     + caption="Adam download Grok buat ngobrol setelah kehilangan
     kucingnya. 8 minggu kemudian dia bersembunyi di kamar gelap..."
     (title is summary headline, caption opens with story setup)
   - Title typically 60-90 chars. Caption opens with a DIFFERENT hook
     line that complements the title without echoing it.

5. **First 150 chars of caption: SEARCH INDEX zone.** Must contain the
   primary keyword/topic + hook payoff. Avoid emoji-padded openings or
   "Tonton sampai habis..." filler. This is what TikTok's search algorithm
   uses to surface your post in keyword queries. Primary keyword can be
   English tech term (e.g. "AI agents") since search index is locale-aware.

6. **Link in caption: OK.** Unlike Instagram, TikTok DOES allow body links
   (auto-detected, becomes tappable). If blog URL is provided, append at
   end of caption: `\nBaca selengkapnya: <url>`.

7. **NO music_suggestion field.** Publer auto-attaches trending music for
   TikTok auto-publishing. Schema rejects this field if present.

8. **Hook formula adherence.** First line must be ONE of (in Indonesian):
   - **Question hook** ("Kenapa AI agents lo selalu rusak di production?")
   - **Number-led** ("3 hal yang AI agents bikin salah (dan cara fix-nya).")
   - **Stakes statement** ("Kalau lo lagi build AI agents di 2026, baca ini.")
   - **Story opener** ("Gue ship AI agent yang rusak 4x sebelum work.")
   - **Pattern interrupt** ("Stop bikin AI agents kayak masih 2024.")
   See `references/compiled/refs-tiktok.md` for full pattern bank.

9. **Anti-AI-slop rubric.** Reject any output containing:
   - "Di era yang serba cepat ini" / "Di dunia yang berkembang pesat"
   - "Game-changer" / "revolusioner" / "leverage" / "sinergi"
   - "Penting untuk dicatat bahwa" / "Mari kita bahas"
   - "Tanpa basa-basi" / "Yuk dive in"
   - "Tahukah Anda?" (engagement-bait opener)
   - Emoji bullets used as visual structure on every line
   - Em-dashes (—) used as connective tissue ≥3 times in caption

10. **HOOK QUALITY GATE (first sentence MUST pass all 5 tests).** TikTok
    preview cutoff is ~80-100 chars — first sentence is the entire post
    for most viewers. Apply BEFORE emitting JSON envelope:
    - **Standalone-readable**: First sentence works as a complete thought
      even if reader never taps "more". No mid-sentence cliffhangers.
    - **Specific**: Numbers, named tools, dated stakes — NEVER vague.
      ❌ "AI agents lo punya masalah" → ✅ "Gue ship 4 AI agents 2025.
      3 rusak di production karena 1 hal yang sama."
    - **Curiosity-gap or pattern-interrupt**: Reader can't predict the
      payoff from the hook alone. ❌ "AI agents penting buat startup"
      → ✅ "Stop bikin AI agents kayak masih 2024."
    - **Native voice**: NOT LinkedIn-formal, NOT Gen-Z slang. Bahasa
      Indonesia conversational dengan EN tech terms sebagai shorthand.
    - **Primary keyword in first 80 chars**: TikTok search index zone.
      Cover this AND the curiosity payoff in the first sentence.
    If first sentence fails ANY test → regenerate. Do not ship a weak
    hook to fit length targets.

## Input shape

Same shape as `/instagram-gen` but `format` field accepts:
- `photo_carousel_9_16` — slide PNGs cropped to 9:16 by Publer
- `video` — backend-supplied video file (out of scope for v0.1.0)

```typescript
{
  blog: {
    title: string;            // ID — primary translation
    content: string;          // ID HTML body
    excerpt?: string;
    meta_keywords?: string;
    slug: string;
    blog_url?: string;        // Full URL for link-in-caption
  };
  content_idea?: {
    pillar: 'vibe_coding' | 'ai_agents' | 'ai_video_image' | 'ai_automation' | 'manufacturing';
    virality_score?: number;
  };
  carousel_slides?: Array<{
    slide_number: number;
    layout_hint: string;
    copy_id?: string;
    copy_en?: string;
    image_url: string;
  }>;
  format: 'photo_carousel_9_16' | 'video';
  posting_time_options?: Array<{
    day_of_week: string;
    hour: number;
    score: number;
    rationale: string;
  }>;
}
```

## Output shape (stdout — ONE JSON object only)

```json
{
  "status": "complete",
  "title": "Hook baris pertama ≤100 chars",
  "caption": "150 chars pertama HARUS mengandung primary keyword + hook payoff. Body story-arc. Optional `Baca selengkapnya: <url>` di akhir. Max 2 emoji. Bahasa Indonesia.",
  "hashtags": ["#aibuilders", "#aiagents", "#claudecode", "#vibecoding", "#solopreneurID", "#buildinpublic"],
  "suggested_time_slot": {
    "day_of_week": "wednesday",
    "hour": 20,
    "timezone": "Asia/Jakarta",
    "rationale": "B2B-tech audience peak engagement Wed 20:00 WIB per posting_time_rules"
  },
  "validation": {
    "passed": true,
    "failures": [],
    "notes": ["First 150 chars contains primary keyword 'AI agents' twice"]
  }
}
```

On failure:

```json
{
  "status": "failed",
  "error": "Specific operator-actionable message",
  "error_code": "rag_missing"
}
```

## Step-by-step (Sonnet executes)

1. **Read blog content** + extract primary keyword from `meta_keywords` (first
   item) or infer from title.
2. **Identify hook angle** — pick ONE of 5 hook formulas. Test against the
   blog's strongest claim. Reference `refs-tiktok.md` Hook Patterns.
3. **Draft title (first-line hook)** — ≤100 chars. Bahasa Indonesia. Punchier than IG.
4. **Draft caption body** — DEFAULT 80-150 chars. Front-load primary
   keyword in first 80-100 chars (preview cutoff + search-index zone).
   Structure: hook (first sentence, must pass Hook Quality Gate Rule 10)
   → 1 line payoff/CTA → optional blog URL. That's it. Slides carry the
   value; caption is the conversational frame.
   Example (135 chars): "Stop bikin AI agents kayak masih 2024. 3 hal yang
   bikin agents lo rusak di production — fix-nya di slide 4-6. Baca:
   alisadikinma.com/r/abc1234"

   **Long-form (200-400 chars) — only ship when**: SEO needs additional
   keyword density beyond first 150 chars AND value justifies dwell.
   Append blog URL if provided. Max 2 emoji TOTAL. Bahasa Indonesia
   conversational, NOT formal textbook ID.
5. **Pick hashtags** — 5-8 items. Mix:
   - 1-2 broad tags (`#aibuilders` — avoid generic `#fyp` unless algo data
     justifies; prefer pillar-specific)
   - 2-3 niche tags (`#aiagents`, `#claudecode`, `#vibecoding`)
   - 1-2 brand/identity tags (`#solopreneurID`, `#alisadikinma`)
6. **Pick suggested_time_slot** — from `posting_time_options` if provided,
   else default `{day_of_week: 'wednesday', hour: 20, timezone: 'Asia/Jakarta'}`.
7. **Run anti-slop check** — scan against banned phrases.
8. **Run search-index check** — first 150 chars must contain primary keyword
   ≥1 time (ideally 2x for strong signal). Primary keyword can be English
   tech term — search index is locale-aware.
9. **Emit JSON envelope to stdout.** End cleanly with `}`.

## Anti-patterns (auto-fail)

- First 150 chars start with "✨ Halo semua!" or any emoji-padded opener
- Generic search keywords stuffed without context (`#viral #fyp #trending`)
- Engagement-bait CTA ("Comment '🔥' kalau setuju!")
- Multiple emoji bullets used as structure
- Mentioning specific dollar amounts without source
- Promising "guaranteed" / "pasti berhasil" results
- music_suggestion field present (schema-rejected)
- Mixing formal Indonesian textbook style with casual TikTok tone
