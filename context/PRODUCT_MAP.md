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

O conteúdo FINAL e COMPLETO do arquivo deve ser colocado aqui. Não forneça diffs ou trechos parciais.
    
```

## 4. Arquitetura Multi-Tenant e Isolamento de Dados

**Regra:** A aplicação opera sob uma arquitetura multi-tenant estrita. Todo acesso a dados deve ser isolado por um `tenantId`.

-   **Identificação do Tenant:**
    -   **Subdomínio:** O tenant ativo é identificado pelo subdomínio da requisição (ex: `leiloeiro-x.bidexpert.com` resolve para o `tenantId` de "leiloeiro-x"). Isso é gerenciado por um middleware do Next.js.
    -   **Domínio Principal (Landlord):** Requisições ao domínio principal (ex: `bidexpert.com.br` ou `www.bidexpert.com.br`) sem subdomínio devem sempre resolver para o tenant "Landlord", que possui `id = '1'`.
    -   **Sessão:** Para usuários autenticados, o `tenantId` é armazenado na sessão e tem precedência, garantindo que o usuário permaneça em seu espaço de trabalho selecionado.

-   **Schema:** Todos os modelos de dados relevantes (Leilões, Lotes, Comitentes, etc.) devem ter um campo `tenantId` obrigatório. Modelos globais como `User`, `Role`, `State` não possuem `tenantId`.

-   **Acesso a Dados:** Todas as consultas ao banco de dados (leitura, escrita, atualização, exclusão) realizadas através dos Serviços e Repositórios **devem** ser filtradas pelo `tenantId` do contexto da requisição atual. Isso é garantido por um middleware do Prisma.

-   **Segurança:** Um usuário de um tenant **nunca** deve conseguir acessar, visualizar ou modificar dados pertencentes a outro tenant.

**Justificativa:** Esta regra é o pilar da segurança e integridade dos dados da plataforma, garantindo que os dados de cada cliente (leiloeiro) permaneçam completamente isolados.

## 5. Princípio da Não-Regressão e Autorização Humana

**Regra:** Qualquer exclusão de funcionalidade, componente ou alteração significativa no projeto **deve ser explicitamente autorizada por um usuário humano**. Para evitar a remoção acidental de funcionalidades que estão operando corretamente ao implementar correções ou melhorias, a IA deve:

1.  Declarar claramente a intenção de excluir ou refatorar um componente/arquivo/funcionalidade.
2.  Fornecer uma breve justificativa sobre por que a mudança é necessária.
3.  Solicitar confirmação explícita do usuário antes de gerar as alterações.

**Justificativa:** Este princípio garante que o processo de desenvolvimento esteja sempre avançando e evita regressões. Ele mantém uma salvaguarda onde o desenvolvedor humano tem a palavra final sobre quaisquer alterações destrutivas ou em larga escala, preservando a estabilidade e a integridade do projeto.

## 6. Gerenciamento de Dependências

**Regra:** Para manter o projeto otimizado e evitar o crescimento excessivo do diretório `node_modules` e dos pacotes de produção, siga estas diretrizes:
-   **Dependências de Desenvolvimento:** Pacotes usados exclusivamente para desenvolvimento, teste ou processos de build (e.g., `@playwright/test`, `puppeteer` para geração de PDF no servidor) **devem** ser instalados como `devDependencies`. Isso impede que eles sejam incluídos no build de produção.
-   **Análise de Pacotes Pesados:** Antes de adicionar uma nova dependência, especialmente para funcionalidades não essenciais, avalie seu tamanho e impacto.
-   **Revisão Periódica:** Revise periodicamente o `package.json` para remover dependências não utilizadas.

**Justificativa:** Um `node_modules` grande e pacotes de produção inchados podem levar a tempos de instalação mais longos, builds mais lentos e custos de hospedagem mais altos. Manter as dependências limpas e otimizadas é crucial para a saúde do projeto.

## 7. Integridade de Links (Next.js)

**Regra:** Nunca permita que a propriedade `href` de um componente `<Link>` do Next.js seja `undefined`.

-   **Validação Obrigatória:** Se o `href` for dinâmico (vindo de uma API, props, ou estado), sempre valide se o valor existe antes de renderizar o `<Link>`.
-   **Estratégias de Fallback:**
    -   Use um link padrão (e.g., `href={item.url || '#'}`).
    -   Renderize o link condicionalmente (e.g., `{item.url && <Link.../>}`).
    -   Renderize um elemento alternativo (e.g., `<span>`) se o link não estiver disponível.

**Justificativa:** Um `href` indefinido causa um erro fatal de renderização no Next.js (`Error: Failed prop type`). Garantir a validade do `href` previne crashes e melhora a robustez da aplicação.

## 8. Integridade do Arquivo de Ambiente (`.env`)

**Regra:** O arquivo `.env` é considerado uma "zona segura" e **não deve ser modificado diretamente pela IA**. Ele contém chaves de API, senhas de banco de dados e outras informações sensíveis.

-   Se for necessário adicionar ou alterar uma variável de ambiente, a IA deve:
    1.  Indicar claramente a necessidade da alteração.
    2.  Fornecer ao usuário humano o texto exato que precisa ser adicionado ou modificado no arquivo `.env`.
    3.  Instruir o usuário a fazer a alteração manualmente.

**Justificativa:** Esta regra garante que segredos e configurações críticas do ambiente sejam sempre gerenciados e validados por um humano, prevenindo a exposição acidental de dados sensíveis ou a quebra do ambiente por configurações incorretas.

## 9. Estratégia de Testes para Aplicação de Leilões Full-Stack
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
#### Testes da API de Provisionamento de Tenants
O teste de integração para o endpoint `/api/v1/tenant/create` fará o seguinte:

*   **Simulará uma Requisição:** Usará o `NextRequest` para criar um mock de uma chamada `POST` para o nosso endpoint.
*   **Testará a Autenticação:** Validará que a API retorna um erro `401 Unauthorized` se a `TENANT_API_KEY` estiver incorreta ou ausente.
*   **Testará a Validação de Dados:** Garantirá que a API retorne um erro `400 Bad Request` se dados inválidos forem enviados (ex: subdomínio já em uso).
*   **Testará o Caminho Feliz:** Fará uma chamada bem-sucedida e verificará se o `Tenant` e o `User` administrador foram criados corretamente no banco de dados.

Isso nos dará uma cobertura de teste completa para o novo endpoint de provisionamento de tenants.
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
