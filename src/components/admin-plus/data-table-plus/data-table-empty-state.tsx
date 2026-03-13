/**
 * @fileoverview Estado vazio do DataTable Plus.
 * Exibido quando a query retorna zero resultados.
 */
import { Inbox } from 'lucide-react';

interface DataTableEmptyStateProps {
  title?: string;
  description?: string;
}

export function DataTableEmptyState({
  title = 'Nenhum registro encontrado',
  description = 'Tente ajustar os filtros ou a busca.',
}: DataTableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center" data-ai-id="data-table-empty">
      <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
    </div>
  );
}
