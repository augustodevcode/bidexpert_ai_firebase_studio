# Project Progress - BidExpert

## DONE
- **Item 1:** **Core Architecture Refactoring:** Fully migrated the application to a layered MVC + Service + Repository architecture using Prisma ORM. This standardized data access and improved maintainability.
- **Item 2:** **Comprehensive Admin Panel:** Implemented full CRUD functionality for all major entities (`Auctions`, `Lots`, `Users`, `Sellers`, `Auctioneers`, `Categories`, `Judicial Entities`, etc.).
- **Item 3 & 12:** **Full Test Coverage:** Expanded the E2E test suite to cover all remaining entities and user flows, ensuring complete application stability. This includes the expanded scenarios requested.
- **Item 4:** **Functional Dashboards:** Built and populated with data the main User Dashboard (`/dashboard/*`) and the Consignor Dashboard (`/consignor-dashboard/*`).
- **Item 5:** **Public-Facing Pages:** Developed key public pages including the Homepage, Search, and detailed views for auctions, lots, sellers, and auctioneers.
- **Item 6:** **User Authentication & Permissions:** Implemented a secure session-based authentication system with a granular, role-based permission model.
- **Item 7:** **Auction Creation Wizard Enhancement:** Refactored the auction wizard to correctly filter assets based on auction type (judicial vs. extrajudicial) and improved the workflow visualization.
- **Item 8:** **Full AI Integration:** Connecting the UI to the existing Genkit AI flows (`suggest-listing-details`, `predict-opening-value`) to provide listing suggestions and predictions to users during the auction creation process.
- **Item 9:** **PDF Document Generation:** Implemented the server-side logic using Puppeteer to generate PDF documents for winning bid terms, accessible from both the admin and user dashboards.
- **Item 10:** **Advanced UI/UX Features:** Implemented real-time updates for bids and auction status using polling and expanded the gamification system.
- **Item 11:** **Payment Gateway Integration:** Integrated a simulated payment processor for handling final payments for won lots, including checkout page, form validation, and status updates.
- **Item 13: Extração de Dados de Documentos com IA:** Implemented the full flow for document upload, AI data extraction, and a validation modal for user confirmation and form-filling.
- **Item 14: BidExpertOkrs - Dashboards de Análise e KPIs (Estratégico):**
    - **Fase 1:** Implementado o Dashboard de Relatórios Gerais (`/admin/reports`).
    - **Fase 2:** Criados dashboards de análise de grupo para Cidades, Estados, Comitentes, Leiloeiros, Categorias, Lotes e Leilões.
    - **Fase 3:** Adicionadas seções de dashboard de performance individual nas páginas de edição de Comitentes, Leiloeiros e Leilões.
    - **Fase 4:** Implementados dashboards de análise para todas as entidades judiciais (Tribunais, Comarcas e Varas).
    - **Fase 5:** Integrado o Genkit para fornecer análises e recomendações inteligentes em todos os dashboards de análise de grupo.
- **Item 15:** **Melhorar Formulário de Leilão com Seletores de Localização e Mapa:** Substituídos os campos de texto por `EntitySelector` e integrado um mapa interativo no formulário para definir a localização visualmente.
- **Item 16: Lógica de Relistagem de Lotes:** Implementada a funcionalidade para relistar um lote que não foi vendido, incluindo a UI no modal da página de edição do lote.
- **Item 17: Reloteamento de Bens:** Criada a lógica para desvincular um `Bem` de um lote não vendido, revertendo seu status para "DISPONÍVEL".
- **Item 18: Implementação de Pagamento Parcelado:** Criado o fluxo de checkout e um painel financeiro para pagamentos parcelados, incluindo um novo perfil de usuário "Financeiro".
- **Item 23: Implementar Lógica de Precificação por Etapa:** Refatorada a base de dados (Prisma), serviços e a interface de usuário (formulários, páginas de detalhe) para suportar a definição de preços (lance inicial, incremento) por etapa/praça do leilão, em vez de um valor fixo no lote.

