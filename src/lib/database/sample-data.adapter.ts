// src/lib/database/sample-data.adapter.ts
import type { DatabaseAdapter, UserWin, DirectSaleOffer, Lot } from '@/types';
import { 
    sampleLots, sampleAuctions, sampleUsers, sampleRoles, sampleLotCategories, 
    sampleSubcategories, sampleAuctioneers, sampleSellers, sampleStates, sampleCities, 
    sampleDirectSaleOffers, sampleDocumentTypes, sampleNotifications, sampleBids, 
    sampleUserWins, sampleMediaItems, sampleCourts, sampleJudicialDistricts, 
    sampleJudicialBranches, sampleJudicialProcesses, sampleBens, 
    samplePlatformSettings, sampleContactMessages 
} from '@/lib/sample-data';
import { format } from 'date-fns';

export class SampleDataAdapter implements DatabaseAdapter {
    private data: Record<string, any[]> = {
        lots: sampleLots,
        auctions: sampleAuctions,
        users: sampleUsers,
        roles: sampleRoles,
        lotCategories: sampleLotCategories,
        subcategories: sampleSubcategories,
        auctioneers: sampleAuctioneers,
        sellers: sampleSellers,
        states: sampleStates,
        cities: sampleCities,
        directSales: sampleDirectSaleOffers,
        documentTypes: sampleDocumentTypes,
        notifications: sampleNotifications,
        bids: sampleBids,
        userWins: sampleUserWins,
        mediaItems: sampleMediaItems,
        courts: sampleCourts,
        judicialDistricts: sampleJudicialDistricts,
        judicialBranches: sampleJudicialBranches,
        judicialProcesses: sampleJudicialProcesses,
        bens: sampleBens,
        settings: [samplePlatformSettings],
        contactMessages: sampleContactMessages,
    };
    
    constructor() {
        console.log('[SampleDataAdapter] Initialized with sample data.');
    }

    async getLots(auctionId?: string): Promise<any[]> {
        let lots = this.data.lots;
        if (auctionId) {
            lots = lots.filter(lot => lot.auctionId === auctionId);
        }
        return Promise.resolve(JSON.parse(JSON.stringify(lots)));
    }
    
    async getLot(id: string): Promise<any | null> {
        const lot = this.data.lots.find(l => l.id === id || l.publicId === id);
        return Promise.resolve(lot ? JSON.parse(JSON.stringify(lot)) : null);
    }
    
    async createLot(lotData: any): Promise<{ success: boolean; message: string; lotId?: string; }> {
       const newLot = { ...lotData, id: `LOTE${this.data.lots.length + 1}`, createdAt: new Date().toISOString() };
       this.data.lots.push(newLot);
       // Recalculate lot count for auction
       const auction = this.data.auctions.find(a => a.id === lotData.auctionId);
       if (auction) {
           auction.totalLots = (auction.totalLots || 0) + 1;
       }
       return Promise.resolve({ success: true, message: "Lote criado com sucesso!", lotId: newLot.id });
    }

    async updateLot(id: string, updates: any): Promise<{ success: boolean; message: string; }> {
        const index = this.data.lots.findIndex(l => l.id === id || l.publicId === id);
        if (index > -1) {
            this.data.lots[index] = { ...this.data.lots[index], ...updates };
            return Promise.resolve({ success: true, message: "Lote atualizado com sucesso!" });
        }
        return Promise.resolve({ success: false, message: "Lote não encontrado." });
    }
    
    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
        const initialLength = this.data.lots.length;
        const lotToDelete = this.data.lots.find(l => l.id === id || l.publicId === id);
        if (lotToDelete) {
             this.data.lots = this.data.lots.filter(l => l.id !== id && l.publicId !== id);
             const auction = this.data.auctions.find(a => a.id === lotToDelete.auctionId);
             if (auction) {
                auction.totalLots = (auction.totalLots || 1) - 1;
             }
        }
        return this.data.lots.length < initialLength 
            ? Promise.resolve({ success: true, message: "Lote excluído com sucesso." })
            : Promise.resolve({ success: false, message: "Lote não encontrado." });
    }
    
    // Implement other methods as needed, mirroring the interface...
     async getAuctions(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.auctions))); }
     async getAuction(id: string): Promise<any | null> {
         const auction = this.data.auctions.find(a => a.id === id || a.publicId === id);
         if (auction) {
             auction.lots = this.data.lots.filter(l => l.auctionId === auction.id);
             auction.totalLots = auction.lots.length;
         }
         return Promise.resolve(auction ? JSON.parse(JSON.stringify(auction)) : null);
     }
     async getAuctioneers(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.auctioneers))); }
     async getLotCategories(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.lotCategories))); }
     async getUsersWithRoles(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.users))); }
     async getUserProfileData(userId: string): Promise<any | null> {
         const user = this.data.users.find(u => u.uid === userId);
         if (user) {
             const role = this.data.roles.find(r => r.id === user.roleId);
             return Promise.resolve({...user, permissions: role?.permissions || []});
         }
         return Promise.resolve(null);
     }
     async getRoles(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.roles))); }
     async getMediaItems(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.mediaItems))); }
     async createMediaItem(item: any, url: string): Promise<any> {
         const newItem = { ...item, id: `media-${this.data.mediaItems.length + 1}`, uploadedAt: new Date().toISOString(), urlOriginal: url };
         this.data.mediaItems.push(newItem);
         return Promise.resolve({ success: true, item: newItem });
     }
    
    async getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
        const seller = this.data.sellers.find(s => s.slug === sellerSlugOrId || s.id === sellerSlugOrId || s.publicId === sellerSlugOrId);
        if (!seller) return Promise.resolve([]);
        
        // Find auctions by this seller
        const sellerAuctions = this.data.auctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
        const sellerAuctionIds = new Set(sellerAuctions.map(a => a.id));
        
        // Find lots in those auctions
        const lots = this.data.lots.filter(l => sellerAuctionIds.has(l.auctionId));
        return Promise.resolve(JSON.parse(JSON.stringify(lots)));
    }


     // Fallback for methods not fully implemented in sample data adapter
     async _notImplemented(method: string): Promise<any> {
         console.warn(`[SampleDataAdapter] Method ${method} is not fully implemented and returns a default value.`);
         return Promise.resolve(null);
     }

     getLotsByIds(ids: string[]): Promise<any[]> { 
        if (!ids || ids.length === 0) return Promise.resolve([]);
        const lots = this.data.lots.filter(lot => ids.includes(lot.id) || (lot.publicId && ids.includes(lot.publicId)));
        return Promise.resolve(JSON.parse(JSON.stringify(lots)));
     }
     updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean, message: string }> { return this._notImplemented('updateUserRole'); }
     getSellers(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.sellers))); }
     getPlatformSettings(): Promise<any | null> { return Promise.resolve(this.data.settings[0] || samplePlatformSettings) }
     updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> {
         this.data.settings[0] = { ...this.data.settings[0], ...data, updatedAt: new Date().toISOString() };
         return Promise.resolve({ success: true, message: "Settings updated in sample data."});
     }
}
