# AI Prototyper Rules

This document contains specific rules and guidelines for the AI prototyper to follow during development.

## 1. Human Authorization and Non-Regression Principle

**Rule:** Any deletion of functionality, components, or significant project alteration **must be explicitly authorized by a human user**. To prevent accidental removal of perfectly functional items while implementing fixes or improvements, the AI must:
1.  Clearly state its intention to delete or refactor a component/file/feature.
2.  Provide a brief justification for why this change is necessary.
3.  Ask for explicit confirmation from the user before proceeding with generating the changes.

**Rationale:** This principle ensures that the development process is always moving forward and prevents regressions. It maintains a safeguard where the human developer has the final say on any destructive or large-scale changes, preserving the stability and integrity of the project.

## 2. Database and Data Source Architecture

**Rule:** The application uses **Prisma ORM** as its exclusive data access layer. Direct use of database drivers is forbidden. All data access logic must be encapsulated within `Repository` classes (e.g., `src/repositories/seller.repository.ts`).

**Rationale:** Using Prisma as the single source of truth for database interactions provides type safety, simplifies queries, and allows the application to seamlessly switch between different SQL databases (MySQL, PostgreSQL) by only changing the `provider` in the `schema.prisma` file and the `DATABASE_URL` in the `.env` file. This eliminates the need for manual database adapters.

## 3. Schema and Migrations

**Rule:** The single source of truth for the database schema is `prisma/schema.prisma`. Any necessary schema changes must be made in this file. During development, the schema should be synchronized with the database by running `npm run db:push`, which is part of the `npm run dev` script.

**Rationale:** Using Prisma as the schema definition tool ensures type safety and provides a consistent way to manage the database structure across different SQL environments.

## 4. MVC with Service Layer Architecture

**Rule:** The application's architecture is strictly defined as **Model-View-Controller (MVC) with an intermediate Service Layer and a Repository Layer**. This structure is the standard for all new development.
- **Controllers** (Server Actions in `actions.ts` files) handle user input and API requests. They are responsible for orchestrating calls to the service layer.
- **Services** (`/services/*.ts`) contain the core business logic, orchestrating calls to one or more repositories and other services. They are decoupled from both the database and the controllers.
- **Repositories** (`/repositories/*.ts`) encapsulate all database queries using the **Prisma Client**. They are the only layer allowed to directly interact with the database.
- **Data Access:** Direct use of `PrismaClient` in services or controllers is forbidden. All database interactions must go through a `Repository`.

**Rationale:** Maintaining a consistent, layered architecture is crucial for the long-term scalability, maintainability, and testability of the project. This separation of concerns (Presentation, Business Logic, Data Access) makes the codebase cleaner and easier to manage.

## 5. Pricing Logic: Per-Stage Pricing

**Rule:** Financial details specific to a lot's participation in an auction, such as `initialBid` (lance inicial) and `bidIncrement` (incremento), **must not** be stored directly in the `Lot` model. Instead, these values are defined at the intersection of a `Lot` and an `AuctionStage` (etapa/praça). This is managed through the `LotAuctionStageDetails` join model.

**Rationale:** This architecture provides the necessary flexibility for complex auction rules, particularly in judicial auctions where the initial price and increments for a lot can differ between the first and second "praça". It ensures that the `Lot` model remains a clean representation of the asset, while the auction-specific pricing rules are correctly associated with the context in which they apply.

## 6. Directory Structure

**Rule:** The Next.js application structure must follow the `src` directory convention. The main application routes must reside within `src/app`. **Under no circumstances should a nested `app` directory (e.g., `src/app/app`) or a root-level `app` directory be created.** Any such occurrence must be identified and corrected immediately by merging the files into `src/app` and removing the incorrect directory.

**Rationale:** A nested or misplaced `app` directory breaks Next.js's file-based routing system, leading to build failures and runtime errors. Maintaining the correct structure is critical for the application's stability.

## 7. Code Quality and Naming Conventions

### 7.1. Form Component Standardization

**Rule:** For all CRUD forms, any field representing a foreign key relationship (e.g., selecting a `seller` for an `auction`) **must** use the custom `EntitySelector` component. This component provides a standardized and enhanced user experience including search, on-the-fly creation, editing, and list refreshing. Direct use of a standard `<Select>` component for entity relationships is disallowed.

**Rationale:** This ensures a consistent, powerful, and user-friendly interface across the entire admin panel, reducing development time for new forms and improving the end-user workflow by preventing the need to navigate away to create prerequisite entities.

### 7.2. JavaScript/TypeScript Naming

**Rule:** All new or modified functions, variables, and components must have names that are descriptive, human-readable, and contextually relevant, preferably in Portuguese (e.g., `buscarLeiloes`, `SalvarComitenteButton`). This practice applies to all parts of the codebase, from front-end components to back-end services.

**Rationale:** Clear and consistent naming is fundamental for code quality, making the application easier to read, debug, and maintain for all developers involved, including AI assistants.

### 7.3. HTML Element Identification

**Rule:** All new HTML elements created must have a `data-ai-id` attribute with a unique, human-readable, and contextually relevant name. This name should reflect the element's purpose or content. For example, a button to submit a login form should be `<Button data-ai-id="login-submit-button">`, and a container for a user's profile card should be `<div data-ai-id="user-profile-card">`.

**Rationale:** This convention is essential for the AI to reliably identify and manipulate specific UI elements, ensuring that future requests are executed precisely. It also aids in end-to-end testing and debugging.