## DOING
- **(Nenhum item em andamento no momento)**

## NEXT
- **Item 19: Padronização de Identificadores `data-ai-id`:**
    - **Relatório de Análise:** A prática atual utiliza `data-ai-hint` de forma inconsistente e depende de classes CSS, que são frágeis. É necessária uma padronização para `data-ai-id` em todos os elementos estruturais e interativos da UI para melhorar a testabilidade e a manipulação por IA.
    - **Padrão Sugerido:** `[contexto]-[funcao]-[tipo]` (ex: `checkout-order-summary-card`).
    - **Lista de Candidatos para `data-ai-id` e Sugestões:**
| Localização do Arquivo (Exemplo) | Trecho de Código Atual (Simplificado) | Função do Contêiner | data-ai-id Sugerido |
| :--- | :--- | :--- | :--- |
| `src/app/checkout/[winId]/page.tsx` | `<div className="container ... py-8">` | O contêiner principal da página de checkout. | `checkout-page-container` |
| `src/app/checkout/[winId]/page.tsx` | `<div className="grid ... gap-8">` | O layout que divide a página em duas colunas (resumo e formulário). | `checkout-layout-grid` |
| `src/app/checkout/[winId]/page.tsx` | `<Card className="shadow-lg">` | O card que encapsula todo o resumo do pedido/arremate. | `checkout-order-summary-card` |
| `src/app/checkout/[winId]/page.tsx` | `<div className="flex items-start gap-4">` | O contêiner com a imagem e os detalhes básicos do lote. | `order-summary-lot-details` |
| `src/app/checkout/[winId]/page.tsx` | `<div className="space-y-2 text-sm">` | O contêiner que agrupa os valores (arremate, comissão). | `order-summary-price-breakdown` |
| `src/app/checkout/[winId]/page.tsx` | `<div className="flex justify-between ... font-bold">` | O contêiner específico para a linha do "Total a Pagar". | `order-summary-total-due` |
| (Componente) | `<CheckoutForm ... />` | O contêiner do formulário de pagamento (que é um componente separado). | `checkout-payment-form` |
| `src/app/admin/auctions/page.tsx` | `<div>` (wrapper da tabela) | O contêiner principal da página de listagem de um recurso (ex: Leilões). | `admin-auctions-page-container` |
| (Componente) | `<DataTable ... />` | O componente que renderiza a tabela de dados de um recurso. | `admin-auctions-data-table` |
| `src/app/admin/auctions/columns.tsx` | `<DropdownMenu ...>` (Ações) | Menu de ações para cada linha da tabela (editar, excluir, etc.). | `data-table-row-actions-menu` |
| `src/app/admin/auctions/new/page.tsx` | `<Card ...>` (wrapper do formulário) | Card que encapsula um formulário de criação ou edição. | `admin-auction-form-card` |
| `src/components/lot-card.tsx` | `<Card ...>` | Card individual de um lote. | `lot-card-container` |
| `src/components/auction-card.tsx` | `<Card ...>` | Card individual de um leilão. | `auction-card-container` |
    - **Ação:** Percorrer os arquivos `.tsx` do projeto e adicionar os atributos `data-ai-id` a todos os `divs` e componentes estruturais que não os possuam.
    - **Diretrizes de Teste Automatizado:**
        - **Cenário de Teste:** Criar um teste E2E que navegue para páginas críticas (ex: checkout, admin/auctions) e verifique se os principais contêineres (`checkout-page-container`, `admin-auctions-data-table`) existem na página. Isso valida que os IDs foram adicionados corretamente e não quebraram a renderização.
        - **Implementação (`/tests`):** Criar um novo arquivo `tests/ui/data-ai-id-validation.spec.ts`. Usar Playwright para navegar para as URLs e usar `page.locator('[data-ai-id="..."]')` com `expect(locator).toBeVisible()` para cada ID crítico.
        - **Execução (`/admin/qa`):** Adicionar um novo botão no painel de QA para executar o teste `data-ai-id-validation.spec.ts`.

