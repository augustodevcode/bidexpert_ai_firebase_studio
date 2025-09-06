# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Architectural Overview

This application follows a robust **MVC (Model-View-Controller) with a Service Layer** architecture to ensure scalability and maintainability. This layered approach ensures a clear separation of concerns, making the codebase easier to understand, test, and extend.

-   **Model:** Managed by **Prisma ORM**, with the schema defined in `prisma/schema.prisma`. This defines the shape of our data.
-   **Views:** Implemented using **Next.js with React Server Components** (`.tsx` files). This is the UI the user interacts with.
-   **Controllers:** Handled by **Next.js Server Actions** (`/actions.ts` files). These orchestrate calls to the service layer in response to user interactions.
-   **Services:** Contain the core business logic (`/services/*.ts` files), decoupled from both the database and the controllers.
-   **Repositories:** Encapsulate all database queries using the Prisma Client, providing a clean data access layer.

---

## Database Setup

This project uses **Prisma ORM** as its data access layer, allowing for flexible interaction with **PostgreSQL**, **MySQL**, or **Firestore**. The active database is determined by the `DATABASE_URL` and `NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM` environment variables.

### 1. Environment Setup

-   For **MySQL (Default for this project)**: Ensure your MySQL server is running. Set the following in your `.env` file with your database credentials.
    ```
    # Example for MySQL
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=MYSQL
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
-   For **PostgreSQL**: Set up your database and provide the connection string in your `.env` file. Change the `provider` in `prisma/schema.prisma` to `postgresql`.
    ```
    # Example for PostgreSQL
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=POSTGRES
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

### 2. Database Initialization & Seeding

When using a fresh database, you need to create the necessary tables/collections and populate essential data.

-   **`npx prisma db push` (For SQL Databases):** If using MySQL or PostgreSQL, run this command **once** to sync your Prisma schema with the database. This command is included in the `npm run dev` script, so it will run automatically on startup.
    ```bash
    npx prisma db push
    ```
-   **`npm run dev`**: The first time you run the development server, it will automatically execute an initialization script (`init-db.ts`). This script populates **essential data only** (like Roles, Categories, States, etc.). This step is required for the application to start correctly.

-   **`npm run db:seed`**: After the server has started at least once, you can run this script manually in your terminal to populate the database with a **full set of sample data** (auctions, lots, users, etc.). Use this to get a fully populated environment for development and demonstration. The script checks for existing data to prevent duplication.

```bash
# First, run the development server. This will initialize the database with essential data.
npm run dev

# (In a new terminal, while the server is running)
# Then, populate with the full sample data set.
npm run db:seed
```

Your selected database is now ready to use with the application.
---

