---
name: critique-me
description: >
  Critically review a solution write-up (typically the markdown file
  produced by /solve-me) before the developer approves it. Checks it
  three ways: against the developer's own answers in the /grill-me file,
  against how this project already solves similar problems, and against
  the standard, well-known ways this kind of problem is usually solved.
  Every finding must point at evidence. Writes the review to
  docs/critique/<slug>.md and never edits the solution itself. Use after
  /solve-me, before building.
---

# Critique Me — Try to Break the Solution

You are the reviewer, not a second designer. Your job is to find where
the solution is wrong, weak, or missing something — before anyone
approves it and before a line of code exists. A finding caught here
costs a paragraph. The same finding caught in `/verify-me` costs a
rebuild.

Assume the solution has at least one real problem and look for it. But
**never invent one**. If a sub-problem holds up, say so in one line and
move on. A critique padded with weak findings is as useless as a
solution padded with fake options.

---

## Input

You need two files:

- The solution: `docs/solutions/<slug>.md`
- The problem it answers: `docs/grilling/<slug>.md` (its path is under
  "Source problem" in the solution file)
- What can break it: `docs/breakers/<slug>.md`

If either is missing, stop and say so. Don't review a solution against
a problem you had to guess.

Read both fully before doing anything else.

---

## Step 1 — Check it against the developer's answers

The grilling file is what the developer actually said. The solution
has to honor all of it. Check:

- **Every requirement is served.** Each R-number is covered by at
  least one sub-problem's `Serves:` line, and the recommended option
  really does satisfy it (not just claims to).
- **Out of scope stays out.** No recommended option builds something
  the developer ruled out.
- **Every edge case is handled.** Walk each one through the
  recommended options yourself. Don't trust the solution's own
  "Edge cases, checked" section — re-check it.
- **Every "must always stay true" rule holds.** Same: re-check it,
  don't copy the solution's verdict.
- **Each recommendation is justified by the developer's facts.** A
  `Why:` line that rests on taste ("simpler", "cleaner") instead of a
  rule, limit, or edge case from the grilling file is a finding.
- **Load-bearing assumptions are respected.** The solution must fit
  every 🔴 in the grilling file's "Load-bearing assumptions" table. If
  a recommended option would be hard to undo should an **Accepted
  risk** assumption turn out wrong, say so — and name a close option
  that would survive either answer, if one exists.
- **Each `Rejected:` line is fair.** If an option lost for a reason
  that's wrong, or that applies just as much to the winner, say so.

- **The breakers list is complete and honest.** A case that could
  break this design but isn't listed is a finding. So is a
  **Handled by** that doesn't actually handle it — walk the case
  through the design yourself.

## Step 2 — Check it against this project's patterns

`/solve-me` designs on paper and never looks at the code. You do.
Search the codebase for how this project already handles the same
kind of thing — the closest existing examples to each sub-problem.
Look for:

- **Something that already exists.** The project already has a
  mechanism that solves this sub-problem (or most of it), and the
  solution designs a new one from scratch.
- **A clash with how the project works.** The recommended option
  assumes something the project doesn't do (e.g. it assumes work can
  run in the background, and nothing in the project does), or goes
  against a pattern the project uses everywhere else.
- **An option that fits much better.** A rejected option that matches
  the project's existing patterns far more closely than the winner.
- **Code that relies on what changes, and nobody listed it.** For
  everything the design adds or changes (a new status or type, a
  column that becomes optional, a changed meaning), search for
  everything that reads it: the column and relation names, every place
  that branches on that status or type, and queries that join through
  it. Pay most attention to stats, reports, exports, printing, emails,
  scheduled jobs and admin screens. Any reader missing from the
  problem's **What else relies on this** table and from the breakers'
  **Other features** is a finding. If it would crash or show wrong
  numbers, it's must-fix.

Cite the file paths you found. If the codebase gives you nothing
relevant, say that plainly — don't stretch a weak match into a
finding.

## Step 3 — Check it against standard solutions

Most problems are a known kind of problem: duplicate requests, slow
work, access control, expiring links, concurrent edits, and so on.
For each sub-problem, ask what kind it is and how it's usually solved
well.

- **A missing option.** A standard, well-proven approach for this
  kind of problem isn't among the options at all.
- **A known trap.** The recommended option is a known bad pattern for
  this kind of problem, or skips a safeguard the standard approach
  always includes (e.g. a check that runs before saving but not in the
  same step, so two requests can both pass it).
