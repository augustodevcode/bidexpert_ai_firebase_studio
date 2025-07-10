// src/lib/sample-data.ts
import { slugify } from './sample-data-helpers';

import sampleLotCategories from '../sample-data.local.json';
import sampleSubcategoriesData from '../sample-data.local.json';
import sampleStatesData from '../sample-data.local.json';
import sampleCitiesData from '../sample-data.local.json';
import sampleUsersData from '../sample-data.local.json';
import sampleRolesData from '../sample-data.local.json';
import sampleAuctioneersData from '../sample-data.local.json';
import sampleSellersData from '../sample-data.local.json';
import sampleAuctionsData from '../sample-data.local.json';
import sampleLotsData from '../sample-data.local.json';
import sampleDirectSaleOffersData from '../sample-data.local.json';
import sampleDocumentTypesData from '../sample-data.local.json';
import sampleNotificationsData from '../sample-data.local.json';
import sampleBidsData from '../sample-data.local.json';
import sampleUserWinsData from '../sample-data.local.json';
import sampleMediaItemsData from '../sample-data.local.json';
import sampleCourtsData from '../sample-data.local.json';
import sampleJudicialDistrictsData from '../sample-data.local.json';
import sampleJudicialBranchesData from '../sample-data.local.json';
import sampleJudicialProcessesData from '../sample-data.local.json';
import sampleBensData from '../sample-data.local.json';
import samplePlatformSettingsData from '../sample-data.local.json';
import sampleContactMessagesData from '../sample-data.local.json';

// Exportando os dados do JSON importado
export const sampleLotCategories = (sampleLotCategories as any).sampleLotCategories;
export const sampleSubcategories = (sampleSubcategoriesData as any).sampleSubcategories;
export const sampleStates = (sampleStatesData as any).sampleStates;
export const sampleCities = (sampleCitiesData as any).sampleCities;
export const sampleUsers = (sampleUsersData as any).sampleUsers;
export const sampleRoles = (sampleRolesData as any).sampleRoles;
export const sampleAuctioneers = (sampleAuctioneersData as any).sampleAuctioneers;
export const sampleSellers = (sampleSellersData as any).sampleSellers;
export const sampleAuctions = (sampleAuctionsData as any).sampleAuctions;
export const sampleLots = (sampleLotsData as any).sampleLots;
export const sampleDirectSaleOffers = (sampleDirectSaleOffersData as any).sampleDirectSaleOffers;
export const sampleDocumentTypes = (sampleDocumentTypesData as any).sampleDocumentTypes;
export const sampleNotifications = (sampleNotificationsData as any).sampleNotifications;
export const sampleBids = (sampleBidsData as any).sampleBids;
export const sampleUserWins = (sampleUserWinsData as any).sampleUserWins;
export const sampleMediaItems = (sampleMediaItemsData as any).sampleMediaItems;
export const sampleCourts = (sampleCourtsData as any).sampleCourts;
export const sampleJudicialDistricts = (sampleJudicialDistrictsData as any).sampleJudicialDistricts;
export const sampleJudicialBranches = (sampleJudicialBranchesData as any).sampleJudicialBranches;
export const sampleJudicialProcesses = (sampleJudicialProcessesData as any).sampleJudicialProcesses;
export const sampleBens = (sampleBensData as any).sampleBens;
export const samplePlatformSettings = (samplePlatformSettingsData as any).samplePlatformSettings;
export const sampleContactMessages = (sampleContactMessagesData as any).sampleContactMessages;


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
      cityName: sampleCities.find(c => c.id === lot.cityId)?.name,
      stateUf: sampleStates.find(s => s.id === lot.stateId)?.uf,
      bens: sampleBens.filter(b => lot.bemIds?.includes(b.id)),
    };
  });
  
  const usersWithRoles = sampleUsers.map(user => {
      const role = sampleRoles.find(r => r.id === user.roleId);
      return {
          ...user,
          roleName: role?.name || 'User',
          permissions: role?.permissions || ['view_auctions', 'place_bids']
      };
  });
  
  const judicialProcessesWithDetails = sampleJudicialProcesses.map(proc => ({
    ...proc,
    courtName: sampleCourts.find(c => c.id === proc.courtId)?.name,
    districtName: sampleJudicialDistricts.find(d => d.id === proc.districtId)?.name,
    branchName: sampleJudicialBranches.find(b => b.id === proc.branchId)?.name,
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
  
  const citiesWithDetails = sampleCities.map(city => ({
      ...city,
      stateName: sampleStates.find(s => s.id === city.stateId)?.name
  }));
  
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
    sampleStates,
    citiesWithDetails,
    subcategoriesWithDetails,
    sampleDirectSaleOffers,
    sampleDocumentTypes,
    sampleNotifications,
    userBidsWithDetails,
    userWinsWithDetails,
    sampleMediaItems,
    sampleCourts,
    sampleJudicialDistricts,
    sampleJudicialBranches,
    judicialProcessesWithDetails,
    bensWithDetails,
    samplePlatformSettings,
    sampleContactMessages
  };
}
