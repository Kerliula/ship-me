---
name: ship-me
description: >
  Run the full pipeline end to end for one problem or feature: /grill-me,
  /solve-me (reviewed by /critique-me), /build-me, /verify-me, /test-me,
  in order. Sizes the run first (SMALL / MEDIUM / LARGE) so a small fix
  doesn't pay for a feature's ceremony, and reproduces a bug before
  anything is built. The interactive
  phases (grill-me's interrogation, build-me's per-commit review) run right
  here in this conversation. The non-interactive phases (solve-me,
  critique-me, verify-me, test-me) each run as a freshly spawned, separate session with
  no memory of this conversation. Keeps a run-state file on disk, so a
  restart or a compaction resumes exactly where the run stopped, with
  every gate decision intact. The developer keeps the approval
  gates: the solution options after solve-me, the commit plan at the
  start of build-me, and the go-ahead for tests after verify-me. Use when
  the developer wants the
  whole problem-to-tested-code pipeline run for something, instead of
  invoking each skill by hand one at a time — or says "continue" on a
  run that was interrupted.
---

# Ship Me — Run the Whole Pipeline

You are the conductor, not a sixth phase. Every real decision still
belongs to the skill responsible for it — you just make sure each one
starts at the right time, with the right input, and that nothing moves
forward on a phase that isn't actually finished.

---

## Before you start

### Is this a resume?

First, look in `docs/ship/` for a run-state file for this topic. If the
developer just said "continue" or similar, list what's there and ask
which run. If one exists, this is a resume: go to **Resuming a run**
below and don't start anything new.

### Name the run

Get a short topic name for this run — a few words, e.g. "email
change" or "tender matching fix." Turn it into a slug (e.g.
`email-change`) and use that same slug for every phase's output file,
so the whole run stays linked together:

- `docs/ship/<slug>.md` — the run-state file (see below)
- `docs/grilling/<slug>.md`
- `docs/solutions/<slug>.md`
- `docs/breakers/<slug>.md`
- `docs/critique/<slug>.md`
- `docs/build/<slug>.md`
- `docs/verification/<slug>.md`

### Size the run

Ceremony has to match the stakes. A one-line fix run through five
phases, three spawned sessions and a critique dialogue costs more than
the fix itself.

Take a quick look at the code the request touches first: search for
it, open the closest files, and glance at what else reads the data
it changes. Look just long enough to count files, spot any real design
choice, and see whether other features depend on it; this isn't
Phase 1. Then pick the size.
Take the **highest** size any signal reaches:

| Size | Looks like | Runs |
|------|------------|------|
| **SMALL** | One behavior changes, roughly 1–2 files. No new states, tables or screens, and nothing else in the app has to change with it. Once you've read the code, there's only one sensible way to build it. | grill-me (SMALL) → build-me. At the end the developer chooses whether verify-me and test-me run. |
| **MEDIUM** | A real feature, but contained: a few files, maybe a new table or class, one or two real design choices. | Every phase. |
| **LARGE** | New states or several actors, changes that cut across the app, a new external dependency, or several open questions. | Every phase. grill-me runs in full. |

**Never SMALL, however few lines it is:** anything that touches
login or permissions, money, deleting data, a database migration, or
an API other code depends on. Those are at least MEDIUM. Mistakes
there are expensive and hard to undo.

These are the same sizes `/grill-me` uses. The size you agree on here
is the one grill-me runs at.

Also name the **kind**: a new feature, a change to behavior that
works today, or a bug fix. A bug fix adds Phase 1b (reproduce it
first).

Propose the slug, size and kind in **one** message and get one reply:

> "Slug: `email-change`. Size: **SMALL** — one validation rule in one
> form request, no new states. That runs grill-me (short) → build-me,
> and I'll ask about verify and tests at the end. Kind: bug fix, so I'll
> reproduce it before anything is built. OK?"

The developer can move the size either way. Their word wins. Then
create the run-state file.

