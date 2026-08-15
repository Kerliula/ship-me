# Examples

One feature carried through the whole pipeline, so you can see what each
phase actually produces before you run it on your own work.

> **These are illustrative, not a transcript.** They're written to match
> each skill's output format exactly, using a realistic feature, so the
> shape and level of detail are accurate. They aren't a redacted log of
> one real session.

## export-timeout

*"Exporting a big contact list never finishes."* A slow CSV export that
times out on exactly the accounts with the most data.

| | Phase | What to look at |
|---|---|---|
| [1-grilling.md](export-timeout/1-grilling.md) | `/grill-me` | The **Out of scope** list and the copy-paste **Requirements** block at the bottom. R1–R6 are set here, and every later phase refers back to those numbers. |
| [2-solutions.md](export-timeout/2-solutions.md) | `/solve-me` | Four genuinely different options for the main piece, each with a real cost — and one (streaming) rejected because it breaks a rule from phase 1, not because it's unpopular. No framework names anywhere. |
| [3-build.md](export-timeout/3-build.md) | `/build-me` | Five commits, each naming the piece it comes from, the option it builds, and the R-numbers it serves. This is the plan you approve *before* any code is written. |
| [4-verification.md](export-timeout/4-verification.md) | `/verify-me` | Eleven real requests against a running app, a coverage table where every R-number is accounted for, and **one requirement that failed**. |

The most useful part is probably R5 in phase 4. The expiry check was
written into the commit plan, landed in the wrong place, looked correct
from the UI, and got caught only because something hit the download
endpoint directly with an aged record. `/verify-me` reports it and stops
— it doesn't fix it, and it doesn't write the tests it just listed.

## Adding your own

If you run the pipeline on something and the output is shareable, a PR
adding it here is welcome. Scrub real hostnames, account ids, tokens, and
customer data first — `/verify-me` output in particular contains real
request and response bodies from whatever app you pointed it at.
