# BDD Scenarios - Isolamento Multi-Tenant Completo

## Feature: Isolamento de Dados Multi-Tenant

Como administrador da plataforma
Quero que os dados de cada tenant sejam completamente isolados
Para garantir privacidade e segurança dos dados

### Scenario: Usuário visualiza apenas leilões do seu tenant
**Given** um usuário "João" está logado no tenant "Leiloeiro A" com tenantId 1
**And** existe um leilão "Leilão 001" no tenant "Leiloeiro A" com tenantId 1
**And** existe um leilão "Leilão 002" no tenant "Leiloeiro B" com tenantId 2
**When** João busca por todos os leilões
**Then** deve ver apenas o "Leilão 001"
**And** não deve ver o "Leilão 002"
**And** a query deve incluir filtro `WHERE tenantId = 1`

### Scenario: Usuário visualiza apenas lotes do seu tenant
**Given** um usuário "Maria" está logada no tenant "Leiloeiro B" com tenantId 2
**And** existem 5 lotes no tenant "Leiloeiro A" com tenantId 1
**And** existem 3 lotes no tenant "Leiloeiro B" com tenantId 2
**When** Maria busca por todos os lotes
**Then** deve ver exatamente 3 lotes
**And** todos os lotes retornados devem ter tenantId = 2

### Scenario: Criar lote herda tenantId do leilão
**Given** existe um leilão "Leilão Premium" com tenantId 1
**When** um admin cria um novo lote para este leilão
**Then** o lote criado deve ter tenantId = 1
**And** o lote deve estar vinculado ao leilão correto

### Scenario: Criar estágio de leilão herda tenantId
**Given** existe um leilão "Leilão Judicial" com tenantId 1
**When** um admin cria um novo estágio para este leilão
**Then** o estágio criado deve ter tenantId = 1
**And** não deve ser visível para outros tenants

### Scenario: Lances são isolados por tenant
**Given** um lote "Lote 123" existe no tenant com tenantId 1
**And** um usuário "Pedro" está logado no tenant com tenantId 1
**When** Pedro dá um lance no "Lote 123"
**Then** o lance deve ser registrado com tenantId = 1
**And** apenas usuários do tenant 1 devem ver este lance

### Scenario: Acesso direto a recurso de outro tenant é negado
**Given** existe um lote com id 100 no tenant com tenantId 1
**And** um usuário "Carlos" está logado no tenant com tenantId 2
**When** Carlos tenta acessar o lote com id 100 diretamente via API
**Then** deve receber resposta HTTP 404 Not Found
**And** o acesso deve ser registrado no audit log
**And** a mensagem deve ser "Recurso não encontrado"

### Scenario: Relacionamentos respeitam tenantId
**Given** um lote "Lote 456" com tenantId 1
**And** um ativo "Ativo 789" com tenantId 1
**When** o ativo é vinculado ao lote via AssetsOnLots
**Then** o registro em AssetsOnLots deve ter tenantId = 1
**And** não deve ser possível vincular ativos de tenants diferentes

### Scenario: Vitórias de usuário são isoladas por tenant
**Given** um usuário "Ana" ganhou 2 lotes no tenant 1
**And** o mesmo usuário "Ana" ganhou 1 lote no tenant 2
**When** Ana visualiza suas vitórias enquanto logada no tenant 1
**Then** deve ver apenas as 2 vitórias do tenant 1
**And** não deve ver a vitória do tenant 2

### Scenario: Pagamentos parcelados respeitam tenant
**Given** uma vitória de usuário no tenant 1
**When** são criados pagamentos parcelados para esta vitória
**Then** todos os pagamentos devem ter tenantId = 1
**And** os pagamentos não devem ser visíveis em outros tenants

### Scenario: Perguntas sobre lotes são isoladas
**Given** um lote "Lote ABC" no tenant 1
**And** um usuário faz uma pergunta sobre este lote
**When** a pergunta é salva
**Then** a pergunta deve ter tenantId = 1
**And** apenas usuários do tenant 1 devem ver a pergunta

### Scenario: Avaliações de lotes são isoladas
**Given** um lote "Lote XYZ" no tenant 1
**And** um usuário avalia este lote com 5 estrelas
**When** a avaliação é salva
**Then** a avaliação deve ter tenantId = 1
**And** a média de avaliações deve considerar apenas reviews do mesmo tenant

### Scenario: Habilitações de leilão são isoladas
**Given** um leilão no tenant 1
**And** um usuário se habilita para este leilão
**When** a habilitação é registrada
**Then** deve ter tenantId = 1
**And** não deve interferir com habilitações de outros tenants

### Scenario: Tickets ITSM podem ter tenant opcional
**Given** um usuário está logado no tenant 1
**When** o usuário abre um ticket de suporte
**Then** o ticket pode ter tenantId = 1 (suporte específico)
**Or** o ticket pode ter tenantId = null (suporte global)

### Scenario: Categorias globais vs específicas de tenant
**Given** existe uma categoria "Veículos" global (isGlobal=true, tenantId=null)
**And** existe uma categoria "Imóveis Premium" específica (isGlobal=false, tenantId=1)
**When** um usuário do tenant 1 busca categorias
**Then** deve ver tanto categorias globais quanto específicas do seu tenant
**And** não deve ver categorias específicas de outros tenants

### Scenario: Migração de dados existentes
**Given** o sistema tem dados antigos sem tenantId
**When** o script de migração é executado
**Then** todos os registros devem receber tenantId apropriado
**And** nenhum registro deve ficar com tenantId null (exceto campos nullable)
**And** os relacionamentos devem ser preservados

### Scenario: Performance não é degradada
**Given** existem 10.000 lotes no sistema
**And** 5.000 pertencem ao tenant 1
**And** 5.000 pertencem ao tenant 2
**When** um usuário do tenant 1 busca lotes
**Then** a query deve usar índice em tenantId
**And** o tempo de resposta deve ser < 100ms
**And** apenas 5.000 lotes devem ser escaneados

### Scenario: Auditoria de acessos cross-tenant
**Given** um usuário do tenant 1 tenta acessar dados do tenant 2
**When** o acesso é negado
**Then** deve ser criado um registro em AuditLog
**And** o registro deve conter tenantId do usuário
**And** o registro deve conter detalhes da tentativa de acesso

## Feature: Validação de Integridade Multi-Tenant

### Scenario: Não é possível criar relacionamento cross-tenant
**Given** um lote "Lote A" com tenantId 1
**And** um ativo "Ativo B" com tenantId 2
**When** tento vincular o ativo ao lote via AssetsOnLots
**Then** deve retornar erro de validação
**And** a mensagem deve indicar "TenantId incompatível"

### Scenario: Atualização de tenantId é bloqueada
**Given** um lote existente com tenantId 1
**When** tento atualizar o tenantId para 2
**Then** deve retornar erro de validação
**And** a operação deve ser rejeitada
**And** o tenantId original deve ser mantido

### Scenario: Exclusão em cascata respeita tenant
**Given** um leilão com tenantId 1 que tem 5 lotes
**When** o leilão é excluído
**Then** todos os 5 lotes devem ser excluídos
**And** apenas dados do tenant 1 devem ser afetados
**And** dados de outros tenants devem permanecer intactos