**If the size turns out wrong mid-run, step up and say so.** It steps
up when grill-me steps up its size, for example because its
"what else relies on it" search found other features that must change
too. It also steps up when build-me finds a real design choice in a
SMALL run. Tell the developer in one line which
phases now run, update the run-state file, and go on from where you
are. In a SMALL run that stepped up, that means spawning solve-me next.
Never step down on your own. Only the developer can.

---

## The run-state file

`docs/ship/<slug>.md` is the run's memory. Your conversation will be
compacted or restarted at some point. It's the long-lived one,
carrying the whole interrogation and every commit review. Anything that
lives only in chat is gone when that happens: a gate answer, the pre-flight
answers, where the build stopped. So it goes on disk.

```markdown
# Ship run — <topic>

- **Slug:** <slug>
- **Kind:** feature / change / bug fix
- **Size:** SMALL / MEDIUM / LARGE — <one-line why>
- **Phases in this run:** <e.g. grill-me → reproduce → build-me → (verify-me, test-me if asked)>
- **Base commit:** <short SHA — copied from the build file once the plan is approved>
- **Updated:** <date and time>

## Where we are
- **Phase:** <e.g. 3 — build-me, commit 2 of 5 built>
- **Waiting on:** <developer: review of commit 2 / agent: critique round 2 / nothing>
- **Next step:** <the exact next action once that arrives>

## Progress
- [x] Size agreed
- [x] 1 grill-me — `docs/grilling/<slug>.md`, comprehension gate passed
- [ ] 1b Reproduce
- [ ] 2 solve-me ↔ critique-me — round <N> of 2, <in progress / agreed / deadlock / round limit>
- [ ] Gate: solution approved
- [ ] 3 build-me — plan approved; commits approved <e.g. 1–2> of <total>; final check <passed / failed / not run>
- [ ] 4 verify-me — `docs/verification/<slug>.md`
- [ ] Gate: go-ahead for tests
- [ ] 5 test-me
- [ ] Wrap-up

## Decisions
<every answer the developer gave at a size call or a gate, in their own
words, with the question it answered — newest last>
- <date> Size: "<their words>"
- <date> Solution gate — "<question>": "<their answer>"

## Verify-me pre-flight answers
<verbatim, once asked — reused at Phase 4>

## Reproduction
- **Steps:** <the exact requests or commands>
- **Before the fix:** <what came back>
- **After the fix:** <filled in after the build>

## Spawned sessions
- <phase>: <agent name> — gone after a restart
```

List only the phases this run actually has under **Progress**, and
drop **Reproduction** unless it's a bug fix.

**Update it at every step, not at the end:**

- when a phase starts or finishes;
- whenever you ask the developer something and wait — set **Waiting
  on** first, then ask;
- **right after every answer the developer gives at a gate or a size
  call**: write it under **Decisions** in their words before you act
  on it.

The phase files remain the source of truth for their own content. The
run-state file only says where the run is and what was decided
between phases.

### Resuming a run

1. **Read the run-state file, then check it against disk.** Every file
   it names should exist. The build file's `Plan:` and `Status:` lines
   should match **Progress**. The base commit should exist
   (`git cat-file -e <sha>`). Where they disagree, trust the phase
   files and git, since they're written the moment the work happens.
   Correct the run-state file.
2. **Brief the developer** in a few lines: topic, size, where it
   stopped, what it's waiting on, the decisions so far (one line each),
   and the next step. Then wait for their go. Don't restart anything on
   your own.
3. **Pick up at that exact point:**
   - **Mid grill-me:** nothing is on disk until the gate passes. Run
     `/grill-me` again at the recorded size. Tell the developer it
     should go faster the second time.
   - **Waiting at a gate:** post the gate's summary and questions again
     from the files. Silence from before the restart is not approval.
   - **Mid critique dialogue:** spawned sessions don't survive a
     restart. Spawn a fresh solve-me agent and a fresh critique-me agent
     (still two separate sessions). Tell each one the round number,
     and that `docs/critique/<slug>.md` and the solution's "Changes
     after critique" section hold the earlier rounds. Then carry on
     from the next turn in the dialogue.
   - **Mid build:** invoke `/build-me` with `docs/build/<slug>.md` and
     tell it to continue from the first commit whose `Status:` isn't
     `approved`. If that commit is `built — waiting for review`, show it
     for review again. Don't rebuild it.
   - **Waiting on verify-me or test-me:** its session is gone. If its
     output isn't complete on disk, spawn it again with the same
     prompt.

