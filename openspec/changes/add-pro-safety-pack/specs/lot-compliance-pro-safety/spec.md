## ADDED Requirements

### Requirement: Matrícula do Imóvel visível no lote
O sistema SHALL armazenar `property_matricula`/`property_registration_number` em `judicial_processes` e exibir em Lot Details (seção Propriedades) como badge com ícone de documento, com fallback "Informação não disponível" quando ausente.

#### Scenario: Exibição da matrícula
- **GIVEN** um lote com judicial_process.property_matricula preenchido
- **WHEN** o usuário abre `/auctions/{auctionId}/lots/{lotId}`
- **THEN** a seção Propriedades mostra badge "Matrícula do Imóvel" com o número
- **AND** o conteúdo respeita o tenant do lote

### Requirement: Situação de Ocupação estruturada
O sistema SHALL armazenar em `assets` o `occupation_status` (ENUM OCCUPIED|UNOCCUPIED|UNCERTAIN|SHARED_POSSESSION) com `occupation_notes`, `occupation_last_verified`, `occupation_updated_by`, e exibir no Lot Details como badge colorida, tooltip de última verificação, e banner de alerta quando OCCUPIED.

#### Scenario: Badge e alerta de ocupação
- **GIVEN** um asset vinculado ao lote com `occupation_status = OCCUPIED` e `occupation_last_verified`
- **WHEN** o usuário visualiza o Lot Details
- **THEN** ele vê badge de ocupação em vermelho com tooltip "Última verificação em <data>"
- **AND** um alerta é exibido avisando que o imóvel está ocupado

### Requirement: Tipo de Ação Judicial classificado
O sistema SHALL capturar `action_type` (ENUM USUCAPIAO|REMOCAO|HIPOTECA|DESPEJO|PENHORA|COBRANCA|INVENTARIO|DIVORCIO|OUTROS), `action_description`, `action_cnj_code` em `judicial_processes`, permitir edição no admin e filtro público `?actionType=` na listagem de lotes, exibindo badge "Ação: <tipo>" no card/detalhe.

#### Scenario: Filtro por tipo de ação
- **GIVEN** lotes indexados com `action_type`
- **WHEN** o usuário aplica `?actionType=USUCAPIAO`
- **THEN** a listagem retorna apenas lotes com `action_type = USUCAPIAO`
- **AND** cada card mostra badge "Ação: Usucapião"

### Requirement: Registro de Riscos por Lote
O sistema SHALL manter tabela `lot_risks` com `risk_type`, `risk_level (BAIXO|MEDIO|ALTO|CRITICO)`, `risk_description`, `mitigation_strategy`, `verified`, `verified_by`, `verified_at`, vinculada ao lote e tenant, listando na UI do lote uma seção "Riscos Identificados" com cores por nível e alerta destacado para `CRITICO`.

#### Scenario: Alerta para risco crítico
- **GIVEN** um lote com `lot_risks` contendo item `risk_level = CRITICO`
- **WHEN** o usuário abre o Lot Details
- **THEN** uma seção "Riscos Identificados" exibe cards coloridos
- **AND** um alerta prominente informa o risco crítico
