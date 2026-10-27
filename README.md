# Catty minhaAmiga — Gemini Live

Mentora de inglês por voz com interface branca e rosa, gatinha em imagem, conversa e transcrição em tempo real. React/TypeScript/Vite e Express com Gemini Live via WebSocket. Supabase preservado para contas e sessões autenticadas.

## Atualizar no Windows

1. Encerre os terminais antigos do Catty com Ctrl+C.
2. Extraia o ZIP sobre a pasta do projeto, substituindo os arquivos. Preserve seu `.env` (não está incluído no ZIP).
3. Execute `npm install` para instalar `@google/genai`, `ws` e as demais dependências.
4. Edite `.env` na raiz e configure:

```dotenv
GEMINI_API_KEY=SUA_CHAVE_DO_GOOGLE_AI_STUDIO
GEMINI_LIVE_MODEL=gemini-2.5-flash-native-audio-preview-12-2025
DEV_GUEST_MODE=true
PORT=3001
```

Preserve as variáveis existentes do Supabase. A chave permanente Gemini fica apenas no servidor; não use prefixo VITE_. As variáveis antigas OPENAI_API_KEY e OPENAI_REALTIME_MODEL podem ser removidas: não são lidas pela aplicação atual.

5. Execute somente `npm run dev`, que inicia interface e API juntas. Não execute `npm run server` em paralelo. As portas padrão são 5173 e 3001; encerre instâncias antigas se estiverem ocupadas. Se um serviço falhar, o comando encerra o outro. Após alterar o backend ou .env, reinicie npm run dev.
6. Abra o endereço local do Vite, autorize o microfone e toque em Começar conversa.

## Como funciona

O navegador obtém um ticket aleatório de uso único, válido por 60 segundos, no backend. Esse ticket autoriza a conexão WebSocket da própria aplicação. O servidor conecta ao Google usando a chave permanente e limita o modelo e as instruções. A chave não vai ao navegador.

O microfone é capturado por AudioWorklet, em mono PCM16 a 16 kHz. O áudio de resposta é reproduzido em fila conforme a taxa informada pelo Gemini. Interrupções limpam a fila, Silenciar interrompe o envio e Encerrar libera microfone, WebSocket e contexto de áudio. Transcrições de entrada e saída são habilitadas. O campo de texto envia mensagens na mesma sessão ativa.

O modo visitante permanece disponível apenas em localhost e fora de produção. Para exigir login local, use DEV_GUEST_MODE=false. Sessões de visitante não são salvas no banco. Sessões autenticadas mantêm criação e encerramento no Supabase.

## Uso gratuito e cotas

O modelo padrão foi escolhido com base no free tier publicado pelo Google. Use uma chave de projeto no plano gratuito para manter custo de API zero. O código não altera faturamento, não compra créditos e não muda de provedor ao atingir uma cota. Uma chave de projeto com faturamento ativado segue as regras de cobrança desse projeto: o código não consegue impor o free tier do Google.

Há limite local de 3 inícios por minuto e cada conexão dura no máximo 10 minutos. Erros de cota encerram a conexão com aviso; não há retentativa automática nem fallback para OpenAI. No free tier, o Google pode usar o conteúdo para melhorar produtos, conforme seus termos.

## Validação e limitações

- `npm test`: testes locais de PCM16, tickets únicos/expiração, rejeição de WebSocket sem autorização ou com origem externa, mensagens de cota, modo visitante, JWT e contratos existentes.
- `npm run build`: valida TypeScript e gera a interface.
- A conversa real não foi homologada neste ambiente porque GEMINI_API_KEY não está disponível. Verifique o acesso ao modelo, a cota do projeto, microfone, áudio e transcrição na sua máquina.
- O navegador precisa suportar AudioWorklet e AudioContext a 16 kHz; HTTPS ou localhost são necessários para microfone.
- A gatinha é uma imagem de aparência 3D, ainda sem boca animada.

## Referências

- https://ai.google.dev/gemini-api/docs/live-api/get-started-sdk
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
