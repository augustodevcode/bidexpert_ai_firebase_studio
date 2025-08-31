# language: pt
Funcionalidade: Gestão de Leilões pelo Administrador
  Como um Administrador
  Eu quero criar, configurar e gerenciar o ciclo de vida dos leilões
  Para garantir que eles ocorram de forma correta e ordenada

  Contexto:
    Dado que eu sou um usuário com o papel de "Administrador" logado no sistema

  @happy-path @crud @auctions
  Cenário: Criação de um novo leilão extrajudicial com sucesso
    Dado que estou na página "/admin/auctions"
    Quando eu clico no botão "Novo Leilão"
    And eu preencho o formulário com:
      | Campo                  | Valor                      |
      | Título                 | Leilão de Imóveis Litorâneos |
      | Modalidade             | EXTRAJUDICIAL              |
      | Método                 | STANDARD                   |
      | Data do Leilão         | 2025-11-15T10:00:00Z       |
      | Leiloeiro              | "João Leiloeiro"           |
      | Comitente/Vendedor     | "Construtora Feliz"        |
      | Habilitar Anti-Sniping | true                       |
      | Minutos Anti-Sniping   | 2                          |
    And eu salvo o formulário
    Then um novo leilão com o título "Leilão de Imóveis Litorâneos" deve ser criado com o status "RASCUNHO"
    And eu devo ser redirecionado para a página de edição do leilão recém-criado

  @happy-path @auctions
  Cenário: Alterar o status de um leilão para publicá-lo
    Dado que existe um leilão "Leilão de Arte" com status "RASCUNHO"
    And o leilão possui pelo menos 1 lote associado
    Quando eu edito o leilão e mudo seu status para "ABERTO_PARA_LANCES"
    Então o leilão "Leilão de Arte" deve ficar visível para os arrematantes na plataforma
    And os arrematantes habilitados poderão dar lances nos lotes deste leilão

  @failure-case @auctions
  Cenário: Tentar publicar um leilão sem lotes
    Dado que existe um leilão "Leilão Vazio" com status "RASCUNHO"
    And o leilão não possui nenhum lote associado
    When eu tento mudar o status do leilão para "ABERTO_PARA_LANCES"
    Then o sistema deve exibir uma mensagem de erro "Não é possível publicar um leilão sem lotes cadastrados"
    And o status do leilão "Leilão Vazio" deve permanecer como "RASCUNHO"

  @security @auth
  Cenário: Usuário sem permissão de Administrador tenta acessar a gestão de leilões
    Dado que eu sou um usuário com o papel de "Arrematante"
    When eu tento acessar a URL "/admin/auctions"
    Then o sistema deve me redirecionar para a página de login ou exibir um erro de "Acesso Negado" (403)
