
// src/lib/database/sample-data.adapter.ts
import type { DatabaseAdapter, UserWin, DirectSaleOffer, Lot, UserProfileData, Role, Auction, StateInfo, CityInfo, CityFormData, StateFormData, LotCategory, Subcategory, Bem, JudicialProcess, Court, JudicialBranch, JudicialDistrict, MediaItem, PlatformSettings, ContactMessage, DocumentType, UserDocument, BidInfo, UserLotMaxBid, SubcategoryFormData, SellerFormData, AuctioneerFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, BemFormData, UserCreationData, AdminReportData, ConsignorDashboardStats } from '@/types';
import { getSampleData } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export class SampleDataAdapter implements DatabaseAdapter {
    private data: ReturnType<typeof getSampleData>;

    constructor() {
        console.log("[SampleDataAdapter] Initializing with live sample data helper.");
        this.data = getSampleData();
    }
    
    private deepCopy<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }
    
    // ===================================
    // READ OPERATIONS
    // ===================================

    async getLots(auctionId?: string): Promise<Lot[]> {
        let lots = this.data.lots;
        if (auctionId) {
            lots = lots.filter(lot => lot.auctionId === auctionId);
        }
        return Promise.resolve(this.deepCopy(lots));
    }
    
    async getLot(id: string): Promise<Lot | null> {
        const lot = this.data.lots.find(l => l.id === id || l.publicId === id);
        return Promise.resolve(lot ? this.deepCopy(lot) : null);
    }
    
    async getLotsByIds(ids: string[]): Promise<Lot[]> {
        if (!ids || ids.length === 0) return Promise.resolve([]);
        const lots = this.data.lots.filter(lot => ids.includes(lot.id) || (lot.publicId && ids.includes(lot.publicId)));
        return Promise.resolve(this.deepCopy(lots));
    }

    async getAuctions(): Promise<Auction[]> {
        return Promise.resolve(this.deepCopy(this.data.auctions));
    }

    async getAuction(id: string): Promise<Auction | null> {
        const auction = this.data.auctions.find(a => a.id === id || a.publicId === id);
        return Promise.resolve(auction ? this.deepCopy(auction) : null);
    }
    
    async getUsersWithRoles(): Promise<UserProfileData[]> {
        return Promise.resolve(this.deepCopy(this.data.usersWithRoles));
    }
    
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const user = this.data.usersWithRoles.find(u => u.uid === userId || u.id === userId || u.email === userId);
        return Promise.resolve(user ? this.deepCopy(user) : null);
    }
    
    async getSellers(): Promise<SellerProfileInfo[]> { return Promise.resolve(this.deepCopy(this.data.sampleSellers)); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return Promise.resolve(this.deepCopy(this.data.sampleAuctioneers)); }
    async getLotCategories(): Promise<LotCategory[]> { return Promise.resolve(this.deepCopy(this.data.categoriesWithDetails)); }
    async getSubcategoriesByParent(parentCategoryId?: string): Promise<Subcategory[]> {
      if (!parentCategoryId) return Promise.resolve(this.deepCopy(this.data.subcategoriesWithDetails));
      const filtered = this.data.subcategoriesWithDetails.filter(s => s.parentCategoryId === parentCategoryId);
      return Promise.resolve(this.deepCopy(filtered));
    }
    async getSubcategory(id: string): Promise<Subcategory | null> { return this.data.subcategoriesWithDetails.find(s => s.id === id) || null; }
    async getStates(): Promise<StateInfo[]> { return Promise.resolve(this.deepCopy(this.data.sampleStates)); }
    async getCities(stateId?: string): Promise<CityInfo[]> {
        const cities = this.data.citiesWithDetails;
        if (!stateId) return Promise.resolve(this.deepCopy(cities));
        return Promise.resolve(this.deepCopy(cities.filter(c => c.stateId === stateId)));
    }
    async getCourts(): Promise<Court[]> { return Promise.resolve(this.deepCopy(this.data.sampleCourts)); }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return Promise.resolve(this.deepCopy(this.data.sampleJudicialDistricts)); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return Promise.resolve(this.deepCopy(this.data.sampleJudicialBranches)); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return Promise.resolve(this.deepCopy(this.data.judicialProcessesWithDetails)); }
    async getBens(): Promise<Bem[]> { return Promise.resolve(this.deepCopy(this.data.bensWithDetails)); }
    async getBem(id: string): Promise<Bem | null> { return this.data.bensWithDetails.find(b => b.id === id) || null; }
    async getBensByIds(ids: string[]): Promise<Bem[]> {
        if (!ids || ids.length === 0) return Promise.resolve([]);
        const bens = this.data.bensWithDetails.filter(b => ids.includes(b.id));
        return Promise.resolve(this.deepCopy(bens));
    }
    async getRoles(): Promise<Role[]> { return Promise.resolve(this.deepCopy(this.data.sampleRoles)); }
    async getMediaItems(): Promise<MediaItem[]> { return Promise.resolve(this.deepCopy(this.data.sampleMediaItems)); }
    async getPlatformSettings(): Promise<PlatformSettings> { return Promise.resolve(this.deepCopy(this.data.samplePlatformSettings)); }
    
    // Methods requiring implementation or more complex logic
    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> {
      const newLot = { ...lotData, id: `LOTE${this.data.lots.length + 1}`, createdAt: new Date().toISOString() };
      this.data.lots.push(newLot as Lot);
      const auction = this.data.auctions.find(a => a.id === lotData.auctionId);
      if (auction) auction.totalLots = (auction.totalLots || 0) + 1;
      return Promise.resolve({ success: true, message: "Lote criado com sucesso!", lotId: newLot.id });
    }
    async updateLot(id: string, updates: any): Promise<{ success: boolean, message: string }> {
      const index = this.data.lots.findIndex(l => l.id === id || l.publicId === id);
      if (index === -1) return { success: false, message: "Lote não encontrado." };
      this.data.lots[index] = { ...this.data.lots[index], ...updates };
      return { success: true, message: "Lote atualizado com sucesso." };
    }
    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    async deleteAuction(id: string): Promise<{ success: boolean, message: string }> { return this._notImplemented('deleteAuction'); }
    async getAdminReportData(): Promise<AdminReportData> {
        return {
            users: this.data.usersWithRoles.length,
            auctions: this.data.auctions.length,
            lots: this.data.lots.length,
            sellers: this.data.sampleSellers.length,
            totalRevenue: 837000,
            newUsersLast30Days: 1,
            activeAuctions: this.data.auctions.filter(a => a.status === 'ABERTO_PARA_LANCES').length,
            lotsSoldCount: this.data.userWinsWithDetails.length,
            salesData: [{ name: format(new Date(), 'MMM', { locale: ptBR }), Sales: 837000 }],
            categoryData: [{ name: 'Veículos', value: 2 }, { name: 'Imóveis', value: 1 }, { name: 'Arte', value: 1 }],
            averageBidValue: 250000,
            auctionSuccessRate: 75,
            averageLotsPerAuction: 4.5,
        };
    }
     async getConsignorDashboardStats(sellerId: string): Promise<ConsignorDashboardStats> {
        return {
            totalLotsConsigned: 10,
            activeLots: 5,
            soldLots: 3,
            totalSalesValue: 218500,
            salesRate: 30,
            salesData: [{ name: format(new Date(), 'MMM', { locale: ptBR }), sales: 218500 }],
        };
    }

    async _notImplemented(method: string): Promise<any> {
        const message = `[SampleDataAdapter] Method ${method} is not implemented.`;
        console.warn(message);
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }
}
