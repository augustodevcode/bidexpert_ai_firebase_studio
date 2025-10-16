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
| **[NOVO] Marketing e Engajamento** | Seções na homepage para engajamento do usuário, como newsletter, anúncios e promoções de parceiros. | `Subscriber`, `Advertisement` (futuro), `ToolSponsor` (futuro) |

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
| `POST /api/subscribe` | **[NOVO]** Inscreve um usuário na newsletter. | Público | `{"email": "...", "name": "..."}`| `{"success": true}`|

---

## 4. Fluxos de Usuário

### 4.1. **[NOVO]** Onboarding Automatizado de Novo Leiloeiro (Tenant)

(Fluxo existente, sem alterações)

### 4.2. **[ATUALIZADO]** Fluxo de Login Multi-Tenant

(Fluxo existente, sem alterações)

### 4.3. Administrador da Plataforma: Publicação de Leilão Judicial

(Fluxo existente, sem alterações)

### 4.4. Arrematante: Jornada de Lance

(Fluxo existente, sem alterações)

### 4.5. **[NOVO]** Cliente Potencial: Inscrição na Newsletter

1.  **Acesso à Homepage:** Um visitante (cliente potencial) acessa a página inicial.
2.  **Visualização da Seção:** O visitante rola a página e encontra a seção "Fique por Dentro das Novidades".
3.  **Preenchimento:** Ele insere seu nome e e-mail no formulário de inscrição.
4.  **Submissão:** Ao clicar em "Inscrever", uma `server action` (`subscribeToAction`) é chamada.
5.  **Criação do Assinante:** O `SubscriptionService` valida os dados, verifica se o e-mail já existe e cria um novo registro `Subscriber` no banco de dados, associado ao tenant principal ('1').
6.  **Feedback:** O usuário recebe um `toast` de sucesso ou erro na tela.

---

## 5. Regras de Negócio Críticas

### 5.1. **[NOVO]** Isolamento de Dados (Multi-Tenancy)

(Regra existente, sem alterações)

### 5.2. Componentes de Exibição Unificados

(Regra existente, sem alterações)

### 5.3. Fontes de Dados para Relatórios

(Regra existente, sem alterações)

### 5.4. **[NOVO]** Exibição Condicional de Cronômetro Regressivo

(Regra existente, sem alterações)

### 5.5. **[NOVO]** Criação de Ativos (Bens) em Contexto

(Regra existente, sem alterações)

### 5.6. **[NOVO]** Validação de Formulários e Feedback ao Usuário

(Regra existente, sem alterações)

### 5.7. **[NOVO]** Fluxo de Configuração Inicial (Setup)

(Regra existente, sem alterações)

### 5.8. **[NOVO]** Configuração da Homepage

*   **Responsividade:** A exibição dos cards de serviços (leilões/lotes) deve ser responsiva. Em telas de desktop, devem ser exibidos em grid. Em telas menores (mobile/tablet), o layout deve se transformar em um carrossel horizontal com navegação por gestos (drag).
*   **Carrossel de Categorias:** A seção de categorias na homepage deve ser um carrossel horizontal, permitindo que o usuário deslize para ver todas as opções disponíveis.

---

## 6. Orientações para Futuros Desenvolvedores

(As orientações existentes permanecem válidas. Esta seção será atualizada conforme novas regras de negócio forem adicionadas.)
