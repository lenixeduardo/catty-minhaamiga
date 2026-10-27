# Migração para Gemini Live — 26/10/2026

Voz migrada integralmente de OpenAI para Gemini Live. Build TypeScript/Vite aprovado. Suite atual: 26 testes passaram, dois testes online opt-in do Supabase ignorados, zero falhas. TEST_RESULTS.txt contém a execução.

Testes novos verificam PCM16 little endian, tickets de acesso de uso único/expiração, recusa de WebSocket com origem externa ou ticket inválido, chave permanente não exposta e ausência de fallback para chave OpenAI. O teste antigo de transporte WebRTC e o teste de liberação de RTCPeerConnection foram removidos porque essa conexão foi substituída por WebSocket/AudioWorklet; encerramento real do microfone e reprodução requerem homologação no navegador.

Não foi realizada chamada real ao Google neste ambiente: GEMINI_API_KEY não está disponível. Não se afirma aprovação da conversa por voz, interrupções, transcrição ou acesso à cota gratuita da conta do usuário. Siga LIVE_TEST_GUIDE.md para homologação.

A interface foi preservada. A captura anterior não comprova o novo fluxo de voz. A gatinha continua imagem estática.

---

## Histórico anterior

# Atualização visual de 26/10/2026

Build aprovado. 21 testes passaram, zero falhas, dois testes online opt-in ignorados. O teste antigo que exigia malha procedural de boca foi removido porque esse renderizador foi substituído por imagem. Captura no navegador bloqueada; consulte design-qa.md. A voz real e o envio de texto em sessão ativa ainda não foram homologados.

---

# Atualização de 26/10/2026 — login temporariamente desabilitado

- Modo visitante local ativado por padrão. Não exige Supabase nem salva sessões de visitante.
- UI consulta a API para descobrir o modo de acesso e oculta o botão Entrar.
- Backend aceita visitante somente em desenvolvimento, de conexão loopback com Host e Origin locais.
- Produção continua exigindo JWT; `DEV_GUEST_MODE=false` restaura o login local.
- Limite de 3 inícios de sessão por minuto mantido.
- `npm test`: 22 testes passaram, 2 testes online do Supabase foram ignorados por serem opt-in, zero falhas.
- `npm run build`: passou; aviso de bundle grande já associado às dependências 3D.
- Verificação HTTP: interface servida pelo Vite, descoberta do modo visitante pelo proxy e rota de voz alcançada sem Supabase (503 esperado sem OPENAI_API_KEY).
- Voz real não testada (sem credencial OpenAI neste ambiente). Navegador não validado porque o download do Chromium falhou.
- Neste ambiente Linux, o comando de desenvolvimento foi impedido por restrições de IPC do tsx watch e enumeração de interfaces do Vite. A API foi verificada com `node --import tsx server/index.ts` e o Vite com host loopback explícito.

## Aplicar no Windows

1. Pare os terminais antigos com Ctrl+C.
2. Extraia o ZIP sobre a pasta do projeto, substituindo os arquivos. Seu `.env` não está incluído no ZIP e deve ser preservado.
3. Execute somente `npm run dev`: ele já inicia a interface e a API. Não execute `npm run server` em outro terminal.
4. Abra o endereço local exibido pelo Vite. O cabeçalho deve mostrar Modo visitante.
5. Para conversar, mantenha `OPENAI_API_KEY` configurada no `.env` do servidor.

---

## Relatório anterior (referência histórica)

# Catty minhaAmiga — Relatório de testes (2026-10-23)

## Resultado comprovado
- `node --test tests/*.test.mjs`: **10 aprovados, 0 reprovados**.
- Os dez testes são verificações estáticas de contratos no código-fonte, NÃO testes de execução do aplicativo, voz, qualidade de correção, banco ou segurança em produção.
- Execução capturada em `TEST_RESULTS.txt`.

## Bloqueios
- `npm install --no-audit --no-fund --prefer-offline --fetch-retries=0` excedeu o tempo disponível; build React/TypeScript não executado.
- Sem `OPENAI_API_KEY` fornecida para o ambiente; chamada Realtime/WebRTC real não executada.
- Sem projeto Supabase vinculado: migração, login, políticas RLS e persistência não testados no banco.
- Sem navegador Safari/iPhone disponível para homologação.

## Cinco etapas
1. Captura de voz: código verificado; execução real pendente.
2. Personalidade: prompt verificado; comportamento da IA pendente.
3. Correção: instrução verificada; testes semânticos e pedagógicos pendentes.
4. Avatar: presença de animação verificada; lipsync visual pendente.
5. Integração: schema/RLS inspecionados; persistência e testes ponta a ponta pendentes.

## Critério de liberação
NÃO HOMOLOGADO. Não expor rota de tokens publicamente sem autenticação, rate limiting e controle de gastos. Não confundir testes estáticos aprovados com validação funcional.