**No run-state file, but phase files exist for this slug?** That
means an older run, or phases run by hand. A file existing does not
mean its phase is finished. Check each file's content:

- **Grilling:** finished if it has the Requirements block.
- **Solution and critique:** the dialogue is finished if the critique's
  verdict is Holds, or 2 rounds have run. The solution gate's answers
  weren't recorded anywhere, so run that gate again.
- **Build:** use `Plan:` and each commit's `Status:`. An older build
  file without those lines doesn't say which commits were approved, so
  ask the developer.
- **Verification:** if it exists, go to the tests gate.

Write a run-state file from what you found, brief the developer, and
wait.

### Good moments to compact

The files hold the run, so at a phase boundary the conversation can be
compacted without losing anything. At each of these points, once the
run-state file is current, tell the developer in one line that now is
a good moment to run `/compact`. You can't run it yourself.

- after the grilling file is written (and the reproduction, if any);
- after the solution gate's answers are recorded, before the build;
- after the build's final check, before verify-me.

Don't suggest it mid-build. The conventions build-me learned and the
commit under review are only in the conversation.

---

## The phases

| # | Phase | Skill | Where it runs | Sizes | Produces |
|---|-------|-------|----------------|-------|----------|
| 1 | Understand the problem | `/grill-me` | **This conversation** | all | `docs/grilling/<slug>.md` |
| 1b | Reproduce the bug | — | **This conversation** | bug fixes | the Reproduction section |
| 2 | Design the solution | `/solve-me` | **Spawned session** | MEDIUM, LARGE | `docs/solutions/<slug>.md`, `docs/breakers/<slug>.md` |
| 2b | Critique the solution | `/critique-me` | **Spawned session** | MEDIUM, LARGE | `docs/critique/<slug>.md` |
| — | *Developer approves the solution* | — | **This conversation** | MEDIUM, LARGE | a decision |
| 3 | Build it | `/build-me` | **This conversation** | all | `docs/build/<slug>.md`, then code, commit by commit |
| — | *Developer approves the commit plan (inside Phase 3, before code)* | — | **This conversation** | all | a decision |
| 4 | Verify it | `/verify-me` | **Spawned session** | MEDIUM, LARGE; SMALL if asked | `docs/verification/<slug>.md` |
| — | *Developer approves moving to tests* | — | **This conversation** | all that verified | a decision |
| 5 | Test it | `/test-me` | **Spawned session** | MEDIUM, LARGE; SMALL if asked | test files |

"This conversation" means: invoke the skill directly here, exactly as
if the developer had typed the slash command themselves, and let it
run its normal back-and-forth with the developer.

"Spawned session" means: use the Agent tool to start a brand-new
session with no memory of this conversation. Give it a fully
self-contained prompt (see below). Let it run in the background. Move
on to the next phase only when its completion notification actually
arrives — never before, and never guess or narrate what it will find.
Write each spawned agent's name into the run-state file.

---

## Phase 1 — grill-me (here)

Invoke `/grill-me` in this conversation for the topic, and tell it the
size the developer already confirmed so it doesn't ask again. Let the
interrogation happen normally at that size — don't shortcut its
questions or answer on the developer's behalf. Don't move on until it
has actually written `docs/grilling/<slug>.md` and said "Comprehension
gate passed."

## Phase 1b — reproduce the bug (here, bug fixes only)

A fix can't be proven if the bug was never seen. Before anything is
designed or built, reproduce the bug from the grilling file's "What
happens now": hit the running app the way a user or caller would (a
curl request, a page, an artisan command — whatever the write-up
describes). Stay read-only if you can.

If reproducing it means writing data or logging in, ask verify-me's
pre-flight questions now (see Phase 4), under the same rules: never
answer database safety or login for the developer. Save the answers in
the run-state file, so Phase 4 reuses them.

- **Reproduced:** write the exact steps and what came back into the
  run-state file's **Reproduction** section. Show the developer in two
  lines.
