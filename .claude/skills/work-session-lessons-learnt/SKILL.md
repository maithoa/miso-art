---
name: work-session-lessons-learnt
description: Scans the current session's conversation and produces a compact markdown summary of the user's pain points and how each was resolved. Use when the user asks for a session summary, lessons learnt, what we covered, or wants to document what they learned.
---

# Work Session Lessons Learnt

## What this produces

A compact markdown document with two bullet lists per pain:
- **Pain** — what the user was stuck on or asked about
- **Resolution** — how it was fixed (one line)

## How to detect resolution

**Direct resolution** — user asked once, you gave an instruction or fix, no follow-up on that topic. Mark as: `→ [what you told them]`

**Iterative resolution** — user asked, you responded, they had follow-up questions on the same topic before it was resolved. Mark as: `→ [what finally worked]`

**Unresolved** — user raised something that was never fully closed. Mark as: `⏳ still open`

## Output format

```markdown
# Session Lessons Learnt — YYYY-MM-DD

## Pains & How They Were Resolved

- **[short pain label]**
  _What happened:_ one sentence describing what the user was stuck on.
  _Resolved by:_ one sentence describing the fix or answer.

- **[short pain label]**
  _What happened:_ ...
  _Resolved by:_ ...

## Still Open

- **[label]** — what's pending or unresolved.
```

## Rules

- One bullet per distinct pain. Do not combine unrelated pains.
- Keep each entry to 2 lines max (What happened + Resolved by).
- Use the user's own words where possible for the pain label.
- Do not include things that went smoothly with no friction — only real blockers or questions.
- Do not pad. If only 3 things caused friction, write 3 bullets.
- Save the output as a `.md` file in `output/lessons/` named `YYYY-MM-DD-HHmm.md`. Create the directory if it doesn't exist.
