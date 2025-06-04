
'use client';

import type { Lot } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListOrdered } from 'lucide-react';

interface UpcomingLotsPanelProps {
  lots: Lot[];
  currentLotId: string;
}

export default function UpcomingLotsPanel({ lots, currentLotId }: UpcomingLotsPanelProps) {
  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-md">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-md font-semibold flex items-center">
          <ListOrdered className="h-4 w-4 mr-2 text-primary" /> Próximos Lotes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2">
            {lots.length === 0 && (
              <p className="text-xs text-muted-foreground text-center p-4">Não há mais lotes programados para este leilão.</p>
            )}
            {lots.map((lot) => (
              <Link
                key={lot.id}
                href={`/auctions/${lot.auctionId}/lots/${lot.id}?live=true`} // Assuming a query param to stay in live context
                className={`block p-2 rounded-md hover:bg-accent transition-colors ${
                  lot.id === currentLotId ? 'bg-primary/10 border border-primary' : 'bg-secondary/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative w-14 h-10 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                    <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "miniatura proximo lote"} />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="text-xs font-medium text-foreground truncate">
                      Lote {lot.number || lot.id.replace('LOTE', '')}: {lot.title}
                    </p>
                    <p className="text-xs text-primary font-semibold">
                      Inicia em: R$ {(lot.initialPrice || lot.price).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
