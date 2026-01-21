# Guia de Deploy: Hostinger (Frontend) + Render (Backend)

Como sua hospedagem na Hostinger não suporta Node.js (criação de Apps), você precisará separar o projeto em duas partes:

1.  **Backend (API)**: Ficará no **Render.com** (Plano Gratuito).
2.  **Frontend (Site)**: Ficará na **Hostinger** (como arquivos estáticos).

---

## Parte 1: Subir o Backend no Render (Grátis)

O Render vai hospedar a "inteligência" do seu site (login, salvar funis, etc).

1.  Crie uma conta no [Render.com](https://render.com).
2.  Suba seu código para o **GitHub** (se ainda não estiver).
3.  No painel do Render, clique em **New +** -> **Web Service**.
4.  Conecte seu repositório do GitHub.
5.  Configure da seguinte forma:
    *   **Name**: `api-jornada-fertilidade` (ou o que preferir)
    *   **Region**: Escolha a mais próxima (ex: Ohio ou Frankfurt)
    *   **Branch**: `main`
    *   **Root Directory**: Deixe em branco
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server/index.js`
    *   **Plan**: Free
6.  Role para baixo até **Environment Variables** e adicione:
    *   `Key`: `CORS_ORIGIN`
    *   `Value`: `*`  (Isso permite que seu site na Hostinger acesse a API)
    *   `Key`: `JWT_SECRET`
    *   `Value`: `crie-uma-senha-secreta-bem-longa-aqui`
7.  Clique em **Create Web Service**.
8.  Aguarde o deploy finalizar. O Render vai te dar uma URL (ex: `https://api-jornada.onrender.com`). **Copie essa URL.**

**⚠️ Importante sobre o Plano Gratuito do Render:**
O sistema de arquivos do plano gratuito é temporário. Se o servidor reiniciar (o que acontece quando fica inativo), os dados salvos localmente (`db.json` e uploads) podem ser perdidos. Para um projeto sério/comercial, recomenda-se usar um banco de dados externo (como MongoDB Atlas) ou pagar o plano "Starter" do Render ($7/mês) e adicionar um "Disk".

---

## Parte 2: Configurar e Buildar o Frontend

Agora vamos preparar o site para conectar nesse Backend que você acabou de criar.

1.  No seu computador, crie um arquivo chamado `.env.production` na raiz do projeto.
2.  Adicione o seguinte conteúdo (cole a URL do Render que você copiou):

    ```env
    VITE_API_URL=https://api-jornada.onrender.com
    ```
    *(Não coloque a barra `/` no final)*

3.  Abra o terminal no VS Code e rode:

    ```bash
    npm run build
    ```

4.  Isso vai criar uma pasta `dist` com a versão otimizada do seu site.

---

## Parte 3: Subir na Hostinger

1.  Acesse o Gerenciador de Arquivos da Hostinger.
2.  Entre na pasta `public_html`.
3.  Delete os arquivos padrão se houver (index.php, default.php).
4.  Faça o upload de **todo o conteúdo de DENTRO da pasta `dist`** (não a pasta dist em si, mas os arquivos que estão dentro dela: `index.html`, pasta `assets`, etc).
5.  Pronto! Acesse seu domínio na Hostinger.

---

### Resumo
*   O site (Frontend) carrega da Hostinger.
*   Quando você faz login ou salva um funil, ele manda os dados para o Render (Backend).
