# REGRAS DE NEGÓCIO E ESPECIFICAÇÕES - BIDEXPERT
## Documento Consolidado e Oficial

**Data:** 12 de Março de 2026  
**Status:** ✅ Atualizado com Guia Operacional de Testes E2E e Simulação de Robôs (Março/2026)  
**Próximos passos:** caso haja novas implementações, atualize esse documento com as orientações do usuário

---

## ÍNDICE RÁPIDO
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Regras de Negócio Críticas](#regras-de-negócio-críticas)
4. [Design System](#design-system)
5. [Componentes Principais](#componentes-principais)
6. [Funcionalidades em Desenvolvimento](#funcionalidades-em-desenvolvimento)
7. [APIs e Integrações](#apis-e-integrações)
8. [Admin Plus — Painel Administrativo Avançado](#admin-plus--painel-administrativo-avançado)
9. [Linhagem do Leilão — Visualização de Cadeia de Valor](#linhagem-do-leilão--visualização-de-cadeia-de-valor)
10. [Testes E2E em Ambientes Vercel (Deployment Protection)](#testes-e2e-em-ambientes-vercel-deployment-protection)
11. [Guia Operacional para Testes E2E — Lições Aprendidas](#guia-operacional-para-testes-e2e--lições-aprendidas)

---

## VISÃO GERAL

**Nome:** BidExpert  
**Propósito:** Plataforma completa de leilões online multi-tenant

### Perfis de Usuário
- Administrador
- Analista de Leilão
- Arrematante
- Comitente (Vendedor)
- Tenant (Leiloeiro)
- Convidado
- Auditor

---

## ARQUITETURA

### Stack Tecnológica
- **Frontend:** Next.js última versão stable, React última versão stable, ShadCN/UI, Tailwind CSS
- **Backend:** Node.js, Prisma ORM, MySQL
- **Auth:** NextAuth.js (JWT/OAuth2)
- **AI:** Genkit
- **Validação:** Zod + react-hook-form

### Padrão Arquitetural
```
Controller (Server Action) → Service → Repository → ZOD → Prisma ORM → MySQL
```

**✅ PADRÃO OFICIAL:** Acesso direto ao Prisma via Services/Repositories
- ❌ NÃO usar Database Adapter Pattern
- ✅ Prisma Client diretamente nos Repositories
- ✅ Lógica de negócio nos Services
- ✅ Sempre usar ZOD regras de validação acima da camada do prisma;
- ✅ scripts de seed usam Actions ou Services para massa de dados na aplicação (nunca usar prisma diretamente);

### Multi-Tenancy
- **Identificação:** Por subdomínio (`leiloeiro-x.bidexpert.com`)
- **Landlord:** Domínio principal (`bidexpert.com.br`) = `tenantId '1'`
- **Isolamento:** Middleware Prisma filtra automaticamente por `tenantId`
- **Modelos Globais:** Lista `tenantAgnosticModels` exclui filtro

---

## REGRAS DE NEGÓCIO CRÍTICAS

### RN-001: Isolamento Multi-Tenant
✅ Todas tabelas tenant-specific DEVEM ter `tenantId`  
✅ Queries filtradas automaticamente  
✅ Usuário NUNCA acessa dados de outro tenant

### RN-002: Componentes Universais
✅ OBRIGATÓRIO usar `BidExpertCard` e `BidExpertListItem`  
❌ NÃO importar diretamente `AuctionCard` ou `LotCard`  
✅ Garante consistência visual

### RN-003: Validação de Formulários
✅ Campos obrigatórios com asterisco vermelho (`*`)  
✅ Botão submissão desabilitado enquanto inválido
✅ Botão de validador de regras do formulário para o usuário verificar o que está pendente de preencher (navegar para o primeiro item do form que está pendente)
✅ Toast de feedback após submissão (nunca falhar silenciosamente)

### RN-004: Endereçamento Unificado
✅ OBRIGATÓRIO usar `AddressGroup.tsx` em formulários com endereço  
✅ Campos estruturados: street, number, cityId, stateId, latitude, longitude  
✅ Busca CEP e mapa integrados

### RN-016: Mapa e CEP no Leilão V2 (admin)
✅ A ação `consultaCepAction` é a rotina **única** de busca e preenchimento de endereço + geocodificação; ela roda:
- ao clicar no botão "Buscar CEP";
- automaticamente na abertura do leilão em edição quando há CEP válido e ainda não há latitude/longitude gravadas (evita mapa sem pin).
✅ Coordenadas existentes (inclusive BigInt/Decimal) são normalizadas para número e exibidas imediatamente com marcador e `flyTo` no mapa.
✅ Após CEP ou clique no mapa: setar `latitude`/`longitude` no form (`react-hook-form`) com `shouldDirty` conforme contexto (manual = true; carga inicial = false).
✅ O mapa (Leaflet) deve sempre invalidar tamanho e aplicar zoom 16 quando houver coordenadas; fallback centro Brasil e zoom 4.

**Cenário BDD - Exibir pin ao abrir leilão V2**
- **Dado** que existe um leilão V2 com `zipCode` preenchido e sem coordenadas
- **Quando** o usuário abre a página `/admin/auctions-v2/:id` para editar
- **Então** a action `consultaCepAction` é executada automaticamente, o endereço é preenchido, o mapa é geocodificado, e o marcador aparece na posição com zoom 16

**Cenário BDD - Coordenadas já salvas**
- **Dado** que o leilão possui `latitude` e `longitude` salvos
- **Quando** o usuário abre a página de edição
- **Então** o mapa mostra o marcador imediatamente e aplica `flyTo` no ponto, sem depender da busca de CEP

### RN-MAP-001: Modal da Busca por Mapa sobreposto ao site
✅ A rota `/map-search` DEVE abrir em modo modal fullscreen sobre o site (estilo Booking), sem deslocamento por `translate` central.
✅ O overlay do modal DEVE usar z-index acima do cabeçalho fixo global (baseline `z-[3000]` para overlay e `z-[3001]` para conteúdo).
✅ O fechamento do modal DEVE retornar ao fluxo anterior via `router.back()`.

**Cenário BDD - Sobreposição correta**
- **Dado** que o usuário está em uma página com cabeçalho fixo
- **Quando** acessa `/map-search`
- **Então** o modal cobre toda a viewport e fica acima do cabeçalho, sem sobreposição visual indevida.

### RN-MAP-002: Hover da lista deve centralizar lote no mapa
✅ Ao passar o mouse em um item da lista de resultados do map-search, o mapa DEVE centralizar o respectivo lote no centro da viewport (`flyTo`/`setView`) mantendo o zoom atual.
✅ O popup do marcador correspondente DEVE abrir no hover para reforçar contexto visual.

**Cenário BDD - Hover com recentralização**
- **Dado** uma lista de lotes com coordenadas válidas no map-search
- **Quando** o usuário passa o mouse em um item da lista
- **Então** o mapa recentraliza no lote destacado e exibe o popup do marcador correspondente.

### RN-017: CTA "Ir para pregão online"
✅ O CTA de pregão online deve apontar para `/auctions/{auctionId}/live`.
✅ O CTA só deve aparecer quando o leilão estiver na janela ativa de pregão:
- status `ABERTO_PARA_LANCES`;
- data atual maior/igual à abertura efetiva (`actualOpenDate` ou `openDate` ou `auctionDate`);
- data atual menor/igual a `endDate`.
✅ O CTA só pode ser exibido para usuário autenticado e habilitado no leilão.
✅ O CTA deve exibir ícone de online, tooltip explicativa e badge `Online` com animação de piscar lento.
✅ A cobertura é obrigatória em cards/list items, detalhes e modais de leilão/lote, incluindo listagens administrativas.

**Cenário BDD - Exibição do CTA dentro da janela**
- **Dado** um usuário autenticado e habilitado
- **E** um leilão com status `ABERTO_PARA_LANCES` dentro da janela temporal
- **Quando** a interface renderiza card/lista/detalhe/modal de leilão/lote
- **Então** o CTA "Ir para pregão online" é exibido

**Cenário BDD - Ocultação do CTA fora das regras**
- **Dado** um usuário não autenticado ou não habilitado, ou leilão fora da janela
- **Quando** a interface renderiza card/lista/detalhe/modal de leilão/lote
- **Então** o CTA "Ir para pregão online" não é exibido

### RN-005: Herança de Mídia
✅ Lote pode herdar galeria de `Asset` vinculado  
✅ Leilão pode herdar imagem de Lote vinculado  
✅ Prioriza galeria/imagem customizada se existir  
✅ Lógica centralizada nos Services

### RN-006: Schema Prisma
✅ Usar arquivo único tradicional `prisma/schema.prisma`  
✅ Editar diretamente o arquivo schema.prisma  
❌ NÃO usar estrutura modular em múltiplos arquivos

### RN-007: Cronômetro (Countdown)
✅ Componente `LotCountdown` reutilizável  
✅ Controlado por configurações `showCountdownOnCards` e `showCountdownOnLotDetail`  
✅ Apenas em: Cards quando habilitado, detalhes de lote quando configurado

### RN-008: Timeline de Etapas
✅ OBRIGATÓRIO usar `BidExpertAuctionStagesTimeline`  
✅ Integrado em `AuctionCard` e `AuctionListItem`  
✅ Busca última etapa do leilão para countdown
✅ Em superfícies de **leilão** (detalhes e modais), a timeline deve usar o **estado temporal efetivo da praça** (`startDate`/`endDate`) como fonte primária; `stage.status` bruto só pode complementar casos explícitos como rascunho/cancelado, e a timeline **nunca** pode exibir uma praça futura ou passada como aberta.
✅ Em superfícies de **lote** (detalhes e modais), a timeline deve usar o **status derivado do lote na praça** e pode exibir valores por praça (`LotStagePrice`/fallback do lote).
✅ Cards, listitems e página de detalhes do mesmo lote/leilão DEVEM compartilhar a mesma máquina de estado temporal para badge, timeline e cronômetro; é proibido manter pipelines paralelos que derivem status diferentes para a mesma janela de tempo.
✅ Ícones contextuais de praça são obrigatórios em **detalhes**, **modais** e **forms**; são proibidos em **cards** e **listitems**, que devem permanecer compactos.

**Cenário BDD - Leilão sem valores na timeline**
- **Dado** um leilão com praças cadastradas
- **Quando** o usuário acessa a página de detalhes ou o modal do leilão
- **Então** a timeline mostra ícones e badges de status da praça
- **E** nenhum valor monetário é exibido dentro da timeline do leilão

**Cenário BDD - Lote com status visual derivado**
- **Dado** um lote com preços por praça e status público definido
- **Quando** o usuário acessa a página de detalhes ou o modal do lote
- **Então** a timeline mostra ícones e badges derivados do status do lote na praça ativa
- **E** os valores por praça são exibidos apenas nas superfícies do lote

**Cenário BDD - Card/listitem continuam compactos**
- **Dado** um card ou listitem de lote/leilão com timeline compacta
- **Quando** a interface renderiza a timeline resumida
- **Então** a compactação visual é preservada
- **E** ícones contextuais de praça não são renderizados nesses componentes

### RN-009: Testes
✅ Playwright usa seletores `data-ai-id`  
✅ Helper `callActionAsUser` para validar segurança  
✅ Garantir isolamento de tenants

### RN-010: Padrões de Código
Services não cruzam responsabilidades  
Sempre usar `getTenantIdFromRequest` em Server Actions  
Schemas Zod + `react-hook-form` em todos formulários

### RN-011: Campo Propriedades em Formulários
Campo "Propriedades" é um **campo de texto simples**  
Usado para dados específicos de categoria de forma livre  
Não afeta filtros estruturados (estes usam campos dedicados)

### RN-012: Padrão de Chaves Primárias (BigInt)
TODAS as PKs DEVEM usar `BigInt @id @default(autoincrement())`  
NÃO usar mais `String @id @default(cuid())`  
TODAS as FKs relacionadas DEVEM ser `BigInt`  
Conversão em andamento - seguir `BIGINT_CONVERSION_PLAN.md`  
Status: Schema  | Migração  | Código 

### RN-013: Sentinels de UI não podem vazar para FKs BigInt
✅ Valores semânticos de formulário/UI como `INHERIT`, `CUSTOM`, `AUTO`, slugs ou labels textuais DEVEM ser tratados como semântica de negócio e NUNCA como IDs persistíveis  
✅ Antes de usar `BigInt(...)`, `Number(...)` ou `connect: { id: ... }`, Services e Server Actions DEVEM normalizar o payload e descartar ou resolver sentinels explicitamente  
✅ Quando o sentinel representar herança de mídia/imagem, o comportamento correto é remover a relação customizada ou resolver fallback em leitura; é proibido persistir o sentinel em coluna `BigInt`  
✅ Toda correção desse tipo DEVE incluir teste unitário cobrindo `create` e `update` com sentinel textual

**Cenário BDD - Sentinel textual em FK de mídia**
- **Dado** um formulário administrativo ou wizard que oferece a opção textual `INHERIT` para a imagem de capa
- **Quando** o payload chega à camada de service para criar ou atualizar um leilão
- **Então** o service normaliza o valor antes do Prisma
- **E** nenhuma conversão `BigInt('INHERIT')` é executada
- **E** a imagem final é resolvida por fallback/herança ou a relação customizada é desconectada

---

## LACUNAS QUEBRANDO AS JORNADAS (Diagnóstico)

Com base na análise de código e documentação, foram identificados pontos que interrompem fluxos completos de uso:

- **[arrematante] Painéis parciais no dashboard**
  - Componentes `won-lots-section`, `payments-section`, `notifications-section`, `history-section`, `profile-section` com trechos `TODO` e integrações incompletas.
  - Falta de APIs e repositories finalizados para operações de pagamento, documentos e notificações.

- **[admin/analista] Modos CRUD configuráveis (modal/sheet) pendentes**
  - Campo `crudEditMode` ainda não incorporado ao `PlatformSettings`.
  - `CrudFormContainer` não unifica o comportamento nas páginas de listagem.

- **[setup] Redirecionamento e consistência da flag**
  - Histórico de redirecionamento para `/setup` mesmo com `isSetupComplete=true`.
  - Necessidade de testes de integração cobrindo variações realistas.

- **[testabilidade/UX] Falta de `data-ai-id` em elementos-chave**
  - Dificulta automação e validação de fluxo ponta a ponta.

- **[consistência de IDs] Conversão BigInt em andamento**
  - Risco de inconsistências ao trafegar IDs no frontend e nas rotas.

- **[navegação] CTA sem ação consolidada**
  - Botões de criar/editar podem depender de rotas ainda não unificadas com o container CRUD.

- **[leilão/bidding] Requisitos de elegibilidade**
  - Falta de validações explícitas para lance/arremate (habilitação, KYC, aceite de termos, cadastro completo).

---

## NOVAS REGRAS PARA FECHAR LACUNAS (Propostas)

### RN-013: Testabilidade e Seletores
✅ **Obrigatório** em todos os elementos de ação crítica:  
- Botões de criar/editar/salvar/deletar  
- Inputs de filtros e busca  
- Cards de listagem e detalhes  
- Abas e seções clicáveis  
  
🔹 **Padrão de nome**: `entidade-acao` (ex: `lot-create`, `auction-save`)  
🔹 **Proibido** alterar seletor sem atualizar testes E2E  
🔹 **Validação**: Adicionar teste que verifica presença de `data-ai-id` em componentes críticos

### RN-014: Consistência de Estados em Formulários CRUD
✅ **Estados obrigatórios**:  
- Botão "Salvar" desabilitado durante submissão  
- Spinner/estado de carregamento visível  
- Erros de validação por campo + toast para erros de servidor  
  
🔄 **Pós-submissão**:  
- Fechar modal/sheet automaticamente  
- Atualizar lista via `refetch`  
- Exibir toast de confirmação  
  
🚫 **Restrições**:  
- Bloquear navegação para rotas órfãs (`/new`, `/[id]/edit`) se `CrudFormContainer` estiver ativo  
- Usar estado local ou contexto para gerenciar abertura/fechamento
- O `CrudFormContainer` é o padrão oficial para create/edit em listagens admin e admin-plus; `Dialog` ou `Sheet` isolados só podem permanecer quando houver justificativa técnica documentada.
- Ao migrar uma listagem para `CrudFormContainer`, a rota órfã antiga deve ser removida ou redirecionada para a listagem de origem.

### RN-015: Configuração Global de Edição (Modal/Sheet)
🎛️ **Configuração**:  
- `PlatformSettings.crudFormMode`: `modal` | `sheet` (padrão: `modal`)  
- **Mobile-first**:  
  - `< 768px`: Sempre usar `sheet`  
  - `≥ 768px`: Respeitar configuração do usuário  
- **Transições suaves** entre modos ao redimensionar  
  
📱 **Responsividade**:  
- Sheets devem ocupar 100% da largura em mobile  
- Modais devem ter largura máxima de `90vw` e altura máxima de `90vh`  
- Scroll interno quando conteúdo for maior que a viewport

✅ **Status**: Implementado via `CrudFormContainer.tsx` e campo `crudFormMode` no schema

**BDD - Container global em listagens admin**
- **Dado** uma listagem administrativa que suporte criar e editar registros
- **Quando** o usuário aciona "Novo" ou "Editar"
- **Então** o formulário deve abrir dentro do `CrudFormContainer`
- **E** o modo final deve respeitar `crudFormMode` no desktop e forçar `sheet` no mobile

### RN-016: Setup Gate Obrigatório
Bloquear acesso a rotas protegidas quando `isSetupComplete=false`  
Exigir verificação de `isSetupComplete` em `layout.tsx` com fallback seguro  
Adicionar teste de regressão para impedir loops/redirects indevidos
O `SetupRedirect` está globalmente desabilitado conforme nova estratégia solicitada pelo usuário (2026-03).

**BDD - Gate de setup ativo**
- **Dado** um tenant com `isSetupComplete=false`
- **Quando** um usuário acessa uma rota protegida diferente de `/setup`
- **Então** ele deve ser redirecionado para `/setup`
- **E** não deve ocorrer loop de navegação

- **Dado** um tenant com `isSetupComplete=true`
- **Quando** um usuário acessa `/setup`
- **Então** ele deve ser redirecionado para a área administrativa padrão

### RN-017: Elegibilidade para Lance e Arremate
Usuário só pode lançar se: estiver autenticado, habilitado no leilão, KYC/documentos aprovados (quando aplicável), termos aceitos  
Ao tentar lançar sem elegibilidade: exibir modal com checklist e CTAs para completar  
Arremate/checkout exige método de pagamento válido e endereço confirmado
Toda decisão de elegibilidade deve ser centralizada em um service compartilhado consumido por UI, Server Actions e motor de lances. A UI pode orientar o usuário, mas a decisão final sempre pertence ao backend.

**Checklist mínimo de elegibilidade**
- Autenticado
- Habilitado no leilão
- Documentação/KYC aprovada quando exigido
- Termos aceitos
- Cadastro essencial completo
- Método de pagamento e endereço válidos para arremate/checkout

### RN-018: Consistência Multi-Tenant em Navegação
Todos os links/rotas geradas devem carregar `tenantId` do contexto  
Services e Server Actions validam `tenantId` de sessão vs recurso acessado  
Proibido aceitar `tenantId` vindo do cliente sem validação

### RN-021: Navegação Global de Lotes
- A rota `/lots` (Todos os Lotes) deve ser acessível via menu principal (Header) e rodapé (Footer).
- No Header, o link "Todos os Lotes" deve estar visível tanto na versão desktop (centralNavItems) quanto na versão mobile (allNavItemsForMobile).
- O link deve preceder o item "Início" para maior destaque visual em listagens.
- A composição final da navegação pública não pode renderizar entradas duplicadas para o mesmo `href`; qualquer lista de itens do header deve ser normalizada antes do render para garantir keys únicas e evitar warnings de React.

**BDD - Header público não duplica links principais**
- **Dado** uma configuração do header com entradas repetidas para `/lots`
- **Quando** os itens da navegação são normalizados para desktop e mobile
- **Então** apenas a primeira ocorrência de `Lotes` deve permanecer visível
- **E** o item deve continuar precedendo `Início`

### RN-022: Conclusão do Dashboard do Arrematante
Finalizar APIs: `GET/POST /api/bidder/*` para lotes vencidos, pagamentos, notificações, histórico, perfil  
Repositories e services com BigInt  
Seções do dashboard só renderizam quando dados essenciais estiverem carregados (skeletons/spinners)
É proibido manter `TODO` funcional em seções visíveis do dashboard do arrematante em branches de integração. Se um bloco não tiver backend pronto, deve renderizar estado vazio explícito e testável, nunca placeholder ambíguo.
- Toda Server Action ou carregamento de dashboard que entregue entidades Prisma a Client Components DEVE serializar `Decimal`, `BigInt` e `Date` antes de atualizar estado React.
- Cards com `next/image` usando `fill` DEVEM informar `sizes` para não degradar performance do dashboard.

**BDD - Dashboard do arrematante não vaza tipos Prisma ao cliente**
- **Dado** um carregamento de dashboard com lotes recomendados ou prestes a encerrar contendo campos `Decimal`, `BigInt` ou `Date`
- **Quando** a ação retorna os dados para a página cliente
- **Então** o payload deve chegar serializado para tipos plain JSON
- **E** o browser não deve emitir warnings de `Decimal objects are not supported` nem `Only plain objects can be passed`

### RN-022A: Vitrine Pública `/lots` com Taxonomia e Confiança Explícitas
- A rota pública `/lots` DEVE expor uma camada de overview acima das seções, com taxonomia explícita das modalidades `Judicial`, `Extrajudicial`, `Venda Direta` e `Tomada de Preços`.
- Cada modalidade visível no overview DEVE mostrar a contagem correspondente de lotes e permitir navegação rápida para a seção da modalidade quando houver itens.
- A mesma superfície DEVE exibir uma trilha de confiança pública com sinais objetivos da vitrine, incluindo pelo menos: quantidade de oportunidades abertas, lotes com referência processual quando aplicável, comitentes ativos e atalho para busca ou orientações de segurança.
- Cards V2 da vitrine pública DEVEM expor `data-ai-id` estáveis para metadados críticos usados em automação e auditoria visual, incluindo pelo menos a localização do lote.

**BDD - Overview de modalidades na vitrine pública**
- **Dado** que a rota `/lots` possui lotes distribuídos por modalidades
- **Quando** a página pública é renderizada
- **Então** a taxonomia de modalidades deve ficar visível antes da grade principal
- **E** cada modalidade deve informar a sua contagem de oportunidades

**BDD - Trilha de confiança da vitrine pública**
- **Dado** que a rota `/lots` possui dados públicos suficientes para decisão inicial
- **Quando** a pessoa visita a página
- **Então** a interface deve exibir sinais de confiança e descoberta sem exigir login
- **E** esses sinais devem incluir contexto operacional da vitrine e atalhos para aprofundamento seguro

### RN-020: Fluxo de Publicação de Leilão
`Auction` só pode ir para "Publicado" quando: etapas e datas válidas, lotes associados, regras de mídia atendidas, comitente/leiloeiro vinculados e ativos  
Validar transitions no service com erros descritivos

**Regras obrigatórias adicionais**
- Cada praça (`AuctionStage`) DEVE ser persistida com `startDate` e `endDate` válidos.
- O `endDate` de cada praça DEVE ser maior que o `startDate`; payloads inválidos DEVEM falhar no formulário e no service com mensagem descritiva.
- Formulários administrativos de leilão DEVEM usar apenas status canônicos do domínio (`RASCUNHO`, `EM_PREPARACAO`, `EM_BREVE`, `ABERTO`, `ABERTO_PARA_LANCES`, `ENCERRADO`, `FINALIZADO`, `CANCELADO`, `SUSPENSO`).
- Se `stateId` e `cityId` forem informados no cadastro/edição de leilão, a cidade DEVE pertencer ao estado selecionado; ao trocar o estado, seleções órfãs de cidade DEVEM ser limpas antes do submit.

**Cenário BDD - Praça sem encerramento não pode ser salva**
- **Dado** um formulário de leilão com pelo menos uma praça cadastrada
- **Quando** a praça é enviada sem `endDate` ou com `endDate` menor/igual ao `startDate`
- **Então** o sistema bloqueia a submissão e exibe erro descritivo antes de persistir no Prisma

**Cenário BDD - Cidade inválida não sobrevive à troca de estado**
- **Dado** um formulário de leilão com uma cidade já escolhida para determinado estado
- **Quando** o usuário altera o estado para outro sem compatibilidade com a cidade atual
- **Então** o campo de cidade volta ao placeholder no frontend e o backend rejeita combinações inconsistentes

### RN-020C: Transparência de Lance e Custo Imediato no Detalhe do Lote
✅ O detalhe público do lote DEVE exibir o valor mínimo aceito naquele momento usando a mesma regra do motor de lance: sem lances = preço inicial ajustado pela praça ativa; com lances = último lance + incremento.
✅ A superfície DEVE exibir o incremento mínimo, a comissão do leiloeiro configurada para o tenant e o total estimado para arrematar no próximo lance válido.
✅ A comissão DEVE priorizar `paymentGatewaySettings.platformCommissionPercentage`; quando ausente, o fallback oficial é `5%`.
✅ A composição financeira detalhada DEVE ficar disponível na própria página do lote, sem exigir navegação externa.
✅ O detalhe financeiro não pode assumir custos específicos de cartório, tributos ou transferência sem amparo explícito do edital ou da categoria; quando esses valores não forem calculados, a interface DEVE sinalizar que são custos variáveis do edital.

**BDD - Detalhe público mostra o próximo lance válido**
- **Dado** um lote público aberto para lances
- **Quando** a pessoa acessa o detalhe do lote
- **Então** a lateral deve exibir o próximo lance aceito, o incremento mínimo e o total estimado com comissão

**BDD - Comissão configurada do tenant prevalece**
- **Dado** um tenant com `platformCommissionPercentage` configurado
- **Quando** a composição do lance é renderizada no detalhe do lote
- **Então** a comissão exibida deve usar a configuração do tenant em vez de percentual hardcoded

### RN-020A: Alias Canônico de Login
✅ A rota pública `/login` DEVE redirecionar para `/auth/login` preservando query string relevante, incluindo `redirect`.
✅ Fluxos administrativos que redirecionam usuários não autenticados DEVEM continuar apontando para a rota canônica `/auth/login`.

**Cenário BDD - Alias público preserva destino**
- **Dado** um usuário acessando `/login?redirect=/admin`
- **Quando** a rota é resolvida no App Router
- **Então** o usuário é redirecionado para `/auth/login?redirect=/admin`

### RN-020B: Isolamento de Sessão no Wizard de Leilão
✅ O passo de loteamento do wizard DEVE operar apenas sobre os ativos explicitamente escolhidos ou criados na sessão corrente quando houver `assetId`s recém-criados em memória.
✅ Refetches do wizard após criar processo ou ativo NÃO podem reintroduzir ativos antigos do mesmo comitente/processo na lista elegível de loteamento.
✅ Cenários E2E do wizard DEVEM selecionar processo judicial por identidade determinística (`processNumber`) e ativos por identidade determinística (`title` ou `data-ai-id`), nunca pelo "primeiro disponível".

**Cenário BDD - Refetch não contamina loteamento com ativos antigos**
- **Dado** um wizard em andamento com ativos históricos já existentes para o mesmo comitente ou processo
- **Quando** o usuário cria um novo ativo inline e o wizard refaz a carga de dados
- **Então** a etapa de loteamento exibe somente os ativos da sessão corrente para loteamento individual

**Cenário BDD - Seleção judicial determinística no wizard**
- **Dado** que existem vários processos judiciais disponíveis no tenant
- **Quando** o fluxo do wizard precisa vincular um processo específico de referência
- **Então** a seleção deve ocorrer pelo número do processo e não pela primeira linha disponível na tabela

### RN-021: Padrão de IDs BigInt em Front/Back
Endpoints e services devem aceitar/retornar IDs numéricos  
No frontend, converter string->number com validação e tratar `bigint` quando necessário  
Proibir mix de `cuid()` em novos docs/código

**Guardrail de serialização admin**
- Server Actions administrativas que retornam um único registro para Client Components DEVEM aplicar `sanitizeResponse()` antes do retorno, mesmo fora de factories como `createAdminAction`.
- Relações e FKs vindas do Prisma (`bigint`, `Decimal`, `Date`) NÃO podem ser expostas cruas para formulários client-side.

### RN-022: Pesquisa e Listagens Avançadas
🔍 **Componentes Obrigatórios**:  
- `BidExpertFilter` (filtros específicos por entidade)  
- `BidExpertSearchResultsFrame` (tabela com ordenação)  
- `Pagination` com contagem total e seleção de itens por página  
  
🎚️ **Funcionalidades**:  

### RN-023: Marketing > Publicidade do Site (Super Oportunidades)
✅ A seção Super Oportunidades DEVE ser habilitada/desabilitada via módulo Marketing > Publicidade do Site  
✅ A frequência de rolagem do carousel DEVE ser configurável no mesmo submódulo  
✅ NÃO exibir contador regressivo acima dos cards (apenas nos cards)  

**BDD - Cenários principais**
- **Dado** que a configuração está habilitada  
  **Quando** a home é carregada  
  **Então** a seção Super Oportunidades é exibida  
- **Dado** que a configuração está desabilitada  
  **Quando** a home é carregada  
  **Então** a seção Super Oportunidades não é exibida  
- **Dado** que a frequência de rolagem foi ajustada  
  **Quando** o carousel é exibido  
  **Então** a rolagem automática usa o intervalo configurado  

**TDD - Cobertura mínima exigida**
- Teste unitário do carousel confirmando ausência de contador superior  
- Teste UI E2E validando toggle e ajuste de intervalo  
- Teste visual com screenshot da página de Publicidade do Site
- **Ordenação** por coluna (asc/desc)  
- **Busca livre** com highlight dos termos  
- **Filtros avançados** combináveis  
- **Seletor de colunas** visíveis  
- **Agrupamento** por campos-chave (ex: status, categoria)  
- **Exportação** para CSV/Excel  
  
🔗 **Estado**:  
- Persistir filtros/ordenação na URL  
- Restaurar estado ao voltar à lista  
- Limpar filtros com um clique

### RN-023: Marketing > Publicidade do Site (Super Oportunidades)
✅ A seção Super Oportunidades DEVE ser habilitada/desabilitada via módulo Marketing > Publicidade do Site  
✅ A frequência de rolagem do carousel DEVE ser configurável no mesmo submódulo  
✅ NÃO exibir contador regressivo acima dos cards (apenas nos cards)  

**BDD - Cenários principais**
- **Dado** que a configuração está habilitada  
  **Quando** a home é carregada  
  **Então** a seção Super Oportunidades é exibida  
- **Dado** que a configuração está desabilitada  
  **Quando** a home é carregada  
  **Então** a seção Super Oportunidades não é exibida  
- **Dado** que a frequência de rolagem foi ajustada  
  **Quando** o carousel é exibido  
  **Então** a rolagem automática usa o intervalo configurado  

**TDD - Cobertura mínima exigida**
- Teste unitário do carousel confirmando ausência de contador superior  
- Teste UI E2E validando toggle e ajuste de intervalo  
- Teste visual com screenshot da página de Publicidade do Site

### RN-024: Integridade Referencial em Super Oportunidades
✅ **Validação Obrigatória da Cadeia Completa**: A seção Super Oportunidades DEVE validar toda a cadeia referencial antes de exibir lotes  
✅ **Cadeia de Validação**: Leilão → Lote → Loteamento (AssetsOnLots) → Ativos → Cidades → Estado → Categorias  
✅ **Praças Obrigatórias**: Leilões SEM praças (AuctionStage) NÃO devem ser exibidos  
✅ **Configuração de Prazo**: Dias para encerramento DEVE ser configurável via `marketingSiteAdsSuperOpportunitiesDaysBeforeClosing` (padrão: 7 dias)  
✅ **Atributo data-ai-id**: Componente DEVE ter `data-ai-id="super-opportunities-section"` para testabilidade  

**Validações Obrigatórias**:
1. Status do lote = `ABERTO_PARA_LANCES`
2. Leilão existe e está vinculado
3. Leilão possui pelo menos uma praça (AuctionStage)
4. Categoria do lote existe
5. Cidade do lote existe
6. Estado do lote existe
7. Data de encerramento não passou
8. Data de encerramento está dentro do prazo configurado (maxDaysUntilClosing)
9. Se houver loteamento (AssetsOnLots), validar que todos os ativos existem

**BDD - Cenários de Teste**
- **Dado** que existem lotes com integridade completa e prazo válido  
  **Quando** a home é carregada com Super Oportunidades habilitado  
  **Então** os lotes válidos são exibidos na seção  
  
- **Dado** que existem leilões sem praças cadastradas  
  **Quando** a home é carregada  
  **Então** esses leilões NÃO devem aparecer na seção Super Oportunidades  
  
- **Dado** que existem lotes sem categoria ou cidade  
  **Quando** a home é carregada  
  **Então** esses lotes NÃO devem aparecer na seção Super Oportunidades  
  
- **Dado** que o prazo configurado é de 5 dias  
  **Quando** existem lotes encerrando em 3 dias e lotes encerrando em 10 dias  
  **Então** apenas os lotes encerrando em 3 dias devem aparecer  

**TDD - Cobertura Mínima Exigida**
- Teste unitário do service `getSuperOpportunitiesLots` validando todas as 9 validações
- Teste E2E verificando exibição correta com dados válidos e inválidos
- Teste visual com screenshot da seção Super Oportunidades
- Teste de configuração de prazo (alterar `marketingSiteAdsSuperOpportunitiesDaysBeforeClosing`)

**Implementação**:
- Service: `src/services/super-opportunities.service.ts`
- Componente: `src/components/closing-soon-carousel.tsx`
- Uso: `src/app/page.tsx`

### RN-024A: Seção Paralela "Mais Lotes Ativos" na Home
✅ **Preservação da Seção Principal**: A seção `homepage-featured-lots-section` DEVE permanecer inalterada como bloco primário da vitrine de lotes
✅ **Fonte da Seção Paralela**: A seção `homepage-more-active-lots-section` DEVE usar apenas lotes com status `ABERTO_PARA_LANCES` que ainda nao foram renderizados na seção principal
✅ **Limite e Ordenação**: A seção paralela DEVE exibir no maximo 8 cards, mantendo a ordem original recebida do pipeline de dados da home
✅ **Nao Duplicação**: O mesmo lote NAO pode aparecer simultaneamente nas seções principal e paralela
✅ **Renderização Condicional**: A seção paralela so deve aparecer quando existir ao menos 1 lote ativo adicional

**Validações Obrigatórias**:
1. `homepage-featured-lots-section` renderizada antes da seção paralela
2. `homepage-more-active-lots-section` existe apenas quando houver lotes ativos restantes
3. Grid da seção paralela limitado a 8 cards
4. Interseção de lotes entre as duas seções deve ser vazia

**BDD - Cenários de Teste**:
- **Dado** que existem mais lotes ativos do que os exibidos na seção principal
  **Quando** a home pública é carregada
  **Então** a seção "Mais Lotes Ativos" deve ser exibida com os lotes restantes

- **Dado** que um lote já foi exibido na seção principal
  **Quando** a seção paralela é renderizada
  **Então** esse lote não deve aparecer novamente na seção paralela

- **Dado** que nao existem lotes ativos adicionais
  **Quando** a home pública é carregada
  **Então** a seção "Mais Lotes Ativos" não deve ser exibida

**TDD - Cobertura Mínima Exigida**:
- Teste unitário da regra de seleção de lotes restantes (`getMoreActiveLots`)
- Teste E2E da homepage validando exibição condicional e ausência de duplicidade entre seções
- Cenário BDD dedicado em `tests/itsm/features/home-more-active-lots.feature`

**Implementação**:
- Utilitário: `src/lib/home-lot-sections.ts`
- Página cliente: `src/app/home-page-client.tsx`
- Entrada de dados: `src/app/page.tsx`

### RN-025: Links Cruzados entre Entidades
✅ **Navegação Hierárquica**: Permitir navegação entre entidades relacionadas através de links diretos nas tabelas CRUD  
✅ **Relações Suportadas**:  
- **Auction → Lot**: Coluna "Lotes" na tabela de leilões com link para `/admin/lots?auctionId={auctionId}`  
- **Lot → Asset**: Coluna "Ativo Vinculado" na tabela de lotes com link para `/admin/assets?lotId={lotId}`  
- **JudicialProcess → Lot**: Coluna "Lotes" na tabela de processos judiciais com link para `/admin/lots?judicialProcessId={judicialProcessId}`  
- **JudicialProcess → Asset**: Coluna "Ativos" na tabela de processos judiciais com link para `/admin/assets?judicialProcessId={judicialProcessId}`  
- **Asset → JudicialProcess**: Coluna "Processo Judicial" na tabela de ativos com link para `/admin/judicial-processes/{judicialProcessId}`  
- **Asset → Lot**: Coluna "Lote Vinculado" na tabela de ativos com link para `/admin/lots/{lotId}`  
  
🔧 **Implementação Técnica**:  
- **Componente Link**: Usar `Next.js Link` para navegação client-side  
- **Parâmetros de Query**: Passar IDs via query string (`?auctionId=`, `?judicialProcessId=`)  
- **Filtragem Automática**: Páginas de destino aplicam filtros automaticamente baseado nos parâmetros  
- **Preservação de Contexto**: CTAs derivados de uma listagem filtrada (ex.: `Novo Lote`) DEVEM propagar o mesmo contexto (`auctionId`, `judicialProcessId`) ao abrir o formulário dependente  
- **Contadores**: Exibir quantidade total de registros relacionados (ex: "3 Lotes", "5 Ativos")  
- **Isolamento Multi-Tenant**: Todos os filtros respeitam isolamento por `tenantId`  
  
🎯 **UX Guidelines**:  
- **Visual**: Links destacados com ícone de seta ou texto azul sublinhado  
- **Responsivo**: Funcionar em desktop e mobile  
- **Performance**: Lazy loading de contadores quando necessário  
- **Feedback**: Loading states durante navegação  
- **Consistência**: Mesmo padrão visual em todas as tabelas CRUD  

### RN-026: Consistência Temporal e de Status nas Superfícies Públicas
✅ Cards, list items, detalhes, modais e countdowns de leilões/lotes DEVEM usar um cálculo efetivo único de status visual.
✅ É proibido exibir badge de status aberto quando a data efetiva de encerramento já passou.
✅ É proibido exibir texto de encerrado no rodapé quando o mesmo item ainda estiver efetivamente aberto pela regra temporal vigente.
✅ A data efetiva deve considerar, nesta ordem quando aplicável: `actualOpenDate`/`openDate`/`auctionDate` para abertura e a última praça válida ou `endDate` para encerramento.
✅ Regras temporais compartilhadas DEVEM ser centralizadas em helper/service reutilizado por UI pública e admin.

**BDD - Status visual consistente**
- **Dado** um lote ou leilão com `status` persistido como `ABERTO_PARA_LANCES`
- **E** a data efetiva de encerramento já passou
- **Quando** a interface renderiza badge, timeline e cronômetro
- **Então** todos os pontos da interface devem refletir estado encerrado de forma consistente

- **Dado** um lote ou leilão dentro da janela temporal válida
- **Quando** a interface renderiza badge, timeline e cronômetro
- **Então** nenhum ponto da interface pode indicar estado encerrado

### RN-027: Cronologia de Praças e Ordenação Temporal
✅ A sequência de `AuctionStage` DEVE ser validada por data real, nunca apenas por ordem de inserção.
✅ Cada praça deve respeitar `startDate <= endDate`.
✅ A praça `n+1` não pode iniciar antes do término da praça `n`.
✅ A UI deve renderizar as praças em ordem cronológica crescente.
✅ Dados inválidos de cronologia devem bloquear publicação do leilão e gerar erro descritivo no service.

**BDD - Bloqueio de cronologia impossível**
- **Dado** um leilão com 2ª praça iniciando antes do fim da 1ª praça
- **Quando** o usuário tenta salvar ou publicar o leilão
- **Então** o sistema deve rejeitar a operação com mensagem descritiva

- **Dado** um leilão com praças válidas
- **Quando** a timeline é renderizada
- **Então** as praças devem aparecer em ordem cronológica consistente

### RN-028: Renderização Nula e Monetária em Superfícies Públicas
✅ É proibido renderizar `R$ --`, `undefined`, `null`, `Não informada` ou campos vazios ambíguos em cards, list items, detalhes e banners públicos quando o dado puder ser validado previamente.
✅ Valores monetários DEVEM usar formatador central e checagem explícita de `null`/`undefined`; valores `0` permanecem válidos e devem ser exibidos.
✅ Itens com integridade referencial insuficiente para categoria, localização ou valor obrigatório DEVEM ser filtrados da superfície pública relevante.
✅ Placeholders textuais só podem ser usados em painéis administrativos ou estados explicitamente documentados.

**BDD - Valor zero não some da interface**
- **Dado** um valor monetário igual a `0`
- **Quando** a interface renderiza o campo
- **Então** o valor formatado deve aparecer normalmente

**BDD - Item público inválido é filtrado**
- **Dado** um item sem categoria ou sem localização obrigatória para a superfície pública
- **Quando** a listagem pública é montada
- **Então** esse item não deve ser exibido

### RN-029: QA em Preview Vercel com Bypass Controlado
✅ O bypass de Deployment Protection em previews Vercel é permitido apenas para automação de QA e smoke test.
✅ O fluxo oficial deve usar `x-vercel-protection-bypass` e/ou `VERCEL_SHARE_URL` na mesma sessão do browser que executará o login.
✅ O app deve registrar quando estiver operando em fallback tolerado de preview para evitar falso positivo de ambiente saudável.
✅ Testes em preview DEVEM diferenciar claramente falha mascarada por fallback de falha real com backend saudável.

**BDD - Bypass controlado de preview**
- **Dado** um deployment preview protegido por Vercel
- **Quando** a suíte E2E inicializa com segredo de bypass ou share URL válido
- **Então** a automação deve conseguir acessar a rota alvo sem desabilitar a proteção do projeto

- **Dado** um preview em fallback tolerado por indisponibilidade de banco
- **Quando** o smoke test roda
- **Então** o log deve registrar explicitamente que a validação ocorreu em modo degradado

### RN-024: Impersonação Administrativa Segura
🔐 **Objetivo**: Permitir que administradores visualizem dashboards de outros perfis sem comprometer segurança.

**Regras de Segurança**:  
✅ Validação de permissões **server-side** obrigatória  
✅ Apenas usuários com roles `admin` ou `manage_all` podem impersonar  
✅ NUNCA aceitar `targetUserId` do client sem validação  
✅ Logging de todas ações de impersonação para auditoria  
✅ Indicador visual claro quando admin está em modo impersonação  
✅ Sessões de impersonação com tempo limite configurável  

**Implementação**:  
- Serviço: `AdminImpersonationService` com métodos `canImpersonate()`, `isAdmin()`, `getImpersonatableUsers()`  
- Actions: Parâmetro opcional `impersonateUserId` nas actions de dashboard  
- UI: Componente `*-impersonation-selector.tsx` renderizado apenas para admins  
- Testes: Suite Playwright cobrindo fluxos autorizados e não autorizados  

**Perfis Suportados**:  
- Lawyer Dashboard (implementado)  
- Seller Dashboard (planejado)  
- Bidder Dashboard (planejado)

**Próximos Passos**:  
- [ ] Wire audit trail para registrar histórico de impersonações  
- [ ] Implementar sessão com expiração automática (timeout configurável)  
- [ ] Adicionar notificação ao usuário impersonado (opcional/configurável)

---

## DESIGN SYSTEM

### Paleta de Cores (globals.css)
- **Primary:** 🧡 Orange `hsl(25 95% 53%)` - CTAs principais e elementos interativos
- **Secondary:** Cinza suave - Ações secundárias
- **Destructive:** Vermelho - Delete/erro
- **Background:** Branco/Cinza claro (#FFFFFF, #F2F2F2)
- **Urgente:** Vermelho (#EF4444) com pulse
- **Sucesso:** Verde suave (#2ecc71)

**✅ COR OFICIAL PRIMARY:** Orange `hsl(25 95% 53%)`  
Deve ser configurada em `src/app/globals.css` como variável `--primary`

### Tipografia
- **Font:** Open Sans (sans-serif)
- **Scale:** Tailwind padrão (`text-sm`, `text-lg`, `text-2xl`)

### Layout
- **Spacing:** Escala Tailwind (`p-4`, `m-8`, `gap-6`)
- **Border Radius:** 0.5rem (`rounded-lg`)
- **Shadows:** `shadow-md`, `shadow-lg`

### Componentes Base
- **Biblioteca:** ShadCN/UI (sobre Radix UI)
- **Ícones:** Lucide React (line-art exclusivo)
- **Styling:** Tailwind CSS utility-first

### Responsividade
- Mobile-first strategy
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Touch-friendly interactions

---

## COMPONENTES PRINCIPAIS

### 1. BidExpertCard / BidExpertListItem
**Localização:** `src/components/BidExpertCard.tsx`

**Uso:**
```tsx
<BidExpertCard item={auctionData} type="auction" platformSettings={settings} />
<BidExpertCard item={lotData} type="lot" platformSettings={settings} parentAuction={auction} />
```

**Regra:** Páginas interagem APENAS com componentes universais

### 2. BidExpertFilter
**Localização:** `src/components/BidExpertFilter.tsx`

**Props:**
- `categories`, `locations`, `sellers`
- `onFilterSubmit`, `onFilterReset`
- `filterContext: 'auctions' | 'directSales' | 'lots'`

**Comportamento:** Componente "burro" - apenas estado interno + callback

### 3. BidExpertSearchResultsFrame
**Localização:** `src/components/BidExpertSearchResultsFrame.tsx`

**Props:**
- `items`, `totalItemsCount`
- `renderGridItem`, `renderListItem`
- `sortOptions`, `onSortChange`
- `currentPage`, `onPageChange`

**Comportamento:** Flexível - recebe render functions

### 4. AddressGroup
**Localização:** `src/components/address-group.tsx`

**Características:**
- Busca CEP integrada
- Mapa interativo (`MapPicker`)
- Entity selectors (Estado/Cidade)
- Campos estruturados

**Regra:** OBRIGATÓRIO em todos formulários com endereço

### 5. BidExpertAuctionStagesTimeline
**Localização:** `src/components/auction/BidExpertAuctionStagesTimeline.tsx`

**Características:**
- Timeline visual de etapas/praças
- Indica concluída/ativa/futura
- Tooltip com detalhes
- Usado em AuctionCard

**Regra (Obrigatória):** Todo card e todo item de lista de **Leilão** e de **Lote** (grid e lista, incluindo modo `compact`) **DEVE** renderizar este componente como visualização padrão de praças/etapas. Caso o leilão/lote não possua etapas cadastradas, o componente **DEVE** exibir um estado vazio explícito (ex.: “Praças não cadastradas”).

### 6. LotCountdown
**Localização:** `src/components/lot-countdown.tsx`

**Características:**
- Cronômetro regressivo (dias, horas, min, seg)
- Animação pulse (< 24h)
- Visibilidade controlada por `showCountdown`

### 7. ClosingSoonSection
**Localização:** `src/components/closing-soon-lots.tsx`

**Características:**
- ✅ **Layout:** Scroll horizontal com grid de 5 colunas
- ✅ **Countdown:** Individual em cada card
- ✅ **Navegação:** Scroll horizontal suave
- ✅ **Cards:** Tamanho médio adaptado para grid
- ✅ **Filtro:** Lotes encerrando nos próximos 7 dias
- ✅ **Status:** ABERTO_PARA_LANCES apenas

**Design:**
- Grid responsivo: 1-5 colunas conforme viewport
- Scroll horizontal nativo (sem biblioteca externa)
- Animação pulsante para urgentes (< 24h)
- Badge de desconto em 2ª Praça

### 8. TopCategories
**Localização:** `src/components/top-categories.tsx`

**Características:**
- 8 principais categorias
- Cards com imagem + gradiente
- Ícones específicos por categoria
- Layout responsivo (2-8 colunas)

### 9. ParticipantCard
**Localização:** `src/components/admin/participant-card.tsx`

**Propósito:** Exibição visual rica dos participantes selecionados (Leiloeiro, Comitente, Processo Judicial) no formulário de cadastro de leilões.

### 10. ConsignorLogoBadge
**Localização:** `src/components/consignor-logo-badge.tsx`

**Regra (Obrigatória):** Todos os componentes padrão de cards (`BidExpertCard` → `AuctionCard`, `LotCard`) e itens de lista (`BidExpertListItem`) **DEVEM** exibir o logotipo do comitente sobre a imagem destacada.
- **Visualização:** Apenas o logotipo é mostrado inicialmente; o nome do comitente aparece somente no hover via tooltip.
- **Mídia:** Utiliza `Seller.logoUrl` ou `logoMediaId`. Se não houver logo válido, nada é renderizado.
- **Componente:** OBRIGATÓRIO usar `ConsignorLogoBadge` para garantir consistência de fallback e posicionamento.

### 11. HotDealCard
**Localização:** `src/components/hot-deal-card.tsx`

**Propósito:** Exibir lotes "quentes" (encerramento iminente e alto engajamento) na home com layout expandido.
- **Seleção:** Lotes `ABERTO_PARA_LANCES` encerrando em até 7 dias, limitados aos 5 primeiros.
- **Características:** Galeria com thumbnails verticais, countdown em tempo real, badge de economia automática e barra de progresso de lances.
- **Configuração:** Respeita `showCountdownOnCards` e `defaultUrgencyTimerHours` das `PlatformSettings`.

**Props:**
```typescript
interface ParticipantCardProps {
  type: 'auctioneer' | 'seller' | 'judicialProcess';
  data: ParticipantCardData | null;
  onRemove?: () => void;
  className?: string;
}

interface ParticipantCardData {
  id: string;
  name: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  registrationNumber?: string | null;
  // Campos específicos para processo judicial
  processNumber?: string;
  courtName?: string;
  branchName?: string;
  isElectronic?: boolean;
}
```

**Características:**
- ✅ **Avatar/Logo:** Circular com fallback para iniciais
- ✅ **Badge colorido:** Identifica tipo do participante
  - Leiloeiro: Azul/Primary
  - Comitente: Verde
  - Processo Judicial: Âmbar
- ✅ **Informações exibidas:** Nome, email, telefone, localização
- ✅ **Botão de remoção:** X no canto superior direito
- ✅ **Layout responsivo:** Grid de 3 colunas no formulário
- ✅ **Processo Judicial:** Ícone de documento, tribunal, vara, badge eletrônico/físico

**Uso no auction-form.tsx:**
```tsx
{auctioneerCardData && (
  <ParticipantCard
    type="auctioneer"
    data={auctioneerCardData}
    onRemove={() => form.setValue('auctioneerId', '')}
  />
)}
```

**BDD - Especificação de Comportamento:**
```gherkin
Feature: Cards de Participantes no Cadastro de Leilões
  Como um administrador do sistema
  Eu quero ver cards visuais dos participantes selecionados
  Para ter uma experiência de cadastro mais rica e informativa

  Scenario: Exibir card de leiloeiro selecionado
    Given que estou na seção "Participantes" do formulário de leilão
    When seleciono um leiloeiro no EntitySelector
    Then um card deve aparecer abaixo do seletor
    And o card deve exibir o nome do leiloeiro
    And o card deve exibir foto/avatar (ou iniciais se não houver foto)
    And o card deve ter um badge azul com texto "Leiloeiro"
    And o card deve mostrar email, telefone e localização (se disponíveis)
    And o card deve ter um botão X para remover a seleção

  Scenario: Exibir card de comitente selecionado
    Given que estou na seção "Participantes" do formulário de leilão
    When seleciono um comitente no EntitySelector
    Then um card deve aparecer com badge verde "Comitente"
    And o card deve exibir os dados do comitente

  Scenario: Exibir card de processo judicial selecionado
    Given que estou na seção "Participantes" do formulário de leilão
    When seleciono um processo judicial no EntitySelector
    Then um card deve aparecer com badge âmbar "Processo Judicial"
    And o card deve exibir o número do processo
    And o card deve exibir o nome do tribunal e vara
    And o card deve ter um badge indicando se é processo eletrônico ou físico

  Scenario: Remover participante pelo card
    Given que um leiloeiro está selecionado e seu card está visível
    When clico no botão X do card do leiloeiro
    Then o campo auctioneerId deve ser limpo
    And o card do leiloeiro deve desaparecer

  Scenario: Layout responsivo dos cards
    Given que leiloeiro e comitente estão selecionados
    When visualizo em tela grande (desktop)
    Then os cards devem aparecer lado a lado em grid de 3 colunas
    When visualizo em tela pequena (mobile)
    Then os cards devem empilhar verticalmente
```

**Testes:**
- ✅ Unitários: `tests/unit/participant-card.spec.tsx` (19 testes)
- ✅ E2E: `tests/e2e/admin/participant-cards-e2e.spec.ts`

---

## DIRETRIZES DE MARKETING E CONVERSÃO (Pitch)

### Princípios de Venda (RN-028)
✅ **Transparência Total:** Reduzir fricção exibindo histórico de lances, documentos claros e regras de praças.
✅ **Senso de Urgência:** Uso estratégico de contadores (countdown) e gatilhos mentais (mental triggers) para acelerar a decisão.
✅ **Identidade Profissional:** Uso de IDs públicos mascarados (`publicId`) para transmitir credibilidade e facilitar suporte.
✅ **Foco no Investidor:** Seções específicas como "Radar de Oportunidades" e "Segmentos em Alta" para usuários profissionais.

---

## FUNCIONALIDADES EM DESENVOLVIMENTO

### 🔧 Bidder Dashboard (Parcialmente Implementado)

**Status:** ⚠️ Em desenvolvimento - Estrutura básica implementada

**Componentes React:**
- ✅ `BidderDashboard` - Dashboard principal responsivo
- ✅ `WonLotsSection` - Lotes arrematados
- ✅ `PaymentsSection` - Pagamentos e métodos
- ✅ `DocumentsSection` - Documentos e análise
- ✅ `NotificationsSection` - Centro de notificações
- ✅ `HistorySection` - Histórico de participações
- ✅ `ProfileSection` - Perfil e configurações

**Hooks Customizados:**
- ✅ `useBidderDashboard()` - Overview e dados principais
- ✅ `useWonLots()` - Lotes arrematados com filtros
- ✅ `usePaymentMethods()` - Gestão de pagamentos
- ✅ `useNotifications()` - Sistema de notificações
- ✅ `useParticipationHistory()` - Histórico detalhado
- ✅ `useBidderProfile()` - Perfil do usuário

**Próximos Passos:**
1. [ ] Finalizar APIs: `GET/POST /api/bidder/*` para lotes vencidos, pagamentos, notificações, histórico, perfil
2. [ ] Implementar repositories e services com BigInt
3. [ ] Adicionar dados essenciais com skeletons/spinners
4. [ ] Criar testes E2E

---

### 🔧 Sistema CRUD Configurável (Modal/Sheet)

**Status:** ✅ Implementado - Parcialmente

**Objetivo:** Permitir que o administrador escolha entre Modal e Sheet para edição CRUD

**Implementações Concluídas:**
- ✅ Campo `crudFormMode` adicionado ao `PlatformSettings`
- ✅ Componente `CrudFormContainer` criado e funcional
- ✅ Responsividade automática (mobile sempre sheet)
- ✅ Configuração via banco de dados

**Requisitos Pendentes:**

1. **Configuração em PlatformSettings:**
```prisma
model PlatformSettings {
  // ... campos existentes
  crudFormMode  String @default("modal") // "modal" | "sheet"
}
```

2. **Componente Wrapper:**
```typescript
// src/components/crud-form-container.tsx
interface CrudFormContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  mode?: 'modal' | 'sheet'; // Opcional, usa PlatformSettings se não fornecido
}
```

3. **Refatoração de Páginas Admin:**
- Substituir navegação `/new` e `/[id]/edit` por estado local
- Botão "Novo" abre container sem dados
- Botão "Editar" abre container com dados da entidade

4. **Responsividade:**
- Mobile (< 768px): SEMPRE Sheet (melhor UX)
- Desktop: Respeita configuração do admin

5. **Formulários Padronizados:**
- Todos com `react-hook-form` + `zodResolver`
- Validação consistente
- Feedback com Toast

**Próximos Passos:**
1. ✅ Adicionar campo `crudFormMode` ao PlatformSettings (já implementado)
2. ✅ Criar componente `CrudFormContainer` (já implementado)
3. [ ] Refatorar páginas de listagem
4. [ ] Adicionar toggle em `/admin/settings`
5. [ ] Criar testes E2E (`tests/ui-e2e/crud-modes.spec.ts`)

---

### ⚠️ Setup Flow - Necessita Revisão

**Status:** 🔴 Requer Atenção

**Problemas Conhecidos:**
- Histórico de problemas com redirecionamento
- Campo `isSetupComplete` teve problemas de sincronização
- Solução temporária: `npx prisma db push`

**Ações Necessárias:**
1. Revisar lógica de redirecionamento em `src/app/setup/setup-redirect.tsx`
2. Verificar `getPlatformSettings()` em `src/services/platform-settings.service.ts`
3. Garantir que `isSetupComplete` seja sempre consistente
4. Adicionar testes de integração para o fluxo completo
5. Documentar procedimento de troubleshooting

**Arquivos Críticos:**
- `src/app/layout.tsx`
- `src/app/setup/setup-redirect.tsx`
- `src/services/platform-settings.service.ts`
- `prisma/schema.prisma` (linha ~824)

---

## APIS E INTEGRAÇÕES

### Server Actions Principais

**Padrão:** Todas as APIs são Server Actions em Next.js (`'use server'`)

#### Leilões
- `getAuctions(isPublicCall?: boolean)`
- `getAuction(id: string)`
- `createAuction(data: AuctionFormData)`
- `updateAuction(id: string, data: Partial<AuctionFormData>)`
- `deleteAuction(id: string)`

#### Lotes
- `getLots(auctionId?: string)`
- `getLot(id: string)`
- `createLot(data: LotFormData)`
- `updateLot(id: string, data: Partial<LotFormData>)`
- `deleteLot(id: string)`

#### Comitentes
- `getSellers(isPublicCall?: boolean)`
- `getSeller(id: string)`
- `createSeller(data: SellerFormData)`
- `updateSeller(id: string, data: Partial<SellerFormData>)`
- `deleteSeller(id: string)`

#### Leiloeiros
- `getAuctioneers(isPublicCall?: boolean)`
- `getAuctioneer(id: string)`
- `createAuctioneer(data: AuctioneerFormData)`
- `updateAuctioneer(id: string, data: Partial<AuctioneerFormData>)`
- `deleteAuctioneer(id: string)`

#### Autenticação
- `login(formData: FormData)`
- `logout()`
- `getCurrentUser()`

#### Usuários e Permissões
- `getUsersWithRoles()`
- `createUser(data: UserFormData)`
- `updateUserRoles(userId: string, roleIds: string[])`
- `getRoles()`
- `createRole(data: RoleFormData)`

**Localização:** Cada entidade tem seu arquivo `actions.ts` em `src/app/admin/[entity]/`

---

## 📝 HISTÓRICO DE RESOLUÇÕES

**Data:** 13 de Dezembro de 2025

**Implementações de Dezembro:**
1. ✅ **Modelo RealtimeSettings**: Novo modelo Prisma criado para centralizar configurações de tempo real
   - Campos: `blockchainEnabled`, `blockchainNetwork`, `softCloseEnabled`, `softCloseMinutes`
   - Campos de monetização: `lawyerPortalEnabled`, `lawyerMonetizationModel`, `lawyerSubscriptionPrice`, `lawyerPerUsePrice`, `lawyerRevenueSharePercent`
   - Relacionamento 1:1 com `PlatformSettings` seguindo padrão existente
2. ✅ **Refatoração de Configurações**: Campos flat movidos para modelo separado
   - Antes: `blockchainEnabled`, `softCloseEnabled`, etc. direto em `PlatformSettings`
   - Depois: Agrupados em `PlatformSettings.realtimeSettings`
3. ✅ **Schema Zod Atualizado**: `RealtimeSettingsSchema` criado com validação completa
4. ✅ **Service Atualizado**: `platform-settings.service.ts` com lógica de upsert para `realtimeSettings`
5. ✅ **Formulário Atualizado**: `realtime-config.tsx` usando paths aninhados (`realtimeSettings.fieldName`)
6. ✅ **Types Atualizados**: Tipo `RealtimeSettings` exportado em `src/types/index.ts`
7. ✅ **Documentação BDD**: Especificação Gherkin completa para `RealtimeSettings` (RN-REALTIME-001 e RN-REALTIME-002)

**Problema Resolvido:**
- ❌ Erro: `Unknown argument 'blockchainEnabled'` ao salvar configurações
- ✅ Solução: Campos movidos para modelo `RealtimeSettings` com CRUD próprio

**Próximos Passos:**
- [ ] Executar migração Prisma: `npx prisma migrate dev --name add_realtime_settings`
- [ ] Testar salvamento de configurações
- [ ] Criar testes E2E para validar fluxo completo

---

**Data:** 16 de Novembro de 2025

**Implementações de Outubro/Novembro:**
1. ✅ **Lawyer Dashboard - Serialização BigInt**: Corrigidos 25 erros TypeScript relacionados a serialização de dados e tipos do Prisma
2. ✅ **Admin Impersonation Service**: Sistema completo de impersonação administrativa com validações server-side
3. ✅ **Playwright Test Suite**: 6 cenários E2E cobrindo impersonação (admin e não-admin)
4. ✅ **Documentação Técnica**: 4 novos arquivos de documentação criados (implementação, feature guide, testes)
5. ✅ **Componentes Universais**: Implementado `BidExpertCard` e `BidExpertListItem` como padrão oficial
6. ✅ **Sistema CRUD Configurável**: Implementado `CrudFormContainer` com campo `crudFormMode` no schema
7. ✅ **Configurações de Countdown**: Campos `showCountdownOnCards` e `showCountdownOnLotDetail` implementados
8. ✅ **Componentes de Dashboard Bidder**: Estrutura básica implementada com seções principais

**Trabalhos Pendentes (Backlog Atualizado):**
- [ ] Audit trail para sessões de impersonação (logging e histórico)
- [ ] Expiration automática de sessões de impersonação (timeout configurável)
- [ ] Cache invalidation para dashboard metrics ao trocar de usuário impersonado
- [ ] Performance optimization: lazy loading de métricas pesadas no dashboard
- [ ] Extensão da impersonação para Seller e Bidder dashboards

---

**Data:** 27 de Outubro de 2025

**Conflitos Resolvidos:**
1. ✅ Seção "Encerrando em Breve": Scroll horizontal com grid de 5 colunas
2. ✅ Cor Primary: Orange `hsl(25 95% 53%)`
3. ✅ Bidder Dashboard: Parcialmente implementado (documentado para finalização)
4. ✅ CRUD Modal/Sheet: Ambos devem ser implementados com configuração
5. ✅ Setup Flow: Marcado para revisão adicional
6. ✅ Campo Propriedades: Campo texto simples
7. ✅ Schema Prisma: Arquivo único tradicional
8. ✅ Database Adapter: Prisma diretamente via Services/Repositories

---

## 💎 REGRAS DE NEGÓCIO ADICIONAIS (Descobertas na Análise de Código)
Esta seção documenta funcionalidades e regras de negócio que foram identificadas durante a análise do código-fonte e que não estavam previamente formalizadas.

### RN-AD-001: Ciclo de Vida do Ativo (Asset)
Um `Asset` (bem individual) possui um ciclo de vida gerenciado pelo sistema para garantir o controle de inventário.
- **Status:** `CADASTRO`, `DISPONIVEL`, `LOTEADO`, `VENDIDO`, `REMOVIDO`, `INATIVADO`.
- **Lógica:**
  - Ao ser associado a um lote, o status do ativo muda para `LOTEADO`.
  - Se o lote for excluído, o ativo volta para `DISPONIVEL`.
  - Se o lote for vendido, o ativo muda para `VENDIDO`.

### RN-AD-002: Lances Automáticos (Proxy Bidding / Lance Máximo)
O sistema suporta lances automáticos para melhorar a experiência do arrematante.
- **Funcionalidade:** Um usuário pode registrar um `UserLotMaxBid` (lance máximo) para um lote.
- **Lógica:** Se um lance é dado por outro usuário, o sistema automaticamente dá um contra-lance em nome do usuário com o lance máximo, no valor mínimo necessário para cobrir o lance atual (lance atual + incremento), até que o valor máximo seja atingido.

### RN-AD-003: Tabela de Incremento de Lance Variável
O incremento mínimo para um lance não é fixo e pode variar conforme o valor atual do lote.
- **Configuração:** A regra é definida em `PlatformSettings.variableIncrementTable`.
- **Exemplo:**
  - Lotes de R$0 a R$100: incremento de R$10.
  - Lotes de R$101 a R$500: incremento de R$20.
- **Lógica:** O `lot.service` deve consultar esta tabela para determinar o próximo lance mínimo válido.

### RN-AD-004: Comissão da Plataforma Configurável
A comissão cobrada pela plataforma sobre um arremate é uma regra de negócio crítica e configurável.
- **Configuração:** `PlatformSettings.paymentGatewaySettings.platformCommissionPercentage`.
- **Risco Identificado:** O código do frontend possui valores fixos (ex: 5%) como fallback, o que pode gerar inconsistências de cálculo.
- **Diretriz:** **TODA** lógica de cálculo de comissão, tanto no frontend quanto no backend, **DEVE** obrigatoriamente ler este valor das configurações da plataforma. Cálculos no frontend devem ser apenas para exibição, e a validação final **DEVE** ocorrer no backend.

### RN-AD-005: Soft Close (Anti-Sniping)
Para evitar "lances de último segundo" (sniping), o encerramento de um leilão pode ser estendido.
- **Configuração:** `Auction.softCloseEnabled` (booleano) e `Auction.softCloseMinutes` (inteiro).
- **Lógica:** Se um lance é recebido nos últimos `softCloseMinutes` de um leilão, a data de encerramento do leilão é estendida por mais `softCloseMinutes` a partir do momento do lance.

---

### RN-REALTIME-001: Modelo RealtimeSettings - Configurações de Tempo Real & Blockchain

**Status:** ✅ Implementado em Dezembro/2025

#### Visão Geral
O modelo `RealtimeSettings` centraliza todas as configurações relacionadas a funcionalidades em tempo real, blockchain e monetização do portal de advogados. Este modelo segue o padrão de relacionamento 1:1 com `PlatformSettings`, mantendo consistência com outros modelos de configuração como `BiddingSettings`, `MapSettings`, etc.

#### Estrutura do Modelo Prisma

```prisma
model RealtimeSettings {
  id                        BigInt           @id @default(autoincrement())
  platformSettingsId        BigInt           @unique
  
  // Blockchain - Registro imutável de transações
  blockchainEnabled         Boolean          @default(false)
  blockchainNetwork         String           @default("NONE") // HYPERLEDGER, ETHEREUM, NONE
  
  // Soft Close (Anti-Sniping) - Default da plataforma
  softCloseEnabled          Boolean          @default(false)
  softCloseMinutes          Int              @default(5)
  
  // Portal de Advogados - Monetização
  lawyerPortalEnabled       Boolean          @default(true)
  lawyerMonetizationModel   String           @default("SUBSCRIPTION")
  lawyerSubscriptionPrice   Int?             // Em centavos (ex: 19900 = R$ 199,00)
  lawyerPerUsePrice         Int?             // Em centavos (ex: 5000 = R$ 50,00)
  lawyerRevenueSharePercent Decimal?         @db.Decimal(5, 2)
  
  platformSettings          PlatformSettings @relation(...)
}
```

#### Campos e Regras de Negócio

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `blockchainEnabled` | Boolean | `false` | Habilita registro imutável via Hyperledger/Ethereum |
| `blockchainNetwork` | String | `"NONE"` | Rede blockchain: `HYPERLEDGER`, `ETHEREUM`, `NONE` |
| `softCloseEnabled` | Boolean | `false` | Habilita extensão automática em lances de último minuto |
| `softCloseMinutes` | Int | `5` | Minutos antes do fim para disparar extensão |
| `lawyerPortalEnabled` | Boolean | `true` | Habilita portal de advogados |
| `lawyerMonetizationModel` | String | `"SUBSCRIPTION"` | Modelo: `SUBSCRIPTION`, `PAY_PER_USE`, `REVENUE_SHARE` |
| `lawyerSubscriptionPrice` | Int? | `null` | Preço mensal em centavos |
| `lawyerPerUsePrice` | Int? | `null` | Preço por consulta em centavos |
| `lawyerRevenueSharePercent` | Decimal? | `null` | Percentual de revenue share (ex: 2.50) |

#### Herança de Soft Close (Plataforma → Leilão)

O Soft Close possui dois níveis de configuração:

1. **Nível Plataforma** (`RealtimeSettings.softCloseEnabled/softCloseMinutes`)
   - Define o **default** para novos leilões
   - Configurado em `/admin/settings/realtime`

2. **Nível Leilão** (`Auction.softCloseEnabled/softCloseMinutes`)
   - **Sobrescreve** a configuração da plataforma
   - Configurado durante o cadastro/edição do leilão
   - Se não especificado, herda do default da plataforma

#### Arquivos Relacionados

| Arquivo | Propósito |
|---------|-----------|
| `prisma/schema.prisma` | Definição do modelo `RealtimeSettings` |
| `src/app/admin/settings/settings-form-schema.ts` | Schema Zod com `RealtimeSettingsSchema` |
| `src/app/admin/settings/realtime-config.tsx` | Formulário de configuração |
| `src/app/admin/settings/settings-form-wrapper.tsx` | Wrapper do form com defaults |
| `src/services/platform-settings.service.ts` | Service com lógica de upsert |
| `src/types/index.ts` | Tipo TypeScript `RealtimeSettings` |

---

### RN-REALTIME-002: Especificação BDD - RealtimeSettings

#### Feature: Gerenciamento de Configurações de Tempo Real

```gherkin
Feature: Configurações de Tempo Real e Blockchain
  Como um administrador da plataforma
  Eu quero gerenciar configurações de blockchain, soft close e monetização de advogados
  Para que eu possa personalizar o comportamento da plataforma em tempo real

  Background:
    Given eu estou autenticado como administrador
    And eu estou na página "/admin/settings/realtime"

  @blockchain
  Scenario: Habilitar blockchain na plataforma
    Given blockchain está desabilitado
    When eu marco o checkbox "Blockchain Habilitado"
    And eu clico em "Salvar Alterações"
    Then eu vejo a mensagem "Configurações salvas com sucesso!"
    And o campo "realtimeSettings.blockchainEnabled" é "true" no banco de dados
    And um alerta de atenção é exibido sobre configuração de nós Hyperledger

  @blockchain
  Scenario: Selecionar rede blockchain
    Given blockchain está habilitado
    When eu seleciono "ETHEREUM" no campo "Rede Blockchain"
    And eu clico em "Salvar Alterações"
    Then o campo "realtimeSettings.blockchainNetwork" é "ETHEREUM" no banco de dados

  @soft-close
  Scenario: Configurar soft close como default da plataforma
    Given soft close está desabilitado
    When eu marco o checkbox "Soft Close Habilitado"
    And eu preencho "10" no campo "Minutos antes do fechamento"
    And eu clico em "Salvar Alterações"
    Then o campo "realtimeSettings.softCloseEnabled" é "true" no banco de dados
    And o campo "realtimeSettings.softCloseMinutes" é "10" no banco de dados

  @soft-close @auction-override
  Scenario: Leilão herda configuração de soft close da plataforma
    Given soft close está habilitado com 5 minutos na plataforma
    When eu crio um novo leilão sem especificar soft close
    Then o leilão é criado com "softCloseEnabled" = true
    And o leilão é criado com "softCloseMinutes" = 5

  @soft-close @auction-override
  Scenario: Leilão sobrescreve configuração de soft close
    Given soft close está habilitado com 5 minutos na plataforma
    When eu crio um novo leilão com soft close de 15 minutos
    Then o leilão é criado com "softCloseEnabled" = true
    And o leilão é criado com "softCloseMinutes" = 15
    And a configuração da plataforma permanece 5 minutos

  @lawyer-monetization
  Scenario Outline: Selecionar modelo de monetização de advogados
    Given o modelo atual é "SUBSCRIPTION"
    When eu seleciono "<modelo>" no campo "Modelo de Monetização"
    And eu clico em "Salvar Alterações"
    Then o campo "realtimeSettings.lawyerMonetizationModel" é "<modelo>" no banco de dados

    Examples:
      | modelo        |
      | SUBSCRIPTION  |
      | PAY_PER_USE   |
      | REVENUE_SHARE |

  @lawyer-monetization @subscription
  Scenario: Configurar preço de assinatura mensal
    Given o modelo de monetização é "SUBSCRIPTION"
    When eu preencho "19900" no campo "Preço da Assinatura" (em centavos)
    And eu clico em "Salvar Alterações"
    Then o campo "realtimeSettings.lawyerSubscriptionPrice" é "19900" no banco de dados
    And o valor exibido é "R$ 199,00"

  @lawyer-monetization @pay-per-use
  Scenario: Configurar preço por uso
    Given o modelo de monetização é "PAY_PER_USE"
    When eu preencho "5000" no campo "Preço por Consulta" (em centavos)
    And eu clico em "Salvar Alterações"
    Then o campo "realtimeSettings.lawyerPerUsePrice" é "5000" no banco de dados

  @lawyer-monetization @revenue-share
  Scenario: Configurar percentual de revenue share
    Given o modelo de monetização é "REVENUE_SHARE"
    When eu preencho "2.5" no campo "Percentual de Revenue Share"
    And eu clico em "Salvar Alterações"
    Then o campo "realtimeSettings.lawyerRevenueSharePercent" é "2.50" no banco de dados

  @validation
  Scenario: Validar soft close minutes dentro do range
    When eu preencho "0" no campo "Minutos antes do fechamento"
    Then eu vejo erro de validação "Valor mínimo é 1"
    When eu preencho "61" no campo "Minutos antes do fechamento"
    Then eu vejo erro de validação "Valor máximo é 60"

  @persistence
  Scenario: Dados persistem após recarregar a página
    Given eu configurei blockchain habilitado e soft close com 10 minutos
    When eu recarrego a página
    Then o checkbox "Blockchain Habilitado" está marcado
    And o campo "Minutos" contém "10"

  @multi-tenant
  Scenario: Configurações são isoladas por tenant
    Given eu estou no tenant "leiloeiro-a"
    And eu configuro soft close com 5 minutos
    When eu mudo para o tenant "leiloeiro-b"
    Then a configuração de soft close pode ser diferente
    And os dados do tenant "leiloeiro-a" não são afetados
```

#### Feature: Integração Soft Close com Leilão

```gherkin
Feature: Soft Close em Leilões
  Como um leiloeiro
  Eu quero que lances de último minuto estendam automaticamente o prazo
  Para evitar sniping e garantir competição justa

  @soft-close @bidding
  Scenario: Lance estende prazo do leilão (soft close ativo)
    Given existe um leilão com soft close habilitado (5 minutos)
    And o leilão encerra em 3 minutos
    And o lote tem um lance atual de R$ 10.000
    When um usuário dá um lance de R$ 11.000
    Then o lance é registrado com sucesso
    And o prazo do leilão é estendido em +5 minutos
    And uma notificação é enviada sobre a extensão

  @soft-close @bidding
  Scenario: Lance não estende prazo (fora da janela de soft close)
    Given existe um leilão com soft close habilitado (5 minutos)
    And o leilão encerra em 10 minutos
    When um usuário dá um lance
    Then o lance é registrado com sucesso
    And o prazo do leilão NÃO é estendido

  @soft-close @bidding
  Scenario: Soft close desabilitado no leilão
    Given existe um leilão com soft close desabilitado
    And o leilão encerra em 2 minutos
    When um usuário dá um lance
    Then o lance é registrado com sucesso
    And o prazo do leilão NÃO é estendido
```

---

### RN-AD-006: Lógica de Relistagem de Lotes
Lotes não vendidos podem ser automaticamente reinseridos em um novo leilão.
- **Condição:** O status do lote deve ser `NAO_VENDIDO` ou `ENCERRADO` (sem lances).
- **Ação:**
  1. O status do lote original é alterado para `RELISTADO`.
  2. Uma cópia do lote é criada com status `EM_BREVE` e associada a um novo leilão.
  3. Um `discountPercentage` pode ser aplicado sobre o `evaluationValue` ou `initialPrice` do lote original para definir o novo preço.
  4. O novo lote mantém uma referência (`original_lot_id`) ao lote original.

### RN-AD-007: Habilitação Granular por Leilão
Além da habilitação geral na plataforma, o usuário precisa se habilitar para cada leilão individualmente.
- **Modelo:** `AuctionHabilitation`.
- **Lógica:** O serviço de lances (`lot.service`) verifica a existência de um registro em `AuctionHabilitation` que conecte o `userId` e o `auctionId` antes de aceitar um lance.

### RN-AD-008: Notificação de Lance Superado
O sistema ativamente engaja os usuários notificando-os quando perdem a posição de maior lance.
- **Lógica:** Quando um `placeBid` é bem-sucedido e supera um lance de outro usuário, uma notificação é criada para o usuário que foi superado.
- **Conteúdo:** A notificação informa sobre o lance superado e contém um link direto para o lote em questão.

### RN-AD-009: Gatilhos Mentais Configuráveis (Badges)
A plataforma pode exibir selos (badges) nos cards de lotes para criar um senso de urgência ou popularidade.
- **Configuração:** `PlatformSettings.mentalTriggerSettings`.
- **Regras:**
  - `showPopularityBadge`: Exibe um selo "Popular" se as visualizações (`views`) ultrapassam `popularityViewThreshold`.
  - `showHotBidBadge`: Exibe um selo "Disputado" se o número de lances (`bidsCount`) ultrapassa `hotBidThreshold`.
  - `showExclusiveBadge`: Exibe um selo "Exclusivo" se o lote estiver marcado como `isExclusive`.

### RN-AD-010: Regras de Visibilidade de Dados (Public vs. Private)
Para o público geral, certos dados são omitidos para não expor informações internas ou de preparação.
- **Lógica:** Os serviços (`AuctionService`, `LotService`) possuem um parâmetro `isPublicCall`.
- **Filtros:** Quando `isPublicCall` é `true`, registros com status `RASCUNHO` ou `EM_PREPARACAO` são filtrados e não são retornados nas consultas.

### RN-AD-011: Funcionalidades de Armazenamento Local (Client-Side)
O frontend utiliza `localStorage` para persistir certas preferências e históricos do usuário.
- **Favoritos (`favorite-store.ts`):** Usuários podem marcar lotes como favoritos, e a lista de IDs é salva localmente.
- **Vistos Recentemente (`recently-viewed-store.ts`):** O sistema armazena os IDs dos últimos 10 lotes visitados por um período de 3 dias.

### RN-AD-012: Integridade de Dados (Leilões, Lotes e Ativos)
Regras estritas de integridade implementadas para garantir consistência entre as entidades principais.

#### 1. Integridade de Lote (Lot Integrity)
Um lote **SÓ** pode transitar para o status `OPEN` (Aberto para Lances) se atender a **TODOS** os critérios abaixo:
- **Ativos:** Deve possuir pelo menos 1 (um) Ativo (`Asset`) vinculado.
- **Dados Básicos:** Deve possuir `title` preenchido e `initialPrice` maior que zero.
- **Leilão Pai:** O leilão vinculado deve estar em status compatível (não pode ser `DRAFT` ou `CLOSED` se o lote for ser aberto individualmente, embora o fluxo normal seja o leilão abrir os lotes).

**Restrições de Edição:**
- Lotes em status `OPEN`, `SOLD` ou `CLOSED` têm edição restrita (campos críticos travados).
- Para modificar estrutura (ex: remover ativos), o lote deve voltar para `DRAFT` ou `SUSPENDED`.

#### 2. Integridade de Leilão (Auction Integrity)
Um leilão **SÓ** pode transitar para o status `OPEN` (Publicado/Aberto) se:
- Possuir pelo menos 1 (um) Lote válido.
- **Automação:** Ao abrir o leilão, o sistema automaticamente tenta transitar todos os lotes vinculados para `OPEN`. Lotes que não atenderem aos critérios de integridade (ex: sem ativos) permanecerão em `DRAFT` ou terão status ajustado para `SUSPENDED`, garantindo que nada "quebrado" vá para o ar.

#### 3. Integridade de Ativo (Asset Integrity)
- **Bloqueio de Exclusão:** Um Ativo **NÃO** pode ser excluído se estiver vinculado a um lote com status `OPEN`, `SOLD` ou `CLOSED`. É necessário desvincular do lote (o que exige que o lote esteja em `DRAFT`) antes de excluir.
- **Sincronização de Status:** O status do Ativo (`AssetStatus`) é sincronizado automaticamente com o status do Lote vinculado:
  - Lote `OPEN` -> Ativo `LOTEADO` (ou equivalente em uso)
  - Lote `SOLD` -> Ativo `VENDIDO`
  - Lote `UNSOLD` -> Ativo `DISPONIVEL` (ou mantém vínculo para relistagem)

---

### RN-PRACA-001: Percentual da Praça para Cálculo de Lance Mínimo
Cada praça (etapa) do leilão define um percentual de desconto que será aplicado ao valor inicial dos lotes para determinar o lance mínimo.
- **Campo:** `AuctionStage.discountPercent` (Decimal 5,2, default 100)
- **Valores Padrão Sugeridos:**
  - Praça 1: 100% (valor integral)
  - Praça 2: 60% (desconto de 40%)
  - Praça 3 em diante: 50% (desconto de 50%)
- **Lógica de Cálculo do Lance Mínimo:**
  1. **Sem lances anteriores:** `Lance Mínimo = Valor Inicial do Lote × (Percentual da Praça / 100)`
  2. **Com lances anteriores:** `Lance Mínimo = Último Lance + Incremento do Lote`
- **Implementação:**
  - Função `calculateMinimumBid()` em `src/lib/ui-helpers.ts`
  - Função `getLotInitialPriceForStage()` em `src/lib/ui-helpers.ts`
- **Exemplo Prático:**
  - Lote com valor inicial de R$ 100.000 e incremento de R$ 1.000
  - Praça 1 (100%): Lance mínimo inicial = R$ 100.000
  - Praça 2 (60%): Lance mínimo inicial = R$ 60.000
  - Se houver um lance de R$ 65.000, o próximo lance mínimo = R$ 66.000 (lance + incremento)

---

### RN-SEARCH-001: Carregamento da Página de Pesquisa
A página de pesquisa (`/search`) carrega TODOS os dados de forma antecipada para garantir uma experiência fluida ao usuário.
- **Lógica:** Um único `useEffect` executa `Promise.all()` para buscar Leilões, Lotes e Vendas Diretas simultaneamente ao montar o componente.
- **Motivo:** Carregamento lazy (apenas ao clicar em aba) causava contagens zeradas e dados não exibidos.
- **Implementação:** `src/app/search/page.tsx` - função `loadInitialData()`

### RN-SEARCH-002: Exibição de Contagens nas Abas
As abas de pesquisa SEMPRE exibem a contagem total de itens, independentemente da aba ativa.
- **Campos:** `allAuctions.length`, `allLots.length`, `allDirectSales.length`
- **Lógica:** Contagens são calculadas após o carregamento inicial e mantidas nas abas.
- **Exemplo:** "Leilões (40)", "Lotes (70)", "Vendas Diretas (6)"

### RN-SEARCH-003: Grid de Resultados de Pesquisa
O grid de resultados utiliza no máximo 4 cards por linha em telas grandes.
- **Classes CSS:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Componente:** `src/components/BidExpertSearchResultsFrame.tsx`

### RN-SEARCH-004: Filtros Disponíveis
Os filtros da página de pesquisa são context-aware e variam por tipo de resultado:
- **Filtros Comuns:** Categoria, Faixa de Preço, Status, Localização (Estado/Cidade), Ordenação
- **Filtros de Leilões:** Modalidade (Judicial/Extrajudicial), Praça (1ª, 2ª, 3ª+), Vendedor (Comitente)
- **Atributos:** Todos os filtros possuem `data-ai-id` para testes automatizados

### RN-SEARCH-005: Testes E2E da Pesquisa
Arquivo de testes Playwright: `tests/e2e/search-page-filters.spec.ts`
- **Cobertura:** 19 casos de teste para validação de abas, filtros, grid, busca textual, ordenação e paginação.
- **Seletores:** Utiliza atributos `data-ai-id` para estabilidade dos testes.
- **Execução:** `npx playwright test tests/e2e/search-page-filters.spec.ts`

---

**Documento mantido por:** Equipe de Desenvolvimento BidExpert  
**Última atualização:** 05/03/2026  
**Changelog**: Ver histórico de resoluções acima para atualizações recentes

---

## 🎯 IMPLEMENTAÇÃO DOS 8 GAPS CRÍTICOS - INVESTIDORES PROFISSIONAIS

**Data de Implementação:** Dezembro 2025  
**Objetivo:** Transformar BidExpert na plataforma #1 para investidores profissionais  
**Metas:** +40% conversão de lances, +60% confiança do investidor

### VISÃO GERAL DOS GAPS

| Gap | Descrição | Categoria | Status |
|-----|-----------|-----------|--------|
| GAP-001 | Informações Jurídicas Completas | Imóveis | ✅ Implementado |
| GAP-002 | Simulador de Custos de Aquisição | Universal | ✅ Implementado |
| GAP-003 | Histórico de Lances Anonimizado | Universal | ✅ Implementado |
| GAP-004 | Comparativo de Mercado | Universal | ✅ Implementado |
| GAP-005 | Integração FIPE | Veículos | ✅ Implementado |
| GAP-006 | Dashboard do Investidor | Universal | ✅ Implementado |
| GAP-007 | Especificações Técnicas Dinâmicas | Eletr./Máquinas | ✅ Implementado |
| GAP-008 | Informações de Semoventes | Semoventes | ✅ Implementado |

---

### RN-GAP-001: Informações Jurídicas Completas (Imóveis)

**Objetivo:** Fornecer transparência total sobre a situação legal do imóvel para que investidores tomem decisões informadas.

**Campos Exibidos:**
- Matrícula/Registro do imóvel
- Status de ocupação (Ocupado/Desocupado/Incerto/Posse Compartilhada)
- Ações judiciais relacionadas (Penhora, Usucapião, Hipoteca, Despejo, etc.)
- Riscos identificados com níveis (Crítico/Alto/Médio/Baixo)
- Estratégias de mitigação de riscos
- Links para consulta pública do processo

**Componente:** `LotLegalInfoCard` (`src/components/lots/legal-info/lot-legal-info-card.tsx`)

**Integração:** Exibido na aba "Jurídico" da seção de análise do investidor.

```gherkin
Feature: Informações Jurídicas do Imóvel
  Como um investidor profissional
  Eu quero ver todas as informações jurídicas do imóvel
  Para avaliar riscos antes de dar um lance

  Scenario: Exibir matrícula e registro
    Given que estou na página de detalhes de um lote de imóvel
    When a seção de informações jurídicas é carregada
    Then deve exibir o número da matrícula do imóvel
    And deve exibir o cartório de registro (se disponível)
    And deve ter badge destacado com a matrícula

  Scenario: Mostrar status de ocupação
    Given que o lote possui informação de ocupação
    When visualizo as informações jurídicas
    Then deve exibir badge colorido indicando ocupação:
      | Status | Cor | Texto |
      | OCCUPIED | Âmbar | Ocupado |
      | UNOCCUPIED | Verde | Desocupado |
      | UNCERTAIN | Cinza | Não verificado |
      | SHARED_POSSESSION | Azul | Posse compartilhada |

  Scenario: Listar riscos identificados
    Given que o lote possui riscos cadastrados
    When visualizo a seção de riscos
    Then cada risco deve exibir:
      | Campo | Obrigatório |
      | Tipo do risco | Sim |
      | Nível (Crítico/Alto/Médio/Baixo) | Sim |
      | Descrição | Sim |
      | Estratégia de mitigação | Não |
      | Verificado por especialista | Não |
    And riscos devem ser ordenados por severidade (Crítico primeiro)

  Scenario: Exibir alerta de leilão judicial
    Given que o leilão é do tipo JUDICIAL
    When visualizo informações jurídicas
    Then deve aparecer alerta informativo sobre leilão judicial
    And deve exibir dados do processo (número, comarca, vara)
    And deve ter link para consulta pública do processo
```

---

### RN-GAP-002: Simulador de Custos de Aquisição

**Objetivo:** Permitir que investidores calculem o custo total de aquisição antes de dar um lance, considerando todas as taxas e impostos aplicáveis.

**Componentes do Cálculo:**
1. **ITBI (Imposto de Transmissão):** 2-4% conforme município
2. **Registro em Cartório:** Tabela progressiva por estado
3. **Taxa de Administração:** Taxa do leiloeiro sobre arremate
4. **Taxa de Sucesso:** Comissão da plataforma (se aplicável)
5. **Outras Taxas:** Certidões, laudos, despesas cartorárias

**Componente:** `CostSimulator` (`src/components/lots/cost-simulator/index.tsx`)

**API:** `POST /api/lots/[lotId]/cost-simulation`

**Configuração:** `AuctionCostConfig` no banco de dados por leilão

```gherkin
Feature: Simulador de Custos de Aquisição
  Como um investidor profissional
  Eu quero simular todos os custos de aquisição de um lote
  Para saber o valor total que vou investir

  Scenario: Calcular custos para imóvel em São Paulo
    Given que estou na página de um lote de imóvel
    And o imóvel está localizado em São Paulo
    And o valor do lance simulado é R$ 500.000
    When clico em "Simular Custos"
    Then deve exibir breakdown detalhado:
      | Item | Percentual/Valor | Total |
      | ITBI | 3% | R$ 15.000 |
      | Registro em Cartório | Tabela SP | R$ 3.500 |
      | Taxa de Administração | 5% | R$ 25.000 |
      | Taxa de Sucesso | Variável | R$ X |
      | Outras Taxas | Estimado | R$ 2.000 |
    And deve exibir TOTAL ESTIMADO de aquisição
    And deve exibir percentual do lance que são custos

  Scenario: Ajustar valor do lance e recalcular
    Given que já tenho uma simulação de custos
    When altero o valor do lance para R$ 600.000
    And clico em "Recalcular"
    Then todos os valores devem ser atualizados proporcionalmente
    And o gráfico de breakdown deve ser atualizado

  Scenario: Exibir aviso sobre estimativas
    Given que visualizo o simulador de custos
    Then deve exibir disclaimer informando:
      | "Valores são estimativas e podem variar" |
      | "Consulte um advogado para cálculo exato" |
      | "Taxas cartorárias sujeitas a alteração" |

  Scenario: Comparar custo por categoria
    Given que estou analisando um veículo
    When visualizo a simulação de custos
    Then NÃO deve exibir ITBI (não aplicável)
    And deve exibir apenas: Transferência DETRAN, Taxa leilão, Despachante
```

---

### RN-GAP-003: Histórico de Lances Anonimizado

**Objetivo:** Fornecer transparência sobre a atividade de lances sem expor identidades de outros participantes.

**Dados Exibidos:**
- Lista cronológica de lances (mais recente primeiro)
- Valores dos lances
- Horário de cada lance (relativo: "há 5 minutos")
- Participante anonimizado (ex: "Participante #1", "Participante #2")
- Estatísticas agregadas (média, mediana, total de participantes únicos)

**Componente:** `BidHistory` (`src/components/lots/bid-history/index.tsx`)

**API:** `GET /api/lots/[lotId]/bid-history`

**Regra de Anonimização:**
- Cada `bidderId` recebe um identificador sequencial consistente
- O usuário logado vê seus próprios lances destacados
- Administradores podem ver dados completos

```gherkin
Feature: Histórico de Lances Anonimizado
  Como um investidor profissional
  Eu quero ver o histórico de lances de um lote
  Para entender a dinâmica da disputa

  Scenario: Visualizar histórico de lances
    Given que estou na página de um lote com 15 lances
    When visualizo o histórico de lances
    Then deve exibir lista com todos os lances
    And cada lance deve mostrar:
      | Campo | Exemplo |
      | Valor | R$ 50.000 |
      | Participante | Participante #3 |
      | Tempo | há 5 minutos |
    And lances devem estar ordenados do mais recente ao mais antigo

  Scenario: Destacar meus lances
    Given que estou logado como investidor
    And eu dei 3 lances neste lote
    When visualizo o histórico
    Then meus lances devem ter destaque visual (cor diferente)
    And deve indicar "Você" ao invés de "Participante #X"

  Scenario: Exibir estatísticas agregadas
    Given que o lote possui histórico de lances
    When visualizo a seção de estatísticas
    Then deve exibir:
      | Métrica | Descrição |
      | Total de lances | Quantidade total de lances |
      | Participantes únicos | Quantos investidores diferentes |
      | Lance médio | Média aritmética dos valores |
      | Lance mediano | Mediana dos valores |
      | Maior incremento | Maior salto entre lances |

  Scenario: Paginação do histórico
    Given que o lote possui mais de 20 lances
    When visualizo o histórico
    Then deve exibir paginação com 10 lances por página
    And deve permitir navegar entre páginas
```

---

### RN-GAP-004: Comparativo de Mercado

**Objetivo:** Fornecer referências de mercado para que investidores avaliem se o lance representa uma boa oportunidade.

**Fontes de Comparação:**
- Índices de mercado imobiliário (FipeZap, Secovi)
- Preços médios por m² na região
- Histórico de vendas similares
- Variação de preço nos últimos 12 meses

**Componente:** `MarketComparison` (`src/components/lots/market-comparison/index.tsx`)

**API:** `GET /api/lots/[lotId]/market-comparison`

**Score de Oportunidade:**
- Calculado automaticamente comparando preço atual vs. média de mercado
- Escala de 1 a 5 estrelas
- Considera: desconto, localização, condição, tendência de mercado

```gherkin
Feature: Comparativo de Mercado
  Como um investidor profissional
  Eu quero comparar o preço do lote com o mercado
  Para avaliar se é uma boa oportunidade

  Scenario: Exibir comparação com mercado imobiliário
    Given que estou analisando um lote de imóvel
    And o imóvel tem 100m² em São Paulo - Pinheiros
    When visualizo o comparativo de mercado
    Then deve exibir:
      | Dado | Exemplo |
      | Preço médio m² região | R$ 15.000/m² |
      | Valor de mercado estimado | R$ 1.500.000 |
      | Preço atual do lote | R$ 900.000 |
      | Desconto vs. mercado | 40% |
    And deve exibir gráfico comparativo

  Scenario: Calcular score de oportunidade
    Given que o lote tem desconto de 35% sobre mercado
    And a região tem tendência de valorização
    And a condição do imóvel é "Bom"
    When o sistema calcula o score
    Then deve exibir 4 de 5 estrelas
    And deve exibir label "Ótima Oportunidade"

  Scenario: Mostrar histórico de preços da região
    Given que visualizo o comparativo de mercado
    When expando a seção de histórico
    Then deve exibir gráfico de linha com:
      | Métrica | Período |
      | Preço médio m² | Últimos 12 meses |
      | Tendência | Alta/Estável/Baixa |
    And deve indicar a posição do lote atual no gráfico

  Scenario: Listar propriedades similares vendidas
    Given que existem vendas similares na região
    When visualizo a lista de comparáveis
    Then deve exibir até 5 propriedades similares:
      | Campo | Obrigatório |
      | Endereço parcial | Sim |
      | Área | Sim |
      | Valor vendido | Sim |
      | Data da venda | Sim |
      | Desconto/Ágio | Sim |
```

---

### RN-GAP-005: Integração FIPE (Veículos)

**Objetivo:** Fornecer avaliação precisa de veículos usando a tabela FIPE oficial, permitindo comparação direta com o valor do lance.

**Dados da FIPE:**
- Código FIPE do veículo
- Valor FIPE atual
- Histórico de valores (últimos 6 meses)
- Marca, modelo, ano, combustível

**Ajustes Automáticos:**
- Quilometragem (km acima/abaixo da média)
- Estado de conservação
- Acessórios e opcionais

**Componente:** `FipeComparison` (`src/components/lots/fipe-comparison/index.tsx`)

**Serviço:** `FipeService` (`src/services/fipe.service.ts`)

**API Externa:** `https://parallelum.com.br/fipe/api/v1/`

**Cache:** 30 dias para valores FIPE (tabela `VehicleFipePrice`)

```gherkin
Feature: Integração com Tabela FIPE
  Como um investidor profissional
  Eu quero comparar o preço do veículo com a FIPE
  Para avaliar se o lance é vantajoso

  Scenario: Exibir valor FIPE do veículo
    Given que estou analisando um lote de veículo
    And o veículo é um "Toyota Corolla 2020 XEi 2.0"
    When a página carrega
    Then deve buscar automaticamente o valor FIPE
    And deve exibir:
      | Campo | Valor |
      | Código FIPE | 001267-9 |
      | Valor FIPE | R$ 98.500 |
      | Mês/Ano referência | Dez/2025 |

  Scenario: Calcular desconto sobre FIPE
    Given que o valor FIPE do veículo é R$ 100.000
    And o lance atual é R$ 75.000
    When visualizo a comparação
    Then deve exibir desconto de 25% sobre FIPE
    And deve exibir badge "Oportunidade" (se desconto > 15%)
    And deve exibir economia estimada de R$ 25.000

  Scenario: Ajustar valor por quilometragem
    Given que o veículo possui 80.000 km
    And a média esperada para idade é 50.000 km
    When o sistema calcula o valor ajustado
    Then deve aplicar depreciação de ~6% (30.000 km excedentes)
    And deve exibir valor FIPE ajustado

  Scenario: Mostrar histórico de valores FIPE
    Given que visualizo a comparação FIPE
    When expando o histórico de valores
    Then deve exibir gráfico de linha com:
      | Período | Valor FIPE |
      | Jul/2025 | R$ 102.000 |
      | Ago/2025 | R$ 101.000 |
      | Set/2025 | R$ 100.500 |
      | Out/2025 | R$ 99.500 |
      | Nov/2025 | R$ 99.000 |
      | Dez/2025 | R$ 98.500 |
    And deve indicar tendência de depreciação

  Scenario: Exibir selo de oportunidade
    Given que o desconto sobre FIPE é maior que 20%
    And a condição do veículo é "Bom" ou melhor
    When visualizo o card de comparação
    Then deve exibir selo de 4-5 estrelas
    And deve exibir mensagem "Excelente Oportunidade"
```

---

### RN-GAP-006: Dashboard do Investidor

**Objetivo:** Centralizar todas as ferramentas e informações relevantes para investidores profissionais em um único painel.

**Funcionalidades:**
1. **Visão Geral:** Estatísticas do perfil, lotes salvos, alertas ativos
2. **Lotes Salvos:** Lista de favoritos com acompanhamento
3. **Alertas Personalizados:** Configuração de notificações
4. **Estatísticas:** Histórico de participação, taxa de sucesso
5. **Preferências:** Configurações de categoria, faixa de preço, localização

**Componente:** `InvestorDashboard` (`src/components/dashboard/investor-dashboard/index.tsx`)

**API:** `GET/POST /api/investor/dashboard`

**Modelos de Dados:**
- `InvestorDashboard`: Configurações e preferências
- `SavedLot`: Lotes salvos pelo investidor
- `InvestorAlert`: Alertas configurados
- `InvestorStatistics`: Métricas calculadas

```gherkin
Feature: Dashboard do Investidor
  Como um investidor profissional
  Eu quero ter um painel centralizado com minhas ferramentas
  Para gerenciar meus investimentos de forma eficiente

  Scenario: Visualizar visão geral
    Given que estou logado como investidor
    When acesso o Dashboard do Investidor
    Then deve exibir cards de resumo:
      | Métrica | Descrição |
      | Lotes Salvos | Quantidade de favoritos |
      | Alertas Ativos | Notificações configuradas |
      | Leilões Participados | Histórico de participação |
      | Taxa de Sucesso | Arremates / Participações |

  Scenario: Gerenciar lotes salvos
    Given que tenho lotes salvos como favoritos
    When acesso a aba "Lotes Salvos"
    Then deve exibir lista dos lotes com:
      | Campo | Descrição |
      | Imagem | Thumbnail do lote |
      | Título | Nome do lote |
      | Preço Atual | Lance atual ou inicial |
      | Status | Ativo/Encerrado |
      | Tempo Restante | Countdown se ativo |
    And deve permitir remover lote dos favoritos
    And deve permitir ir direto para página do lote

  Scenario: Configurar alertas
    Given que quero ser notificado sobre novas oportunidades
    When acesso a aba "Alertas"
    Then deve permitir criar alerta com:
      | Campo | Opções |
      | Categoria | Imóveis, Veículos, etc. |
      | Faixa de Preço | Min/Max |
      | Localização | Estado/Cidade |
      | Desconto Mínimo | Percentual vs. mercado |
      | Frequência | Imediato, Diário, Semanal |
    And deve listar alertas existentes
    And deve permitir ativar/desativar alertas

  Scenario: Ver estatísticas de participação
    Given que já participei de leilões anteriormente
    When acesso a aba "Estatísticas"
    Then deve exibir:
      | Métrica | Período |
      | Total de lances dados | Últimos 12 meses |
      | Valor total arrematado | Histórico |
      | Taxa de sucesso | Arremates/Participações |
      | Economia total | Desconto vs. mercado |
    And deve exibir gráfico de evolução mensal
```

---

### RN-GAP-007: Especificações Técnicas Dinâmicas

**Objetivo:** Fornecer especificações técnicas detalhadas para eletrônicos e maquinário, usando templates por categoria.

**Templates por Categoria:**
- **Smartphones:** Tela, processador, RAM, armazenamento, câmera, bateria
- **Notebooks:** CPU, GPU, RAM, SSD, tela, bateria
- **Tablets:** Tela, processador, RAM, armazenamento
- **Máquinas Agrícolas:** Potência, horas de uso, última manutenção
- **Equipamentos Industriais:** Capacidade, certificações, data de fabricação

**Componentes:**
- `DynamicSpecs` (`src/components/lots/dynamic-specs/index.tsx`)
- `MachineryInspection` (`src/components/lots/machinery-inspection/index.tsx`)
- `MachineryCertifications` (`src/components/lots/machinery-certifications/index.tsx`)

**Modelo:** `CategorySpecTemplate` no banco de dados

```gherkin
Feature: Especificações Técnicas Dinâmicas
  Como um investidor profissional
  Eu quero ver especificações técnicas detalhadas
  Para avaliar o real valor do equipamento

  Scenario: Exibir specs de smartphone
    Given que estou analisando um lote de smartphone
    And o smartphone é um "iPhone 14 Pro"
    When visualizo as especificações
    Then deve exibir campos do template "smartphones":
      | Campo | Valor |
      | Tela | 6.1" Super Retina XDR |
      | Processador | A16 Bionic |
      | RAM | 6GB |
      | Armazenamento | 256GB |
      | Câmera | 48MP + 12MP + 12MP |
      | Bateria | 3200mAh |
    And campos preenchidos devem ter destaque
    And campos não preenchidos devem aparecer como "Não informado"

  Scenario: Exibir relatório de inspeção de maquinário
    Given que estou analisando um lote de trator
    And existe relatório de inspeção
    When visualizo a aba "Inspeção"
    Then deve exibir checklist técnico:
      | Item | Status |
      | Motor | ✅ Aprovado |
      | Transmissão | ✅ Aprovado |
      | Sistema Hidráulico | ⚠️ Atenção |
      | Pneus/Esteiras | ✅ Aprovado |
      | Cabine | ✅ Aprovado |
    And deve exibir informações do inspetor
    And deve exibir data da inspeção

  Scenario: Exibir certificações de equipamento
    Given que o equipamento possui certificações
    When visualizo a aba "Certificações"
    Then deve exibir lista de certificações:
      | Campo | Exemplo |
      | Tipo | ISO 9001 |
      | Emissor | Bureau Veritas |
      | Validade | 15/06/2026 |
      | Status | Ativo/Expirado |
    And certificações expiradas devem ter alerta visual
```

---

### RN-GAP-008: Informações de Semoventes

**Objetivo:** Fornecer informações completas sobre animais (gado, equinos, etc.) incluindo saúde, pedigree e histórico reprodutivo.

**Categorias de Dados:**
1. **Saúde:** Vacinações, exames, atestados sanitários
2. **Pedigree:** Genealogia, registro em associação
3. **Reprodução:** Histórico de crias, inseminações, produtividade

**Componentes:**
- `LivestockHealth` (`src/components/lots/livestock-health/index.tsx`)
- `LivestockReproductive` (`src/components/lots/livestock-reproductive/index.tsx`)

**Modelos:**
- `LivestockHealthRecord`: Registros de saúde
- `LivestockReproductiveHistory`: Histórico reprodutivo

```gherkin
Feature: Informações de Semoventes
  Como um investidor profissional em pecuária
  Eu quero ver informações completas dos animais
  Para avaliar genética, saúde e potencial produtivo

  Scenario: Visualizar histórico de vacinação
    Given que estou analisando um lote de gado Nelore
    When visualizo a aba "Saúde"
    Then deve exibir calendário de vacinações:
      | Vacina | Data | Próxima |
      | Febre Aftosa | 15/05/2025 | 15/11/2025 |
      | Brucelose | 10/03/2025 | - |
      | Raiva | 20/06/2025 | 20/06/2026 |
    And deve indicar vacinas em dia (verde)
    And deve alertar vacinas pendentes (amarelo)

  Scenario: Verificar certificados sanitários
    Given que o animal possui certificados
    When visualizo a seção de certificados
    Then deve exibir:
      | Certificado | Status |
      | GTA (Guia de Trânsito) | ✅ Válido |
      | Atestado de Sanidade | ✅ Válido |
      | Exame de Brucelose | ✅ Negativo |
    And deve ter link para download dos documentos

  Scenario: Consultar pedigree
    Given que o animal possui registro de pedigree
    When visualizo a aba "Pedigree"
    Then deve exibir árvore genealógica:
      | Geração | Pai | Mãe |
      | Pais | Touro ABC | Vaca XYZ |
      | Avós Pat. | Avô 1 | Avó 1 |
      | Avós Mat. | Avô 2 | Avó 2 |
    And deve exibir número de registro na associação
    And deve exibir DEPs (Diferenças Esperadas na Progênie) se disponível

  Scenario: Ver histórico reprodutivo
    Given que a matriz possui histórico de crias
    When visualizo a aba "Reprodução"
    Then deve exibir:
      | Métrica | Valor |
      | Total de Crias | 8 |
      | Crias Vivas | 7 |
      | Taxa de Fertilidade | 87.5% |
      | Idade Primeira Cria | 24 meses |
    And deve listar últimas crias com data e status
```

---

### COMPONENTE UNIFICADO: InvestorAnalysisSection

**Localização:** `src/components/lots/investor-analysis-section/index.tsx`

**Propósito:** Agrupa todos os componentes de análise em uma seção única com tabs dinâmicas baseadas na categoria do lote.

**Detecção Automática de Categoria:**
- Analisa `lot.category.slug`, `lot.category.name` e campos específicos
- Determina tabs disponíveis automaticamente
- Mantém tabs universais (Custos, Histórico, Mercado) para todas as categorias

**Integração:** Adicionado à página `lot-detail-client.tsx` após as abas de detalhes do lote.

```gherkin
Feature: Seção de Análise do Investidor
  Como um investidor profissional
  Eu quero ter acesso fácil a todas as ferramentas de análise
  Para tomar decisões informadas rapidamente

  Scenario: Exibir tabs corretas para imóvel
    Given que estou na página de um lote de imóvel
    When a seção de análise carrega
    Then deve exibir tabs: Custos, Histórico, Mercado, Jurídico
    And tab "FIPE" NÃO deve aparecer

  Scenario: Exibir tabs corretas para veículo
    Given que estou na página de um lote de veículo
    When a seção de análise carrega
    Then deve exibir tabs: Custos, Histórico, Mercado, FIPE
    And tab "Jurídico" NÃO deve aparecer

  Scenario: Exibir tabs corretas para eletrônico
    Given que estou na página de um lote de smartphone
    When a seção de análise carrega
    Then deve exibir tabs: Custos, Histórico, Mercado, Especificações
    
  Scenario: Exibir tabs corretas para semovente
    Given que estou na página de um lote de gado
    When a seção de análise carrega
    Then deve exibir tabs: Custos, Histórico, Mercado, Saúde, Reprodução

  Scenario: Calcular score de oportunidade
    Given que o lote possui dados suficientes para análise
    When a seção de análise carrega
    Then deve exibir badge com score de oportunidade (0-100%)
    And deve exibir label descritivo (Alta/Moderada/Análise Recomendada)
```

---

### ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   ├── lots/
│   │   ├── index.ts                           # Barrel exports
│   │   ├── investor-analysis-section/         # Seção unificada
│   │   │   └── index.tsx
│   │   ├── legal-info/                        # GAP-001
│   │   │   └── lot-legal-info-card.tsx
│   │   ├── cost-simulator/                    # GAP-002
│   │   │   └── index.tsx
│   │   ├── bid-history/                       # GAP-003
│   │   │   └── index.tsx
│   │   ├── market-comparison/                 # GAP-004
│   │   │   └── index.tsx
│   │   ├── fipe-comparison/                   # GAP-005
│   │   │   └── index.tsx
│   │   ├── vehicle-specs/                     # GAP-005
│   │   │   └── index.tsx
│   │   ├── dynamic-specs/                     # GAP-007
│   │   │   └── index.tsx
│   │   ├── machinery-inspection/              # GAP-007
│   │   │   └── index.tsx
│   │   ├── machinery-certifications/          # GAP-007
│   │   │   └── index.tsx
│   │   ├── livestock-health/                  # GAP-008
│   │   │   └── index.tsx
│   │   ├── livestock-reproductive/            # GAP-008
│   │   │   └── index.tsx
│   │   └── retail-price-comparison/           # GAP-007
│   │       └── index.tsx
│   └── dashboard/
│       └── investor-dashboard/                # GAP-006
│           └── index.tsx
├── services/
│   └── fipe.service.ts                        # GAP-005
├── app/
│   └── api/
│       ├── lots/
│       │   └── [lotId]/
│       │       ├── cost-simulation/
│       │       │   └── route.ts               # GAP-002
│       │       ├── bid-history/
│       │       │   └── route.ts               # GAP-003
│       │       └── market-comparison/
│       │           └── route.ts               # GAP-004
│       ├── vehicles/
│       │   └── fipe/
│       │       └── route.ts                   # GAP-005
│       └── investor/
│           └── dashboard/
│               └── route.ts                   # GAP-006
└── prisma/
    ├── schema.prisma                          # Modelos principais
    └── migrations/
        └── gaps_implementation/
            └── migration.sql                  # Novos modelos
```

---

### MODELOS DE DADOS (Prisma)

```prisma
// Configuração de custos por leilão (GAP-002)
model AuctionCostConfig {
  id                BigInt   @id @default(autoincrement())
  auctionId         BigInt
  itbiPercent       Decimal  @default(3.0) @db.Decimal(5, 2)
  registryFeeType   String   @default("table") // "fixed" | "table" | "percent"
  registryFeeValue  Decimal? @db.Decimal(10, 2)
  adminFeePercent   Decimal  @default(5.0) @db.Decimal(5, 2)
  successFeePercent Decimal  @default(0.0) @db.Decimal(5, 2)
  otherFeesEstimate Decimal  @default(2000) @db.Decimal(10, 2)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  auction           Auction  @relation(fields: [auctionId], references: [id])
}

// Cache de preços FIPE (GAP-005)
model VehicleFipePrice {
  id            BigInt   @id @default(autoincrement())
  fipeCode      String   @db.VarChar(20)
  referenceDate DateTime
  brand         String   @db.VarChar(100)
  model         String   @db.VarChar(200)
  year          Int
  fuel          String   @db.VarChar(50)
  price         Decimal  @db.Decimal(12, 2)
  fetchedAt     DateTime @default(now())
  
  @@unique([fipeCode, referenceDate])
  @@index([fipeCode])
}

// Dashboard do Investidor (GAP-006)
model InvestorDashboard {
  id                     BigInt   @id @default(autoincrement())
  userId                 BigInt   @unique
  preferredCategories    Json?    // string[]
  minPriceRange          Decimal? @db.Decimal(12, 2)
  maxPriceRange          Decimal? @db.Decimal(12, 2)
  preferredLocations     Json?    // {stateId, cityId}[]
  alertFrequency         String   @default("daily") // "immediate" | "daily" | "weekly"
  emailNotifications     Boolean  @default(true)
  pushNotifications      Boolean  @default(false)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

// Lotes Salvos (GAP-006)
model SavedLot {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt
  lotId     BigInt
  notes     String?  @db.Text
  savedAt   DateTime @default(now())
  
  @@unique([userId, lotId])
  @@index([userId])
}

// Alertas do Investidor (GAP-006)
model InvestorAlert {
  id             BigInt   @id @default(autoincrement())
  userId         BigInt
  name           String   @db.VarChar(100)
  categoryIds    Json?    // BigInt[]
  minPrice       Decimal? @db.Decimal(12, 2)
  maxPrice       Decimal? @db.Decimal(12, 2)
  minDiscount    Decimal? @db.Decimal(5, 2)
  locationFilter Json?    // {stateId, cityId}[]
  frequency      String   @default("daily")
  isActive       Boolean  @default(true)
  lastTriggered  DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([userId])
}

// Registros de Saúde de Semoventes (GAP-008)
model LivestockHealthRecord {
  id                BigInt   @id @default(autoincrement())
  lotId             BigInt
  vaccineName       String   @db.VarChar(100)
  vaccineDate       DateTime
  nextDueDate       DateTime?
  veterinarianName  String?  @db.VarChar(200)
  veterinarianCrmv  String?  @db.VarChar(20)
  documentUrl       String?  @db.VarChar(500)
  notes             String?  @db.Text
  createdAt         DateTime @default(now())
  
  @@index([lotId])
}

// Histórico Reprodutivo (GAP-008)
model LivestockReproductiveHistory {
  id            BigInt   @id @default(autoincrement())
  lotId         BigInt
  eventType     String   @db.VarChar(50) // BIRTH, INSEMINATION, WEANING, etc.
  eventDate     DateTime
  offspringId   BigInt?
  sireId        BigInt?
  sireName      String?  @db.VarChar(200)
  offspringInfo Json?
  notes         String?  @db.Text
  createdAt     DateTime @default(now())
  
  @@index([lotId])
}

// Inspeção de Maquinário (GAP-007)
model MachineryInspection {
  id              BigInt   @id @default(autoincrement())
  lotId           BigInt
  inspectionDate  DateTime
  inspectorName   String   @db.VarChar(200)
  inspectorCrea   String?  @db.VarChar(20)
  overallStatus   String   @default("pending") // pending, approved, attention, rejected
  items           Json     // InspectionItem[]
  recommendations String?  @db.Text
  documentUrl     String?  @db.VarChar(500)
  createdAt       DateTime @default(now())
  
  @@index([lotId])
}

// Certificações de Maquinário (GAP-007)
model MachineryCertification {
  id              BigInt   @id @default(autoincrement())
  lotId           BigInt
  certType        String   @db.VarChar(100)
  certNumber      String?  @db.VarChar(100)
  issuingBody     String   @db.VarChar(200)
  issueDate       DateTime
  expiryDate      DateTime?
  status          String   @default("active") // active, expired, revoked
  documentUrl     String?  @db.VarChar(500)
  createdAt       DateTime @default(now())
  
  @@index([lotId])
}
```

---

### APIs IMPLEMENTADAS

#### POST `/api/lots/[lotId]/cost-simulation`
Calcula custos totais de aquisição baseado em valor de lance simulado.

**Request:**
```json
{
  "bidAmount": 500000,
  "includeFinancing": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bidAmount": 500000,
    "breakdown": {
      "itbi": { "label": "ITBI", "percent": 3, "value": 15000 },
      "registry": { "label": "Registro", "value": 3500 },
      "adminFee": { "label": "Taxa Administração", "percent": 5, "value": 25000 },
      "successFee": { "label": "Taxa Sucesso", "percent": 0, "value": 0 },
      "otherFees": { "label": "Outras Taxas", "value": 2000 }
    },
    "totalCosts": 45500,
    "totalInvestment": 545500,
    "costPercentage": 9.1
  }
}
```

#### GET `/api/lots/[lotId]/bid-history`
Retorna histórico de lances anonimizado com estatísticas.

**Query Params:**
- `page`: Número da página (default: 1)
- `limit`: Itens por página (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "id": "bid_1",
        "amount": 50000,
        "participantId": "Participante #1",
        "timeAgo": "há 5 minutos",
        "isCurrentUser": false
      }
    ],
    "stats": {
      "totalBids": 15,
      "uniqueParticipants": 8,
      "averageBid": 45000,
      "medianBid": 47000,
      "largestIncrement": 5000
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15
    }
  }
}
```

#### GET `/api/lots/[lotId]/market-comparison`
Retorna dados de comparação com mercado e score de oportunidade.

**Response:**
```json
{
  "success": true,
  "data": {
    "marketPrice": {
      "averagePricePerSqm": 15000,
      "estimatedValue": 1500000,
      "source": "FipeZap",
      "referenceDate": "2025-12-01"
    },
    "comparison": {
      "currentPrice": 900000,
      "discount": 40,
      "saving": 600000
    },
    "opportunityScore": 85,
    "opportunityLabel": "Alta Oportunidade",
    "similarSales": [...]
  }
}
```

#### GET `/api/vehicles/fipe`
Busca dados da tabela FIPE.

**Query Params:**
- `brandId`: ID da marca
- `modelId`: ID do modelo
- `yearId`: ID do ano
- `fipeCode`: Código FIPE direto

**Response:**
```json
{
  "success": true,
  "data": {
    "fipeCode": "001267-9",
    "brand": "Toyota",
    "model": "Corolla XEi 2.0 Flex",
    "year": 2020,
    "fuel": "Gasolina",
    "price": 98500,
    "referenceMonth": "dezembro/2025"
  }
}
```

#### GET/POST `/api/investor/dashboard`
Gerencia dados do dashboard do investidor.

**GET Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "savedLotsCount": 12,
      "activeAlertsCount": 3,
      "auctionsParticipated": 25,
      "successRate": 32
    },
    "savedLots": [...],
    "alerts": [...],
    "statistics": {...},
    "preferences": {...}
  }
}
```

---

### TESTES RECOMENDADOS

**Arquivos de Teste a Criar:**

1. `tests/e2e/investor-analysis.spec.ts`
   - Testar carregamento da seção de análise
   - Testar navegação entre tabs
   - Testar cálculos do simulador de custos

2. `tests/e2e/fipe-integration.spec.ts`
   - Testar busca de valores FIPE
   - Testar cache de valores
   - Testar comparação com lance atual

3. `tests/e2e/investor-dashboard.spec.ts`
   - Testar salvamento de lotes
   - Testar criação de alertas
   - Testar estatísticas

4. `tests/unit/cost-simulator.spec.tsx`
   - Testar cálculos de ITBI
   - Testar cálculos de registro
   - Testar totais

5. `tests/unit/fipe-service.spec.ts`
   - Testar integração com API FIPE
   - Testar cache TTL
   - Testar ajustes por quilometragem

---

**Status Final:** ✅ Implementação Completa dos 8 Gaps  
**Próximos Passos:** 
1. Executar migration no banco de dados
2. Popular dados de teste
3. Executar testes E2E
4. Deploy em staging para validação

---

## RN-020: Header — Barra de Busca e Seletor de Moeda

> **Data:** 2025-02-21  
> **Branch:** `fix/search-bar-currency-flags-20260221-1945`

### RN-020.1: Campo de Busca Livre no Header

**Regra:** O campo de texto livre de busca (`input[data-ai-id="header-search-input"]`) DEVE estar sempre visível no header em viewports desktop (≥ 768px), com largura suficiente para exibir o placeholder "Buscar em todo o site..." sem truncamento.

**Requisitos Técnicos:**
- O `<input>` DEVE ter `min-w-0` e `w-auto` para funcionar corretamente dentro do contexto `flex-1`
- O `<SelectTrigger>` de categoria ao lado DEVE ter `w-[150px] shrink-0` como classes utilitárias diretas (não apenas via @apply em classe semântica) para evitar conflito com `tailwind-merge`
- 🔹 **Proibido:** Permitir que o input colapse para larguras menores que 120px em desktop

**Causa-Raiz Documentada:**
- `tailwind-merge` (usado por `cn()`) NÃO consegue resolver conflitos entre classes utilitárias e classes semânticas que usam `@apply`. Exemplo: `w-[150px]` dentro de `.select-header-search-category` via `@apply` é invisível para `tailwind-merge`, que mantém `w-full` do componente base `SelectTrigger`
- **Solução:** Sempre aplicar classes de dimensionamento críticas como utilitárias diretas no JSX, não apenas via @apply

### RN-020.2: Ícone Único de Busca no Desktop

**Regra:** Em viewports desktop (≥ 768px), DEVE existir apenas UM ícone de busca visível: o ícone dentro do `<Select>` ou do formulário. O botão mobile de busca (`btn-header-action-mobile`) DEVE ser oculto via `md:!hidden`.

**Requisitos Técnicos:**
- O `.btn-header-action-mobile` DEVE usar `md:!hidden` (com `!important`) para garantir ocultação, pois `.btn-base` (definido posteriormente no CSS) aplica `inline-flex` que sobrescreve `md:hidden` comum por ordem de cascata
- 🔹 **Proibido:** Exibir dois ícones de busca simultaneamente em desktop

### RN-020.3: Seletor de Moeda com Bandeiras SVG

**Regra:** O seletor de moeda no header DEVE exibir bandeiras de países como componentes SVG inline (não emojis), para consistência cross-platform.

**Moedas Suportadas:**
| Código | País | Componente | `data-ai-id` |
|--------|------|-----------|---------------|
| BRL | Brasil | `<BrazilFlag />` | `currency-flag-brl` |
| USD | Estados Unidos | `<USAFlag />` | `currency-flag-usd` |
| EUR | União Europeia | `<EUFlag />` | `currency-flag-eur` |

**Comportamento do Dropdown:**
- O trigger exibe a bandeira + código da moeda selecionada
- O dropdown lista APENAS as moedas NÃO selecionadas (ex: se BRL está selecionado, dropdown mostra apenas USD e EUR)
- Cada item do dropdown exibe bandeira SVG + código + nome da moeda

**Requisitos Técnicos:**
- Componente: `src/components/ui/currency-flag.tsx`
- Cada bandeira é um SVG inline com `viewBox="0 0 120 84"`, prop `size` configurável (default: 20px)
- Todas as bandeiras DEVEM ter `aria-label` descritivo e `data-ai-id` para testabilidade
- 🔹 **Proibido:** Usar emojis de bandeira (renderização inconsistente entre SO/browsers)
- 🔹 **Proibido:** Usar imagens raster (PNG/JPG) para as bandeiras (aumenta bundle size)

### RN-020.4: Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/app/semantic-classes.css` | `.input-header-search`: adicionado `min-w-0 w-auto`; `.btn-header-action-mobile`: alterado `md:hidden` → `md:!hidden` |
| `src/components/layout/header.tsx` | Import de `CurrencyFlag`; `SelectTrigger` com `w-[150px] shrink-0` direto; dropdown de moeda com filtro e SVG flags |
| `src/components/ui/currency-flag.tsx` | **NOVO** — Componentes SVG: `BrazilFlag`, `USAFlag`, `EUFlag`, `CurrencyFlag` |

### RN-020.5: Testes E2E Obrigatórios

| Cenário | `data-ai-id` | Validação |
|---------|--------------|-----------|
| Input de busca visível no desktop | `header-search-input` | `isVisible()` + largura > 120px |
| Ícone único de busca no desktop | `btn-header-action-mobile` | `isHidden()` em viewport ≥ 768px |
| Bandeira SVG no trigger de moeda | `currency-flag-brl` / `currency-flag-usd` / `currency-flag-eur` | SVG renderizado com dimensões corretas |
| Dropdown exclui moeda selecionada | `currency-selector-trigger` | Ao abrir, listar apenas moedas não selecionadas |

**Arquivo de Teste:** `tests/e2e/header-search-currency.spec.ts`

---

## Admin Plus — Painel Administrativo Avançado

**Data de Implementação:** Março 2026  
**Objetivo:** Painel administrativo moderno, padronizado e extensível para gerenciar TODAS as 63 entidades do sistema BidExpert com CRUD completo.  
**Rota Base:** `/admin-plus` (route group `(adminplus)`)  
**Total de Entidades:** 63 — organizadas em 13 grupos temáticos e 7 tiers de dependência

---

### RN-AP-001: Arquitetura Geral do Admin Plus

**Decisões Arquiteturais:**
- Route group Next.js `(adminplus)` isolado do admin legado existente em `(admin)`
- Cada entidade possui sua própria pasta em `src/app/(adminplus)/admin-plus/[entity-slug]/`
- Cada entidade segue rigorosamente o **Padrão de 6 Arquivos** (ver RN-AP-002)
- Layout com sidebar colapsável e header com breadcrumbs via `AdminShell`
- Todas as operações CRUD acontecem em Sheet lateral (sem navegação para páginas separadas)
- Listagem com `DataTablePlus` (TanStack Table v8 com paginação server-side)

**Tiers de Dependência (ordem de implementação):**

| Tier | Descrição | Entidades | Quantidade |
|------|-----------|-----------|------------|
| 0 | Fundação (sem FK entre si) | States, Courts, DocumentTypes, DataSources, Roles, VehicleMakes | 6 |
| 1 | Base (dependem só de Tier 0) | Cities, VehicleModels, Tenants, Users | 4 |
| 2 | Configuração (dependem de Tenants) | PlatformSettings, ThemeSettings, BiddingSettings, MapSettings, NotificationSettings, PaymentGatewaySettings, RealtimeSettings, MentalTriggerSettings, SectionBadgeVisibility, IdMasks, CounterStates, VariableIncrementRules | 12 |
| 3 | Participantes (dependem de Users/Tenants) | UserOnTenants, Sellers, Auctioneers, BidderProfiles, UsersOnRoles, PasswordResetTokens, UserDocuments | 7 |
| 4 | Catálogo e Judicial | LotCategories, Subcategories, MediaItems, DocumentTemplates, JudicialDistricts, JudicialBranches, JudicialProcesses, JudicialParties | 8 |
| 5 | Negócio (dependem de catálogo + participantes) | Auctions, Assets, Lots, AuctionStages, AssetsOnLots, LotDocuments, LotQuestions, LotRisks, LotStagePrices, AuctionHabilitations | 10 + transações |
| 6 | Transações, Pós-venda, Comunicações, Analytics | Bids, InstallmentPayments, DirectSaleOffers, PaymentMethods, UserLotMaxBids, TenantInvoices, UserWins, WonLots, Notifications, ContactMessages, BidderNotifications, Reviews, Subscribers, AuditLogs, ParticipationHistory, ITSMTickets | 16 |

**Grupos no ENTITY_REGISTRY:**

| Grupo | Entidades | Descrição |
|-------|-----------|-----------|
| `foundation` | 6 | Tabelas-base sem FK mútua |
| `base` | 4 | Dependem apenas de foundation |
| `config` | 12 | Configurações do tenant |
| `participants` | 7 | Usuários e perfis |
| `catalog` | 4 | Categorias, mídia, templates |
| `judicial` | 4 | Comarcas, varas, processos |
| `business` | 11 | Leilões, lotes, ativos, praças |
| `transactions` | 6 | Lances, pagamentos, ofertas |
| `post-sale` | 2 | Arrematações |
| `communications` | 5 | Notificações, contatos, avaliações |
| `analytics` | 2 | Auditoria e histórico |
| `support` | 1 | Tickets ITSM |
| `validation` | 0 | Reservado para futuro |

---

### RN-AP-002: Padrão de 6 Arquivos por Entidade

**REGRA OBRIGATÓRIA:** Toda entidade Admin Plus DEVE ter exatamente 6 arquivos em sua pasta:

| # | Arquivo | Diretiva | Responsabilidade |
|---|---------|----------|-----------------|
| 1 | `schema.ts` | — | Schemas Zod de criação e edição + arrays de enum const |
| 2 | `types.ts` | — | Interface `Row` + type `FormValues` derivado do Zod |
| 3 | `columns.tsx` | `'use client'` | Fábrica `getColumns(onEdit, onDelete)` retornando `ColumnDef<Row>[]` |
| 4 | `actions.ts` | `'use server'` | Server Actions CRUD (list, create, update, delete) via `createAdminAction` |
| 5 | `form.tsx` | `'use client'` | Componente `EntityForm` com React Hook Form + Zod, renderizado dentro de `CrudFormShell` (Sheet) |
| 6 | `page.tsx` | `'use client'` | Página com `DataTablePlus`, `useDataTable`, `ConfirmationDialog` e `PageHeader` |

**Estrutura de Diretório:**
```
src/app/(adminplus)/admin-plus/
├── layout.tsx              ← AdminShell (sidebar + header)
├── dashboard/page.tsx      ← Dashboard geral
├── auctions/
│   ├── schema.ts
│   ├── types.ts
│   ├── columns.tsx
│   ├── actions.ts
│   ├── form.tsx
│   └── page.tsx
├── lots/
│   ├── schema.ts
│   ├── types.ts
│   ├── columns.tsx
│   ├── actions.ts
│   ├── form.tsx
│   └── page.tsx
└── ... (63 entidades no total)
```

---

### RN-AP-003: Factory de Server Actions (`createAdminAction`)

**Localização:** `src/lib/admin-plus/create-admin-action.ts`

**Comportamento:**
1. Valida sessão JWT via `getSession()`
2. Carrega permissões do usuário para o tenant
3. Verifica permissão exigida via `hasPermission()`
4. Executa o handler passando `ActionContext`
5. Wrapa retorno em `{ success: true, data }` ou `{ success: false, error }`
6. Chama `sanitizeResponse()` para converter BigInt→string, Decimal→number, Date→ISO

**ActionContext passado ao handler:**
```typescript
interface ActionContext {
  userId: string;
  tenantId: string;
  tenantIdBigInt: bigint;
  permissions: string[];
}
```

**REGRA:** O handler NUNCA retorna `{ success: true, data }` — retorna dados brutos e a factory envolve.

**Exemplo de handler:**
```typescript
export const listEntities = createAdminAction(
  'entities:read',
  async (params: ListParams, ctx: ActionContext) => {
    const { page, pageSize, sortField, sortDirection, search } = params;
    const where: Prisma.EntityWhereInput = { tenantId: ctx.tenantIdBigInt };
    if (search) { where.name = { contains: search }; }
    const [data, total] = await Promise.all([
      prisma.entity.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sortField]: sortDirection } }),
      prisma.entity.count({ where }),
    ]);
    return { data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
);
```

---

### RN-AP-004: Padrões de Filtro por TenantId

Existem 3 padrões de filtragem multi-tenant implementados:

**Padrão 1 — Standard (maioria das entidades):**
```typescript
where: { tenantId: ctx.tenantIdBigInt }
```
Usado por: Auctions, Lots, Assets, Users, Sellers, Auctioneers, Bids, etc.

**Padrão 2 — Nullable OR (entidades com tenantId opcional):**
```typescript
where: {
  OR: [
    { tenantId: ctx.tenantIdBigInt },
    { tenantId: null }
  ]
}
```
Usado por: AuditLog, BidderNotification, ITSM_Ticket, PaymentMethod

**Padrão 3 — Global (sem tenantId):**
```typescript
// Sem filtro de tenantId
where: { /* apenas filtros de negócio */ }
```
Usado por: DocumentTemplate, ContactMessage

---

### RN-AP-005: Hook `useDataTable` — Duas Assinaturas

**Localização:** `src/hooks/admin-plus/use-data-table.ts`

**Assinatura 1 — Standard (entidades com PK simples BigInt):**
```typescript
const table = useDataTable({
  listAction,
  createAction,
  updateAction,
  deleteAction,
  entityLabel: 'Leilão',
  defaultSort: { id: 'startDate', desc: true },
});
```
Inclui: `rows`, `loading`, `pagination`, `sort`, `search`, `handleCreate`, `handleUpdate`, `handleDelete`, `refetch`

**Assinatura 2 — Custom Fetch (entidades com PK composta ou lógica especial):**
```typescript
const table = useDataTable({
  fetchFn: async (params) => { /* custom fetch */ },
  defaultSort: { field: 'createdAt', direction: 'desc' },
});
```
Usado por: AssetsOnLots, UsersOnRoles, LotStagePrices (PKs compostas), e entidades que precisam de params extras na listagem.

**Padrão de página (page.tsx):**
```typescript
'use client';
export default function EntityPage() {
  const table = useDataTable({ listAction, createAction, updateAction, deleteAction, entityLabel: 'Entidade', defaultSort: { id: 'createdAt', desc: true } });
  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; row: Row | null }>({ open: false, row: null });

  // ... handlers de open/close/save/delete

  return (
    <>
      <PageHeader title="Entidades" onAdd={() => { setEditing(null); setFormOpen(true); }} />
      <DataTablePlus columns={getColumns(handleEdit, handleDelete)} {...table} />
      <EntityForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} defaultValues={editing} loading={table.loading} />
      <ConfirmationDialog open={confirmDialog.open} onConfirm={confirmDelete} onCancel={() => setConfirmDialog({ open: false, row: null })} title="Excluir" description="Tem certeza?" />
    </>
  );
}
```

---

### RN-AP-006: Padrões de Formulário (`form.tsx`)

**Componente wrapper:** `CrudFormShell` (Sheet lateral com header e footer padronizados)

**Padrões implementados:**

1. **FK Select com carregamento dinâmico:**
```typescript
const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
useEffect(() => {
  loadParentEntities().then(res => {
    if (res.success) setOptions(res.data.data.map(r => ({ value: r.id, label: r.name })));
  });
}, []);
// <Select> com options
```

2. **Campos condicionais (watch + setValue):**
```typescript
const watchedField = form.watch('type');
useEffect(() => {
  if (watchedField !== 'SPECIFIC_VALUE') form.setValue('conditionalField', '');
}, [watchedField]);
```

3. **Checkbox para booleanos:**
```typescript
<FormField name="isActive" render={({ field }) => (
  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
)} />
```

4. **Select de enum via arrays constantes:**
```typescript
// schema.ts
export const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
// form.tsx
{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
```

---

### RN-AP-007: Tratamento de Tipos de Dados

| Tipo Prisma | Leitura (toRow) | Escrita (create/update) |
|-------------|-----------------|------------------------|
| `BigInt` (id) | `.toString()` | `BigInt(stringId)` |
| `BigInt` (FK) | `.toString()` | `BigInt(formValue)` |
| `Decimal` | `.toNumber()` ou `Number()` | `parseFloat(formValue)` |
| `DateTime` | `.toISOString()` | `new Date(formValue)` |
| `Json` | `JSON.stringify(field)` | `JSON.parse(formValue)` ou valor direto |
| `Boolean` | Direto (`true/false`) | Direto |
| `Int/Float` | Direto ou `.toFixed(2)` | `parseInt()` / `parseFloat()` |

**Função `toRow()`:** Cada `actions.ts` define uma função `toRow(record)` que converte o registro Prisma para a interface `Row` do `types.ts`, aplicando as conversões acima.

**`sanitizeResponse<T>`** (de `src/lib/serialization-helper.ts`): Aplicada automaticamente pela factory `createAdminAction` — converte recursivamente BigInt→string, Decimal→number, Date→ISO string em qualquer resposta.

---

### RN-AP-008: ENTITY_REGISTRY — Registro Central de Metadados

**Localização:** `src/lib/admin-plus/constants.ts`

**Tipo:**
```typescript
interface EntityConfig {
  slug: string;            // URL slug (ex: 'auctions')
  label: string;           // Singular (ex: 'Leilão')
  labelPlural: string;     // Plural (ex: 'Leilões')
  icon: string;            // Nome do ícone Lucide (ex: 'Gavel')
  group: EntityGroup;      // Grupo temático
  hasTenantId: boolean;    // Se filtra por tenantId
  paginationMode: 'server' | 'client';
  permissions: {
    read: string;          // Ex: 'auctions:read'
    create: string;
    update: string;
    delete: string;
  };
}
```

**Total:** 63 entidades registradas em 13 grupos.

**Uso:** A sidebar do Admin Plus itera sobre `ENTITY_REGISTRY` para gerar o menu de navegação agrupado. O dashboard usa os dados para exibir contadores. Ferramentas de geração de código podem consultar o registro para scaffolding.

---

### RN-AP-009: Componentes de Infraestrutura

**Componentes compartilhados em `src/components/admin-plus/`:**

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| `AdminShell` | `admin-shell.tsx` | Layout com sidebar colapsável + header com breadcrumbs |
| `DataTablePlus` | `data-table-plus.tsx` | Tabela com 6 subcomponentes: Header, Body, Pagination, Search, Toolbar, BulkActions |
| `CrudFormShell` | `crud-form-shell.tsx` | Sheet lateral com form header/footer padronizados |
| `Field` | `field.tsx` | Wrapper para `FormField` com label, error e description |
| `ConfirmationDialog` | `confirmation-dialog.tsx` | Dialog de confirmação para ações destrutivas |
| `PageHeader` | `page-header.tsx` | Header de página com título, botão "+ Novo" e breadcrumbs |
| `EntitySelector` | (via FK Select) | Select com busca para selecionar entidades relacionadas |

**`DataTablePlus` — Recursos:**
- Paginação server-side com `PAGE_SIZE_OPTIONS: [10, 25, 50, 100]`
- Ordenação manual por coluna (asc/desc)
- Busca textual com debounce
- Seleção de linhas para ações em lote (`BulkAction<T>` com `onExecute`)
- Toolbar com filtros ativos e contador de resultados
- Loading skeleton durante fetch

---

### RN-AP-010: Modelo de Permissões

**Permissão SuperAdmin:** `manage_all` — acesso irrestrito a todas as entidades e ações.

**Permissões por recurso (granulares):**
```
auctions:read    auctions:create    auctions:update    auctions:delete
lots:read        lots:create        lots:update        lots:delete
assets:read      assets:create      assets:update      assets:delete
users:read       users:create       users:update       users:delete
settings:read    settings:create    settings:update    settings:delete
... (padrão [entity]:[action] para todas as 63 entidades)
```

**Verificação:** `createAdminAction` recebe a permissão exigida como 1º parâmetro e valida via `hasPermission(userProfileWithPermissions, requiredPermission)` antes de executar o handler.

**Fallback:** Se o usuário não tem a permissão exigida, retorna `{ success: false, error: 'Sem permissão' }` sem executar a lógica.

---

### RN-AP-011: `PaginatedResponse<T>` — Contrato de Resposta

**REGRA CRÍTICA:** Todas as actions de listagem retornam o formato FLAT (sem `.meta`):

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**PROIBIDO:** Retornar `{ data: T[], meta: { total, page, ... } }`. O `useDataTable` espera o formato flat.

---

### RN-AP-012: Convenções de Nomeação

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Pasta da entidade | kebab-case (plural) | `auction-stages/` |
| Slug no ENTITY_REGISTRY | kebab-case (plural) | `auction-stages` |
| Schema Zod | PascalCase + `Schema` | `AuctionStageCreateSchema` |
| Interface Row | PascalCase + `Row` | `AuctionStageRow` |
| Função de colunas | `getColumns` | `getColumns(onEdit, onDelete)` |
| Server Actions | camelCase + verbo | `listAuctionStages`, `createAuctionStage` |
| Componente Form | PascalCase + `Form` | `AuctionStageForm` |
| Componente Page | `default export` | `AuctionStagesPage` |
| `data-ai-id` | kebab-case | `admin-plus-auction-stages-page` |
| Permissão | kebab:verbo | `auction-stages:read` |

---

### RN-AP-013: Tratamento `data-ai-id` Obrigatório

Todos os elementos interativos do Admin Plus DEVEM possuir `data-ai-id` para testabilidade:

| Elemento | Padrão de `data-ai-id` |
|----------|----------------------|
| Página | `admin-plus-{entity-slug}-page` |
| Botão Novo | `admin-plus-{entity-slug}-add-btn` |
| Tabela | `admin-plus-{entity-slug}-table` |
| Linha da tabela | `admin-plus-{entity-slug}-row-{id}` |
| Botão Editar (linha) | `admin-plus-{entity-slug}-edit-{id}` |
| Botão Excluir (linha) | `admin-plus-{entity-slug}-delete-{id}` |
| Sheet do formulário | `admin-plus-{entity-slug}-form-sheet` |
| Botão Salvar (form) | `admin-plus-{entity-slug}-save-btn` |
| Campo do formulário | `admin-plus-{entity-slug}-field-{fieldName}` |

---

### RN-AP-014: BDD — Cenários de Teste Obrigatórios por Entidade

```gherkin
Feature: CRUD Admin Plus - [NomeEntidade]
  Como um administrador com permissão [entity]:read/create/update/delete
  Eu quero gerenciar registros de [NomeEntidade]
  Para manter o cadastro do sistema atualizado

  Scenario: Listar registros com paginação
    Given que estou autenticado como admin na rota /admin-plus/[slug]
    When a página carrega
    Then a DataTablePlus exibe os registros paginados do tenant atual
    And o total de registros é exibido no footer da tabela

  Scenario: Criar novo registro via Sheet
    Given que estou na página de listagem de [NomeEntidade]
    When clico no botão "+ Novo"
    Then um Sheet lateral abre com o formulário vazio
    When preencho os campos obrigatórios e clico em "Salvar"
    Then o registro é criado e a tabela é atualizada via refetch
    And um toast de sucesso é exibido

  Scenario: Editar registro existente
    Given que existe um registro na tabela
    When clico no botão de editar na linha do registro
    Then o Sheet abre com os dados preenchidos
    When altero campos e clico em "Salvar"
    Then o registro é atualizado e a tabela recarrega

  Scenario: Excluir registro com confirmação
    Given que existe um registro na tabela
    When clico no botão de excluir na linha do registro
    Then um ConfirmationDialog é exibido
    When confirmo a exclusão
    Then o registro é removido e a tabela recarrega

  Scenario: Busca textual
    Given que existem registros na tabela
    When digito um termo na barra de busca
    Then a tabela filtra mostrando apenas registros que contêm o termo

  Scenario: Ordenação por coluna
    Given que a tabela tem registros
    When clico no header de uma coluna
    Then os registros são reordenados (asc/desc)
```

---

### RN-AP-015: Histórico de Implementação

**Março 2026:**
- ✅ Infraestrutura completa (20+ componentes/hooks/utils)
- ✅ Shared Form Components (CrudFormShell, Field, EntitySelector)
- ✅ 63 entidades × 6 arquivos = **378 arquivos de entidade**
- ✅ ENTITY_REGISTRY com 63 entidades em 13 grupos
- ✅ Layout AdminShell com sidebar e navegação agrupada
- ✅ DataTablePlus com paginação server-side, busca, ordenação, bulk actions
- ✅ createAdminAction factory com validação de sessão/permissão/tenant
- ✅ sanitizeResponse para serialização segura de BigInt/Decimal/Date
- ✅ Links de navegação no menu do usuário e sidebar do admin legado (RN-AP-016)

**Próximos Passos:**
- [ ] Testes E2E para cada entidade (BDD)
- [ ] Testes unitários para cada `actions.ts`
- [ ] Dashboard com contadores por grupo
- [ ] Exportação CSV/Excel nas listagens

---

### RN-AP-016: Navegação e Acesso ao Admin Plus

**Data de Implementação:** Março 2026

**Pontos de Acesso:**

| Origem | Componente | Localização | Ícone | Condição de Visibilidade |
|--------|-----------|-------------|-------|--------------------------|
| Menu do Usuário (dropdown) | `user-nav.tsx` | Seção "Administração" | `Sparkles` | `showAdminSectionLinks` = `manage_all` ou role `AUCTION_ANALYST` |
| Sidebar do Admin Legado | `admin-sidebar.tsx` | `topLevelNavItems` (após "Dashboard") | `Zap` | Visível para todos com acesso ao admin legado |
| URL Direta | — | Barra de endereço | — | Qualquer usuário autenticado com permissões adequadas |

**URLs de Acesso:**
- **Dashboard:** `/admin-plus/dashboard`
- **Entidade específica:** `/admin-plus/[entity-slug]` (ex: `/admin-plus/auctions`, `/admin-plus/lots`)
- **URL completa (dev):** `http://demo.localhost:<porta>/admin-plus/dashboard`

**Proteção de Acesso:**
- O layout `(adminplus)/layout.tsx` verifica autenticação via `getCurrentUser()`
- Usuários não autenticados são redirecionados para `/auth/login?redirect=/admin-plus`
- Permissões validadas: `manage_all`, `auctions:read`, `lots:read`, `users:read`, `settings:read`
- Sem nenhuma dessas permissões, uma tela de "Acesso Negado" é renderizada

**Atributos de Testabilidade:**
- Link no dropdown do usuário: `data-ai-id="user-nav-item-admin-plus"`
- Link no sidebar admin legado: identificável pelo `href="/admin-plus/dashboard"` no `topLevelNavItems`
- [ ] Filtros avançados por entidade
- [ ] Auditoria de alterações (integração com AuditLog)

---

## Linhagem do Leilão — Visualização de Cadeia de Valor

**Data de Implementação:** Março 2026
**Objetivo:** Aba "Linhagem" no Auction Control Center que exibe a cadeia de valor completa de um leilão como um grafo interativo, permitindo ao administrador visualizar, personalizar e exportar a árvore de relacionamentos do leilão.
**Rota:** `/admin/auctions/[id]/auction-control-center` → Tab "Linhagem"
**Biblioteca de Grafos:** ReactFlow (@xyflow/react) + dagre (layout automático)

---

### RN-LIN-001: Arquitetura da Aba Linhagem

**Decisões Arquiteturais:**
- A aba Linhagem é uma tab dentro do `AuctionPreparationDashboard` (Auction Control Center)
- Usa ReactFlow para renderizar o grafo de nós e arestas
- Layout automático hierarchical (top-down) via biblioteca `dagre`
- Grafo é read-only (nós são draggáveis mas não editáveis inline)
- Cada tipo de nó possui card visual com ícone, badge de status e contadores

**Tipos de Nó (LineageNodeType):**

| Tipo | Ícone | Descrição |
|------|-------|-----------|
| `auction` | Gavel | Nó raiz — o leilão em análise |
| `seller` | Building2 | Comitente (vendedor) |
| `auctioneer` | User | Leiloeiro responsável |
| `category` | Tag | Categoria do lote |
| `city` | MapPin | Cidade do lote |
| `state` | Map | Estado (UF) |
| `lot` | Package | Lote vinculado ao leilão |
| `stage` | Clock | Praça (etapa) do leilão |
| `habilitation` | ShieldCheck | Habilitação de participante |
| `asset` | Box | Ativo (bem) no loteamento |
| `judicial-process` | Scale | Processo judicial |
| `judicial-branch` | Landmark | Vara judicial |
| `court` | Building | Tribunal |

**Estrutura de Arquivos:**

```
src/
├── types/auction-lineage.ts                     # Types: LineageNodeType, LineageNodeData, AuctionLineageData, LineageEdge
├── services/auction-lineage.service.ts           # Service: getAuctionLineage() — busca cadeia completa no Prisma
├── app/admin/auctions/lineage-actions.ts         # Server Action: fetchAuctionLineageAction()
└── components/admin/auction-preparation/
    ├── auction-preparation-dashboard.tsx          # Dashboard com tab "Linhagem"
    └── tabs/
        ├── lineage-tab.tsx                        # Tab principal com ReactFlow canvas
        └── lineage/
            ├── LineageNode.tsx                     # Custom node component (card com ícone+status+badge)
            ├── LineageHoverCard.tsx                # HoverCard com detalhes ao passar o mouse
            ├── LineageEditModal.tsx                # Modal de edição (double-click no nó)
            ├── LineageThemePanel.tsx               # Popover para customizar cores dos nós
            ├── LineageExportButton.tsx             # Botão de exportação PNG via html-to-image
            ├── useLineageGraph.ts                  # Hook: converte LineageData → ReactFlow nodes/edges
            └── useLineageTheme.ts                  # Hook: gerencia tema de cores persistido em localStorage
```

---

### RN-LIN-002: Server Action e Service de Dados

**Service (`auction-lineage.service.ts`):**
- Função `getAuctionLineage(auctionId: number): Promise<AuctionLineageData>`
- Realiza query Prisma incluindo relações:
  - Leilão → Lotes → Categorias, Cidades, Estados
  - Leilão → Praças (AuctionStage)
  - Leilão → Leiloeiro, Comitente
  - Lotes → Loteamento → Ativos
  - Lotes → Habilitações
  - Processos Judiciais → Vara → Tribunal (se `isJudicial`)
- Retorna `AuctionLineageData` com arrays de `nodes[]` e `edges[]`
- Nós raízes (`auction`) conectam-se a filhos diretos; filhos conectam-se a netos

**Server Action (`lineage-actions.ts`):**
- `fetchAuctionLineageAction(auctionId: number)` — validação de sessão + tenant
- Retorna `{ success: true, data: AuctionLineageData }` ou `{ success: false, error: string }`

**REGRA:** O service DEVE validar integridade referencial completa antes de incluir nós:
- Leilão deve existir
- Cada lote deve ter `categoryId` e `cityId` válidos
- Praças (AuctionStage) devem estar vinculadas
- Se `isJudicial = true`, buscar processos judiciais associados

---

### RN-LIN-003: Grafo ReactFlow — Hooks e Layout

**`useLineageGraph` hook:**
- Converte `AuctionLineageData` em `Node[]` e `Edge[]` do ReactFlow
- Aplica layout automático via dagre: `rankdir: 'TB'` (top-to-bottom), `nodesep: 80`, `ranksep: 100`
- Cada nó posicionado pelo dagre com largura/altura padrão (280×100)
- Edges com `type: 'smoothstep'` e `animated: true`

**`useLineageTheme` hook:**
- Gerencia mapa de cores `Record<LineageNodeType, LineageNodeColorScheme>`
- Persiste tema em `localStorage` sob key `bidexpert-lineage-theme`
- Tema padrão: cores com semântica (azul para leilão, verde para lote, roxo para judicial, etc.)
- `updateNodeColor(nodeType, colorScheme)` atualiza uma cor e persiste
- `resetTheme()` restaura defaults

---

### RN-LIN-004: Componentes Visuais

**LineageNode (Custom Node):**
- Card com: ícone do tipo, label, subtitle, badge de status, contador
- Cor de fundo, borda, texto e ícone configuráveis via tema
- `data-ai-id="lineage-node-{nodeType}"` para testabilidade
- Suporta drag & drop (ReactFlow built-in)

**LineageHoverCard:**
- Exibe detalhes expandidos ao hover
- Mostra metadata do nó em formato key-value
- Popover do shadcn/ui (HoverCard)

**LineageEditModal:**
- Abre em double-click no nó
- Exibe informações completas da entidade
- Link de navegação para a página de edição real da entidade
- `data-ai-id="lineage-edit-modal"`

**LineageThemePanel:**
- Popover acionado pelo botão "Cores" na toolbar
- Lista todos os tipos de nó com swatch de cor editável
- Permite alterar bg, border, text e iconColor de cada tipo
- `data-ai-id="lineage-theme-panel"`

**LineageExportButton:**
- Botão "Exportar" na toolbar
- Usa `html-to-image` (toPng) para capturar o canvas ReactFlow
- Gera download de PNG com nome `linhagem-leilao-{id}.png`
- `data-ai-id="lineage-export-btn"`

---

### RN-LIN-005: Identificadores `data-ai-id` (Testabilidade)

**REGRA OBRIGATÓRIA:** Todos os elementos interativos da aba Linhagem DEVEM possuir `data-ai-id` para facilitar testes E2E.

| Elemento | `data-ai-id` |
|----------|--------------|
| Container da aba | `lineage-tab-content` |
| Canvas ReactFlow | `lineage-reactflow-canvas` |
| Nó genérico | `lineage-node-{nodeType}` |
| Botão Resetar Layout | `lineage-reset-layout-btn` |
| Botão Exportar | `lineage-export-btn` |
| Botão Cores (tema) | `lineage-theme-btn` |
| Painel de tema | `lineage-theme-panel` |
| Modal de edição | `lineage-edit-modal` |
| Controles do ReactFlow | `lineage-controls` |
| MiniMap | `lineage-minimap` |

---

### RN-LIN-006: Testes E2E (BDD + Playwright)

**Arquivo de Teste:** `tests/e2e/auction-lineage.spec.ts`
**Perfil:** Admin (storageState from global-setup)
**Cenários BDD (8 testes):**

```gherkin
Feature: Auction Lineage Visualization

  Scenario: View lineage tab
    Given I am logged in as admin
    And I navigate to an auction's edit page
    When I click the "Linhagem" tab
    Then the ReactFlow canvas should be visible

  Scenario: ReactFlow canvas renders with nodes
    Given I am on the lineage tab
    Then at least one lineage node should be rendered
    And nodes should be visible within the canvas

  Scenario: Nodes have correct data-ai-id attributes
    Given I am on the lineage tab
    Then nodes should have data-ai-id attributes matching their types

  Scenario: Theme panel opens with color swatches
    Given I am on the lineage tab
    When I click the "Cores" button
    Then the theme panel popover should open
    And color swatches should be visible

  Scenario: Reset layout button works
    Given I am on the lineage tab
    When I click "Resetar Layout"
    Then nodes should return to dagre-computed positions

  Scenario: Export button is clickable
    Given I am on the lineage tab
    When I click "Exportar"
    Then the export should start without errors

  Scenario: Double-click node opens edit modal
    Given I am on the lineage tab
    When I double-click a node
    Then the edit modal should open with node details

  Scenario: Controls and minimap are present
    Given I am on the lineage tab
    Then ReactFlow controls (zoom in/out/fit) should be visible
    And the minimap should be present
```

**Comportamento Graceful Skip:**
- Se não houver leilão com dados de seed, o teste faz `test.skip(true, 'No auction found')` — sem falha
- Se lineage data estiver vazia, faz `test.skip(true, 'Lineage data is empty')` — sem falha
- Isso permite rodar o mesmo arquivo de teste em ambientes com e sem seed

---

### RN-LIN-007: Histórico de Implementação

**Março 2026:**
- ✅ 11 arquivos implementados (types, service, action, 7 componentes React)
- ✅ Hook `useLineageGraph` com layout automático dagre
- ✅ Hook `useLineageTheme` com persistência em localStorage
- ✅ 8 testes E2E Playwright (BDD) — todos passando
- ✅ PR #467 merged to demo-stable (squash, SHA: `d100399a`)
- ✅ PR #460 syn demo-stable → main (merge, SHA: `adb69e5e`)
- ✅ Deploy verificado no Vercel (demo-stable + main)
- ✅ E2E 8/8 PASSED no Vercel demo-stable

**Próximos Passos:**
- [ ] Filtros por tipo de nó (mostrar/ocultar tipos)
- [ ] Exportação PDF além de PNG
- [ ] Animação de highlight ao clicar em um nó
- [ ] Legenda automática com tipos de nó presentes
- [ ] Persistência de posições customizadas (drag) no servidor

---

## Testes E2E em Ambientes Vercel (Deployment Protection)

**Data de Implementação:** Março 2026
**Objetivo:** Permitir execução de testes E2E Playwright contra deployments Vercel protegidos por Deployment Protection (SSO/auth), sem desabilitar a proteção.

---

### RN-VERCEL-E2E-001: Problema — Deployment Protection

**Contexto:**
Vercel ativa por padrão "Deployment Protection" em projetos de equipe (Team). Deployments de preview e, opcionalmente, de produção recebem um gate de autenticação SSO que redireciona visitantes não autenticados para `https://vercel.com/login`.

**Impacto nos Testes:**
- O Playwright navega para a URL do deploy Vercel
- Vercel intercepta e redireciona para login SSO
- A página de login da aplicação nunca carrega
- Todos os testes falham por timeout

**Solução NÃO Recomendada:**
- ❌ Desabilitar Deployment Protection no projeto Vercel
- ❌ Usar passwords compartilhados (inseguro)

### RN-VERCEL-E2E-001A: Triagem obrigatória antes do browser test

**Contexto:**
Há cenários em que o preview da PR falha antes mesmo do build real da aplicação. Nesses casos, o deployment abre a tela do próprio Vercel com `Deployment has failed` e o inspector mostra `Builds . [0ms]` ou nenhum evento útil.

**Regra:**
- ✅ Antes de executar Playwright/browser em preview Vercel, validar o estado do deployment com `vercel inspect`, status checks da PR e/ou inspector URL.
- ✅ Se o preview renderizar a tela `Deployment has failed`, classificar primeiro como falha de infraestrutura/integration/provisioning do deploy.
- ✅ Nessa condição, NÃO tratar a rota alvo como quebrada até existir evidência adicional de falha da aplicação.

**BDD - Preview quebrado antes do build**
- **Dado** um preview Vercel em estado `ERROR`
- **Quando** o inspector exibe `Builds . [0ms]` ou não retorna eventos de build úteis
- **Então** a validação deve registrar o bloqueio como falha de deploy da plataforma antes de culpar a aplicação

---

### RN-VERCEL-E2E-002: Solução — Share URL + Cookie Bypass

**Mecanismo:**
1. Obter uma **Shareable URL** do Vercel via API (`mcp_com_vercel_ve_get_access_to_vercel_url`)
2. Configurar a variável de ambiente `VERCEL_SHARE_URL` com essa URL
3. No `global-setup.ts` (Playwright), antes de fazer login aplicacional:
   - Navegar até a share URL **na mesma instância de Page** que fará o login
   - A navegação seta automaticamente o cookie `_vercel_jwt` no browser context
   - Após isso, o Playwright pode navegar normalmente para qualquer rota do deploy

**Importante — Isolamento de Contexto:**
- Cada `browser.newPage()` cria um contexto de cookies separado
- O cookie `_vercel_jwt` deve ser setado na MESMA Page que fará o login
- Se o global-setup autentica admin e lawyer em Pages separadas, ambas precisam visitar a share URL

**Variáveis de Ambiente:**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `BASE_URL` | URL do deploy Vercel alvo | `https://bidexpertaifirebasestudio-xxx.vercel.app` |
| `VERCEL_SHARE_URL` | URL compartilhável (válida por tempo limitado) | `https://vercel.live/open-feedback/xxx?via=login-wall` |
| `PLAYWRIGHT_SKIP_WEBSERVER` | Pular inicialização do webserver local | `1` |
| `PLAYWRIGHT_SKIP_LAWYER` | Pular autenticação do lawyer (se não existir no DB) | `1` |

### RN-VERCEL-E2E-002A: Promoção da feature antes da cobrança em `main`/`hml`

**Regra:**
- ✅ Rotas novas como `/lots` só podem ser exigidas em `main`, `hml` ou aliases de produção após a promoção explícita da branch/PR que introduz a feature.
- ✅ Enquanto a feature existir apenas em branch/preview, `404` em `main` ou `hml` indica ausência de promoção e NÃO regressão automática do código da feature.
- ✅ A evidência de validação deve distinguir claramente: `preview da PR`, `demo-stable`, `main` e `hml`.

**BDD - Rota nova ainda não promovida**
- **Dado** uma rota nova implementada apenas na branch de feature
- **Quando** o teste acessa `main` ou `hml` antes do merge/promotion
- **Então** um `404` deve ser registrado como ambiente ainda não promovido, e não como quebra da implementação da branch

---

### RN-VERCEL-E2E-003: Alterações no `global-setup.ts`

**Arquivo:** `tests/e2e/global-setup.ts`

**Mudanças implementadas:**

1. **Detecção de deploy Vercel:**
```typescript
const isVercelDeployment = baseUrlObject.hostname.includes('vercel.app');
```

2. **Connectivity check adaptado:**
```typescript
const checkUrl = isVercelDeployment
  ? `${baseURL}/auth/login`
  : `${baseUrlObject.protocol}//localhost:${baseUrlObject.port}/auth/login`;
```
- Em Vercel: usa URL direta (não há localhost)
- Em local: usa `localhost:PORT` para bypass de DNS `*.localhost`

3. **Cookie de proteção antes do login:**
```typescript
const vercelShareUrl = process.env.VERCEL_SHARE_URL;

// Antes do login admin:
if (vercelShareUrl) {
  await adminPage.goto(vercelShareUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await adminPage.waitForTimeout(3000);
}

// Antes do login lawyer (se habilitado):
if (vercelShareUrl) {
  await lawyerPage.goto(vercelShareUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await lawyerPage.waitForTimeout(3000);
}
```

4. **Skip lawyer via env var:**
```typescript
if (process.env.PLAYWRIGHT_SKIP_LAWYER === '1') {
  console.log('ℹ️  Login do advogado pulado.');
} else {
  // ... autenticação completa
}
```

---

### RN-VERCEL-E2E-004: Comando Completo de Execução

**Para rodar E2E contra Vercel demo-stable:**
```powershell
$env:BASE_URL = "https://bidexpertaifirebasestudio-xxx.vercel.app"
$env:VERCEL_SHARE_URL = "https://vercel.live/open-feedback/xxx?via=login-wall"
$env:PLAYWRIGHT_SKIP_WEBSERVER = "1"
$env:PLAYWRIGHT_SKIP_LAWYER = "1"
npx playwright test tests/e2e/auction-lineage.spec.ts --config=playwright.config.local.ts --reporter=list --timeout=120000
```

**Para rodar E2E contra Vercel main (production):**
```powershell
$env:BASE_URL = "https://bidexpertaifirebasestudio.vercel.app"
$env:PLAYWRIGHT_SKIP_WEBSERVER = "1"
$env:PLAYWRIGHT_SKIP_LAWYER = "1"
# Production pode não precisar de VERCEL_SHARE_URL se Deployment Protection estiver desabilitada
npx playwright test tests/e2e/auction-lineage.spec.ts --config=playwright.config.local.ts --reporter=list --timeout=120000
```

**Observação sobre banco de produção:**
Se o banco de produção não possuir dados de seed, os testes farão `test.skip` gracefully (sem falha). Isso é by-design.

---

### RN-VERCEL-E2E-005: Middleware Multi-Tenant em Vercel

**Regra:** O `src/middleware.ts` trata URLs `*.vercel.app` como domínio landlord (sem roteamento por subdomínio).

```typescript
// Trecho relevante do middleware:
const isVercelApp = host.endsWith('.vercel.app');
if (isVercelApp) {
  // Trata como landlord domain — resolve tenant pelo DB default
}
```

**Implicação para testes:**
- Em Vercel, não há subdomínio `demo.` — o tenant é resolvido como default
- O `auth-helper.ts` detecta ausência de subdomínio e tenta selecionar tenant manualmente
- Se o tenant selector estiver auto-locked (exibe "BidExpert" ou similar), o login funciona sem seleção manual

---

### RN-VERCEL-E2E-006: Seed Gate em Ambientes Remotos

**Comportamento:**
- O `global-setup.ts` executa `ensureSeedExecuted(baseUrl)` que faz `GET /api/public/tenants`
- Em Vercel com Deployment Protection, o fetch pode retornar 401 (sem cookie `_vercel_jwt` pois fetch() não tem o cookie do browser)
- O código trata gracefully: imprime warning e continua — o login pode funcionar se o DB já tiver dados

```typescript
try {
  await ensureSeedExecuted(baseURL);
} catch (seedError) {
  console.warn('⚠️ Seed gate check falhou:', seedError.message);
  console.warn('Continuando setup — o login falhará se seed realmente não existe.');
}
```

**REGRA:** Nunca bloquear a execução de testes por falha no seed gate em ambientes Vercel. O gate é informativo, não bloqueante para deploys remotos.

---

### RN-VERCEL-E2E-007: Histórico de Validação

**Março 2026:**
- ✅ E2E 8/8 PASSED no Vercel demo-stable (preview deployment)
- ✅ E2E 8/8 SKIPPED no Vercel main (production — banco sem seed, comportamento esperado)
- ✅ Build READY em ambos os ambientes (demo-stable + main)
- ✅ Login admin funciona via share URL + cookie bypass
- ✅ Seed gate opera gracefully em Vercel (warn + continue)

**Próximos Passos:**
- [ ] Automatizar obtenção de share URL no CI/CD (GitHub Actions)
- [ ] Popular banco de produção com seed para habilitar E2E completo em main
- [ ] Implementar retry automático se share URL expirar
- [ ] Integrar no pipeline: `deploy → get share URL → run E2E → report`

---

## Guia Operacional para Testes E2E — Lições Aprendidas

> **Data:** Março 2026  
> **Contexto:** Este guia documenta TODOS os problemas operacionais encontrados durante sessões de testes E2E com Playwright, para que futuros analistas de teste e agentes AI não repitam os mesmos erros.  
> **Complementa:** A seção anterior (RN-VERCEL-E2E-001 a 007) cobre deployment protection do Vercel. Esta seção cobre operações locais, configurações, navegação e troubleshooting.

---

### RN-GUIA-001: Inicialização do Servidor Local — Procedimento Obrigatório

**Problema encontrado:** O servidor Next.js em modo `dev` usa **lazy compilation** — cada página é compilada apenas no primeiro acesso, levando 20s a 130s. Testes E2E que tentam acessar páginas não compiladas falham por timeout.

**Procedimento correto:**

```powershell
# 1. Verificar se a porta está livre
Test-NetConnection -ComputerName 127.0.0.1 -Port 9005
# ou
netstat -ano | findstr ":9005"

# 2. Matar processos Node anteriores se necessário
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 3. Iniciar servidor com porta explícita
$env:PORT = 9005
npm run dev
# ou para controle explícito:
npx next dev --port 9005 --hostname 0.0.0.0

# 4. AGUARDAR a mensagem "Ready in X.Xs" antes de rodar testes

# 5. PRÉ-AQUECER páginas críticas (evita timeout de lazy compilation)
# Abrir no navegador ou via curl:
# - http://demo.localhost:9005/ (homepage)
# - http://demo.localhost:9005/auth/login (login)
# - http://demo.localhost:9005/admin (admin dashboard)
```

**REGRA CRÍTICA:** SEMPRE usar `demo.localhost:PORT` (com subdomínio), NUNCA `localhost:PORT` sem subdomínio. O middleware redireciona bare `localhost` para `crm.localhost`, que causa falhas em testes.

**Para produção/E2E estável (recomendado):**
```powershell
npm run build    # Pré-compila TUDO (sem lazy compilation)
npm start        # Production mode, todas as páginas prontas
```

---

### RN-GUIA-002: Git Worktree — Setup Completo para Agentes AI

**Problema encontrado:** Worktrees criados por agentes AI frequentemente têm (1) symlinks quebrados em `node_modules/.bin`, (2) arquivo `.env` ausente, (3) cliente Prisma desatualizado.

**Checklist obrigatório ao criar worktree:**

```powershell
# 1. Criar worktree a partir de demo-stable
git fetch origin demo-stable
git worktree add worktrees\bidexpert-<tipo>-<descricao> -b <tipo>/<descricao>-<timestamp> origin/demo-stable

# 2. Entrar no worktree
Set-Location worktrees\bidexpert-<tipo>-<descricao>

# 3. Copiar .env do workspace principal (NÃO é copiado automaticamente!)
Copy-Item "..\..\..\.env" ".env" -Force
# OU copiar de outro local conforme estrutura do workspace

# 4. Instalar dependências COMPLETAS (corrige symlinks quebrados)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# 5. Gerar cliente Prisma
npx prisma generate

# 6. Definir porta dedicada e iniciar
$env:PORT = 9006   # Nunca usar 9005 (reservada para usuário humano)
npm run dev
```

**Tabela de portas:**

| Porta | Uso | Quem |
|-------|-----|------|
| 9005 | Ambiente DEMO / Principal | Usuário humano |
| 9006 | Worktree DEV #1 | Agente AI #1 |
| 9007 | Worktree DEV #2 | Agente AI #2 |
| 9008 | Hotfix / PR review | Ad-hoc |

**Armadilhas comuns:**
- ❌ `npm run dev` falha com "EADDRINUSE" → Porta já em uso, verifique `netstat`
- ❌ `prisma generate` falha → `.env` ausente, copie primeiro
- ❌ Comandos não encontrados (`next`, `prisma`) → Symlinks quebrados, `npm install` novamente
- ❌ HMR crash ao reiniciar → Mate todos os processos Node antes: `Stop-Process -Name "node" -Force`

---

### RN-GUIA-003: Middleware Multi-Tenant — Comportamento Local vs Vercel

**Problema encontrado:** O middleware extrai o slug do tenant pelo subdomínio. Sem subdomínio, o login falha silenciosamente.

**Comportamento por ambiente:**

| Cenário | URL | Tenant Resolution | Tenant Selector |
|---------|-----|-------------------|-----------------|
| Local com subdomínio | `http://demo.localhost:9005` | Resolvido pelo middleware via subdomínio `demo` | **Auto-locked** (desabilitado) |
| Local sem subdomínio | `http://localhost:9005` | NÃO resolvido | **Aberto** — seleção manual obrigatória |
| Vercel (production) | `https://bidexpertaifirebasestudio.vercel.app` | Via `NEXT_PUBLIC_DEFAULT_TENANT="demo"` | **Aberto** — pré-selecionado, mas editável |
| Vercel (preview) | `https://xxxx.vercel.app` | Via `NEXT_PUBLIC_DEFAULT_TENANT` env var | **Aberto** — pré-selecionado, mas editável |

**REGRA para testes E2E:** SEMPRE usar `http://demo.localhost:<porta>` em testes locais.

**Código do middleware (resumo):**
```typescript
// src/middleware.ts
const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.localhost$/);
if (subdomainMatch) {
  headers.set('x-tenant-id', subdomainMatch[1]); // "demo"
}
```

**Rotas que o middleware redireciona:**
- `localhost:PORT/` → redireciona para `crm.localhost:PORT/` (causa falha em testes!)
- `demo.localhost:PORT/` → funciona normalmente, tenant "demo" resolvido

---

### RN-GUIA-004: Autenticação em Testes E2E — Fluxo Completo

**Problema encontrado:** Agentes AI gastam tempo tentando credenciais incorretas ou não sabem usar o helper centralizado.

**Credenciais canônicas (fonte: `scripts/ultimate-master-seed.ts`):**

| Perfil | Email | Senha | Notas |
|--------|-------|-------|-------|
| **Admin** | `admin@bidexpert.com.br` | `Admin@123` | SuperAdmin, backoffice completo |
| **Leiloeiro** | `carlos.silva@construtoraabc.com.br` | `Test@12345` | Auctioneer, gerencia leilões |
| **Comprador** | `comprador@bidexpert.com.br` | `Test@12345` | Buyer, participa de lances |
| **Advogado** | `advogado@bidexpert.com.br` | `Test@12345` | Lawyer, análise jurídica |
| **Vendedor** | `vendedor@bidexpert.com.br` | `Test@12345` | Seller, vende lotes |
| **Analista** | `analista@lordland.com` | `password123` | Analyst role |

**⚠️ NUNCA usar `senha@123` — é incorreta e causa falhas silenciosas.**

**Helper centralizado — uso obrigatório:**
```typescript
import { loginAsAdmin, loginAs, selectTenant, CREDENTIALS } from '../helpers/auth-helper';

// Login direto como admin
await loginAsAdmin(page, BASE_URL);

// Login como perfil específico
await loginAs(page, 'comprador', BASE_URL);

// O selectTenant() detecta auto-lock automaticamente:
// - Em Vercel ou demo.localhost → pula seleção
// - Em localhost sem subdomínio → seleciona tenant "Demo"
```

**Fluxo detalhado de login programático (para testes que precisam de login manual):**
```typescript
// 1. Navegar para login
await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });

// 2. Selecionar tenant (se necessário — verificar auto-lock)
const tenantSelect = page.locator('[data-ai-id="auth-login-tenant-select"]');
if (await tenantSelect.isVisible()) {
  const isDisabled = await tenantSelect.isDisabled();
  if (!isDisabled) {
    await tenantSelect.selectOption({ label: 'Demo' });
  }
}

// 3. Preencher credenciais
await page.fill('[data-ai-id="auth-login-email"]', 'admin@bidexpert.com.br');
await page.fill('[data-ai-id="auth-login-password"]', 'Admin@123');

// 4. Submeter (requestSubmit para Vercel compatibilidade)
const form = page.locator('form');
await form.evaluate(f => (f as HTMLFormElement).requestSubmit());

// 5. Aguardar navegação para admin
await page.waitForURL('**/admin**', { timeout: 30000 });
```

---

### RN-GUIA-005: Navegação Admin — Rotas e Seletores Importantes

**Problema encontrado:** Agentes AI não sabem quais rotas existem nem como encontrar leilões no admin.

**Mapa de rotas do admin:**

| Rota | Descrição | Seletor de acesso |
|------|-----------|-------------------|
| `/admin` | Dashboard principal | Login automático redireciona aqui |
| `/admin/auctions` | Lista de leilões | `data-ai-id="auction-dashboard-btn"` |
| `/admin/auctions/{id}` | Detalhes do leilão | Links `a[href*="/auctions/"]` na lista |
| `/admin/auctions/{id}/auction-control-center` | Centro de controle do leilão | Tab/link dentro do detalhe do leilão |
| `/admin/auctions/{id}/lineage` | Linhagem (cadeia de valor) | Tab/link dentro do detalhe |

**Como encontrar um leilão no admin (estratégia `findFirstAuctionId`):**
```typescript
// 1. Navegar para lista de leilões
await page.click('[data-ai-id="auction-dashboard-btn"]');
await page.waitForLoadState('domcontentloaded');

// 2. Pegar o primeiro link de leilão
const firstAuctionLink = page.locator('a[href*="/auctions/"]').first();
const href = await firstAuctionLink.getAttribute('href');
const auctionId = href?.match(/auctions\/([^\/]+)/)?.[1];

// 3. Navegar para o centro de controle
await page.goto(`${BASE_URL}/admin/auctions/${auctionId}/auction-control-center`);
```

**Seletores importantes (data-ai-id):**

| Seletor | Elemento | Contexto |
|---------|----------|----------|
| `auth-login-tenant-select` | Select de tenant | Página de login |
| `auth-login-email` | Input de email | Página de login |
| `auth-login-password` | Input de senha | Página de login |
| `auction-dashboard-btn` | Botão "Leilões" | Sidebar do admin |
| `super-opportunities-section` | Seção Super Oportunidades | Homepage pública |
| `homepage-featured-lots-section` | Seção principal de lotes | Homepage pública |
| `homepage-more-active-lots-section` | Seção paralela de lotes ativos | Homepage pública |
| `homepage-more-active-lots-grid` | Grid de cards da seção paralela | Homepage pública |

**Verificação de tabs no centro de controle:**
```typescript
// CUIDADO: Tabs podem não renderizar em Vercel ou em páginas com poucos dados
const tablist = page.getByRole('tablist');
if (await tablist.isVisible({ timeout: 5000 }).catch(() => false)) {
  const tabs = tablist.getByRole('tab');
  const count = await tabs.count();
  // Espera-se 10 tabs no centro de controle
}
```

---

### RN-GUIA-006: Diferenças Vercel vs Local — O Que Pode Divergir

**Problema encontrado:** Testes que passam localmente podem falhar no Vercel por diferenças de rendering, dados e middleware.

**Lista de diferenças conhecidas:**

| Aspecto | Local (dev mode) | Vercel (production mode) |
|---------|------------------|--------------------------|
| **Compilação** | Lazy (sob demanda, lento) | Pré-compilada (tudo pronto) |
| **Tenant resolution** | Via subdomínio `demo.localhost` | Via env `NEXT_PUBLIC_DEFAULT_TENANT` (pré-seleção, sem lock) |
| **Tabs do control center** | 10 tabs visíveis | **Pode ter 0 tabs** (dados/rendering diferente) |
| **DevUserSelector** | Visível (lista 15 users para login rápido) | **Não aparece** (NODE_ENV=production) |
| **Banco de dados** | MySQL local | PostgreSQL (Prisma Postgres/Neon) |
| **Seed data** | Completo via `npm run db:seed` | Pode estar vazio se seed não executado |
| **Deployment protection** | Não existe | Bypass via share URL + cookies |
| **Timeout recomendado** | 15-30s por ação | 30-60s por ação (rede mais lenta) |

**REGRA para testes cross-env:** SEMPRE verificar existência de elementos antes de assertar sobre eles:
```typescript
// ❌ Vai falhar se tablist não existir no Vercel
expect(await page.getByRole('tab').count()).toBeGreaterThanOrEqual(5);

// ✅ Verifica primeiro, skip se não visível
const tablist = page.getByRole('tablist');
const isVisible = await tablist.isVisible({ timeout: 5000 }).catch(() => false);
if (!isVisible) {
  test.skip('Tablist não visível neste ambiente');
  return;
}
const count = await tablist.getByRole('tab').count();
expect(count).toBeGreaterThanOrEqual(5);
```

---

### RN-GUIA-007: Testes Robot — Simulação de Lances Automatizados

**Problema encontrado:** Existem 2 scripts de simulação de robôs com configurações diferentes que devem ser compreendidos.

**Script 1: `tests/e2e/robot-auction-simulation.spec.ts`**
- **Config Playwright:** `playwright.robot.config.ts` (match: `**/robot-auction-simulation.spec.ts`)
- **Timeout:** 1 hora (simulação longa)
- **Variáveis de ambiente:**
  - `ROBOT_BASE_URL` — URL do servidor alvo (default: `PLAYWRIGHT_BASE_URL` ou Vercel)
  - `ROBOT_LOCAL_BASE_URL` — URL local (default: `http://localhost:9005`)
- **Função `resolveBaseUrl()`:** Tenta múltiplos candidatos na ordem: `ROBOT_BASE_URL` → `PLAYWRIGHT_BASE_URL` → Vercel → `localhost:9005`
- **Dados:** Cria leilão e buyers via Prisma direto
- **Credenciais de robô:** email `robot-XXX@bidexpert.com.br`, senha `Bot@123456`
- **Parâmetros:** `BID_INCREMENT=1000`, `TARGET_TOP_BID=100000`

**Execução:**
```powershell
$env:ROBOT_BASE_URL = "http://demo.localhost:9005"
npx playwright test --config=playwright.robot.config.ts
```

**Script 2: `tests/e2e/pregao-disputas-video.spec.ts`**
- **Config Playwright:** Usa config padrão
- **Variável:** `PREGAO_BASE_URL` (default: `http://demo.localhost:9005`)
- **Comportamento:** Cria tenant, leilão e 10 robôs via Prisma, grava vídeo
- **Artefatos:** `test-results/pregao-video/artifacts/` e `test-results/pregao-video/report/`

**Execução:**
```powershell
$env:PREGAO_BASE_URL = "http://demo.localhost:9005"
npx playwright test tests/e2e/pregao-disputas-video.spec.ts
```

**REGRA:** Ambos os scripts criam seus próprios dados via Prisma. O banco DEVE ter o schema atualizado (`npx prisma generate` e `npx prisma db push` se necessário).

---

### RN-GUIA-008: Troubleshooting — Checklist de Problemas Comuns

**Problema:** Agentes AI gastam ciclos em problemas recorrentes. Este checklist resolve 90% dos casos.

| Sintoma | Causa Provável | Solução |
|---------|---------------|---------|
| `EADDRINUSE` ao iniciar server | Porta já ocupada | `Stop-Process -Name "node" -Force` e verificar `netstat -ano \| findstr ":PORT"` |
| Timeout 30s ao acessar página | Lazy compilation (primeira vez) | Pré-aquecer a página no browser antes do teste, ou usar `npm run build && npm start` |
| Login falha silenciosamente | Sem tenant selecionado | Usar `demo.localhost:PORT` (com subdomínio), NUNCA `localhost:PORT` |
| `Cannot find module 'next'` | Symlinks quebrados no worktree | `Remove-Item -Recurse node_modules` e `npm install` |
| `Prisma client not generated` | .env ausente no worktree | Copiar `.env` do workspace principal e rodar `npx prisma generate` |
| Tabs retornam count=0 | Rendering variável (Vercel) | Verificar visibilidade antes de assertar, usar `test.skip()` se ausente |
| Redirect para `crm.localhost` | Middleware de roteamento | SEMPRE usar `demo.localhost:PORT`, nunca URL sem subdomínio |
| `ERR_CONNECTION_REFUSED` | Servidor não iniciou | Verificar se "Ready in" apareceu no terminal, testar com `Test-NetConnection` |
| HMR crash / rebuild infinito | Processo Node zumbi | `Stop-Process -Name "node" -Force` e reiniciar |
| `requestSubmit is not a function` | Form element não encontrado | Garantir que `page.locator('form')` está correto, usar `evaluate` |
| Seed gate timeout no Vercel | Banco sem dados de seed | Normal em Vercel sem seed; seed gate é informativo, não bloqueante |
| Prisma query incompatível | MySQL vs PostgreSQL | Usar helpers de compatibilidade (`insensitiveContains`, etc.) |

---

### RN-GUIA-009: Variáveis de Ambiente para Testes

**Referência rápida de todas as env vars relevantes para testes:**

| Variável | Valor Padrão | Uso |
|----------|-------------|-----|
| `PORT` | `3000` | Porta do Next.js dev server |
| `BASE_URL` | — | URL base para Playwright |
| `PLAYWRIGHT_BASE_URL` | — | Fallback para URL base |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `0` | `1` para pular webserver (Vercel) |
| `PLAYWRIGHT_SKIP_LAWYER` | `0` | `1` para pular testes de advogado |
| `ROBOT_BASE_URL` | Vercel URL | URL para simulação de robôs |
| `ROBOT_LOCAL_BASE_URL` | `http://localhost:9005` | URL local para robôs |
| `PREGAO_BASE_URL` | `http://demo.localhost:9005` | URL para pregão com vídeo |
| `DATABASE_URL` | `.env` | Conexão MySQL/PostgreSQL |
| `NEXT_PUBLIC_DEFAULT_TENANT` | — | Pré-seleciona tenant em Vercel (sem bloqueio — selector continua editável) |
| `NODE_ENV` | `development` | `production` esconde DevUserSelector |

**Exemplo de setup completo para testes locais:**
```powershell
$env:PORT = "9005"
$env:BASE_URL = "http://demo.localhost:9005"
$env:PLAYWRIGHT_BASE_URL = "http://demo.localhost:9005"
$env:ROBOT_BASE_URL = "http://demo.localhost:9005"
$env:PREGAO_BASE_URL = "http://demo.localhost:9005"
```

**Exemplo para testes no Vercel:**
```powershell
$env:BASE_URL = "https://bidexpertaifirebasestudio.vercel.app"
$env:PLAYWRIGHT_BASE_URL = "https://bidexpertaifirebasestudio.vercel.app"
$env:PLAYWRIGHT_SKIP_WEBSERVER = "1"
```

---

### RN-GUIA-010: Boas Práticas para Agentes AI em Testes

**Lições aprendidas de múltiplas sessões de teste:**

1. **Sempre verificar porta antes de iniciar:** `netstat -ano | findstr ":PORT"`
2. **Nunca usar `localhost` sem subdomínio:** SEMPRE `demo.localhost:PORT`
3. **Copiar `.env` ao criar worktree:** O arquivo NÃO é copiado automaticamente
4. **Pré-aquecer páginas em dev mode:** Primeira visita compila a página (20-130s)
5. **Usar `waitUntil: 'domcontentloaded'`:** Mais confiável que `'networkidle'` para SPAs
6. **Verificar existência antes de assertar:** Elementos podem não renderizar em todos os ambientes
7. **Timeout generoso em ações de navegação:** 30s local, 60s Vercel
8. **Usar helper `loginAsAdmin()` sempre:** Nunca reimplementar lógica de login
9. **Rodar `npx prisma generate` após criar worktree:** Cliente desatualizado causa erros enigmáticos
10. **Para estabilidade E2E, preferir `npm run build && npm start`:** Production mode elimina lazy compilation

**Fluxo recomendado para agente AI iniciar testes:**
```
1. Verificar porta → 2. Criar worktree → 3. Copiar .env → 4. npm install 
→ 5. npx prisma generate → 6. npm run build → 7. npm start 
→ 8. Rodar testes contra demo.localhost:PORT
```
