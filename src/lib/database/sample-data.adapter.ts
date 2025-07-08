
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
    const salesRate = totalLotsConsigned > 0 ? (soldLots.length / totalLotsConsigned) * 100 : 0;
    
    // Aggregate sales by month for the last 12 months
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
      .map(([name, sales]) => ({ name: format(new Date(name), 'MMM/yy', { locale: ptBR }), sales }))
      .sort((a,b) => a.name.localeCompare(b.name));

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
    this._persistData();
    return Promise.resolve({ success: true, message: "Notificação criada." });
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!userId) return 0;
    const count = (this.localData.sampleNotifications || []).filter(n => n.userId === userId && !n.isRead).length;
    return Promise.resolve(count);
  }
  
  // Stubs and other methods...
  async createAuctionWithLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> { return { success: false, message: "Not implemented."}; }
  async getWinsForSeller(sellerId: string): Promise<UserWin[]> { 
    return Promise.resolve(
        (this.localData.sampleUserWins || []).filter(win => win.lot.sellerId === sellerId)
    );
  }
  async getLotsForConsignor(sellerId: string): Promise<Lot[]> {
      const lots = (this.localData.sampleLots || []).filter(lot => lot.sellerId === sellerId);
      return Promise.resolve(lots.map(l => this._enrichLotData(l)));
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

  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    const subcat = this.localData.sampleSubcategories.find(s => s.slug === slug && s.parentCategoryId === parentCategoryId);
    return Promise.resolve(subcat || null);
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
    
    // Update parent category
    const parentCatIndex = this.localData.sampleLotCategories.findIndex(c => c.id === data.parentCategoryId);
    if (parentCatIndex > -1) {
      this.localData.sampleLotCategories[parentCatIndex].hasSubcategories = true;
    }
    
    this._persistData();
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
    this._persistData();
    return { success: true, message: 'Subcategoria atualizada com sucesso!' };
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleSubcategories = this.localData.sampleSubcategories.filter(s => s.id !== id);
    // Note: This doesn't check if the parent category still has other subcategories.
    // For sample data, this simplification is acceptable.
    this._persistData();
    return { success: true, message: 'Subcategoria excluída com sucesso!' };
  }


  // --- LotCategory ---
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    return Promise.resolve(this.localData.sampleLotCategories.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null);
  }
  
  // Implement other methods as needed, using the this.localData object
  // For brevity, many methods are omitted but would follow this pattern:
  // 1. Access this.localData.sample[Entity]
  // 2. Find, filter, or modify the data in the array
  // 3. Call this._persistData() if it's a mutation (create, update, delete)
  // 4. Return the result as a Promise
  
  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    await delay(50);
    const auction = this.localData.sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId);
    if (!auction) return null;
    
    const lotsForAuction = (this.localData.sampleLots || []).filter(lot => lot.auctionId === auction.id);
    const enrichedLots = lotsForAuction.map(l => this._enrichLotData(l));
    
    return {
        ...auction,
        lots: enrichedLots,
        totalLots: enrichedLots.length
    };
  }

  async getAuctions(): Promise<Auction[]> {
    await delay(100);
    const auctionsWithLots = this.localData.sampleAuctions.map(auction => {
        const lotsForAuction = this.localData.sampleLots.filter(l => l.auctionId === auction.id).map(l => this._enrichLotData(l));
        return {
            ...auction,
            lots: lotsForAuction,
            totalLots: lotsForAuction.length,
        };
    });
    return auctionsWithLots;
  }
  
  async getLots(auctionId?: string): Promise<Lot[]> {
      await delay(50);
      let lots = this.localData.sampleLots || [];
      if (auctionId) {
          lots = lots.filter(lot => lot.auctionId === auctionId);
      }
      return lots.map(l => this._enrichLotData(l));
  }
  
  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    if (!ids || ids.length === 0) {
      return Promise.resolve([]);
    }
    const lots = (this.localData.sampleLots || [])
      .filter(lot => ids.includes(lot.id))
      .map(lot => this._enrichLotData(lot));
    return Promise.resolve(lots);
  }

   async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    await delay(50);
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleAuctioneers)));
  }

  async getSellers(): Promise<SellerProfileInfo[]> {
    await delay(50);
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleSellers)));
  }

  async getRoles(): Promise<Role[]> {
    await delay(50);
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleRoles)));
  }

  async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
    await delay(50);
    // Ensure all users have a permissions array for consistency
    const users = this.localData.sampleUserProfiles.map(u => ({
      ...u,
      permissions: u.permissions || [],
    }));
    return Promise.resolve(JSON.parse(JSON.stringify(users)));
  }

  // --- Judicial Entities ---
  async getCourts(): Promise<Court[]> {
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleCourts)));
  }

  async getJudicialDistricts(): Promise<JudicialDistrict[]> {
    await delay(20);
    const districtsWithNames = this.localData.sampleJudicialDistricts.map(dist => {
      const court = this.localData.sampleCourts.find(c => c.id === dist.courtId);
      const state = this.localData.sampleStates.find(s => s.id === dist.stateId);
      return {
        ...dist,
        courtName: court?.name,
        stateUf: state?.uf,
      };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(districtsWithNames)));
  }

  async getJudicialBranches(): Promise<JudicialBranch[]> {
    await delay(20);
    const branchesWithNames = this.localData.sampleJudicialBranches.map(branch => {
      const district = this.localData.sampleJudicialDistricts.find(d => d.id === branch.districtId);
      return {
        ...branch,
        districtName: district?.name
      };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(branchesWithNames)));
  }

  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    await delay(20);
    const processes = this.localData.sampleJudicialProcesses.map(proc => {
        const court = this.localData.sampleCourts.find(c => c.id === proc.courtId);
        const district = this.localData.sampleJudicialDistricts.find(d => d.id === proc.districtId);
        const branch = this.localData.sampleJudicialBranches.find(b => b.id === proc.branchId);
        const seller = this.localData.sampleSellers.find(s => s.id === proc.sellerId);
        return {
          ...proc,
          courtName: court?.name,
          districtName: district?.name,
          branchName: branch?.name,
          sellerName: seller?.name,
        };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(processes)));
  }

  async getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    await delay(20);
    const process = this.localData.sampleJudicialProcesses.find(p => p.id === id);
    if (!process) return null;
    const court = this.localData.sampleCourts.find(c => c.id === process.courtId);
    const district = this.localData.sampleJudicialDistricts.find(d => d.id === process.districtId);
    const branch = this.localData.sampleJudicialBranches.find(b => b.id === process.branchId);
    const seller = this.localData.sampleSellers.find(s => s.id === process.sellerId);
    return Promise.resolve({
      ...process,
      courtName: court?.name,
      districtName: district?.name,
      branchName: branch?.name,
      sellerName: seller?.name,
    });
  }

  // --- Stubs for methods not yet fully implemented in sample data adapter ---
  // These will return empty or default values to avoid crashing the app.
  async getBem(id: string): Promise<Bem | null> { return Promise.resolve(this.localData.sampleBens.find(b => b.id === id) || null); }
  async getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    let bens = [...this.localData.sampleBens];
    if (filter?.judicialProcessId) {
      bens = bens.filter(b => b.judicialProcessId === filter.judicialProcessId);
    }
    if (filter?.sellerId) {
      bens = bens.filter(b => b.sellerId === filter.sellerId);
    }
    return Promise.resolve(bens);
  }
  async getBensByIds(ids: string[]): Promise<Bem[]> { 
    return Promise.resolve((this.localData.sampleBens || []).filter(b => ids.includes(b.id)));
  }
  
  async getDocumentTypes(): Promise<DocumentType[]> {
      return Promise.resolve(this.localData.sampleDocumentTypes);
  }
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
      const userDocs = this.localData.sampleUserDocuments.filter(d => d.userId === userId);
      return Promise.resolve(userDocs);
  }
  async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> {
      const existingDocIndex = this.localData.sampleUserDocuments.findIndex(d => d.userId === userId && d.documentTypeId === documentTypeId);
      const docType = this.localData.sampleDocumentTypes.find(dt => dt.id === documentTypeId)!;
      const newDocData: UserDocument = {
          id: `user-doc-${uuidv4()}`,
          userId,
          documentTypeId,
          fileUrl,
          fileName,
          status: 'PENDING_ANALYSIS',
          uploadDate: new Date(),
          documentType: docType
      };
      if (existingDocIndex > -1) {
          this.localData.sampleUserDocuments[existingDocIndex] = newDocData;
      } else {
          this.localData.sampleUserDocuments.push(newDocData);
      }
      this._persistData();
      return { success: true, message: "Documento salvo com sucesso." };
  }
  
  async getCourt(id: string): Promise<Court | null> { return Promise.resolve(this.localData.sampleCourts.find(c => c.id === id) || null); }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> { return Promise.resolve(this.localData.sampleJudicialDistricts.find(d => d.id === id) || null); }
  async getJudicialBranch(id: string): Promise<JudicialBranch | null> { return Promise.resolve(this.localData.sampleJudicialBranches.find(b => b.id === id) || null); }

  // Other stubs...
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> { console.warn("[SampleDataAdapter] createJudicialProcess not implemented."); return { success: false, message: "Not implemented."}; }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateJudicialProcess not implemented."); return { success: false, message: "Not implemented."}; }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteJudicialProcess not implemented."); return { success: false, message: "Not implemented."}; }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { console.warn("[SampleDataAdapter] createCourt not implemented."); return { success: false, message: "Not implemented."}; }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateCourt not implemented."); return { success: false, message: "Not implemented."}; }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteCourt not implemented."); return { success: false, message: "Not implemented."}; }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { console.warn("[SampleDataAdapter] createJudicialDistrict not implemented."); return { success: false, message: "Not implemented."}; }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateJudicialDistrict not implemented."); return { success: false, message: "Not implemented."}; }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteJudicialDistrict not implemented."); return { success: false, message: "Not implemented."}; }
  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { console.warn("[SampleDataAdapter] createJudicialBranch not implemented."); return { success: false, message: "Not implemented."}; }
  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateJudicialBranch not implemented."); return { success: false, message: "Not implemented."}; }
  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteJudicialBranch not implemented."); return { success: false, message: "Not implemented."}; }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> { console.warn("[SampleDataAdapter] createBem not implemented."); return { success: false, message: "Not implemented."}; }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateBem not implemented."); return { success: false, message: "Not implemented."}; }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteBem not implemented."); return { success: false, message: "Not implemented."}; }
  async updateBensStatus(bemIds: string[], status: Bem['status']): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updateBensStatus is a simulation.");
    this.localData.sampleBens.forEach(bem => {
      if (bemIds.includes(bem.id)) {
        bem.status = status;
      }
    });
    this._persistData();
    return { success: true, message: 'Status dos bens atualizado com sucesso.' };
  }
  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean; message: string; createdLots?: Lot[] }> {
    console.warn("[SampleDataAdapter] createLotsFromBens is a simulation.");
    const newLots: Lot[] = [];
    lotsToCreate.forEach(lotData => {
      const newLot: Lot = {
        ...lotData,
        id: `lot-${uuidv4()}`,
        publicId: `LOT-PUB-${uuidv4().substring(0, 8)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        price: lotData.price || 0,
        number: lotData.number || 'N/A',
      };
      this.localData.sampleLots.push(newLot);
      newLots.push(newLot);
    });
    this._persistData();
    return { success: true, message: `${newLots.length} lotes criados com sucesso.`, createdLots: newLots };
  }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; }> { return { success: false, message: 'Not implemented' }; }
  async getAuctionsByAuctioneerSlug(slug: string): Promise<Auction[]> { return []; }
  async getAuctionsBySellerSlug(slug: string): Promise<Auction[]> { return []; }
  async getAuctionsForConsignor(id: string): Promise<Auction[]> { return []; }
  async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { return null; }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> { return null; }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { return null; }
  async getBidsForLot(id: string): Promise<BidInfo[]> { return []; }
  async getCity(id: string): Promise<CityInfo | null> { return null; }
  async getCities(filter?: string): Promise<CityInfo[]> { return []; }
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> { return null; }
  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return []; }
  async getDirectSaleOffersForSeller(id: string): Promise<DirectSaleOffer[]> { return []; }
  async getLot(id: string): Promise<Lot | null> { return null; }
  async getLotsBySellerSlug(slug: string): Promise<Lot[]> { return []; }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> { return null; }
  async getMediaItem(id: string): Promise<MediaItem | null> { return null; }
  async getMediaItems(): Promise<MediaItem[]> { return []; }
  async getRole(id: string): Promise<Role | null> { return null; }
  async getSeller(id: string): Promise<SellerProfileInfo | null> { return null; }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> { return null; }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { return null; }
  async getState(id: string): Promise<StateInfo | null> { return null; }
  async getStates(): Promise<StateInfo[]> { return []; }
  async getWinsForUser(id: string): Promise<UserWin[]> { return []; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, displayName: string, amount: number): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt'>, url: string, by?: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createQuestion(data: Omit<LotQuestion, 'id'>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createReview(data: Omit<Review, 'id'>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createUserLotMaxBid(userId: string, lotId: string, amount: number): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteUserProfile(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async ensureUserRole(userId: string, email: string, name: string | null, role: string, data?: Partial<UserProfileData>, roleId?: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> { return null; }
  async updateAuction(id: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateLot(id: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateMediaItemMetadata(id: string, data: Partial<MediaItem>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateUserProfile(id: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async updateUserRole(id: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async linkMediaItemsToLot(lotId: string, mediaIds: string[]): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async unlinkMediaItemFromLot(lotId: string, mediaId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
}
