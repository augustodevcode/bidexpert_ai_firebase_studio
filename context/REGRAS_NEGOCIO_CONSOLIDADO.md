# 📋 REGRAS DE NEGÓCIO E ESPECIFICAÇÕES - BIDEXPERT
## Documento Consolidado e Oficial

**Data:** 27 de Outubro de 2025  
**Status:** ✅ Conflitos Resolvidos - Versão Oficial

---

## 📑 ÍNDICE RÁPIDO
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
- **Frontend:** Next.js 14, React 18, ShadCN/UI, Tailwind CSS
- **Backend:** Node.js, Prisma ORM, MySQL
- **Auth:** NextAuth.js (JWT/OAuth2)
- **AI:** Genkit
- **Validação:** Zod + react-hook-form

### Padrão Arquitetural
```
Controller (Server Action) → Service → Repository → Prisma ORM → MySQL
```

**✅ PADRÃO OFICIAL:** Acesso direto ao Prisma via Services/Repositories
- ❌ NÃO usar Database Adapter Pattern
- ✅ Prisma Client diretamente nos Repositories
- ✅ Lógica de negócio nos Services

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
✅ OBRIGATÓRIO usar `UniversalCard` e `UniversalListItem`  
❌ NÃO importar diretamente `AuctionCard` ou `LotCard`  
✅ Garante consistência visual

### RN-003: Validação de Formulários
✅ Campos obrigatórios com asterisco vermelho (`*`)  
✅ Botão submissão desabilitado enquanto inválido  
✅ Toast de feedback após submissão (nunca falhar silenciosamente)

### RN-004: Endereçamento Unificado
✅ OBRIGATÓRIO usar `AddressGroup.tsx` em formulários com endereço  
✅ Campos estruturados: street, number, cityId, stateId, latitude, longitude  
✅ Busca CEP e mapa integrados

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
⚠️ NÃO exibir por padrão em todos os lotes  
✅ Controlado por prop `showCountdown`  
✅ Apenas em: Carousel "Super Oportunidades" e Modal de pré-visualização

### RN-008: Timeline de Etapas
✅ OBRIGATÓRIO usar `AuctionStagesTimeline.tsx`  
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
- `PlatformSettings.crudEditMode`: `modal` | `sheet` (padrão: `modal`)  
- **Mobile-first**:  
  - `< 768px`: Sempre usar `sheet`  
  - `≥ 768px`: Respeitar configuração do usuário  
- **Transições suaves** entre modos ao redimensionar  
  
📱 **Responsividade**:  
- Sheets devem ocupar 100% da largura em mobile  
- Modais devem ter largura máxima de `90vw` e altura máxima de `90vh`  
- Scroll interno quando conteúdo for maior que a viewport

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

### 1. UniversalCard / UniversalListItem
**Localização:** `src/components/universal-card.tsx`

**Uso:**
```tsx
<UniversalCard type="auction" data={auctionData} showCountdown={true} />
<UniversalCard type="lot" data={lotData} showCountdown={false} />
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

### 5. AuctionStagesTimeline
**Localização:** `src/components/auction/auction-stages-timeline.tsx`

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

---

## FUNCIONALIDADES EM DESENVOLVIMENTO

### 🔧 Bidder Dashboard (Parcialmente Implementado)

**Status:** ⚠️ Em desenvolvimento - Requer finalização

**Modelos Prisma a Criar/Revisar:**
```prisma
model BidderProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  // ... campos adicionais
}

model WonLot {
  id        String   @id @default(cuid())
  lotId     String
  userId    String
  status    WonLotStatus
  // ... campos adicionais
}

model BidderNotification {
  id        String   @id @default(cuid())
  userId    String
  type      NotificationType
  // ... campos adicionais
}

model PaymentMethod {
  id        String   @id @default(cuid())
  userId    String
  type      PaymentMethodType
  // ... campos adicionais
}

model ParticipationHistory {
  id        String   @id @default(cuid())
  userId    String
  auctionId String
  // ... campos adicionais
}
```

**APIs a Implementar:**
- `GET /api/bidder/dashboard` - Overview do dashboard
- `GET /api/bidder/won-lots` - Lotes arrematados (CRUD completo)
- `POST /api/bidder/won-lots/{id}/pay` - Realizar pagamento
- `GET /api/bidder/won-lots/{id}/boleto` - Gerar boleto
- `GET /api/bidder/payment-methods` - Métodos de pagamento (CRUD)
- `POST /api/bidder/payment-methods` - Adicionar método
- `GET /api/bidder/notifications` - Notificações (CRUD)
- `GET /api/bidder/participation-history` - Histórico
- `GET /api/bidder/profile` - Perfil do bidder
- `PUT /api/bidder/profile` - Atualizar perfil

**Componentes React:**
- `BidderDashboard` - Dashboard principal responsivo
- `WonLotsSection` - Lotes arrematados
- `PaymentsSection` - Pagamentos e métodos
- `DocumentsSection` - Documentos e análise
- `NotificationsSection` - Centro de notificações
- `HistorySection` - Histórico de participações
- `ProfileSection` - Perfil e configurações

**Hooks Customizados:**
- `useBidderDashboard()` - Overview e dados principais
- `useWonLots()` - Lotes arrematados com filtros
- `usePaymentMethods()` - Gestão de pagamentos
- `useNotifications()` - Sistema de notificações
- `useParticipationHistory()` - Histórico detalhado
- `useBidderProfile()` - Perfil do usuário

**Próximos Passos:**
1. Adicionar modelos ao `schema.prisma`
2. Executar `npx prisma db push`
3. Implementar repositories
4. Implementar services
5. Criar server actions
6. Desenvolver componentes React
7. Criar hooks customizados
8. Testes E2E

---

### 🔧 Sistema CRUD Configurável (Modal/Sheet)

**Status:** ⚠️ Planejado - A Implementar

**Objetivo:** Permitir que o administrador escolha entre Modal e Sheet para edição CRUD

**Requisitos:**

1. **Configuração em PlatformSettings:**
```prisma
model PlatformSettings {
  // ... campos existentes
  crudEditMode  String @default("modal") // "modal" | "sheet"
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
1. Adicionar campo `crudEditMode` ao PlatformSettings
2. Criar componente `CrudFormContainer`
3. Refatorar páginas de listagem
4. Adicionar toggle em `/admin/settings`
5. Criar testes E2E (`tests/ui-e2e/crud-modes.spec.ts`)

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

**Documento mantido por:** Equipe de Desenvolvimento BidExpert  
**Última atualização:** 27/10/2025
