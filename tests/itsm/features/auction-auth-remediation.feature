Feature: Remediação de cadastro de leilão e alias de autenticação

  Scenario: Bloquear praça sem data de encerramento
    Given que um administrador preenche um leilão com ao menos uma praça
    When a praça é enviada sem data de encerramento válida
    Then o sistema bloqueia a persistência antes de chamar o Prisma
    And exibe uma mensagem descritiva informando que a praça precisa de data de encerramento

  Scenario: Redirecionar alias público de login
    Given que um usuário acessa /login com um parâmetro redirect
    When o App Router resolve a rota pública de login
    Then o usuário é redirecionado para /auth/login
    And o parâmetro redirect é preservado na URL final

  Scenario: Bloquear criação de leilão sem leiloeiro
    Given que um administrador preenche o formulário de leilão
    When o campo leiloeiro não é selecionado
    Then o formulário exibe a mensagem "Selecione o leiloeiro responsável"
    And o backend rejeita a submissão com mensagem sobre leiloeiro obrigatório

  Scenario: Bloquear criação de leilão sem comitente
    Given que um administrador preenche o formulário de leilão
    When o campo comitente não é selecionado
    Then o formulário exibe a mensagem "Selecione o comitente"
    And o backend rejeita a submissão com mensagem sobre comitente obrigatório

  Scenario: Exibir feedback de carregamento no painel admin
    Given que um administrador acessa o painel administrativo
    When a sessão do usuário está sendo carregada
    Then o sistema exibe um spinner com a mensagem "Carregando painel administrativo…"
    And o estado de loading possui identificador data-ai-id para testes

  Scenario: Preservar retorno ao lote ao pedir login pelo painel de lances
    Given que um visitante acessa um lote público aberto para lances
    When ele usa o CTA "Fazer Login" dentro do painel de lances
    Then o sistema navega para /auth/login
    And o parâmetro redirect preserva a URL completa do lote de origem