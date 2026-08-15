---
name: test-me
description: >
  Write the automated unit and feature tests that /verify-me identified
  as missing, following this project's testing conventions and real
  testing best practices. Actively filters out useless tests — ones that
  can't fail, test the framework instead of the feature, or lock in
  implementation details instead of behavior. After writing each test (or
  batch of tests), explains in plain language why it's useful and what
  real bug or rule it protects against. Use after /verify-me, once you
  know what tests are missing and want them actually written.
---

# Test Me — Write Tests That Earn Their Place

Your job is to write tests that would actually catch a real bug if one
showed up. Not tests that exist to make a coverage number go up. A
test that can never fail is worse than no test — it's false
confidence.

Before writing any test, you should be able to answer: **"What real
mistake would this test catch?"** If you can't answer that in one
sentence, don't write the test — or rewrite it until you can.

---

## Input

You need the `/verify-me` output: the markdown file at
`docs/verification/<topic>.md` (or wherever the developer points you).
That file's "Unit tests still needed" and "Feature tests still needed"
sections are your starting checklist — plus its request log, which
already shows real inputs and real outputs you can turn into concrete
assertions.

Also read, if available, the matching `/grill-me` and `/solve-me`
files — they tell you *why* a rule exists, which is exactly what makes
a test meaningful instead of arbitrary.

If none of these exist, ask for them or for a plain description of
what needs test coverage. Don't invent test cases from guessing what
the code probably does.

---

## Step 1 — Learn how this project already tests things

Before writing anything, look at how existing tests in this codebase
are structured: which test framework, how the database is reset
between tests, how factories are used, naming conventions, folder
layout (unit vs. feature), how HTTP requests are made in tests, how
auth is set up in tests. Use CodeGraph or search for the closest
existing test to what you're about to write.

New tests should read like they were written by whoever wrote the
existing ones — same style, same helpers, same conventions. Don't
introduce a new testing pattern when the project already has one.

---

## Step 2 — Turn the checklist into real test cases

For every item in verify-me's "tests still needed" lists, write down,
in one line, the real-world rule or scenario it protects — pulling
this from the grill-me/solve-me docs when possible. This becomes the
test's reason to exist, and later its explanation and its name.

Group the work into two batches, matching verify-me's split:

- **Unit test batch** — small, isolated pieces of logic.
- **Feature test batch** — real end-to-end behavior through the actual
  endpoints, matching what was manually proven with curl in verify-me.

---

## Step 3 — Filter out useless tests before writing them

For each candidate test, check it against this list. If it matches
any of these, rewrite it or drop it:

- **Can't fail.** The assertion is so loose or so tied to the code's
  own logic that almost any change would still pass.
- **Tests the framework, not the feature.** E.g. asserting that
  Eloquent saved a field to the database — that's proving the ORM
  works, not that your rule works.
- **Tests implementation, not behavior.** Asserting a private method
  was called, an internal query ran, or an exact internal step
  happened — these break on harmless refactors and don't actually
  prove the outward behavior is correct.
- **Only checks that a mock was called.** If the test sets up a mock
  and then asserts the mock was called the way the code calls it,
  it's just restating the code. Prefer using the real thing (real
  database, real objects) unless there's a real reason not to
  (external network calls, sending real emails, calling a paid API).
- **Vague name, vague purpose.** Names like `test_it_works` or
  `test_basic_functionality` tell you nothing about what broke when it
  fails. A good name states the scenario and the expected outcome.
- **Duplicate coverage.** If another test already proves this exact
  behavior, don't write a second one that just phrases it differently.

A test earns its place only if you can say: "if this behavior broke,
this test would turn red, and the failure message would tell someone
what actually broke."

---

## Step 4 — Write the tests

For each surviving test case:

- Follow the Arrange → Act → Assert shape: set up real data (using
  factories, matching project convention), do the one thing being
  tested, then check the real, observable outcome — a response body
  and status code for feature tests, a return value or resulting state
  for unit tests.
- Give it a name that states the scenario and the expected result in
  plain words (e.g. "a user cannot confirm an email change with an
  expired token," not "test email 2").
- One test, one behavior. If a test needs "and" to describe what it
  checks, it's probably two tests.
- Use the project's real database setup for feature tests (whatever
  this project already uses to reset state between tests) instead of
  mocking the database.
- Reuse the real inputs and outputs from the verify-me request log
  where they apply — they're already proven-correct examples of real
  behavior.
- Keep tests independent — no test should depend on another test
  having run first or left data behind.

Write one batch at a time (unit, then feature, or whatever grouping
makes sense for the size of the work). After each batch, run it and
confirm it passes for real — don't assume.

---

## Step 5 — Prove the important tests actually catch something

For the tests protecting the most important rules (the "must always
stay true" ones), do a quick sanity check: temporarily break the
behavior the test is supposed to protect (comment out the check,
revert the fix, whatever is fastest), run the test, and confirm it
actually fails. Then put the real code back and confirm it passes
again.

This is the fastest way to know a test isn't just decoration. Skip it
for very simple tests where it's obvious the assertion would catch a
real break; do it for anything protecting a rule that matters.

---

## Step 6 — Explain why each test is useful

After finishing a batch of tests (or all of them, if the batch is
small), explain plainly, for each test or tight group of tests:

- **What it protects** — the real rule, edge case, or bug it exists
  for, in plain language, naming the requirement number (R<n>) the
  verify-me list tagged it with when there is one.
- **What would slip through without it** — what could go wrong later
  (a bad refactor, a forgotten edge case) that this test would catch.
- **Why it's a good test** — one line on what makes it solid: it
  checks real, observable behavior; it has a name that explains
  itself when it fails; it isn't tied to implementation details that
  could change without the actual behavior changing.

Keep this explanation short and plain — a sentence or two per test or
group, not a essay. The goal is that the developer trusts these tests
without having to re-derive why each one exists.

---

## Rules

- Don't write a test unless you can state the real mistake it would
  catch.
- Don't mock things you could just use for real, unless there's a
  concrete reason (external/paid/slow services).
- Don't assert on implementation details (private internals, exact
  query counts, exact call order) when asserting on the observable
  outcome would do.
- Don't pad the count with near-duplicate tests.
- Match this project's existing testing conventions over generic
  textbook style when the two disagree.
- Don't change application code to make a test pass — if a test
  reveals a real bug, report it plainly instead of quietly patching
  around it.

---

## Done means

- Every real item from verify-me's "tests still needed" lists has
  either been written as a genuine test or explicitly dropped with a
  one-line reason why it wasn't worth writing.
- Every written test would visibly fail if the behavior it protects
  broke — spot-checked for the important ones.
- Every test has a name that explains the scenario and expected result
  on its own.
- No test only restates a mock call, tests the framework, or checks an
  internal implementation detail instead of real behavior.
- The developer has a short, plain-language explanation of why each
  test (or group of tests) is useful and what it would catch.