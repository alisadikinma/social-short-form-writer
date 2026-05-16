# CLAUDE.md — social-short-form-writer

This file provides guidance to Claude Code when working in this plugin repo.

**Context:** Read `README.md` first for the operator-facing overview. This file
captures architectural invariants, design decisions, and common pitfalls that
won't show up in the user-facing docs.

## 🧠 Vault Context Link

Skill library — dipakai cross-project (Portfolio_v2 dispatcher, SPARKFLUENCE).

Pre-read kalau perlu konteks:
- `30-Knowledge/content-strategy-shared.md` — short-form virality, Gen Z patterns
- `20-Projects/SPARKFLUENCE/README.md` — kalau modify Gen Z tone defaults
- `20-Projects/claude-plugin/README.md` — skill ecosystem overview
- `10-Identity/voice-tone.md` — Bahasa Indonesia voice

JANGAN hardcode project-specific values. Pakai `{{placeholder}}` syntax.

## Project Overview

Claude Code plugin housing 3 sister skills for short-form social caption authoring:

| Skill | Platform | Tone | Format |
|---|---|---|---|
| `/instagram-gen` | Instagram | Bahasa Indonesia narrative storytelling (+ optional `text_only_caption` for FB reuse) | 4:5 photo carousel |
| `/tiktok-gen` | TikTok | Bahasa Indonesia search-aware (first 150 char critical) | 9:16 photo-mode |
| `/threads-gen` | Threads | Pro-but-conversational, Bahasa Indonesia (default `language: 'id'`) | text or 4:5 carousel |

**Authoring language policy (v0.3.0+):** All 3 skills default to **Bahasa Indonesia**.
Indonesian audience target — Gen Z + founder/dev community. EN *terms* OK as cultural
shorthand for tech concepts ("AI agents", "vibe coding", "shipping", "stack",
"founder") since target audience already mixes EN tech vocabulary into ID conversation.
Grammar + connective tissue MUST be Indonesian.

LinkedIn (separate `linkedin-post-writer` plugin) stays English-only — that plugin
targets US hiring managers + B2B professional audience. The two plugins serve
distinct audience strategies on purpose.

