# Changelog

All notable changes to `social-short-form-writer` will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
