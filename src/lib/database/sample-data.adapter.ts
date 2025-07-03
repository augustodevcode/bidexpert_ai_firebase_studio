
// src/lib/database/sample-data.adapter.ts
import * as fs from 'fs';
import * as path from 'path';
import type { 
  IDatabaseAdapter, 
  LotCategory, StateInfo, StateFormData,
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
  ProcessParty
} from '@/types';
import { slugify, getEffectiveLotEndDate } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import * as sampleData from '@/lib/sample-data'; // Import all exports from the new sample-data.ts
import type { WizardData } from '@/components/admin/wizard/wizard-context';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const DATA_FILE_PATH = path.resolve(process.cwd(), 'sample-data.local.json');


export class SampleDataAdapter implements IDatabaseAdapter {
  private localData: { [K in keyof typeof sampleData]: (typeof sampleData)[K] };

  constructor() {
    try {
        if (fs.existsSync(DATA_FILE_PATH)) {
            const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
            this.localData = JSON.parse(fileContents);
        } else {
             this.localData = JSON.parse(JSON.stringify(sampleData));
             console.log("[SampleDataAdapter] sample-data.local.json not found, using initial data from module.");
        }
    } catch (error) {
        console.error("[SampleDataAdapter] Could not read or parse sample-data.local.json, falling back to initial import.", error);
        this.localData = JSON.parse(JSON.stringify(sampleData));
    }
  }
  
  private _persistData(): void {
    try {
        const dataString = JSON.stringify(this.localData, null, 2);
        fs.writeFileSync(DATA_FILE_PATH, dataString, 'utf8');
    } catch (error) {
        console.error(`[SampleDataAdapter] FAILED to persist data to ${DATA_FILE_PATH}:`, error);
    }
  }

  // --- Schema ---
  async initializeSchema(): Promise<{ success: boolean; message:string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    return Promise.resolve({ success: true, message: 'Sample data adapter ready.', rolesProcessed: this.localData.sampleRoles.length });
  }

