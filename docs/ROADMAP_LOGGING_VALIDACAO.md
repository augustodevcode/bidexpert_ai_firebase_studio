# Roadmap de Implementação - Logging e Validação

## 📊 Status Geral

### ✅ Componentes Base Criados (100%)

1. **Sistema de Logging**
   - ✅ `src/lib/user-action-logger.ts` - Logger principal
   - ✅ `src/lib/form-logging-helpers.ts` - Helpers de logging
   - ✅ `src/components/common/logged-entity-selector.tsx` - Selector com logging

2. **Sistema de Validação**
   - ✅ `src/lib/form-validator.ts` - Validador de formulários
   - ✅ `src/hooks/use-form-validation-check.ts` - Hook de validação
   - ✅ `src/components/crud/validation-check-button.tsx` - Botão de validação

3. **Hooks Integrados**
   - ✅ `src/hooks/use-crud-form.ts` - Atualizado com logging
   - ✅ `src/hooks/use-enhanced-crud-form.ts` - Hook combinado

4. **Componentes CRUD Atualizados**
   - ✅ `src/components/crud/crud-form-actions.tsx` - Com botão de validação

5. **Documentação**
   - ✅ `docs/IMPLEMENTACAO_LOGGING_VALIDACAO.md` - Guia completo
   - ✅ `docs/EXEMPLO_TENANT_LOGGING_VALIDACAO.md` - Exemplo prático
   - ✅ `docs/BDD_LOGGING_VALIDACAO.md` - Especificações BDD
   - ✅ `docs/TDD_LOGGING_VALIDACAO.md` - Casos de teste TDD

6. **Testes**
   - ✅ `tests/logging-validation.spec.ts` - Testes Playwright

---

## 📋 Módulos para Implementação

### Fase 1: Módulos Prioritários (Semana 1)

#### 1.1 Leilões (Auctions) ⏳
**Status**: Parcialmente implementado
**Arquivos**:
- `src/app/admin/auctions/auction-form.tsx`
- `src/app/admin/auctions/page.tsx`

**Tarefas**:
- [ ] Substituir `useForm` por `useEnhancedCrudForm`
- [ ] Adicionar `ValidationCheckButton` no formulário
- [ ] Substituir `EntitySelector` por `LoggedEntitySelector`
- [ ] Adicionar logging de navegação entre accordion sections
- [ ] Adicionar logging em mudanças de tabs/stages
- [ ] Testar com Playwright
- [ ] Atualizar testes existentes

**Estimativa**: 4 horas

#### 1.2 Lotes (Lots) ⏳
**Status**: Estrutura existente
**Arquivos**:
- `src/app/admin/lots/lot-form.tsx`
- `src/app/admin/lots/page.tsx`

**Tarefas**:
- [ ] Refatorar `useForm` para `useEnhancedCrudForm`
- [ ] Integrar `ValidationCheckButton`
- [ ] Implementar `LoggedEntitySelector` para processo, categoria, leilão
- [ ] Logging de seleção de ativos
- [ ] Logging de mudanças em configurações
- [ ] Testes Playwright
- [ ] Validação de campos complexos (array de ativos)

**Estimativa**: 5 horas

#### 1.3 Tenants 🆕
**Status**: Novo (exemplo criado)
**Arquivos**:
- Criar `src/app/admin/tenants/tenant-form-schema.ts`
- Criar `src/app/admin/tenants/tenant-form.tsx`
- Atualizar `src/app/admin/tenants/page.tsx`
- Criar `src/app/admin/tenants/new/page.tsx`
- Criar `src/app/admin/tenants/[tenantId]/edit/page.tsx`
- Criar `src/app/admin/tenants/actions.ts`

**Tarefas**:
- [ ] Criar schema Zod completo
- [ ] Implementar formulário com logging e validação
- [ ] Página de criação
- [ ] Página de edição
- [ ] Actions para CRUD
- [ ] Testes Playwright completos

**Estimativa**: 6 horas

### Fase 2: Módulos de Relacionamentos (Semana 2)

#### 2.1 Comitentes/Sellers ⏳
**Status**: Parcial
**Arquivos**:
- `src/app/admin/sellers/seller-form.tsx`
- `src/app/admin/sellers/page.tsx`

**Estimativa**: 4 horas

#### 2.2 Leiloeiros (Auctioneers) ⏳
**Status**: Parcial
**Arquivos**:
- `src/app/admin/auctioneers/auctioneer-form.tsx`
- `src/app/admin/auctioneers/page.tsx`

**Estimativa**: 4 horas

#### 2.3 Processos Judiciais ⏳
**Status**: Estrutura existente
**Arquivos**:
- Forms em `src/app/admin/judicial-processes/`

**Estimativa**: 5 horas

### Fase 3: Módulos Administrativos (Semana 3)

#### 3.1 Usuários (Users) ⏳
**Status**: Formulário complexo existente
**Arquivos**:
- `src/app/admin/users/user-form.tsx`
- `src/app/admin/users/user-role-form.tsx`
- `src/app/admin/users/page.tsx`

