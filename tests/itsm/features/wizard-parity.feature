Funcionalidade: Paridade do review do wizard de leilão

  Cenário: Review final expõe dados preenchidos para venda direta
    Dado que um administrador inicia o wizard na modalidade "Venda Direta"
    Quando ele preenche contatos públicos, URLs de documentos e opções de lance no formulário do leilão
    Então a etapa de revisão final exibe esses contatos antes da publicação
    E a etapa de revisão final exibe as URLs de documentos cadastradas
    E a etapa de revisão final exibe o resumo das opções de lance configuradas

  Cenário: Fluxo visual mantém o React Flow ativo
    Dado que um administrador acessa o assistente de criação de leilão
    Quando a seção "Visualização do Fluxo" é renderizada
    Então o canvas do React Flow deve estar visível
    E a mensagem "Visualização do Fluxo Indisponível" não deve aparecer
    E a modalidade "Venda Direta" deve continuar mapeada no grafo