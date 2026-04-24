# language: pt
Funcionalidade: Dashboard Administrativo - Dados Reais
  Como administrador da plataforma BidExpert
  Eu quero visualizar métricas reais do banco de dados
  Para acompanhar o desempenho da operação com dados atualizados

  Cenário: Exibir métricas reais no dashboard administrativo
    Dado que existem usuários, leilões, lotes e vendas reais na base de dados
    Quando eu acesso o dashboard administrativo
    Então devo ver métricas calculadas a partir do banco de dados
    E não devo ver mensagens de área de demonstração

  Cenário: Exibir KPIs ampliados e acessos rápidos de operação
    Dado que existem usuários, leilões, lotes, comitentes e vendas reais na base de dados
    Quando eu acesso o dashboard administrativo
    Então devo ver atalhos para Novo leilão, Leilões, Lotes, Ativos, Mídias, Marketing, Processos, Comitentes, Usuários e Configurações
    E devo ver os indicadores Taxa de sucesso, Ticket médio, Lotes por leilão e Comitentes ativos

  Cenário: Posicionar KPIs antes dos acessos rápidos
    Dado que existem métricas e atalhos operacionais disponíveis para o administrador
    Quando eu acesso o dashboard administrativo
    Então a seção "Visão geral e KPIs" deve aparecer antes da seção "Acessos rápidos"
    E a seção "Acessos rápidos" deve permanecer antes dos gráficos de desempenho
