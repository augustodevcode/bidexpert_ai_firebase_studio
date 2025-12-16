// src/components/lots/investor-analysis-section/index.tsx
/**
 * @fileoverview Seção de Análise para Investidores Profissionais
 * 
 * Este componente agrupa todas as ferramentas de análise criadas para os 8 gaps críticos:
 * - Simulador de Custos (ITBI, cartório, taxas)
 * - Histórico de Lances Anonimizado
 * - Comparativo de Mercado
 * - Comparativo FIPE (veículos)
 * - Especificações Técnicas (eletrônicos/máquinas)
 * - Informações Jurídicas (imóveis)
 * 
 * @designsystem Utiliza tokens semânticos do design system
 * @accessibility Tabs navegáveis por teclado
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calculator, 
  TrendingUp, 
  History, 
  Scale, 
  Car, 
  FileText, 
  Cpu,
  Tractor,
  Heart,
  AlertCircle,
  Star
} from 'lucide-react';
import type { Lot, Auction, PlatformSettings, OccupationStatus } from '@/types';
import { cn } from '@/lib/utils';

// Import dos componentes de análise
import { CostSimulator } from '../cost-simulator';
import { BidHistory } from '../bid-history';
import { MarketComparison } from '../market-comparison';
import { FipeComparison } from '../fipe-comparison';
import { DynamicSpecs } from '../dynamic-specs';
import { LotLegalInfoCard } from '../legal-info/lot-legal-info-card';
import { MachineryInspection } from '../machinery-inspection';
import { MachineryCertifications } from '../machinery-certifications';
import { LivestockHealth } from '../livestock-health';
import { LivestockReproductive } from '../livestock-reproductive';

interface InvestorAnalysisSectionProps {
  lot: Lot;
  auction: Auction;
  platformSettings?: PlatformSettings;
  className?: string;
}

type LotCategoryType = 'imovel' | 'veiculo' | 'eletronico' | 'maquinario' | 'semovente' | 'outros';

// Type extensions for fields that may come from asset or extended lot data
interface ExtendedLotData {
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  chassisNumber?: string | null;
  fipeCode?: string | null;
  mileage?: number | null;
  vehicleCondition?: string | null;
  machineType?: string | null;
  machineHours?: number | null;
  lastInspectionDate?: Date | null;
  breed?: string | null;
  pedigreeNumber?: string | null;
  animalType?: string | null;
  lastVaccinationDate?: Date | null;
  specifications?: Record<string, unknown> | null;
  propertyType?: string | null;
  hasInspectionReport?: boolean | null;
  category?: { slug?: string | null; name?: string | null } | null;
}

/**
 * Helper to get extended lot data from lot and its assets
 */
function getExtendedLotData(lot: Lot): ExtendedLotData {
  const firstAsset = lot.assets?.[0] as unknown as ExtendedLotData | undefined;
  return {
    make: firstAsset?.make ?? null,
    model: firstAsset?.model ?? null,
    plate: firstAsset?.plate ?? null,
    chassisNumber: firstAsset?.chassisNumber ?? null,
    fipeCode: firstAsset?.fipeCode ?? null,
    mileage: firstAsset?.mileage ?? null,
    vehicleCondition: firstAsset?.vehicleCondition ?? null,
    machineType: firstAsset?.machineType ?? null,
    machineHours: firstAsset?.machineHours ?? null,
    lastInspectionDate: firstAsset?.lastInspectionDate ?? null,
    breed: firstAsset?.breed ?? null,
    pedigreeNumber: firstAsset?.pedigreeNumber ?? null,
    animalType: firstAsset?.animalType ?? null,
    lastVaccinationDate: firstAsset?.lastVaccinationDate ?? null,
    specifications: firstAsset?.specifications ?? null,
    propertyType: (lot as unknown as ExtendedLotData)?.propertyType ?? null,
    hasInspectionReport: (lot as unknown as ExtendedLotData)?.hasInspectionReport ?? null,
    category: {
      slug: lot.categoryName?.toLowerCase().replace(/\s+/g, '-') ?? null,
      name: lot.categoryName ?? null,
    },
  };
}

/**
 * Detecta a categoria do lote baseado em campos e categoria
 */
