# ADR 0001 — How the design system is wired into the Angular app

- **Status:** accepted
- **Date:** 2026-09-29
- **Story:** US-001

## Context

The design system lives in its own folder, `TacoTuesdayDesign`, and ships two
files that the app has to load: `01-tokens/theme.css` (CSS custom properties
that change with the theme) and `01-tokens/_tokens.scss` (Sass values that do
not). The app also has to decide light or dark at runtime.

Two questions had to be answered.

## Decision 1 — `theme.css` is registered in `angular.json`, not `@import`ed

`styles.scss` `@use`s the Sass tokens, but `theme.css` is listed in the
`styles` array of `angular.json`, ahead of `src/styles.scss`.

The obvious alternative, `@import './styles/theme.css'` inside `styles.scss`,
is a trap. Dart Sass treats an `@import` whose URL ends in `.css` as a *plain
CSS import* and passes it straight through to the output — so the browser would
fetch `theme.css` as a second, render-blocking request instead of inlining it
in the bundle. Dropping the extension (`@import './styles/theme'`) would inline
it, but `@import` is deprecated in Dart Sass and Angular 21 warns on it.

Listing it in `angular.json` has neither problem, guarantees it loads before
anything that might override it, and keeps `theme.css` byte-identical to the
copy in `TacoTuesdayDesign`. That last point is the one that will matter in six
months: re-syncing the design system is a copy, never a merge.

**Consequence:** anyone adding a global stylesheet must keep it *after*
`theme.css` in that array, or their rules will lose to the token defaults.

## Decision 2 — "system" means removing `data-theme`, not computing it

`theme.css` resolves the theme in three steps: an explicit
`[data-theme]` attribute, then `@media (prefers-color-scheme: dark)`, then
`:root` as light.

So `ThemeService` writes `data-theme` only for an explicit choice. For
"follow my system" it **removes** the attribute and lets the CSS do the work.

The alternative — reading `matchMedia` and writing the answer into
`data-theme` — looks equivalent and is not. The moment the visitor flips their
OS to dark with the tab open, the stale attribute still says `light` and the
page disagrees with the rest of their machine. Removing the attribute makes
that case impossible rather than something to remember to handle.

`ThemeService.resolved()` does still track `matchMedia`, because a theme toggle
needs to know which icon to show. It is a read for the UI, never the source of
truth for what renders.

**Consequence:** the storage key is absent, not `"system"`, when the visitor
follows their OS. The anti-flash script in `index.html` depends on exactly this
— it only has to recognise `light` and `dark`.

## Decision 3 — an inline script in `index.html` for the anti-flash

`theme.css` handles `prefers-color-scheme` on its own, so the only visitor who
would see a wrong-theme flash is one whose saved choice *disagrees* with their
OS. Angular boots after first paint, so the service cannot prevent it. Six
lines of inline script before the stylesheet can.

The cost is a duplicated storage key (`tt-theme`) in two places. Both are
commented pointing at the other. There is no CSP on the Static Web App today;
if one is ever added, this script needs a hash or a nonce.
