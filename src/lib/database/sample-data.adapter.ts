// src/lib/database/sample-data.adapter.ts
import type { DatabaseAdapter, UserWin, DirectSaleOffer, Lot, UserProfileData, Role, Auction, StateInfo, CityInfo, CityFormData, StateFormData, PlatformSettings, Subcategory } from '@/types';
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

    async getStates(): Promise<StateInfo[]> {
        return Promise.resolve(JSON.parse(JSON.stringify(this.data.states)));
    }
    
    async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
        let cities = this.data.cities;
        if (stateIdFilter) {
            cities = cities.filter(city => city.stateId === stateIdFilter);
        }
        return Promise.resolve(JSON.parse(JSON.stringify(cities)));
    }
    
    async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
        const newState = {
            id: `state-${slugify(data.name)}`,
            name: data.name,
            uf: data.uf,
            slug: slugify(data.name),
            cityCount: 0,
        };
        this.data.states.push(newState);
        return { success: true, message: 'Estado criado com sucesso!', stateId: newState.id };
    }

    async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
        const index = this.data.states.findIndex(s => s.id === id);
        if (index > -1) {
            this.data.states[index] = { ...this.data.states[index], ...data };
            return { success: true, message: 'Estado atualizado com sucesso!' };
        }
        return { success: false, message: 'Estado não encontrado.' };
    }

    async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
        this.data.states = this.data.states.filter(s => s.id !== id);
        return { success: true, message: 'Estado excluído com sucesso.' };
    }
    
    async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
        const state = this.data.states.find(s => s.id === data.stateId);
        if (!state) return { success: false, message: 'Estado não encontrado.' };
        const newCity = {
            id: `city-${slugify(data.name)}-${state.uf.toLowerCase()}`,
            name: data.name,
            slug: slugify(data.name),
            stateId: data.stateId,
            stateUf: state.uf,
            ibgeCode: data.ibgeCode,
            lotCount: 0,
        };
        this.data.cities.push(newCity);
        return { success: true, message: 'Cidade criada com sucesso!', cityId: newCity.id };
    }
    
    async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
        const index = this.data.cities.findIndex(c => c.id === id);
        if (index > -1) {
            this.data.cities[index] = { ...this.data.cities[index], ...data };
            return { success: true, message: 'Cidade atualizada com sucesso!' };
        }
        return { success: false, message: 'Cidade não encontrada.' };
    }
    
    async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
        this.data.cities = this.data.cities.filter(c => c.id !== id);
        return { success: true, message: 'Cidade excluída com sucesso.' };
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
    
     async getAuctions(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.auctions))); }
     
     async getAuction(id: string): Promise<any | null> {
         const auction = this.data.auctions.find(a => a.id === id || a.publicId === id);
         if (auction) {
             auction.lots = this.data.lots.filter(l => l.auctionId === auction.id);
             auction.totalLots = auction.lots.length;
         }
         return Promise.resolve(auction ? JSON.parse(JSON.stringify(auction)) : null);
     }
     
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        const newId = `auc-${Math.random().toString(36).substring(2, 10)}`;
        const newAuction = {
            ...auctionData,
            id: newId,
            publicId: `AUC-PUB-${newId.substring(4, 12)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lots: [],
            totalLots: 0,
            status: auctionData.status || 'RASCUNHO',
        };
        this.data.auctions.push(newAuction);
        return Promise.resolve({ success: true, message: 'Leilão criado com sucesso!', auctionId: newId });
    }
    
    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
        const index = this.data.auctions.findIndex(a => a.id === id || a.publicId === id);
        if (index > -1) {
            this.data.auctions[index] = { ...this.data.auctions[index], ...updates, updatedAt: new Date().toISOString() };
            return Promise.resolve({ success: true, message: 'Leilão atualizado com sucesso!' });
        }
        return Promise.resolve({ success: false, message: 'Leilão não encontrado.' });
    }

    async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
        const initialLength = this.data.auctions.length;
        this.data.auctions = this.data.auctions.filter(a => a.id !== id && a.publicId !== id);
        return this.data.auctions.length < initialLength
            ? Promise.resolve({ success: true, message: 'Leilão excluído com sucesso.' })
            : Promise.resolve({ success: false, message: 'Leilão não encontrado.' });
    }

     async getAuctioneers(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.auctioneers))); }
     async getLotCategories(): Promise<any[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.data.lotCategories))); }
     
     async getSubcategoriesByParent(parentCategoryId?: string): Promise<Subcategory[]> {
        let subcategories = this.data.subcategories;
        if (parentCategoryId) {
            subcategories = subcategories.filter(sub => sub.parentCategoryId === parentCategoryId);
        }
        return Promise.resolve(JSON.parse(JSON.stringify(subcategories)));
    }
     
     async getUsersWithRoles(): Promise<UserProfileData[]> {
        const usersWithRoles = this.data.users.map((user: any) => {
            const role = this.data.roles.find((r: Role) => r.id === user.roleId);
            return {
                ...user,
                roleName: role?.name || 'USER',
                permissions: role?.permissions || ['view_auctions', 'place_bids']
            };
        });
        return Promise.resolve(JSON.parse(JSON.stringify(usersWithRoles)));
     }
     
     async getUserProfileData(userId: string): Promise<any | null> {
         const users = await this.getUsersWithRoles();
         const user = users.find(u => u.uid === userId);
         return Promise.resolve(user || null);
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
        
        const sellerAuctions = this.data.auctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
        const sellerAuctionIds = new Set(sellerAuctions.map(a => a.id));
        
        const lots = this.data.lots.filter(l => sellerAuctionIds.has(l.auctionId));
        return Promise.resolve(JSON.parse(JSON.stringify(lots)));
    }


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
     
     async getPlatformSettings(): Promise<any | null> { 
        // Ensure the settings object is created if it doesn't exist
        if (!this.data.settings || this.data.settings.length === 0) {
            this.data.settings = [{ ...samplePlatformSettings, id: 'global' }];
        }
        return Promise.resolve(this.data.settings[0]);
     }

    async createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> {
        // In sample data, we just replace the existing settings
        this.data.settings[0] = { ...data, updatedAt: new Date().toISOString() };
        return Promise.resolve({ success: true, message: "Sample platform settings created/replaced."});
    }

     async updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> {
         this.data.settings[0] = { ...this.data.settings[0], ...data, updatedAt: new Date().toISOString() };
         return Promise.resolve({ success: true, message: "Settings updated in sample data."});
     }
}
