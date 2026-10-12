// GUARD, not documentation. TD-014 closed the contrast of text and TD-026 closed
// the contrast of the focus ring. This closes the third member of that family --
// the SIZE of the text -- which until 9-oct no check looked at at all.
//
// READ THIS BEFORE CHANGING THE FLOOR. WCAG has no minimum font size. There is no
// success criterion that says "16px", and any comment claiming one is wrong. What
// WCAG does require about size is 1.4.4 Resize Text (AA): text has to survive 200%
// zoom. That is a question of UNITS and of the viewport meta -- not of a number --
// and both are asserted below, where a regression is an exit 1 instead of prose.
//
// The 14px floor here is a PROJECT RATCHET, not a standard. It is the smallest size
// the product already ships (--tt-text-sm, measured 9-oct: 14 declarations across 8
// components, and nothing anywhere below it). Writing it down converts "we happen to
// have nothing smaller" into "nothing smaller ships without a reason recorded here".
// Dressing it up as WCAG would be a lie that got repeated every time someone read it.
//
// It also reads the scale out of theme.css instead of hard-coding the rungs, so the
// guard moves when the design system moves -- the same reason the contrast guard
// derives its token table instead of restating it.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src');
const THEME = join(root, 'src', 'styles', 'theme.css');
const INDEX = join(root, 'src', 'index.html');

// The ratchet, in rem. 0.875rem = 14px at the browser default, and no stylesheet
// here overrides that default -- which is itself asserted below, because a
// `html { font-size: 62.5% }` would silently turn this whole scale into 10px units.
const FLOOR_REM = 0.875;
const FLOOR_TOKEN = '--tt-text-sm';

let failed = 0;
const fail = (msg) => {
  failed += 1;
  console.log(`FAIL  ${msg}`);
};

// --------------------------------------------------------------------------
// The scale, derived from theme.css.
// --------------------------------------------------------------------------
// Only rungs whose value is a rem literal. --tt-text-primary and friends share the
// prefix but are colors, and requiring a rem value is what keeps them out.
function readScale() {
  const css = readFileSync(THEME, 'utf8');
  const scale = new Map();
  for (const m of css.matchAll(/(--tt-text-[\w-]+)\s*:\s*(\d*\.?\d+)rem/g)) {
    scale.set(m[1], Number(m[2]));
  }
  return scale;
}

const scale = readScale();

// Against the void: an empty scale must not read as "nothing to check". A rename in
// theme.css, or a regex that stopped matching, would otherwise make this whole file
// pass while guarding nothing. Lesson #10, and #49: a green guard measuring nothing.
if (scale.size === 0) {
  fail(
    `the font-size scale derived from src/styles/theme.css is EMPTY  <-- this guard just measured nothing and would have passed. Either the --tt-text-* rungs were renamed or the parser broke. Fix one of the two; do not delete this check.`,
  );
}

// Floor and scale have to agree. A floor that names no real rung is a number
// somebody typed once, and the error message below would point at nothing.
if (scale.size > 0 && !scale.has(FLOOR_TOKEN)) {
  fail(
    `FLOOR_TOKEN is ${FLOOR_TOKEN}, which is not a rem rung in theme.css  <-- the floor has to be a size the design system actually offers.`,
  );
} else if (scale.size > 0 && scale.get(FLOOR_TOKEN) !== FLOOR_REM) {
  fail(
    `FLOOR_TOKEN ${FLOOR_TOKEN} is ${scale.get(FLOOR_TOKEN)}rem in theme.css but FLOOR_REM here says ${FLOOR_REM}rem  <-- theme.css moved and this guard did not. Update FLOOR_REM, and say in the commit why the floor moved.`,
  );
}

// A rung below the floor is a loaded gun: the next person who needs "a bit smaller"
// reaches for the scale, not for this file. On 9-oct --tt-text-xs (.75rem / 12px) sat
// in the scale with ZERO users anywhere in the repo; it was deleted with this guard
// rather than left for someone to find. Keep the scale and the floor in agreement:
// either the rung goes, or the floor moves and the reason gets written down.
for (const [token, rem] of [...scale].sort((a, b) => a[1] - b[1])) {
  if (rem < FLOOR_REM) {
    fail(
      `the scale offers ${token} at ${rem}rem (${rem * 16}px), below the ${FLOOR_REM}rem (${FLOOR_REM * 16}px) floor  <-- a rung the project forbids is a rung someone will use. Delete it from theme.css, or raise the floor here with the reason.`,
    );
  }
}

