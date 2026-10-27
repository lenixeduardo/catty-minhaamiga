import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {encodePcm} from '../src/gemini-live.ts';
import {createTickets,voiceError,attachGeminiRelay} from '../server/gemini-relay.ts';
test('PCM encodes clipped signed 16-bit little endian samples',()=>{
 const raw=Buffer.from(encodePcm(new Float32Array([-2,-1,0,1,2])),'base64');
 assert.deepEqual([...raw],[0,128,0,128,0,0,255,127,255,127]);
});
test('voice tickets can only be consumed once and preserve level',()=>{
 const tickets=createTickets(),value=tickets.issue('B1');
 assert.equal(tickets.consume(value)?.level,'B1');assert.equal(tickets.consume(value),null);assert.equal(tickets.consume('invented'),null);
});
test('expired tickets cannot start a voice session',t=>{
 t.mock.timers.enable({apis:['Date']});const tickets=createTickets(),value=tickets.issue('A1');t.mock.timers.tick(60001);assert.equal(tickets.consume(value),null);
});
test('quota and key errors are actionable and do not echo provider secrets',()=>{
 assert.match(voiceError(Error('429 RESOURCE_EXHAUSTED fake-secret')),/Cota do Gemini/);
 assert.match(voiceError(Error('403 API_KEY_INVALID fake-secret')),/GEMINI_API_KEY/);
 assert.doesNotMatch(voiceError(Error('unknown fake-secret')),/fake-secret/);
});
test('WebSocket relay refuses cross-origin or unauthenticated connections without calling Google',async t=>{
 const server=createServer();attachGeminiRelay(server,createTickets(),'test');server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const host=`127.0.0.1:${server.address().port}`;
 for(const [origin,want] of [[`http://${host}`,401],['https://untrusted.example',403]]){
  const status=await new Promise((resolve,reject)=>{const ws=new WebSocket(`ws://${host}/api/live?ticket=invalid`,{origin});ws.on('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode);ws.terminate()});ws.on('error',()=>{});ws.on('open',()=>{ws.close();reject(Error('unauthorized connection opened'))});setTimeout(()=>{ws.terminate();reject(Error('timeout'))},3000).unref()});assert.equal(status,want);
 }
});
