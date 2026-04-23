Feature: Modal compartilhado de seleção de processo judicial em toda a plataforma
  Como pessoa usuária do admin
  Quero ver o mesmo grid ampliado de processo judicial em qualquer seletor administrativo
  Para diferenciar corretamente qual processo devo vincular em leilões, bens e filtros operacionais

  Scenario: Todos os seletores administrativos de processo judicial usam o grid compartilhado ampliado
    Given que estou em uma tela administrativa com seletor de processo judicial em leilão, leilão v2, ativo ou loteamento
    When abro o modal de seleção de processo judicial em qualquer uma dessas superfícies
    Then devo visualizar as colunas Processo, Comitente, Vara, Comarca e Tribunal
    And devo visualizar as colunas Partes, Eletrônico, Matrícula, Registro, Tipo de ação, Cód. CNJ e Descrição da ação
    And devo continuar visualizando as colunas Bens e Lotes no mesmo grid
