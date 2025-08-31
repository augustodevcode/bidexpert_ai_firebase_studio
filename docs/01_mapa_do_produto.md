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

---

## 2. Premissas e Arquitetura

*   **Assunção (Monorepo):** O projeto está estruturado como um monorepo, com o frontend Next.js em `apps/web` (ou `src/app`) e o backend (API) em `apps/api` (ou nos API Routes do Next.js em `src/app/api`).
*   **Assunção (Stack):** A tecnologia utilizada é Next.js com App Router, Node.js, Prisma como ORM e MySQL como banco de dados. A validação de dados é feita com Zod.
*   **Assunção (Autenticação):** A autenticação é gerenciada via JWT/OAuth2, provavelmente com uma biblioteca como `next-auth`, utilizando os modelos `User`, `Role` e `UsersOnRoles`.
*   **Assunção (Timestamps):** Todos os registros de data e hora (`DateTime`) no banco de dados são armazenados em UTC. A conversão para o fuso horário local é responsabilidade do frontend.

---

## 3. Mapa Completo do Produto

### 3.1. Módulos Principais

| Módulo | Descrição | Modelos Prisma Associados |
| :--- | :--- | :--- |
| **Gestão de Leilões** | Criação, configuração e gerenciamento de leilões de diversos tipos. | `Auction`, `AuctionStage`, `Lot` |
| **Gestão de Lotes & Bens**| Cadastro de bens (ativos) e sua organização em lotes dentro de um leilão. | `Lot`, `Bem`, `LotBens` |
| **Módulo Judicial** | Gerenciamento de processos judiciais, varas, comarcas e partes. | `JudicialProcess`, `Court`, `JudicialDistrict`, `JudicialBranch`|
| **Painel do Administrador** | Hub central para todas as operações de gerenciamento da plataforma. | `User`, `Role`, `PlatformSettings`, `Seller`, `Auctioneer` |
| **Jornada do Arrematante** | Fluxo completo do usuário final, do cadastro ao arremate. | `User`, `Bid`, `UserWin`, `UserDocument`, `AuctionHabilitation`|
| **Vendas Diretas** | Módulo para ofertas de compra direta, sem a dinâmica de leilão. | `DirectSaleOffer` |
| **CMS & Configurações** | Gestão de conteúdo (páginas, temas) e configurações da plataforma. | `PlatformSettings`, `MediaItem`, `DocumentTemplate` |
| **Relatórios e Análise** | Geração e visualização de relatórios customizados. | `Report`, `ReportShare` |

### 3.2. Mapa de Rotas (Frontend - Next.js)

Baseado na estrutura de `src/app`:

| Rota (URL) | Descrição | Papel Principal |
| :--- | :--- | :--- |
| `/` | Página inicial com leilões em destaque. | Convidado, Arrematante |
| `/auth/login` | Página de login. | Todos |
| `/auth/register`| Página de cadastro de novos usuários. | Arrematante |
| `/auctions/[auctionId]` | Página de detalhes de um leilão, com a lista de lotes. | Convidado, Arrematante |
| `/auctions/[auctionId]/live` | Auditório virtual para leilões ao vivo. | Arrematante |
| `/auctions/[auctionId]/lots/[lotId]`| Página de detalhes de um lote específico. | Convidado, Arrematante |
| `/dashboard/wins`| Painel do usuário com seus lotes arrematados. | Arrematante |
| `/dashboard/documents`| Gerenciamento de documentos para habilitação. | Arrematante |
| `/admin/dashboard`| Painel principal do administrador. | Administrador |
| `/admin/auctions`| CRUD de Leilões. | Administrador |
| `/admin/lots` | CRUD de Lotes. | Administrador |
| `/admin/users` | CRUD de Usuários. | Administrador |
| `/admin/habilitations`| Análise e aprovação de habilitações de usuários. | Administrador, Analista |
| `/admin/judicial-processes`| CRUD de Processos Judiciais. | Administrador, Analista |
| `/admin/settings`| Configurações gerais da plataforma. | Administrador |

### 3.3. Mapa de Endpoints (Backend - API)

Exemplos de endpoints (assumindo API routes do Next.js):