**Tarefas Especiais**:
- [ ] Logging de mudanças de roles
- [ ] Logging de mudanças de permissões
- [ ] Validação de senha
- [ ] Validação de email único

**Estimativa**: 6 horas

#### 3.2 Tribunais (Courts) 📝
**Status**: Simples
**Estimativa**: 3 horas

#### 3.3 Varas (Judicial Branches) 📝
**Status**: Simples
**Estimativa**: 3 horas

#### 3.4 Comarcas (Judicial Districts) 📝
**Status**: Simples
**Estimativa**: 3 horas

### Fase 4: Módulos de Dados Mestres (Semana 4)

#### 4.1 Categorias e Subcategorias 📝
**Estimativa**: 4 horas

#### 4.2 Estados e Cidades 📝
**Estimativa**: 3 horas

#### 4.3 Marcas e Modelos de Veículos 📝
**Estimativa**: 3 horas

### Fase 5: Módulo de Ativos (Semana 5)

#### 5.1 Ativos (Assets) 🔥
**Status**: Formulário mais complexo
**Arquivos**:
- `src/app/admin/assets/asset-form-v2.tsx`
- `src/app/admin/assets/page.tsx`

**Tarefas Especiais**:
- [ ] Logging de mudanças de tipo de ativo
- [ ] Logging de campos específicos por tipo
- [ ] Validação condicional por tipo
- [ ] Logging de upload de mídia
- [ ] Testes extensivos

**Estimativa**: 8 horas

---

## 🎯 Checklist por Módulo

Para cada módulo, seguir este checklist:

### Implementação
- [ ] Schema Zod criado/atualizado
- [ ] Form atualizado para `useEnhancedCrudForm`
- [ ] `ValidationCheckButton` adicionado
- [ ] `EntitySelector` substituído por `LoggedEntitySelector`
- [ ] Logging de navegação (sections/tabs)
- [ ] Logging de interações especiais
- [ ] Tratamento de erros com logging

### Páginas
- [ ] Lista com logging de navegação
- [ ] Criação com logging completo
- [ ] Edição com logging completo
- [ ] Exclusão com logging (se aplicável)

### Testes
- [ ] Testes Playwright criados
- [ ] Testes de logging verificados
- [ ] Testes de validação verificados
- [ ] Testes de CRUD completos

### Documentação
- [ ] README do módulo atualizado
- [ ] Cenários BDD documentados
- [ ] Casos TDD documentados

---

## 📈 Métricas de Progresso

### Total de Módulos: 15

- ✅ **Implementação Base**: 100% (6/6 componentes)
- ⏳ **Leilões**: 20% (estrutura existe)
- ⏳ **Lotes**: 20% (estrutura existe)
- 🆕 **Tenants**: 0% (exemplo pronto)
- 🆕 **Sellers**: 10%
- 🆕 **Auctioneers**: 10%
- 🆕 **Judicial Processes**: 10%
- 🆕 **Users**: 10%
- 🆕 **Courts**: 0%
- 🆕 **Judicial Branches**: 0%
- 🆕 **Judicial Districts**: 0%
- 🆕 **Categories**: 0%
- 🆕 **States/Cities**: 0%
- 🆕 **Vehicle Data**: 0%
- 🆕 **Assets**: 10%

**Progresso Geral**: ~15%

---

## 🚀 Plano de Execução

### Semana 1 (40h)
- Dia 1-2: Leilões (8h)
- Dia 3-4: Lotes (10h)
- Dia 5: Tenants (8h)
- Buffer: 14h para ajustes e testes

### Semana 2 (40h)
- Dia 1-2: Sellers + Auctioneers (16h)
- Dia 3-4: Judicial Processes (10h)
- Dia 5: Revisão e testes (8h)
- Buffer: 6h

### Semana 3 (40h)
- Dia 1-2: Users (12h)
- Dia 3: Courts + Branches (12h)
- Dia 4: Districts (6h)
- Dia 5: Testes integrados (8h)
- Buffer: 2h

### Semana 4 (40h)
- Dia 1-2: Categories/Subcategories (8h)
- Dia 3: States/Cities (6h)
- Dia 4: Vehicle Data (6h)
- Dia 5: Revisão geral (8h)
- Buffer: 12h

### Semana 5 (40h)
- Dia 1-3: Assets (24h)
- Dia 4: Testes finais todos módulos (8h)
- Dia 5: Documentação final (8h)

**Total**: ~200h (5 semanas)

---

## 🔧 Scripts de Automação

### Script de Validação de Implementação

```bash
#!/bin/bash
# validate-logging-implementation.sh

echo "Validando implementação de logging e validação..."

# Check if all required files exist
FILES=(
  "src/lib/user-action-logger.ts"
  "src/lib/form-validator.ts"
  "src/lib/form-logging-helpers.ts"
  "src/hooks/use-form-validation-check.ts"
  "src/hooks/use-enhanced-crud-form.ts"
  "src/components/crud/validation-check-button.tsx"
  "src/components/common/logged-entity-selector.tsx"
)

missing=0
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    missing=$((missing + 1))
  else
    echo "✅ Found: $file"
  fi
done

if [ $missing -eq 0 ]; then
  echo ""
  echo "✅ Todos os arquivos base estão presentes!"
else
  echo ""
  echo "❌ Faltam $missing arquivos base"
  exit 1
fi

# Run type checking
echo ""
echo "Verificando tipos TypeScript..."
npx tsc --noEmit

# Run tests
echo ""
echo "Executando testes..."
npm run test:logging

echo ""
echo "Validação concluída!"
```

