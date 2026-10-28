import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { createTickets, attachGeminiRelay } from './gemini-relay.js';
import { createClient } from '@supabase/supabase-js';
import { buildCattyCoreInstruction, type CattyToneLevel } from './prompts/catty-core.js';
const app=express();app.use(express.json({limit:'8kb'}));
export function getInstruction(toneLevel: CattyToneLevel = 1): string {
  return buildCattyCoreInstruction(toneLevel);
}
export { buildCattyCoreInstruction as instructionBuilder };
export const instruction = buildCattyCoreInstruction(1);

const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const authClient=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey,{auth:{persistSession:false,autoRefreshToken:false}}):null;

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip.replace(/^::ffff:/, '');
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim().replace(/^::ffff:/, '');
  }
  const remote = req.socket.remoteAddress || '';
  return remote.replace(/^::ffff:/, '');
}

function isTrustedProxy(req: express.Request): boolean {
  const trusted = (process.env.TRUSTED_PROXIES || '').split(',').map(s => s.trim()).filter(Boolean);
  if (trusted.length === 0) return false;
  const ip = req.socket.remoteAddress?.replace(/^::ffff:/, '') || '';
  return trusted.includes(ip);
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.VITE_ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = url.host;
    if (allowedOrigins.length > 0) {
      return allowedOrigins.includes(host) || allowedOrigins.includes(origin);
    }
    if (process.env.NODE_ENV === 'production') return false;
    const localHosts = ['localhost:5173', '127.0.0.1:5173', '[::1]:5173', 'localhost:3000', '127.0.0.1:3000'];
    return localHosts.includes(host);
  } catch {
    return false;
  }
}

// Temporary guest access is restricted to local development, including requests through Vite.
function isLocalGuest(req: express.Request): boolean {
  if(process.env.NODE_ENV==='production'||process.env.DEV_GUEST_MODE==='false')return false;
  const ip = getClientIp(req);
  if(!['127.0.0.1','::1'].includes(ip)) {
    if (!isTrustedProxy(req)) return false;
  }
  const localNames=['localhost','127.0.0.1','[::1]'];
  try {
    const host = req.headers.host ? new URL('http://'+req.headers.host).hostname : '';
    if(!localNames.includes(host))return false;
    if(req.headers.origin && !isAllowedOrigin(req.headers.origin))return false;
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
  const toneLevelRaw = req.body?.toneLevel;
  const toneLevel = (toneLevelRaw === 0 || toneLevelRaw === 2 || toneLevelRaw === '0' || toneLevelRaw === '2') ? (Number(toneLevelRaw) as 0 | 2) : 1;
  res.setHeader('Cache-Control','no-store');
  res.json({provider:'gemini',value:tickets.issue(level, toneLevel),model:process.env.GEMINI_LIVE_MODEL||'gemini-2.5-flash-native-audio-preview-12-2025'});
});
const server=createServer(app);
attachGeminiRelay(server,tickets);
server.on('error',(error:NodeJS.ErrnoException)=>{console.error(error.code==='EADDRINUSE'?'A porta '+(process.env.PORT||3001)+' já está ocupada. Encerre a instância anterior do Catty antes de executar npm run dev.':error.message);process.exit(1)});
server.listen(Number(process.env.PORT||3001),()=>console.log('API pronta na porta '+(process.env.PORT||3001)+' — voz Gemini Live'));
