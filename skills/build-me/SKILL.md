---
name: build-me
description: >
  Implement a solution write-up (typically the markdown file produced by
  /solve-me) in this Laravel project, following existing project patterns
  and Laravel best practices. Cuts the work into commits itself, writes
  the commit plan to docs/build/<slug>.md, and gets the developer's
  approval before writing any code. Then builds one commit at a time,
  saying up front and afterwards why that commit is needed and which
  numbered requirement it serves, and stopping after each one for the
  developer to review and edit. Every piece of new logic gets a short
  plain-language comment explaining what it does and why that approach was
  picked — meant to be deleted once reviewed. Suggests a commit message
  after each commit. Always implements the option the developer already
  picked in the /solve-me file — never a different one. Use after
  /solve-me, when it's time to actually write code.
---

# Build Me — Implement, One Commit at a Time

Your job is to turn an already-decided solution into working Laravel code.
The thinking is done. Don't redesign it — build it.

---

## Input

You need a solution write-up before starting. Accept it as:

- A path to a markdown file (typically the file `/solve-me` produced at
  `docs/solutions/<topic>.md`), or
- The solution details pasted directly into the conversation.

Also read the matching problem write-up (`docs/grilling/<topic>.md`)
if it exists — that's where the numbered requirements (R1, R2, …) and
the out-of-scope list live. You need them to explain why each commit
exists and to avoid building something that was explicitly ruled out.

If you don't have one, ask for it. Don't invent a solution yourself —
that's what `/grill-me` and `/solve-me` are for. If the write-up looks
thin, contradictory, missing a clear recommendation for a piece, or
lists anything under "Open trade-offs", stop and say so instead of
guessing — ask the developer to rule on each open trade-off before
writing the plan.

**Use the option that was already picked.** Every piece in the
solve-me file has a line like `**Recommended: Option B**`. That's the
default — the developer ratifies it at ship-me's solution gate or,
failing that, when they approve this commit plan. Build that one, not
the one you personally think is best. If you genuinely believe a
different option would be better, say so out loud and wait for a
decision. Never silently swap it.

---

## Step 1 — Learn how this project already does things

Before writing anything, look at how similar things are already built
in this codebase: naming, folder placement, how classes are structured
(actions, requests, resources, jobs, policies, etc.), how validation is
done, how tests are written, how errors are handled. Use CodeGraph or
search the codebase for the closest existing example to each piece
you're about to build.

New code should look like it was written by the same person who wrote
the rest of the app — same conventions, same idioms, same file
locations. Don't introduce a new pattern when an existing one already
covers the case.

---

## Step 2 — Cut the work into commits, write the plan down, get it approved

Deciding the commit boundaries is **this phase's job** — `/solve-me`
deliberately doesn't do it. Its pieces are units of thinking; you turn
them into units of committing, against the real codebase.

Use the pieces from the solve-me file as your starting point — don't
re-split the problem itself. Commit order follows the piece order —
commit 1 comes from piece 1, and so on. Use the "How the pieces fit
together" section only to sanity-check that this order is buildable;
if it isn't, that's the stop-and-ask case below, not a license to
reorder. A piece may be split into several commits (1a, 1b), but
pieces are never resequenced.

Keep commits small: one commit should be reviewable in a few minutes,
and should leave the app in a working state.

Write the plan to `docs/build/<same-slug>.md` (create the folder if
needed), then show it in the conversation. If no ship-me solution gate
happened before this (a hand-run pipeline), say above the plan that
approving it also ratifies the option picks listed under **Builds:**.

```markdown
# Commit plan — <topic>

Solution: docs/solutions/<slug>.md
Problem:  docs/grilling/<slug>.md

## Commit 1 — <short imperative title>
- **From:** piece 1 of the solution
- **Builds:** Option <X> of piece 1 — <one-line reason it won>
- **Serves:** R2, R5
- **Why we need it:** <one or two plain sentences, straight from the
  requirement — what the app can't do without this>
- **Touches:** <files / areas>
- **Done when:** <the observable thing that is true afterwards>

## Commit 2 — …
```

Then **stop and ask the developer to approve the plan** — approve,
reorder, merge, split, or drop commits. Do not write a single line of
code before they've said yes. If they change it, update the file
before starting.

