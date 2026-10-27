import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, type Session } from '@google/genai';
import { randomBytes } from 'node:crypto';

export function voiceError(error: unknown): string {
 const text=error instanceof Error?error.message:String(error);
 if(/429|quota|RESOURCE_EXHAUSTED/i.test(text))return 'Cota do Gemini atingida. Aguarde a renovação do limite gratuito e tente novamente. Nenhum provedor pago foi acionado.';
 if(/401|403|API_KEY|PERMISSION_DENIED|UNAUTHENTICATED/i.test(text))return 'O Google recusou o acesso. Verifique GEMINI_API_KEY, o projeto e a permissão para Gemini Live.';
 if(/404|not found|not supported/i.test(text))return 'Modelo Gemini Live indisponível para esta chave. Confira GEMINI_LIVE_MODEL no servidor.';
 return 'A conexão com Gemini Live foi interrompida. Tente novamente em instantes.';
}
export function createTickets() {
 const entries=new Map<string,{level:string,expires:number}>();
 const cleanup=()=>{const now=Date.now();for(const [key,item] of entries)if(item.expires<now)entries.delete(key);};
 setInterval(cleanup,30000).unref?.();
 return {
  issue(level:string){cleanup();if(entries.size>=1000)throw Error('Muitas conexões pendentes');const value=randomBytes(32).toString('hex');entries.set(value,{level,expires:Date.now()+60000});return value},
  consume(value:string){cleanup();const entry=entries.get(value);entries.delete(value);return entry&&entry.expires>Date.now()?entry:null},
 };
}
export function attachGeminiRelay(server:Server,tickets:ReturnType<typeof createTickets>,instruction:string){
 const wss=new WebSocketServer({noServer:true,maxPayload:32768});
 server.on('upgrade',(req,socket,head)=>{
  const url=new URL(req.url||'/', 'http://localhost');
  if(url.pathname!=='/api/live'){socket.destroy();return;}
  let allowed=false;
  try{
    const origin=req.headers.origin;
    if(!origin){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
    const originHost=new URL(origin).host;
    const reqHost=req.headers.host||'';
    const allowedOrigins=(process.env.ALLOWED_ORIGINS||process.env.VITE_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
    if(allowedOrigins.length>0){
      allowed=allowedOrigins.includes(originHost)||allowedOrigins.includes(origin);
    }else if(process.env.NODE_ENV==='production'){
      allowed=false;
    }else{
      const localHosts=['localhost:5173','127.0.0.1:5173','[::1]:5173','localhost:3000','127.0.0.1:3000',reqHost].filter(Boolean);
      allowed=localHosts.includes(originHost);
    }
  }catch{allowed=false;}
  if(!allowed){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
  const ticket=tickets.consume(url.searchParams.get('ticket')||'');
  if(!ticket){socket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');return;}
  wss.handleUpgrade(req,socket,head,peer=>{
   let live:Session|undefined,disposed=false,ready=false,setup=false;
   const send=(data:unknown)=>{if(peer.readyState===WebSocket.OPEN)peer.send(JSON.stringify(data))};
   const cleanup=()=>{if(disposed)return;disposed=true;clearTimeout(timeout);clearTimeout(duration);live?.close()};
   const fail=(message:string)=>{send({type:'error',message});peer.close(1011,'Gemini Live interrompido');cleanup()};
   const timeout=setTimeout(()=>fail('O Gemini não respondeu à conexão. Verifique a rede e tente novamente.'),20000);
   const duration=setTimeout(()=>{send({type:'error',message:'Sessão de 10 minutos encerrada. Você pode iniciar outra conversa.'});peer.close(1000);cleanup()},600000);
   const activate=()=>{if(!live||!setup||disposed||ready)return;ready=true;clearTimeout(timeout);send({type:'ready'});live.sendClientContent({turns:[{role:'user',parts:[{text:'Cumprimente em português brasileiro em uma frase curta e faça uma pergunta simples em inglês para começarmos.'}]}],turnComplete:true})};
   peer.on('close',cleanup);peer.on('error',cleanup);
   peer.on('message',bytes=>{
    if(!ready||!live||disposed)return;
    try{const data=JSON.parse(bytes.toString());
     if(data.type==='audio'&&typeof data.data==='string'&&data.data.length<=24000&&/^[A-Za-z0-9+/]*={0,2}$/.test(data.data))live.sendRealtimeInput({audio:{data:data.data,mimeType:'audio/pcm;rate=16000'}});
     else if(data.type==='text'&&typeof data.text==='string'&&data.text.trim().length&&data.text.length<=2000)live.sendClientContent({turns:[{role:'user',parts:[{text:data.text}]}],turnComplete:true});
     else if(data.type==='audioEnd')live.sendRealtimeInput({audioStreamEnd:true});
    }catch{fail('Não foi possível enviar o áudio ou texto ao Gemini.')}
   });
   const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY!,httpOptions:{apiVersion:'v1beta'}});
   void ai.live.connect({model:process.env.GEMINI_LIVE_MODEL||'gemini-2.5-flash-native-audio-preview-12-2025',config:{responseModalities:[Modality.AUDIO],systemInstruction:`${instruction}\nNível do aluno: ${ticket.level}.`,inputAudioTranscription:{},outputAudioTranscription:{},speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Aoede'}}}},callbacks:{
    onmessage:message=>{if(disposed)return;if(message.setupComplete){setup=true;activate()}const content=message.serverContent;if(!content)return;
     if(content.interrupted)send({type:'interrupted'});
     for(const part of content.modelTurn?.parts||[])if(part.inlineData?.data&&part.inlineData.mimeType?.startsWith('audio/pcm'))send({type:'audio',data:part.inlineData.data,sampleRate:Number(part.inlineData.mimeType.match(/rate=(\d+)/)?.[1]||24000)});
     if(content.inputTranscription?.text)send({type:'transcript',who:'Você',text:content.inputTranscription.text});
     if(content.outputTranscription?.text)send({type:'transcript',who:'Catty',text:content.outputTranscription.text});
     if(content.turnComplete)send({type:'turnComplete'});
    },onerror:error=>fail(voiceError(error)),onclose:event=>{if(disposed)return;if(event.code!==1000)send({type:'error',message:voiceError(event.reason)});peer.close(1000);cleanup()},
   }}).then(session=>{live=session;if(disposed)session.close();else activate()}).catch(error=>fail(voiceError(error)));
  });
 });
}