## Estratégia de Testes para Aplicação de Leilões Full-Stack
### 1. Camadas e Tipos de Teste
Testes Unitários: Validam pequenas unidades de código isoladamente (funções, métodos, validações). São rápidos e não dependem de banco de dados ou rede, focando apenas na lógica interna. Por exemplo, testar uma função que calcula o próximo lance válido ou valida se um campo obrigatório está presente. Esse tipo de teste “isola a lógica garantindo que cada unidade funcione como esperado”
mendoncadev.com.br
.
Testes de Integração: Verificam a interação entre componentes ou módulos, incluindo acesso a banco de dados ou APIs externas. Por exemplo, testar um endpoint REST de cadastro de usuário usando um servidor Express e um banco MySQL real via Docker. Isso garante que controladores, serviços e camada de dados estão integrados corretamente. Os testes de integração “garantem que módulos e componentes do sistema funcionem corretamente juntos”
mendoncadev.com.br
.
Testes End-to-End (E2E): Simulam fluxos completos do usuário final, exercitando toda a pilha (front-end, back-end, banco de dados, etc.). Por exemplo, um teste E2E pode abrir a interface web do leilão, registrar um usuário, habilitá-lo, efetuar lances válidos/inválidos e gerar relatórios, tudo via UI ou API. Os testes E2E “verificam a funcionalidade completa do aplicativo do início ao fim, simulando cenários reais de usuários”
apidog.com
. Eles são mais lentos e devem focar em jornadas críticas (p. ex. finalização de leilão), deixando os detalhes menores para testes unitários.
### 2. Consistência de Schemas
Para evitar divergências entre o banco de dados, o schema do Prisma e os esquemas Zod:
Migrations e Versionamento: Sempre use Prisma Migrate para controlar alterações do schema MySQL. Toda modificação no model do Prisma deve ser migrada ao banco (via prisma migrate), garantindo que o BD real reflita o schema Prisma.
Geradores Automáticos: Utilize geradores que sincronizam Zod e Prisma. Por exemplo, o zod-prisma cria automaticamente esquemas Zod baseados no modelo Prisma, evitando ter que manter manualmente cada mudança de schema
github.com
. Bibliotecas NPM como prisma-zod-generator ou zod-prisma geram código Zod a partir do modelo, mantendo-os 1:1.
Validações Automatizadas: Além do tsc (TypeScript) que já aponta inconsistências de tipo, considere testes que carreguem os esquemas Zod gerados e comparem contra a saída do banco. Ferramentas como zod-fixture geram fixtures de teste a partir de esquemas Zod
github.com
, ajudando a validar entradas/saídas. Outra prática é escrever testes que tentem gravar entradas inválidas (segundo o Zod) no BD, confirmando que o middleware de validação bloqueia o acesso indevido. Dessa forma, o schema Zod (API) e o schema Prisma (BD) permanecem alinhados.
### 3. Cobertura de Funcionalidades do Leilão
Teste todos os fluxos principais da aplicação de leilões:
Cadastro e Habilitação: Teste unitário para validar regras de formato de dados de cadastro. Testes de integração via API para verificar que /api/usuarios cria o usuário no banco e que háflows como envio de e-mail ou notificações. Por exemplo, com Supertest pode-se validar que POST /api/usuarios retorna 201 e corpo JSON contendo o ID gerado.
Lances Válidos/Inválidos: Em lógica de negócios, escreva testes unitários para regras de lance (p. ex. “um lance deve ser maior que o último lance válido ou seguir incremento mínimo”). Em testes de integração, faça chamadas ao endpoint de lances (ex.: POST /api/lances) inserindo dados válidos e inválidos, verificando códigos de resposta e mensagens de erro. Por exemplo:
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/lances', () => {
  it('deve rejeitar lance abaixo do mínimo', async () => {
    const res = await request(app)
      .post('/api/lances')
      .send({ valor: 0.50, loteId: 'abc123', usuarioId: 1 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });
});
Encerramento de Leilão: Teste a rotina que encerra o leilão (cron job ou função manual). Por exemplo, ao simular o fim do prazo, verificar que o status do leilão passa para “encerrado” e um vencedor é definido. Escreva testes de integração para endpoints de finalização ou simulação de tempo, garantindo atualização correta do BD.
Geração de Relatórios: Se a aplicação gera relatórios (por exemplo, somatório de lances ou visitas por leilão), crie testes que insiram dados no BD e consultem a API de relatório, verificando consistência dos valores agregados. Teste queries complexas no banco usando fixtures de dados.
Consultas com Joins Complexos: Para funcionalidades que exibem dados combinados (p. ex. cards de visitação que mostram Leilão + Lote + Comitente + Lances + Visitas), escreva testes de integração/prisma que gerem registros de cada entidade e consultem via Prisma com include ou join. Por exemplo:
const visita = await prisma.visita.findFirst({
  include: { leilao: true, lote: true, comitente: true, lances: true }
});
expect(visita).toMatchObject({
  leilao: { /* dados do leilão esperado */ },
  lote: { /* dados do lote */ },
  comitente: { /* dados do comitente */ },
  lances: expect.any(Array)
});
Isso garante que a consulta traga todas as relações corretas. Em testes E2E, valide também a interface (front-end) exibindo corretamente esses dados complexos.
### 4. Estratégia de Banco de Testes
Banco Real Isolado: Use uma instância MySQL separada (via Docker) para os testes. Um container mysql:8 isolado evita interferir nos dados de desenvolvimento. Configure o .env.test ou variável DATABASE_URL apontando para esse DB de teste. Em CI, você pode usar serviços do GitHub Actions ou Docker Compose para provisionar o MySQL antes dos testes.
Setup/Reset: Antes da suíte de testes, aplique as migrações: por exemplo, npx prisma migrate deploy ou prisma migrate reset --force. Entre cada teste (ou suíte), limpe o estado do banco – isso pode ser feito via transações que são revertidas (jdbc), truncando tabelas ou recriando o banco entre suites. Em frameworks como Jest/Vitest, use hooks beforeAll e afterAll para inicializar e limpar. Garantir que cada teste comece de um estado conhecido elimina efeitos colaterais.
Ambiente de Teste Separado: Utilize variáveis de ambiente para diferenciar ambiente de teste. Por exemplo, NODE_ENV=test ou DATABASE_URL distinta. Isso evita rodar testes em bases de dados de produção ou desenvolvimento. No código de inicialização do app, carregue o .env.test quando apropriado. Além disso, prefira configurações específicas de teste (sem portas em uso, logs reduzidos) para manter a performance do pipeline.
### 5. Ferramentas Recomendadas
Test Runner (Unit/Integração): Vitest e Jest são os mais usados. O Vitest é um runner moderno que funciona muito bem com projetos Vite/Next.js e TypeScript. Ele oferece API compatível com Jest e destacável foco em velocidade (“Vite significa rápido” – muitas vezes executa testes diversas vezes mais rápido que Jest)
saucelabs.com
. Jest é maduro, amplamente suportado e não exige configuração extra para projetos comuns. Em geral, Vitest tende a ser recomendado para projetos com Vite ou Next.js modernos devido à performance, enquanto Jest é sólido se você já o conhece ou precisa de recursos avançados como snapshot testing.
Simulação de APIs (Integração): Supertest é excelente para testar endpoints HTTP em aplicações Express/Koa/etc
mendoncadev.com.br
. Ele permite emitir requisições (GET, POST, etc.) diretamente contra o servidor em memória. Use-o para testes de integração REST. Outra opção é Axios combinado com um servidor local ou nock para simular respostas de serviços externos.
Validação de Dados: Para criar dados de teste consistentes a partir de esquemas, use zod-fixture, que “cria fixtures de teste baseados em um schema Zod”
github.com
. Com ele você evita criar manualmente objetos de teste. Também considere bibliotecas como faker.js para dados randômicos e Prisma Factory (npm) para construir entidades completas.
Testes End-to-End: Playwright (Microsoft) é uma ferramenta robusta de E2E que suporta múltiplos navegadores e linguagens. Ao contrário do Cypress (que roda dentro do navegador e é limitado a JS/TS), o Playwright roda fora e oferece suporte a diversos navegadores e paralelismo embutido
checklyhq.com
. O Cypress tem ótima experiência de uso e depuração integrada, mas não suporta Safari nem múltiplas abas, e o paralelismo requer serviço pago. Recomenda-se Playwright para testes E2E amplos (ex.: fluxos completos de usuário) e Cypress se focar em testes front-end JS/TS com feedback interativo.
Outras Ferramentas: Para teste de front-end React, use Testing Library (React Testing Library) ou Vitest com JSDOM para componentes UI isolados. Para bancos em memória, considere SQLite in-memory ou Prisma DSN especial. Ferramentas de CI de testes (como Coveralls) podem ser integradas posteriormente, mas foque primeiro na cobertura de funcionalidades.
### 6. Integração com Firebase Studio
Prototyper de IA (App Prototyping Agent): O Firebase Studio inclui um agente de prototipagem por IA (chamado Prototyper ou App Prototyping agent) que gera automaticamente código de aplicação full-stack a partir de prompts multimodais
firebase.google.com
. Ao descrever a ideia da app em linguagem natural, o agente cria um “blueprint”, o código-fonte correspondente e um preview da aplicação. Esse código gerado é injetado diretamente no workspace (IDE VSCode) do Firebase Studio, permitindo que o desenvolvedor revise ou modifique imediatamente no ambiente de código. Em outras palavras, o desenvolvedor trabalha no VSCode web do Firebase Studio e o Prototyper populos generationa arquivos editáveis nesse mesmo editor
firebase.google.com
.
Testando o Preview (VM Fechada): O preview da aplicação no Firebase Studio roda numa VM isolada. Para testar via scripts externos (Playwright, etc.), use a funcionalidade “Make Preview Public”. No próprio Firebase Studio, abra o preview web e clique em “Make Preview Public” na toolbar
firebase.blog
. Isso libera um URL externo (indicado por um ícone de globo amarelo) que qualquer máquina pode acessar temporariamente. A figura abaixo mostra como fica o painel de portas e o botão de pré-visualização pública: Figura: No Firebase Studio, abra o painel “Backend Ports” (Ctrl+',' → “Backend Ports”) e clique no cadeado para liberar a porta do backend publicamente
firebase.blog
. Uma vez liberada, aparece o ícone de globo que indica URL público. Figura: Na aba de preview web do Firebase Studio, clique em “Make Preview Public” (ícone de cadeado) para obter um link público da aplicação
firebase.blog
. O ícone muda para globo amarelo, sinalizando acesso externo. Após tornar o preview público, scripts de teste (por exemplo, Playwright rodando localmente) podem navegar até esse URL e interagir com a aplicação completa. Lembre que essa URL é temporária (ativas apenas enquanto a workspace está ativa)
firebase.blog
.
Configuração do .idx/dev.nix: Se você for rodar testes E2E (Playwright) no ambiente Nix do Firebase Studio, adicione o Chromium no seu .idx/dev.nix. Exemplo de configuração:
{pkgs, ...}: {
  channel = "stable-24.05";
  packages = [
    pkgs.chromium
    # ... outros pacotes necessários (nodejs, python, etc.) ...
  ];
  env = {
    CHROME_BIN = "/usr/bin/chromium";
    # PATH é gerenciado automaticamente, mas outros vars podem ser definidos aqui
  };
}
Isso garante que o Chromium esteja instalado na VM e que a variável CHROME_BIN aponte para o binário, permitindo que o Playwright o utilize
firebase.google.com
firebase.google.com
. Sem essa configuração, o Playwright pode não encontrar um navegador.
Make Preview Public e Portas Públicas: Além do front-end, o Firebase Studio permite liberar portas de backend (por exemplo, porta 3000 do Node) para acesso público
firebase.blog
. Isso é útil para integrar frontend e backend sem alterar o código (basta apontar o front-end para a URL pública do backend). O botão de cadeado no painel de “Backend Ports” abre a porta, e o front-end pode consumi-la pela URL fornecida
firebase.blog
. Contudo, lembre-se que essas portas públicas são temporárias e apenas para desenvolvimento/teste, não substituem uma deployment de produção.
### 7. Organização da Suíte de Testes
Estrutura de Pastas: Separe os testes por tipo. Por exemplo:
/tests
  /unit         # testes unitários
  /integration  # testes de API/integração
  /e2e          # testes end-to-end
