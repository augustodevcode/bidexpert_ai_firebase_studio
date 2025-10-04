# Mapa do Produto: Plataforma de Leilões

## 1. Sumário Executivo

Este documento detalha a arquitetura, funcionalidades, regras de negócio e modelo de dados da plataforma de leilões. Ele serve como uma fonte central de verdade para equipes de desenvolvimento, produto e QA, facilitando a criação de testes (BDD/TDD), documentação e tutoriais. A análise foi realizada com base no `schema.prisma` e na estrutura de arquivos do projeto, refletindo o estado atual do sistema.

**Perfis de Usuário Principais:**
*   **Administrador:** Gerencia toda a plataforma, incluindo leilões, usuários, configurações e conteúdo.
*   **Analista de Leilão:** Focado na preparação e monitoramento de leilões, especialmente os judiciais.
*   **Arrematante:** Participa dos leilões, dá lances e arremata lotes.
*   **Comitente (Vendedor):** Cadastra itens para serem leiloados (seja de forma particular ou como parte de um processo judicial).
*   **Convidado:** Navega pelo site, visualiza leilões e lotes sem poder interagir.
*   **Auditor:** Acesso de leitura a logs e registros para fins de conformidade.
*   **Tenant (Leiloeiro):** Um cliente que possui seu próprio espaço de trabalho isolado dentro da plataforma.

---

## 2. Premissas e Arquitetura

*   **Arquitetura Multi-Tenant:** A plataforma foi reestruturada para suportar múltiplos "tenants" (inquilinos), onde cada leiloeiro terá seus dados (leilões, lotes, comitentes, etc.) isolados por um `tenantId`.
    *   **Identificação do Tenant:**
        *   **Subdomínio:** O tenant ativo é identificado pelo subdomínio da requisição (ex: `leiloeiro-x.bidexpert.com` resolve para o `tenantId` de "leiloeiro-x").
        *   **Domínio Principal (Landlord):** Requisições ao domínio principal (ex: `bidexpert.com.br` ou `www.bidexpert.com.br`) sem subdomínio devem sempre resolver para o tenant "Landlord", que tem `id = '1'`.
*   **Stack:** A tecnologia utilizada é Next.js com App Router, Node.js, Prisma como ORM e MySQL como banco de dados. A validação de dados é feita com Zod.
*   **Autenticação:** Gerenciada via JWT/OAuth2, utilizando os modelos `User`, `Role` e `UsersOnRoles`.

---

## 3. Mapa Completo do Produto

### 3.1. Módulos Principais

| Módulo | Descrição | Modelos Prisma Associados |
| :--- | :--- | :--- |
| **Arquitetura Multi-Tenant** | Garante o isolamento de dados entre diferentes leiloeiros (tenants) e automatiza a criação de novos ambientes. | `Tenant`, `User`, `Auction` (e todos os outros modelos relevantes) |
| **Gestão de Leilões** | Criação, configuração e gerenciamento de leilões de diversos tipos. | `Auction`, `AuctionStage`, `Lot` |
| **Gestão de Lotes & Ativos**| Cadastro de ativos (bens) e sua organização em lotes dentro de um leilão. Inclui a criação de ativos "em contexto" diretamente da tela de lote. | `Lot`, `Asset`, `AssetsOnLots` |
| **Módulo Judicial** | Gerenciamento de processos judiciais, varas, comarcas e partes. | `JudicialProcess`, `Court`, `JudicialDistrict`, `JudicialBranch`|
| **Painel do Administrador** | Hub central para todas as operações de gerenciamento da plataforma. | `User`, `Role`, `PlatformSettings`, `Seller`, `Auctioneer` |
| **Jornada do Arrematante** | Fluxo completo do usuário final, do cadastro ao arremate. | `User`, `Bid`, `UserWin`, `UserDocument`, `AuctionHabilitation`|
| **Vendas Diretas** | Módulo para ofertas de compra direta, sem a dinâmica de leilão. | `DirectSaleOffer` |
| **CMS & Configurações** | Gestão de conteúdo (páginas, temas) e configurações da plataforma. | `PlatformSettings`, `MediaItem`, `DocumentTemplate` |
| **Relatórios e Análise** | Geração e visualização de relatórios customizados. | `DataSource`, `Report` (futuro) |
| **Componente de Card Unificado** | Componente reutilizável para exibir tanto Leilões quanto Lotes, adaptando-se ao tipo de dado. | `Lot`, `Auction`, `Asset` |
| **Endereçamento Unificado** | Componente reutilizável para entrada e exibição de endereços, com busca de CEP e mapa interativo. | `AddressGroup.tsx`, `MapPicker.tsx` |
| **Timeline de Etapas do Leilão** | Componente reutilizável para exibir visualmente o progresso das etapas de um leilão. | `AuctionStage` |