| Método e Rota | Descrição | Auth | Exemplo de Request Body | Exemplo de Response (200 OK) |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/auctions/{auctionId}/lots/{lotId}/bids`| Enviar um novo lance para um lote. | Arrematante | `{ "amount": 1500.50 }` | `{ "id": "bid_cuid", "amount": 1500.50, ... }` |
| `PATCH /api/admin/users/{userId}/habilitations`| Aprovar ou rejeitar a habilitação de um usuário. | Admin | `{ "status": "HABILITADO" }` | `{ "id": "user_cuid", "habilitationStatus": "HABILITADO" }`|
| `POST /api/admin/auctions` | Criar um novo leilão. | Admin | `{ "title": "Leilão de Veículos", "auctionDate": "...", "sellerId": "..." }` | `{ "id": "auction_cuid", "title": "Leilão de Veículos", ... }` |
| `GET /api/profile/me/wins` | Listar os lotes arrematados pelo usuário logado. | Arrematante | N/A | `[{ "lotId": "...", "winningBidAmount": 5000, ... }]` |
| `POST /api/upload/document` | Upload de um documento para habilitação. | Arrematante | `FormData` com o arquivo | `{ "fileUrl": "/path/to/doc.pdf", "status": "PENDING_ANALYSIS" }` |

---

## 4. Fluxos de Usuário

### 4.1. Administrador: Publicação de Leilão Judicial

1.  **Login:** Admin acessa a plataforma com suas credenciais.
2.  **Acesso ao Painel:** Navega para `/admin/dashboard`.
3.  **Cadastro do Processo:**
    *   Vai para "Módulo Judicial" -> "Processos" e clica em "Novo".
    *   Preenche os dados do processo (`processNumber`, `courtId`, `branchId`, etc).
    *   Cadastra as partes (`JudicialParty`) e o comitente (`Seller`).
4.  **Cadastro dos Bens:**
    *   Dentro do processo, vai para a aba "Bens" e clica em "Adicionar Bem".
    *   Cadastra cada bem (`Bem`) associado ao processo, com descrição, fotos (`MediaItem`) e valor de avaliação.
5.  **Criação do Leilão:**
    *   Vai para "Leilões" -> "Novo".
    *   Seleciona a modalidade "Judicial" e associa o `judicialProcessId` criado.
    *   Configura as datas, horários, leiloeiro (`auctioneerId`), e regras (incremento, anti-sniping).
6.  **Criação dos Lotes (Lotting):**
    *   Dentro do leilão criado, vai para a aba "Lotes".
    *   Cria um novo Lote (`Lot`) e, através da interface (`LotBens`), associa um ou mais bens a esse lote.
    *   Define o valor inicial (`initialPrice`) e outras informações específicas do lote.
7.  **Publicação:** Altera o status do leilão (`AuctionStatus`) de `RASCUNHO` para `EM_BREVE` ou `ABERTO_PARA_LANCES`.
8.  **Monitoramento:** Acompanha os lances e as habilitações pelo painel.

### 4.2. Arrematante: Jornada de Lance

1.  **Cadastro:** Cria uma conta em `/auth/register` (tipo `PHYSICAL` ou `LEGAL`).
2.  **Habilitação (KYC):**
    *   Acessa seu painel em `/dashboard/documents`.
    *   Faz o upload dos documentos necessários (`UserDocument`), como RG, CPF, Comprovante de Residência.
    *   O status do usuário (`habilitationStatus`) fica como `PENDING_ANALYSIS`.
3.  **Aprovação:** O Admin analisa e aprova os documentos. O status do usuário muda para `HABILITADO`. Uma notificação é enviada.
4.  **Navegação e Descoberta:**
    *   Explora os leilões e lotes.
    *   Encontra um lote de interesse e acessa a página de detalhes (`/auctions/.../lots/...`).
5.  **Habilitação no Leilão:** Em alguns leilões (configurável), o usuário precisa clicar em "Habilitar-se para este leilão", criando um registro `AuctionHabilitation`.
6.  **Dar Lance:**
    *   Na página do lote, insere o valor do lance e confirma.
    *   O sistema valida as regras (lance mínimo, leilão ativo, etc).
    *   Um registro de `Bid` é criado.
7.  **Anti-Sniping:** Se um lance é dado nos segundos finais, o `endDate` do leilão é estendido (se `softCloseEnabled` for true).
8.  **Fim do Leilão:** O leilão termina. Se o usuário deu o maior lance, ele é o vencedor.
9.  **Arremate:**
    *   Um registro `UserWin` é criado.
    *   O usuário é notificado e recebe o "Termo de Arremate" (`DocumentTemplate`).
    *   Acessa `/dashboard/wins` para ver os detalhes e o status de pagamento (`PaymentStatus`).
10. **Pagamento:** Procede para o checkout, onde realiza o pagamento via integração de gateway.

---

## 5. Regras de Negócio Críticas

*   **Incremento de Lance:** O valor de um novo lance deve ser, no mínimo, `lance_atual + bidIncrementStep`. A tabela `variableIncrementTable` no `PlatformSettings` pode definir incrementos variáveis por faixa de valor.
*   **Anti-Sniping (Soft Close):** Se `Auction.softCloseEnabled` for `true`, um lance recebido nos últimos `softCloseMinutes` estende o `endDate` do leilão/lote por mais `softCloseMinutes`.
*   **Lance Automático (Max Bid):** O usuário pode registrar um `UserLotMaxBid`. O sistema dará lances automaticamente em seu nome até atingir o `maxAmount`, sempre cobrindo o lance atual pelo valor do incremento mínimo.
*   **Preço de Reserva (Floor Price):** Se `Auction.floorPrice` estiver definido, o lote só é considerado "Vendido" se o lance vencedor atingir ou superar esse valor. Caso contrário, o lote é "Não Vendido" (`LotStatus.NAO_VENDIDO`).
*   **Leilão Holandês (Dutch Auction):** Se `Auction.auctionMethod` for `DUTCH`, o preço começa alto e é decrementado em `decrementAmount` a cada `decrementIntervalSeconds` até que um arrematante aceite o preço corrente.
*   **Comissão:** A comissão do leiloeiro (geralmente 5% sobre o valor do arremate) e as taxas administrativas são calculadas no momento do checkout e adicionadas ao valor a ser pago.
*   **Caução:** (Não modelado explicitamente, mas pode ser implementado) Exigir um depósito de caução antes que o usuário possa se habilitar para leilões de alto valor.

---

## 6. Modelo de Dados (Prisma) e Validações (Zod)

### 6.1. Esquema Prisma (Principais Modelos)

O `schema.prisma` completo é a fonte da verdade. Abaixo, um extrato dos modelos mais importantes para a lógica de negócio.

```prisma
// Representa um evento de leilão
model Auction {
  id              String        @id @default(cuid())
  title           String
  status          AuctionStatus @default(RASCUNHO)
  auctionDate     DateTime    // Início do primeiro pregão
  endDate         DateTime?   // Fim do último pregão
  auctioneerId    String?
  sellerId        String?
  auctionMethod   AuctionMethod @default(STANDARD)
  softCloseEnabled Boolean    @default(false)
  softCloseMinutes Int?       @default(2)
  lots            Lot[]
  bids            Bid[]
  // ... outros campos
}

