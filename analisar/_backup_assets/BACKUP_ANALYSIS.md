# Análise e Backup - Cadastro de Ativos

**Data:** 2025-11-22
**Objetivo:** Refazer completamente o cadastro de ativos alinhado ao modelo Prisma

## Problemas Identificados

### 1. Erros de Tipo (Type Mismatches)
- `imageMediaId`: Estava recebendo string vazia quando deveria ser `null` ou `bigint`
- `cityId` e `stateId`: Conversão incorreta entre string e bigint
- Campo `properties`: Não existe no schema Prisma mas estava sendo usado no form

### 2. Schema Prisma vs Implementação
O modelo `Asset` no Prisma tem **muitos** campos específicos por tipo de bem:
- Veículos: `plate`, `make`, `model`, `vin`, `renavam`, etc.
- Imóveis: `propertyRegistrationNumber`, `totalArea`, `bedrooms`, etc.
- Máquinas: `brand`, `serialNumber`, `specifications`, etc.
- Joias: `jewelryType`, `metal`, `gemstones`, etc.
- E mais: Móveis, Arte, Embarcações, Commodities, Metais, Produtos Florestais

**Total**: ~150 campos específicos no schema!

### 3. Abordagem Atual (Problemática)
- O formulário tentava usar um campo `properties` (tipo texto genérico)
- Esse campo **NÃO EXISTE** no schema Prisma
- Campos específicos do schema não eram utilizados
- Conversões de tipo inconsistentes

## Regras de Negócio Identificadas

### Campos Obrigatórios
1. `title` - Título do bem (5-200 caracteres)
2. `status` - Status do ativo (enum: CADASTRO, DISPONIVEL, LOTEADO, VENDIDO, REMOVIDO, INATIVADO)
3. `categoryId` - Categoria do bem
4. `sellerId` - Comitente/Vendedor
5. `tenantId` - Tenant (multitenant)

### Campos Opcionais Importantes
1. `description` - Descrição detalhada
2. `subcategoryId` - Subcategoria (depende da categoria)
3. `judicialProcessId` - Processo judicial (para bens judiciais)
4. `evaluationValue` - Valor de avaliação
5. `imageUrl` / `imageMediaId` - Imagem principal
6. `galleryImageUrls` / `mediaItemIds` - Galeria de imagens

### Localização
- `locationCity` e `locationState` (strings, não IDs)
- `address` - Endereço completo
- `latitude` e `longitude` - Coordenadas GPS

### Relacionamentos
- **Categoria** (`LotCategory`): Obrigatório
- **Subcategoria** (`Subcategory`): Opcional, depende da categoria
- **Processo Judicial** (`JudicialProcess`): Opcional, para bens judiciais
- **Comitente/Vendedor** (`Seller`): Obrigatório
- **Lotes** (`AssetsOnLots`): Relação many-to-many

## Validações de Tela

### Form Schema (Zod)
```typescript
- title: min 5, max 200 caracteres
- description: max 5000 caracteres
- status: enum validado
- categoryId: obrigatório
- sellerId: obrigatório
- evaluationValue: número positivo
- URLs: validação de formato URL
```

### Comportamentos Especiais
1. **Subcategorias dinâmicas**: Carregam baseado na categoria selecionada
2. **Seleção de mídia**: Dialog para escolher da biblioteca ou inserir URL
3. **Galeria**: Múltiplas imagens com preview e remoção
4. **Endereço**: Componente `AddressGroup` reutilizável

## Solução Proposta

### Abordagem 1: Campos Dinâmicos por Categoria (RECOMENDADA)
Criar seções de formulário que aparecem baseado na categoria:
- Se categoria = "Veículos" → mostrar campos de veículo
- Se categoria = "Imóveis" → mostrar campos de imóvel
- etc.

**Vantagens:**
- Alinhado 100% com o schema Prisma
- Permite validações específicas por tipo
- Melhor UX (usuário vê apenas campos relevantes)
- Dados estruturados corretamente

**Desvantagens:**
- Formulário mais complexo
- Mais código para manter

