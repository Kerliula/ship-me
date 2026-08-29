# Exporting a big contact list never finishes

> Produced by `/solve-me`. Real path in a project: `docs/solutions/export-timeout.md`
>
> Note the vocabulary: no framework, library, or database names anywhere.
> That's deliberate — it forces the options to be compared as ideas.

## Source problem

`examples/export-timeout/1-grilling.md`

## How this was split

- **Sub-problem 1 — getting the file to someone when it can't be made instantly.**
  This is the core of the complaint and drives everything else.
- **Sub-problem 2 — what happens when someone asks twice.** Separable: it only
  matters once making the file takes time.
- **Sub-problem 3 — who may download a finished file, and for how long.**
  Separable: it's about the finished file, not about making it.

## Sub-problem 1 — How does someone get a file that takes too long to make on the spot?

**Serves:** R1, R2, R6

### Option A — Wait longer

- How it works: allow the request to stay open longer before giving up.
- Good at: nothing changes anywhere else; almost no work.
- Costs: the person still stares at a spinner, just for longer. Holds a
  connection open the whole time.
- Breaks down when: the account is big enough to exceed any limit you
  pick. It postpones the problem instead of removing it, and the biggest
  accounts — the ones complaining — are exactly the ones it still fails.

**Rejected:** Postpones the problem instead of removing it. The accounts big enough
to complain are exactly the ones that still fail at any limit you pick.

### Option B — Make it in the background, send a link by email

- How it works: write down the request, answer immediately, build the
  file separately, then email a link when it's done.
- Good at: the person can close the page entirely and still get the file.
  Works well for exports that take many minutes.
- Costs: depends on email being set up and actually arriving. Someone
  sitting on the page watching has no idea what's happening.
- Breaks down when: the export takes ten seconds — sending an email for
  that feels absurd, and the person is still on the page waiting.

**Rejected:** Leaves the person on the page with no idea what's happening, and takes on
a dependency on email that this problem doesn't need yet.

### Option C — Make it in the background, let the page check on it

- How it works: write down the request, answer immediately with a way to
  refer to it, build the file separately. The page asks "is it done yet?"
  every few seconds and shows the answer.
- Good at: instant response, honest progress, and it works the same for a
  ten-second export and a ten-minute one. The recorded state is exactly
  what's needed to report a failure too.
- Costs: the page has to keep asking, which is more requests. Needs a
  written-down state to ask about.
- Breaks down when: the person closes the page — they'd have to come back
  and find the export themselves rather than being told.

### Option D — Send the file in pieces as it's made

- How it works: start answering immediately and keep writing rows into
  the response as they're gathered.
- Good at: no waiting and no stored file at all. The download starts at once.
- Costs: the connection has to survive the whole export. If it drops
  halfway, the person has a partial file that looks complete — which
  directly violates "an export that says ready is never partial."
- Breaks down when: anything between the person and the app times out
  mid-stream, which for very large accounts is common.

**Rejected:** A dropped connection leaves a partial file that looks complete, which
breaks "an export that says ready is never partial" outright.

**Recommended: Option C**
**Why:** It's the only option that satisfies R1 and R2 at every size
without introducing a new failure mode. D is disqualified outright by the
"never a partial file" rule. A doesn't actually fix the reported problem.
B is a good addition later but leaves the person on the page uninformed,
and its email dependency is a bigger commitment than the problem needs
right now. C's weakness — losing track after closing the page — is
smaller, and B can be layered on top later without undoing any of it.

## Sub-problem 2 — What happens when someone asks twice?

**Serves:** R3

### Option A — Start another one

- How it works: every ask makes a new export.
- Good at: simplest possible behavior; no special cases.
- Costs: exactly the pile-up described in the problem. Wastes the shared
  workers the constraints told us to protect.
- Breaks down when: someone impatiently clicks four times, which is the
  actual reported behavior.

**Rejected:** It is the pile-up described in the problem, not a fix for it.

### Option B — Refuse the second ask

- How it works: if one is already building, answer with a refusal.
- Good at: no pile-up; very clear rule.
- Costs: the person gets an error for doing something reasonable. They
  still don't know when their file will be ready.
- Breaks down when: the person genuinely wants a fresh export because the
  data changed — they're just blocked with no path forward.

**Rejected:** Turns an ordinary double-click into an error the person has to understand,
and still doesn't tell them when their file will be ready.

### Option C — Hand back the one already running

