/**
 * Fails when the Azure Static Web Apps workflow can CREATE a staging
 * environment for a pull request without being able to CLOSE it.
 *
 * Why this guard exists, in one paragraph. A Static Web App has a hard cap on
 * live staging environments. `Azure/static-web-apps-deploy` creates one per
 * pull request on `action: upload`, and the only thing that ever removes it is
 * the same action with `action: close`, which runs from a second job gated on
 * `github.event.action == 'closed'`. The two jobs are written in the same file
 * and look like a matched pair, so nobody reads them as a lifecycle that can
 * come apart. It came apart here: on 2026-10-07 a patch added
 * `github.actor != 'dependabot[bot]'` to BOTH jobs, which reads as symmetric
 * and is not, because `github.actor` is a DIFFERENT person on the two events --
 * whoever pushed on `synchronize`, whoever closed on `closed`. A pull request
 * synchronized by a human and later closed by Dependabot (which closes its own
 * superseded bumps routinely) therefore creates an environment the close job
 * skips. Those leak silently until the cap is hit, and then the failure lands
 * on an unrelated pull request as `The content server has rejected the request
 * with: BadRequest / already has the maximum number of staging environments` --
 * a deploy blocked by a pull request that was closed weeks earlier.
 *
 * The invariant, in two lines:
 *   1. The close path must not depend on WHO is acting. Closing an environment
 *      that was never created is a no-op; failing to close one costs a slot
 *      forever, so the asymmetry in cost is total and the gate is never worth it.
 *   2. The create path must not depend on `github.actor` either. If it wants to
 *      skip a bot's pull requests it has to say so with the pull request's
 *      AUTHOR (`github.event.pull_request.user.login`), which is the same value
 *      on `opened`, `synchronize` and `closed`. `github.actor` is not: gating
 *      a lifecycle on a value that changes mid-lifecycle is the defect itself.
 *
 * What this guard does NOT claim. It does not talk to Azure and cannot see how
 * many environments are live right now, nor clean one up -- that is
 * `az staticwebapp environment list/delete`, and it needs credentials this repo
 * does not have. It reads the workflow's own `if:` expressions and answers one
 * question: can this file leak? It also does not evaluate GitHub expressions in
 * general. It substitutes the context values it knows and then REFUSES to
 * evaluate anything left over that is not a boolean operator, a parenthesis or
 * a quoted string, so an `if:` using a context this guard has never heard of
 * fails loudly as unsupported instead of passing as `true`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW_DIR = join(REPO, '.github/workflows');

const BOT = 'dependabot[bot]';
const HUMAN = 'Gio-Mtz';
const IDENTITIES = [HUMAN, BOT];
const CREATE_ACTIONS = ['opened', 'synchronize', 'reopened'];

let failed = 0;
let checks = 0;

function fail(message) {
  failed += 1;
  console.log(`FAIL  ${message}`);
}

function pass(message) {
  console.log(`ok    ${message}`);
}

/**
 * Pulls one job's `if:` expression out of the YAML without a YAML parser --
 * the repo has no dependency for that and a guard is not worth adding one for.
 * Handles a plain scalar (`if: a == b`) and a folded block (`if: >-` followed
 * by more-indented lines), which are the two forms this file uses.
 */
function readJobCondition(lines, jobName) {
  const header = lines.findIndex((l) => new RegExp(`^  ${jobName}:\\s*$`).test(l));
  if (header === -1) return { found: false };
  for (let i = header + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^ {0,2}\S/.test(line) && line.trim() !== '') break; // next job or top-level key
    const m = /^ {4}if:\s*(.*)$/.exec(line);
    if (!m) continue;
    const first = m[1].trim();
    if (first !== '>-' && first !== '>' && first !== '|' && first !== '|-') {
      return { found: true, expression: first };
    }
    // At least six spaces, not exactly six: a folded expression indents its
    // continuation lines freely, and `(github.event_name == ...` sits at seven.
    // Reading only the first two lines of a three-line condition produced an
    // unbalanced expression that failed as "unsupported" -- a false alarm from
    // the instrument, which is the one failure mode a guard must not have.
    const parts = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      if (!/^ {6,}\S/.test(lines[j])) break;
      parts.push(lines[j].trim());
    }
    return { found: true, expression: parts.join(' ') };
  }
  return { found: true, expression: null };
}

