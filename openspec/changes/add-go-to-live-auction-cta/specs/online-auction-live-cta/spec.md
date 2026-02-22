## ADDED Requirements

### Requirement: Exibição condicional do CTA de pregão online
O sistema SHALL exibir o botão "Ir para pregão online" apenas quando o leilão estiver na janela ativa de pregão e o usuário estiver autenticado e habilitado para o leilão.

#### Scenario: Usuário autenticado e habilitado durante janela ativa
- **GIVEN** um leilão com status `ABERTO_PARA_LANCES`
- **AND** a data atual está entre a abertura efetiva e o encerramento do leilão
- **AND** o usuário está autenticado e habilitado para o leilão
- **WHEN** a interface renderiza um card, lista, detalhe ou modal de leilão/lote
- **THEN** o CTA "Ir para pregão online" deve ser exibido
- **AND** deve navegar para `/auctions/{auctionId}/live`

#### Scenario: Usuário não autenticado
- **GIVEN** um leilão com status `ABERTO_PARA_LANCES` na janela ativa
- **AND** o usuário não está autenticado
- **WHEN** a interface renderiza um card, lista, detalhe ou modal de leilão/lote
- **THEN** o CTA "Ir para pregão online" não deve ser exibido

#### Scenario: Leilão fora da janela de pregão
- **GIVEN** um usuário autenticado e habilitado
- **AND** o leilão está fora da janela ativa (antes da abertura ou após o encerramento)
- **WHEN** a interface renderiza um card, lista, detalhe ou modal de leilão/lote
- **THEN** o CTA "Ir para pregão online" não deve ser exibido

### Requirement: Indicadores visuais do CTA
O sistema SHALL apresentar indicadores visuais de pregão ao vivo no CTA para reforçar contexto em tempo real.

#### Scenario: Renderização do CTA
- **GIVEN** o CTA é exibido
- **WHEN** o usuário visualiza o botão
- **THEN** o botão deve incluir ícone sugestivo de online
- **AND** deve incluir tooltip explicativa
- **AND** deve incluir badge "Online" com animação de piscar lento

### Requirement: Cobertura transversal de UI
O sistema SHALL disponibilizar o CTA em superfícies públicas e administrativas relacionadas a leilões e lotes.

#### Scenario: Locais obrigatórios de exibição
- **GIVEN** as condições de exibição são atendidas
- **WHEN** o usuário acessa cards/list items, detalhes, modais e listagens administrativas
- **THEN** o CTA deve estar disponível nesses contextos
