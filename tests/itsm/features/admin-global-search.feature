Feature: Busca global no header do Admin
  Como pessoa administradora
  Quero buscar entidades direto no header com atalho de teclado
  Para abrir rapidamente a pagina de edicao ou detalhe do resultado

  Scenario: Abrir busca e redirecionar para o resultado selecionado
    Given que estou autenticado no painel administrativo
    When abro a busca global pelo botao do header ou atalho de teclado
    And digito um termo de busca de leilao, lote ou usuario
    Then devo visualizar resultados da busca global
    And ao selecionar um resultado devo ser redirecionado imediatamente para a pagina de edicao ou detalhe correspondente

  Scenario: Hint de atalho deve ser contextual por sistema operacional
    Given que estou no header do admin
    When visualizo o hint de teclado da busca
    Then o hint deve exibir Ctrl+K em Windows/Linux e Cmd+K em macOS