- **Not reproduced:** stop. The bug may depend on data or timing, or
  on something the grilling missed. Tell the developer what you tried
  and what came back. Let them choose: give more detail, go back to
  grill-me, or build anyway knowing the fix can't be proven.

Don't fix anything in this step.

## Phase 2 — solve-me (spawned, MEDIUM and LARGE)

Once the grill-me file exists, immediately spawn a new agent. Its
prompt must be self-contained — it has no access to this conversation:

> "Run the `/solve-me` skill using `docs/grilling/<slug>.md` as the
> problem write-up. Produce `docs/solutions/<slug>.md` and
> `docs/breakers/<slug>.md`. When finished,
> report the file path and a one-paragraph summary of what was
> decided."

Tell the developer this is now running as a separate session and give
its name so they can check on it with `ListAgents` or message it
directly if they want to weigh in on a trade-off while it runs.

When its completion notification arrives, confirm
`docs/solutions/<slug>.md` actually exists and looks complete (has a
recommendation for every sub-problem) before moving on. If it doesn't, stop
and tell the developer instead of pushing forward.

### Phase 2b — solve-me ↔ critique-me dialogue (spawned)

A solution should not reach the developer unchallenged. solve-me and
critique-me now talk it out: solve-me proposes its best solution,
critique-me tries to break it, solve-me answers, and so on, until the
critic has nothing left that must change.

Spawn **one** critique-me agent, separate from the solve-me agent — a
session never grades its own work:

> "Run the `/critique-me` skill. Solution: `docs/solutions/<slug>.md`.
> Problem: `docs/grilling/<slug>.md`. What can break it:
> `docs/breakers/<slug>.md`. Produce
> `docs/critique/<slug>.md`. When finished, report the file path, the
> verdict, and each open must-fix finding in one line."

Then run the dialogue. **Keep both agents alive for the whole
dialogue** and continue them with `SendMessage` — don't spawn fresh
ones each round. Each side has to remember what it already argued, or
the same point gets relitigated every round.

1. **Critic's turn.** Wait for critique-me to finish its round.
   - Verdict **Holds** (no open must-fix) → the dialogue is over. Go
     to the gate.
   - Otherwise → step 2.
2. **Solver's turn.** Send to the solve-me agent:

   > "Round N critique is in `docs/critique/<slug>.md`. Revise
   > `docs/solutions/<slug>.md` as your skill's 'Revising after a
   > critique' section says. Answer every open must-fix finding:
   > fixed, or disagreed with evidence. Report what changed."

3. **Critic's turn again.** Send to the critique-me agent:

   > "The solution was revised for round N. Run your next round as
   > your skill's 'Next rounds' section says."

   Back to step 1.

Only relay — don't take part. Never add your own findings, soften the
critic's, or answer for the solver.

**When to stop without agreement.** End the dialogue and take what's
left to the gate as open questions when either:

- **Deadlock:** a round ends with the same must-fix findings open as
  the round before and nothing in the solution changed. The two sides
  disagree on something only the developer can decide.
- **Round limit:** 2 critique rounds have run. The first round finds
  the problems and the second checks the fixes. After that, whatever
  is still open is quicker for the developer to settle than for the
  agents to keep arguing.

