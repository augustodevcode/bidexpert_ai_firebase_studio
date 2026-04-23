Feature: Preview autenticado de leiloes nao publicados
  As um usuario interno com permissao de gestao
  I want abrir a rota publica de um leilao em rascunho ou em preparacao
  So that eu possa validar o conteudo antes da publicacao sem expor esse leilao para visitantes

  Scenario: Admin abre o preview de um leilao em rascunho pelo botao Ver Publico
    Given que existe um leilao em status RASCUNHO ou EM_PREPARACAO
    And que o usuario autenticado possui permissao para gerir leiloes ou lotes
    When ele acessa a rota publica do leilao a partir do admin
    Then a pagina deve buscar os dados em modo autenticado de preview
    And o leilao nao deve renderizar a mensagem Leilao Nao Encontrado

  Scenario: Visitante continua limitado ao filtro publico
    Given que existe um leilao em status RASCUNHO ou EM_PREPARACAO
    And que o usuario nao esta autenticado ou nao possui permissao de gestao
    When ele acessa a rota publica do leilao
    Then a pagina deve manter a busca em modo publico
    And o conteudo nao publicado nao deve ser exposto