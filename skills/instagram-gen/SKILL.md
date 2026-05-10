---
name: instagram-gen
description: Convert a blog post (with optional pre-rendered carousel slides JSON) into a native Instagram caption + 3-5 hashtags + suggested posting time slot. 4:5 photo carousel format. Bahasa Indonesia authoring (Indonesian audience target). Hard 5-hashtag cap (Dec 2025 algorithm change). NO link in caption body — link goes to FIRST COMMENT via Publer (NOT bio — operator does not update bio per-post). Optional text_only_caption field for Facebook text-post reuse. Emits ONE JSON envelope to stdout matching `InstagramOutputEnvelopeSchema`.
---

# /instagram-gen — Instagram caption authoring skill

## What this skill does

Reads a blog post + (optionally) carousel slide JSON from upstream pipeline,
produces native Instagram caption matching 2026 algorithm rules. Emits ONE
JSON envelope to stdout. Pure content generation — does NOT call backend API.

Also authors an OPTIONAL `text_only_caption` (Bahasa Indonesia, ≤1000 chars,
condensed FB-text variant) for Facebook cross-post reuse — Portfolio_v2's
`FacebookGenerationService` reads this when the cross-post pipeline fans
out to FB text posts.

## Hard Rules (validated by Zod schema — violations = failed envelope)

1. **Authoring Language: BAHASA INDONESIA.** Caption + title + hashtags
   primarily Indonesian. English *terms* OK as cultural shorthand for tech
   concepts (e.g. "AI agents", "vibe coding", "shipping", "stack") since
   target audience already mixes EN tech vocabulary into ID conversation.
   But grammar + connective tissue MUST be Indonesian. Hashtag tags can be
   either ID (`#solopreneurID`) or EN (`#aibuilders`) — pick whichever has
   stronger discovery on IG ID locale.

2. **Hashtag count: 3-5 items HARDCAP.** Instagram's Dec 2025 algorithm
   change penalizes posts with 6+ hashtags (treated as spam signal).
   Below 3 is OK technically but loses discoverability — aim for 4-5.

3. **Caption length tier system** (≤2200 chars hard IG limit).
   - **Default for carousel: 100-300 chars (~15-50 words).** Per Socialinsider
     2026 study of 9M+ posts: captions <30 words drive HIGHEST engagement
     because slides carry the value, caption is the conversational frame.
   - **Long-form 700-1500 chars** ONLY when slides don't carry the full
     insight AND every sentence earns its place (no padding, no recap of
     slide content). If you're tempted to write 1000+ chars, ask: "Could a
     reader stop after the slides and still get the point?" If yes, cut.
   - **Avoid 300-700 chars** — too long for fast scroll, too short for
     thought-leadership depth. Pick a side.
   - NEVER use length to compensate for weak hook or repeat slide copy.

