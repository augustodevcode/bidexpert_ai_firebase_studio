Feature: Competitividade da vitrine pública

  Scenario: Header público mantém apenas um link principal para lotes
    Given que a navegação pública possui entradas duplicadas para "/lots"
    When o header desktop e mobile são normalizados antes do render
    Then apenas a primeira ocorrência de "Lotes" permanece visível
    And o item continua destacado antes de "Início"

  Scenario: Dashboard do arrematante não vaza payload Prisma ao cliente
    Given que o dashboard carrega lotes recomendados com campos Decimal, BigInt e Date
    When a server action retorna esses dados para a página cliente
    Then o payload chega serializado em tipos plain JSON
    And o browser não emite warnings de serialização Decimal ou objetos não plain

  Scenario: Vitrine pública de lotes expõe taxonomia e sinais de confiança
    Given que existem lotes públicos em modalidades distintas
    When a página "/lots" é renderizada
    Then a taxonomia de modalidades aparece antes da grade principal
    And a trilha de confiança destaca oportunidades abertas, rastreabilidade processual e descoberta avançada