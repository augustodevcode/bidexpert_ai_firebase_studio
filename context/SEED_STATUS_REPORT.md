# Análise de Cobertura do Seed - BidExpert
**Data:** 01/10/2025, 22:52:19

## 📊 Resumo Geral
- **Total de Tabelas:** 46
- **Tabelas Populadas:** 46 (100%)
- **Tabelas Vazias:** 0 (0%)

## ✅ Tabelas Populadas (46)

| Tabela | Registros |
|--------|-----------|
| Tenant | 18 |
| Role | 13 |
| User | 1577 |
| UsersOnRoles | 1563 |
| UsersOnTenants | 1553 |
| LotCategory | 17 |
| Subcategory | 9 |
| State | 29 |
| City | 28 |
| Court | 32 |
| JudicialDistrict | 39 |
| JudicialBranch | 39 |
| JudicialProcess | 41 |
| JudicialParty | 8 |
| Seller | 120 |
| Auctioneer | 77 |
| Asset | 605 |
| Auction | 106 |
| AuctionStage | 13 |
| Lot | 1435 |
| AssetsOnLots | 150 |
| Bid | 5992 |
| UserLotMaxBid | 53 |
| AuctionHabilitation | 404 |
| UserWin | 1201 |
| InstallmentPayment | 217 |
| _InstallmentPaymentToLot | 217 |
| LotQuestion | 79 |
| Review | 54 |
| Notification | 4 |
| Subscriber | 1 |
| DocumentType | 7 |
| UserDocument | 60 |
| DocumentTemplate | 1 |
| MediaItem | 5 |
| VehicleMake | 8 |
| VehicleModel | 44 |
| DirectSaleOffer | 1 |
| ContactMessage | 10 |
| PlatformSettings | 1 |
| data_sources | 2 |
| reports | 2 |
| _AuctionToCourt | 127 |
| _AuctionToJudicialBranch | 130 |
| _AuctionToJudicialDistrict | 127 |
| _AuctionToLotCategory | 518 |

## ❌ Tabelas Vazias (0)



## 📋 Análise por Categoria

### ✅ Core (Tenant, Roles, Users)
- **Cobertura:** 5/5 (100%)
- **Status:** Completo

### ✅ Categorias e Subcategorias
- **Cobertura:** 2/2 (100%)
- **Status:** Completo

### ✅ Localização
- **Cobertura:** 2/2 (100%)
- **Status:** Completo

### ✅ Judicial
- **Cobertura:** 5/5 (100%)
- **Status:** Completo

### ✅ Participantes
- **Cobertura:** 2/2 (100%)
- **Status:** Completo

### ✅ Ativos e Leilões
- **Cobertura:** 5/5 (100%)
- **Status:** Completo

### ✅ Lances e Habilitação
- **Cobertura:** 3/3 (100%)
- **Status:** Completo

### ✅ Arrematações e Pagamentos
- **Cobertura:** 3/3 (100%)
- **Status:** Completo

### ✅ Interações
- **Cobertura:** 4/4 (100%)
- **Status:** Completo

### ✅ Documentos
- **Cobertura:** 3/3 (100%)
- **Status:** Completo

### ✅ Mídia
- **Cobertura:** 1/1 (100%)
- **Status:** Completo

### ✅ Veículos
- **Cobertura:** 2/2 (100%)
- **Status:** Completo

### ✅ Vendas Diretas
- **Cobertura:** 1/1 (100%)
- **Status:** Completo

### ✅ Mensagens
- **Cobertura:** 1/1 (100%)
- **Status:** Completo

### ✅ Configurações
- **Cobertura:** 1/1 (100%)
- **Status:** Completo

### ✅ Relatórios
- **Cobertura:** 2/2 (100%)
- **Status:** Completo

### ✅ Relacionamentos Many-to-Many
- **Cobertura:** 4/4 (100%)
- **Status:** Completo


## 🎯 Comparação com TESTING_SCENARIOS.md

### Cenários que Requerem Dados Específicos:

#### ✅ Módulo 1: Administração - Gerenciamento de Entidades (CRUD)
- Requer: User, Role, Auction, Lot, Asset
- Status: ✅ Completo

#### ✅ Módulo 2: Fluxo de Habilitação de Usuário
- Requer: User, DocumentType, UserDocument, AuctionHabilitation
- Status: ✅ Completo

#### ✅ Módulo 3: Jornada do Arrematante (Lances e Compras)
- Requer: Lot, Bid, UserWin, InstallmentPayment
- Status: ✅ Completo

#### ✅ Dados de Veículos
- Requer: VehicleMake, VehicleModel
- Status: ✅ Completo

## 🚀 Recomendações

### Prioridade Alta (Tabelas Críticas Vazias):
- Nenhuma tabela crítica vazia

### Próximos Passos:
1. ✅ Corrigir erros de tipo no script seed-data-extended.ts
2. ⚠️  Adicionar seed para tabelas vazias identificadas
3. ⚠️  Verificar relacionamentos many-to-many
4. ⚠️  Garantir dados suficientes para todos os cenários do TESTING_SCENARIOS.md
5. ⚠️  Executar testes Playwright para validar cobertura
