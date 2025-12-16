/**
 * @file src/components/lots/livestock-reproductive/index.tsx
 * @description Componente de histórico reprodutivo para semoventes de alto valor.
 * Mostra pedigree, inseminações, partos e informações genéticas.
 * 
 * Gap 5.2 - Histórico reprodutivo para semoventes de alto valor
 */

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Dna, 
  Heart, 
  Baby, 
  Calendar, 
  Award,
  Download,
  Star,
  Users,
  TrendingUp,
  CheckCircle2
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type ReproductiveEventType = 
  | "insemination" 
  | "natural_breeding" 
  | "birth" 
  | "pregnancy_confirmation"
  | "weaning"
  | "embryo_transfer";

export interface ReproductiveEvent {
  id: string;
  eventType: ReproductiveEventType;
  eventDate: Date;
  details: string;
  outcome?: "success" | "failure" | "pending";
  veterinarian?: string;
  notes?: string;
  documentUrl?: string;
}

export interface PedigreeAnimal {
  name: string;
  registrationNumber?: string;
  breed?: string;
  awards?: string[];
  geneticValue?: number; // EPD or similar
}

export interface PedigreeInfo {
  sire?: PedigreeAnimal;
  dam?: PedigreeAnimal;
  paternalGrandsire?: PedigreeAnimal;
  paternalGranddam?: PedigreeAnimal;
  maternalGrandsire?: PedigreeAnimal;
  maternalGranddam?: PedigreeAnimal;
}

export interface OffspringRecord {
  id: string;
  name?: string;
  registrationNumber?: string;
  sex: "male" | "female";
  birthDate: Date;
  breed?: string;
  status: "alive" | "sold" | "deceased";
  salePrice?: number;
}

export interface GeneticInfo {
  registrationNumber?: string;
  registrationOrg?: string;
  geneticTests?: { testName: string; result: string; date: Date }[];
  epd?: { trait: string; value: number; percentile?: number }[];
  breedingValue?: number;
}

export interface LivestockReproductiveData {
  assetId: string;
  sex: "male" | "female";
  reproductiveStatus: "active" | "pregnant" | "lactating" | "dry" | "retired" | "unknown";
  pedigree?: PedigreeInfo;
  reproductiveEvents: ReproductiveEvent[];
  offspring: OffspringRecord[];
  geneticInfo?: GeneticInfo;
  totalOffspring?: number;
  averageOffspringValue?: number;
}

