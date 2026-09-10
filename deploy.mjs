#!/usr/bin/env node
// One-command deployment for every supported provider.
//
//   node deploy.mjs                  interactive picker
//   node deploy.mjs cloudflare       deploy one provider
//   node deploy.mjs --list           show providers and their state
//   node deploy.mjs vercel --yes     non-interactive (fails instead of prompting)
//
// Each provider's CLI owns its own auth. This script shells out to `<cli> login`,
// which opens a browser for the user to grant access, then waits. No token is
// ever read, stored or echoed here.
import { spawn, spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { stdin, stdout } from 'node:process';
import { generateNative } from './deploy-native.mjs';

const ASSUME_YES = process.argv.includes('--yes');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flagValue = (name) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);

// NO_COLOR is respected; piped output drops escapes so logs stay readable.
const COLOR = stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => c(1, s);
const green = (s) => c(32, s);
const yellow = (s) => c(33, s);
const red = (s) => c(31, s);
const cyan = (s) => c(36, s);
const dim = (s) => c(2, s);
// Pad on the plain string: padEnd() on a coloured string counts escape bytes.
const pad = (s, n) => String(s) + " ".repeat(Math.max(0, n - String(s).length));
const padL = (s, n) => " ".repeat(Math.max(0, n - String(s).length)) + String(s);

const say = (s = '') => console.log(s);
const step = (s) => say('\n' + bold('▸ ' + s));
const ok = (s) => say('  ' + green('✓') + ' ' + s);
const warn = (s) => say('  ' + yellow('!') + ' ' + s);
const fail = (s) => say('  ' + red('✗') + ' ' + s);

let rl = null;
const INTERACTIVE = stdin.isTTY && !ASSUME_YES;
async function ask(question, fallback = '') {
  // Piped/redirected stdin can never answer: take the default instead of
  // blocking forever or spinning on an immediate EOF.
  if (!INTERACTIVE) return fallback;
  rl ??= readline.createInterface({ input: stdin, output: stdout });
  const a = (await rl.question('  ' + question)).trim();
  return a || fallback;
}
async function confirm(question) {
  if (!INTERACTIVE) return true;
  const a = await ask(question + ' [y/N] ');
  return /^y(es)?$/i.test(a);
}

