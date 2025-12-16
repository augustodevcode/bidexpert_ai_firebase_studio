# 📋 ARQUITETURA DE IMPLEMENTAÇÃO DOS 8 GAPS CRÍTICOS - BidExpert

**Versão:** 1.0.0  
**Data:** 13/12/2024  
**Status:** PLANEJAMENTO

---

## 📌 VISÃO GERAL

Este documento define a arquitetura técnica completa para implementação dos 8 gaps críticos identificados que transformarão o BidExpert na plataforma #1 para investidores profissionais.

### Métricas de Sucesso
- +40% conversão
- +60% confiança dos investidores
- Timeline: 180 dias (35 semanas)

---

## 🏗️ DECISÕES ARQUITETURAIS

### 1. Estratégia de Schema (Prisma)

**Decisão:** Usar abordagem híbrida:
- Campos estruturados para dados frequentemente consultados/filtrados
- Campo JSONB (`specifications`) para specs dinâmicas por categoria
- ENUMs para valores finitos (tipos de ocupação, níveis de risco, etc.)

**Justificativa:**
- Performance em queries com campos indexados
- Flexibilidade para specs que variam por categoria
- Consistência via ENUMs para valores padronizados

### 2. Sincronização Admin → Frontend

**Decisão:** Dados já sincronizam via Prisma/API existente. O gap está na **exibição** no frontend, não na sincronização.

**Ação:** Criar componentes de exibição que consumam dados já existentes no modelo `Lot` e `Asset`.

### 3. Integrações Externas

**Decisão:** Usar serviços de cache com fallback:
- Redis para cache de APIs externas (FIPE, preços de mercado)
- Fallback para valores estáticos quando API indisponível
- Jobs agendados para atualização periódica (diária/semanal)

---

## 📊 FASES DE IMPLEMENTAÇÃO

---

## FASE 1: IMÓVEIS (Semana 1-7)

### Gap 1.1: Campos Jurídicos Críticos

**Status Atual:** 
✅ Parcialmente implementado no schema:
- `propertyMatricula` ✅ (JudicialProcess)
- `occupationStatus` ✅ (Asset - enum OccupationStatus)
- `actionType` ✅ (JudicialProcess - enum JudicialActionType)

**O que falta:**
- [ ] Componentes de exibição no frontend
- [ ] Sincronização dos dados do JudicialProcess para o Lot Detail

#### Schema Atual (Já Existente)
```prisma
// Asset
occupationStatus           OccupationStatus?
occupationNotes            String?          @db.Text
occupationLastVerified     DateTime?
occupationUpdatedBy        BigInt?

// JudicialProcess
propertyMatricula          String?          @db.VarChar(50)
propertyRegistrationNumber String?
actionType                 JudicialActionType?
actionDescription          String?
actionCnjCode              String?          @db.VarChar(20)

// Enums
enum OccupationStatus {
  OCCUPIED
  UNOCCUPIED
  UNCERTAIN
  SHARED_POSSESSION
}

enum JudicialActionType {
  USUCAPIAO
  REMOCAO
  HIPOTECA
  DESPEJO
  PENHORA
  COBRANCA
  INVENTARIO
  DIVORCIO
  OUTROS
}
```

#### Componentes a Criar
```
src/components/lots/
├── lot-legal-info-card.tsx        # Card com matrícula, ocupação, tipo de ação
├── occupation-status-badge.tsx    # Badge visual de ocupação
├── judicial-action-badge.tsx      # Badge de tipo de ação judicial
└── property-risks-alert.tsx       # Alertas de riscos identificados
```

#### API Endpoints
- `GET /api/lots/[id]/legal-info` - Retorna informações jurídicas consolidadas
- `GET /api/lots/[id]/risks` - Retorna riscos do lote

---

### Gap 1.2: Simulador de Custos para Imóveis

**Status Atual:** ❌ Inexistente

**Schema a Criar:**
```prisma
model AuctionCostConfig {
  id                    BigInt   @id @default(autoincrement())
  auctionId             BigInt   @unique
  tenantId              BigInt
  
  // Taxas Percentuais
  successFeePercent     Decimal  @db.Decimal(5, 2)  // Taxa de sucesso (comissão leiloeiro)
  itbiPercent           Decimal  @db.Decimal(5, 2)  // ITBI (2-3% geralmente)
  registryFeePercent    Decimal  @db.Decimal(5, 2)  // Emolumentos cartorários
  
  // Taxas Fixas
  legalFeesFixed        Decimal? @db.Decimal(15, 2) // Honorários advocatícios
  notaryFeesFixed       Decimal? @db.Decimal(15, 2) // Taxas notariais fixas
  
  // Configurações por Estado
  stateUf               String?  @db.VarChar(2)
  customRules           Json?    // Regras específicas por estado
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  auction               Auction  @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([stateUf])
}

// Adicionar relação em Auction
model Auction {
  // ... campos existentes
  costConfig            AuctionCostConfig?
}
```

