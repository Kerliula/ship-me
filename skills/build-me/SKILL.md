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
  developer to review and edit. Every piece of new logic gets a one-line
  plain-language comment saying why it's there — meant to be deleted
  once reviewed. Suggests a commit message
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
thin, contradictory, missing a clear recommendation for a sub-problem, or
lists anything under "Open trade-offs", stop and say so instead of
guessing — ask the developer to rule on each open trade-off before
writing the plan.

**Use the option that was already picked.** Every sub-problem in the
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
search the codebase for the closest existing example to each sub-problem
you're about to build.

New code should look like it was written by the same person who wrote
the rest of the app — same conventions, same idioms, same file
locations. Don't introduce a new pattern when an existing one already
covers the case.

---

## Step 2 — Cut the work into commits, write the plan down, get it approved

Deciding the commit boundaries is **this phase's job** — `/solve-me`
deliberately doesn't do it. Its sub-problems are units of thinking; you turn
them into units of committing, against the real codebase.

Use the sub-problems from the solve-me file as your starting point — don't
re-split the problem itself. Commit order follows the sub-problem order —
commit 1 comes from sub-problem 1, and so on. Use the "How the sub-problems fit
together" section only to sanity-check that this order is buildable;
if it isn't, that's the stop-and-ask case below, not a license to
reorder. A sub-problem may be split into several commits (1a, 1b), but
sub-problems are never resequenced.

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
- **From:** sub-problem 1 of the solution
- **Builds:** Option <X> of sub-problem 1 — <one-line reason it won>
- **Serves:** R2, R5
- **Handles:** B1, B4 <the cases from docs/breakers/<slug>.md this
  commit makes safe>
- **Why we need it:** <one or two plain sentences, straight from the
  requirement — what the app can't do without this>
- **Touches:** <files / areas — prose is fine here; this line gets
  rewritten with real paths once the commit is built>
- **Done when:** <the observable thing that is true afterwards>
- **Unplanned:** _(filled in after the commit is built — leave it)_

## Commit 2 — …
```

The plan is also the only durable record of what happened, so two of
those lines get rewritten later rather than staying as they were
approved — see Step 4.

### Draw the big picture

Right after the plan, draw one diagram of what the whole build does to
the codebase: the database tables and the files, grouped by the
project's own layers, each tagged with the commit that creates or
changes it. The developer should see at a glance which files and
tables this feature touches, before approving and again after every
commit (Step 4).

**Content:**

- **Layers come from this project**, as learned in Step 1, in the
  order data flows: database first, then models, then background work
  and HTTP side by side if they're parallel, then the front end. Use
  the project's real layer names; skip layers the build doesn't touch.
- **Database layer:** every table the build creates or changes, with
  its key columns and relations (`user_id → users`). New columns on an
  existing table are listed on their own. Tables that are only read
  are listed once, marked `(read only)`.
- **Every other layer:** one line per file, as a path relative to the
  repo root (shorten the folder only if it won't fit, never the file
  name). Add a sub-line only when it matters for the picture — a
  relation, a route, the job's trigger.
- **Mark each item:** `+` new, `~` changed, `·` used but unchanged.
- **Tag each item with the commits that touch it**, `[2]` or `[1] [3]`,
  and a status after the tags:
  - `(Done)` — built and approved
  - `(◄ This commit)` — just built, waiting for review
  - `(Next)` — the one that comes after
  - nothing — still planned
  - a plan change right there, e.g. `(Moved earlier)`, `(Split)`

Before the first commit, paths come from the plan's best guess using
the project's conventions. After each commit, use the real paths from
its `Touches:` line — add files that weren't planned, drop ones that
never got touched.

**Format:**

1. Output it strictly inside a ```` ```text ```` code block.
2. Use standard Unicode box-drawing characters (`┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼`)
   and flow arrows (`▼`, `►`).
3. Align every vertical line and corner joint on a fixed monospace
   grid. Every row of a box must be exactly as wide as its top edge —
   count the characters. Keep it under 80 columns; wrap a long path's
   tags onto the next line rather than widening the box.
4. One box per layer, each with a numbered header in capitals
   (e.g. `1. DATABASE`).
5. Keep box sizes uniform: full-width boxes for layers everything
   flows through, equal-width boxes side by side for parallel layers.
   Every arrow starts from a `┬` on a box edge — never from empty
   space. When side-by-side boxes feed one box below, join their
   arrows with a connector line (`└────┬────┘`) and send one arrow on.

