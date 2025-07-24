// src/lib/database/mysql.adapter.ts
import { prisma } from '@/lib/prisma';
import type { 
    DatabaseAdapter, 
    Auction, 
    Lot, 
    UserProfileData, 
    Role, 
    LotCategory, 
    AuctioneerProfileInfo, 
    SellerProfileInfo, 
    MediaItem, 
    PlatformSettings,
    StateInfo,
    CityInfo,
    Court,
    JudicialDistrict,
    JudicialBranch,
    JudicialProcess,
    Bem,
    Subcategory,
    DirectSaleOffer,
    DocumentTemplate,
    ContactMessage,
    UserDocument,
    UserWin,
    BidInfo,
    UserLotMaxBid,
    UserHabilitationStatus,
    SellerFormData,
    AuctioneerFormData,
    LotFormData,
    BemFormData,
    JudicialProcessFormData,
    JudicialBranchFormData,
    JudicialDistrictFormData,
    CourtFormData,
    StateFormData,
    CityFormData,
    SubcategoryFormData,
    RoleFormData,
    UserCreationData,
    EditableUserProfileData
} from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import { SellerRepository } from '@/repositories/seller.repository';
import { AuctionRepository } from '@/repositories/auction.repository';
import { LotRepository } from '@/repositories/lot.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { SubcategoryRepository } from '@/repositories/subcategory.repository';
import { MediaRepository } from '@/repositories/media.repository';
import { UserRepository } from '@/repositories/user.repository';
import { RoleRepository } from '@/repositories/role.repository';
import { StateRepository } from '@/repositories/state.repository';
import { CityRepository } from '@/repositories/city.repository';
import { CourtRepository } from '@/repositories/court.repository';
import { JudicialDistrictRepository } from '@/repositories/judicial-district.repository';
import { JudicialBranchRepository } from '@/repositories/judicial-branch.repository';
import { JudicialProcessRepository } from '@/repositories/judicial-process.repository';
import { BemRepository } from '@/repositories/bem.repository';
import { SellerService } from '@/services/seller.service';

/**
 * This is the primary database adapter for the application, using Prisma ORM.
 * It implements the DatabaseAdapter interface to provide a consistent data access layer.
 */
export class MySqlAdapter implements DatabaseAdapter {
    private sellerRepository: SellerRepository = new SellerRepository();
    private auctionRepository: AuctionRepository = new AuctionRepository();
    private lotRepository: LotRepository = new LotRepository();
    private categoryRepository: CategoryRepository = new CategoryRepository();
    private subcategoryRepository: SubcategoryRepository = new SubcategoryRepository();
    private mediaRepository: MediaRepository = new MediaRepository();
    private userRepository: UserRepository = new UserRepository();
    private roleRepository: RoleRepository = new RoleRepository();
    private stateRepository: StateRepository = new StateRepository();
    private cityRepository: CityRepository = new CityRepository();
    private courtRepository: CourtRepository = new CourtRepository();
    private judicialDistrictRepository: JudicialDistrictRepository = new JudicialDistrictRepository();
    private judicialBranchRepository: JudicialBranchRepository = new JudicialBranchRepository();
    private judicialProcessRepository: JudicialProcessRepository = new JudicialProcessRepository();
    private bemRepository: BemRepository = new BemRepository();


    constructor() {
        console.log('[MySqlAdapter] (Prisma) Initialized.');
    }

    // --- LOTS ---
    async getLots(auctionId?: string | undefined): Promise<Lot[]> {
        const lots = await this.lotRepository.findAll(auctionId);
        return lots.map(lot => ({
            ...lot,
            auctionName: lot.auction?.title,
            categoryName: lot.category?.name,
            subcategoryName: lot.subcategory?.name,
            bens: lot.bens.map((lb: any) => lb.bem) || [],
        }));
    }
    async getLot(id: string): Promise<Lot | null> {
         const lot = await this.lotRepository.findById(id);
         if (!lot) return null;
         return {
             ...lot,
             auctionName: lot.auction?.title,
             bens: lot.bens?.map((lb: any) => lb.bem) || []
         };
    }
    async createLot(lotData: Partial<LotFormData>): Promise<{ success: boolean; message: string; lotId?: string; }> {
        // This is a simplified version for compatibility. The full logic is in LotService.
        // @ts-ignore
        const newLot = await this.lotRepository.create(lotData, lotData.bemIds || []);
        return { success: true, message: 'Lote criado.', lotId: newLot.id };
    }
    async updateLot(id: string, updates: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> {
         await this.lotRepository.update(id, updates, updates.bemIds);
         return { success: true, message: 'Lote atualizado.' };
    }
    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
        await this.lotRepository.delete(id);
        return { success: true, message: 'Lote excluído.' };
    }
    async getLotsByIds(ids: string[]): Promise<Lot[]> { return this._notImplemented('getLotsByIds'); }

