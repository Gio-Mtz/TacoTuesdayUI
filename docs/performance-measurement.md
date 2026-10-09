# Measuring performance on this app

## The rule

**Never judge a Lighthouse number taken against an uncompressed server.**

Azure Static Web Apps serves this app with brotli/gzip. A plain static server
(`http-server`, `python -m http.server`) does not. On the **mobile** Lighthouse
preset the network is throttled, so that one difference is worth about
**14 performance points** on this app. A number measured without compression is
a floor, not a result, and optimising against it means optimising a measurement
artifact.

## How to measure

```bash
npm run build
npm run serve:dist          # http://127.0.0.1:8099, brotli/gzip, like Azure
npx lighthouse http://127.0.0.1:8099/ --only-categories=performance
```

`serve:dist` reads `staticwebapp.config.json` **from the built output**, so the
route rewrites, navigation fallback and global headers under test cannot drift
away from what is deployed.

To reproduce the uncompressed floor on purpose — useful when a number from an
older run looks wrong and you need to tell "no compression" apart from "slow
code":

```bash
npm run serve:dist -- --port 8098 --no-compress
```

Measure **all four routes**, not just the home page: `/`, `/talento`,
`/privacidad`, `/privacy`.

## Measured on 2026-10-09 (commit `d8bda05`, mobile preset, 2 runs per route)

| Route | Compressed (as deployed) | Uncompressed floor |
| --- | --- | --- |
| `/` | **93–94** | 76–78 |
| `/talento` | **94** | 80–81 |
| `/privacidad` | **96** | 82 |
| `/privacy` | **96** | 81–82 |

Core Web Vitals, compressed: FCP 1.41–1.44 s, LCP 2.31–2.45 s,
TBT 131–230 ms, CLS 0.000 in 15 of 16 runs (one 0.075 outlier on `/privacy`,
still inside the 0.1 "good" threshold).

Uncompressed, the same build: FCP ~2.78 s, LCP ~3.78 s — so compression buys
roughly **1.35 s of FCP and 1.37 s of LCP**. Transfer size for the initial
bundle is 369 kB raw versus 96 kB compressed.

**TBT does not move with compression** (131–230 ms compressed, 170–362 ms
uncompressed — overlapping ranges). A TBT problem is never a compression
problem; look at the main thread instead.

## What these numbers are not

- They are **not** production numbers. They are a local Chromium under
  Lighthouse's simulated mobile throttling, on CI-class hardware. Real Azure
  adds a CDN, TLS and real network latency.
- Lighthouse scores on a shared or busy machine carry real variance. A single
  run is not evidence. **Two runs minimum, and report the range, not one
  number.** An earlier run of this same build on a busier machine reported
  64–72 with LCP 4.7 s; neither the compressed nor the uncompressed server
  reproduced that, which means part of that number was host noise.
- A Lighthouse **accessibility** score does not cover every accessibility
  requirement. This app once scored 100/100 on four routes while its focus ring
  failed WCAG 1.4.11 contrast. Use `npm run check:contrast` for that.
