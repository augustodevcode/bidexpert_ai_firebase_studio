/**
 * @fileoverview Log scrollável de lances do monitor.
 * Exibe lances em tempo real com animação de entrada, pseudonimização e badge de origem.
 */
'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bot, User, Trophy } from 'lucide-react';
import type { RealtimeBid } from '@/hooks/use-realtime-bids';

interface MonitorBidLogProps {
  bids: RealtimeBid[];
  currentUserId?: string;
  maxVisible?: number;
}

export default function MonitorBidLog({ bids, currentUserId, maxVisible = 50 }: MonitorBidLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top on new bid
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [bids[0]?.id]);

  const visibleBids = bids.slice(0, maxVisible);

  return (
    <div data-ai-id="monitor-bid-log" className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h3 className="text-base font-bold">Histórico de Lances</h3>
        {bids.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {bids.length} lance{bids.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-2">
          {visibleBids.length > 0 ? (
            visibleBids.map((bid, index) => {
              const isTop = index === 0;
              const isMine = currentUserId && bid.bidderId === currentUserId;
              const isAutomatic = bid.isAutoBid || bid.bidOrigin === 'AUTO_BID';

              return (
                <div
                  key={bid.id}
                  data-ai-id={`monitor-bid-log-item-${index}`}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all duration-300
                    ${isTop ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-sm' : ''}
                    ${isMine && !isTop ? 'bg-primary/5 border-primary/20' : ''}
                    ${!isTop && !isMine ? 'bg-card border-border/50' : ''}
                    ${index === 0 ? 'animate-in slide-in-from-top-2 duration-300' : ''}
                  `}
                >
                  {/* Ícone */}
                  <div className={`
                    shrink-0 flex items-center justify-center w-8 h-8 rounded-full
                    ${isTop ? 'bg-emerald-500 text-white' : isAutomatic ? 'bg-violet-100 text-violet-600' : 'bg-muted text-muted-foreground'}
                  `}>
                    {isTop ? <Trophy className="h-4 w-4" /> : isAutomatic ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Valor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${isTop ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                        {formatCurrency(bid.amount)}
                      </span>
                      {isAutomatic && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-violet-300 text-violet-600">
                          Auto
                        </Badge>
                      )}
                      {isMine && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary text-primary">
                          Você
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {bid.bidderDisplay} &middot; {format(new Date(bid.timestamp), 'HH:mm:ss', { locale: ptBR })}
                    </p>
                  </div>

                  {/* Ranking */}
                  <span className={`text-xs font-bold tabular-nums ${isTop ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    #{visibleBids.length - index}
                  </span>
                </div>
              );
            })
          ) : (
            <div data-ai-id="monitor-bid-log-empty" className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <User className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm italic">Nenhum lance registrado ainda.</p>
              <p className="text-xs mt-1">Seja o primeiro a dar um lance!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
