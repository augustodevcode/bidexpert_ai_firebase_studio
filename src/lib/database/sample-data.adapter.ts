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
const DATA_FILE_PATH = path.resolve(process.cwd(), 'src/sample-data.local.json');


export class SampleDataAdapter implements IDatabaseAdapter {
  private localData: { [K in keyof typeof sampleData]: (typeof sampleData)[K] };

  constructor() {
    try {
        const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        this.localData = JSON.parse(fileContents);
        console.log("[SampleDataAdapter] Instance created and data loaded from sample-data.local.json.");
    } catch (error) {
        console.error("[SampleDataAdapter] Could not read from sample-data.local.json, falling back to initial import.", error);
        // Fallback to the imported data if the file doesn't exist or is invalid
        this.localData = JSON.parse(JSON.stringify(sampleData));
    }
  }
  
  private _persistData(): void {
    try {
        const dataString = JSON.stringify(this.localData, null, 2);
        fs.writeFileSync(DATA_FILE_PATH, dataString, 'utf8');
        console.log(`[SampleDataAdapter] In-memory data persisted to ${DATA_FILE_PATH}.`);
    } catch (error) {
        console.error(`[SampleDataAdapter] FAILED to persist data to ${DATA_FILE_PATH}:`, error);
    }
  }

  // --- Schema ---
  async initializeSchema(): Promise<{ success: boolean; message:string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    return Promise.resolve({ success: true, message: 'Sample data adapter ready.', rolesProcessed: this.localData.sampleRoles.length });
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

  async updateLotCategory(id: string, data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
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

  // --- States ---
  async getStates(): Promise<StateInfo[]> {
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleStates)));
  }
  // Implement other State methods similarly...
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

  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    await delay(10);
    // Ensure default values are present if they don't exist on the loaded data
    const loadedSettings = this.localData.samplePlatformSettings || {};
    const settings = { ...samplePlatformSettings, ...loadedSettings };
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

  // --- Judicial Entities ---
  async getCourts(): Promise<Court[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleCourts || []))); }
  async getCourt(id: string): Promise<Court | null> { const court = this.localData.sampleCourts.find(c => c.id === id); return Promise.resolve(court ? JSON.parse(JSON.stringify(court)) : null); }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { const newCourt: Court = { ...data, id: `court-${slugify(data.name)}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleCourts.push(newCourt); this._persistData(); return { success: true, message: 'Tribunal criado!', courtId: newCourt.id }; }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleCourts.findIndex(c => c.id === id); if (index === -1) return { success: false, message: 'Tribunal não encontrado.'}; this.localData.sampleCourts[index] = { ...this.localData.sampleCourts[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleCourts[index].slug }; this._persistData(); return { success: true, message: 'Tribunal atualizado.' }; }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleCourts = this.localData.sampleCourts.filter(c => c.id !== id); this._persistData(); return { success: true, message: 'Tribunal excluído.' }; }

  async getJudicialDistricts(): Promise<JudicialDistrict[]> {
    const enriched = this.localData.sampleJudicialDistricts.map(d => {
        const court = this.localData.sampleCourts.find(c => c.id === d.courtId);
        const state = this.localData.sampleStates.find(s => s.id === d.stateId);
        return { ...d, courtName: court?.name, stateUf: state?.uf };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(enriched)));
  }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> { const dist = this.localData.sampleJudicialDistricts.find(d => d.id === id); return Promise.resolve(dist ? JSON.parse(JSON.stringify(dist)) : null); }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { const newDist: JudicialDistrict = { ...data, id: `dist-${slugify(data.name)}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleJudicialDistricts.push(newDist); this._persistData(); return { success: true, message: 'Comarca criada!', districtId: newDist.id }; }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleJudicialDistricts.findIndex(d => d.id === id); if (index === -1) return { success: false, message: 'Comarca não encontrada.'}; this.localData.sampleJudicialDistricts[index] = { ...this.localData.sampleJudicialDistricts[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleJudicialDistricts[index].slug }; this._persistData(); return { success: true, message: 'Comarca atualizada.' }; }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleJudicialDistricts = this.localData.sampleJudicialDistricts.filter(d => d.id !== id); this._persistData(); return { success: true, message: 'Comarca excluída.' }; }

  async getJudicialBranches(): Promise<JudicialBranch[]> {
    const enriched = this.localData.sampleJudicialBranches.map(b => {
        const dist = this.localData.sampleJudicialDistricts.find(d => d.id === b.districtId);
        return { ...b, districtName: dist?.name };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(enriched)));
  }
  async getJudicialBranch(id: string): Promise<JudicialBranch | null> { const branch = this.localData.sampleJudicialBranches.find(b => b.id === id); return Promise.resolve(branch ? JSON.parse(JSON.stringify(branch)) : null); }
  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { const newBranch: JudicialBranch = { ...data, id: `branch-${uuidv4()}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleJudicialBranches.push(newBranch); this._persistData(); return { success: true, message: 'Vara criada!', branchId: newBranch.id }; }
  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleJudicialBranches.findIndex(b => b.id === id); if (index === -1) return { success: false, message: 'Vara não encontrada.'}; this.localData.sampleJudicialBranches[index] = { ...this.localData.sampleJudicialBranches[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleJudicialBranches[index].slug }; this._persistData(); return { success: true, message: 'Vara atualizada.' }; }
  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleJudicialBranches = this.localData.sampleJudicialBranches.filter(b => b.id !== id); this._persistData(); return { success: true, message: 'Vara excluída.' }; }

  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    const enriched = this.localData.sampleJudicialProcesses.map(p => {
        const court = this.localData.sampleCourts.find(c => c.id === p.courtId);
        const district = this.localData.sampleJudicialDistricts.find(d => d.id === p.districtId);
        const branch = this.localData.sampleJudicialBranches.find(b => b.id === p.branchId);
        return { ...p, courtName: court?.name, districtName: district?.name, branchName: branch?.name };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(enriched)));
  }
  async getJudicialProcess(id: string): Promise<JudicialProcess | null> { const proc = this.localData.sampleJudicialProcesses.find(p => p.id === id); return Promise.resolve(proc ? JSON.parse(JSON.stringify(proc)) : null); }
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> { const newProcess: JudicialProcess = { ...data, id: `proc-${uuidv4()}`, publicId: `PROC-PUB-${uuidv4()}`, createdAt: new Date(), updatedAt: new Date(), parties: data.parties as ProcessParty[] }; this.localData.sampleJudicialProcesses.push(newProcess); this._persistData(); return { success: true, message: 'Processo criado!', processId: newProcess.id }; }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleJudicialProcesses.findIndex(p => p.id === id); if (index === -1) return { success: false, message: 'Processo não encontrado.'}; this.localData.sampleJudicialProcesses[index] = { ...this.localData.sampleJudicialProcesses[index], ...data, updatedAt: new Date() } as JudicialProcess; this._persistData(); return { success: true, message: 'Processo atualizado.' }; }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleJudicialProcesses = this.localData.sampleJudicialProcesses.filter(p => p.id !== id); this._persistData(); return { success: true, message: 'Processo excluído.' }; }

  // --- Null/Placeholder Implementations ---
  async getLotCategoryByName(name: string): Promise<LotCategory | null> { console.warn("[SampleDataAdapter] getLotCategoryByName not implemented."); return null; }
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> { console.warn("[SampleDataAdapter] createSubcategory not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> { console.warn("[SampleDataAdapter] getSubcategories not implemented."); return []; }
  async getSubcategory(id: string): Promise<Subcategory | null> { console.warn("[SampleDataAdapter] getSubcategory not implemented."); return null; }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> { console.warn("[SampleDataAdapter] getSubcategoryBySlug not implemented."); return null; }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateSubcategory not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteSubcategory not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { console.warn("[SampleDataAdapter] createCity not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { console.warn("[SampleDataAdapter] getCities not implemented."); return []; }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> { console.warn("[SampleDataAdapter] getCity not implemented."); return null; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateCity not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteCity not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { console.warn("[SampleDataAdapter] createAuctioneer not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleAuctioneers))); }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { console.warn("[SampleDataAdapter] getAuctioneer not implemented."); return null; }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateAuctioneer not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteAuctioneer not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> { console.warn("[SampleDataAdapter] getAuctioneerBySlug not implemented."); return null; }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { console.warn("[SampleDataAdapter] getAuctioneerByName not implemented."); return null; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { console.warn("[SampleDataAdapter] createSeller not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getSellers(): Promise<SellerProfileInfo[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleSellers))); }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { console.warn("[SampleDataAdapter] getSeller not implemented."); return null; }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateSeller not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteSeller not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> { console.warn("[SampleDataAdapter] getSellerBySlug not implemented."); return null; }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { console.warn("[SampleDataAdapter] getSellerByName not implemented."); return null; }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { console.warn("[SampleDataAdapter] createAuction not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getAuctions(): Promise<Auction[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleAuctions))); }
  async getAuctionsByIds(ids: string[]): Promise<Auction[]> { console.warn("[SampleDataAdapter] getAuctionsByIds not implemented."); return []; }
  async getAuction(idOrPublicId: string): Promise<Auction | null> { const auction = this.localData.sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId); return Promise.resolve(auction ? JSON.parse(JSON.stringify(auction)) : null); }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateAuction not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteAuction not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> { console.warn("[SampleDataAdapter] getAuctionsBySellerSlug not implemented."); return []; }
  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> { console.warn("[SampleDataAdapter] getAuctionsByAuctioneerSlug not implemented."); return []; }
  async getLots(auctionIdParam?: string): Promise<Lot[]> { let lots = this.localData.sampleLots; if(auctionIdParam){lots = lots.filter(l => l.auctionId === auctionIdParam); } return Promise.resolve(JSON.parse(JSON.stringify(lots))); }
  async getLotsByIds(ids: string[]): Promise<Lot[]> { const lots = this.localData.sampleLots.filter(l => ids.includes(l.id)); return Promise.resolve(JSON.parse(JSON.stringify(lots))); }
  async getLot(idOrPublicId: string): Promise<Lot | null> { const lot = this.localData.sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId); return Promise.resolve(lot ? JSON.parse(JSON.stringify(lot)) : null); }
  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateLot not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteLot not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleDirectSaleOffers))); }
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> { const offer = this.localData.sampleDirectSaleOffers.find(o => o.id === id); return Promise.resolve(offer ? JSON.parse(JSON.stringify(offer)) : null); }
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> { console.warn("[SampleDataAdapter] createDirectSaleOffer not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateDirectSaleOffer not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteDirectSaleOffer not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleBids.filter(b => b.lotId === lotIdOrPublicId)))); }
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo; }> { console.warn("[SampleDataAdapter] placeBidOnLot not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getWinsForUser(userId: string): Promise<UserWin[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleUserWins.filter(w => w.userId === userId)))); }
  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> { console.warn("[SampleDataAdapter] createUserLotMaxBid not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> { const bid = this.localData.sampleUserLotMaxBids.find(b => b.userId === userId && b.lotId === lotId && b.isActive); return Promise.resolve(bid ? JSON.parse(JSON.stringify(bid)) : null); }
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotReviews.filter(r => r.lotId === lotIdOrPublicId)))); }
  async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string; }> { console.warn("[SampleDataAdapter] createReview not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotQuestions.filter(q => q.lotId === lotIdOrPublicId)))); }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> { console.warn("[SampleDataAdapter] createQuestion not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] answerQuestion not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> { const profile = this.localData.sampleUserProfiles.find(p => p.uid === userId); return Promise.resolve(profile ? JSON.parse(JSON.stringify(profile)) : null); }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateUserProfile not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, "cpf" | "cellPhone" | "dateOfBirth" | "password" | "accountType" | "razaoSocial" | "cnpj" | "inscricaoEstadual" | "websiteComitente" | "zipCode" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "optInMarketing">>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions; }> { console.warn("[SampleDataAdapter] ensureUserRole not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getUsersWithRoles(): Promise<UserProfileData[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleUserProfiles))); }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateUserRole not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteUserProfile not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> { const profile = this.localData.sampleUserProfiles.find(p => p.email === email); return Promise.resolve(profile ? JSON.parse(JSON.stringify(profile)) : null); }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { console.warn("[SampleDataAdapter] createRole not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getRoles(): Promise<Role[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleRoles))); }
  async getRole(id: string): Promise<Role | null> { const role = this.localData.sampleRoles.find(r => r.id === id); return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null); }
  async getRoleByName(name: string): Promise<Role | null> { const role = this.localData.sampleRoles.find(r => r.name_normalized === name.toUpperCase()); return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null); }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateRole not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteRole not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async ensureDefaultRolesExist(connection?: any): Promise<{ success: boolean; message: string; rolesProcessed?: number }> { console.log("[SampleDataAdapter] ensureDefaultRolesExist called."); return { success: true, message: 'Default roles exist in sample data.', rolesProcessed: this.localData.sampleRoles.length }; }
  async createMediaItem(data: Omit<MediaItem, "id" | "uploadedAt" | "urlOriginal" | "urlThumbnail" | "urlMedium" | "urlLarge" | "storagePath">, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { console.warn("[SampleDataAdapter] createMediaItem not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async getMediaItems(): Promise<MediaItem[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleMediaItems))); }
  async getMediaItem(id: string): Promise<MediaItem | null> { const item = this.localData.sampleMediaItems.find(i => i.id === id); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateMediaItemMetadata not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteMediaItemFromDb not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] linkMediaItemsToLot not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] unlinkMediaItemFromLot not implemented."); return { success: false, message: "Funcionalidade não implementada." }; }
}