Ou coloque tests ao lado dos arquivos de código. Mantenha fixtures em pastas dedicadas (/tests/fixtures) e evite duplicação de dados.
Nomenclatura e Configurações: Use convenções como *.test.ts ou *.spec.ts. Caso use Jest/Vitest, crie arquivos de configuração separados (por exemplo, jest.unit.config.js, jest.integration.config.js ou equivalentes para Vitest) para cada contexto. Isso permite, por exemplo, desabilitar a emulação de rede nos unitários e habilitá-la nos integrações.
Scripts de Execução: No package.json, defina scripts para cada categoria:
{
  "scripts": {
    "test:unit": "vitest run --config vitest.unit.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test": "npm-run-all test:unit test:integration test:e2e"
  }
}
Com esses scripts, o desenvolvedor pode executar apenas um tipo de teste (ex.: npm run test:unit) ou todos em sequência (npm test). Ajuste conforme seu runner: para Jest, por exemplo, use flags em cada config específica.
Integração Contínua (CI): Configure seu pipeline (ex.: GitHub Actions) para instalar dependências, iniciar o banco de testes e rodar todas as suites. Exemplo de trecho de workflow YAML com MySQL:
jobs:
  tests:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: root
        ports:
          - 3306:3306
    env:
      NODE_ENV: test
      DATABASE_URL: mysql://root:root@localhost:3306/leiloes_test
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test
Isso executa todas as etapas de teste em um ambiente isolado. A pirâmide de testes orienta a ter muitos testes unitários (base) e poucos E2E (topo)
apidog.com
. Em CI, você pode marcar falhas ao primeiro erro e, ao final, gerar relatórios de cobertura.
Ambiente de Staging: Para testes mais realistas, tenha um ambiente de staging (pré-produção) deployado. Executar testes de smoke e integrações contínuas no staging (por ex., via Cypress/Playwright) antes da release aumenta a confiabilidade.
### 8. Ferramentas e Recursos Adicionais
Validação e Emulação Firebase: Como estamos na suíte Firebase Studio, lembre-se dos Emuladores Firebase (Autenticação, Firestore, etc.) incorporados no Firebase CLI. Você pode executar testes unitários ou integração que precisam desses serviços emulados.
Documentação Oficial: Consulte sempre a documentação oficial do Firebase Studio e do Nix dev.nix
firebase.google.com
 para detalhes sobre ambiente. O blog do Firebase (como o artigo “Simplify development with public ports in Firebase Studio”
firebase.blog
firebase.blog
) traz dicas atualizadas sobre funcionalidade de preview e portas públicas.
### 9. Princípio da Cobertura de Testes Contínua
**Regra:** Toda nova funcionalidade, alteração de lógica de negócio ou correção de bug implementada a partir do backlog **deve** ser acompanhada pela criação ou atualização dos testes correspondentes (unitários, de integração ou E2E). Isso garante que a base de testes evolua junto com o código e que a cobertura se mantenha alta, prevenindo regressões futuras e documentando o comportamento esperado do sistema.
Resumo: O objetivo é garantir cobertura completa das funcionalidades de leilão em todas as camadas de teste. Use testes unitários para lógica pura, integração para fluxo servidor/BD e E2E para fluxos críticos. Mantenha schemas Prisma/MySQL e Zod sincronizados via migrations e geradores automáticos
github.com
. Adote boas ferramentas (Vitest/Jest, Supertest, Playwright, zod-fixture) e uma infraestrutura de teste sólida (banco isolado, CI, staging). Assim, o desenvolvedor terá orientações claras e exemplos concretos para implementar imediatamente a estratégia de testes.

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
10. **Pagamento:**
    *   Procede para a página de checkout (`/checkout/[winId]`).
    *   O sistema calcula o valor total a pagar, somando o valor do arremate com a comissão da plataforma.
    *   O usuário preenche os dados de pagamento e finaliza a transação através da integração com o gateway.