// --------------------------------------------------------------------------
// Every font-size in the project, resolved to rem.
// --------------------------------------------------------------------------
function styleFilesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...styleFilesUnder(full));
    else if (/\.(scss|css|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (file) =>
  file
    .slice(root.length + 1)
    .split('\\')
    .join('/');

// Returns { rem } when the value is a size this project allows, or { error } with
// the reason it is not. Deliberately strict: a unit this guard cannot resolve is a
// failure, not a skip, because a skip is how 1.4.4 regressions get through.
function resolve(raw) {
  const value = raw.trim().replace(/\s*!important$/, '');

  const varMatch = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (varMatch) {
    const token = varMatch[1];
    if (!scale.has(token)) {
      return {
        error: `var(${token}) is not a rem rung in theme.css -- a font-size has to come from the --tt-text-* scale`,
      };
    }
    return { rem: scale.get(token), how: `var(${token})` };
  }

  const remMatch = value.match(/^(\d*\.?\d+)rem$/);
  if (remMatch) {
    return { rem: Number(remMatch[1]), how: `${value} literal` };
  }

  // px/pt are the 1.4.4 failure: an absolute font-size does not grow with the
  // user's text-size setting. em/% are relative but resolve against an ancestor
  // this guard cannot see, so their size is unknowable from here.
  if (/\d\s*(px|pt)$/.test(value)) {
    return {
      error: `${value} is an absolute unit -- WCAG 2.1 1.4.4 Resize Text wants text that scales, so font-size uses the rem scale`,
    };
  }
  return {
    error: `${value} cannot be resolved to a rem size from this file -- use a --tt-text-* token`,
  };
}

const declarations = [];

for (const file of styleFilesUnder(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    // The dash class in front is what keeps `-webkit-font-size-adjust` and any
    // other `*-font-size` property out, the same trick colorTokensIn uses.
    for (const m of line.matchAll(/(?:^|[^-\w])font-size\s*:\s*([^;}]+)/g)) {
      declarations.push({ file: rel(file), line: i + 1, raw: m[1] });
    }
  });
}

// Against the void, again, and this is the one that matters most: if the walk finds
// nothing, every loop below is a no-op and the script exits 0 having proved nothing.
if (declarations.length === 0) {
  fail(
    `no font-size declaration was found anywhere under src/  <-- this guard just passed without measuring a single size. The file walk or the matcher is broken, not the project.`,
  );
}

for (const d of declarations) {
  const r = resolve(d.raw);
  if (r.error) {
    fail(`${d.file}:${d.line}  font-size: ${d.raw.trim()}  <-- ${r.error}`);
    continue;
  }
  if (r.rem < FLOOR_REM) {
    fail(
      `${d.file}:${d.line}  font-size: ${d.raw.trim()} resolves to ${r.rem}rem (${r.rem * 16}px), under the ${FLOOR_REM}rem (${FLOOR_REM * 16}px) floor  <-- raise it to ${FLOOR_TOKEN} or larger.`,
    );
  }
}

// --------------------------------------------------------------------------
// 1.4.4, the half that is not a number: the user has to be able to zoom.
// --------------------------------------------------------------------------
const indexHtml = readFileSync(INDEX, 'utf8');
const viewport = indexHtml.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
if (!viewport) {
  fail(
    `src/index.html has no viewport meta  <-- without it mobile browsers lay out at a fake width and the rem scale above stops meaning anything.`,
  );
} else {
  const content = (viewport[0].match(/content=["']([^"']*)["']/i) ?? [, ''])[1];
  if (/user-scalable\s*=\s*(no|0)/i.test(content)) {
    fail(
      `src/index.html viewport sets user-scalable=no  <-- that is a direct WCAG 2.1 1.4.4 failure: it forbids the pinch-zoom that makes small text readable. Remove it.`,
    );
  }
  const max = content.match(/maximum-scale\s*=\s*(\d*\.?\d+)/i);
  if (max && Number(max[1]) < 2) {
    fail(
      `src/index.html viewport caps maximum-scale at ${max[1]}  <-- 1.4.4 asks for 200%, so anything under 2 caps zoom below what the criterion requires.`,
    );
  }
}

// A root font-size override rescales every rem in the project at once -- the
// `html { font-size: 62.5% }` habit turns this 14px floor into 8.75px without
// touching a single one of the declarations checked above.
for (const file of styleFilesUnder(SRC)) {
  const css = readFileSync(file, 'utf8');
  for (const m of css.matchAll(/(^|\})\s*(html|:root)[^{}]*\{[^}]*?font-size\s*:\s*([^;}]+)/g)) {
    fail(
      `${rel(file)}  ${m[2]} sets font-size: ${m[3].trim()}  <-- that rescales every rem in the project, so the floor above is no longer ${FLOOR_REM * 16}px. Size text on the elements, not on the root.`,
    );
  }
}

// --------------------------------------------------------------------------
if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

const used = new Map();
for (const d of declarations) {
  const r = resolve(d.raw);
  const key = r.how ?? d.raw.trim();
  used.set(key, (used.get(key) ?? 0) + 1);
}
const summary = [...used]
  .map(([k, n]) => `${k} x${n}`)
  .sort()
  .join(', ');
console.log(
  `All ${declarations.length} font-size declarations under src/ clear the ${FLOOR_REM}rem (${FLOOR_REM * 16}px) floor, in ${new Set(declarations.map((d) => d.file)).size} files -- ${summary}.`,
);
console.log(
  `Scale derived from theme.css: ${[...scale]
    .sort((a, b) => a[1] - b[1])
    .map(([t, r]) => `${t} ${r}rem`)
    .join(', ')}. Smallest rung is the floor. Zoom is not capped in src/index.html.`,
);
