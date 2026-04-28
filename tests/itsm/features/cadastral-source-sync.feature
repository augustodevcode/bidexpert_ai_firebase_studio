Feature: Sincronização cadastral orientada a fonte no BidExpert
  Como QA/arquitetura do BidExpert
  Quero cadastrar fontes reais de leilão, tomada de preço e venda direta usando os CRUDs administrativos
  Para garantir consistência relacional, visual e temporal entre origem e plataforma

  Scenario: Cadastrar e validar quatro fontes primárias reais no admin e no público
    Given que o administrador está autenticado no BidExpert DEV
    And os cadastros-base obrigatórios existem ou são criados pelos CRUDs administrativos
    When o sistema cadastra as fontes judiciais, extrajudiciais, tomada de preços e venda direta
    And o sistema cria vínculos relacionais entre cidades, seller, leiloeiro, processo, ativos, leilões, praças e lotes
    And o sistema publica documentos, riscos e preços por praça compatíveis com as fontes
    And o painel público de lances deve herdar o valor e o incremento da praça ativa sem cair em fallback genérico
    Then as listagens e detalhes administrativos devem refletir os títulos, localizações, modalidades e vínculos
    And as páginas públicas de leilão, lote, busca, home, home-v2 e lots devem exibir os dados sem divergência material
    And não deve existir erro de runtime, hidratação, FK quebrada ou praça sem nome na UI

  Scenario: Fixar matriz Superbid multi-modal com mais de cinco lotes visíveis por fonte
    Given que o QA selecionou fontes Superbid para Judicial, Leilão corporativo, Tomada de preço e Mercado Balcão
    When a matriz de fontes é usada como base do cadastro BidExpert
    Then cada fonte primária deve ter mais de cinco anúncios visíveis na página do evento
    And cada fonte deve mapear para uma modalidade BidExpert distinta
    And páginas de oferta agrupada com apenas um anúncio visível devem ficar fora da matriz primária
