# social-short-form-writer

Claude Code plugin for converting blog posts into native **Instagram**, **TikTok**, and **Threads** captions, optimized for 2026 platform algorithms.

Pure content generation — emits one JSON envelope to stdout per skill run. The consuming backend (e.g. [Portfolio_v2](https://github.com/alisadikinma/Portfolio_v2)) parses stdout, validates, and handles all operational concerns: OAuth/Publer transport, scheduling, FSM, approval gate, cancel window.

## Skills

| Skill | Purpose | Output schema | Tone |
|---|---|---|---|
| `/instagram-gen` | Caption + 3-5 hashtags for IG photo carousel (4:5), default 100-300 chars (Socialinsider 9M+ posts study), optional `text_only_caption` for FB reuse | `InstagramOutputEnvelopeSchema` | Bahasa Indonesia, short-form scroll-stopper |
| `/tiktok-gen` | Caption + 5-8 hashtags + ≤90 char title for TikTok photo-mode (9:16), default 80-150 chars (+21% likes vs longer per TTS Vibes 2026) | `TiktokOutputEnvelopeSchema` | Bahasa Indonesia, search-index-aware first 80-100 chars |
| `/threads-gen` | Caption + 0-3 hashtags for Threads text/carousel, 280-450 thought-leadership sweet spot | `ThreadsOutputEnvelopeSchema` | Pro-but-conversational, Bahasa Indonesia (default `language: 'id'`) |

**Authoring language policy (v0.3.0+):** All 3 skills default to Bahasa Indonesia
(Indonesian audience target — Gen Z + founder/dev community). EN tech terms
OK as cultural shorthand. LinkedIn (separate [`linkedin-post-writer`](https://github.com/alisadikinma/linkedin-post-writer)
plugin) stays English-only — that plugin targets US hiring managers + B2B
professional audience.

**Hook Quality Gate (v0.5.0+):** all 3 skills enforce a 5-test rubric on the
first sentence before emitting the envelope: (1) standalone-readable as a
complete thought, (2) specific (numbers/named tools/dated stakes — never vague),
(3) curiosity-gap or pattern-interrupt (reader can't predict the payoff),
(4) native voice (NOT LinkedIn-formal, NOT Gen-Z slang), (5) payoff lands
within the platform's preview window (IG 200 chars / TikTok 80 chars /
Threads 210 chars). Weak hooks are regenerated, never shipped to fit length
targets.

## Why a separate plugin?

This plugin is the third in a 3-tier publisher stack:

```
ai-image-carousel-prompt-gen   ← Universal slide image engine (4:5, reused everywhere)
linkedin-post-writer            ← LinkedIn long-form text + carousel-format routing
social-short-form-writer        ← THIS: IG + TikTok + Threads caption authoring
```

Facebook Page authoring is **NOT** in this plugin (intentional Tier-2 cost-save). The consuming backend handles FB:
- **FB text format** → reuses `linkedin_posts.content` directly (LinkedIn already authored EN long-form)
- **FB carousel format** → reuses `/instagram-gen` output (FB + IG carousel both 4:5 photo)

This decision is documented in [Portfolio_v2 design doc 2026-05-08](https://github.com/alisadikinma/Portfolio_v2/blob/main/docs/plans/2026-05-08-cross-post-publer-integration.md). Saves ~1 day of plugin dev with acceptable FB performance trade-off (FB is a declining channel for Gen Z anyway).

Threads, by contrast, **IS** in this plugin (Tier-1) because Threads is the primary Gen Z capture vehicle (44% Indonesian Gen Z penetration vs 22% on FB) and reuse-from-LinkedIn produces wrong tone — Threads needs preview-cut hooks (≤140 char), Pro-but-conversational voice, and 1-3 hashtag minimal culture, none of which transform cleanly from LinkedIn's 1100-char professional long-form.

## Hard rules (encoded in Zod schemas)

### `/instagram-gen`
- Hashtags: **3-5 items HARDCAP** (Dec 2025 IG algorithm change penalizes 6+)
- Caption: ≤2200 chars hard limit. **Default sweet spot: 100-300 chars** (~15-50 words)
  per Socialinsider 9M+ posts study — captions <30 words drive HIGHEST engagement
  because slides carry the value, caption is the conversational frame. Long-form
  700-1500 chars is a deliberate exception (only when slides don't carry the full
  insight). AVOID 300-700 char no-man's-land.
- Title (first-line hook): ≤125 chars — preview cutoff before "more"; first
  sentence MUST pass the Hook Quality Gate (5 tests, see above)
- **NO link in caption** — IG canonical workflow puts link in first comment via
  Publer (NOT bio — operator does NOT update bio per-post)
- **Bahasa Indonesia authoring** (Indonesian audience target; EN tech terms OK as shorthand)
- No `music_suggestion` field (photo carousel = no audio track)
- **OPTIONAL `text_only_caption`** field (≤1000 chars, body URL allowed) — condensed
  FB-text variant for cross-post reuse. Authored when input includes
  `cross_post_targets: ['facebook']`. Read by Portfolio_v2's `FacebookGenerationService`.

### `/tiktok-gen`
- Hashtags: 5-8 items
- Caption: ≤2200 chars hard limit. **Default sweet spot: 80-150 chars** (~12-25 words)
  per TTS Vibes / Glow Social 2026 analytics — 50-100 char captions get +21%
  likes vs longer captions. Front-load primary keyword in first 80-100 chars
  (preview cutoff + search-index zone). Extend to 200-400 only for SEO-driven
  educational posts.
- Title field: **≤90 chars** (Publer hard cap for TikTok photo carousel, REQUIRED
  not optional). MUST NOT echo caption first line — title is summary headline,
  caption opens with a different hook
- First sentence MUST pass the Hook Quality Gate (5 tests, see above)
- **Link in caption is OK** (TikTok allows it; many creators do this — note
  TikTok has no first-comment API support via Publer)
- **Bahasa Indonesia authoring** (Indonesian audience target; EN tech terms OK as shorthand)
- Primary search keyword can be EN tech term (search index is locale-aware)
- No `music_suggestion` field — Publer auto-attaches trending music

### `/threads-gen`
- Hashtags: **0-3 items HARDCAP** (Threads minimal hashtag culture; 4+ flagged as spam)
- Caption: ≤500 chars (platform hard limit), **280-450 sweet spot** (Threads is
  thought-leadership format — needs more dwell than IG/TikTok)
- Title (preview-cut hook): ≤140 chars (Threads "more" cutoff on feed); first
  sentence + setup MUST pass the Hook Quality Gate (payoff lands within first
  210 chars / preview window)
- **NO link in caption** — Threads de-prioritizes body URLs; link goes in first
  reply via Publer
- **Pro-but-conversational tone** — capital case, witty + sharp, NEVER lowercase Gen-Z slang
- **Bahasa Indonesia by default** — caption + hook + engagement question all Indonesian. Schema field `language: 'id'|'en'|'mixed'`, **default `'id'`** (v0.3.0+; was `'mixed'` in v0.2.0). Caller may override to `'en'` for global thought-leadership posts or `'mixed'` for bilingual code-switch.
- 6 hook formulas: contrarian truth / number reveal / hidden cost / personal stake / local context grounding / industry call-out

## Usage

### CLI invocation (production — VPS-backed pipeline)

```bash
claude -p "/instagram-gen <blog-payload-json>" \
  --model sonnet \
  --append-system-prompt-file /home/claudesn/refs-instagram.md \
  --mcp-config /home/claudesn/empty-mcp.json \
  --strict-mcp-config \
  --dangerously-skip-permissions
```

The skill reads the positional JSON arg, authors the caption, and emits ONE JSON envelope to stdout. The consuming Laravel `InstagramGenerationService` (in Portfolio_v2 backend) parses stdout via balanced-brace scanner, validates against the Zod schema, and advances the FSM.

### Input shape

See each skill's `SKILL.md` for the full `blog + content_idea + carousel_slides + format + posting_time_options` input contract.

## Development

```bash
# Install deps
npm install

# Run tests
npm test

# Compile reference bundles (NOT committed — for VPS deploy)
npm run compile-refs
# Outputs: references/compiled/refs-instagram.md + refs-tiktok.md + refs-threads.md
```

## VPS Deployment

After every release, the operator must redeploy compiled refs to the VPS:

```bash
# On VPS (claudesn user)
cd ~/claude-plugins/social-short-form-writer
git pull
npm install
npm run compile-refs

# Symlink to home dir for easy --append-system-prompt-file path
ln -sf "$(pwd)/references/compiled/refs-instagram.md" /home/claudesn/refs-instagram.md
ln -sf "$(pwd)/references/compiled/refs-tiktok.md" /home/claudesn/refs-tiktok.md
ln -sf "$(pwd)/references/compiled/refs-threads.md" /home/claudesn/refs-threads.md
```

The compiled bundles are gitignored (`references/compiled/`) — they're rebuilt fresh from `docs/rag/*` on each deploy so the source RAG content stays the single source of truth.

## Backend integration

The consuming backend ([Portfolio_v2](https://github.com/alisadikinma/Portfolio_v2)) wires this plugin via:

- `App\Services\InstagramGenerationService` — SSH-invokes `/instagram-gen`
- `App\Services\TiktokGenerationService` — SSH-invokes `/tiktok-gen`
- `App\Services\ThreadsGenerationService` — SSH-invokes `/threads-gen`
- `App\Services\FacebookGenerationService` — does NOT call this plugin; reuses LinkedIn or IG output
- `App\Jobs\GenerateInstagramPost` / `GenerateTiktokPost` / `GenerateThreadsPost` — queued wrappers
- Env vars: `SOCIAL_GEN_REFS_INSTAGRAM`, `SOCIAL_GEN_REFS_TIKTOK`, `SOCIAL_GEN_REFS_THREADS`, `SOCIAL_GEN_MODEL=sonnet`, `SOCIAL_GEN_TIMEOUT_SECONDS=300`

See [Portfolio_v2 root CLAUDE.md](https://github.com/alisadikinma/Portfolio_v2/blob/main/CLAUDE.md) section "Cross-Post Pipeline" for the full architecture.

## License

MIT — Ali Sadikin <ali.sadikincom85@gmail.com>
