import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
const api=readFileSync(new URL('../server/index.ts',import.meta.url),'utf8');
test('token exige JWT validado pelo Supabase',()=>{assert.match(api,/authClient\.auth\.getUser\(token\)/);assert.match(api,/status\(401\)/)});
test('token possui limite de emissão por usuário',()=>{assert.match(api,/times\.length>=3/);assert.match(api,/status\(429\)/)});
test('sessão é criada com usuário autenticado',()=>{assert.match(ui,/from\('practice_sessions'\)\.insert\(\{user_id:auth\.session!\.user\.id\}\)/)});
test('sessão é encerrada com data de término',()=>{assert.match(ui,/ended_at:new Date\(\)\.toISOString\(\)/)});
test('chave permanente nunca vai para frontend',()=>{assert.doesNotMatch(ui,/OPENAI_API_KEY|service_role/)});
