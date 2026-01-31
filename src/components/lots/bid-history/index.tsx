/**
 * @fileoverview Histórico de Lances do Lote
 * @description Exibe timeline de lances com estatísticas (após encerramento)
 * @module components/lots/bid-history/index
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  TrendingUp, 
  Clock, 
  Users, 
  Award,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LotStatus } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface BidRecord {
  id: string;
  amount: number;
  timestamp: Date | string;
  bidderDisplay?: string;
  isWinning?: boolean;
}

interface BidStats {
  totalBids: number;
  uniqueBidders: number;
  highestBid: number;
  lowestBid: number;
  averageBid: number;
  priceIncrease: number;
  priceIncreasePercent: number;
}

interface BidHistoryProps {
  /** Lista de lances */
  bids: BidRecord[];
  /** Status do lote */
  lotStatus: LotStatus;
  /** Preço inicial do lote */
  initialPrice?: number;
  /** Classes adicionais */
  className?: string;
  /** Quantidade máxima de lances a exibir inicialmente */
  initialDisplayCount?: number;
  /** Se true, exibe histórico mesmo durante leilão aberto (para uso em tempo real) */
  showDuringAuction?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const _formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

/**
 * Anonimiza o identificador do lançador
 * Lança #1, Lança #2, etc.
 */
const anonymizeBidder = (index: number, total: number): string => {
  return `Lançador #${total - index}`;
};

const calculateStats = (bids: BidRecord[], initialPrice: number = 0): BidStats => {
  if (bids.length === 0) {
    return {
      totalBids: 0,
      uniqueBidders: 0,
      highestBid: 0,
      lowestBid: 0,
      averageBid: 0,
      priceIncrease: 0,
      priceIncreasePercent: 0,
    };
  }

  const amounts = bids.map(b => b.amount);
  const uniqueBidders = new Set(bids.map(b => b.bidderDisplay || b.id)).size;
  const highestBid = Math.max(...amounts);
  const lowestBid = Math.min(...amounts);
  const averageBid = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const priceIncrease = initialPrice > 0 ? highestBid - initialPrice : 0;
  const priceIncreasePercent = initialPrice > 0 ? (priceIncrease / initialPrice) * 100 : 0;

  return {
    totalBids: bids.length,
    uniqueBidders,
    highestBid,
    lowestBid,
    averageBid,
    priceIncrease,
    priceIncreasePercent,
  };
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subValue }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
    <div className="p-2 rounded-full bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  </div>
);

interface BidTimelineItemProps {
  bid: BidRecord;
  index: number;
  total: number;
  isLast: boolean;
}

const BidTimelineItem: React.FC<BidTimelineItemProps> = ({ 
  bid, 
  index, 
  total, 
  isLast 
}) => {
  const isWinning = index === 0; // Primeiro da lista (mais recente) é o vencedor

  return (
    <div className="flex gap-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-3 h-3 rounded-full border-2',
          isWinning 
            ? 'bg-primary border-primary' 
            : 'bg-background border-muted-foreground'
        )} />
        {!isLast && <div className="w-0.5 h-full bg-muted-foreground/30" />}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 pb-4',
        isLast && 'pb-0'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {anonymizeBidder(index, total)}
            </span>
            {isWinning && (
              <Badge variant="default" className="gap-1">
                <Award className="h-3 w-3" />
                Vencedor
              </Badge>
            )}
          </div>
          <span className={cn(
            'font-semibold',
            isWinning && 'text-primary'
          )}>
            {formatCurrency(bid.amount)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Clock className="h-3 w-3" />
          {formatTime(bid.timestamp)}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BidHistory({
  bids,
  lotStatus,
  initialPrice = 0,
  className,
  initialDisplayCount = 5,
  showDuringAuction = false,
}: BidHistoryProps) {
  const [showAll, setShowAll] = React.useState(false);

  // Verifica se pode exibir histórico (após encerramento OU se showDuringAuction=true)
  const canShowHistory = showDuringAuction || ['ENCERRADO', 'VENDIDO', 'FINALIZADO'].includes(lotStatus);

  // Ordena lances por valor (maior primeiro) ou timestamp (mais recente primeiro)
  const sortedBids = React.useMemo(() => {
    return [...bids].sort((a, b) => b.amount - a.amount);
  }, [bids]);

  // Lances a exibir
  const displayedBids = showAll 
    ? sortedBids 
    : sortedBids.slice(0, initialDisplayCount);

  // Estatísticas
  const stats = React.useMemo(() => {
    return calculateStats(sortedBids, initialPrice);
  }, [sortedBids, initialPrice]);

  // Se não pode mostrar, exibe mensagem de bloqueio
  if (!canShowHistory) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Lances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium">Histórico Indisponível</p>
            <p className="text-sm text-muted-foreground">
              O histórico de lances será liberado após o encerramento do leilão.
            </p>
            <Badge variant="secondary" className="mt-3">
              {bids.length} lance{bids.length !== 1 && 's'} registrado{bids.length !== 1 && 's'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se não há lances
  if (bids.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Lances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum lance foi registrado para este lote.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Lances
        </CardTitle>
        <CardDescription>
          Lances anonimizados do leilão encerrado
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={TrendingUp}
            label="Total de Lances"
            value={stats.totalBids}
          />
          <StatCard
            icon={Users}
            label="Lançadores"
            value={stats.uniqueBidders}
          />
          <StatCard
            icon={Award}
            label="Maior Lance"
            value={formatCurrency(stats.highestBid)}
          />
          <StatCard
            icon={TrendingUp}
            label="Valorização"
            value={`+${stats.priceIncreasePercent.toFixed(1)}%`}
            subValue={formatCurrency(stats.priceIncrease)}
          />
        </div>

        <Separator />

        {/* Timeline de Lances */}
        <div className="space-y-0">
          <h4 className="font-medium text-sm mb-4">Evolução dos Lances</h4>
          {displayedBids.map((bid, index) => (
            <BidTimelineItem
              key={bid.id}
              bid={bid}
              index={index}
              total={sortedBids.length}
              isLast={index === displayedBids.length - 1}
            />
          ))}
        </div>

        {/* Botão Ver Mais/Menos */}
        {sortedBids.length > initialDisplayCount && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Ver Menos
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Ver Todos ({sortedBids.length - initialDisplayCount} a mais)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default BidHistory;
export type { BidRecord, BidStats, BidHistoryProps };
