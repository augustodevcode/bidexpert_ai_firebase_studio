# Página de Preparação do Leilão

## Visão Geral

A página de preparação do leilão é um dashboard centralizado onde administradores e leiloeiros podem gerenciar todos os aspectos de um leilão específico. A página oferece uma interface com múltiplas abas para diferentes funcionalidades.

## Localização

- **Rota**: `/admin/auctions/[auctionId]/prepare`
- **Componente Principal**: `AuctionPreparationDashboard`
- **Localização dos arquivos**:
  - Página: `src/app/admin/auctions/[auctionId]/prepare/page.tsx`
  - Componentes: `src/components/admin/auction-preparation/`

## Layout

A página utiliza um layout **full-width** especial que:
- Mantém a **sidebar** do admin visível na lateral
- Mantém o **header** do painel admin visível no topo
- Remove a restrição de `max-width` do conteúdo para aproveitar toda a largura disponível
- Implementação em `admin-layout.client.tsx` detecta automaticamente páginas com `/prepare` na URL

## Abas Disponíveis

### 1. Dashboard
**Ícone**: LayoutDashboard  
**Objetivo**: Visão geral do leilão com métricas principais e acesso rápido

**Funcionalidades**:
- Cards de estatísticas (Total de Lotes, Habilitados, Lances, Valor Total)
- Alertas e pendências
- Ações rápidas para funcionalidades principais
- Linha do tempo do leilão

### 2. Loteamento
**Ícone**: Grid3x3  
**Objetivo**: Agrupar bens em lotes

**Funcionalidades**:
- Lista de bens disponíveis para loteamento
- Filtros por origem (processos judiciais/comitentes)
- Seleção múltipla de bens
- Criação de lotes a partir dos bens selecionados
- Diferenciação entre leilões judiciais e extrajudiciais

**Regras de Negócio**:
- Leilões judiciais: bens de processos e comitentes vinculados
- Leilões extrajudiciais/venda direta: apenas bens de comitentes não judiciais

### 3. Lotes
**Ícone**: Package  
**Objetivo**: Gerenciar lotes já criados

**Funcionalidades**:
- Lista completa de lotes do leilão
- Indicadores de performance de cada lote
- Edição de lotes (status, parâmetros)
- Busca e filtros
- Estatísticas (taxa de conversão, média de lances, valor médio)

### 4. Habilitações
**Ícone**: Users  
**Objetivo**: Gerenciar usuários habilitados para o leilão

**Funcionalidades**:
- Lista de usuários cadastrados e habilitados
- Filtros por status (Pendente, Aprovado, Rejeitado)
- Visualização de documentos
- Aprovação/rejeição de habilitações
- Exportação de dados
- Cards de estatísticas (Total, Pendentes, Aprovados, Rejeitados)

### 5. Pregão
**Ícone**: Gavel  
**Objetivo**: Acompanhar lances em tempo real

**Funcionalidades**:
- Lances em tempo real
- Participantes ativos
- Valor atual dos lotes
- Meta de faturamento com barra de progresso
- Alertas de risco
- Lotes mais ativos
- Timeline de atividade de lances

### 6. Arremates (Fechamento)
**Ícone**: HandCoins  
**Objetivo**: Gerenciar lotes arrematados e vencedores

**Funcionalidades**:
- Lista de lotes arrematados
- Dados dos arrematantes
- Status de pagamentos
- Geração de auto de arrematação
- Confirmação de pagamentos
- Exportação de dados para comitentes

**Estatísticas**:
- Total arrematado
- Valor arrecadado
- Aguardando pagamento
- Finalizados

### 7. Financeiro
**Ícone**: Wallet  
**Objetivo**: Gestão financeira do leilão

**Funcionalidades**:
- Visão geral financeira (Receita, Custos, Comissões, Lucro)
- Status de cobranças (Pagas, Pendentes, Atrasadas)
- Notas fiscais (Emitidas, Pendentes)
- Histórico de transações
- Detalhamento de custos
- Exportação de relatórios

### 8. Marketing
**Ícone**: Megaphone  
**Objetivo**: Promover o leilão

**Funcionalidades**:
- **Promoção no Site**:
  - Banner na página inicial
  - Banner em categorias
  - Gerenciamento de banners
  
- **Anúncios Digitais**:
  - Google Ads
  - Configuração de campanhas
  