// Representa um item ou conjunto de itens sendo leiloado
model Lot {
  id                String    @id @default(cuid())
  auctionId         String
  auction           Auction   @relation(fields: [auctionId], references: [id])
  title             String
  initialPrice      Float?    // Valor inicial do primeiro pregão
  secondInitialPrice Float?   // Valor inicial do segundo pregão
  bidIncrementStep  Float?
  status            LotStatus @default(EM_BREVE)
  winnerId          String?
  bids              Bid[]
  // ... outros campos
}

// Representa um usuário da plataforma
model User {
  id                 String                  @id @default(cuid())
  email              String                  @unique
  habilitationStatus UserHabilitationStatus @default(PENDING_DOCUMENTS)
  bids               Bid[]
  wins               UserWin[]
  documents          UserDocument[]
  // ... outros campos
}

// Representa um lance individual
model Bid {
  id        String   @id @default(cuid())
  lotId     String
  lot       Lot      @relation(fields: [lotId], references: [id])
  auctionId String
  auction   Auction  @relation(fields: [auctionId], references: [id])
  bidderId  String
  bidder    User     @relation(fields: [bidderId], references: [id])
  amount    Float
  timestamp DateTime @default(now())
}
```

### 6.2. Exemplo de Validação com Zod

Esquema Zod para a criação de um novo leilão, usado para validar o corpo da requisição no backend e formulários no frontend.

```typescript
import { z } from 'zod';