---

## 5. Regras de Negócio Críticas (Implementação Atual)

A análise do código-fonte revela que muitas regras de negócio estão implementadas diretamente nos componentes de frontend (React/Next.js), em vez de estarem centralizadas em uma camada de serviço de backend.

*   **Incremento de Lance, Anti-Sniping, etc.:** A validação principal dessas regras ocorre no backend (conforme `actions.ts`), mas a lógica de exibição e habilitação de funcionalidades está no frontend.
*   **Cálculo de Preços e Comissões:** Esta é a área mais crítica. A lógica para calcular o valor final a ser pago por um arrematante está **espalhada e duplicada em vários locais do frontend**.

### 5.1. Análise Detalhada: Cálculo de Comissão

A lógica de comissão, uma das regras mais sensíveis do sistema, foi encontrada nos seguintes locais:

1.  **`src/app/checkout/[winId]/page.tsx`:**
    *   **Lógica:** Calcula o total a pagar (`valor do arremate + comissão`).
    *   **Fonte da Regra:** Tenta ler a taxa de `platformSettings.paymentGatewaySettings.platformCommissionPercentage`.
    *   **Inconsistência:** Se a configuração não existir, assume um valor padrão de **5%**.
    *   **Risco de Arquitetura:** Este cálculo é feito **exclusivamente no frontend**. O valor total é passado para o formulário e, subsequentemente, para uma ação de backend que *não valida o montante*. Isso permite a manipulação do valor a ser pago pelo lado do cliente.

2.  **`src/app/consignor-dashboard/financial/page.tsx`:**
    *   **Lógica:** Calcula a comissão para o painel do vendedor/comitente.
    *   **Fonte da Regra:** Utiliza um valor **hardcoded de 5%**, ignorando o `platformSettings`.
    *   **Inconsistência:** O cálculo para o comitente pode divergir do cálculo real pago pelo arrematante se a taxa na plataforma for diferente de 5%.

3.  **`src/app/dashboard/wins/page.tsx`:**
    *   **Lógica:** Mostra o valor da comissão na lista de arremates do usuário.
    *   **Fonte da Regra:** Também utiliza um valor **hardcoded de 5%**.
    *   **Inconsistência:** Mesma questão do painel do comitente.

**Conclusão da Análise:**
A duplicação e a localização da lógica de negócio no frontend não apenas criam um risco de segurança e integridade de dados (especialmente no fluxo de checkout), mas também um pesadelo de manutenção. Uma mudança na regra de comissão exigiria a alteração de múltiplos arquivos, com alto risco de introduzir bugs e inconsistências. Esta é a principal justificativa para a extração dessas regras para um microserviço seguro e centralizado.

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
