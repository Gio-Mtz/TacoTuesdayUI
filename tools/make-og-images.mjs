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

// Prettier rewrites `{{key}}` as `{{ key }}` in the template, so a literal
// replace stops matching and the card renders the placeholder itself.
const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

function fill(values) {
  const missing = new Set();
  const html = template.replace(PLACEHOLDER, (match, key) => {
    if (!(key in values)) {
      missing.add(key);
      return match;
    }
    return values[key];
  });
  if (missing.size) {
    console.error(
      `::error::the template asks for ${[...missing].join(', ')}, which no card supplies`,
    );
    process.exit(1);
  }
  return html;
}

// Named cards only. Re-rendering a card that did not change rewrites its PNG
// with whatever the local Chromium draws today, which is a binary diff nobody
// asked for.
const only = new Set(process.argv.slice(2));
const unknown = [...only].filter((key) => !(key in manifest.cards));
if (unknown.length) {
  console.error(`::error::the manifest has no card named ${unknown.join(', ')}`);
  process.exit(1);
}

const targets = new Map();
for (const [key, card] of Object.entries(manifest.cards)) {
  if (only.size && !only.has(key)) {
    continue;
  }
  if (!targets.has(card.image)) {
    targets.set(card.image, card);
  }
}

const jobs = [...targets].map(([imagePath, card]) => ({
  imagePath,
  card,
  html: fill({
    lang: card.lang,
    eyebrow: card.imageEyebrow,
    headline: card.title,
    headlineClass: card.title.length > 55 ? 'long' : '',
  }),
}));

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('::error::make-og-images needs playwright. See the docblock.');
  process.exit(2);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

for (const { imagePath, card, html } of jobs) {
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
