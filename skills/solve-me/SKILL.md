---
name: solve-me
description: >
  Turn an understood problem into a solution, using divide-and-conquer.
  Takes a problem write-up (typically the markdown file produced by
  /grill-me) and breaks it into smaller sub-problems. For each sub-problem,
  proposes every genuinely different solution that actually exists —
  three or more where there's real design freedom, one honestly-explained
  forced answer where there isn't — plus one recommendation, in plain
  language with no framework or tech-stack names.
  Saves the result to a markdown file. Use after /grill-me, before writing
  any code.
---

# Solve Me — Divide, Compare, Recommend

Your job is to design a solution on paper. No code. No framework names.
Plain language only.

You are not allowed to say "use Laravel," "add a migration," "create an
Eloquent model," "use Redis," or name any specific library, framework,
or tool. Describe things at the level of: what data is stored, what
steps happen, what checks are made, in what order, and why. Anyone
reading it should be able to build it in any language or stack.

**Write in plain, everyday language.** Short sentences. Concrete words.
If a smart non-technical person couldn't follow a paragraph, rewrite it
simpler.

---

## Input

You need a clear problem write-up before you can start. Accept it as:

- A path to a markdown file (e.g. the file `/grill-me` produced at
  `docs/grilling/<topic>.md`), or
- Problem details pasted directly into the conversation.

If neither is available, ask the developer for one. Don't invent the
problem yourself — a fuzzy or assumed problem produces a fuzzy solution.

Read the problem write-up fully before doing anything else. Pull out:
the rules, the limits, the edge cases, what must always stay true, and
what's out of scope. These constrain every solution you propose —
mention constraints, don't restate the whole doc.

---

## Step 1 — Split the problem (divide)

Break the problem into smaller pieces that can mostly be solved on
their own. Good ways to split:

- **By stage** — the steps something goes through, in order (e.g.
  "receiving the request" → "checking if it's allowed" → "recording
  the result" → "telling people about it").
- **By concern** — different jobs that don't depend on each other's
  internal details (e.g. "deciding who's allowed" vs. "handling two
  people trying at once" vs. "showing the result to the user").
- **By actor** — different pieces of behavior for different people or
  systems involved.

Rules for splitting:

- Each piece should be small enough to explain in a few sentences.
- Each piece should be understandable on its own, without re-explaining
  the whole problem.
- Don't split something that's genuinely one decision into two pieces
  just to hit a number — a forced split produces fake options later.
- Name each piece with a short, plain title (a question it answers),
  not a technical label.
- Number the pieces (Piece 1, Piece 2, …) in the order listed —
  `/build-me`'s commit plan refers to these numbers, so never renumber
  them afterwards.

List the pieces and briefly say why you split it that way. If the
problem is small enough to be one piece, say so and treat it as a
single piece — don't force a split.

---

## Step 2 — Solve each piece (conquer)

For every piece from Step 1, propose **as many genuinely different
ways to solve it as actually exist**. Different means the underlying
approach differs, not just small details. A piece with real design
freedom gets three or more options. A piece with a genuinely forced
answer gets one option plus two lines on why no real alternative
exists. Never invent an option you would argue against — a fake option
costs the developer reading time at the approval gate and buys
nothing.

For each option, describe in plain language:

- **How it works** — the idea, step by step, framework-free.
- **What it's good at** — the real benefit.
- **What it costs** — the real downside or risk.
- **When it breaks down** — a case from the problem's edge cases where
  this option struggles or needs extra care.

Then pick one and say so clearly:

> **Recommended: Option B**
> **Why:** [one or two plain sentences, tied to the problem's actual
> rules/constraints/edge cases — not "it's simpler" without saying why
> that matters here]

The recommendation must be justified using facts from the problem
write-up (the rules, limits, and edge cases), not personal taste.

---

## Step 3 — Put the pieces back together (combine)

Once every piece has a recommended solution, check that they actually
fit together:

- Walk through the normal, everyday case end to end using the chosen
  options. Does it make sense as one story?
- Walk through each edge case from the problem write-up. Does the
  combination still produce the right outcome?
- Check every "must always stay true" rule from the problem write-up
  against the combined solution. If any one breaks, go back and pick a
  different option for the piece that caused it — don't patch around it
  with a special case unless the problem write-up allows for one.

If two chosen options conflict with each other (e.g. one assumes
something happens instantly, another assumes it can be delayed), stop
and resolve it before writing the final file. Say plainly what the
conflict is and how it's resolved.

---

## Step 4 — Save the result to a file

Write one markdown file with the full breakdown.

- Path: `docs/solutions/<short-topic-slug>.md` (create the folder if it
  doesn't exist). Reuse the same topic slug as the matching `/grill-me`
  file when there is one, so the two are easy to pair up. If the
  developer names a different path, use that instead.
- No code blocks with real syntax. No framework, library, database, or
  tool names anywhere in the file.
- Structure:

```markdown
# <Problem title, plain language>

## Source problem
<link or path to the /grill-me file this is based on, or a short
plain-language restatement if none exists>

## How this was split
<short list of the pieces, and one line each on why split this way —
or "not split — small enough to solve directly" if Step 1 kept it whole>

## Piece 1 — <title, as a plain question>
**Serves:** R1, R3 <the requirement numbers from the /grill-me file this
piece exists to satisfy — if a piece serves none of them, it shouldn't
be here>

### Option A — <short plain name>
- How it works: ...
- Good at: ...
- Costs: ...
- Breaks down when: ...

### Option B — <short plain name>
...

### Option C — <short plain name>
...

**Recommended: Option <X>**
**Why:** ...

## Piece 2 — <title, as a plain question>
<same shape as above>

## How the pieces fit together
<plain walkthrough of the normal case using the recommended options>

## Edge cases, checked against the combined solution
<list: edge case → what happens>

## Rules confirmed to still hold
<list of "must always stay true" items from the problem write-up, each
marked as holding or, if not, how the solution was adjusted>

## Open trade-offs
<anything the developer should weigh in on before implementation, or
"none">
```

- Tell the developer the file path once it's written.

---

## What this skill does NOT do

- It does not write code.
- It does not pick a framework, library, or database technology.
- It does not split the work into commits. The pieces here are units
  of *thinking*, not units of *committing*. How the work is cut into
  commits is decided in `/build-me`, with the developer, against the
  real codebase. Never label a piece "commit 1", never suggest a
  commit order, never suggest commit messages.
- It does not re-interrogate the problem — if the problem write-up is
  thin, vague, or missing constraints, say so and suggest running
  `/grill-me` first rather than guessing to fill the gap.
- It does not pad the option count — no token variations of the same
  idea, no strawman alternatives. Real distinct approaches only, and a
  genuinely forced answer is presented as exactly that.
- It does not include writing unit tests or feature tests as part of
  any option, piece, or recommendation. Never propose "add tests" as a
  solution piece and never treat test coverage as a trade-off between
  options. Verifying the build is `/verify-me`'s job, done later
  against the real running app — not something to design here.

---

## Done means

- The problem has been split into clear, plain-language pieces (or
  kept whole, if genuinely small).
- Every piece shows its genuine option space — one, two, or more real,
  different options — with padding forbidden, and any one-option piece
  explains why no real alternative exists.
- Every option is explained in plain, framework-free language with a
  real cost and a real benefit.
- Every piece has one clearly recommended option, justified against
  the problem's actual rules and edge cases.
- The recommended options have been checked together against the
  normal case, the edge cases, and the "must always stay true" rules.
- Any conflict between pieces has been resolved and explained.
- Everything has been saved to one markdown file at a path the
  developer knows.

Then hand off — implementation can begin from this file.