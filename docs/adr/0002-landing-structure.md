# ADR 0002 — How the landing page is put together

- **Status:** accepted
- **Date:** 2026-09-29
- **Story:** US-002

## Context

US-002 turns an app with one debug screen into a public landing: a hero, three
content sections, a site header with the theme toggle, a footer and a privacy
notice. It is the first time this repo has more than one screen, so several
conventions get set here whether we name them or not. These are the four worth
naming.

## Decision 1 — Layout primitives are global CSS, section styles are not

`src/styles/_layout.scss` holds the container, the section rhythm, the button,
the card and the skip link. Everything else lives in the component that uses
it.

Two forces pushed this way. `angular.json` errors any single component
stylesheet above 8 kB, and five sections that each restated the container, the
vertical rhythm and the button would have crowded that ceiling while saying the
same thing five times. The second force is the one that actually matters:
three slightly different buttons is how a design system dies, and it dies
quietly — nobody notices until the fourth one.

Angular's emulated encapsulation scopes a *component's* styles to that
component; it does not stop global CSS from reaching the component's DOM. So a
global class is usable from any template with no `::ng-deep` and no host
selectors.

**Consequence:** a new shared primitive goes in `_layout.scss` under a `tt-`
prefix. Anything used once stays in its component. When you find yourself
copying a block between two sections, that is the signal to move it.

## Decision 2 — Each section owns its copy

`Companies`, `Candidates` and `HowItWorks` hold their own text as typed arrays
in the component, and `Landing` is nothing but an ordering of four tags.

The alternative — one `landing.html` with everything inline — was tempting for
a page this small. It was rejected because the copy on this page is the product
right now: it will be edited far more often than the layout, and a 200-line
template makes every copy change a diff nobody can review. This way, changing
the Empresas pitch touches one file and the reviewer sees exactly one section.

`Landing` staying trivial is also what makes it readable: the order of the
argument (what this is → why the payer cares → why the candidate cares → how
little it costs to find out) fits in four lines.

**Consequence:** the waitlist form from US-003 is another section component
placed after `ttco-how-it-works`, not an edit to any of these.

## Decision 3 — In-page links go through the router, not bare `#hash`

The header and the hero use `routerLink="/" fragment="empresas"`, and
`app.config.ts` enables `withInMemoryScrolling({ anchorScrolling: 'enabled' })`.

A bare `href="#empresas"` is simpler and works — but only while the visitor is
already on the landing. From `/privacidad` the same link scrolls to nothing,
silently. Going through the router means the link navigates to the landing
first and *then* scrolls, from anywhere, which is what the visitor meant.

`scrollPositionRestoration: 'enabled'` comes along for the ride: without it,
Back from the privacy notice drops the visitor at the top of the landing
instead of where they were reading.

The one place that deliberately keeps a bare `href` is the skip link in
`app.html`. A skip link has to move *focus*, not just the scroll position, and
the browser's own same-document jump is the only thing that does both —
`tabindex="-1"` on `<main>` is what lets focus land there.

**Consequence:** `anchorScrolling` is load-bearing. Remove it and every nav
link navigates and the page sits still, with no error anywhere.

## Decision 4 — No mobile menu below 768 px

Under `md` the header keeps the wordmark and the theme toggle and drops the
three nav links.

A hamburger is an overlay, a focus trap, an escape handler and a pile of ARIA,
and it would exist to reach three anchors on a single short page that scrolling
already reaches. It comes back the day there is a second page worth navigating
to, and then it will be worth building properly.

**Consequence:** every section has to be reachable by scrolling, which means
the landing stays one page. If that stops being true, this decision expires.

## Two things measured, not guessed

Both were caught by rendering the page in a real browser at 360 px, not by
reading the CSS.

**`box-sizing: border-box` is now global** (`src/styles.scss`). `.tt-container`
is `width: 100%` plus a 1 rem gutter; under the browser default `content-box`
that is 392 px inside a 360 px phone, and the whole page scrolled sideways.

**`--tt-text-muted` is not safe on `--tt-bg-canvas`.** In the light theme the
pair measures 4.39:1, which misses AA for 14 px text. The hero's footnote uses
`--tt-text-secondary` instead. Muted is fine on `--tt-bg-surface` (4.58:1), but
it has no margin there either — treat it as a colour for text that genuinely
does not matter, and measure before using it on a new background.
