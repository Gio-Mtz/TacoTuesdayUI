// GUARD, not documentation. This script is the regression net for TD-008: the step
// numbers in "How it works" shipped at 1.88:1 (light) and 1.73:1 (dark) because a
// --tt-border-* token was doing text work. A comment alone did not survive -- TD-012
// stripped the one that recorded the intent -- so the floor lives here, as an
// assertion that exits non-zero.
//
// It reads the real token table out of src/styles/theme.css, resolves each var()
// chain down to a hex, and checks the WCAG 2.1 contrast ratio in BOTH themes.
// Adding a pair to CHECKS below is how you protect a new piece of text.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const THEME = join(root, 'src', 'styles', 'theme.css');

// foreground token, background token, minimum ratio, and why that minimum.
// 3:1 is WCAG 2.1 AA for large text: >= 24px, or >= 18.66px when bold.
const CHECKS = [
  {
    where: 'how-it-works .steps__number',
    fg: '--tt-text-muted',
    bg: '--tt-bg-surface',
    min: 3,
    why: '36px/700 on a .tt-card -> large text',
  },
  {
    where: 'body copy',
    fg: '--tt-text-secondary',
    bg: '--tt-bg-surface',
    min: 4.5,
    why: '16px/400 -> normal text',
  },
  {
    where: 'headings',
    fg: '--tt-text-primary',
    bg: '--tt-bg-canvas',
    min: 4.5,
    why: 'normal text floor, applied to the strongest pair',
  },
  {
    where: 'cookie-banner accept button (.tt-btn--primary)',
    fg: '--tt-on-brand',
    bg: '--tt-brand',
    min: 4.5,
    why: '16px/600 -> normal text. The consent choice cannot be the unreadable one.',
  },
  {
    where: 'cookie-banner reject button + privacy link (.tt-btn--secondary)',
    fg: '--tt-brand-text',
    bg: '--tt-bg-surface',
    min: 4.5,
    why: '16px/600 on the banner panel -> normal text. Reject must read as plainly as accept.',
  },
  {
    where: 'footer legal line + footer column headings',
    fg: '--tt-text-muted',
    bg: '--tt-bg-surface',
    min: 4.5,
    why: '14px/400 and 14px/600 -> normal text, NOT large. Same token pair as the step numbers above with a higher floor, and in light it clears 4.5:1 by 0.08. It cannot drift.',
  },
  {
    where: 'form placeholders + privacy last-updated line',
    fg: '--tt-text-secondary',
    bg: '--tt-bg-canvas',
    min: 4.5,
    why: '--tt-bg-canvas is the input background, not the panel. 16px placeholder and 14px timestamp -> normal text.',
  },
  {
    where: 'in-paragraph links on the page background (/privacidad prose)',
    fg: '--tt-brand-text',
    bg: '--tt-bg-canvas',
    min: 4.5,
    why: '16px/400 inside a paragraph -> normal text. A link that only color distinguishes has to clear the body floor.',
  },
  {
    where: 'eyebrow + in-paragraph links on .tt-section--alt',
    fg: '--tt-brand-text',
    bg: '--tt-bg-subtle',
    min: 4.5,
    why: '14px/400 mono on the alternating section background -> normal text.',
  },
  {
    where: 'form field error (.field__error) on the waitlist panel',
    fg: '--tt-danger',
    bg: '--tt-bg-surface',
    min: 4.5,
    why: '14px/400 -> normal text. The message that says what went wrong cannot be the one you cannot read.',
  },
  {
    where: '.tt-btn--primary :hover repaint',
    fg: '--tt-on-brand',
    bg: '--tt-brand-hover',
    min: 4.5,
    why: 'The button keeps its text color and swaps its background on hover. A pair that only holds in the resting state is half a check.',
  },
  {
    where: '.tt-btn--primary :active repaint',
    fg: '--tt-on-brand',
    bg: '--tt-brand-active',
    min: 4.5,
    why: 'Same button, the pressed background. In dark these two go LIGHTER (agave-200/100), not darker, so the direction cannot be assumed.',
  },
  {
    where: '.tt-btn--secondary :hover + .variant__label when checked',
    fg: '--tt-brand-text',
    bg: '--tt-brand-subtle',
    min: 4.5,
    why: '16px/600 once the hover fill lands under it, and the same pair carries .variant__icon on the selected option.',
  },
  {
    where: '.form__failure panel copy',
    fg: '--tt-text-primary',
    bg: '--tt-danger-subtle',
    min: 4.5,
    why: '14px/400 on a semantic fill, not on a --tt-bg-* surface. The error panel is the one place the user has to read on the first try.',
  },
  {
    where: '.form__failure-icon',
    fg: '--tt-danger',
    bg: '--tt-danger-subtle',
    min: 3,
    why: 'A glyph, not text: WCAG 2.1 1.4.11 non-text contrast is 3:1. Same-hue fg and bg is exactly where that floor gets missed.',
  },
  {
    where: '.confirm__icon',
    fg: '--tt-success',
    bg: '--tt-success-subtle',
    min: 3,
    why: 'The 56px success glyph, 4.39:1 in light. It clears the 3:1 non-text floor and would MISS the 4.5:1 text floor, which is why --tt-success is restricted below.',
  },
];