If the plan is a single commit, fold the two gates into one: present
the plan and ask "approve and build it?" — one yes covers both.

If a commit genuinely can't be built in its slot because it needs
something a later piece creates, say so now, name what it needs, and
let the developer decide — never resolve it silently mid-build.

---

## Step 3 — Build one commit

For the current commit only:

0. Open with two or three sentences: **what this commit does and why
   we need it**, quoting the requirement numbers it serves (R2, R5)
   from the grill-me file. If you can't tie it to a requirement, don't
   build it — ask the developer what it's for.
1. Write the code needed for that commit, following this project's
   existing patterns (see Step 1) and standard Laravel best practices.
2. Above or beside any non-obvious piece of logic, leave a short
   comment in plain, easy language explaining two things: what this
   code does, and why this approach was picked over the alternatives
   from the solve-me file. Keep it to one or two short lines.
   Prefix every one of these with `// WHY:` (or the equivalent comment
   syntax for the file type) so they're easy to find and delete later.
   Example:

   ```php
   // WHY: checks the confirm token before saving, so a stale link
   // can never overwrite a newer email change.
   ```

   These comments are scaffolding for review, not permanent
   documentation — the developer will delete them once they've read
   and understood the code. Don't write normal doc comments in
   addition to these; the WHY comment is enough.
3. Do not touch files outside this commit's scope.
4. Do not start the next commit yet.

---

## Step 4 — Wrap up the commit

Once the commit's code is written:

1. Briefly tell the developer what you built and where (file paths),
   and restate in one or two plain sentences **why this was needed** —
   which requirement (R-number) it satisfies and what the app can now
   do that it couldn't before. Short: three lines, not an essay.
2. Point out anything you're unsure about or any assumption you had to
   make that wasn't covered in the solve-me file.
3. Suggest a commit message for this commit, matching this repo's
   existing commit style (check `git log` if unsure). Present it as a
   suggestion only — do not run `git commit` yourself unless the
   developer explicitly asks you to.
4. **Stop.** Wait for the developer to review, edit, or approve before
   moving to the next commit. Never chain commits on your own
   initiative, even if the plan is long. If the developer explicitly
   pre-approves a named range ("build 3 through 5 without stopping"),
   honor it: build them in sequence, keep the per-commit WHY comments
   and R-number framing, and give the per-commit summaries together at
   the end of the range.

When the developer comes back (possibly with edits, possibly just
"next"), pick up with the next commit in the plan, re-checking Step 1's
conventions against anything they changed.

---

## Rules

- Build the recommended option from solve-me, exactly as chosen. Flag
  disagreements; don't act on them unilaterally.
- The commit plan is written to `docs/build/<slug>.md` and explicitly
  approved by the developer before any code is written.
- Every commit names the requirement(s) it serves, before and after
  it's built. A commit that serves no requirement doesn't get built.
- Nothing on the out-of-scope list gets built, however small or
  convenient it looks while you're already in the file.
- One commit, one stop, by default. Never chain commits on your own
  initiative — but if the developer explicitly names a range to batch,
  that's their pace to set, and every per-commit artifact (WHY
  comments, R-framing, summary, suggested message) still gets made.
- Every non-obvious piece of logic gets a `// WHY:` comment in plain
  language. Skip it only for code so simple the reasoning is obvious
  (e.g. a straightforward getter).
- Match existing project conventions over generic "best practice" when
  the two conflict — consistency with the codebase wins.
- Never commit, push, or run destructive commands on your own — only
  suggest the commit message.
- Don't add extra features, refactors, or cleanup beyond what the
  current commit needs.
- Don't write unit tests or feature tests, even if that's normally
  best practice for this kind of change. `/verify-me` checks the
  build against the real app afterward and lists what tests are
  actually needed — writing them here would duplicate that work.

---

## Done means

- The commit plan exists at `docs/build/<slug>.md` and was approved by
  the developer before building started.
- Every commit from the plan has been built, reviewed, and approved.
- Every commit paused for review before the next one started.
- Every commit was introduced and closed with a short plain-language
  reason tied to a requirement number.
- All non-obvious logic has a short `// WHY:` comment in plain
  language, tied to the choice made in the solve-me file.
- A commit message was suggested for every commit.
- No option was implemented other than the one already recommended in
  the solve-me file, unless the developer explicitly changed it.