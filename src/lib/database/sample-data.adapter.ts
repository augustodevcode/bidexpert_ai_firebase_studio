// src/lib/database/sample-data.adapter.ts
import type { DatabaseAdapter, UserProfileData, Role, Lot, Auction, Bem } from '@/types';
import { 
    sampleLots as rawLots, 
    sampleAuctions as rawAuctions, 
    sampleUsers as rawUsers, 
    sampleRoles as rawRoles, 
    sampleLotCategories as rawLotCategories, 
    sampleSubcategories as rawSubcategories, 
    sampleAuctioneers as rawAuctioneers, 
    sampleSellers as rawSellers, 
    sampleStates as rawStates, 
    sampleCities as rawCities, 
    sampleDirectSaleOffers as rawDirectSaleOffers, 
    sampleDocumentTypes as rawDocumentTypes, 
    sampleNotifications as rawNotifications, 
    sampleBids as rawBids, 
    sampleUserWins as rawUserWins, 
    sampleMediaItems as rawMediaItems, 
    sampleCourts as rawCourts, 
    sampleJudicialDistricts as rawJudicialDistricts, 
    sampleJudicialBranches as rawJudicialBranches, 
    sampleJudicialProcesses as rawJudicialProcesses, 
    sampleBens as rawBens, 
    samplePlatformSettings as rawPlatformSettings, 
    sampleContactMessages as rawContactMessages 
} from '@/lib/sample-data';

// Helper function to create a deep copy to avoid mutations
const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export class SampleDataAdapter implements DatabaseAdapter {
    private data: { [key: string]: any[] };

    constructor() {
        this.data = {
            lots: deepCopy(rawLots),
            auctions: deepCopy(rawAuctions),
            users: deepCopy(rawUsers),
            roles: deepCopy(rawRoles),
            lotCategories: deepCopy(rawLotCategories),
            subcategories: deepCopy(rawSubcategories),
            auctioneers: deepCopy(rawAuctioneers),
            sellers: deepCopy(rawSellers),
            states: deepCopy(rawStates),
            cities: deepCopy(rawCities),
            directSales: deepCopy(rawDirectSaleOffers),
            documentTypes: deepCopy(rawDocumentTypes),
            notifications: deepCopy(rawNotifications),
            bids: deepCopy(rawBids),
            userWins: deepCopy(rawUserWins),
            mediaItems: deepCopy(rawMediaItems),
            courts: deepCopy(rawCourts),
            judicialDistricts: deepCopy(rawJudicialDistricts),
            judicialBranches: deepCopy(rawJudicialBranches),
            judicialProcesses: deepCopy(rawJudicialProcesses),
            bens: deepCopy(rawBens),
            settings: [deepCopy(rawPlatformSettings)],
            contactMessages: deepCopy(rawContactMessages),
        };
        console.log('[SampleDataAdapter] Initialized with sample data.');
    }
    
    private _getUsersWithRoles(): UserProfileData[] {
        return this.data.users.map(user => {
            const role = this.data.roles.find((r: Role) => r.id === user.roleId);
            return {
                ...user,
                roleName: role?.name || 'User',
                permissions: role?.permissions || [],
            };
        });
    }

    async getLots(auctionId?: string): Promise<Lot[]> {
        let lots = this.data.lots;
        if (auctionId) {
            lots = lots.filter(lot => lot.auctionId === auctionId);
        }
        return Promise.resolve(deepCopy(lots));
    }
    
    async getLot(id: string): Promise<Lot | null> {
        const lot = this.data.lots.find(l => l.id === id || l.publicId === id);
        return Promise.resolve(lot ? deepCopy(lot) : null);
    }
    
    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> {
       const newLot = { ...lotData, id: `LOTE${this.data.lots.length + 1}`, createdAt: new Date().toISOString() };
       this.data.lots.push(newLot);
       // Recalculate lot count for auction
       const auction = this.data.auctions.find(a => a.id === lotData.auctionId);
       if (auction) {
           auction.totalLots = (auction.totalLots || 0) + 1;
       }
       return Promise.resolve({ success: true, message: "Lote criado com sucesso!", lotId: newLot.id });
    }

    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> {
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
    
    async getAuctions(): Promise<Auction[]> { return Promise.resolve(deepCopy(this.data.auctions)); }
    async getAuction(id: string): Promise<Auction | null> {
         const auction = this.data.auctions.find((a: Auction) => a.id === id || a.publicId === id);
         if (auction) {
             const lotsForAuction = this.data.lots.filter(l => l.auctionId === auction.id);
             return Promise.resolve(deepCopy({ ...auction, lots: lotsForAuction, totalLots: lotsForAuction.length }));
         }
         return Promise.resolve(null);
     }
     
    async getAuctioneers(): Promise<any[]> { return Promise.resolve(deepCopy(this.data.auctioneers)); }
    async getLotCategories(): Promise<any[]> { return Promise.resolve(deepCopy(this.data.lotCategories)); }
    async getUsersWithRoles(): Promise<UserProfileData[]> { return Promise.resolve(this._getUsersWithRoles()); }
    
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const userWithRole = this._getUsersWithRoles().find(u => u.uid === userId);
        return Promise.resolve(userWithRole ? deepCopy(userWithRole) : null);
    }
    
    async getRoles(): Promise<Role[]> { return Promise.resolve(deepCopy(this.data.roles)); }
    
    async getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
        const seller = this.data.sellers.find(s => s.slug === sellerSlugOrId || s.id === sellerSlugOrId || s.publicId === sellerSlugOrId);
        if (!seller) return Promise.resolve([]);
        
        const sellerAuctions = this.data.auctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
        const sellerAuctionIds = new Set(sellerAuctions.map(a => a.id));
        
        const lots = this.data.lots.filter(l => sellerAuctionIds.has(l.auctionId));
        return Promise.resolve(deepCopy(lots));
    }

     // Fallback for methods not fully implemented in sample data adapter
     async _notImplemented(method: string): Promise<any> {
         console.warn(`[SampleDataAdapter] Method ${method} is not fully implemented and returns a default value.`);
         return Promise.resolve(null);
     }

     getLotsByIds(ids: string[]): Promise<any[]> { 
        if (!ids || ids.length === 0) return Promise.resolve([]);
        const lots = this.data.lots.filter(lot => ids.includes(lot.id) || (lot.publicId && ids.includes(lot.publicId)));
        return Promise.resolve(deepCopy(lots));
     }
     updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean, message: string }> { return this._notImplemented('updateUserRole'); }
     getSellers(): Promise<any[]> { return Promise.resolve(deepCopy(this.data.sellers)); }
     getPlatformSettings(): Promise<any | null> { return Promise.resolve(deepCopy(this.data.settings[0]) || rawPlatformSettings) }
     updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> {
         this.data.settings[0] = { ...this.data.settings[0], ...data, updatedAt: new Date().toISOString() };
         return Promise.resolve({ success: true, message: "Settings updated in sample data."});
     }
     
     getMediaItems(): Promise<any[]> { return Promise.resolve(deepCopy(this.data.mediaItems)); }
     createMediaItem(item: any, url: string): Promise<any> {
         const newItem = { ...item, id: `media-${this.data.mediaItems.length + 1}`, uploadedAt: new Date().toISOString(), urlOriginal: url };
         this.data.mediaItems.push(newItem);
         return Promise.resolve({ success: true, item: newItem });
     }

     getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return Promise.resolve(deepCopy(this.data.directSales)); }
}
