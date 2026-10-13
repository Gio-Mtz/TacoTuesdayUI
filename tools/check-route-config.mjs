/**
 * Fails when the routes the build emits as their own file and the rewrites
 * `staticwebapp.config.json` declares disagree.
 *
 * Why this guard exists, in one paragraph. `tools/emit-route-cards.mjs` writes a
 * real `<dir>/index.html` for every card in `social-cards.json` that has a `dir`,
 * each one carrying its own `<link rel="canonical">` and its own `lang`. Azure
 * only reaches those files if a route rewrite points at them: everything else
 * falls into `navigationFallback.rewrite`, which is `/index.html` -- the home
 * page, with the home page's canonical. So a card can be emitted perfectly and
 * still never be served, and nothing in the repo noticed. `/privacy` shipped
 * that way in US-011: emitted since then, never declared.
 *
 * What this guard does NOT claim. Whether Azure serves `<dir>/index.html` as a
 * directory default document BEFORE applying navigationFallback was not
 * measured -- the product returns 403 from here, and `tools/serve-dist.mjs`
 * answers from its own implementation, not from Azure. That is exactly why the
 * fix is an explicit rewrite per emitted route: it makes the question moot. If
 * Azure does serve the default document, the rewrite is redundant and harmless,
 * like the two already committed for `/talento` and `/privacidad`. If it does
 * not, the rewrite is the only thing standing between the page and the home
 * page's canonical.
 *
 * Cards with `dir: null` are the other half of the contract. `/health` has no
 * file of its own and is MEANT to land on the fallback so the Angular router
 * resolves it in the browser. A rewrite for one of those would point at a file
 * the build never writes, so the guard rejects it too.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = join(REPO, 'src/app/core/seo/social-cards.json');
const CONFIG_PATH = join(REPO, 'public/staticwebapp.config.json');

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
  console.error(`::error::check-route-config: ${message}`);
  process.exit(code);
}

function read(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    die(2, `cannot read ${label} (${path}): ${error.message}`);
  }
}

const manifest = read(MANIFEST_PATH, 'the social card manifest');
const config = read(CONFIG_PATH, 'the Static Web Apps config');

const cards = Object.entries(manifest.cards ?? {});
if (cards.length === 0) {
  die(2, 'the manifest has no cards -- there would be nothing to check, and silence is not a pass');
}

// Against the void: an empty or missing `routes` is the broken state this guard
// exists to catch, so it must never read as "nothing to compare".
const routes = config.routes ?? null;
if (routes === null) {
  die(
    2,
    `${CONFIG_PATH} has no "routes" array -- every emitted page would fall into navigationFallback`,
  );
}
if (!Array.isArray(routes)) {
  die(2, '"routes" is not an array');
}

// The whole argument rests on the fallback existing and pointing at the home
// page. If it ever changes, this guard's reasoning has to be re-read, not
// trusted.
const fallback = config.navigationFallback?.rewrite ?? null;
if (fallback === null) {
  die(
    2,
    'no navigationFallback.rewrite -- re-read this guard before trusting it, its premise is gone',
  );
}
pass(
  `navigationFallback.rewrite is ${fallback} -- anything without a rewrite is served as that file`,
);
checks += 1;

const withFile = cards.filter(([, card]) => card.dir);
const withoutFile = cards.filter(([, card]) => !card.dir && card.route !== '/');

if (withFile.length === 0) {
  die(
    2,
    'no card has a "dir" -- the emitter would write no page of its own, and this guard would pass on nothing',
  );
}

const declared = new Map();
for (const entry of routes) {
  if (typeof entry?.route !== 'string') {
    fail(`a "routes" entry has no string "route": ${JSON.stringify(entry)}`);
    checks += 1;
    continue;
  }
  if (declared.has(entry.route)) {
    fail(
      `"${entry.route}" is declared twice in routes -- the first one wins and the second is dead config`,
    );
    checks += 1;
  }
  declared.set(entry.route, entry);
}

for (const [name, card] of withFile) {
  const expected = `/${card.dir}/index.html`;
  const entry = declared.get(card.route);
  checks += 1;
  if (!entry) {
    fail(
      `card "${name}" emits ${card.dir}/index.html for ${card.route}, and no rewrite declares it ` +
        `-- Azure would serve ${fallback} there, with the home page's canonical`,
    );
    continue;
  }
  if (entry.rewrite !== expected) {
    fail(
      `card "${name}" (${card.route}) is rewritten to ${entry.rewrite ?? '(nothing)'}, expected ${expected}`,
    );
    continue;
  }
  pass(`${card.route} -> ${expected}  (card "${name}", lang=${card.lang})`);
}

for (const [name, card] of withoutFile) {
  checks += 1;
  const entry = declared.get(card.route);
  if (entry) {
    fail(
      `card "${name}" (${card.route}) has no "dir", so the build writes no file for it, ` +
        `yet a rewrite points at ${entry.rewrite} -- that target does not exist`,
    );
    continue;
  }
  pass(
    `${card.route} has no file and no rewrite -- lands on ${fallback} for the router, as intended`,
  );
}

const knownRoutes = new Set(cards.map(([, card]) => card.route));
for (const [route, entry] of declared) {
  if (knownRoutes.has(route)) continue;
  checks += 1;
  fail(
    `routes declares "${route}" -> ${entry.rewrite ?? '(nothing)'}, and no card in the manifest has that route ` +
      `-- either the card was deleted or the route is a typo`,
  );
}

console.log('');
if (failed > 0) {
  console.log(
    `${failed} of ${checks} route-config checks FAILED. ` +
      `The manifest is the source of truth: every card with a "dir" needs its rewrite in ${CONFIG_PATH}.`,
  );
  process.exit(1);
}
console.log(
  `All ${checks} route-config checks pass: ${withFile.length} emitted page(s) each have their rewrite, ` +
    `${withoutFile.length} router-only route(s) correctly have none, and no rewrite is orphaned.`,
);
