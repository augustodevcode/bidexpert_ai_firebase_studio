// src/lib/database/sample-data.adapter.ts
// This file is deprecated as the project has migrated to Prisma ORM.
// It is kept for historical reference or if a multi-db strategy is re-introduced.

import type { DatabaseAdapter, UserWin, DirectSaleOffer, Lot, UserProfileData, Role, Auction, StateInfo, CityInfo, CityFormData, StateFormData } from '@/types';
import { 
    sampleLots, sampleAuctions, sampleUsers, sampleRoles, sampleLotCategories, 
    sampleSubcategories, sampleAuctioneers, sampleSellers, sampleStates, sampleCities, 
    sampleDirectSaleOffers, sampleDocumentTypes, sampleNotifications, sampleBids, 
    sampleUserWins, sampleMediaItems, sampleCourts, sampleJudicialDistricts, 
    sampleJudicialBranches, sampleJudicialProcesses, sampleBens, 
    samplePlatformSettings, sampleContactMessages 
} from '@/lib/sample-data';
import { slugify } from '@/lib/sample-data-helpers';

export class SampleDataAdapter implements DatabaseAdapter {
    constructor() {
        console.warn("[SampleDataAdapter] DEPRECATED: This adapter is no longer in active use. Project has migrated to Prisma.");
    }
    
    async _notImplemented(method: string): Promise<any> {
        console.warn(`[SampleDataAdapter] Method ${method} is not implemented as this adapter is deprecated.`);
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }
    
    // Implementing all methods from the interface to satisfy TypeScript,
    // but they will all call _notImplemented.

    getLots(auctionId?: string): Promise<Lot[]> { return this._notImplemented('getLots'); }
    getLot(id: string): Promise<Lot | null> { return this._notImplemented('getLot'); }
    createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    getAuctions(): Promise<Auction[]> { return this._notImplemented('getAuctions'); }
    getAuction(id: string): Promise<Auction | null> { return this._notImplemented('getAuction'); }
    createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuction'); }
    getLotsByIds(ids: string[]): Promise<Lot[]> { return this._notImplemented('getLotsByIds'); }
    getLotCategories(): Promise<LotCategory[]> { return this._notImplemented('getLotCategories'); }
    getSellers(): Promise<SellerProfileInfo[]> { return this._notImplemented('getSellers'); }
    getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this._notImplemented('getAuctioneers'); }
    getUsersWithRoles(): Promise<UserProfileData[]> { return this._notImplemented('getUsersWithRoles'); }
    getUserProfileData(userId: string): Promise<UserProfileData | null> { return this._notImplemented('getUserProfileData'); }
    getRoles(): Promise<Role[]> { return this._notImplemented('getRoles'); }
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    getMediaItems(): Promise<MediaItem[]> { return this._notImplemented('getMediaItems'); }
    createMediaItem(item: Partial<Omit<MediaItem, "id">>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    getPlatformSettings(): Promise<PlatformSettings | null> {
        console.warn("[SampleDataAdapter] Returning sample platform settings as a fallback.");
        return Promise.resolve(samplePlatformSettings as PlatformSettings);
    }
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}
