# Threads Hook Patterns

The first 140 chars of the caption show on feed before the "more" cutoff.
On Threads (algorithm rewards reply-velocity in the 90-second window),
a strong preview-cut hook is mandatory — without it, the post never
exits the cold-start exposure pool.

**Authoring language: Bahasa Indonesia by default.** Examples below are
in Indonesian (the production target). EN tech terms used as cultural
shorthand (`AI agents`, `vibe coding`, `shipping`, `stack`, `founder`)
are part of the local tech vocabulary and SHOULD be preserved.

## 6 hook formulas (Pro-but-conversational tone, Bahasa Indonesia)

### 1. Contrarian truth
Pattern: `[Kepercayaan umum] sebenarnya [opposite truth].`

Examples:
- "Mayoritas demo 'AI agent' cuma chatbot dengan langkah ekstra."
- "Vibe coding gak ngegantiin engineer. Justru malah ngebuka borok mereka."
- "Killer feature Claude Code bukan autonomy-nya. Tapi restraint-nya."

When to use: blog post argues against industry consensus.

### 2. Specific number reveal
Pattern: `[N] [things] yang gue liat di setiap [outcome].` atau `[N] dari [N] [data point] yang melakukan X.`

Examples:
- "3 pola yang gue liat di setiap AI startup $0 → $10k MRR."
- "8 dari 10 'AI thought leader' di LinkedIn gak bisa ship agent yang beneran jalan."
- "Minggu lalu 4 agent Claude Code gue ship ke prod. Ini yang rusak."

When to use: blog has structured list / data / personal log.

### 3. Hidden cost
Pattern: `Alasan sebenarnya [thing] [outcome] (dan bukan [obvious thing]).`

Examples:
- "Alasan sebenarnya AI agent lo gagal di prod (dan bukan model-nya)."
- "Biaya sebenarnya 'just one more LangChain wrapper' (dan bukan tagihan API-nya)."

When to use: blog uncovers a non-obvious bottleneck.

### 4. Personal stake / receipts
Pattern: `[Personal action] [N] [things] dalam [timeframe]. [Specific outcome].`

Examples:
- "Ship 4 AI agents dalam 30 hari. Cuma 1 yang masih jalan."
- "Gue rewrite seluruh backend pakai Claude Code weekend lalu. Ini biayanya."

When to use: post draws on personal portfolio / experiment.

### 5. Local context grounding
Pattern: `[Tech industry observation]. [Konteks Indonesia spesifik yang nge-ground].`

Examples:
- "Semua orang lagi nge-hype AI agents. Tapi 90% founder Indonesia masih ngerjain todo-list pakai Notion manual."
- "Claude 4.7 baru ship. Banyak yang bilang revolusioner — ya kalau lo udah pakai Claude 4.6 yang juga katanya revolusioner."

When to use: blog has Indonesian-specific context (UMKM, ojek, e-commerce regulation,
founder community SEA).

### 6. Industry call-out
Pattern: `[Specific company / tool] [unexpected behavior]. [Implication].`

Examples:
- "Anthropic baru bikin dashboard pengeluaran API key transparan publik. Artinya: prompt-cost transparency war udah mulai."
- "OpenAI ship 'Memory' di ChatGPT 2024. Itu fitur yang sama persis Claude.ai launch 2023. Lucu ya."

When to use: blog post is a reaction to a specific platform/company event.

## Anti-patterns

| Don't | Why |
|---|---|
| `Hai semua, hari ini gue mau share...` | Generic intro — instant scroll-past |
| `Di era AI yang serba cepat ini...` | LinkedIn-formal — Threads users hate it |
| `Yuk dive deep ke...` | "Dive deep" is auto-AI-slop |
| `🚀 Pengumuman besar! 🚀` | Emoji bookends signal cheap content |
| `Bagaimana kalau gue bilang...` | YouTube-thumbnail-bait — annoying on Threads |
| `Drop 🔥 kalau setuju...` | Engagement bait — algorithm penalty |
| Mixing formal + casual ("Adapun, gue ingin sampaikan...") | Tonal whiplash — sounds robotic |

## Hook + body coupling

The hook **must echo into the first body line.** If the hook is "Mayoritas demo AI agent cuma chatbot", the next line should NOT pivot to "Anyway, mari gue ceritain..." — it should immediately deliver the punch:

> Mayoritas demo AI agent cuma chatbot dengan langkah ekstra.
>
> Agent beneran punya 3 komponen: planner, memory, tools.
> Kurang satu — lo balik ke chat.

NOT:

> Mayoritas demo AI agent cuma chatbot dengan langkah ekstra.
>
> Anyway, minggu ini gue lagi ngerjain project pakai LangGraph. Ada beberapa finding menarik...

(reader feels baited and bounces)

## When caller overrides `language: 'en'`

If the input arg passes `language: 'en'`, flip examples to English equivalents:
- "Most 'AI agent' demos are just chatbots with extra steps."
- "Shipped 4 AI agents in 30 days. Only 1 still runs."

This mode is opt-in for global thought-leadership posts. Default behavior
is `'id'` — author Indonesian unless explicitly overridden.
