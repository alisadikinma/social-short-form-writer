---
name: threads-gen
description: Convert a blog post (with optional pre-rendered carousel slides JSON) into a native Threads caption + 0-3 hashtags + suggested posting time slot. Pro-but-conversational tone, Bahasa Indonesia by default (Indonesian audience target). ≤500 char hard cap, 280-450 sweet spot, ≤140 char preview-cut hook. Emits ONE JSON envelope to stdout matching `ThreadsOutputEnvelopeSchema`.
---

# /threads-gen — Threads caption authoring skill

## What this skill does

Reads a blog post + (optionally) carousel slide JSON from upstream pipeline,
produces native Threads caption matching 2026 algorithm rules. Emits ONE
JSON envelope to stdout. Pure content generation — does NOT call backend API.

## Hard Rules (validated by Zod schema — violations = failed envelope)

1. **Authoring tone: Pro-but-conversational.** Capital case (NEVER lowercase
   intentional). Witty + sharp, never preachy. Industry-aware references
   (AI agents, Claude Code, Anthropic, OpenAI) used as cultural shorthand.
   First-person OK with specifics (numbers, named tools, dated incidents).
   See `references/compiled/refs-threads.md` Caption Format section.

2. **Authoring language: BAHASA INDONESIA by default.** Caption + title +
   engagement question all Indonesian. English *terms* OK as cultural
   shorthand for tech concepts (e.g. "AI agents", "vibe coding", "shipping",
   "stack") since target audience already mixes EN tech vocabulary into
   ID conversation. Schema field `language: 'id' | 'en' | 'mixed'` —
   default `'id'`. Caller can override to `'en'` or `'mixed'` via input
   for special cases, but default audience target is Indonesian.

3. **Caption length: ≤500 chars hard cap, 280-450 sweet spot.** Below 280
   reads thin. Above 500 hits the platform limit. Aim for the upper third
   (380-450) for thought-leadership posts.

4. **Preview-cut hook: ≤140 chars.** Title field. This is what shows above
   the "more" cutoff on Threads feed. Must work standalone as a complete
   thought — if it ends mid-sentence at 140 char, redraft. Bahasa Indonesia.

5. **Hashtag count: 0-3 items HARDCAP.** Threads minimal hashtag culture.
   - 0 hashtags = OK when topic is conversationally trending
   - 1-2 hashtags = default for thought leadership
   - 3 hashtags = max
   - 4+ = auto-fail (algorithm spam classifier)

6. **NO link in caption body.** Threads de-prioritizes body URLs same as
   IG. Link goes in first reply (operator action) or bio. Schema rejects
   any `https?://` match in caption.

7. **Hook formula adherence.** First line must be ONE of 6 patterns
   (in Indonesian):
   - **Contrarian truth** (`[Kepercayaan umum] sebenarnya [opposite truth].`)
   - **Specific number reveal** (`[N] pola yang gue liat di setiap [outcome].`)
   - **Hidden cost** (`Alasan sebenarnya [thing] [outcome] (dan bukan [obvious thing]).`)
   - **Personal stake / receipts** (`Ship 4 X dalam 30 hari. Cuma 1 yang masih jalan.`)
   - **Industry call-out** (`[Specific company / tool] [unexpected behavior]. [Implication].`)
   - **Question hook** (`Kenapa AI agent lo selalu [pain point]?`)
   See `refs-threads.md` Hook Patterns section for examples.

8. **Anti-AI-slop rubric.** Reject any output containing:
   - "Di era yang serba cepat ini" / "Di dunia yang berkembang pesat"
   - "Yuk dive in / dive deep" / "Tanpa basa-basi"
   - "Game-changer / revolusioner / leverage / sinergi"
   - "Penting untuk dicatat bahwa"
   - YouTube-thumbnail-bait ("Bagaimana kalau gue bilang...")
   - Engagement bait ("Drop 🔥 kalau setuju", "Comment YA kalau...")
   - Em-dashes (—) used as connective tissue ≥3 times in caption
   - Emoji bookends (`🚀 Pengumuman besar! 🚀`)
   - Lowercase-intentional Gen-Z slang ("the math ain't mathing", "no thoughts head empty")
   - Mixing formal Indonesian textbook style with casual ("Adapun, hal yang ingin saya bagikan...")

9. **Hook + body coupling.** First body line must echo / continue the hook.
   No "Anyway, mari gue ceritain..." pivots. If hook is contrarian, next
   2 lines deliver the punch. Reader is baited → must be paid off within
   100 chars.

## Input shape

The skill accepts ONE positional arg: a JSON string with this structure:

