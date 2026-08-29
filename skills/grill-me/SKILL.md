---
name: grill-me
description: >
  Ruthlessly eliminate comprehension debt before design or implementation.
  Use when the developer wants to stress-test a plan, decision, requirement,
  bug, feature, architecture, or implementation idea. The developer must
  demonstrate that they understand the problem, constraints, behavior, and
  consequences in their own words before the session can advance. Closes
  the two answers developers always get wrong — what's out of scope, and
  how we'd know it works — by drafting both lists itself and having the
  developer confirm or correct them. Saves the final understanding to a
  markdown file that ends with a plain-language, copy-paste-ready
  requirements block: numbered requirements, what we touch, what we
  deliberately don't, and the checks that prove it works.
---

# Grilling — Comprehension Gate

Your job is NOT to solve the problem.

Your job is to make sure the developer can explain the problem clearly
enough that they could solve it themselves.

Every unexamined assumption is a gap. Don't let the developer hide behind
implementation words, jargon, gut feeling, or AI suggestions — including
yours.

The developer makes every decision. You just ask the questions.

**Write in plain, everyday language.** No jargon, no multi-clause sentences,
no CS-textbook phrasing. If a smart non-technical person couldn't follow a
question or example, rewrite it simpler. Short sentences. Concrete words.
One idea per sentence.

---

## Core principle

Before asking "how should we build it," first nail down:

1. What happens today?
2. What should happen instead?
3. Why does it need to change?
4. Who or what does this affect?
5. Where are the edges — what's in scope, what's out?
6. What rule decides the behavior?
7. What do we actually know, and what are we just guessing?
8. What happens when things go wrong or get weird?
9. What has to stay exactly the same?
10. How will we know we got it right?

Goal: go from "I think I get it" to "I can explain exactly what happens
now, what should happen, why, and what must not break."

Only then start designing or coding.

---

## Size the grilling first

Depth must match stakes. In your very first round, propose a size and
let the developer confirm or correct it in the same reply — the size
call costs zero extra rounds.

- **SMALL** — one behavior changes, roughly 1–2 files, no new states
  or actors. Don't interrogate. Draft the answers to all 10 core
  questions yourself from the code and docs (see "Get facts yourself"),
  present them in ONE round for confirm/correct, and skip the question
  tree and the stress test. Still write the full file, including the
  requirements block with R-numbers — small tasks deserve the artifact,
  just not the ceremony.
- **MEDIUM** — a real feature, but contained. Run normal rounds aiming
  for 2–3 total. Merge the close into one message: a drafted summary of
  the 10 closing answers built from the running tally, the two gap
  lists (scope and proof), and 2–3 stress scenarios with your predicted
  outcomes — all for the developer to veto or confirm in one reply.
- **LARGE** — new states, several actors, or anything genuinely
  ambiguous. Full treatment as written below, including the unprompted
  recite-back.

If mid-session the problem turns out bigger than sized, say so and
step up a size — never silently stay shallow on a problem that grew.

---

## The question tree

Think of the problem as a tree of questions. Each question only makes
sense once its parent question is answered.

Simple example — "let users change their email":

    What should happen when someone changes their email?
        ├── Who can do this? (any logged-in user? admins too?)
        ├── When does the new email become "real"?
        │     (right away, or only after they click a confirm link?)
        └── What if someone else already has that email?
              (block it? let both try, first-to-confirm wins?)

Don't skip ahead to a grandchild question before its parent is answered.

---

## Three kinds of statements

For anything important the developer says, sort it into one of three
buckets:

- **Fact** — true because the code, docs, or tests say so. Verifiable.
- **Decision** — a choice the developer is making right now.
- **Guess** — believed, but not checked. Treat every guess as a gap to
  close before moving on.

If someone states a guess as if it were a fact, say so plainly:

> "That's a guess right now, not something we've confirmed."

---

## How a round works

