Feature: Central de gerenciamento - elegibilidade de loteamento
  Como administrador de leilões
  Quero selecionar apenas bens elegíveis no loteamento
  Para evitar criação de lotes com vínculos inválidos

  Scenario: Criar lote apenas com bens prontos
    Given que estou na aba de loteamento da central de gerenciamento de um leilão
    And existem bens com status de elegibilidade "READY" e "PENDING"
    When seleciono os bens elegíveis para loteamento
    Then o botão "Criar Lote" deve refletir somente a quantidade de bens "READY" selecionados
    And o link de criação deve enviar auctionId, assetIds elegíveis e returnTo para a aba de loteamento

  Scenario: Impedir seleção de bens pendentes
    Given que um bem possui pendência de loteamento
    When tento selecionar esse bem na tabela de loteamento
    Then o checkbox do bem deve permanecer desabilitado
    And a contagem para criação de lote não deve incluir o bem pendente
