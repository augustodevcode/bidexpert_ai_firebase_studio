# Especificação de Componentes - `BidExpertFilter` e `BidExpertSearchResultsFrame`

## 1. `BidExpertFilter.tsx`

### 1.1. Visão Geral

O `BidExpertFilter` é um componente de cliente reutilizável, projetado para fornecer uma interface de filtragem consistente em várias páginas da plataforma. Ele é totalmente configurável via `props`.

**Localização:** `src/components/BidExpertFilter.tsx`

### 1.2. Arquitetura e Props

O componente é "burro" (dumb component), gerenciando apenas o estado interno dos filtros. Quando o usuário aplica as seleções, ele invoca a `callback` `onFilterSubmit` passando um objeto com todos os filtros selecionados para o componente pai.

#### Props Principais (`BidExpertFilterProps`)

| Prop | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `categories` | `LotCategory[]` | Não | Lista de categorias para o filtro. |
| `locations` | `string[]` | Não | Lista de strings de localização (ex: "São Paulo - SP"). |
| `sellers` | `string[]` | Não | Lista de nomes de comitentes/vendedores. |
| `onFilterSubmit` | `(filters: ActiveFilters) => void` | **Sim** | Callback chamada ao aplicar filtros. |
| `onFilterReset` | `() => void` | **Sim** | Callback chamada ao limpar filtros. |
| `initialFilters`| `ActiveFilters`| Não | Objeto com o estado inicial dos filtros. |
| `filterContext`| `'auctions' \| 'directSales' \| 'lots'`| Não | Adapta a UI para filtros específicos do contexto. |
| `disableCategoryFilter`| `boolean`| Não | Se `true`, desabilita o filtro de categoria. |

#### Estrutura de Filtros (`ActiveFilters`)

```typescript
export interface ActiveFilters {
  modality: string;
  category: string; 
  priceRange: [number, number];
  locations: string[];
  sellers: string[];
  // ... outros campos de filtro ...
}
```

---

## 2. `BidExpertSearchResultsFrame.tsx`

### 2.1. Visão Geral

O `BidExpertSearchResultsFrame` é um componente de cliente reutilizável responsável por encapsular toda a lógica de exibição de uma lista de resultados. Isso inclui a barra de ferramentas com opções de ordenação e modo de visualização (grade/lista), a renderização dos próprios itens, e os controles de paginação.

**Localização:** `src/components/BidExpertSearchResultsFrame.tsx`

### 2.2. Arquitetura e Props

Este componente recebe uma lista de itens e funções de renderização (`render functions`) como props. Isso o torna extremamente flexível, pois ele não precisa saber *o que* está renderizando, apenas *como* renderizar. A lógica de busca e filtragem dos dados permanece no componente pai (a página).

#### Props Principais (`BidExpertSearchResultsFrameProps<TItem>`)

| Prop | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `items` | `TItem[]` | **Sim** | O array de itens a serem exibidos (já filtrados e ordenados). |
| `totalItemsCount` | `number` | **Sim** | O número total de itens (antes da paginação) para calcular a paginação. |
| `renderGridItem` | `(item: TItem) => ReactNode` | **Sim** | Função que recebe um item e retorna o JSX para o modo de visualização em grade. |
| `renderListItem` | `(item: TItem) => ReactNode` | **Sim** | Função que recebe um item e retorna o JSX para o modo de visualização em lista. |
| `sortOptions` | `{ value: string; label: string }[]` | **Sim** | Array de opções para o seletor de ordenação. |
| `initialSortBy`| `string` | Não | O valor da ordenação inicial. |
| `onSortChange`| `(sortBy: string) => void` | **Sim**| Callback chamada quando o usuário altera a ordenação. |
| `platformSettings`| `PlatformSettings` | **Sim**| Objeto com as configurações da plataforma (para `itemsPerPage`). |
| `isLoading`| `boolean`| Não | Se `true`, exibe um indicador de carregamento. |
| `emptyStateMessage`| `string`| Não | Mensagem a ser exibida quando a lista de `items` está vazia. |
| `searchTypeLabel`| `string`| **Sim** | Rótulo para o tipo de item sendo exibido (ex: "lotes", "leilões"). |
| `currentPage`| `number` | **Sim**| O número da página atual. |
| `onPageChange`| `(page: number) => void` | **Sim**| Callback chamada quando o usuário muda de página. |
| `itemsPerPage`| `number` | **Sim**| O número de itens a serem exibidos por página. |
| `onItemsPerPageChange`| `(size: number) => void` | Não | Callback chamada se o usuário alterar o número de itens por página (não implementado na UI atual). |