// ---------------------------------------------------------------------------
// Second guard: restricted text-color tokens.
//
// TD-014 widened the pair list above after a 14px line painted with
// --tt-text-muted shipped at 4.39:1. Pairs protect the cases someone thought
// of; they do nothing about the NEXT unlisted use. So this half states the
// rule instead of the cases -- and the rule is DERIVED from the token table
// rather than hand-written.
//
// A token used as a `color:` is RESTRICTED when it measurably misses the
// normal-text floor against at least one of the surfaces a page actually
// paints. Every use of a restricted token in component styles has to be listed
// below with the size and the background that make it legal.
//
// Deriving it pays in both directions. Darken a safe token tomorrow and it
// becomes restricted by itself -- the build stops until its uses are
// justified, and nobody has to remember to come add it here. Lighten a
// restricted one and the guard says the restriction is now pointless, so the
// list cannot silently fill up with ceremony.
//
// Measured against this table on 8-oct: --tt-text-secondary (worst 5.65:1) and
// --tt-brand-text (6.42:1) clear the floor on every page surface and are
// therefore NOT restricted and deliberately absent. Listing them would have
// been paperwork with no safety in it. The three that ARE restricted:
// --tt-on-brand (1.00:1 on --tt-bg-surface, inverse-only by design),
// --tt-text-muted (3.82:1 on --tt-bg-inset, large-text-only) and --tt-success
// (4.15:1 on --tt-bg-inset, legal for glyphs at 3:1 but not for text).
// ---------------------------------------------------------------------------
const PAGE_SURFACES = ['--tt-bg-canvas', '--tt-bg-surface', '--tt-bg-subtle', '--tt-bg-inset'];
const NORMAL_TEXT_FLOOR = 4.5;

const ALLOWLIST = new Map([
  [
    '--tt-text-muted',
    new Map([
      [
        'src/app/landing/sections/how-it-works/how-it-works.scss',
        '.steps__number, 36px/700 on --tt-bg-surface -> large text, checked above at 3:1',
      ],
      [
        'src/app/layout/site-footer/site-footer.scss',
        '.site-footer__heading and .site-footer__legal, 14px on --tt-bg-surface, checked above at 4.5:1',
      ],
    ]),
  ],
  [
    '--tt-on-brand',
    new Map([
      [
        'src/app/layout/site-header/site-header.scss',
        '.site-header__mark, 14px/700 mono inside a 32px tile filled with --tt-brand, checked above at 4.5:1',
      ],
      [
        'src/styles/_layout.scss',
        '.tt-btn--primary and .tt-skip-link on --tt-brand, plus the hover and active repaints -- all three backgrounds checked above at 4.5:1',
      ],
    ]),
  ],
  [
    '--tt-success',
    new Map([
      [
        'src/app/landing/sections/waitlist/waitlist.scss',
        '.confirm__icon, a 56px glyph on --tt-success-subtle -> non-text contrast, checked above at 3:1. NOT legal as text anywhere.',
      ],
    ]),
  ],
]);

