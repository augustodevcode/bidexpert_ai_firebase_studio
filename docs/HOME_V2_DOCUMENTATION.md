# Home Page V2 - Documentação Técnica

## Visão Geral

A Home Page V2 é uma nova interface de landing page para a plataforma BidExpert, inspirada nos portais Superbid, Mercado Bom Valor, Vip Leilões e no estilo visual modular do Martfury. A implementação segue uma arquitetura de componentes reutilizáveis com suporte a múltiplos segmentos de leilão.

## Estrutura de Arquivos

```
src/
├── components/
│   └── home-v2/
│       ├── index.ts                    # Barrel export
│       ├── types.ts                    # TypeScript type definitions
│       ├── segment-config.ts           # Segment configurations
│       ├── segment-data.ts             # Data fetching utilities
│       ├── segment-header.tsx          # Header with navigation
│       ├── segment-hero.tsx            # Hero banner component
│       ├── segment-footer.tsx          # Footer component
│       ├── segment-landing-page.tsx    # Template for segment pages
│       ├── category-grid.tsx           # Category cards grid
│       ├── event-card.tsx              # Event card component
│       ├── featured-events-section.tsx # Events carousel/grid
│       ├── lot-card.tsx                # Lot card component
│       ├── lots-grid-section.tsx       # Lots grid with filters
│       ├── partners-carousel.tsx       # Partners logo carousel
│       ├── trust-section.tsx           # Trust/benefits section
│       └── deal-of-the-day.tsx         # Deal of the day component
├── app/
│   ├── home-v2/
│   │   └── page.tsx                    # Main home v2 page
│   ├── veiculos/
│   │   └── page.tsx                    # Vehicles segment page
│   ├── imoveis/
│   │   └── page.tsx                    # Real estate segment page
│   ├── maquinas/
│   │   └── page.tsx                    # Machinery segment page
│   └── tecnologia/
│       └── page.tsx                    # Technology segment page
```

## Segmentos Disponíveis

| Segmento | URL | Descrição |
|----------|-----|-----------|
| Veículos | `/veiculos` | Carros, motos, caminhões e veículos pesados |
| Imóveis | `/imoveis` | Residenciais, comerciais, terrenos e judiciais |
| Máquinas | `/maquinas` | Agrícolas, industriais, construção e logística |
| Tecnologia | `/tecnologia` | Informática, eletrônicos, telefonia e corporativo |

## Componentes Principais

### 1. SegmentHeader
**Arquivo:** `segment-header.tsx`

Header responsivo com:
- Logo e navegação principal
- Barra de busca global
- Links rápidos (Como Comprar, FAQ, etc.)
- Menu de segmentos com mega-menu
- Drawer lateral para mobile

**Props:**
```typescript
interface SegmentHeaderProps {
  activeSegment?: SegmentType;
  platformSettings?: { siteTitle?: string; logoUrl?: string } | null;
}
```

### 2.1. Estatísticas da Plataforma

A seção de estatísticas do HeroSection agora exibe dados reais do banco de dados em vez de valores hardcoded:

- **Lotes ativos**: Contagem de lotes com status `ABERTO_PARA_LANCES`
- **Eventos realizados**: Contagem total de leilões (todos os status)
- **Usuários cadastrados**: Contagem total de usuários registrados

**Implementação:**
- Função `getPlatformPublicStats()` no `src/app/home-v2/page.tsx`
- Utiliza o `DashboardService` para queries otimizadas no banco de dados
- Formatação automática com separadores de milhar e sufixo "+"
- Fallback para valores padrão (0) em caso de erro de banco de dados

**Testes:**
- Testes unitários em `src/app/home-v2/__tests__/page.test.tsx`
- Testes E2E em `tests/e2e/home-v2.spec.ts` para validação da exibição correta

### 2. SegmentHero
**Arquivo:** `segment-hero.tsx`

Banner hero com:
- Imagem de fundo temática
- Título e subtítulo do segmento
- CTAs principais
- Filtros rápidos (Estado, Preço, Condição)

**Props:**
```typescript
interface SegmentHeroProps {
  config: SegmentConfig;
  filters?: FilterOptions;
  eventsCount?: number;
  lotsCount?: number;
}
```

### 3. CategoryGrid
**Arquivo:** `category-grid.tsx`

Grid de categorias com:
- Cards com ícone e descrição
- Contador de ofertas
- Links para filtragem

### 4. FeaturedEventsSection
**Arquivo:** `featured-events-section.tsx`

Seção de eventos com:
- Carrossel de eventos em destaque
- Grid de próximos eventos
- Filtros por tipo e período

### 5. LotsGridSection
**Arquivo:** `lots-grid-section.tsx`

Grid de lotes com:
- Sidebar de filtros (desktop)
- Sheet de filtros (mobile)
- Ordenação e visualização em grid/lista
- Filtro de financiáveis

