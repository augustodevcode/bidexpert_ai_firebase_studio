# Cadastro de Ativos - Nova Implementação

**Data de Implementação:** 2025-11-22  
**Versão:** 2.0 - Reescrita Completa

## Visão Geral

O sistema de cadastro de ativos foi completamente redesenhado para alinhar 100% com o modelo Prisma e oferecer uma experiência de usuário superior com campos específicos por tipo de bem.

## Mudanças Principais

### ❌ Versão Anterior (Removida)
- Campo genérico "properties" (texto livre)
- ~150 campos do Prisma ignorados
- Erros de conversão de tipo (string/bigint)
- UX ruim (usuário via campos irrelevantes)

### ✅ Nova Versão (Implementada)
- Campos específicos por categoria
- Alinhamento total com schema Prisma
- Validações robustas de tipo
- UX aprimorada (campos contextuais)

## Arquitetura

### Estrutura de Arquivos

```
src/app/admin/assets/
├── asset-field-config.ts      # ✨ NOVO - Configuração de campos por categoria
├── asset-specific-fields.tsx  # ✨ NOVO - Renderizador de campos específicos
├── asset-form-schema.ts       # ♻️ ATUALIZADO - Schema Zod completo
├── asset-form.tsx             # ♻️ ATUALIZADO - Formulário principal
├── actions.ts                 # Sem alterações
├── columns.tsx                # Sem alterações
├── page.tsx                   # Sem alterações
└── [assetId]/edit/page.tsx    # Sem alterações

src/services/
└── asset.service.ts           # ♻️ ATUALIZADO - Normalização de dados

src/repositories/
└── asset.repository.ts        # Sem alterações
```

## Componentes Principais

### 1. asset-field-config.ts

**Responsabilidade:** Define todos os campos específicos por tipo de ativo.

**Recursos:**
- `AssetFieldGroup[]` - Grupos de campos organizados por seção
- `CATEGORY_FIELD_MAPPING` - Mapeamento categoria → campos
- `getFieldGroupsForCategory()` - Busca campos por slug de categoria

**Tipos de Bem Suportados:**
1. **Veículos** (21 campos) - plate, make, model, vin, etc.
2. **Imóveis** (21 campos) - matricula, IPTU, área, quartos, etc.
3. **Máquinas/Equipamentos** (17 campos) - marca, série, especificações, etc.
4. **Pecuária/Animais** (13 campos) - raça, idade, peso, GTA, etc.
5. **Móveis** (5 campos) - tipo, material, dimensões, etc.
6. **Joias** (7 campos) - tipo, metal, pedras, certificado, etc.
7. **Arte** (5 campos) - tipo, artista, período, proveniência, etc.
8. **Embarcações** (4 campos) - tipo, comprimento, casco, etc.
9. **Commodities** (5 campos) - produto, quantidade, validade, etc.
10. **Metais Preciosos** (2 campos) - tipo, pureza
11. **Produtos Florestais** (4 campos) - tipo, espécie, volume, DOF

### 2. asset-specific-fields.tsx

**Responsabilidade:** Renderiza campos específicos baseado na categoria selecionada.

**Funcionalidades:**
- Renderização condicional por categoria
- Suporte a múltiplos tipos de campo: text, number, textarea, select, boolean, date
- Layout responsivo (grid 2 colunas)
- Validação integrada com react-hook-form

**Exemplo de uso:**
```tsx
<AssetSpecificFields 
  form={form} 
  categorySlug={selectedCategory?.slug} 
/>
```

### 3. asset-form-schema.ts

**Responsabilidade:** Validação Zod para TODOS os campos possíveis.

**Estrutura:**
```typescript
assetFormSchema = 
  baseAssetFormSchema +       // Campos comuns
  vehicleFieldsSchema +       // Campos de veículos
  propertyFieldsSchema +      // Campos de imóveis
  machineryFieldsSchema +     // Campos de máquinas
  // ... etc
```

