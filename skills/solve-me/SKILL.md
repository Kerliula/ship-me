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
  Saves the result to a markdown file, plus a second file listing
  everything that could break the feature — inputs, data and scenarios —
  so /build-me handles every one. Use after /grill-me, before writing
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

### Revising after a critique

If you're also given a critique file (`docs/critique/<slug>.md`, from
`/critique-me`), you're in a dialogue with the critic, not starting
over. This can happen several rounds in a row. Each round, read the
latest round of the critique, then:

- Answer every open **Must fix** finding, one of two ways:
  - **Fixed** — change the solution.
  - **Disagree** — say in one or two lines why the finding is wrong,
    with evidence (the grilling file, or why the standard approach
    doesn't fit here). Don't give in just to end the dialogue: a
    wrong fix is worse than an honest disagreement the developer
    settles.
  Never ignore one.
- Take a **Worth considering** finding only if it's clearly better;
  otherwise leave it for the developer.
- Keep the sub-problem numbers. Change only what a finding touches. A
  genuinely new sub-problem goes at the end with the next number.
- Re-run Step 3 (put it back together) on the result, and update
  `docs/breakers/<slug>.md` to match — add, fix or re-point cases.
- Add this round to a section at the end, before Open trade-offs:

```markdown
## Changes after critique

### Round 1
- <finding, in a few words> → Fixed: <what changed>
- <finding, in a few words> → Disagree: <why, with evidence>

### Round 2
- …
```

---

## Step 1 — Split the problem (divide)

Break the problem into smaller sub-problems that can mostly be solved on
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

- Each sub-problem should be small enough to explain in a few sentences.
- Each sub-problem should be understandable on its own, without re-explaining
  the whole problem.
- Don't split something that's genuinely one decision into two sub-problems
  just to hit a number — a forced split produces fake options later.
- Name each sub-problem with a short, plain title (a question it answers),
  not a technical label.
- Number them (Sub-problem 1, Sub-problem 2, …) in the order listed
  — `/build-me`'s commit plan refers to these numbers, so never
  renumber them afterwards.

List the sub-problems and briefly say why you split it that way. If the
problem is small enough to be one sub-problem, say so and treat it as a
single sub-problem — don't force a split.

---

## Step 2 — Solve each sub-problem (conquer)

For every sub-problem from Step 1, propose **as many genuinely different
ways to solve it as actually exist**. Different means the underlying
approach differs, not just small details. A sub-problem with real design
freedom gets three or more options. A sub-problem with a genuinely forced
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

Finally, go back to **every option you did not pick** and give it one
line saying why it lost:

> **Rejected:** [the single reason this one is not the answer]

This is not a summary of the Costs and Breaks-down-when bullets — it's
the one sentence someone reading this in six months needs. The reason
an option lost is the part of the design that decays fastest and the
part people most often relitigate. One line, stated once, on the option
itself. Never leave a losing option without one.

---

## Step 3 — Put it back together (combine)

Once every sub-problem has a recommended solution, check that they actually
fit together:

- Walk through the normal, everyday case end to end using the chosen
  options. Does it make sense as one story?
- Walk through each edge case from the problem write-up. Does the
  combination still produce the right outcome?
- Check every "must always stay true" rule from the problem write-up
  against the combined solution. If any one breaks, go back and pick a
  different option for the sub-problem that caused it — don't patch around it
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
<short list of the sub-problems, and one line each on why split this way —
or "not split — small enough to solve directly" if Step 1 kept it whole>

## Sub-problem 1 — <title, as a plain question>
**Serves:** R1, R3 <the requirement numbers from the /grill-me file
this sub-problem exists to satisfy — if it serves none of them, it
shouldn't be here>

### Option A — <short plain name>
- How it works: ...
- Good at: ...
- Costs: ...
- Breaks down when: ...

**Rejected:** <one line — why this one is not the answer>

### Option B — <short plain name>
...

**Rejected:** <one line — why this one is not the answer>

### Option C — <short plain name>
...

**Recommended: Option <X>**
**Why:** ...

## Sub-problem 2 — <title, as a plain question>
<same shape as above>

## How the sub-problems fit together
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

## Step 5 — List what can break it

Write a second file: `docs/breakers/<same-slug>.md`. It's the list of
everything that could make this feature fail, so `/build-me` can make
sure every one is handled and `/verify-me` can try every one against
the real app. Think like someone trying to break it on purpose, and
like a tired user on a bad day.

Go through three groups, and for each, think about the chosen options
specifically — what could break **this** design, not features in
general:

- **Input** — what a person or another system could send: empty,
  missing, too long, too big, wrong type, wrong format, special
  characters, negative or zero, exactly at a limit and one past it,
  duplicates, something that looks valid but refers to a thing that
  doesn't exist or belongs to someone else.
- **Data** — what's already stored or will be: none at all, one, a
  huge amount, old records created before this feature, missing or
  half-filled values, duplicates, records in an unexpected state,
  records that were deleted or changed mid-way.
- **Scenarios** — how things happen in time: the same action twice,
  two people at once, steps arriving out of order, a failure halfway
  through, a retry after a failure, a timeout, something another
  system does or doesn't do, someone without permission, someone whose
  permission changes mid-way, the state changing while someone is
  looking at an old screen.

Only list what really applies here — every item must be a concrete
case for this feature, not a generic checklist entry. Number them
`B1, B2, …` so later phases can refer to them.

```markdown
# What can break — <topic>

Solution: docs/solutions/<slug>.md
Problem:  docs/grilling/<slug>.md

## Input
- **B1 — <short name>:** <the concrete case>
  - **Would break:** <R-number or rule it threatens>
  - **Handled by:** <sub-problem N, option X — how it holds up>
  - **Risk:** 🔴 high / 🟡 medium / 🟢 low

## Data
- **B4 — …**

## Scenarios
- **B7 — …**
```

- **Handled by** must point at the design. If nothing in the solution
  handles a case, don't leave it blank — go back and fix the solution
  (or add it to Open trade-offs if it needs the developer), then fill
  it in.
- 🔴 = it breaks a "must always stay true" rule or loses/leaks data.
  🟡 = it breaks a requirement for some people. 🟢 = an unpleasant but
  harmless outcome.
- Plain language, no framework names — same rules as the solution.
- Tell the developer the file path once it's written.

---

## What this skill does NOT do

- It does not write code.
- It does not pick a framework, library, or database technology.
- It does not split the work into commits. The sub-problems here are units
  of *thinking*, not units of *committing*. How the work is cut into
  commits is decided in `/build-me`, with the developer, against the
  real codebase. Never label a sub-problem "commit 1", never suggest a
  commit order, never suggest commit messages.
- It does not re-interrogate the problem — if the problem write-up is
  thin, vague, or missing constraints, say so and suggest running
  `/grill-me` first rather than guessing to fill the gap.
- It does not pad the option count — no token variations of the same
  idea, no strawman alternatives. Real distinct approaches only, and a
  genuinely forced answer is presented as exactly that.
- It does not include writing unit tests or feature tests as part of
  any option, sub-problem, or recommendation. Never propose "add tests" as a
  solution sub-problem and never treat test coverage as a trade-off between
  options. Verifying the build is `/verify-me`'s job, done later
  against the real running app — not something to design here.

---

## Done means

- The problem has been split into clear, plain-language sub-problems (or
  kept whole, if genuinely small).
- Every sub-problem shows its genuine option space — one, two, or more real,
  different options — with padding forbidden, and any one-option sub-problem
  explains why no real alternative exists.
- Every option is explained in plain, framework-free language with a
  real cost and a real benefit.
- Every sub-problem has one clearly recommended option, justified against
  the problem's actual rules and edge cases.
- Every option that was not picked carries a one-line **Rejected:**
  reason. The recommended option carries none — its reason is the
  **Why:** line.
- The recommended options have been checked together against the
  normal case, the edge cases, and the "must always stay true" rules.
- Any conflict between sub-problems has been resolved and explained.
- Everything has been saved to one markdown file at a path the
  developer knows.
- `docs/breakers/<slug>.md` lists every concrete input, data and
  scenario case that could break this design, numbered B1, B2, …, and
  every one points at the part of the solution that handles it.

Then hand off — implementation can begin from this file.