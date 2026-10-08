<!--
  Keep this short. The CI is the judge; this template is the human context around it.
  Delete the comment lines, not the headings. An empty section is an unanswered question.
-->

## What this changes

<!-- One or two sentences. What a reviewer would see if they opened the app. -->

**Card:** <!-- US-0xx / TD-0xx / S0-x / OPS-xx -->

## Why it matters

<!-- The business value in one sentence: why a customer or Gio cares. Not "because the card says so". -->

## Acceptance criteria

<!-- Copy them from the card and tick them one by one. An unticked box means not done, not "probably fine". -->

- [ ]
- [ ]

## How it was verified

> Paste the **real output**, not a summary. "It should pass" is not evidence.

- [ ] `npm ci` — exit 0
- [ ] `npm run build` — exit 0
      <!-- Run `npm run build`, never `ng build`: part of the product is produced by the
           postbuild emitters, so `ng build` passing proves less than it looks like. -->
- [ ] `npx ng test --watch=false` — the **full** suite, exit 0
      <!-- The runner is vitest. It takes no per-file filter and `--browsers=` aborts the run. -->
- [ ] `npm run check:contrast` — exit 0

```text
paste here: the test tail (`N passed (M files)`) and the build bundle sizes
```

## What was NOT verified

> **Required.** If everything in scope was verified, write `nothing` on purpose. A blank
> section reads as "I forgot", and the next block has to re-derive it.

## Guards

<!-- A guard that only ever passes is decoration. -->

- [ ] No guard was added or changed in this PR
- [ ] A guard was added or widened, **and it was tested in reverse** — pointed at something
      impossible and seen to fail, with the failing assert name and the `N failed | M passed`
      counts pasted above

<!-- To undo the reverse-test edit, restore from a scratch copy of the file.
     `git checkout -- <file>` deletes the real work along with the probe. -->

## Pages measured

<!-- Only if this PR touches routing, the bundle, `<head>`, or the card manifest. -->

- [ ] `/` · [ ] `/talento` · [ ] `/privacidad` · [ ] `/privacy`
      <!-- Measure every page, not the home. A regression likes to hide on the page nobody opens. -->

## Before merge

- [ ] **CI is green on this branch** — not "should be". Green. It is the only judge that cannot
      talk itself into believing everything is fine.
- [ ] The diff contains **only** the files this card needs (`git status --porcelain` before
      committing; `main` is not prettier-formatted, so never run `prettier --write` over a wide glob)
- [ ] If there was an architecture decision, there is an ADR in `docs/adr/`
- [ ] Gio ran it locally and it is fine **as a product**, not just as a build
