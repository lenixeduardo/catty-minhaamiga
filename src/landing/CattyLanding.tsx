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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const showcase = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!showcase.current) return;
      const rect = showcase.current.getBoundingClientRect();
      const distance = Math.max(1, showcase.current.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(0.999, -rect.top / distance));
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) setActive(Math.min(2, Math.floor(progress * 3)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <main className="catty-site">
    <div className="catty-ambient">
      <section className="catty-hero" id="inicio">
        <header className="catty-nav"><a className="catty-logo" href="#inicio">Catty<span>♥</span><small>minhaAmiga</small></a><nav aria-label="Navegação principal"><a href="#funcionalidades">Funcionalidades</a><a href="#como-funciona">Como funciona</a><a href="#exemplos">Conversas</a><a href="#faq">FAQ</a></nav><a className="catty-nav-cta" href={appUrl}>Começar ↗</a></header>
        <div className="catty-hero-grid"><div><p className="catty-kicker">SUA TUTORA DE INGLÊS SEM FILTRO</p><h1>Seu inglês tá uma merda?<br/>A Catty resolve<span>.</span></h1><p className="catty-lead">Converse em inglês com uma IA que não passa pano pros seus erros. A Catty escuta, corrige e te ensina em tempo real — com sarcasmo e zero aula engessada.</p><div className="catty-actions"><a className="catty-button" href={appUrl}>Conversar com a Catty <span>↗</span></a><a className="catty-button catty-outline" href="#como-funciona">Como funciona</a></div><div className="catty-benefits"><span>Voz em tempo real</span><span>Correção instantânea</span><span>Humor sem filtro</span></div></div><Phone sample="Bora praticar inglês? Fala alguma coisa aí." /></div>
      </section>
    </div>
    <section className="catty-dark-intro"><p className="catty-kicker">POR QUE CATTY?</p><h2>Inglês de verdade.<br/>Sem aula engessada.</h2><p>Fale, erre, aprenda e repita — com uma tutora de IA que tem personalidade de sobra.</p></section>
    <section className="catty-showcase" id="funcionalidades" ref={showcase}><div className="catty-showcase-sticky"><div className="catty-showcase-copy"><p className="catty-kicker">FUNCIONALIDADES</p><h2>{features[active].title}</h2><p>{features[active].text}</p><div className="catty-feature-tabs">{features.map((feature, index) => <button key={feature.eyebrow} aria-pressed={active===index} onClick={() => setActive(index)} className={active===index?"selected":""}><span>{feature.eyebrow}</span>{feature.title}</button>)}</div></div><Phone sample={features[active].sample}/></div></section>
    <section className="catty-steps" id="como-funciona"><p className="catty-kicker">COMO FUNCIONA</p><h2>Três passos.<br/>Seu inglês destrava.</h2><div className="catty-step-grid">{[["01","Comece a conversar","Ative o microfone e fale sua primeira frase."],["02","Erre sem medo","A Catty identifica erros e mostra como corrigir."],["03","Aprenda de verdade","Repita, pratique e ganhe confiança."]].map(([n,t,d])=><article key={n}><strong>{n}</strong><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section className="catty-examples" id="exemplos"><p className="catty-kicker">EXEMPLOS DE CONVERSAÇÃO · NÃO SÃO DEPOIMENTOS</p><h2>Cada erro é uma chance de aprender.</h2><div className="catty-example-grid">{[["She don't like coffee.","She DOESN'T, meu bem. Vamos respeitar a gramática!"],["I goed to work.","GOED não existe, criatura. É WENT. Vai de novo."],["I have 25 years.","Em inglês você ARE 25 years old. Não é uma coleção de anos, porra."]].map(([q,a])=><article key={q}><p>Você: {q}</p><strong>Catty: {a}</strong></article>)}</div></section>
    <section className="catty-faq" id="faq"><div><p className="catty-kicker">FAQ</p><h2>Perguntas que você faria.<br/>A Catty responde.</h2></div><div>{faqs.map(([q,a],i)=><div className="catty-faq-item" key={q}><button aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}>{q}<span>{openFaq===i?"−":"+"}</span></button>{openFaq===i&&<p>{a}</p>}</div>)}</div></section>
    <section className="catty-final"><h2>Seu inglês não vai<br/>melhorar sozinho.</h2><p>A Catty já está pronta para conversar. Agora falta você começar.</p><a className="catty-button" href={appUrl}>Começar a conversar ↗</a></section>
    <footer className="catty-footer"><a className="catty-logo" href="#inicio">Catty<span>♥</span><small>minhaAmiga</small></a><p>© 2026 Catty minhaAmiga</p></footer>
  </main>;
}
function Phone({sample}:{sample:string}){return <div className="catty-phone" aria-label="Demonstração ilustrativa da interface Catty"><div className="catty-island"/><div className="catty-phone-top"><b>Catty<span>♥</span></b><small>minhaAmiga</small></div><div className="catty-bubble">{sample}</div><div className="catty-avatar"><img src="/catty.png" alt="Catty, gatinha original de pelagem creme, olhos castanhos e coleira com coração" loading="eager" /></div><div className="catty-wave">▂▅▇▃▆▂</div><div className="catty-mic" aria-hidden="true"><svg viewBox="0 0 24 24" width="35" height="35" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"/></svg></div><small className="catty-phone-hint">Toque para falar (em inglês)</small><div className="catty-phone-tabs"><span>Início</span><span>Progresso</span><span>Perfil</span></div></div>}