#### Componentes a Criar
```
src/components/lots/
├── cost-simulator/
│   ├── index.tsx                  # Container principal
│   ├── cost-simulator-form.tsx    # Input de valor do lance
│   ├── cost-breakdown-table.tsx   # Tabela detalhada de custos
│   ├── cost-summary-card.tsx      # Resumo total
│   └── export-cost-pdf.tsx        # Botão de exportação
```

#### Lógica de Cálculo
```typescript
interface CostSimulationInput {
  bidAmount: number;
  auctionId: string;
  stateUf: string;
}

interface CostBreakdown {
  bidAmount: number;
  successFee: number;      // bidAmount * successFeePercent
  itbi: number;            // bidAmount * itbiPercent
  registryFee: number;     // bidAmount * registryFeePercent
  legalFees: number;       // Fixo ou estimado
  notaryFees: number;      // Fixo ou estimado
  totalCosts: number;      // Soma de todas as taxas
  totalInvestment: number; // bidAmount + totalCosts
}
```

#### API Endpoints
- `GET /api/auctions/[id]/cost-config` - Retorna configuração de custos
- `POST /api/lots/[id]/simulate-costs` - Calcula custos para um lance

---

### Gap 1.3: Indicadores de Mercado (Preço Regional)

**Status Atual:** ❌ Inexistente

**Schema a Criar:**
```prisma
model MarketPriceIndex {
  id                    BigInt   @id @default(autoincrement())
  
  // Localização
  stateUf               String   @db.VarChar(2)
  cityName              String?
  neighborhood          String?
  zipCodePrefix         String?  @db.VarChar(5)  // Primeiros 5 dígitos do CEP
  
  // Tipo de Imóvel
  propertyType          PropertyType
  
  // Preços
  pricePerSquareMeter   Decimal  @db.Decimal(15, 2)
  minPrice              Decimal? @db.Decimal(15, 2)
  maxPrice              Decimal? @db.Decimal(15, 2)
  medianPrice           Decimal? @db.Decimal(15, 2)
  
  // Metadados
  sampleSize            Int?     // Quantidade de amostras
  dataSource            String?  // FIPE, SEADE, IBGE, etc.
  referenceDate         DateTime
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([stateUf, cityName, neighborhood, propertyType, referenceDate])
  @@index([stateUf, cityName])
  @@index([zipCodePrefix])
  @@index([propertyType])
}

enum PropertyType {
  APARTAMENTO
  CASA
  TERRENO
  SALA_COMERCIAL
  GALPAO
  RURAL
  OUTRO
}

model MarketPriceHistory {
  id                    BigInt   @id @default(autoincrement())
  marketPriceIndexId    BigInt
  pricePerSquareMeter   Decimal  @db.Decimal(15, 2)
  referenceDate         DateTime
  
  marketPriceIndex      MarketPriceIndex @relation(fields: [marketPriceIndexId], references: [id], onDelete: Cascade)
  
  @@index([marketPriceIndexId])
  @@index([referenceDate])
}
```

#### Componentes a Criar
```
src/components/lots/
├── market-comparison/
│   ├── index.tsx                  # Container
│   ├── price-comparison-card.tsx  # "Preço médio: R$X vs Leilão: R$Y = -Z%"
│   ├── market-price-chart.tsx     # Gráfico 6 meses
│   └── opportunity-indicator.tsx  # Indicador de oportunidade (⭐⭐⭐)
```

#### API Endpoints
- `GET /api/market/prices?state=SP&city=Sao Paulo&type=APARTAMENTO`
- `GET /api/market/prices/history?indexId=123`
- `GET /api/lots/[id]/market-comparison`

---

### Gap 1.4: Histórico de Lances

**Status Atual:** ✅ Dados existem na tabela `Bid`, mas NÃO são exibidos no frontend

**Schema Existente:**
```prisma
model Bid {
  id            BigInt   @id @default(autoincrement())
  lotId         BigInt
  auctionId     BigInt
  bidderId      BigInt
  amount        Decimal  @db.Decimal(15, 2)
  timestamp     DateTime @default(now())
  bidderDisplay String?  // Para anonimização
  tenantId      BigInt
  // ... relações
}
```

