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
| **Gestão de Lotes & Bens**| Cadastro de bens (ativos) e sua organização em lotes dentro de um leilão. | `Lot`, `Bem`, `LotBens` |
| **Módulo Judicial** | Gerenciamento de processos judiciais, varas, comarcas e partes. | `JudicialProcess`, `Court`, `JudicialDistrict`, `JudicialBranch`|
| **Painel do Administrador** | Hub central para todas as operações de gerenciamento da plataforma. | `User`, `Role`, `PlatformSettings`, `Seller`, `Auctioneer` |
| **Jornada do Arrematante** | Fluxo completo do usuário final, do cadastro ao arremate. | `User`, `Bid`, `UserWin`, `UserDocument`, `AuctionHabilitation`|
| **Vendas Diretas** | Módulo para ofertas de compra direta, sem a dinâmica de leilão. | `DirectSaleOffer` |
| **CMS & Configurações** | Gestão de conteúdo (páginas, temas) e configurações da plataforma. | `PlatformSettings`, `MediaItem`, `DocumentTemplate` |
| **Relatórios e Análise** | Geração e visualização de relatórios customizados. | `Report`, `ReportShare` |
| **Componente de Card Unificado** | Componente reutilizável para exibir tanto Leilões quanto Lotes, adaptando-se ao tipo de dado. | `Lot`, `Auction`, `Bem` |

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

(As regras existentes permanecem, com a adição da regra de isolamento de dados)

### 5.1. **[NOVO]** Isolamento de Dados (Multi-Tenancy)

*   **`tenantId` Mandatório:** Todas as tabelas que contêm dados de um leiloeiro específico (leilões, lotes, bens, comitentes, usuários do leiloeiro, lances, etc.) **devem** ter uma coluna `tenantId`.
*   **Filtragem Automática:** Todas as queries (leituras, escritas, atualizações, exclusões) realizadas na plataforma **devem** ser automaticamente filtradas pelo `tenantId` do usuário logado ou do contexto do subdomínio acessado.
*   **Segurança:** Um usuário de um `tenantId` **NUNCA** deve conseguir visualizar, modificar ou acessar dados pertencentes a outro `tenant_id`.

---

(O restante do documento permanece o mesmo)
