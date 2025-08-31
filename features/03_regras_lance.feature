# language: pt
Funcionalidade: Regras de Lance em um Lote
  Como um Arrematante habilitado
  Eu quero dar lances em lotes de meu interesse
  Para que eu possa tentar arrematá-los

  Contexto:
    Dado que eu sou um usuário "Arrematante" com status "HABILITADO"
    And existe um leilão "Leilão de Relógios Raros" com status "ABERTO_PARA_LANCES"
    And este leilão contém o lote "Relógio Suíço de Ouro"
    And o lance atual do lote é "R$ 10.000"
    And o incremento mínimo para este lote é "R$ 500"

  @happy-path @bidding
  Cenário: Dar um lance válido e se tornar o maior lance
    Quando eu dou um lance de "R$ 10.500" no lote "Relógio Suíço de Ouro"
    Then meu lance deve ser aceito
    And o lance atual do lote deve ser atualizado para "R$ 10.500"
    And meu nome de usuário deve aparecer como o maior lance atual
    And uma notificação em tempo real é enviada aos outros interessados no lote

  @failure-case @bidding
  Cenário: Tentar dar um lance menor que o incremento mínimo
    Quando eu tento dar um lance de "R$ 10.400" no lote "Relógio Suíço de Ouro"
    Then eu devo ver uma mensagem de erro informando "Seu lance deve ser de no mínimo R$ 10.500"
    And o lance atual do lote deve permanecer "R$ 10.000"

  @failure-case @bidding
  Cenário: Tentar dar um lance igual ao lance atual
    Quando eu tento dar um lance de "R$ 10.000" no lote "Relógio Suíço de Ouro"
    Then eu devo ver uma mensagem de erro informando "Seu lance deve ser maior que o lance atual"
    And o lance atual do lote deve permanecer "R$ 10.000"

  @edge-case @bidding
  Cenário: Tentar dar lance em um leilão que ainda não abriu
    Dado que o status do leilão "Leilão de Relógios Raros" é "EM_BREVE"
    When eu acesso a página do lote "Relógio Suíço de Ouro"
    Then o botão de "Dar Lance" deve estar desabilitado
    And eu devo ver uma mensagem informando que o leilão ainda não começou

  @edge-case @bidding
  Cenário: Tentar dar lance em um leilão já encerrado
    Dado que o status do leilão "Leilão de Relógios Raros" é "ENCERRADO"
    When eu acesso a página do lote "Relógio Suíço de Ouro"
    Then o botão de "Dar Lance" deve estar desabilitado
    And eu devo ver uma mensagem informando que o leilão está encerrado
