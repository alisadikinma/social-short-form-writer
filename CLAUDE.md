# CLAUDE.md — social-short-form-writer

This file provides guidance to Claude Code when working in this plugin repo.

**Context:** Read `README.md` first for the operator-facing overview. This file
captures architectural invariants, design decisions, and common pitfalls that
won't show up in the user-facing docs.

## Project Overview

Claude Code plugin housing 3 sister skills for short-form social caption authoring:

| Skill | Platform | Tone | Format |
|---|---|---|---|
| `/instagram-gen` | Instagram | English narrative storytelling | 4:5 photo carousel |
| `/tiktok-gen` | TikTok | English search-aware (first 150 char critical) | 9:16 photo-mode |
| `/threads-gen` | Threads | Pro-but-conversational, ID+EN bilingual | text or 4:5 carousel |

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

### IG: hashtag cap 3-5, English only

- Pre-Dec 2025 IG algorithm rewarded 10+ hashtags. Post-update, 6+ flagged as
  spam and reach drops 30-40%. Schema enforces 3-5 hardcap.
- English authoring matches `linkedin-post-writer` v0.6.0 directive — backend
  feeds plugin EN-translated blog content (already done by article-translate
  pipeline before this skill runs).

### TikTok: first 150 char critical

- TikTok search index reads the first 150 chars of the caption as the primary
  hook + topic signal. Anything beyond that is search-invisible.
- 5-8 hashtags is platform-appropriate (mid-range, balances discoverability vs
  spam-classifier risk).
- Music suggestion is intentionally OUT — Publer auto-attaches trending music
  via its TikTok integration. Plugin shouldn't fake-generate music context.

### Threads: 0-3 hashtag cap, ID+EN bilingual default

- Threads minimal hashtag culture (May 2026 algorithm) — 4+ hashtags = spam
  signal. Schema enforces max 3, allows 0.
- 280-450 char sweet spot vs IG's 1200-1800 — Threads is conversational
  brevity, not narrative storytelling.
- 140-char preview-cut hook is the make-or-break: posts that don't pay off
  the preview within 100 body chars get scroll-past + algorithm penalty.
- Bilingual default (`language: 'mixed'`) because the consuming brand
  (Ali Sadikin Ma — AI Generalist Expert) targets Indonesian Gen Z + global
  thought-leadership reach. Hook in EN for global discovery, body mixed for
  cultural shorthand, engagement question in ID for local reply-velocity boost.
- **Pro-but-conversational tone** is the brand-positioning constraint. Lowercase
  Gen-Z slang ("the math ain't mathing") would undermine AI Generalist Expert
  credibility. Capital case + witty + specific (numbers, named tools) hits the
  right register.

### FB: NOT in this plugin

Documented in README.md — saves ~1 day dev. FB is reuse-only at backend
(LinkedIn for text, IG output for carousel). Don't add `/facebook-gen` here
unless engagement data justifies upgrade to Tier-1.

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
- **English authoring directive forgotten** — IG + TikTok schemas don't
  validate language explicitly (just enforce no-URL + char limits). The
  English-only constraint lives in SKILL.md hard rule #1. Threads is the
  exception with explicit `language` enum field — it's the only platform
  where bilingual is actively desired.

## Brand context (for the consuming repo)

The primary consumer is the Ali Sadikin Ma portfolio brand
([alisadikinma.com](https://alisadikinma.com)) — AI Generalist Expert, Indonesian
audience + global thought-leadership reach. Brand voice is professional but
not stiff: signals expertise via specifics (numbers, named tools, dated
incidents) rather than corporate-formal posture.

This affects:
- IG / TikTok captions are English-first (global discovery)
- Threads is bilingual (Indonesian Gen Z primary + global secondary)
- Tone is "AI engineer who ships" not "thought leader who motivates"
- Anti-patterns include "AI thought leader" cliches: "in today's rapidly evolving
  landscape", "let's dive deep", "game-changer", emoji bookends

If consumer brand changes (e.g. fork for another operator), update
social-base/ tone guides + each skill's hook patterns subsection. Don't
just override at backend prompt-injection layer — the RAG content is what
the LLM actually reads, so it must match.

---

**Last Updated:** May 10, 2026 — `/threads-gen` skill shipped (Tier-1 native
authoring, replacing earlier Tier-2 reuse pattern in Portfolio_v2 backend).
Plugin now covers IG + TikTok + Threads. 48 schema tests passing.
**Maintainer:** Ali Sadikin <ali.sadikincom85@gmail.com>
**Consumer:** [Portfolio_v2](https://github.com/alisadikinma/Portfolio_v2) (Laravel 12 + Vue 3)
**Sister plugins:** `linkedin-post-writer`, `ai-image-carousel-prompt-gen`
