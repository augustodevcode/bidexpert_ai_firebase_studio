## ADDED Requirements
### Requirement: Visualizar conteúdo da mensagem de contato
O sistema SHALL permitir que administradores visualizem o texto completo da mensagem recebida.

#### Scenario: Administrador abre detalhes da mensagem
- **WHEN** o administrador seleciona uma mensagem na lista
- **THEN** o sistema exibe o texto completo, remetente, assunto e data de recebimento

### Requirement: Responder mensagem via SMTP configurado
O sistema SHALL permitir que administradores respondam a uma mensagem usando a caixa SMTP/SendGrid configurada.

#### Scenario: Administrador envia resposta
- **WHEN** o administrador preenche a resposta e envia
- **THEN** o sistema envia o e-mail para o remetente e registra o status do envio
