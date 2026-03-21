Feature: Consistência de localização no leilão V2

  Scenario: Limpar cidade órfã ao trocar o estado
    Given que o formulário de leilão V2 possui um estado e uma cidade já selecionados
    When o usuário escolhe outro estado incompatível com a cidade atual
    Then o campo de cidade volta para o placeholder
    And o payload final não mantém uma combinação inválida de cidade e estado