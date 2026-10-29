import {CattySpeechQueue} from './catty-speech';
export function encodePcm(samples:Float32Array):string {
 const bytes=new Uint8Array(samples.length*2),view=new DataView(bytes.buffer);
 for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));view.setInt16(i*2,Math.round(x<0?x*32768:x*32767),true)}
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);
}
type Handlers={speech?:(text:string)=>void;ready:()=>void;transcript:(who:'Catty'|'Você',text:string)=>void;talking:(value:boolean)=>void;turnEnded?:(interrupted:boolean)=>void;closed:()=>void;error:(message:string)=>void};
export class GeminiVoice {
 private speech=new CattySpeechQueue();
 private context=new AudioContext({sampleRate:16000});
 private socket:WebSocket|null=null;
 private media:MediaStream|null=null;
 private capture:AudioWorkletNode|null=null;
 private source:MediaStreamAudioSourceNode|null=null;
 private players=new Set<AudioBufferSourceNode>();
 private cursor=0;private disposed=false;private ready=false;private muted=false;
 private captureReady=false;private serverReady=false;
 private timeout:ReturnType<typeof setTimeout>|undefined;
 constructor(private handlers:Handlers){void this.context.resume().catch(()=>{})}
 private activate(){
  if(this.disposed||this.ready||!this.captureReady||!this.serverReady)return;
  clearTimeout(this.timeout);this.ready=true;this.handlers.ready();
 }
 private async prepareCapture(){
  const mediaTask=navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}}).then(media=>{
   if(this.disposed){media.getTracks().forEach(track=>track.stop());return}
   this.media=media;
  });
  await Promise.all([mediaTask,this.context.audioWorklet.addModule('/pcm-capture.js'),this.context.resume()]);
  if(this.disposed)return;
  if(this.context.sampleRate!==16000)throw Error('Este navegador não suporta a captura de áudio em 16 kHz. Tente uma versão atual do Chrome ou Edge.');
  this.source=this.context.createMediaStreamSource(this.media!);
  this.capture=new AudioWorkletNode(this.context,'pcm-capture');
  this.source.connect(this.capture);this.capture.connect(this.context.destination);
  this.capture.port.onmessage=event=>{if(this.ready&&!this.muted&&this.socket?.readyState===WebSocket.OPEN&&this.socket.bufferedAmount<65536)this.socket.send(JSON.stringify({type:'audio',data:encodePcm(event.data)}))};
  this.captureReady=true;this.activate();
 }
 async start(ticket:string|Promise<string>){
  if(this.disposed)return;
  try{
   await Promise.all([this.prepareCapture(),Promise.resolve(ticket).then(value=>{if(!this.disposed)this.connect(value)})]);
  }catch(error){this.close();throw error}
 }
 private connect(ticket:string){
  this.socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/api/live?ticket=${encodeURIComponent(ticket)}`);
  this.timeout=setTimeout(()=>this.handlers.error('Tempo de conexão excedido. Verifique a rede e a chave Gemini.'),25000);
  this.socket.onmessage=event=>{if(this.disposed)return;try{const data=JSON.parse(event.data);
   if(data.type==='ready'){clearTimeout(this.timeout);this.serverReady=true;this.activate()}
   if(data.type==='transcript'){if(data.who==='Catty'){this.speech.transcript(data.text);this.handlers.speech?.(this.speech.text)}this.handlers.transcript(data.who,data.text)}
   if(data.type==='audio')this.play(data.data,data.sampleRate);
   if(data.type==='interrupted'){this.clearAudio();this.handlers.turnEnded?.(true)}
   if(data.type==='turnComplete'){this.speech.endTurn();this.handlers.turnEnded?.(false)}
   if(data.type==='error')this.handlers.error(data.message);
  }catch{this.handlers.error('Resposta de áudio inválida do servidor.') }};
  this.socket.onerror=()=>{if(!this.disposed)this.handlers.error('Falha na conexão de voz. Verifique se a API do Catty está rodando e se a chave permite Gemini Live.')};
  this.socket.onclose=()=>{if(!this.disposed)this.handlers.closed()};
 }
 private play(encoded:string,rate:number){
  const raw=atob(encoded);if(raw.length%2||![16000,24000,48000].includes(rate))return;
  const view=new DataView(Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer);
  const buffer=this.context.createBuffer(1,raw.length/2,rate),samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(i*2,true)/32768;
  const player=this.context.createBufferSource();player.buffer=buffer;player.connect(this.context.destination);
  const speechId=this.speech.enqueue();
  this.players.add(player);this.handlers.speech?.(this.speech.text);this.handlers.talking(true);
  player.onended=()=>{this.players.delete(player);this.speech.finish(speechId);this.handlers.speech?.(this.speech.text);if(!this.players.size)this.handlers.talking(false)};
  const at=Math.max(this.cursor,this.context.currentTime);player.start(at);this.cursor=at+buffer.duration;
 }
 private clearAudio(){for(const player of this.players){player.onended=null;try{player.stop()}catch{}player.disconnect()}this.players.clear();this.speech.reset();this.handlers.speech?.('');this.cursor=0;this.handlers.talking(false)}
 sendText(text:string){if(this.ready&&this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'text',text:text.slice(0,2000)}))}
 setMuted(value:boolean){this.muted=value;this.media?.getAudioTracks().forEach(track=>track.enabled=!value);if(value&&this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'audioEnd'}))}
 close(){if(this.disposed)return;this.disposed=true;this.ready=false;clearTimeout(this.timeout);this.capture?.disconnect();this.source?.disconnect();this.media?.getTracks().forEach(track=>track.stop());this.socket?.close();this.clearAudio();void this.context.close().catch(()=>{})}
}
