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

---

## Módulo 8: Assistente de Criação de Leilões (Wizard)

**Cenário 8.1.1: Início e Seleção de Modalidade**
- **Dado** que um admin está na página `/admin/wizard`.
- **Quando** ele seleciona a modalidade "Judicial".
- **Então** a visualização do fluxo deve destacar o caminho "JUDICIAL".
- **E** o botão "Próximo" deve levá-lo para a etapa "Dados Judiciais".
- **Quando** ele seleciona a modalidade "Extrajudicial".
- **Então** a visualização do fluxo deve destacar o caminho "EXTRAJUDICIAL".
- **E** o botão "Próximo" deve levá-lo para a etapa "Dados do Leilão" (pulando a etapa judicial).

**Cenário 8.1.2: Etapa Judicial - Vinculação de Processo e Criação de Comitente**
- **Dado** que o admin está na etapa "Dados Judiciais".
- **Quando** ele seleciona um processo judicial da lista.
- **Então** os detalhes do processo (nº, vara, comarca) devem ser exibidos na tela.
- **E** o comitente vinculado à vara daquele processo deve ser automaticamente selecionado no formulário da próxima etapa.
- **Quando** ele clica em "Criar Novo Processo".
- **Então** ele deve ser levado ao formulário completo de criação de processo.
- **E** após salvar, ele deve retornar ao wizard com o novo processo selecionado.

**Cenário 8.1.3: Etapa de Loteamento - Agrupar e Individualizar**
- **Dado** que o admin está na etapa "Loteamento" e há bens disponíveis para o processo/comitente selecionado.
- **Quando** ele seleciona 3 bens e clica em "Agrupar em Lote Único".
- **Então** um modal deve aparecer para definir os detalhes do novo lote (título, número, lance inicial).
- **E** após salvar o modal, um novo lote agrupado deve aparecer na lista de "Lotes Preparados".
- **E** os 3 bens devem desaparecer da lista de "Bens Disponíveis".
- **Quando** ele seleciona 2 outros bens e clica em "Lotear Individualmente".
- **Então** 2 novos lotes devem ser adicionados automaticamente à lista de "Lotes Preparados", cada um com os dados de seu bem correspondente.

**Cenário 8.1.4: Revisão e Publicação Final**
- **Dado** que o admin está na etapa "Revisão e Publicação".
- **Então** ele deve ver um resumo completo de todos os dados inseridos: detalhes do leilão, dados do processo (se aplicável) e a lista de lotes criados.
- **Quando** ele clica em "Publicar Leilão".
- **Então** o sistema deve criar o registro do leilão e todos os lotes vinculados no banco de dados em uma única transação.
- **E** o usuário deve ser redirecionado para a página de edição do leilão recém-criado.

---

## Módulo 9: Painel do Usuário (Arrematante)

**Cenário 9.1.1: Visão Geral (Overview)**
- **Dado** que um usuário logado tem 2 lances ativos e 1 arremate pendente de pagamento.
- **Quando** ele acessa `/dashboard/overview`.
- **Então** os cards de estatísticas devem exibir "Meus Lances Ativos: 2" e "Arremates Pendentes: 1".
- **E** a seção "Próximos Encerramentos" deve exibir os lotes corretos, ordenados pelo tempo restante.

**Cenário 9.1.2: Meus Lances - Status do Lance**
- **Dado** que o Usuário A deu o lance mais alto em um lote.
- **Quando** ele acessa a página `/dashboard/bids`.
- **Então** o status do lance para aquele lote deve ser "Ganhando", com destaque visual verde.
- **Dado** que o Usuário B dá um lance maior no mesmo lote.
- **Quando** o Usuário A recarrega a página `/dashboard/bids`.
- **Então** o status do seu lance para aquele lote deve mudar para "Superado", com destaque visual amarelo/laranja.

**Cenário 9.1.3: Meus Arremates - Ações Contextuais**
- **Dado** que um usuário tem um lote arrematado com status de pagamento "PENDENTE".
- **Quando** ele acessa a página `/dashboard/wins`.
- **Então** o card do lote deve exibir um botão "Pagar Agora".
- **Dado** que um usuário tem um lote arrematado com status de pagamento "PAGO".
- **Quando** ele acessa a página `/dashboard/wins`.
- **Então** o card do lote deve exibir os botões "Gerar Termo de Arrematação" e "Agendar Retirada".

