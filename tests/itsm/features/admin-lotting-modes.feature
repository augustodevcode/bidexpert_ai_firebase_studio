Feature: Modos operacionais do loteamento administrativo
  Como operador do backoffice de leilões
  Quero alternar rapidamente entre estratégias explícitas de loteamento
  Para manter minhas preferências operacionais persistidas sem perder o contexto transitório da sessão

  Scenario: Persistir modo IA assistida com auto-save
    Given que estou na tela administrativa de loteamento
    When seleciono o modo "IA Assistida"
    Then o modo ativo é exibido de forma explícita
    And o filtro de ativos sinalizados fica habilitado
    And um indicador visual confirma o auto-save das preferências

  Scenario: Modo planilha amplia a revisão operacional
    Given que estou na tela administrativa de loteamento
    When seleciono o modo "Planilha Operacional"
    Then o filtro para incluir ativos já loteados fica habilitado
    And o resumo do modo orienta revisão em massa