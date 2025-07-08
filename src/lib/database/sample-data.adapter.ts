// src/lib/database/sample-data.adapter.ts
import * as fs from 'fs';
import * as path from 'path';
import type { 
  IDatabaseAdapter, 
  LotCategory, StateInfo, StateFormData, CategoryFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData, AuctionDbData,
  Lot, LotFormData, LotDbData,
  BidInfo, Review, LotQuestion,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus, UserProfileWithPermissions,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData, Theme,
  Subcategory, SubcategoryFormData,
  MapSettings,
  SearchPaginationType,
  MentalTriggerSettings,
  BadgeVisibilitySettings,
  SectionBadgeConfig,
  HomepageSectionConfig,
  AuctionStage,
  DirectSaleOffer, DirectSaleOfferFormData,
  UserLotMaxBid,
  UserWin,
  Court, CourtFormData,
  JudicialDistrict, JudicialDistrictFormData,
  JudicialBranch, JudicialBranchFormData,
  JudicialProcess, JudicialProcessFormData,
  Bem, BemFormData,
  ProcessParty,
  DocumentType,
  UserDocument,
  Notification,
  BlogPost,
  UserBid,
  AdminDashboardStats,
  ConsignorDashboardStats
} from '@/types';
import { slugify, getEffectiveLotEndDate } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import * as sampleData from '@/lib/sample-data';
import type { WizardData } from '@/components/admin/wizard/wizard-context';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import type { FieldValue as FirebaseAdminFieldValue, Timestamp as FirebaseAdminTimestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const DATA_FILE_PATH = path.resolve(process.cwd(), 'src/sample-data.local.json');

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export class SampleDataAdapter implements IDatabaseAdapter {
  private localData: { [K in keyof typeof sampleData]: (typeof sampleData)[K] };
  private AdminFieldValue: typeof FirebaseAdminFieldValue;
  private ServerTimestamp: typeof FirebaseAdminTimestamp;


  constructor() {
    try {
        const { AdminFieldValue: FV, ServerTimestamp: ST } = ensureAdminInitialized();
        this.AdminFieldValue = FV as typeof FirebaseAdminFieldValue;
        this.ServerTimestamp = ST as typeof FirebaseAdminTimestamp;

        const baseData = JSON.parse(JSON.stringify(sampleData));
        
        if (fs.existsSync(DATA_FILE_PATH)) {
            const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
            const parsedData = JSON.parse(fileContents);
            
            // Merge arrays instead of overwriting them
            for (const key in parsedData) {
                if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
                    const baseValue = baseData[key as keyof typeof sampleData];
                    const parsedValue = parsedData[key as keyof typeof sampleData];

                    if (Array.isArray(baseValue) && Array.isArray(parsedValue)) {
                        const combined = [...baseValue, ...parsedValue];
                        const uniqueMap = new Map();
                        // Use 'id' for objects, otherwise stringify for primitive uniqueness
                        combined.forEach(item => {
                            const mapKey = (item && typeof item === 'object' && 'id' in item && item.id) ? item.id : JSON.stringify(item);
                            if (mapKey !== undefined && mapKey !== null) {
                                uniqueMap.set(mapKey, item);
                            }
                        });
                        baseData[key as keyof typeof sampleData] = Array.from(uniqueMap.values());
                    } else {
                        // For non-array properties, or if base doesn't have the key, just assign
                        baseData[key as keyof typeof sampleData] = parsedValue;
                    }
                }
            }
            this.localData = baseData;
            console.log(`[SampleDataAdapter] Loaded and MERGED data from ${DATA_FILE_PATH}`);
        } else {
             this.localData = baseData;
             console.log("[SampleDataAdapter] sample-data.local.json not found, using initial data from module.");
        }
    } catch (error) {
        console.error("[SampleDataAdapter] Could not read or parse sample-data.local.json, falling back to initial import.", error);
        this.localData = JSON.parse(JSON.stringify(sampleData));
        // Fallback for FieldValue and Timestamp if admin SDK fails
        this.AdminFieldValue = { serverTimestamp: () => new Date() } as any; 
        this.ServerTimestamp = { fromDate: (date: Date) => date } as any;
    }
  }
  
  private _persistData(): void {
    // NOTE: This function is preserved for potential use in explicit seed scripts,
    // but is no longer called at runtime to prevent Next.js dev server restarts.
    try {
        const dataString = JSON.stringify(this.localData, null, 2);
        fs.writeFileSync(DATA_FILE_PATH, dataString, 'utf8');
        console.log(`[SampleDataAdapter] Data persisted to ${DATA_FILE_PATH}`);
    } catch (error) {
        console.error(`[SampleDataAdapter] FAILED to persist data to ${DATA_FILE_PATH}:`, error);
    }
  }

  private _enrichLotData(lot: Lot): Lot {
    const category = this.localData.sampleLotCategories.find(c => c.id === lot.categoryId);
    const subcategory = this.localData.sampleSubcategories.find(s => s.id === lot.subcategoryId);
    const state = this.localData.sampleStates.find(s => s.id === lot.stateId);
    const city = this.localData.sampleCities.find(c => c.id === lot.cityId);
    const auction = this.localData.sampleAuctions.find(a => a.id === lot.auctionId);
    const seller = this.localData.sampleSellers.find(s => s.id === lot.sellerId);

    return {
        ...lot,
        type: category?.name || lot.type,
        categoryName: category?.name || lot.categoryName,
        subcategoryName: subcategory?.name || lot.subcategoryName,
        stateUf: state?.uf || lot.stateUf,
        cityName: city?.name || lot.cityName,
        auctionName: auction?.title || lot.auctionName,
        sellerName: seller?.name || lot.sellerName,
    };
  }
  
  // --- Schema ---
  async initializeSchema(): Promise<{ success: boolean; message:string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    try {
        await this.ensureDefaultRolesExist();
        await this.getPlatformSettings(); 
        return { success: true, message: 'Sample data adapter ready. Collections will be created on first document write. Default roles and settings ensured.' };
    } catch (error: any) {
        return { success: false, message: `Error during post-init checks: ${error.message}` };
    }
  }

  async disconnect?(): Promise<void> {
    console.log('[SampleDataAdapter] Disconnect not applicable for sample data.');
    return Promise.resolve();
  }
  
  // --- Dashboard & Reports ---
  async getAdminReportData(): Promise<AdminReportData> {
    const totalLots = this.localData.sampleLots.length;
    const soldLots = this.localData.sampleLots.filter(l => l.status === 'VENDIDO');
    const totalRevenue = soldLots.reduce((sum, lot) => sum + lot.price, 0);
    const newUsers = this.localData.sampleUserProfiles.length;
    const activeAuctions = this.localData.sampleAuctions.filter(a => a.status === 'ABERTO_PARA_LANCES').length;

    const salesData = [
      { name: 'Jan', Sales: randomInt(20000, 50000) }, { name: 'Fev', Sales: randomInt(20000, 50000) },
      { name: 'Mar', Sales: randomInt(20000, 50000) }, { name: 'Abr', Sales: randomInt(20000, 50000) },
      { name: 'Mai', Sales: randomInt(20000, 50000) }, { name: 'Jun', Sales: randomInt(20000, 50000) },
    ];

    const categoryCounts = this.localData.sampleLotCategories.map(cat => ({
      name: cat.name,
      value: this.localData.sampleLots.filter(l => l.categoryId === cat.id).length
    })).filter(c => c.value > 0).slice(0, 5);

    return Promise.resolve({
      totalRevenue,
      newUsersLast30Days: Math.floor(newUsers / 2), // approximation
      activeAuctions,
      lotsSoldCount: soldLots.length,
      salesData,
      categoryData: categoryCounts
    });
  }
  
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    return Promise.resolve({
      users: this.localData.sampleUserProfiles?.length || 0,
      auctions: this.localData.sampleAuctions?.length || 0,
      lots: this.localData.sampleLots?.length || 0,
      sellers: this.localData.sampleSellers?.length || 0,
    });
  }

  async getConsignorDashboardStats(sellerId: string): Promise<ConsignorDashboardStats> {
    const defaultStats: ConsignorDashboardStats = {
      totalLotsConsigned: 0, activeLots: 0, soldLots: 0, totalSalesValue: 0, salesRate: 0, salesByMonth: [],
    };
    if (!sellerId) return Promise.resolve(defaultStats);
    
    const sellerLots = (this.localData.sampleLots || []).filter(lot => lot.sellerId === sellerId);
    if (!sellerLots.length) return Promise.resolve(defaultStats);
    
    const totalLotsConsigned = sellerLots.length;
    const activeLots = sellerLots.filter(lot => lot.status === 'ABERTO_PARA_LANCES').length;
    const soldLots = sellerLots.filter(lot => lot.status === 'VENDIDO');
    const totalSalesValue = soldLots.reduce((sum, lot) => sum + lot.price, 0);
    
    const finishedLotsCount = sellerLots.filter(lot => ['VENDIDO', 'NAO_VENDIDO'].includes(lot.status)).length;
    const salesRate = finishedLotsCount > 0 ? (soldLots.length / finishedLotsCount) * 100 : 0;
    
    const salesByMonthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        salesByMonthMap.set(monthKey, 0);
    }

    soldLots.forEach(lot => {
        const saleDate = new Date(lot.updatedAt as string); // Assuming updatedAt is sale date
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        if (salesByMonthMap.has(monthKey)) {
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + lot.price);
        }
    });

    const salesByMonth = Array.from(salesByMonthMap.entries())
      .map(([name, sales]) => ({ name: format(new Date(name + '-02'), 'MMM/yy', { locale: ptBR }), sales }))
      .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    return Promise.resolve({
      totalLotsConsigned,
      activeLots,
      soldLots: soldLots.length,
      totalSalesValue,
      salesRate,
      salesByMonth
    });
  }

  // --- Notifications ---
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<{ success: boolean; message: string; }> {
    const newNotif: Notification = {
      ...notification,
      id: `notif-${uuidv4()}`,
      isRead: false,
      createdAt: new Date(),
    };
    this.localData.sampleNotifications.unshift(newNotif);
    // No _persistData() call to prevent dev server restart
    return Promise.resolve({ success: true, message: "Notificação criada." });
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!userId) return 0;
    const count = (this.localData.sampleNotifications || []).filter(n => n.userId === userId && !n.isRead).length;
    return Promise.resolve(count);
  }
  
  // --- Consignor Data ---
  async getAuctionsForConsignor(sellerId: string): Promise<Auction[]> {
    return Promise.resolve(this.localData.sampleAuctions.filter(a => a.sellerId === sellerId));
  }
  async getLotsForConsignor(sellerId: string): Promise<Lot[]> {
      const lots = (this.localData.sampleLots || []).filter(lot => lot.sellerId === sellerId);
      return Promise.resolve(lots.map(l => this._enrichLotData(l)));
  }
  async getWinsForSeller(sellerId: string): Promise<UserWin[]> { 
    return Promise.resolve(
        (this.localData.sampleUserWins || []).filter(win => win.lot.sellerId === sellerId)
    );
  }
  
  // --- Direct Sales ---
  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return Promise.resolve(this.localData.sampleDirectSaleOffers || []);
  }

  async getDirectSaleOffersForSeller(sellerId: string): Promise<DirectSaleOffer[]> {
    return Promise.resolve((this.localData.sampleDirectSaleOffers || []).filter(o => o.sellerId === sellerId));
  }
  
  // --- Auctions ---
  async getAuctions(): Promise<Auction[]> {
    await delay(20);
    const auctions = this.localData.sampleAuctions.map(auction => {
      const lotsForAuction = this.localData.sampleLots.filter(lot => lot.auctionId === auction.id).map(l => this._enrichLotData(l));
      return {
        ...auction,
        lots: lotsForAuction,
        totalLots: lotsForAuction.length,
      };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }

  async getBidsForUser(userId: string): Promise<UserBid[]> {
      return Promise.resolve(this.localData.sampleUserBids.filter(b => b.userId === userId));
  }
  async getNotificationsForUser(userId: string): Promise<Notification[]> {
      if (!userId) return [];
      const notifs = (this.localData.sampleNotifications || []).filter(n => n.userId === userId);
      return Promise.resolve(JSON.parse(JSON.stringify(notifs)));
  }
  
  async getLotCategories(): Promise<LotCategory[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotCategories))); }
  
  async getRoleByName(name: string): Promise<Role | null> { return Promise.resolve(this.localData.sampleRoles.find(r => r.name_normalized === name.toUpperCase()) || null); }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
      const user = this.localData.sampleUserProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      return Promise.resolve(user || null);
  }
  
  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    return Promise.resolve(this.localData.samplePlatformSettings);
  }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updatePlatformSettings is a simulation and does not persist across server restarts.");
    this.localData.samplePlatformSettings = { ...this.localData.samplePlatformSettings, ...data, id: 'global', updatedAt: new Date() };
    return { success: true, message: "Configurações atualizadas (em memória)." };
  }
  
  // --- Subcategories ---
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    await delay(20);
    const parentCategory = this.localData.sampleLotCategories.find(c => c.id === parentCategoryId);
    const subcats = this.localData.sampleSubcategories
      .filter(s => s.parentCategoryId === parentCategoryId)
      .map(s => ({
        ...s,
        parentCategoryName: parentCategory?.name,
      }));
    return Promise.resolve(JSON.parse(JSON.stringify(subcats)));
  }
  
  async getSubcategory(id: string): Promise<Subcategory | null> {
    const subcat = this.localData.sampleSubcategories.find(s => s.id === id);
    if (!subcat) return null;
    const parentCategory = this.localData.sampleLotCategories.find(c => c.id === subcat.parentCategoryId);
    return Promise.resolve({ ...subcat, parentCategoryName: parentCategory?.name });
  }

  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    const newSubcategory: Subcategory = {
      ...data,
      id: `subcat-${slugify(data.name)}-${uuidv4().substring(0,4)}`,
      slug: slugify(data.name),
      itemCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleSubcategories.push(newSubcategory);
    const parentCatIndex = this.localData.sampleLotCategories.findIndex(c => c.id === data.parentCategoryId);
    if (parentCatIndex > -1) {
      this.localData.sampleLotCategories[parentCatIndex].hasSubcategories = true;
    }
    // No _persistData() call
    return { success: true, message: 'Subcategoria criada com sucesso!', subcategoryId: newSubcategory.id };
  }

  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleSubcategories.findIndex(s => s.id === id);
    if (index === -1) return { success: false, message: 'Subcategoria não encontrada.' };
    
    const updatedSubcat = { ...this.localData.sampleSubcategories[index], ...data };
    if (data.name) {
      updatedSubcat.slug = slugify(data.name);
    }
    this.localData.sampleSubcategories[index] = updatedSubcat;
    // No _persistData() call
    return { success: true, message: 'Subcategoria atualizada com sucesso!' };
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleSubcategories = this.localData.sampleSubcategories.filter(s => s.id !== id);
    // No _persistData() call
    return { success: true, message: 'Subcategoria excluída com sucesso!' };
  }

  // --- Judicial ---
  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleJudicialProcesses)));
  }
  async getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    let results = this.localData.sampleBens;
    if (filter?.judicialProcessId) {
      results = results.filter(b => b.judicialProcessId === filter.judicialProcessId);
    }
    if (filter?.sellerId) {
      results = results.filter(b => b.sellerId === filter.sellerId);
    }
    return Promise.resolve(JSON.parse(JSON.stringify(results)));
  }
  async getUsersForHabilitationReview(): Promise<UserProfileData[]> {
    const statuses: UserHabilitationStatus[] = ['PENDING_ANALYSIS', 'REJECTED_DOCUMENTS'];
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleUserProfiles.filter(p => p.habilitationStatus && statuses.includes(p.habilitationStatus)))));
  }

  // Stubs for remaining methods
  async createAuctionWithLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> { return { success: false, message: "Not implemented."}; }
  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean, message: string, createdLots?: Lot[] }> { return { success: false, message: "Not implemented."}; }
  async getBensByIds(ids: string[]): Promise<Bem[]> { return []; }
  async getBem(id: string): Promise<Bem | null> { return null; }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> { return null; }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> { return null; }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> { return null; }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getStates(): Promise<StateInfo[]> { return []; }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> { return null; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { return []; }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> { return null; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return []; }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { return null; }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> { return null; }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { return null; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getSellers(): Promise<SellerProfileInfo[]> { return []; }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { return null; }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> { return null; }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { return null; }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> { return []; }
  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> { return []; }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getLot(idOrPublicId: string): Promise<Lot | null> { return null; }
  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> { return []; }
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> { return null; }
  async getWinsForUser(userId: string): Promise<UserWin[]> { return []; }
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> { return []; }
  async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> { return []; }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> { return null; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> { return []; }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getRoles(): Promise<Role[]> { return []; }
  async getRole(id: string): Promise<Role | null> { return null; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> { return { success: true, message: "Default roles are inherent to sample data." }; }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getMediaItems(): Promise<MediaItem[]> { return []; }
  async getMediaItem(id: string): Promise<MediaItem | null> { return null; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> { return null; }
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Funcionalidade não implementada." }; }
  async getDocumentTypes(): Promise<DocumentType[]> { return []; }
  async getUserDocuments(userId: string): Promise<UserDocument[]> { return []; }
  async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented." }; }
  async getCourts(): Promise<Court[]> { return []; }
  async getCourt(id: string): Promise<Court | null> { return null; }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async getJudicialDistricts(): Promise<JudicialDistrict[]> { return []; }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> { return null; }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async getJudicialBranches(): Promise<JudicialBranch[]> { return []; }
  async getJudicialBranch(id: string): Promise<JudicialBranch | null> { return null; }
  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
}
