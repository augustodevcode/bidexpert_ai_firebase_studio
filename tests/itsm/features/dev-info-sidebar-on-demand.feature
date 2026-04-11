# language: pt
Funcionalidade: Dev Info sob demanda nos painéis autenticados
  Como usuário autenticado do BidExpert
  Eu quero abrir as informações de ambiente apenas pela sidebar
  Para evitar ruído visual e acessar o diagnóstico somente quando necessário

  Cenário: Dev Info fica oculto por padrão no dashboard
    Dado que estou autenticado em um painel com sidebar
    Quando a tela termina de carregar
    Então não devo ver o conteúdo de Dev Info inline no layout
    E devo ver o botão "Dev Info" disponível na sidebar

  Cenário: Dev Info abre em modal após clique explícito
    Dado que estou autenticado em um painel com sidebar
    Quando clico no botão "Dev Info"
    Então devo ver um modal com o título "Dev Info"
    E o modal deve exibir tenant, usuário, banco, provider, branch, servidor e projeto
