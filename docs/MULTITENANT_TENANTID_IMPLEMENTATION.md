# Implementação de tenantId Multi-Tenant Completo

**Data:** 25/11/2024
**Status:** Em Implementação
**Branch:** feature/multi-tenant-tenantid-fix

## 1. Resumo Executivo

### Problema Identificado
Várias tabelas do sistema não possuem o campo `tenantId`, causando vazamento de dados entre tenants. Registros de um tenant podem ser visualizados por usuários de outros tenants.

### Solução
Adicionar o campo `tenantId` em todas as tabelas que armazenam dados específicos de tenant, garantindo isolamento completo de dados.

## 2. Análise de Tabelas

### 2.1 Tabelas que JÁ TÊM tenantId ✅
- Lot
- Asset
- Auction
- JudicialProcess
- Seller
- Auctioneer
- Bid
- Notification
- Report
- Subscriber
- DirectSaleOffer
- PlatformSettings
- CounterState
- AuditLog (nullable)
- FormSubmission (nullable)

### 2.2 Tabelas GLOBAIS (não precisam tenantId) ✅
- User
- Role
- UsersOnRoles
- Tenant
- UsersOnTenants
- PasswordResetToken
- VehicleMake
- VehicleModel
- ContactMessage
- DocumentTemplate
- Court
- JudicialDistrict
- JudicialBranch
- State
- City
- DocumentType

### 2.3 Tabelas que PRECISAM de tenantId ⚠️

#### Prioridade CRÍTICA (vazamento de dados confirmado):
1. **AuctionStage** - Estágios de leilão
2. **LotStagePrice** - Preços por estágio
3. **JudicialParty** - Partes processuais
4. **AssetsOnLots** - Relacionamento Asset-Lot
5. **AssetMedia** - Mídia de ativos
6. **UserWin** - Vitórias de usuário
7. **InstallmentPayment** - Pagamentos parcelados
8. **UserLotMaxBid** - Lances máximos
9. **AuctionHabilitation** - Habilitações
10. **Review** - Avaliações
11. **LotQuestion** - Perguntas sobre lotes

#### Prioridade ALTA (isolamento necessário):
12. **MediaItem** - Itens de mídia (nullable)
13. **UserDocument** - Documentos de usuário
14. **LotCategory** - Categorias (pode ser global ou por tenant)
15. **Subcategory** - Subcategorias (pode ser global ou por tenant)

#### Prioridade MÉDIA (módulos específicos):
16. **BidderProfile** - Perfil de arrematante
17. **WonLot** - Lotes ganhos
18. **BidderNotification** - Notificações de arrematante
19. **PaymentMethod** - Métodos de pagamento
20. **ParticipationHistory** - Histórico de participação

#### Prioridade BAIXA (configurações e logs):
21. **ValidationRule** - Regras de validação (nullable)
22. **ITSM_Ticket** - Tickets de suporte (nullable)
23. **ITSM_Message** - Mensagens de ticket
24. **ITSM_Attachment** - Anexos de ticket
25. **ITSM_ChatLog** - Logs de chat (nullable)
26. **ITSM_QueryLog** - Logs de query (nullable)
27. **ThemeSettings** - Configurações de tema
28. **ThemeColors** - Cores do tema
29. **IdMasks** - Máscaras de ID
30. **VariableIncrementRule** - Regras de incremento
31. **MapSettings** - Configurações de mapa
32. **BiddingSettings** - Configurações de lances
33. **PaymentGatewaySettings** - Configurações de gateway
34. **NotificationSettings** - Configurações de notificação
35. **MentalTriggerSettings** - Configurações de gatilhos mentais
36. **SectionBadgeVisibility** - Visibilidade de badges
37. **DataSource** - Fontes de dados

## 3. Estratégia de Implementação

### Fase 1: Schema Update
1. Atualizar schema.prisma com tenantId em todas as tabelas
2. Adicionar relacionamentos com Tenant
3. Adicionar índices para performance
4. Gerar migration

### Fase 2: Data Migration
1. Script para popular tenantId baseado em relacionamentos
2. Validação de integridade de dados
3. Backup antes da migração

### Fase 3: Code Update
1. Atualizar todos os repositórios
2. Adicionar filtro tenantId em todas as queries
3. Atualizar métodos create/update
4. Atualizar validações

### Fase 4: Testing
1. Testes unitários por repositório
2. Testes de integração
3. Testes E2E com Playwright
4. Testes de isolamento multi-tenant

### Fase 5: Documentation
1. BDD (Behavior-Driven Development)
2. TDD (Test-Driven Development)
3. Documentação de API
4. Guia de uso

## 4. Regras de Negócio (BDD)

