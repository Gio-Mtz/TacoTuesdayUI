# 6. Social cards are baked into static HTML at build time, not only written at runtime

- Status: accepted
- Date: 2026-10-05
- Story: US-007 (the half that does not depend on Azure)

## Context

A link to this site gets pasted into WhatsApp, LinkedIn or Slack, and the app
there draws a preview card. To draw it, the app's crawler fetches the URL and
reads the HTML — **without executing JavaScript**. None of the major ones run a
bundle: not Facebook's, not WhatsApp's, not LinkedIn's, not Slack's, not
Twitter's.

This site is a single-page Angular app on Azure Static Web Apps, and
`staticwebapp.config.json` has a `navigationFallback` that answers **every**
unknown path with the same `index.html`. So before this change, every crawler
that asked for any URL received one file, with one `<title>`, one `lang="en"`
and no Open Graph tags at all.

US-010 made that concrete rather than theoretical. `/talento` is the page that
gets sent to engineers — the link that goes into a WhatsApp group — and it is in
Spanish. A preview of it would have shown the English landing's title, in a
document declaring `lang="en"`.

## Decision

Social cards are written **twice**, by two mechanisms, and both ship or neither
does.

1. **At runtime**, `PageSocialMetaService` writes `og:*`, `twitter:*`,
   `canonical` and `hreflang` on every navigation, driven from
   `PageHeadStrategy` — the same hook that already sets `<title>` and
   `<html lang>`. This is the half that keeps up with client-side navigation,
   which a static file cannot.

2. **At build time**, `tools/emit-route-cards.mjs` runs as an npm `postbuild`
   step and writes one real HTML file per shareable route —
   `talento/index.html`, `privacidad/index.html` — each with its own card, its
   own `<title>` and its own `lang`. `public/staticwebapp.config.json` gained
   `routes` entries that rewrite `/talento` and `/privacidad` to those files, so
   Static Web Apps serves them instead of falling through to `index.html`.

The copy for both lives in **one** file, `src/app/core/seo/social-cards.json`.

## Consequences

**Why JSON, in a repo where everything else is a heavily commented `.ts`.** The
manifest has two consumers that cannot share a module system: the Angular app,
and a plain Node script with no TypeScript and no dependencies. JSON is the only
format both read with no build step. The cost is that the manifest cannot carry
comments, so the reasoning lives in `page-social.ts` instead.

**A bonus that falls out for free: `lang` is now right for crawlers too.** US-009
wrote down a trade — `src/index.html` ships `lang="en"`, so a crawler that does
not run JavaScript read `/privacidad` as English — and US-010 inherited it for
`/talento`. The emitted per-route files carry the right `lang` in the static
HTML. The trade still stands for any route **without** an emitted file, which
today is only `/health`.

**`property` vs `name` is the trap this design is shaped around.** Open Graph is
read from `<meta property>`; Twitter's tags from `<meta name>`. Writing
`name="og:title"` produces a tag that looks correct in devtools, validates as
HTML, and is ignored by every Open Graph consumer there is — and a test that
greps the document for the string `og:title` passes on the broken version. Every
assertion in `page-social.spec.ts` names the attribute, and the emitter fails
hard if it ever finds `name="og:"` in a file it just wrote.

**The emitter verifies what it wrote instead of trusting the write.** That is not
belt-and-braces: it caught a real bug during this story. The regex that rewrites
`<html lang>` assumed `lang` was the last attribute on the tag, and the
production build's critical-CSS step adds `data-beasties-container` to that very
tag. The replacement matched nothing and every emitted file would have shipped
with `lang="en"` — silently, since the pages still rendered perfectly.

**The card image is generated from the manifest, not drawn by hand.**
`tools/make-og-images.mjs` renders `tools/og/card.template.html` at exactly
1200x630 with a headless Chromium, so the picture and the `og:title` tag cannot
drift apart. It is **not** part of the build: it needs a browser, which CI has no
business installing, and the PNGs are committed. The template references
`public/favicon.svg` rather than copying the isotype into it — TD-007 was about
the same drawing living in five places and this is not going to be the sixth.

**What a human has to do for this to be true in production.** The emitter runs as
`postbuild`, which fires when the deploy builds the app with `npm run build`.
The Static Web Apps workflow in `.github/` sets no `app_build_command`, so it
relies on Oryx's default — and nothing in this repo can prove what the runner
actually ran. The one-line confirmation is
`curl -s https://<site>/talento | grep og:title`, which has to come back in
Spanish.

**Rejected: Angular's prerender / SSG.** It produces the same static files and
much more besides — a server entry, `@angular/platform-server`, a second build
target, and a zoneless app rendered in Node. The whole need here is twenty lines
of `<head>` per route. The day this site needs real server rendering, that
decision replaces this one; the manifest survives it.

**Rejected: a trailing-slash-free custom domain today.** `siteBaseUrl` in the
manifest is the generated `*.azurestaticapps.net` host, because that is the host
that answers. When `tacotuesdayco.com` is pointed at the Static Web App, that
one line changes and `canonical`, `og:url`, the sitemap and the emitted HTML all
follow it.
