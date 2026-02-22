/**
 * @fileoverview Painel de lance automático (proxy bidding) no monitor.
 * Permite configurar valor máximo e incremento para auto-bid.
 * Exibe status atual do auto-bid (ativo/inativo) e lances disparados.
 */
'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Power, PowerOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format';

interface MonitorAutoBidPanelProps {
  lotId: string;
  auctionId: string;
  currentPrice: number;
  minimumIncrement: number;
  isEnabled?: boolean;
  onActivate?: (maxAmount: number) => Promise<boolean>;
  onDeactivate?: () => Promise<boolean>;
}

export default function MonitorAutoBidPanel({
  lotId,
  auctionId,
  currentPrice,
  minimumIncrement,
  isEnabled = true,
  onActivate,
  onDeactivate,
}: MonitorAutoBidPanelProps) {
  const { toast } = useToast();
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActivate = useCallback(async () => {
    const amount = parseFloat(maxAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!amount || amount <= currentPrice) {
      toast({
        title: 'Valor inválido',
        description: `O valor máximo deve ser maior que ${formatCurrency(currentPrice)}`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const ok = onActivate ? await onActivate(amount) : true;
      if (ok) {
        setIsActive(true);
        toast({ title: 'Auto-bid ativado', description: `Limite: ${formatCurrency(amount)}` });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [maxAmount, currentPrice, onActivate, toast]);

  const handleDeactivate = useCallback(async () => {
    setIsProcessing(true);
    try {
      const ok = onDeactivate ? await onDeactivate() : true;
      if (ok) {
        setIsActive(false);
        setMaxAmount('');
        toast({ title: 'Auto-bid desativado' });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onDeactivate, toast]);

  if (!isEnabled) {
    return (
      <Card data-ai-id="monitor-autobid-disabled" className="p-4 bg-muted/50 border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bot className="h-4 w-4" />
          <span className="text-sm">Lance automático desabilitado pelo administrador</span>
        </div>
      </Card>
    );
  }

  return (
    <Card data-ai-id="monitor-autobid-panel" className="p-4 bg-card border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Lance Automático</span>
        </div>
        {isActive && (
          <Badge data-ai-id="monitor-autobid-active-badge" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            Ativo
          </Badge>
        )}
      </div>

      {!isActive ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="autobid-max" className="text-xs text-muted-foreground">
              Valor máximo (limite)
            </Label>
            <Input
              id="autobid-max"
              data-ai-id="monitor-autobid-max-input"
              type="text"
              placeholder={formatCurrency(currentPrice + minimumIncrement * 5)}
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>O sistema dará lances automaticamente até o valor limite quando você for superado.</span>
          </div>

          <Button
            data-ai-id="monitor-autobid-activate-btn"
            onClick={handleActivate}
            disabled={isProcessing || !maxAmount}
            className="w-full"
            size="sm"
          >
            <Power className="h-4 w-4 mr-2" />
            {isProcessing ? 'Ativando...' : 'Ativar Auto-Bid'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-md p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Limite configurado</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(parseFloat(maxAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0)}
            </p>
          </div>

          <Button
            data-ai-id="monitor-autobid-deactivate-btn"
            onClick={handleDeactivate}
            disabled={isProcessing}
            variant="destructive"
            className="w-full"
            size="sm"
          >
            <PowerOff className="h-4 w-4 mr-2" />
            {isProcessing ? 'Desativando...' : 'Desativar Auto-Bid'}
          </Button>
        </div>
      )}
    </Card>
  );
}
