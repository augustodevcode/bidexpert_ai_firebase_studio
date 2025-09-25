# Plano de Testes e Cenários de Uso - Plataforma BidExpert

Este documento descreve os cenários de teste para garantir a qualidade, integridade e o funcionamento correto de todas as funcionalidades da plataforma BidExpert. Os testes são escritos em formato BDD (Behavior-Driven Development) para clareza.

## Módulo 1: Administração - Gerenciamento de Entidades (CRUD)

### 1.1. Gerenciamento de Usuários

**Cenário 1.1.1: Criação de um novo usuário**
- **Dado** que o Administrador está na página "Gerenciar Usuários".
- **Quando** ele clica em "Novo Usuário" e preenche o formulário com dados válidos (nome, e-mail único, senha).
- **Então** o novo usuário deve ser criado com sucesso.
- **E** o usuário deve aparecer na lista de usuários.
- **E** o usuário deve ter o perfil "User" (padrão) atribuído.

**Cenário 1.1.2: Edição de perfil de usuário**
- **Dado** que o Administrador está na página de edição de um usuário existente.
- **Quando** ele altera o nome completo do usuário e salva.
- **Então** o nome do usuário deve ser atualizado na lista de usuários.

**Cenário 1.1.3: Atribuição de múltiplos perfis (Roles)**
- **Dado** que o Administrador está na página de edição de um usuário.
- **Quando** ele navega para a seção "Atribuir Perfis", seleciona os perfis "Comitente" e "Arrematante" e salva.
- **Então** o usuário deve possuir ambos os perfis associados à sua conta.

**Cenário 1.1.4: Exclusão de usuário**
- **Dado** que existe um usuário que pode ser excluído.
- **Quando** o Administrador clica em "Excluir" na linha do usuário e confirma a ação.
- **Então** o usuário deve ser removido permanentemente da plataforma.
- **E** ele não deve mais aparecer na lista de usuários.

---

### 1.2. Gerenciamento de Leilões

**Cenário 1.2.1: Criação de um leilão extrajudicial**
- **Dado** que o Administrador está na página "Gerenciar Leilões".
- **Quando** ele clica em "Novo Leilão", preenche todos os campos obrigatórios (título, comitente, leiloeiro, categoria, datas) para um leilão extrajudicial.
- **Então** o leilão deve ser criado com o status "Rascunho".
- **E** o leilão deve aparecer na lista de leilões.

**Cenário 1.2.2: Edição de um leilão**
- **Dado** que um leilão existe.
- **Quando** o Administrador altera o status do leilão de "Rascunho" para "Em Breve" e salva.
- **Então** o status do leilão deve ser atualizado na lista.

**Cenário 1.2.3: Exclusão de um leilão sem lotes**
- **Dado** que existe um leilão em status "Rascunho" e sem lotes.
- **Quando** o Administrador exclui este leilão.
- **Então** a operação deve ser bem-sucedida e o leilão removido da lista.

**Cenário 1.2.4: Tentativa de exclusão de um leilão com lotes**
- **Dado** que um leilão possui pelo menos um lote vinculado.
- **Quando** o Administrador tenta excluir este leilão.
- **Então** o sistema deve exibir uma mensagem de erro informando que o leilão não pode ser excluído.

---

### 1.3. Gerenciamento de Ativos (Bens)

**Cenário 1.3.1: Criação de um Ativo (Bem)**
- **Dado** que o Administrador está na página "Gerenciar Ativos".
- **Quando** ele cria um novo ativo do tipo "Veículo", preenchendo título, categoria, comitente, valor de avaliação e campos específicos (placa, marca, modelo).
- **Então** o ativo deve ser criado com status "DISPONIVEL".
- **E** deve aparecer na lista de ativos disponíveis para loteamento.

**Cenário 1.3.2: Criação de um Lote vinculando um Ativo**
- **Dado** que existe um leilão criado e um ativo com status "DISPONIVEL".
- **Quando** o Administrador cria um novo lote, o associa ao leilão e seleciona o ativo existente para compô-lo.
- **Então** o lote é criado com sucesso.
- **E** o status do ativo vinculado deve mudar para "LOTEADO".

**Cenário 1.3.3: Exclusão de um Lote**
- **Dado** que um lote existe e está vinculado a um ativo.
- **Quando** o Administrador exclui este lote.
- **Então** o lote é removido do banco de dados.
- **E** o status do ativo anteriormente vinculado deve voltar para "DISPONIVEL".

---

## Módulo 2: Fluxo de Habilitação de Usuário

**Cenário 2.1.1: Usuário envia documentos para habilitação**
- **Dado** que um novo usuário ("João") está logado e na página "Meus Documentos".
- **Quando** João faz o upload de todos os documentos obrigatórios para seu tipo de conta.
- **Então** o status de sua habilitação deve mudar de "Documentos Pendentes" para "Em Análise".
- **E** uma solicitação deve aparecer no painel de "Habilitações" do Administrador.

