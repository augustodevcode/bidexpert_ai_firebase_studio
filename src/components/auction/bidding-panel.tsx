
'use client';

import { useState } from 'react';
import type { Lot } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Zap, Clock, Info, Gavel, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BiddingPanelProps {
  currentLot: Lot;
}

// Placeholder bid history
const sampleBidHistory = [
  { bidder: 'Usuário A...', amount: 5200, time: '10:35:12' },
  { bidder: 'Usuário B...', amount: 5100, time: '10:34:50' },
  { bidder: 'Usuário C...', amount: 5000, time: '10:33:05' },
  { bidder: 'Usuário D...', amount: 4900, time: '10:32:11' },
  { bidder: 'Usuário E...', amount: 4800, time: '10:31:00' },
];

export default function BiddingPanel({ currentLot }: BiddingPanelProps) {
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const currentBid = currentLot.price;
  const bidIncrement = currentLot.bidIncrementStep || ((currentLot.price || 0) > 10000 ? 500 : ((currentLot.price || 0) > 1000 ? 100 : 50));
  const nextMinimumBid = currentBid + bidIncrement;
  
  const displayBidAmount = parseFloat(bidAmount || '0');
  const finalBidAmount = displayBidAmount >= nextMinimumBid ? displayBidAmount : nextMinimumBid;
  const bidButtonLabel = `Dar Lance (R$ ${finalBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;


  const handlePlaceBid = () => {
    setIsPlacingBid(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Lance Enviado (Simulação)",
        description: `Seu lance de R$ ${finalBidAmount.toLocaleString('pt-BR')} para "${currentLot.title}" foi registrado.`,
      });
      setBidAmount('');
      setIsPlacingBid(false);
    }, 1000);
  };

  const canBid = currentLot.status === 'ABERTO_PARA_LANCES';

  return (
    <Card className="h-full flex flex-col shadow-lg rounded-lg">
      <CardHeader className="p-3 md:p-4 border-b">
        <CardTitle className="text-lg md:text-xl font-bold flex items-center">
          <Gavel className="h-5 w-5 mr-2 text-primary" /> Painel de Lances
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4 flex-1 flex flex-col gap-3 md:gap-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-secondary/50 p-2 md:p-3 rounded-md text-center">
            <p className="text-xs text-muted-foreground">Lance Atual</p>
            <p className="text-xl md:text-2xl font-bold text-primary">
              R$ {currentBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-secondary/50 p-2 md:p-3 rounded-md text-center">
            <p className="text-xs text-muted-foreground">Próximo Lance Mínimo</p>
            <p className="text-lg md:text-xl font-semibold text-foreground">
              R$ {nextMinimumBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {canBid ? (
          <>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder={`Ou seu lance (mín. R$ ${nextMinimumBid.toLocaleString('pt-BR')})`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="pl-9 h-11 text-base"
                min={nextMinimumBid}
                step={bidIncrement}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground -mt-2">
                Incremento mínimo: R$ {bidIncrement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <Button onClick={handlePlaceBid} disabled={isPlacingBid} className="w-full h-11 text-base">
              {isPlacingBid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : bidButtonLabel}
            </Button>

            <div className="flex items-center justify-between space-x-2 p-3 border rounded-md bg-muted/20">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <Label htmlFor="autobid-switch" className="text-sm font-medium">Lance Automático</Label>
              </div>
              <Switch
                id="autobid-switch"
                checked={autoBidEnabled}
                onCheckedChange={setAutoBidEnabled}
              />
            </div>
            {autoBidEnabled && (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Seu lance máximo"
                  value={autoBidMax}
                  onChange={(e) => setAutoBidMax(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-4 bg-destructive/10 text-destructive rounded-md">
            <Info className="h-5 w-5 mx-auto mb-1" />
            <p className="text-sm font-medium">Os lances para este lote estão encerrados ou ainda não iniciaram.</p>
          </div>
        )}
        
        <div className="flex-1 flex flex-col min-h-0">
          <h4 className="text-sm font-semibold text-muted-foreground mb-1.5 flex items-center">
            <Clock className="h-4 w-4 mr-1.5" /> Histórico Recente de Lances
          </h4>
          <ScrollArea className="flex-grow border rounded-md bg-secondary/20">
            <div className="p-2 space-y-1.5 text-xs">
              {sampleBidHistory.map((bid, index) => (
                <div key={index} className={`flex justify-between items-center p-1.5 rounded ${index === 0 ? 'bg-green-100 dark:bg-green-800/30 font-semibold' : ''}`}>
                  <span>{bid.bidder}</span>
                  <span className="text-right">
                    R$ {bid.amount.toLocaleString('pt-BR')} <span className="text-muted-foreground/70">({bid.time})</span>
                  </span>
                </div>
              ))}
               {sampleBidHistory.length === 0 && <p className="text-center text-muted-foreground p-2">Nenhum lance ainda.</p>}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
