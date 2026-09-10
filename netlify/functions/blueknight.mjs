import { dnsFetch } from '../../lib/dns-fetch-node.mjs';
import { Console } from 'node:console';
import { createKVStore } from '../../lib/kv-store.mjs';

const nodeProcess = process;
const stdout = process.stdout, stderr = process.stderr;
const { kv, warning } = createKVStore(name => process.env[name]);
const env = { DNS_FETCH: dnsFetch, ...process.env, WD_KV: kv, BK_KV: kv, DISABLE_PROXY: 'true' };
const { default: worker } = await import('../../worker.js');
globalThis.process = nodeProcess;
globalThis.console = new Console({ stdout, stderr });
if (warning) console.warn('[BlueKnight] ' + warning);

export default function handler(request, context) {
  return worker.fetch(request, env, context);
}
