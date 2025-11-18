# Relatório de Dados - Banco de Dados MySQL

**Data da Consulta Anterior:** 18 de Novembro de 2025 - 02:18:16  
**Data da Consulta Atual:** 18 de Novembro de 2025 - 02:58:56  
**Banco de Dados:** bidxprtmsqfire (MySQL)

---

## 📊 Resumo Executivo

| Métrica | Anterior | Atual | Mudança |
|---------|----------|-------|---------|
| **Total de Tabelas** | 65 | 65 | - |
| **Tabelas com Dados** | 34 | 34 | - |
| **Tabelas Vazias** | 31 | 31 | - |
| **Total de Registros** | 1.931 | 2.314 | **+383** 📈 |

---

## 🔄 Mudanças Detectadas

**15 tabelas receberam novos registros** desde a primeira consulta:

| # | Tabela | Anterior | Atual | Mudança |
|---|--------|----------|-------|---------|
| 1 | 📈 Bid | 84 | 139 | **+55** |
| 2 | 📈 JudicialParty | 129 | 192 | **+63** |
| 3 | 📈 UsersOnRoles | 167 | 223 | **+56** |
| 4 | 📈 Lot | 148 | 194 | **+46** |
| 5 | 📈 UsersOnTenants | 245 | 281 | **+36** |
| 6 | 📈 AuctionHabilitation | 120 | 160 | **+40** |
| 7 | 📈 Auction | 49 | 72 | **+23** |
| 8 | 📈 JudicialProcess | 15 | 36 | **+21** |
| 9 | 📈 JudicialBranch | 25 | 36 | **+11** |
| 10 | 📈 JudicialDistrict | 56 | 67 | **+11** |
| 11 | 📈 Seller | 11 | 22 | **+11** |
| 12 | 📈 Court | 12 | 17 | **+5** |
| 13 | 📈 Auctioneer | 4 | 7 | **+3** |
| 14 | 📈 PlatformSettings | 4 | 5 | **+1** |
| 15 | 📈 User | 5 | 6 | **+1** |

**Total de novos registros:** +383 ✓

---

## ✓ Tabelas com Dados (34)

| # | Tabela | Registros |
|---|--------|-----------|
| 1 | AssetsOnLots | 364 |
| 2 | UsersOnTenants | 281 |
| 3 | InstallmentPayment | 175 |
| 4 | UsersOnRoles | 223 |
| 5 | Lot | 194 |
| 6 | JudicialParty | 192 |
| 7 | AuctionHabilitation | 160 |
| 8 | Asset | 101 |
| 9 | Bid | 139 |
| 10 | JudicialDistrict | 67 |
| 11 | MediaItem | 50 |
| 12 | Auction | 72 |
| 13 | VehicleModel | 30 |
| 14 | UserWin | 27 |
| 15 | State | 27 |
| 16 | JudicialBranch | 36 |
| 17 | ContactMessage | 15 |
| 18 | JudicialProcess | 36 |
| 19 | City | 10 |
| 20 | DocumentType | 5 |
| 21 | User | 6 |
| 22 | PlatformSettings | 5 |
| 23 | Auctioneer | 7 |
| 24 | Role | 6 |
| 25 | Seller | 22 |
| 26 | UserDocument | 11 |
| 27 | Subcategory | 5 |
| 28 | LotCategory | 3 |
| 29 | Tenant | 3 |
| 30 | VehicleMake | 10 |
| 31 | Court | 17 |
| 32 | AuctionStage | 12 |
| 33 | _JudicialProcessToLot | 2 |
| 34 | _prisma_migrations | 1 |

---

## ✗ Tabelas Vazias (31)

As seguintes tabelas estão presentes no banco de dados, mas sem registros:

```
• AssetMedia
• bidder_notifications
• bidder_profiles
• BiddingSettings
• DataSource
• DirectSaleOffer
• DocumentTemplate
• IdMasks
• LotQuestion
• LotStagePrice
• MapSettings
• MentalTriggerSettings
• Notification
• NotificationSettings
• participation_history
• PasswordResetToken
• PaymentGatewaySettings
• payment_methods
• Report
• Review
• SectionBadgeVisibility
• Subscriber
• ThemeColors
• ThemeSettings
• UserLotMaxBid
• VariableIncrementRule
• won_lots
• _AuctionToCourt
• _AuctionToJudicialBranch
• _AuctionToJudicialDistrict
• _InstallmentPaymentToLot
```

---

## 🔝 Top 10 Tabelas com Mais Dados

