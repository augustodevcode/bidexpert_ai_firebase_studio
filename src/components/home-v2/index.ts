/**
 * @file Home V2 Components Index
 * @description Barrel export for all Home V2 components
 */

// Types
export * from './types';

// Configuration
export { SEGMENT_CONFIGS, SEGMENT_ORDER, getSegmentConfig, getAllSegments } from './segment-config';

// Components
export { default as SegmentHeader } from './segment-header';
export { default as SegmentHero } from './segment-hero';
export { default as CategoryGrid } from './category-grid';
export { default as EventCard } from './event-card';
export { default as FeaturedEventsSection } from './featured-events-section';
export { default as LotCard } from './lot-card';
export { default as LotsGridSection } from './lots-grid-section';
export { default as PartnersCarousel } from './partners-carousel';
export { default as TrustSection } from './trust-section';
export { default as DealOfTheDay } from './deal-of-the-day';
export { default as SegmentFooter } from './segment-footer';
