# REGRAS DE NEGÓCIO E ESPECIFICAÇÕES - BIDEXPERT
## Documento Consolidado e Oficial

**Data:** 13 de Dezembro de 2025  
**Status:** ✅ Atualizado com implementações de Dezembro/2025 (incluindo ParticipantCard)  
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

### RN-016: Setup Gate Obrigatório
Bloquear acesso a rotas protegidas quando `isSetupComplete=false`  
Exigir verificação de `isSetupComplete` em `layout.tsx` com fallback seguro  
Adicionar teste de regressão para impedir loops/redirects indevidos

### RN-017: Elegibilidade para Lance e Arremate
Usuário só pode lançar se: estiver autenticado, habilitado no leilão, KYC/documentos aprovados (quando aplicável), termos aceitos  
Ao tentar lançar sem elegibilidade: exibir modal com checklist e CTAs para completar  
Arremate/checkout exige método de pagamento válido e endereço confirmado

### RN-018: Consistência Multi-Tenant em Navegação
Todos os links/rotas geradas devem carregar `tenantId` do contexto  
Services e Server Actions validam `tenantId` de sessão vs recurso acessado  
Proibido aceitar `tenantId` vindo do cliente sem validação

### RN-019: Conclusão do Dashboard do Arrematante
Finalizar APIs: `GET/POST /api/bidder/*` para lotes vencidos, pagamentos, notificações, histórico, perfil  
Repositories e services com BigInt  
Seções do dashboard só renderizam quando dados essenciais estiverem carregados (skeletons/spinners)

### RN-020: Fluxo de Publicação de Leilão
`Auction` só pode ir para "Publicado" quando: etapas e datas válidas, lotes associados, regras de mídia atendidas, comitente/leiloeiro vinculados e ativos  
Validar transitions no service com erros descritivos

### RN-021: Padrão de IDs BigInt em Front/Back
Endpoints e services devem aceitar/retornar IDs numéricos  
No frontend, converter string->number com validação e tratar `bigint` quando necessário  
Proibir mix de `cuid()` em novos docs/código

### RN-022: Pesquisa e Listagens Avançadas
🔍 **Componentes Obrigatórios**:  
- `BidExpertFilter` (filtros específicos por entidade)  
- `BidExpertSearchResultsFrame` (tabela com ordenação)  
- `Pagination` com contagem total e seleção de itens por página  
  
🎚️ **Funcionalidades**:  
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

### RN-023: Links Cruzados entre Entidades
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
- **Contadores**: Exibir quantidade total de registros relacionados (ex: "3 Lotes", "5 Ativos")  
- **Isolamento Multi-Tenant**: Todos os filtros respeitam isolamento por `tenantId`  
  
🎯 **UX Guidelines**:  
- **Visual**: Links destacados com ícone de seta ou texto azul sublinhado  
- **Responsivo**: Funcionar em desktop e mobile  
- **Performance**: Lazy loading de contadores quando necessário  
- **Feedback**: Loading states durante navegação  
- **Consistência**: Mesmo padrão visual em todas as tabelas CRUD  

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
**Última atualização:** 18/12/2025  
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
