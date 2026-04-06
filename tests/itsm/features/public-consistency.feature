Funcionalidade: Consistencia publica de status, cronologia e setup
  Como pessoa usuaria da plataforma
  Quero ver status e datas coerentes em toda a jornada
  Para confiar no estado real do leilao e do lote

  Cenario: Bloquear acesso geral quando o setup nao foi concluido
    Dado que a plataforma possui isSetupComplete igual a false
    Quando uma pessoa acessa qualquer rota diferente de /setup
    Entao ela deve ser redirecionada para /setup

  Cenario: Impedir retorno ao setup depois da conclusao
    Dado que a plataforma possui isSetupComplete igual a true
    Quando uma pessoa acessa /setup
    Entao ela deve ser redirecionada para /admin/dashboard

  Cenario: Exibir status efetivo encerrado quando a janela temporal ja terminou
    Dado que um leilao ou lote possui status persistido aberto
    E que a data efetiva de encerramento ja passou
    Quando a interface publica renderiza badge, cronometro e timeline
    Entao todos os elementos devem indicar estado encerrado de forma consistente

  Cenario: Ordenar pracas pela cronologia real
    Dado que um leilao possui pracas cadastradas fora da ordem de insercao
    Quando a timeline publica ou o service normalizam essas pracas
    Entao a renderizacao e a persistencia devem respeitar a ordem cronologica crescente

  Cenario: Aplicar a mesma elegibilidade de lance na interface e no backend
    Dado que uma pessoa usuaria possui documentacao pendente ou nao esta habilitada no leilao
    Quando ela tenta dar um lance manual ou configurar lance automatico
    Entao a interface deve exibir o motivo correto do bloqueio
    E o backend deve recusar a operacao com a mesma regra de elegibilidade

  Cenario: Projetar corretamente a publicacao judicial criada pelo wizard
    Dado que um leilao judicial publicado nao possui lance minimo preenchido no nivel do leilao
    E que o lote publicado herda descricao e localizacao do ativo vinculado
    Quando a vitrine publica renderiza o hero do leilao, a aba de lotes e o detalhe do lote
    Entao o hero deve exibir a proxima praca correta e o lance minimo derivado do lote
    E a aba de lotes e o detalhe do lote devem exibir localizacao e descricao herdadas do ativo

  Cenario: Exibir planejamento financeiro coerente no detalhe do lote
    Dado que um lote publico esta aberto para lances
    Quando a pessoa acessa o detalhe desse lote
    Entao a lateral deve mostrar o proximo lance valido, o incremento minimo e o total estimado com comissao
    E a aba de planejamento deve explicar que custos adicionais dependem do edital

  Cenario: Exibir due diligence e custo total no detalhe do lote
    Dado que um lote publico possui contexto juridico ou documental
    Quando a pessoa abre as abas de planejamento e juridico no detalhe desse lote
    Entao a aba de planejamento deve exibir um simulador CET com composicao do custo total estimado
    E a aba juridica deve exibir checklist de due diligence, alerta resumido e os principais riscos ordenados por severidade

  Cenario: Explicar habilitacao inline antes do primeiro lance
    Dado que um usuario autenticado possui documentacao aprovada, mas ainda nao esta habilitado no leilao atual
    Quando ele acessa o detalhe publico de um lote aberto para lances
    Entao o painel de lances deve informar que a documentacao ja esta pronta
    E deve destacar que falta apenas a habilitacao especifica do leilao
    E deve oferecer atalho para revisar documentos e concluir a etapa seguinte
