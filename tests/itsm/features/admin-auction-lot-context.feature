Feature: Resiliência do contexto admin entre leilões e lotes

  Scenario: Sanitizar leilão individual para uso em formulário client-side
    Given que uma action administrativa retorna um leilão com campos BigInt e Date
    When o formulário de lote busca esse leilão para preencher o comitente automaticamente
    Then a resposta chega serializada com ids string e datas ISO

  Scenario: Preservar contexto do filtro ao abrir novo lote
    Given que o usuário está na listagem de lotes filtrada por leilão
    When ele aciona o CTA de novo lote
    Then a navegação mantém o mesmo auctionId na URL do formulário de criação