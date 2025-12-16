/**
 * @file src/components/lots/retail-price-comparison/index.tsx
 * @description Componente de comparação de preços de varejo para eletrônicos.
 * Integra com APIs de e-commerce (ML, Buscapé) para mostrar referência de preço.
 * 
 * Gap 3.2 - Preço varejo para confiança em eletrônicos
 */

"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle,
  Sparkles,
  Store,
  Clock,
  Info
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface RetailPriceSource {
  sourceName: string;
  sourceUrl: string;
  sourceIcon?: string;
  price: number;
  condition: "new" | "refurbished" | "used";
  lastUpdated: Date;
  inStock: boolean;
  shippingCost?: number;
}

export interface RetailPriceData {
  assetId: string;
  productName: string;
  productModel?: string;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  sources: RetailPriceSource[];
  priceHistory?: { date: Date; price: number }[];
  lastFetchedAt: Date;
  confidenceScore: number; // 0-100
}

export interface RetailPriceComparisonProps {
  priceData: RetailPriceData | null;
  currentBid: number;
  auctionMinBid?: number;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getConditionLabel = (condition: RetailPriceSource["condition"]): string => {
  const labels = {
    new: "Novo",
    refurbished: "Recondicionado",
    used: "Usado",
  };
  return labels[condition];
};

const getConditionBadgeVariant = (condition: RetailPriceSource["condition"]) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    new: "default",
    refurbished: "secondary",
    used: "outline",
  };
  return variants[condition];
};

const calculateSavings = (retailPrice: number, currentBid: number): number => {
  return Math.max(0, ((retailPrice - currentBid) / retailPrice) * 100);
};

// ============================================================================
// Sub-components
// ============================================================================

interface PriceSourceItemProps {
  source: RetailPriceSource;
  currentBid: number;
}

