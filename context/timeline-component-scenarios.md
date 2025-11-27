# Cenários de Teste (TDD) para o Componente de Timeline de Etapas do Leilão

## Funcionalidade: `AuctionStagesTimeline.tsx`

**Objetivo:** Garantir que o componente de timeline renderize corretamente o progresso das etapas de um leilão com base nas datas de início e fim, indicando visualmente o status de cada etapa.

---

### Cenário 1: Leilão em Andamento

*   **Dado:** Um leilão com três etapas (praças):
    *   1ª Praça: `startDate` no passado, `endDate` no passado.
    *   2ª Praça: `startDate` no passado, `endDate` no futuro.
    *   3ª Praça: `startDate` no futuro, `endDate` no futuro.
*   **Quando:** O componente `AuctionStagesTimeline` é renderizado com estas etapas.
*   **Então:** A timeline deve ser exibida.
*   **E:** O segmento da 1ª Praça deve estar visualmente marcado como "concluído" (ex: cor cinza).
*   **E:** O segmento da 2ª Praça deve estar visualmente marcado como "ativo" (ex: cor primária da plataforma, com um anel de destaque).
*   **E:** O segmento da 3ª Praça deve estar visualmente marcado como "futuro" (ex: cor de borda padrão, sem preenchimento).
*   **E:** Ao passar o mouse sobre o segmento da 2ª Praça, um `Tooltip` deve exibir: "2ª Praça", a data de fim formatada, e um indicador de "ETAPA ATUAL".

---

### Cenário 2: Leilão Totalmente no Futuro

*   **Dado:** Um leilão com duas etapas, ambas com `startDate` e `endDate` no futuro.
*   **Quando:** O componente `AuctionStagesTimeline` é renderizado.
*   **Então:** A timeline deve ser exibida.
*   **E:** Ambos os segmentos da 1ª e 2ª Praça devem estar visualmente marcados como "futuro" (ex: cor de borda padrão).
*   **E:** Nenhum segmento deve estar marcado como "ativo".

---

### Cenário 3: Leilão Totalmente Encerrado

*   **Dado:** Um leilão com duas etapas, ambas com `startDate` e `endDate` no passado.
*   **Quando:** O componente `AuctionStagesTimeline` é renderizado.
*   **Então:** A timeline deve ser exibida.
*   **E:** Ambos os segmentos da 1ª e 2ª Praça devem estar visualmente marcados como "concluído" (ex: cor cinza).
*   **E:** Nenhum segmento deve estar marcado como "ativo".

---

### Cenário 4: Leilão com Apenas uma Etapa

*   **Dado:** Um leilão com apenas uma etapa.
*   **Quando:** O componente `AuctionStagesTimeline` é renderizado.
*   **Então:** A timeline deve exibir um único segmento que ocupa 100% da largura da barra.
*   **E:** O status visual (concluído, ativo ou futuro) deste único segmento deve ser renderizado corretamente com base na data atual.

---

### Cenário 5: Renderização no Modo de Edição (Formulário)

*   **Dado:** O componente `AuctionStagesTimeline` é renderizado com a prop `isEditable={true}`.
*   **Quando:** O usuário visualiza o componente.
*   **Então:** Em vez da timeline visual, o componente deve renderizar uma lista de campos de formulário.
*   **E:** Para cada etapa, devem existir campos para "Nome da Etapa", "Data/Hora de Início", "Data/Hora de Fim" e "Lance Inicial".
*   **E:** Deve haver um botão "Adicionar Etapa/Praça" para adicionar novos campos de etapa à lista.
*   **E:** Cada item da etapa deve ter um botão para "Remover".

---

**Conclusão dos Testes:** A implementação bem-sucedida destes cenários garante que o componente `AuctionStagesTimeline` seja uma ferramenta visual precisa e flexível para comunicar o ciclo de vida de um leilão, tanto para usuários finais quanto para administradores.
