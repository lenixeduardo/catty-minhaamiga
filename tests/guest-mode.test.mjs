import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { request } from 'node:http';

// Use raw HTTP for Host checks: Node fetch replaces a supplied Host header.
function requestStatus(url, headers, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request(url, { headers, method }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
    req.end();
  });
}

async function startApi(t, env = {}) {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NODE_ENV: 'development', PORT: String(port),
      OPENAI_API_KEY: '', GEMINI_API_KEY: '', SUPABASE_URL: '', SUPABASE_PUBLISHABLE_KEY: '',
      VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('API startup timed out')), 10000);
    child.stdout.on('data', chunk => { if (chunk.toString().includes('API pronta')) { clearTimeout(timer); resolve(); } });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(Error(`API exited: ${code}`)); });
  });
  return `http://127.0.0.1:${port}`;
}

test('local guest can start voice without Supabase and retains rate limiting', async t => {
  const base = await startApi(t);
  const access = await fetch(base + '/api/auth-check');
  assert.equal(access.status, 200);
  assert.equal((await access.json()).guest_mode, true);
  for (let i = 0; i < 3; i++) {
    const response = await fetch(base + '/api/realtime-token', { method: 'POST' });
    assert.equal(response.status, 503, 'guest must reach the missing voice credential check');
  }
  assert.equal((await fetch(base + '/api/realtime-token', { method: 'POST' })).status, 429);
});

test('guest access is refused for a nonlocal Host or Origin', async t => {
  const base = await startApi(t);
  for (const headers of [{ Host: '192.168.0.10:5173' }, { Origin: 'https://example.com' }]) {
    assert.equal(await requestStatus(base + '/api/auth-check', headers), 401);
    assert.equal(await requestStatus(base + '/api/realtime-token', headers, 'POST'), 401);
  }
});

for (const env of [{ NODE_ENV: 'production', DEV_GUEST_MODE: 'true' }, { DEV_GUEST_MODE: 'false' }]) {
  test(`login remains required with ${JSON.stringify(env)}`, async t => {
    const base = await startApi(t, env);
    assert.equal((await fetch(base + '/api/auth-check')).status, 401);
    assert.equal((await fetch(base + '/api/realtime-token', { method: 'POST' })).status, 401);
  });
}

test('Gemini is required even when a legacy OpenAI key exists', async t => {
 const base=await startApi(t,{OPENAI_API_KEY:'legacy-test-key',GEMINI_API_KEY:''});
 const r=await fetch(base+'/api/realtime-token',{method:'POST'});
 assert.equal(r.status,503);
 assert.match((await r.json()).error,/GEMINI_API_KEY/);
});
test('configured Gemini issues a local ticket without exposing the provider key', async t => {
 const base=await startApi(t,{GEMINI_API_KEY:'gemini-test-key-not-real'});
 const r=await fetch(base+'/api/realtime-token',{method:'POST'});
 assert.equal(r.status,200);
 const data=await r.json();
 assert.equal(data.provider,'gemini');
 assert.equal(typeof data.value,'string');
 assert.notEqual(data.value,'gemini-test-key-not-real');
 assert.ok(data.value.length>=32);
 assert.ok(!JSON.stringify(data).includes('gemini-test-key-not-real'));
});
