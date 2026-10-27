# Homologação Gemini Live

1. Instale dependências e configure GEMINI_API_KEY conforme README.md. Use um projeto Google no free tier.
2. Execute apenas npm run dev e abra localhost:5173. A API deve informar Gemini Live na porta 3001.
3. Sem chave: Começar conversa deve mostrar orientação sobre GEMINI_API_KEY. Nenhuma chamada à OpenAI deve ocorrer.
4. Com chave válida: permita microfone, aguarde a saudação e diga "Yesterday I go to school". Confira entrada transcrita, resposta falada, transcrição da Catty e correção pontual. Teste português e inglês.
5. Teste Silenciar, reativar, mensagem por texto, interrupção durante resposta e Encerrar. Após encerrar, o indicador de microfone deve desligar e o áudio deve parar.
6. Tente abrir outra sessão. Não deve haver áudio da sessão anterior nem conexões abandonadas.
7. Se houver erro de cota/modelo/permissão, leia o aviso. Não envie chaves ou cabeçalhos de autorização em prints.
8. Com DEV_GUEST_MODE=false, confira login e criação/encerramento no Supabase. Em produção, visitante deve ser recusado.

Pendente neste ambiente: todas as etapas com conexão real ao Google e áudio de hardware.
