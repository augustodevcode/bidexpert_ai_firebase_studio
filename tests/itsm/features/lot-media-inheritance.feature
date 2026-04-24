Feature: Herança opcional de galeria entre ativo e lote
  Como pessoa administradora
  Quero cadastrar galeria de fotos no ativo e decidir no lote se herdo ou customizo
  Para manter flexibilidade de mídia sem misturar fontes de forma involuntária

  Scenario: Cadastro de ativo com galeria persistível
    Given que estou no formulário administrativo de ativos
    When adiciono imagem principal e imagens na galeria pela biblioteca de mídia
    Then o ativo persiste imageMediaId e mediaItemIds da galeria
    And as miniaturas da galeria ficam visíveis no formulário

  Scenario: Lote herda galeria de ativo vinculado
    Given que o lote possui um ativo vinculado com galeria preenchida
    When escolho herdar a galeria do ativo no formulário de lote
    Then o payload do lote recebe imagem principal e galeria do ativo selecionado
    And o detalhe público do lote exibe a mídia herdada

  Scenario: Lote usa galeria própria sem misturar fallback do ativo
    Given que o lote possui imagem ou galeria customizada
    When salvo o lote em modo de galeria customizada
    Then o serviço prioriza a mídia do próprio lote
    And a galeria do ativo vinculado não é mesclada automaticamente
