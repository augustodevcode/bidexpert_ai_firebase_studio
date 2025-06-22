// src/lib/database/sample-data.adapter.ts
import type {
  IDatabaseAdapter, LotCategory, StateInfo, StateFormData, CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData, SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData, AuctionDbData, Lot, LotFormData, LotDbData,
  BidInfo, Review, LotQuestion, UserProfileData, EditableUserProfileData,
  UserProfileWithPermissions, Role, RoleFormData, MediaItem, PlatformSettings,
  PlatformSettingsFormData, Subcategory, SubcategoryFormData
} from '@/types';
import {
  slugify, getSampleData
} from '@/lib/sample-data';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';


// This adapter simulates a database using the static data from sample-data.ts
// It now reads from/writes to a .json file for persistence across server restarts.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const dataFilePath = path.join(process.cwd(), 'sample-data.local.json');

type SampleDataContainer = ReturnType<typeof getSampleData>;

export class SampleDataAdapter implements IDatabaseAdapter {
  private data: SampleDataContainer;

  constructor() {
    this.data = this._loadData();
    console.log("[SampleDataAdapter] Instance created. Using data source:", fs.existsSync(dataFilePath) ? dataFilePath : "in-memory default");
  }

  private _loadData(): SampleDataContainer {
    const pristineData = getSampleData();
    try {
      if (fs.existsSync(dataFilePath)) {
        console.log(`[SampleDataAdapter] Loading data from ${dataFilePath}`);
        const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
        // Revive dates from string format
        const parsedData = JSON.parse(fileContent, (key, value) => {
           if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                return new Date(value);
            }
            return value;
        });
        // Merge with defaults to ensure all keys are present, preventing crashes from incomplete files.
        return { ...pristineData, ...parsedData };
      }
    } catch (error) {
      console.error(`[SampleDataAdapter] Error loading from ${dataFilePath}, falling back to default. Error:`, error);
    }
    // Fallback to pristine data if file doesn't exist or fails to parse
    // The file will be created on the first mutation.
    return pristineData;
  }
  
  private async _persistData(): Promise<void> {
    try {
        console.log(`[SampleDataAdapter] Persisting data changes to ${dataFilePath}`);
        await fs.promises.writeFile(dataFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`[SampleDataAdapter] CRITICAL: Failed to persist data to ${dataFilePath}`, error);
    }
  }


  async initializeSchema(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    return Promise.resolve({ success: true, message: 'Sample data adapter ready.', rolesProcessed: this.data.sampleRoles.length });
  }

  // --- LotCategory ---
  async createLotCategory(data: { name: string; description?: string; hasSubcategories?: boolean }): Promise<{ success: boolean; message: string; categoryId?: string }> {
    console.log(`[SampleDataAdapter] Creating LotCategory: ${data.name}`);
    await delay(50);
    const newCategory: LotCategory = {
        ...data,
        id: `cat-${slugify(data.name)}`,
        slug: slugify(data.name),
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    this.data.sampleLotCategories.push(newCategory);
    await this._persistData();
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: newCategory.id };
  }

  async getLotCategories(): Promise<LotCategory[]> {
    console.log('[SampleDataAdapter] Fetching LotCategories.');
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleLotCategories)));
  }

  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    console.log(`[SampleDataAdapter] Fetching LotCategory by id/slug: ${idOrSlug}`);
    await delay(20);
    const category = this.data.sampleLotCategories.find(cat => cat.id === idOrSlug || cat.slug === idOrSlug);
    return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
  }

  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    console.log(`[SampleDataAdapter] Fetching LotCategory by name: ${name}`);
    await delay(20);
    const normalizedName = name.trim().toLowerCase();
    const category = this.data.sampleLotCategories.find(cat => cat.name.toLowerCase() === normalizedName);
    return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
  }
  
  async updateLotCategory(id: string, data: { name: string; description?: string; hasSubcategories?: boolean }): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Updating LotCategory ID: ${id}`);
    await delay(50);
    const index = this.data.sampleLotCategories.findIndex(c => c.id === id);
    if(index === -1) return { success: false, message: 'Categoria não encontrada.' };
    this.data.sampleLotCategories[index] = { ...this.data.sampleLotCategories[index], ...data, slug: slugify(data.name), updatedAt: new Date() };
    await this._persistData();
    return { success: true, message: 'Categoria atualizada com sucesso!' };
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Deleting LotCategory ID: ${id}`);
    await delay(50);
    const initialLength = this.data.sampleLotCategories.length;
    this.data.sampleLotCategories = this.data.sampleLotCategories.filter(c => c.id !== id);
    if (this.data.sampleLotCategories.length < initialLength) {
        await this._persistData();
        return { success: true, message: 'Categoria excluída com sucesso!' };
    }
    return { success: false, message: 'Categoria não encontrada.' };
  }

  // --- Subcategory ---
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    await delay(50);
    const parentCat = this.data.sampleLotCategories.find(c => c.id === data.parentCategoryId);
    if (!parentCat) return { success: false, message: "Categoria principal não encontrada." };
    
    const newSubcategory: Subcategory = {
        ...data,
        id: `subcat-${parentCat.slug}-${slugify(data.name)}`,
        slug: slugify(data.name),
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentCategoryName: parentCat.name,
    };
    this.data.sampleSubcategories.push(newSubcategory);
    await this._persistData();
    return { success: true, message: 'Subcategoria criada!', subcategoryId: newSubcategory.id };
  }
  
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    await delay(20);
    const subcategories = this.data.sampleSubcategories.filter(sub => sub.parentCategoryId === parentCategoryId);
    return Promise.resolve(JSON.parse(JSON.stringify(subcategories)));
  }

  async getSubcategory(id: string): Promise<Subcategory | null> {
    await delay(20);
    const subcategory = this.data.sampleSubcategories.find(sub => sub.id === id);
    return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }

  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    await delay(20);
    const subcategory = this.data.sampleSubcategories.find(sub => sub.slug === slug && sub.parentCategoryId === parentCategoryId);
    return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }
  
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    const index = this.data.sampleSubcategories.findIndex(s => s.id === id);
    if(index === -1) return { success: false, message: 'Subcategoria não encontrada.' };
    this.data.sampleSubcategories[index] = { ...this.data.sampleSubcategories[index], ...data, slug: slugify(data.name || this.data.sampleSubcategories[index].name), updatedAt: new Date() };
    await this._persistData();
    return { success: true, message: 'Subcategoria atualizada!' };
  }
  
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    const initialLength = this.data.sampleSubcategories.length;
    this.data.sampleSubcategories = this.data.sampleSubcategories.filter(s => s.id !== id);
    if (this.data.sampleSubcategories.length < initialLength) {
        await this._persistData();
        return { success: true, message: 'Subcategoria excluída!' };
    }
    return { success: false, message: 'Subcategoria não encontrada.' };
  }

  // --- States and Cities ---
  async getStates(): Promise<StateInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleStates))); }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> { await delay(20); const state = this.data.sampleStates.find(s => s.id === idOrSlugOrUf || s.slug === idOrSlugOrUf || s.uf === idOrSlugOrUf.toUpperCase()); return Promise.resolve(state ? JSON.parse(JSON.stringify(state)) : null); }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { await delay(20); let cities = this.data.sampleCities; if (stateIdOrSlugFilter) { const state = await this.getState(stateIdOrSlugFilter); if (state) { cities = cities.filter(c => c.stateId === state.id); } else { return Promise.resolve([]); } } return Promise.resolve(JSON.parse(JSON.stringify(cities))); }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> { await delay(20); const city = this.data.sampleCities.find(c => c.id === idOrCompositeSlug || `${c.stateId}-${c.slug}` === idOrCompositeSlug); return Promise.resolve(city ? JSON.parse(JSON.stringify(city)) : null); }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string }> { await delay(50); const newState: StateInfo = { ...data, id: `state-${data.uf.toLowerCase()}`, slug: slugify(data.name), cityCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.data.sampleStates.push(newState); await this._persistData(); return { success: true, message: 'Estado criado!', stateId: newState.id }; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string }> { await delay(50); const index = this.data.sampleStates.findIndex(s => s.id === id); if(index === -1) return {success: false, message: 'Estado não encontrado.'}; this.data.sampleStates[index] = {...this.data.sampleStates[index], ...data, slug: slugify(data.name || this.data.sampleStates[index].name), updatedAt: new Date()}; await this._persistData(); return {success: true, message: 'Estado atualizado!'}; }
  async deleteState(id: string): Promise<{ success: boolean; message: string }> { await delay(50); this.data.sampleStates = this.data.sampleStates.filter(s => s.id !== id); await this._persistData(); return {success: true, message: 'Estado excluído!'}; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string }> { const state = await this.getState(data.stateId); if (!state) return {success: false, message: 'Estado não encontrado.'}; const newCity: CityInfo = { ...data, id: `city-${slugify(data.name)}-${state.uf.toLowerCase()}`, slug: slugify(data.name), stateUf: state.uf, lotCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.data.sampleCities.push(newCity); await this._persistData(); return { success: true, message: 'Cidade criada!', cityId: newCity.id }; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }> { const index = this.data.sampleCities.findIndex(c => c.id === id); if(index === -1) return {success: false, message: 'Cidade não encontrada.'}; this.data.sampleCities[index] = {...this.data.sampleCities[index], ...data, slug: slugify(data.name || this.data.sampleCities[index].name), updatedAt: new Date()}; await this._persistData(); return {success: true, message: 'Cidade atualizada!'}; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string }> { this.data.sampleCities = this.data.sampleCities.filter(c => c.id !== id); await this._persistData(); return {success: true, message: 'Cidade excluída!'}; }

  // --- Auctioneers & Sellers ---
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctioneers))); }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { await delay(20); const item = this.data.sampleAuctioneers.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId || a.slug === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> { return this.getAuctioneer(slugOrPublicId); }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { await delay(20); const item = this.data.sampleAuctioneers.find(a => a.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { const slug = slugify(data.name); const newAuct: AuctioneerProfileInfo = {...data, id: `auct-${slug}`, publicId: `AUCT-PUB-${uuidv4()}`, slug, createdAt: new Date(), updatedAt: new Date()}; this.data.sampleAuctioneers.push(newAuct); await this._persistData(); return {success: true, message: 'Leiloeiro criado!', auctioneerId: newAuct.id, auctioneerPublicId: newAuct.publicId}; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleAuctioneers.findIndex(a => a.id === id || a.publicId === id); if(index === -1) return {success: false, message: 'Leiloeiro não encontrado.'}; this.data.sampleAuctioneers[index] = {...this.data.sampleAuctioneers[index], ...data, slug: slugify(data.name || this.data.sampleAuctioneers[index].name), updatedAt: new Date()}; await this._persistData(); return {success: true, message: 'Leiloeiro atualizado!'}; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleAuctioneers = this.data.sampleAuctioneers.filter(a => a.id !== id && a.publicId !== id); await this._persistData(); return {success: true, message: 'Leiloeiro excluído!'}; }
  
  async getSellers(): Promise<SellerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleSellers))); }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { await delay(20); const item = this.data.sampleSellers.find(s => s.id === idOrPublicId || s.publicId === idOrPublicId || s.slug === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> { return this.getSeller(slugOrPublicId); }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { await delay(20); const item = this.data.sampleSellers.find(s => s.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { const slug = slugify(data.name); const newSeller: SellerProfileInfo = {...data, id: `seller-${slug}`, publicId: `SELL-PUB-${uuidv4()}`, slug, createdAt: new Date(), updatedAt: new Date()}; this.data.sampleSellers.push(newSeller); await this._persistData(); return {success: true, message: 'Comitente criado!', sellerId: newSeller.id, sellerPublicId: newSeller.publicId}; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleSellers.findIndex(s => s.id === id || s.publicId === id); if(index === -1) return {success: false, message: 'Comitente não encontrado.'}; this.data.sampleSellers[index] = {...this.data.sampleSellers[index], ...data, slug: slugify(data.name || this.data.sampleSellers[index].name), updatedAt: new Date()}; await this._persistData(); return {success: true, message: 'Comitente atualizado!'}; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleSellers = this.data.sampleSellers.filter(s => s.id !== id && s.publicId !== id); await this._persistData(); return {success: true, message: 'Comitente excluído!'}; }

  // --- Auctions & Lots ---
  async getAuctions(): Promise<Auction[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctions))); }
  async getAuction(idOrPublicId: string): Promise<Auction | null> { await delay(20); const item = this.data.sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> { const seller = await this.getSellerBySlug(sellerSlugOrPublicId); if (!seller) return Promise.resolve([]); const items = this.data.sampleAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name); return Promise.resolve(JSON.parse(JSON.stringify(items))); }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { const newAuction: Auction = {...(data as any), id: `auc-${uuidv4()}`, publicId: `AUC-PUB-${uuidv4()}`, createdAt: new Date(), updatedAt: new Date(), lots:[], totalLots:0}; this.data.sampleAuctions.push(newAuction); await this._persistData(); return {success: true, message: 'Leilão criado!', auctionId: newAuction.id, auctionPublicId: newAuction.publicId}; }
  async updateAuction(id: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleAuctions.findIndex(a => a.id === id || a.publicId === id); if(index === -1) return {success: false, message: 'Leilão não encontrado.'}; this.data.sampleAuctions[index] = {...this.data.sampleAuctions[index], ...data, updatedAt: new Date()}; await this._persistData(); return {success: true, message: 'Leilão atualizado!'}; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleAuctions = this.data.sampleAuctions.filter(a => a.id !== id && a.publicId !== id); this.data.sampleLots = this.data.sampleLots.filter(l => l.auctionId !== id); await this._persistData(); return {success: true, message: 'Leilão excluído!'}; }
  
  async getLots(auctionIdParam?: string): Promise<Lot[]> { await delay(20); let lots = this.data.sampleLots; if (auctionIdParam) { const auction = await this.getAuction(auctionIdParam); if (auction) { lots = lots.filter(l => l.auctionId === auction.id || l.auctionId === auction.publicId); } else { return Promise.resolve([]); } } return Promise.resolve(JSON.parse(JSON.stringify(lots))); }
  async getLot(idOrPublicId: string): Promise<Lot | null> { await delay(20); const item = this.data.sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> { const newLot: Lot = {...(data as any), id: `lot-${uuidv4()}`, publicId: `LOT-PUB-${uuidv4()}`, createdAt: new Date(), updatedAt: new Date()}; this.data.sampleLots.push(newLot); await this._persistData(); return {success: true, message: 'Lote criado!', lotId: newLot.id, lotPublicId: newLot.publicId}; }
  async updateLot(id: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleLots.findIndex(l => l.id === id || l.publicId === id); if(index === -1) return {success: false, message: 'Lote não encontrado.'}; this.data.sampleLots[index] = {...this.data.sampleLots[index], ...data, updatedAt: new Date()}; await this._persistData(); return {success: true, message: 'Lote atualizado!'}; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { this.data.sampleLots = this.data.sampleLots.filter(l => l.id !== id && l.publicId !== id); await this._persistData(); return {success: true, message: 'Lote excluído!'}; }

  // --- Bids, Reviews, Questions ---
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleBids.filter(b => b.lotId === lotId)))); }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status">>; newBid?: BidInfo }> { const lotIndex = this.data.sampleLots.findIndex(l => l.id === lotId || l.publicId === lotId); if(lotIndex === -1) return { success: false, message: "Lote não encontrado."}; const lot = this.data.sampleLots[lotIndex]; if(bidAmount <= lot.price) return {success: false, message: 'Lance deve ser maior que o atual.'}; const newBid: BidInfo = { id: `bid-${uuidv4()}`, lotId, auctionId, bidderId: userId, bidderDisplay: userDisplayName, amount: bidAmount, timestamp: new Date() }; this.data.sampleBids.unshift(newBid); this.data.sampleLots[lotIndex] = {...lot, price: bidAmount, bidsCount: (lot.bidsCount || 0) + 1}; await this._persistData(); return { success: true, message: "Lance registrado!", updatedLot: {price: bidAmount, bidsCount: lot.bidsCount}, newBid }; }
  async getReviewsForLot(lotId: string): Promise<Review[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleLotReviews.filter(r => r.lotId === lotId)))); }
  async createReview(reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string | undefined; }> { const newReview: Review = {...reviewData, id: `rev-${uuidv4()}`, createdAt: new Date()}; this.data.sampleLotReviews.unshift(newReview); await this._persistData(); return { success: true, message: "Avaliação adicionada!", reviewId: newReview.id }; }
  async getQuestionsForLot(lotId: string): Promise<LotQuestion[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleLotQuestions.filter(q => q.lotId === lotId)))); }
  async createQuestion(questionData: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string | undefined; }> { const newQuestion: LotQuestion = {...questionData, id: `qst-${uuidv4()}`, createdAt: new Date(), isPublic: true}; this.data.sampleLotQuestions.unshift(newQuestion); await this._persistData(); return { success: true, message: "Pergunta enviada!", questionId: newQuestion.id }; }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleLotQuestions.findIndex(q => q.id === questionId); if(index === -1) return {success: false, message: 'Pergunta não encontrada.'}; this.data.sampleLotQuestions[index] = {...this.data.sampleLotQuestions[index], answerText, answeredByUserId, answeredByUserDisplayName, answeredAt: new Date()}; await this._persistData(); return {success: true, message: 'Pergunta respondida!'}; }
  
  // --- Roles ---
  async getRoles(): Promise<Role[]> {
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleRoles)));
  }

  async getRole(id: string): Promise<Role | null> {
    await delay(20);
    const role = this.data.sampleRoles.find(r => r.id === id);
    return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null);
  }

  async getRoleByName(name: string): Promise<Role | null> {
    await delay(20);
    const role = this.data.sampleRoles.find(r => r.name_normalized === name.toUpperCase());
    return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null);
  }

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    await delay(50);
    const normalizedName = data.name.trim().toUpperCase();
    if (this.data.sampleRoles.some(r => r.name_normalized === normalizedName)) {
      return { success: false, message: `Perfil "${data.name}" já existe.` };
    }
    const newRole: Role = {
      ...data,
      id: `role-${slugify(data.name)}`,
      name_normalized: normalizedName,
      permissions: data.permissions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.sampleRoles.push(newRole);
    await this._persistData();
    return { success: true, message: 'Perfil criado!', roleId: newRole.id };
  }

  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    const index = this.data.sampleRoles.findIndex(r => r.id === id);
    if (index === -1) return { success: false, message: 'Perfil não encontrado.' };
    const currentRole = this.data.sampleRoles[index];
    if (['ADMINISTRATOR', 'USER'].includes(currentRole.name_normalized)) {
      if (data.name && currentRole.name !== data.name) return { success: false, message: "Não é permitido alterar o nome de perfis padrão." };
    }
    this.data.sampleRoles[index] = { ...currentRole, ...data, updatedAt: new Date() };
    if (data.name) {
      this.data.sampleRoles[index].name_normalized = data.name.trim().toUpperCase();
    }
    await this._persistData();
    return { success: true, message: 'Perfil atualizado!' };
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    const roleToDelete = this.data.sampleRoles.find(r => r.id === id);
    if (!roleToDelete) return { success: false, message: 'Perfil não encontrado.' };
    if (['ADMINISTRATOR', 'USER'].includes(roleToDelete.name_normalized)) {
      return { success: false, message: 'Perfis de sistema não podem ser excluídos.' };
    }
    this.data.sampleRoles = this.data.sampleRoles.filter(r => r.id !== id);
    await this._persistData();
    return { success: true, message: 'Perfil excluído!' };
  }

  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> { return Promise.resolve({ success: true, message: 'Default roles ensured.', rolesProcessed: this.data.sampleRoles.length }); }
  
  // --- Users ---
  async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleUserProfiles)));
  }
  
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    await delay(20);
    const user = this.data.sampleUserProfiles.find(u => u.uid === userId);
    return Promise.resolve(user ? JSON.parse(JSON.stringify(user)) : null);
  }
  
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    await delay(20);
    const user = this.data.sampleUserProfiles.find(u => u.email.toLowerCase() === email.toLowerCase());
    return Promise.resolve(user ? JSON.parse(JSON.stringify(user)) : null);
  }

  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    const userIndex = this.data.sampleUserProfiles.findIndex(u => u.uid === userId);
    if (userIndex === -1) return { success: false, message: 'Usuário não encontrado.' };
    
    if (roleId) {
      const role = await this.getRole(roleId);
      if (!role) return { success: false, message: 'Perfil não encontrado.' };
      this.data.sampleUserProfiles[userIndex].roleId = role.id;
      this.data.sampleUserProfiles[userIndex].roleName = role.name;
      this.data.sampleUserProfiles[userIndex].permissions = role.permissions;
    } else {
      this.data.sampleUserProfiles[userIndex].roleId = null;
      this.data.sampleUserProfiles[userIndex].roleName = 'Não Definido';
      this.data.sampleUserProfiles[userIndex].permissions = [];
    }
    this.data.sampleUserProfiles[userIndex].updatedAt = new Date();
    await this._persistData();
    return { success: true, message: 'Perfil do usuário atualizado!' };
  }
  
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<UserProfileData>, roleIdToAssign?: string | undefined): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions | undefined; }> { 
    const existing = await this.getUserByEmail(email); 
    if(existing) {
        console.log(`[SampleDataAdapter - ensureUserRole] Found existing user: ${email}`);
        return { success: true, message: 'User profile exists (SampleData).', userProfile: existing };
    }
    console.log(`[SampleDataAdapter - ensureUserRole] User not found, creating new profile for: ${email}`);
    const role = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER'); 
    const newUser: UserProfileWithPermissions = { uid: userId, email, fullName: fullName || email.split('@')[0], roleId: role?.id, roleName: role?.name, permissions: role?.permissions || [], status: 'ATIVO', habilitationStatus: 'PENDENTE_DOCUMENTOS', ...(additionalProfileData || {}), createdAt: new Date(), updatedAt: new Date() };
    this.data.sampleUserProfiles.push(newUser);
    await this._persistData();
    return { success: true, message: 'User profile ensured (SampleData).', userProfile: newUser }; 
  }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { this.data.sampleUserProfiles = this.data.sampleUserProfiles.filter(u => u.uid !== userId); await this._persistData(); return {success: true, message: 'Usuário excluído!'}; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleUserProfiles.findIndex(u => u.uid === userId); if(index === -1) return {success: false, message: 'Usuário não encontrado.'}; this.data.sampleUserProfiles[index] = {...this.data.sampleUserProfiles[index], ...data, updatedAt: new Date()}; await this._persistData(); return {success: true, message: 'Perfil atualizado!'}; }

  // --- Media ---
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { const newItem: MediaItem = {...data, id: `media-${uuidv4()}`, storagePath: filePublicUrl, uploadedAt: new Date(), urlOriginal: filePublicUrl, urlThumbnail: filePublicUrl, urlMedium: filePublicUrl, urlLarge: filePublicUrl, uploadedBy: uploadedBy || 'system', linkedLotIds:[]}; this.data.sampleMediaItems.unshift(newItem); await this._persistData(); return {success: true, message: 'Mídia criada!', item: newItem}; }
  async getMediaItems(): Promise<MediaItem[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleMediaItems))); }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleMediaItems.findIndex(m => m.id === id); if(index === -1) return {success: false, message: 'Mídia não encontrada.'}; this.data.sampleMediaItems[index] = {...this.data.sampleMediaItems[index], ...metadata}; await this._persistData(); return {success: true, message: 'Metadados da mídia atualizados!'}; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleMediaItems = this.data.sampleMediaItems.filter(m => m.id !== id); await this._persistData(); return {success: true, message: 'Mídia excluída!'}; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { const lotIndex = this.data.sampleLots.findIndex(l => l.id === lotId || l.publicId === lotId); if(lotIndex === -1) return {success: false, message: 'Lote não encontrado.'}; const lot = this.data.sampleLots[lotIndex]; lot.mediaItemIds = Array.from(new Set([...(lot.mediaItemIds || []), ...mediaItemIds])); mediaItemIds.forEach(mediaId => { const mediaIndex = this.data.sampleMediaItems.findIndex(m => m.id === mediaId); if(mediaIndex > -1) { this.data.sampleMediaItems[mediaIndex].linkedLotIds = Array.from(new Set([...(this.data.sampleMediaItems[mediaIndex].linkedLotIds || []), lotId])); }}); await this._persistData(); return {success: true, message: 'Mídia vinculada!'}; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { const lotIndex = this.data.sampleLots.findIndex(l => l.id === lotId || l.publicId === lotId); if(lotIndex > -1) { this.data.sampleLots[lotIndex].mediaItemIds = (this.data.sampleLots[lotIndex].mediaItemIds || []).filter(id => id !== mediaItemId); } const mediaIndex = this.data.sampleMediaItems.findIndex(m => m.id === mediaItemId); if(mediaIndex > -1) { this.data.sampleMediaItems[mediaIndex].linkedLotIds = (this.data.sampleMediaItems[mediaIndex].linkedLotIds || []).filter(id => id !== lotId); } await this._persistData(); return {success: true, message: 'Mídia desvinculada!'}; }

   // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    console.log('[SampleDataAdapter] Fetching PlatformSettings.');
    await delay(10);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.samplePlatformSettings)));
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Updating PlatformSettings.`);
    await delay(50);
    this.data.samplePlatformSettings = { ...this.data.samplePlatformSettings, ...data, id: 'global', updatedAt: new Date() };
    await this._persistData();
    return { success: true, message: "Configurações da plataforma atualizadas (Sample Data)!" };
  }
}
