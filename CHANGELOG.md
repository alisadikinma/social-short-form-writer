# Changelog

All notable changes to `social-short-form-writer` will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-10

### Added
- `/threads-gen` skill — Tier-1 native Threads caption authoring.
  - Zod schema enforces caption ≤500 chars (platform hard limit), title
    ≤140 chars (preview-cut "more" cutoff), hashtags 0-3 HARDCAP (Threads
    minimal hashtag culture; 4+ flagged as spam), NO URL in caption (Threads
    de-prioritizes body links same as IG), `language` enum `'id'|'en'|'mixed'`
    with default `'mixed'`.
  - Pro-but-conversational tone (capital case + witty + specific). NEVER
    lowercase Gen-Z slang — undermines AI Generalist Expert brand positioning.
  - 6 hook formulas: contrarian truth / specific number reveal / hidden cost /
    personal stake / bilingual code-switch / industry call-out.
  - Bilingual ID+EN by default — hook in EN (preview reach via global discovery),
    body mixed (cultural shorthand), engagement question in ID (local algorithm
    boost via reply-velocity).
- 3 new RAG docs in `docs/rag/threads-playbook/`: caption format, hashtag
  strategy, hook patterns.
- 18 new vitest cases in `tests/ThreadsSchemaTest.spec.ts` (5 happy path +
  10 hard rule violations + 3 defaults/boundaries). 48 total tests passing
  (15 IG + 15 TikTok + 18 Threads).
- `scripts/compile-refs.ts` BUNDLES extended with `refs-threads.md` (~21KB
  compiled bundle).
- `CLAUDE.md` — repo-internal guidance covering architectural invariants,
  per-skill design decisions, plugin layout, when-to-add-new-skill checklist,
  release workflow, common pitfalls, brand context.

### Changed
- `README.md` — Skills table now 3 rows (added Threads), explained why
  Threads is Tier-1 (Gen Z capture vehicle, 44% Indonesian penetration)
  while FB stays Tier-2 reuse.
- `package.json` description widened to mention Threads + bilingual support.

### Notes
- Consumer (Portfolio_v2) backend swap (Tier-2 reuse → Tier-1 plugin) shipped
  in commit `ec3fbefe` of that repo. ThreadsGenerationService now extends
  `BaseSocialGenerationService` and SSH-invokes `/threads-gen` (mirror of IG
  pattern), replacing earlier pure-reuse-from-LinkedIn implementation.
- VPS deploy step required (manual): `git pull` plugin, `npm run compile-refs`,
  symlink `refs-threads.md`, restart queue worker. Until done, Threads draft
  generation fails graceful with "RAG file not found" — does not block other
  platforms.

## [0.1.0] — 2026-05-09

### Added
- Initial scaffold of the plugin with two skills:
  - `/instagram-gen` — caption authoring for IG 4:5 photo carousel.
    - Zod schema enforces 3-5 hashtag hardcap (Dec 2025 algorithm change),
      title ≤125 chars, caption ≤2200 chars, NO URL in caption.
  - `/tiktok-gen` — caption authoring for TikTok 9:16 photo-mode.
    - Zod schema enforces 5-8 hashtags, title ≤100 chars, first-150-char
      search-index gate (rejects whitespace/emoji-padded openers), no
      `music_suggestion` field (Publer auto-handles).
- `scripts/compile-refs.ts` — bundles `docs/rag/social-base/*` +
  `docs/rag/{instagram,tiktok}-playbook/*` into 2 compiled reference files
  for `--append-system-prompt-file` injection.
- 10 RAG markdown files seeded from
  [Portfolio_v2/docs/research/2026-05-07-ig-tiktok-best-practice/](https://github.com/alisadikinma/Portfolio_v2/tree/main/docs/research/2026-05-07-ig-tiktok-best-practice).
- 19 vitest cases covering happy path, hashtag bounds, length limits,
  link-in-caption rule, strict-mode rejection, discriminated union.

### Notes
- Facebook Page authoring is intentionally OUT of scope. Consuming backend
  reuses `linkedin_posts.content` (text format) or `/instagram-gen` output
  (carousel format) per design decision documented in
  [Portfolio_v2 cross-post plan](https://github.com/alisadikinma/Portfolio_v2/blob/main/docs/plans/2026-05-08-cross-post-publer-integration.md).
- Compiled `references/compiled/*` is gitignored. Operator must run
  `npm run compile-refs` on VPS after every `git pull` and symlink the
  outputs to `/home/claudesn/refs-{instagram,tiktok}.md`.
