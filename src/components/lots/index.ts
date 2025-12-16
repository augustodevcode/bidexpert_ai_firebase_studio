/**
 * @fileoverview Exportações dos componentes de Lotes (Gaps Implementation)
 * @description Barrel file para componentes relacionados a lotes
 * @module components/lots
 */

// ============================================================================
// Phase 1 - Imóveis
// ============================================================================

// Legal Info
export { LotLegalInfoCard } from './legal-info/lot-legal-info-card';

// Cost Simulator
export { CostSimulator } from './cost-simulator';
export type { CostConfig, CostBreakdown, CostSimulatorProps } from './cost-simulator';

// Bid History
export { BidHistory } from './bid-history';
export type { BidRecord, BidStats, BidHistoryProps } from './bid-history';

// Market Comparison
export { MarketComparison } from './market-comparison';
export type { MarketPriceData, MarketComparisonProps } from './market-comparison';

// ============================================================================
// Phase 2 - Veículos
// ============================================================================

// Vehicle Specs
export { VehicleSpecsCard, VehicleSummaryLine } from './vehicle-specs';
export type { VehicleSpecs, ConditionLevel } from './vehicle-specs';

// FIPE Comparison
export { FipeComparison } from './fipe-comparison';
export type { FipeData, VehicleInfo, FipeComparisonProps } from './fipe-comparison';

// ============================================================================
// Phase 3 - Eletrônicos
// ============================================================================

// Dynamic Specs (Category Templates)
export { DynamicSpecs, ELECTRONICS_TEMPLATES } from './dynamic-specs';
export type { 
  DynamicSpecsProps, 
  CategorySpecTemplate, 
  SpecField, 
  SpecGroup 
} from './dynamic-specs';

// Retail Price Comparison
export { RetailPriceComparison } from './retail-price-comparison';
export type { 
  RetailPriceComparisonProps, 
  RetailPriceData, 
  RetailPriceSource 
} from './retail-price-comparison';

// ============================================================================
// Phase 4 - Máquinas/Equipamentos
// ============================================================================

// Machinery Inspection
export { MachineryInspection } from './machinery-inspection';
export type { 
  MachineryInspectionProps, 
  MachineryInspectionData, 
  InspectionItem, 
  InspectorInfo,
  InspectionItemStatus
} from './machinery-inspection';

// Machinery Certifications
export { MachineryCertifications } from './machinery-certifications';
export type { 
  MachineryCertificationsProps, 
  MachineryCertificationsData, 
  Certification, 
  WarrantyInfo,
  CertificationStatus
} from './machinery-certifications';

// ============================================================================
// Phase 5 - Semoventes
// ============================================================================

// Livestock Health
export { LivestockHealth } from './livestock-health';
export type { 
  LivestockHealthProps, 
  LivestockHealthData, 
  Vaccination, 
  HealthCertificate,
  HealthMetric,
  VaccinationStatus
} from './livestock-health';

// Livestock Reproductive
export { LivestockReproductive } from './livestock-reproductive';
export type { 
  LivestockReproductiveProps, 
  LivestockReproductiveData, 
  ReproductiveEvent,
  PedigreeInfo,
  PedigreeAnimal,
  OffspringRecord,
  GeneticInfo,
  ReproductiveEventType
} from './livestock-reproductive';

// ============================================================================
// Investor Analysis Section (Unified Component)
// ============================================================================

// Seção unificada de análise para investidores
export { InvestorAnalysisSection } from './investor-analysis-section';
