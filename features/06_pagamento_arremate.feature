# language: pt
Funcionalidade: Pagamento de Lote Arrematado
  Como um Arrematante vencedor
  Eu quero pagar pelo lote que eu arrematei
  Para que eu possa receber o produto e finalizar a transação

  Contexto:
    Dado que eu sou um "Arrematante" logado
    And eu venci o leilão do lote "Notebook Gamer" com um lance de "R$ 4.000"
    And um registro de "UserWin" foi criado para mim com status de pagamento "PENDENTE"
    And a comissão do leiloeiro é de 5% e há uma taxa administrativa de R$ 50,00
    And o valor total a pagar é "R$ 4.250,00"

  @happy-path @payments
  Cenário: Pagamento com cartão de crédito bem-sucedido
    Quando eu acesso a minha página de "Arremates" e clico em "Pagar" para o lote "Notebook Gamer"
    And eu sou redirecionado para o checkout do gateway de pagamento
    And eu preencho os dados do meu cartão de crédito e confirmo o pagamento
    And o gateway de pagamento processa e aprova a transação
    Then eu devo ser redirecionado de volta para a plataforma com uma mensagem de "Pagamento realizado com sucesso"
    And o status de pagamento do meu arremate deve mudar para "PAGO"
    And uma fatura/recibo deve ser gerada e disponibilizada para mim

  @failure-case @payments
  Cenário: Pagamento com cartão de crédito recusado
    Quando eu acesso a minha página de "Arremates" e clico em "Pagar"
    And eu sou redirecionado para o checkout do gateway de pagamento
    And eu preencho os dados de um cartão sem saldo e confirmo
    And o gateway de pagamento recusa a transação
    Then eu devo ser redirecionado de volta para a plataforma com uma mensagem de "Pagamento falhou. Tente novamente ou use outro método."
    And o status de pagamento do meu arremate deve permanecer "PENDENTE"

  @edge-case @payments
  Cenário: Webhook de confirmação de pagamento recebido do gateway
    Dado que eu realizei o pagamento via boleto e ele está sendo processado
    And o status do meu pagamento é "PROCESSANDO"
    When o sistema recebe um webhook do gateway de pagamento confirmando a transação para o meu arremate
    Then o sistema deve validar a autenticidade do webhook
    And o status de pagamento do meu arremate deve ser atualizado para "PAGO"
    And eu devo receber uma notificação por email confirmando o pagamento

  @security @payments
  Cenário: Tentativa de pagar o arremate de outro usuário
    Dado que o "Arrematante B" venceu o lote "Smartphone XPTO"
    When eu tento acessar a URL de checkout para o arremate do "Arrematante B"
    Then o sistema deve retornar um erro de "Acesso Negado" (403)
    And eu não devo conseguir visualizar ou iniciar o pagamento para aquele arremate
