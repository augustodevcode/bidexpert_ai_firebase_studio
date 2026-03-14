/**
 * @fileoverview Cabeçalho de página reutilizável para páginas CRUD do Admin Plus.
 * Exibe título, descrição opcional e mantém compatibilidade com páginas legadas.
 */
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  onAdd?: () => void;
  onCreate?: () => void;
  actionLabel?: string;
  'data-ai-id'?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  icon: Icon,
  onAdd,
  onCreate,
  actionLabel,
  'data-ai-id': dataAiId,
}: PageHeaderProps) {
  const onPrimaryAction = onAdd ?? onCreate;
  const primaryLabel = actionLabel ?? (onCreate ? 'Criar' : onAdd ? 'Adicionar' : null);

  return (
    <div
      className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}
      data-ai-id={dataAiId ?? 'page-header'}
    >
      <div>
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /> : null}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {(children || onPrimaryAction) && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {children}
          {onPrimaryAction && primaryLabel ? (
            <Button type="button" onClick={onPrimaryAction} data-ai-id="page-header-primary-action">
              <Plus className="mr-2 h-4 w-4" />
              {primaryLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