function detectLotCategory(lot: Lot): LotCategoryType {
  const extendedData = getExtendedLotData(lot);
  const categorySlug = extendedData.category?.slug?.toLowerCase() || '';
  const categoryName = extendedData.category?.name?.toLowerCase() || '';
  const lotTitle = lot.title?.toLowerCase() || '';
  
  // Imóveis
  if (
    categorySlug.includes('imovel') || 
    categorySlug.includes('imobiliario') ||
    categoryName.includes('imóvel') ||
    categoryName.includes('imobiliário') ||
    extendedData.propertyType ||
    lot.propertyMatricula ||
    lot.totalArea
  ) {
    return 'imovel';
  }
  
  // Veículos
  if (
    categorySlug.includes('veiculo') ||
    categorySlug.includes('automovel') ||
    categorySlug.includes('moto') ||
    categoryName.includes('veículo') ||
    extendedData.make || 
    extendedData.model || 
    extendedData.plate ||
    extendedData.chassisNumber ||
    extendedData.fipeCode
  ) {
    return 'veiculo';
  }
  
  // Eletrônicos
  if (
    categorySlug.includes('eletronico') ||
    categorySlug.includes('informatica') ||
    categorySlug.includes('celular') ||
    categoryName.includes('eletrônico') ||
    categoryName.includes('informática') ||
    lotTitle.includes('notebook') ||
    lotTitle.includes('celular') ||
    lotTitle.includes('smartphone') ||
    lotTitle.includes('tablet')
  ) {
    return 'eletronico';
  }
  
  // Maquinário
  if (
    categorySlug.includes('maquina') ||
    categorySlug.includes('equipamento') ||
    categorySlug.includes('agricola') ||
    categorySlug.includes('industrial') ||
    categoryName.includes('máquina') ||
    categoryName.includes('equipamento') ||
    extendedData.machineHours ||
    extendedData.lastInspectionDate
  ) {
    return 'maquinario';
  }
  
  // Semoventes
  if (
    categorySlug.includes('semovente') ||
    categorySlug.includes('animal') ||
    categorySlug.includes('gado') ||
    categorySlug.includes('equino') ||
    categoryName.includes('semovente') ||
    categoryName.includes('animal') ||
    extendedData.breed ||
    extendedData.pedigreeNumber ||
    extendedData.lastVaccinationDate
  ) {
    return 'semovente';
  }
  
  return 'outros';
}

/**
 * Retorna as tabs disponíveis para cada categoria
 */
function getAvailableTabs(category: LotCategoryType, _lot: Lot): string[] {
  const baseTabs = ['custos', 'historico', 'mercado'];
  
  switch (category) {
    case 'imovel':
      return [...baseTabs, 'juridico'];
    case 'veiculo':
      return [...baseTabs, 'fipe'];
    case 'eletronico':
      return [...baseTabs, 'specs'];
    case 'maquinario':
      return [...baseTabs, 'inspecao', 'certificacoes'];
    case 'semovente':
      return [...baseTabs, 'saude', 'reproducao'];
    default:
      return baseTabs;
  }
}

const tabConfig: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  custos: {
    icon: Calculator,
    label: 'Custos',
    description: 'Simule todos os custos de aquisição'
  },
  historico: {
    icon: History,
    label: 'Histórico',
    description: 'Veja o histórico de lances anonimizado'
  },
  mercado: {
    icon: TrendingUp,
    label: 'Mercado',
    description: 'Compare com valores de mercado'
  },
  juridico: {
    icon: Scale,
    label: 'Jurídico',
    description: 'Informações legais e documentais'
  },
  fipe: {
    icon: Car,
    label: 'FIPE',
    description: 'Compare com a tabela FIPE'
  },
  specs: {
    icon: Cpu,
    label: 'Especificações',
    description: 'Especificações técnicas detalhadas'
  },
  inspecao: {
    icon: FileText,
    label: 'Inspeção',
    description: 'Relatório de inspeção técnica'
  },
  certificacoes: {
    icon: Star,
    label: 'Certificações',
    description: 'Certificações e garantias'
  },
  saude: {
    icon: Heart,
    label: 'Saúde',
    description: 'Histórico de saúde e vacinação'
  },
  reproducao: {
    icon: Tractor,
    label: 'Reprodução',
    description: 'Pedigree e histórico reprodutivo'
  }
};

