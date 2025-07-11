// src/lib/database/mysql.adapter.ts
// This file is deprecated as the project has migrated to Prisma ORM.
// It is kept for historical reference or if a multi-db strategy is re-introduced.

import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo } from '@/types';
import { samplePlatformSettings } from '@/lib/sample-data';

export class MySqlAdapter implements DatabaseAdapter {
    constructor() {
        console.warn("[MySqlAdapter] DEPRECATED: This adapter is no longer in active use. Project has migrated to Prisma.");
    }

    async _notImplemented(method: string): Promise<any> {
        console.warn(`[MySqlAdapter] Method ${method} is not implemented as this adapter is deprecated.`);
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
        console.warn("[MySqlAdapter] Returning sample platform settings as a fallback.");
        return Promise.resolve(samplePlatformSettings as PlatformSettings);
    }
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}