**Validações:**
- Campos obrigatórios: title, status, categoryId, sellerId
- Campos opcionais: todos os outros
- Conversões automáticas: string → number, string → date
- URLs validadas

### 4. asset-form.tsx

**Responsabilidade:** Formulário principal com seções organizadas.

**Seções:**
1. **Informações Básicas** - título, descrição, status, categoria, valor
2. **Origem/Proprietário** - processo judicial, comitente/vendedor
3. **Características Específicas** - ⭐ campos dinâmicos por categoria
4. **Localização** - endereço completo, coordenadas
5. **Mídia** - imagem principal, galeria

**Recursos:**
- React Hook Form + Zod
- EntitySelector para relacionamentos
- AddressGroup reutilizável
- ChooseMediaDialog para imagens
- Submissão com tratamento de erros

### 5. asset.service.ts

**Responsabilidade:** Lógica de negócio e normalização de dados.

**Melhorias:**
- Normalização automática de campos vazios → null
- Conversão correta de IDs (string → bigint)
- Tratamento de campos de localização
- Remoção da lógica do campo "properties" inexistente

## Fluxo de Dados

### Criação de Ativo

```
1. Usuário seleciona categoria
   ↓
2. Sistema busca slug da categoria
   ↓
3. getFieldGroupsForCategory(slug) retorna campos
   ↓
4. AssetSpecificFields renderiza campos
   ↓
5. Usuário preenche formulário
   ↓
6. Validação Zod (assetFormSchema)
   ↓
7. createAsset action
   ↓
8. AssetService.createAsset
   ↓
9. Normalização de dados
   ↓
10. AssetRepository.create
    ↓
11. Prisma insere no banco
```

### Edição de Ativo

```
1. Carregar ativo existente
   ↓
2. Preencher defaultValues com TODOS os campos
   ↓
3. Detectar categoria e renderizar campos específicos
   ↓
4. Mesmas validações da criação
   ↓
5. updateAsset action
   ↓
6. AssetService.updateAsset
   ↓
7. Atualização no banco
```

## Validações e Regras de Negócio

### Campos Obrigatórios
- ✅ `title` - mín 5, máx 200 caracteres
- ✅ `status` - enum validado
- ✅ `categoryId` - obrigatório
- ✅ `sellerId` - obrigatório

### Campos Opcionais
- Todos os outros campos são opcionais
- Campos vazios são convertidos para `null`
- Strings vazias não causam erro de tipo

### Conversões de Tipo
- `imageMediaId`: string → bigint | null
- `evaluationValue`: string → number
- `year`, `modelYear`: string → number
- `totalArea`, `builtArea`: Decimal → number
- `expirationDate`: string → Date

### Relacionamentos
- `category` - conectado via BigInt(categoryId)
- `subcategory` - conectado via BigInt(subcategoryId)
- `judicialProcess` - conectado via BigInt(judicialProcessId)
- `seller` - conectado via BigInt(sellerId)
- `tenant` - conectado automaticamente

## Como Adicionar Novo Tipo de Bem

### Passo 1: Definir Campos (asset-field-config.ts)

```typescript
export const NEW_TYPE_FIELDS: AssetFieldGroup[] = [
  {
    title: 'Características do Novo Tipo',
    fields: [
      { 
        name: 'newField1', 
        label: 'Novo Campo 1', 
        type: 'text', 
        placeholder: 'Digite aqui...' 
      },
      // ... mais campos
    ],
  },
];
```

### Passo 2: Mapear Categoria (asset-field-config.ts)

```typescript
export const CATEGORY_FIELD_MAPPING: Record<string, AssetFieldGroup[]> = {
  // ... mapeamentos existentes
  'novo-tipo': NEW_TYPE_FIELDS,
  'novo-tipo-alternativo': NEW_TYPE_FIELDS,
};
```

### Passo 3: Schema de Validação (asset-form-schema.ts)

