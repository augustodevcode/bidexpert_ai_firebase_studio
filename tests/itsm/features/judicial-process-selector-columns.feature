Feature: Modal compartilhado de seleção de processo judicial
  Como pessoa usuária do admin
  Quero mais colunas no grid do processo judicial
  Para diferenciar corretamente qual processo devo vincular ao leilão

  Scenario: Modal judicial mostra colunas ampliadas sem perder bens e lotes
    Given que estou em uma tela administrativa com seletor de processo judicial
    When abro o modal de seleção de processo judicial
    Then devo visualizar as colunas Processo, Comitente, Vara, Comarca e Tribunal
    And devo visualizar as colunas Partes, Eletrônico, Matrícula, Registro, Tipo de ação, Cód. CNJ e Descrição da ação
    And devo continuar visualizando as colunas Bens e Lotes no mesmo gridFeature: Modal compartilhado de seleção de processo judicial
  Como pessoa usuária do admin
  Quero mais colunas no grid do processo judicial
  Para diferenciar corretamente qual processo devo vincular ao leilão

  Scenario: Modal judicial mostra colunas ampliadas sem perder bens e lotes
    Given que estou em uma tela administrativa com seletor de processo judicial
    When abro o modal de seleção de processo judicial
    Then devo visualizar as colunas Processo, Comitente, Vara, Comarca e Tribunal
    And devo visualizar as colunas Partes, Eletrônico, Matrícula, Registro, Tipo de ação, Cód. CNJ e Descrição da ação
    And devo continuar visualizando as colunas Bens e Lotes no mesmo grid
