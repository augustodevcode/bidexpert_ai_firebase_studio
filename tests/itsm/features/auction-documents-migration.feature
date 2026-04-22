Feature: Migracao de documentos do leilao para estrutura normalizada
  Como equipe de produto e operacao
  Quero que os documentos de leilao usem a lista estruturada `documents`
  Para eliminar dependencia de URLs legadas e manter exibicao consistente no publico e no admin

  Scenario: Exibir edital no painel de due diligence com documentos normalizados
    Given um leilao com documentos publicos preenchidos em `documents`
    And sem preenchimento de `documentsUrl`
    When o resumo de due diligence do lote for montado
    Then o checklist deve marcar "Edital e documentos oficiais" como disponivel
    And deve existir um link de abertura do edital

  Scenario: Renderizar resumo do wizard com documentos normalizados
    Given um leilao com documentos normalizados incluindo edital e laudo
    When a secao de revisao final do wizard for montada
    Then o campo "Documentos do leilao" deve mostrar o link do edital
    And o campo "Laudo de avaliacao" deve mostrar o link do laudo

  Scenario: Fallback para URLs legadas enquanto houver dados antigos
    Given um leilao sem lista `documents`
    And com `documentsUrl`, `evaluationReportUrl` e `auctionCertificateUrl` preenchidos
    When os helpers de documentos publicos forem executados
    Then os documentos legados devem ser convertidos em documentos publicos exibiveis
