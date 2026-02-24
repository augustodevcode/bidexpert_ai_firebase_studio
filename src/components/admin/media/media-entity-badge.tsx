/**
 * @fileoverview Badge que exibe a entidade vinculada a um MediaItem.
 * Mostra tipo da entidade + publicId como chip clic├ível.
 * data-ai-id="media-entity-badge"
 */
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Package, Gavel, User, Box, Building2, Tag, Tags, ShoppingCart,
} from 'lucide-react';
import type { EntityLink } from '@/services/media-entity-links.service';

const ICON_MAP: Record<string, React.ElementType> = {
  Package, Gavel, User, Box, Building2, Tag, Tags, ShoppingCart,
};

const COLOR_MAP: Record<string, string> = {
  'Ativo': 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'Leil├úo': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'Leiloeiro': 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'Lote': 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  'Comitente': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  'Categoria': 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  'Subcategoria': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Venda Direta': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

interface MediaEntityBadgeProps {
  link: EntityLink;
  compact?: boolean;
}

export function MediaEntityBadge({ link, compact = false }: MediaEntityBadgeProps) {
  const IconComponent = ICON_MAP[link.icon] || Tag;
  const colorClass = COLOR_MAP[link.entityType] || 'bg-muted text-muted-foreground border-border';

  if (compact) {
    return (
      <Link href={link.adminUrl} title={`${link.entityType}: ${link.entityName}`}>
        <Badge
          variant="outline"
          className={`${colorClass} text-[10px] px-1.5 py-0 gap-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
          data-ai-id="media-entity-badge"
        >
          <IconComponent className="h-2.5 w-2.5" />
          {link.publicId || link.entityType.substring(0, 3).toUpperCase()}
        </Badge>
      </Link>
    );
  }

  return (
    <Link href={link.adminUrl}>
      <Badge
        variant="outline"
        className={`${colorClass} gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
        data-ai-id="media-entity-badge"
      >
        <IconComponent className="h-3 w-3" />
        <span className="font-medium">{link.entityType}</span>
        {link.publicId && <span className="opacity-70">#{link.publicId}</span>}
      </Badge>
    </Link>
  );
}

interface MediaEntityBadgesProps {
  links: EntityLink[];
  maxVisible?: number;
  compact?: boolean;
}

export function MediaEntityBadges({ links, maxVisible = 3, compact = true }: MediaEntityBadgesProps) {
  if (!links || links.length === 0) return null;

  const visible = links.slice(0, maxVisible);
  const remaining = links.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-0.5" data-ai-id="media-entity-badges">
      {visible.map((link, i) => (
        <MediaEntityBadge key={`${link.entityType}-${link.entityId}-${i}`} link={link} compact={compact} />
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

