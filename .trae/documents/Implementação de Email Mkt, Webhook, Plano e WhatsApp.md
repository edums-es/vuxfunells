# Implementação de Novas Funcionalidades Admin e Integrações

Este plano detalha a criação das novas páginas administrativas e a integração de funcionalidades de Marketing no FlowBuilder.

## 1. Novas Páginas Administrativas (Frontend)

Criaremos quatro novas páginas no painel administrativo (`components/admin/`):

### A. Email Marketing (`AdminEmailMarketing.tsx`)
*   **Objetivo:** Gerenciar configurações de provedores de email e campanhas.
*   **Funcionalidades:**
    *   Configuração de SMTP / API Key (ex: Resend, SendGrid).
    *   Listagem de templates ou campanhas simples.
*   **Integração:** Servirá de base para o nó de "Email" no FlowBuilder.

### B. Webhooks (`AdminWebhooks.tsx`)
*   **Objetivo:** Configurar conexões externas globais.
*   **Funcionalidades:**
    *   Lista de Webhooks configurados (URL, Eventos: `lead_created`, `checkout_success`, etc).
    *   Botão para adicionar/remover webhooks e testar disparo.

### C. Meu Plano (`AdminPlan.tsx`)
*   **Objetivo:** Mostrar status da assinatura do usuário.
*   **Funcionalidades:**
    *   Card de "Plano Atual" (exibindo "VITALÍCIO" para admin).
    *   Histórico de uso (Leads, Visitantes, Disparos).
    *   Detalhes da conta e limites.

### D. WhatsApp Config (`AdminWhatsapp.tsx`)
*   **Objetivo:** Central de conexão com WhatsApp.
*   **Funcionalidades:**
    *   **Abas:** "WABA (API Oficial)" e "EvolutionAPI".
    *   Formulários para inserir Token, Instance ID, e Base URL.
    *   Status da conexão (QR Code para EvolutionAPI, se aplicável).

## 2. Atualização da Navegação e Rotas

### A. Sidebar (`AdminLayout.tsx`)
*   Adicionar novos itens ao menu lateral com ícones apropriados (`Mail`, `Webhook`, `CreditCard`, `MessageCircle`).
*   Ordem sugerida: Dashboard > Funis > Leads > **Email Mkt** > **WhatsApp** > **Webhooks** > **Meu Plano** > Usuários.

### B. Rotas (`App.tsx`)
*   Registrar as novas rotas:
    *   `/admin/email-marketing`
    *   `/admin/webhooks`
    *   `/admin/plan`
    *   `/admin/whatsapp`

## 3. FlowBuilder (Integração Lógica)

### A. Novos Nós (`CustomNodes.tsx`)
*   **Email Node:** Configurar envio de email (Assunto, Corpo, Destinatário).
*   **WhatsApp Node:** Configurar envio de mensagem (Texto, Template WABA) ou Redirecionamento para X1.

### B. Toolbar (`FlowToolbar.tsx`)
*   Adicionar nova categoria **"Marketing"**:
    *   Item **"Email"** (ícone `Mail`).
    *   Item **"WhatsApp"** (ícone `MessageCircle`).

## 4. Passos de Execução
1.  Criar os componentes das novas páginas (com layouts placeholder funcionais).
2.  Atualizar o `AdminLayout` e `App.tsx` para habilitar a navegação.
3.  Atualizar o `CustomNodes` e `FlowToolbar` para adicionar os novos blocos ao construtor.
