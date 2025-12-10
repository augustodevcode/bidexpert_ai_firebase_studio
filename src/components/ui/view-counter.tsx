/**
 * @fileoverview Componente de contador de visualizações.
 * 
 * Exibe o número de visualizações de uma entidade (Lot ou Auction)
 * com opções de formatação e estilo.
 * 
 * USO:
 * <ViewCounter entityType="Lot" entityId="123" />
 * <ViewCounter entityType="Lot" publicId="LOT-ABC123" showLabel />
 * <ViewCounter entityType="Auction" entityId="456" variant="badge" />
 */

'use client';

import { useEffect, useState } from 'react';
import { Eye, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVisitorTracking, type ViewMetrics } from '@/hooks/use-visitor-tracking';

interface ViewCounterProps {
  entityType: 'Lot' | 'Auction';
  entityId?: string;
  publicId?: string;
  variant?: 'default' | 'badge' | 'minimal' | 'detailed';
  showLabel?: boolean;
  showTooltip?: boolean;
  showTrending?: boolean;
  className?: string;
  refreshInterval?: number; // em milissegundos, 0 para desativar
}

// Formata número grande para exibição compacta (ex: 1.5K, 2.3M)
function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function ViewCounter({
  entityType,
  entityId,
  publicId,
  variant = 'default',
  showLabel = false,
  showTooltip = true,
  showTrending = false,
  className,
  refreshInterval = 30000, // 30 segundos por padrão
}: ViewCounterProps) {
  const { getMetrics } = useVisitorTracking();
  const [metrics, setMetrics] = useState<ViewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      const response = await getMetrics(entityType, entityId, publicId);
      if (isMounted && response.success && response.metrics) {
        setMetrics(response.metrics);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Configurar intervalo de atualização
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [entityType, entityId, publicId, getMetrics, refreshInterval]);

  // Calcular se está "trending" (mais de 100 views nas últimas 24h)
  const isTrending = metrics && metrics.viewsLast24h > 100;

  // Conteúdo do contador
  const viewCount = metrics?.totalViews ?? 0;
  const formattedCount = formatViewCount(viewCount);
  const uniqueViews = metrics?.uniqueViews ?? 0;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('animate-pulse flex items-center gap-1', className)}>
        <Eye className="w-4 h-4 text-muted-foreground" />
        <div className="w-8 h-4 bg-muted rounded" />
      </div>
    );
  }

  // Tooltip content
  const tooltipContent = (
    <div className="text-xs space-y-1">
      <div className="flex items-center gap-2">
        <Eye className="w-3 h-3" />
        <span>{viewCount} visualizações totais</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="w-3 h-3" />
        <span>{uniqueViews} visitantes únicos</span>
      </div>
      {metrics?.viewsLast24h !== undefined && (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3" />
          <span>{metrics.viewsLast24h} nas últimas 24h</span>
        </div>
      )}
    </div>
  );

  // Render variants
  const renderContent = () => {
    switch (variant) {
      case 'badge':
        return (
          <Badge variant="secondary" className={cn('gap-1', className)}>
            <Eye className="w-3 h-3" />
            {formattedCount}
            {showLabel && <span className="sr-only">visualizações</span>}
          </Badge>
        );

      case 'minimal':
        return (
          <span className={cn('text-xs text-muted-foreground', className)}>
            {formattedCount}
          </span>
        );

      case 'detailed':
        return (
          <div className={cn('flex items-center gap-3 text-sm', className)}>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>{formattedCount}</span>
              {showLabel && <span className="text-xs">views</span>}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{formatViewCount(uniqueViews)}</span>
              {showLabel && <span className="text-xs">únicos</span>}
            </div>
            {showTrending && isTrending && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <TrendingUp className="w-3 h-3" />
                Trending
              </Badge>
            )}
          </div>
        );

      default:
        return (
          <div className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
            <Eye className="w-4 h-4" />
            <span>{formattedCount}</span>
            {showLabel && <span className="text-xs">visualizações</span>}
            {showTrending && isTrending && (
              <TrendingUp className="w-3 h-3 text-orange-500 ml-1" />
            )}
          </div>
        );
    }
  };

  // Wrap with tooltip if enabled
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {renderContent()}
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return renderContent();
}

// Componente para exibir "Sendo visto agora" (simulado com métricas recentes)
export function ViewingNow({
  entityType,
  entityId,
  publicId,
  className,
}: Omit<ViewCounterProps, 'variant' | 'showLabel' | 'showTooltip' | 'showTrending' | 'refreshInterval'>) {
  const { getMetrics } = useVisitorTracking();
  const [viewingCount, setViewingCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      const response = await getMetrics(entityType, entityId, publicId);
      if (isMounted && response.success && response.metrics) {
        // Simula "vendo agora" baseado nas views das últimas 24h dividido por 24
        // Em produção, isso seria calculado com base em sessões ativas
        const avgPerHour = Math.ceil(response.metrics.viewsLast24h / 24);
        // Adiciona variação aleatória para parecer mais real
        const variation = Math.floor(Math.random() * 3) - 1;
        setViewingCount(Math.max(1, avgPerHour + variation));
      }
    };

    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 60000); // Atualiza a cada minuto

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [entityType, entityId, publicId, getMetrics]);

  if (viewingCount === 0) return null;

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm',
      'text-orange-600 dark:text-orange-400',
      className
    )}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
      </span>
      <span>
        {viewingCount} {viewingCount === 1 ? 'pessoa está' : 'pessoas estão'} vendo agora
      </span>
    </div>
  );
}

export default ViewCounter;
