# ADR 0005 — `/talento`: a second page, a second language, one shared form

- **Status:** accepted
- **Date:** 2026-10-01
- **Story:** US-010 (`/talento` in Spanish, speaking to the candidate)
- **Builds on:** ADR 0002 (landing structure), ADR 0003 (waitlist form), US-009
  (which put `/` in English and wrote down the wrinkle this closes)

## Context

US-009 made a call that was right and incomplete: **`/` speaks English to the
company that pays.** The engineer is the other half of a two-sided marketplace,
they are mostly Mexican, and they do not read a hiring-manager pitch in English.

Three concrete things were left broken or lost by that decision:

1. **The brand line was translated, which cost it its voice.** The stakeholder's
   own sentence is *«¿Odias que los reclutas te ghosteen? Deja que ellos te
   busquen»*, and `brand.md` calls it "the brand". On `/` it renders as "Tired of
   recruiters ghosting you? Let them come to you" — correct, and flat.
   `ghosteen` is a Spanglish verb a Mexican dev has actually said out loud.
2. **The Spanish shell pointed at English pages.** `shell-copy.ts` offered
   `Empresas` / `Candidatos` / `Cómo funciona` and all three anchored at sections
   of `/`. A visitor on `/privacidad` clicked a Spanish word and landed in
   English. The file carried a `⚠️` saying US-010 would close it.
3. **There was no link to send a dev.** The channel this audience arrives through
   is WhatsApp, community Slacks and LinkedIn — not the home page.

## Decision

### 1. A page, not a section of `/`

`/talento` is its own route with its own `<h1>`, in Spanish, lazy-loaded.

The alternative was a Spanish section on `/`. That forces a choice between giving
the first screen to the audience that does not pay, or sending a dev to a page
written for a buyer and asking them to scroll past it. A route costs one lazy
chunk (4.65 kB) and lets both audiences be addressed properly.

### 2. These two pages are not translations of each other

`/` argues to a buyer; `/talento` argues to a candidate. The day one changes, the
other does not have to. This is the same reasoning that keeps
`@angular/localize`, `transloco` and a language selector out of this repo — see
`core/i18n/page-lang.ts`. Adding one later would be a regression, not a feature.

### 3. **Except the form.** The form is shared, and its words are data

The waitlist form is the one thing on both pages that genuinely is the same
thing: three fields, one `POST`, one contract with `/api/leads`, and the whole
pile of behaviour ADR 0003 argued for — the never-disabled submit, errors on
submit then live, focus moved to the confirmation, the honeypot, the double-send
guard.

So the component is reused and its copy moved to `waitlist-copy.ts`, keyed by
`PageLang`, exactly like `shell-copy.ts`.

**The rejected alternative was a second component**, and it is worth naming why:
every future fix to the focus handling or the error mapping would have to be
remembered twice. That is the failure TD-007 spent a whole card on — the same
icon written in five places — and the lesson from it is that a thing which must
be changed in two places eventually gets changed in one.

The seam between the two is a rule: **`waitlist-copy.ts` is for strings with no
editorial choice in them.** `Email` is `Correo`. If a string in there ever starts
wanting to differ in substance rather than in language, it does not belong there.

### 4. The page pins the kind; the chooser disappears

`<ttco-waitlist lockedKind="candidate" sectionId="lista-de-espera" />`.

A visitor who has just read three sections addressed to them should not be asked
"which side are you on?" at the bottom. The `<fieldset>` is **removed from the
DOM**, not hidden: a `hidden` radiogroup is still a radiogroup assistive tech can
be told about.

`lockedKind` is applied in `ngOnInit` and the `setValue` **emits**. The emit is
load-bearing — it is what runs `applyKind` and clears `company`'s `required`
validator. Without it the pinned form is invalid forever and the button does
nothing, on a page with no way to see or fix the offending field. There is a test
for exactly that.

### 5. Every nav destination is in the shell's own language

`ShellCopy.nav` became a list of `{ label, path, fragment }` instead of three
labels against three hardcoded anchors. A label is translatable; a destination is
a different page. The `es-MX` nav now points at `/talento`.

The cross-language link — the other audience's page — lives in the **footer**,
carries `hreflang`, and is labelled in its own language. `hreflang` is set *only*
when the target's language differs from the shell's, because a `hreflang` that
repeats the current language is still something a screen reader reads.

### 6. The step numbers are visible text here

On `/` the step number is a large `--tt-border-strong` span marked `aria-hidden`,
with "Step N:" repeated for screen readers. TD-008 measured that at **1.88:1** in
light and **1.73:1** in dark, under the 3:1 that size of bold text needs, and
fixing it is a design decision that is still open.

Rather than reproduce a known contrast defect on a new page, the number is part
of the heading (`1. Déjanos tu correo`) and inherits the title colour. One
element instead of two, and nothing hidden from assistive tech.

## Consequences

- **Two pages in two languages in production**, three with `/privacidad`.
  `PageHeadStrategy` already handles `lang` per route; nothing new was needed.
- **`index.html` still ships `lang="en"`**, so a crawler that does not run
  JavaScript reads `/talento` as English. Same trade `page-lang.ts` already
  documented for `/privacidad`, and the fix is prerendering, not a third mechanism.
- **A third audience or language means a third copy record**, and the parity spec
  (`waitlist-copy.spec.ts`) grows with it. That spec exists because a
  half-translated record compiles, passes every English component test, builds
  clean and ships a Spanish page with an empty button.
- **A renamed section id breaks three nav links silently.** `talent.spec.ts`
  asserts the three anchors `SHELL_COPY['es-MX'].nav` points at actually exist —
  nothing else in the build can see a link that navigates and sits still.
- **The OG tags of US-007 now have two pages to describe, not one**, and
  `/talento` is the one that will be shared most.
