---
name: work-session-lessons-learnt
description: Scans the current session's conversation and produces a compact markdown summary of what the user learned — things they asked about, didn't know, or needed guidance on. Use when the user asks for a session summary, lessons learnt, what we covered, or wants to document what they learned today.
---

# Work Session Lessons Learnt

## What this produces

A compact markdown document written from the **user's perspective** — not a bug log, not a dev diary. Each entry is one thing the user didn't know at the start of the session and now knows.

## How to detect a learning moment

Look for:
- Direct questions the user asked ("how do I...", "what is...", "why can't I...")
- Things the user tried that didn't work and needed explanation
- Concepts you had to explain before the user could proceed
- Setup steps the user needed to be walked through

**Signal that it's resolved:** user asked, you explained, no confused follow-up — or follow-ups led to a clear answer and the user moved on.

**Signal it's still open:** user asked, you gave steps, but they hit another blocker and it's not yet working end-to-end.

## Output format

```markdown
# What I Learned — YYYY-MM-DD

## Lessons

- **[Topic]**
  _I didn't know:_ one sentence on what was unclear.
  _Now I know:_ one or two sentences — the actual answer or mental model.

- **[Topic]**
  ...

## Still figuring out

- **[Topic]** — what's still unclear or blocked.
```

## Rules

- Write in first person from the user's point of view ("I didn't know", "Now I know").
- One bullet per concept. Do not group unrelated things.
- Keep it to what the user genuinely didn't know — skip anything they already understood.
- No code snippets unless a specific command is the core of the lesson.
- Do not include internal agent/dev errors that the user never saw or asked about.
- Save the output as a `.md` file in `output/lessons/` named `YYYY-MM-DD-lessons.md`. Create the directory if it doesn't exist.
