# Homologação funcional — Catty × Image to Code

Este teste valida o *pipeline* com um projeto real, não atribui nota de fidelidade a partir de screenshots desencontrados.

## Escopo coberto

- Repositório real `lenixeduardo/catty-minhaamiga`; `src/landing` como objeto de teste.
- Análise de imagem por camadas e especificação do mockup (executadas separadamente com a referência aprovada).
- Integridade dos caminhos de assets utilizados: toda referência local precisa existir em `public/`.
- Vite build e testes Node/TypeScript já existentes.
- Navegador real em 7 resoluções: 360, 390, 430, 768, 820, 1024 e 1440 px.
- Testes de FAQ, navegação por âncoras, seleção das abas desktop, console e imagens carregadas.
- Captura de telas de toda a página, arquivo JSON/Markdown de evidências e falha explícita do CI quando necessário.
- Execução da skill upstream `Image-to-code` como verificadora das capturas.

## Assets e fidelidade

Anteriormente a interface referenciava cinco arquivos `assets/catty/*.webp` que não estavam versionados. O código faz agora referência direta ao asset original existente `public/catty.png`, preservando seus bytes; não cria versões inventadas nem utiliza substituições silenciosas após HTTP 404. **Essa correção elimina os links quebrados mas não reproduz as poses específicas do mockup**. Para fidelidade visual estrita, é necessário fornecer os cinco assets originais aprovados.

O mockup de três celulares não está versionado no repositório público. Consequentemente, desktop e tablet são inferidos; comparações de pixels só valem entre enquadramentos equivalentes.

## Fora do escopo comprovado

Sem credenciais e microfone reais, não é possível homologar autenticação no Supabase, streaming de áudio no Gemini Live, respostas do provedor, cobrança ou funcionalidade de microfone no ambiente do usuário. Testes unitários e de interface não equivalem a testes de integração com esses serviços.

## Execução

Acesse **Actions → Image to Code — Catty E2E Homologation**, ou abra um PR que altere a landing. O workflow arquiva o relatório e as capturas, executa os testes existentes e valida a versão upstream da skill. O resultado do workflow define o status; erros não são convertidos em sucesso.
