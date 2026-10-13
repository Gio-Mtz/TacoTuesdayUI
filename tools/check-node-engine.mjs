/**
 * Fails when `package.json` does not declare a Node version floor at least as
 * strict as the one the installed dependency tree already demands.
 *
 * Why this guard exists, in one paragraph. Dependabot PR #26 took `jsdom` from
 * 28 to 30.1.2. The visible half of that major was the API; the consequential
 * half was the engine: `jsdom@30.1.2` and three of its dependencies declare
 * `node: "^22.22.2 || ^24.15.0 || >=26.0.0"`. Nothing in this repo recorded
 * that. `package.json` had no `engines` field at all, so the only statement
 * about Node anywhere was `node-version: 22` in `ci.yml` -- a floating major
 * that `actions/setup-node` happens to resolve to the newest 22.x available.
 * CI was therefore green by luck of that resolution, not by contract: on any
 * machine or runner image whose 22.x is older than 22.22.2, `npm ci` installs
 * a tree whose own authors declare the engine unsupported, and the symptom
 * surfaces later as test failures inside jsdom that read like product bugs.
 *
 * What this guard checks. Three things, all derived from files in the repo and
 * none of them invented here:
 *   1. `package.json` declares `engines.node`.
 *   2. Every branch of that declared range starts at a version that satisfies
 *      EVERY `engines.node` in `package-lock.json`. Checking only the global
 *      minimum would pass a declaration like `^22.22.2 || ^20.0.0`, whose
 *      second branch re-opens the door the first one closed.
 * It also REPORTS, without failing, whether the Node actually running it
 * satisfies the declared range.
 *
 * Why that third one only warns, which is a deliberate choice and not an
 * oversight. Whether a given machine satisfies the floor is a fact about the
 * machine, not about the repo, and the two gating checks above are true or
 * false identically on every machine. Failing on the running version would
 * also mean shipping a check whose green state was never observed: the
 * container these guards are developed in runs Node 22.22.0, nodejs.org is
 * unreachable from it, and GitHub's `node-version: 22` resolves on the runner
 * to a version this side cannot see. A warning that names both versions is
 * worth more than a gate whose behaviour nobody has watched. Promote it to a
 * failure once a runner log confirms what `setup-node` actually resolves.
 *
 * What this guard does NOT claim. It says nothing about which Node version is
 * a good idea, and it has no opinion of its own about a floor: the floor is
 * whatever the installed tree asks for. If a future dependency lowers its
 * requirement, this guard goes quiet on its own. It also cannot see what
 * version `actions/setup-node` will resolve on the runner -- that is why the
 * declaration in `package.json` is the thing being guarded, not `ci.yml`.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = 'package.json';
const LOCK_PATH = 'package-lock.json';

const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

let checks = 0;
let failed = 0;

const fail = (message) => {
  checks += 1;
  failed += 1;
  console.log(`FAIL  ${message}`);
};
const pass = (message) => {
  checks += 1;
  console.log(`PASS  ${message}`);
};

const pkg = readJson(PKG_PATH);
const lock = readJson(LOCK_PATH);

// Every engines.node in the installed tree, except the root package's own --
// that one IS the declaration under test, so including it would make the
// guard compare the declaration against itself and always agree.
const required = [];
const unparseable = [];
for (const [path, entry] of Object.entries(lock.packages ?? {})) {
  if (path === '') continue;
  const range = entry?.engines?.node;
  if (typeof range !== 'string' || range.trim() === '') continue;
  const name = path.replace(/^node_modules\//, '').replace(/\/node_modules\//g, ' > ');
  if (semver.validRange(range) === null) {
    unparseable.push({ name, range });
    continue;
  }
  required.push({ name, range });
}

// The vacuum case. A lock with no engines anywhere would make every check
// below vacuously true, and "0 of 0 checks pass" is how a broken guard looks
// from the outside. Say it instead of implying it.
if (required.length === 0) {
  console.log(
    `No package in ${LOCK_PATH} declares engines.node, so there is no floor to enforce. ` +
      `That is a real state, not a pass: if you expected one, the lock is not the one you think it is.`,
  );
  if (unparseable.length > 0) {
    console.log(
      `${unparseable.length} range(s) could not be parsed: ${unparseable.map((u) => `${u.name} (${u.range})`).join(', ')}`,
    );
    process.exit(1);
  }
  process.exit(0);
}

// The strictest requirement in the tree, used only to tell the reader what to
// declare. It is derived from the lock, never hardcoded here.
const strictest = required
  .map((r) => ({ ...r, min: semver.minVersion(r.range) }))
  .sort((a, b) => semver.rcompare(a.min, b.min))[0];

const declared = pkg.engines?.node;

if (typeof declared !== 'string' || declared.trim() === '') {
  fail(
    `${PKG_PATH} declares no engines.node, yet ${required.length} package(s) in the tree declare one. ` +
      `The strictest is "${strictest.name}" with "${strictest.range}" (floor ${strictest.min.version}). ` +
      `Declare engines.node in ${PKG_PATH} so the floor this tree already imposes is written down once.`,
  );
} else if (semver.validRange(declared) === null) {
  fail(`${PKG_PATH} declares engines.node = "${declared}", which is not a valid semver range.`);
} else {
  pass(`${PKG_PATH} declares engines.node = "${declared}"`);

  // Each branch of the declared disjunction is a separate promise about which
  // Node versions are allowed, so each one is checked on its own.
  const branches = declared
    .split('||')
    .map((b) => b.trim())
    .filter((b) => b !== '');

  for (const branch of branches) {
    let branchMin;
    try {
      branchMin = semver.minVersion(branch);
    } catch {
      fail(`branch "${branch}" of engines.node has no lowest version semver can resolve`);
      continue;
    }

    const violated = required.filter((r) => !semver.satisfies(branchMin, r.range));
    if (violated.length > 0) {
      const sample = violated
        .slice(0, 3)
        .map((v) => `${v.name} needs "${v.range}"`)
        .join('; ');
      fail(
        `branch "${branch}" of engines.node admits Node ${branchMin.version}, which ${violated.length} ` +
          `installed package(s) declare unsupported -- ${sample}${violated.length > 3 ? '; ...' : ''}`,
      );
      continue;
    }
    pass(
      `branch "${branch}" starts at Node ${branchMin.version}, which every one of the ${required.length} declared engines accepts`,
    );
  }

  // Reported, never gated -- see the header. Either way it prints a version,
  // so the line is never silence.
  const running = process.versions.node;
  if (!semver.satisfies(running, declared)) {
    console.log(
      `WARN  this machine runs Node ${running}, which engines.node "${declared}" does not allow. ` +
        `The tree installed here is outside its own supported range; npm says the same thing, once, ` +
        `buried in install output. Not a failure: it is a fact about this machine, not about the repo.`,
    );
  } else {
    console.log(`INFO  this machine runs Node ${running}, which the declared range allows.`);
  }
}

if (unparseable.length > 0) {
  for (const u of unparseable) {
    fail(
      `"${u.name}" declares engines.node = "${u.range}", which semver cannot parse -- it was not checked against anything`,
    );
  }
}

console.log('');
if (failed > 0) {
  console.log(
    `${failed} of ${checks} node-engine checks FAILED. The installed tree is the source of truth: ` +
      `${PKG_PATH} has to declare a floor that every engines.node in ${LOCK_PATH} accepts.`,
  );
  process.exit(1);
}
console.log(
  `All ${checks} node-engine checks pass: engines.node = "${declared}" and every one of its ` +
    `${declared.split('||').length} branch(es) clears all ${required.length} declared engines in the tree ` +
    `(strictest: ${strictest.name} at ${strictest.min.version}).`,
);
