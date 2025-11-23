# Implementação de Logging e Validação em CRUDs

## 📋 Visão Geral

Este documento descreve a implementação de um sistema abrangente de logging de ações do usuário e validação de formulários para todos os módulos CRUD do BidExpert.

## 🎯 Objetivos

1. **Logging de Ações**: Registrar todas as interações do usuário para facilitar debugging e testes com Playwright
2. **Validação Visual**: Adicionar botão de validação em todos os formulários CRUD
3. **Performance**: Implementação otimizada e reutilizável
4. **Consistência**: Padrão uniforme em todos os módulos

## 📦 Componentes Criados

### 1. User Action Logger (`src/lib/user-action-logger.ts`)

Sistema de logging client-side para todas as ações do usuário.

**Categorias de Log:**
- `navigation`: Navegação entre páginas/seções
- `form`: Ações em formulários
- `selection`: Seleção de entidades
- `crud`: Operações CRUD
- `validation`: Validações
- `interaction`: Interações gerais
- `error`: Erros

**Funções de Conveniência:**
```typescript
import { 
  logNavigation,
  logFormAction,
  logSelection,
  logCrudAction,
  logValidation,
  logInteraction,
  logError 
} from '@/lib/user-action-logger';

// Exemplos de uso
logSelection('process selected', { id: '123', name: 'Processo ABC' }, 'Judicial Processes');
logFormAction('field changed: auctionTitle', { value: 'New Title' }, 'Auctions');
logCrudAction('auction created', { id: 'xyz' }, 'Auctions');
```

**Recursos:**
- Logs coloridos no console por categoria
- Armazenamento em memória (últimos 500 logs)
- Exportação para JSON
- Acessível via `window.__userActionLogger` no console do navegador
- Atributos data-* no DOM para detecção pelo Playwright

### 2. Form Validator (`src/lib/form-validator.ts`)

Validador de formulários baseado em Zod Schema.

**Funcionalidades:**
- Validação completa contra schema Zod
- Estatísticas de campos (total, preenchidos, válidos, inválidos)
- Lista de campos obrigatórios faltando
- Conversão de erros do React Hook Form
- Formatação de sumário de validação

**Exemplo:**
```typescript
import { validateFormData, formatValidationSummary } from '@/lib/form-validator';

const result = validateFormData(formData, schema);
console.log(formatValidationSummary(result));
```

### 3. Form Validation Check Hook (`src/hooks/use-form-validation-check.ts`)

Hook React para validação em tempo real.

**API:**
```typescript
const {
  validationResult,      // Resultado da última validação
  isChecking,           // Estado de carregamento
  lastCheckTime,        // Timestamp da última verificação
  performValidationCheck, // Executar validação
  showValidationSummary,  // Mostrar sumário no console
  getValidationProgress,  // Obter % de progresso
  isReadyToSubmit,       // Verificar se está pronto
} = useFormValidationCheck({
  form,
  schema,
  moduleName: 'Auctions',
  autoValidate: false, // Validar automaticamente em mudanças
});
```

### 4. Validation Check Button (`src/components/crud/validation-check-button.tsx`)

Botão visual para disparar validação.

**Recursos:**
- Dialog com resultados detalhados
- Barra de progresso visual
- Lista de campos obrigatórios faltando
- Lista de erros de validação
- Modo inline ou dialog
- Estatísticas de campos

**Exemplo:**
```tsx
<ValidationCheckButton 
  onCheck={validation.performValidationCheck}
  variant="outline"
  size="default"
  showInline={false}
/>
```

### 5. Enhanced CRUD Form Hook (`src/hooks/use-enhanced-crud-form.ts`)

Hook combinado com logging e validação integrados.

**Exemplo:**
```typescript
const { form, handleSubmit, isSubmitting, validation } = useEnhancedCrudForm({
  schema: auctionFormSchema,
  onSubmitAction: saveAuction,
  moduleName: 'Auctions',
  defaultValues: initialData,
  autoValidate: false,
});
```

### 6. Logged Entity Selector (`src/components/common/logged-entity-selector.tsx`)

EntitySelector com logging automático.

**Exemplo:**
```tsx
<LoggedEntitySelector
  value={selectedProcessId}
  onValueChange={setSelectedProcessId}
  options={processes}
  label="Processo Judicial"
  moduleName="Auctions"
  entityType="process"
/>
```

### 7. Form Logging Helpers (`src/lib/form-logging-helpers.ts`)

Funções auxiliares para adicionar logging a handlers existentes.