Example of the expected shape (after commit 4 of 5):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 1. DATABASE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  + export_requests                                   [1] (Done)             │
│      id · user_id → users · contact_list_id → contact_lists                 │
│      state · file_path · failure_reason · created_at                        │
│  · contact_lists, contacts                           (read only)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  2. MODELS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  + app/Models/ExportRequest.php                      [1] [2] (Done)         │
│      belongsTo User · belongsTo ContactList                                 │
└──────────────────┬───────────────────────────────────────┬──────────────────┘
                   │                                       │
                   ▼                                       ▼
┌────────────────────────────────────┐   ┌────────────────────────────────────┐
│ 3. BACKGROUND WORK                 │   │ 4. HTTP                            │
├────────────────────────────────────┤   ├────────────────────────────────────┤
│ + app/Jobs/BuildContactExport.php  │   │ ~ ContactExportController.php      │
│     [2] (Done)                     │   │     [1] [3] (Done)                 │
│ ~ config/filesystems.php           │   │     [4] (◄ This commit)            │
│     [2] (Done)                     │   │ + ContactExportDownloadController  │
│ + app/Console/Commands/            │   │     [5] (Next)                     │
│     PurgeExpiredExports.php  [5]   │   │ + ExportRequestPolicy.php  [5]     │
│                                    │   │ ~ routes/web.php  [3] (Done)       │
└──────────────────┬─────────────────┘   └──────────────────┬─────────────────┘
                   │                                       │
                   └───────────────────┬───────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 5. FRONT END                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  + resources/js/contacts/export-status.js            [3] (Done)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Save the diagram in `docs/build/<slug>.md` under a `## Big picture`
heading, right below the `Problem:` line, and keep it current there:
every time you re-draw it, replace the saved one.

Before asking for approval, check the plan against
`docs/breakers/<slug>.md`: every B-number must appear in some commit's
`Handles:` line. List any that don't, and ask the developer whether to
add them to a commit or knowingly leave them out.

Then **stop and ask the developer to approve the plan** — approve,
reorder, merge, split, or drop commits. Do not write a single line of
code before they've said yes. If they change it, update the file
before starting.

If the plan is a single commit, fold the two gates into one: present
the plan and ask "approve and build it?" — one yes covers both.

