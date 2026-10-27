import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CattySpeechQueue} from '../src/catty-speech.ts';
import {CattySpeechBubble} from '../src/CattySpeechBubble.tsx';

test('streams and appends the currently playing reply',()=>{
 const speech=new CattySpeechQueue();speech.transcript('Hello');const audio=speech.enqueue();
 speech.transcript(', Edu!');assert.equal(speech.text,'Hello, Edu!');
 speech.finish(audio);assert.equal(speech.text,'');
});
test('queued replies keep their own text until the previous audio drains',()=>{
 const speech=new CattySpeechQueue();speech.transcript('First still playing');
 const first=speech.enqueue(),firstTail=speech.enqueue();speech.endTurn();
 speech.transcript('Second queued');const second=speech.enqueue();speech.endTurn();
 assert.equal(speech.text,'First still playing');
 speech.finish(first);assert.equal(speech.text,'First still playing');
 speech.finish(firstTail);assert.equal(speech.text,'Second queued');
 speech.finish(second);assert.equal(speech.text,'');
});
test('audio before transcription and interrupted replies never reuse stale text',()=>{
 const speech=new CattySpeechQueue();speech.transcript('Old reply');speech.enqueue();speech.reset();
 const audio=speech.enqueue();assert.equal(speech.text,'');
 speech.transcript('New reply');assert.equal(speech.text,'New reply');speech.finish(audio);
 speech.endTurn();speech.enqueue();assert.equal(speech.text,'');
});
test('playback gaps within one generated reply preserve its transcription',()=>{
 const speech=new CattySpeechQueue();speech.transcript('Keep this sentence.');
 const first=speech.enqueue();speech.finish(first);speech.enqueue();
 assert.equal(speech.text,'Keep this sentence.');
});
test('speech bubble follows playback and safely renders real transcription',()=>{
 assert.equal(renderToStaticMarkup(React.createElement(CattySpeechBubble,{speaking:false,text:'Hidden'})),'');
 const html=renderToStaticMarkup(React.createElement(CattySpeechBubble,{speaking:true,text:'Hello <Edu>!'}));
 assert.match(html,/Hello &lt;Edu&gt;!/);assert.match(html,/Fala da Catty/);assert.doesNotMatch(html,/<Edu>/);
 const pending=renderToStaticMarkup(React.createElement(CattySpeechBubble,{speaking:true,text:''}));
 assert.match(pending,/Catty está falando/);
});
