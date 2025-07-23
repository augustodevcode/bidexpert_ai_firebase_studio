// src/lib/database/sample-data.adapter.ts
import type { DatabaseAdapter, UserWin, DirectSaleOffer, Lot } from '@/types';
import { 
    getSampleData
} from '@/lib/sample-data-helpers';

export class SampleDataAdapter implements DatabaseAdapter {
    private data: any;

    constructor() {
        console.warn("[SampleDataAdapter] ADVERTÊNCIA: Usando dados de exemplo em memória. As alterações não serão persistidas.");
        this.data = getSampleData();
    }
    
    async _notImplemented(method: string, isList = false): Promise<any> {
        console.warn(`[SampleDataAdapter] Método ${method} não está implementado e retorna um valor padrão.`);
        return Promise.resolve(isList ? [] : null);
    }
    
    // Implemente os métodos da interface aqui, usando o objeto `this.data`
    // Exemplo:
    async getLots(auctionId?: string): Promise<Lot[]> {
      let lots = this.data.lots;
      if (auctionId) {
          lots = lots.filter((lot: Lot) => lot.auctionId === auctionId);
      }
      return Promise.resolve(JSON.parse(JSON.stringify(lots)));
    }

    async getLot(id: string): Promise<Lot | null> {
        const lot = this.data.lots.find((l: Lot) => l.id === id || l.publicId === id);
        return Promise.resolve(lot ? JSON.parse(JSON.stringify(lot)) : null);
    }
    
    // ... e assim por diante para todos os outros métodos.
    // Lembre-se de usar JSON.parse(JSON.stringify(...)) para evitar mutações no objeto original.
    
    async getAuctions() { return Promise.resolve(JSON.parse(JSON.stringify(this.data.auctions))); }
    async getLotsByIds(ids: string[]) {
        if (!ids || ids.length === 0) return Promise.resolve([]);
        const lots = this.data.lots.filter((lot: Lot) => ids.includes(lot.id) || (lot.publicId && ids.includes(lot.publicId)));
        return Promise.resolve(JSON.parse(JSON.stringify(lots)));
    }
    async getDirectSaleOffers() { return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleDirectSaleOffers))); }
    async getSellers() { return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleSellers))); }
    async getAuctioneers() { return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctioneers))); }
    async getLotCategories() { return Promise.resolve(JSON.parse(JSON.stringify(this.data.categoriesWithDetails))); }
    getStates() { return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleStates))); }
    getCities() { return Promise.resolve(JSON.parse(JSON.stringify(this.data.citiesWithDetails))); }

    async getUserWins(userId: string): Promise<UserWin[]> {
        const wins = this.data.userWinsWithDetails.filter((w: UserWin) => w.userId === userId);
        return Promise.resolve(JSON.parse(JSON.stringify(wins)));
    }

    // Retorna todos os métodos restantes como não implementados
    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    async getAuction(id: string): Promise<any | null> { return this._notImplemented('getAuction'); }
    async createAuction(auctionData: Partial<any>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    async updateAuction(id: string, updates: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuction'); }
    async getUsersWithRoles(): Promise<any[]> { return this._notImplemented('getUsersWithRoles', true); }
    async getUserProfileData(userId: string): Promise<any | null> { return this._notImplemented('getUserProfileData'); }
    async getRoles(): Promise<any[]> { return this._notImplemented('getRoles', true); }
    async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRoles'); }
    async getMediaItems(): Promise<any[]> { return this._notImplemented('getMediaItems', true); }
    async createMediaItem(item: Partial<Omit<any, "id">>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: any; }> { return this._notImplemented('createMediaItem'); }
    async getPlatformSettings(): Promise<any | null> { return this._notImplemented('getPlatformSettings'); }
    async updatePlatformSettings(data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
    async createPlatformSettings(data: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createPlatformSettings'); }
    async getBens(filter?: { judicialProcessId?: string; sellerId?: string; }): Promise<any[]> { return this._notImplemented('getBens', true); }
    async getBem(id: string): Promise<any | null> { return this._notImplemented('getBem'); }
    async getBensByIds(ids: string[]): Promise<any[]> { return this._notImplemented('getBensByIds', true); }
    async getSubcategoriesByParent(parentCategoryId?: string | undefined): Promise<any[]> { return this._notImplemented('getSubcategoriesByParent', true); }
    async getSubcategory(id: string): Promise<any | null> { return this._notImplemented('getSubcategory'); }
    async createLotCategory(data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createLotCategory');}
    async createSubcategory(data: any): Promise<{ success: boolean; message: string; subcategoryId?: string; }> { return this._notImplemented('createSubcategory'); }
    async updateSubcategory(id: string, data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSubcategory'); }
    async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSubcategory'); }
    async createState(data: any): Promise<{ success: boolean; message: string; stateId?: string; }> { return this._notImplemented('createState'); }
    async updateState(id: string, data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateState'); }
    async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteState'); }
    async createCity(data: any): Promise<{ success: boolean; message: string; cityId?: string; }> { return this._notImplemented('createCity'); }
    async updateCity(id: string, data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCity'); }
    async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteCity'); }
    async getSeller(id: string): Promise<any | null> { return this._notImplemented('getSeller'); }
    async createSeller(data: any): Promise<{ success: boolean; message: string; sellerId?: string; }> { return this._notImplemented('createSeller'); }
    async updateSeller(id: string, data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSeller'); }
    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSeller'); }
    async getAuctioneer(id: string): Promise<any | null> { return this._notImplemented('getAuctioneer'); }
    async createAuctioneer(data: any): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { return this._notImplemented('createAuctioneer'); }
    async updateAuctioneer(id: string, data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuctioneer'); }
    async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuctioneer'); }
    async getCourts(): Promise<any[]> { return this._notImplemented('getCourts', true); }
    async createCourt(data: any): Promise<{ success: boolean; message: string; courtId?: string; }> { return this._notImplemented('createCourt'); }
    async updateCourt(id: string, data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCourt'); }
    async getJudicialDistricts(): Promise<any[]> { return this._notImplemented('getJudicialDistricts', true); }
    async createJudicialDistrict(data: any): Promise<{ success: boolean; message: string; districtId?: string; }> { return this._notImplemented('createJudicialDistrict'); }
    async getJudicialBranches(): Promise<any[]> { return this._notImplemented('getJudicialBranches', true); }
    async createJudicialBranch(data: any): Promise<{ success: boolean; message: string; branchId?: string; }> { return this._notImplemented('createJudicialBranch'); }
    async getJudicialProcesses(): Promise<any[]> { return this._notImplemented('getJudicialProcesses', true); }
    async createJudicialProcess(data: any): Promise<{ success: boolean; message: string; processId?: string; }> { return this._notImplemented('createJudicialProcess'); }
    async createBem(data: any): Promise<{ success: boolean; message: string; bemId?: string; }> { return this._notImplemented('createBem'); }
    async updateBem(id: string, data: Partial<any>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateBem'); }
    async deleteBem(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteBem'); }
    async createUser(data: any): Promise<{ success: boolean; message: string; userId?: string; }> { return this._notImplemented('createUser'); }
    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createRole'); }
    async saveContactMessage(message: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('saveContactMessage'); }
}
