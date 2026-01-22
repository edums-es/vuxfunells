# Guia de Deploy: Hostinger (Frontend) + Backend (Railway ou Render)

Este projeto foi configurado para rodar com o Frontend e Backend separados.
- **Frontend (Site):** Será hospedado na Hostinger.
- **Backend (API):** Pode ser hospedado na Railway (Recomendado) ou Render.

---

## Opção 1: Backend na Railway (Recomendado)
A Railway é excelente, não tem "Cold Start" (o servidor não dorme) e é muito fácil de configurar.

1. Crie uma conta em [railway.app](https://railway.app).
2. Clique em **New Project** > **Deploy from GitHub repo**.
3. Selecione o repositório `vuxfunells`.
4. A Railway vai detectar automaticamente o projeto Node.js.
5. Vá na aba **Variables** e adicione:
   - `PORT`: `4000` (ou deixe vazio que a Railway define, mas o padrão do código é 4000)
   - `JWT_SECRET`: (crie uma senha segura)
   - `ADMIN_PASSWORD`: (senha para entrar no painel admin)
   - `CORS_ORIGIN`: `*` (ou o domínio do seu site na Hostinger)
   - `STORAGE_DIR`: `/app/storage` (IMPORTANTE para salvar dados)
6. Vá na aba **Volumes** (ou clique no projeto e depois botão direito > Add Volume).
   - Crie um volume e monte ele no caminho: `/app/storage`
   - **ISSO É CRÍTICO:** Sem o volume, todos os dados (cadastros, funis e uploads) serão apagados toda vez que o servidor reiniciar.
7. Vá na aba **Settings** > **Networking** e gere um domínio público (Generate Domain).
   - Copie esse domínio (ex: `https://vuxfunells-production.up.railway.app`).

---

## Opção 2: Backend no Render (Gratuito)
O Render tem um plano gratuito, mas o servidor "dorme" após 15 minutos de inatividade (o primeiro acesso demora ~50 segundos).

1. Crie uma conta em [render.com](https://render.com).
2. Clique em **New +** -> **Web Service**.
3. Conecte seu GitHub e escolha o repositório.
4. Configure:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
5. Em "Environment Variables", adicione:
   - `CORS_ORIGIN`: `*`
   - `JWT_SECRET`: (sua senha segura)
   - `ADMIN_PASSWORD`: (sua senha admin)
6. Clique em **Create Web Service**.
7. Copie a URL gerada.

---

## Passo 2: Configurar e Buildar o Frontend (Para Hostinger)

Agora que você tem a URL do seu backend (Railway ou Render), vamos configurar o frontend.

1. No seu computador, abra o arquivo `.env.production` (crie se não existir) na raiz do projeto.
2. Adicione a URL do seu backend:
   ```env
   VITE_API_URL=https://sua-url-do-backend.app
   ```
   *(Não coloque a barra `/` no final)*

3. Rode o comando de build no terminal:
   ```bash
   npm run build
   ```

## Passo 3: Enviar para Hostinger

1. Vá no **Gerenciador de Arquivos** da Hostinger.
2. Entre na pasta `public_html`.
3. Apague qualquer arquivo padrão que estiver lá.
4. **Envie todo o conteúdo** de dentro da pasta `dist` (gerada no passo anterior) para dentro da `public_html`.
   - Você deve ver arquivos como `index.html`, `.htaccess` e uma pasta `assets` direto na `public_html`.
   - **IMPORTANTE:** O arquivo `.htaccess` é fundamental para que o link `/admin` funcione. Certifique-se de enviá-lo. (Se ele estiver oculto no seu computador, ative a opção de ver arquivos ocultos).

Pronto! Acesse seu domínio na Hostinger. O site vai carregar e o painel admin também deve funcionar.
