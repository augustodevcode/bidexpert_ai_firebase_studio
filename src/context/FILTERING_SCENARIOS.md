# Cenários de Teste (TDD) para o Componente de Filtro Reutilizável

## Funcionalidade: `BidExpertFilter.tsx`

**Objetivo:** Garantir que o componente de filtro funcione corretamente em diferentes contextos (leilões, lotes), que suas interações atualizem o estado corretamente, e que ele comunique as seleções ao componente pai através de callbacks.

---

### Cenário 1: Renderização Inicial com Filtros Padrão

*   **Dado:** O componente `BidExpertFilter` é renderizado na página de busca principal.
*   **Quando:** Nenhum `initialFilters` é fornecido.
*   **Então:** O componente DEVE exibir as seções de filtro padrão (ex: Categoria, Faixa de Preço, Localização).
*   **E:** O filtro de categoria DEVE estar marcado em "Todas as Categorias".
*   **E:** O slider de preço DEVE estar nos valores mínimo e máximo padrão.
*   **E:** Nenhum checkbox de localização ou comitente DEVE estar marcado.

**Exemplo de Verificação (Playwright):**
```javascript
await page.goto('/search');
await expect(page.getByRole('button', { name: 'Filtros' })).toBeVisible();

// Verifica o estado inicial
await expect(page.locator('input[type="radio"][value="TODAS"]')).toBeChecked();
await expect(page.locator('[role="slider"]')).toHaveAttribute('aria-valuenow', '0,500000');
```

---

### Cenário 2: Filtragem por Categoria e Preço

*   **Dado:** O usuário está na página de busca.
*   **Quando:** O usuário seleciona a categoria "Veículos" no filtro de rádio.
*   **E:** O usuário ajusta o slider de preço para uma faixa de "R$ 10.000" a "R$ 50.000".
*   **E:** O usuário clica no botão "Aplicar Filtros".
*   **Então:** A função `onFilterSubmit` DEVE ser chamada uma vez.
*   **E:** O objeto de filtros passado para `onFilterSubmit` DEVE conter: `{ category: 'veiculos', priceRange: [10000, 50000], ... }`.

**Exemplo de Verificação (Playwright):**
```javascript
// Simula a interação do usuário
await page.getByLabel('Veículos').check();
await page.locator('[role="slider"]').fill({ range: [10000, 50000] }); // Pseudo-código para slider
await page.getByRole('button', { name: 'Aplicar Filtros' }).click();

// A verificação seria feita no componente pai, mockando o callback.
// Em um teste E2E, verificaríamos se a lista de resultados foi atualizada.
await expect(page.locator('[data-ai-id^="lot-card-"]')).toHaveCount(expectedNumberOfResults);
```

---

### Cenário 3: Filtragem por Múltiplas Localizações

*   **Dado:** O usuário está na página de busca.
*   **Quando:** O usuário expande o filtro de "Localizações".
*   **E:** O usuário marca os checkboxes para "São Paulo - SP" e "Rio de Janeiro - RJ".
*   **E:** O usuário clica em "Aplicar Filtros".
*   **Então:** A função `onFilterSubmit` DEVE ser chamada com o objeto de filtros contendo `locations: ['São Paulo - SP', 'Rio de Janeiro - RJ']`.

**Exemplo de Verificação (Playwright):**
```javascript
await page.getByRole('button', { name: 'Localizações' }).click();
await page.getByLabel('São Paulo - SP').check();
await page.getByLabel('Rio de Janeiro - RJ').check();
await page.getByRole('button', { name: 'Aplicar Filtros' }).click();

// Verificar se os resultados contêm apenas itens dessas localidades.
```

---

### Cenário 4: Reset dos Filtros

*   **Dado:** O usuário aplicou vários filtros (ex: categoria, preço, localização).
*   **Quando:** O usuário clica no botão "Limpar Filtros".
*   **Então:** A função `onFilterReset` DEVE ser chamada.
*   **E:** O estado interno do `BidExpertFilter` DEVE retornar aos seus valores padrão (categoria "Todas", range de preço completo, nenhuma localização selecionada, etc.).

**Exemplo de Verificação (Playwright):**
```javascript
// Aplicar filtros primeiro
await page.getByLabel('Veículos').check();
await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
await expect(page.locator('[data-ai-id^="lot-card-"]')).toHaveCount(X); // X resultados

// Resetar
await page.getByRole('button', { name: 'Limpar Filtros' }).click();
await expect(page.locator('[data-ai-id^="lot-card-"]')).toHaveCount(Y); // Y > X, total de resultados
await expect(page.locator('input[type="radio"][value="TODAS"]')).toBeChecked();
```

---

### Cenário 5: Renderização em Contexto Específico (Venda Direta)

*   **Dado:** O `BidExpertFilter` é renderizado com a prop `filterContext="directSales"`.
*   **Quando:** O usuário visualiza o componente.
*   **Então:** A seção "Modalidade do Leilão" NÃO DEVE ser visível.
*   **E:** A seção "Tipo de Oferta" (com opções "Comprar Já", "Aceita Propostas") DEVE ser visível.

**Exemplo de Verificação (Playwright):**
```javascript
await page.goto('/direct-sales'); // Página que usa o contexto 'directSales'
await expect(page.getByRole('button', { name: 'Modalidade do Leilão' })).not.toBeVisible();
await expect(page.getByRole('button', { name: 'Tipo de Oferta' })).toBeVisible();
```

---

**Conclusão dos Testes:** Estes cenários garantem que o componente de filtro seja robusto, configurável e se comporte de maneira previsível em diferentes partes da aplicação, validando tanto a interação do usuário quanto a comunicação com os componentes pais.
