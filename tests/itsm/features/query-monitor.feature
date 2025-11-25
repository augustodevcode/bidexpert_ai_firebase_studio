# language: pt
Funcionalidade: ITSM Admin - Monitor de Queries
  Como um administrador do sistema
  Eu quero monitorar queries SQL em tempo real
  Para que eu possa identificar problemas de performance

  Contexto:
    Dado que estou logado como administrador
    E estou em qualquer página do painel admin

  Cenário: Visualizar monitor de queries no rodapé
    Dado que estou em "/admin"
    Então devo ver o rodapé fixo do monitor de queries
    E o monitor deve ter fundo escuro (slate-900)
    E devo ver o ícone de banco de dados
    E devo ver o texto "Query Monitor"

  Cenário: Visualizar estatísticas de queries
    Dado que o monitor está visível
    Então devo ver a estatística "Total"
    E devo ver a estatística "Média"
    E se houver queries lentas, devo ver badge "Lentas"
    E se houver queries com falha, devo ver badge "Falhas"

  Cenário: Expandir monitor para ver detalhes
    Dado que o monitor está minimizado
    Quando eu clicar em "Expandir"
    Então o monitor deve expandir suavemente
    E devo ver a lista de queries recentes
    E devo ver até 50 queries
    E o botão deve mudar para "Minimizar"

  Cenário: Minimizar monitor
    Dado que o monitor está expandido
    Quando eu clicar em "Minimizar"
    Então o monitor deve minimizar suavemente
    E apenas as estatísticas devem ficar visíveis

  Cenário: Visualizar query rápida
    Dado que o monitor está expandido
    E existe uma query que levou 200ms
    Então a query deve ter badge verde
    E deve mostrar "200ms"

  Cenário: Visualizar query moderada
    Dado que o monitor está expandido
    E existe uma query que levou 750ms
    Então a query deve ter badge amarelo
    E deve mostrar "750ms"

  Cenário: Visualizar query lenta
    Dado que o monitor está expandido
    E existe uma query que levou 1500ms
    Então a query deve ter badge vermelho
    E deve mostrar "1.50s"
    E deve incrementar contador de "Lentas"

  Cenário: Visualizar query com erro
    Dado que o monitor está expandido
    E existe uma query que falhou
    Então a query deve ter fundo vermelho
    E deve mostrar ícone de alerta
    E deve incrementar contador de "Falhas"

  Cenário: Atualização automática do monitor
    Dado que o monitor está visível
    Quando uma nova query é executada
    Então o monitor deve atualizar em até 5 segundos
    E a nova query deve aparecer no topo da lista
    E as estatísticas devem ser recalculadas

  Cenário: Verificar informações da query
    Dado que o monitor está expandido
    E existe uma query registrada
    Então cada query deve mostrar:
      | Campo      |
      | SQL query  |
      | Duração    |
      | Timestamp  |
      | Endpoint   |
      | Status     |
