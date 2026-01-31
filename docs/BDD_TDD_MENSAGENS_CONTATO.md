# BDD/TDD - Mensagens de Contato (Admin)

## BDD - Cenários

### Cenário: Visualizar mensagem completa
Dado que o administrador acessa a página de mensagens de contato
Quando ele seleciona uma mensagem na lista
Então o sistema exibe remetente, assunto, data e o texto completo da mensagem

### Cenário: Responder mensagem via SMTP
Dado que o administrador abriu uma mensagem de contato
Quando ele preenche assunto e resposta e envia
Então o sistema envia o e-mail ao remetente usando SMTP/SendGrid configurado e registra o log

## TDD - Casos cobertos

- Enviar resposta com dados válidos (service)
- Retornar erro quando a mensagem não existe
- Visualização do modal de resposta e formulário (visual/e2e)