const PriceSourceItem: React.FC<PriceSourceItemProps> = ({ source, currentBid }) => {
  const savings = calculateSavings(source.price, currentBid);
  const _totalPrice = source.price + (source.shippingCost || 0);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-background flex items-center justify-center">
          <Store className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{source.sourceName}</span>
            <Badge variant={getConditionBadgeVariant(source.condition)} className="text-[10px]">
              {getConditionLabel(source.condition)}
            </Badge>
            {!source.inStock && (
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive">
                Esgotado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Atualizado {formatDate(source.lastUpdated)}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold">{formatCurrency(source.price)}</div>
        {source.shippingCost !== undefined && source.shippingCost > 0 && (
          <div className="text-xs text-muted-foreground">
            + {formatCurrency(source.shippingCost)} frete
          </div>
        )}
        {savings > 0 && (
          <div className="text-xs text-green-600 flex items-center justify-end gap-1">
            <TrendingDown className="h-3 w-3" />
            {savings.toFixed(0)}% economia
          </div>
        )}
        <a
          href={source.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center justify-end gap-1 mt-1"
        >
          Ver oferta <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

interface OpportunityMeterProps {
  currentBid: number;
  averagePrice: number;
  lowestPrice: number;
}

const OpportunityMeter: React.FC<OpportunityMeterProps> = ({
  currentBid,
  averagePrice,
  lowestPrice,
}) => {
  // Calculate opportunity score (0-100)
  // 100 = bid is 50% or less of average
  // 50 = bid equals lowest retail price
  // 0 = bid equals or exceeds average
  const opportunityScore = useMemo(() => {
    if (currentBid >= averagePrice) return 0;
    if (currentBid <= lowestPrice * 0.5) return 100;
    
    const range = averagePrice - (lowestPrice * 0.5);
    const position = averagePrice - currentBid;
    return Math.round((position / range) * 100);
  }, [currentBid, averagePrice, lowestPrice]);

  const getScoreLabel = () => {
    if (opportunityScore >= 80) return { label: "Excelente Oportunidade!", color: "text-green-600" };
    if (opportunityScore >= 60) return { label: "Boa Oportunidade", color: "text-green-500" };
    if (opportunityScore >= 40) return { label: "Oportunidade Moderada", color: "text-yellow-500" };
    if (opportunityScore >= 20) return { label: "Economia Limitada", color: "text-orange-500" };
    return { label: "Sem Vantagem", color: "text-red-500" };
  };

  const scoreInfo = getScoreLabel();

  return (
    <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Índice de Oportunidade</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{opportunityScore}</div>
          <div className="text-xs text-muted-foreground">de 100</div>
        </div>
      </div>
      <Progress 
        value={opportunityScore} 
        className="h-3"
      />
      <div className={`text-sm font-medium ${scoreInfo.color} flex items-center gap-2`}>
        {opportunityScore >= 60 ? (
          <TrendingUp className="h-4 w-4" />
        ) : opportunityScore >= 40 ? (
          <TrendingDown className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        {scoreInfo.label}
      </div>
    </div>
  );
};

interface PriceSummaryProps {
  currentBid: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  currentBid,
  averagePrice,
  lowestPrice,
  highestPrice,
}) => {
  const savingsVsAverage = calculateSavings(averagePrice, currentBid);
  const savingsVsLowest = calculateSavings(lowestPrice, currentBid);

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="text-xs text-muted-foreground mb-1">Menor Preço</div>
        <div className="font-bold text-green-600">{formatCurrency(lowestPrice)}</div>
        {savingsVsLowest > 0 && (
          <div className="text-[10px] text-green-600">-{savingsVsLowest.toFixed(0)}%</div>
        )}
      </div>
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <div className="text-xs text-muted-foreground mb-1">Média Varejo</div>
        <div className="font-bold text-primary">{formatCurrency(averagePrice)}</div>
        {savingsVsAverage > 0 && (
          <div className="text-[10px] text-primary">-{savingsVsAverage.toFixed(0)}%</div>
        )}
      </div>
      <div className="p-3 rounded-lg bg-muted/50">
        <div className="text-xs text-muted-foreground mb-1">Maior Preço</div>
        <div className="font-bold text-muted-foreground">{formatCurrency(highestPrice)}</div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * RetailPriceComparison - Comparador de preços de varejo para eletrônicos
 * 
 * Funcionalidades:
 * - Comparação com múltiplas fontes (ML, Buscapé, Magazine Luiza)
 * - Índice de oportunidade visual
 * - Filtro por condição (novo, recondicionado, usado)
 * - Links diretos para ofertas
 * - Indicador de confiança dos dados
 */
export const RetailPriceComparison: React.FC<RetailPriceComparisonProps> = ({
  priceData,
  currentBid,
  auctionMinBid,
  onRefresh,
  isLoading = false,
  className = "",
}) => {
  const [conditionFilter, setConditionFilter] = useState<"all" | "new" | "refurbished" | "used">("all");

  const filteredSources = useMemo(() => {
    if (!priceData) return [];
    if (conditionFilter === "all") return priceData.sources;
    return priceData.sources.filter((s) => s.condition === conditionFilter);
  }, [priceData, conditionFilter]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-muted-foreground">Buscando preços de varejo...</p>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!priceData) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            Comparação de preços não disponível para este item.
          </p>
          {onRefresh && (
            <Button variant="outline" size="sm" className="mt-4" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Buscar Preços
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Comparação de Preços
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {priceData.productName}
              {priceData.productModel && ` • ${priceData.productModel}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant={priceData.confidenceScore >= 80 ? "default" : priceData.confidenceScore >= 50 ? "secondary" : "outline"}
                    className="gap-1"
                  >
                    <Info className="h-3 w-3" />
                    {priceData.confidenceScore}% confiança
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baseado em {priceData.sources.length} fontes de preço</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current bid highlight */}
        <Alert className="border-primary/50 bg-primary/5">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              {auctionMinBid && currentBid < auctionMinBid ? (
                <>Lance mínimo: <strong>{formatCurrency(auctionMinBid)}</strong></>
              ) : (
                <>Lance atual: <strong>{formatCurrency(currentBid)}</strong></>
              )}
            </span>
            <Badge variant="outline" className="text-primary border-primary">
              vs. Varejo
            </Badge>
          </AlertDescription>
        </Alert>

        {/* Opportunity meter */}
        <OpportunityMeter
          currentBid={auctionMinBid || currentBid}
          averagePrice={priceData.averagePrice}
          lowestPrice={priceData.lowestPrice}
        />

        {/* Price summary */}
        <PriceSummary
          currentBid={auctionMinBid || currentBid}
          averagePrice={priceData.averagePrice}
          lowestPrice={priceData.lowestPrice}
          highestPrice={priceData.highestPrice}
        />

        {/* Condition filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar:</span>
          <div className="flex gap-1">
            {(["all", "new", "refurbished", "used"] as const).map((condition) => (
              <Button
                key={condition}
                variant={conditionFilter === condition ? "default" : "outline"}
                size="sm"
                onClick={() => setConditionFilter(condition)}
              >
                {condition === "all" ? "Todos" : getConditionLabel(condition)}
              </Button>
            ))}
          </div>
        </div>

        {/* Sources list */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Fontes de Preço ({filteredSources.length})
          </h4>
          {filteredSources.length > 0 ? (
            <div className="space-y-2">
              {filteredSources.map((source, idx) => (
                <PriceSourceItem
                  key={`${source.sourceName}-${idx}`}
                  source={source}
                  currentBid={auctionMinBid || currentBid}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhuma fonte encontrada com este filtro.
            </div>
          )}
        </div>

        {/* Last updated */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Dados atualizados em {formatDate(priceData.lastFetchedAt)}
        </div>
      </CardContent>
    </Card>
  );
};

export default RetailPriceComparison;
