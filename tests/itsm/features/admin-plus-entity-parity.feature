# language: pt
Funcionalidade: Paridade de entidades no Admin Plus
  Como administrador da plataforma BidExpert
  Eu quero acessar no Admin Plus as entidades Prisma que existiam no admin anterior
  Para operar logs de e-mail e relatórios sem depender do painel legado

  Cenário: Visualizar logs de e-mail no Admin Plus
    Dado que estou autenticado como administrador
    Quando eu acesso a rota do Admin Plus para logs de e-mail
    Então devo ver o cabeçalho da página
    E devo ver os cards de estatísticas dos envios

  Cenário: Abrir o formulário de relatórios no Admin Plus
    Dado que estou autenticado como administrador
    Quando eu acesso a rota do Admin Plus para relatórios
    E aciono o botão de novo relatório
    Então devo ver o formulário lateral com o campo de definição JSON