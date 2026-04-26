/**
 * @fileoverview Sistema de internacionalização do SuperGrid.
 * Define a interface GridLocale com todas as strings de UI e fornece
 * o locale padrão em Português do Brasil (PT_BR_LOCALE).
 */

// ==========================================
// INTERFACE DE LOCALE
// ==========================================

export interface GridLocale {
  // Toolbar
  toolbar: {
    searchPlaceholder: string;
    newButton: string;
    refreshTooltip: string;
    recordCount: (count: number) => string;
  };

  // Pagination
  pagination: {
    rangeLabel: (start: number, end: number, total: number) => string;
    noRecords: string;
    perPage: string;
    pageLabel: (current: number, total: number) => string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
  };

  // Export
  export: {
    button: string;
    exporting: string;
    excel: string;
    csv: string;
    pdf: string;
  };

  // Column visibility
  columnVisibility: {
    button: (visible: number, total: number) => string;
    title: string;
    showAll: string;
    hideAll: string;
  };

  // Density
  density: {
    compact: string;
    normal: string;
    comfortable: string;
  };

  // Query builder / Advanced filter
  queryBuilder: {
    advancedFilter: string;
    clear: string;
    savedFilters: string;
    savedFiltersPlaceholder: string;
    noSavedFilters: string;
    saveCurrent: string;
    saveDialogTitle: string;
    saveDialogDescription: string;
    filterNameLabel: string;
    filterNamePlaceholder: string;
    saveConfirm: string;
    deleteSaved: string;
    savedSuccess: string;
    deletedSuccess: string;
    combinators: {
      and: string;
      or: string;
    };
    operators: Record<string, string>;
  };

  // Grouping
  grouping: {
    groupedBy: string;
    noGrouping: string;
    add: string;
    clear: string;
  };

  // Editing
  editing: {
    editAction: string;
    deleteAction: string;
    newTitle: (entity: string) => string;
    editTitle: (entity: string) => string;
    save: string;
    create: string;
    cancel: string;
  };

  // Inline editing
  inlineEditing: {
    saveTooltip: string;
    cancelTooltip: string;
    editCellTooltip: string;
    requiredField: string;
    invalidValue: string;
    yes: string;
    no: string;
  };

  // Bulk actions
  bulkActions: {
    selectedCount: (count: number) => string;
    clearSelection: string;
    deleteSelected: string;
    confirmDeleteTitle: string;
    confirmDeleteDescription: (count: number) => string;
    confirmButton: string;
    cancelButton: string;
  };

  // Aggregate footer
  aggregates: {
    totalsLabel: (count: number) => string;
  };

  // Table states
  states: {
    loading: string;
    errorTitle: string;
    errorRetry: string;
    emptyState: string;
  };

  // Selection
  selection: {
    selectAll: string;
    selectRow: string;
  };

  // Freeze panes
  freezePanes: {
    freezeColumn: string;
    unfreezeColumn: string;
    freezeLeft: string;
    freezeRight: string;
  };

  // Highlighting
  highlighting: {
    activeRow: string;
    stripedRows: string;
    columnHighlight: string;
  };
}

// ==========================================
// LOCALE PADRÃO: PORTUGUÊS BRASIL
// ==========================================