**Funções:**
```typescript
// Wrap handlers com logging
const handleChange = withLogging(onChange, 'fieldName', 'ModuleName');

// Handlers específicos
loggedSelectChange(onChange, 'categoryId', 'Lots', categoryOptions);
loggedInputChange(onChange, 'title', 'Auctions');
loggedSwitchChange(onChange, 'isActive', 'Settings');
loggedButtonClick(onClick, 'Add Stage', 'Auctions');

// Adicionar logging a todos os campos do form
useEffect(() => {
  const unsubscribe = addFormFieldLogging(form, 'Auctions', ['title', 'description']);
  return unsubscribe;
}, [form]);

// Log navegação de seções
logSectionChange('Informações Gerais', 'Auctions');
logTabChange('Configurações', 'Auctions');
```

## 🔨 Guia de Implementação

### Passo 1: Atualizar Hooks de Formulário

Para formulários existentes, substituir `useCrudForm` por `useEnhancedCrudForm`:

**Antes:**
```typescript
const { form, handleSubmit, isSubmitting } = useCrudForm({
  schema: lotFormSchema,
  onSubmitAction: saveLot,
  defaultValues: initialData,
});
```

**Depois:**
```typescript
const { form, handleSubmit, isSubmitting, validation } = useEnhancedCrudForm({
  schema: lotFormSchema,
  onSubmitAction: saveLot,
  moduleName: 'Lots',
  defaultValues: initialData,
  autoValidate: false, // true para validação automática
});
```

### Passo 2: Adicionar Botão de Validação

Atualizar `CrudFormActions` para incluir o botão de validação:

```tsx
<CrudFormActions
  isSubmitting={isSubmitting}
  onSave={handleSubmit}
  onCancel={handleCancel}
  onValidationCheck={validation.performValidationCheck}
  showValidation={true}
/>
```

### Passo 3: Adicionar Logging a Seletores

Substituir `EntitySelector` por `LoggedEntitySelector`:

**Antes:**
```tsx
<EntitySelector
  value={categoryId}
  onValueChange={setCategoryId}
  options={categories}
  label="Categoria"
/>
```

**Depois:**
```tsx
<LoggedEntitySelector
  value={categoryId}
  onValueChange={setCategoryId}
  options={categories}
  label="Categoria"
  moduleName="Lots"
  entityType="category"
/>
```

### Passo 4: Adicionar Logging a Interações

Para accordion, tabs e outros componentes interativos:

```tsx
import { logSectionChange, logTabChange } from '@/lib/form-logging-helpers';

<AccordionItem value="general">
  <AccordionTrigger onClick={() => logSectionChange('Informações Gerais', 'Auctions')}>
    Informações Gerais
  </AccordionTrigger>
  {/* ... */}
</AccordionItem>

<Tabs onValueChange={(value) => logTabChange(value, 'Settings')}>
  {/* ... */}
</Tabs>
```

### Passo 5: Logging de Navegação

Em páginas de listagem e navegação:

```typescript
import { logNavigation } from '@/lib/user-action-logger';

useEffect(() => {
  logNavigation('Auctions list page loaded', { count: auctions.length }, 'Auctions');
}, [auctions]);

const handleRowClick = (auctionId: string) => {
  logNavigation('Navigate to auction details', { auctionId }, 'Auctions');
  router.push(`/admin/auctions/${auctionId}`);
};
```

## 📊 Módulos a Implementar

### Ordem de Prioridade

1. ✅ **Leilões (Auctions)** - Base implementada
2. ✅ **Lotes (Lots)** - Base implementada
3. ⏳ **Tenants** - Pendente
4. ⏳ **Comitentes (Sellers)** - Pendente
5. ⏳ **Tribunais (Courts)** - Pendente
6. ⏳ **Varas (Judicial Branches)** - Pendente
7. ⏳ **Comarcas (Judicial Districts)** - Pendente
8. ⏳ **Usuários (Users)** - Pendente
9. ⏳ **Processos Judiciais (Judicial Processes)** - Pendente
10. ⏳ **Leiloeiros (Auctioneers)** - Pendente
11. ⏳ **Categorias (Categories)** - Pendente
12. ⏳ **Subcategorias (Subcategories)** - Pendente
13. ⏳ **Estados (States)** - Pendente
14. ⏳ **Cidades (Cities)** - Pendente
15. ⏳ **Ativos (Assets)** - Pendente

### Checklist por Módulo

Para cada módulo, seguir:

- [ ] Atualizar form para usar `useEnhancedCrudForm`
- [ ] Adicionar botão de validação no `CrudFormActions`
- [ ] Substituir `EntitySelector` por `LoggedEntitySelector`
- [ ] Adicionar logging de navegação de seções/tabs
- [ ] Adicionar logging de navegação entre páginas
- [ ] Testar validação manual
- [ ] Criar testes Playwright
- [ ] Atualizar documentação BDD/TDD

