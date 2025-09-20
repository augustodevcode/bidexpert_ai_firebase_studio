# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Architectural Overview

This application follows a robust **Multi-Tenant MVC (Model-View-Controller) with a Service Layer** architecture to ensure scalability and maintainability.

### Multi-Tenancy

The platform is designed to serve multiple "tenants" (auction houses), each with their own isolated data.

-   **Tenant Identification**:
    -   **Subdomain**: The active tenant is identified by the request's subdomain (e.g., `leiloeiro-x.bidexpert.com`).
    -   **Main Domain**: Requests to the main domain (e.g., `bidexpert.com.br`) default to the "Landlord" tenant (`id: '1'`), which represents the platform itself.
-   **Data Isolation**: A Prisma middleware automatically filters all database queries by `tenantId`, ensuring a user from one tenant cannot access data from another.
-   **Shared & Global Data**: Models like `User`, `Role`, `State`, and `LotCategory` are global and shared across all tenants.

### MVC with Service Layer

-   **Model:** Managed by **Prisma ORM**, with the schema defined modularly in the `prisma/models/` directory.
-   **Views:** Implemented using **Next.js with React Server Components** (`.tsx` files).
-   **Controllers:** Handled by **Next.js Server Actions** (`/actions.ts` files).
-   **Services:** Contain the core business logic (`/services/*.ts` files).
-   **Repositories:** Encapsulate all database queries using the Prisma Client (`/repositories/*.ts`).

---

## Database Setup

This project uses **Prisma ORM** as its data access layer with **MySQL**.

### 1. Environment Setup

-   Ensure your MySQL server is running. Set the `DATABASE_URL` in your `.env` file with your database credentials.
    ```
    # Example for MySQL
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

### 2. Schema Management (Modular)

To keep the project organized, the Prisma schema is modularized.

-   **Source of Truth:** All data models (`model`) and enumerations (`enum`) are located in individual `.prisma` files inside the `prisma/models/` directory. **You should edit these files, not `prisma/schema.prisma`.**
-   **Build Process:** The main `prisma/schema.prisma` file is **automatically generated**. A script (`scripts/build-prisma-schema.ts`) runs before any `dev` or `build` command to combine all modular files into the final schema file that Prisma uses.

### 3. Database Initialization & Seeding

-   **`npm run dev`**: This command now automatically builds the `schema.prisma` file and then runs `npx prisma db push`. `db push` syncs your database schema with the generated schema file, creating or updating tables as needed. It also executes `scripts/seed-db.ts` on the first run to populate essential global data.
-   **`npm run db:seed`**: After the server has started, you can run this script manually to populate the database with a **full set of sample data** (auctions, lots, users, etc.) under the default tenant.

```bash
# First, run the development server. This will build the schema and initialize the database.
npm run dev

# (In a new terminal, while the server is running)
# Then, populate with the full sample data set.
npm run db:seed
```

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
