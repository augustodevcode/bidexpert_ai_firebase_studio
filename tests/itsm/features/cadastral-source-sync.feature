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
    Then as listagens e detalhes administrativos devem refletir os títulos, localizações, modalidades e vínculos
    And as páginas públicas de leilão, lote, busca, home, home-v2 e lots devem exibir os dados sem divergência material
    And não deve existir erro de runtime, hidratação, FK quebrada ou praça sem nome na UI