### Script de Geração de Template

```bash
#!/bin/bash
# generate-module-template.sh

MODULE_NAME=$1
if [ -z "$MODULE_NAME" ]; then
  echo "Uso: ./generate-module-template.sh <module-name>"
  exit 1
fi

echo "Gerando template para módulo: $MODULE_NAME"

# Create directories
mkdir -p "src/app/admin/$MODULE_NAME"
mkdir -p "tests/$MODULE_NAME"

# Generate schema template
cat > "src/app/admin/$MODULE_NAME/${MODULE_NAME}-form-schema.ts" << 'EOF'
import { z } from 'zod';

export const {{MODULE}}FormSchema = z.object({
  // Define your fields here
});

export type {{MODULE}}FormValues = z.infer<typeof {{MODULE}}FormSchema>;
EOF

# Generate form template
cat > "src/app/admin/$MODULE_NAME/${MODULE_NAME}-form.tsx" << 'EOF'
'use client';

import { useEnhancedCrudForm } from '@/hooks/use-enhanced-crud-form';
// ... import other components

export function {{MODULE}}Form({ initialData, onSubmitAction, mode }) {
  const { form, handleSubmit, isSubmitting, validation } = useEnhancedCrudForm({
    schema: {{MODULE}}FormSchema,
    onSubmitAction,
    moduleName: '{{MODULE}}',
    defaultValues: initialData,
  });

  // ... implement form
}
EOF

echo "✅ Template gerado em src/app/admin/$MODULE_NAME"
```

---

## 📚 Referências Rápidas

### Imports Essenciais

```typescript
// Logging
import { 
  logNavigation, 
  logFormAction, 
  logSelection, 
  logCrudAction,
  logValidation,
  logInteraction,
  logError 
} from '@/lib/user-action-logger';

import { 
  loggedInputChange, 
  loggedSelectChange, 
  loggedSwitchChange,
  logSectionChange,
  logTabChange 
} from '@/lib/form-logging-helpers';

// Validation
import { useEnhancedCrudForm } from '@/hooks/use-enhanced-crud-form';
import { ValidationCheckButton } from '@/components/crud/validation-check-button';
import { CrudFormActions } from '@/components/crud/crud-form-actions';

// Components
import { LoggedEntitySelector } from '@/components/common/logged-entity-selector';
```

### Pattern de Uso

```typescript
// 1. Hook
const { form, handleSubmit, isSubmitting, validation } = useEnhancedCrudForm({
  schema: mySchema,
  onSubmitAction: saveAction,
  moduleName: 'MyModule',
  defaultValues: initialData,
});

// 2. Render
<Form {...form}>
  <form onSubmit={handleSubmit}>
    {/* Fields */}
    
    <CrudFormActions
      isSubmitting={isSubmitting}
      onSave={handleSubmit}
      onValidationCheck={validation.performValidationCheck}
    />
  </form>
</Form>
```

---

## 🎓 Treinamento da Equipe

### Vídeos/Tutoriais Necessários
1. Overview do sistema de logging (15 min)
2. Como implementar em um novo módulo (30 min)
3. Debugging com logger no console (15 min)
4. Escrevendo testes Playwright (30 min)

### Documentos de Leitura
- `IMPLEMENTACAO_LOGGING_VALIDACAO.md` (30 min)
- `EXEMPLO_TENANT_LOGGING_VALIDACAO.md` (45 min)
- `BDD_LOGGING_VALIDACAO.md` (20 min)

**Tempo Total de Treinamento**: ~3h

---

## ✅ Critérios de Aceitação

Um módulo é considerado completo quando:

1. ✅ Todos os campos importantes têm logging
2. ✅ Botão de validação está presente e funcional
3. ✅ Navegação entre seções é logada
4. ✅ Seleção de entidades é logada
5. ✅ Operações CRUD são logadas
6. ✅ Testes Playwright passam 100%
7. ✅ Documentação BDD/TDD atualizada
8. ✅ Code review aprovado
9. ✅ QA manual aprovado
10. ✅ Performance acceptable (<100ms overhead)

---

## 📞 Suporte

**Dúvidas sobre implementação:**
- Consultar: `docs/IMPLEMENTACAO_LOGGING_VALIDACAO.md`
- Exemplo: `docs/EXEMPLO_TENANT_LOGGING_VALIDACAO.md`

**Issues/Bugs:**
- Reportar com logs exportados do `window.__userActionLogger`
- Incluir screenshots do dialog de validação
- Mencionar módulo e ação específica

**Melhorias:**
- Sugestões bem-vindas após implementação em 3+ módulos
- Performance issues devem ser reportadas imediatamente