## 🧪 Testando com Playwright

### Detectar Última Ação

```typescript
// playwright test
const lastAction = await page.getAttribute('body', 'data-last-action');
expect(lastAction).toBe('process selected');
```

### Aguardar Ação Específica

```typescript
await page.waitForFunction(
  (expectedAction) => {
    return document.body.getAttribute('data-last-action') === expectedAction;
  },
  'auction created'
);
```

### Verificar Logs no Console

```typescript
const logs: string[] = [];
page.on('console', msg => {
  if (msg.text().includes('[FORM]') || msg.text().includes('[SELECTION]')) {
    logs.push(msg.text());
  }
});

// Verificar se houve log específico
expect(logs.some(log => log.includes('process selected'))).toBeTruthy();
```

### Acessar Logger no Navegador

```typescript
const validationResult = await page.evaluate(() => {
  const logger = (window as any).__userActionLogger;
  return logger.getLogs({ category: 'validation' });
});
```

## 🎨 UI/UX

### Botão de Validação

- Posicionado junto aos botões de ação (Salvar/Cancelar)
- Variant: `outline` para não competir visualmente com botão Salvar
- Icon: `ClipboardCheck`
- Label: "Validar Formulário"

### Dialog de Resultados

- Barra de progresso visual
- Cards com estatísticas
- Alert para campos obrigatórios faltando
- ScrollArea para lista de erros
- Código de cores: verde (sucesso), vermelho (erro)

## 📈 Performance

### Otimizações Implementadas

1. **Lazy Validation**: Validação sob demanda, não automática por padrão
2. **Memoization**: Resultados de validação memoizados
3. **Debouncing**: Auto-validação com debounce quando habilitada
4. **Log Limit**: Máximo de 500 logs em memória
5. **Selective Logging**: Opção de logar apenas campos específicos

### Recomendações

- Usar `autoValidate: false` em formulários complexos
- Habilitar `autoValidate: true` apenas em formulários pequenos
- Usar `fieldsToLog` para limitar logging em forms com muitos campos
- Limpar logs periodicamente em testes longos

## 🔍 Debug e Troubleshooting

### Console do Navegador

```javascript
// Ver todos os logs
window.__userActionLogger.getLogs()

// Ver logs de uma categoria
window.__userActionLogger.getLogs({ category: 'validation' })

// Ver logs de um módulo
window.__userActionLogger.getLogs({ module: 'Auctions' })

// Ver logs desde um tempo
window.__userActionLogger.getLogs({ since: new Date('2024-01-01') })

// Exportar logs
console.log(window.__userActionLogger.export())

// Limpar logs
window.__userActionLogger.clear()

// Desabilitar logging
window.__userActionLogger.setEnabled(false)
```

### Playwright Debug

```typescript
// Em teste Playwright
const allLogs = await page.evaluate(() => {
  return (window as any).__userActionLogger.export();
});
console.log('All user actions:', allLogs);
```

## 📝 Convenções de Nomenclatura

### Mensagens de Log

**Pattern**: `{action} {entity/field} {identifier}`

**Exemplos:**
- `"process selected xxx"` - Seleção de entidade
- `"field changed: auctionTitle"` - Mudança de campo
- `"auction created"` - CRUD create
- `"form validation check performed"` - Validação
- `"section opened: Informações Gerais"` - Navegação

### Module Names

Usar nomes descritivos e consistentes:
- `"Auctions"`, `"Lots"`, `"Tenants"`, `"Users"`
- `"Judicial Processes"`, `"Judicial Branches"`
- `"Asset Form"`, `"Auction Form"`

## 🚀 Próximos Passos

1. Implementar em todos os módulos pendentes
2. Criar testes Playwright para cada módulo
3. Atualizar documentação BDD com cenários de validação
4. Criar documentação TDD com casos de teste
5. Adicionar métricas de uso do sistema de validação
6. Implementar dashboard de logs (futuro)

## 📚 Arquivos de Referência

- `src/lib/user-action-logger.ts` - Sistema de logging
- `src/lib/form-validator.ts` - Validador de formulários
- `src/lib/form-logging-helpers.ts` - Helpers de logging
- `src/hooks/use-enhanced-crud-form.ts` - Hook principal
- `src/hooks/use-form-validation-check.ts` - Hook de validação
- `src/components/crud/validation-check-button.tsx` - Botão de validação
- `src/components/crud/crud-form-actions.tsx` - Ações do form (atualizado)
- `src/components/common/logged-entity-selector.tsx` - Selector com logging
