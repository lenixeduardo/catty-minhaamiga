import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { createTickets, attachGeminiRelay } from './gemini-relay.js';
import { createClient } from '@supabase/supabase-js';
const app=express();app.use(express.json({limit:'8kb'}));
export const instruction=`Você é Catty, uma gatinha virtual adulta e mentora de inglês para brasileiros. Fale PRINCIPALMENTE português brasileiro. Ensine inglês desde o absoluto básico até conversação fluente sem aulas ou módulos: conduza diálogo contínuo, uma pergunta por vez. Quando o aluno errar, cite APENAS a palavra ou expressão errada, diga APENAS a correção e peça para tentar de novo. Exemplo: aluno 'Yesterday I go'; Catty 'Que porra é essa? Yesterday I go? É WENT, caralho! Vai de novo.' Não explique a frase inteira salvo pedido explícito. Se acertar, elogie brevemente e avance. Use sarcasmo e palavrões brasileiros como porra, merda, caralho, de forma consensual e cômica, sem ameaças, discriminação ou humilhação prolongada. Não invente erros nem afirme ter avaliado pronúncia quando o áudio não estiver claro. Comece com frases curtas de nível A1 e ajuste progressivamente à competência demonstrada. Respostas faladas de preferência até 30 palavras. Se o aluno pedir menos palavrões, respeite imediatamente.`;

const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const authClient=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey,{auth:{persistSession:false,autoRefreshToken:false}}):null;
// Temporary guest access is restricted to local development, including requests through Vite.
function isLocalGuest(req: express.Request): boolean {
  if(process.env.NODE_ENV==='production'||process.env.DEV_GUEST_MODE==='false')return false;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||''))return false;
  const localNames=['localhost','127.0.0.1','[::1]'];
  try {
    if(!localNames.includes(new URL('http://'+req.headers.host).hostname))return false;
    if(req.headers.origin&&!localNames.includes(new URL(req.headers.origin).hostname))return false;
    return true;
  } catch { return false; }
}
const requestTimes=new Map<string,number[]>();
const tickets=createTickets();
app.get('/api/auth-check',async(req,res)=>{
  if(isLocalGuest(req)){res.json({guest_mode:true});return;}
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if(!authClient||!token){res.status(401).json({error:'Autenticação necessária'});return;}
  const {data,error}=await authClient.auth.getUser(token);
  if(error||!data.user){res.status(401).json({error:'Token inválido'});return;}
  res.json({user_id:data.user.id});
});
app.get('/api/health',(_req,res)=>res.json({ok:true}));
app.post('/api/realtime-token',async(req,res)=>{
  let uid='local-guest';
  if(!isLocalGuest(req)){
    const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if(!authClient||!token){res.status(401).json({error:'Faça login antes de iniciar a conversa.'});return;}
    const {data:identity,error:authError}=await authClient.auth.getUser(token);
    if(authError||!identity.user){res.status(401).json({error:'Sessão inválida ou expirada.'});return;}
    uid=identity.user.id;
  }
  const now=Date.now();
  const times=(requestTimes.get(uid)||[]).filter(t=>now-t<60_000);
  if(times.length>=3){res.status(429).json({error:'Limite de 3 sessões por minuto.'});return;}
  times.push(now);requestTimes.set(uid,times);
  if(!process.env.GEMINI_API_KEY){res.status(503).json({error:'Configure GEMINI_API_KEY no .env do servidor.'});return;}
  const level=['A1','A2','B1','B2','C1','C2'].includes(req.body?.level)?req.body.level:'A1';
  res.setHeader('Cache-Control','no-store');
  res.json({provider:'gemini',value:tickets.issue(level),model:process.env.GEMINI_LIVE_MODEL||'gemini-2.5-flash-native-audio-preview-12-2025'});
});
const server=createServer(app);
attachGeminiRelay(server,tickets,instruction);
server.on('error',(error:NodeJS.ErrnoException)=>{console.error(error.code==='EADDRINUSE'?'A porta '+(process.env.PORT||3001)+' já está ocupada. Encerre a instância anterior do Catty antes de executar npm run dev.':error.message);process.exit(1)});
server.listen(Number(process.env.PORT||3001),()=>console.log('API pronta na porta '+(process.env.PORT||3001)+' — voz Gemini Live'));