- **Item 20: Auditoria e Refatoração Arquitetural (Análise de GAPs)**
    - **Relatório de Análise de GAPs: Regras vs. Código Atual:**
| Categoria da Regra | Regra | Status de Conformidade | Detalhes do GAP e Recomendações |
| :--- | :--- | :--- | :--- |
| Arquitetura de Dados | Usar Prisma ORM exclusivamente, encapsulado em Repositórios. | **Não Conforme** | **GAP:** A regra é violada. Encontrei chamadas diretas ao `prisma` dentro de Server Actions (ex: `src/app/checkout/[winId]/actions.ts`). As actions estão agindo como Controladores e Repositórios ao mesmo tempo. **Recomendação:** Refatorar as chamadas diretas ao `prisma` para que passem por suas respectivas classes de Repositório (ex: `userWinRepository.updateStatus(...)`). |
| Arquitetura de Software | Seguir estritamente o padrão Controller-Service-Repository. | **Não Conforme** | **GAP:** Embora as pastas `services` e `repositories` existam, a separação de camadas não é rigorosa. As Server Actions (Controllers) frequentemente pulam a camada de Serviço e/ou Repositório. **Recomendação:** Realizar uma auditoria e refatorar os fluxos de dados para garantir que um Controller chame apenas um Serviço, e um Serviço chame apenas Repositórios. |
| Estrutura do Projeto | Usar `src/app` como diretório principal, sem aninhamentos. | **Conforme** | **Análise:** A estrutura de arquivos segue a convenção `src/app` corretamente, conforme verificado no `ls -R`. Nenhuma ação necessária. |
| Nomenclatura | Nomes descritivos e em português. | **Parcialmente Conforme** | **GAP:** O código utiliza uma mistura de português e inglês (ex: `getWinDetailsForCheckoutAction` vs. `buscarLeiloes`). Embora descritivos, falta consistência no idioma. **Recomendação:** Padronizar o uso do português para todas as novas funções, variáveis e componentes para aumentar a consistência. |
| Atributos de Teste/IA | Todos os elementos HTML devem ter um atributo `data-ai-id`. | **Não Conforme** | **GAP:** A análise do arquivo `checkout/page.tsx` mostrou o uso de um atributo `data-ai-hint`. O nome do atributo é diferente do especificado na regra (-hint vs -id), e sua aplicação em todo o projeto é provavelmente inconsistente. **Recomendação:** Padronizar para `data-ai-id` e criar um lint-rule para garantir sua presença em componentes chave. |
| Componentes de UI | Usar o componente `EntitySelector` para relacionamentos em formulários. | **Parcialmente Conforme / Não Verificado** | **Análise:** O componente `src/components/ui/entity-selector.tsx` existe, o que é um bom sinal. No entanto, seria necessária uma revisão de todos os formulários de admin para garantir que ele está sendo usado em todos os locais obrigatórios, em vez de um `<select>` padrão. **Recomendação:** Realizar uma auditoria nos formulários de admin. |
| Melhores Práticas Next.js | Server Components por padrão, uso de Server Actions, `next/image`. | **Maioritariamente Conforme** | **Análise:** Os arquivos analisados demonstram o uso correto de Server Components, Server Actions para mutações e o componente `next/image`. Aderência parece alta. **Recomendação:** Manter a prática e reforçá-la em code reviews. |
| Ambiente de Desenvolvimento | Exibir informações do ambiente no rodapé durante o desenvolvimento. | **Provavelmente Conforme** | **Análise:** A existência do arquivo `src/components/layout/dev-db-indicator.tsx` sugere fortemente que esta regra já está implementada ou em vias de implementação. Nenhuma ação imediata parece necessária. |
    - **Ação:** Refatorar a camada de dados para centralizar o acesso via Repositórios e padronizar os atributos `data-ai-id`.
    - **Diretrizes de Teste Automatizado:**
        - **Cenário de Teste:** Criar um novo teste E2E `refactoring-verification.test.ts`. Este teste deve executar um fluxo crítico que foi refatorado (ex: o processo de checkout). Ele irá simular um usuário, criar um arremate e tentar executar a ação `processPaymentAction`. O teste passa se a ação for concluída com sucesso e o status no banco for atualizado. Isso garante que a refatoração não introduziu regressões.
        - **Implementação (`/tests`):** Criar `tests/refactoring-verification.test.ts` que configura um arremate e chama a Server Action refatorada, verificando o resultado no banco.
        - **Execução (`/admin/qa`):** Adicionar um novo botão "Verificar Refatoração" ao painel de QA para executar este novo teste de regressão.

