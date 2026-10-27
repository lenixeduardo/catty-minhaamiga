import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const config = Object.fromEntries(readFileSync(new URL('../.env.example', import.meta.url),'utf8').split(/\r?\n/).filter(line=>line && !line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)]}));
test('Supabase URL is exclusive to Catty',()=>assert.equal(config.VITE_SUPABASE_URL,'https://izqjuxyyjeoncdyvjuem.supabase.co'));
test('Frontend uses publishable key, never service role',()=>{assert.match(config.VITE_SUPABASE_PUBLISHABLE_KEY,/^sb_publishable_/);assert.ok(!config.VITE_SUPABASE_PUBLISHABLE_KEY.includes('service_role'))});
test('Backend and frontend use same Supabase project',()=>{assert.equal(config.SUPABASE_URL,config.VITE_SUPABASE_URL);assert.equal(config.SUPABASE_PUBLISHABLE_KEY,config.VITE_SUPABASE_PUBLISHABLE_KEY)});
test('Live auth health endpoint (opt-in)',{skip:process.env.RUN_LIVE_SUPABASE!=='1'?'Set RUN_LIVE_SUPABASE=1 in networked environment':false},async()=>{const r=await fetch(config.SUPABASE_URL+'/auth/v1/health',{headers:{apikey:config.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});assert.equal(r.status,200)});
test('Live REST denies anonymous profile reads (opt-in)',{skip:process.env.RUN_LIVE_SUPABASE!=='1'?'Set RUN_LIVE_SUPABASE=1 in networked environment':false},async()=>{const r=await fetch(config.SUPABASE_URL+'/rest/v1/profiles?select=user_id',{headers:{apikey:config.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});assert.ok([200,401,403].includes(r.status));if(r.status===200)assert.deepEqual(await r.json(),[])});
