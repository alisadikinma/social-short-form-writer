---
name: threads-gen
description: Convert a blog post (with optional pre-rendered carousel slides JSON) into a native Threads caption + 0-3 hashtags + suggested posting time slot. Pro-but-conversational tone, ID+EN bilingual mix by default. ≤500 char hard cap, 280-450 sweet spot, ≤140 char preview-cut hook. Emits ONE JSON envelope to stdout matching `ThreadsOutputEnvelopeSchema`.
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

2. **Authoring language: ID+EN mixed by default.** Hook in English (preview-
   cut reach), body in ID+EN mix (cultural shorthand: "warung", "ojek",
   "founder Indonesia"), engagement question in Indonesian (invites local
   replies → algorithm boost). Schema field `language: 'id' | 'en' | 'mixed'`
   — default `mixed`. Caller can override via input.

3. **Caption length: ≤500 chars hard cap, 280-450 sweet spot.** Below 280
   reads thin. Above 500 hits the platform limit. Aim for the upper third
   (380-450) for thought-leadership posts.

4. **Preview-cut hook: ≤140 chars.** Title field. This is what shows above
   the "more" cutoff on Threads feed. Must work standalone as a complete
   thought — if it ends mid-sentence at 140 char, redraft.

5. **Hashtag count: 0-3 items HARDCAP.** Threads minimal hashtag culture.
   - 0 hashtags = OK when topic is conversationally trending
   - 1-2 hashtags = default for thought leadership
   - 3 hashtags = max
   - 4+ = auto-fail (algorithm spam classifier)

6. **NO link in caption body.** Threads de-prioritizes body URLs same as
   IG. Link goes in first reply (operator action) or bio. Schema rejects
   any `https?://` match in caption.

7. **Hook formula adherence.** First line must be ONE of 6 patterns:
   - **Contrarian truth** (`[Common belief] is actually [opposite truth].`)
   - **Specific number reveal** (`[N] patterns I see in every [outcome].`)
   - **Hidden cost** (`The real reason [thing] [outcome] (and it's not [obvious thing]).`)
   - **Personal stake / receipts** (`Shipped 4 X in 30 days. Only 1 still runs.`)
   - **Bilingual code-switch** (`[EN observation]. [ID local context].`)
   - **Industry call-out** (`[Specific company / tool] [unexpected behavior]. [Implication].`)
   See `refs-threads.md` Hook Patterns section for examples.

8. **Anti-AI-slop rubric.** Reject any output containing:
   - "In today's fast-paced world", "rapidly evolving landscape"
   - "Let's dive in / dive deep", "Without further ado"
   - "Game-changer / revolutionize / leverage / synergy"
   - "It's important to note that"
   - YouTube-thumbnail-bait ("What if I told you...")
   - Engagement bait ("Drop a 🔥 if...", "Comment YES if...")
   - Em-dashes (—) used as connective tissue ≥3 times in caption
   - Emoji bookends (`🚀 Big announcement! 🚀`)
   - Lowercase-intentional Gen-Z slang ("the math ain't mathing", "no thoughts head empty")

9. **Hook + body coupling.** First body line must echo / continue the hook.
   No "Anyway, let me tell you about..." pivots. If hook is contrarian,
   next 2 lines deliver the punch. Reader is baited → must be paid off
   within 100 chars.

## Input shape

The skill accepts ONE positional arg: a JSON string with this structure:

```typescript
{
  blog: {
    title: string;            // EN-preferred (from article-translate)
    content: string;          // EN HTML body (or ID — caller-provided)
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
  language?: 'id' | 'en' | 'mixed';   // OPTIONAL override — default 'mixed'
}
```

## Output shape (stdout — ONE JSON object only)

```json
{
  "status": "complete",
  "title": "Most 'AI agent' demos are just chatbots with extra steps.",
  "caption": "Most 'AI agent' demos are just chatbots with extra steps.\n\nReal agents have 3 things: planner, memory, tool registry.\nStrip any one — you're back to chat.\n\nBanyak founder Indonesia yang ngira udah bikin agent. Cek dulu yang mana yang missing.\n\nYang mana komponen agent yang paling sering diskip di project lo?",
  "hashtags": ["#AIAgents", "#ClaudeCode"],
  "language": "mixed",
  "suggested_time_slot": {
    "day_of_week": "wednesday",
    "hour": 20,
    "timezone": "Asia/Jakarta",
    "rationale": "Threads B2B-tech peak: weekday evening 20:00 WIB per posting_time_rules"
  },
  "validation": {
    "passed": true,
    "failures": [],
    "notes": ["Hook + body coupling clean, 412 chars, 2 hashtags within cap, ID+EN mix"]
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
3. **Draft preview-cut hook** — ≤140 chars. Test: does it work as a
   standalone thought? Would a stranger stop scrolling? If it ends mid-
   sentence at 140, redraft.
4. **Draft caption body** — hook → setup (1-2 lines, adds credibility) →
   take (the contrarian/insight beat) → engagement question. Target
   280-450 chars. Max 2 emoji TOTAL. Em-dashes max 2 per caption.
5. **Engagement question** — invites genuine reply, NEVER "what do you
   think?". Use specific framing: "Yang mana komponen X yang paling
   sering diskip?" / "Stack lo sekarang ada gap di mana?".
6. **Pick hashtags** — 0-3 items. Default 1-2. Mix:
   - 1 broad pillar tag (`#AIAgents`, `#ClaudeCode`, `#VibeCoding`)
   - 0-1 niche tag (`#solopreneurAI`, `#buildinpublic`)
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

- Caption opens with "In a world where..." or "Let's talk about..."
- Lowercase-intentional ("just shipped my first agent and it's been wild")
- Generic Gen-Z slang ("no thoughts head empty", "the math ain't mathing")
- Generic CTA ("Drop a 🔥 if you agree!")
- Multiple emoji bullets used as visual structure (`✅ Point 1\n✅ Point 2`)
- Hashtag list inside body (must be at end, single line, space-separated)
- Hook ends mid-sentence at 140-char cutoff (preview-cut UX failure)
- Empty `validation.failures[]` WITH `validation.passed=false` (contradictory)
- 4+ hashtags (algorithm penalty + schema rejection)