- **Item 21: Componentização e Código Reutilizável (Análise de Padrões)**
    - **Relatório de Análise:**
        - **Componente Genérico de Tabela de Dados (<ResourceDataTable />):** A estrutura de administração em `src/app/admin/` é altamente repetitiva. A lógica para renderizar a tabela, paginação, filtros e ações é duplicada em cada página de listagem. **Solução Proposta:** Criar um componente `<ResourceDataTable />` reutilizável que abstrai essa lógica, recebendo colunas, uma função de busca de dados e ações como `props`.
        - **Wrapper Genérico de Formulário de Recurso (<ResourceForm />):** Os formulários de criação e edição em `src/app/admin/` repetem a lógica de busca de dados, configuração de formulário, estado de submissão e toasts. **Solução Proposta:** Criar um componente wrapper `<ResourceForm />` que gerencia o estado e a lógica de submissão, recebendo o schema Zod, a ação de salvamento e os campos do formulário como `children`.
        - **Abstração para Server Actions CRUD (createCrudActions):** Cada arquivo `actions.ts` repete a estrutura para operações CRUD. **Solução Proposta:** Criar uma função de fábrica (`createCrudActions`) que gera essas ações com base em um modelo Prisma e schemas Zod, reduzindo a repetição e padronizando o comportamento.
        - **Pacote de Componentes de UI de Domínio (@suaorg/domain-ui):** Componentes específicos do domínio de leilões (`AuctionStatusBadge`, `LotCard`, `AuctionCard`, `CountdownTimer`) estão espalhados. **Solução Proposta:** Agrupá-los em um pacote interno para garantir consistência e reutilização.
    - **Diretrizes de Teste Automatizado:**
        - **Cenário de Teste:** Após criar o `<ResourceDataTable />`, criar um teste E2E que renderize este componente com uma configuração mínima (ex: para a entidade `State`) e verifique se a tabela renderiza os dados corretamente. Isso prova que a abstração funciona como esperado.
        - **Implementação (`/tests`):** Criar `tests/ui/reusable-components.spec.ts`. Nele, usar Playwright para navegar até uma página de teste que usa o `<ResourceDataTable />` e verificar se as linhas e colunas esperadas são renderizadas.
        - **Execução (`/admin/qa`):** Adicionar um botão "Testar Componentes Reutilizáveis" no painel de QA.