### Abordagem 2: Campos Básicos + JSON (NÃO RECOMENDADA)
Usar apenas campos básicos e um campo JSON para extras.

**Problemas:**
- Não aproveita os campos do Prisma
- Dificulta queries e filtros
- Perde validação de tipo

## Estrutura de Arquivos Atual

```
src/app/admin/assets/
├── actions.ts              # Server actions (CRUD)
├── asset-form-schema.ts    # Validação Zod
├── asset-form.tsx          # Formulário principal
├── columns.tsx             # Colunas da tabela
├── page.tsx                # Lista de ativos
├── new/
│   └── page.tsx            # Criar novo ativo
└── [assetId]/
    └── edit/
        └── page.tsx        # Editar ativo

src/services/
└── asset.service.ts        # Lógica de negócio

src/repositories/
└── asset.repository.ts     # Acesso ao banco
```

## Plano de Implementação

### Fase 1: Novo Schema de Formulário
1. Criar schemas Zod específicos por categoria
2. Schema base + schemas estendidos para cada tipo

### Fase 2: Componentes de Formulário
1. `AssetFormBase` - Campos comuns a todos
2. `VehicleFields` - Campos de veículo
3. `PropertyFields` - Campos de imóvel
4. `MachineryFields` - Campos de máquina
5. etc.

### Fase 3: Service e Repository
1. Atualizar `AssetService` para lidar com todos os campos
2. Remover lógica do campo `properties` inexistente
3. Garantir conversões de tipo corretas (bigint/string)

### Fase 4: Validação
1. Testes de criação para cada tipo de categoria
2. Testes de atualização
3. Validação de tipo em runtime

## Campos por Tipo de Bem

### Veículos (14 campos)
- plate, make, model, version, year, modelYear
- mileage, color, fuelType, transmissionType, bodyType
- vin, renavam, enginePower, numberOfDoors, vehicleOptions
- detranStatus, debts, runningCondition, bodyCondition, tiresCondition, hasKey

### Imóveis (21 campos)
- propertyRegistrationNumber, iptuNumber, isOccupied
- totalArea, builtArea, bedrooms, suites, bathrooms, parkingSpaces
- constructionType, finishes, infrastructure, condoDetails
- improvements, topography, liensAndEncumbrances, propertyDebts
- unregisteredRecords, hasHabiteSe, zoningRestrictions, amenities

### Máquinas/Eletrônicos (17 campos)
- brand, serialNumber, itemCondition, specifications
- includedAccessories, batteryCondition, hasInvoice, hasWarranty
- repairHistory, applianceCapacity, voltage, applianceType
- additionalFunctions, hoursUsed, engineType, capacityOrPower
- maintenanceHistory, installationLocation, compliesWithNR, operatingLicenses

### Pecuária (13 campos)
- breed, age, sex, weight, individualId, purpose
- sanitaryCondition, lineage, isPregnant, specialSkills
- gtaDocument, breedRegistryDocument

### Móveis (5 campos)
- furnitureType, material, style, dimensions, pieceCount

### Joias (7 campos)
- jewelryType, metal, gemstones, totalWeight
- jewelrySize, authenticityCertificate

### Arte (5 campos)
- workType, artist, period, technique, provenance

### Embarcações (4 campos)
- boatType, boatLength, hullMaterial, onboardEquipment

### Commodities (5 campos)
- productName, quantity, packagingType, expirationDate, storageConditions

### Metais Preciosos (2 campos)
- preciousMetalType, purity

### Produtos Florestais (4 campos)
- forestGoodsType, volumeOrQuantity, species, dofNumber

## Mapeamento Categoria → Campos

Será necessário criar um mapeamento entre categorias e os grupos de campos acima.
Isso pode ser feito via:
1. Configuração no banco (tabela de configuração)
2. Hardcoded no código (mais simples, menos flexível)
3. Inferência pela subcategoria

## Próximos Passos

1. ✅ Backup completo realizado
2. [ ] Criar schemas Zod por tipo
3. [ ] Criar componentes de campos específicos
4. [ ] Atualizar formulário principal
5. [ ] Atualizar service e repository
6. [ ] Testes de criação/edição
7. [ ] Documentação de uso