    // --- AUCTIONS ---
    async getAuctions(): Promise<Auction[]> { 
        const auctions = await this.auctionRepository.findAll();
        // @ts-ignore
        return auctions.map(a => ({...a, totalLots: a.lots?.length || 0}));
    }
    async getAuction(id: string): Promise<Auction | null> { 
        const auction = await this.auctionRepository.findById(id);
        if (!auction) return null;
        // @ts-ignore
        return { ...auction, totalLots: auction.lots.length };
    }
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        // @ts-ignore
        const newAuction = await this.auctionRepository.create(auctionData);
        return { success: true, message: 'Leilão criado.', auctionId: newAuction.id };
    }
    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
        // @ts-ignore
        await this.auctionRepository.update(id, updates);
        return { success: true, message: 'Leilão atualizado.' };
    }
    async deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
        await this.auctionRepository.delete(id);
        return { success: true, message: 'Leilão excluído.' };
    }
    
    // --- CATEGORIES ---
    async getLotCategories(): Promise<LotCategory[]> { return this.categoryRepository.findAll(); }
    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
        // @ts-ignore
        await this.categoryRepository.create(data);
        return { success: true, message: "Categoria criada."};
    }
    
    // --- SUBCATEGORIES ---
    async getSubcategoriesByParent(parentCategoryId?: string | undefined): Promise<Subcategory[]> { 
        if (!parentCategoryId) return [];
        return this.subcategoryRepository.findAllByParentId(parentCategoryId);
    }
    async getSubcategory(id: string): Promise<Subcategory | null> { return this.subcategoryRepository.findById(id); }
    async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string | undefined; }> {
        // @ts-ignore
        const sub = await this.subcategoryRepository.create(data);
        return { success: true, message: 'Subcategoria criada.', subcategoryId: sub.id };
    }
    async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
        // @ts-ignore
        await this.subcategoryRepository.update(id, data);
        return { success: true, message: 'Subcategoria atualizada.' };
    }
    async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
        await this.subcategoryRepository.delete(id);
        return { success: true, message: 'Subcategoria deletada.' };
    }
    
    // --- SELLERS ---
    async getSellers(): Promise<SellerProfileInfo[]> { return this.sellerRepository.findAll(); }
    async getSeller(id: string): Promise<SellerProfileInfo | null> { return this.sellerRepository.findById(id); }
    async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
        const sellerService = new SellerService();
        return sellerService.createSeller(data);
    }
    async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
        await this.sellerRepository.update(id, data);
        return { success: true, message: 'Vendedor atualizado.' };
    }
    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
        await this.sellerRepository.delete(id);
        return { success: true, message: 'Vendedor deletado.' };
    }
    
    // --- AUCTIONEERS ---
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.auctioneerRepository.findAll(); }
    async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { return this.auctioneerRepository.findById(id); }
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { 
        // @ts-ignore
        const newAuc = await this.auctioneerRepository.create(data);
        return { success: true, message: 'Leiloeiro criado.', auctioneerId: newAuc.id };
    }
    async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
        await this.auctioneerRepository.update(id, data);
        return { success: true, message: 'Leiloeiro atualizado.' };
    }
    async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> {
        await this.auctioneerRepository.delete(id);
        return { success: true, message: 'Leiloeiro deletado.' };
    }

    // --- USERS & ROLES ---
    async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> { 
        const userService = new UserService();
        return userService.getUsers();
    }
    async getUserProfileData(userIdOrEmail: string): Promise<UserProfileWithPermissions | null> { 
        const userService = new UserService();
        return userService.getUserById(userIdOrEmail);
    }
    async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> { 
        const userService = new UserService();
        return userService.createUser(data);
    }
    async getRoles(): Promise<Role[]> { return this.roleRepository.findAll(); }
    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; }> {
        // @ts-ignore
        await this.roleRepository.create(role);
        return { success: true, message: 'Role criada.' };
    }
    async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> {
        await this.userRepository.updateUserRoles(userId, roleIds);
        return { success: true, message: 'Roles atualizadas.' };
    }
    
    // --- MEDIA ---
    async getMediaItems(): Promise<MediaItem[]> { return this.mediaRepository.findAll(); }
    async createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> {
        const mediaService = new (await import('@/services/media.service')).MediaService();
        return mediaService.createMediaItem(item, url, userId);
    }

    // --- OTHER ENTITIES (Simple pass-through) ---
    async getStates(): Promise<StateInfo[]> { return this.stateRepository.findAllWithCityCount(); }
    async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { return this._notImplemented('createState'); }
    async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateState'); }
    async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteState'); }
    
    async getCities(stateId?: string | undefined): Promise<CityInfo[]> { return this.cityRepository.findAll(stateId); }
    async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { return this._notImplemented('createCity'); }
    async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCity'); }
    async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteCity'); }

    async getCourts(): Promise<Court[]> { return this.courtRepository.findAll(); }
    async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { return this._notImplemented('createCourt'); }
    async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCourt'); }

    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return (new JudicialDistrictService()).getJudicialDistricts(); }
    async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string | undefined; }> { return this._notImplemented('createJudicialDistrict'); }

    async getJudicialBranches(): Promise<JudicialBranch[]> { return (new JudicialBranchService()).getJudicialBranches(); }
    async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string | undefined; }> { return this._notImplemented('createJudicialBranch'); }

    async getJudicialProcesses(): Promise<JudicialProcess[]> { return (new JudicialProcessService()).getJudicialProcesses(); }
    async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string | undefined; }> { return this._notImplemented('createJudicialProcess'); }

    async getBem(id: string): Promise<Bem | null> { return this.bemRepository.findById(id); }
    async getBens(filter?: { judicialProcessId?: string | undefined; sellerId?: string | undefined; } | undefined): Promise<Bem[]> { return this.bemRepository.findAll(filter); }
    async getBensByIds(ids: string[]): Promise<Bem[]> { return this.bemRepository.findByIds(ids); }
    async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string | undefined; }> { return this._notImplemented('createBem'); }
    async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateBem'); }
    async deleteBem(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteBem'); }

    async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return prisma.directSaleOffer.findMany(); }
    async getDocumentTemplates(): Promise<DocumentTemplate[]> { return prisma.documentTemplate.findMany(); }
    async getContactMessages(): Promise<ContactMessage[]> { return prisma.contactMessage.findMany(); }
    async saveContactMessage(message: Omit<ContactMessage, "id" | "createdAt" | "isRead">): Promise<{ success: boolean; message: string; }> {
         await prisma.contactMessage.create({ data: message });
         return { success: true, message: "Mensagem salva." };
    }
    
    // --- SETTINGS ---
     async getPlatformSettings(): Promise<PlatformSettings | null> { return prisma.platformSettings.findFirst(); }
     async createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> {
        // @ts-ignore
        await prisma.platformSettings.create({ data });
        return { success: true, message: 'Configurações criadas.'};
     }
     async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        const currentSettings = await prisma.platformSettings.findFirst();
        if (currentSettings) {
             // @ts-ignore
            await prisma.platformSettings.update({ where: { id: currentSettings.id }, data });
        } else {
             // @ts-ignore
            await prisma.platformSettings.create({ data });
        }
        return { success: true, message: 'Configurações atualizadas.'};
     }
     
     // --- USER DOCUMENTS ---
     async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> {
         await prisma.userDocument.upsert({
            where: { userId_documentTypeId: { userId, documentTypeId } },
            update: { fileUrl, fileName, status: 'PENDING_ANALYSIS' },
            create: { userId, documentTypeId, fileUrl, fileName, status: 'PENDING_ANALYSIS' },
         });
         return { success: true, message: "Documento salvo." };
     }


    async _notImplemented(method: string): Promise<any> {
        const message = `[MySqlAdapter] Método ${method} não implementado.`;
        console.warn(message);
        throw new Error(message);
    }
}