### 3.2. Mapa de Rotas (Frontend - Next.js)

Baseado na estrutura de `src/app`:

| Rota (URL) | Descrição | Papel Principal |
| :--- | :--- | :--- |
| `/` | Página inicial com leilões em destaque. | Convidado, Arrematante |
| `/[tenant_slug].bidexpert.com` | Página inicial e portal de um leiloeiro específico. | Todos |
| `/auth/login` | Página de login. Se acessada sem um subdomínio, pode apresentar um seletor de tenant. | Todos |
| `/auth/register`| Página de cadastro de novos usuários. | Arrematante |
| `/auctions/[auctionId]` | Página de detalhes de um leilão, com a lista de lotes. | Convidado, Arrematante |
| `/auctions/[auctionId]/live` | Auditório virtual para leilões ao vivo. | Arrematante |
| `/auctions/[auctionId]/lots/[lotId]`| Página de detalhes de um lote específico. | Convidado, Arrematante |
| `/dashboard/wins`| Painel do usuário com seus lotes arrematados. | Arrematante |
| `/dashboard/documents`| Gerenciamento de documentos para habilitação. | Arrematante |
| `/admin/dashboard`| Painel principal do administrador da plataforma. | Administrador |
| `/[tenant_slug]/admin` | Painel de administração para um leiloeiro (tenant). | Tenant (Leiloeiro) |

### 3.3. Mapa de Endpoints (Backend - API)