export interface LivestockReproductiveProps {
  reproductiveData: LivestockReproductiveData | null;
  onDownloadPedigree?: () => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const getEventTypeConfig = (type: ReproductiveEventType) => {
  const configs: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    insemination: { label: "Inseminação", icon: <Dna className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-600" },
    natural_breeding: { label: "Monta Natural", icon: <Heart className="h-3 w-3" />, color: "bg-pink-500/10 text-pink-600" },
    birth: { label: "Parto", icon: <Baby className="h-3 w-3" />, color: "bg-green-500/10 text-green-600" },
    pregnancy_confirmation: { label: "Confirmação de Prenhez", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-purple-500/10 text-purple-600" },
    weaning: { label: "Desmama", icon: <Users className="h-3 w-3" />, color: "bg-yellow-500/10 text-yellow-600" },
    embryo_transfer: { label: "Transferência de Embrião", icon: <Dna className="h-3 w-3" />, color: "bg-cyan-500/10 text-cyan-600" },
  };
  return configs[type];
};

const getReproductiveStatusConfig = (status: LivestockReproductiveData["reproductiveStatus"]) => {
  const configs: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    active: { label: "Ativo", variant: "default" },
    pregnant: { label: "Prenhe", variant: "default" },
    lactating: { label: "Lactante", variant: "secondary" },
    dry: { label: "Seco", variant: "outline" },
    retired: { label: "Aposentado", variant: "outline" },
    unknown: { label: "Desconhecido", variant: "outline" },
  };
  return configs[status];
};

// ============================================================================
// Sub-components
// ============================================================================

interface PedigreeTreeProps {
  pedigree: PedigreeInfo;
}

const PedigreeTree: React.FC<PedigreeTreeProps> = ({ pedigree }) => {
  const renderAnimal = (animal?: PedigreeAnimal, label?: string) => {
    if (!animal) {
      return (
        <div className="p-2 rounded bg-muted/30 text-center text-xs text-muted-foreground">
          {label || "Desconhecido"}
        </div>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded bg-primary/10 border border-primary/20 cursor-help">
              <div className="font-medium text-xs truncate">{animal.name}</div>
              {animal.registrationNumber && (
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {animal.registrationNumber}
                </div>
              )}
              {animal.awards && animal.awards.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-[10px] text-yellow-600">{animal.awards.length}</span>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-bold">{animal.name}</p>
              {animal.breed && <p className="text-xs">Raça: {animal.breed}</p>}
              {animal.geneticValue && <p className="text-xs">Valor Genético: {animal.geneticValue}</p>}
              {animal.awards && animal.awards.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium">Premiações:</p>
                  <ul className="list-disc list-inside">
                    {animal.awards.slice(0, 3).map((award, i) => (
                      <li key={i}>{award}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Award className="h-4 w-4" />
        Pedigree
      </h4>
      <div className="grid grid-cols-4 gap-2 text-center">
        {/* Generation 0 - Grandparents */}
        <div className="col-span-1 space-y-1">
          {renderAnimal(pedigree.paternalGrandsire, "Avô Paterno")}
        </div>
        <div className="col-span-1 space-y-1">
          {renderAnimal(pedigree.paternalGranddam, "Avó Paterna")}
        </div>
        <div className="col-span-1 space-y-1">
          {renderAnimal(pedigree.maternalGrandsire, "Avô Materno")}
        </div>
        <div className="col-span-1 space-y-1">
          {renderAnimal(pedigree.maternalGranddam, "Avó Materna")}
        </div>
        
        {/* Generation 1 - Parents */}
        <div className="col-span-2">
          {renderAnimal(pedigree.sire, "Pai")}
        </div>
        <div className="col-span-2">
          {renderAnimal(pedigree.dam, "Mãe")}
        </div>
      </div>
    </div>
  );
};

interface ReproductiveTimelineProps {
  events: ReproductiveEvent[];
}

const ReproductiveTimeline: React.FC<ReproductiveTimelineProps> = ({ events }) => {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }, [events]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Histórico Reprodutivo
      </h4>
      {sortedEvents.length > 0 ? (
        <div className="relative space-y-3 pl-4 border-l-2 border-muted">
          {sortedEvents.slice(0, 5).map((event) => {
            const config = getEventTypeConfig(event.eventType);
            return (
              <div key={event.id} className="relative">
                <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={`gap-1 ${config.color}`} variant="outline">
                      {config.icon}
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(event.eventDate)}</span>
                  </div>
                  <p className="text-sm">{event.details}</p>
                  {event.outcome && (
                    <Badge 
                      variant={event.outcome === "success" ? "default" : event.outcome === "failure" ? "destructive" : "secondary"}
                      className="mt-2"
                    >
                      {event.outcome === "success" ? "Sucesso" : event.outcome === "failure" ? "Falha" : "Pendente"}
                    </Badge>
                  )}
                  {event.notes && (
                    <p className="text-xs text-muted-foreground mt-2">{event.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
          {sortedEvents.length > 5 && (
            <div className="text-xs text-muted-foreground text-center">
              + {sortedEvents.length - 5} eventos anteriores
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum evento reprodutivo registrado.
        </p>
      )}
    </div>
  );
};

interface OffspringListProps {
  offspring: OffspringRecord[];
  averageValue?: number;
}

const OffspringList: React.FC<OffspringListProps> = ({ offspring, averageValue }) => {
  const stats = useMemo(() => {
    const males = offspring.filter((o) => o.sex === "male").length;
    const females = offspring.filter((o) => o.sex === "female").length;
    const sold = offspring.filter((o) => o.status === "sold").length;
    const totalSaleValue = offspring
      .filter((o) => o.salePrice)
      .reduce((sum, o) => sum + (o.salePrice || 0), 0);
    return { males, females, sold, totalSaleValue };
  }, [offspring]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Baby className="h-4 w-4" />
        Progênie ({offspring.length})
      </h4>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2 rounded bg-blue-500/10">
          <div className="font-bold text-blue-600">{stats.males}</div>
          <div className="text-[10px] text-muted-foreground">Machos</div>
        </div>
        <div className="p-2 rounded bg-pink-500/10">
          <div className="font-bold text-pink-600">{stats.females}</div>
          <div className="text-[10px] text-muted-foreground">Fêmeas</div>
        </div>
        <div className="p-2 rounded bg-green-500/10">
          <div className="font-bold text-green-600">{stats.sold}</div>
          <div className="text-[10px] text-muted-foreground">Vendidos</div>
        </div>
        {averageValue && (
          <div className="p-2 rounded bg-primary/10">
            <div className="font-bold text-primary text-xs">{formatCurrency(averageValue)}</div>
            <div className="text-[10px] text-muted-foreground">Valor Médio</div>
          </div>
        )}
      </div>

      {/* List */}
      {offspring.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {offspring.slice(0, 10).map((o) => (
            <div key={o.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={o.sex === "male" ? "default" : "secondary"} className="text-[10px]">
                  {o.sex === "male" ? "♂" : "♀"}
                </Badge>
                <div>
                  <div className="font-medium">{o.name || "Sem nome"}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(o.birthDate)}
                    {o.breed && ` • ${o.breed}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {o.salePrice && (
                  <div className="font-medium text-green-600">{formatCurrency(o.salePrice)}</div>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {o.status === "alive" ? "Vivo" : o.status === "sold" ? "Vendido" : "Falecido"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum registro de progênie.
        </p>
      )}
    </div>
  );
};

interface GeneticInfoSectionProps {
  geneticInfo: GeneticInfo;
}

const GeneticInfoSection: React.FC<GeneticInfoSectionProps> = ({ geneticInfo }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Dna className="h-4 w-4" />
        Informações Genéticas
      </h4>
      
      {/* Registration */}
      {geneticInfo.registrationNumber && (
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="text-xs text-muted-foreground">Registro</div>
          <div className="font-mono font-medium">{geneticInfo.registrationNumber}</div>
          {geneticInfo.registrationOrg && (
            <div className="text-xs text-muted-foreground">{geneticInfo.registrationOrg}</div>
          )}
        </div>
      )}

      {/* EPDs */}
      {geneticInfo.epd && geneticInfo.epd.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium">DEPs (Diferenças Esperadas na Progênie)</div>
          <div className="grid grid-cols-2 gap-2">
            {geneticInfo.epd.map((dep, idx) => (
              <div key={idx} className="p-2 rounded bg-muted/30 flex items-center justify-between">
                <span className="text-xs">{dep.trait}</span>
                <div className="text-right">
                  <span className="font-bold text-primary">{dep.value}</span>
                  {dep.percentile && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      (Top {dep.percentile}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genetic Tests */}
      {geneticInfo.geneticTests && geneticInfo.geneticTests.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium">Testes Genéticos</div>
          {geneticInfo.geneticTests.map((test, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
              <span>{test.testName}</span>
              <Badge variant="outline">{test.result}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Breeding Value */}
      {geneticInfo.breedingValue !== undefined && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Valor Genético Total</span>
            </div>
            <span className="text-xl font-bold text-primary">{geneticInfo.breedingValue}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * LivestockReproductive - Exibe histórico reprodutivo de semoventes
 * 
 * Funcionalidades:
 * - Árvore de pedigree com 3 gerações
 * - Timeline de eventos reprodutivos (IA, cobertura, partos)
 * - Lista de progênie com valores de venda
 * - Informações genéticas (DEPs, testes, registro)
 * - Status reprodutivo atual
 * - Download de certificados de pedigree
 */
export const LivestockReproductive: React.FC<LivestockReproductiveProps> = ({
  reproductiveData,
  onDownloadPedigree,
  className = "",
}) => {
  if (!reproductiveData) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Dna className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            Informações reprodutivas não disponíveis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getReproductiveStatusConfig(reproductiveData.reproductiveStatus);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dna className="h-5 w-5 text-primary" />
              Histórico Reprodutivo
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {reproductiveData.sex === "male" ? "Macho" : "Fêmea"}
              {reproductiveData.totalOffspring && ` • ${reproductiveData.totalOffspring} crias`}
            </p>
          </div>
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pedigree */}
        {reproductiveData.pedigree && (
          <>
            <PedigreeTree pedigree={reproductiveData.pedigree} />
            {onDownloadPedigree && (
              <Button variant="outline" size="sm" className="w-full" onClick={onDownloadPedigree}>
                <Download className="h-3 w-3 mr-2" />
                Baixar Certificado de Pedigree
              </Button>
            )}
          </>
        )}

        {/* Genetic Info */}
        {reproductiveData.geneticInfo && (
          <GeneticInfoSection geneticInfo={reproductiveData.geneticInfo} />
        )}

        {/* Reproductive Events */}
        <ReproductiveTimeline events={reproductiveData.reproductiveEvents} />

        {/* Offspring */}
        <OffspringList 
          offspring={reproductiveData.offspring} 
          averageValue={reproductiveData.averageOffspringValue}
        />
      </CardContent>
    </Card>
  );
};

export default LivestockReproductive;