1. **AssetsOnLots** - 364 registros (Relação entre ativos e lotes)
2. **UsersOnTenants** - 281 registros ↑ +36 (Associação de usuários a tenants)
3. **InstallmentPayment** - 175 registros (Pagamentos em parcelas)
4. **UsersOnRoles** - 223 registros ↑ +56 (Associação de usuários a papéis)
5. **Lot** - 194 registros ↑ +46 (Lotes de leilão)
6. **JudicialParty** - 192 registros ↑ +63 (Partes judiciais)
7. **AuctionHabilitation** - 160 registros ↑ +40 (Habilitações em leilão)
8. **Asset** - 101 registros (Ativos)
9. **Bid** - 139 registros ↑ +55 (Lances)
10. **JudicialDistrict** - 67 registros ↑ +11 (Distritos judiciais)

---

## 📋 Análise por Categoria

### Dados de Leilão (Auctions)
- Auctions: 72 ↑ +23
- Lots: 194 ↑ +46
- AuctionStage: 12
- Auctioneer: 7 ↑ +3
- **Status:** ✓ Dados presentes (crescimento significativo)

### Dados de Usuários (Users)
- User: 6 ↑ +1
- UsersOnRoles: 223 ↑ +56
- UsersOnTenants: 281 ↑ +36
- Role: 6
- **Status:** ✓ Dados presentes (crescimento significativo em associações)

### Dados de Processos Judiciais
- JudicialProcess: 36 ↑ +21
- JudicialParty: 192 ↑ +63
- JudicialBranch: 36 ↑ +11
- JudicialDistrict: 67 ↑ +11
- Court: 17 ↑ +5
- **Status:** ✓ Dados presentes (crescimento significativo)

### Dados de Ativos
- Asset: 101
- AssetsOnLots: 364
- **Status:** ✓ Dados presentes

### Dados de Lances e Arremates
- Bid: 139 ↑ +55
- UserWin: 27
- AuctionHabilitation: 160 ↑ +40
- InstallmentPayment: 175
- **Status:** ✓ Dados presentes (crescimento muito significativo em lances)

### Dados de Configuração
- PlatformSettings: 5 ↑ +1
- Tenant: 3
- LotCategory: 3
- **Status:** ✓ Dados presentes

### Dados de Dashboard de Licitante (Bidder)
- bidder_profiles: 0
- bidder_notifications: 0
- participation_history: 0
- won_lots: 0
- payment_methods: 0
- **Status:** ✗ Tabelas vazias

### Dados de Vendas Diretas
- DirectSaleOffer: 0
- **Status:** ✗ Tabelas vazias

### Dados de Notificações
- Notification: 0
- NotificationSettings: 0
- **Status:** ✗ Tabelas vazias

### Dados de Perguntas e Avaliações
- LotQuestion: 0
- Review: 0
- **Status:** ✗ Tabelas vazias

### Dados de Temas e Configurações de UI
- ThemeSettings: 0
- ThemeColors: 0
- MapSettings: 0
- IdMasks: 0
- **Status:** ✗ Tabelas vazias

### Configurações de Lances
- BiddingSettings: 0
- **Status:** ✗ Tabelas vazias

### Configurações de Pagamento
- PaymentGatewaySettings: 0
- **Status:** ✗ Tabelas vazias

---

## 🎯 Conclusão

✅ **O banco de dados está recebendo dados continuamente:**
- **+383 novos registros** foram adicionados desde a última consulta
- **15 tabelas tiveram crescimento**, com destaque para:
  - JudicialParty: +63 registros (novos atores judiciais)
  - Bid: +55 registros (novos lances sendo realizados)
  - UsersOnRoles: +56 registros (novos usuários recebendo papéis)
  - Lot: +46 registros (novos lotes criados)
  - UsersOnTenants: +36 registros (novos usuários em tenants)
  - AuctionHabilitation: +40 registros (novos usuários habilitados em leilões)
  - Auction: +23 registros (novos leilões criados)
  - JudicialProcess: +21 registros (novos processos judiciais)

✓ **Sistema operacional em crescimento:**
- Usuários sendo criados e atribuindo papéis
- Leilões e lotes sendo configurados
- Lances sendo realizados ativamente
- Dados judiciais sendo processados
- Histórico de pagamentos mantido

⚠️ **Dados ainda não populados:**
- Perfis de licitante (bidder_profiles)
- Histórico de participação
- Notificações
- Perguntas e avaliações de lotes
- Configurações de temas e UI
- Ofertas de vendas diretas
- Configurações de lances e pagamento

**Recomendação:** O sistema está em operação com crescimento constante de dados. Monitore o crescimento continuamente, especialmente nas tabelas de lances (Bid) e processos judiciais que estão tendo expansão rápida.

---

**Método de Consulta:** Script Node.js com mysql2 package  
**Frequência de Atualização:** Verificações contínuas
**Total de Registros (Atual):** 2.314
