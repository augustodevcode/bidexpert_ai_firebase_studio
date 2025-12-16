/**
 * @fileoverview Comparação com Preços de Mercado
 * @description Exibe comparativo entre preço do leilão e valor de mercado
 * @module components/lots/market-comparison/index
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Star,
  MapPin,
  BarChart3,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// =============================================================================
// TYPES
// =============================================================================

interface MarketPriceData {
  /** Preço médio por m² na região */
  pricePerSquareMeter: number;
  /** Preço mínimo registrado */
  minPrice?: number;
  /** Preço máximo registrado */
  maxPrice?: number;
  /** Preço mediano */
  medianPrice?: number;
  /** Fonte dos dados */
  dataSource?: string;
  /** Data de referência */
  referenceDate?: Date | string;
  /** Tamanho da amostra */
  sampleSize?: number;
}

interface MarketComparisonProps {
  /** Preço do leilão */
  auctionPrice: number;
  /** Área total do imóvel em m² */
  totalArea?: number;
  /** Dados de mercado */
  marketData?: MarketPriceData;
  /** Localização (cidade, estado) */
  location?: {
    city?: string;
    state?: string;
    neighborhood?: string;
  };
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

const _formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Calcula o score de oportunidade (0-5 estrelas)
 * Baseado na diferença percentual entre preço do leilão e mercado
 */
const calculateOpportunityScore = (discountPercent: number): number => {
  if (discountPercent >= 50) return 5;
  if (discountPercent >= 40) return 4.5;
  if (discountPercent >= 30) return 4;
  if (discountPercent >= 20) return 3.5;
  if (discountPercent >= 10) return 3;
  if (discountPercent >= 5) return 2.5;
  if (discountPercent >= 0) return 2;
  return 1; // Premium sobre mercado
};

const getOpportunityLabel = (score: number): string => {
  if (score >= 4.5) return 'Excelente Oportunidade';
  if (score >= 4) return 'Ótima Oportunidade';
  if (score >= 3) return 'Boa Oportunidade';
  if (score >= 2) return 'Oportunidade Moderada';
  return 'Acima do Mercado';
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
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
        />
      ))}
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className={cn(sizeClasses[size], 'text-muted-foreground')} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />
          </div>
        </div>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(sizeClasses[size], 'text-muted-foreground')}
        />
      ))}
    </div>
  );
};

interface PriceComparisonBarProps {
  auctionPrice: number;
  marketPrice: number;
}

const PriceComparisonBar: React.FC<PriceComparisonBarProps> = ({ 
  auctionPrice, 
  marketPrice 
}) => {
  const maxPrice = Math.max(auctionPrice, marketPrice);
  const auctionPercent = (auctionPrice / maxPrice) * 100;
  const marketPercent = (marketPrice / maxPrice) * 100;

  return (
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
          <span className="text-muted-foreground">Preço de Mercado</span>
          <span className="font-medium">{formatCurrency(marketPrice)}</span>
        </div>
        <Progress value={marketPercent} className="h-2 bg-muted [&>div]:bg-muted-foreground" />
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MarketComparison({
  auctionPrice,
  totalArea,
  marketData,
  location,
  className,
}: MarketComparisonProps) {
  // Calcula o valor estimado de mercado
  const estimatedMarketValue = React.useMemo(() => {
    if (!marketData?.pricePerSquareMeter || !totalArea) return null;
    return marketData.pricePerSquareMeter * totalArea;
  }, [marketData?.pricePerSquareMeter, totalArea]);

  // Se não temos dados suficientes, não renderiza
  if (!estimatedMarketValue) {
    return null;
  }

  // Cálculos de comparação
  const difference = estimatedMarketValue - auctionPrice;
  const discountPercent = (difference / estimatedMarketValue) * 100;
  const isDiscount = difference > 0;
  const opportunityScore = calculateOpportunityScore(discountPercent);
  const opportunityLabel = getOpportunityLabel(opportunityScore);

  // Preço por m² do leilão
  const auctionPricePerSqm = totalArea ? auctionPrice / totalArea : null;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Comparação com Mercado
        </CardTitle>
        {location && (
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[location.neighborhood, location.city, location.state].filter(Boolean).join(', ')}
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
            {isDiscount ? 'abaixo' : 'acima'} do valor de mercado
          </p>
        </div>

        {/* Comparação Visual */}
        <PriceComparisonBar 
          auctionPrice={auctionPrice} 
          marketPrice={estimatedMarketValue} 
        />

        {/* Detalhes */}
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
          {auctionPricePerSqm && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Preço/m² (Leilão)</p>
              <p className="font-semibold text-lg">
                {formatCurrency(auctionPricePerSqm)}
              </p>
            </div>
          )}
        </div>

        {/* Dados de Mercado */}
        {marketData && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-medium">Dados de Mercado</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Valores baseados em transações reais na região.
                      {marketData.sampleSize && ` Amostra: ${marketData.sampleSize} imóveis.`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Preço/m² (Mercado)</p>
                <p className="font-medium">{formatCurrency(marketData.pricePerSquareMeter)}</p>
              </div>
              {marketData.medianPrice && (
                <div>
                  <p className="text-muted-foreground">Mediana</p>
                  <p className="font-medium">{formatCurrency(marketData.medianPrice)}</p>
                </div>
              )}
              {marketData.minPrice && marketData.maxPrice && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Faixa de Preço</p>
                  <p className="font-medium">
                    {formatCurrency(marketData.minPrice)} - {formatCurrency(marketData.maxPrice)}
                  </p>
                </div>
              )}
            </div>

            {marketData.dataSource && (
              <p className="text-xs text-muted-foreground mt-3">
                Fonte: {marketData.dataSource}
                {marketData.referenceDate && (
                  <span className="ml-1">
                    (Ref: {new Date(marketData.referenceDate).toLocaleDateString('pt-BR')})
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground italic">
          * Valores estimados com base em dados de mercado da região. 
          Recomenda-se avaliação profissional antes da decisão de compra.
        </p>
      </CardContent>
    </Card>
  );
}

export default MarketComparison;
export type { MarketPriceData, MarketComparisonProps };