**Cenário 9.1.4: Meus Documentos - Envio e Status**
- **Dado** que um usuário precisa enviar seu "Comprovante de Endereço".
- **Quando** ele acessa `/dashboard/documents`, seleciona um arquivo e faz o upload.
- **Então** o status daquele documento deve mudar para "Em Análise".
- **E** o status geral de habilitação deve ser atualizado para refletir o novo estado (se aplicável).
- **Dado** que um documento foi "Rejeitado" por um admin.
- **Quando** o usuário acessa a página.
- **Então** ele deve ver o status "Rejeitado" e o motivo da rejeição claramente exibido no card do documento.

---

## Módulo 10: Construtor de Relatórios (Self-Service)

**Cenário 10.1.1: Adicionar e Manipular Elementos**
- **Dado** que o usuário está na página `/admin/report-builder`.
- **Quando** ele clica no botão "Texto" na barra de ferramentas.
- **Então** um novo elemento de texto deve aparecer na área de design.
- **Quando** ele seleciona o novo elemento de texto.
- **Então** o painel de "Propriedades" deve exibir as opções para aquele elemento (conteúdo, posição, etc.).
- **Quando** ele altera o conteúdo do texto no painel de propriedades.
- **Então** o texto na área de design deve ser atualizado em tempo real.
- **Quando** ele arrasta e solta o elemento para uma nova posição.
- **Então** a posição do elemento deve ser atualizada.

**Cenário 10.1.2: Uso de Variáveis de Fonte de Dados**
- **Dado** que o usuário está no construtor de relatórios e navega para a aba "Dados".
- **Quando** ele expande a fonte de dados "Leilões".
- **E** arrasta a variável `{{Auction.title}}` para a área de design.
- **Então** um novo elemento de texto deve ser criado com o conteúdo `{{Auction.title}}`.
- **E** na pré-visualização, este campo deve ser renderizado com um título de leilão real (ex: "Leilão de Veículos Usados").

**Cenário 10.1.3: Salvar e Carregar um Relatório**
- **Dado** que um usuário criou um layout com pelo menos 2 elementos.
- **Quando** ele clica em "Salvar", preenche o nome "Relatório de Vendas Mensal" e salva.
- **Então** uma notificação de sucesso deve aparecer.
- **Quando** ele recarrega a página (limpando o estado atual) e clica em "Carregar".
- **E** seleciona "Relatório de Vendas Mensal" da lista de relatórios salvos.
- **Então** a área de design deve ser populada exatamente com os 2 elementos e suas posições salvas anteriormente.

---

## Módulo 11: Gerenciamento de Mídia e Herança

**Cenário 11.1.1: Upload e Seleção de Mídia**
- **Dado** que o usuário está em um formulário (ex: edição de Lote) e clica em "Escolher da Biblioteca".
- **Quando** ele navega para a aba "Enviar arquivos" e faz o upload de uma nova imagem.
- **Então** a imagem deve ser enviada com sucesso e aparecer na aba "Biblioteca de mídia".
- **Quando** ele seleciona a imagem recém-enviada na biblioteca.
- **Então** a URL da imagem deve preencher o campo de "Imagem Principal" no formulário principal.

**Cenário 11.1.2: Herança de Mídia (Bem -> Lote)**
- **Dado** que o "Bem A" (um carro) tem uma galeria de 5 imagens.
- **Quando** o usuário está editando o "Lote 101" (que contém o "Bem A").
- **E** na seção de Mídia, ele seleciona a opção "Herdar de um Bem Vinculado" e escolhe o "Bem A".
- **Então** a imagem principal e a galeria de imagens do "Lote 101" na página pública devem ser exatamente as mesmas do "Bem A".

**Cenário 11.1.3: Substituição de Mídia (Lote)**
- **Dado** que o "Lote 101" está configurado para herdar a mídia do "Bem A".
- **Quando** o usuário, no formulário de edição do lote, muda a opção para "Usar Galeria Customizada".
- **E** ele seleciona uma nova imagem principal e remove 2 imagens da galeria.
- **Então** a página pública do "Lote 101" deve exibir a nova imagem principal e a galeria reduzida, ignorando as imagens do "Bem A".
- **E** as imagens do "Bem A" devem permanecer inalteradas.

**Cenário 11.1.4: Herança e Substituição (Lote -> Leilão)**
- **Dado** que o "Lote 101" tem uma imagem principal customizada (diferente do bem).
- **Quando** o usuário está editando o "Leilão X" e, na seção de Imagem Principal, escolhe a opção "Herdar de um Lote" e seleciona o "Lote 101".
- **Então** a imagem principal na página do "Leilão X" deve ser a mesma imagem principal do "Lote 101".
- **Quando** o usuário edita novamente o leilão e seleciona "Imagem Customizada", escolhendo uma nova imagem da biblioteca.
- **Então** a imagem principal do leilão deve ser atualizada para a nova imagem, ignorando a imagem do lote.

