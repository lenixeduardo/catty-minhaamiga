/** Registrar apenas em produção para não interferir na atualização do Vite. */
export function registerCattyPwa(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      console.warn('Catty PWA: service worker não registrado.', error);
    });
  }, { once: true });
}
