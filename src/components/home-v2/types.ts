/**
 * @file Home V2 Types
 * @description Type definitions for the Home Page V2 components
 * including segments, categories, events, lots, and partners.
 */

import type { Lot, Auction, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';

/**
 * Segment types for the auction platform
 */
export type SegmentType = 'veiculos' | 'imoveis' | 'maquinas' | 'tecnologia';

/**
 * Segment configuration with metadata
 */
export interface SegmentConfig {
  id: SegmentType;
  name: string;
  title: string;
  subtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  icon: string;
  color: string;
  categories: SegmentCategory[];
  menuItems: SegmentMenuItem[];
  trustPoints: TrustPoint[];
}

/**
 * Category within a segment
 */
export interface SegmentCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
  description?: string;
  imageUrl?: string;
}

/**
 * Menu item for segment navigation
 */
export interface SegmentMenuItem {
  label: string;
  href: string;
  description?: string;
  icon?: string;
  badge?: string;
}

/**
 * Trust/confidence points for segment
 */
export interface TrustPoint {
  icon: string;
  title: string;
  description: string;
}

/**
 * Featured event data
 */
export interface FeaturedEvent {
  id: string;
  title: string;
  consignor: string;
  consignorLogo?: string;
  eventType: 'EVENTO_UNICO' | 'PRIMEIRA_PRACA' | 'SEGUNDA_PRACA' | 'LEILAO_ONLINE' | 'ELETRONICO';
  startDate: Date;
  endDate: Date;
  status: 'ABERTO_PARA_LANCES' | 'EM_BREVE' | 'ENCERRADO';
  lotsCount: number;
  imageUrl?: string;
  category?: string;
  location?: string;
}

/**
 * Lot card data with segment-specific attributes
 */
export interface LotCardData extends Partial<Lot> {
  id: string;
  title: string;
  imageUrl?: string;
  currentPrice: number;
  evaluationPrice?: number;
  minimumPrice?: number;
  bidsCount: number;
  status: string;
  badges: LotBadge[];
  endDate?: Date;
  // Vehicle specific
  brand?: string;
  model?: string;
  year?: string;
  mileage?: number;
  licensePlate?: string;
  hasFipe?: boolean;
  // Real estate specific
  propertyType?: string;
  area?: number;
  city?: string;
  state?: string;
  stage?: string;
  occupationStatus?: string;
  // Machinery specific
  machineType?: string;
  hoursWorked?: number;
  manufacturer?: string;
  // Technology specific
  techBrand?: string;
  techModel?: string;
  condition?: string;
  hasWarranty?: boolean;
}

/**
 * Lot badge types
 */
export interface LotBadge {
  type: 'CONDICIONAL' | 'VENDIDO' | 'ABERTO' | 'EM_PROPOSTA' | 'FINANCIAVEL' | 'DESTAQUE' | 'URGENTE';
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

/**
 * Partner/Consignor data
 */
export interface PartnerData {
  id: string;
  name: string;
  logoUrl: string;
  type: 'banco' | 'seguradora' | 'governo' | 'leiloeiro' | 'corporacao';
  lotsCount?: number;
  eventsCount?: number;
  href: string;
}

/**
 * Deal of the day data
 */
export interface DealOfTheDay {
  lot: LotCardData;
  discountPercentage: number;
  originalPrice: number;
  urgencyMessage?: string;
  endsAt: Date;
}

/**
 * Filter options
 */
export interface FilterOptions {
  states: { value: string; label: string }[];
  cities: { value: string; label: string }[];
  priceRanges: { value: string; label: string; min: number; max: number }[];
  eventTypes: { value: string; label: string }[];
  conditions: { value: string; label: string }[];
}

/**
 * Search params for segment pages
 */
export interface SegmentSearchParams {
  category?: string;
  state?: string;
  city?: string;
  priceMin?: string;
  priceMax?: string;
  eventType?: string;
  condition?: string;
  financeable?: string;
  page?: string;
  sort?: string;
}