- **Redes Sociais**:
  - Facebook (publicação automática)
  - Instagram (stories e posts)
  - Geração de conteúdo
  
- **Email Marketing**:
  - Campanhas de email
  - Templates personalizados
  - Base de destinatários

- **Métricas**:
  - Visualizações
  - Cliques
  - Taxa de conversão
  - Investimento total

### 9. Analytics (Relatórios)
**Ícone**: BarChart3  
**Objetivo**: Análise de desempenho e comportamento

**Funcionalidades**:
- **Métricas Principais**:
  - Visualizações de página
  - Visitantes únicos
  - Taxa de cliques (CTR)
  - Tempo médio na página
  
- **Origem do Tráfego**:
  - Busca orgânica
  - Direto
  - Redes sociais
  - Email
  - Anúncios pagos
  
- **Comportamento do Usuário**:
  - Visualizou lotes
  - Clicou em dar lance
  - Iniciou cadastro
  - Completou habilitação
  
- **Dispositivos e Navegadores**:
  - Desktop/Mobile/Tablet
  - Distribuição por navegador
  
- **Funil de Conversão**:
  - Visitou página → Visualizou lotes → Cadastrou → Habilitou → Deu lance → Arrematou
  
- Seletor de período (24h, 7d, 30d, Todo período)
- Exportação de relatórios

## Estrutura de Componentes

```
src/components/admin/auction-preparation/
├── auction-preparation-dashboard.tsx (Componente principal)
├── index.ts (Exports)
└── tabs/
    ├── dashboard-tab.tsx
    ├── lotting-tab.tsx
    ├── lots-tab.tsx
    ├── habilitations-tab.tsx
    ├── auction-tab.tsx
    ├── closing-tab.tsx
    ├── financial-tab.tsx
    ├── marketing-tab.tsx
    └── analytics-tab.tsx
```

## Dados de Teste (Seed)

O arquivo `seed-data-extended-v3.ts` inclui dados específicos para testar a página de preparação:
- Habilitações de usuários em diferentes status
- Lances para estatísticas do pregão
- Múltiplos lotes vinculados ao leilão
- Bens disponíveis para loteamento

## Testes

Arquivo de testes Playwright: `tests/auction-preparation.spec.ts`

**Cenários testados**:
- Acesso à página de preparação
- Navegação entre todas as abas
- Exibição de cards de estatísticas
- Estados vazios (sem lotes, sem habilitações, etc.)
- Controles de marketing
- Métricas de analytics
- Informações financeiras
- Layout correto (sidebar e header visíveis)

## Permissões

A página é acessível para usuários com as seguintes permissões:
- `manage_all` (Administradores)
- `conduct_auctions` (Leiloeiros)
- `auctions:manage_assigned` (Analistas de Leilão)

## Navegação

A página pode ser acessada de várias formas:
1. Menu lateral admin → Leilões → Selecionar leilão → Botão "Preparar"
2. URL direta: `/admin/auctions/[id]/prepare`
3. Dashboard do leilão → Ações rápidas

## Próximos Passos e Melhorias

1. **Integração com APIs Reais**:
   - Conectar métricas de analytics com dados reais
   - Implementar integração com Google Ads
   - Conectar redes sociais

2. **Funcionalidades Adicionais**:
   - Chat ao vivo durante o pregão
   - Notificações em tempo real
   - Geração automática de relatórios
   - Dashboard personalizável

3. **Otimizações**:
   - Cache de dados frequentes
   - Paginação em listas grandes
   - Lazy loading de componentes
   - WebSockets para dados em tempo real

## Considerações Técnicas

- Utiliza **React Server Components** para página principal
- **Client Components** para interatividade (abas, switches, etc.)
- **Shadcn UI** para componentes de interface
- **Tailwind CSS** para estilização
- **TypeScript** para type safety
- Preparado para **dados em tempo real** (estrutura já contempla)

## Filosofia do Projeto

A implementação segue os princípios do projeto:
- **Modularidade**: Cada aba é um componente independente
- **Reutilização**: Uso de componentes UI padronizados
- **Escalabilidade**: Estrutura preparada para expansão
- **UX Consistente**: Design system unificado
- **Performance**: Otimizado para carregamento rápido
- **Manutenibilidade**: Código organizado e documentado
