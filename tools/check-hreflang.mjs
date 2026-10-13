/**
 * Fails when the hreflang annotations the build emits are not a reciprocal,
 * self-contained set -- the two conditions Google requires before it honours
 * them at all.
 *
 * Why this guard exists, in one paragraph. Three places emit hreflang and they
 * do not agree. `src/app/core/seo/page-social.ts` writes them at runtime,
 * `tools/emit-route-cards.mjs` writes them into each emitted `index.html` for
 * crawlers, and the same file writes a THIRD set into `sitemap.xml`. All three
 * were written separately and two of them are wrong in the same way: the first
 * two hardcode `x-default` to the home route, and the sitemap omits `x-default`
 * entirely. So `/privacidad` tells a crawler "my x-default is `/`" while `/`
 * never mentions `/privacidad` at all, and the sitemap tells it something
 * different again.
 *
 * Why that is a bug and not a nitpick. Google's rule is that hreflang
 * annotations must be reciprocal: if page A annotates page B, page B must
 * annotate A back, or the annotations "may be ignored or not interpreted
 * correctly" -- and that is the whole set for that cluster, not just the
 * offending line. `x-default` is part of the set. Pointing it at a URL outside
 * the cluster makes every annotation on the two privacy notices
 * non-reciprocal, which is the opposite of what US-011 was for. The landing
 * cluster is accidentally correct, because its English member IS `/`; that is
 * why this went unnoticed and why the fix changes nothing there.
 *
 * What this guard measures, and what it does not. It reads the EMITTED dist --
 * the real `<link rel="alternate">` tags in each `<dir>/index.html` and the
 * real `<xhtml:link>` entries in `sitemap.xml` -- not the source that was
 * supposed to produce them. It does not contact Google, and it does not claim
 * anything about whether Google currently indexes these pages correctly; it
 * claims the annotations satisfy the documented preconditions. The runtime
 * emitter in `page-social.ts` is covered by its own specs, not by this guard,
 * because it never reaches dist.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = join(REPO, 'src/app/core/seo/social-cards.json');

// The language that answers a visitor whose own language matches nothing in a
// cluster. It is a property of the product (the site's default copy is
// English), not of any one page, which is why it lives here and not in the
// manifest.
const DEFAULT_LANG = 'en';

let failed = 0;
let checks = 0;

function fail(message) {
  failed += 1;
  console.log(`FAIL  ${message}`);
}

function pass(message) {
  console.log(`PASS  ${message}`);
}

function die(code, message) {
  console.error(`::error::check-hreflang: ${message}`);
  process.exit(code);
}

function findDist(explicit) {
  if (explicit) {
    return existsSync(join(explicit, 'index.html'))
      ? explicit
      : die(2, `--dist ${explicit} has no index.html`);
  }
  const root = join(REPO, 'dist');
  if (!existsSync(root)) {
    die(
      2,
      'no dist/ -- run `npm run build` first (this guard reads what was emitted, not what should have been)',
    );
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

function read(path, label) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    die(2, `cannot read ${label} (${path}): ${error.message}`);
  }
}

const manifest = JSON.parse(read(MANIFEST_PATH, 'the social card manifest'));
const dist = findDist(
  process.argv.includes('--dist') ? process.argv[process.argv.indexOf('--dist') + 1] : null,
);
const base = String(manifest.siteBaseUrl ?? '').replace(/\/$/, '');
if (!base) {
  die(2, 'the manifest has no siteBaseUrl -- every href below would be relative and uncomparable');
}

const cards = Object.entries(manifest.cards ?? {});
if (cards.length === 0) {
  die(2, 'the manifest has no cards -- there would be nothing to check, and silence is not a pass');
}

const absolute = (route) => (route === '/' ? `${base}/` : `${base}${route}`);

// The file a card is actually emitted into, or null when the build writes none.
// `dir` is what the emitter keys off: a card with a `dir` gets its own
// `<dir>/index.html`, the home card IS `dist/index.html`, and anything else
// (`/health`) has no file of its own and lands on the navigationFallback at
// request time. Resolving those to `dist/index.html` would measure the home
// page's annotations and blame them on another card -- which is exactly what
// the first draft of this guard did.
function emittedFile(card) {
  if (card.dir) return join(dist, card.dir, 'index.html');
  if (card.route === '/') return join(dist, 'index.html');
  return null;
}

// --- what the emitted HTML actually says -------------------------------------

function annotationsInHtml(html) {
  const out = [];
  const linkPattern = /<link\b[^>]*>/gi;
  for (const [tag] of html.matchAll(linkPattern)) {
    if (!/\brel\s*=\s*["']alternate["']/i.test(tag)) continue;
    const hreflang = tag.match(/\bhreflang\s*=\s*["']([^"']+)["']/i);
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hreflang || !href) continue;
    out.push([hreflang[1], href[1]]);
  }
  return out;
}

// --- what the emitted sitemap actually says ----------------------------------

function annotationsInSitemap(xml) {
  const byLoc = new Map();
  const blockPattern = /<url\b[\s\S]*?<\/url>/gi;
  for (const [block] of xml.matchAll(blockPattern)) {
    const loc = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i);
    if (!loc) {
      fail(
        'a <url> block in sitemap.xml has no <loc> -- it annotates nothing and cannot be checked',
      );
      checks += 1;
      continue;
    }
    const entries = [];
    const linkPattern = /<xhtml:link\b[^>]*>/gi;
    for (const [tag] of block.matchAll(linkPattern)) {
      if (!/\brel\s*=\s*["']alternate["']/i.test(tag)) continue;
      const hreflang = tag.match(/\bhreflang\s*=\s*["']([^"']+)["']/i);
      const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (!hreflang || !href) continue;
      entries.push([hreflang[1], href[1]]);
    }
    byLoc.set(loc[1], entries);
  }
  return byLoc;
}

const sitemapPath = join(dist, 'sitemap.xml');
if (!existsSync(sitemapPath)) {
  die(
    2,
    'no sitemap.xml in dist -- the emitter did not run, and an absent sitemap is not a passing sitemap',
  );
}
const sitemap = annotationsInSitemap(read(sitemapPath, 'the emitted sitemap'));
if (sitemap.size === 0) {
  die(
    2,
    'sitemap.xml declares no <url> -- against the void, that is a failure and not an empty pass',
  );
}

// --- the clusters, derived from the manifest ---------------------------------

const paired = cards.filter(([, card]) => card.alternate);
const unpaired = cards.filter(([, card]) => !card.alternate);

if (paired.length === 0) {
  die(2, 'no card has an "alternate" -- there would be no hreflang set to check at all');
}

const key = (pair) => `${pair[0]} ${pair[1]}`;
const sorted = (pairs) => [...pairs].map(key).sort();

for (const [name, card] of paired) {
  const other = manifest.cards[card.alternate];
  if (!other) {
    die(
      2,
      `card "${name}" points at alternate "${card.alternate}", which does not exist in the manifest`,
    );
  }

  // The cluster is the card plus its alternate, and nothing else. Every
  // annotation either names a member of this set or breaks it.
  const cluster = new Map([
    [absolute(card.route), { name, card }],
    [absolute(other.route), { name: card.alternate, card: other }],
  ]);

  const htmlPath = emittedFile(card);
  if (htmlPath === null) {
    checks += 1;
    fail(
      `card "${name}" (${card.route}) has an alternate but no "dir", so the build emits no file for it ` +
        `-- its hreflang would only ever exist at runtime, where no crawler reads it`,
    );
    continue;
  }
  if (!existsSync(htmlPath)) {
    checks += 1;
    fail(
      `card "${name}" (${card.route}) should be emitted at ${htmlPath} and is not -- nothing to annotate`,
    );
    continue;
  }
  const annotations = annotationsInHtml(read(htmlPath, `the emitted page for "${name}"`));

  checks += 1;
  if (annotations.length === 0) {
    fail(
      `card "${name}" (${card.route}) emits no hreflang at all, yet its alternate is "${card.alternate}"`,
    );
    continue;
  }
  pass(
    `${card.route} emits ${annotations.length} annotation(s)  (card "${name}", lang=${card.lang})`,
  );

  // 1. Self-reference. A cluster where a page does not name itself is not a
  //    cluster Google will read.
  checks += 1;
  const self = annotations.find(
    ([lang, href]) => lang === card.lang && href === absolute(card.route),
  );
  if (self) {
    pass(`  ${card.route} names itself as ${card.lang}`);
  } else {
    fail(
      `  ${card.route} never annotates ITSELF as ${card.lang} -- a cluster must include the page it is on`,
    );
  }

  // 2. Self-containment. This is the check that fails today: `x-default`
  //    pointing at the home route from inside the privacy cluster names a URL
  //    that is not a member of it.
  for (const [lang, href] of annotations) {
    checks += 1;
    if (cluster.has(href)) {
      pass(`  ${lang} -> ${href} is a member of the cluster`);
      continue;
    }
    fail(
      `  ${card.route} annotates ${lang} -> ${href}, which is NOT in its cluster ` +
        `{${[...cluster.keys()].join(', ')}} -- the target never annotates back, so the whole set is non-reciprocal`,
    );
  }

  // 3. x-default present, and pointing at the cluster's own default-language
  //    member rather than at the site's home page.
  checks += 1;
  const expectedDefault = [...cluster.values()].find(
    (entry) => entry.card.lang === DEFAULT_LANG || entry.card.lang.startsWith(`${DEFAULT_LANG}-`),
  );
  if (!expectedDefault) {
    fail(
      `  cluster {${[...cluster.keys()].join(', ')}} has no "${DEFAULT_LANG}" member, ` +
        `so there is no defensible x-default -- either add one or drop the annotation`,
    );
  } else {
    const wanted = absolute(expectedDefault.card.route);
    const got = annotations.filter(([lang]) => lang === 'x-default').map(([, href]) => href);
    if (got.length === 0) {
      fail(`  ${card.route} declares no x-default -- visitors matching no language get no answer`);
    } else if (got.length > 1) {
      fail(
        `  ${card.route} declares x-default ${got.length} times (${got.join(', ')}) -- only one can be right`,
      );
    } else if (got[0] !== wanted) {
      fail(
        `  ${card.route} points x-default at ${got[0]}, expected ${wanted} ` +
          `(the "${DEFAULT_LANG}" member of its OWN cluster, card "${expectedDefault.name}")`,
      );
    } else {
      pass(`  x-default -> ${wanted} (the ${DEFAULT_LANG} member of this cluster)`);
    }
  }

  // 4. Reciprocity, measured rather than assumed: read the OTHER page's
  //    emitted file and check it names this one back.
  checks += 1;
  const otherPath = emittedFile(other);
  if (otherPath === null || !existsSync(otherPath)) {
    fail(
      `  alternate "${card.alternate}" has no emitted file at ${otherPath} -- reciprocity cannot hold`,
    );
  } else {
    const back = annotationsInHtml(read(otherPath, `the emitted page for "${card.alternate}"`));
    const namesUs = back.some(
      ([lang, href]) => href === absolute(card.route) && lang === card.lang,
    );
    if (namesUs) {
      pass(`  ${other.route} annotates ${card.lang} -> ${absolute(card.route)} back`);
    } else {
      fail(
        `  ${other.route} does not annotate ${card.lang} -> ${absolute(card.route)} back ` +
          `-- Google drops non-reciprocal annotations`,
      );
    }
  }

  // 5. HTML and sitemap must say the SAME thing. Two methods disagreeing is
  //    the third bug, and the one nothing in the repo could have noticed.
  checks += 1;
  const inSitemap = sitemap.get(absolute(card.route));
  if (!inSitemap) {
    fail(
      `  sitemap.xml has no <url> for ${absolute(card.route)}, which the build emits as a page ` +
        `-- it is indexable and unlisted`,
    );
  } else {
    const fromHtml = sorted(annotations);
    const fromSitemap = sorted(inSitemap);
    if (fromHtml.join(' | ') === fromSitemap.join(' | ')) {
      pass(`  sitemap.xml declares the same ${fromHtml.length} annotation(s) as the page`);
    } else {
      const onlyHtml = fromHtml.filter((entry) => !fromSitemap.includes(entry));
      const onlySitemap = fromSitemap.filter((entry) => !fromHtml.includes(entry));
      fail(
        `  sitemap.xml and the page disagree for ${card.route}: ` +
          `only in the page [${onlyHtml.join(', ') || 'none'}], ` +
          `only in the sitemap [${onlySitemap.join(', ') || 'none'}] ` +
          `-- Google reads both and conflicting sets can void each other`,
      );
    }
  }
}

// --- the other half of the contract: no alternate means no annotations -------

for (const [name, card] of unpaired) {
  const htmlPath = emittedFile(card);
  if (htmlPath === null) {
    // No file of its own, so there is no emitted HTML to read. `/health` is
    // this case on purpose: it is noindex, it has no alternate, and it is
    // served by the fallback. Saying so beats both a silent skip and a FAIL
    // measured off the wrong file.
    checks += 1;
    pass(
      `${card.route} has no emitted file of its own (dir: null) -- nothing is emitted to annotate (card "${name}")`,
    );
    continue;
  }
  if (!existsSync(htmlPath)) continue;
  checks += 1;
  const annotations = annotationsInHtml(read(htmlPath, `the emitted page for "${name}"`));
  if (annotations.length === 0) {
    pass(`${card.route} has no alternate and emits no hreflang, as intended (card "${name}")`);
  } else {
    fail(
      `card "${name}" (${card.route}) has no alternate in the manifest, yet its page emits ` +
        `${annotations.length} hreflang annotation(s) -- they point at a cluster it is not in`,
    );
  }
}

console.log('');
if (failed > 0) {
  console.log(
    `${failed} of ${checks} hreflang checks FAILED. Google honours an hreflang set only when it is ` +
      `reciprocal and self-contained: every annotation names a member of its own cluster, every member ` +
      `names the others back, and the page and the sitemap say the same thing.`,
  );
  process.exit(1);
}
console.log(
  `All ${checks} hreflang checks pass: ${paired.length} paired page(s) form reciprocal, self-contained ` +
    `clusters with an x-default inside each one, ${unpaired.length} unpaired page(s) correctly annotate ` +
    `nothing, and sitemap.xml agrees with every page.`,
);
