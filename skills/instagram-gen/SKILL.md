---
name: instagram-gen
description: Convert a blog post (with optional pre-rendered carousel slides JSON) into a native Instagram caption + 3-5 hashtags + suggested posting time slot. 4:5 photo carousel format. English authoring. Hard 5-hashtag cap (Dec 2025 algorithm change). NO link in caption — IG link belongs in bio or first comment. Emits ONE JSON envelope to stdout matching `InstagramOutputEnvelopeSchema`.
---

# /instagram-gen — Instagram caption authoring skill

## What this skill does

Reads a blog post + (optionally) carousel slide JSON from upstream pipeline,
produces native Instagram caption matching 2026 algorithm rules. Emits ONE
JSON envelope to stdout. Pure content generation — does NOT call backend API.

## Hard Rules (validated by Zod schema — violations = failed envelope)

1. **Authoring Language: ENGLISH.** Caption + title + hashtags all English.
   Indonesian *terms* OK as cultural shorthand (e.g. "warung", "ojek") if the
   blog is Indonesia-context, but grammar + connective tissue must be English.
   Mirrors `linkedin-post-writer` v0.6.0 directive.

2. **Hashtag count: 3-5 items HARDCAP.** Instagram's Dec 2025 algorithm
   change penalizes posts with 6+ hashtags (treated as spam signal).
   Below 3 is OK technically but loses discoverability — aim for 4-5.

3. **Caption length: ≤2200 chars.** Hard IG limit. Sweet spot for
   storytelling carousels: 1200-1800 chars.

4. **First-line hook: ≤125 chars.** Title field. This is what shows above
   the "more" cutoff on feed. If hook exceeds 125, IG truncates mid-sentence.

5. **NO link in caption.** IG canonical workflow puts link in bio or first
   comment. Body URLs hurt reach + look amateur. The consuming backend can
   bypass this for FB carousel reuse, but plugin output stays canonical.

6. **NO music_suggestion field.** IG photo carousel = no audio track.
   That's a TikTok-only field and Publer auto-handles TikTok music anyway.

7. **Hook formula adherence.** First line must be ONE of:
   - **Curiosity gap** ("Most founders get [X] wrong — here's why...")
   - **Bold contrarian** ("[Common belief] is actually killing your [outcome].")
   - **Numbered reveal** ("3 patterns I see in every $0 → $10k MRR story.")
   - **Personal stake** ("I shipped 4 products in 2 years. Only 1 made money.")
   - **Hidden cost** ("The real reason your [thing] isn't [outcome] (and it's not [obvious thing]).")
   See `references/compiled/refs-instagram.md` for full pattern bank.

8. **Anti-AI-slop rubric.** Reject any output containing:
   - "In today's fast-paced world"
   - "Game-changer" / "revolutionize" / "leverage" / "synergy"
   - "It's important to note that"
   - "Let's dive in" / "Without further ado"
   - Em-dashes (—) used as connective tissue ≥3 times in caption
   - Emoji bullets (✅ 🚀 💡) on every line — max 2 emoji per caption

## Input shape

The skill accepts ONE positional arg: a JSON string with this structure:

```typescript
{
  blog: {
    title: string;            // EN — already translated by article-translate
    content: string;           // EN HTML body
    excerpt?: string;
    meta_keywords?: string;    // comma-separated SEO terms
    slug: string;
  };
  content_idea?: {
    pillar: 'vibe_coding' | 'ai_agents' | 'ai_video_image' | 'ai_automation' | 'manufacturing';
    virality_score?: number;   // 0-100 from earlier scan
  };
  carousel_slides?: Array<{    // OPTIONAL — present when this run reuses
                                //   linkedin_posts.carousel_slides[]
    slide_number: number;
    layout_hint: string;
    copy_id?: string;          // bilingual baked into slide image
    copy_en?: string;
    image_url: string;         // pre-rendered PNG
  }>;
  format: 'photo_carousel' | 'single_photo';
  posting_time_options?: Array<{ // OPTIONAL — backend pre-queries
                                  //   posting_time_rules table
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
  "title": "First-line hook ≤125 chars (curiosity gap or contrarian)",
  "caption": "Full body 1200-1800 char sweet spot. Story-arc structure: hook → setup → tension → reveal → CTA. NO URL. Max 2 emoji.",
  "hashtags": ["#aibuilders", "#vibecoding", "#solopreneur", "#productled", "#buildinpublic"],
  "suggested_time_slot": {
    "day_of_week": "tuesday",
    "hour": 19,
    "timezone": "Asia/Jakarta",
    "rationale": "B2B-tech audience peak engagement Tue 19:00 WIB per posting_time_rules"
  },
  "validation": {
    "passed": true,
    "failures": [],
    "notes": ["Caption uses curiosity-gap hook + 4 hashtags (within 3-5 cap)"]
  }
}
```

On failure (RAG missing, parse error from upstream, guideline conflict):

```json
{
  "status": "failed",
  "error": "Specific operator-actionable message",
  "error_code": "rag_missing"
}
```

## Step-by-step (Sonnet executes)

1. **Read blog content** from input arg `blog.content` + `blog.title`
   (already English).
2. **Identify hook angle** — pick ONE of 5 hook formulas based on which
   matches the blog's strongest claim. Check `refs-instagram.md` Hook Patterns
   section for examples.
3. **Draft title (first-line hook)** — ≤125 chars. Test: would a stranger
   stop scrolling on this? If feels generic, regenerate with bolder framing.
4. **Draft caption body** — story arc: hook (echo title) → setup (1-2
   sentences context) → tension (the surprising/contrarian beat) → reveal
   (the actual insight) → CTA (1 line — comment prompt or bio-link nudge).
   Target 1200-1800 chars. Max 2 emoji TOTAL in entire caption.
5. **Pick hashtags** — 3-5 items. Mix:
   - 1-2 broad pillar tags (`#aibuilders`, `#vibecoding`)
   - 1-2 niche tags (`#solopreneurAI`, `#claudecode`)
   - 0-1 brand tag (`#alisadikinma`)
6. **Pick suggested_time_slot** — if `posting_time_options[]` provided, pick
   the highest-score slot ≥85. Else default `{day_of_week: 'tuesday', hour: 19, timezone: 'Asia/Jakarta'}`.
7. **Run anti-slop check** — scan caption against banned phrases (Hard Rule 8).
   If any match, regenerate that paragraph.
8. **Run hashtag count check** — must be 3-5. If 6+, drop to 5.
9. **Emit JSON envelope to stdout.** No prose preamble, no fenced code blocks
   ideally — but balanced-brace parser tolerates them. End cleanly with `}`.

## Anti-patterns (auto-fail)

- Caption opens with "In a world where..." or "Let's talk about..."
- Generic CTA ("Drop a 🔥 if you agree!" — too engagement-bait-y)
- Multiple emoji bullets used as visual structure (`✅ Point 1\n✅ Point 2`)
- Hashtag list in body separator (must be at end, single line, space-separated)
- Mentioning specific dollar amounts without source
- Claiming to be "the only" / "the best" / "the first"
- Empty validation.failures[] WITH validation.passed=false (contradictory)
