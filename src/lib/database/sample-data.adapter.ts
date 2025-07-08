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
import * as sampleData from '@/lib/sample-data'; // Import all exports from the new sample-data.ts
import type { WizardData } from '@/components/admin/wizard/wizard-context';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import type { FieldValue as FirebaseAdminFieldValue, Timestamp as FirebaseAdminTimestamp } from 'firebase-admin/firestore';
import { samplePlatformSettings } from './sample-data';

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

  async disconnect(): Promise<void> {
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
        ...data,
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
    // Simulate joining lots to auctions
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
    const auctions = this.localData.sampleAuctions.filter(a => ids.includes(a.id));
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
        ...data,
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
      const userBids = this.localData.sampleUserBids.filter(b => b.userId === userId);
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
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotReviews.filter(r => r.lotId === lotIdOrPublicId))));
  }

  async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    console.warn("[SampleDataAdapter] createReview not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }

  // --- Questions ---
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotQuestions.filter(q => q.lotId === lotIdOrPublicId))));
  }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> {
    console.warn("[SampleDataAdapter] createQuestion not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { 
    console.warn("[SampleDataAdapter] answerQuestion not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }


  // --- Users ---
  async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    const profile = this.localData.sampleUserProfiles.find(p => p.uid === userId);
    if (!profile) return null;
    const finalProfile: UserProfileWithPermissions = {
      ...profile,
      permissions: profile.permissions || [],
    };
    return Promise.resolve(JSON.parse(JSON.stringify(finalProfile)));
  }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleUserProfiles.findIndex(u => u.uid === userId);
    if (index === -1) return { success: false, message: "Usuário não encontrado." };
    this.localData.sampleUserProfiles[index] = { ...this.localData.sampleUserProfiles[index], ...data, updatedAt: new Date() } as UserProfileWithPermissions;
    this._persistData();
    return { success: true, message: "Perfil atualizado com sucesso." };
  }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions; }> {
     const { auth: localAuthAdmin, error: sdkError } = ensureAdminInitialized();
    if (sdkError || !localAuthAdmin) {
      console.warn(`[FirestoreAdapter - ensureUserRole] Admin SDK Auth não disponível ou erro de inicialização: ${sdkError?.message}. Continuando sem interação Auth se possível.`);
    }
    try {
        await this.ensureDefaultRolesExist(); // Ensure default roles are in Firestore
        let targetRole: Role | null = null;
        if (roleIdToAssign) {
            console.log(`[FirestoreAdapter - ensureUserRole] Tentando buscar perfil por ID fornecido: ${roleIdToAssign}`);
            targetRole = await this.getRole(roleIdToAssign);
        }
        if (!targetRole) {
            console.log(`[FirestoreAdapter - ensureUserRole] Perfil por ID não encontrado ou ID não fornecido. Buscando por nome: ${targetRoleName}`);
            targetRole = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER');
        }

        if (!targetRole || !targetRole.id) {
            console.error(`[FirestoreAdapter - ensureUserRole] CRITICAL: Perfil '${targetRoleName}' ou 'USER' não encontrado ou sem ID.`);
            return { success: false, message: `Perfil padrão '${targetRoleName}' ou 'USER' não encontrado ou sem ID.` };
        }
         console.log(`[FirestoreAdapter - ensureUserRole] Perfil alvo determinado: ${targetRole.name} (ID: ${targetRole.id})`);

        const userDocRef = this.db.collection('users').doc(userId);
        const userSnap = await userDocRef.get();
        let finalProfileData: UserProfileData;

        if (userSnap.exists) {
            const userDataFromDB = userSnap.data() as UserProfileData;
            const updatePayload: any = { updatedAt: this.AdminFieldValue.serverTimestamp() };
            let needsUpdate = false;
            if (userDataFromDB.roleId !== targetRole.id) { updatePayload.roleId = targetRole.id; needsUpdate = true; }
            if (userDataFromDB.roleName !== targetRole.name) { updatePayload.roleName = targetRole.name; needsUpdate = true; }
            if (JSON.stringify(userDataFromDB.permissions || []) !== JSON.stringify(targetRole.permissions || [])) {
              updatePayload.permissions = targetRole.permissions; needsUpdate = true;
            }

            if (needsUpdate) {
              console.log(`[FirestoreAdapter - ensureUserRole] ATUALIZANDO perfil existente ${userId} para role ${targetRole.name}`);
               await userDocRef.update(updatePayload);
            } else {
                console.log(`[FirestoreAdapter - ensureUserRole] Perfil ${userId} já existe e está atualizado.`);
            }
             finalProfileData = { uid: userId, ...userDataFromDB, roleId: targetRole.id, roleName: targetRole.name, permissions: targetRole.permissions };

        } else {
            console.log(`[FirestoreAdapter - ensureUserRole] Criando novo perfil para ${userId} com role ${targetRole.name}`);
            const creationPayload: any = { email, fullName, roleId: targetRole.id, roleName: targetRole.name, permissions: targetRole.permissions, createdAt: this.AdminFieldValue.serverTimestamp(), updatedAt: this.AdminFieldValue.serverTimestamp() };
             if (additionalProfileData) {
                    Object.assign(creationPayload, additionalProfileData);
                    if (additionalProfileData.dateOfBirth) {
                        creationPayload.dateOfBirth = this.ServerTimestamp.fromDate(new Date(additionalProfileData.dateOfBirth));
                    }
               }
               await userDocRef.set(creationPayload);
               finalProfileData = { uid: userId, email, fullName, roleId: targetRole.id, roleName: targetRole.name, permissions: targetRole.permissions } as UserProfileData;
        }

        return { success: true, message: "Perfil assegurado com sucesso.", userProfile: finalProfileData as UserProfileWithPermissions };

    } catch (e: any) { console.error("[FirestoreAdapter - ensureUserRole] " + e.message); return { success: false, message: e.message }; }
  }

  async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleUserProfiles)));
  }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    const profile = this.localData.sampleUserProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) return null;
    const finalProfile: UserProfileWithPermissions = {
        ...profile,
        permissions: profile.permissions || []
    };
    return Promise.resolve(JSON.parse(JSON.stringify(finalProfile)));
  }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    const userIndex = this.localData.sampleUserProfiles.findIndex(u => u.uid === userId);
    if(userIndex === -1) return { success: false, message: "Usuário não encontrado." };
    const role = this.localData.sampleRoles.find(r => r.id === roleId);
    this.localData.sampleUserProfiles[userIndex].roleId = role?.id || null;
    this.localData.sampleUserProfiles[userIndex].roleName = role?.name || undefined;
    this.localData.sampleUserProfiles[userIndex].permissions = role?.permissions || [];
    this.localData.sampleUserProfiles[userIndex].updatedAt = new Date();
    this._persistData();
    return { success: true, message: "Perfil do usuário atualizado." };
  }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleUserProfiles = this.localData.sampleUserProfiles.filter(u => u.uid !== userId);
    this._persistData();
    return { success: true, message: "Usuário excluído." };
  }

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    const newRole: Role = {
        ...data,
        id: `role-${slugify(data.name)}`,
        name_normalized: data.name.toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date()
    };
    this.localData.sampleRoles.push(newRole);
    this._persistData();
    return { success: true, message: 'Perfil criado!', roleId: newRole.id };
  }
  async getRoles(): Promise<Role[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleRoles)));
  }
  async getRole(id: string): Promise<Role | null> {
    const role = this.localData.sampleRoles.find(r => r.id === id);
    return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null);
  }
   async getRoleByName(name: string): Promise<Role | null> {
    const role = this.localData.sampleRoles.find(r => r.name_normalized === name.toUpperCase());
    return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null);
  }

  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
     const index = this.localData.sampleRoles.findIndex(r => r.id === id);
    if (index === -1) return { success: false, message: "Perfil não encontrado." };
    this.localData.sampleRoles[index] = { ...this.localData.sampleRoles[index], ...data, name_normalized: data.name ? data.name.toUpperCase() : this.localData.sampleRoles[index].name_normalized, updatedAt: new Date() } as Role;
    this._persistData();
    return { success: true, message: 'Perfil atualizado.' };
  }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleRoles = this.localData.sampleRoles.filter(r => r.id !== id);
    this._persistData();
    return { success: true, message: 'Perfil excluído.' };
  }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] ensureDefaultRolesExist is not needed, data is hardcoded.');
    return { success: true, message: 'Default roles are part of sample data.', rolesProcessed: this.localData.sampleRoles.length };
  }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> {
    const newItem: MediaItem = {
      id: `media-${uuidv4()}`,
      ...data,
      uploadedAt: new Date(),
      urlOriginal: filePublicUrl,
      urlThumbnail: filePublicUrl,
      urlMedium: filePublicUrl,
      urlLarge: filePublicUrl,
      storagePath: filePublicUrl,
      uploadedBy: uploadedBy || 'system',
      linkedLotIds: [],
    };
    this.localData.sampleMediaItems.push(newItem);
    this._persistData();
    return { success: true, message: 'Mídia criada!', item: newItem };
  }
  async getMediaItems(): Promise<MediaItem[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleMediaItems)));
  }
  async getMediaItem(id: string): Promise<MediaItem | null> {
    const item = this.localData.sampleMediaItems.find(i => i.id === id);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleMediaItems.findIndex(i => i.id === id);
    if (index === -1) return { success: false, message: 'Item de mídia não encontrado.' };
    this.localData.sampleMediaItems[index] = { ...this.localData.sampleMediaItems[index], ...metadata } as MediaItem;
    this._persistData();
    return { success: true, message: 'Metadados atualizados.' };
  }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleMediaItems = this.localData.sampleMediaItems.filter(i => i.id !== id);
    this._persistData();
    return { success: true, message: 'Mídia excluída.' };
  }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> {
    const lotIndex = this.localData.sampleLots.findIndex(l => l.id === lotId);
    if(lotIndex === -1) return {success: false, message: "Lote não encontrado"};
    const currentIds = new Set(this.localData.sampleLots[lotIndex].mediaItemIds || []);
    mediaItemIds.forEach(id => currentIds.add(id));
    this.localData.sampleLots[lotIndex].mediaItemIds = Array.from(currentIds);
    this._persistData();
    return { success: true, message: 'Mídia vinculada.' };
  }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> {
    const lotIndex = this.localData.sampleLots.findIndex(l => l.id === lotId);
    if(lotIndex === -1) return {success: false, message: "Lote não encontrado"};
    this.localData.sampleLots[lotIndex].mediaItemIds = (this.localData.sampleLots[lotIndex].mediaItemIds || []).filter(id => id !== mediaItemId);
    this._persistData();
    return { success: true, message: 'Mídia desvinculada.' };
  }
  
  async getBens(judicialProcessId?: string): Promise<Bem[]> {
    console.warn("[FirestoreAdapter] getBens not implemented.");
    return [];
  }
  async getBem(id: string): Promise<Bem | null> {
    console.warn("[FirestoreAdapter] getBem not implemented.");
    return null;
  }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    console.warn("[FirestoreAdapter] createBem not implemented.");
    return { success: false, message: "Not implemented." };
  }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[FirestoreAdapter] updateBem not implemented.");
    return { success: false, message: "Not implemented." };
  }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[FirestoreAdapter] deleteBem not implemented.");
    return { success: false, message: "Not implemented." };
  }

  async getPlatformSettings(): Promise<PlatformSettings> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.samplePlatformSettings)));
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    this.localData.samplePlatformSettings = {
        ...this.localData.samplePlatformSettings,
        ...data,
        updatedAt: new Date(),
    } as PlatformSettings;
    this._persistData();
    return { success: true, message: "Configurações da plataforma atualizadas!" };
  }

  // --- Judicial CRUDs
  async getCourts(): Promise<Court[]> { 
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleCourts || []))); 
  }
  async getCourt(id: string): Promise<Court | null> { 
    const court = (this.localData.sampleCourts || []).find(c => c.id === id); 
    return Promise.resolve(court ? JSON.parse(JSON.stringify(court)) : null); 
  }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { 
    const newCourt: Court = { ...data, id: `court-${slugify(data.name)}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; 
    if (!this.localData.sampleCourts) this.localData.sampleCourts = [];
    this.localData.sampleCourts.push(newCourt); 
    this._persistData(); 
    return { success: true, message: 'Tribunal criado!', courtId: newCourt.id }; 
  }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { 
    const index = this.localData.sampleCourts.findIndex(c => c.id === id); 
    if (index === -1) return { success: false, message: 'Tribunal não encontrado.'}; 
    this.localData.sampleCourts[index] = { ...this.localData.sampleCourts[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleCourts[index].slug, updatedAt: new Date() } as Court; 
    this._persistData(); 
    return { success: true, message: 'Tribunal atualizado.' }; 
  }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> { 
    const initialLength = this.localData.sampleCourts.length; 
    this.localData.sampleCourts = this.localData.sampleCourts.filter(c => c.id !== id); 
    if (this.localData.sampleCourts.length < initialLength) { 
        this._persistData(); 
        return { success: true, message: 'Tribunal excluído.' }; 
    } 
    return { success: false, message: 'Tribunal não encontrado.'}; 
  }
  
  async getJudicialDistricts(): Promise<JudicialDistrict[]> {
    const districts = this.localData.sampleJudicialDistricts || [];
    const enriched = districts.map(d => {
      const court = this.localData.sampleCourts.find(c => c.id === d.courtId);
      const state = this.localData.sampleStates.find(s => s.id === d.stateId);
      return { ...d, courtName: court?.name, stateUf: state?.uf };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(enriched)));
  }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> { 
      const district = (this.localData.sampleJudicialDistricts || []).find(d => d.id === id); 
      return Promise.resolve(district ? JSON.parse(JSON.stringify(district)) : null); 
  }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { 
      const newDistrict: JudicialDistrict = { ...data, id: `dist-${slugify(data.name)}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; 
      if (!this.localData.sampleJudicialDistricts) this.localData.sampleJudicialDistricts = [];
      this.localData.sampleJudicialDistricts.push(newDistrict); 
      this._persistData(); return { success: true, message: 'Comarca criada!', districtId: newDistrict.id }; 
  }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> { 
    const index = this.localData.sampleJudicialDistricts.findIndex(d => d.id === id); 
    if (index === -1) return { success: false, message: 'Comarca não encontrada.'}; 
    this.localData.sampleJudicialDistricts[index] = { ...this.localData.sampleJudicialDistricts[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleJudicialDistricts[index].slug } as JudicialDistrict; 
    this._persistData(); 
    return { success: true, message: 'Comarca atualizada.' }; 
  }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> { 
    const initialLength = this.localData.sampleJudicialDistricts.length; 
    this.localData.sampleJudicialDistricts = this.localData.sampleJudicialDistricts.filter(d => d.id !== id); 
    if (this.localData.sampleJudicialDistricts.length < initialLength) { this._persistData(); return { success: true, message: 'Comarca excluída.' }; } 
    return { success: false, message: 'Comarca não encontrada.' }; 
  }
  
  async getJudicialBranches(): Promise<JudicialBranch[]> { 
    const branches = this.localData.sampleJudicialBranches || [];
    const enriched = branches.map(b => {
        const district = (this.localData.sampleJudicialDistricts || []).find(d => d.id === b.districtId);
        return { ...b, districtName: district?.name };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(enriched)));
  }
  async getJudicialBranch(id: string): Promise<JudicialBranch | null> { 
      const branch = (this.localData.sampleJudicialBranches || []).find(b => b.id === id); 
      return Promise.resolve(branch ? JSON.parse(JSON.stringify(branch)) : null); 
  }
  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { 
      const newBranch: JudicialBranch = { ...data, id: `branch-${uuidv4()}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; 
      if (!this.localData.sampleJudicialBranches) this.localData.sampleJudicialBranches = [];
      this.localData.sampleJudicialBranches.push(newBranch); 
      this._persistData(); 
      return { success: true, message: 'Vara criada!', branchId: newBranch.id }; 
  }
  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> { 
      const index = this.localData.sampleJudicialBranches.findIndex(b => b.id === id); 
      if (index === -1) return { success: false, message: 'Vara não encontrada.'}; 
      this.localData.sampleJudicialBranches[index] = { ...this.localData.sampleJudicialBranches[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleJudicialBranches[index].slug } as JudicialBranch; 
      this._persistData(); 
      return { success: true, message: 'Vara atualizada.' }; 
  }
  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> { 
      const initialLength = this.localData.sampleJudicialBranches.length; 
      this.localData.sampleJudicialBranches = this.localData.sampleJudicialBranches.filter(b => b.id !== id); 
      if (this.localData.sampleJudicialBranches.length < initialLength) { this._persistData(); return { success: true, message: 'Vara excluída.' }; } 
      return { success: false, message: 'Vara não encontrada.' }; 
  }
  
  async getJudicialProcesses(): Promise<JudicialProcess[]> {
      const enriched = (this.localData.sampleJudicialProcesses || []).map(p => {
        const court = (this.localData.sampleCourts || []).find(c => c.id === p.courtId);
        const district = (this.localData.sampleJudicialDistricts || []).find(d => d.id === p.districtId);
        const branch = (this.localData.sampleJudicialBranches || []).find(b => b.id === p.branchId);
        const seller = (this.localData.sampleSellers || []).find(s => s.id === p.sellerId);
        return {...p, courtName: court?.name, districtName: district?.name, branchName: branch?.name, sellerName: seller?.name };
      });
      return Promise.resolve(JSON.parse(JSON.stringify(enriched)));
  }
  async getJudicialProcess(id: string): Promise<JudicialProcess | null> { 
      const process = (this.localData.sampleJudicialProcesses || []).find(p => p.id === id || p.publicId === id);
      if(!process) return null;
      const court = (this.localData.sampleCourts || []).find(c => c.id === process.courtId);
      const district = (this.localData.sampleJudicialDistricts || []).find(d => d.id === process.districtId);
      const branch = (this.localData.sampleJudicialBranches || []).find(b => b.id === process.branchId);
      const seller = (this.localData.sampleSellers || []).find(s => s.id === process.sellerId);
      return Promise.resolve(JSON.parse(JSON.stringify({...process, courtName: court?.name, districtName: district?.name, branchName: branch?.name, sellerName: seller?.name })));
  }
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    const newProcess: JudicialProcess = {
        ...data,
        id: `proc-${uuidv4()}`,
        publicId: `PROC-PUB-${uuidv4().substring(0, 8)}`,
        parties: data.parties.map((p, i) => ({...p, id: `party-${uuidv4()}`})) as ProcessParty[],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    if (!this.localData.sampleJudicialProcesses) {
        this.localData.sampleJudicialProcesses = [];
    }
    this.localData.sampleJudicialProcesses.push(newProcess);
    this._persistData();
    return { success: true, message: 'Processo Judicial criado com sucesso!', processId: newProcess.id };
  }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleJudicialProcesses.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Processo não encontrado.'};
    this.localData.sampleJudicialProcesses[index] = { ...this.localData.sampleJudicialProcesses[index], ...data, updatedAt: new Date() } as JudicialProcess;
    this._persistData();
    return { success: true, message: 'Processo atualizado.' };
  }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    const initialLength = this.localData.sampleJudicialProcesses.length;
    this.localData.sampleJudicialProcesses = this.localData.sampleJudicialProcesses.filter(p => p.id !== id);
    if (this.localData.sampleJudicialProcesses.length < initialLength) { this._persistData(); return { success: true, message: 'Processo excluído.' }; }
    return { success: false, message: 'Processo não encontrado.'};
  }

  // Document Handling Stubs
  async getDocumentTypes(): Promise<DocumentType[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleDocumentTypes)));
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleUserDocuments.filter(d => d.userId === userId))));
  }

  async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> {
      const userDocIndex = this.localData.sampleUserDocuments.findIndex(d => d.userId === userId && d.documentTypeId === documentTypeId);
      const now = new Date();
      
      const newDocData = {
          userId,
          documentTypeId,
          fileUrl,
          fileName,
          status: 'PENDING_ANALYSIS' as 'PENDING_ANALYSIS',
          uploadDate: now,
          updatedAt: now,
          documentType: this.localData.sampleDocumentTypes.find(dt => dt.id === documentTypeId)!
      };

      if (userDocIndex !== -1) {
          this.localData.sampleUserDocuments[userDocIndex] = {
              ...this.localData.sampleUserDocuments[userDocIndex],
              ...newDocData,
          };
      } else {
           this.localData.sampleUserDocuments.push({
               ...newDocData,
               id: `user-doc-${uuidv4()}`,
               createdAt: now,
           });
      }
      
      this._persistData();
      return { success: true, message: 'Documento salvo para análise.' };
  }
}