If a commit genuinely can't be built in its slot because it needs
something a later sub-problem creates, say so now, name what it needs, and
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
   `// WHY:` comment (or the equivalent comment syntax for the file
   type) so it's easy to find and delete later. It should be quick to
   read, like a note a teammate leaves in the margin. Rules:

   - **One line, two at most.** About 15 words. If it needs more, the
     reason is too tangled: say only the main one.
   - **Say the reason, not the code.** The reader can see *what* the
     line does. Tell them what goes wrong without it, or what it
     protects.
   - **Plain words.** Use words a new teammate would know. No jargon,
     no requirement numbers, no names of options that were rejected.
   - **One idea per comment.** No "and also", no chain of clauses.
   - **Stay accurate.** Shorter must not mean vaguer or wrong. If a
     simple version would be misleading, keep the detail that matters
     and drop the rest.

   Examples:

   ```php
   // Too long:
   // WHY: hands back the export already running instead of refusing the
   // second click, so impatient double-clicking looks the same as one
   // click. Refusing would satisfy R3 too, but turns ordinary behavior
   // into an error the person has to understand.

   // Good:
   // WHY: a second click returns the running export, so double-clicks aren't errors.

   // Good:
   // WHY: check the token first, so an old link can't overwrite a newer email.
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
   Then list the breakers this commit handles, one line each —
   `B4 zero contacts → header-only file` — so the developer can check
   each against the code.
2. **Show the big picture again.** Re-draw the diagram from Step 2
   with the statuses updated: this commit `(◄ This commit)`, earlier
   ones `(Done)`, the following one `(Next)`. Swap this commit's
   guessed paths for the real ones it touched, and reflect any plan
   change the developer made. Under it, one plain line on how this
   commit fits: which files and tables now work together, and what
   that unlocks. Every commit,
   every time — never "same as before". Replace the saved copy in
   `docs/build/<slug>.md`.
3. **Go back to `docs/build/<slug>.md` and update this commit's
   section.** Two lines change:

   - **`Touches:`** — replace the plan's prose with the real files you
     actually changed, each in backticks, comma-separated, as paths
     relative to the repo root:

     ```
     - **Touches:** `app/Models/ExportRequest.php`, `app/Http/Controllers/ExportController.php`
     ```

     Real paths let the developer see at a glance what this commit
     changed. Prose guesses from the plan don't.

   - **`Unplanned:`** — every decision you made while writing this
     commit that the solve-me file didn't already settle. One line
     each, nested under the field. Write `none` only when there
     genuinely were none:

     ```
     - **Unplanned:**
       - Sorted by created date rather than name — the solution never said,
         and the list looked random without it.
       - Kept the old column instead of dropping it; dropping it would have
         broken the report page, which is out of scope.
     ```

     This is the important one. Every other decision in this pipeline
     went through a gate the developer approved. These didn't — they
     were made while the code was being written, and if they only get
     said in chat they're gone. Small ones count. "I had to pick
     something and this is what I picked" is exactly the kind of entry
     that belongs here.

4. Say the same unplanned decisions out loud to the developer too, and
   flag anything you're unsure about.
5. Suggest a commit message for this commit, matching this repo's
   existing commit style (check `git log` if unsure). The message is
   only the subject line, plus a short body if the change really needs
   one. Nothing else: no `Co-Authored-By:`, `Signed-off-by:` or other
   trailers, no "Generated with" lines, no emoji, no links. This holds
   even if the developer asks you to run the commit yourself. Present it
   as a suggestion only — do not run `git commit` yourself unless the
   developer explicitly asks you to. Example:

   ```
   Reuse an in-progress export instead of starting a second
   ```
6. **Stop.** Wait for the developer to review, edit, or approve before
   moving to the next commit. Never chain commits on your own
   initiative, even if the plan is long. If the developer explicitly
   pre-approves a named range ("build 3 through 5 without stopping"),
   honor it: build them in sequence, keep the per-commit WHY comments
   and R-number framing, and give the per-commit summaries together at
   the end of the range, with one diagram showing the whole range
   marked `(Done)`.

When the developer comes back (possibly with edits, possibly just
"next"), pick up with the next commit in the plan, re-checking Step 1's
conventions against anything they changed.

---

## Rules

- Build the recommended option from solve-me, exactly as chosen. Flag
  disagreements; don't act on them unilaterally.
- The commit plan is written to `docs/build/<slug>.md` and explicitly
  approved by the developer before any code is written.
- Every case in `docs/breakers/<slug>.md` is assigned to a commit's
  `Handles:` line before the plan is approved — or listed under the
  plan as knowingly not handled, with the developer's OK. After each
  commit, check its code really handles every case it claims; if one
  isn't, say so instead of marking it done.
- Every commit names the requirement(s) it serves, before and after
  it's built. A commit that serves no requirement doesn't get built.
- **After every commit, `docs/build/<slug>.md` gets updated**: real
  backticked file paths in `Touches:`, and an `Unplanned:` list (or
  `none`). Never leave a built commit carrying the plan's guesses.
- Never write `Unplanned: none` to save a step. An empty list and a
  missing record look identical later and mean opposite things.
- Nothing on the out-of-scope list gets built, however small or
  convenient it looks while you're already in the file.
- One commit, one stop, by default. Never chain commits on your own
  initiative — but if the developer explicitly names a range to batch,
  that's their pace to set, and every per-commit artifact (WHY
  comments, R-framing, summary, suggested message) still gets made.
- Every non-obvious piece of logic gets a one-line `// WHY:` comment
  in plain language that gives the reason, not a description of the code. Skip it only for code so simple the reasoning is obvious
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

- A big-picture diagram was shown with the plan, re-drawn after every
  commit with current statuses and a line on how the commit fits, and
  the latest version is saved in `docs/build/<slug>.md`.
- The commit plan exists at `docs/build/<slug>.md` and was approved by
  the developer before building started.
- Every commit from the plan has been built, reviewed, and approved.
- Every commit paused for review before the next one started.
- Every commit was introduced and closed with a short plain-language
  reason tied to a requirement number.
- All non-obvious logic has a one-line `// WHY:` comment in plain
  language that states the reason behind the choice made in the
  solve-me file.
- Every built commit's section in `docs/build/<slug>.md` carries the
  real file paths it touched, in backticks, and an `Unplanned:` list
  of what got decided mid-build (or `none`).
- A commit message was suggested for every commit, with no trailers,
  co-author lines or other extra information.
- No option was implemented other than the one already recommended in
  the solve-me file, unless the developer explicitly changed it.