#### Componentes a Criar
```
src/components/lots/
├── bid-history/
│   ├── index.tsx                  # Container principal
│   ├── bid-timeline.tsx           # Timeline visual de lances
│   ├── bid-stats-card.tsx         # Estatísticas: total, maior, médio
│   └── bid-anonymizer.ts          # Utilitário de anonimização
```

#### Regras de Exibição
1. **Durante leilão ABERTO:** Não mostrar histórico completo (apenas contagem)
2. **Após ENCERRADO:** Mostrar histórico anonimizado
3. **Anonimização:** "Lançador #1", "Lançador #2", etc.

#### API Endpoints
- `GET /api/lots/[id]/bid-history` - Retorna histórico (se permitido)
- `GET /api/lots/[id]/bid-stats` - Retorna estatísticas

---

## FASE 2: VEÍCULOS (Semana 8-14)

### Gap 2.1: Especificações Técnicas Completas

**Status Atual:** ✅ Parcialmente implementado no modelo `Asset`

**Campos Existentes:**
```prisma
// Asset - Campos de Veículos
plate                      String?
make                       String?
model                      String?
version                    String?
year                       Int?
modelYear                  Int?
mileage                    Int?
color                      String?
fuelType                   String?
transmissionType           String?
bodyType                   String?
vin                        String?  @unique  // Chassi
renavam                    String?  @unique
enginePower                String?
numberOfDoors              Int?
vehicleOptions             String?  @db.Text
detranStatus               String?  @db.Text
debts                      String?  @db.Text
runningCondition           String?
bodyCondition              String?
tiresCondition             String?
hasKey                     Boolean?
```

**O que falta:**
- [ ] Validação com API DENATRAN
- [ ] Auto-complete de marca/modelo
- [ ] Componentes de exibição formatados

#### Componentes a Criar
```
src/components/lots/
├── vehicle-specs/
│   ├── index.tsx                  # Container
│   ├── vehicle-specs-card.tsx     # Card com todas specs
│   ├── vehicle-condition-badges.tsx # Badges de condição
│   ├── vehicle-summary-line.tsx   # "2020 - 85.000 km - Flex - Sedan"
│   └── debts-alert.tsx            # Alerta de débitos
```

---

### Gap 2.2: Avaliação FIPE + Comparação Mercado

**Status Atual:** ❌ Inexistente

**Schema a Criar:**
```prisma
model VehicleFipePrice {
  id                    BigInt   @id @default(autoincrement())
  
  // Identificação do Veículo
  fipeCode              String   @unique
  brandName             String
  modelName             String
  year                  Int
  fuelType              String?
  
  // Preços
  fipePrice             Decimal  @db.Decimal(15, 2)
  referenceMonth        String   @db.VarChar(7)  // "2024-12"
  
  // Cache
  cachedAt              DateTime @default(now())
  expiresAt             DateTime
  
  @@index([brandName, modelName, year])
  @@index([referenceMonth])
}

model AssetFipeEvaluation {
  id                    BigInt   @id @default(autoincrement())
  assetId               BigInt   @unique
  fipeCode              String?
  fipePrice             Decimal? @db.Decimal(15, 2)
  evaluationDate        DateTime @default(now())
  mileageAdjustment     Decimal? @db.Decimal(15, 2)  // Ajuste por km
  conditionAdjustment   Decimal? @db.Decimal(15, 2)  // Ajuste por condição
  adjustedPrice         Decimal? @db.Decimal(15, 2)  // Preço final ajustado
  
  asset                 Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@index([assetId])
}
```

#### Componentes a Criar
```
src/components/lots/
├── fipe-comparison/
│   ├── index.tsx                  # Container
│   ├── fipe-price-card.tsx        # "FIPE: R$X | Leilão: R$Y | -Z%"
│   ├── opportunity-stars.tsx      # ⭐⭐⭐⭐⭐
│   └── price-history-mini.tsx     # Mini gráfico de preço
```

#### Serviço de Integração FIPE
```typescript
// src/services/fipe.service.ts
interface FipeService {
  getBrands(): Promise<FipeBrand[]>;
  getModels(brandCode: string): Promise<FipeModel[]>;
  getYears(brandCode: string, modelCode: string): Promise<FipeYear[]>;
  getPrice(brandCode: string, modelCode: string, yearCode: string): Promise<FipePrice>;
  searchByPlate(plate: string): Promise<FipePrice | null>; // Via API alternativa
}
```

