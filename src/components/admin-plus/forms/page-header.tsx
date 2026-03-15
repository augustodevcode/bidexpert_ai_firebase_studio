/**
 * @fileoverview Cabeçalho de página reutilizável para páginas CRUD do Admin Plus.
 * Exibe título, descrição opcional e mantém compatibilidade com páginas legadas.
 */
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  onAdd?: () => void;
  onCreate?: () => void;
  actionLabel?: string;
  addLabel?: string;
  createHref?: string;
  createLabel?: string;
  primaryAction?: PageHeaderAction;
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
  addLabel,
  createHref,
  createLabel,
  primaryAction,
  subtitle,
  'data-ai-id': dataAiId,
}: PageHeaderProps) {
  const onPrimaryAction = onAdd ?? onCreate;
  const resolvedDescription = description ?? subtitle;
  const resolvedPrimaryAction = primaryAction
    ?? (createHref
      ? {
          label: createLabel ?? actionLabel ?? 'Criar',
          href: createHref,
        }
      : onPrimaryAction
        ? {
            label: actionLabel ?? addLabel ?? (onCreate ? 'Criar' : onAdd ? 'Adicionar' : ''),
            onClick: onPrimaryAction,
          }
        : null);

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
        {resolvedDescription && (
          <p className="text-sm text-muted-foreground mt-0.5">{resolvedDescription}</p>
        )}
      </div>

      {(children || resolvedPrimaryAction) && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {children}
          {resolvedPrimaryAction?.href ? (
            <Button asChild data-ai-id="page-header-primary-action">
              <Link href={resolvedPrimaryAction.href}>
                <Plus className="mr-2 h-4 w-4" />
                {resolvedPrimaryAction.label}
              </Link>
            </Button>
          ) : resolvedPrimaryAction?.onClick ? (
            <Button type="button" onClick={resolvedPrimaryAction.onClick} data-ai-id="page-header-primary-action">
              <Plus className="mr-2 h-4 w-4" />
              {resolvedPrimaryAction.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