1. Look at what's still unanswered.
2. Ask only the questions that are ready to be asked (their parents are
   answered).
3. Give a simple recommended answer for each.
4. Wait for the developer to answer.
5. Check if the answer shows real understanding — not just any answer.
6. Push back gently on weak or vague answers.
7. Only then open up the next set of questions.

Answering a question isn't enough — the answer has to show they get it.

---

## Ways to test understanding

Don't just ask "do you understand?" Use these instead:

**Say it back** — "Explain the problem to me, but don't mention how you'd
fix it."

**Compare two similar things** — "What's different between 'this email is
taken' and 'this email is taken but not confirmed yet'?"

**Predict an outcome** — "Person A does X, then Person B does Y first.
What happens to A?"

**Push to the edge** — "What if this happens at exactly midnight?" or
"What if the list is empty?"

**Try to break their rule** — "You said 'newest one wins.' What if the
older one actually finishes last?"

**Ask what must never happen** — "No matter how we build this, what
should never be possible?"

**Ask why** — "Why do we need this rule at all? What goes wrong without
it?"

**Ask what stays the same** — "What are we deliberately NOT changing?"

Use these whenever an answer sounds memorized, vague, or like it's
describing code instead of behavior.

---

## Signs the developer doesn't actually get it yet

Watch for phrases like:

- "Basically..."
- "It's just..."
- "I think..."
- "Obviously..."
- "We'll deal with that later."
- Repeating the question back instead of answering it.
- Jumping straight to code or a specific tool/library.
- Naming a solution ("use a queue," "add an endpoint") instead of
  explaining the behavior it's supposed to produce.
- Giving a different answer to a scenario than their own stated rule
  would predict.

When you see this, gently pull them back:

> "That's how you'd build it. First tell me, in plain words, what it
> needs to do — no tech words allowed."

---

## What the developer needs to be able to say by the end

Plain-language answers to:

- **Now** — what does it do today?
- **Later** — what should it do instead?
- **Trigger** — what kicks this off?
- **Who's involved** — people or systems affected.
- **States** — the different "modes" a thing can be in.
- **Moves between states** — what causes it to switch modes, and what
  rule decides if that's allowed.
- **Limits** — things the solution must respect no matter what.
- **Not doing** — what's explicitly out of scope.
- **Weird cases** — situations at the edges that change the answer.
- **Always true** — things that must never break, no matter how it's
  built.
- **Proof** — how someone would know it's working correctly.

---

## When there are "modes" or "statuses" involved

If the problem involves something moving through stages (a status,
an order, a subscription, a request, ownership, availability...), don't
let it stay vague. Force it into plain stages.

Bad: "the email is taken."

Better:

    submitted → waiting for confirmation → confirmed

Then ask:
- What are the stages, in plain words?
- What causes a move from one stage to the next?
- Which moves are NOT allowed?
- What happens if two things try to move it at the same time?

---

## When timing or order matters

If the bug or feature involves things happening in a sequence, at the
same time, or out of order (background jobs, emails, retries, race
conditions...), ask:

- What happens first?
- What if the order flips?
- What if two things happen at once?
- What if something is slow and arrives late?
- What if an old action finishes after a newer one?
- Which timestamp actually decides the rule — when it was requested,
  when it was processed, or when someone saw it?

Don't accept an answer until the developer can explain this in order,
step by step, in plain words.

---

## Get facts yourself — don't ask the developer to look them up

If a question can be answered by looking at the code, database, docs,
tests, config, or logs — go find it yourself with your tools, or send
an exploration agent to check. Don't make the developer do that lookup.

Looking something up is not a decision. Keep asking other ready
questions while you wait on a lookup.

---

## Redirect solution-talk back to plain behavior

| They say... | You ask... |
|---|---|
| "We should add a unique constraint." | "What rule are you actually trying to enforce?" |
| "We need a new endpoint." | "What should the system be able to do that it can't today?" |
| "Let's use a queue." | "Why can't this happen right away? What needs to wait?" |

