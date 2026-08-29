---
name: map-me
description: >
  Build the comprehension map across every ship-me run in this project and
  read it back in plain language. Runs a deterministic script over the
  markdown the pipeline already wrote (grill-me's R-numbers, solve-me's
  sub-problems and options, build-me's commits and touched files, verify-me's
  coverage table) and turns them into a graph: one node per requirement,
  sub-problem, option, commit, mid-build decision and touched file.
  Its real job is the holes — requirements nothing built, requirements nothing proved,
  commits tied to no requirement, decisions made mid-build that never went
  through a gate, and files where several runs collide. Use when the
  developer wants the big picture, wants to know what a run actually left
  behind, or is about to start work in a part of the code several runs have
  already touched.
---

# Map Me — Show the Holes

The structure of the work is already readable in the four markdown files.
The **holes** are not. That's what this skill is for.

You invent nothing here. Every node and edge is already written down by
`/grill-me`, `/solve-me`, `/build-me` and `/verify-me`. A script parses
them; your job is to read the result back in plain language and say which
holes actually matter.

**A script parses, you narrate.** Never hand-derive the graph by reading
the artifacts yourself — it's slow, it drifts between runs, and the whole
value of the map is that it says the same thing every time.

---

## Step 1 — Run the generator

The script ships next to this file. From the project root:

```bash
node ~/.claude/skills/map-me/map-me.mjs
```

If the skills were installed into a single project, use
`.claude/skills/map-me/map-me.mjs` instead.

Options:

- `--docs <dir>` — where the artifacts live (default `docs`)
- `--out <dir>` — where the map goes (default `<docs>/map`)
- `--slug <slug>` — map one run only
- `--brief` — print only what changed since the last run
- `--quiet` — no stdout summary

### Two modes

`/map-me` invoked by the developer uses the **full** mode above: it
rebuilds everything and you read the holes back in priority order.

The other five skills call the same script with `--brief` every time
they write an artifact, so the map is never stale mid-pipeline. In that
mode it prints only the holes that opened or closed since the last run,
and prints nothing at all when nothing changed. That's deliberate: a
map that re-reports all sixteen holes after every commit is a map
people stop reading, which is the problem this whole thing exists to
fix.

`--brief` also exits quietly when there's nothing to map yet, so an
early phase can call it safely.

It writes:

| File | What it is |
|---|---|
| `docs/map/index.html` | the graph, standalone, opens in any browser |
| `docs/map/HOLES.md` | every hole, grouped, worst first |
| `docs/map/*.md` | one note per node — open `docs/map/` as an Obsidian vault |
| `docs/map/map.json` | the raw graph, if something else wants it |

If it reports finding no artifacts, the project hasn't run the pipeline
yet — say so and stop. Don't invent a map from the codebase.

---

## Step 2 — Read the holes back, worst first

Read `docs/map/HOLES.md`. Report in plain language, in this order —
stop after the ones that matter, don't recite the whole file:

1. **Verified and failed** — a requirement that was checked and didn't
   hold. Nothing else on this list outranks it.
2. **Built an option the solution rejected** — the gate was bypassed, or
   the solution file is now lying about what's in the code. Say which.
3. **Approved but never built** — a requirement the developer signed off
   on that no commit serves.
4. **Built but never proven** — a requirement with code behind it and
   nothing in a coverage table. This is the one that reads as "done" and
   isn't.
5. **Decided mid-build** — every `Unplanned:` entry. These went through
   no gate. This is the review agenda: it's usually short, and usually
   one item on it is the thing that would have bitten them.
6. **Files where several runs collide** — name the file, name the runs.
   This is where comprehension debt compounds, and it's invisible from
   inside any single run.

For each one, say what it is in one line and what it would take to close
it. Don't pad — three real holes reported plainly beats sixteen listed.

---

## Step 3 — Point at the map, then stop

Give the developer the path to `docs/map/index.html` and mention that
`docs/map/` opens as an Obsidian vault if they'd rather use the graph
view there.

Then say what the map says about attention, if there's anything to say:
which files are hubs (worth understanding properly), and which commits
touch a file nothing else touches (safe to skim). The point of the map is
to make it legitimate to skim most of it.

---

## Rules

- **Run the script. Never hand-derive the graph.** If it fails, fix the
  invocation or report the failure — don't fall back to reading the
  artifacts yourself and describing what you think the graph would say.
- **Report, don't fix.** Like `/verify-me`, this skill ends with a
  report. Don't edit application code, don't backfill missing
  `Unplanned:` lines from memory, don't rewrite an old artifact to close
  a hole. Say what's missing and let the developer decide.
- **A hole is a fact, not an accusation.** "R4 has no coverage row" is
  the finding. Whether it matters is the developer's call.
- **Don't rank by count.** Sixteen unlabelled rejections matter less
  than one failed requirement. Follow the order in Step 2.
- If `Touches:` holes dominate the output, the runs were built before
  `/build-me` started recording real paths — say that plainly rather
  than listing every commit.
- Never invent a node that isn't in an artifact. If the map looks thin,
  the artifacts are thin — that's the finding.
- Holes about work that hasn't happened yet are suppressed on purpose:
  a commit is only judged once it has been built (real paths or an
  `Unplanned:` record), and a missing later phase is not a hole. If you
  find yourself explaining that something is "just not done yet", the
  script should have filtered it — say so rather than reporting it.

---

## Done means

- The generator ran and wrote `docs/map/`.
- The holes were reported in priority order, in plain language, with
  what it would take to close each one.
- The developer has the path to the graph.
- Nothing was edited or fixed.
