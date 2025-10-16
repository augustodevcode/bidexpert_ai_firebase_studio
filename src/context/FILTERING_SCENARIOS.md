# Cenários de Teste (TDD) para Filtro e Exibição de Resultados

## Funcionalidade 1: `BidExpertFilter.tsx`

**Objetivo:** Garantir que o componente de filtro funcione corretamente em diferentes contextos (leilões, lotes), que suas interações atualizem o estado corretamente, e que ele comunique as seleções ao componente pai através de callbacks.

---

### Cenário 1.1: Renderização Inicial com Filtros Padrão

*   **Dado:** O componente `BidExpertFilter` é renderizado na página de busca principal.
*   **Quando:** Nenhum `initialFilters` é fornecido.
*   **Então:** O componente DEVE exibir as seções de filtro padrão.
*   **E:** O filtro de categoria DEVE estar marcado em "Todas as Categorias".
*   **E:** O slider de preço DEVE estar nos valores padrão.

### Cenário 1.2: Filtragem por Categoria e Preço

*   **Dado:** O usuário está na página de busca.
*   **Quando:** O usuário seleciona a categoria "Veículos" e ajusta o preço para "R$ 10.000" a "R$ 50.000".
*   **E:** O usuário clica no botão "Aplicar Filtros".
*   **Então:** A função `onFilterSubmit` DEVE ser chamada com: `{ category: 'veiculos', priceRange: [10000, 50000], ... }`.

### Cenário 1.3: Reset dos Filtros

*   **Dado:** O usuário aplicou vários filtros.
*   **Quando:** O usuário clica no botão "Limpar Filtros".
*   **Então:** A função `onFilterReset` DEVE ser chamada.
*   **E:** O estado interno do `BidExpertFilter` DEVE retornar aos seus valores padrão.

---

## Funcionalidade 2: `SearchResultsFrame.tsx`

**Objetivo:** Garantir que o frame de resultados exiba corretamente os itens, a paginação, os controles de visualização e o estado de "nenhum resultado".

### Cenário 2.1: Exibição em Grade com Paginação

*   **Dado:** O `SearchResultsFrame` recebe uma lista de 20 itens, com `itemsPerPage` definido como 8.
*   **Quando:** O componente é renderizado no `viewMode="grid"`.
*   **Então:** Exatamente 8 itens DEVEM ser renderizados usando a função `renderGridItem`.
*   **E:** Os controles de paginação DEVEM ser visíveis e indicar que há 3 páginas no total.
*   **E:** Clicar no botão da página "2" DEVE chamar a `onPageChange(2)`.

### Cenário 2.2: Alternância para Visualização em Lista

*   **Dado:** O componente está exibindo itens em modo grade.
*   **Quando:** O usuário clica no botão "Lista" nos controles de visualização.
*   **Então:** Os mesmos 8 itens da página atual DEVEM ser renderizados, mas agora utilizando a função `renderListItem`.
*   **E:** O layout deve mudar de um grid para uma lista vertical.

### Cenário 2.3: Exibição de Estado Vazio

*   **Dado:** A prop `items` passada para `SearchResultsFrame` é um array vazio.
*   **Quando:** O componente é renderizado.
*   **Então:** A barra de ferramentas de ordenação e visualização DEVE estar visível.
*   **E:** Em vez da grade ou lista de itens, uma mensagem customizável (via `emptyStateMessage`) DEVE ser exibida (ex: "Nenhum lote encontrado com os filtros aplicados.").
*   **E:** Os controles de paginação NÃO DEVEM ser visíveis.

### Cenário 2.4: Estado de Carregamento (Loading)

*   **Dado:** A prop `isLoading` é `true`.
*   **Quando:** O componente é renderizado.
*   **Então:** A barra de ferramentas DEVE estar visível, mas pode estar desabilitada.
*   **E:** Em vez dos resultados ou da mensagem de estado vazio, um indicador de carregamento (ex: `Loader2`) DEVE ser exibido.

---

**Conclusão dos Testes:** A combinação destes cenários garante que o `BidExpertFilter` e o `SearchResultsFrame` trabalhem juntos de forma harmoniosa para criar uma experiência de busca e navegação de dados robusta, flexível e consistente.