/** The contexts this guard knows how to substitute. Anything else is refused. */
function substitute(expression, ctx) {
  const known = {
    'github.event_name': ctx.event_name,
    'github.event.action': ctx.action,
    'github.actor': ctx.actor,
    'github.event.pull_request.user.login': ctx.pr_author,
    'github.repository_owner': ctx.repository_owner,
  };
  let out = expression;
  // Longest path first, so `github.event.action` is not eaten by `github.event`.
  for (const path of Object.keys(known).sort((a, b) => b.length - a.length)) {
    const value = known[path];
    const literal = value === null || value === undefined ? 'null' : JSON.stringify(value);
    out = out.split(path).join(literal);
  }
  return out;
}

function evaluate(expression, ctx) {
  const substituted = substitute(expression, ctx)
    .replace(/!==?/g, '!==')
    .replace(/(?<![!=<>])===?/g, '===');
  // Refuse anything we did not fully substitute. A guard that silently treats
  // an unknown context as truthy is worse than no guard.
  const leftovers = substituted.replace(/'[^']*'|"[^"]*"|null|true|false/g, '');
  if (/[A-Za-z_$]/.test(leftovers)) {
    throw new Error(
      `unsupported expression -- after substituting the contexts this guard knows, ` +
        `this was left: ${leftovers.trim()} (from: ${expression})`,
    );
  }
  if (!/^[\s()'"a-zA-Z0-9_![\]\-.,=&|]*$/.test(substituted)) {
    throw new Error(`refusing to evaluate, unexpected characters: ${substituted}`);
  }
  return Boolean(new Function(`"use strict"; return (${substituted});`)());
}

const workflows = readdirSync(WORKFLOW_DIR)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ({ file: f, text: readFileSync(join(WORKFLOW_DIR, f), 'utf8') }))
  .filter((w) => w.text.includes('Azure/static-web-apps-deploy'));

checks += 1;
if (workflows.length === 0) {
  fail(
    `no workflow in .github/workflows uses Azure/static-web-apps-deploy. This guard is about the ` +
      `staging-environment lifecycle of that action; if the deploy moved, this guard has to move with it ` +
      `or be deleted on purpose -- it must not sit here reporting "0 of 0 checks pass".`,
  );
} else {
  pass(
    `${workflows.length} workflow(s) use Azure/static-web-apps-deploy: ${workflows.map((w) => w.file).join(', ')}`,
  );
}

