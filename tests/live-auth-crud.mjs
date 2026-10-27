/** Live end-to-end Supabase Auth + REST smoke test.
 * Requires CATTTY_TEST_EMAIL and CATTY_TEST_PASSWORD for an existing, verified,
 * dedicated test account. Creates and deletes only its own test session.
 */
import assert from 'node:assert/strict';
const url = process.env.SUPABASE_URL || 'https://izqjuxyyjeoncdyvjuem.supabase.co';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5Fo8RmSV9ROVXle-5ZLPKQ_mXVcBsvB';
const email = process.env.CATTY_TEST_EMAIL;
const password = process.env.CATTY_TEST_PASSWORD;
if (!email || !password) { console.error('SKIP: configure CATTY_TEST_EMAIL and CATTY_TEST_PASSWORD for a dedicated verified test account.'); process.exit(2); }
const headers = { apikey: key, 'Content-Type':'application/json' };
const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {method:'POST', headers, body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
const identity = await auth.json();
assert.equal(auth.status,200,`Authentication failed: ${JSON.stringify(identity)}`);
assert.ok(identity.access_token && identity.user?.id);
const secure = {...headers,Authorization:`Bearer ${identity.access_token}`};
let id;
try {
  const create = await fetch(`${url}/rest/v1/practice_sessions?select=id,user_id,ended_at`,{method:'POST',headers:{...secure,Prefer:'return=representation'},body:JSON.stringify({user_id:identity.user.id}),signal:AbortSignal.timeout(15000)});
  const inserted = await create.json();
  assert.equal(create.status,201,JSON.stringify(inserted));
  assert.equal(inserted.length,1);
  id=inserted[0].id;
  assert.equal(inserted[0].user_id,identity.user.id);
  console.log('PASS: authenticated INSERT');
  const read = await fetch(`${url}/rest/v1/practice_sessions?id=eq.${id}&select=id,user_id`,{headers:secure,signal:AbortSignal.timeout(15000)});
  assert.equal(read.status,200);
  assert.equal((await read.json())[0].id,id);
  console.log('PASS: authenticated SELECT');
  const update = await fetch(`${url}/rest/v1/practice_sessions?id=eq.${id}&select=id,ended_at`,{method:'PATCH',headers:{...secure,Prefer:'return=representation'},body:JSON.stringify({ended_at:new Date().toISOString()}),signal:AbortSignal.timeout(15000)});
  assert.equal(update.status,200);
  assert.ok((await update.json())[0].ended_at);
  console.log('PASS: authenticated UPDATE');
  const anonymous = await fetch(`${url}/rest/v1/practice_sessions?id=eq.${id}&select=id`,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
  assert.ok([200,401,403].includes(anonymous.status));
  if(anonymous.status===200) assert.deepEqual(await anonymous.json(),[]);
  console.log('PASS: anonymous cannot read session');
} finally {
  if(id){const clean=await fetch(`${url}/rest/v1/practice_sessions?id=eq.${id}`,{method:'DELETE',headers:secure,signal:AbortSignal.timeout(15000)});assert.equal(clean.status,204);console.log('PASS: cleanup DELETE');}
}
