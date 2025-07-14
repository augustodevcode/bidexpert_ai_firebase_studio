// src/lib/database/postgres.adapter.ts
// This adapter is currently a placeholder and not in use.
// It serves as a template if PostgreSQL support is needed in the future.
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo, UserHabilitationStatus, Subcategory, SubcategoryFormData, SellerFormData, AuctioneerFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, BemFormData, CityFormData, StateFormData, UserCreationData } from '@/types';

export class PostgresAdapter implements DatabaseAdapter {
    constructor() {
        console.warn("[PostgresAdapter] DEPRECATED: This adapter is not implemented and should not be used.");
    }
    
    async _notImplemented(method: string): Promise<any> {
        const message = `[PostgresAdapter] Method ${method} is not implemented.`;
        console.warn(message);
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
    updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRoles'); }
    getMediaItems(): Promise<MediaItem[]> { return this._notImplemented('getMediaItems'); }
    createMediaItem(item: Partial<Omit<MediaItem, "id">>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    getPlatformSettings(): Promise<PlatformSettings | null> { return this._notImplemented('getPlatformSettings'); }
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
    getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> { return this._notImplemented('getBens'); }
    getBem(id: string): Promise<Bem | null> { return this._notImplemented('getBem'); }
    getBensByIds(ids: string[]): Promise<Bem[]> { return this._notImplemented('getBensByIds'); }
    getSubcategoriesByParent(parentCategoryId?: string | undefined): Promise<Subcategory[]> { return this._notImplemented('getSubcategoriesByParent'); }
    getSubcategory(id: string): Promise<Subcategory | null> { return this._notImplemented('getSubcategory'); }
    createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createLotCategory');}
    createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> { return this._notImplemented('createSubcategory'); }
    updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSubcategory'); }
    deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSubcategory'); }
    getStates(): Promise<StateInfo[]> { return this._notImplemented('getStates'); }
    getCities(stateId?: string | undefined): Promise<CityInfo[]> { return this._notImplemented('getCities'); }
    createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { return this._notImplemented('createState'); }
    updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateState'); }
    deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteState'); }
    createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { return this._notImplemented('createCity'); }
    updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCity'); }
    deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteCity'); }
    getSeller(id: string): Promise<SellerProfileInfo | null> { return this._notImplemented('getSeller'); }
    createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> { return this._notImplemented('createSeller'); }
    updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSeller'); }
    deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSeller'); }
    getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { return this._notImplemented('getAuctioneer'); }
    createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { return this._notImplemented('createAuctioneer'); }
    updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuctioneer'); }
    deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuctioneer'); }
    getCourts(): Promise<Court[]> { return this._notImplemented('getCourts'); }
    createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { return this._notImplemented('createCourt'); }
    updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCourt'); }
    getJudicialDistricts(): Promise<JudicialDistrict[]> { return this._notImplemented('getJudicialDistricts'); }
    createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { return this._notImplemented('createJudicialDistrict'); }
    getJudicialBranches(): Promise<JudicialBranch[]> { return this._notImplemented('getJudicialBranches'); }
    createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { return this._notImplemented('createJudicialBranch'); }
    getJudicialProcesses(): Promise<JudicialProcess[]> { return this._notImplemented('getJudicialProcesses'); }
    createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> { return this._notImplemented('createJudicialProcess'); }
    createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> { return this._notImplemented('createBem'); }
    updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateBem'); }
    deleteBem(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteBem'); }
    createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> { return this._notImplemented('createUser'); }
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createRole'); }
    createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createPlatformSettings'); }
}
