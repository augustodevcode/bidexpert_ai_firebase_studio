/**
 * @fileoverview Cabeçalho de página reutilizável para páginas CRUD do Admin Plus.
 * Exibe título, descrição opcional e slot de ações (botões).
 */
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  'data-ai-id'?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  'data-ai-id': dataAiId,
}: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}
      data-ai-id={dataAiId ?? 'page-header'}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 mt-2 sm:mt-0">{children}</div>}
    </div>
  );
}
