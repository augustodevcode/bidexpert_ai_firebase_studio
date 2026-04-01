Funcionalidade: Paridade do review do wizard de leilão

  Cenário: Review final expõe dados preenchidos para venda direta
    Dado que um administrador inicia o wizard na modalidade "Venda Direta"
    Quando ele preenche contatos públicos, URLs de documentos e opções de lance no formulário do leilão
    Então a etapa de revisão final exibe esses contatos antes da publicação
    E a etapa de revisão final exibe as URLs de documentos cadastradas
    E a etapa de revisão final exibe o resumo das opções de lance configuradas