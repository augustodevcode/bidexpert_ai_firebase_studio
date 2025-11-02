// src/app/admin/tour.config.ts
/**
 * @fileoverview Configuração para o tour guiado do painel de administração.
 * Define os passos, alvos e conteúdo para guiar novos usuários.
 */

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector
  order: number;
}

// Tour para a página de gerenciamento de Ativos (/admin/assets)
export const assetsTour: TourStep[] = [
  {
    id: 'assets-step-1',
    title: 'Bem-vindo ao Gerenciador de Ativos!',
    content: 'Esta tabela lista todos os ativos (bens) cadastrados na plataforma. Ativos são os itens individuais antes de serem agrupados em lotes.',
    target: '[data-ai-id="data-table-container"]',
    order: 1,
  },
  {
    id: 'assets-step-2',
    title: 'Busca e Filtros',
    content: 'Use a barra de busca e os filtros para encontrar ativos específicos rapidamente por nome, status, etc.',
    target: '[data-ai-id="data-table-toolbar"]',
    order: 2,
  },
   {
    id: 'assets-step-3',
    title: 'Criar Novo Ativo',
    content: 'Clique aqui para cadastrar um novo bem. O formulário será aberto em um painel lateral ou modal.',
    target: '[data-ai-id="admin-assets-card"] button',
    order: 3,
  },
  {
    id: 'assets-step-4',
    title: 'Visualização',
    content: 'Alterne entre os modos de visualização: Tabela (padrão), Grade de cards ou Lista.',
    target: '[data-ai-id="bid-expert-search-results-frame"] .flex.items-center.gap-1',
    order: 4,
  },
];
