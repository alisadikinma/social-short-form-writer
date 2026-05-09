---
name: tiktok-gen
description: Convert a blog post (with optional pre-rendered carousel slides JSON) into a native TikTok caption + 5-8 hashtags + suggested posting time slot. Photo-mode (9:16 portrait) or short video format. English authoring. First 150 chars of caption are CRITICAL for search index. Music selection deferred to Publer (auto-attaches trending). Emits ONE JSON envelope to stdout matching `TiktokOutputEnvelopeSchema`.
---

# /tiktok-gen — TikTok caption authoring skill

## What this skill does

Reads a blog post + (optionally) carousel slide JSON from upstream pipeline,
produces native TikTok caption matching 2026 algorithm rules. Emits ONE
JSON envelope to stdout. Pure content generation — does NOT call backend API.

## Hard Rules (validated by Zod schema — violations = failed envelope)

1. **Authoring Language: ENGLISH.** Caption + title + hashtags all English.
   Indonesian terms OK as cultural shorthand, but grammar must be English.

2. **Hashtag count: 5-8 items.** TikTok 2026 algorithm uses hashtags as
   primary search-index signal — fewer than 5 loses discoverability.
   More than 8 dilutes the signal (treated as spam).

3. **Caption length: ≤2200 chars.** TikTok hard limit. Sweet spot:
   200-500 chars for photo-mode, 80-150 for video.

4. **First-line hook: ≤100 chars.** Title field. TikTok shorter than IG
   because the feed shows less caption above the fold.

5. **First 150 chars of caption: SEARCH INDEX zone.** Must contain the
   primary keyword/topic + hook payoff. Avoid emoji-padded openings or
   "Watch till the end..." filler. This is what TikTok's search algorithm
   uses to surface your post in keyword queries.

6. **Link in caption: OK.** Unlike Instagram, TikTok DOES allow body links
   (auto-detected, becomes tappable). If blog URL is provided, append at
   end of caption: `\nFull breakdown: <url>`.

7. **NO music_suggestion field.** Publer auto-attaches trending music for
   TikTok auto-publishing. Schema rejects this field if present.

8. **Hook formula adherence.** First line must be ONE of:
   - **Question hook** ("Why do most AI agents break in production?")
   - **Number-led** ("3 things AI agents get wrong (and how to fix them).")
   - **Stakes statement** ("If you're building AI agents in 2026, read this.")
   - **Story opener** ("I shipped an AI agent that broke 4 times before it worked.")
   - **Pattern interrupt** ("Stop building AI agents like it's 2024.")
   See `references/compiled/refs-tiktok.md` for full pattern bank.

9. **Anti-AI-slop rubric.** Reject any output containing:
   - "In today's fast-paced world"
   - "Game-changer" / "revolutionize" / "leverage" / "synergy"
   - "It's important to note that"
   - "Let's dive in" / "Without further ado"
   - "Did you know that..."  (engagement-bait opener)
   - Emoji bullets used as visual structure on every line
   - Em-dashes (—) used as connective tissue ≥3 times in caption

## Input shape

Same shape as `/instagram-gen` but `format` field accepts:
- `photo_carousel_9_16` — slide PNGs cropped to 9:16 by Publer
- `video` — backend-supplied video file (out of scope for v0.1.0)

```typescript
{
  blog: {
    title: string;            // EN
    content: string;          // EN HTML body
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
  "title": "First-line hook ≤100 chars",
  "caption": "First 150 chars MUST contain primary keyword + hook payoff. Story-arc body. Optional `Full breakdown: <url>` line at end. Max 2 emoji.",
  "hashtags": ["#aibuilders", "#aiagents", "#claudecode", "#vibecoding", "#solopreneur", "#buildinpublic"],
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
3. **Draft title (first-line hook)** — ≤100 chars. Punchier than IG.
4. **Draft caption body** — front-load primary keyword in first 150 chars.
   Photo-mode: 200-500 chars. Story arc compressed: hook → reveal → CTA.
   Append blog URL if provided. Max 2 emoji TOTAL.
5. **Pick hashtags** — 5-8 items. Mix:
   - 1-2 broad tags (`#aibuilders`, `#fyp` — but avoid generic `#fyp` unless
     algo data justifies; prefer pillar-specific)
   - 2-3 niche tags (`#aiagents`, `#claudecode`, `#vibecoding`)
   - 1-2 brand/identity tags (`#solopreneur`, `#alisadikinma`)
6. **Pick suggested_time_slot** — from `posting_time_options` if provided,
   else default `{day_of_week: 'wednesday', hour: 20, timezone: 'Asia/Jakarta'}`.
7. **Run anti-slop check** — scan against banned phrases.
8. **Run search-index check** — first 150 chars must contain primary keyword
   ≥1 time (ideally 2x for strong signal).
9. **Emit JSON envelope to stdout.** End cleanly with `}`.

## Anti-patterns (auto-fail)

- First 150 chars start with "✨ Hi everyone!" or any emoji-padded opener
- Generic search keywords stuffed without context (`#viral #fyp #trending`)
- Engagement-bait CTA ("Comment '🔥' if you agree!")
- Multiple emoji bullets used as structure
- Mentioning specific dollar amounts without source
- Promising "guaranteed" results
- music_suggestion field present (schema-rejected)