export const PT_BR_LOCALE: GridLocale = {
  toolbar: {
    searchPlaceholder: 'Buscar em todos os campos...',
    newButton: 'Novo',
    refreshTooltip: 'Atualizar',
    recordCount: (count) =>
      `${count.toLocaleString('pt-BR')} ${count === 1 ? 'registro' : 'registros'}`,
  },

  pagination: {
    rangeLabel: (start, end, total) =>
      `${start}-${end} de ${total.toLocaleString('pt-BR')}`,
    noRecords: 'Nenhum registro',
    perPage: 'Por página:',
    pageLabel: (current, total) => `Página ${current} de ${total}`,
    firstPage: 'Primeira página',
    previousPage: 'Página anterior',
    nextPage: 'Próxima página',
    lastPage: 'Última página',
  },

  export: {
    button: 'Exportar',
    exporting: 'Exportando...',
    excel: 'Excel (.xlsx)',
    csv: 'CSV (.csv)',
    pdf: 'PDF (.pdf)',
  },

  columnVisibility: {
    button: (visible, total) => `Colunas (${visible}/${total})`,
    title: 'Colunas visíveis',
    showAll: 'Todas',
    hideAll: 'Nenhuma',
  },

  density: {
    compact: 'Compacto',
    normal: 'Normal',
    comfortable: 'Confortável',
  },

  queryBuilder: {
    advancedFilter: 'Filtro Avançado',
    clear: 'Limpar',
    savedFilters: 'Filtros salvos',
    savedFiltersPlaceholder: 'Selecione um filtro salvo',
    noSavedFilters: 'Nenhum filtro salvo',
    saveCurrent: 'Salvar filtro atual',
    saveDialogTitle: 'Salvar filtro avançado',
    saveDialogDescription: 'Salve a combinação atual para reutilizar neste grid e neste tenant.',
    filterNameLabel: 'Nome do filtro',
    filterNamePlaceholder: 'Ex.: Leilões abertos por status',
    saveConfirm: 'Salvar filtro',
    deleteSaved: 'Excluir filtro salvo',
    savedSuccess: 'Filtro salvo com sucesso.',
    deletedSuccess: 'Filtro excluído com sucesso.',
    combinators: {
      and: 'E',
      or: 'OU',
    },
    operators: {
      '=': 'Igual a',
      '!=': 'Diferente de',
      contains: 'Contém',
      doesNotContain: 'Não contém',
      beginsWith: 'Começa com',
      doesNotBeginWith: 'Não começa com',
      endsWith: 'Termina com',
      doesNotEndWith: 'Não termina com',
      '>': 'Maior que',
      '>=': 'Maior ou igual',
      '<': 'Menor que',
      '<=': 'Menor ou igual',
      between: 'Entre',
      notBetween: 'Não está entre',
      in: 'Está em',
      notIn: 'Não está em',
      null: 'É nulo',
      notNull: 'Não é nulo',
    },
  },

  grouping: {
    groupedBy: 'Agrupado por:',
    noGrouping: 'Nenhum agrupamento',
    add: 'Adicionar',
    clear: 'Limpar',
  },

  editing: {
    editAction: 'Editar',
    deleteAction: 'Excluir',
    newTitle: (entity) => `Novo ${entity}`,
    editTitle: (entity) => `Editar ${entity}`,
    save: 'Salvar',
    create: 'Criar',
    cancel: 'Cancelar',
  },

  inlineEditing: {
    saveTooltip: 'Salvar (Enter)',
    cancelTooltip: 'Cancelar (Esc)',
    editCellTooltip: 'Duplo clique para editar',
    requiredField: 'Campo obrigatório',
    invalidValue: 'Valor inválido',
    yes: 'Sim',
    no: 'Não',
  },

  bulkActions: {
    selectedCount: (count) =>
      `${count} ${count === 1 ? 'registro selecionado' : 'registros selecionados'}`,
    clearSelection: 'Limpar seleção',
    deleteSelected: 'Excluir selecionados',
    confirmDeleteTitle: 'Confirmar exclusão',
    confirmDeleteDescription: (count) =>
      `Tem certeza que deseja excluir ${count} ${count === 1 ? 'registro' : 'registros'}? Esta ação não pode ser desfeita.`,
    confirmButton: 'Excluir',
    cancelButton: 'Cancelar',
  },

  aggregates: {
    totalsLabel: (count) => `Totais (${count} registros)`,
  },

  states: {
    loading: 'Carregando...',
    errorTitle: 'Erro ao carregar dados',
    errorRetry: 'Tentar novamente',
    emptyState: 'Nenhum registro encontrado',
  },

  selection: {
    selectAll: 'Selecionar todos',
    selectRow: 'Selecionar linha',
  },

  freezePanes: {
    freezeColumn: 'Congelar coluna',
    unfreezeColumn: 'Descongelar coluna',
    freezeLeft: 'Congelar à esquerda',
    freezeRight: 'Congelar à direita',
  },

  highlighting: {
    activeRow: 'Linha ativa',
    stripedRows: 'Linhas zebradas',
    columnHighlight: 'Destaque de coluna',
  },
};

// ==========================================
// LOCALE ENGLISH (template for future use)
// ==========================================

