# Threads Hashtag Strategy

## Cap: 1-3 hashtags maximum

Threads algorithm (May 2026) penalizes hashtag-heavy posts as spam-signal.
Cultural norm on the platform is minimal-to-zero hashtags — opposite of
Instagram's 3-5 sweet spot.

- **0 hashtags:** acceptable when the topic is conversational + trending
  organically (e.g. responding to an OpenAI announcement same-day)
- **1-2 hashtags:** the **default** for thought-leadership posts
- **3 hashtags:** the **maximum**. Only if all 3 are genuinely topical.
- **4+ hashtags:** auto-fail. Algorithm classifies as spam.

## Tag composition

Mix:
- **1 broad pillar tag** (`#AI`, `#AIAgents`, `#VibeCoding`, `#Anthropic`)
- **0-1 niche tag** (`#ClaudeCode`, `#solopreneurAI`, `#buildinpublic`)
- **0-1 brand tag** (`#alisadikinma`) — only on signature/milestone posts

## Anti-patterns

- Stuffing 5+ hashtags ("for reach") — net-negative on Threads
- Trailing hashtag list separated from body by line break
- Hashtags inside the caption hook (kills preview readability)
- Brand tag on every post (becomes self-promotional noise)

## Placement

Hashtags appear at the **end** of the caption, separated by a blank line:

```
[Caption body, 280-450 chars]

#AIAgents #ClaudeCode
```

NOT inline:
```
Real #AIAgents have 3 components — #ClaudeCode is one tool.
```
(Threads algorithm flags inline hashtags as spam-format.)

## Schema enforcement

```typescript
hashtags: z.array(HashtagSchema)
  .min(0)
  .max(3, { message: 'Threads hashtags MAX 3 — algorithm penalty above' })
```

Validation rule: empty array is acceptable, > 3 is hard-fail.