| Método e Rota | Descrição | Auth | Exemplo de Request Body | Exemplo de Response (200 OK) |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/tenant/create` | **[NOVO]** Cria um novo ambiente (tenant) para um leiloeiro. | Service Account | `{ "name": "Leiloeiro X", "email": "...", "subdomain": "leiloeiro-x" }` | `{ "success": true, "tenantId": "..." }` |
| `POST /api/auctions/{auctionId}/lots/{lotId}/bids`| Enviar um novo lance para um lote. | Arrematante | `{ "amount": 1500.50 }` | `{ "id": "bid_cuid", "amount": 1500.50, ... }` |
| `PATCH /api/admin/users/{userId}/habilitations`| Aprovar ou rejeitar a habilitação de um usuário. | Admin | `{ "status": "HABILITADO" }` | `{ "id": "user_cuid", "habilitationStatus": "HABILITADO" }`|
| `POST /api/cep` | Consulta um CEP para obter informações de endereço. | Public | `{ "cep": "01001000" }` | `{ "logradouro": "Praça da Sé", ... }` |

---

## 4. Fluxos de Usuário

### 4.1. **[NOVO]** Onboarding Automatizado de Novo Leiloeiro (Tenant)

1.  **Cadastro no CRM:** Um novo leiloeiro se cadastra em um CRM externo, fornecendo seus dados e escolhendo um subdomínio (ex: `leiloeiro-x`).
2.  **Disparo do Evento:** O CRM publica uma mensagem no tópico `new-tenant-onboarding` do Google Cloud Pub/Sub, contendo os dados do novo leiloeiro.
3.  **Ativação da Cloud Function:** Uma Cloud Function, inscrita neste tópico, é acionada.
4.  **Chamada à API BidExpert:** A Cloud Function faz uma chamada segura para o endpoint `/api/v1/tenant/create` da plataforma BidExpert.
5.  **Provisionamento do Tenant:** A API do BidExpert:
    *   Valida os dados.
    *   Cria um novo registro na tabela `Tenant`.
    *   Configura o subdomínio e associa-o ao novo `tenant_id`.
    *   Cria o usuário administrador para o novo leiloeiro.
    *   Retorna uma resposta de sucesso para a Cloud Function.

### 4.2. **[ATUALIZADO]** Fluxo de Login Multi-Tenant

1.  **Acesso:** O usuário acessa a página de login.
    *   **Via Subdomínio:** Se o acesso for por `leiloeiro-x.bidexpert.com`, o `tenantId` já é conhecido.
    *   **Via Domínio Principal:** Se o acesso for por `bidexpert.com`, o `tenantId` é desconhecido.
2.  **Credenciais:** O usuário insere e-mail e senha.
3.  **Validação:** O sistema valida as credenciais.
4.  **Verificação de Tenants:** O sistema busca todos os tenants aos quais o usuário pertence.
    *   **Um Tenant:** O usuário é logado e redirecionado para o painel do seu único tenant.
    *   **Múltiplos Tenants:** O sistema exibe uma tela intermediária listando os "espaços de trabalho" (tenants) do usuário para que ele selecione em qual deseja entrar.
    *   **Nenhum Tenant:** O usuário recebe uma mensagem de erro, a menos que seja um admin da plataforma.
5.  **Criação da Sessão:** Uma sessão é criada contendo o `userId` **e** o `tenantId` selecionado.
6.  **Redirecionamento:** O usuário é direcionado para o painel correto.

### 4.3. Administrador da Plataforma: Publicação de Leilão Judicial

(Fluxo existente, sem alterações imediatas)

### 4.4. Arrematante: Jornada de Lance

(Fluxo existente, sem alterações imediatas, mas todas as interações com dados serão filtradas pelo `tenant_id` do leilão que ele está acessando).

---

## 5. Regras de Negócio Críticas

### 5.1. **[NOVO]** Isolamento de Dados (Multi-Tenancy)

*   **`tenantId` Mandatório:** Todas as tabelas que contêm dados de um leiloeiro específico (leilões, lotes, bens, comitentes, usuários do leiloeiro, lances, etc.) **devem** ter uma coluna `tenantId`.
*   **Filtragem Automática:** Todas as queries (leituras, escritas, atualizações, exclusões) realizadas na plataforma **devem** ser automaticamente filtradas pelo `tenantId` do usuário logado ou do contexto do subdomínio acessado.
*   **Segurança:** Um usuário de um `tenantId` **NUNCA** deve conseguir visualizar, modificar ou acessar dados pertencentes a outro `tenant_id`.

### 5.2. Componentes de Exibição Unificados

*   **Padrão `UniversalCard` e `UniversalListItem`:** Para garantir consistência visual e manutenibilidade, a exibição de itens em formato de card ou de lista (como em páginas de busca, dashboards e páginas de categoria) **deve** utilizar os componentes `UniversalCard.tsx` e `UniversalListItem.tsx`, respectivamente.
*   **Lógica Centralizada:** Esses componentes são responsáveis por receber um objeto de dados (seja `Auction` ou `Lot`) e um `type` ('auction' ou 'lot') e então renderizar o componente de card/item de lista apropriado (`AuctionCard` ou `LotCard`), passando todas as props necessárias.
*   **Não Uso Direto:** Os componentes `AuctionCard` e `LotCard` não devem ser importados ou utilizados diretamente nas páginas. As páginas devem interagir apenas com os componentes universais.

### 5.3. Fontes de Dados para Relatórios

*   **Modelo `DataSource`:** A tabela `DataSource` no banco de dados é a fonte da verdade para as variáveis disponíveis no `BidReportBuilder`.
*   **Seeding:** O script `seed-db.ts` é responsável por popular a tabela `DataSource` com metadados dos principais modelos da aplicação (`Auction`, `Lot`, `User`, `Seller`, etc.).
*   **Estrutura:** Cada registro em `DataSource` define um `name` (amigável, ex: "Leilões"), um `modelName` (do Prisma, ex: "Auction") e um JSON `fields` que lista as colunas (`name` e `type`) que podem ser usadas como variáveis no relatório (ex: `{{Auction.title}}`).

### 5.4. **[NOVO]** Exibição Condicional de Cronômetro Regressivo

*   **Componente Reutilizável (`LotCountdown.tsx`):** Um cronômetro de contagem regressiva foi criado para ser reutilizado. Ele calcula o tempo restante para uma data de término e exibe dias, horas, minutos e segundos.
*   **Visibilidade Controlada:** O cronômetro **não deve** ser exibido por padrão em todos os lotes. Sua visibilidade é controlada por uma nova propriedade booleana `showCountdown` passada para os componentes de exibição de lotes (`LotCard.tsx`).
*   **Contextos de Exibição:** Atualmente, o cronômetro só é ativado e exibido nos seguintes contextos:
    1.  No carrossel "Super Oportunidades" (`ClosingSoonCarousel.tsx`) da página inicial.
    2.  No modal de pré-visualização rápida de um lote (`LotPreviewModal.tsx`).
*   **Lógica da Query:** A busca por lotes "encerrando em breve" (`closingSoonLots`) é feita no `page.tsx` da homepage, filtrando lotes com status `ABERTO_PARA_LANCES` e cuja data de término da última etapa do leilão esteja nos próximos 7 dias.

### 5.5. **[NOVO]** Criação de Ativos (Bens) em Contexto

*   **Objetivo:** Melhorar o fluxo de trabalho do administrador ao criar lotes, permitindo a criação de um novo ativo sem sair da tela de edição do lote.
*   **Implementação:**
    1.  Na página de edição de um lote (`/admin/lots/[lotId]/edit`), na seção "Bens Disponíveis para Vincular", um botão **"Cadastrar Novo Bem"** foi adicionado.
    2.  Clicar neste botão abre um **modal (`CreateAssetModal.tsx`)** que contém o formulário de criação de ativos (`AssetForm.tsx`).
    3.  O formulário no modal é pré-populado com o `sellerId` ou `judicialProcessId` do leilão ao qual o lote pertence, garantindo a associação correta.
    4.  Ao salvar o novo ativo, o modal se fecha, e a lista de "Bens Disponíveis" na página de edição do lote é **automaticamente atualizada** para incluir o item recém-criado, que já pode ser vinculado ao lote.

### 5.6. **[NOVO]** Validação de Formulários e Feedback de UI

*   **Marcação de Campos Obrigatórios:** Todos os campos de preenchimento obrigatório em formulários de criação ou edição **devem** ser visualmente indicados com um asterisco vermelho (`*`) ao lado do `Label`.
*   **Desabilitação de Botão de Submissão:** Os botões de "Salvar", "Criar" ou "Enviar" **devem** permanecer desabilitados enquanto o formulário for inválido (i.e., enquanto campos obrigatórios não forem preenchidos ou dados inseridos não atenderem aos critérios de validação).
*   **Feedback Imediato:** Após a submissão de um formulário, o sistema **deve** fornecer um feedback claro e imediato ao usuário, utilizando componentes `Toast` para indicar sucesso ou falha na operação. Submissões não devem falhar silenciosamente.
    
### 5.7. **[NOVO]** Endereçamento Unificado com `AddressGroup`

*   **Componente Centralizado:** Todas as entradas de endereço na plataforma **devem** utilizar o componente reutilizável `src/components/address-group.tsx`.
*   **Consistência:** Este componente garante uma experiência de usuário padronizada para preenchimento de endereço, incluindo busca por CEP, mapa interativo (`MapPicker`), e seletores de entidade (`EntitySelector`) para Estado e Cidade.
*   **Modelos Impactados:** Os formulários para Leilão, Ativo (Bem), Comitente e Leiloeiro foram refatorados para usar este componente, e seus respectivos schemas (Prisma e Zod) foram atualizados para incluir os campos estruturados (`street`, `number`, `neighborhood`, `cityId`, `stateId`, `latitude`, etc.).
*   **Exibição:** As páginas de perfil público e de detalhes também foram atualizadas para exibir o endereço formatado a partir destes campos estruturados.

### 5.8. **[NOVO]** Timeline Visual de Etapas do Leilão

*   **Componente Reutilizável:** A exibição das etapas de um leilão (praças) **deve** utilizar o componente `src/components/auction/auction-stages-timeline.tsx`.
*   **Contexto:** Este componente é integrado aos cards de leilão (`AuctionCard` e `AuctionListItem`) para fornecer uma visão rápida e proporcional do progresso do leilão.
*   **Funcionalidade:** O componente calcula a duração total de todas as etapas e renderiza cada etapa como um segmento em uma barra de progresso, indicando visualmente se a etapa está concluída, ativa ou futura. Um `Tooltip` exibe detalhes ao passar o mouse.


---

## 6. Orientações para Futuros Desenvolvedores

*   **Sempre Use o Contexto de Tenant:** Ao criar novas `Server Actions` ou serviços, sempre utilize a função `getTenantIdFromRequest` para garantir que todas as operações sejam executadas no contexto do tenant correto.
*   **Estrutura Modular do Schema Prisma:** Lembre-se que o arquivo `prisma/schema.prisma` é gerado automaticamente. **Nunca o edite diretamente**. Todas as alterações de modelo devem ser feitas nos arquivos individuais dentro de `prisma/models/`.
*   **Mantenha a Coesão dos Serviços:** Evite lógica de negócio cruzada entre serviços. Se `AuctionService` precisa de dados de `Seller`, ele deve chamar `SellerService`, não `SellerRepository`.
*   **Modelos Globais vs. Modelos por Tenant:** Ao adicionar novos modelos ao `prisma/schema.prisma`, decida se ele é global (como `Role`) ou por tenant (como `Lot`). Se for por tenant, adicione o campo `tenantId` e a relação com `Tenant`. Se for global, adicione o nome do modelo à lista `tenantAgnosticModels` em `src/lib/prisma.ts` para evitar que o middleware tente filtrar por `tenantId`.
*   **Use os Componentes Universais:** Para qualquer nova funcionalidade que exija a exibição de listas de leilões ou lotes, utilize `SearchResultsFrame` em conjunto com `UniversalCard` e `UniversalListItem` para manter a consistência da UI e centralizar a lógica de renderização.
*   **Testes são Essenciais:** Para cada nova funcionalidade, especialmente em `Server Actions`, crie um teste de integração correspondente para validar a lógica de negócio e as regras de permissão.
*   **Fontes de Dados do Report Builder:** Para expor novas tabelas ou campos no Construtor de Relatórios, atualize o array `dataSources` no script `src/scripts/seed-db.ts`. Isso garantirá que as novas variáveis fiquem disponíveis na UI do construtor após a execução do seed.
*   **Herança de Mídia (Asset -> Lote):** Ao criar um lote, o usuário pode escolher entre herdar a galeria de imagens de um `Asset` (Bem) vinculado ou selecionar uma galeria customizada da Biblioteca de Mídia (`MediaItem`). A lógica de serviço deve priorizar a galeria customizada se existir.
*   **Herança de Mídia (Lote -> Leilão):** Ao criar um leilão, o usuário pode escolher entre herdar a imagem principal de um dos lotes vinculados ou selecionar uma imagem customizada da Biblioteca de Mídia.
*   **Lógica no Serviço:** A decisão de qual URL de imagem (`imageUrl`) exibir deve ser centralizada nas `Services` (`lot.service.ts`, `auction.service.ts`). Os componentes de UI (cards, páginas) devem simplesmente renderizar a `imageUrl` fornecida pelo serviço, sem conter lógica de herança.
*   **Validação de Formulários:** Sempre utilize os schemas do Zod (`*-form-schema.ts`) em conjunto com o `react-hook-form` e o componente `<Form>` do `shadcn/ui` para garantir validação robusta no lado do cliente e do servidor. Para campos obrigatórios, use a anotação `*` no `FormLabel`.
*   **Endereços:** Sempre utilize o componente `AddressGroup.tsx` em formulários que necessitem de endereço para manter a padronização de entrada de dados.