---

## FASE 3: ELETRÔNICOS (Semana 15-19)

### Gap 3.1: Especificações por Categoria

**Status Atual:** ✅ Campos genéricos existem, mas schema dinâmico necessário

**Schema a Criar:**
```prisma
model CategorySpecTemplate {
  id                    BigInt   @id @default(autoincrement())
  categoryId            BigInt
  subcategoryId         BigInt?
  
  // Template de specs
  specFields            Json     // Array de definições de campos
  
  // Metadados
  version               Int      @default(1)
  isActive              Boolean  @default(true)
  
  category              LotCategory  @relation(fields: [categoryId], references: [id])
  subcategory           Subcategory? @relation(fields: [subcategoryId], references: [id])
  
  @@unique([categoryId, subcategoryId])
}

// Exemplo de specFields:
// [
//   { "name": "screenSize", "label": "Tamanho da Tela", "type": "number", "unit": "polegadas", "required": true },
//   { "name": "resolution", "label": "Resolução", "type": "select", "options": ["HD", "Full HD", "4K", "8K"] },
//   { "name": "brand", "label": "Marca", "type": "text", "autocomplete": "electronics_brands" }
// ]
```

**Adicionar ao Asset:**
```prisma
model Asset {
  // ... campos existentes
  dynamicSpecs          Json?    // Specs dinâmicas preenchidas
}
```

#### Componentes a Criar
```
src/components/lots/
├── dynamic-specs/
│   ├── index.tsx                  # Container
│   ├── spec-renderer.tsx          # Renderiza specs baseado no template
│   ├── spec-form-builder.tsx      # Form dinâmico no admin
│   └── category-spec-card.tsx     # Card de exibição
```

---

### Gap 3.2: Comparação com Preço de Varejo

**Status Atual:** ❌ Inexistente

**Schema a Criar:**
```prisma
model RetailPriceReference {
  id                    BigInt   @id @default(autoincrement())
  
  // Identificação do Produto
  productName           String
  brand                 String?
  model                 String?
  ean                   String?  // Código de barras
  gtin                  String?  // Global Trade Item Number
  
  // Preços de Referência
  averageRetailPrice    Decimal  @db.Decimal(15, 2)
  minRetailPrice        Decimal? @db.Decimal(15, 2)
  maxRetailPrice        Decimal? @db.Decimal(15, 2)
  
  // Fontes
  source                String?  // "MERCADO_LIVRE", "AMAZON", "MAGAZINE"
  sourceUrl             String?
  
  // Cache
  cachedAt              DateTime @default(now())
  expiresAt             DateTime
  
  @@index([productName])
  @@index([brand, model])
  @@index([ean])
}
```

---

## FASE 4: MÁQUINAS E EQUIPAMENTOS (Semana 20-25)

### Gap 4.1 & 4.2: Especificações Técnicas + Certificações

**Status Atual:** ✅ Campos parciais existem no Asset

**Campos Existentes:**
```prisma
// Asset - Campos de Máquinas
hoursUsed                  Int?
engineType                 String?
capacityOrPower            String?
maintenanceHistory         String?          @db.Text
installationLocation       String?
compliesWithNR             String?
operatingLicenses          String?
```

**Schema Adicional:**
```prisma
model MachineryInspection {
  id                    BigInt   @id @default(autoincrement())
  assetId               BigInt
  
  // Inspeção
  inspectionDate        DateTime
  inspectorName         String
  inspectorCredential   String?  // CREA, etc.
  
  // Checklist
  hydraulicSystem       InspectionStatus @default(NAO_VERIFICADO)
  transmission          InspectionStatus @default(NAO_VERIFICADO)
  electricalSystem      InspectionStatus @default(NAO_VERIFICADO)
  structuralIntegrity   InspectionStatus @default(NAO_VERIFICADO)
  safetyFeatures        InspectionStatus @default(NAO_VERIFICADO)
  
  // Resultado
  overallStatus         InspectionStatus
  observations          String?  @db.Text
  reportUrl             String?
  
  asset                 Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@index([assetId])
}

enum InspectionStatus {
  NAO_VERIFICADO
  APROVADO
  REPROVADO
  NECESSITA_REPARO
  NAO_APLICAVEL
}

model MachineryCertification {
  id                    BigInt   @id @default(autoincrement())
  assetId               BigInt
  
  certificationType     String   // "NR12", "ISO9001", "CE", etc.
  certificationNumber   String?
  issuingBody           String?
  issueDate             DateTime?
  expirationDate        DateTime?
  isValid               Boolean  @default(true)
  documentUrl           String?
  
  asset                 Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@index([assetId])
  @@index([certificationType])
}
```

