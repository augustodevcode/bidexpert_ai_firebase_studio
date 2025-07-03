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
const DATA_FILE_PATH = path.resolve(process.cwd(), 'src', 'lib', 'sample-data.local.json');


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

  // --- BENS ---
  async getBens(judicialProcessId?: string): Promise<Bem[]> {
    await delay(20);
    let bens = this.localData.sampleBens;
    if (judicialProcessId) {
      bens = bens.filter((bem: Bem) => bem.judicialProcessId === judicialProcessId);
    }
    return Promise.resolve(JSON.parse(JSON.stringify(bens)));
  }
  async getBensByIds(ids: string[]): Promise<Bem[]> {
    const bens = this.localData.sampleBens.filter(b => ids.includes(b.id));
    return Promise.resolve(JSON.parse(JSON.stringify(bens)));
  }
  async getBem(id: string): Promise<Bem | null> {
    const bem = this.localData.sampleBens.find((b: Bem) => b.id === id || b.publicId === id);
    return Promise.resolve(bem ? JSON.parse(JSON.stringify(bem)) : null);
  }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const newBem: Bem = {
      ...data,
      id: `bem-${uuidv4()}`,
      publicId: `BEM-PUB-${uuidv4()}`,
      status: 'DISPONIVEL',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleBens.push(newBem);
    this._persistData();
    return { success: true, message: 'Bem criado com sucesso.', bemId: newBem.id };
  }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleBens.findIndex((b: Bem) => b.id === id);
    if (index === -1) return { success: false, message: 'Bem não encontrado.' };
    this.localData.sampleBens[index] = { ...this.localData.sampleBens[index], ...data, updatedAt: new Date() };
    this._persistData();
    return { success: true, message: 'Bem atualizado com sucesso.' };
  }
  async updateBensStatus(bemIds: string[], status: Bem['status']): Promise<{ success: boolean, message: string }> {
      bemIds.forEach(id => {
        const bem = this.localData.sampleBens.find(b => b.id === id);
        if (bem) {
            bem.status = status;
        }
      });
      this._persistData();
      return { success: true, message: `Status de ${bemIds.length} bens atualizado para ${status}`};
  }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleBens = this.localData.sampleBens.filter((b: Bem) => b.id !== id);
    this._persistData();
    return { success: true, message: 'Bem excluído com sucesso.' };
  }

  // --- LOTS ---
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    await delay(20);
    let lots = this.localData.sampleLots;
    if (auctionIdParam) {
      lots = lots.filter((lot: Lot) => lot.auctionId === auctionIdParam);
    }
    // Enrich with auction data
    lots.forEach((lot: Lot) => {
        const auction = this.localData.sampleAuctions.find((a: Auction) => a.id === lot.auctionId);
        if(auction) {
            lot.auctionName = auction.title;
            lot.auctionPublicId = auction.publicId;
            if (!lot.endDate) lot.endDate = getEffectiveLotEndDate(lot, auction);
        }
        const category = this.localData.sampleLotCategories.find((c: LotCategory) => c.id === lot.categoryId);
        if (category) lot.type = category.name;
    });
    return Promise.resolve(JSON.parse(JSON.stringify(lots)));
  }

  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    await delay(20);
    if (!ids || ids.length === 0) {
      return Promise.resolve([]);
    }
    const idSet = new Set(ids);
    const lots = this.localData.sampleLots.filter((lot: Lot) => idSet.has(lot.id) || (lot.publicId && idSet.has(lot.publicId)));
    // Enrich with auction data
    lots.forEach((lot: Lot) => {
        const auction = this.localData.sampleAuctions.find((a: Auction) => a.id === lot.auctionId);
        if(auction) {
            lot.auctionName = auction.title;
            lot.auctionPublicId = auction.publicId;
             if (!lot.endDate) lot.endDate = getEffectiveLotEndDate(lot, auction);
        }
    });
    return Promise.resolve(JSON.parse(JSON.stringify(lots)));
  }
  
  async getLot(idOrPublicId: string): Promise<Lot | null> {
    const lot = this.localData.sampleLots.find((l: Lot) => l.id === idOrPublicId || l.publicId === idOrPublicId);
    if (lot) {
      const auction = this.localData.sampleAuctions.find(a => a.id === lot.auctionId);
      if (auction) {
        lot.auctionName = auction.title;
        lot.auctionPublicId = auction.publicId;
      }
    }
    return Promise.resolve(lot ? JSON.parse(JSON.stringify(lot)) : null);
  }
  
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
    const publicId = `LOTE-PUB-${uuidv4()}`;
    const newLot: Lot = {
      ...data,
      id: `lote-${uuidv4()}`,
      publicId: publicId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localData.sampleLots.push(newLot);
    this._persistData();
    return { success: true, message: 'Lote criado com sucesso.', lotId: newLot.id, lotPublicId: publicId };
  }

  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleLots.findIndex(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    if (index === -1) return { success: false, message: 'Lote não encontrado.'};
    this.localData.sampleLots[index] = { ...this.localData.sampleLots[index], ...data, updatedAt: new Date() };
    this._persistData();
    return { success: true, message: 'Lote atualizado com sucesso.' };
  }
  
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleLots = this.localData.sampleLots.filter(l => l.id !== idOrPublicId && l.publicId !== idOrPublicId);
    this._persistData();
    return { success: true, message: 'Lote excluído com sucesso!'};
  }

  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean, message: string, createdLots?: Lot[] }> {
    const createdLots: Lot[] = [];
    for (const lotData of lotsToCreate) {
        const publicId = `LOTE-PUB-${uuidv4()}`;
        const newLot: Lot = {
            ...lotData,
            id: `lote-${uuidv4()}`,
            publicId: publicId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.localData.sampleLots.push(newLot);
        createdLots.push(newLot);
    }
    this._persistData();
    return { success: true, message: `${createdLots.length} lotes criados com sucesso.`, createdLots };
  }

  // --- Bids, Reviews, Questions ---
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status' | 'endDate'>>; newBid?: BidInfo }> {
    await delay(50);
    const lotIndex = this.localData.sampleLots.findIndex((l: Lot) => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
    if (lotIndex === -1) {
      return { success: false, message: 'Lote não encontrado.' };
    }
    const lot = this.localData.sampleLots[lotIndex];
    if (bidAmount <= lot.price) {
      return { success: false, message: `Seu lance de R$ ${bidAmount.toLocaleString('pt-BR')} deve ser maior que o lance atual de R$ ${lot.price.toLocaleString('pt-BR')}.` };
    }
    if (lot.status !== 'ABERTO_PARA_LANCES') {
      return { success: false, message: 'Lances para este lote não estão abertos.' };
    }
    const auction = this.localData.sampleAuctions.find(a => a.id === lot.auctionId);
    lot.price = bidAmount;
    lot.bidsCount = (lot.bidsCount || 0) + 1;
    let updatedEndDate = lot.endDate;
    if (auction?.softCloseEnabled && auction.softCloseMinutes && lot.endDate) {
        const now = new Date();
        const endDate = new Date(lot.endDate as string);
        const diffSeconds = (endDate.getTime() - now.getTime()) / 1000;
        const softCloseSeconds = auction.softCloseMinutes * 60;
        if (diffSeconds > 0 && diffSeconds <= softCloseSeconds) {
            const newEndDate = new Date(now.getTime() + softCloseSeconds * 1000);
            lot.endDate = newEndDate;
            updatedEndDate = newEndDate;
        }
    }
    const newBid: BidInfo = { id: `bid-${uuidv4()}`, lotId: lot.id, auctionId: lot.auctionId, bidderId: userId, bidderDisplay: userDisplayName, amount: bidAmount, timestamp: new Date() };
    this.localData.sampleBids.unshift(newBid);
    this._persistData();
    return { success: true, message: 'Lance registrado com sucesso!', updatedLot: { price: lot.price, bidsCount: lot.bidsCount, endDate: updatedEndDate }, newBid: { id: newBid.id, ...newBid, timestamp: new Date() } as BidInfo };
  }

  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    await delay(20);
    const lot = this.localData.sampleLots.find((l) => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
    if (!lot) return Promise.resolve([]);
    const bids = this.localData.sampleBids
      .filter((b: BidInfo) => b.lotId === lot.id)
      .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
    return Promise.resolve(JSON.parse(JSON.stringify(bids)));
  }

  // --- Categories & Subcategories ---
  async getLotCategories(): Promise<LotCategory[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleLotCategories))); }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> { await delay(20); const category = this.localData.sampleLotCategories.find((cat: LotCategory) => cat.id === idOrSlug || cat.slug === idOrSlug); return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null); }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> { await delay(20); const category = this.localData.sampleLotCategories.find((cat: LotCategory) => cat.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null); }
  async createLotCategory(data: CategoryFormData): Promise<{ success: boolean; message: string; categoryId?: string }> { await delay(50); const newCategory: LotCategory = { ...data, id: `cat-${slugify(data.name)}`, slug: slugify(data.name), itemCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleLotCategories.push(newCategory); this._persistData(); return { success: true, message: 'Categoria criada com sucesso!', categoryId: newCategory.id }; }
  async updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean; message: string; }> { await delay(50); const index = this.localData.sampleLotCategories.findIndex((c: LotCategory) => c.id === id); if(index === -1) return { success: false, message: 'Categoria não encontrada.' }; this.localData.sampleLotCategories[index] = { ...this.localData.sampleLotCategories[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleLotCategories[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Categoria atualizada com sucesso!' }; }
  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleLotCategories = this.localData.sampleLotCategories.filter((c: LotCategory) => c.id !== id); this._persistData(); return { success: true, message: 'Categoria excluída com sucesso!' }; }
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> { const parentCat = this.localData.sampleLotCategories.find((c: LotCategory) => c.id === data.parentCategoryId); if (!parentCat) return { success: false, message: "Categoria principal não encontrada." }; const newSubcategory: Subcategory = { ...data, id: `subcat-${parentCat.slug}-${slugify(data.name)}`, slug: slugify(data.name), itemCount: 0, createdAt: new Date(), updatedAt: new Date(), parentCategoryName: parentCat.name }; this.localData.sampleSubcategories.push(newSubcategory); this._persistData(); return { success: true, message: 'Subcategoria criada!', subcategoryId: newSubcategory.id }; }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> { const subcategories = this.localData.sampleSubcategories.filter((sub: Subcategory) => sub.parentCategoryId === parentCategoryId); return Promise.resolve(JSON.parse(JSON.stringify(subcategories))); }
  async getSubcategory(id: string): Promise<Subcategory | null> { const subcategory = this.localData.sampleSubcategories.find((sub: Subcategory) => sub.id === id); return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null); }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> { const subcategory = this.localData.sampleSubcategories.find((sub: Subcategory) => sub.slug === slug && sub.parentCategoryId === parentCategoryId); return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null); }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleSubcategories.findIndex((s: Subcategory) => s.id === id); if(index === -1) return { success: false, message: 'Subcategoria não encontrada.' }; this.localData.sampleSubcategories[index] = { ...this.localData.sampleSubcategories[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleSubcategories[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Subcategoria atualizada!' }; }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleSubcategories = this.localData.sampleSubcategories.filter((s: Subcategory) => s.id !== id); this._persistData(); return { success: true, message: 'Subcategoria excluída!' }; }
  
  // --- AUCTIONEERS ---
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleAuctioneers))); }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { const item = this.localData.sampleAuctioneers.find(i => i.id === idOrPublicId || i.publicId === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> { const item = this.localData.sampleAuctioneers.find(i => i.slug === slug); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { const publicId = `AUCT-PUB-${uuidv4()}`; const newAuctioneer: AuctioneerProfileInfo = { ...data, id: `auct-${slugify(data.name)}`, slug: slugify(data.name), publicId, createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleAuctioneers.push(newAuctioneer); this._persistData(); return { success: true, message: 'Leiloeiro criado!', auctioneerId: newAuctioneer.id, auctioneerPublicId: publicId }; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleAuctioneers.findIndex(i => i.id === id); if (index === -1) return { success: false, message: 'Leiloeiro não encontrado.' }; this.localData.sampleAuctioneers[index] = { ...this.localData.sampleAuctioneers[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleAuctioneers[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Leiloeiro atualizado!' }; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleAuctioneers = this.localData.sampleAuctioneers.filter(i => i.id !== id); this._persistData(); return { success: true, message: 'Leiloeiro excluído!' }; }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { const item = this.localData.sampleAuctioneers.find(i => i.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctionsByAuctioneerSlug(slug: string): Promise<Auction[]> { const auctioneer = this.localData.sampleAuctioneers.find(a => a.slug === slug); if (!auctioneer) return []; const auctions = this.localData.sampleAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name); return Promise.resolve(JSON.parse(JSON.stringify(auctions))); }
  
  // --- SELLERS ---
  async getSellers(): Promise<SellerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleSellers))); }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { const item = this.localData.sampleSellers.find(i => i.id === idOrPublicId || i.publicId === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> { const item = this.localData.sampleSellers.find(i => i.slug === slug); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { const publicId = `SELL-PUB-${uuidv4()}`; const newSeller: SellerProfileInfo = { ...data, id: `seller-${slugify(data.name)}`, slug: slugify(data.name), publicId, createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleSellers.push(newSeller); this._persistData(); return { success: true, message: 'Comitente criado!', sellerId: newSeller.id, sellerPublicId: publicId }; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleSellers.findIndex(i => i.id === id); if (index === -1) return { success: false, message: 'Comitente não encontrado.' }; this.localData.sampleSellers[index] = { ...this.localData.sampleSellers[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleSellers[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Comitente atualizado!' }; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleSellers = this.localData.sampleSellers.filter(i => i.id !== id); this._persistData(); return { success: true, message: 'Comitente excluído!' }; }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { const item = this.localData.sampleSellers.find(i => i.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctionsBySellerSlug(slug: string): Promise<Auction[]> { const seller = this.localData.sampleSellers.find(s => s.slug === slug); if (!seller) return []; const auctions = this.localData.sampleAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name); return Promise.resolve(JSON.parse(JSON.stringify(auctions))); }


  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    await delay(10);
    return Promise.resolve(JSON.parse(JSON.stringify(this.localData.samplePlatformSettings)));
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    this.localData.samplePlatformSettings = {
      ...this.localData.samplePlatformSettings,
      ...data,
      id: 'global',
      updatedAt: new Date(),
    };
    this._persistData();
    return { success: true, message: 'Configurações atualizadas com sucesso (dados de exemplo).' };
  }

  // --- Stubs for now ---
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] answerQuestion not implemented."); return { success: false, message: 'Not implemented.' }; }
  async getAuctionsByIds(ids: string[]): Promise<Auction[]> { 
    const auctions = this.localData.sampleAuctions.filter(a => ids.includes(a.id) || (a.publicId && ids.includes(a.publicId)));
    return Promise.resolve(JSON.parse(JSON.stringify(auctions)));
  }
  async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string; }> { console.warn("[SampleDataAdapter] createReview not implemented."); return { success: false, message: 'Not implemented.' }; }
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> { console.warn("[SampleDataAdapter] getReviewsForLot not implemented."); return []; }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> { console.warn("[SampleDataAdapter] createQuestion not implemented."); return { success: false, message: 'Not implemented.' }; }
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> { console.warn("[SampleDataAdapter] getQuestionsForLot not implemented."); return []; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] linkMediaItemsToLot not implemented."); return { success: false, message: 'Not implemented.' }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] unlinkMediaItemFromLot not implemented."); return { success: false, message: 'Not implemented.' }; }
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> { console.warn("[SampleDataAdapter] createDirectSaleOffer not implemented."); return { success: false, message: 'Not implemented.' }; }
  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] updateDirectSaleOffer not implemented."); return { success: false, message: 'Not implemented.' }; }
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] deleteDirectSaleOffer not implemented."); return { success: false, message: 'Not implemented.' }; }
  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> { console.warn("[SampleDataAdapter] createUserLotMaxBid not implemented."); return { success: false, message: 'Not implemented.' }; }
  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> { console.warn("[SampleDataAdapter] getActiveUserLotMaxBid not implemented."); return null; }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { const newState: StateInfo = { ...data, id: `state-${slugify(data.name)}`, slug: slugify(data.name), cityCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleStates.push(newState); this._persistData(); return { success: true, message: 'Estado criado!', stateId: newState.id }; }
  async getStates(): Promise<StateInfo[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleStates))); }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> { const state = this.localData.sampleStates.find(s => s.id === idOrSlugOrUf || s.slug === idOrSlugOrUf || s.uf === idOrSlugOrUf); return Promise.resolve(state ? JSON.parse(JSON.stringify(state)) : null); }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleStates.findIndex(s => s.id === id); if (index === -1) return { success: false, message: 'Estado não encontrado.' }; this.localData.sampleStates[index] = { ...this.localData.sampleStates[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleStates[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Estado atualizado!' }; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleStates = this.localData.sampleStates.filter(s => s.id !== id); this._persistData(); return { success: true, message: 'Estado excluído!' }; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { const parentState = this.localData.sampleStates.find(s => s.id === data.stateId); if (!parentState) return { success: false, message: 'Estado não encontrado.' }; const newCity: CityInfo = { ...data, id: `city-${parentState.slug}-${slugify(data.name)}`, slug: slugify(data.name), stateUf: parentState.uf, lotCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleCities.push(newCity); this._persistData(); return { success: true, message: 'Cidade criada!', cityId: newCity.id }; }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { let cities = this.localData.sampleCities; if (stateIdOrSlugFilter) { cities = cities.filter(c => c.stateId === stateIdOrSlugFilter); } return Promise.resolve(JSON.parse(JSON.stringify(cities))); }
  async getCity(id: string): Promise<CityInfo | null> { const city = this.localData.sampleCities.find(c => c.id === id); return Promise.resolve(city ? JSON.parse(JSON.stringify(city)) : null); }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleCities.findIndex(c => c.id === id); if (index === -1) return { success: false, message: 'Cidade não encontrada.' }; this.localData.sampleCities[index] = { ...this.localData.sampleCities[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleCities[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Cidade atualizada!' }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleCities = this.localData.sampleCities.filter(c => c.id !== id); this._persistData(); return { success: true, message: 'Cidade excluída!' }; }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string }> { const publicId = `AUC-PUB-${uuidv4()}`; const newAuction: Auction = { ...data, id: `auc-${uuidv4()}`, publicId, category: '', auctioneer: '', lots: [], totalLots: 0, createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleAuctions.push(newAuction); this._persistData(); return { success: true, message: 'Leilão criado!', auctionId: newAuction.id, auctionPublicId: publicId }; }
  async getAuctions(): Promise<Auction[]> { await delay(20); const auctionsWithLots = this.localData.sampleAuctions.map((auction: Auction) => ({ ...auction, lots: this.localData.sampleLots.filter((lot: Lot) => lot.auctionId === auction.id), totalLots: this.localData.sampleLots.filter((lot: Lot) => lot.auctionId === auction.id).length })); return Promise.resolve(JSON.parse(JSON.stringify(auctionsWithLots))); }
  async getAuction(idOrPublicId: string): Promise<Auction | null> { const auction = this.localData.sampleAuctions.find((a: Auction) => a.id === idOrPublicId || a.publicId === idOrPublicId); if (!auction) return null; const lots = this.localData.sampleLots.filter((l: Lot) => l.auctionId === auction.id); return Promise.resolve(JSON.parse(JSON.stringify({ ...auction, lots, totalLots: lots.length }))); }
  async updateAuction(id: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string }> { const index = this.localData.sampleAuctions.findIndex(a => a.id === id); if (index === -1) return { success: false, message: 'Leilão não encontrado.' }; this.localData.sampleAuctions[index] = { ...this.localData.sampleAuctions[index], ...data, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Leilão atualizado!' }; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string }> { this.localData.sampleAuctions = this.localData.sampleAuctions.filter(a => a.id !== id); this.localData.sampleLots = this.localData.sampleLots.filter(l => l.auctionId !== id); this._persistData(); return { success: true, message: 'Leilão excluído!' }; }
  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleDirectSaleOffers))); }
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> { const offer = this.localData.sampleDirectSaleOffers.find((o: DirectSaleOffer) => o.id === id); return Promise.resolve(offer ? JSON.parse(JSON.stringify(offer)) : null); }
  async getRoles(): Promise<Role[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleRoles))); }
  async getRole(id: string): Promise<Role | null> { const role = this.localData.sampleRoles.find(r => r.id === id); return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null); }
  async getRoleByName(name: string): Promise<Role | null> { const role = this.localData.sampleRoles.find(r => r.name_normalized === name.toUpperCase()); return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null); }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { const newRole: Role = { ...data, id: `role-${slugify(data.name)}`, name_normalized: data.name.toUpperCase(), createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleRoles.push(newRole); this._persistData(); return { success: true, message: 'Perfil criado!', roleId: newRole.id }; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleRoles.findIndex(r => r.id === id); if (index === -1) return { success: false, message: 'Perfil não encontrado.' }; this.localData.sampleRoles[index] = { ...this.localData.sampleRoles[index], ...data, name_normalized: data.name ? data.name.toUpperCase() : this.localData.sampleRoles[index].name_normalized, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Perfil atualizado!' }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleRoles = this.localData.sampleRoles.filter(r => r.id !== id); this._persistData(); return { success: true, message: 'Perfil excluído!' }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<UserProfileData>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions }> { const existingUserIndex = this.localData.sampleUserProfiles.findIndex(u => u.uid === userId || u.email === email); let targetRole = this.localData.sampleRoles.find(r => r.id === roleIdToAssign || r.name === targetRoleName); if (!targetRole) targetRole = this.localData.sampleRoles.find(r => r.name === 'USER'); if (!targetRole) return { success: false, message: 'Perfil USER padrão não encontrado.' }; if (existingUserIndex > -1) { const user = this.localData.sampleUserProfiles[existingUserIndex]; user.roleId = targetRole.id; user.roleName = targetRole.name; user.permissions = targetRole.permissions; this.localData.sampleUserProfiles[existingUserIndex] = { ...user, updatedAt: new Date() }; return { success: true, message: 'Perfil do usuário atualizado.', userProfile: user }; } else { const newUser: UserProfileWithPermissions = { uid: userId, email, fullName, roleId: targetRole.id, roleName: targetRole.name, permissions: targetRole.permissions, status: 'ATIVO', habilitationStatus: 'PENDING_DOCUMENTS', createdAt: new Date(), updatedAt: new Date(), ...additionalProfileData }; this.localData.sampleUserProfiles.push(newUser); return { success: true, message: 'Usuário criado e perfil atribuído.', userProfile: newUser }; } }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; }> { return Promise.resolve({ success: true, message: 'Perfis padrão já carregados.' }); }
  async getUsersWithRoles(): Promise<UserProfileData[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleUserProfiles))); }
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> { const user = this.localData.sampleUserProfiles.find(u => u.uid === userId); return Promise.resolve(user ? JSON.parse(JSON.stringify(user)) : null); }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> { const user = this.localData.sampleUserProfiles.find(u => u.email.toLowerCase() === email.toLowerCase()); return Promise.resolve(user ? JSON.parse(JSON.stringify(user)) : null); }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { const userIndex = this.localData.sampleUserProfiles.findIndex(u => u.uid === userId); if (userIndex === -1) return { success: false, message: 'Usuário não encontrado.'}; const role = roleId ? this.localData.sampleRoles.find(r => r.id === roleId) : null; this.localData.sampleUserProfiles[userIndex].roleId = role?.id || null; this.localData.sampleUserProfiles[userIndex].roleName = role?.name || 'N/A'; this.localData.sampleUserProfiles[userIndex].permissions = role?.permissions || []; return { success: true, message: 'Perfil atualizado.'}; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleUserProfiles.findIndex(u => u.uid === userId); if (index === -1) return { success: false, message: 'Usuário não encontrado.'}; this.localData.sampleUserProfiles[index] = { ...this.localData.sampleUserProfiles[index], ...data, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Perfil do usuário atualizado!'}; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleUserProfiles = this.localData.sampleUserProfiles.filter(u => u.uid !== userId); this._persistData(); return { success: true, message: 'Usuário excluído.'}; }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { const newItem: MediaItem = { ...data, id: `media-${uuidv4()}`, uploadedAt: new Date(), urlOriginal: filePublicUrl, storagePath: filePublicUrl, uploadedBy: uploadedBy || 'system', linkedLotIds:[] }; this.localData.sampleMediaItems.push(newItem); this._persistData(); return { success: true, message: 'Mídia criada.', item: newItem }; }
  async getMediaItems(): Promise<MediaItem[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleMediaItems))); }
  async getMediaItem(id: string): Promise<MediaItem | null> { const item = this.localData.sampleMediaItems.find(i => i.id === id); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleMediaItems.findIndex(i => i.id === id); if (index === -1) return { success: false, message: 'Mídia não encontrada.' }; this.localData.sampleMediaItems[index] = { ...this.localData.sampleMediaItems[index], ...metadata }; this._persistData(); return { success: true, message: 'Metadados atualizados.' }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleMediaItems = this.localData.sampleMediaItems.filter(i => i.id !== id); this._persistData(); return { success: true, message: 'Mídia excluída.' }; }
  async getWinsForUser(userId: string): Promise<UserWin[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleUserWins.filter(w => w.userId === userId)))); }

  // Judicial CRUDs
  async getCourts(): Promise<Court[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleCourts))); }
  async getCourt(id: string): Promise<Court | null> { const court = this.localData.sampleCourts.find(c => c.id === id); return Promise.resolve(court ? JSON.parse(JSON.stringify(court)) : null); }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { const newCourt: Court = { ...data, id: `court-${slugify(data.name)}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleCourts.push(newCourt); this._persistData(); return { success: true, message: 'Tribunal criado!', courtId: newCourt.id }; }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleCourts.findIndex(c => c.id === id); if (index === -1) return { success: false, message: 'Tribunal não encontrado.'}; this.localData.sampleCourts[index] = { ...this.localData.sampleCourts[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleCourts[index].slug }; this._persistData(); return { success: true, message: 'Tribunal atualizado.' }; }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleCourts = this.localData.sampleCourts.filter(c => c.id !== id); this._persistData(); return { success: true, message: 'Tribunal excluído.'}; }
  
  async getJudicialDistricts(): Promise<JudicialDistrict[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleJudicialDistricts))); }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> { const item = this.localData.sampleJudicialDistricts.find(i => i.id === id); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { const newDistrict: JudicialDistrict = { ...data, id: `dist-${slugify(data.name)}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleJudicialDistricts.push(newDistrict); this._persistData(); return { success: true, message: 'Comarca criada!', districtId: newDistrict.id }; }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleJudicialDistricts.findIndex(i => i.id === id); if (index === -1) return { success: false, message: 'Comarca não encontrada.'}; this.localData.sampleJudicialDistricts[index] = { ...this.localData.sampleJudicialDistricts[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleJudicialDistricts[index].slug }; this._persistData(); return { success: true, message: 'Comarca atualizada.' }; }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleJudicialDistricts = this.localData.sampleJudicialDistricts.filter(i => i.id !== id); this._persistData(); return { success: true, message: 'Comarca excluída.' }; }

  async getJudicialBranches(): Promise<JudicialBranch[]> { return Promise.resolve(JSON.parse(JSON.stringify(this.localData.sampleJudicialBranches))); }
  async getJudicialBranch(id: string): Promise<JudicialBranch | null> { const item = this.localData.sampleJudicialBranches.find(i => i.id === id); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { const newBranch: JudicialBranch = { ...data, id: `branch-${uuidv4()}`, slug: slugify(data.name), createdAt: new Date(), updatedAt: new Date() }; this.localData.sampleJudicialBranches.push(newBranch); this._persistData(); return { success: true, message: 'Vara criada!', branchId: newBranch.id }; }
  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> { const index = this.localData.sampleJudicialBranches.findIndex(i => i.id === id); if (index === -1) return { success: false, message: 'Vara não encontrada.'}; this.localData.sampleJudicialBranches[index] = { ...this.localData.sampleJudicialBranches[index], ...data, slug: data.name ? slugify(data.name) : this.localData.sampleJudicialBranches[index].slug }; this._persistData(); return { success: true, message: 'Vara atualizada.' }; }
  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> { this.localData.sampleJudicialBranches = this.localData.sampleJudicialBranches.filter(i => i.id !== id); this._persistData(); return { success: true, message: 'Vara excluída.' }; }
  
  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    const processes = this.localData.sampleJudicialProcesses.map((p: JudicialProcess) => {
        const court = this.localData.sampleCourts.find(c => c.id === p.courtId);
        const district = this.localData.sampleJudicialDistricts.find(d => d.id === p.districtId);
        const branch = this.localData.sampleJudicialBranches.find(b => b.id === p.branchId);
        return {
            ...p,
            courtName: court?.name,
            districtName: district?.name,
            branchName: branch?.name,
        };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(processes)));
  }
  async getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    const process = this.localData.sampleJudicialProcesses.find(i => i.id === id);
    if (!process) return null;

    const court = this.localData.sampleCourts.find(c => c.id === process.courtId);
    const district = this.localData.sampleJudicialDistricts.find(d => d.id === process.districtId);
    const branch = this.localData.sampleJudicialBranches.find(b => b.id === process.branchId);
    
    return Promise.resolve(JSON.parse(JSON.stringify({
        ...process,
        courtName: court?.name,
        districtName: district?.name,
        branchName: branch?.name,
    })));
  }
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    const newProcess: JudicialProcess = {
        ...data,
        id: `proc-${uuidv4()}`,
        publicId: `PROC-PUB-${uuidv4()}`,
        parties: data.parties as ProcessParty[],
        createdAt: new Date(),
        updatedAt: new Date()
    };
    this.localData.sampleJudicialProcesses.push(newProcess);
    this._persistData();
    return { success: true, message: 'Processo criado!', processId: newProcess.id };
  }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.localData.sampleJudicialProcesses.findIndex(i => i.id === id);
    if (index === -1) return { success: false, message: 'Processo não encontrado.'};
    this.localData.sampleJudicialProcesses[index] = { ...this.localData.sampleJudicialProcesses[index], ...data, parties: data.parties as ProcessParty[], updatedAt: new Date() };
    this._persistData();
    return { success: true, message: 'Processo atualizado.' };
  }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    this.localData.sampleJudicialProcesses = this.localData.sampleJudicialProcesses.filter(i => i.id !== id);
    this._persistData();
    return { success: true, message: 'Processo excluído.' };
  }

  async createAuctionAndLinkLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    const auctionDetails = wizardData.auctionDetails;
    if (!auctionDetails || !auctionDetails.title || !auctionDetails.auctioneer || !auctionDetails.seller) {
      return { success: false, message: 'Detalhes insuficientes para criar o leilão.'};
    }

    const seller = await this.getSellerByName(auctionDetails.seller);
    const auctioneer = await this.getAuctioneerByName(auctionDetails.auctioneer);
    
    // Find category by name, as forms often work with names
    const category = this.localData.sampleLotCategories.find(c => c.name === wizardData.createdLots?.[0]?.categoryId) || 
                     this.localData.sampleLotCategories[0]; // fallback

    const newAuction: Auction = {
      ...auctionDetails,
      id: `auc-${uuidv4()}`,
      publicId: `AUC-PUB-${uuidv4()}`,
      status: 'EM_PREPARACAO',
      auctionType: wizardData.auctionType,
      sellerId: seller?.id,
      auctioneerId: auctioneer?.id,
      categoryId: category?.id,
      category: category?.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      lots: [],
      totalLots: wizardData.createdLots?.length || 0,
    };
    this.localData.sampleAuctions.push(newAuction);

    // Link lots to the new auction
    (wizardData.createdLots || []).forEach(lot => {
      const lotIndex = this.localData.sampleLots.findIndex(l => l.id === lot.id);
      if (lotIndex !== -1) {
        this.localData.sampleLots[lotIndex].auctionId = newAuction.id;
      }
    });

    this._persistData();
    return { success: true, message: 'Leilão criado e lotes vinculados!', auctionId: newAuction.id };
  }
}