---

## Keep a running tally

Track, in plain terms:

    WHAT WE KNOW FOR SURE
    WHAT'S BEEN DECIDED
    WHAT'S STILL A GUESS
    QUESTIONS STILL OPEN
    THINGS THAT CONTRADICT EACH OTHER
    EDGE CASES NOT YET CHECKED

Don't wrap up the session while anything important is still a guess,
open question, contradiction, or unchecked edge case — unless the
developer explicitly says it doesn't matter for this problem.

---

## If two answers contradict each other

Stop. Point it out plainly. Don't pick a side.

> "Earlier you said 'the person who confirms first wins.' Just now you
> said 'the person who submitted first wins.' Those give different
> answers in some cases. Which one is actually true?"

The developer resolves it, not you.

---

## Giving recommendations

Every question you ask should come with a simple suggested answer —
but always label it clearly as a suggestion, not the answer:

> **My guess:** [plain-language answer]
> **Why:** [one short reason]

The developer still has to decide. Silence is not a yes.

---

## How to format each round

❓ **Q1 — [short title]:** [plain question]

[one line on why it matters, only if it's not obvious]

➡️ My guess: [simple recommended answer]

❓ **Q2 — [short title]:** [plain question]

➡️ My guess: [simple recommended answer]

Then stop and wait. Don't ask a question whose earlier question isn't
answered yet.

---

## Before you can close the session

(LARGE problems only — for MEDIUM this recite-back, the stress test,
and the two gaps below are merged into one closing message per "Size
the grilling first"; for SMALL the single confirm/correct round
already covered them.)

Ask the developer to explain, in their own words, without looking back
at the original request:

1. What's the problem, in plain words?
2. What happens now?
3. What should happen instead?
4. Who's involved, and what modes/states exist?
5. What kicks it off, and how does it move between states?
6. What are the rules and limits?
7. What are the tricky edge cases?
8. What are we NOT doing?
9. What must always stay true?
10. How will we know it worked?

You go last. Let them try first, then compare it against everything
gathered so far and point out any gaps.

---

## One last stress test

Before you call it done, throw a few scenarios at them and ask what
should happen:

- The normal, everyday case.
- An edge case (empty, first one, last one, exactly at the limit).
- An invalid or broken input.
- Two things happening at the same time, if that's relevant.
- Doing the same thing twice by accident.
- An old action arriving after a newer one.

If their answer doesn't match the rule they already gave you,
understanding isn't solid yet — go back to where it broke down.

---

## Close the two gaps yourself, then get confirmation

Two answers are almost always weak, and you fix them by writing the
list yourself instead of asking again. Do this once, near the end —
it should take one round, not five.

**Gap 1 — scope.** Developers answer "what are we NOT doing?" with a
trade-off ("future calls stay visible") instead of a list of things
that aren't being built. Take everything they've decided and derive
the out-of-scope list for them, then ask them to confirm or correct
it. Write it as flat, plain bullets — each one a thing that is not
being built, not a justification. Include the things they never
mentioned but that a reader would assume are included (per-item
pages, personalisation, filtering by data you already hold, related
features that stay untouched, parts of the system the change only
reads from).

**Gap 2 — proof.** "How would you know it works?" usually covers only
the obvious happy path and misses whatever is most likely to break.
Propose the proof list yourself: one line per check, each a concrete
scenario → expected outcome, covering the golden path, every rule
they stated, the ordering/defaults, the exclusions, bad input, and
the access rules. Then ask them to confirm or correct it.

Format both as:

> **Gap 1 — scope.** <one sentence on what was missing.> Here's what's
> actually out of scope — confirm or correct:
> - …
>
> **Gap 2 — proof.** <one sentence on what was missing.> Proposed
> proof list:
> - …

Don't move on until they've confirmed or corrected both. What they
land on goes into the file verbatim.

---

## Done means

- They can explain the problem without using implementation words.
- What happens today is clear.
- What should happen is clear.
- Facts and guesses are clearly told apart.
- Every real decision has an owner.
- States/modes and how you move between them are clear.
- Edge cases have been walked through.
- Contradictions are resolved.
- What must always stay true is written down plainly.
- What's out of scope is written down plainly, as a confirmed list.
- The proof list (how we'll know it works) is confirmed, not vague.
- They can explain the whole thing back to you unprompted (LARGE), or
  they corrected-or-confirmed the drafted summary (SMALL/MEDIUM).
- Their answers to the stress-test scenarios match their own rules
  (LARGE; merged into the single closing message for MEDIUM).
- Nothing important is still a guess.

Only then say:

> **Comprehension gate passed.**

Don't design, code, or suggest implementation before this point.

---

## Save the result to a file

Once the gate passes, write everything down in one clean markdown file
so it can be reused later (for planning, for handing to another
person, or for a future session).

- Path: `docs/grilling/<short-topic-slug>.md` (create the folder if it
  doesn't exist). If the developer names a different path, use that
  instead.
- Keep the language exactly as simple as the conversation — no jargon.
- Structure:

```markdown
# <Problem title, plain language>

## What happens now
<plain description>

## What should happen instead
<plain description>

## Why this matters
<plain description>

## Who / what this affects
<list>

## States and how they change (if relevant)
<plain list or simple diagram like: submitted → confirmed>

## Rules
<the plain-language rules that decide behavior>

## Limits / must-respect constraints
<list>

## Out of scope
<list — things deliberately not being touched>

## Must always stay true
<list>

## Edge cases and what happens
<list of scenario → expected outcome>

## How we'll know it worked
<plain description>

## Open questions (if any remain by choice)
<list, or "none">

---

## Requirements (copy-paste ready)

### What we're building
- R1 — <one plain sentence, one requirement per line, numbered R1, R2, …>
- R2 — <…>

### What we touch
- <the parts of the system this change reads from or writes to>

### What we do NOT touch / out of scope
- <the confirmed out-of-scope list, one flat bullet each>

### How we'll know it works
1. <scenario → expected outcome>
2. <…>
```

- The **Requirements (copy-paste ready)** block is the whole point of
  the file for anyone who wasn't in the session. It must stand on its
  own: someone who reads only that block should know what's being
  built, what isn't, and how it gets checked. Plain sentences, no
  jargon, no code — short enough to paste straight into a GitHub
  issue, PR description, or commit body.
- Number the requirements `R1, R2, …`. Later phases refer back to
  these numbers, so don't renumber them afterwards.
- Tell the developer the file path once it's written, then refresh the
   map (see below).
- Don't put any code, framework names, or implementation details in
  this file — it's the problem, not the solution.

---

## Refresh the map

You just wrote something the map is built from, so bring it up to date
before moving on:

```bash
node ~/.claude/skills/map-me/map-me.mjs --brief
```

(If the skills were installed into this project rather than your home
directory, that's `.claude/skills/map-me/map-me.mjs`. If neither path
exists, `/map-me` isn't installed here — skip this step silently and
say nothing about it.)

`--brief` prints nothing at all unless something changed. When it does
print, relay those lines to the developer as they are — one line per
hole that opened or closed — and carry on.

**It is never a gate.** Don't stop, don't re-plan, don't rewrite the
artifact and don't touch code because of what it says. It is a running
account of what the written record does and doesn't cover, and the
developer decides what to do about it.

---

## The one rule that matters most

Depth must match stakes — don't rush a large problem, and don't pad a
small one. The goal is understanding so clear that building it becomes
the easy part, bought at the lowest price that actually buys it.

If they can't explain what should happen in plain words, they're not
ready to tell anyone — human or AI — how to build it.

The session ends when they say:

> "Yes. That's exactly it."

Then, and only then, move to the next phase.
