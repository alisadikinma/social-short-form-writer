# Threads Hook Patterns

The first 140 chars of the caption show on feed before the "more" cutoff.
On Threads (algorithm rewards reply-velocity in the 90-second window),
a strong preview-cut hook is mandatory — without it, the post never
exits the cold-start exposure pool.

## 6 hook formulas (Pro-but-conversational tone)

### 1. Contrarian truth
Pattern: `[Common belief] is actually [opposite truth].`

Examples:
- "Most 'AI agent' demos are just chatbots with extra steps."
- "Vibe coding doesn't replace engineers. It exposes them."
- "Claude Code's killer feature isn't autonomy. It's restraint."

When to use: blog post argues against industry consensus.

### 2. Specific number reveal
Pattern: `[N] [things] I see in every [outcome].` or `[N] of [N] [data point] do X.`

Examples:
- "3 patterns I see in every $0 → $10k MRR AI startup."
- "8 of 10 LinkedIn 'AI thought leaders' can't ship a working agent."
- "Last week 4 of my Claude Code agents shipped to prod. Here's what broke."

When to use: blog has structured list / data / personal log.

### 3. Hidden cost
Pattern: `The real reason [thing] [outcome] (and it's not [obvious thing]).`

Examples:
- "The real reason your AI agent fails in prod (and it's not the model)."
- "The real cost of 'just one more LangChain wrapper' (and it's not the API bill)."

When to use: blog uncovers a non-obvious bottleneck.

### 4. Personal stake / receipts
Pattern: `[Personal action] [N] [things] in [timeframe]. [Specific outcome].`

Examples:
- "Shipped 4 AI agents in 30 days. Only 1 still runs."
- "I rewrote my entire backend with Claude Code last weekend. Here's what it cost."

When to use: post draws on personal portfolio / experiment.

### 5. Bilingual code-switch
Pattern: `[EN observation]. [ID context that grounds it locally].`

Examples:
- "Everyone's hyping AI agents. Tapi 90% founder Indonesia masih ngerjain todo-list pakai Notion manual."
- "Claude 4.7 just shipped. Banyak yang bilang revolusioner — ya kalau lo udah pakai Claude 4.6 yang juga revolusioner katanya."

When to use: blog has Indonesian-specific context (palm oil, ojek, e-commerce regulation).

### 6. Industry call-out
Pattern: `[Specific company / tool] [unexpected behavior]. [Implication].`

Examples:
- "Anthropic just made the API key spending dashboard public. Translation: prompt cost transparency wars are starting."
- "OpenAI shipped 'Memory' for ChatGPT in 2024. It's now the same feature Claude.ai launched in 2023. Funny how that works."

When to use: blog post is a reaction to a specific platform/company event.

## Anti-patterns

| Don't | Why |
|---|---|
| `Hey everyone, today I want to share...` | Generic intro — instant scroll-past |
| `In today's fast-paced AI landscape...` | LinkedIn-formal — Threads users hate it |
| `Let's dive deep into...` | "Dive deep" is auto-AI-slop |
| `🚀 Big announcement! 🚀` | Emoji bookends signal cheap content |
| `What if I told you...` | YouTube-thumbnail-bait — annoying on Threads |
| `Drop a 🔥 if...` | Engagement bait — algorithm penalty |

## Hook + body coupling

The hook **must echo into the first body line.** If the hook is "Most AI agent demos are chatbots", the next line should NOT pivot to "Anyway, let me tell you about..." — it should immediately deliver the punch:

> Most AI agent demos are just chatbots with extra steps.
>
> Real agents have 3 components: planner, memory, tools.
> Strip any one — you're back to chat.

NOT:

> Most AI agent demos are just chatbots with extra steps.
>
> Anyway, this week I worked on a project that uses LangGraph. We had some interesting findings...

(reader feels baited and bounces)