---

## Módulo 12: Relistagem e Reloteamento

**Cenário 12.1.1: Relistar um lote não vendido com desconto**
- **Dado** que um lote está com status "NAO_VENDIDO".
- **E** o admin está na página de edição deste lote.
- **Quando** ele clica em "Relistar este Lote", seleciona um novo leilão, insere um desconto de "20%" e confirma.
- **Então** um novo lote deve ser criado, vinculado ao novo leilão.
- **E** o preço inicial do novo lote deve ser 20% menor que o valor de avaliação do lote original.
- **E** o status do lote original deve ser alterado para "RELISTADO".
- **E** o novo lote deve ter seu campo `originalLotId` apontando para o lote original.

**Cenário 12.2.1: Desvincular bens de um lote não vendido (Reloteamento)**
- **Dado** que o "Lote 102", contendo os bens "Bem X" e "Bem Y", terminou "NAO_VENDIDO".
- **E** o status dos bens "Bem X" e "Bem Y" é "LOTEADO".
- **Quando** o admin acessa a página de edição do "Lote 102", seleciona o "Bem Y" e clica em "Desvincular e Relotear Bem".
- **Então** a relação entre "Lote 102" e "Bem Y" deve ser removida.
- **E** o status do "Bem Y" deve ser atualizado para "DISPONIVEL".
- **E** o "Bem Y" deve voltar a aparecer na lista de bens disponíveis para loteamento no wizard.
- **E** o "Bem X" deve permanecer vinculado ao "Lote 102" com status "LOTEADO".

---

## Módulo 13: Lógica de Precificação por Etapa

**Cenário 13.1.1: Definir preços diferentes por praça**
- **Dado** que um leilão tem duas praças (1ª e 2ª).
- **Quando** o admin, no formulário de edição de um lote, define "Lance Inicial 1ª Praça" como R$ 10.000 e "Lance Inicial 2ª Praça" como R$ 5.000.
- **Então** o lance inicial exibido publicamente deve ser R$ 10.000 enquanto a 1ª praça estiver ativa.
- **E** após o término da 1ª praça e início da 2ª, o lance inicial na página do lote deve ser automaticamente atualizado para R$ 5.000.

---

## Módulo 14: Pagamento Parcelado

**Cenário 14.1.1: Checkout com opção de parcelamento**
- **Dado** que um usuário arrematou um lote e o leilão permite parcelamento.
- **Quando** o usuário acessa a página de checkout.
- **Então** ele deve ver, além do pagamento à vista, a opção "Boleto Parcelado".
- **Quando** ele seleciona "Boleto Parcelado" e escolhe "10" parcelas.
- **E** confirma a operação.
- **Então** 10 registros de `InstallmentPayment` devem ser criados no banco de dados.
- **E** o status do `UserWin` deve mudar para "PROCESSANDO".

**Cenário 14.2.1: Painel Financeiro do Administrador**
- **Dado** que existem parcelas geradas no sistema.
- **Quando** um usuário com perfil "Financeiro" ou "Admin" acessa o painel de gerenciamento financeiro.
- **Então** ele deve ver uma lista de todas as parcelas pendentes e pagas.
- **Quando** ele marca uma parcela como "PAGO".
- **Então** o status daquela parcela específica deve ser atualizado.
- **E** o sistema deve verificar se todas as parcelas de um `UserWin` foram pagas para, então, atualizar o status do `UserWin` para "PAGO".

---

## Módulo 15: Painel de Análise de Usuários

**Cenário 15.1.1: Visualização dos KPIs de Usuários**
- **Dado** que existem usuários com diferentes níveis de atividade na plataforma.
- **Quando** um admin acessa a página `/admin/users/analysis`.
- **Então** os cards de estatísticas devem exibir corretamente o número total de usuários, o faturamento total, o número de lotes arrematados e o total de lances.
- **E** a tabela de "Dados Detalhados por Usuário" deve listar todos os usuários, ordenados pelo valor total gasto (maior para o menor).
- **E** o gráfico de pizza deve mostrar a distribuição correta de status de habilitação (ex: 70% Habilitado, 20% Pendente, 10% Rejeitado).
- **E** a seção de Análise da IA deve conter um texto com insights sobre o comportamento dos usuários.