  async disconnect(): Promise<void> {
    console.log('[SampleDataAdapter] Disconnect not applicable for sample data.');
    return Promise.resolve();
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
    };
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
  
  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    await delay(10);
    // Ensure default values are present if they don't exist on the loaded data
    const loadedSettings = this.localData.samplePlatformSettings || {};
    const settings = { ...sampleData.samplePlatformSettings, ...loadedSettings };
    return Promise.resolve(settings as PlatformSettings);
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    await delay(10);
    this.localData.samplePlatformSettings = {
        ...this.localData.samplePlatformSettings,
        ...data,
        id: 'global',
        updatedAt: new Date(),
    };
    this._persistData();
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  }

  private _enrichLotData(lot: Lot): Lot {
    if (!lot) return lot;
    const auction = this.localData.sampleAuctions.find(a => a.id === lot.auctionId);
    const category = this.localData.sampleLotCategories.find(c => c.id === lot.categoryId);
    const subcategory = this.localData.sampleSubcategories.find(s => s.id === lot.subcategoryId);
    const city = this.localData.sampleCities.find(c => c.id === lot.cityId);
    const state = this.localData.sampleStates.find(s => s.id === lot.stateId);

    return {
        ...lot,
        auctionName: auction?.title,
        type: category?.name, // 'type' is often used for category name display
        subcategoryName: subcategory?.name,
        cityName: city?.name,
        stateUf: state?.uf,
    };
  }
  
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
    const newLot: Lot = {
      ...(data as any), // Cast to avoid TS issues with missing optional fields
      id: `lot-${uuidv4()}`,
      publicId: `LOT-PUB-${uuidv4().substring(0,8)}`,
      bidsCount: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleLots.push(newLot);
    this._persistData();
    return { success: true, message: 'Lote criado!', lotId: newLot.id, lotPublicId: newLot.publicId };
  }

  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    let lots = [...this.localData.sampleLots];
    if (auctionIdParam) {
      lots = lots.filter(l => l.auctionId === auctionIdParam);
    }
    const enrichedLots = lots.map(lot => this._enrichLotData(lot));
    return Promise.resolve(JSON.parse(JSON.stringify(enrichedLots)));
  }

  async getLotsByIds(ids: string[]): Promise<Lot[]> {
      if (!ids || ids.length === 0) return Promise.resolve([]);
      const lots = this.localData.sampleLots.filter(l => ids.includes(l.id));
      const enrichedLots = lots.map(lot => this._enrichLotData(lot));
      return Promise.resolve(JSON.parse(JSON.stringify(enrichedLots)));
  }

  async getLot(idOrPublicId: string): Promise<Lot | null> {
    const lot = this.localData.sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    if (!lot) return null;
    return Promise.resolve(JSON.parse(JSON.stringify(this._enrichLotData(lot))));
  }

  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleLots.findIndex(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    if (index === -1) return { success: false, message: 'Lote não encontrado.' };
    this.localData.sampleLots[index] = { ...this.localData.sampleLots[index], ...data, updatedAt: new Date() } as Lot;
    this._persistData();
    return { success: true, message: 'Lote atualizado com sucesso!' };
  }
  
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    const initialLength = this.localData.sampleLots.length;
    this.localData.sampleLots = this.localData.sampleLots.filter(l => l.id !== idOrPublicId && l.publicId !== idOrPublicId);
    if (this.localData.sampleLots.length < initialLength) {
        this._persistData();
        return { success: true, message: 'Lote excluído com sucesso!' };
    }
    return { success: false, message: 'Lote não encontrado.' };
  }

  // --- CRUD Implementations ---

  // ... (Other implemented CRUD methods remain the same) ...
  
  // Stubs for other methods
  
  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    console.warn("[SampleDataAdapter] getLotCategoryByName not implemented.");
    return null;
  }
  
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
      console.warn("[SampleDataAdapter] createSubcategory not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
      console.warn("[SampleDataAdapter] getSubcategories not implemented.");
      return [];
  }
  async getSubcategory(id: string): Promise<Subcategory | null> {
      console.warn("[SampleDataAdapter] getSubcategory not implemented.");
      return null;
  }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
      console.warn("[SampleDataAdapter] getSubcategoryBySlug not implemented.");
      return null;
  }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
      console.warn("[SampleDataAdapter] updateSubcategory not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
      console.warn("[SampleDataAdapter] deleteSubcategory not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
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
    this.localData.sampleStates[index] = { ...this.localData.sampleStates[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleStates[index].slug, updatedAt: new Date() };
    this._persistData();
    return { success: true, message: 'Estado atualizado.' };
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
     this.localData.sampleStates = this.localData.sampleStates.filter(s => s.id !== id);
     this._persistData();
     return { success: true, message: 'Estado excluído.' };
  }

  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    console.warn("[SampleDataAdapter] createCity not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> {
     let cities = this.localData.sampleCities;
     if (stateIdOrSlugFilter) {
       cities = cities.filter(c => c.stateId === stateIdOrSlugFilter);
     }
     return Promise.resolve(JSON.parse(JSON.stringify(cities)));
  }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> {
    console.warn("[SampleDataAdapter] getCity not implemented.");
    return null;
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updateCity not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] deleteCity not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
    console.warn("[SampleDataAdapter] createAuctioneer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleAuctioneers)));
  }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    console.warn("[SampleDataAdapter] getAuctioneer not implemented.");
    return null;
  }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updateAuctioneer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] deleteAuctioneer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    const item = this.localData.sampleAuctioneers.find(i => i.slug === slugOrPublicId || i.publicId === slugOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
    const item = this.localData.sampleAuctioneers.find(i => i.name === name);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
    console.warn("[SampleDataAdapter] createSeller not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getSellers(): Promise<SellerProfileInfo[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleSellers)));
  }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
    console.warn("[SampleDataAdapter] getSeller not implemented.");
    return null;
  }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updateSeller not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] deleteSeller not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
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
    console.warn("[SampleDataAdapter] createAuction not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }

  async getAuctions(): Promise<Auction[]> {
    // Simulate joining lots to auctions
    const auctionsWithLots = this.localData.sampleAuctions.map(auction => {
      const lotsForAuction = this.localData.sampleLots.filter(lot => lot.auctionId === auction.id);
      return {
        ...auction,
        lots: lotsForAuction,
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
      lots: lotsForAuction,
      totalLots: lotsForAuction.length,
    })));
  }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] updateAuction not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[SampleDataAdapter] deleteAuction not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
      const seller = this.localData.sampleSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId);
      if(!seller) return [];
      const auctions = this.localData.sampleAuctions.filter(a => a.seller === seller.name || a.sellerId === seller.id);
      return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }
  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
     const auctioneer = this.localData.sampleAuctioneers.find(a => a.slug === auctioneerSlugOrPublicId || a.publicId === auctioneerSlugOrPublicId);
     if(!auctioneer) return [];
     const auctions = this.localData.sampleAuctions.filter(a => a.auctioneer === auctioneer.name || a.auctioneerId === auctioneer.id);
     return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleDirectSaleOffers || [])));
  }
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    const offer = this.localData.sampleDirectSaleOffers.find(o => o.id === id);
    return Promise.resolve(offer ? JSON.parse(JSON.stringify(offer)) : null);
  }
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
    console.warn("[SampleDataAdapter] createDirectSaleOffer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
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
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo; }> {
    console.warn("[SampleDataAdapter] placeBidOnLot not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
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
  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> {
    console.warn("[SampleDataAdapter] createUserLotMaxBid not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    const bid = (this.localData.sampleUserLotMaxBids || []).find(b => b.userId === userId && b.lotId === lotId && b.isActive);
    return Promise.resolve(bid ? JSON.parse(JSON.stringify(bid)) : null);
  }
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotReviews.filter(r => r.lotId === lotIdOrPublicId))));
  }
  async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    console.warn("[SampleDataAdapter] createReview not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotQuestions.filter(q => q.lotId === lotIdOrPublicId))));
  }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> {
    console.warn("[SampleDataAdapter] createQuestion not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { 
    console.warn("[SampleDataAdapter] answerQuestion not implemented.");
    return { success: false, message: "Placeholder: Lógica de resposta não implementada completamente no adapter Firestore sem lotId." };
  }

  // Stubs for remaining methods...
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    const newProcess: JudicialProcess = {
        ...data,
        id: `proc-${uuidv4()}`,
        publicId: `PROC-PUB-${uuidv4().substring(0, 8)}`,
        parties: data.parties as ProcessParty[],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    this.localData.sampleJudicialProcesses.push(newProcess);
    this._persistData();
    return { success: true, message: 'Processo Judicial criado com sucesso!', processId: newProcess.id };
  }
  
  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleJudicialProcesses)));
  }

  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean, message: string, createdLots?: Lot[] }> {
    const newLots: Lot[] = [];
    lotsToCreate.forEach(lotData => {
        const newLot: Lot = {
            ...lotData,
            id: `lot-${uuidv4()}`,
            publicId: `LOT-PUB-${uuidv4()}`,
            bidsCount: 0,
            views: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.localData.sampleLots.push(newLot);
        newLots.push(newLot);
    });
    this._persistData();
    return { success: true, message: `${newLots.length} lotes criados.`, createdLots: newLots };
  }
}