- How it works: if one is already building, answer as though they'd just
  asked for that one, pointing at it.
- Good at: clicking twice is harmless and looks identical to clicking
  once. No pile-up, no error for normal behavior.
- Costs: someone who wanted a genuinely fresh export gets the older one.
- Breaks down when: the data changed between the two clicks and the
  person specifically wanted the newer data — a real but rare case, and
  they can ask again once the first finishes.

**Recommended: Option C**
**Why:** It makes the reported behavior (impatient clicking) harmless
instead of punishing it, and it protects the shared workers. Option B
enforces the same limit but turns an ordinary double-click into an error
the person has to understand. C's cost only shows up in a narrow case,
and the fix for it — wait, then ask again — is obvious.

## Sub-problem 3 — Who may download a finished file, and for how long?

**Serves:** R4, R5

### Option A — Anyone holding the link, forever

- How it works: the link itself is the permission.
- Good at: no checks; sharing with a colleague is trivial.
- Costs: an export is a full contact list. A link pasted into a chat or
  leaked from a browser history exposes all of it, permanently.
- Breaks down when: violates R4 outright. Not viable.

**Rejected:** Violates R4 outright — the link alone would expose a full contact list to
anyone who ever sees it.

### Option B — Only the owner, forever

- How it works: check on each download that the asker is the account that
  requested it. Keep files indefinitely.
- Good at: satisfies R4 completely; the person can always come back for it.
- Costs: stored files accumulate with no upper bound, which the
  constraints explicitly forbid.
- Breaks down when: the storage bill is the thing being watched.

**Rejected:** Stored files accumulate with no upper bound, which the constraints
explicitly forbid.

### Option C — Only the owner, for a fixed window

- How it works: check the asker is the owner, and check the file is still
  inside its keep-window. Outside it, refuse and say why.
- Good at: satisfies both R4 and R5. Storage has a natural ceiling.
- Costs: someone who comes back in a week has to ask again.
- Breaks down when: an export is so slow that the window starts running
  before the person can realistically fetch it — not a risk at 24 hours.

### Option D — Only the owner, one download only

- How it works: as C, but the file dies after the first successful fetch.
- Good at: smallest possible exposure window.
- Costs: a browser that retries, or a download that fails partway,
  silently burns the only chance. That's a support ticket every time.
- Breaks down when: downloads are flaky, which for large files they are.

**Rejected:** A retrying browser or a download that fails partway silently burns the
only chance, and large-file downloads fail partway often.

**Recommended: Option C**
**Why:** It's the only option that satisfies R4 and R5 together while
respecting the storage constraint. D adds real fragility for a security
gain the fixed window already mostly provides.

## How the sub-problems fit together

Someone clicks Export. We write down that they asked, and immediately
answer with a way to refer to that request. If they already have one
being built for this list, we point them at that one instead of writing
down a new one. Their page starts asking every few seconds whether it's
done, and shows building, ready, or failed.

Separately, a worker picks up the request, gathers the rows, writes the
file, and marks it ready — or, if something goes wrong, marks it failed.

When the page sees ready, it offers a download. That download checks two
things before handing anything over: that the asker owns this export, and
that it's still inside its 24-hour window. Anything else is refused with a
plain explanation.

## Edge cases, checked against the combined solution

- Clicks Export twice quickly → second ask finds the first still
  building, points at it. One export. ✅
- Account has zero contacts → nothing special happens; the file is built
  with only a header and marked ready. ✅
- Build crashes halfway → marked failed, page shows failed, no download
  is offered because only ready exports are downloadable. ✅
- Opens an old link after 24 hours → window check refuses, with an
  explanation. ✅
- Logged out, pastes link → no account to compare against, refused. ✅
- Different account pastes link → owner check refuses. ✅

## Rules confirmed to still hold

- **Nobody can download another account's export** — holds; the owner
  check is on the download itself, not on the page that links to it.
- **Nobody is left with a spinning page and no answer** — holds; the
  first answer is immediate and every later answer is one of three
  known states.
- **"Ready" is never a partial file** — holds; ready is only set after
  the file is completely written. This is why Option D of sub-problem 1 was
  rejected rather than adjusted.

## Open trade-offs

- Emailing a link when the export finishes (sub-problem 1, option B) is a real
  improvement for very long exports and can be added later without
  changing anything chosen here. Deliberately not in this round.
- The 24-hour window is a guess. It's a single value and can be tuned
  once there's evidence about when people actually come back.
