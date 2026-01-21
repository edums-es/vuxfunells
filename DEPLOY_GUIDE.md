# Guia de Deploy na Hostinger (Node.js + React)

Este guia explica como colocar sua aplicação no ar usando a hospedagem Hostinger.

## Pré-requisitos
- Plano de Hospedagem que suporte Node.js (Business, Cloud ou VPS).
- Acesso ao hPanel ou terminal.

## Passo 1: Preparar os Arquivos (Build)

1. No seu terminal local, na pasta do projeto, rode:
   ```bash
   npm run build
   ```
   Isso vai criar uma pasta `dist` com o site otimizado.

2. **Teste Localmente** (Opcional mas recomendado):
   Rode `npm start` e acesse `http://localhost:4000`. O site deve abrir normalmente, servido pelo backend Node.js.

## Passo 2: Empacotar para Upload

Crie um arquivo `.zip` contendo APENAS os seguintes itens:
- Pasta `dist/` (gerada no passo 1)
- Pasta `server/`
- Arquivo `package.json`
- Arquivo `package-lock.json` (se existir)
- Pasta `lib/` (se houver código compartilhado importado pelo server, verifique imports)
  - *Nota*: No seu projeto, o server importa de `../types`? Verifique se há dependências fora de `server/`.
  
  **Verificação Importante**: 
  O arquivo `server/index.js` importa:
  - `../lib/api`? Não, parece usar libs instaladas.
  - `../types`? Verifique imports.
  - `./seed.js` (está em server, ok).
  
  Se o servidor importar arquivos da raiz (como `types.ts` ou `lib/`), você deve incluir esses arquivos no zip também.
  
  **Recomendação de Zip**:
  - `dist/`
  - `server/`
  - `package.json`
  - `lib/` (se necessário)
  - `types.ts` (se necessário)
  
  **NÃO INCLUA**: `node_modules`. Eles serão instalados no servidor.

## Passo 3: Configurar na Hostinger (hPanel - Node.js App)

1. Acesse o **hPanel** > **Sites** > **Gerenciar**.
2. Procure por **Setup Node.js App** (ou Aplicativo Node.js).
3. Clique em **Criar Nova Aplicação**:
   - **Versão Node.js**: Escolha a 18 ou superior (recomendado 20 ou 22 se disponível).
   - **Modo**: `Production`.
   - **Application Root**: `public_html/app` (ou apenas `app` se preferir fora do public_html).
   - **Application URL**: Seu domínio.
   - **Application Startup File**: `server/index.js` (Isso é muito importante!).
4. Clique em **Criar**.

## Passo 4: Upload e Instalação

1. O hPanel vai criar a aplicação e mostrar um comando para entrar no ambiente virtual (algo como `source ...`).
2. Use o **Gerenciador de Arquivos** da Hostinger para entrar na pasta que você definiu (ex: `public_html/app`).
3. Apague os arquivos de exemplo que podem ter sido criados lá.
4. Faça upload do seu `.zip` e extraia os arquivos.
   - Certifique-se de que a estrutura ficou:
     - `public_html/app/server/index.js`
     - `public_html/app/dist/...`
     - `public_html/app/package.json`
5. Volte na tela do Node.js App no hPanel e clique no botão **NPM Install**.
   - Isso vai ler o `package.json` e instalar as dependências.

## Passo 5: Variáveis de Ambiente

Na tela de configuração do Node.js App, você pode definir variáveis de ambiente (Environment Variables). Adicione as necessárias:

- `PORT`: (Geralmente a Hostinger define automaticamente, mas se precisar, use a porta fornecida por eles, ou deixe o Passenger gerenciar).
- `JWT_SECRET`: Uma senha forte e aleatória.
- `ADMIN_EMAIL`: Seu email de admin.
- `ADMIN_PASSWORD`: Sua senha de admin.
- `NODE_ENV`: `production`.

## Passo 6: Reiniciar

Clique em **Restart Application**.

Acesse seu domínio. O servidor Node.js deve iniciar e servir os arquivos da pasta `dist` quando você acessar a raiz.

---

## Solução de Problemas

- **Erro 404 / Cannot GET /**: Verifique se a pasta `dist` está no local correto relativo ao `server/index.js`. O código espera que `dist` esteja em `../dist` a partir da pasta `server`. Ou seja, `dist` e `server` devem ser irmãos na pasta raiz da aplicação.
- **Erro 500 / App não inicia**: Verifique os logs (Error Log) no painel. Pode ser versão do Node incompatível ou falta de alguma dependência.
