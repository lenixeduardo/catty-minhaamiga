import {useEffect,useRef} from 'react';
import {Volume2} from 'lucide-react';

export function CattySpeechBubble({speaking,text}:{speaking:boolean;text:string}){
 const content=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{if(content.current)content.current.scrollTop=content.current.scrollHeight},[text,speaking]);
 if(!speaking)return null;
 return <div className="speech-bubble" role="region" aria-label="Fala da Catty">
  <p ref={content} tabIndex={0}>{text||'Catty está falando…'}</p>
  <Volume2 size={20} aria-hidden="true"/>
 </div>;
}