```typescript
export const newTypeFieldsSchema = z.object({
  newField1: optionalString,
  newField2: optionalNumber,
  // ... etc
});

export const assetFormSchema = baseAssetFormSchema
  // ... schemas existentes
  .merge(newTypeFieldsSchema);
```

### Passo 4: Default Values (asset-form.tsx)

```typescript
defaultValues: initialData ? {
  // ... valores existentes
  newField1: (initialData as any).newField1 || '',
  newField2: (initialData as any).newField2 || null,
} : {}
```

**Pronto!** O novo tipo estará funcional.

## Testes Recomendados

### Teste 1: Criação de Veículo
1. Criar novo ativo
2. Selecionar categoria "Veículos"
3. Preencher campos específicos (placa, chassi, etc.)
4. Salvar
5. Verificar no banco que TODOS os campos foram salvos

### Teste 2: Edição de Imóvel
1. Editar ativo existente de imóvel
2. Alterar campos específicos (área, quartos, etc.)
3. Salvar
4. Verificar atualização

### Teste 3: Conversão de Tipos
1. Criar ativo com campos numéricos
2. Verificar que `year`, `mileage`, etc. são numbers no banco
3. Verificar que `totalArea`, `evaluationValue` são Decimal

### Teste 4: Campos Vazios
1. Criar ativo deixando campos opcionais vazios
2. Verificar que não há erro
3. Verificar que campos vazios são `null` no banco

### Teste 5: Troca de Categoria
1. Editar ativo
2. Mudar categoria
3. Verificar que campos antigos não causam erro
4. Verificar que novos campos aparecem

## Resolução de Problemas

### Erro: "Expected string, received bigint"
**Causa:** Campo ID sendo passado como bigint em vez de string  
**Solução:** Converter com `.toString()` nos defaultValues

### Erro: "Unknown argument 'properties'"
**Causa:** Campo não existe no schema Prisma  
**Solução:** Remover do formulário ou adicionar ao schema

### Erro: Campos específicos não aparecem
**Causa:** Slug da categoria não mapeado  
**Solução:** Adicionar mapeamento em `CATEGORY_FIELD_MAPPING`

### Erro: Validação falha em campo opcional
**Causa:** Schema não permite `null`  
**Solução:** Usar `optionalString`, `optionalNumber`, etc.

## Benefícios da Nova Implementação

✅ **Alinhamento com Prisma** - Usa TODOS os campos do schema  
✅ **UX Melhorada** - Usuário vê apenas campos relevantes  
✅ **Validação Robusta** - Zod valida todos os tipos  
✅ **Manutenibilidade** - Código organizado e documentado  
✅ **Escalabilidade** - Fácil adicionar novos tipos  
✅ **Sem Erros de Tipo** - Conversões corretas  
✅ **Dados Estruturados** - Queries e filtros facilitados  

## Próximos Passos

1. [ ] Adicionar campos calculados (ex: valor por m² em imóveis)
2. [ ] Implementar validações cruzadas (ex: ano <= ano modelo)
3. [ ] Criar wizards específicos por tipo (experiência guiada)
4. [ ] Integração com APIs externas (ex: FIPE para veículos)
5. [ ] Importação em massa de ativos
6. [ ] Geração de relatórios por tipo de bem

## Manutenção

### Backup
Todos os arquivos antigos estão em `_backup_assets/`

### Reversão
Se necessário reverter:
```bash
cp _backup_assets/* src/app/admin/assets/
cp _backup_assets/asset.service.ts src/services/
cp _backup_assets/asset.repository.ts src/repositories/
```

### Log de Mudanças
- 2025-11-22: Reescrita completa do cadastro de ativos
- Arquivos modificados: 5
- Arquivos criados: 2
- Linhas de código adicionadas: ~700
- Campos suportados: ~150

## Contato

Para dúvidas ou sugestões sobre o cadastro de ativos, consulte:
- Documentação do Prisma: `prisma/schema.prisma`
- Análise de backup: `_backup_assets/BACKUP_ANALYSIS.md`
- Este arquivo: `docs/ASSET_REGISTRATION_V2.md`
