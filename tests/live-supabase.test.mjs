import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const config = Object.fromEntries(readFileSync(new URL('../.env.example', import.meta.url),'utf8')
  .split(/\r?\n/).filter(line=>line && !line.startsWith('#') && line.includes('='))
  .map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)]}));
const liveUrl=process.env.SUPABASE_URL || config.SUPABASE_URL;
const liveKey=process.env.SUPABASE_PUBLISHABLE_KEY || config.SUPABASE_PUBLISHABLE_KEY;
const enabled=process.env.RUN_LIVE_SUPABASE==='1';
test('Supabase example values contain no real project secrets',()=>{
  assert.equal(config.SUPABASE_URL,'');
  assert.equal(config.VITE_SUPABASE_URL,'');
  assert.equal(config.SUPABASE_PUBLISHABLE_KEY,'');
  assert.equal(config.VITE_SUPABASE_PUBLISHABLE_KEY,'');
});
test('Frontend accepts publishable keys only when provided',()=>{
  const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY || config.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(key) assert.match(key,/^sb_publishable_/);
  assert.ok(!key.includes('service_role'));
});
test('Documented frontend and backend use matching Supabase variables',()=>{
  for(const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY']) assert.ok(Object.hasOwn(config,key));
  for(const key of ['VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY']) assert.ok(Object.hasOwn(config,key));
});
test('Live auth health endpoint (opt-in)',{skip:!enabled?'Requires RUN_LIVE_SUPABASE=1 and credentials':false},async()=>{
  assert.match(liveUrl,/^https:\/\/[^/]+\.supabase\.co$/);
  assert.match(liveKey,/^sb_publishable_/);
  const res=await fetch(liveUrl+'/auth/v1/health',{headers:{apikey:liveKey},signal:AbortSignal.timeout(10000)});
  assert.equal(res.status,200);
});
test('Live REST denies anonymous profile reads (opt-in)',{skip:!enabled?'Requires RUN_LIVE_SUPABASE=1 and credentials':false},async()=>{
  assert.match(liveUrl,/^https:\/\/[^/]+\.supabase\.co$/);
  assert.match(liveKey,/^sb_publishable_/);
  const res=await fetch(liveUrl+'/rest/v1/profiles?select=user_id',{headers:{apikey:liveKey},signal:AbortSignal.timeout(10000)});
  assert.ok([200,401,403].includes(res.status));
  if(res.status===200)assert.deepEqual(await res.json(),[]);
});
