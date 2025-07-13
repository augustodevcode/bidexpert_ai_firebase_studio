// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo, UserHabilitationStatus, Subcategory, SubcategoryFormData, SellerFormData, AuctioneerFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, BemFormData, CityFormData, StateFormData, UserCreationData } from '@/types';
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

// This file is now deprecated and serves only as a reference for a possible future MySQL implementation.
// All functionality should be implemented in the Firestore adapter.

export class MySqlAdapter implements DatabaseAdapter {
    private pool: Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        console.warn("[MySqlAdapter] DEPRECATED: This adapter is no longer in active use. Project has migrated to Firestore.");
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl || !dbUrl.startsWith('mysql://')) {
            this.connectionError = "A variável de ambiente DATABASE_URL (para MySQL) não está definida.";
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError}`);
            return;
        }
        try {
            this.pool = mysql.createPool(dbUrl);
            console.log('[MySqlAdapter] Pool de conexões MySQL inicializado (mas não será usado ativamente).');
        } catch (error: any) {
            this.connectionError = `Falha ao criar o pool de conexões MySQL: ${error.message}`;
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError}`);
            this.pool = null;
        }
    }
    
    async _notImplemented(method: string): Promise<any> {
        const message = `[MySqlAdapter] DEPRECATED: Method ${method} is not implemented.`;
        console.warn(message);
        return Promise.resolve(method.endsWith('s') || method.endsWith('es') ? [] : null);
    }
    
    async getLots(auctionId?: string): Promise<Lot[]> { return this._notImplemented('getLots'); }
    async getLot(id: string): Promise<Lot | null> { return this._notImplemented('getLot'); }
    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    async getAuctions(): Promise<Auction[]> { return this._notImplemented('getAuctions'); }
    async getAuction(id: string): Promise<Auction | null> { return this._notImplemented('getAuction'); }
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuction'); }
    async getLotsByIds(ids: string[]): Promise<Lot[]> { return this._notImplemented('getLotsByIds'); }
    async getLotCategories(): Promise<LotCategory[]> { return this._notImplemented('getLotCategories'); }
    async getSubcategoriesByParent(parentCategoryId?: string | undefined): Promise<Subcategory[]> { return this._notImplemented('getSubcategoriesByParent'); }
    async getSubcategory(id: string): Promise<Subcategory | null> { return this._notImplemented('getSubcategory'); }
    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createLotCategory'); }
    async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string | undefined; }> { return this._notImplemented('createSubcategory'); }
    async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSubcategory'); }
    async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSubcategory'); }
    async getStates(): Promise<StateInfo[]> { return this._notImplemented('getStates'); }
    async getCities(stateId?: string | undefined): Promise<CityInfo[]> { return this._notImplemented('getCities'); }
    async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string | undefined; }> { return this._notImplemented('createState'); }
    async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateState'); }
    async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteState'); }
    async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string | undefined; }> { return this._notImplemented('createCity'); }
    async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCity'); }
    async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteCity'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this._notImplemented('getSellers'); }
    async getSeller(id: string): Promise<SellerProfileInfo | null> { return this._notImplemented('getSeller'); }
    async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string | undefined; }> { return this._notImplemented('createSeller'); }
    async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSeller'); }
    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSeller'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this._notImplemented('getAuctioneers'); }
    async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { return this._notImplemented('getAuctioneer'); }
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string | undefined; }> { return this._notImplemented('createAuctioneer'); }
    async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuctioneer'); }
    async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuctioneer'); }
    async getCourts(): Promise<Court[]> { return this._notImplemented('getCourts'); }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return this._notImplemented('getJudicialDistricts'); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return this._notImplemented('getJudicialBranches'); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return this._notImplemented('getJudicialProcesses'); }
    async getBem(id: string): Promise<Bem | null> { return this._notImplemented('getBem'); }
    async getBens(filter?: { judicialProcessId?: string; sellerId?: string; } | undefined): Promise<Bem[]> { return this._notImplemented('getBens'); }
    async getBensByIds(ids: string[]): Promise<Bem[]> { return this._notImplemented('getBensByIds'); }
    async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string | undefined; }> { return this._notImplemented('createCourt'); }
    async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCourt'); }
    async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string | undefined; }> { return this._notImplemented('createJudicialDistrict'); }
    async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string | undefined; }> { return this._notImplemented('createJudicialBranch'); }
    async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string | undefined; }> { return this._notImplemented('createJudicialProcess'); }
    async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string | undefined; }> { return this._notImplemented('createBem'); }
    async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateBem'); }
    async deleteBem(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteBem'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> { return this._notImplemented('getUsersWithRoles'); }
    async getUserProfileData(userId: string): Promise<UserProfileData | null> { return this._notImplemented('getUserProfileData'); }
    async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string | undefined; }> { return this._notImplemented('createUser'); }
    async getRoles(): Promise<Role[]> { return this._notImplemented('getRoles'); }
    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createRole'); }
    async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRoles'); }
    async getMediaItems(): Promise<MediaItem[]> { return this._notImplemented('getMediaItems'); }
    async createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem | undefined; }> { return this._notImplemented('createMediaItem'); }
    async getPlatformSettings(): Promise<PlatformSettings | null> { return this._notImplemented('getPlatformSettings'); }
    async createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createPlatformSettings'); }
    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
    async getDocumentTemplates(): Promise<any[]> { return this._notImplemented('getDocumentTemplates'); }
    async getDocumentTemplate(id: string): Promise<any | null> { return this._notImplemented('getDocumentTemplate'); }
    async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('saveUserDocument'); }
    async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return this._notImplemented('getDirectSaleOffers'); }
}
