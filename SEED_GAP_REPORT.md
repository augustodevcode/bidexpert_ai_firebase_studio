# RELATÓRIO DE GAPS — `scripts/ultimate-master-seed.ts`

> **Data:** 2026-02-16  
> **Arquivo:** `scripts/ultimate-master-seed.ts` (4585 linhas)  
> **Problema raiz:** O seed usa nomes de acesso snake_case MySQL (`prisma.bidder_profiles`) mas o Prisma Client gera acessores baseados no nome do model no schema (`prisma.bidderProfile`).  
> **Resultado:** O seed quebra na linha 268 (função `seedWonLotsWithServices`) ou linha 4221 (seção 12), impedindo a execução de todas as seções subsequentes.

---

## 1. GAPS DE NAMING — Modelo vs Accessor

O Prisma Client gera o accessor a partir do nome do `model` no schema, aplicando **camelCase** na primeira letra. Os dois schemas (`schema.prisma` MySQL e `schema.postgresql.prisma` PostgreSQL) usam os **mesmos nomes de model**, então o fix vale para ambos.

### Tabela de Correções Obrigatórias

| # | Model no Schema | Accessor Correto (`prisma.X`) | Accessor ERRADO no Seed | Linhas Afetadas |
|---|----------------|------------------------------|------------------------|-----------------|
| 1 | `BidderProfile` | `prisma.bidderProfile` | `prisma.bidder_profiles` | 268, 273, 987, 4221, 4224, 4227, 4235 |
| 2 | `PaymentMethod` | `prisma.paymentMethod` | `prisma.payment_methods` | 308, 310, 4255 |
| 3 | `BidderNotification` | `prisma.bidderNotification` | `prisma.bidder_notifications` | 327, 329, 4285 |
| 4 | `ParticipationHistory` | `prisma.participationHistory` | `prisma.participation_history` | 4269 |
| 5 | `WonLot` | `prisma.wonLot` | `prisma.won_lots` | 4326 |
| 6 | `AuditLog` | `prisma.auditLog` | `prisma.audit_logs` | 948, 957, 4413 |
| 7 | `ITSM_Ticket` | `prisma.iTSM_Ticket` | `prisma.itsm_tickets` | 1096, 1127, 1161, 1228, 1284, 4359 |
| 8 | `ITSM_ChatLog` | `prisma.iTSM_ChatLog` | `prisma.itsm_chat_logs` | 1291, 1353 |

> **NOTA:** Os seguintes modelos JÁ usam snake_case no schema e estão **CORRETOS** no seed:
> - `itsm_messages` → `prisma.itsm_messages` ✅
> - `itsm_attachments` → `prisma.itsm_attachments` ✅  
> - `itsm_query_logs` → `prisma.itsm_query_logs` ✅

---

## 2. GAPS DE RELAÇÕES NESTED

Ao usar `prisma.iTSM_Ticket.create()`, os nomes de relações nested também devem corresponder ao schema. Verificar:

| Linha no Seed | Relação Usada | Relação Correta no Schema |
|---------------|---------------|---------------------------|
| 4359 | `itsm_messages: { create: [...] }` | `itsm_messages: { create: [...] }` ✅ (nome de relação correto) |

---

## 3. GAP DE IMPORT COMENTADO

| Linha | Problema | Ação Necessária |
|-------|----------|-----------------|
| 52 | `// import { seedHabilitacoes } from './seed-habilitacoes-lib';` | Criar o módulo `scripts/seed-habilitacoes-lib.ts` OU remover a referência permanentemente |
| 4554 | `// await seedHabilitacoes(prisma, mainTenantId, UsersOnTenantsModel);` | Descomentar quando o módulo existir OU remover |

---

## 4. SEÇÕES DO SEED AFETADAS PELO CRASH

O erro na linha 268 (ou 4221) impede a execução de **TUDO** a partir desse ponto. Abaixo, a lista de seções que **NÃO foram populadas** no banco PostgreSQL demo:

