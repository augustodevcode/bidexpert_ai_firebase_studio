## ADDED Requirements
### Requirement: Persistência de Identidade Visual
O sistema SHALL persistir as configurações de identidade visual e temas por tenant via Prisma.

#### Scenario: Salvar configurações
- **WHEN** o usuário salva alterações de identidade visual
- **THEN** os valores são gravados no banco e retornam na próxima carga

### Requirement: Logo vindo da biblioteca de mídia
O sistema SHALL permitir usar logo apenas se existir na biblioteca de mídia.

#### Scenario: Seleção de logo
- **WHEN** o usuário seleciona um logo existente na biblioteca de mídia
- **THEN** o logo é associado à identidade visual e persistido

### Requirement: Opções completas de tema shadcn
O sistema SHALL expor todas as opções de tema padrão do shadcn para edição.

#### Scenario: Exibir opções
- **WHEN** a página de identidade visual é aberta
- **THEN** todas as opções de cores e tokens shadcn padrão são exibidas