---

## FASE 5: SEMOVENTES + DASHBOARD (Semana 26-35)

### Gap 5.1: Categoria Semoventes

**Status Atual:** ✅ Campos parciais existem

**Campos Existentes:**
```prisma
// Asset - Campos de Semoventes
breed                      String?
age                        String?
sex                        String?
weight                     String?
individualId               String?  // Brinco/Chip
purpose                    String?
sanitaryCondition          String?  @db.Text
lineage                    String?
isPregnant                 Boolean?
specialSkills              String?
gtaDocument                String?
breedRegistryDocument      String?
```

**Schema Adicional:**
```prisma
model LivestockHealthRecord {
  id                    BigInt   @id @default(autoincrement())
  assetId               BigInt
  
  // Vacinas
  vaccinationType       String
  applicationDate       DateTime
  nextApplicationDate   DateTime?
  veterinarianName      String?
  veterinarianCrmv      String?
  batchNumber           String?
  
  asset                 Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@index([assetId])
}

model LivestockReproductiveHistory {
  id                    BigInt   @id @default(autoincrement())
  assetId               BigInt
  
  eventType             ReproductiveEventType
  eventDate             DateTime
  details               String?  @db.Text
  offspringCount        Int?
  
  asset                 Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@index([assetId])
}

enum ReproductiveEventType {
  INSEMINACAO
  COBERTURA
  PARTO
  DESMAME
  PRENHEZ_CONFIRMADA
}
```

---

### Gap 5.2: Dashboard Pessoal do Investidor

**Status Atual:** ❌ Inexistente

**Schema a Criar:**
```prisma
model InvestorDashboard {
  id                    BigInt   @id @default(autoincrement())
  userId                BigInt   @unique
  
  // Configurações
  alertSettings         Json?    // Preferências de alertas
  dashboardLayout       Json?    // Layout personalizado
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SavedLot {
  id                    BigInt   @id @default(autoincrement())
  userId                BigInt
  lotId                 BigInt
  
  savedAt               DateTime @default(now())
  notes                 String?  @db.Text
  notifyOnPriceChange   Boolean  @default(true)
  notifyOnStatusChange  Boolean  @default(true)
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lot                   Lot      @relation(fields: [lotId], references: [id], onDelete: Cascade)
  
  @@unique([userId, lotId])
  @@index([userId])
  @@index([lotId])
}

model InvestorAlert {
  id                    BigInt   @id @default(autoincrement())
  userId                BigInt
  
  // Filtros do alerta
  alertName             String
  categoryIds           Json?    // Array de IDs de categorias
  stateUfs              Json?    // Array de UFs
  cityIds               Json?    // Array de IDs de cidades
  minPrice              Decimal? @db.Decimal(15, 2)
  maxPrice              Decimal? @db.Decimal(15, 2)
  keywords              Json?    // Array de palavras-chave
  
  // Notificação
  notifyEmail           Boolean  @default(true)
  notifyPush            Boolean  @default(false)
  frequency             AlertFrequency @default(INSTANT)
  
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lastTriggeredAt       DateTime?
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

enum AlertFrequency {
  INSTANT
  DAILY
  WEEKLY
}

model InvestorStatistics {
  id                    BigInt   @id @default(autoincrement())
  userId                BigInt   @unique
  
  // Estatísticas
  totalBidsPlaced       Int      @default(0)
  totalLotsWon          Int      @default(0)
  totalAmountWon        Decimal  @default(0) @db.Decimal(15, 2)
  totalAmountSpent      Decimal  @default(0) @db.Decimal(15, 2)
  averageDiscount       Decimal? @db.Decimal(5, 2)  // % médio de desconto
  winRate               Decimal? @db.Decimal(5, 2)  // Taxa de sucesso
  
  // ROI (se informado pelo usuário)
  estimatedPortfolioValue Decimal? @db.Decimal(15, 2)
  
  lastCalculatedAt      DateTime @default(now())
  
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Estrutura de Páginas
```
src/app/dashboard/
├── page.tsx                       # Overview do dashboard
├── saved-lots/
│   └── page.tsx                   # Lotes salvos
├── bid-history/
│   └── page.tsx                   # Histórico de lances
├── won-lots/
│   └── page.tsx                   # Lotes ganhos
├── alerts/
│   ├── page.tsx                   # Lista de alertas
│   └── new/
│       └── page.tsx               # Criar novo alerta
├── statistics/
│   └── page.tsx                   # Estatísticas e ROI
└── settings/
    └── page.tsx                   # Configurações