const AuctionFormSchema = z.object({
  title: z.string().min(10, "O título deve ter pelo menos 10 caracteres."),
  description: z.string().optional(),
  auctionDate: z.date({ required_error: "A data do leilão é obrigatória." }),
  auctioneerId: z.string({ required_error: "Selecione um leiloeiro." }),
  sellerId: z.string({ required_error: "Selecione um comitente/vendedor." }),

  // Mapeando Enums do Prisma
  auctionMethod: z.enum(['STANDARD', 'DUTCH', 'SILENT']),
  auctionType: z.enum(['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR']),

  // Regras de Negócio
  softCloseEnabled: z.boolean().default(false),
  softCloseMinutes: z.number().positive().optional(),
  floorPrice: z.number().positive().optional(),
});

type AuctionFormData = z.infer<typeof AuctionFormSchema>;
```

---

## 7. Eventos de Domínio

| Evento | Payload (Exemplo) | Subscritores (Listeners) |
| :--- | :--- | :--- |
| `bid.placed` | `{ "lotId": "...", "auctionId": "...", "userId": "...", "amount": 1500 }` | `RealtimeService` (atualiza dashboards), `NotificationService` (notifica interessados), `MaxBidService` (verifica se dispara outro lance) |
| `auction.extended` | `{ "lotId": "...", "newEndDate": "2025-10-26T18:12:00Z" }` | `RealtimeService`, `NotificationService` |
| `auction.closing_soon` | `{ "auctionId": "...", "lots": ["..."] }` | `NotificationService` (envia emails/push de "última chance") |
| `user.habilitated` | `{ "userId": "...", "status": "HABILITADO" }` | `EmailService`, `NotificationService` |
| `payment.confirmed` | `{ "winId": "...", "userId": "...", "amount": 5250.00 }` | `FinanceService` (libera o bem), `NotificationService` |
| `lot.sold` | `{ "lotId": "...", "winnerId": "...", "finalPrice": 5000.00 }` | `ReportingService`, `AuctioneerPayoutService` |

---

## 8. Integrações Externas

| Tipo | Serviço Exemplo | Propósito | Configuração Prisma |
| :--- | :--- | :--- | :--- |
| **Gateway de Pagamento** | Stripe, Mercado Pago | Processar pagamentos de lotes arrematados. | `PlatformSettings.paymentGatewaySettings` |
| **Armazenamento de Arquivos**| Firebase Storage, AWS S3| Armazenar imagens de lotes, documentos de usuários. | `PlatformSettings.storageProvider`, `firebaseStorageBucket`|
| **Envio de Notificações** | SendGrid, Resend, FCM | Enviar emails transacionais (novo lance, arremate) e notificações push. | (Variáveis de ambiente) |
| **KYC / Validação Docs** | [https://veriff.com/](https://veriff.com/) | Validar a autenticidade dos documentos enviados pelos usuários. | (Integração via API, chaves no .env) |
| **Business Intelligence** | Google Analytics, Metabase| Análise de tráfego, comportamento do usuário e métricas de conversão. | (Scripts no frontend) |
| **Consulta de CEP** | ViaCEP, BrasilAPI | Autocompletar endereços em formulários. | (Chamada de API no frontend) |

---

## 9. Roteiro de Descoberta de Código

Comandos úteis para um novo desenvolvedor explorar a base de código:

1.  **Verificar dependências:**
    ```bash
    cat package.json
    ```
2.  **Analisar o modelo de dados:**
    ```bash
    cat prisma/schema.prisma
    ```
3.  **Encontrar todos os endpoints da API (Next.js):**
    ```bash
    ls -R src/app/api
    ```
4.  **Encontrar onde um modelo do Prisma é utilizado (ex: criação de Leilão):**
    ```bash
    grep -r "prisma.auction.create" ./src
    ```
5.  **Encontrar onde um evento de domínio é disparado (assumindo uma função `emit`):**
    ```bash
    grep -r "emit('bid.placed'" ./src
    ```
6.  **Encontrar todas as validações de formulário (assumindo sufixo `FormSchema`):**
    ```bash
    find ./src -name "*form-schema.ts*"
    ```
7.  **Listar todos os testes de unidade e E2E:**
    ```bash
    find ./src -name "*.test.ts"
    find ./tests -name "*.test.ts"
    ```
8.  **Executar o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
---