### 4.1 Seções chamadas por `seedWonLotsWithServices()` (lib externa, linha ~268)
- `BidderProfile` — perfil do comprador (CPF, endereço, status documental)
- `AuctionHabilitation` — habilitação do arrematante nos leilões
- `LotDocument` — documentos dos lotes

### 4.2 Seção 12 — Dashboard do Arrematante (linhas 4218-4295)
- `BidderProfile` — perfil com dados pessoais, endereço, status documental
- `PaymentMethod` — método de pagamento (VISA *4242)
- `ParticipationHistory` — histórico de participação em leilões
- `BidderNotification` — notificações do arrematante

### 4.3 Seção 13 — Pós-Venda / Arremates (linhas 4297-4351)
- `Lot.update` — Lote Honda Civic **não marcado como VENDIDO**
- `UserWin` — registro de vitória
- `WonLot` — lote arrematado (view do dashboard)
- `InstallmentPayment` — parcelas de pagamento

### 4.4 Seção 14 — Suporte ITSM (linhas 4353-4380)
- `ITSM_Ticket` — ticket de suporte + mensagens nested

### 4.5 Seção 15 — Engajamento e Auditoria (linhas 4382-4430)
- `Review` — avaliação de lote
- `LotQuestion` — pergunta no lote
- `AuditLog` — log de auditoria
- `Notification` — notificação geral

### 4.6 Atualização Automática (linhas 4432-4530)
- Praças (`AuctionStage`) — leilões sem praças não receberam 1ª e 2ª praça
- Localização de Leilões — `zipCode`, `address` não preenchidos
- Localização de Lotes — `cityName`, `stateUf`, `mapAddress` não preenchidos
- Localização de Assets — `locationCity`, `locationState`, `address` não preenchidos

### 4.7 Seeds Complementares (linhas 4535-4565)
- `seedCriticalGlobalTables()` — States, Cities, Validation Rules
- `populateMissingData()` — dados faltantes genéricos
- `fixAuditInconsistencies()` — correção de inconsistências
- `seedItsmData()` — chamados de suporte completos (tickets, mensagens, anexos, chat logs, query logs)
- `seedWonLotsWithServices()` — leilões finalizados com arrematantes (2ª chamada)
- `seedMin50ZeroTables()` — mínimo de 50 registros em tabelas vazias

---

## 5. IMPACTO FUNCIONAL NO SITE

| Área | Status | Impacto |
|------|--------|---------|
| Listagem pública de leilões | ✅ Funciona | Dados criados antes da seção 12 |
| Busca e filtros | ⚠️ Parcial | Lotes sem `cityName`/`stateUf` não aparecem em filtros de localização |
| Mapa de lotes | ⚠️ Parcial | Assets sem coordenadas/endereço |
| Dashboard do Arrematante | ❌ Vazio | Sem `BidderProfile`, sem histórico, sem lotes ganhos |
| Pagamentos/Parcelas | ❌ Vazio | Sem `PaymentMethod`, sem `InstallmentPayment` |
| Suporte/ITSM | ❌ Vazio | Sem tickets, mensagens, chat logs |
| Backoffice — Auditoria | ❌ Vazio | Sem `AuditLog` |
| Notificações | ❌ Vazio | Sem `Notification`, sem `BidderNotification` |
| Super Oportunidades | ⚠️ Parcial | Leilões sem praças (`AuctionStage`) são filtrados fora |
| Avaliações/Perguntas | ❌ Vazio | Sem `Review`, sem `LotQuestion` |

---

## 6. PLANO DE CORREÇÃO (FIND & REPLACE)

### 6.1 Substituições Globais no arquivo `scripts/ultimate-master-seed.ts`

```
prisma.bidder_profiles    → prisma.bidderProfile        (7 ocorrências)
prisma.payment_methods    → prisma.paymentMethod        (3 ocorrências)
prisma.bidder_notifications → prisma.bidderNotification (2 ocorrências)
prisma.participation_history → prisma.participationHistory (1 ocorrência)
prisma.won_lots           → prisma.wonLot               (1 ocorrência)
prisma.audit_logs         → prisma.auditLog             (3 ocorrências)
prisma.itsm_tickets       → prisma.iTSM_Ticket          (6 ocorrências)
prisma.itsm_chat_logs     → prisma.iTSM_ChatLog         (2 ocorrências)
```