**Cenário 2.1.2: Analista aprova os documentos**
- **Dado** que o usuário "João" está com status "Em Análise".
- **Quando** um Analista de Leilão (ou Admin) acessa a página de revisão de documentos do João e aprova todos os documentos.
- **Então** o status de habilitação geral do João deve mudar para "HABILITADO".
- **E** o perfil "Arrematante" (Bidder) deve ser automaticamente adicionado à conta do João.

**Cenário 2.1.3: Analista rejeita um documento**
- **Dado** que o usuário "João" está com status "Em Análise".
- **Quando** um Analista rejeita o "Comprovante de Endereço" e informa o motivo "Documento ilegível".
- **Então** o status do documento específico deve mudar para "Rejeitado".
- **E** o status de habilitação geral do João deve mudar para "Documentos Rejeitados".
- **E** João deve conseguir ver o motivo da rejeição em sua página "Meus Documentos".

---

## Módulo 3: Jornada do Arrematante (Lances e Compras)

**Cenário 3.1.1: Dar um lance válido**
- **Dado** que um usuário "Habilitado" está visualizando um lote "Aberto para Lances".
- **E** o lance atual é R$ 1.000,00 com incremento de R$ 100,00.
- **Quando** o usuário insere um lance de R$ 1.100,00 e confirma.
- **Então** seu lance deve ser aceito e registrado.
- **E** o "Lance Atual" do lote deve ser atualizado para R$ 1.100,00.
- **E** seu nome deve aparecer no topo do histórico de lances.

**Cenário 3.1.2: Tentar dar um lance inválido (menor que o mínimo)**
- **Dado** que o lance atual é R$ 1.100,00 com incremento de R$ 100,00.
- **Quando** o usuário tenta dar um lance de R$ 1.150,00.
- **Então** o sistema deve rejeitar o lance e exibir uma mensagem de erro informando que o lance mínimo é de R$ 1.200,00.

**Cenário 3.1.3: Arrematar um lote**
- **Dado** que um usuário é o maior licitante de um lote quando o tempo se esgota.
- **Quando** o sistema processa o encerramento do lote.
- **Então** o status do lote deve mudar para "VENDIDO".
- **E** o ID do usuário deve ser registrado como `winnerId` no lote.
- **E** um registro deve ser criado na tabela `UserWin` para este usuário e lote.
- **E** o item deve aparecer na página "Meus Arremates" do usuário.

**Cenário 3.1.4: Checkout de um lote arrematado**
- **Dado** que um usuário arrematou um lote e seu pagamento está "PENDENTE".
- **Quando** ele acessa a página de checkout para este arremate e preenche os dados de pagamento.
- **Então** o status de pagamento do arremate deve mudar para "PAGO".
- **E** o usuário deve ser redirecionado para a página de sucesso ou para "Meus Arremates".

---

## Módulo 4: Relatórios e Dashboards

**Cenário 4.1.1: Dashboard Geral do Admin**
- **Dado** que existem múltiplos leilões, lotes, usuários e vendas no sistema.
- **Quando** o Administrador acessa a página "/admin/reports".
- **Então** ele deve ver os KPIs corretos (Faturamento Total, Novos Usuários, etc.).
- **E** os gráficos de "Vendas Mensais" e "Lotes Vendidos por Categoria" devem exibir os dados agregados corretamente.

**Cenário 4.1.2: Dashboard de Performance de Comitente**
- **Dado** que o "Comitente A" possui 3 leilões e 10 lotes vendidos.
- **Quando** um Admin acessa a página de edição do "Comitente A".
- **Então** a seção de Análise de Performance deve exibir "Total de Leilões: 3" e "Total de Lotes Vendidos: 10".
- **E** o gráfico de faturamento mensal deve refletir as vendas dos lotes daquele comitente.

**Cenário 4.1.3: Painel de Auditoria de Dados**
- **Dado** que um Administrador criou um leilão ativo, mas se esqueceu de adicionar lotes.
- **Quando** ele acessa a página "/admin/reports/audit".
- **Então** o card "Leilões Sem Lotes" deve exibir o valor "1".
- **E** o leilão em questão deve estar listado na seção de acordeão correspondente, com um link para a página de edição.

---

## Módulo 5: Funcionalidades Públicas e de Busca

**Cenário 5.1.1: Busca por termo**
- **Dado** que existe um lote com o título "Ford Ka 2019".
- **Quando** um visitante acessa a página de busca (`/search`) e digita "Ford Ka".
- **Então** o lote "Ford Ka 2019" deve aparecer nos resultados da busca.

