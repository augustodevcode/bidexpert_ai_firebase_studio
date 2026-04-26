Feature: Bootstrap do bridge realtime de lances

  Scenario: Custom server carrega o emissor de eventos de lance
    Given que o BidExpert inicia pelo custom server com ts-node
    When o servidor importa o servico de eventos realtime de lances
    Then o servico deve carregar sem depender de alias de modulo resolvido apenas pelo Next.js
    And o bridge Socket.io pode ser estabelecido sem erro de modulo ausente