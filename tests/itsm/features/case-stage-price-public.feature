Feature: Consistência pública do preço por praça
  Como visitante autenticado no BidExpert Demo
  Quero ver o lote CASE com o preço e o incremento da praça ativa refletidos no painel de lances
  Para não receber fallback genérico incompatível com o cadastro por praça

  Scenario: O lote CASE respeita o valor e o incremento da praça ativa no detalhe público
    Given que existe um lote CASE com preço por praça configurado
    And o usuário autenticado acessa o detalhe público do lote
    When a praça ativa define lance inicial de R$ 900.000,00 e incremento de R$ 5.000,00
    Then o botão principal deve mostrar "Dar Lance (R$ 900.000,00)"
    And os quick bids devem mostrar "+R$ 5.000", "+R$ 10.000" e "+R$ 25.000"
    And o painel não deve cair em incrementos genéricos "+R$ 100", "+R$ 200" ou "+R$ 500"