for (const { file, text } of workflows) {
  const lines = text.split(/\r?\n/);
  const uploads = /action:\s*['"]?upload['"]?/.test(text);
  const closes = /action:\s*['"]?close['"]?/.test(text);

  checks += 1;
  if (uploads && !closes) {
    fail(
      `${file} deploys with action: upload and never calls action: close. Every pull request would leak ` +
        `a staging environment until the Static Web App hits its cap.`,
    );
    continue;
  }
  pass(`${file} has both an upload and a close call`);

  checks += 1;
  const prTypes = /pull_request:\s*\n\s*types:\s*\[([^\]]*)\]/.exec(text);
  if (!prTypes) {
    fail(
      `${file} does not list pull_request types, so it cannot be relied on to receive the closed event`,
    );
  } else if (!/\bclosed\b/.test(prTypes[1])) {
    fail(
      `${file} listens for pull_request types [${prTypes[1].trim()}] -- without "closed" the close job ` +
        `never runs at all and every environment leaks`,
    );
  } else {
    pass(`${file} listens for the closed pull_request event`);
  }

  const create = readJobCondition(lines, 'build_and_deploy_job');
  const close = readJobCondition(lines, 'close_pull_request_job');

  checks += 1;
  if (!create.found || !close.found) {
    fail(
      `${file} is missing ${!create.found ? 'build_and_deploy_job' : 'close_pull_request_job'}. This guard ` +
        `identifies the pair by the names the Azure scaffold uses; if they were renamed, rename them here too.`,
    );
    continue;
  }
  pass(`${file} has both build_and_deploy_job and close_pull_request_job`);

  // 1. The close path must not depend on identity.
  for (const actor of IDENTITIES) {
    checks += 1;
    const ctx = {
      event_name: 'pull_request',
      action: 'closed',
      actor,
      pr_author: HUMAN,
      repository_owner: HUMAN,
    };
    let closeRuns;
    try {
      closeRuns = close.expression === null ? true : evaluate(close.expression, ctx);
    } catch (error) {
      fail(`${file} close_pull_request_job: ${error.message}`);
      continue;
    }
    if (!closeRuns) {
      fail(
        `${file} close_pull_request_job does NOT run when the pull request is closed by "${actor}". ` +
          `Whoever clicks close is not knowable in advance, and a skipped close costs a staging-environment ` +
          `slot permanently. Condition: ${close.expression}`,
      );
    } else {
      pass(`${file} closes the environment when the pull request is closed by "${actor}"`);
    }
  }

  // 2. Create and close must agree about WHICH pull request they are discussing.
  checks += 1;
  if (create.expression && create.expression.includes('github.actor')) {
    fail(
      `${file} build_and_deploy_job gates on github.actor, which is whoever triggered THIS event -- the ` +
        `pusher on synchronize, the closer on closed. A staging environment lives across both events, so a ` +
        `pull request synchronized by a human and closed by a bot is created and never closed. Use ` +
        `github.event.pull_request.user.login (the author, identical on every event of one pull request). ` +
        `Condition: ${create.expression}`,
    );
  } else {
    pass(`${file} build_and_deploy_job does not gate on github.actor`);
  }

  // 3. The lifecycle, enumerated: anything created must be closable.
  for (const prAuthor of IDENTITIES) {
    for (const createActor of IDENTITIES) {
      for (const closeActor of IDENTITIES) {
        checks += 1;
        const base = { event_name: 'pull_request', pr_author: prAuthor, repository_owner: HUMAN };
        let created = false;
        let createdBy = null;
        try {
          for (const action of CREATE_ACTIONS) {
            const ctx = { ...base, action, actor: createActor };
            if (create.expression === null ? true : evaluate(create.expression, ctx)) {
              created = true;
              createdBy = action;
              break;
            }
          }
          if (!created) {
            pass(
              `author=${prAuthor} triggered-by=${createActor}: no environment is created, nothing to leak`,
            );
            continue;
          }
          const closeCtx = { ...base, action: 'closed', actor: closeActor };
          const closed = close.expression === null ? true : evaluate(close.expression, closeCtx);
          if (closed) {
            pass(
              `author=${prAuthor} ${createdBy}-by=${createActor} closed-by=${closeActor}: created and closed`,
            );
          } else {
            fail(
              `LEAK -- author=${prAuthor}, ${createdBy} by ${createActor} CREATES a staging environment, ` +
                `and closed by ${closeActor} does NOT close it. That slot is gone until someone runs ` +
                `az staticwebapp environment delete by hand.`,
            );
          }
        } catch (error) {
          fail(`${file} lifecycle matrix: ${error.message}`);
        }
      }
    }
  }
}

console.log('');
if (failed > 0) {
  console.log(
    `${failed} of ${checks} Static Web Apps lifecycle checks FAILED. Every staging environment this ` +
      `workflow creates has to have a path that closes it, for every identity, or the Static Web App ` +
      `runs out of slots and blocks an unrelated pull request's deploy.`,
  );
  process.exit(1);
}
console.log(
  `All ${checks} Static Web Apps lifecycle checks pass: the close job runs for every identity that can ` +
    `close a pull request, and nothing gates the environment's lifetime on a value that changes mid-lifetime.`,
);