Pure content generation — no backend calls, no scheduling, no Publer transport.
Each skill emits ONE JSON envelope to stdout. Consuming backend
([Portfolio_v2](https://github.com/alisadikinma/Portfolio_v2)) parses + validates +
handles all operational concerns.

## Architecture invariants

### 1. Stdout-only output contract

Skills MUST emit exactly one JSON envelope to stdout, no prose preamble. The
backend's `BaseSocialGenerationService::parseOrchestratorOutput()` uses a
balanced-brace scanner that tolerates leading narration and trailing fences,
but the canonical contract is "one clean JSON object."

Hard rule: **no `console.log` debugging in production paths** — anything
written to stdout pollutes the parser. Use `console.error` (stderr) for
internal diagnostics if needed.

### 2. Zod schemas are source of truth

Each skill's `schema.ts` defines a discriminated union on `status`:
- `'complete'` → CompleteEnvelope (caption + hashtags + suggested_time)
- `'failed'` → FailedEnvelope (error reason + error_code)

The TypeScript type is `XxxOutputEnvelope`. The backend validates against an
equivalent Zod schema (or re-implements the rules in PHP). When you change
schema constraints, update SKILL.md hard rules section in the same commit so
the LLM authoring guide stays consistent with what the validator accepts.

### 3. RAG → compiled bundles → VPS symlink

```
docs/rag/social-base/         ← Common rules (anti-AI-slop, hook formulas, posting time)
docs/rag/{platform}-playbook/ ← Platform-specific algorithm + tone rules
        ↓ npm run compile-refs (scripts/compile-refs.ts)
references/compiled/refs-{platform}.md  ← gitignored, 20-35KB per bundle
        ↓ scp / git pull + symlink (manual VPS step)
/home/claudesn/refs-{platform}.md       ← --append-system-prompt-file target
```

Compiled bundles are **NOT** committed — they're regenerated fresh on every
VPS deploy so `docs/rag/*` stays the single source of truth. Bundle sizes
post-May 2026: IG ~31KB / TikTok ~33KB / Threads ~21KB.

### 4. social-base/ is shared

Every bundle starts with `social-base/*.md` (anti-patterns, posting time
research, English authoring directive). New skills inherit these rules
automatically via the BUNDLES spec in `compile-refs.ts`. Do NOT duplicate
content from social-base/ into a platform-playbook/ — extend, don't repeat.

## Skill design decisions (and why)

### Hook Quality Gate (v0.5.0+, cross-cutting)

All 3 skills enforce a 5-test rubric on the first sentence as a Hard Rule
before envelope emission. This is the highest-leverage rule in the plugin
because for 60-70% of readers (per IG/TikTok preview-cutoff data) the first
sentence IS the entire post — they never tap "more". The 5 tests:

1. **Standalone-readable** — works as a complete thought even at preview cutoff
2. **Specific** — numbers, named tools, dated stakes; NEVER vague abstractions
3. **Curiosity-gap or pattern-interrupt** — payoff can't be predicted from hook
4. **Native voice** — NOT LinkedIn-formal, NOT Gen-Z slang
5. **Payoff lands within preview window** — IG 200 chars, TikTok 80 chars,
   Threads 210 chars

When the first sentence fails any test, the Sonnet runtime regenerates rather
than ships a weak hook to fit length targets. This rule is implemented as
prose Hard Rules in each SKILL.md (Hard Rule #9 IG, #10 TikTok, #10 Threads)
+ mirrored in the RAG playbooks. NOT enforced by Zod schema — it's a
quality-gate semantic rule, not a structural constraint.

The reason this rule exists: pre-v0.5.0 captions defaulted to long-form
(1200-1800 chars on IG, 200-500 on TikTok) which incentivized weak openers
because the body could "make up for it". Post-v0.5.0 the length defaults
flipped to engagement-data sweet spots (100-300 IG / 80-150 TikTok) — at
those lengths the hook IS the post. No room for filler.

### Caption length tier system (v0.5.0+, cross-cutting)

Per 2026 engagement data:

| Platform | Hard cap | Default sweet spot | Source |
|---|---|---|---|
| IG | 2200 chars | **100-300 chars** (~15-50 words) | Socialinsider 9M+ posts study — captions <30 words = highest engagement |
| TikTok | 2200 chars | **80-150 chars** (~12-25 words) | TTS Vibes / Glow Social 2026 — 50-100 chars +21% likes vs longer |
| Threads | 500 chars | 280-450 chars (unchanged) | Thought-leadership format needs more dwell |

Long-form is now an exception, not default. IG long-form (700-1500 chars)
ships only when slides genuinely don't carry the full insight AND every
sentence earns its place. TikTok long-form (200-400 chars) ships only for
SEO-driven educational posts. The 300-700 char range on IG and 400+ on
TikTok are explicitly forbidden — too long for fast scroll, too short for
authority depth.

### IG: hashtag cap 3-5, Bahasa Indonesia, optional text_only_caption for FB reuse

- Pre-Dec 2025 IG algorithm rewarded 10+ hashtags. Post-update, 6+ flagged as
  spam and reach drops 30-40%. Schema enforces 3-5 hardcap.
- **Bahasa Indonesia authoring (v0.3.0+)** — Indonesian audience target. Backend
  feeds plugin ID translation (post_translations.id.content) instead of EN
  translation. Grammar + connective tissue MUST be Indonesian; EN tech terms OK
  as shorthand. Tonal target: casual conversational (gue/lo register fine for
  blog-translation context, NOT formal saya/Anda textbook style).
- **Optional `text_only_caption` field** — when input includes
  `cross_post_targets: ['facebook']`, skill MUST author this 300-700 char
  condensed FB-text variant (≤1000 char hardcap). Body URL allowed (FB tolerates
  body links). Backend's `FacebookGenerationService` reads this when fanning
  out cross-posts to FB, replacing the prior reuse-of-LinkedIn-content path
  (which would emit EN text on a now-ID brand strategy).

### TikTok: first 150 char critical, Bahasa Indonesia

- TikTok search index reads the first 150 chars of the caption as the primary
  hook + topic signal. Anything beyond that is search-invisible.
- **Bahasa Indonesia authoring (v0.3.0+)** — same rationale as IG. Backend
  feeds ID translation. Primary search keyword can stay English tech term
  (`AI agents`, `vibe coding`) because TikTok search index is locale-aware
  and Indonesian users routinely search in EN for tech topics.
- 5-8 hashtags is platform-appropriate (mid-range, balances discoverability vs
  spam-classifier risk).
- Music suggestion is intentionally OUT — Publer auto-attaches trending music
  via its TikTok integration. Plugin shouldn't fake-generate music context.

### Threads: 0-3 hashtag cap, Bahasa Indonesia default

- Threads minimal hashtag culture (May 2026 algorithm) — 4+ hashtags = spam
  signal. Schema enforces max 3, allows 0.
- 280-450 char sweet spot — Threads is the only one of the 3 with a higher
  default than IG (100-300) or TikTok (80-150) because it's a thought-leadership
  format that rewards dwell time. The 210-char preview cutoff means hook +
  setup must land before "more"; the rest of the 280-450 window is the take +
  engagement question.
- 140-char preview-cut hook is the make-or-break: posts that don't pay off
  the preview within 100 body chars get scroll-past + algorithm penalty.
- **Bahasa Indonesia default (v0.3.0+)** — `language: 'id' | 'en' | 'mixed'`,
  default `'id'`. Indonesian audience target — Gen Z + founder/dev community.
  Threads in Indonesia is a Gen Z capture vehicle (44% Indonesian Gen Z
  penetration vs 22% on FB), so authoring native Indonesian (rather than
  bilingual EN+ID) maximizes reply-velocity which is the algorithm's primary
  engagement signal. Caller may override `language: 'en'` for global
  thought-leadership posts (those typically belong on LinkedIn anyway) or
  `'mixed'` for bilingual code-switch on borderline content.
- **Pro-but-conversational tone** is the brand-positioning constraint. Lowercase
  Gen-Z slang ("the math ain't mathing") would undermine AI Generalist Expert
  credibility. Formal Indonesian textbook style ("Adapun, hal yang ingin saya
  bagikan...") sounds robotic. Capital case + witty + specific (numbers, named
  tools) hits the right register. gue/lo casual register is acceptable as long
  as the substance is sharp.

### FB: NOT in this plugin (reuses IG output)

Documented in README.md — saves ~1 day dev. FB is reuse-only at backend.

**Post-v0.3.0 reuse strategy:**
- **FB carousel format** — reuses `/instagram-gen` rendered slides (PNG output).
  Both IG carousel + FB carousel are 4:5 aspect, photo-mode → same assets.
- **FB text format** — reuses `/instagram-gen` `text_only_caption` field
  (Bahasa Indonesia, 300-700 chars, body URL allowed). This replaces the
  pre-v0.3.0 path that reused `linkedin_posts.content` (English) — that path
  would have leaked English text into a now-Indonesian brand strategy.

Don't add `/facebook-gen` here unless engagement data justifies upgrade to Tier-1.
The current "reuse IG `text_only_caption`" path is single-language-consistent
with the rest of the FB/IG/TikTok/Threads cluster — no plugin work needed.

## Plugin layout

```
.
├── README.md                              # operator-facing
├── CLAUDE.md                              # THIS FILE
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── docs/
│   └── rag/
│       ├── social-base/                   # shared anti-patterns + posting time
│       ├── instagram-playbook/            # IG-specific
│       ├── tiktok-playbook/               # TikTok-specific
│       └── threads-playbook/              # Threads-specific
├── scripts/
│   └── compile-refs.ts                    # bundles RAG → references/compiled/
├── skills/
│   ├── instagram-gen/
│   │   ├── SKILL.md                       # frontmatter + playbook
│   │   └── schema.ts                      # Zod schema + types
│   ├── tiktok-gen/
│   │   ├── SKILL.md
│   │   └── schema.ts
│   └── threads-gen/                       # added May 10, 2026
│       ├── SKILL.md
│       └── schema.ts
├── tests/
│   ├── InstagramSchemaTest.spec.ts        # 15 tests
│   ├── TiktokSchemaTest.spec.ts           # 15 tests
│   └── ThreadsSchemaTest.spec.ts          # 18 tests
└── references/
    └── compiled/                          # gitignored — VPS deploy artifact
        ├── refs-instagram.md
        ├── refs-tiktok.md
        └── refs-threads.md
```

## Testing

```bash
npm test                  # all 48 tests
npx vitest run --silent   # quieter output
```

Test files mirror schema files 1:1. Coverage targets:
- Happy path: well-formed complete + failed envelopes
- Hard rule violations: each Zod constraint has at least one negative test
- Defaults: optional fields default to expected values
- Boundaries: exact-cap values pass, +1 chars fail

Add tests in the SAME commit as schema changes — never decouple. CI runs
on every PR (vitest + tsc).

## When adding a new skill

Pattern to follow (mirror Threads as template since it's the most recent):

1. **`docs/rag/{platform}-playbook/`** — 3 markdown files: caption format,
   hashtag strategy, hook patterns. Number prefix (`01-`, `02-`, `03-`) so
   they sort deterministically in compile output.
2. **`skills/{platform}-gen/schema.ts`** — Zod discriminated union, hard rules
   encoded, types exported.
3. **`skills/{platform}-gen/SKILL.md`** — frontmatter `name` + `description`
   triggers, hard rules numbered 1-N matching schema, input/output shapes,
   step-by-step instructions, anti-patterns.
4. **`scripts/compile-refs.ts`** — append a BundleSpec entry mapping
   `social-base + {platform}-playbook` → `refs-{platform}.md`.
5. **`tests/{Platform}SchemaTest.spec.ts`** — mirror existing test files,
   cover happy path + hard rule violations + defaults/boundaries.
6. **`README.md`** — Skills table row + dedicated hard-rules subsection.
7. **`CLAUDE.md` (this file)** — design decision rationale subsection.
8. **VPS deploy steps** — symlink `refs-{platform}.md` + env var.
9. **Backend integration** in Portfolio_v2 — service class extending
   `BaseSocialGenerationService`, queued job, model + migration + FSM enum.

Do NOT add new skill without all 9 — partial implementations leak through
the cracks (e.g. tests pass but RAG missing, or schema correct but SKILL.md
documents wrong rules).

## Release workflow

```bash
# 1. Bump version
# Edit package.json version field

# 2. Update CHANGELOG.md (top)
# Format: ## [vX.Y.Z] — YYYY-MM-DD
#         ### Added | Changed | Fixed | Removed

# 3. Commit + tag + push
git add -A
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags

# 4. VPS pull + recompile
# (manual operator step on alisadikinma.com VPS — see README.md)
```

## Common pitfalls

- **Skill emits prose preamble** — backend's balanced-brace parser handles it,
  but it's noise. Keep the skill's last instruction "Emit JSON envelope to
  stdout. No prose preamble."
- **Schema constraint without SKILL.md update** — LLM authors output that
  violates a rule because the playbook didn't tell it the rule exists.
- **social-base content drift between platforms** — tempting to add an
  IG-specific rule to social-base. Don't. Rule of thumb: if a rule applies
  to all 3 platforms, social-base. Otherwise platform-playbook.
- **Test passes but invocation fails** — usually means SKILL.md path is wrong
  in the package.json's plugin manifest. Check the `claude-plugin` field if
  added at marketplace level.
- **Authoring language directive forgotten (v0.3.0+: Bahasa Indonesia)** —
  IG + TikTok schemas don't validate language explicitly (just enforce no-URL +
  char limits). The Indonesian directive lives in SKILL.md hard rule #1 +
  RAG playbook (`docs/rag/{ig,tiktok}-playbook/01.md` + `05.md` top-of-file
  block quote). Threads has an explicit `language` enum field defaulting to
  `'id'`. If LLM output keeps emitting English, check that the compiled
  reference bundle includes the playbook directive (run `npm run compile-refs`
  after editing playbook).
- **`text_only_caption` authored when not requested (waste)** — `/instagram-gen`
  authors the field only when `cross_post_targets` input arg includes `'facebook'`.
  If field is present without that signal, schema accepts it (it's optional)
  but the work is wasted. Backend's `BaseSocialGenerationService::buildPluginInput`
  is responsible for setting the input flag based on `LinkedInPost.auto_approve_cross_posts`.

## Brand context (for the consuming repo)

The primary consumer is the Ali Sadikin Ma portfolio brand
([alisadikinma.com](https://alisadikinma.com)) — AI Generalist Expert, Indonesian
audience + global thought-leadership reach. Brand voice is professional but
not stiff: signals expertise via specifics (numbers, named tools, dated
incidents) rather than corporate-formal posture.

This affects:
- IG / TikTok / Threads captions are Bahasa Indonesia-first (Indonesian Gen Z
  + founder/dev community target). EN tech terms used as cultural shorthand only.
- LinkedIn (separate plugin) stays English-first for US hiring manager + B2B reach.
- Tone is "AI engineer who ships" not "thought leader who motivates"
- Anti-patterns include "AI thought leader" cliches: "in today's rapidly evolving
  landscape", "let's dive deep", "game-changer", emoji bookends

If consumer brand changes (e.g. fork for another operator), update
social-base/ tone guides + each skill's hook patterns subsection. Don't
just override at backend prompt-injection layer — the RAG content is what
the LLM actually reads, so it must match.

---

**Last Updated:** May 10, 2026 (evening) — **v0.5.0 BREAKING: caption length
defaults flipped per 2026 engagement data + NEW Hook Quality Gate (5-test
rubric) across all 3 skills.** IG default 1200-1800 chars → **100-300 chars**
(Socialinsider 9M+ posts study: <30 words = highest engagement). TikTok default
200-500 chars → **80-150 chars** (TTS Vibes 2026: 50-100 chars +21% likes vs
longer). Threads 280-450 unchanged (thought-leadership format). NEW Hard Rule
across all 3 skills: first sentence MUST pass Hook Quality Gate (standalone-
readable / specific / curiosity-gap / native voice / payoff within preview
window) before envelope emission — weak hooks regenerated, never shipped to
fit length targets. Long-form is now an exception, not default. RAG playbooks
updated with new length tiers + hook gate sections (added Socialinsider +
Buffer IG 2026 sources). 53 schema tests passing.

**v0.4.x (May 10 morning):** v0.4.0 forbade "link di bio" CTA across IG +
Threads (link goes to FIRST COMMENT via Publer; operator does NOT update bio
per-post). v0.4.1 reduced TikTok title cap 100 → 90 chars (Publer hard limit
for TikTok photo carousel) + made title MUST NOT echo caption first line.

**v0.3.0 (May 10 afternoon):** authoring language flipped EN → Bahasa Indonesia
across all 3 skills. Indonesian audience target (Gen Z + founder/dev community).
LinkedIn (separate plugin) stays EN for US hiring manager target. Threads
`language` field default flipped `'mixed'` → `'id'`. IG gained optional
`text_only_caption` field (≤1000 chars, body URL OK, Bahasa Indonesia) for FB
cross-post text reuse — replaces prior reuse-of-LinkedIn path.

**v0.2.0 (May 10 morning):** shipped `/threads-gen` Tier-1.
**Maintainer:** Ali Sadikin <ali.sadikincom85@gmail.com>
**Consumer:** [Portfolio_v2](https://github.com/alisadikinma/Portfolio_v2) (Laravel 12 + Vue 3)
**Sister plugins:** `linkedin-post-writer`, `ai-image-carousel-prompt-gen`
