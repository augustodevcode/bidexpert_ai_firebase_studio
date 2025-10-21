
// Guided Tour Configuration for the Admin Panel

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  order: number;
}

export const assetsTour: TourStep[] = [
  {
    id: 'assets-step-1',
    title: 'Lista de Ativos',
    content: 'Aqui você encontra a lista de todos os ativos cadastrados. Você pode buscar, filtrar e ordenar os resultados.',
    target: '#assets-data-table',
    order: 1,
  },
  {
    id: 'assets-step-2',
    title: 'Criar Novo Ativo',
    content: 'Use este botão para abrir o formulário e cadastrar um novo ativo na plataforma.',
    target: "button[name='Create Asset']",
    order: 2,
  },
  {
    id: 'assets-step-3',
    title: 'Ações',
    content: 'Para cada ativo, você pode editar ou excluir o registro usando estas ações.',
    target: '.row-actions',
    order: 3,
  },
];