```

---

## 🔌 INTEGRAÇÕES EXTERNAS

### 1. CNJ (Conselho Nacional de Justiça)
- **Endpoint:** API DataJud
- **Frequência:** Sob demanda + cache 24h
- **Dados:** Processos judiciais, partes, movimentações

### 2. FIPE
- **Endpoint:** API FIPE ou paralela.com.br
- **Frequência:** Cache mensal + atualização sob demanda
- **Dados:** Preços de veículos por marca/modelo/ano

### 3. DENATRAN
- **Endpoint:** API consulta veicular
- **Frequência:** Sob demanda
- **Dados:** Validação RENAVAM, débitos, restrições

### 4. Mercado Livre (Preços Varejo)
- **Endpoint:** API ML ou scraping
- **Frequência:** Cache diário
- **Dados:** Preços de referência para eletrônicos

### 5. SEADE/IBGE (Preços Imobiliários)
- **Endpoint:** APIs públicas
- **Frequência:** Cache mensal
- **Dados:** Índices de preço por região

---

## 📁 ESTRUTURA DE ARQUIVOS

```
src/
├── services/
│   ├── cost-simulator.service.ts
│   ├── fipe.service.ts
│   ├── market-price.service.ts
│   ├── bid-history.service.ts
│   ├── investor-dashboard.service.ts
│   └── external-integrations/
│       ├── cnj.integration.ts
│       ├── fipe.integration.ts
│       ├── denatran.integration.ts
│       └── mercado-livre.integration.ts
├── components/
│   └── lots/
│       ├── legal-info/
│       ├── cost-simulator/
│       ├── market-comparison/
│       ├── bid-history/
│       ├── vehicle-specs/
│       ├── fipe-comparison/
│       ├── dynamic-specs/
│       └── opportunity-indicator/
├── app/
│   ├── dashboard/
│   │   └── [páginas do dashboard pessoal]
│   └── api/
│       ├── lots/[id]/
│       │   ├── legal-info/
│       │   ├── simulate-costs/
│       │   ├── market-comparison/
│       │   └── bid-history/
│       ├── market/
│       │   └── prices/
│       └── dashboard/
│           ├── saved-lots/
│           ├── alerts/
│           └── statistics/
└── lib/
    ├── cost-calculator.ts
    └── opportunity-scorer.ts
```

---

## 🧪 ESTRATÉGIA DE TESTES

### Unit Tests
- Cálculos de custo (100% cobertura)
- Lógica de anonimização
- Scorers de oportunidade

### Integration Tests
- Sincronização admin → frontend
- APIs de integração externa (mocks)
- Cache de dados

### E2E Tests
- Fluxo completo de simulação de custos
- Dashboard pessoal
- Criação de alertas

---

## 📅 CRONOGRAMA RESUMIDO

| Fase | Semanas | Gaps | Prioridade |
|------|---------|------|------------|
| 1 - Imóveis | 1-7 | 1.1, 1.2, 1.3, 1.4 | ALTA |
| 2 - Veículos | 8-14 | 2.1, 2.2 | ALTA |
| 3 - Eletrônicos | 15-19 | 3.1, 3.2 | MÉDIA |
| 4 - Máquinas | 20-25 | 4.1, 4.2 | MÉDIA |
| 5 - Semoventes + Dashboard | 26-35 | 5.1, 5.2 | ALTA |

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| APIs externas indisponíveis | Média | Alto | Cache agressivo + fallbacks |
| Performance com muitas specs | Baixa | Médio | Índices + paginação |
| Dados de mercado imprecisos | Média | Médio | Múltiplas fontes + disclaimers |
| Complexidade do dashboard | Alta | Médio | MVP primeiro, iterações depois |

---

## 📝 PRÓXIMOS PASSOS

1. **Semana 1:** Criar migrations Prisma para novos modelos
2. **Semana 1-2:** Implementar componentes de exibição (Gap 1.1, 1.4)
3. **Semana 2-3:** Implementar simulador de custos (Gap 1.2)
4. **Semana 3-4:** Integração FIPE básica
5. **Semana 4-5:** Componentes de comparação de mercado

---

*Documento gerado automaticamente - BidExpert AI Assistant*