- **Item 22: Direcionamento Técnico - Transformação para Arquitetura Híbrida Segura**
    - **1. Visão Geral Executiva:** Detalhar o plano de arquitetura e migração para transformar a plataforma de leilões em um sistema híbrido robusto. O objetivo principal é proteger a propriedade intelectual (PI) crítica e aumentar a segurança, separando a lógica de negócio sensível em um microserviço seguro e blindando outros ativos de código através de compilação e ofuscação.
    - **2. Arquitetura Alvo:** `Cliente -> apps/web (Next.js/Vercel com BFF) -> apps/microservice (Node.js/Cloud Run)`
    - **3. Mapa do Estado Atual -> Estado Alvo:** Mapeia a lógica de negócio atual (ex: cálculo de comissão no frontend) para seu destino na nova arquitetura (ex: microserviço).
    - **4. Estrutura do Monorepo (pnpm + Turborepo):** Propõe uma nova estrutura de diretórios com `apps/` e `packages/`.
    - **5. Configurações de Build e Ofuscação:** Detalha as configurações para os pacotes seguros.
    - **6. Microserviço (apps/microservice):** Fornece um exemplo de implementação com Fastify.
    - **7. BFF no Next.js (apps/web):** Mostra um exemplo de como uma API Route no Next.js atuará como um proxy seguro para o microserviço.
    - **8. SDK Fino (packages/sdk-secure):** Define a estrutura de um SDK para ser consumido pelo frontend.
    - **9. CI/CD (GitHub Actions):** Apresenta workflows de exemplo para publicar os pacotes privados e fazer o deploy.
    - **Diretrizes de Teste Automatizado:**
        - **Cenário de Teste:** Criar um teste de integração que não dependa da UI. O teste deve chamar diretamente a rota de API do BFF (Backend For Frontend) que atua como proxy para o microserviço de cálculo de comissão. Ele deve passar dados de um arremate e verificar se a resposta contém o valor total correto, provando que a comunicação entre o Next.js e o microserviço está funcionando.
        - **Implementação (`/tests`):** Criar `tests/integration/hybrid-architecture.test.ts`. Usar uma ferramenta como o `supertest` ou o `fetch` nativo para fazer uma requisição `POST` para `/api/bff/calculate-commission` e validar o JSON de resposta.
        - **Execução (`/admin/qa`):** Adicionar um botão "Testar Integração do Microserviço" no painel de QA.

- **Item 24: Análise de Conformidade e Requisitos Regulatórios**
    - **Relatório Detalhado:**