## 8. Next.js & React Best Practices

-   **Default to Server Components:** Components should be Server Components by default. Only use the `'use client'` directive when client-side interactivity (hooks like `useState`, `useEffect`, event listeners) is absolutely necessary. This reduces the amount of JavaScript sent to the client, improving performance.
-   **Server Actions for Mutations:** All data mutations (create, update, delete) must be handled through Next.js Server Actions. This simplifies the architecture by eliminating the need for separate API routes and provides a secure, built-in mechanism for form submissions and data handling.
-   **Image Optimization:** Always use the built-in `next/image` component for displaying images. It provides automatic optimization, resizing, and lazy loading, which are crucial for performance.
-   **Memoization:** In client components, use `useMemo` to memoize the results of expensive calculations and `useCallback` to memoize functions passed to child components. This prevents unnecessary re-renders and improves UI responsiveness.
-   **Error Handling:** Implement `error.js` files at appropriate route segments to handle runtime errors gracefully and prevent the entire application from crashing.
-   **Type Safety:** Utilize TypeScript's `import type` for type-only imports to improve build performance and maintain clear separation between type information and runtime code.
-   **Valid Link Hrefs:** Never allow the `href` prop of a Next.js `<Link>` component to be `undefined`. If a link's path is dynamic (e.g., from an API response or props), always validate it before rendering. Provide a fallback href like `/` or `#`, or conditionally render the `<Link>` only when the `href` is valid.

## 9. Development Environment Information

**Rule:** During development (`NODE_ENV === 'development'`), the application footer must display key environment information. This includes the currently active database system (e.g., MySQL, PostgreSQL), the logged-in user's email, and the active Firebase Project ID.

**Rationale:** This provides immediate, persistent context about the development environment, preventing confusion and aiding in debugging database or user-specific issues.

## 10. BidExpertOkrs: Análise Estratégica, KPIs e Insights

**Rule:** All entity management sections (CRUDs) must evolve into comprehensive management and analysis modules, providing strategic insights beyond simple data display. This includes:

-   **Dashboards de Análise Agregada:** Cada menu de entidade principal (e.g., "Leilões", "Comitentes", "Cidades") deve conter um sub-menu de "Análise" (e.g., `/admin/auctions/analysis`) que apresenta KPIs agregados, gráficos comparativos e métricas de performance para o grupo de entidades.
-   **Dashboards de Análise Individual:** A página de detalhe/edição de cada registro (`/admin/[entity]/{id}/edit`) deve incluir uma seção de dashboard exibindo KPIs históricos e métricas de desempenho específicas para aquele registro.
-   **Análise de Dados Aprofundada:** As análises devem, sempre que possível, ir além das contagens básicas. O objetivo é cruzar dados para identificar tendências, padrões e oportunidades (leading indicators). Isso inclui:
    -   **Análise Geográfica:** Mapear performance por cidade, estado e, futuramente, por região (Norte, Sudeste, etc.). A longo prazo, planejar a integração com dados demográficos e econômicos externos (ex: IBGE) para enriquecer os insights.
    -   **Análise Comportamental:** Cruzar dados de leilões com perfis de usuários para entender padrões de lances e preferências.
-   **Fonte de Dados Dinâmica:** Todos os dados dos dashboards devem ser derivados de queries diretas ao banco de dados da aplicação (via Prisma). O uso de dados estáticos ou de exemplo é estritamente proibido para estes componentes.
-   **Insights com IA (Genkit):** Os dashboards devem progressivamente incorporar uma seção para análises e recomendações inteligentes geradas pelo Genkit. A IA deve interpretar os dados apresentados (KPIs, gráficos) e fornecer insights textuais, apontando oportunidades, gargalos e recomendações estratégicas para a diretoria.

**Rationale:** Esta estratégia transforma o painel de administração de uma ferramenta de entrada de dados em um poderoso centro de Business Intelligence (BI) e suporte à decisão. Ela habilita a gestão baseada em dados, o monitoramento de OKRs, a identificação de oportunidades estratégicas e o alinhamento de toda a empresa em torno de objetivos mensuráveis.

## 11. Gerenciamento de Dependências

**Rule:** Para manter o projeto otimizado e evitar o crescimento excessivo do diretório `node_modules` e dos pacotes de produção, siga estas diretrizes:
-   **Dependências de Desenvolvimento:** Pacotes usados exclusivamente para desenvolvimento, teste ou processos de build (e.g., `@playwright/test`, `puppeteer` para geração de PDF no servidor) **devem** ser instalados como `devDependencies`. Isso impede que eles sejam incluídos no build de produção.
-   **Análise de Pacotes Pesados:** Antes de adicionar uma nova dependência, especialmente para funcionalidades não essenciais, avalie seu tamanho e impacto. Use ferramentas como `cost-of-modules` ou `du` para identificar os pacotes mais pesados.
-   **Alternativas Leves:** Para funcionalidades como geração de PDF ou manipulação de imagens, considere alternativas mais leves ou serviços externos em vez de pacotes pesados como o `puppeteer` completo, se possível.
-   **Revisão Periódica:** Revise periodicamente o `package.json` para remover dependências não utilizadas ou desnecessárias.

**Rationale:** Um `node_modules` grande e pacotes de produção inchados podem levar a tempos de instalação mais longos, builds mais lentos e custos de hospedagem mais altos. Manter as dependências limpas e otimizadas é crucial para a saúde do projeto.

## 12. Estratégia de Testes para Aplicação de Leilões Full-Stack
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
