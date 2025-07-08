
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
import * as sampleData from '../sample-data'; // Import all exports from the new sample-data.ts
import type { WizardData } from '@/components/admin/wizard/wizard-context';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import type { FieldValue as FirebaseAdminFieldValue, Timestamp as FirebaseAdminTimestamp } from 'firebase-admin/firestore';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const DATA_FILE_PATH = path.resolve(process.cwd(), 'sample-data.local.json');


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
      .map(([name, sales]) => ({ name, sales }))
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

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    return Promise.resolve({
      users: this.localData.sampleUserProfiles?.length || 0,
      auctions: this.localData.sampleAuctions?.length || 0,
      lots: this.localData.sampleLots?.length || 0,
      sellers: this.localData.sampleSellers?.length || 0,
    });
  }

   async createAuctionWithLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    const auctionDetails = wizardData.auctionDetails || {};
    const newAuction: Auction = {
      ...(auctionDetails as any),
      id: `auc-${uuidv4()}`,
      publicId: `AUC-PUB-${uuidv4().substring(0,8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lots: [],
      totalLots: wizardData.createdLots?.length || 0,
      status: 'RASCUNHO' // Start as draft
    };
    this.localData.sampleAuctions.push(newAuction);
    
    const allBemIdsToUpdate = new Set<string>();

    (wizardData.createdLots || []).forEach((lotDef: Lot) => {
      const newLot: Lot = {
        ...(lotDef as Lot), // cast since it has most fields
        id: `lot-${uuidv4()}`,
        publicId: `LOT-PUB-${uuidv4().substring(0,8)}`,
        auctionId: newAuction.id, // link to the new auction
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.localData.sampleLots.push(newLot);
      newAuction.lots?.push(newLot);
      (lotDef.bemIds || []).forEach(id => allBemIdsToUpdate.add(id));
    });

    this.localData.sampleBens.forEach(bem => {
      if (allBemIdsToUpdate.has(bem.id)) {
        bem.status = 'LOTEADO';
      }
    });

    this._persistData();
    return { success: true, message: 'Leilão e lotes criados com sucesso!', auctionId: newAuction.id };
  }

  // --- LotCategory ---
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const newCategory: LotCategory = {
      id: `cat-${slugify(data.name.trim())}-${uuidv4().substring(0,4)}`,
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      description: data.description?.trim() || '',
      itemCount: 0,
      hasSubcategories: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleLotCategories.push(newCategory);
    this._persistData();
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: newCategory.id };
  }

  async getLotCategories(): Promise<LotCategory[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotCategories)));
  }

  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    const category = this.localData.sampleLotCategories.find(c => c.id === idOrSlug || c.slug === idOrSlug);
    return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
  }

  async updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleLotCategories.findIndex(c => c.id === id);
    if (index === -1) return { success: false, message: 'Categoria não encontrada.' };
    
    this.localData.sampleLotCategories[index] = { 
      ...this.localData.sampleLotCategories[index], 
      ...data,
      slug: data.name ? slugify(data.name) : this.localData.sampleLotCategories[index].slug,
      updatedAt: new Date()
    } as LotCategory;
    this._persistData();
    return { success: true, message: 'Categoria atualizada com sucesso!' };
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    const initialLength = this.localData.sampleLotCategories.length;
    this.localData.sampleLotCategories = this.localData.sampleLotCategories.filter(c => c.id !== id);
    if(this.localData.sampleLotCategories.length < initialLength) {
        this._persistData();
        return { success: true, message: 'Categoria excluída com sucesso!' };
    }
    return { success: false, message: 'Categoria não encontrada.' };
  }
  
  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    const category = this.localData.sampleLotCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
  }
  
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
      const newSubcategory: Subcategory = {
        ...data,
        id: `subcat-${slugify(data.name)}-${uuidv4().substring(0,4)}`,
        slug: slugify(data.name),
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.localData.sampleSubcategories.push(newSubcategory);
      const parentCatIndex = this.localData.sampleLotCategories.findIndex(c => c.id === data.parentCategoryId);
      if (parentCatIndex !== -1) {
        this.localData.sampleLotCategories[parentCatIndex].hasSubcategories = true;
      }
      this._persistData();
      return { success: true, message: "Subcategoria criada.", subcategoryId: newSubcategory.id };
  }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
      const subcategories = this.localData.sampleSubcategories.filter(s => s.parentCategoryId === parentCategoryId);
      return Promise.resolve(JSON.parse(JSON.stringify(subcategories)));
  }
  async getSubcategory(id: string): Promise<Subcategory | null> {
      const subcategory = this.localData.sampleSubcategories.find(s => s.id === id);
      return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
      const subcategory = this.localData.sampleSubcategories.find(s => s.slug === slug && s.parentCategoryId === parentCategoryId);
      return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
      const index = this.localData.sampleSubcategories.findIndex(s => s.id === id);
      if (index === -1) return { success: false, message: "Subcategoria não encontrada." };
      this.localData.sampleSubcategories[index] = { ...this.localData.sampleSubcategories[index], ...data, updatedAt: new Date() } as Subcategory;
      this._persistData();
      return { success: true, message: "Subcategoria atualizada." };
  }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
      const initialLength = this.localData.sampleSubcategories.length;
      this.localData.sampleSubcategories = this.localData.sampleSubcategories.filter(s => s.id !== id);
      if (this.localData.sampleSubcategories.length < initialLength) {
        this._persistData();
        return { success: true, message: 'Subcategoria excluída.' };
      }
      return { success: false, message: 'Subcategoria não encontrada.' };
  }

  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    const newState: StateInfo = {
      id: `state-${slugify(data.uf)}`,
      name: data.name,
      uf: data.uf,
      slug: slugify(data.name),
      cityCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.localData.sampleStates.push(newState);
    this._persistData();
    return { success: true, message: 'Estado criado!', stateId: newState.id };
  }
  async getStates(): Promise<StateInfo[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleStates)));
  }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> {
     const state = this.localData.sampleStates.find(s => s.id === idOrSlugOrUf || s.slug === idOrSlugOrUf || s.uf === idOrSlugOrUf);
     return Promise.resolve(state ? JSON.parse(JSON.stringify(state)) : null);
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleStates.findIndex(s => s.id === id);
    if (index === -1) return { success: false, message: "Estado não encontrado." };
    this.localData.sampleStates[index] = { ...this.localData.sampleStates[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleStates[index].slug, updatedAt: new Date() } as StateInfo;
    this._persistData();
    return { success: true, message: 'Estado atualizado.' };
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
     this.localData.sampleStates = this.localData.sampleStates.filter(s => s.id !== id);
     this._persistData();
     return { success: true, message: 'Estado excluído.' };
  }

  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    const parentState = this.localData.sampleStates.find(s => s.id === data.stateId);
    if (!parentState) return { success: false, message: 'Estado pai não encontrado.' };

    const newCity: CityInfo = {
      id: `city-${slugify(data.name)}-${parentState.uf.toLowerCase()}`,
      name: data.name,
      slug: slugify(data.name),
      stateId: parentState.id,
      stateUf: parentState.uf,
      ibgeCode: data.ibgeCode,
      lotCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleCities.push(newCity);
    this._persistData();
    return { success: true, message: 'Cidade criada!', cityId: newCity.id };
  }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> {
     let cities = this.localData.sampleCities;
     if (stateIdOrSlugFilter) {
       cities = cities.filter(c => c.stateId === stateIdOrSlugFilter);
     }
     return Promise.resolve(JSON.parse(JSON.stringify(cities)));
  }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> {
    const city = this.localData.sampleCities.find(c => c.id === idOrCompositeSlug);
    return Promise.resolve(city ? JSON.parse(JSON.stringify(city)) : null);
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleCities.findIndex(c => c.id === id);
    if (index === -1) return { success: false, message: "Cidade não encontrada." };
    this.localData.sampleCities[index] = { ...this.localData.sampleCities[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleCities[index].slug } as CityInfo;
    this._persistData();
    return { success: true, message: 'Cidade atualizada.' };
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleCities = this.localData.sampleCities.filter(c => c.id !== id);
    this._persistData();
    return { success: true, message: 'Cidade excluída.' };
  }
  
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
    const newId = `auct-${slugify(data.name)}`;
    const newAuctioneer: AuctioneerProfileInfo = {
        ...(data as any),
        id: newId,
        publicId: `AUCT-PUB-${newId.slice(-4)}${Math.floor(Math.random()*100)}`,
        slug: slugify(data.name),
        createdAt: new Date(),
        updatedAt: new Date()
    };
    this.localData.sampleAuctioneers.push(newAuctioneer);
    this._persistData();
    return { success: true, message: 'Leiloeiro criado!', auctioneerId: newAuctioneer.id, auctioneerPublicId: newAuctioneer.publicId };
  }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleAuctioneers)));
  }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    const item = this.localData.sampleAuctioneers.find(i => i.id === idOrPublicId || i.publicId === idOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleAuctioneers.findIndex(i => i.id === idOrPublicId || i.publicId === idOrPublicId);
    if (index === -1) return { success: false, message: 'Leiloeiro não encontrado.' };
    this.localData.sampleAuctioneers[index] = { ...this.localData.sampleAuctioneers[index], ...data, updatedAt: new Date() } as AuctioneerProfileInfo;
    this._persistData();
    return { success: true, message: 'Leiloeiro atualizado.' };
  }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleAuctioneers = this.localData.sampleAuctioneers.filter(i => i.id !== idOrPublicId && i.publicId !== idOrPublicId);
    this._persistData();
    return { success: true, message: 'Leiloeiro excluído.' };
  }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    const item = this.localData.sampleAuctioneers.find(i => i.slug === slugOrPublicId || i.publicId === slugOrPublicId || i.id === slugOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
    const item = this.localData.sampleAuctioneers.find(i => i.name === name);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
    const newSeller: SellerProfileInfo = {
      ...(data as any),
      id: `seller-${uuidv4()}`,
      publicId: `SELL-PUB-${uuidv4().substring(0, 8)}`,
      slug: slugify(data.name),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (!this.localData.sampleSellers) {
        this.localData.sampleSellers = [];
    }
    this.localData.sampleSellers.push(newSeller);
    this._persistData();
    return { success: true, message: 'Comitente criado com sucesso!', sellerId: newSeller.id, sellerPublicId: newSeller.publicId };
  }
  async getSellers(): Promise<SellerProfileInfo[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleSellers)));
  }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
    const item = this.localData.sampleSellers.find(i => i.id === idOrPublicId || i.publicId === idOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
     const index = this.localData.sampleSellers.findIndex(i => i.id === idOrPublicId || i.publicId === idOrPublicId);
    if (index === -1) return { success: false, message: 'Comitente não encontrado.' };
    this.localData.sampleSellers[index] = { ...this.localData.sampleSellers[index], ...data, updatedAt: new Date() } as SellerProfileInfo;
    this._persistData();
    return { success: true, message: 'Comitente atualizado.' };
  }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleSellers = this.localData.sampleSellers.filter(i => i.id !== idOrPublicId && i.publicId !== idOrPublicId);
    this._persistData();
    return { success: true, message: 'Comitente excluído.' };
  }
  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> {
    const item = this.localData.sampleSellers.find(i => i.slug === slugOrPublicId || i.publicId === slugOrPublicId || i.id === slugOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> {
     const item = this.localData.sampleSellers.find(i => i.name === name);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> {
    const newAuction: Auction = {
      ...(data as any),
      id: `auc-${uuidv4()}`,
      publicId: `AUC-PUB-${uuidv4().substring(0,8)}`,
      totalLots: 0,
      visits: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lots: [],
    };
    this.localData.sampleAuctions.push(newAuction);
    this._persistData();
    return { success: true, message: 'Leilão criado!', auctionId: newAuction.id, auctionPublicId: newAuction.publicId };
  }
  
  async getAuctions(): Promise<Auction[]> {
    const auctionsWithLots = this.localData.sampleAuctions.map(auction => {
      const lotsForAuction = this.localData.sampleLots.filter(lot => lot.auctionId === auction.id);
      return {
        ...auction,
        lots: lotsForAuction.map(l => this._enrichLotData(l)),
        totalLots: lotsForAuction.length,
      };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(auctionsWithLots)));
  }

  async getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    if (!ids || ids.length === 0) return [];
    const auctions = this.localData.sampleAuctions.filter(a => ids.includes(a.id) || (a.publicId && ids.includes(a.publicId)));
    return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }
  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    const auction = this.localData.sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId);
    if (!auction) return null;
    const lotsForAuction = this.localData.sampleLots.filter(lot => lot.auctionId === auction.id);
    return Promise.resolve(JSON.parse(JSON.stringify({
      ...auction,
      lots: lotsForAuction.map(l => this._enrichLotData(l)),
      totalLots: lotsForAuction.length,
    })));
  }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleAuctions.findIndex(a => a.id === idOrPublicId || a.publicId === idOrPublicId);
    if (index === -1) return { success: false, message: "Leilão não encontrado."};
    this.localData.sampleAuctions[index] = { ...this.localData.sampleAuctions[index], ...data, updatedAt: new Date() } as Auction;
    this._persistData();
    return { success: true, message: "Leilão atualizado."};
  }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleAuctions = this.localData.sampleAuctions.filter(a => a.id !== idOrPublicId && a.publicId !== idOrPublicId);
    this._persistData();
    return { success: true, message: "Leilão excluído."};
  }
  
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
      const seller = this.localData.sampleSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId || s.id === sellerSlugOrPublicId);
      if(!seller) return [];
      const auctions = this.localData.sampleAuctions.filter(a => a.seller === seller.name || a.sellerId === seller.id);
      return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }
  
  async getAuctionsForConsignor(sellerId: string): Promise<Auction[]> {
    if (!sellerId) return [];
    const auctions = this.localData.sampleAuctions.filter(a => a.sellerId === sellerId);
    return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }
  
  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
     const auctioneer = this.localData.sampleAuctioneers.find(a => a.slug === auctioneerSlugOrPublicId || a.publicId === auctioneerSlugOrPublicId || a.id === auctioneerSlugOrPublicId);
     if(!auctioneer) return [];
     const auctions = this.localData.sampleAuctions.filter(a => a.auctioneer === auctioneer.name || a.auctioneerId === auctioneer.id);
     return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleDirectSaleOffers || [])));
  }
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    const offer = (this.localData.sampleDirectSaleOffers || []).find(o => o.id === id);
    return Promise.resolve(offer ? JSON.parse(JSON.stringify(offer)) : null);
  }
  async getDirectSaleOffersForSeller(sellerId: string): Promise<DirectSaleOffer[]> {
    const offers = (this.localData.sampleDirectSaleOffers || []).filter(o => o.sellerId === sellerId);
    return Promise.resolve(JSON.parse(JSON.stringify(offers)));
  }
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
    const newOffer: DirectSaleOffer = {
        ...(data as any),
        id: `dso-${uuidv4()}`,
        publicId: `DSO-PUB-${uuidv4().substring(0,8)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        proposalsCount: 0,
    };
    if (!this.localData.sampleDirectSaleOffers) {
        this.localData.sampleDirectSaleOffers = [];
    }
    this.localData.sampleDirectSaleOffers.push(newOffer);
    this._persistData();
    return { success: true, message: 'Oferta de venda direta criada!', offerId: newOffer.id };
  }
  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updateDirectSaleOffer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] deleteDirectSaleOffer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleBids.filter(b => b.lotId === lotIdOrPublicId))));
  }
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo }> {
    console.warn("[SampleDataAdapter] placeBidOnLot not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  
  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> {
    console.warn("[SampleDataAdapter] createUserLotMaxBid not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }

  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    const bid = (this.localData.sampleUserLotMaxBids || []).find(b => b.userId === userId && b.lotId === lotId && b.isActive);
    return Promise.resolve(bid ? JSON.parse(JSON.stringify(bid)) : null);
  }
  
  async getWinsForUser(userId: string): Promise<UserWin[]> {
    const wins = this.localData.sampleUserWins.filter(w => w.userId === userId);
    // Enrich with lot data
    const enrichedWins = wins.map(win => {
        const lot = this.localData.sampleLots.find(l => l.id === win.lotId);
        return { ...win, lot: lot! };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(enrichedWins)));
  }

  async getBidsForUser(userId: string): Promise<UserBid[]> {
      const userBids = (this.localData.sampleUserBids || []).filter(b => b.userId === userId);
      // Simulate enrichment logic
      const enrichedBids = userBids.map(ub => {
          const lot = this.localData.sampleLots.find(l => l.id === ub.lotId);
          return {
              ...ub,
              lot: lot ? this._enrichLotData(lot) : {},
          }
      });
      return Promise.resolve(JSON.parse(JSON.stringify(enrichedBids)));
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    const userNotifications = (this.localData.sampleNotifications || []).filter(n => n.userId === userId);
    return Promise.resolve(JSON.parse(JSON.stringify(userNotifications)));
  }

  // --- Reviews ---
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
    return Promise.resolve(JSON.parse(JSON.stringify((this.localData.sampleLotReviews || []).filter(r => r.lotId === lotIdOrPublicId))));
  }

  async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    console.warn("[SampleDataAdapter] createReview not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }

  // --- Questions ---
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    return Promise.resolve(JSON.parse(JSON.stringify((this.localData.sampleLotQuestions || []).filter(q => q.lotId === lotIdOrPublicId))));
  }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> {
    console.warn("[SampleDataAdapter] createQuestion not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { 
    console.warn("[SampleDataAdapter] answerQuestion not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  
  // --- BENS
  async getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    let bens = this.localData.sampleBens || [];
    if (filter?.judicialProcessId) {
      bens = bens.filter(b => b.judicialProcessId === filter.judicialProcessId);
    }
    if (filter?.sellerId) {
      bens = bens.filter(b => b.sellerId === filter.sellerId);
    }
    return Promise.resolve(JSON.parse(JSON.stringify(bens)));
  }

  async getBensByIds(ids: string[]): Promise<Bem[]> {
    if (!ids || ids.length === 0) return [];
    const bens = (this.localData.sampleBens || []).filter(b => ids.includes(b.id));
    return Promise.resolve(JSON.parse(JSON.stringify(bens)));
  }
  
  async updateBensStatus(bemIds: string[], status: Bem['status'], connection?: any): Promise<{ success: boolean, message: string }> {
    let updatedCount = 0;
    this.localData.sampleBens.forEach((bem, index) => {
      if (bemIds.includes(bem.id)) {
        this.localData.sampleBens[index].status = status;
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      this._persistData();
      return { success: true, message: `${updatedCount} bens atualizados para ${status}.` };
    }
    return { success: false, message: 'Nenhum bem encontrado para atualização.' };
  }
  
  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean, message: string, createdLots?: Lot[] }> {
    const newLots: Lot[] = [];
    for (const lotData of lotsToCreate) {
      const newLot: Lot = {
        ...(lotData as Lot), // Assume LotDbData is compatible enough
        id: `lot-${uuidv4()}`,
        publicId: `LOT-PUB-${uuidv4().substring(0,8)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.localData.sampleLots.push(newLot);
      newLots.push(newLot);
    }

    if (newLots.length > 0) {
      this._persistData();
    }
    return { success: true, message: `${newLots.length} lotes criados.`, createdLots: newLots };
  }


  // --- Users ---
  // ... (user methods will go here)

  // This is a simplified Lot creation for now
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
      const newLot: Lot = {
      ...(data as Lot), // Cast for simplicity, assuming compatible fields
      id: `lot-${uuidv4()}`,
      publicId: `LOT-PUB-${uuidv4().substring(0,8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'EM_BREVE', // default status
      bidsCount: 0,
    };
    this.localData.sampleLots.push(newLot);
    
    // Update auction lot count
    const auctionIndex = this.localData.sampleAuctions.findIndex(a => a.id === newLot.auctionId);
    if(auctionIndex !== -1) {
        this.localData.sampleAuctions[auctionIndex].totalLots = (this.localData.sampleAuctions[auctionIndex].totalLots || 0) + 1;
    }

    this._persistData();
    return { success: true, message: 'Lote criado com sucesso!', lotId: newLot.id, lotPublicId: newLot.publicId };
  }
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    let lots = this.localData.sampleLots;
    if (auctionIdParam) {
      lots = lots.filter(lot => lot.auctionId === auctionIdParam);
    }
    const enrichedLots = lots.map(lot => this._enrichLotData(lot));
    return Promise.resolve(JSON.parse(JSON.stringify(enrichedLots)));
  }
  async getLot(idOrPublicId: string): Promise<Lot | null> {
    const lot = this.localData.sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    if (!lot) return null;
    return Promise.resolve(JSON.parse(JSON.stringify(this._enrichLotData(lot))));
  }
  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    if (!ids || ids.length === 0) return [];
    const lots = this.localData.sampleLots.filter(l => ids.includes(l.id));
    const enrichedLots = lots.map(lot => this._enrichLotData(lot));
    return Promise.resolve(JSON.parse(JSON.stringify(enrichedLots)));
  }
  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleLots.findIndex(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    if (index === -1) return { success: false, message: "Lote não encontrado." };
    this.localData.sampleLots[index] = { ...this.localData.sampleLots[index], ...data, updatedAt: new Date() } as Lot;
    this._persistData();
    return { success: true, message: "Lote atualizado com sucesso." };
  }
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    const lotToDelete = this.localData.sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    if (!lotToDelete) return { success: false, message: "Lote não encontrado."};
    
    // Mark associated bens as available again
    if (lotToDelete.bemIds && lotToDelete.bemIds.length > 0) {
      await this.updateBensStatus(lotToDelete.bemIds, 'DISPONIVEL');
    }

    this.localData.sampleLots = this.localData.sampleLots.filter(l => l.id !== lotToDelete.id);
    
    const auctionIndex = this.localData.sampleAuctions.findIndex(a => a.id === lotToDelete.auctionId);
    if(auctionIndex !== -1) {
        this.localData.sampleAuctions[auctionIndex].totalLots = (this.localData.sampleAuctions[auctionIndex].totalLots || 1) - 1;
    }
    this._persistData();
    return { success: true, message: "Lote excluído com sucesso." };
  }
  
  // Stubs
  async getBem(id: string): Promise<Bem | null> { console.warn("[SampleDataAdapter] getBem not implemented."); return null; }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
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
  async getJudicialProcesses(): Promise<JudicialProcess[]> { return []; }
  async getJudicialProcess(id: string): Promise<JudicialProcess | null> { return null; }
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> { return { success: false, message: "Not implemented."}; }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: "Not implemented."}; }
  
  // Stubs for other methods from IDatabaseAdapter...
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { return { success: false, message: 'Not implemented' }; }
  async getRoles(): Promise<Role[]> { return []; }
  async getRole(id: string): Promise<Role | null> { return null; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async ensureDefaultRolesExist(connection?: any): Promise<{ success: boolean; message: string; rolesProcessed?: number; }> { return { success: true, message: 'Default roles are part of sample data.', rolesProcessed: this.localData.sampleRoles.length }; }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return { success: false, message: 'Not implemented' }; }
  async getMediaItems(): Promise<MediaItem[]> { return []; }
  async getMediaItem(id: string): Promise<MediaItem | null> { return null; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async getPlatformSettings(): Promise<PlatformSettings> {
    const settings = this.localData.samplePlatformSettings || sampleData.samplePlatformSettings;
    return Promise.resolve(settings as PlatformSettings);
  }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not implemented' }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, "cpf" | "cellPhone" | "dateOfBirth" | "password" | "accountType" | "razaoSocial" | "cnpj" | "inscricaoEstadual" | "websiteComitente" | "zipCode" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "optInMarketing">> | undefined, roleIdToAssign?: string | undefined): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions | undefined; }> { return { success: false, message: 'Not implemented' }; }
  async getUsersWithRoles(): Promise<UserProfileData[]> { return []; }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> { return null; }
  async getRoleByName(name: string): Promise<Role | null> { return null; }
}
    

    