Tell the developer in one line when each round finishes (e.g. "Round 1:
2 of 3 fixed, 1 disagreed — critic reviewing the reply") so the
background work isn't silent. Keep the round number and status in the
run-state file.

### Gate — the developer reviews the solution before anything is built

**This is a hard stop. Phase 2 never flows straight into Phase 3.**
The whole point of solve-me is that each sub-problem has several real
options — that's worthless if the build starts before the developer
has looked at them.

When the solve-me file is ready, post a decision-grade summary in this
conversation — enough to decide from chat without opening the file.
Per sub-problem, two lines:

> **Sub-problem N — <title>**
> Recommended: <option> — <its one-line why, copied from the file>
> Runner-up: <strongest rejected option> — <one line on why it lost>

Under it, one line on the dialogue: how many rounds it took, how it
ended (agreed, deadlock, or round limit), and what changed because of
it. Then list as numbered questions: each item from the solution's
"Open trade-offs" section, each **Worth considering** finding still
open, and every must-fix finding the two sides didn't settle — with
both sides' one-line position, so you can pick. Give the file path for the full reasoning, and
ask plainly:

> "Keep these recommendations, or change any of them? And I need your
> answer on each open trade-off above — nothing gets built until you
> say go."

Don't proceed while any of those questions is unanswered — they are
exactly what solve-me and critique-me deferred to the developer.

Wait for an actual answer. Write every answer into the run-state
file's **Decisions**, in the developer's words, before doing anything
with it. If they change a recommendation, update the solve-me file (or send the
change to that session) so the file and the build agree, then confirm
the change back to them. "No response yet" is not approval, and
neither is silence after a long-running spawned phase.

## Phase 3 — build-me (here)

Only after the developer has approved the solution, invoke `/build-me`
in this conversation using `docs/solutions/<slug>.md` and
`docs/grilling/<slug>.md`.

**In a SMALL run** there's no solution file. Invoke `/build-me` with
`docs/grilling/<slug>.md` and tell it the run is SMALL. It builds
straight from the grilling file, and approving its plan approves the
approach. If it finds a real design choice, the run steps up to MEDIUM
(see **Size the run**).

This is also where the work gets cut into commits — solve-me
deliberately doesn't do that. build-me writes its commit plan to
`docs/build/<slug>.md` and stops for the developer to approve it
before writing any code. Let that gate happen; don't approve the plan
on their behalf. Once it's approved, copy the build file's `Base
commit:` into the run-state file.

The phase then pauses after every commit for the developer to review
and edit — that's by design. Don't try to speed it up or auto-approve
commits — unless the developer themselves asked to batch specific
commits ("run 3 through 5"); their call, never yours. Keep the
run-state file's build line current as commits are approved. build-me
runs the project's own checks on every commit and the related existing
tests once after the last one. A phase with a failed final check isn't
finished.

**Bug fix:** once the build is done, run the reproduction steps again,
exactly as recorded. Fill in **After the fix** and show the before and
after in two lines. If the bug is still there, the build isn't
finished. Say so, and go back into `/build-me` with the developer.

**SMALL run:** after that, ask once:

> "Built and checked. Stop here, or run verify-me against the real app
> (and then test-me)?"

Recommend one in a line. Stopping is reasonable when the checks and
the reproduction already prove the change. Otherwise recommend
verifying. On "stop", go to **Wrapping up**.

## Phase 4 — verify-me (spawned)

Once build-me has finished all its commits, spawn a new agent:

> "Run the `/verify-me` skill. Problem: `docs/grilling/<slug>.md`.
> Solution: `docs/solutions/<slug>.md`. What can break it:
> `docs/breakers/<slug>.md`. What was built: everything since base
> commit `<sha>` — run `git diff --stat <sha>` and
> `git status --porcelain` to see it; the commits are listed in
> `docs/build/<slug>.md`. [Bug fix: the reproduction — steps and
> before/after, pasted from the run-state file.] Produce
> `docs/verification/<slug>.md`. When finished, report the file path
> and whether any problems were found."

In a SMALL run, name `docs/build/<slug>.md` as the solution and leave
out the breakers file. It doesn't exist.

Before spawning, ask the developer verify-me's four pre-flight
questions here, in one compact message: what to verify (R-numbers /
behaviors), which base URL and whether the server is already running,
whether the database is safe to write tagged dummy rows to, and which
login to use. Propose defaults from the project so "yes" is a complete
answer — but the developer's reply is the authority. Never fill in the
database-safety or login answers on their behalf, however obvious they
look. If Phase 1b already collected some of these, show them from the
run-state file and ask whether they still hold. Save the answers in the
run-state file, then paste them verbatim into the spawn prompt,
labeled as the developer's confirmed answers, so the spawned session
can start immediately instead of relaying the same questions back
through you.

When its notification arrives, read the result and **stop**. Summarise
in a few lines what was verified and anything that looked wrong, give
the file path, and ask the developer whether to go ahead with tests.
Never let verification roll straight into Phase 5 — and if the
verify-me session started writing tests itself, say so, because it
wasn't supposed to.

**If it found real problems** (anything marked ❌ or listed under
"Problems found"), say so plainly and recommend going back to
`/build-me` rather than writing tests against behavior that's known to
be broken.

## Phase 5 — test-me (spawned)

Once verification is clean and the developer has said go, spawn a new
agent:

> "Run the `/test-me` skill using `docs/verification/<slug>.md`.
> Problem: `docs/grilling/<slug>.md`. Solution:
> `docs/solutions/<slug>.md`. Write the missing tests it lists,
> following this project's conventions. When finished, report what
> was written and, for each test, why it's useful."

In a SMALL run, name `docs/build/<slug>.md` as the solution.

When it finishes, relay its explanation of each test to the developer.

---

## Wrapping up

Once the last phase this run has is done, replace the working docs with
one summary, so the commit carries the feature's record and not the
pipeline's scaffolding.

### 1. Write the summary

Write `docs/<slug>.md`. It is the only file from this run that stays,
so everything worth keeping from the phase files has to be in it —
once they're deleted, this is the record. Plain language, short,
scannable:

```markdown
# <Feature title, plain language>

## What changed
<two or three sentences: what the app does now that it didn't before,
and why it was needed>

## Requirements
<the Requirements (copy-paste ready) block from the grilling file,
as-is: what was built, what was deliberately not built, how it was
checked>

## Big picture
<the final diagram from the build file, every commit marked (Done)>

## Key decisions
- <sub-problem, in a few words> → <chosen option> — <its one-line why>.
  Not <strongest rejected option>: <its one-line Rejected reason>.
- <every open trade-off the developer ruled on at the solution gate,
  from the run-state file's Decisions, one line each>

## Decided during the build
<every Unplanned: entry from the build file, one line each — or "none">

## Other features it affects
<one line per feature that reads what changed: what it counts on →
what was done (changed / safe, and why / out of scope) → ✅ / ❌ from
verification — from the grilling table, the build's Ripple: lines and
the verification report. This is the list the next person changing
this data needs.>

## What can break it — and how it's handled
<one line per B-number: the case → the commit that handles it → ✅ / ❌
from verification>

## How it was verified
<bug fix: the reproduction, before → after, in two lines>
<the build's checks and final check, one line>
<one line per R-number: ✅ / ❌ / skipped, from the verification
coverage table>

## Tests added
<test file paths, each with its one-sentence "catches this bug">

## Still open
<unresolved trade-offs, dropped test candidates, anything the
critique dialogue or verification left for later — or "none">
```

Leave out any section whose phase didn't run in this run. A SMALL run
has no solution, breakers or critique. There, **Key decisions** is one
line: the approach from the build plan's `Builds:` line. If verify-me
or test-me didn't run, say so in one line under **How it was
verified**. Don't leave the section silently empty.

Check every section is filled from the real files before going on.

### 2. Remove the working docs

These are the files this run created — only the ones that exist:

- `docs/ship/<slug>.md`
- `docs/grilling/<slug>.md`
- `docs/solutions/<slug>.md`
- `docs/breakers/<slug>.md`
- `docs/critique/<slug>.md`
- `docs/build/<slug>.md`
- `docs/verification/<slug>.md`

List them to the developer with the summary's path and ask once:
"Delete these now that `docs/<slug>.md` holds the summary?" Untracked
files can't be recovered after deletion, so this needs a real yes.

On yes, delete them before the commit — `git rm` for any that are
already tracked, a plain delete for the rest — and remove any of those
`docs/` sub-folders that are now empty. Delete only this run's files,
never other runs' files that share the folders.

### 3. Hand over

Give the developer one short message: the summary's path, what was
built, what was tested, anything still open, and a suggested commit
message for the summary and deletions (subject line only, no trailers,
same rule as `/build-me`). Then paste the **Requirements** block from
the summary so it can go straight into the PR description.

---

## Rules

- Never skip a phase's own internal gate — the comprehension gate, the
  solution-review gate, the commit-plan approval, the per-commit
  pause, the per-commit checks, the "problems found" check — just to
  move faster. Sizing decides which phases run. It never lets a phase
  that does run skip its gates.
- **The developer gates for the run's size are non-negotiable.**
  MEDIUM and LARGE: approve the solution (after Phase 2), approve the
  commit plan (start of Phase 3), approve moving to tests (after Phase
  4). SMALL: approve the commit plan, and choose whether verify-me and
  test-me run. Each needs a real answer from the developer, not your
  best guess at what they'd say.
- **The size is agreed, not assumed.** Propose it with a reason, get a
  reply, write it down. Step up the moment the problem proves bigger.
  Never step down on your own.
- **Nothing the run depends on lives only in chat.** Every gate answer,
  size call and pre-flight answer goes into `docs/ship/<slug>.md` as
  soon as it's given. **Waiting on** and **Next step** are always
  current.
- **Resume from what's on disk, never from a file merely existing.** A
  build file exists before its plan is approved, and a solution file
  exists before its gate. Read `Plan:`, `Status:` and the run-state
  file.
- **Commits are cut in Phase 3, not Phase 2.** Don't ask solve-me for
  commit boundaries and don't invent them yourself — build-me writes
  the plan to `docs/build/<slug>.md` and gets it approved.
- **Keep the solve-me numbering, exactly.** The sub-problems in
  `docs/solutions/<slug>.md` are numbered, and that numbering is the
  build order. Commit 1 builds sub-problem 1, and so on. Do not reorder them
  because a later sub-problem "has no dependencies" or an earlier one
  "produces no code on its own" — the developer reads the solution
  file top to bottom and expects the build to match it line for line.
- **A sub-problem may be split, never resequenced.** If one is too
  big for a single review, split it into 3a / 3b / 3c and build those
  in order. The sub-commits stay inside their sub-problem's slot; they
  never jump ahead of an earlier one or trail behind a later one.
- **If a sub-problem genuinely cannot be built in its slot** — it needs
  something a later sub-problem creates — stop and say so before writing
  any code. Name the sub-problem, name what it needs, and let the developer
  decide whether to reorder. Never resolve it silently.
- **Every commit traces to a requirement.** The R-numbers come from
  the grill-me file's requirements block; if a commit serves none of
  them, it doesn't belong in this run.
- **A bug fix is proven, not assumed.** Reproduce it before the build,
  and run the same steps again after it.
- A spawned phase's prompt must stand on its own: exact file paths,
  exact slug, exact skill to run, exact thing it must produce. It
  cannot see anything from this conversation unless you put it in the
  prompt.
- Never report or assume a spawned phase's outcome before its real
  completion notification arrives.
- If a spawned phase fails, stalls, or its output file doesn't hold
  up, stop the chain and tell the developer — don't feed a broken
  output into the next phase.
- If the developer wants to jump in on a spawned phase (answer a
  question, redirect it), point them to messaging that session
  directly by name rather than relaying through you.

---

## Done means

- The run's size and kind were agreed with the developer before Phase
  1, and every step up was said out loud.
- Every phase that this size runs was completed in order, and each
  one's own completion criteria were actually met (not assumed).
- Every spawned phase ran in its own fresh session, triggered once its
  input was ready and its gate (if it has one) was cleared.
- In MEDIUM and LARGE runs, the solution went through a solve-me ↔
  critique-me dialogue in two separate sessions before the developer
  saw it, and ended in agreement, deadlock, or the 2-round limit —
  never cut short.
- Every developer gate for this size got a real answer, and every
  answer is in the run-state file in the developer's words.
- Every commit passed the project's own checks, and the related
  existing tests ran once after the build.
- A bug fix was reproduced before the build and shown fixed after it,
  using the same steps.
- `docs/ship/<slug>.md` was current at every step, so the run could be
  resumed from disk at any point.
- `docs/<slug>.md` holds the full summary of the feature, filled from
  the real phase files, and the final test suite exists (or the
  developer chose to stop before tests).
- The working docs were deleted after the developer said yes — and
  only this run's.
- The developer has the summary path, a suggested commit message, and
  the copy-paste requirements block.