```typescript
{
  blog: {
    title: string;            // ID — primary translation
    content: string;          // ID HTML body
    excerpt?: string;
    meta_keywords?: string;   // comma-separated SEO terms
    slug: string;
  };
  content_idea?: {
    pillar: 'vibe_coding' | 'ai_agents' | 'ai_video_image' | 'ai_automation' | 'manufacturing';
    virality_score?: number;
  };
  carousel_slides?: Array<{   // OPTIONAL — present when LinkedIn carousel
    slide_number: number;
    layout_hint: string;
    copy_id?: string;          // bilingual baked into slide image
    copy_en?: string;
    image_url: string;
  }>;
  format: 'photo_carousel' | 'single_photo' | 'text_only';
  posting_time_options?: Array<{
    day_of_week: string;
    hour: number;
    score: number;
    rationale: string;
  }>;
  language?: 'id' | 'en' | 'mixed';   // OPTIONAL override — default 'id'
}
```

## Output shape (stdout — ONE JSON object only)

```json
{
  "status": "complete",
  "title": "Mayoritas demo 'AI agent' cuma chatbot dengan langkah ekstra.",
  "caption": "Mayoritas demo 'AI agent' cuma chatbot dengan langkah ekstra.\n\nAgent beneran punya 3 hal: planner, memory, tool registry.\nKurang satu — lo balik ke chat doang.\n\nBanyak founder Indonesia yang ngira udah bikin agent. Cek dulu komponen mana yang missing.\n\nKomponen agent mana yang paling sering diskip di project lo?",
  "hashtags": ["#AIAgents", "#ClaudeCode"],
  "language": "id",
  "suggested_time_slot": {
    "day_of_week": "wednesday",
    "hour": 20,
    "timezone": "Asia/Jakarta",
    "rationale": "Threads B2B-tech peak: weekday evening 20:00 WIB per posting_time_rules"
  },
  "validation": {
    "passed": true,
    "failures": [],
    "notes": ["Hook + body coupling clean, 405 chars, 2 hashtags within cap, Bahasa Indonesia"]
  }
}
```

On failure (RAG missing, parse error, guideline conflict):

```json
{
  "status": "failed",
  "error": "Specific operator-actionable message",
  "error_code": "rag_missing"
}
```

## Step-by-step (Sonnet executes)

1. **Read blog content** from input arg `blog.content` + `blog.title`.
2. **Identify hook angle** — pick ONE of 6 hook formulas based on which
   matches the blog's strongest claim. Check `refs-threads.md` Hook Patterns.
3. **Draft preview-cut hook** — ≤140 chars. Bahasa Indonesia. Test: does
   it work as a standalone thought? Would a stranger stop scrolling? If
   it ends mid-sentence at 140, redraft.
4. **Draft caption body** — hook → setup (1-2 lines, adds credibility) →
   take (the contrarian/insight beat) → engagement question. Target
   280-450 chars. Max 2 emoji TOTAL. Em-dashes max 2 per caption.
   Bahasa Indonesia conversational tone (gue/lo OK), NOT formal textbook ID.
5. **Engagement question** — invites genuine reply, NEVER "apa pendapat lo?".
   Use specific framing: "Komponen X mana yang paling sering diskip?" /
   "Stack lo sekarang ada gap di mana?".
6. **Pick hashtags** — 0-3 items. Default 1-2. Mix:
   - 1 broad pillar tag (`#AIAgents`, `#ClaudeCode`, `#VibeCoding`)
   - 0-1 niche tag (`#solopreneurID`, `#buildinpublic`)
   - 0-1 brand tag (`#alisadikinma`) — only on signature posts
7. **Pick suggested_time_slot** — if `posting_time_options[]` provided,
   pick the highest-score slot ≥85. Else default
   `{day_of_week: 'wednesday', hour: 20, timezone: 'Asia/Jakarta'}`.
8. **Run anti-slop check** — scan caption against banned phrases (Hard Rule 8).
   If any match, regenerate that paragraph.
9. **Run hashtag count check** — must be 0-3. If 4+, drop to 3.
10. **Run preview-cut check** — first 140 chars must be a complete thought.
11. **Emit JSON envelope to stdout.** No prose preamble. End cleanly with `}`.

## Anti-patterns (auto-fail)

- Caption opens with "Di era ini..." or "Mari kita bahas tentang..."
- Lowercase-intentional ("baru aja ship agent pertama dan it's been wild")
- Generic Gen-Z slang ("no thoughts head empty", "the math ain't mathing")
- Generic CTA ("Drop 🔥 kalau setuju!")
- Multiple emoji bullets used as visual structure (`✅ Point 1\n✅ Point 2`)
- Hashtag list inside body (must be at end, single line, space-separated)
- Hook ends mid-sentence at 140-char cutoff (preview-cut UX failure)
- Empty `validation.failures[]` WITH `validation.passed=false` (contradictory)
- 4+ hashtags (algorithm penalty + schema rejection)
- Mixing formal Indonesian textbook style with casual ("Adapun, hal yang ingin saya bagikan...")
