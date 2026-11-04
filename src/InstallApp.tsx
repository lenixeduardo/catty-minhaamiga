import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import './InstallApp.css';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function InstallApp() {
  const [installed, setInstalled] = useState(isStandalone);
  const [deferred, setDeferred] = useState<InstallPrompt | null>(null);
  const [instructions, setInstructions] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setInstructions(false);
    };
    const onDisplay = () => { if (isStandalone()) onInstalled(); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const media = window.matchMedia('(display-mode: standalone)');
    media.addEventListener?.('change', onDisplay);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener?.('change', onDisplay);
    };
  }, []);

  const install = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        setDeferred(null);
        if (choice.outcome !== 'accepted') setInstructions(true);
      } catch {
        setInstructions(true);
      }
    } else {
      setInstructions(true);
    }
  };

  if (installed) return null;
  return <>
    <button type="button" className="catty-install-button" onClick={() => void install()} aria-label="Instalar Catty no celular">
      <Download size={17} aria-hidden="true" /><span>Instalar app</span>
    </button>
    {instructions && <div className="catty-install-overlay" onClick={() => setInstructions(false)}>
      <section className="catty-install-sheet" role="dialog" aria-modal="true" aria-labelledby="catty-install-title" onClick={(event) => event.stopPropagation()}>
        <button className="catty-install-close" aria-label="Fechar instruções" onClick={() => setInstructions(false)}><X size={20} /></button>
        <img src="/catty.png" alt="" />
        <h2 id="catty-install-title">Leve a Catty para a tela inicial</h2>
        {isIOS() ? <p>No iPhone, abra a Catty no Safari, toque em <strong>Compartilhar</strong>, escolha <strong>Adicionar à Tela de Início</strong>, ative <strong>Abrir como App da Web</strong> e toque em <strong>Adicionar</strong>.</p> :
          <p>No Android, abra a Catty no Chrome, toque no menu do navegador e escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p>}
        <p className="catty-install-note">O ícone aparecerá no celular. Para conversar por voz, é necessário estar conectado à internet e permitir o microfone.</p>
        <button className="catty-install-done" onClick={() => setInstructions(false)}>Entendi</button>
      </section>
    </div>}
  </>;
}
