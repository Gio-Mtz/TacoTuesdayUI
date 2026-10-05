#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(REPO, 'tools/og/card.template.html');
const MANIFEST = join(REPO, 'src/app/core/seo/social-cards.json');
const SCRATCH = join(REPO, 'tools/og/.render.html');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const template = readFileSync(TEMPLATE, 'utf8');

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

  const overflow = await page.evaluate(() => {
    const h1 = document.querySelector('h1');

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
