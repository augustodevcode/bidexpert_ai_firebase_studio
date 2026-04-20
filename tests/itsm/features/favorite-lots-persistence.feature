Feature: Persistência de lotes favoritos
  Como investidor autenticado
  Quero que meus lotes favoritos sejam sincronizados com minha conta
  Para reencontrá-los no dashboard mesmo após limpar o cache local

  Scenario: Recuperar favoritos persistidos no dashboard
    Given que estou autenticado no tenant demo
    And favoritei um lote público
    When acesso o dashboard de favoritos após limpar o localStorage
    Then o lote favoritado deve continuar visível no dashboard
    And a lista deve ser reconstruída a partir da persistência backend