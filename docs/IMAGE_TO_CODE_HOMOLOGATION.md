# Homologação ponta a ponta — Image to Code × Catty

## Escopo e referências

- Repositório: `lenixeduardo/catty-minhaamiga` (branch isolada de QA, sem mudanças de produção).
- Imagem aprovada: `Landing Page da Catty em Três Telas.png` (acervo privado; não publicada no repositório público).
- Exercício da skill: inventário da referência, extração anotada de três painéis, design spec validado, build React/Vite, execução em Chromium, captura mobile/tablet/desktop, testes de interação, auditoria de assets.
- Capturas originadas do GitHub Actions e comparadas ao mockup aprovado sem reivindicar comparação pixel a pixel entre viewports distintos.

## Resultados reais

| Verificação | Resultado |
| --- | --- |
| `npm ci` e `npm run build` | PASS |
| Aplicação React em `/landing` | PASS (HTTP 200) |
| Shell do aplicativo em `/` | PASS (HTTP 200) |
| Renderização mobile 390x844, tablet 820x1180, desktop 1440x900 | PASS |
| Overflow horizontal | PASS |
| Erros JS/console nas capturas | PASS |
| Decodificação das imagens visíveis | PASS, **não equivale a fidelidade dos assets** |
| FAQ expandir/fechar + navegação mobile | PASS |
| Abas interativas desktop | FAIL |
| Integridade das cinco variantes de imagem aprovadas | FAIL |
| Suite da Catty | 36 PASS, 4 FAIL, 2 SKIP |
| E2E browser QA | 25 PASS / 6 FAIL (31 verificações) |
| Captura e inventário upstream da skill Image-to-code | PASS (7 larguras, sem warnings) |
| Gemini Live real, microfone, áudio, Supabase autenticado | NÃO TESTADO — sem credenciais e dispositivo de áudio reais |

## Ausências confirmadas

Estes arquivos são referenciados pelo frontend e **não existem em `public/`**:

1. `/assets/catty/hero.webp`
2. `/assets/catty/card-happy.webp`
3. `/assets/catty/card-wink.webp`
4. `/assets/catty/cta.webp`
5. `/assets/catty/demo.webp`

O `onError` substitui essas imagens por `/catty.png`. O site renderiza sem imagens quebradas aparentes, mas isso não homologa os assets do mockup. Não fabricar imagens substitutas sem autorização.

## Falhas da suíte original

Duas verificações online de Supabase exigem configuração específica de URL/chave e falharam no CI sem credenciais; outras duas verificações estáticas de prompt no arquivo `tests/source-contracts.test.mjs` referenciam estrutura anterior à migração Gemini. Corrigir a separação de testes com credenciais e atualizar contratos, sem reduzir as garantias existentes.

## Qualidade da conclusão

**STATUS: NÃO HOMOLOGADO.** A skill conseguiu executar e detectar divergências reais, mas não ficou demonstrada geração autônoma integral de uma página nova a partir de uma imagem sem o código existente. Para chegar a 10/10, repetir o ciclo após restaurar assets autênticos, corrigir interações, atualizar testes e executar voz real com permissões e chaves próprias.

## Evidências

- GitHub Actions: https://github.com/lenixeduardo/catty-minhaamiga/actions/runs/40993884803
- Artifato: `catty-image-to-code-e2e` contendo capturas, relatórios JSON e snapshot rastreado.
- PR de QA: https://github.com/lenixeduardo/catty-minhaamiga/pull/4
- Correção resultante na skill: https://github.com/lenixeduardo/Image-to-code/commit/b953489f69351d615faf8b2752eb22c79f221d42