// Windows cannot exec a .cmd/.bat shim directly, which is why every npm-installed
// CLI (npx, wrangler, vercel, netlify) needs help. `shell: true` would do it but
// Node deprecates that with args (DEP0190) because it concatenates without
// escaping — so resolve the real .cmd path instead and spawn it with no shell.
const WIN = process.platform === 'win32';
const winShimCache = new Map();
function resolveBin(cmd) {
  if (!WIN) return cmd;
  // Already an explicit path (a node_modules/.bin shim): use it as given.
  if (cmd.includes('/') || cmd.includes('\\')) return cmd;
  if (winShimCache.has(cmd)) return winShimCache.get(cmd);
  const probe = spawnSync('where', [cmd], { encoding: 'utf8', windowsHide: true });
  const hit = (probe.stdout || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Prefer the .cmd/.exe shim; `where` lists the extensionless script first.
  const best = hit.find((p) => /\.(cmd|bat|exe)$/i.test(p)) || hit[0] || cmd;
  winShimCache.set(cmd, best);
  return best;
}

/** Quote one argument for a cmd.exe command line (npx.cmd lives under "Program Files"). */
function winQuote(arg) {
  const s = String(arg);
  if (/["%\r\n]/.test(s)) throw new Error('A Windows batch CLI argument contains quotes, percent signs or line breaks. Configure that value through the provider dashboard or a native executable.');
  // Always quote: unquoted ampersands/pipes in paths or passwords are shell code.
  return '"' + s.replace(/(\\+)$/, '$1$1') + '"';
}

function spawnArgs(cmd, cmdArgs, extra = {}) {
  const bin = resolveBin(cmd);
  const isBatch = WIN && /\.(cmd|bat)$/i.test(bin);
  if (!isBatch) return [bin, cmdArgs, { windowsHide: true, ...extra }];
  // A .cmd shim can only be run through cmd.exe. Build the command line
  // ourselves with each argument quoted, then hand it over verbatim: `/s` makes
  // cmd strip just the outer quotes and take the rest as-is, so a path with
  // spaces survives and no argument can break out into another command.
  const line = '"' + [bin, ...cmdArgs].map(winQuote).join(' ') + '"';
  return [
    process.env.ComSpec || 'cmd.exe',
    ['/d', '/s', '/c', line],
    { windowsVerbatimArguments: true, windowsHide: true, ...extra }
  ];
}

/** Run a command, streaming output. Returns the exit code. */
function run(cmd, cmdArgs, opts = {}) {
  say(dim('  $ ' + cmd + ' ' + cmdArgs.map((a, i) => /^(PANEL_PASSWORD|JWT_SECRET|SUB_TOKEN|TROJAN_PASSWORD|.*REST.*TOKEN)=/.test(a) ? a.split('=')[0] + '=[redacted]' : (cmdArgs[i - 2] === 'env:set' ? '[redacted]' : a)).join(' ')));
  const [bin, argv, base] = spawnArgs(cmd, cmdArgs, { stdio: 'inherit', ...opts });
  const res = spawnSync(bin, argv, base);
  return res.status ?? 1;
}

/** Run a command and capture stdout, without echoing it. */
function capture(cmd, cmdArgs) {
  const [bin, argv, base] = spawnArgs(cmd, cmdArgs, { encoding: 'utf8' });
  const res = spawnSync(bin, argv, base);
  return { code: res.status ?? 1, out: (res.stdout || '') + (res.stderr || '') };
}

/** Run a command, feeding it a value on stdin (for `secret put` style CLIs). */
function feed(cmd, cmdArgs, input) {
  const [bin, argv, base] = spawnArgs(cmd, cmdArgs, { encoding: 'utf8', input });
  return spawnSync(bin, argv, base).status ?? 1;
}

function has(cmd) {
  if (WIN) return spawnSync('where', [cmd], { windowsHide: true }).status === 0;
  return spawnSync('which', [cmd]).status === 0;
}

function randomSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Ensure a CLI is available. Global install wins; otherwise fall back to npx,
 * which fetches it on demand without touching the user's global environment.
 */
/** Path to a CLI already installed under ./node_modules, or null. */
function localBin(bin) {
  const base = path.join(process.cwd(), 'node_modules', '.bin', bin);
  for (const candidate of WIN ? [base + '.cmd', base + '.exe', base] : [base]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function ensureCli({ bin, npmPackage, installHint }) {
  if (has(bin)) return [bin];

  // `npx -y <pkg>@latest` re-resolves and re-downloads the package on every
  // single invocation — several times per deploy. Install it once into
  // ./node_modules instead and reuse that copy on every later run.
  const cached = localBin(bin);
  if (cached) {
    ok(`${bin}: using cached ./node_modules/.bin/${bin}`);
    return [cached];
  }
  if (npmPackage) {
    warn(`${bin} is not installed. Fetching it once into ./node_modules (later runs reuse it).`);
    if (run('npm', ['install', '--no-save', '--no-audit', '--no-fund', npmPackage]) !== 0) {
      fail(`Could not install ${npmPackage}.`);
      return null;
    }
    const installed = localBin(bin);
    if (installed) {
      ok(`${bin} installed.`);
      return [installed];
    }
    warn(`${bin} installed but no ./node_modules/.bin/${bin} shim appeared — falling back to npx.`);
    return ['npx', ['-y', npmPackage]];
  }
  fail(`${bin} is required. ${installHint || ''}`);
  return null;
}

function cli(resolved, extra) {
  // resolved is either [bin] or ['npx', ['-y', pkg]]
  return resolved.length === 1
    ? { cmd: resolved[0], pre: [] }
    : { cmd: resolved[0], pre: resolved[1] };
}

async function ensureLoggedIn({ resolved, whoamiArgs, loginArgs, name }) {
  const { cmd, pre } = cli(resolved);
  const probe = capture(cmd, [...pre, ...whoamiArgs]);
  if (probe.code === 0 && !/not (logged|authenticated)|log ?in/i.test(probe.out)) {
    ok(`${name}: already authenticated.`);
    return true;
  }
  warn(`${name}: not authenticated.`);
  say(dim('  A browser window will open so you can grant access. Nothing is stored by this script.'));
  if (!(await confirm(`Run \`${cmd} ${[...pre, ...loginArgs].join(' ')}\` now?`))) {
    fail(`${name}: skipped — cannot deploy without authentication.`);
    return false;
  }
  if (run(cmd, [...pre, ...loginArgs]) !== 0) {
    fail(`${name}: login failed.`);
    return false;
  }
  ok(`${name}: authenticated.`);
  return true;
}

// nodejs_compat v2 (needed for globalThis.process in this bundle) requires
// 2024-09-23 or later; older dates fail at boot with `getBuiltinModule`.
const PAGES_COMPAT_DATE = '2025-09-01';

/**
 * Find or create the BK_KV namespace and return its id. Reuses an existing one
 * by title so repeated deploys do not litter the account with empty namespaces.
 */
/**
 * A namespace id is only usable if the account really has it.
 * `--remote` is essential: without it wrangler queries the local miniflare
 * store and exits 0 for any id at all, so the check would pass a namespace that
 * does not exist and the deploy would then fail at publish time.
 */
function kvNamespaceUsable(cmd, pre, id) {
  return capture(cmd, [...pre, 'kv', 'key', 'list', `--namespace-id=${id}`, '--remote']).code === 0;
}

/** Pull the 32-hex id out of whatever shape this wrangler version printed. */
function parseNamespaceId(out) {
  const m = out.match(/"?id"?\s*[=:]\s*"?([0-9a-f]{32})"?/i) || out.match(/\b([0-9a-f]{32})\b/i);
  return m ? m[1] : null;
}

async function ensureKvNamespace(cmd, pre) {
  const list = capture(cmd, [...pre, 'kv', 'namespace', 'list']);
  if (list.code === 0) {
    const start = list.out.indexOf('[');
    if (start !== -1) {
      try {
        const all = JSON.parse(list.out.slice(start));
        // Exact binding name first; only then a looser project-ish match, so we
        // never silently adopt some unrelated app's namespace.
        const hit = all.find((n) => n.title === 'BK_KV')
          || all.find((n) => /blueknight|wd_kv/i.test(n.title || ''));
        if (hit && kvNamespaceUsable(cmd, pre, hit.id)) {
          ok(`Reusing KV namespace "${hit.title}" (${hit.id}).`);
          return hit.id;
        }
        if (hit) warn(`Namespace "${hit.title}" is listed but not readable — creating a fresh one.`);
      } catch {
        warn('Could not parse the namespace list — creating a fresh namespace.');
      }
    }
  } else {
    warn('Could not list KV namespaces (are you logged in?) — trying to create one.');
  }

  const made = capture(cmd, [...pre, 'kv', 'namespace', 'create', 'BK_KV']);
  const id = parseNamespaceId(made.out);
  if (!id) {
    fail('Could not create a KV namespace. Wrangler said:');
    say(made.out.trim() || '  (no output)');
    say('  ' + dim('Create it by hand, then rerun: wrangler kv namespace create BK_KV'));
    return null;
  }
  // Creation can report success before the namespace is actually queryable.
  for (let i = 0; i < 5; i++) {
    if (kvNamespaceUsable(cmd, pre, id)) {
      ok(`Created KV namespace ${id}.`);
      return id;
    }
  }
  fail(`Created namespace ${id} but the API will not serve it yet. Rerun in a moment.`);
  return null;
}

/**
 * A Pages project's production branch. Deploying to any other branch silently
 * produces a *preview* URL while the live site keeps serving the old build.
 */
async function productionBranch(cmd, pre, project) {
  const res = capture(cmd, [...pre, 'pages', 'deployment', 'list', '--project-name', project]);
  if (res.code !== 0) return null;
  for (const line of res.out.split('\n')) {
    if (!/Production/.test(line)) continue;
    const cells = line.split('│').map((s) => s.trim()).filter(Boolean);
    const i = cells.findIndex((s) => s === 'Production');
    if (i >= 0 && cells[i + 1]) return cells[i + 1];
  }
  return null;
}

/** Read a required secret, offering to generate one. */
async function panelSecrets() {
  const password =
    process.env.PANEL_PASSWORD ||
    (await ask('Admin password for the panel (blank = generate): ')) ||
    'wd-' + randomSecret(8);
  const jwt = process.env.JWT_SECRET || randomSecret(32);
  return { password, jwt };
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

const providers = {
  cloudflare: {
    label: 'Cloudflare Workers',
    notes: 'VLESS/Trojan WebSocket support: panel, subscriptions and the proxy tunnel.',
    async deploy() {
      const resolved = await ensureCli({ bin: 'wrangler', npmPackage: 'wrangler@latest' });
      if (!resolved) return 1;
      const { cmd, pre } = cli(resolved);
      if (!(await ensureLoggedIn({
        resolved, name: 'Cloudflare', whoamiArgs: ['whoami'], loginArgs: ['login']
      }))) return 1;

      step('KV namespace');
      let id = null;
      const toml = fs.readFileSync('wrangler.toml', 'utf8');
      const existing = toml.match(/^id\s*=\s*"([^"]+)"/m);
      if (existing && existing[1] !== 'YOUR_KV_NAMESPACE_ID') {
        ok('Reusing KV namespace id from wrangler.toml.');
        id = existing[1];
      } else {
        const res = capture(cmd, [...pre, 'kv', 'namespace', 'create', 'BK_KV']);
        say(res.out.trim());
        const m = res.out.match(/id\s*=\s*"([0-9a-f]{32})"/i) || res.out.match(/"id":\s*"([0-9a-f]{32})"/i);
        if (!m) {
          fail('Could not read the new namespace id. Create it manually and paste the id into wrangler.toml.');
          return 1;
        }
        id = m[1];
        fs.writeFileSync('wrangler.toml',
          toml.replace(/^id\s*=\s*"YOUR_KV_NAMESPACE_ID".*$/m, `id = "${id}"`), 'utf8');
        ok(`Created KV namespace ${id} and wrote it to wrangler.toml.`);
      }

      step('Secrets');
      const { password, jwt } = await panelSecrets();
      for (const [key, value] of [['PANEL_PASSWORD', password], ['JWT_SECRET', jwt]]) {
        const status = feed(cmd, [...pre, 'secret', 'put', key], value + '\n');
        if (status === 0) ok(`secret ${key} set.`);
        else warn(`Could not set ${key} yet (normal before the first deploy) — rerun after deploying.`);
      }

      step('Deploy');
      if (run(cmd, [...pre, 'deploy']) !== 0) return 1;
      ok('Deployed. Visit /panel/setup on your workers.dev URL.');
      say('  ' + dim('Admin password: ') + password);
      return 0;
    }
  },

  'cloudflare-pages': {
    label: 'Cloudflare Pages',
    notes: 'VLESS/Trojan WebSocket support. Bindings are set on the Pages project, not wrangler.toml.',
    async deploy() {
      const resolved = await ensureCli({ bin: 'wrangler', npmPackage: 'wrangler@latest' });
      if (!resolved) return 1;
      const { cmd, pre } = cli(resolved);
      if (!(await ensureLoggedIn({
        resolved, name: 'Cloudflare', whoamiArgs: ['whoami'], loginArgs: ['login']
      }))) return 1;

      const project = flagValue('project') || process.env.CLOUDFLARE_PAGES_PROJECT || await ask('Pages project name [blueknight-panel]: ', 'blueknight-panel');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(project)) throw new Error('Invalid Pages project name');
      const branch = flagValue('branch') || await productionBranch(cmd, pre, project);
      if (!branch) { fail('Could not identify the production branch. Supply --branch explicitly.'); return 1; }
      step('Preserve existing Pages configuration');
      const stagingRoot = path.join(process.cwd(), '.validation');
      fs.mkdirSync(stagingRoot, { recursive: true });
      const staging = fs.mkdtempSync(path.join(stagingRoot, `pages-${project}-`));
      if (run(cmd, [...pre, 'pages', 'download', 'config', project, '--cwd', staging]) !== 0) {
        fail('Could not load the existing Pages configuration. No bindings were changed. Create the project and KV binding in Cloudflare first.');
        return 1;
      }
      for (const folder of ['public', 'functions', 'lib']) fs.cpSync(folder, path.join(staging, folder), { recursive: true });
      for (const file of ['worker.js', 'package.json']) fs.copyFileSync(file, path.join(staging, file));
      const configPath = path.join(staging, 'wrangler.toml');
      let config = fs.readFileSync(configPath, 'utf8');
      config = config.replace(/^pages_build_output_dir\s*=.*$/m, 'pages_build_output_dir = "public"');
      config = config.replace(/^compatibility_date\s*=.*$/m, `compatibility_date = "${PAGES_COMPAT_DATE}"`);
      fs.writeFileSync(configPath, config, 'utf8');
      step(`Publish ${project} on production branch ${branch}`);
      if (run(cmd, [...pre, 'pages', 'deploy', 'public', '--project-name', project,
        '--commit-dirty=true', '--branch', branch, '--cwd', staging]) !== 0) return 1;
      ok(`Uploaded using the existing bindings. Open https://${project}.pages.dev/panel`);
      warn('Check the live URL and deployment status before considering the update verified.');
      return 0;
    }
  },

  vercel: {
    label: 'Vercel',
    notes: 'Panel, DNS and WebSocket tunnels through an exported Node server. Requires Fluid compute; function duration limits apply.',
    async deploy() {
      const resolved = await ensureCli({ bin: 'vercel', npmPackage: 'vercel@latest' });
      if (!resolved) return 1;
      const { cmd, pre } = cli(resolved);
      if (!(await ensureLoggedIn({
        resolved, name: 'Vercel', whoamiArgs: ['whoami'], loginArgs: ['login']
      }))) return 1;

      warn('Vercel functions are stateless. Without a Redis REST store, panel edits are lost on cold start.');
      say(dim('  Free fix: Vercel dashboard → Storage → Upstash Redis (sets KV_REST_API_URL/TOKEN for you),'));
      say(dim('  or create a free database at upstash.com and paste its REST URL + token below.'));
      const url = process.env.KV_REST_API_URL || (await ask('Redis REST URL (blank = skip): '));
      const token = url ? (process.env.KV_REST_API_TOKEN || (await ask('Redis REST token: '))) : '';

      const { password, jwt } = await panelSecrets();
      const vars = { PANEL_PASSWORD: password, JWT_SECRET: jwt, VLESS_UUID: crypto.randomUUID(),
        SUB_TOKEN: randomSecret(8), TROJAN_PASSWORD: 'wd_' + randomSecret(8) };
      if (url && token) Object.assign(vars, { KV_REST_API_URL: url, KV_REST_API_TOKEN: token });
      else warn('No Redis configured — identities pinned to env vars so subscription links stay valid.');

      step('Environment variables');
      for (const [k, v] of Object.entries(vars)) {
        const status = feed(cmd, [...pre, 'env', 'add', k, 'production'], v + '\n');
        if (status === 0) ok(`${k} set.`);
        else warn(`${k} not set (may already exist) — check \`vercel env ls\`.`);
      }

      step('Deploy');
      if (run(cmd, [...pre, 'deploy', '--prod']) !== 0) return 1;
      say('  ' + dim('Admin password: ') + password);
      return 0;
    }
  },

  netlify: {
    label: 'Netlify',
    notes: 'Panel, DNS and subscriptions via Node functions. Use a tunnel host for proxy traffic.',
    async deploy() {
      const resolved = await ensureCli({ bin: 'netlify', npmPackage: 'netlify-cli@latest' });
      if (!resolved) return 1;
      const { cmd, pre } = cli(resolved);
      if (!(await ensureLoggedIn({
        resolved, name: 'Netlify', whoamiArgs: ['status'], loginArgs: ['login']
      }))) return 1;

      warn('Netlify Functions are stateless. Without a Redis REST store, panel edits are lost.');
      const url = process.env.UPSTASH_REDIS_REST_URL || (await ask('Redis REST URL (blank = skip): '));
      const token = url ? (process.env.UPSTASH_REDIS_REST_TOKEN || (await ask('Redis REST token: '))) : '';

      const { password, jwt } = await panelSecrets();
      const vars = { PANEL_PASSWORD: password, JWT_SECRET: jwt, VLESS_UUID: crypto.randomUUID(),
        SUB_TOKEN: randomSecret(8), TROJAN_PASSWORD: 'wd_' + randomSecret(8) };
      if (url && token) Object.assign(vars, { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token });

      step('Environment variables');
      for (const [k, v] of Object.entries(vars)) {
        if (run(cmd, [...pre, 'env:set', k, v]) === 0) ok(`${k} set.`);
        else warn(`${k} not set — run \`netlify env:set ${k} <value>\` manually.`);
      }

      step('Deploy');
      if (run(cmd, [...pre, 'deploy', '--prod']) !== 0) return 1;
      say('  ' + dim('Admin password: ') + password);
      return 0;
    }
  },

  fly: {
    label: 'Fly.io',
    notes: 'VLESS/Trojan WebSocket support, with a persistent volume for KV.',
    async deploy() {
      if (!has('fly') && !has('flyctl')) {
        fail('flyctl is required: https://fly.io/docs/flyctl/install/');
        return 1;
      }
      const cmd = has('fly') ? 'fly' : 'flyctl';
      if (!(await ensureLoggedIn({
        resolved: [cmd], name: 'Fly.io', whoamiArgs: ['auth', 'whoami'], loginArgs: ['auth', 'login']
      }))) return 1;

      step('App and volume');
      if (capture(cmd, ['status']).code !== 0) {
        if (run(cmd, ['launch', '--no-deploy', '--copy-config', '--yes']) !== 0) return 1;
      } else ok('App already exists.');
      if (!/blueknight_data/.test(capture(cmd, ['volumes', 'list']).out)) {
        if (run(cmd, ['volumes', 'create', 'blueknight_data', '--size', '1', '--yes']) !== 0) return 1;
      } else ok('Volume blueknight_data exists.');

      step('Secrets');
      const { password, jwt } = await panelSecrets();
      if (run(cmd, ['secrets', 'set', `PANEL_PASSWORD=${password}`, `JWT_SECRET=${jwt}`]) !== 0) return 1;

      step('Deploy');
      if (run(cmd, ['deploy']) !== 0) return 1;
      say('  ' + dim('Admin password: ') + password);
      return 0;
    }
  },

  railway: {
    label: 'Railway',
    notes: 'VLESS/Trojan WebSocket support. Add a volume at /app/data in the dashboard for persistence.',
    async deploy() {
      const resolved = await ensureCli({ bin: 'railway', npmPackage: '@railway/cli' });
      if (!resolved) return 1;
      const { cmd, pre } = cli(resolved);
      if (!(await ensureLoggedIn({
        resolved, name: 'Railway', whoamiArgs: ['whoami'], loginArgs: ['login']
      }))) return 1;

      if (capture(cmd, [...pre, 'status']).code !== 0) {
        warn('No project linked.');
        if (run(cmd, [...pre, 'link']) !== 0) return 1;
      }
      const { password, jwt } = await panelSecrets();
      if (run(cmd, [...pre, 'variable', 'set', `PANEL_PASSWORD=${password}`, `JWT_SECRET=${jwt}`]) !== 0) return 1;
      step('Deploy');
      if (run(cmd, [...pre, 'up', '--detach']) !== 0) return 1;
      warn('Add a volume mounted at /app/data in the Railway dashboard, or settings reset on redeploy.');
      say('  ' + dim('Admin password: ') + password);
      return 0;
    }
  },

  render: {
    label: 'Render',
    notes: 'VLESS/Trojan WebSocket support via render.yaml Blueprint (git push driven).',
    async deploy() {
      say('  Render deploys from a Blueprint in your git repository.');
      say('  1. Push this repository to GitHub.');
      say('  2. Render dashboard → New → Blueprint → select the repo.');
      say('  3. render.yaml provisions the service, the 1GB disk at /var/data and the health check.');
      say('  4. Set PANEL_PASSWORD when prompted.');
      if (has('git') && fs.existsSync('.git') && (await confirm('Commit and push now?'))) {
        run('git', ['add', '-A']);
        run('git', ['commit', '-m', 'Deploy BlueKnight Panel to Render']);
        return run('git', ['push']);
      }
      return 0;
    }
  },

  koyeb: {
    label: 'Koyeb',
    notes: 'VLESS/Trojan WebSocket support via Dockerfile. Ephemeral disk — use a Redis REST store for persistence.',
    async deploy() {
      const resolved = await ensureCli({ bin: 'koyeb', npmPackage: null,
        installHint: 'Install: https://www.koyeb.com/docs/build-and-deploy/cli/installation' });
      if (!resolved) return 1;
      const { cmd, pre } = cli(resolved);
      if (!(await ensureLoggedIn({
        resolved, name: 'Koyeb', whoamiArgs: ['organizations', 'list'], loginArgs: ['login']
      }))) return 1;
      const { password, jwt } = await panelSecrets();
      step('Deploy');
      const repository = process.env.GIT_REPOSITORY_URL || await ask('GitHub repository URL: ');
      if (!repository) { fail('Set GIT_REPOSITORY_URL to deploy this repository on Koyeb.'); return 1; }
      const code = run(cmd, [...pre, 'app', 'init', 'blueknight-panel',
        '--git', repository, '--git-branch', process.env.GIT_BRANCH || 'main', '--git-builder', 'docker', '--ports', '8080:http', '--routes', '/:8080',
        '--env', `PANEL_PASSWORD=${password}`, '--env', `JWT_SECRET=${jwt}`,
        '--env', 'PORT=8080']);
      if (code !== 0) {
        warn('If the app already exists use `koyeb service update`, or deploy from the dashboard with koyeb.yaml.');
        return code;
      }
      say('  ' + dim('Admin password: ') + password);
      return 0;
    }
  },

  docker: {
    label: 'Docker / self-hosted VPS',
    notes: 'VLESS/Trojan WebSocket support, persistent volume, no third-party account.',
    async deploy() {
      if (!has('docker')) {
        fail('docker is required: https://docs.docker.com/get-docker/');
        return 1;
      }
      const { password, jwt } = await panelSecrets();
      step('Build');
      if (run('docker', ['build', '-t', 'blueknight-panel', '.']) !== 0) return 1;
      step('Run');
      capture('docker', ['rm', '-f', 'blueknight']); // ignore: container may not exist
      const dataDir = path.join(process.cwd(), 'data');
      fs.mkdirSync(dataDir, { recursive: true });
      const code = run('docker', ['run', '-d', '--name', 'blueknight', '--restart', 'unless-stopped',
        '-p', '8080:8080', '-v', `${dataDir}:/app/data`,
        '-e', `PANEL_PASSWORD=${password}`, '-e', `JWT_SECRET=${jwt}`, 'blueknight-panel']);
      if (code !== 0) return code;
      ok('Running at http://localhost:8080/panel/login');
      say('  ' + dim('Admin password: ') + password);
      return 0;
    }
  },

  native: {
    label: 'Native VPN / sing-box stack',
    notes: 'Linux Docker: OpenVPN, ShadowTLS, Shadowsocks, Hysteria2, TUIC and AnyTLS. TLS protocols need a matching certificate.',
    async deploy() {
      const out = path.resolve(flagValue('out') || 'native/generated');
      const compose = path.join(out, 'compose.json');
      if (!fs.existsSync(compose)) {
        const host = flagValue('host') || await ask('Public VPN hostname or IPv4: ');
        if (!host) { fail('Supply --host=vpn.example.com for the native stack.'); return 1; }
        const protocols = (flagValue('protocols') || await ask('Protocols: ', 'shadowtls,shadowsocks,openvpn')).split(',');
        const needsTLS = protocols.some(p => ['hysteria2', 'tuic', 'anytls'].includes(p));
        const cert = flagValue('cert') || (needsTLS ? await ask('TLS certificate PEM file: ') : undefined);
        const key = flagValue('key') || (needsTLS ? await ask('TLS private key PEM file: ') : undefined);
        generateNative({ host, protocols, cert, key, out, handshake: flagValue('handshake') || 'www.microsoft.com' });
        ok(`Native stack prepared in ${out}; credentials are stored in panel.env.`);
      } else {
        if (['host', 'protocols', 'cert', 'key', 'handshake'].some(name => flagValue(name))) {
          fail('A stack already exists at --out. Reuse it without configuration flags, or select a new --out directory. Credentials were not replaced.');
          return 1;
        }
        ok('Reusing the existing native stack and credentials.');
      }
      if (process.argv.includes('--prepare-only')) { ok('Preparation complete. No services were deployed.'); return 0; }
      if (!has('docker')) { fail('Docker is required to start the prepared stack. Install Docker with a Linux engine, or use --prepare-only.'); return 1; }
      const info = capture('docker', ['info', '--format', '{{.OSType}}']);
      if (info.code !== 0 || info.out.trim() !== 'linux') { fail('A running Linux Docker engine with /dev/net/tun is required.'); return 1; }
      const base = ['compose', '-f', compose];
      if (run('docker', [...base, 'config', '--quiet']) !== 0) return 1;
      if (JSON.parse(fs.readFileSync(compose, 'utf8')).services['sing-box']) {
        if (run('docker', [...base, 'run', '--rm', 'sing-box', 'check', '-c', '/etc/sing-box/sing-box.json']) !== 0) return 1;
      }
      if (run('docker', [...base, 'up', '-d', '--build', '--wait', '--wait-timeout', '180']) !== 0) return 1;
      ok('Native containers started. The panel is at http://localhost:8080; configure HTTPS for remote access.');
      warn('Verify an OpenVPN client handshake and external traffic before treating the VPN as ready.');
      return 0;
    }
  },

  local: {
    label: 'Run locally',
    notes: 'VLESS/Trojan WebSocket support. Uses ./data for KV persistence.',
    async deploy() {
      const { password } = await panelSecrets();
      ok('Starting on http://localhost:8080/panel/login');
      say('  ' + dim('Admin password: ') + password);
      const child = spawn(process.execPath, ['server.js'], {
        stdio: 'inherit',
        env: { ...process.env, PANEL_PASSWORD: password }
      });
      return new Promise((r) => child.on('exit', (code) => r(code ?? 0)));
    }
  }
};

// ---------------------------------------------------------------------------

// What each target can actually run, rendered by the picker. Keys match `providers`.
const SUPPORT = {
  cloudflare:         { tunnel: true,  storage: 'KV namespace' },
  'cloudflare-pages': { tunnel: true,  storage: 'KV binding' },
  vercel:             { tunnel: true , storage: 'Redis REST' },
  netlify:            { tunnel: false, storage: 'Redis REST' },
  fly:                { tunnel: true,  storage: 'volume' },
  railway:            { tunnel: true,  storage: 'volume' },
  render:             { tunnel: true,  storage: 'disk' },
  koyeb:              { tunnel: true,  storage: 'Redis REST' },
  docker:             { tunnel: true,  storage: 'bind mount' },
  local:              { tunnel: true,  storage: './data' },
  native:             { tunnel: true, storage: 'Docker volumes' }
};
const providerOrder = [...Object.keys(providers).filter(key => key !== 'native'), 'native'];

function listProviders() {
  const keys = providerOrder;
  const sup = (k) => SUPPORT[k] || { tunnel: false, storage: '—' };
  // Widths come from the data so a longer name can never collide with the next
  // column. `+ 2` is the minimum gutter between columns.
  const widest = (fn) => Math.max(...keys.map((k) => String(fn(k)).length));
  const W = {
    n: Math.max(1, String(keys.length).length),
    key: Math.max(widest((k) => k), 'TARGET'.length) + 2,
    label: Math.max(widest((k) => providers[k].label), 'PLATFORM'.length) + 2,
    tun: 'TUNNEL'.length + 2
  };
  const storageW = Math.max(widest((k) => sup(k).storage), 'STORAGE'.length);
  const rule = W.n + 2 + W.key + W.label + W.tun + storageW;

  say('');
  say('  ' + bold('BlueKnight Panel') + dim(' — choose a deployment target'));
  say('');
  say('  ' + dim(padL('#', W.n) + '  ' + pad('TARGET', W.key) + pad('PLATFORM', W.label) +
      pad('TUNNEL', W.tun) + 'STORAGE'));
  say('  ' + dim('─'.repeat(rule)));
  keys.forEach((key, i) => {
    const s = sup(key);
    const word = s.tunnel ? 'yes' : 'no';
    say('  ' + cyan(padL(String(i + 1), W.n)) + '  ' + bold(pad(key, W.key)) +
        pad(providers[key].label, W.label) +
        (s.tunnel ? green(word) : red(word)) + ' '.repeat(W.tun - word.length) +
        dim(s.storage));
  });
  say('');
  say('  ' + dim('TUNNEL = can carry VLESS/Trojan proxy traffic. Every target serves the panel.'));
  say('  ' + dim('Direct:  node deploy.mjs <number|name>   |   npm run deploy'));
  say('  ' + dim('Validate only: --check | Native: native --host=vpn.example.com --prepare-only'));
  say('  ' + dim('Native TLS: --protocols=shadowtls,shadowsocks,hysteria2,tuic,anytls,openvpn --cert=cert.pem --key=key.pem'));
}

/** Resolve a menu answer: a number, a name, a unique prefix, or a quit request. */
function resolveChoice(answer) {
  const keys = providerOrder;
  const a = String(answer || '').trim().toLowerCase();
  if (!a) return { kind: 'empty' };
  if (a === 'q' || a === 'quit' || a === 'exit' || a === '0') return { kind: 'quit' };
  if (/^\d+$/.test(a)) {
    const n = Number(a);
    return n >= 1 && n <= keys.length
      ? { kind: 'ok', key: keys[n - 1] }
      : { kind: 'range', max: keys.length };
  }
  if (providers[a]) return { kind: 'ok', key: a };
  const near = keys.filter((k) => k.startsWith(a));
  if (near.length === 1) return { kind: 'ok', key: near[0] };
  if (near.length > 1) return { kind: 'ambiguous', near };
  return { kind: 'unknown', value: a };
}

/** Prompt until a valid target is chosen, the user quits, or patience runs out. */
async function pickTarget() {
  listProviders();
  const max = Object.keys(providers).length;
  for (let attempt = 0; attempt < 5; attempt++) {
    const answer = await ask('\n  Target ' + dim(`[1-${max}, name, or q to quit]`) + ': ');
    const choice = resolveChoice(answer);
    if (choice.kind === 'ok') return choice.key;
    if (choice.kind === 'quit') return null;
    if (!INTERACTIVE) {
      fail('No target given and stdin is not interactive. Pass one: node deploy.mjs <target>');
      return null;
    }
    if (choice.kind === 'empty') warn('Pick a number or a name.');
    else if (choice.kind === 'range') fail(`Enter a number between 1 and ${choice.max}.`);
    else if (choice.kind === 'ambiguous') fail(`Ambiguous — did you mean ${choice.near.join(' or ')}?`);
    else fail(`No target called ${JSON.stringify(choice.value)}.`);
  }
  fail('Too many invalid answers.');
  return null;
}

async function main() {
  if (process.argv.includes('--list') || process.argv.includes('--help')) {
    listProviders();
    return 0;
  }

  step('Preflight');
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) { fail(`Node ${process.versions.node} is too old; need >= 22 (24 LTS recommended).`); return 1; }
  ok(`Node ${process.versions.node}`);
  for (const f of ['worker.js', 'server.js', 'lib/ws-node.mjs', 'lib/kv-store.mjs', 'lib/upgrade-node.mjs', 'lib/dns-wire.mjs', 'lib/dns-fetch-node.mjs', 'lib/ss-websocket.mjs', 'lib/subscription-native.mjs', 'deploy-native.mjs', 'native/openvpn/Dockerfile', 'native/openvpn/entrypoint.sh', 'public/assets/theme-bg-1.jpg']) {
    if (!fs.existsSync(f)) { fail(`Missing ${f} — run from the project root.`); return 1; }
  }
  ok('Project files present.');

  for (const file of ['test.mjs', 'test-edge.mjs', 'test-proxy.mjs', 'test-connections.mjs', 'test-adapters.mjs', 'test-dns.mjs']) {
    const test = spawnSync(process.execPath, [file], { encoding: 'utf8', timeout: 30000, windowsHide: true });
    if ((test.status ?? 1) !== 0) {
      fail(`Self-check ${file} failed; deployment stopped:`);
      say((test.stdout || '') + (test.stderr || '') + (test.error?.message || ''));
      return 1;
    }
  }
  ok('All six local check suites passed.');
  if (process.argv.includes('--check')) { ok('Validation complete. Nothing was deployed.'); return 0; }

  let key;
  if (args[0]) {
    const choice = resolveChoice(args[0]);
    if (choice.kind !== 'ok') {
      fail(`Unknown target ${JSON.stringify(args[0])}.`);
      listProviders();
      return 1;
    }
    key = choice.key;
  } else {
    key = await pickTarget();
    if (!key) { say('\n  ' + dim('Cancelled — nothing was deployed.')); return 0; }
  }
  const provider = providers[key];

  say('\n' + bold(`Deploying to ${provider.label}`));
  say(dim('  ' + provider.notes));
  const code = await provider.deploy();
  say(code === 0 ? '\n' + green(bold('Done.')) : '\n' + red(bold('Deployment failed.')));
  return code;
}

// Ctrl+C during a prompt must leave a usable terminal, not a half-open readline.
process.on('SIGINT', () => {
  try { rl?.close(); } catch {}
  say('\n  ' + dim('Cancelled.'));
  process.exit(130);
});

main()
  .then((code) => { rl?.close(); process.exit(code); })
  .catch((err) => { rl?.close(); fail(err.message); process.exit(1); });