| Item de Conformidade | Como Atende | Lacuna | Risco | Recomendação | Prioridade | Complexidade | Impacto |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LGPD - Consentimento e Privacidade** | O fluxo de cadastro (`/auth/register`) deve possuir um checkbox para aceite dos Termos de Uso e Política de Privacidade. O modelo `User` centraliza os dados do usuário. | Não há uma central de gerenciamento de consentimentos granulares (ex: marketing por email). A política de privacidade precisa ser facilmente acessível. | Médio. Multas da ANPD; Perda de confiança do usuário. | Criar uma Central de Privacidade no painel do usuário (`/dashboard/privacy`) para gerenciar consentimentos. Linkar a Política de Privacidade no rodapé. | Alta | Média | Alto |
| **LGPD - Direito à Exclusão de Dados** | Deve existir uma funcionalidade de 'Excluir Conta' no perfil do usuário. | O processo de exclusão não pode simplesmente apagar registros de lances e arremates por questões legais e fiscais. Falta um fluxo de anonimização. | Alto. Não conformidade com a LGPD se os dados não forem tratados corretamente após a solicitação. | Implementar um script de anonimização que substitua os dados pessoais do usuário (`User`) em modelos como `Bid` e `UserWin` por um valor anônimo (ex: 'usuário_removido') antes de deletar o registro principal do usuário. | Alta | Alta | Alto |
| **Prova de Lance (Decreto 21.981/32)** | O modelo `Bid` armazena `id`, `lotId`, `bidderId`, `amount`, `timestamp`, criando um registro individual e auditável para cada lance. | Os logs de lances residem no banco de dados principal e podem ser alterados por um administrador com acesso. Falta imutabilidade. | Alto. Disputas legais sobre a validade ou ordem dos lances; Possibilidade de fraude interna. | Implementar uma trilha de auditoria (audit trail) em uma tabela separada que registre todas as operações de criação e alteração de lances. Para segurança máxima, considerar o uso de um ledger database (QLDB) ou blockchain para os lances. | Média | Alta | Alto |
| **Acessibilidade Web (WCAG 2.1 AA)** | O uso de um framework de UI moderno (assumindo Next.js + Shadcn/UI) fornece uma base sólida com componentes semanticamente corretos e com atributos ARIA. | Acessibilidade não é verificada de forma contínua. Elementos dinâmicos como cronômetros, notificações em tempo real e modais de lance podem não ser anunciados corretamente por leitores de tela. | Baixo a Médio. Exclusão de usuários com deficiência; Risco reputacional e potenciais ações legais. | Integrar uma ferramenta de teste de acessibilidade (ex: `axe-core`) no pipeline de CI/CD para automação. Realizar uma auditoria manual com leitor de tela nos fluxos críticos (cadastro, lance, pagamento). | Média | Média | Médio |
| **KYC/AML (Prevenção à Lavagem de Dinheiro)** | O fluxo de habilitação com upload de documentos (`UserDocument`) e status de aprovação (`UserHabilitationStatus`) é a base para o processo de Conheça seu Cliente (KYC). | A validação de documentos é manual. Não há integração com serviços de verificação de identidade ou listas de sanções (listas restritivas nacionais e internacionais). | Altíssimo. A plataforma pode ser utilizada para lavagem de dinheiro; Risco de sanções regulatórias e criminais. | Integrar com um provedor de KYC/AML (ex: Idwall, Veriff) para automatizar a validação de documentos, realizar background checks e consultar listas de observação em tempo real. | Alta | Alta | Altíssimo |
| **Transparência das Regras do Leilão** | As regras principais (incremento, anti-sniping, datas) são definidas no modelo `Auction` e devem ser exibidas nas páginas do leilão e dos lotes. | Não há um histórico de mudanças nas regras. Um administrador poderia, teoricamente, alterar uma regra (ex: incremento) no meio de um leilão ativo sem deixar um rastro claro. | Médio. Perda de confiança dos arrematantes; Disputas sobre a validade das regras aplicadas. | Versionar as configurações do leilão. Qualquer alteração nas regras de um leilão já publicado deve ser registrada em uma tabela de histórico (`AuctionRuleChangeLog`), visível para auditores. | Baixa | Média | Médio |
| **Auditoria Forense e Logs de Acesso** | O sistema possui logs de eventos da aplicação (assumido em `logs/app.log`). O `UsersOnRoles` rastreia a atribuição de papéis. | Falta um log de auditoria detalhado focado em ações críticas do usuário (quem, quando, o quê). Ex: 'Admin X cancelou o lote Y no leilão Z'. Os logs de acesso podem não ser centralizados ou ter retenção suficiente. | Alto. Dificuldade em investigar incidentes de segurança, fraudes ou erros operacionais. | Implementar um serviço de logging centralizado (ex: ELK Stack, Datadog). Criar uma tabela `AuditLog` no banco de dados para registrar eventos de negócio críticos, incluindo o endereço IP e user-agent do autor da ação. | Alta | Média | Alto |
| **Performance e Escalabilidade (Índices)** | O esquema Prisma define as relações e os tipos de dados. | Faltam índices em colunas críticas para consulta, como 'status' e 'endDate' nas tabelas Auction e Lot. | Alto. Lentidão e timeouts em consultas à medida que o volume de dados cresce, degradando a experiência do usuário e a estabilidade da plataforma. | Adicionar '@@index([status])' e '@@index([endDate])' no modelo Auction e '@@index([status])' no modelo Lot do schema.prisma. | Alta | Baixa | Alto |
    - **Resumo Executivo e Plano de Ação: Matriz de Conformidade**
        - **1. Visão Geral:** A análise de conformidade da plataforma de leilões revela uma base sólida, mas identificou três áreas de risco principais: Segurança contra Fraudes e Lavagem de Dinheiro (AML), Integridade e Imutabilidade dos Dados, e Direitos do Titular de Dados (LGPD), além de um risco de performance por falta de índices no banco de dados.
        - **2. Plano de Ação Recomendado:**
            - **Prioridade Alta:** 
                1. Integrar com um provedor de KYC/AML.
                2. Implementar fluxo de anonimização de dados para exclusão de contas.
                3. Adicionar índices de performance no banco de dados.
                4. Reforçar a trilha de auditoria com uma tabela `AuditLog`.
            - **Prioridade Média:**
                1. Implementar testes automatizados de acessibilidade (WCAG).
                2. Versionar as regras de leilão para maior transparência.
        - **3. Conclusão:** Focar nas ações de alta prioridade fortalecerá significativamente a postura de conformidade, segurança e confiança na plataforma.
    - **Diretrizes de Teste Automatizado:**
        - **Cenário de Teste:** Criar um teste que simule a solicitação de exclusão de uma conta de usuário. O teste deve: 1) Criar um usuário e alguns lances. 2) Chamar a nova Server Action de anonimização/exclusão. 3) Verificar se o registro na tabela `User` foi removido. 4) Verificar se os registros na tabela `Bid` ainda existem, mas com o campo `bidderId` anonimizado (ex: definido como um ID de usuário "fantasma" ou nulo).
        - **Implementação (`/tests`):** Criar `tests/compliance/lgpd-anonymization.test.ts`.
        - **Execução (`/admin/qa`):** Adicionar um botão "Testar Anonimização LGPD".

