import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {GeminiVoice} from '../src/gemini-live.ts';

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function environment(t){
 const microphone=deferred(),module=deferred(),sockets=[],captures=[],players=[],calls=[],tracks=[{enabled:true,stop(){calls.push('stop')}}];
 class Context {
  sampleRate=16000;currentTime=0;destination={};
  audioWorklet={addModule:()=>{calls.push('module');return module.promise}};
  resume(){return Promise.resolve()}
  close(){calls.push('close-context');return Promise.resolve()}
  createMediaStreamSource(){return {connect(){},disconnect(){calls.push('disconnect-source')}}}
  createBuffer(_channels,length,rate){return {duration:length/rate,getChannelData:()=>new Float32Array(length)}}
  createBufferSource(){const player={connect(){},disconnect(){},start(){},stop(){},onended:null};players.push(player);return player}
 }
 class Socket {
  static OPEN=1;readyState=1;bufferedAmount=0;sent=[];
  constructor(){sockets.push(this)}
  send(value){this.sent.push(JSON.parse(value))}
  close(){this.readyState=3;calls.push('close-socket')}
  message(value){this.onmessage?.({data:JSON.stringify(value)})}
 }
 class Capture {port={onmessage:null};constructor(){captures.push(this)}connect(){}disconnect(){calls.push('disconnect-capture')}}
 for(const [key,value] of Object.entries({AudioContext:Context,AudioWorkletNode:Capture,WebSocket:Socket,location:{protocol:'http:',host:'localhost'},navigator:{mediaDevices:{getUserMedia:()=>{calls.push('microphone');return microphone.promise}}}})){
  const previous=Object.getOwnPropertyDescriptor(globalThis,key);
  Object.defineProperty(globalThis,key,{configurable:true,value});
  t.after(()=>previous?Object.defineProperty(globalThis,key,previous):delete globalThis[key]);
 }
 let ready=0;const errors=[],turns=[],speechTexts=[];
 const voice=new GeminiVoice({ready:()=>ready++,transcript(){},talking(){},speech:text=>speechTexts.push(text),turnEnded:interrupted=>turns.push(interrupted),closed(){},error:message=>errors.push(message)});
 t.after(()=>voice.close());
 return {voice,microphone,module,sockets,captures,players,calls,tracks,errors,turns,speechTexts,ready:()=>ready,media:{getTracks:()=>tracks,getAudioTracks:()=>tracks}};
}
test('microphone and worklet prepare while authorization is still pending',async t=>{
 const env=environment(t),ticket=deferred(),starting=env.voice.start(ticket.promise);
 await flush();
 assert.ok(env.calls.includes('microphone'));
 assert.ok(env.calls.includes('module'),'worklet must not wait for microphone permission');
 assert.equal(env.sockets.length,0,'must not connect before authorization');
 ticket.resolve('ticket');await flush();
 assert.equal(env.sockets.length,1,'Gemini handshake must overlap microphone permission');
 env.sockets[0].message({type:'ready'});
 assert.equal(env.ready(),0,'do not show listening before capture is installed');
 env.module.resolve();env.microphone.resolve(env.media);await starting;
 assert.equal(env.ready(),1);
});
test('closing during permission prompt stops late microphone and opens no socket',async t=>{
 const env=environment(t),ticket=deferred(),starting=env.voice.start(ticket.promise);
 await flush();env.voice.close();env.microphone.resolve(env.media);env.module.resolve();ticket.resolve('ticket');await starting;
 assert.ok(env.calls.includes('stop'));assert.equal(env.sockets.length,0);assert.equal(env.ready(),0);
});
test('denied microphone closes an already connecting socket',async t=>{
 const env=environment(t),starting=env.voice.start('ticket');
 await flush();env.module.resolve();env.microphone.reject(Error('permission denied'));
 await assert.rejects(starting,/permission denied/);
 assert.ok(env.calls.includes('close-socket'));assert.ok(env.calls.includes('close-context'));
});
test('authorization failure releases a late microphone',async t=>{
 const env=environment(t),ticket=deferred(),starting=env.voice.start(ticket.promise);
 await flush();ticket.reject(Error('unauthorized'));await assert.rejects(starting,/unauthorized/);
 env.microphone.resolve(env.media);env.module.resolve();await flush();
 assert.ok(env.calls.includes('stop'));assert.equal(env.sockets.length,0);
});
test('audio starts only when ready and mute still prevents transmission',async t=>{
 const env=environment(t),starting=env.voice.start('ticket');
 env.microphone.resolve(env.media);env.module.resolve();await starting;
 const capture=env.captures[0],socket=env.sockets[0],packet={data:new Float32Array([0,1])};
 capture.port.onmessage(packet);assert.equal(socket.sent.length,0);
 socket.message({type:'ready'});socket.message({type:'ready'});assert.equal(env.ready(),1);
 capture.port.onmessage(packet);assert.equal(socket.sent[0].type,'audio');
 assert.equal(socket.sent[0].data,Buffer.from([0,0,255,127]).toString('base64'));
 env.voice.setMuted(true);assert.equal(env.tracks[0].enabled,false);
 const count=socket.sent.length;capture.port.onmessage(packet);assert.equal(socket.sent.length,count);
 env.voice.setMuted(false);capture.port.onmessage(packet);assert.equal(socket.sent.length,count+1);
});
test('a pending microphone permission does not time out an already ready Gemini connection',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const env=environment(t),starting=env.voice.start('ticket');await flush();
 env.sockets[0].message({type:'ready'});t.mock.timers.tick(25001);
 assert.deepEqual(env.errors,[]);assert.equal(env.ready(),0);
 env.microphone.resolve(env.media);env.module.resolve();await starting;
 assert.equal(env.ready(),1);
});
test('voice reports reply boundaries and interruptions to the speech bubble',async t=>{
 const env=environment(t),starting=env.voice.start('ticket');
 env.microphone.resolve(env.media);env.module.resolve();await starting;
 env.sockets[0].message({type:'turnComplete'});
 env.sockets[0].message({type:'interrupted'});
 assert.deepEqual(env.turns,[false,true]);
});
test('voice changes bubble text at playback boundaries rather than generation boundaries',async t=>{
 const env=environment(t),starting=env.voice.start('ticket');
 env.microphone.resolve(env.media);env.module.resolve();await starting;
 const socket=env.sockets[0],audio={type:'audio',sampleRate:24000,data:Buffer.alloc(8).toString('base64')};
 socket.message({type:'transcript',who:'Catty',text:'First reply'});socket.message(audio);
 socket.message({type:'turnComplete'});
 socket.message({type:'transcript',who:'Catty',text:'Second reply'});socket.message(audio);
 assert.equal(env.speechTexts.at(-1),'First reply');
 env.players[0].onended();assert.equal(env.speechTexts.at(-1),'Second reply');
 socket.message({type:'interrupted'});assert.equal(env.speechTexts.at(-1),'');
 assert.deepEqual(env.errors,[]);
});
test('capture emits the first PCM packet within 32ms and preserves sample order',()=>{
 let Processor;const packets=[];
 vm.runInNewContext(readFileSync(new URL('../public/pcm-capture.js',import.meta.url),'utf8'),{AudioWorkletProcessor:class {port={postMessage:data=>packets.push(Array.from(data))}},registerProcessor:(_name,value)=>Processor=value});
 const capture=new Processor();
 for(let frame=0;frame<4;frame++)capture.process([[Float32Array.from({length:128},(_,i)=>frame*128+i)]]);
 assert.equal(packets.length,1,'512 samples at 16kHz must emit without waiting for 2048 samples');
 assert.deepEqual(packets[0],Array.from({length:512},(_,i)=>i));
});
