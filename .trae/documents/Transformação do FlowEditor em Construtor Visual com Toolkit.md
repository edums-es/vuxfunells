Vou transformar o FlowEditor em um construtor visual completo, inspirado no estilo "Typebot/n8n" da imagem, implementando uma **Toolbox Lateral** e **Drag & Drop**, mantendo a compatibilidade com a estrutura do seu funil.

### O Plano de Transformação

1.  **Nova Sidebar "Toolkit" (Barra de Ferramentas)**:
    *   Criarei um menu lateral esquerdo flutuante dentro do editor.
    *   **Categorias de Blocos**:
        *   📝 **Conteúdo**: Texto, Áudio, Imagem, Vídeo.
        *   ⚙️ **Lógica**: Intervalo (Delay).
        *   🛒 **Vendas**: Checkout, Upsell, Reviews.
        *   📞 **Chamadas**: Chamada de Voz, Vídeo VSL.
    *   Cada bloco será "arrastável" (Dragable).

2.  **Funcionalidade Drag & Drop Inteligente**:
    *   Você poderá arrastar um bloco da barra lateral e soltá-lo no canvas.
    *   **Inserção Inteligente**: Ao soltar um bloco (ex: uma nova mensagem), o sistema detectará automaticamente a posição (entre quais mensagens você soltou) e inserirá o novo item na ordem correta da sequência.

3.  **Visual "Pro" dos Nós (Cards)**:
    *   Substituirei os nós simples atuais por **Cards Customizados** (como na sua imagem de referência).
    *   **Design**:
        *   Cabeçalho colorido identificando o tipo (ex: Roxo para Chat, Verde para Vendas).
        *   Ícone representativo no topo.
        *   Corpo com preview do conteúdo (ex: início do texto da mensagem, miniatura da imagem).
        *   Botões de ação rápida no próprio nó (ex: Excluir, Duplicar).

4.  **Integração com o Editor**:
    *   Vou atualizar o `AdminFunnels.tsx` para passar as funções de criação (`addChatMessage`, `addOffer`, etc.) para o `FlowEditor`, permitindo que o Drag & Drop funcione de verdade.

### Resultado Esperado
O editor deixará de ser apenas uma "visualização" e passará a ser um **construtor ativo**. Você verá a caixa de ferramentas na esquerda, puxará uma mensagem de "Texto", soltará entre duas outras mensagens, e o fluxo se atualizará automaticamente.

Posso prosseguir com essa implementação?