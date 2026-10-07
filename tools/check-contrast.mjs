// GUARD, not documentation. This script is the regression net for TD-008: the step
// numbers in "How it works" shipped at 1.88:1 (light) and 1.73:1 (dark) because a
// --tt-border-* token was doing text work. A comment alone did not survive -- TD-012
// stripped the one that recorded the intent -- so the floor lives here, as an
// assertion that exits non-zero.
//
// It reads the real token table out of src/styles/theme.css, resolves each var()
// chain down to a hex, and checks the WCAG 2.1 contrast ratio in BOTH themes.
// Adding a pair to CHECKS below is how you protect a new piece of text.

import { readFileSync } from 'node:fs';
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
];

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

try {
  const { light, dark } = themes(readFileSync(THEME, 'utf8'));

  for (const check of CHECKS) {
    for (const [name, vars] of [
      ['light', light],
      ['dark', dark],
    ]) {
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
  // A renamed or deleted token lands here. Say so in one line instead of a stack
  // trace, and still exit non-zero: an unreadable token table is a failed check.
  console.error(`check-contrast could not read the token table: ${err.message}`);
  process.exit(1);
}

if (failed > 0) {
  console.error(`\n${failed} contrast check(s) below the WCAG floor.`);
  process.exit(1);
}
console.log(`\nAll ${CHECKS.length * 2} contrast checks pass.`);
