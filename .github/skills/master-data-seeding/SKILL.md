---
name: master-data-seeding
description: Garante a integridade e completude total dos dados simulados (Seed) para todas as tabelas e colunas do projeto BidExpert.
---

# Master Data Seeding Skill

## Objective
Manter um sistema de seed de dados que popula **100% das tabelas** e **100% das colunas** do banco de dados com dados realistas e simulados para o ambiente de demonstração.

---

## 🔴 REGRAS OBRIGATÓRIAS (NUNCA ESQUECER)

### 1. Cobertura Total de Esquema
- **ZERO Tabelas Vazias**: Toda tabela definida no `schema.prisma` DEVE ter pelo menos 5-10 registros de dados de amostra.
- **ZERO Colunas Nulas**: Mesmo que uma coluna seja opcional no esquema, ela DEVE ser preenchida com dados realistas usando Faker ou lógica de negócio específica.
- **Integridade Referencial**: Chaves estrangeiras DEVEM sempre apontar para registros válidos criados anteriormente. Estruturas aninhadas (como `PlatformSettings` -> `IdMasks`) DEVEM ser totalmente expandidas.
- **Consistência de Telemetria e Labels**: Strings em logs ou mensagens simuladas (Ex: "Lance no Lote 005") devem corresponder a dados reais inseridos no banco.
- **Prioridade de Resolução de Tenant**: Chamadas públicas devem SEMPRE verificar headers de tenant antes do fallback padrão para evitar 404 em ambientes multi-tenant/subdomínios.
- **Integridade de Lotes**: Todo lote deve possuir `LotStagePrice` para cada `AuctionStage` ativo para garantir exibição correta de preços no frontend.

### 2. Uso OBRIGATÓRIO de Services
- **NUNCA usar `prisma.model.create()` diretamente** para entidades de negócio principais.
- **SEMPRE usar as classes de serviço** (ex: `UserService`, `AuctionService`, `SellerService`) para garantir que as validações e regras de negócio sejam aplicadas durante o seed.
- Isso serve para **testar a camada de serviço** ao mesmo tempo que populamos os dados.

### 3. Tenant 1 como Landlord Master
- O Tenant ID `1` é o **Landlord Master** do ambiente Demo.
- **TODOS os dados de seed** devem ser criados com `tenantId: BigInt(1)` ou `tenantId: "1"`.
- O isolamento multi-tenant DEVE ser respeitado.

### 4. Cenários de Negócio Realistas
- Os dados NÃO devem ser aleatórios sem contexto.
- **Simular jornadas reais**: Leilão -> Lote -> Lance -> Arrematação -> Pagamento -> Entrega.
- Estados diversos: Lotes `ABERTO_PARA_LANCES`, `VENDIDO`, `CANCELADO`; Pagamentos `PENDENTE`, `PAGO`, `ATRASADO`.

---

## 📋 Áreas Obrigatórias de Cobertura

| Fase | Tabelas |
|------|---------|
| Core Infra | Tenant, Role, User, UsersOnRoles, UsersOnTenants |
| Geografia | State, City |
| Judicial | Court, JudicialDistrict, JudicialBranch, JudicialProcess, ProcessParty |
| Participantes | Seller, Auctioneer, BidderProfile |
| Inventário | LotCategory, Subcategory, VehicleMake, VehicleModel, Asset, AssetMedia |
| Leilões | Auction, AuctionStage, Lot, LotStagePrice, LotRisk, LotDocument, AuctionHabilitation |
| Lances | Bid, UserLotMaxBid |
| Arremates | UserWin, WonLot, InstallmentPayment, Payment |
| Interação | LotQuestion, Review, DirectSaleOffer, ParticipationHistory |
| CRM | Subscriber, Notification, ContactMessage, BidderNotification |
| Suporte | ITSM_Ticket, ITSM_Message, ITSM_Attachment, ITSM_ChatLog, ITSM_QueryLog |
| Comunicação | SellerChat, SellerChatMessage |
| Automação | BotSchedule, BotSession, BotTelemetry |
| Logs | AuditLog, Visitor, VisitorSession, VisitorEvent, EntityViewMetrics |
| Configs | PlatformSettings, ThemeSettings, ThemeColors, IdMasks, MapSettings, BiddingSettings, PaymentGatewaySettings, NotificationSettings, RealtimeSettings, VariableIncrementRule |
| Documentos | DocumentType, DocumentTemplate, UserDocument, Document |
| Faturamento | TenantInvoice, CounterState |
| Validação | ValidationRule, FormSubmission |
| Token | PasswordResetToken |

---

## 📦 Scripts Designados

| Script | Propósito |
|--------|-----------|
| **[ultimate-master-seed.ts](file:///e:/SmartDataCorp/BidExpert/BidExpertVsCode/bidexpert_ai_firebase_studio/scripts/ultimate-master-seed.ts)** | Script definitivo com 100% de cobertura e uso de services. |

---

## 🛠️ Processo de Manutenção

1.  **Ao modificar `schema.prisma`**: Qualquer novo model ou campo DEVE ser imediatamente adicionado ao script master seed.
2.  **Ao criar nova funcionalidade**: Se a feature toca uma tabela, o seed DEVE ser atualizado para cobrir a feature.
3.  **Antes de demo/review**: Executar `npm run db:seed:ultimate` para garantir banco completo.

---

## 🚀 Comandos NPM

```bash
# Execução do seed completo (RECOMENDADO para demos)
npm run db:seed:ultimate
```

---

## ⚠️ Anti-Padrões (NÃO FAZER)

- ❌ Criar seeds "rápidos" que só populam 2-3 tabelas.
- ❌ Usar `prisma.user.create()` ao invés de `userService.createUser()`.
- ❌ Deixar colunas `null` quando há dados de amostra disponíveis.
- ❌ Esquecer de vincular registros filhos aos pais (ex: `LotStagePrice` sem `AuctionStage`).
- ❌ Criar dados sem `tenantId`.
