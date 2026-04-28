Feature: Resumo mínimo de auditoria no cadastro de leilão
  Como pessoa administradora
  Quero ver o rastro mínimo de governança no topo do formulário
  Para auditar rapidamente quem criou, atualizou e validou o leilão

  Scenario: Formulário de edição mostra auditoria mínima e link de histórico
    Given que estou editando um leilão já existente no admin
    When a tela do formulário é renderizada
    Then devo visualizar os campos Criado por, Atualizado em, Enviado para validação, Validado por e Validado em
    And devo ter um atalho para abrir o histórico completo do leilão