import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
test('Catty PWA tem manifesto válido e ícones de instalação', () => {
  const manifest = JSON.parse(read('../public/manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
  assert.match(read('../index.html'), /rel="manifest"/);
  assert.match(read('../index.html'), /apple-touch-icon/);
});
test('service worker não intercepta a API nem autenticação', () => {
  const sw = read('../public/sw.js');
  assert.match(sw, /request\.method !== 'GET'/);
  assert.match(sw, /request\.headers\.has\('authorization'\)/);
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(sw, /request\.mode === 'navigate'/);
});
test('PWA tem guia de instalação e captura móvel compatível', () => {
  assert.match(read('../src/InstallApp.tsx'), /beforeinstallprompt/);
  assert.match(read('../src/InstallApp.tsx'), /Adicionar à Tela de Início/);
  assert.match(read('../src/gemini-live.ts'), /new AudioContext\(/);
  assert.doesNotMatch(read('../src/gemini-live.ts'), /sampleRate!==16000/);
});
