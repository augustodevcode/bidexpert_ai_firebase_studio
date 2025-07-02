// src/lib/database/sample-data.adapter.ts
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
  DirectSaleOffer, DirectSaleOfferFormData,
  UserLotMaxBid,
  UserWin,
  Court, CourtFormData,
  JudicialDistrict, JudicialDistrictFormData,
  JudicialBranch, JudicialBranchFormData,
  JudicialProcess, JudicialProcessFormData,
  Bem, BemFormData
} from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import * as sampleData from '@/lib/sample-data'; // Import all exports from the new sample-data.ts

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SampleDataAdapter implements IDatabaseAdapter {
  private data: { [K in keyof typeof sampleData]: (typeof sampleData)[K] };

  constructor() {
    // Create a deep, mutable copy of the imported data to work with
    this.data = JSON.parse(JSON.stringify(sampleData));
    console.log("[SampleDataAdapter] Instance created and data copied from module.");
  }
  
  private _persistData(): void {
    console.log(`[SampleDataAdapter] In-memory data updated. Persistence to file is not implemented in this version.`);
  }

  // --- Schema ---
  async initializeSchema(): Promise<{ success: boolean; message:string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    return Promise.resolve({ success: true, message: 'Sample data adapter ready.', rolesProcessed: this.data.sampleRoles.length });
  }

  // --- Bids, Reviews, Questions ---
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status' | 'endDate'>>; newBid?: BidInfo }> {
    await delay(50);
    const lotIndex = this.data.sampleLots.findIndex((l: Lot) => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
    if (lotIndex === -1) {
      return { success: false, message: 'Lote não encontrado.' };
    }
    const lot = this.data.sampleLots[lotIndex];
    if (bidAmount <= lot.price) {
      return { success: false, message: `Seu lance de R$ ${bidAmount.toLocaleString('pt-BR')} deve ser maior que o lance atual de R$ ${lot.price.toLocaleString('pt-BR')}.` };
    }
    if (lot.status !== 'ABERTO_PARA_LANCES') {
      return { success: false, message: 'Lances para este lote não estão abertos.' };
    }
    const auction = this.data.sampleAuctions.find(a => a.id === lot.auctionId);
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
    this.data.sampleBids.unshift(newBid);
    this._persistData();
    return { success: true, message: 'Lance registrado com sucesso!', updatedLot: { price: lot.price, bidsCount: lot.bidsCount, endDate: updatedEndDate }, newBid };
  }

  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    await delay(20);
    const lot = this.data.sampleLots.find((l) => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
    if (!lot) return Promise.resolve([]);
    const bids = this.data.sampleBids
      .filter((b: BidInfo) => b.lotId === lot.id)
      .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
    return Promise.resolve(JSON.parse(JSON.stringify(bids)));
  }

  // --- Categories & Subcategories ---
  async getLotCategories(): Promise<LotCategory[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleLotCategories))); }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> { await delay(20); const category = this.data.sampleLotCategories.find((cat: LotCategory) => cat.id === idOrSlug || cat.slug === idOrSlug); return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null); }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> { await delay(20); const category = this.data.sampleLotCategories.find((cat: LotCategory) => cat.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null); }
  async createLotCategory(data: CategoryFormData): Promise<{ success: boolean; message: string; categoryId?: string }> { await delay(50); const newCategory: LotCategory = { ...data, id: `cat-${slugify(data.name)}`, slug: slugify(data.name), itemCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.data.sampleLotCategories.push(newCategory); this._persistData(); return { success: true, message: 'Categoria criada com sucesso!', categoryId: newCategory.id }; }
  async updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean; message: string; }> { await delay(50); const index = this.data.sampleLotCategories.findIndex((c: LotCategory) => c.id === id); if(index === -1) return { success: false, message: 'Categoria não encontrada.' }; this.data.sampleLotCategories[index] = { ...this.data.sampleLotCategories[index], ...data, slug: data.name ? slugify(data.name) : this.data.sampleLotCategories[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Categoria atualizada com sucesso!' }; }
  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> { await delay(50); this.data.sampleLotCategories = this.data.sampleLotCategories.filter((c: LotCategory) => c.id !== id); this._persistData(); return { success: true, message: 'Categoria excluída com sucesso!' }; }
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> { const parentCat = this.data.sampleLotCategories.find((c: LotCategory) => c.id === data.parentCategoryId); if (!parentCat) return { success: false, message: "Categoria principal não encontrada." }; const newSubcategory: Subcategory = { ...data, id: `subcat-${parentCat.slug}-${slugify(data.name)}`, slug: slugify(data.name), itemCount: 0, createdAt: new Date(), updatedAt: new Date(), parentCategoryName: parentCat.name }; this.data.sampleSubcategories.push(newSubcategory); this._persistData(); return { success: true, message: 'Subcategoria criada!', subcategoryId: newSubcategory.id }; }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> { const subcategories = this.data.sampleSubcategories.filter((sub: Subcategory) => sub.parentCategoryId === parentCategoryId); return Promise.resolve(JSON.parse(JSON.stringify(subcategories))); }
  async getSubcategory(id: string): Promise<Subcategory | null> { const subcategory = this.data.sampleSubcategories.find((sub: Subcategory) => sub.id === id); return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null); }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> { const subcategory = this.data.sampleSubcategories.find((sub: Subcategory) => sub.slug === slug && sub.parentCategoryId === parentCategoryId); return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null); }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleSubcategories.findIndex((s: Subcategory) => s.id === id); if(index === -1) return { success: false, message: 'Subcategoria não encontrada.' }; this.data.sampleSubcategories[index] = { ...this.data.sampleSubcategories[index], ...data, slug: data.name ? slugify(data.name) : this.data.sampleSubcategories[index].slug, updatedAt: new Date() }; this._persistData(); return { success: true, message: 'Subcategoria atualizada!' }; }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleSubcategories = this.data.sampleSubcategories.filter((s: Subcategory) => s.id !== id); this._persistData(); return { success: true, message: 'Subcategoria excluída!' }; }
  
  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    await delay(10);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.samplePlatformSettings)));
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    // In a real scenario, you'd merge deeply. For sample data, a simple overwrite is fine.
    this.data.samplePlatformSettings = {
      ...this.data.samplePlatformSettings,
      ...data,
      id: 'global', // ensure id is not lost
      updatedAt: new Date(),
    };
    this._persistData();
    return { success: true, message: 'Configurações atualizadas com sucesso (dados de exemplo).' };
  }

  // --- Stubs for now ---
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { console.warn("[SampleDataAdapter] answerQuestion not implemented."); return { success: false, message: 'Not implemented.' }; }
  async getAuctionsByIds(ids: string[]): Promise<Auction[]> { console.warn("[SampleDataAdapter] getAuctionsByIds not implemented."); return []; }
  async getLotsByIds(ids: string[]): Promise<Lot[]> { console.warn("[SampleDataAdapter] getLotsByIds not implemented."); return []; }
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
}