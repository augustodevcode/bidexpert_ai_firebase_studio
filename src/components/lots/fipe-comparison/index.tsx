/**
 * @fileoverview Comparação com Tabela FIPE
 * @description Exibe comparativo entre preço do leilão e valor FIPE do veículo
 * @module components/lots/fipe-comparison/index
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Star,
  Car,
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// =============================================================================
// TYPES
// =============================================================================

interface FipeData {
  /** Código FIPE */
  fipeCode?: string;
  /** Preço FIPE */
  fipePrice: number;
  /** Mês de referência (ex: "2024-12") */
  referenceMonth: string;
  /** Ajuste por quilometragem */
  mileageAdjustment?: number;
  /** Ajuste por condição */
  conditionAdjustment?: number;
  /** Preço ajustado final */
  adjustedPrice?: number;
}

interface VehicleInfo {
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
}

interface FipeComparisonProps {
  /** Preço do leilão */
  auctionPrice: number;
  /** Dados FIPE */
  fipeData?: FipeData | null;
  /** Informações do veículo */
  vehicleInfo?: VehicleInfo;
  /** Se está carregando dados */
  isLoading?: boolean;
  /** Callback para atualizar dados */
  onRefresh?: () => void;
  /** Classes adicionais */
  className?: string;
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

const formatMileage = (mileage: number): string => {
  return new Intl.NumberFormat('pt-BR').format(mileage) + ' km';
};

const formatReferenceMonth = (month: string): string => {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
};

/**
 * Calcula o score de oportunidade para veículos (0-5 estrelas)
 */
const calculateOpportunityScore = (discountPercent: number): number => {
  if (discountPercent >= 40) return 5;
  if (discountPercent >= 30) return 4.5;
  if (discountPercent >= 25) return 4;
  if (discountPercent >= 20) return 3.5;
  if (discountPercent >= 15) return 3;
  if (discountPercent >= 10) return 2.5;
  if (discountPercent >= 5) return 2;
  if (discountPercent >= 0) return 1.5;
  return 1;
};

const getOpportunityLabel = (score: number): string => {
  if (score >= 4.5) return 'Excelente Oportunidade';
  if (score >= 4) return 'Ótima Oportunidade';
  if (score >= 3) return 'Boa Oportunidade';
  if (score >= 2) return 'Oportunidade Moderada';
  return 'Próximo ao Mercado';
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface OpportunityStarsProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const OpportunityStars: React.FC<OpportunityStarsProps> = ({ score, size = 'md' }) => {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
        />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className={cn(sizeClasses[size], 'text-muted-foreground')} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(sizeClasses[size], 'text-muted-foreground')}
        />
      ))}
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

const NoDataState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
    <p className="font-medium">Dados FIPE não disponíveis</p>
    <p className="text-sm text-muted-foreground">
      Não foi possível obter o valor de referência FIPE para este veículo.
    </p>
    {onRefresh && (
      <Button variant="outline" size="sm" className="mt-3" onClick={onRefresh}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar Novamente
      </Button>
    )}
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FipeComparison({
  auctionPrice,
  fipeData,
  vehicleInfo,
  isLoading = false,
  onRefresh,
  className,
}: FipeComparisonProps) {
  // Se está carregando
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Comparação FIPE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  // Se não há dados FIPE
  if (!fipeData) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Comparação FIPE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NoDataState onRefresh={onRefresh} />
        </CardContent>
      </Card>
    );
  }

  // Usa preço ajustado se disponível, senão preço FIPE base
  const referencePrice = fipeData.adjustedPrice || fipeData.fipePrice;
  
  // Cálculos de comparação
  const difference = referencePrice - auctionPrice;
  const discountPercent = (difference / referencePrice) * 100;
  const isDiscount = difference > 0;
  const opportunityScore = calculateOpportunityScore(discountPercent);
  const opportunityLabel = getOpportunityLabel(opportunityScore);

  // Para barras de progresso
  const maxPrice = Math.max(auctionPrice, referencePrice);
  const auctionPercent = (auctionPrice / maxPrice) * 100;
  const fipePercent = (referencePrice / maxPrice) * 100;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Comparação FIPE
        </CardTitle>
        {vehicleInfo && (
          <CardDescription>
            {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Indicador de Oportunidade */}
        <div className={cn(
          'rounded-lg p-4 text-center',
          isDiscount ? 'bg-green-50 dark:bg-green-950' : 'bg-yellow-50 dark:bg-yellow-950'
        )}>
          <div className="flex justify-center mb-2">
            <OpportunityStars score={opportunityScore} size="lg" />
          </div>
          <p className={cn(
            'font-semibold text-lg',
            isDiscount ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
          )}>
            {opportunityLabel}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {isDiscount ? (
              <TrendingDown className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            )}
            <span className={cn(
              'text-2xl font-bold',
              isDiscount ? 'text-green-600' : 'text-yellow-600'
            )}>
              {isDiscount ? '-' : '+'}{Math.abs(discountPercent).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isDiscount ? 'abaixo' : 'acima'} da tabela FIPE
          </p>
        </div>

        {/* Comparação Visual */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço do Leilão</span>
              <span className="font-medium text-primary">{formatCurrency(auctionPrice)}</span>
            </div>
            <Progress value={auctionPercent} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                Valor FIPE
                {fipeData.adjustedPrice && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Valor ajustado por quilometragem e condição
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
              <span className="font-medium">{formatCurrency(referencePrice)}</span>
            </div>
            <Progress value={fipePercent} className="h-2 bg-muted [&>div]:bg-muted-foreground" />
          </div>
        </div>

        {/* Economia */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Economia Potencial</p>
            <p className={cn(
              'font-semibold text-lg',
              isDiscount ? 'text-green-600' : 'text-yellow-600'
            )}>
              {formatCurrency(Math.abs(difference))}
            </p>
          </div>
          {vehicleInfo?.mileage && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Quilometragem</p>
              <p className="font-semibold text-lg">
                {formatMileage(vehicleInfo.mileage)}
              </p>
            </div>
          )}
        </div>

        {/* Detalhes FIPE */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Detalhes da Avaliação</p>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">FIPE Base</p>
              <p className="font-medium">{formatCurrency(fipeData.fipePrice)}</p>
            </div>
            {fipeData.fipeCode && (
              <div>
                <p className="text-muted-foreground">Código FIPE</p>
                <p className="font-medium">{fipeData.fipeCode}</p>
              </div>
            )}
            {fipeData.mileageAdjustment && (
              <div>
                <p className="text-muted-foreground">Ajuste KM</p>
                <p className={cn(
                  'font-medium',
                  fipeData.mileageAdjustment < 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(fipeData.mileageAdjustment)}
                </p>
              </div>
            )}
            {fipeData.conditionAdjustment && (
              <div>
                <p className="text-muted-foreground">Ajuste Condição</p>
                <p className={cn(
                  'font-medium',
                  fipeData.conditionAdjustment < 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(fipeData.conditionAdjustment)}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Referência: {formatReferenceMonth(fipeData.referenceMonth)}
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground italic">
          * Valores FIPE são referência de mercado. O preço real pode variar 
          conforme condição, acessórios e demanda regional.
        </p>
      </CardContent>
    </Card>
  );
}

export default FipeComparison;
export type { FipeData, VehicleInfo, FipeComparisonProps };
