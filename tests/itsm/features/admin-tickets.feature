# language: pt
Funcionalidade: ITSM Admin - Gerenciamento de Tickets
  Como um administrador do sistema
  Eu quero gerenciar tickets de suporte
  Para que eu possa ajudar os usuários eficientemente

  Contexto:
    Dado que estou logado como administrador
    E tenho permissão "manage_all"

  Cenário: Acessar painel de tickets como admin
    Dado que estou no painel administrativo
    Quando eu acessar "/admin/support-tickets"
    Então devo ver a página de gerenciamento de tickets
    E devo ver o título "Tickets de Suporte"
    E devo ver os filtros de status
    E devo ver o campo de busca

  Cenário: Visualizar lista de tickets
    Dado que estou na página de tickets
    E existem 5 tickets no sistema
    Então devo ver 5 cards de tickets
    E cada card deve mostrar:
      | Campo         |
      | ID público    |
      | Título        |
      | Status        |
      | Prioridade    |
      | Categoria     |
      | Email usuário |
      | Data criação  |

  Cenário: Filtrar tickets por status
    Dado que estou na página de tickets
    E existem tickets com diferentes status
    Quando eu selecionar o filtro "ABERTO"
    Então devo ver apenas tickets com status "ABERTO"
    E não devo ver tickets com outros status

  Cenário: Buscar ticket por ID
    Dado que estou na página de tickets
    E existe um ticket com ID "TICKET-123456"
    Quando eu digitar "TICKET-123456" no campo de busca
    Então devo ver apenas o ticket "TICKET-123456"
    E outros tickets não devem ser exibidos

  Cenário: Buscar ticket por email do usuário
    Dado que estou na página de tickets
    E existe um ticket do usuário "teste@exemplo.com"
    Quando eu digitar "teste@exemplo.com" no campo de busca
    Então devo ver todos os tickets deste usuário
    E o email deve estar destacado nos resultados

  Cenário: Visualizar badges coloridos de status
    Dado que estou vendo a lista de tickets
    Então tickets com status "ABERTO" devem ter badge azul
    E tickets com status "EM_ANDAMENTO" devem ter badge amarelo
    E tickets com status "RESOLVIDO" devem ter badge verde
    E tickets com status "FECHADO" devem ter badge cinza

  Cenário: Visualizar badges coloridos de prioridade
    Dado que estou vendo a lista de tickets
    Então tickets com prioridade "CRITICA" devem ter badge vermelho
    E tickets com prioridade "ALTA" devem ter badge laranja
    E tickets com prioridade "MEDIA" devem ter badge azul
    E tickets com prioridade "BAIXA" devem ter badge cinza

  Cenário: Verificar ordenação padrão por data
    Dado que existem tickets criados em datas diferentes
    Quando eu acessar a página de tickets
    Então os tickets devem estar ordenados do mais recente para o mais antigo
