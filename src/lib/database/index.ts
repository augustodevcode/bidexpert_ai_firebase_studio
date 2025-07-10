// src/lib/database/index.ts
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import { PostgresAdapter } from './postgres.adapter';
import type { DatabaseAdapter } from '@/types';
import { sampleLots, sampleAuctions, sampleUsers, sampleRoles, sampleCategories, sampleAuctioneers, sampleSellers, sampleStates, sampleCities, sampleSubcategories, sampleDirectSaleOffers, sampleDocumentTypes, sampleNotifications, sampleBids, sampleUserWins, sampleMediaItems, sampleCourts, sampleJudicialDistricts, sampleJudicialBranches, sampleJudicialProcesses, sampleBens, samplePlatformSettings, sampleContactMessages } from '@/lib/sample-data';

class SampleDataAdapter implements DatabaseAdapter {
    private data: Record<string, any[]> = {
        lots: sampleLots,
        auctions: sampleAuctions,
        users: sampleUsers,
        roles: sampleRoles,
        categories: sampleCategories,
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
        // console.log('[SampleDataAdapter] Initialized with sample data.');
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
     async getLotCategories(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.categories))); }
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

     // Fallback for methods not fully implemented in sample data adapter
     async _notImplemented(method: string): Promise<any> {
         console.warn(`[SampleDataAdapter] Method ${method} is not fully implemented and returns a default value.`);
         return Promise.resolve(null);
     }

     getLotsByIds(ids: string[]): Promise<any[]> { return this._notImplemented('getLotsByIds'); }
     updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean, message: string }> { return this._notImplemented('updateUserRole'); }
     getSellers(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.sellers))); }
     getPlatformSettings(): Promise<any | null> { return Promise.resolve(this.data.settings[0] || samplePlatformSettings) }
     updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> {
         this.data.settings[0] = { ...this.data.settings[0], ...data, updatedAt: new Date().toISOString() };
         return Promise.resolve({ success: true, message: "Settings updated in sample data."});
     }
}


export const getDatabaseAdapter = async (): Promise<DatabaseAdapter> => {
    const availableSystems = ['FIRESTORE', 'MYSQL', 'POSTGRES', 'SAMPLE_DATA'];
    // Reads from NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM first, then falls back to ACTIVE_DATABASE_SYSTEM
    const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || process.env.ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';

    if (!availableSystems.includes(activeSystem)) {
        console.error(`Invalid database system selected: ${activeSystem}. Falling back to SAMPLE_DATA.`);
        return new SampleDataAdapter();
    }

    if (activeSystem === 'FIRESTORE') {
        return new FirestoreAdapter();
    }
    if (activeSystem === 'MYSQL') {
        return new MySqlAdapter();
    }
    if (activeSystem === 'POSTGRES') {
        return new PostgresAdapter();
    }
    
    // Default to SampleDataAdapter
    return new SampleDataAdapter();
}
