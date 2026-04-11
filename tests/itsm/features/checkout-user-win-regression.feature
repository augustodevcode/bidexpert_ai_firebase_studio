Feature: Integridade do checkout e do termo de arrematação
  Como arrematante
  Quero abrir o checkout e baixar o termo sem erro de render
  Para concluir o fluxo pós-arremate com dados consistentes

  Scenario: Abrir checkout de um arremate pago sem erro 500
    Given o arremate 27 possui UserWin, lote e leilão vinculados
    And o usuário autenticado é o arrematante do registro
    When ele acessa /checkout/27
    Then o backend deve normalizar o contrato de UserWin antes da renderização
    And a navegação deve terminar em /checkout/27 ou /dashboard/wins sem erro de servidor

  Scenario: Gerar termo com o valor real do arremate
    Given o lote vendido possui winningBidAmount registrado no UserWin
    When o usuário solicita o termo de arrematação
    Then o documento deve usar o winningBidAmount como valor do arremate
    And ausência de seller ou leiloeiro embutidos no lote não deve quebrar a geração