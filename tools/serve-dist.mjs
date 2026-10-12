#!/usr/bin/env node
/**
 * serve-dist — serves the production build the way Azure Static Web Apps does,
 * so a local Lighthouse run measures the app instead of the dev server.
 *
 * Why this exists: a plain static server (`http-server`, `python -m http.server`)
 * sends assets UNCOMPRESSED. Azure Static Web Apps sends brotli/gzip. On the
 * mobile Lighthouse preset, where the network is throttled, that single
 * difference moved the performance score by ~13 points on this app
 * (81 uncompressed vs 94 compressed). Measuring against an uncompressed
 * server produces a floor, not a number worth optimising against.
 *
 * It also honours this repo's own `staticwebapp.config.json` (route rewrites,
 * navigation fallback, global headers, mime types), read from the served
 * directory, so the routing under test cannot drift from the deployed routing.
 *
 * Usage:
 *   npm run serve:dist                 # dist/TacoTuesdayUI/browser on :8099
 *   npm run serve:dist -- --port 4300
 *   npm run serve:dist -- --no-compress   # reproduce the uncompressed floor
 *
 * This is a measurement and preview tool. It is not a production server.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib';
import { join, extname, resolve } from 'node:path';

const DEFAULT_ROOT = 'dist/TacoTuesdayUI/browser';
const DEFAULT_PORT = 8099;

function parseArgs(argv) {
  const opts = { root: DEFAULT_ROOT, port: DEFAULT_PORT, compress: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-compress') opts.compress = false;
    else if (arg === '--port') opts.port = Number(argv[++i]);
    else if (arg.startsWith('--port=')) opts.port = Number(arg.slice(7));
    else if (arg === '--root') opts.root = argv[++i];
    else if (arg.startsWith('--root=')) opts.root = arg.slice(7);
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`serve-dist: unknown argument "${arg}"`);
  }
  if (!Number.isInteger(opts.port) || opts.port < 1 || opts.port > 65535) {
    throw new Error(`serve-dist: --port must be an integer 1-65535`);
  }
  return opts;
}

const HELP = `serve-dist — serve the production build like Azure Static Web Apps

  --port <n>      port to listen on (default ${DEFAULT_PORT})
  --root <dir>    directory to serve (default ${DEFAULT_ROOT})
  --no-compress   disable brotli/gzip, to reproduce the uncompressed floor
  --help          show this message
`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

/** Text assets Azure compresses. Images and fonts are already compressed. */
const COMPRESSIBLE = new Set([
  '.html', '.js', '.css', '.json', '.map', '.svg', '.xml', '.txt', '.webmanifest',
]);

/** Mirrors the `*.{css,js,...}` glob in navigationFallback.exclude. */
const EXCLUDED_EXTENSIONS =
  /\.(css|js|map|png|jpe?g|svg|ico|webp|woff2?|txt|xml|webmanifest)$/i;

/** Angular emits hashed filenames; those are safe to cache forever. */
const HASHED_ASSET = /-[A-Z0-9]{8}\.(js|css)$/;

function negotiateEncoding(acceptEncoding = '') {
  if (/\bbr\b/.test(acceptEncoding)) return 'br';
  if (/\bgzip\b/.test(acceptEncoding)) return 'gzip';
  return null;
}

function compress(buffer, encoding) {
  return encoding === 'br'
    ? brotliCompressSync(buffer, {
        params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5 },
      })
    : gzipSync(buffer, { level: 6 });
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function isExcludedFromFallback(pathname, exclude) {
  if (EXCLUDED_EXTENSIONS.test(pathname)) return true;
  return exclude.some(
    (glob) => glob.endsWith('/*') && pathname.startsWith(glob.slice(0, -1)),
  );
}

/** Resolves a request path to a file in the served root, the way Azure does. */
async function resolveTarget(pathname, root, config) {
  const rewrite = (config.routes ?? []).find((r) => r.route === pathname);
  if (rewrite?.rewrite) return rewrite.rewrite;

  for (const candidate of [pathname, join(pathname, 'index.html')]) {
    if (candidate.endsWith('/')) continue;
    if (await isFile(join(root, candidate))) return candidate;
  }
  if (pathname === '/') return '/index.html';

  const fallback = config.navigationFallback;
  if (fallback && !isExcludedFromFallback(pathname, fallback.exclude ?? [])) {
    return fallback.rewrite ?? '/index.html';
  }
  return null;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }

  const root = resolve(opts.root);
  if (!(await isFile(join(root, 'index.html')))) {
    throw new Error(
      `serve-dist: no index.html in ${root}\n` +
        `  Run \`npm run build\` first, or pass --root <dir>.`,
    );
  }

  let config = {};
  const configPath = join(root, 'staticwebapp.config.json');
  if (await isFile(configPath)) {
    config = JSON.parse(await readFile(configPath, 'utf8'));
  } else {
    process.stderr.write(
      `serve-dist: warning — no staticwebapp.config.json in the served root;\n` +
        `  route rewrites and global headers will NOT match production.\n`,
    );
  }

  const cache = new Map();

  const server = createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end('bad request');
      return;
    }

    for (const [name, value] of Object.entries(config.globalHeaders ?? {})) {
      res.setHeader(name, value);
    }

    const target = await resolveTarget(pathname, root, config);
    if (!target) {
      res.writeHead(404).end('not found');
      return;
    }

    let body;
    try {
      body = await readFile(join(root, target));
    } catch {
      res.writeHead(404).end('not found');
      return;
    }

    const ext = extname(target).toLowerCase();
    res.setHeader(
      'Content-Type',
      config.mimeTypes?.[ext] ?? MIME_TYPES[ext] ?? 'application/octet-stream',
    );
    res.setHeader(
      'Cache-Control',
      HASHED_ASSET.test(target)
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    );
    res.setHeader('Vary', 'Accept-Encoding');

    const encoding =
      opts.compress && COMPRESSIBLE.has(ext)
        ? negotiateEncoding(req.headers['accept-encoding'])
        : null;

    if (encoding) {
      const key = `${encoding}:${target}`;
      if (!cache.has(key)) cache.set(key, compress(body, encoding));
      body = cache.get(key);
      res.setHeader('Content-Encoding', encoding);
    }

    res.setHeader('Content-Length', body.length);
    res.writeHead(200);
    res.end(req.method === 'HEAD' ? undefined : body);
  });

  server.listen(opts.port, '127.0.0.1', () => {
    process.stdout.write(
      `serve-dist: http://127.0.0.1:${opts.port}  root=${root}  ` +
        `compression=${opts.compress ? 'brotli/gzip' : 'OFF (uncompressed floor)'}\n`,
    );
  });
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