export const EN_US_LOCALE: GridLocale = {
  toolbar: {
    searchPlaceholder: 'Search all fields...',
    newButton: 'New',
    refreshTooltip: 'Refresh',
    recordCount: (count) =>
      `${count.toLocaleString('en-US')} ${count === 1 ? 'record' : 'records'}`,
  },

  pagination: {
    rangeLabel: (start, end, total) =>
      `${start}-${end} of ${total.toLocaleString('en-US')}`,
    noRecords: 'No records',
    perPage: 'Per page:',
    pageLabel: (current, total) => `Page ${current} of ${total}`,
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
  },

  export: {
    button: 'Export',
    exporting: 'Exporting...',
    excel: 'Excel (.xlsx)',
    csv: 'CSV (.csv)',
    pdf: 'PDF (.pdf)',
  },

  columnVisibility: {
    button: (visible, total) => `Columns (${visible}/${total})`,
    title: 'Visible columns',
    showAll: 'All',
    hideAll: 'None',
  },

  density: {
    compact: 'Compact',
    normal: 'Normal',
    comfortable: 'Comfortable',
  },

  queryBuilder: {
    advancedFilter: 'Advanced Filter',
    clear: 'Clear',
    savedFilters: 'Saved filters',
    savedFiltersPlaceholder: 'Select a saved filter',
    noSavedFilters: 'No saved filters',
    saveCurrent: 'Save current filter',
    saveDialogTitle: 'Save advanced filter',
    saveDialogDescription: 'Save the current combination to reuse it in this grid and tenant.',
    filterNameLabel: 'Filter name',
    filterNamePlaceholder: 'E.g. Open auctions by status',
    saveConfirm: 'Save filter',
    deleteSaved: 'Delete saved filter',
    savedSuccess: 'Filter saved successfully.',
    deletedSuccess: 'Filter deleted successfully.',
    combinators: {
      and: 'AND',
      or: 'OR',
    },
    operators: {
      '=': 'Equals',
      '!=': 'Not equals',
      contains: 'Contains',
      doesNotContain: 'Does not contain',
      beginsWith: 'Starts with',
      doesNotBeginWith: 'Does not start with',
      endsWith: 'Ends with',
      doesNotEndWith: 'Does not end with',
      '>': 'Greater than',
      '>=': 'Greater or equal',
      '<': 'Less than',
      '<=': 'Less or equal',
      between: 'Between',
      notBetween: 'Not between',
      in: 'In',
      notIn: 'Not in',
      null: 'Is null',
      notNull: 'Is not null',
    },
  },

  grouping: {
    groupedBy: 'Grouped by:',
    noGrouping: 'No grouping',
    add: 'Add',
    clear: 'Clear',
  },

  editing: {
    editAction: 'Edit',
    deleteAction: 'Delete',
    newTitle: (entity) => `New ${entity}`,
    editTitle: (entity) => `Edit ${entity}`,
    save: 'Save',
    create: 'Create',
    cancel: 'Cancel',
  },

  inlineEditing: {
    saveTooltip: 'Save (Enter)',
    cancelTooltip: 'Cancel (Esc)',
    editCellTooltip: 'Double click to edit',
    requiredField: 'Required field',
    invalidValue: 'Invalid value',
    yes: 'Yes',
    no: 'No',
  },

  bulkActions: {
    selectedCount: (count) =>
      `${count} ${count === 1 ? 'record selected' : 'records selected'}`,
    clearSelection: 'Clear selection',
    deleteSelected: 'Delete selected',
    confirmDeleteTitle: 'Confirm deletion',
    confirmDeleteDescription: (count) =>
      `Are you sure you want to delete ${count} ${count === 1 ? 'record' : 'records'}? This action cannot be undone.`,
    confirmButton: 'Delete',
    cancelButton: 'Cancel',
  },

  aggregates: {
    totalsLabel: (count) => `Totals (${count} records)`,
  },

  states: {
    loading: 'Loading...',
    errorTitle: 'Error loading data',
    errorRetry: 'Try again',
    emptyState: 'No records found',
  },

  selection: {
    selectAll: 'Select all',
    selectRow: 'Select row',
  },

  freezePanes: {
    freezeColumn: 'Freeze column',
    unfreezeColumn: 'Unfreeze column',
    freezeLeft: 'Freeze left',
    freezeRight: 'Freeze right',
  },

  highlighting: {
    activeRow: 'Active row',
    stripedRows: 'Striped rows',
    columnHighlight: 'Column highlight',
  },
};