function declarationsIn(block) {
  const out = new Map();
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

function themes(css) {
  // Light lives in the first :root block. Dark overrides it in :root[data-theme="dark"],
  // which carries the same values as the prefers-color-scheme block.
  const lightBlock = css.slice(css.indexOf('{') + 1, css.indexOf('}'));
  const darkStart = css.indexOf(':root[data-theme="dark"]');
  if (darkStart === -1) throw new Error('theme.css: no :root[data-theme="dark"] block found');
  const darkBlock = css.slice(
    css.indexOf('{', darkStart) + 1,
    css.indexOf('}', css.indexOf('{', darkStart)),
  );

  const light = declarationsIn(lightBlock);
  const dark = new Map(light);
  for (const [k, v] of declarationsIn(darkBlock)) dark.set(k, v);
  return { light, dark };
}

function resolve(token, vars, seen = new Set()) {
  if (seen.has(token)) throw new Error(`circular var() chain at ${token}`);
  seen.add(token);
  const raw = vars.get(token);
  if (raw === undefined) throw new Error(`${token} is not defined in theme.css`);
  const ref = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (ref) return resolve(ref[1], vars, seen);
  const hex = raw.match(/^#([0-9a-fA-F]{6})$/);
  if (!hex) throw new Error(`${token} resolves to "${raw}", which is not a 6-digit hex`);
  return `#${hex[1].toUpperCase()}`;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failed = 0;
let light;
let dark;

try {
  ({ light, dark } = themes(readFileSync(THEME, 'utf8')));
} catch (err) {
  // A renamed or deleted token lands here. Say so in one line instead of a stack
  // trace, and still exit non-zero: an unreadable token table is a failed check.
  console.error(`check-contrast could not read the token table: ${err.message}`);
  process.exit(1);
}

const THEMES = [
  ['light', light],
  ['dark', dark],
];

try {
  for (const check of CHECKS) {
    for (const [name, vars] of THEMES) {
      const fg = resolve(check.fg, vars);
      const bg = resolve(check.bg, vars);
      const r = ratio(fg, bg);
      const ok = r >= check.min;
      if (!ok) failed += 1;
      const line = `${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1 (needs ${check.min}:1)  ${name.padEnd(5)}  ${check.where}  ${check.fg} ${fg} on ${check.bg} ${bg}`;
      console.log(ok ? line : `${line}  <-- ${check.why}`);
    }
  }
} catch (err) {
  console.error(`check-contrast could not resolve a pair in CHECKS: ${err.message}`);
  process.exit(1);
}

function scssFilesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...scssFilesUnder(full));
    else if (entry.name.endsWith('.scss') || entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

// Only `color:` counts. `background-color`, `border-color` and `caret-color` are
// all preceded by a dash, which is what the character class in front rules out --
// a token painting a border is not text and does not belong to this guard.
function colorTokensIn(source) {
  const out = new Set();
  for (const line of source.split('\n')) {
    if (line.trimStart().startsWith('//')) continue;
    for (const m of line.matchAll(/(?:^|[^-\w])color\s*:\s*var\(\s*(--tt-[\w-]+)/g)) out.add(m[1]);
  }
  return out;
}

// The worst this token measures against any surface a page actually paints, in
// either theme. This is what decides "restricted" -- the table decides, not a
// hand-written list that someone has to remember to update.
function worstOnPageSurfaces(token) {
  let worst = Infinity;
  let where = '';
  for (const surface of PAGE_SURFACES) {
    for (const [name, vars] of THEMES) {
      const r = ratio(resolve(token, vars), resolve(surface, vars));
      if (r < worst) {
        worst = r;
        where = `${r.toFixed(2)}:1 on ${surface} in ${name}`;
      }
    }
  }
  return { worst, where };
}

const SRC = join(root, 'src');
const usedAsColor = new Map(); // token -> Set of files that paint text with it

for (const file of scssFilesUnder(SRC)) {
  const rel = file
    .slice(root.length + 1)
    .split('\\')
    .join('/');
  if (rel === 'src/styles/theme.css') continue;
  for (const token of colorTokensIn(readFileSync(file, 'utf8'))) {
    if (!usedAsColor.has(token)) usedAsColor.set(token, new Set());
    usedAsColor.get(token).add(rel);
  }
}

const restricted = new Map(); // token -> { worst, where }
for (const token of [...usedAsColor.keys()].sort()) {
  let measured;
  try {
    measured = worstOnPageSurfaces(token);
  } catch (err) {
    // A typo or a token someone deleted from theme.css. Fail with the file that
    // uses it, not with a stack trace from three frames down.
    failed += 1;
    console.log(
      `FAIL  color: var(${token}) in ${[...usedAsColor.get(token)].join(', ')}  <-- ${err.message}`,
    );
    continue;
  }
  if (measured.worst < NORMAL_TEXT_FLOOR) restricted.set(token, measured);
}

for (const [token, { where }] of restricted) {
  const listed = ALLOWLIST.get(token) ?? new Map();
  const files = usedAsColor.get(token);
  for (const rel of files) {
    if (listed.has(rel)) continue;
    failed += 1;
    console.log(
      `FAIL  color: var(${token}) in ${rel} is not listed for that token  <-- it measures ${where}, under the ${NORMAL_TEXT_FLOOR}:1 normal-text floor, so this use needs a reason. Add the real pair to CHECKS with the background and size, then list the file under ${token} in ALLOWLIST.`,
    );
  }
  for (const rel of listed.keys()) {
    if (files.has(rel)) continue;
    failed += 1;
    console.log(
      `FAIL  ALLOWLIST lists ${rel} under ${token}, which no longer paints text with it  <-- drop the entry so the list keeps meaning something.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Third guard: the focus ring.
//
// TD-026. Measured on 8-oct before this half existed: --tt-focus was
// --tt-agave-400 (#41A695) and MISSED the 3:1 non-text floor on all four page
// surfaces in light -- 2.83 canvas, 2.95 surface, 2.69 subtle, 2.46 inset.
// Lighthouse accessibility was 100/100 on four routes on that same commit and
// did not see it, because contrast of a focus indicator is not one of the
// things it measures. A keyboard user on the light theme had a ring that was
// legally invisible, and no check in the repo covered the dimension.
//
// Derived, like the restricted-token half above: this does NOT name
// --tt-focus. It finds every token that paints an `outline` anywhere in the
// stylesheets -- in this codebase `outline` is only ever the focus ring, the
// global rule in theme.css and the focus-ring mixin in _tokens.scss -- and
// checks each one against every surface in PAGE_SURFACES, in both themes.
// Repoint the mixin at a different token tomorrow and the guard follows it
// without anyone editing this file.
//
// Why PAGE_SURFACES and not the button fill: the ring ships with
// outline-offset: 2px, so the gap shows the PARENT background and the ring is
// adjacent to that same background on both of its sides. --tt-brand is never an
// adjacent color, so asserting against it would be inventing a requirement.
// Recorded and deliberately NOT asserted: in dark, --tt-focus and --tt-brand
// both resolve to --tt-agave-300, which is 1.00:1 against itself. The offset
// gap is what keeps that legal under 1.4.11, and it is still worth knowing that
// the ring around the primary button is the same color as the button.
// ---------------------------------------------------------------------------
const FOCUS_RING_FLOOR = 3; // WCAG 2.1 SC 1.4.11, non-text contrast.

// `outline-offset` does not match: after `outline` comes `-offset`, which the
// optional `-color` group and the required colon reject.
function outlineTokensIn(source) {
  const out = new Set();
  for (const line of source.split('\n')) {
    if (line.trimStart().startsWith('//')) continue;
    for (const m of line.matchAll(/(?:^|[^-\w])outline(?:-color)?\s*:[^;}]*var\(\s*(--tt-[\w-]+)/g)) {
      out.add(m[1]);
    }
  }
  return out;
}

const ringTokens = new Map(); // token -> Set of files that paint an outline with it

for (const file of scssFilesUnder(SRC)) {
  const rel = file
    .slice(root.length + 1)
    .split('\\')
    .join('/');
  for (const token of outlineTokensIn(readFileSync(file, 'utf8'))) {
    if (!ringTokens.has(token)) ringTokens.set(token, new Set());
    ringTokens.get(token).add(rel);
  }
}

// A guard that passes because it found nothing to check is the adornment this
// repo keeps catching itself writing. If the ring stops being painted with a
// token, that is a finding, not a pass.
if (ringTokens.size === 0) {
  failed += 1;
  console.log(
    'FAIL  no token paints an `outline` anywhere under src/  <-- either the focus ring stopped being a token (check theme.css and the focus-ring mixin in _tokens.scss) or this guard stopped being able to see it. Both are breakage.',
  );
}

for (const [token, files] of [...ringTokens.entries()].sort()) {
  for (const surface of PAGE_SURFACES) {
    for (const [name, vars] of THEMES) {
      let r;
      try {
        r = ratio(resolve(token, vars), resolve(surface, vars));
      } catch (err) {
        failed += 1;
        console.log(`FAIL  focus ring ${token} in ${[...files].join(', ')}  <-- ${err.message}`);
        continue;
      }
      const ok = r >= FOCUS_RING_FLOOR;
      if (!ok) failed += 1;
      const line = `${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1 (needs ${FOCUS_RING_FLOOR}:1)  ${name.padEnd(5)}  focus ring ${token} on ${surface}`;
      console.log(
        ok
          ? line
          : `${line}  <-- the ring sits directly against this surface, and a focus indicator under ${FOCUS_RING_FLOOR}:1 is WCAG 2.1 1.4.11. Darken the token for this theme; the agave ramp is in theme.css.`,
      );
    }
  }
}

// The other direction: an entry whose token is no longer restricted. Keeping it
// would turn the list into ceremony, and ceremony is what stops being read.
for (const token of ALLOWLIST.keys()) {
  if (restricted.has(token)) continue;
  failed += 1;
  const used = usedAsColor.has(token)
    ? `it now clears ${NORMAL_TEXT_FLOOR}:1 on every page surface`
    : 'it is no longer used as a text color anywhere';
  console.log(
    `FAIL  ALLOWLIST restricts ${token}, but ${used}  <-- remove the whole entry. A restriction that protects nothing costs attention on every future change.`,
  );
}

if (failed === 0) {
  const entries = [...restricted.keys()]
    .map((t) => `${t} (${ALLOWLIST.get(t).size} file(s))`)
    .join(', ');
  console.log(
    `\nRestricted text tokens, derived from theme.css: ${restricted.size} of ${usedAsColor.size} tokens used as a color -- ${entries}. All uses accounted for.`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(
  `All ${CHECKS.length * 2} contrast checks pass, plus the focus ring on ${PAGE_SURFACES.length} page surfaces in both themes (${[...ringTokens.keys()].join(', ')}).`,
);