**Cenário 5.1.2: Filtro por categoria**
- **Dado** que existem lotes nas categorias "Veículos" e "Imóveis".
- **Quando** o visitante na página de busca aplica o filtro de categoria para "Veículos".
- **Então** apenas os lotes da categoria "Veículos" devem ser exibidos.
- **E** os lotes da categoria "Imóveis" não devem ser exibidos.

**Cenário 5.1.3: Visualização de página pública**
- **Dado** que um leilão está com status "RASCUNHO".
- **Quando** um visitante tenta acessar a URL pública deste leilão.
- **Então** ele deve receber uma página de "Não Encontrado" (Erro 404).

---

## Módulo 6: Segurança e Permissão

**Cenário 6.1.1: Acesso negado ao painel de admin**
- **Dado** que um usuário com perfil "Arrematante" está logado.
- **Quando** ele tenta acessar a URL "/admin/dashboard".
- **Então** ele deve ser redirecionado ou ver uma página de "Acesso Negado".
- **E** nenhum dado do painel de administração deve ser carregado ou exibido.

**Cenário 6.1.2: Acesso negado à edição de outra entidade**
- **Dado** que um "Comitente A" está logado e acessa seu painel.
- **Quando** ele tenta acessar a URL de edição de um leilão pertencente ao "Comitente B".
- **Então** ele deve ser redirecionado ou receber uma mensagem de erro de permissão.
- **Critério de Aceite**: A camada de serviço deve impedir a operação, mesmo que a UI permitisse a navegação.

---

## Módulo 7: Interações de Interface do Usuário (UI/UX)

**Cenário 7.1.1: Alternância de Visualização (Grid/Lista/Tabela)**
- **Dado** que o usuário está na página de busca (`/search`) com resultados visíveis.
- **Quando** ele clica no ícone "Lista".
- **Então** os resultados devem ser exibidos como uma lista de itens.
- **Quando** ele clica no ícone "Tabela" (em uma página de admin).
- **Então** os resultados devem ser exibidos em formato de tabela.
- **Quando** ele clica no ícone "Grade".
- **Então** os resultados devem retornar à visualização em grade de cards.
- **Critério de Aceite**: A troca de visualização deve ser instantânea e manter os resultados e filtros atuais.

**Cenário 7.1.2: Abertura de Modal de Pré-Visualização**
- **Dado** que um card de leilão ou lote está visível na tela.
- **Quando** o usuário passa o mouse sobre o card e clica no ícone "Pré-visualizar" (ícone de olho).
- **Então** um modal deve aparecer sobrepondo a tela, exibindo informações resumidas do leilão/lote.
- **E** o modal deve conter um botão "Ver Detalhes" que leva à página completa do item.
- **E** o modal deve poder ser fechado clicando no "X" ou fora da área do modal.
- **Critério de Aceite**: O modal deve abrir e fechar corretamente sem recarregar a página.

**Cenário 7.1.3: Interação com Menus Dropdown (Compartilhar, Editar)**
- **Dado** que um card de leilão ou lote está visível.
- **Quando** o usuário passa o mouse sobre o card e clica no ícone "Compartilhar".
- **Então** um menu dropdown deve aparecer com opções para compartilhar em redes sociais (X, Facebook, etc.).
- **Quando** o usuário (Admin) passa o mouse sobre o card e clica no ícone "Editar" (lápis).
- **Então** um menu dropdown deve aparecer com opções de "Edição Rápida" (Alterar Título, Imagem, Destaque).
- **Critério de Aceite**: Os menus devem abrir, fechar e seus links/ações devem funcionar como esperado.

**Cenário 7.1.4: Paginação e Carregar Mais**
- **Dado** que uma busca retorna mais itens do que o limite por página.
- **Quando** a paginação é do tipo "numerada" e o usuário clica no número "2".
- **Então** a lista deve ser atualizada para mostrar os itens da segunda página.
- **Quando** a paginação é do tipo "Carregar Mais" e o usuário clica no botão "Carregar Mais".
- **Então** os novos itens devem ser adicionados ao final da lista existente, sem remover os anteriores.
- **Critério de Aceite**: A navegação entre páginas deve funcionar corretamente e carregar os dados esperados.

**Cenário 7.1.5: Aplicação de Filtros Facetados**
- **Dado** que o usuário está na página de busca e abre a barra de filtros.
- **Quando** ele marca o checkbox de um "Estado" (ex: "São Paulo") na seção de localização.
- **E** clica em "Aplicar Filtros".
- **Então** a lista de resultados deve ser atualizada para mostrar apenas itens de "São Paulo".
- **E** um indicador de filtro ativo deve aparecer acima dos resultados.
- **Quando** ele clica em "Limpar Filtros".
- **Então** todos os filtros devem ser desmarcados e a lista deve voltar ao seu estado original.
- **Critério de Aceite**: Os filtros devem atualizar a lista de resultados de forma precisa e podem ser resetados.