### Feature: Isolamento Multi-Tenant Completo

#### Scenario: Usuário não deve ver dados de outro tenant
```gherkin
Given um usuário está logado no tenant "Leiloeiro A"
When o usuário busca por leilões
Then deve ver apenas leilões do tenant "Leiloeiro A"
And não deve ver leilões do tenant "Leiloeiro B"
```

#### Scenario: Dados relacionados devem ter o mesmo tenantId
```gherkin
Given um leilão existe no tenant "Leiloeiro A"
When um lote é criado para este leilão
Then o lote deve ter o mesmo tenantId do leilão
And todos os estágios do leilão devem ter o mesmo tenantId
```

#### Scenario: Não deve ser possível acessar dados de outro tenant via API
```gherkin
Given um lote existe no tenant "Leiloeiro A"
When um usuário do tenant "Leiloeiro B" tenta acessar este lote
Then deve receber erro 404 ou 403
And o acesso deve ser registrado em audit log
```

## 5. Checklist de Implementação

### Schema & Migration
- [ ] Atualizar schema.prisma
- [ ] Gerar migration
- [ ] Criar script de migração de dados
- [ ] Validar integridade referencial

### Repositories
- [ ] AuctionStageRepository
- [ ] LotStagePriceRepository
- [ ] JudicialPartyRepository
- [ ] AssetsOnLotsRepository
- [ ] AssetMediaRepository
- [ ] UserWinRepository
- [ ] InstallmentPaymentRepository
- [ ] UserLotMaxBidRepository
- [ ] AuctionHabilitationRepository
- [ ] ReviewRepository
- [ ] LotQuestionRepository
- [ ] MediaItemRepository
- [ ] UserDocumentRepository
- [ ] LotCategoryRepository
- [ ] SubcategoryRepository
- [ ] BidderProfileRepository
- [ ] WonLotRepository
- [ ] BidderNotificationRepository
- [ ] PaymentMethodRepository
- [ ] ParticipationHistoryRepository
- [ ] ValidationRuleRepository
- [ ] ITSM Repositories (Ticket, Message, Attachment, etc.)

### Services
- [ ] Atualizar todos os services que usam os repositories modificados
- [ ] Adicionar validação de tenantId em métodos create
- [ ] Adicionar filtro tenantId em métodos list/find

### API Routes
- [ ] Validar tenantId em todas as rotas
- [ ] Adicionar middleware de tenant validation
- [ ] Atualizar documentação de API

### Tests
- [ ] Testes unitários por repositório (TDD)
- [ ] Testes de integração
- [ ] Testes E2E com Playwright
- [ ] Testes de isolamento multi-tenant
- [ ] Testes de performance

### Documentation
- [ ] BDD scenarios
- [ ] TDD test cases
- [ ] API documentation
- [ ] Migration guide
- [ ] Deployment guide

## 6. Critérios de Aceitação

1. ✅ Todas as tabelas de dados de tenant possuem tenantId
2. ✅ Não é possível acessar dados de outro tenant
3. ✅ Todos os relacionamentos respeitam tenantId
4. ✅ Queries incluem filtro por tenantId
5. ✅ Testes E2E passam 100%
6. ✅ Performance não degradada
7. ✅ Documentação completa
8. ✅ Migration script validado

## 7. Riscos e Mitigações

### Risco 1: Perda de dados durante migration
**Mitigação:** Backup completo antes da migration + validação pós-migration

### Risco 2: Performance degradada
**Mitigação:** Índices otimizados + cache + query optimization

### Risco 3: Breaking changes em APIs
**Mitigação:** Versionamento de API + backward compatibility

### Risco 4: Dados órfãos sem tenantId
**Mitigação:** Script de validação + limpeza de dados

## 8. Rollback Plan

Se houver problemas:
1. Reverter migration no banco
2. Fazer checkout da branch anterior
3. Restaurar backup
4. Analisar logs de erro
5. Criar hotfix se necessário

## 9. Timeline

- **Dia 1-2:** Schema update + Migration + Data migration
- **Dia 3-5:** Code update (Repositories + Services)
- **Dia 6-7:** Testing (Unit + Integration + E2E)
- **Dia 8:** Documentation + Review
- **Dia 9:** Staging deployment + Validation
- **Dia 10:** Production deployment

## 10. Próximos Passos

1. ✅ Criar branch feature/multi-tenant-tenantid-fix
2. ⏳ Atualizar schema.prisma
3. ⏳ Gerar e testar migration
4. ⏳ Criar script de migração de dados
5. ⏳ Atualizar repositories
6. ⏳ Criar testes
7. ⏳ Validar e documentar