4. **First-line hook: ≤125 chars MUST stand alone.** Title field. This is
   what shows above the "more" cutoff on feed. The first sentence is the
   ENTIRE post for 60-70% of readers (they don't tap "more"). It MUST pass
   the Hook Quality Gate (Rule 9). If hook exceeds 125, IG truncates
   mid-sentence — instant scroll-past.

5. **NO link in caption body. Link goes to FIRST COMMENT, not bio.**
   The consuming backend ships the URL via Publer's `accounts[].comments[]`
   field after publish — there is no "link in bio" workflow on this account.
   Therefore:
   - NEVER write "Link di bio", "Cek bio", "Detail di bio", "ada di bio",
     "Klik link di profile" — operator does NOT update bio per-post.
   - DO write "Link di komen pertama ↓", "Detail lengkap di komen ↓",
     "Cek komen pertama buat artikel utuh", or skip the link nudge entirely
     and end on an engagement question.
   - Body URLs still forbidden (IG truncates / shows as plain text + reach
     penalty). The consuming backend bypasses this for the optional
     text_only_caption (FB reuse) only.

6. **NO music_suggestion field.** IG photo carousel = no audio track.
   That's a TikTok-only field and Publer auto-handles TikTok music anyway.

7. **Hook formula adherence.** First line must be ONE of (in Indonesian):
   - **Curiosity gap** ("Mayoritas founder salah ngerti soal [X] — ini alasannya...")
   - **Bold contrarian** ("[Kepercayaan umum] sebenarnya bunuh [outcome] lo.")
   - **Numbered reveal** ("3 pola yang gue liat di tiap cerita $0 → $10k MRR.")
   - **Personal stake** ("Gue ship 4 produk dalam 2 tahun. Cuma 1 yang menghasilkan.")
   - **Hidden cost** ("Alasan sebenarnya kenapa [thing] lo gak [outcome] (dan bukan [obvious thing]).")
   See `references/compiled/refs-instagram.md` for full pattern bank.

8. **Anti-AI-slop rubric.** Reject any output containing:
   - "Di era yang serba cepat ini" / "Di dunia yang berkembang pesat"
   - "Game-changer" / "revolusioner" / "leverage" / "sinergi"
   - "Penting untuk dicatat bahwa" / "Mari kita bahas"
   - "Tanpa basa-basi" / "Yuk dive in"
   - Em-dashes (—) used as connective tissue ≥3 times in caption
   - Emoji bullets (✅ 🚀 💡) on every line — max 2 emoji per caption

9. **HOOK QUALITY GATE (first sentence MUST pass all 5 tests).** This is
   the difference between scroll-past and read-through. Apply BEFORE
   emitting JSON envelope:
   - **Standalone-readable**: First sentence works as a complete thought
     even if reader never taps "more". No mid-sentence cliffhanger like
     "When I first started building agents, I thought..." (incomplete).
   - **Specific**: Names, numbers, dated stakes — NEVER vague abstractions.
     ❌ "AI agents punya banyak masalah" → ✅ "Gue ship 4 AI agents di 2025.
     3 di antaranya rusak di production karena 1 hal yang sama."
   - **Curiosity-gap or pattern-interrupt**: Reader can't predict the payoff
     from the hook alone. ❌ "AI agents penting untuk bisnis lo" (predictable
     conclusion) → ✅ "Mayoritas founder bilang udah pakai 'AI agents'.
     90% sebenarnya cuma chatbot dengan langkah ekstra."
   - **Native voice**: NOT LinkedIn-formal ("In today's evolving landscape"),
     NOT Gen-Z slang ("the math ain't mathing"). Bahasa Indonesia
     conversational dengan EN tech terms sebagai kosakata budaya.
   - **Payoff within first 200 chars**: Hook + body line 1-2 must deliver
     the surprise/insight before "more" cutoff effectively kills the read.
   If first sentence fails ANY test → regenerate. Do not ship a weak hook
   under length pressure.

10. **text_only_caption (OPTIONAL — author when blog has FB cross-post target).**
   ≤1000 chars. Same Bahasa Indonesia tone but condensed (300-700 chars
   sweet spot for FB News Feed). Body URL is OK here (FB tolerates it).
   Same hook formula as main caption but punchier — FB readers expect
   shorter posts than IG. NO emoji bullet structure. End with engagement
   question OR blog URL line `Baca selengkapnya: <url>`.

## Input shape

The skill accepts ONE positional arg: a JSON string with this structure:

```typescript
{
  blog: {
    title: string;            // ID — primary translation (post_translations.id)
    content: string;           // ID HTML body
    excerpt?: string;
    meta_keywords?: string;    // comma-separated SEO terms
    slug: string;
    blog_url?: string;         // Full URL — used in text_only_caption when authored
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
  cross_post_targets?: Array<'facebook' | 'tiktok' | 'threads'>; // OPTIONAL —
    // when 'facebook' is present, MUST author text_only_caption.
}
```

## Output shape (stdout — ONE JSON object only)

```json
{
  "status": "complete",
  "title": "Hook baris pertama ≤125 chars (curiosity gap atau contrarian)",
  "caption": "Body lengkap 1200-1800 char sweet spot. Struktur story-arc: hook → setup → tension → reveal → CTA. NO URL. Max 2 emoji. Bahasa Indonesia.",
  "text_only_caption": "Versi padat untuk FB ≤1000 chars (300-700 sweet spot). URL di body OK. Bahasa Indonesia. Engagement question atau blog URL line di akhir.",
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
    "notes": ["Caption pakai curiosity-gap hook + 4 hashtags (within 3-5 cap), text_only_caption authored for FB reuse"]
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

1. **Read blog content** from input arg `blog.content` + `blog.title` (primary
   Indonesian translation). Note `cross_post_targets` array — if `'facebook'`
   present, MUST author `text_only_caption` in step 5b.
2. **Identify hook angle** — pick ONE of 5 hook formulas based on which
   matches the blog's strongest claim. Check `refs-instagram.md` Hook Patterns
   section for examples.
3. **Draft title (first-line hook)** — ≤125 chars. Bahasa Indonesia. Test:
   would a stranger stop scrolling on this? If feels generic, regenerate
   with bolder framing.
4. **Draft caption body** — DEFAULT short-form 100-300 chars (~15-50
   words). Structure: hook (the first 125 chars from step 3) → 1 line
   of payoff/setup → CTA (engagement question OR first-comment nudge).
   That's it. Slides carry the deep value; caption is the conversational
   frame. Example (220 chars): "Mayoritas demo 'AI agent' cuma chatbot
   dengan langkah ekstra. Agent beneran punya 3 hal: planner, memory,
   tool registry. Cek slide 2-4. Komponen mana yang paling sering
   diskip di project lo? Detail + benchmark di komen pertama ↓"

   **Long-form (700-1500 chars) — only ship when**: (a) slides genuinely
   don't carry the full insight (rare), AND (b) every paragraph adds
   non-redundant context, AND (c) you can defend each sentence as
   "reader needs this AND it's not on slides". Otherwise default short.
   AVOID 300-700 char range entirely.

   CTA options: engagement question ("Lo udah pernah ngalamin yang sama?"
   / "Mana yang lo agree?") AND/OR first-comment nudge ("Link artikel di
   komen pertama ↓", "Detail lengkap + benchmark ada di komen ↓"). NEVER
   "link di bio" — operator does not update bio per-post. Max 2 emoji
   TOTAL. Bahasa Indonesia natural conversation, NOT formal textbook ID.
5. **(Conditional) Draft text_only_caption** — only when `cross_post_targets`
   includes `'facebook'`. ≤1000 chars (300-700 sweet spot). Same hook
   formula but punchier. Append blog URL line at end: `Baca selengkapnya:
   <blog.blog_url>`. Skip emoji-bullet structure.
6. **Pick hashtags** — 3-5 items. Mix:
   - 1-2 broad pillar tags (`#aibuilders`, `#vibecoding`)
   - 1-2 niche tags (`#solopreneurID`, `#claudecode`)
   - 0-1 brand tag (`#alisadikinma`)
7. **Pick suggested_time_slot** — if `posting_time_options[]` provided, pick
   the highest-score slot ≥85. Else default `{day_of_week: 'tuesday', hour: 19, timezone: 'Asia/Jakarta'}`.
8. **Run anti-slop check** — scan caption (and text_only_caption if present)
   against banned phrases (Hard Rule 8). If any match, regenerate that paragraph.
9. **Run hashtag count check** — must be 3-5. If 6+, drop to 5.
10. **Emit JSON envelope to stdout.** No prose preamble, no fenced code blocks
    ideally — but balanced-brace parser tolerates them. End cleanly with `}`.

## Anti-patterns (auto-fail)

- Caption opens with "Di era ini..." or "Mari kita bahas tentang..."
- Generic CTA ("Tap 🔥 kalau setuju!" — too engagement-bait-y)
- Multiple emoji bullets used as visual structure (`✅ Point 1\n✅ Point 2`)
- Hashtag list in body separator (must be at end, single line, space-separated)
- Mentioning specific dollar amounts without source
- Claiming to be "satu-satunya" / "yang terbaik" / "yang pertama"
- Empty validation.failures[] WITH validation.passed=false (contradictory)
- Mixing formal Indonesian textbook style with casual ("Adapun, hal yang ingin saya bagikan...")
- text_only_caption field present but `cross_post_targets` does NOT include `'facebook'` (waste)
