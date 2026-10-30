import { useEffect, useRef, useState } from "react";
import "./CattyLanding.css";

const features = [
  { eyebrow: "01 / VOZ", title: "Fale inglês. A Catty escuta.", text: "Abra o microfone e comece a conversar de verdade.", sample: "Bora praticar inglês? Fala alguma coisa aí." },
  { eyebrow: "02 / CORREÇÃO", title: "Errou? Ela não deixa passar.", text: "Correções instantâneas com contexto e sarcasmo.", sample: "GOED? Que porra é essa? É WENT. Repete." },
  { eyebrow: "03 / EVOLUÇÃO", title: "Cada conversa. Mais confiança.", text: "Pratique frases reais e avance no seu ritmo.", sample: "Boa! Agora tenta dizer isso no passado." }
];
const faqs = [
  ["Preciso saber inglês para começar?", "Não. Você pode começar com frases curtas e praticar gradualmente."],
  ["A Catty conversa por voz?", "Sim, o aplicativo oferece prática de conversação por voz."],
  ["Como funcionam as correções?", "A Catty identifica erros e propõe formas mais naturais de falar."],
  ["A Catty fala palavrão?", "Sim. O humor adulto e o sarcasmo fazem parte da personalidade dela."],
  ["Preciso pagar?", "Consulte o aplicativo para verificar as condições atuais de acesso."]
];
export default function CattyLanding({ appUrl = "/" }: { appUrl?: string }) {
  const [active, setActive] = useState(0);
  const manualTabSelection = useRef(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const showcase = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (manualTabSelection.current || !showcase.current) return;
      const rect = showcase.current.getBoundingClientRect();
      const distance = Math.max(1, showcase.current.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(0.999, -rect.top / distance));
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) setActive(Math.min(2, Math.floor(progress * 3)));
    };
    const resumeScrollSync = () => { manualTabSelection.current = false; };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", resumeScrollSync, { passive: true });
    window.addEventListener("touchmove", resumeScrollSync, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("wheel", resumeScrollSync); window.removeEventListener("touchmove", resumeScrollSync); };
  }, []);
  return <main className="catty-site"><MobileMockup appUrl={appUrl} />
    <div className="catty-ambient">
      <section className="catty-hero" id="inicio">
        <header className="catty-nav"><a className="catty-logo" href="#inicio">Catty<span>♥</span><small>minhaAmiga</small></a><nav aria-label="Navegação principal"><a href="#funcionalidades">Funcionalidades</a><a href="#como-funciona">Como funciona</a><a href="#exemplos">Conversas</a><a href="#faq">FAQ</a></nav><a className="catty-nav-cta" href={appUrl}>Começar ↗</a></header>
        <div className="catty-hero-grid"><div className="catty-hero-copy"><p className="catty-kicker">SUA TUTORA DE INGLÊS SEM FILTRO</p><h1>Seu inglês tá uma merda?<br/>A Catty resolve<span>.</span></h1><p className="catty-lead">Converse em inglês com uma IA que não passa pano pros seus erros. A Catty escuta, corrige e te ensina em tempo real — com sarcasmo e zero aula engessada.</p><div className="catty-actions"><a className="catty-button" href={appUrl}>Conversar com a Catty <span>↗</span></a><a className="catty-button catty-outline" href="#como-funciona">Como funciona</a></div><div className="catty-benefits"><span>Voz em tempo real</span><span>Correção instantânea</span><span>Humor sem filtro</span></div></div><div className="catty-hero-art"><div className="catty-hero-halo" aria-hidden="true"/><Phone sample="Bora praticar inglês? Fala alguma coisa aí." /></div></div>
      </section>
    </div>
    <section className="catty-dark-intro"><p className="catty-kicker">POR QUE CATTY?</p><h2>Inglês de verdade.<br/>Sem aula engessada.</h2><p>Fale, erre, aprenda e repita — com uma tutora de IA que tem personalidade de sobra.</p></section>
    <section className="catty-showcase" id="funcionalidades" ref={showcase}><div className="catty-showcase-sticky"><div className="catty-showcase-copy"><p className="catty-kicker">FUNCIONALIDADES</p><h2>{features[active].title}</h2><p>{features[active].text}</p><div className="catty-feature-tabs">{features.map((feature, index) => <button key={feature.eyebrow} aria-pressed={active===index} onClick={() => { manualTabSelection.current = true; setActive(index); }} className={active===index?"selected":""}><span>{feature.eyebrow}</span>{feature.title}</button>)}</div></div><Phone sample={features[active].sample}/></div></section>
    <section className="catty-mobile-features" aria-label="Funcionalidades da Catty">
      {features.map((feature, index) => <article className="catty-mobile-feature" key={feature.eyebrow}>
        <div><p className="catty-kicker">{feature.eyebrow}</p><h2>{feature.title}</h2><p>{feature.text}</p></div>
        <div className="catty-mobile-feature-phone"><Phone sample={feature.sample} /></div>
        <span className="catty-feature-number">0{index + 1} / 03</span>
      </article>)}
    </section>
    <section className="catty-steps" id="como-funciona"><p className="catty-kicker">COMO FUNCIONA</p><h2>Três passos.<br/>Seu inglês destrava.</h2><div className="catty-step-grid">{[["01","Comece a conversar","Ative o microfone e fale sua primeira frase."],["02","Erre sem medo","A Catty identifica erros e mostra como corrigir."],["03","Aprenda de verdade","Repita, pratique e ganhe confiança."]].map(([n,t,d])=><article key={n}><strong>{n}</strong><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section className="catty-examples" id="exemplos"><p className="catty-kicker">EXEMPLOS DE CONVERSAÇÃO · NÃO SÃO DEPOIMENTOS</p><h2>Cada erro é uma chance de aprender.</h2><div className="catty-example-grid">{[["She don't like coffee.","She DOESN'T, meu bem. Vamos respeitar a gramática!"],["I goed to work.","GOED não existe, criatura. É WENT. Vai de novo."],["I have 25 years.","Em inglês você ARE 25 years old. Não é uma coleção de anos, porra."]].map(([q,a])=><article key={q}><p>Você: {q}</p><strong>Catty: {a}</strong></article>)}</div></section>
    <section className="catty-faq" id="faq"><div><p className="catty-kicker">FAQ</p><h2>Perguntas que você faria.<br/>A Catty responde.</h2></div><div>{faqs.map(([q,a],i)=><div className="catty-faq-item" key={q}><button aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}>{q}<span>{openFaq===i?"−":"+"}</span></button>{openFaq===i&&<p>{a}</p>}</div>)}</div></section>
    <section className="catty-final"><h2>Seu inglês não vai<br/>melhorar sozinho.</h2><p>A Catty já está pronta para conversar. Agora falta você começar.</p><a className="catty-button" href={appUrl}>Começar a conversar ↗</a></section>
    <footer className="catty-footer"><a className="catty-logo" href="#inicio">Catty<span>♥</span><small>minhaAmiga</small></a><p>© 2026 Catty minhaAmiga</p></footer>
  </main>;
}
function Phone({sample}:{sample:string}){return <div className="catty-phone" aria-label="Demonstração ilustrativa da interface Catty"><div className="catty-island"/><div className="catty-phone-top"><b>Catty<span>♥</span></b><small>minhaAmiga</small></div><div className="catty-bubble">{sample}</div><div className="catty-avatar"><img src="/catty.png" alt="Catty, gatinha original de pelagem creme, olhos castanhos e coleira com coração" loading="eager" /></div><div className="catty-wave">▂▅▇▃▆▂</div><div className="catty-mic" aria-hidden="true"><svg viewBox="0 0 24 24" width="35" height="35" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"/></svg></div><small className="catty-phone-hint">Toque para falar (em inglês)</small><div className="catty-phone-tabs"><span>Início</span><span>Progresso</span><span>Perfil</span></div></div>}

function MobileMockup({appUrl}:{appUrl:string}){
 const [expanded,setExpanded]=useState<number|null>(null);
 const questions=faqs.slice(0,4).concat([["Posso praticar frases do cotidiano?","Sim. Pratique situações reais e avance no seu ritmo."]]);
 return <div className="catty-mock-mobile">
  <section className="cm-hero" id="mobile-inicio">
   <div className="cm-hero-glow" aria-hidden="true"/>
   <div className="cm-light-ring cm-light-ring-a" aria-hidden="true"/><div className="cm-light-ring cm-light-ring-b" aria-hidden="true"/>
   <header className="cm-nav"><a href="#mobile-inicio" className="cm-logo">Catty<span>♥</span><small>minhaAmiga</small></a><a href="#mobile-why" aria-label="Ir para funcionalidades" className="cm-hamburger"><i/><i/><i/></a></header>
   <img className="cm-hero-cat" src="/assets/catty/hero.webp" alt="Catty, a gatinha tutora de inglês" />
   <div className="cm-hero-content"><h1>Seu inglês tá<br/>uma merda?<br/>A Catty resolve.</h1><p>Converse em inglês com uma IA que não passa pano pros seus erros. A Catty escuta, corrige e te ensina em tempo real — com sarcasmo, personalidade e zero aula engessada.</p>
   <a className="cm-button cm-white" href={appUrl}>Conversar com a Catty <span>→</span></a><a className="cm-button cm-ghost" href="#mobile-why">Como funciona</a>
   <div className="cm-benefits"><div><span className="cm-round-icon"><MicIcon/></span>Voz em<br/>tempo real</div><div><span className="cm-round-icon"><ChatIcon/></span>Correção<br/>instantânea</div><div><span className="cm-round-icon"><BarsIcon/></span>Humor<br/>sem filtro</div></div>
   <div className="cm-hero-phone"><MiniPhone/></div></div>
  </section>
  <section className="cm-why" id="mobile-why"><header className="cm-nav"><a className="cm-logo" href="#mobile-inicio">Catty<span>♥</span><small>minhaAmiga</small></a><a href="#mobile-plans" className="cm-hamburger" aria-label="Ir para planos"><i/><i/><i/></a></header>
  <p className="cm-eyebrow">POR QUE CATTY?</p><h2>Inglês de verdade.<br/>Sem aula engessada.</h2><p className="cm-why-lead">Fale, erre, aprenda e repita. Com uma tutora de IA que tem personalidade de sobra.</p>
  <div className="cm-demo"><div className="cm-orbit" aria-hidden="true"/><MiniPhone chat/></div>
  <div className="cm-feature-row"><article><span className="cm-icon"><MicIcon/></span><h3>Fale inglês.<br/>A Catty escuta.</h3><p>Sem formulário, sem exercício engessado. Abra o microfone e comece a conversar de verdade.</p></article><article><span className="cm-icon"><ChatIcon/></span><h3>Errou?<br/>Ela não deixa passar.</h3><p>A Catty identifica seus erros e explica como corrigir, com exemplos e uma dose generosa de sarcasmo.</p></article><article><span className="cm-icon"><BarsIcon/></span><h3>Cada conversa.<br/>Mais confiança.</h3><p>Pratique frases reais, aprenda novas construções e avance das primeiras palavras para conversas mais naturais.</p></article></div>
  <div className="cm-three-steps"><p className="cm-eyebrow">COMO FUNCIONA</p><h2>Três passos.<br/>Seu inglês destrava.</h2><div><span>01</span><b/><span>02</span><b/><span>03</span></div></div>
  </section>
  <section className="cm-plans" id="mobile-plans"><header className="cm-nav"><a className="cm-logo" href="#mobile-inicio">Catty<span>♥</span><small>minhaAmiga</small></a><a href="#mobile-faq" className="cm-hamburger" aria-label="Ir para perguntas"><i/><i/><i/></a></header>
  <p className="cm-eyebrow">PLANOS</p><h2>Comece a conversar.<br/>Evolua no seu ritmo.</h2><p className="cm-plans-lead">Escolha a melhor forma de experimentar a Catty e desbloquear todo o seu potencial no inglês.</p>
  <div className="cm-plan-cards"><article><div className="cm-plan-art"><img src="/assets/catty/card-happy.webp" alt="Catty sorrindo"/></div><h3>Conheça a Catty</h3><p>Acesse a experiência atual e comece a conversar agora.</p><a className="cm-button cm-pink" href={appUrl}>Começar agora <span>→</span></a></article><article><div className="cm-plan-art cm-plan-art-alt"><img src="/assets/catty/card-wink.webp" alt="Catty tutora de inglês"/></div><h3>Explore as funcionalidades</h3><p>Veja todos os recursos de conversação, correção e acompanhamento de progresso.</p><a className="cm-button cm-pink-outline" href="#mobile-why">Saiba mais <span>→</span></a></article></div>
  <div className="cm-faq" id="mobile-faq"><p className="cm-eyebrow">PERGUNTAS FREQUENTES</p><h2>A Catty responde.</h2><div className="cm-faq-list">{questions.map(([q,a],i)=><div className="cm-faq-item" key={q}><button aria-expanded={expanded===i} onClick={()=>setExpanded(expanded===i?null:i)}>{q}<span>{expanded===i?"⌃":"⌄"}</span></button>{expanded===i&&<p>{a}</p>}</div>)}</div></div>
  <div className="cm-last"><div><h2>Seu inglês não vai<br/>melhorar sozinho.</h2><p>A Catty já está pronta para conversar. Agora falta você parar de enrolar e começar a falar.</p><a className="cm-button cm-pink" href={appUrl}>Conversar com a Catty <span>→</span></a></div><img src="/assets/catty/cta.webp" alt="Catty esperando sua primeira conversa"/></div>
  </section>
 </div>
}
function MicIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"/></svg>}
function ChatIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-6 4V7a3 3 0 0 1 3-3Z"/><path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth="3"/></svg>}
function BarsIcon(){return <svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>}
function MiniPhone({chat=false}:{chat?:boolean}){return <div className="cm-mini-phone"><div className="cm-mini-island"/><div className="cm-mini-status">9:41 <span>● ▰</span></div><div className="cm-mini-header"><b>Catty<span>♥</span></b><small>minhaAmiga</small><span className="cm-mini-gear">⚙</span></div>{chat?<><div className="cm-chat-you">I goed home<br/>yesterday. <span>◖))</span></div><div className="cm-chat-cat"><strong>GOED?</strong> Que porra é essa? É <strong>WENT.</strong> Vai de novo.</div></>:<div className="cm-mini-bubble">Bora praticar inglês?<br/>Fala alguma coisa aí.</div>}<img src="/catty.png" alt="" /><div className="cm-mini-wave">▂▅▇▃▆▂▃▅</div></div>}
