// Regression: enforce Workers' PBKDF2 ceiling while exercising setup and login.
// Run with: node test-password.mjs
import assert from 'node:assert/strict';
import { Console } from 'node:console';
import { createMemoryKV } from './lib/kv-store.mjs';

const nodeProcess = globalThis.process;
const nodeConsole = new Console({ stdout: process.stdout, stderr: process.stderr });
const { default: worker } = await import('./worker.js');
globalThis.process = nodeProcess;
globalThis.console = nodeConsole;

const subtle = crypto.subtle;
const originalDeriveBits = subtle.deriveBits;
let derivations = 0;
subtle.deriveBits = function (algorithm, ...args) {
  if (algorithm.name === 'PBKDF2') {
    derivations++;
    if (algorithm.iterations > 100000) {
      throw new Error('Pbkdf2 failed: iteration counts above 100000 are not supported');
    }
  }
  return originalDeriveBits.call(this, algorithm, ...args);
};

try {
  const kv = createMemoryKV(() => undefined);
  const env = { BK_KV: kv };
  const password = 'Setup-regression-123!';
  const post = (path, fields) => worker.fetch(new Request(`https://t.local${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
  }), env, { waitUntil: () => {} });

  const setup = await post('/panel/setup', { password, confirmPassword: password });
  assert.equal(setup.status, 302, 'setup must save successfully under the Workers limit');
  assert.equal(setup.headers.get('location'), '/panel?setup=success');
  const record = await kv.get('config:admin_password');
  assert.match(record, /^pbkdf2\$100000\$/);
  assert.ok(!record.includes(password), 'KV must not contain the cleartext password');

  const login = await post('/panel/login', { password });
  assert.equal(login.status, 302, 'saved password must authenticate');
  assert.ok(login.headers.get('set-cookie'));
  const wrong = await post('/panel/login', { password: 'Wrong-password-123!' });
  assert.equal(wrong.headers.get('set-cookie'), null, 'incorrect password must not create a session');
  assert.ok(derivations >= 3, 'setup and both logins must exercise PBKDF2');
  console.log('Password setup and login under Workers PBKDF2 limit: PASS');
} finally {
  subtle.deriveBits = originalDeriveBits;
}