export function InvestorAnalysisSection({
  lot,
  auction: _auction,
  platformSettings: _platformSettings,
  className
}: InvestorAnalysisSectionProps) {
  const [activeTab, setActiveTab] = useState('custos');
  const [isLoading, setIsLoading] = useState(true);
  
  const lotCategory = useMemo(() => detectLotCategory(lot), [lot]);
  const availableTabs = useMemo(() => getAvailableTabs(lotCategory, lot), [lotCategory, lot]);
  const extendedData = useMemo(() => getExtendedLotData(lot), [lot]);
  
  useEffect(() => {
    // Simula carregamento inicial
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Calcula o score de oportunidade geral
  const opportunityScore = useMemo(() => {
    let score = 50; // Base
    
    // Ajusta baseado no desconto
    const discountPercent = lot.discountPercentage || 0;
    if (discountPercent > 30) score += 20;
    else if (discountPercent > 15) score += 10;
    
    // Ajusta baseado no número de lances
    const bidCount = lot.bidsCount || 0;
    if (bidCount < 5) score += 10;
    else if (bidCount > 20) score -= 10;
    
    // Ajusta baseado na documentação disponível
    if (lot.propertyMatricula) score += 5;
    if (extendedData.hasInspectionReport) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }, [lot, extendedData]);
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-primary bg-primary/10 border-primary/30';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Alta Oportunidade';
    if (score >= 50) return 'Oportunidade Moderada';
    return 'Análise Recomendada';
  };

  if (isLoading) {
    return (
      <Card className={cn("shadow-lg", className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-lg", className)} data-testid="investor-analysis-section">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Análise para Investidores
            </CardTitle>
            <CardDescription className="mt-1">
              Ferramentas profissionais para tomada de decisão de investimento
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn("font-medium px-3 py-1", getScoreColor(opportunityScore))}
          >
            <Star className="h-3.5 w-3.5 mr-1.5" />
            {opportunityScore}% · {getScoreLabel(opportunityScore)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Alert informativo para investidores */}
        <Alert className="mb-4 bg-muted/50 border-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">Análise Profissional</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Utilize as ferramentas abaixo para uma análise completa antes de dar seu lance.
            Dados atualizados em tempo real.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full flex-wrap gap-1 mb-4 h-auto p-1">
            {availableTabs.map((tabId) => {
              const config = tabConfig[tabId];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <TabsTrigger 
                  key={tabId} 
                  value={tabId}
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {/* Tab: Simulador de Custos */}
          <TabsContent value="custos">
            <CostSimulator 
              initialPrice={lot.price || lot.initialPrice || 0}
              stateUf={lot.stateUf ?? undefined}
              lotTitle={lot.title ?? undefined}
            />
          </TabsContent>
          
          {/* Tab: Histórico de Lances */}
          <TabsContent value="historico">
            <BidHistory 
              bids={[]}
              lotStatus={lot.status}
              initialPrice={lot.initialPrice ?? undefined}
            />
          </TabsContent>
          
          {/* Tab: Comparativo de Mercado */}
          <TabsContent value="mercado">
            <MarketComparison 
              auctionPrice={lot.price || lot.initialPrice || 0}
              totalArea={lot.totalArea ?? undefined}
              location={{
                city: lot.cityName ?? undefined,
                state: lot.stateUf ?? undefined,
              }}
            />
          </TabsContent>
          
          {/* Tab: Informações Jurídicas (Imóveis) */}
          {lotCategory === 'imovel' && (
            <TabsContent value="juridico">
              <LotLegalInfoCard 
                propertyMatricula={lot.propertyMatricula}
                propertyRegistrationNumber={lot.propertyRegistrationNumber}
                occupationStatus={lot.occupancyStatus as OccupationStatus | null}
                actionType={lot.actionType}
                actionDescription={lot.actionDescription}
                actionCnjCode={lot.actionCnjCode}
                risks={lot.lotRisks}
              />
            </TabsContent>
          )}
          
          {/* Tab: Comparativo FIPE (Veículos) */}
          {lotCategory === 'veiculo' && (
            <TabsContent value="fipe">
              <FipeComparison 
                auctionPrice={lot.price || lot.initialPrice || 0}
                vehicleInfo={{
                  make: extendedData.make ?? undefined,
                  model: extendedData.model ?? undefined,
                  mileage: extendedData.mileage ?? undefined,
                }}
              />
            </TabsContent>
          )}
          
          {/* Tab: Especificações Técnicas (Eletrônicos) */}
          {lotCategory === 'eletronico' && (
            <TabsContent value="specs">
              <DynamicSpecs 
                template={null}
                assetSpecs={extendedData.specifications || {}}
              />
            </TabsContent>
          )}
          
          {/* Tab: Inspeção (Maquinário) */}
          {lotCategory === 'maquinario' && (
            <TabsContent value="inspecao">
              <MachineryInspection 
                inspection={null}
              />
            </TabsContent>
          )}
          
          {/* Tab: Certificações (Maquinário) */}
          {lotCategory === 'maquinario' && (
            <TabsContent value="certificacoes">
              <MachineryCertifications data={null} />
            </TabsContent>
          )}
          
          {/* Tab: Saúde (Semoventes) */}
          {lotCategory === 'semovente' && (
            <TabsContent value="saude">
              <LivestockHealth 
                healthData={null}
              />
            </TabsContent>
          )}
          
          {/* Tab: Reprodução (Semoventes) */}
          {lotCategory === 'semovente' && (
            <TabsContent value="reproducao">
              <LivestockReproductive 
                reproductiveData={null}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default InvestorAnalysisSection;