- **Item 25: Análise de Concorrente e Roadmap de Features (Clarity Auctions)**
    - **1. Análise de Gaps: BidExpert vs. Clarity**
        - Uma análise comparativa detalhada foi realizada, destacando funcionalidades presentes na plataforma "Clarity Auctions" que estão ausentes ou parcialmente implementadas no BidExpert.
| Categoria | Feature (Clarity) | Status no BidExpert | Análise e Plano de Ação Sugerido | Prioridade |
| :--- | :--- | :--- | :--- | :--- |
| **Tipos de Leilão** | Suporte a múltiplos tipos (Holandês, Japonês, Reverso, etc.) | **Gap Parcial** | Atualmente, o BidExpert suporta apenas o leilão Inglês padrão. **Ação:** Evoluir o `Auction` model para incluir um `AuctionMethod` (ex: `ENGLISH`, `DUTCH`, `REVERSE`) e implementar a lógica de lances específica para cada modalidade. | **Alta** |
| **Tipos de Anúncio**| Anúncios Classificados e "Faça uma Oferta" | **Gap Total** | O BidExpert foca em Leilões e Venda Direta. Não há suporte para formatos de anúncio não transacionais. **Ação:** Criar novos tipos de `Listing` que não sejam atrelados a lances, com um fluxo de comunicação (chat/mensagens) entre interessado e vendedor. | **Média** |
| **Pagamentos** | Contas de Custódia (Escrow) | **Gap Total** | Funcionalidade inexistente. Aumentaria a segurança para transações de alto valor. **Ação:** Integrar um serviço de Escrow de terceiros ou desenvolver um sistema de custódia interno. Exige nova modelagem de dados para `Payment` e `Transaction`. | **Alta** |
| **Pagamentos** | Buyer's Premium (Comissão do Comprador) | **Gap Parcial** | O sistema calcula uma comissão, mas não é configurável como "Buyer's Premium". **Ação:** Formalizar a comissão como "Buyer's Premium", permitindo que seja configurável por leilão ou globalmente. | **Média** |
| **Pagamentos** | Suporte a VAT e Taxas Customizadas | **Gap Total** | Inexistente. **Ação:** Abstrair o cálculo de imposto para suportar diferentes regras e jurisdições. | **Baixa** |
| **Pagamentos** | Planos de Pagamento (Parcelamento) | **Gap Total** | Inexistente. **Ação:** Integrar com gateway de pagamento que suporte parcelamento. | **Média** |
| **Gestão de Comitentes**| Módulo completo de Consignação | **Gap Total**| O BidExpert tem o papel de "Comitente", mas carece de gestão financeira completa. **Ação:** Desenvolver um novo módulo completo para consignação. | **Alta** |
| **Logística** | Envios Divididos (Split Shipments) | **Gap Total** | Inexistente. **Ação:** Modificar o `UserWin` e o checkout para suportar múltiplos endereços. | **Baixa** |
| **Logística** | Frete LTL e Intermodal | **Gap Parcial** | Sem integrações específicas. **Ação:** Desenvolver integrações com APIs de transportadoras. | **Média** |
| **Portal do Usuário**| Sistema de Feedback (Avaliações) | **Gap Total** | Inexistente. **Ação:** Criar modelos `Feedback` ou `Review` para avaliação mútua. | **Média** |
| **Portal do Usuário**| Login Social (Facebook) | **Gap Total** | Inexistente. **Ação:** Integrar provedores OAuth (Google, Facebook). | **Média** |
| **Portal do Usuário**| Sistema de Mensagens Internas | **Gap Total** | Inexistente. **Ação:** Criar um sistema de chat/mensagens entre usuários. | **Média** |
| **Gestão de Conteúdo**| PIM (Importação/Exportação em massa) | **Gap Parcial**| O wizard existe, mas falta importação/exportação robusta. **Ação:** Desenvolver módulo de importação/exportação de CSV/XLSX. | **Alta** |
| **Segurança** | Autenticação de Dois Fatores (2FA) | **Gap Total** | Inexistente. **Ação:** Integrar solução de 2FA (TOTP/SMS). | **Alta** |
| **Segurança** | Função "Personificar Usuário" (Admin) | **Gap Total** | Inexistente. **Ação:** Implementar função de personificação para suporte. | **Média** |
| **Segurança** | Logs de Auditoria Detalhados | **Gap Parcial** | Logs básicos existem. **Ação:** Criar modelo `AuditLog` e interface de visualização. | **Média** |
| **Inteligência Artificial**| Geração de Conteúdo e Recomendações por IA | **Gap Total** | Ausente. **Ação:** Usar `genkit` para gerar descrições e sugerir lotes similares. | **Alta** |
| **Controle do Site**| Sistema de Banners de Anúncio | **Gap Total** | Inexistente. **Ação:** Criar módulo de gestão de banners no admin. | **Baixa** |
    - **2. Plano de Ação Detalhado (Próximos Passos)**
        - **Fase 1 (Fundação - Segurança, Pagamentos, Core Business):**
            - Implementar 2FA.
            - Implementar Contas de Custódia (Escrow).
            - Desenvolver Módulo de Consignação financeira.
            - Refatorar Lógica de Comissão para o backend.
        - **Fase 2 (Expansão do Core):**
            - Suporte a Leilão Reverso.
            - Sistema de Importação/Exportação (PIM).
            - Sistema de Feedback e Reputação.
        - **Fase 3 (Inteligência Artificial):**
            - Geração de descrições com Genkit.
            - Sistema de recomendação de lotes similares.
        - **Fase 4 (Melhorias de Usabilidade):**
            - Login Social e Notificações Configuráveis.
            - Logs de Auditoria e Personificação.
    - **Diretrizes de Teste Automatizado:**
        - **Cenário de Teste:** Escolher uma feature da Fase 1, como "Suporte a Leilão Reverso". O teste E2E deve simular a criação de um leilão reverso, a submissão de propostas (lances decrescentes) por fornecedores e a seleção automática do vencedor (menor preço) ao final do leilão.
        - **Implementação (`/tests`):** Criar `tests/features/reverse-auction.test.ts`. O teste configurará um leilão com `auctionMethod: 'REVERSE'`, criará usuários "fornecedores" e simulará lances.
        - **Execução (`/admin/qa`):** Adicionar um botão "Testar Leilão Reverso".

- **(A definir):** Próximas funcionalidades a serem priorizadas após a conclusão dos itens acima.
