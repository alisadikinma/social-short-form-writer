# Threads Caption Format

## Hard limits

- **Hard cap:** 500 chars per post (Threads platform limit, May 2026)
- **Sweet spot:** 280-450 chars
- **Preview cut:** First ~140 chars show on feed before "more" — invest the strongest hook here
- **Title field:** First 100 chars of caption (used for queue display, NOT separate field)

## Structure (Pro-but-conversational tone)

```
[Hook — ≤140 char, fits the preview window]
[1-2 line setup or stat — adds credibility]
[Take or contrarian beat — the signature insight]
[Engagement question — invites reply, NEVER "what do you think?"]
```

**Total: 280-450 chars.** Below 280 reads thin; above 500 hits the platform limit.

## Authoring tone — Pro-but-conversational

What this means:
- **Capital case** (NOT lowercase intentional Gen-Z slang)
- Witty + sharp, but never preachy
- Industry-aware references (AI agents, vibe coding, Claude Code, OpenAI/Anthropic) used as cultural shorthand
- First-person OK, but signal expertise via specifics (numbers, named tools, dated incidents)
- Em-dashes — used sparingly (max 2 per caption, never 3+)

What to avoid:
- Lowercase-intentional ("just shipped my first agent and it's been wild")
- Generic Gen-Z slang ("no thoughts head empty", "the math ain't mathing", "it's giving...")
- LinkedIn-tier formal ("In today's rapidly evolving AI landscape...")
- Engagement bait ("Drop a 🔥 if you agree", "Comment YES if you're with me")

## Bilingual support

Threads audience in Indonesia is bilingual. Default authoring strategy:
- **Hook in English** (preview cut — broader reach via global discovery)
- **Body in Indonesian + English mix** (cultural shorthand: "warung", "ojek", "founders Indonesia")
- **Engagement question in Indonesian** (invites local replies — algorithm boosts conversation thread)

Schema accepts `language: 'id' | 'en' | 'mixed'` field. Default `mixed` for the brand's Indonesian-primary audience with English thought-leadership reach.

## Link strategy

- **NO link in caption body** — same penalty as IG, Threads algorithm de-prioritizes posts with body URLs
- **Link in first reply** (manual operator action OR Publer auto-feature for Threads if available)
- **Link in bio** as fallback
- Schema: NO `link_url` field

## Examples

### Good (preview-cut hook + setup + take)

> Most "AI agent" demos are just chatbots with extra steps.
>
> Real agents have 3 things: planner, memory, tool registry.
> Strip any one — you're back to chat.
>
> Banyak founder Indonesia yang ngira udah bikin agent. Cek dulu yang mana yang missing.
>
> Yang mana komponen agent yang paling sering diskip di project lo?

(412 chars, ID+EN mix, contrarian hook fits preview)

### Bad (lowercase Gen-Z slang)

> okay but why is everyone calling their langchain wrapper an "agent"
>
> the math ain't mathing
>
> like bestie that's a chatbot 💀

(reads cheap, undermines AI Generalist Expert positioning)

### Bad (LinkedIn formality)

> In the rapidly evolving landscape of AI agents, it's important to note that many implementations fall short of true autonomous reasoning.
>
> Today, I'd like to discuss the three core components every agent must have...

(Threads users scroll past in 1 sec)