**Total: 25 substituições em 32 linhas (algumas linhas têm múltiplos usos)**

### 6.2 Verificar também em libs externas

- `scripts/seed-won-lots-lib.ts` — pode ter os mesmos problemas de naming
- `scripts/seed-min-50-lib.ts` — pode ter os mesmos problemas de naming

### 6.3 Criar módulo ausente (opcional)

- `scripts/seed-habilitacoes-lib.ts` — criar com export `seedHabilitacoes(prisma, tenantId, UsersOnTenantsModel)` para popular 35 usuários com diferentes status de habilitação

---

## 7. VALIDAÇÃO PÓS-CORREÇÃO

Após aplicar as correções, executar o seed via PPG tunnel e validar:

```sql
-- Contar registros nas tabelas afetadas
SELECT 'BidderProfile' as tbl, COUNT(*) as cnt FROM "BidderProfile"
UNION ALL SELECT 'PaymentMethod', COUNT(*) FROM "PaymentMethod"
UNION ALL SELECT 'ParticipationHistory', COUNT(*) FROM "ParticipationHistory"
UNION ALL SELECT 'BidderNotification', COUNT(*) FROM "BidderNotification"
UNION ALL SELECT 'WonLot', COUNT(*) FROM "WonLot"
UNION ALL SELECT 'AuditLog', COUNT(*) FROM "AuditLog"
UNION ALL SELECT 'ITSM_Ticket', COUNT(*) FROM "ITSM_Ticket"
UNION ALL SELECT 'ITSM_ChatLog', COUNT(*) FROM "ITSM_ChatLog"
UNION ALL SELECT 'itsm_messages', COUNT(*) FROM "itsm_messages"
UNION ALL SELECT 'itsm_attachments', COUNT(*) FROM "itsm_attachments"
UNION ALL SELECT 'itsm_query_logs', COUNT(*) FROM "itsm_query_logs"
UNION ALL SELECT 'Review', COUNT(*) FROM "Review"
UNION ALL SELECT 'LotQuestion', COUNT(*) FROM "LotQuestion"
UNION ALL SELECT 'Notification', COUNT(*) FROM "Notification"
UNION ALL SELECT 'AuctionStage', COUNT(*) FROM "AuctionStage"
UNION ALL SELECT 'State', COUNT(*) FROM "State"
UNION ALL SELECT 'City', COUNT(*) FROM "City";
```

**Critério de sucesso:** Todas as tabelas com `cnt > 0`.

---

## 8. NOTAS ADICIONAIS

1. **Database Accelerate URL** (Prisma Postgres): O seed PRECISA de uma URL direta ou usar PPG tunnel. A URL Accelerate (`prisma+postgres://accelerate.prisma-data.net/...`) **não funciona** com `new PrismaClient()` usado no seed (ele precisa de TCP direto).

2. **Variável `DEMO_DATABASE_URL_DIRECT`** no GitHub Secrets: Atualmente aponta para a URL Accelerate. O CI/CD job `migrate` que roda `prisma db push` e o seed vai **falhar** por isso. Solução: usar PPG tunnel no CI ou obter URL direta TCP do Prisma Console.

3. **Compatibilidade DB_TYPE detection** (linhas 58-60): O seed detecta `IS_POSTGRES` via `DATABASE_URL.includes('postgres://')`, mas URLs Accelerate começam com `prisma+postgres://` — a detecção funciona porque `includes('postgres://')` match parcial. Porém, vale validar se não há lógica condicional que dependa de `IS_MYSQL` para naming.

4. **Commit pendente**: O arquivo `scripts/ultimate-master-seed.ts` tem alteração não commitada (linha 52 comentada). Garantir que o commit inclua tanto o fix de naming quanto a remoção/criação do módulo `seed-habilitacoes-lib`.
