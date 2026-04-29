Feature: Pregao multi-perfil filmado
  Como equipe de qualidade do BidExpert
  Quero filmar um pregao com atores reais separados por perfil
  Para comprovar que criacao, habilitacao, disputa, encerramento, laudo e cobranca seguem os contratos oficiais

  Scenario: Jornada filmada com 10 compradores e vencedor unico
    Given um agente de leilao cria um leilao e um lote em um tenant demo
    And um administrador habilita exatamente 10 compradores para o leilao
    And nenhum comprador possui papel de administrador
    When o leiloeiro agenda, abre o leilao e inicia o lote em pregao pela maquina de estado
    And os 10 compradores registram lances pelo BidEngineV2 em rodadas competitivas
    Then o monitor filmado exibe valor atual, quantidade de lances maior que zero e lider da disputa
    And o leiloeiro confirma como vencedor o comprador com maior lance ativo
    And o analista emite laudo, cobranca e parcelas somente para o vencedor
    And a evidencia Playwright contem video, prints e relatorio HTML da execucao
