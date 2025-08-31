# language: pt
Funcionalidade: Extensão automática do leilão (Anti-Sniping)
  Como um Arrematante
  Eu quero que o tempo de um leilão seja estendido se um lance for dado nos últimos segundos
  Para que uma disputa justa seja garantida e todos tenham a chance de contra-ofertar

  Contexto:
    Dado que existe um leilão "Ativo" com o status "ABERTO_PARA_LANCES"
    And a regra de "Anti-Sniping" está habilitada com uma janela de "30 segundos"
    And o lote "Item Raro" deste leilão está programado para terminar em "25 segundos"
    And o lance atual do lote é "R$ 1.000"

  @happy-path @bidding @anti-sniping
  Cenário: Lance dentro da janela de extensão
    Quando eu envio um lance válido de "R$ 1.100" a 10 segundos do término
    Then o término do lote "Item Raro" é estendido e agora deve terminar em "30 segundos"
    And meu lance de "R$ 1.100" se torna o atual vencedor
    And notificações em tempo real são disparadas para os outros interessados
    And a interface do usuário é atualizada com o novo tempo de término

  @edge-case @bidding @anti-sniping
  Cenário: Lance fora da janela de extensão
    Dado que o lote "Item Raro" deste leilão está programado para terminar em "45 segundos"
    Quando eu envio um lance válido de "R$ 1.100"
    Then o término do lote "Item Raro" não é alterado e continua sendo "45 segundos"
    And meu lance de "R$ 1.100" se torna o atual vencedor

  @failure-case @bidding @anti-sniping
  Cenário: A regra de Anti-Sniping está desabilitada
    Dado que a regra de "Anti-Sniping" está desabilitada para o leilão "Ativo"
    Quando eu envio um lance válido de "R$ 1.100" a 5 segundos do término
    Then o término do lote "Item Raro" não é alterado
    And o leilão encerra em "5 segundos" com meu lance como vencedor
    And não há extensão de tempo
