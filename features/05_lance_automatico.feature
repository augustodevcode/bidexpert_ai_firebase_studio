# language: pt
Funcionalidade: Lance Automático (Max Bid)
  Como um Arrematante
  Eu quero definir um valor máximo para meu lance em um lote
  Para que o sistema dê lances por mim automaticamente até atingir meu limite, sem que eu precise acompanhar o leilão o tempo todo

  Contexto:
    Dado que eu sou o "Arrematante A" com status "HABILITADO"
    And o "Arrematante B" também tem status "HABILITADO"
    And existe um lote "Câmera Profissional" em um leilão "ABERTO_PARA_LANCES"
    And o lance inicial do lote é "R$ 2.000"
    And o incremento mínimo é "R$ 100"

  @happy-path @bidding @max-bid
  Cenário: Meu lance automático cobre o lance de outro arrematante instantaneamente
    Dado que eu registrei um lance automático de "R$ 3.000" para o lote "Câmera Profissional"
    Quando o "Arrematante B" dá um lance de "R$ 2.500"
    Then o sistema deve registrar automaticamente um lance em meu nome no valor de "R$ 2.600"
    And o lance atual do lote deve ser "R$ 2.600"
    And eu devo continuar como o maior licitante

  @happy-path @bidding @max-bid
  Cenário: Meu lance automático é superado por outro arrematante
    Dado que eu registrei um lance automático de "R$ 3.000" para o lote "Câmera Profissional"
    Quando o "Arrematante B" dá um lance de "R$ 3.100"
    Then o sistema deve registrar o lance do "Arrematante B" de "R$ 3.100"
    And o "Arrematante B" deve se tornar o maior licitante
    And meu lance automático se torna inativo ou é marcado como superado
    And eu devo ser notificado que meu lance máximo foi superado

  @edge-case @bidding @max-bid
  Cenário: Dois arrematantes registram o mesmo lance automático
    Dado que eu registrei um lance automático de "R$ 3.000" para o lote "Câmera Profissional"
    And o lance atual ainda é "R$ 2.000"
    Quando o "Arrematante B" registra um lance automático de "R$ 3.000" depois de mim
    Then o sistema deve registrar um lance de "R$ 3.000" em meu nome, pois fui o primeiro
    And o "Arrematante B" deve ser notificado que seu lance máximo foi igualado e superado instantaneamente
    And eu continuo como o maior licitante com o lance de "R$ 3.000"

  @failure-case @bidding @max-bid
  Cenário: Tentar registrar um lance automático menor que o próximo lance válido
    Dado que o lance atual do lote é "R$ 2.500"
    Quando eu tento registrar um lance automático de "R$ 2.550"
    Then o sistema deve exibir uma mensagem de erro "Seu lance máximo deve ser de no mínimo R$ 2.600"
    And meu lance automático não deve ser registrado