### 6. LotCard (Atualizado)
**Arquivo:** `lot-card.tsx` (descontinuado - agora usa BidExpertCard)

**Mudança:** Os cards de lote na Home V2 agora usam o componente padrão `BidExpertCard` da aplicação, garantindo consistência visual com a página home e outros locais da plataforma.

- Usa `BidExpertCard` com `type="lot"`
- Exibe informações padronizadas de lotes
- Countdown automático quando aplicável
- Compatível com dados de leilão pai

**Benefícios:**
- Consistência visual com toda a aplicação
- Reutilização de código
- Manutenção centralizada
- Funcionalidades padronizadas (favoritos, countdown, etc.)

### 7. DealOfTheDay
**Arquivo:** `deal-of-the-day.tsx`

Seção de oferta do dia com:
- Countdown em tempo real
- Card grande com destaque visual
- Barra de progresso de demanda
- CTAs de ação

### 8. PartnersCarousel
**Arquivo:** `partners-carousel.tsx`

Carrossel de parceiros com:
- Logos de comitentes/leiloeiros
- Efeito grayscale no hover
- Links para páginas de parceiros

### 9. TrustSection
**Arquivo:** `trust-section.tsx`

Seção de confiança com:
- Pontos de benefício do segmento
- Links para conteúdo educativo
- CTAs para FAQ e tutoriais

### 10. SegmentFooter
**Arquivo:** `segment-footer.tsx`

Footer completo com:
- Newsletter subscription
- Links por categoria
- Links por canal (Judicial, Corporativo, etc.)
- Suporte e políticas
- Redes sociais
- Informações legais

## Types Principais

```typescript
// Tipo de segmento
type SegmentType = 'veiculos' | 'imoveis' | 'maquinas' | 'tecnologia';

// Configuração do segmento
interface SegmentConfig {
  id: SegmentType;
  name: string;
  title: string;
  subtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  icon: string;
  color: string;
  categories: SegmentCategory[];
  menuItems: SegmentMenuItem[];
  trustPoints: TrustPoint[];
}

// Card de lote com dados específicos por segmento
interface LotCardData {
  id: string;
  title: string;
  imageUrl?: string;
  currentPrice: number;
  evaluationPrice?: number;
  bidsCount: number;
  status: string;
  badges: LotBadge[];
  endDate?: Date;
  // Veículos
  brand?: string;
  model?: string;
  year?: string;
  mileage?: number;
  // Imóveis
  propertyType?: string;
  area?: number;
  city?: string;
  state?: string;
  // Máquinas
  machineType?: string;
  hoursWorked?: number;
  // Tecnologia
  techBrand?: string;
  condition?: string;
}
```

## Data Fetching

As funções de data fetching estão em `segment-data.ts`:

```typescript
// Busca eventos do segmento
getSegmentEvents(segment: SegmentType, limit?: number): Promise<FeaturedEvent[]>

// Busca lotes do segmento
getSegmentLots(segment: SegmentType, limit?: number): Promise<LotCardData[]>

// Busca parceiros do segmento
getSegmentPartners(segment: SegmentType, limit?: number): Promise<PartnerData[]>

// Busca deal do dia
getSegmentDealOfTheDay(segment: SegmentType): Promise<DealOfTheDay | null>

// Busca estatísticas
getSegmentStats(segment: SegmentType): Promise<{ eventsCount: number; lotsCount: number }>
```

## Responsividade

Todos os componentes são responsivos com breakpoints:
- **Mobile:** < 768px (md)
- **Tablet:** 768px - 1024px (lg)
- **Desktop:** > 1024px

### Comportamentos Mobile:
- Header com drawer lateral
- Filtros em sheet/modal
- Grid de 1-2 colunas
- Carrosséis com scroll horizontal

## SEO

Cada página de segmento inclui:
- Meta title otimizado
- Meta description
- Keywords relevantes
- Open Graph tags

## Performance

- Imagens otimizadas com next/image
- Lazy loading de componentes
- Server components para data fetching
- Suspense boundaries para loading states

## Acessibilidade

- Contraste de cores adequado
- Labels em elementos interativos
- Navegação por teclado
- ARIA labels onde necessário

## Uso

### Acessar Home V2:
```
/home-v2
```

### Acessar páginas de segmento:
```
/veiculos
/imoveis
/maquinas
/tecnologia
```

## Testes

Os testes E2E estão em `tests/e2e/home-v2.spec.ts` e cobrem:
- Renderização de componentes
- Navegação entre segmentos
- Filtros e ordenação
- Countdown e interações
- Responsividade
- Verificação de dados do banco

## Próximos Passos

1. Integração com analytics
2. A/B testing com home atual
3. Otimização de cache
4. Internacionalização
5. Temas adicionais
