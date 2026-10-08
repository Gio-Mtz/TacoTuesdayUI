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
];

// Second guard, and the one that would have caught the bug this card fixed.
// --tt-text-muted measures 4.39:1 against --tt-bg-canvas in the light theme:
// below the 4.5:1 floor for normal text. So it is a LARGE-TEXT-ONLY token, and
// /privacidad was using it for a 14px line. A comment saying so does not survive
// (TD-012 stripped the ones that recorded intent), so the restriction lives here:
// every use of the token in component styles must be listed, with the size that
// makes it legal. A new use fails the build until it is justified.
const MUTED_TOKEN = '--tt-text-muted';
const MUTED_ALLOWLIST = new Map([
  [
    'src/app/landing/sections/how-it-works/how-it-works.scss',
    '.steps__number, 36px/700 -> large text, checked above at 3:1',
  ],
  [
    'src/app/layout/site-footer/site-footer.scss',
    '.site-footer__heading and .site-footer__legal, 14px on --tt-bg-surface, checked above at 4.5:1',
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

function scssFilesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...scssFilesUnder(full));
    else if (entry.name.endsWith('.scss') || entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

const SRC = join(root, 'src');
const unlisted = [];
const stale = new Set(MUTED_ALLOWLIST.keys());

for (const file of scssFilesUnder(SRC)) {
  const rel = file.slice(root.length + 1).split('\\').join('/');
  if (rel === 'src/styles/theme.css') continue;
  const uses = readFileSync(file, 'utf8')
    .split('\n')
    .some((line) => !line.trimStart().startsWith('//') && line.includes(MUTED_TOKEN));
  if (!uses) continue;
  if (MUTED_ALLOWLIST.has(rel)) stale.delete(rel);
  else unlisted.push(rel);
}

for (const rel of unlisted) {
  failed += 1;
  console.log(
    `FAIL  ${MUTED_TOKEN} used in ${rel}, which is not in MUTED_ALLOWLIST  <-- the token is 4.39:1 on --tt-bg-canvas in light: large text only. Add the pair to CHECKS with the real background and size, then list the file here.`,
  );
}
for (const rel of stale) {
  failed += 1;
  console.log(
    `FAIL  MUTED_ALLOWLIST lists ${rel}, which no longer uses ${MUTED_TOKEN}  <-- drop the entry so the allowlist keeps meaning something.`,
  );
}
if (unlisted.length === 0 && stale.size === 0) {
  console.log(`\n${MUTED_TOKEN} usage: ${MUTED_ALLOWLIST.size} file(s), all accounted for.`);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(`All ${CHECKS.length * 2} contrast checks pass.`);
