// src/lib/sample-data.ts
import { slugify } from './sample-data-helpers';
import type { StateInfo, CityInfo } from '@/types';

// Renomeado para evitar conflito de nome com as constantes exportadas
import sampleData from '../sample-data.local.json';

// Exportando os dados do JSON importado
export const sampleLotCategories = (sampleData as any).sampleLotCategories || [];
export const sampleSubcategories = (sampleData as any).sampleSubcategories || [];
export const sampleUsers = (sampleData as any).sampleUsers || [];
export const sampleRoles = (sampleData as any).sampleRoles || [];
export const sampleAuctioneers = (sampleData as any).sampleAuctioneers || [];
export const sampleSellers = (sampleData as any).sampleSellers || [];
export const sampleAuctions = (sampleData as any).sampleAuctions || [];
export const sampleLots = (sampleData as any).sampleLots || [];
export const sampleDirectSaleOffers = (sampleData as any).sampleDirectSaleOffers || [];
export const sampleDocumentTypes = (sampleData as any).sampleDocumentTypes || [];
export const sampleNotifications = (sampleData as any).sampleNotifications || [];
export const sampleBids = (sampleData as any).sampleBids || [];
export const sampleUserWins = (sampleData as any).sampleUserWins || [];
export const sampleMediaItems = (sampleData as any).sampleMediaItems || [];
export const sampleJudicialProcesses = (sampleData as any).sampleJudicialProcesses || [];
export const sampleBens = (sampleData as any).sampleBens || [];
export const samplePlatformSettings = (sampleData as any).samplePlatformSettings || {};
export const sampleContactMessages = (sampleData as any).sampleContactMessages || [];

// New structured data for hierarchical seeding
export const sampleStatesWithCities = (sampleData as any).sampleStatesWithCities || [];
export const sampleCourtsWithRelations = (sampleData as any).sampleCourtsWithRelations || [];


// ============================================================================
// Helper functions below are mostly for DEPRECATED adapters or for reference.
// The main seeding logic should be in the scripts themselves.
// ============================================================================


export function getSampleStatesAndCities() {
    const states = sampleStatesWithCities.map((s: any) => ({
        id: s.id,
        name: s.name,
        uf: s.uf,
        slug: slugify(s.name)
    })) as StateInfo[];

    const cities = sampleStatesWithCities.flatMap((s: any) => 
        s.cities.map((c: any) => ({
            ...c,
            slug: slugify(c.name),
            stateId: s.id,
        }))
    ) as CityInfo[];

    return { states, cities };
}


// Helper function to link data
export function getSampleData() {

  const auctions = sampleAuctions.map(auction => {
    const lotsForAuction = sampleLots.filter(lot => lot.auctionId === auction.id);
    return {
      ...auction,
      lots: lotsForAuction,
      totalLots: lotsForAuction.length,
      category: sampleLotCategories.find(c => c.id === auction.categoryId)?.name || auction.category,
      auctioneer: sampleAuctioneers.find(a => a.id === auction.auctioneerId)?.name || auction.auctioneer,
      seller: sampleSellers.find(s => s.id === auction.sellerId)?.name || auction.seller,
    };
  });
  
  const lots = sampleLots.map(lot => {
    const parentAuction = auctions.find(a => a.id === lot.auctionId);
    return {
      ...lot,
      auctionName: parentAuction?.title,
      type: sampleLotCategories.find(c => c.id === lot.categoryId)?.name || lot.type,
      subcategoryName: sampleSubcategories.find(s => s.id === lot.subcategoryId)?.name,
      cityName: 'N/A', // Deprecated logic
      stateUf: 'N/A',   // Deprecated logic
      bens: sampleBens.filter(b => lot.bemIds?.includes(b.id)),
    };
  });
  
  const usersWithRoles = sampleUsers.map(user => {
      const roleIds = Array.isArray(user.roleIds) ? user.roleIds : [user.roleIds];
      const roles = sampleRoles.filter(r => roleIds.includes(r.id));
      return {
          ...user,
          roleIds: roleIds,
          roleNames: roles.map(r => r.name),
          permissions: Array.from(new Set(roles.flatMap(r => r.permissions)))
      };
  });
  
  const judicialProcessesWithDetails = sampleJudicialProcesses.map(proc => ({
    ...proc,
    courtName: 'N/A', // Deprecated logic
    districtName: 'N/A', // Deprecated logic
    branchName: 'N/A', // Deprecated logic
    sellerName: sampleSellers.find(s => s.id === proc.sellerId)?.name,
  }));
  
  const bensWithDetails = sampleBens.map(bem => ({
    ...bem,
    categoryName: sampleLotCategories.find(c => c.id === bem.categoryId)?.name,
    subcategoryName: sampleSubcategories.find(s => s.id === bem.subcategoryId)?.name,
    judicialProcessNumber: judicialProcessesWithDetails.find(p => p.id === bem.judicialProcessId)?.processNumber,
    sellerName: sampleSellers.find(s => s.id === bem.sellerId)?.name,
  }));
  
  const userWinsWithDetails = sampleUserWins.map(win => ({
      ...win,
      lot: lots.find(l => l.id === win.lotId),
  }));

  const userBidsWithDetails = sampleBids.map(bid => {
      const lot = lots.find(l => l.id === bid.lotId);
      let bidStatus: string = 'PERDENDO';
      if (lot) {
        if (lot.price === bid.amount) {
            bidStatus = 'GANHANDO';
        }
        if (lot.status === 'VENDIDO' && lot.winnerId === bid.bidderId) {
            bidStatus = 'ARREMATADO';
        } else if (lot.status === 'VENDIDO') {
            bidStatus = 'NAO_ARREMATADO';
        }
      }
      return {
          ...bid,
          lot: lot,
          bidStatus: bidStatus,
      };
  });
  
  const subcategoriesWithDetails = sampleSubcategories.map(sub => ({
      ...sub,
      parentCategoryName: sampleLotCategories.find(c => c.id === sub.parentCategoryId)?.name,
      itemCount: lots.filter(l => l.subcategoryId === sub.id).length
  }));
  
  const categoriesWithDetails = sampleLotCategories.map(cat => ({
      ...cat,
      hasSubcategories: subcategoriesWithDetails.some(s => s.parentCategoryId === cat.id),
      itemCount: lots.filter(l => l.categoryId === cat.id).length,
  }));


  return {
    auctions,
    lots,
    usersWithRoles,
    sampleRoles,
    categoriesWithDetails,
    sampleAuctioneers,
    sampleSellers,
    subcategoriesWithDetails,
    sampleDirectSaleOffers,
    sampleDocumentTypes,
    sampleNotifications,
    userBidsWithDetails,
    userWinsWithDetails,
    sampleMediaItems,
    sampleCourts: sampleCourtsWithRelations,
    sampleJudicialDistricts: sampleCourtsWithRelations.flatMap(c => c.districts),
    sampleJudicialBranches: sampleCourtsWithRelations.flatMap(c => c.districts.flatMap(d => d.branches)),
    judicialProcessesWithDetails,
    bensWithDetails,
    samplePlatformSettings,
    sampleContactMessages
  };
}