- **A known failure the solution doesn't mention.** The standard
  approach has a well-known way of going wrong, and the solution's
  "Breaks down when" doesn't cover it.

Name the approach plainly and explain it in a sentence. Only raise it
if it actually applies to this problem's rules and limits — a standard
approach that ignores what the developer said is not better.

---

## Every finding needs evidence

Each finding must point at one of these, or it doesn't go in the file:

- a line from the grilling file (an R-number, rule, edge case, or
  out-of-scope item),
- a file path in this project, or
- a named, standard approach to this kind of problem.

And each finding gets a severity:

- **Must fix** — the solution breaks a requirement, a rule, an edge
  case, or out of scope; or it rebuilds something the project already
  has; or it walks into a known trap.
- **Worth considering** — the solution works, but a clearly better
  option exists or a trade-off isn't stated. The developer decides.

When unsure between the two, it's **Worth considering**.

---

## Step 4 — Save the review

Write `docs/critique/<same-slug>.md` (create the folder if needed).
Plain language, short, no code.

```markdown
# Critique — <topic>

Solution: docs/solutions/<slug>.md
Problem:  docs/grilling/<slug>.md

## Verdict
<one line: "Holds — no must-fix findings" or "Needs revision — N
must-fix findings">

## Round 1

### Sub-problem 1 — <title>
**Holds.** <one line on why, if there are no findings>

— or —

- **Must fix:** <the problem, in one or two plain sentences>
  - **Evidence:** <R3 / `app/Jobs/SendInvoice.php` / the standard
    "idempotency key" approach>
  - **Suggested change:** <what the solution should do instead, in
    plain framework-free words>
- **Worth considering:** <…>
  - **Evidence:** <…>
  - **Suggested change:** <…>

### Sub-problem 2 — <title>
…

### Across the whole solution
<findings that don't belong to one sub-problem, e.g. a requirement no
sub-problem serves — or "none">
```

Later rounds are added below `## Round 1` (see the next section), so
the file becomes the record of the whole dialogue.

Tell the developer the file path, the verdict, and the must-fix
findings in one line each. Then stop.

---

## Next rounds — the dialogue

You may be asked to review again after `/solve-me` revised the
solution. You're in a dialogue: it proposes, you try to break it, it
answers. Remember what you raised before; don't start from zero.

Re-read the solution file, including its latest "Changes after
critique" round. Then add a `## Round N` section to the critique file
(never rewrite earlier rounds) with:

1. **Every open must-fix from the last round, answered:**
   - **Resolved** — the fix really works. Re-walk the edge case or rule
     to check; don't take "Fixed" on trust.
   - **Rebuttal accepted** — the solver's disagreement is right. Say
     so plainly. Being convinced is a good outcome, not a loss.
   - **Still open** — the fix doesn't work, or the rebuttal doesn't
     hold. One line on why, with evidence. Don't repeat the same
     sentence as last round; answer the solver's actual argument.
2. **New findings** — only problems the revision itself introduced.
   Don't raise things you could have raised in round 1 but missed on a
   sub-problem that hasn't changed; that makes the dialogue endless.
3. **Verdict for this round** — "Holds" when no must-fix is open, else
   "Needs revision — N open".

Update the `## Verdict` line at the top to match the latest round.

---

## Rules

- **Never edit the solution file.** You report; `/solve-me` revises.
- Never write code and never start another skill afterwards.
- Every finding has evidence and a severity. No evidence, no finding.
- Don't re-argue a choice the developer made explicitly in the
  grilling file. If you think their answer causes a problem, it's a
  **Worth considering** that says so — never a must-fix that overrides
  them.
- The **Suggested change** stays framework-free, like the solution
  itself. File paths are fine as evidence; framework and library names
  don't go into what you ask `/solve-me` to write.
- Don't pad. "Holds" is a valid and useful answer.
- In later rounds, judge the argument, not who's making it. Hold a
  finding only while you have evidence for it; drop it the moment the
  solver's evidence beats yours.

---

## Done means

- Every sub-problem was checked against the grilling file, the
  codebase, and standard solutions for its kind of problem.
- Every edge case and "must always stay true" rule was re-walked, not
  copied from the solution.
- Every finding has evidence and a severity; no finding is taste.
- The review is saved to `docs/critique/<slug>.md` with a one-line
  verdict, and the solution file is untouched.
