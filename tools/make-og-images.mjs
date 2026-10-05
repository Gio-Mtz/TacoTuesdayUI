#!/usr/bin/env node
/**
 * Renders `public/og/*.png` — the 1200x630 image a link preview shows — from
 * `tools/og/card.template.html` and the copy in `social-cards.json`.
 *
 * ⚠️ **Not part of the build.** It needs a headless Chromium, which `ng build`
 * and the CI runner have no business installing. The PNGs are committed; this
 * script is how you regenerate them when the headline changes:
 *
 *     npx playwright@latest install chromium   # once
 *     node tools/make-og-images.mjs
 *
 * The copy is read from the manifest rather than typed here so the picture and
 * the `og:title` tag cannot say different things.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(REPO, 'tools/og/card.template.html');
const MANIFEST = join(REPO, 'src/app/core/seo/social-cards.json');
const SCRATCH = join(REPO, 'tools/og/.render.html');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const template = readFileSync(TEMPLATE, 'utf8');

// One image per distinct `image` path, so `/privacidad` reusing the home card
// does not render it twice.
const targets = new Map();
for (const card of Object.values(manifest.cards)) {
  if (!targets.has(card.image)) {
    targets.set(card.image, card);
  }
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('::error::make-og-images needs playwright. See the docblock.');
  process.exit(2);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

for (const [imagePath, card] of targets) {
  const html = template
    .replace('{{lang}}', card.lang)
    .replace('{{eyebrow}}', card.imageEyebrow)
    .replace('{{headline}}', card.title)
    .replace('{{headlineClass}}', card.title.length > 55 ? 'long' : '');

  writeFileSync(SCRATCH, html, 'utf8');
  await page.goto(`file://${SCRATCH}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // The headline must not be clipped. Checked in the renderer rather than by
  // eye, because the card is generated from copy that changes.
  const overflow = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    // Measured against `max-height`, not against `clientHeight`: clientHeight
    // IS capped by max-height, so comparing the two reports a clip for every
    // headline whose line box rounds up a pixel. The real question is whether
    // the laid-out text is taller than the box it is allowed to occupy.
    const maxHeight = parseFloat(getComputedStyle(h1).maxHeight);
    return {
      tooTall: h1.scrollHeight > maxHeight + 1,
      tooWide: h1.scrollWidth > h1.clientWidth + 1 || document.body.scrollWidth > 1200,
      pastFold: Math.round(h1.getBoundingClientRect().bottom) > 630,
      height: h1.scrollHeight,
      maxHeight,
    };
  });
  if (overflow.tooTall || overflow.tooWide || overflow.pastFold) {
    console.error(
      `::error::headline overflows the card for ${imagePath}: ${JSON.stringify(overflow)}`,
    );
    await browser.close();
    process.exit(1);
  }

  const out = join(REPO, 'public', imagePath.replace(/^\//, ''));
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: 'png' });
  console.log(`  ok  ${imagePath}  (${card.route})`);
}

await browser.close();
