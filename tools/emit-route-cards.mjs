#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = join(REPO, 'src/app/core/seo/social-cards.json');
const START = '<!-- tt:social-card:start -->';
const END = '<!-- tt:social-card:end -->';

function die(code, message) {
  console.error(`::error::emit-route-cards: ${message}`);
  process.exit(code);
}

function attr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function findDist(explicit) {
  if (explicit) {
    return existsSync(join(explicit, 'index.html'))
      ? explicit
      : die(2, `--dist ${explicit} has no index.html`);
  }

  const root = join(REPO, 'dist');
  if (!existsSync(root)) {
    die(2, 'no dist/ — run `ng build` first');
  }

  const found = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, entry.name, 'browser'))
    .filter((candidate) => existsSync(join(candidate, 'index.html')));

  if (found.length !== 1) {
    die(2, `expected exactly one dist/*/browser/index.html, found ${found.length}`);
  }
  return found[0];
}

// GUARD, not documentation: these preloads are what keeps CLS at 0.002 instead of
// 0.299 on /privacidad. The @font-face rules use font-display: swap, so without the
// preload the three woff2 files land after first paint and reflow the whole text
// block. The hashes change every build, which is why this is emitted and not
// checked into src/index.html. If PRELOAD_FONTS stops matching the emitted file
// names, this dies instead of silently shipping the shift back.
const PRELOAD_FONTS = /^[a-z-]+-latin-wght-normal-[A-Z0-9]+\.woff2$/;

function preloadFonts(template, dist) {
  const mediaDir = join(dist, 'media');
  if (!existsSync(mediaDir)) {
    die(2, 'no media/ in dist — the font pipeline moved, preloads cannot be emitted');
  }

  const files = readdirSync(mediaDir)
    .filter((name) => PRELOAD_FONTS.test(name))
    .sort();
  if (files.length === 0) {
    die(2, `no file in media/ matches ${PRELOAD_FONTS} — preloads would be silently dropped`);
  }

  const links = files
    .map((name) => `  <link rel="preload" as="font" type="font/woff2" crossorigin href="media/${name}">`)
    .join('\n');

  if (!template.includes('</head>')) {
    die(2, 'index.html has no </head> to insert the font preloads before');
  }
  const clean = template.replace(/[ \t]*<link rel="preload" as="font"[^>]*>\r?\n?/g, '');
  return clean.replace('</head>', `${links}\n</head>`);
}

function cardTags(card, manifest) {
  const base = manifest.siteBaseUrl.replace(/\/$/, '');
  const url = card.route === '/' ? `${base}/` : `${base}${card.route}`;
  const image = `${base}${card.image}`;
  const lines = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', manifest.siteName],
    ['property', 'og:title', card.title],
    ['property', 'og:description', card.description],
    ['property', 'og:url', url],
    ['property', 'og:locale', card.locale],
    ['property', 'og:image', image],
    ['property', 'og:image:width', manifest.image.width],
    ['property', 'og:image:height', manifest.image.height],
    ['property', 'og:image:alt', card.imageAlt],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', card.title],
    ['name', 'twitter:description', card.description],
    ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', card.imageAlt],
    ['name', 'description', card.description],
    ['name', 'robots', card.indexable ? 'index, follow' : 'noindex, nofollow'],
  ].map(([kind, key, value]) => `  <meta ${kind}="${key}" content="${attr(value)}">`);

  lines.push(`  <link rel="canonical" href="${attr(url)}">`);

  if (card.alternate) {
    const other = manifest.cards[card.alternate];
    if (!other) {
      die(2, `card "${card.route}" points at alternate "${card.alternate}", which does not exist`);
    }
    const home = manifest.cards.home;
    for (const [hreflang, route] of [
      [card.lang, card.route],
      [other.lang, other.route],
      ['x-default', home.route],
    ]) {
      const href = route === '/' ? `${base}/` : `${base}${route}`;
      lines.push(`  <link rel="alternate" hreflang="${attr(hreflang)}" href="${attr(href)}">`);
    }
  }

  return { html: lines.join('\n'), url };
}

