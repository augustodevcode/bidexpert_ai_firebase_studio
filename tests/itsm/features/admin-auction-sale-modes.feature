Feature: Modalidades de venda no cadastro de leilões
  Como administrador de leilões
  Quero configurar modalidades de venda no cadastro
  Para manter paridade operacional com fluxos ABA e salvar regras de proposta, preferência e venda direta

  Scenario: Salvar modalidades de venda com prazo de propostas
    Given que o administrador abriu o cadastro de um leilão
    When habilita Permitir Propostas, Direito de Preferência e Venda Direta
    And informa a Data Limite para Propostas
    Then o leilão salva as modalidades selecionadas
    And o cadastro reabre com os mesmos valores persistidos

  Scenario: Bloquear propostas sem data limite
    Given que o administrador habilitou Permitir Propostas
    When tenta salvar o leilão sem Data Limite para Propostas
    Then o formulário bloqueia a submissão
    And informa que a data limite é obrigatória para propostas