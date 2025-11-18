# 🎯 GUIA DE USO - COMPONENTES COM CLASSNAMES CONTEXTUALIZADOS

**Data:** 17 Nov 2025  
**Versão:** 1.0.0  
**Objetivo:** Facilitar uso de componentes em testes Playwright e desenvolvimento

---

## 📚 ÍNDICE

1. [Convenção de ClassNames](#convenção-de-classnames)
2. [Usando em Componentes](#usando-em-componentes)
3. [Seletores Playwright](#seletores-playwright)
4. [Boas Práticas](#boas-práticas)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Troubleshooting](#troubleshooting)

---

## 📋 Convenção de ClassNames

Todos os componentes seguem uma **convenção simples e consistente**:

### Padrão: `[componente]-[seção]-[elemento]`

```typescript
// Container principal
.admin-settings-panel-container

// Subsecção
.admin-settings-softclose-section

// Elemento dentro da subsecção
.admin-settings-softclose-toggle
.admin-settings-softclose-checkbox
.admin-settings-softclose-label
.admin-settings-softclose-text
```

### Regras:
1. Use **kebab-case** (hífen, não underscore)
2. Comece com o **nome do componente** (AdminSettingsPanel → `admin-settings-panel`)
3. Adicione a **seção** (softclose, blockchain, pwa, integrations)
4. Termine com o **tipo de elemento** (container, toggle, input, button, etc)

---

## 🎨 Usando em Componentes

### ✅ CORRETO

```tsx
export function MyAdminComponent() {
  return (
    <div className="my-admin-component-container">
      {/* Seção principal */}
      <div className="my-admin-component-settings">
        <h2 className="my-admin-component-settings-title">Configurações</h2>
        
        {/* Toggle */}
        <label className="my-admin-component-settings-toggle">
          <input
            type="checkbox"
            className="my-admin-component-settings-checkbox"
            data-testid="my-admin-toggle"
          />
          <span className="my-admin-component-settings-text">Ativar</span>
        </label>
        
        {/* Button */}
        <button
          className="my-admin-component-settings-button"
          data-testid="my-admin-save-button"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
```

### ❌ ERRADO

```tsx
// Não use nomes genéricos
<div className="container"> ❌
<div className="btn primary"> ❌
<input className="input"> ❌

// Não use underscore
<div className="admin_settings_panel"> ❌

// Não use camelCase
<div className="adminSettingsPanel"> ❌
```

---

## 🧪 Seletores Playwright

### Usando classNames

```typescript
// Selecionar por className exato
const container = page.locator('.admin-settings-panel-container');

// Selecionar por className com wildcard
const allToggles = page.locator('[class*="admin-settings"][class*="toggle"]');

// Selecionar por tag + className
const settingsButtons = page.locator('button.admin-settings-button');

// Usar has-text para combinar com conteúdo
const softCloseLabel = page.locator('.admin-settings-softclose-label:has-text("Soft Close")');
```

### Usando data-testid (PREFERIDO)

```typescript
// Mais confiável e direto
const toggle = page.locator('[data-testid="softclose-enabled-toggle"]');
const button = page.locator('[data-testid="softclose-extend-button"]');
const input = page.locator('[data-testid="integrations-fipe-plate-input"]');

// Esperar por elemento
await page.waitForSelector('[data-testid="admin-settings-container"]');

// Verificar visibilidade
await expect(page.locator('[data-testid="admin-settings-container"]')).toBeVisible();
```

### Combinando seletores

```typescript
// Encontrar button dentro de admin-settings
const button = page.locator('.admin-settings-container button.admin-settings-button');

// Encontrar toggle + verificar status
const toggle = page.locator('[data-testid="softclose-enabled-toggle"]');
const status = page.locator('.admin-settings-softclose-status:has-text("Ativado")');

// Listar todos os elementos
const allRows = page.locator('.audit-logs-viewer-table-row');
const rowCount = await allRows.count();
```

---

## 💡 Boas Práticas

### 1. Sempre adicionar data-testid

```tsx
// ✅ BOM - tem data-testid
<input
  className="my-component-input"
  data-testid="my-component-input"
  onChange={handleChange}
/>

// ⚠️ RUIM - sem data-testid
<input className="my-component-input" onChange={handleChange} />
```

### 2. Manter consistência

```tsx
// ✅ BOM - padrão consistente
.admin-settings-softclose-toggle
.admin-settings-blockchain-toggle
.admin-settings-lawyer-toggle

// ❌ RUIM - inconsistente
.softclose-toggle
.blockchain-admin-toggle
.toggle-lawyer-settings
```

### 3. Evitar classNames muito profundos

```tsx
// ✅ BOM - 3 níveis (componente-seção-elemento)
<div className="my-component-section-element">

// ⚠️ RUIM - muito profundo
<div className="my-component-section-subsection-element-type">
```

### 4. Agrupar por funcionalidade

```tsx
// ✅ BOM - agrupado por seção
<section className="admin-settings-softclose-section">
  <label className="admin-settings-softclose-label">
    <input className="admin-settings-softclose-checkbox" />
  </label>
  <span className="admin-settings-softclose-status" />
</section>

// ❌ RUIM - espalhado
<label className="admin-softclose-label">
  <input className="admin-checkbox-softclose" />
</label>
<span className="softclose-status-admin" />
```

### 5. Usar roles semânticas

```tsx
// ✅ BOM - roles semânticas
<button className="admin-settings-button" role="button">
<input className="admin-settings-checkbox" role="checkbox" />
<div className="admin-settings-container" role="region">

// ⚠️ RUIM - sem roles
<div className="admin-settings-button" onClick={handleClick}>
<span className="admin-settings-checkbox" onClick={handleToggle}>
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Criar novo componente

```tsx
// src/components/admin/my-new-settings.tsx

'use client';

interface MyNewSettingsProps {
  tenantId: string;
}

export function MyNewSettings({ tenantId }: MyNewSettingsProps) {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  return (
    <div
      className="my-new-settings-container space-y-4 p-6"
      data-testid="my-new-settings-container"
    >
      <h2 className="my-new-settings-title text-2xl font-bold">
        Minha Nova Funcionalidade
      </h2>

      <div className="my-new-settings-toggle-section border-t pt-4">
        <h3 className="my-new-settings-toggle-title text-lg font-semibold">
          Configuração Principal
        </h3>
        
        <label className="my-new-settings-toggle-label flex items-center gap-2">
          <input
            type="checkbox"
            className="my-new-settings-toggle-checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            data-testid="my-new-settings-toggle"
          />
          <span className="my-new-settings-toggle-text">Ativar Feature</span>
        </label>

        <button
          className="my-new-settings-save-button px-4 py-2 bg-blue-500 text-white rounded mt-4"
          onClick={async () => {
            setLoading(true);
            // fazer algo
            setLoading(false);
          }}
          disabled={loading}
          data-testid="my-new-settings-save-button"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
```

### Exemplo 2: Teste Playwright

```typescript
// tests/e2e/my-new-settings.spec.ts

import { test, expect } from '@playwright/test';

test.describe('MyNewSettings Component', () => {
  test('should toggle feature', async ({ page }) => {
    // Navegar
    await page.goto('http://localhost:9005/admin/my-settings');

    // Aguardar componente
    await expect(page.locator('[data-testid="my-new-settings-container"]')).toBeVisible();

    // Ativar feature
    const toggle = page.locator('[data-testid="my-new-settings-toggle"]');
    await toggle.click();

    // Verificar
    await expect(toggle).toBeChecked();

    // Salvar
    await page.click('[data-testid="my-new-settings-save-button"]');

    // Verificar sucesso
    await expect(page.locator('[data-testid="my-new-settings-save-button"]:not(:disabled)')).toBeVisible();
  });

  test('should disable save button while loading', async ({ page }) => {
    await page.goto('http://localhost:9005/admin/my-settings');
    
    const button = page.locator('[data-testid="my-new-settings-save-button"]');
    
    await button.click();
    
    // Verificar que ficou desabilitado
    await expect(button).toBeDisabled();
  });
});
```

### Exemplo 3: Encontrar elementos em testes

```typescript
// Procurar elemento específico
const softCloseToggle = page.locator('[data-testid="softclose-enabled-toggle"]');

// Procurar vários elementos
const allToggles = page.locator('[data-testid*="toggle"]');

// Procurar por className
const adminContainers = page.locator('[class*="admin-settings-container"]');

// Procurar por combinação
const auditLogsButton = page.locator(
  '.audit-logs-viewer-container [data-testid="audit-logs-cleanup-button"]'
);

// Com delays
await page.waitForSelector('[data-testid="admin-settings-container"]', { timeout: 5000 });

// Com retry
const toggle = page.locator('[data-testid="softclose-enabled-toggle"]').first();
```

---

## 🔧 Troubleshooting

### Problema: Elemento não encontrado

```typescript
// ❌ ERRADO
await page.click('.admin-settings-toggle');

// ✅ CORRETO - usar data-testid
await page.click('[data-testid="softclose-enabled-toggle"]');

// ✅ ALTERNATIVA - usar className completo
await page.click('.admin-settings-softclose-toggle');
```

### Problema: Seletor muito genérico

```typescript
// ❌ ERRADO - pode achar múltiplos
const toggle = page.locator('.toggle');

// ✅ CORRETO - específico
const toggle = page.locator('[data-testid="softclose-enabled-toggle"]');

// ✅ ALTERNATIVA - combinação
const toggle = page.locator('.admin-settings-softclose-toggle').first();
```

### Problema: Elemento desaparece após interação

```typescript
// ❌ ERRADO - não aguarda
await page.click('[data-testid="save-button"]');
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

// ✅ CORRETO - aguarda mudança
await page.click('[data-testid="save-button"]');
await page.waitForSelector('[data-testid="success-message"]');
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
```

### Problema: Elemento dentro de modal/dropdown

```typescript
// ❌ ERRADO - não encontra se estiver oculto
const menuItem = page.locator('.my-component-menu-item');

// ✅ CORRETO - clica primeiro para revelar
await page.click('[data-testid="open-menu-button"]');
await page.click('[data-testid="my-component-menu-item"]');

// ✅ ALTERNATIVA - usar aria-label
const menuItem = page.locator('[aria-label="Delete Item"]');
```

---

## 📖 Referência Rápida

```typescript
// Esperar por elemento
await page.waitForSelector('[data-testid="element-id"]');

// Clicar
await page.click('[data-testid="button-id"]');

// Preencher input
await page.fill('[data-testid="input-id"]', 'valor');

// Selecionar option
await page.selectOption('[data-testid="select-id"]', 'value');

// Verificar visibilidade
await expect(page.locator('[data-testid="element-id"]')).toBeVisible();

// Verificar checkbox
await expect(page.locator('[data-testid="checkbox-id"]')).toBeChecked();

// Contar elementos
const count = await page.locator('[data-testid*="item"]').count();

// Obter valor
const value = await page.locator('[data-testid="input-id"]').inputValue();

// Obter texto
const text = await page.locator('[data-testid="label-id"]').textContent();
```

---

## ✅ Checklist para Novos Componentes

- [ ] Componente tem `data-testid` no container principal
- [ ] Todos os elementos interativos têm `data-testid`
- [ ] ClassNames seguem a convenção `componente-seção-elemento`
- [ ] Sem classNames genéricos (container, btn, input, etc)
- [ ] Documentado no arquivo de componente
- [ ] Exemplos de testes inclusos
- [ ] Sem erros de TypeScript
- [ ] ESLint aprovado

---

**Desenvolvido com ❤️ para facilitar testes e manutenção do código.**
