/**
 * @fileoverview Simulador de custo total (CET/TCO) do detalhe do lote.
 */
'use client';

import * as React from 'react';
import { Building, Calculator, FileText, Info, Scale, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency, toMonetaryNumber } from '@/lib/format';
import {
  buildCostSimulation,
  type CostBreakdown,
  type CostBreakdownItem,
  type CostConfig,
} from '@/lib/lots/cost-simulation-engine';

export interface CostSimulatorProps {
  initialPrice?: number;
  recommendedBidAmount?: number;
  costConfig?: Partial<CostConfig>;
  stateUf?: string;
  categoryName?: string | null;
  lotTitle?: string;
  className?: string;
  onCalculate?: (breakdown: CostBreakdown) => void;
}

function getItemIcon(item: CostBreakdownItem) {
  if (item.key === 'commission') return Scale;
  if (item.key === 'itbi' || item.key === 'registry') return Building;
  if (item.key === 'logistics' || item.key === 'transfer') return Truck;
  return FileText;
}

function normalizeInputValue(value: string): string {
  return value.replace(/[^\d,.-]/g, '');
}

export function CostSimulator({
  initialPrice = 0,
  recommendedBidAmount,
  costConfig,
  stateUf,
  categoryName,
  lotTitle,
  className,
  onCalculate,
}: CostSimulatorProps) {
  const suggestedAmount = React.useMemo(() => {
    return toMonetaryNumber(recommendedBidAmount) > 0
      ? toMonetaryNumber(recommendedBidAmount)
      : toMonetaryNumber(initialPrice);
  }, [initialPrice, recommendedBidAmount]);

  const [inputValue, setInputValue] = React.useState(suggestedAmount > 0 ? suggestedAmount.toFixed(2) : '');
  const [breakdown, setBreakdown] = React.useState<CostBreakdown | null>(null);

  const effectiveConfig = React.useMemo(() => ({
    ...costConfig,
    categoryName: costConfig?.categoryName ?? categoryName ?? null,
    stateUf: costConfig?.stateUf ?? stateUf ?? null,
  }), [categoryName, costConfig, stateUf]);

  const runSimulation = React.useCallback((rawValue: string) => {
    const purchasePrice = toMonetaryNumber(rawValue);
    if (purchasePrice <= 0) {
      setBreakdown(null);
      return;
    }

    const nextBreakdown = buildCostSimulation({
      purchasePrice,
      config: effectiveConfig,
    });

    setBreakdown(nextBreakdown);
    onCalculate?.(nextBreakdown);
  }, [effectiveConfig, onCalculate]);

  React.useEffect(() => {
    const nextValue = suggestedAmount > 0 ? suggestedAmount.toFixed(2) : '';
    setInputValue(nextValue);
    if (nextValue) {
      runSimulation(nextValue);
    }
  }, [runSimulation, suggestedAmount]);

  return (
    <Card className={cn('w-full', className)} data-ai-id="lot-cost-simulator">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Simulador CET / custo total
            </CardTitle>
            <CardDescription>
              Simule o desembolso total a partir do próximo lance válido, incluindo comissão, tributos e despesas estimadas.
            </CardDescription>
          </div>
          {effectiveConfig.commissionRatePercent ? (
            <Badge variant="outline">
              Comissão {effectiveConfig.commissionRatePercent.toFixed(2)}%
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Base sugerida para simulação</AlertTitle>
          <AlertDescription>
            {lotTitle ? `Lote: ${lotTitle}. ` : ''}
            {suggestedAmount > 0
              ? `O cálculo inicia com ${formatCurrency(suggestedAmount)} porque este é o valor sugerido para entrar na disputa agora.`
              : 'Informe o valor que deseja simular para obter o custo total estimado.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="lot-cost-simulator-input">Valor da arrematação simulada</Label>
          <Input
            id="lot-cost-simulator-input"
            data-ai-id="lot-cost-simulator-input"
            inputMode="decimal"
            placeholder="Digite o valor que deseja simular"
            value={inputValue}
            onChange={(event) => setInputValue(normalizeInputValue(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                runSimulation(inputValue);
              }
            }}
          />
        </div>

        <Button className="w-full" onClick={() => runSimulation(inputValue)} data-ai-id="lot-cost-simulator-run">
          <Calculator className="mr-2 h-4 w-4" />
          Recalcular custo total
        </Button>

        {breakdown ? (
          <div className="space-y-4" data-ai-id="lot-cost-simulator-breakdown">
            <Separator />
            <div className="space-y-2">
              {breakdown.items.map((item) => {
                const Icon = getItemIcon(item);
                return (
                  <div key={item.key} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          {!item.isRequired ? <Badge variant="outline">Opcional</Badge> : null}
                        </div>
                        {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
                      {item.percentage !== undefined ? (
                        <p className="text-xs text-muted-foreground">{item.percentage.toFixed(2)}%</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Custos acessórios estimados</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(breakdown.totalCosts)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{breakdown.costPercentage.toFixed(2)}% do valor simulado</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4" data-ai-id="lot-cost-simulator-total">
                <p className="text-sm text-muted-foreground">Investimento total estimado</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{formatCurrency(breakdown.totalInvestment)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Lance + comissão + despesas estimadas</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{breakdown.disclaimer}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default CostSimulator;
export type { CostConfig, CostBreakdown } from '@/lib/lots/cost-simulation-engine';
