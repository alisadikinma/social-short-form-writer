# 08 — TikTok Music Suggestion Language for Plugin Output (2026)

**Summary:** TikTok Photo Mode's algorithm rewards posts with trending or contextually appropriate background music even for static carousels. The plugin cannot select music programmatically — it can only suggest genre/mood/tempo descriptors that guide the operator's in-app selection. This file defines the vocabulary for those suggestions.

---

## Sources

| Source | URL | Fetched | Quality Tier |
|---|---|---|---|
| Buffer — Trending Songs TikTok May 2026 | https://buffer.com/resources/trending-songs-tiktok/ | 2026-05-07 | Marketing analytics platform |
| TikTok — Background Music for Educational Video | https://www.tiktok.com/discover/background-music-for-educational-video | 2026-05-07 | Official platform discovery |
| TikTok — Background Songs to Use for AI | https://www.tiktok.com/discover/background-songs-to-use-for-ai | 2026-05-07 | Official platform discovery |
| TikTok — Lofi Music Background No Copyright | https://www.tiktok.com/discover/lofi-music-background-no-copyright | 2026-05-07 | Official platform discovery |
| savettok.org — B2B TikTok Content Strategy 2026 | https://savettok.org/guides/b2b-tiktok-content-strategy-2026-guide-for-business-growth | 2026-05-07 | Marketing blog |
| viralitywand.com — TikTok Carousel Posts Guide 2026 | https://viralitywand.com/blog/tiktok-carousel-posts-guide/ | 2026-05-07 | Marketing blog |

---

## Why Music Matters for Photo Mode

TikTok's algorithm treats Photo Mode posts as a video format. Adding a trending or contextually appropriate sound significantly boosts FYP distribution compared to no-music posts. The operator adds music manually in the TikTok app before publishing — the plugin's job is to give them a useful, actionable music descriptor so they spend <30 seconds selecting rather than guessing.

**Important caveat:** For commercial/brand accounts, ensure any music used is in TikTok's "Commercial Music Library" to avoid rights violations. The plugin's suggestion should note this when recommending trending sounds.

---

## Music Descriptor Vocabulary

The plugin should use these standardized descriptor fields when suggesting music:

### Genre Descriptors (pick 1)
- `lofi hip-hop` — calm, studious, beats without lyrics; best for educational/tutorial content
- `ambient electronic` — minimal, textural, atmospheric; best for visionary/thought-leadership content
- `upbeat pop instrumental` — energetic, forward-moving, no lyrics; best for quick-tips or checklist formats
- `cinematic/orchestral` — dramatic, high-stakes; best for "before/after" or problem-consequence stories
- `chillhop` — relaxed, jazz-influenced, steady tempo; best for frameworks and explanations
- `corporate motivational` — clean, professional, rising energy; best for startup/growth topics

### Mood Descriptors (pick 1)
- `focused` — steady, non-distracting; good for complex technical content
- `energetic` — fast-paced, driving; good for quick wins and actionable lists
- `contemplative` — slower, thoughtful; good for contrarian or paradigm-shift content
- `aspirational` — upward-feeling, cinematic; good for "what's possible" content
- `urgent` — building tension; good for problem-consequence or warning content

### Tempo Descriptors (pick 1)
- `slow (60-80 BPM)` — relaxed reading pace; best for 9+ slide carousels with dense text
- `medium (80-110 BPM)` — standard reading pace; best for 5–8 slide carousels
- `fast (110-130 BPM)` — quick, punchy; best for 3–5 slide checklists or quick-win formats

---

## Rules for Plugin music_suggestion Output

1. **Format: `[Genre] | [Mood] | [Tempo] | [Commercial library note]`**
   Example output: `"lofi hip-hop | focused | slow (60-80 BPM) | Use TikTok Commercial Music Library for brand safety"`

2. **Match music energy to carousel content density.** Dense technical content (9-slide LLM architecture carousel) benefits from slow/focused music that doesn't compete with reading. Quick-tip carousels (5 slides, short text) can use medium-tempo upbeat instrumentals.

3. **Avoid recommending trending songs by name.** Trending songs change weekly; a specific song name will be outdated within 2–4 weeks. Descriptors stay accurate. The operator can search TikTok's sound library using the mood/genre descriptor.

4. **For B2B tech content default: `lofi hip-hop | focused | slow to medium`** This is the baseline for most AI/engineering carousels. It signals "substantive content" to TikTok users, reduces distraction while reading technical slides, and fits across multiple B2B topic areas without feeling off-brand.

5. **Add a trending-sound alternative note for discovery-phase accounts.** When the operator wants maximum FYP distribution (new account, discovery push), note that using a currently trending sound (searched via TikTok's "Trending" > "Sounds" tab) at low volume can boost initial distribution even if the sound is unrelated to content. This is algorithmically beneficial but carries brand-consistency tradeoff.

---

## Anti-Patterns

- Recommending music with vocals/lyrics for text-heavy carousels — vocals compete with reading, reduces slide dwell time
- Recommending specific song titles — outdated within weeks; operator will spend time searching for something no longer trending
- Recommending high-energy EDM for educational/framework content — tone mismatch reduces perceived credibility for B2B audience
- No music suggestion at all — missed opportunity for ~15–20% FYP reach boost that TikTok grants to music-accompanied posts
- Recommending music not in Commercial Music Library for brand accounts — copyright claim risk
