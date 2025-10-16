# Especificação de Componentes - `BidExpertFilter.tsx`

## 1. Visão Geral

O `BidExpertFilter` é um componente de cliente reutilizável, projetado para fornecer uma interface de filtragem consistente em várias páginas da plataforma, como a página de busca principal e páginas de categoria. Ele é totalmente configurável através de `props`, permitindo que cada página defina exatamente quais filtros são relevantes para seu contexto (leilões, lotes, etc.).

**Localização:** `src/components/BidExpertFilter.tsx`

---

## 2. Arquitetura e Props

O componente é projetado para ser "burro" (dumb component), o que significa que ele não realiza a filtragem dos dados por si só. Em vez disso, ele gerencia o estado interno dos controles do formulário (checkboxes, sliders, etc.) e, quando o usuário aplica os filtros, ele invoca uma `callback` (`onFilterSubmit`) passando um objeto com todos os filtros selecionados para o componente pai. O componente pai é o responsável por usar esses filtros para buscar ou refinar os dados exibidos.

### Props Principais (`BidExpertFilterProps`)

| Prop | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `categories` | `LotCategory[]` | Não | Uma lista de categorias para popular o filtro de categorias. |
| `locations` | `string[]` | Não | Uma lista de strings de localização (ex: "São Paulo - SP"). |
| `sellers` | `string[]` | Não | Uma lista de nomes de comitentes/vendedores. |
| `makes` | `VehicleMake[]` | Não | Lista de marcas de veículos para o filtro. |
| `models` | `VehicleModel[]`| Não | Lista de modelos de veículos para o filtro. |
| `modalities` | `{ value: string; label: string; }[]` | Não | Lista de modalidades de leilão. Possui um valor padrão se não fornecido. |
| `statuses` | `{ value: string; label: string; }[]` | Não | Lista de status. Possui um valor padrão com base no `filterContext`. |
| `onFilterSubmit` | `(filters: ActiveFilters) => void` | **Sim** | Função de callback chamada quando o usuário clica em "Aplicar Filtros". |
| `onFilterReset` | `() => void` | **Sim** | Função de callback chamada quando o usuário clica em "Limpar Filtros". |
| `initialFilters`| `ActiveFilters`| Não | Objeto com o estado inicial dos filtros, útil para sincronizar com parâmetros da URL. |
| `filterContext`| `'auctions' \| 'directSales' \| 'lots'`| Não | Define o contexto para exibir filtros específicos (ex: 'Tipo de Oferta' para `directSales`). |
| `disableCategoryFilter`| `boolean`| Não | Se `true`, desabilita a interação com o filtro de categoria (usado na página de categoria). |

### Estrutura de Filtros (`ActiveFilters`)

Este é o objeto que o `onFilterSubmit` retorna, contendo o estado atual de todos os filtros:

```typescript
export interface ActiveFilters {
  modality: string;
  category: string; 
  priceRange: [number, number];
  locations: string[];
  sellers: string[];
  makes: string[];
  models: string[];
  startDate?: Date;
  endDate?: Date;
  status: string[];
  offerType?: 'BUY_NOW' | 'ACCEPTS_PROPOSALS' | 'ALL';
}
```

---

## 3. Funcionalidades e Comportamento

*   **Renderização Condicional:** O componente exibe seções de filtro (acordeões) apenas se os dados relevantes forem passados via `props`. Por exemplo, o filtro "Comitentes" só aparece se a prop `sellers` contiver itens.
*   **Contexto de Filtro:** A prop `filterContext` adapta a interface, mostrando filtros de "Modalidade" para `auctions` e "Tipo de Oferta" para `directSales`.
*   **Estado Controlado e Não Controlado:** O estado interno dos filtros é gerenciado pelo `useState`. No entanto, ele é inicializado com `initialFilters`, permitindo que a página pai controle o estado inicial com base em parâmetros de URL, garantindo que links compartilhados funcionem corretamente.
*   **Componentes Reutilizáveis:** Utiliza os componentes de UI do `shadcn/ui` como `Accordion`, `Checkbox`, `Slider` e `RadioGroup` para construir a interface.
*   **Reset de Filtros:** O botão "Limpar Filtros" reseta o estado interno do componente para os valores padrão e chama a `onFilterReset`, permitindo que a página pai também limpe seus filtros e busque os dados originais.
*   **Esqueleto de Carregamento:** Para evitar saltos de layout (layout shift) enquanto as opções de filtro são carregadas de forma assíncrona, um componente de esqueleto (`BidExpertFilterSkeleton.tsx`) é exibido. O componente principal usa `useEffect` e `useState` para garantir que ele só seja renderizado no cliente.

---

## 4. Como Usar na Plataforma

### Exemplo 1: Página de Busca de Lotes (`/search` com `type=lots`)

Nesta página, queremos todos os filtros disponíveis.

```tsx
// Em SearchPage.tsx

// ...
const [allCategories, setAllCategories] = useState<LotCategory[]>([]);
// ... outros estados para locations, sellers, etc.

// Buscar todos os dados para os filtros
useEffect(() => {
  // ... lógica para buscar categories, locations, sellers ...
}, []);

const handleFilterChange = (newFilters: ActiveFilters) => {
  // Lógica para filtrar os lotes com base em `newFilters`
};

const handleReset = () => {
  // Lógica para resetar a busca para o estado inicial
}

return (
  <div className="grid md:grid-cols-[280px_1fr] gap-8">
    <aside>
      <BidExpertFilter
        categories={allCategories}
        locations={uniqueLocations}
        sellers={uniqueSellers}
        onFilterSubmit={handleFilterChange}
        onFilterReset={handleReset}
        initialFilters={activeFiltersFromUrl} // Ler da URL
        filterContext="lots"
      />
    </aside>
    <main>
      {/* ... exibir resultados ... */}
    </main>
  </div>
);
```

### Exemplo 2: Página de Categoria (`/category/[slug]`)

Nesta página, o filtro de categoria deve ser pré-selecionado e desabilitado.

```tsx
// Em CategoryDisplay.tsx

// ... (busca de dados similar) ...
const categorySlug = params.categorySlug;

const handleFilterChange = (newFilters: ActiveFilters) => {
  // `newFilters.category` será sempre o `categorySlug` da página
  // Aplicar os outros filtros (preço, localização, etc.)
};

return (
  <div className="grid md:grid-cols-[280px_1fr] gap-8">
    <aside>
      <BidExpertFilter
        categories={allCategories}
        locations={uniqueLocationsForCategory}
        sellers={uniqueSellersForCategory}
        onFilterSubmit={handleFilterChange}
        onFilterReset={handleReset}
        initialFilters={{ ...initialFiltersState, category: categorySlug }}
        filterContext="lots"
        disableCategoryFilter={true} // A prop chave para este cenário
      />
    </aside>
    <main>
      {/* ... exibir resultados ... */}
    </main>
  </div>
);
```

---

**Conclusão:** O `BidExpertFilter` centraliza a complexidade da UI de filtragem, promovendo a reutilização de código e garantindo uma experiência de usuário padronizada e robusta em toda a aplicação.
