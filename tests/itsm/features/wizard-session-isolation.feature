Feature: Isolamento de sessão no wizard de leilão

  Scenario: Refetch do wizard não mistura ativos antigos com ativos criados na sessão
    Given que o tenant possui ativos históricos do mesmo comitente
    And o usuário cria novos ativos inline no passo de loteamento
    When o wizard recarrega os dados após o cadastro
    Then apenas os ativos criados na sessão corrente ficam elegíveis para loteamento individual

  Scenario: Seleção de processo judicial é determinística
    Given que existem múltiplos processos judiciais no tenant
    When o fluxo do wizard precisa vincular o processo de referência
    Then o teste seleciona o processo pelo número exato
    And não pela primeira linha disponível na listagem