function render(template, card, manifest) {
  const start = template.indexOf(START);
  const end = template.indexOf(END);
  if (start === -1 || end === -1) {
    die(2, `index.html has no ${START} / ${END} markers — did src/index.html lose them?`);
  }

  const { html, url } = cardTags(card, manifest);
  let out =
    template.slice(0, start + START.length) + '\n' + html + '\n  ' + template.slice(end);

  const langAttr = /(<html\b[^>]*?)\blang="[^"]*"/;
  if (!langAttr.test(out)) {
    die(2, 'index.html has no <html lang="..."> to rewrite');
  }
  out = out.replace(langAttr, `$1lang="${attr(card.lang)}"`);
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(card.documentTitle)}</title>`);
  return { out, url };
}

function verify(path, card, url, manifest) {
  const html = readFileSync(path, 'utf8');
  const expectations = [
    ['rel="preload" as="font"', 'font preload'],
    [`lang="${card.lang}"`, 'lang'],
    [`<title>${attr(card.documentTitle)}</title>`, 'title'],
    [`<meta property="og:title" content="${attr(card.title)}">`, 'og:title'],
    [`<meta property="og:url" content="${attr(url)}">`, 'og:url'],
    [`<meta property="og:image" content="${manifest.siteBaseUrl.replace(/\/$/, '')}${card.image}">`, 'og:image'],
  ];
  const missing = expectations.filter(([needle]) => !html.includes(needle)).map(([, name]) => name);
  if (missing.length) {
    die(1, `${path} is missing: ${missing.join(', ')}`);
  }
  if (html.includes('name="og:title"')) {
    die(1, `${path} has name="og:title" — Open Graph needs property=, not name=`);
  }
}

function sitemap(manifest) {
  const base = manifest.siteBaseUrl.replace(/\/$/, '');
  const urls = Object.values(manifest.cards)
    .filter((card) => card.indexable)
    .map((card) => {
      const loc = card.route === '/' ? `${base}/` : `${base}${card.route}`;
      const alternates = card.alternate
        ? [card, manifest.cards[card.alternate]]
            .map((entry) => {
              const href = entry.route === '/' ? `${base}/` : `${base}${entry.route}`;
              return `    <xhtml:link rel="alternate" hreflang="${entry.lang}" href="${href}" />`;
            })
            .join('\n') + '\n'
        : '';
      return `  <url>\n    <loc>${loc}</loc>\n${alternates}  </url>`;
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

function robots(manifest) {
  const base = manifest.siteBaseUrl.replace(/\/$/, '');
  const disallow = Object.values(manifest.cards)
    .filter((card) => !card.indexable)
    .map((card) => `Disallow: ${card.route}`);

  return [
    '# Generated by tools/emit-route-cards.mjs. Do not edit.',
    'User-agent: *',
    'Allow: /',
    ...disallow,
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const distFlag = argv.indexOf('--dist');
  const dist = findDist(distFlag === -1 ? null : argv[distFlag + 1]);

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    die(2, `cannot read ${MANIFEST_PATH}: ${error.message}`);
  }

  const rootPath = join(dist, 'index.html');
  const template = preloadFonts(readFileSync(rootPath, 'utf8'), dist);
  const written = [];

  const home = Object.values(manifest.cards).find((card) => card.route === '/');
  if (!home) {
    die(2, 'no card has route "/" — index.html would keep whatever is checked in');
  }
  const rootRender = render(template, home, manifest);
  writeFileSync(rootPath, rootRender.out, 'utf8');
  verify(rootPath, home, rootRender.url, manifest);
  written.push(['index.html', home.lang, home.route]);

  for (const card of Object.values(manifest.cards)) {
    if (!card.dir) {
      continue;
    }
    const dir = join(dist, card.dir);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, 'index.html');
    const { out, url } = render(template, card, manifest);
    writeFileSync(path, out, 'utf8');
    verify(path, card, url, manifest);
    written.push([`${card.dir}/index.html`, card.lang, card.route]);
  }

  writeFileSync(join(dist, 'sitemap.xml'), sitemap(manifest), 'utf8');
  writeFileSync(join(dist, 'robots.txt'), robots(manifest), 'utf8');

  console.log(`emit-route-cards: ${dist}`);
  for (const [file, lang, route] of written) {
    console.log(`  ok  ${file.padEnd(24)} lang=${String(lang).padEnd(6)} ${route}`);
  }
  console.log('  ok  sitemap.xml');
  console.log('  ok  robots.txt');
}

main();
