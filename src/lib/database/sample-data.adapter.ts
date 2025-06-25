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
  DirectSaleOffer,
  UserLotMaxBid,
  UserWin
} from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import * as sampleData from '@/lib/sample-data'; // Import all exports from the new sample-data.ts

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SampleDataAdapter implements IDatabaseAdapter {
  private data: typeof sampleData;

  constructor() {
    this.data = { ...sampleData };
    console.log("[SampleDataAdapter] Instance created and data imported from module.");
  }
  
  private _persistData(): void {
    console.log(`[SampleDataAdapter] In-memory data updated. Persistence to file is not implemented in this version.`);
  }

  private resolveMediaUrl(mediaId: string | null | undefined): string | undefined {
    if (!mediaId) return undefined;
    const mediaItem = this.data.sampleMediaItems.find((m) => m.id === mediaId);
    return mediaItem?.urlOriginal;
  }

  async initializeSchema(): Promise<{ success: boolean; message:string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    return Promise.resolve({ success: true, message: 'Sample data adapter ready.', rolesProcessed: this.data.sampleRoles.length });
  }

  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo }> {
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

    // Update lot data
    lot.price = bidAmount;
    lot.bidsCount = (lot.bidsCount || 0) + 1;

    // Soft-close logic
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
            console.log(`[SampleDataAdapter - placeBidOnLot] Soft-close triggered. New end date: ${newEndDate.toISOString()}`);
        }
    }

    // Create new bid info
    const newBid: BidInfo = {
      id: `bid-${uuidv4()}`,
      lotId: lot.id,
      auctionId: lot.auctionId,
      bidderId: userId,
      bidderDisplay: userDisplayName,
      amount: bidAmount,
      timestamp: new Date(),
    };
    this.data.sampleBids.unshift(newBid);

    this._persistData();

    return { 
      success: true, 
      message: 'Lance registrado com sucesso!',
      updatedLot: { price: lot.price, bidsCount: lot.bidsCount, endDate: updatedEndDate },
      newBid,
    };
  }

  async getWinsForUser(userId: string): Promise<UserWin[]> {
    await delay(20);
    const wins = this.data.sampleUserWins.filter((w: UserWin) => w.userId === userId);
    // Populate the lot data for each win, as the type requires it.
    const populatedWins = wins.map(win => {
        const lotForWin = this.data.sampleLots.find(l => l.id === win.lot.id || l.publicId === win.lot.id);
        return {
            ...win,
            lot: lotForWin || win.lot // Fallback to potentially partial data if full lot not found
        };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(populatedWins)));
  }


  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    await delay(20);
    const seller = this.data.sampleSellers.find((s: SellerProfileInfo) => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId);
    if (!seller) return Promise.resolve([]);
    const items = this.data.sampleAuctions.filter((a: Auction) => a.sellerId === seller.id || a.seller === seller.name);
    return Promise.resolve(JSON.parse(JSON.stringify(items)));
  }

  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
    await delay(20);
    const auctioneer = this.data.sampleAuctioneers.find((a: AuctioneerProfileInfo) => a.slug === auctioneerSlugOrPublicId || a.publicId === auctioneerSlugOrPublicId);
    if (!auctioneer) return Promise.resolve([]);
    const items = this.data.sampleAuctions.filter((a: Auction) => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
    return Promise.resolve(JSON.parse(JSON.stringify(items)));
  }

  async getLotCategories(): Promise<LotCategory[]> {
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleLotCategories)));
  }

  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    await delay(20);
    const category = this.data.sampleLotCategories.find((cat: LotCategory) => cat.id === idOrSlug || cat.slug === idOrSlug);
    return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
  }

  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    await delay(20);
    const category = this.data.sampleLotCategories.find((cat: LotCategory) => cat.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(category ? JSON.parse(JSON.stringify(category)) : null);
  }

  async createLotCategory(data: { name: string; description?: string; hasSubcategories?: boolean }): Promise<{ success: boolean; message: string; categoryId?: string }> {
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
    this._persistData();
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: newCategory.id };
  }
  
  async updateLotCategory(id: string, data: Partial<{ name: string; description?: string; hasSubcategories?: boolean; }>): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    const index = this.data.sampleLotCategories.findIndex((c: LotCategory) => c.id === id);
    if(index === -1) return { success: false, message: 'Categoria não encontrada.' };
    this.data.sampleLotCategories[index] = { 
      ...this.data.sampleLotCategories[index], 
      ...data, 
      slug: data.name ? slugify(data.name) : this.data.sampleLotCategories[index].slug,
      updatedAt: new Date() 
    };
    this._persistData();
    return { success: true, message: 'Categoria atualizada com sucesso!' };
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    this.data.sampleLotCategories = this.data.sampleLotCategories.filter((c: LotCategory) => c.id !== id);
    this._persistData();
    return { success: true, message: 'Categoria excluída com sucesso!' };
  }

  // --- Subcategory ---
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    await delay(50);
    const parentCat = this.data.sampleLotCategories.find((c: LotCategory) => c.id === data.parentCategoryId);
    if (!parentCat) return { success: false, message: "Categoria principal não encontrada." };
    
    const newSubcategory: Subcategory = {
        ...data, id: `subcat-${parentCat.slug}-${slugify(data.name)}`, slug: slugify(data.name),
        itemCount: 0, createdAt: new Date(), updatedAt: new Date(), parentCategoryName: parentCat.name,
    };
    this.data.sampleSubcategories.push(newSubcategory);
    this._persistData();
    return { success: true, message: 'Subcategoria criada!', subcategoryId: newSubcategory.id };
  }
  
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    await delay(20);
    const subcategories = this.data.sampleSubcategories.filter((sub: Subcategory) => sub.parentCategoryId === parentCategoryId);
    return Promise.resolve(JSON.parse(JSON.stringify(subcategories)));
  }

  async getSubcategory(id: string): Promise<Subcategory | null> {
    await delay(20);
    const subcategory = this.data.sampleSubcategories.find((sub: Subcategory) => sub.id === id);
    return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }

  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    await delay(20);
    const subcategory = this.data.sampleSubcategories.find((sub: Subcategory) => sub.slug === slug && sub.parentCategoryId === parentCategoryId);
    return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }
  
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    const index = this.data.sampleSubcategories.findIndex((s: Subcategory) => s.id === id);
    if(index === -1) return { success: false, message: 'Subcategoria não encontrada.' };
    this.data.sampleSubcategories[index] = { ...this.data.sampleSubcategories[index], ...data, slug: data.name ? slugify(data.name) : this.data.sampleSubcategories[index].slug, updatedAt: new Date() };
    this._persistData();
    return { success: true, message: 'Subcategoria atualizada!' };
  }
  
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    await delay(50);
    this.data.sampleSubcategories = this.data.sampleSubcategories.filter((s: Subcategory) => s.id !== id);
    this._persistData();
    return { success: true, message: 'Subcategoria excluída!' };
  }

  // --- States and Cities ---
  async getStates(): Promise<StateInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleStates))); }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> { await delay(20); const state = this.data.sampleStates.find((s: StateInfo) => s.id === idOrSlugOrUf || s.slug === idOrSlugOrUf || s.uf === idOrSlugOrUf.toUpperCase()); return Promise.resolve(state ? JSON.parse(JSON.stringify(state)) : null); }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { await delay(20); let cities = this.data.sampleCities; if (stateIdOrSlugFilter) { const state = await this.getState(stateIdOrSlugFilter); if (state) { cities = cities.filter((c: CityInfo) => c.stateId === state.id); } else { return Promise.resolve([]); } } return Promise.resolve(JSON.parse(JSON.stringify(cities))); }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> { await delay(20); const city = this.data.sampleCities.find((c: CityInfo) => c.id === idOrCompositeSlug || `${c.stateId}-${c.slug}` === idOrCompositeSlug); return Promise.resolve(city ? JSON.parse(JSON.stringify(city)) : null); }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string }> { await delay(50); const newState: StateInfo = { ...data, id: `state-${data.uf.toLowerCase()}`, slug: slugify(data.name), cityCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.data.sampleStates.push(newState); this._persistData(); return { success: true, message: 'Estado criado!', stateId: newState.id }; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string }> { await delay(50); const index = this.data.sampleStates.findIndex((s: StateInfo) => s.id === id); if(index === -1) return {success: false, message: 'Estado não encontrado.'}; this.data.sampleStates[index] = {...this.data.sampleStates[index], ...data, slug: data.name ? slugify(data.name) : this.data.sampleStates[index].name, updatedAt: new Date()}; this._persistData(); return {success: true, message: 'Estado atualizado!'}; }
  async deleteState(id: string): Promise<{ success: boolean; message: string }> { await delay(50); this.data.sampleStates = this.data.sampleStates.filter((s: StateInfo) => s.id !== id); this._persistData(); return {success: true, message: 'Estado excluído!'}; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string }> { const state = await this.getState(data.stateId); if (!state) return {success: false, message: 'Estado não encontrado.'}; const newCity: CityInfo = { ...data, id: `city-${slugify(data.name)}-${state.uf.toLowerCase()}`, slug: slugify(data.name), stateUf: state.uf, lotCount: 0, createdAt: new Date(), updatedAt: new Date() }; this.data.sampleCities.push(newCity); this._persistData(); return { success: true, message: 'Cidade criada!', cityId: newCity.id }; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }> { const index = this.data.sampleCities.findIndex((c: CityInfo) => c.id === id); if(index === -1) return {success: false, message: 'Cidade não encontrada.'}; this.data.sampleCities[index] = {...this.data.sampleCities[index], ...data, slug: data.name ? slugify(data.name) : this.data.sampleCities[index].slug, updatedAt: new Date()}; this._persistData(); return {success: true, message: 'Cidade atualizada!'}; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string }> { this.data.sampleCities = this.data.sampleCities.filter((c: CityInfo) => c.id !== id); this._persistData(); return {success: true, message: 'Cidade excluída!'}; }

  // --- Auctioneers & Sellers ---
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctioneers))); }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { await delay(20); const item = this.data.sampleAuctioneers.find((a: AuctioneerProfileInfo) => a.id === idOrPublicId || a.publicId === idOrPublicId || a.slug === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { await delay(20); const item = this.data.sampleAuctioneers.find((a: AuctioneerProfileInfo) => a.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { const slug = slugify(data.name); const newAuct: AuctioneerProfileInfo = {...data, id: `auct-${slug}`, publicId: `AUCT-PUB-${uuidv4().substring(0, 8)}`, slug, createdAt: new Date(), updatedAt: new Date()}; this.data.sampleAuctioneers.push(newAuct); this._persistData(); return {success: true, message: 'Leiloeiro criado!', auctioneerId: newAuct.id, auctioneerPublicId: newAuct.publicId}; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleAuctioneers.findIndex((a: AuctioneerProfileInfo) => a.id === id || a.publicId === id); if(index === -1) return {success: false, message: 'Leiloeiro não encontrado.'}; this.data.sampleAuctioneers[index] = {...this.data.sampleAuctioneers[index], ...data, slug: data.name ? slugify(data.name) : this.data.sampleAuctioneers[index].slug, updatedAt: new Date()}; this._persistData(); return {success: true, message: 'Leiloeiro atualizado!'}; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleAuctioneers = this.data.sampleAuctioneers.filter((a: AuctioneerProfileInfo) => a.id !== id && a.publicId !== id); this._persistData(); return {success: true, message: 'Leiloeiro excluído!'}; }
  
  async getSellers(): Promise<SellerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleSellers))); }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { await delay(20); const item = this.data.sampleSellers.find((s: SellerProfileInfo) => s.id === idOrPublicId || s.publicId === idOrPublicId || s.slug === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { await delay(20); const item = this.data.sampleSellers.find((s: SellerProfileInfo) => s.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { const slug = slugify(data.name); const newSeller: SellerProfileInfo = {...data, id: `seller-${slug}`, publicId: `SELL-PUB-${uuidv4().substring(0,8)}`, slug, createdAt: new Date(), updatedAt: new Date()}; this.data.sampleSellers.push(newSeller); this._persistData(); return {success: true, message: 'Comitente criado!', sellerId: newSeller.id, sellerPublicId: newSeller.publicId}; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleSellers.findIndex((s: SellerProfileInfo) => s.id === id || s.publicId === id); if(index === -1) return {success: false, message: 'Comitente não encontrado.'}; this.data.sampleSellers[index] = {...this.data.sampleSellers[index], ...data, slug: data.name ? slugify(data.name) : this.data.sampleSellers[index].slug, updatedAt: new Date()}; this._persistData(); return {success: true, message: 'Comitente atualizado!'}; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleSellers = this.data.sampleSellers.filter((s: SellerProfileInfo) => s.id !== id && s.publicId !== id); this._persistData(); return {success: true, message: 'Comitente excluído!'}; }

  // --- Auctions & Lots ---
  async getAuctions(): Promise<Auction[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctions))); }
  async getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    await delay(20);
    if (!ids || ids.length === 0) {
      return Promise.resolve([]);
    }
    const items = this.data.sampleAuctions.filter((a: Auction) => ids.includes(a.id) || (a.publicId && ids.includes(a.publicId)));
    return Promise.resolve(JSON.parse(JSON.stringify(items)));
  }
  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    await delay(20);
    const auction = this.data.sampleAuctions.find((a: Auction) => a.id === idOrPublicId || a.publicId === idOrPublicId);
    if (!auction) {
        return Promise.resolve(null);
    }
    // New logic: populate lots for this auction to ensure consistency
    const lotsForThisAuction = this.data.sampleLots.filter((l: Lot) => l.auctionId === auction.id);
    const auctionWithLots = { ...auction, lots: lotsForThisAuction, totalLots: lotsForThisAuction.length };
    return Promise.resolve(JSON.parse(JSON.stringify(auctionWithLots)));
  }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { const newAuction: Auction = {...(data as any), id: `auc-${uuidv4()}`, publicId: `AUC-PUB-${uuidv4()}`, createdAt: new Date(), updatedAt: new Date(), lots:[], totalLots:0}; this.data.sampleAuctions.push(newAuction); this._persistData(); return {success: true, message: 'Leilão criado!', auctionId: newAuction.id, auctionPublicId: newAuction.publicId}; }
  async updateAuction(id: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleAuctions.findIndex((a: Auction) => a.id === id || a.publicId === id); if(index === -1) return {success: false, message: 'Leilão não encontrado.'}; this.data.sampleAuctions[index] = {...this.data.sampleAuctions[index], ...data, updatedAt: new Date()}; this._persistData(); return {success: true, message: 'Leilão atualizado!'}; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleAuctions = this.data.sampleAuctions.filter((a: Auction) => a.id !== id && a.publicId !== id); this.data.sampleLots = this.data.sampleLots.filter((l: Lot) => l.auctionId !== id); this._persistData(); return {success: true, message: 'Leilão excluído!'}; }
  
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    await delay(20);
    let lots = this.data.sampleLots;
    if (auctionIdParam) {
        const auction = await this.getAuction(auctionIdParam);
        if (auction) {
            lots = lots.filter((l: Lot) => l.auctionId === auction.id || l.auctionId === auction.publicId);
        } else {
            return Promise.resolve([]);
        }
    }
    // Add auctionName to each lot for consistency
    const lotsWithAuctionName = lots.map(lot => {
        const parentAuction = this.data.sampleAuctions.find(a => a.id === lot.auctionId);
        return {
            ...lot,
            auctionName: lot.auctionName || parentAuction?.title || 'Leilão não encontrado'
        };
    });
    return Promise.resolve(JSON.parse(JSON.stringify(lotsWithAuctionName)));
  }
  async getLotsByIds(ids: string[]): Promise<Lot[]> { await delay(20); if (!ids || ids.length === 0) { return Promise.resolve([]); } const lots = this.data.sampleLots.filter((l: Lot) => ids.includes(l.id)); return Promise.resolve(JSON.parse(JSON.stringify(lots))); }
  async getLot(idOrPublicId: string): Promise<Lot | null> { await delay(20); const item = this.data.sampleLots.find((l: Lot) => l.id === idOrPublicId || l.publicId === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> { const newLot: Lot = {...(data as any), id: `lot-${uuidv4()}`, publicId: `LOT-PUB-${uuidv4()}`, createdAt: new Date(), updatedAt: new Date()}; this.data.sampleLots.push(newLot); this._persistData(); return {success: true, message: 'Lote criado!', lotId: newLot.id, lotPublicId: newLot.publicId}; }
  async updateLot(id: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleLots.findIndex((l: Lot) => l.id === id || l.publicId === id); if(index === -1) return {success: false, message: 'Lote não encontrado.'}; this.data.sampleLots[index] = {...this.data.sampleLots[index], ...data, updatedAt: new Date()}; this._persistData(); return {success: true, message: 'Lote atualizado!'}; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { this.data.sampleLots = this.data.sampleLots.filter((l: Lot) => l.id !== id && l.publicId !== id); this._persistData(); return {success: true, message: 'Lote excluído!'}; }

  // --- Bids, Reviews, Questions ---
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    await delay(20);
    const lot = this.data.sampleLots.find((l) => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
    if (!lot) {
      console.warn(`[getBidsForLot - SampleData] Lot not found for ID/PublicID: ${lotIdOrPublicId}`);
      return Promise.resolve([]);
    }
    const bids = this.data.sampleBids.filter((b: BidInfo) => b.lotId === lot.id);
    return Promise.resolve(JSON.parse(JSON.stringify(bids)));
  }
  async getReviewsForLot(lotId: string): Promise<Review[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleLotReviews.filter((r: Review) => r.lotId === lotId)))); }
  async createReview(reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string | undefined; }> { const newReview: Review = {...reviewData, id: `rev-${uuidv4()}`, createdAt: new Date()}; this.data.sampleLotReviews.unshift(newReview); this._persistData(); return { success: true, message: "Avaliação adicionada!", reviewId: newReview.id }; }
  async getQuestionsForLot(lotId: string): Promise<LotQuestion[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleLotQuestions.filter((q: LotQuestion) => q.lotId === lotId)))); }
  async createQuestion(questionData: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string | undefined; }> { const newQuestion: LotQuestion = {...questionData, id: `qst-${uuidv4()}`, createdAt: new Date(), isPublic: true}; this.data.sampleLotQuestions.unshift(newQuestion); this._persistData(); return { success: true, message: "Pergunta enviada!", questionId: newQuestion.id }; }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { 
    await delay(50);
    const index = this.data.sampleLotQuestions.findIndex((q: LotQuestion) => q.id === questionId && q.lotId === lotId); 
    if(index === -1) return {success: false, message: 'Pergunta não encontrada para este lote.'}; 
    this.data.sampleLotQuestions[index] = {...this.data.sampleLotQuestions[index], answerText, answeredByUserId, answeredByUserDisplayName, answeredAt: new Date()}; 
    this._persistData(); 
    return {success: true, message: 'Pergunta respondida!'}; 
  }
  
  // --- Proxy Bidding ---
  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> {
    await delay(50);
    const existingIndex = this.data.sampleUserLotMaxBids.findIndex((b: UserLotMaxBid) => b.userId === userId && b.lotId === lotId);
    if (existingIndex > -1) {
      this.data.sampleUserLotMaxBids[existingIndex] = { ...this.data.sampleUserLotMaxBids[existingIndex], maxAmount, isActive: true, updatedAt: new Date() };
      this._persistData();
      return { success: true, message: "Lance máximo atualizado.", maxBidId: this.data.sampleUserLotMaxBids[existingIndex].id };
    }
    const newMaxBid: UserLotMaxBid = { id: `proxy-${uuidv4()}`, userId, lotId, maxAmount, isActive: true, createdAt: new Date(), updatedAt: new Date() };
    this.data.sampleUserLotMaxBids.push(newMaxBid);
    this._persistData();
    return { success: true, message: "Lance máximo criado.", maxBidId: newMaxBid.id };
  }

  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    await delay(20);
    const bid = this.data.sampleUserLotMaxBids.find((b: UserLotMaxBid) => b.userId === userId && b.lotId === lotId && b.isActive);
    return Promise.resolve(bid ? JSON.parse(JSON.stringify(bid)) : null);
  }

  // --- Roles & Users ---
  async getRoles(): Promise<Role[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleRoles))); }
  async getRole(id: string): Promise<Role | null> { await delay(20); const role = this.data.sampleRoles.find((r: Role) => r.id === id); return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null); }
  async getRoleByName(name: string): Promise<Role | null> { await delay(20); const role = this.data.sampleRoles.find((r: Role) => r.name_normalized === name.toUpperCase()); return Promise.resolve(role ? JSON.parse(JSON.stringify(role)) : null); }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { await delay(50); const normalizedName = data.name.trim().toUpperCase(); if (this.data.sampleRoles.some((r: Role) => r.name_normalized === normalizedName)) { return { success: false, message: `Perfil "${data.name}" já existe.` }; } const newRole: Role = { ...data, id: `role-${slugify(data.name)}`, name_normalized: normalizedName, permissions: data.permissions || [], createdAt: new Date(), updatedAt: new Date(), }; this.data.sampleRoles.push(newRole); this._persistData(); return { success: true, message: 'Perfil criado!', roleId: newRole.id }; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { await delay(50); const index = this.data.sampleRoles.findIndex((r: Role) => r.id === id); if (index === -1) return { success: false, message: 'Perfil não encontrado.' }; const currentRole = this.data.sampleRoles[index]; if (['ADMINISTRATOR', 'USER'].includes(currentRole.name_normalized)) { if (data.name && currentRole.name !== data.name) return { success: false, message: "Não é permitido alterar o nome de perfis padrão." }; } this.data.sampleRoles[index] = { ...currentRole, ...data, updatedAt: new Date() }; if (data.name) { this.data.sampleRoles[index].name_normalized = data.name.trim().toUpperCase(); } this._persistData(); return { success: true, message: 'Perfil atualizado!' }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { await delay(50); const roleToDelete = this.data.sampleRoles.find((r: Role) => r.id === id); if (!roleToDelete) return { success: false, message: 'Perfil não encontrado.' }; if (['ADMINISTRATOR', 'USER'].includes(roleToDelete.name_normalized)) { return { success: false, message: 'Perfis de sistema não podem ser excluídos.' }; } this.data.sampleRoles = this.data.sampleRoles.filter((r: Role) => r.id !== id); this._persistData(); return { success: true, message: 'Perfil excluído!' }; }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> { return Promise.resolve({ success: true, message: 'Default roles ensured.', rolesProcessed: this.data.sampleRoles.length }); }
  async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleUserProfiles))); }
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> { await delay(20); const user = this.data.sampleUserProfiles.find((u: UserProfileData) => u.uid === userId); return Promise.resolve(user ? JSON.parse(JSON.stringify(user)) : null); }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> { await delay(20); const user = this.data.sampleUserProfiles.find((u: UserProfileData) => u.email.toLowerCase() === email.toLowerCase()); return Promise.resolve(user ? JSON.parse(JSON.stringify(user)) : null); }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { await delay(50); const userIndex = this.data.sampleUserProfiles.findIndex((u: UserProfileData) => u.uid === userId); if (userIndex === -1) return { success: false, message: 'Usuário não encontrado.' }; if (roleId) { const role = await this.getRole(roleId); if (!role) return { success: false, message: 'Perfil não encontrado.' }; this.data.sampleUserProfiles[userIndex].roleId = role.id; this.data.sampleUserProfiles[userIndex].roleName = role.name; this.data.sampleUserProfiles[userIndex].permissions = role.permissions; } else { this.data.sampleUserProfiles[userIndex].roleId = null; this.data.sampleUserProfiles[userIndex].roleName = 'Não Definido'; this.data.sampleUserProfiles[userIndex].permissions = []; } this.data.sampleUserProfiles[userIndex].updatedAt = new Date(); this._persistData(); return { success: true, message: 'Perfil do usuário atualizado!' }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<UserProfileData>, roleIdToAssign?: string | undefined): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions | undefined; }> { const existing = await this.getUserByEmail(email); if(existing) { return { success: true, message: 'User profile exists (SampleData).', userProfile: existing }; } const role = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER'); const newUser: UserProfileWithPermissions = { uid: userId, email, fullName: fullName || email.split('@')[0], roleId: role?.id, roleName: role?.name, permissions: role?.permissions || [], status: 'ATIVO', habilitationStatus: 'PENDENTE_DOCUMENTOS', ...(additionalProfileData || {}), createdAt: new Date(), updatedAt: new Date() }; this.data.sampleUserProfiles.push(newUser); this._persistData(); return { success: true, message: 'User profile ensured (SampleData).', userProfile: newUser }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { this.data.sampleUserProfiles = this.data.sampleUserProfiles.filter((u: UserProfileData) => u.uid !== userId); this._persistData(); return {success: true, message: 'Usuário excluído!'}; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleUserProfiles.findIndex((u: UserProfileData) => u.uid === userId); if(index === -1) return {success: false, message: 'Usuário não encontrado.'}; this.data.sampleUserProfiles[index] = {...this.data.sampleUserProfiles[index], ...data, updatedAt: new Date()}; this._persistData(); return {success: true, message: 'Perfil atualizado!'}; }
  
  // --- Media ---
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { const newItem: MediaItem = {...data, id: `media-${uuidv4()}`, storagePath: filePublicUrl, uploadedAt: new Date(), urlOriginal: filePublicUrl, urlThumbnail: filePublicUrl, urlMedium: filePublicUrl, urlLarge: filePublicUrl, uploadedBy: uploadedBy || 'system', linkedLotIds:[]}; this.data.sampleMediaItems.unshift(newItem); this._persistData(); return {success: true, message: 'Mídia criada!', item: newItem}; }
  async getMediaItems(): Promise<MediaItem[]> { await delay(20); const mediaItems: MediaItem[] = JSON.parse(JSON.stringify(this.data.sampleMediaItems)); const lots: Lot[] = this.data.sampleLots; mediaItems.forEach((mediaItem) => { mediaItem.linkedLotIds = []; lots.forEach((lot) => { const isMainImage = lot.imageMediaId === mediaItem.id; const isInGallery = lot.mediaItemIds?.includes(mediaItem.id); if (isMainImage || isInGallery) { const lotIdentifier = lot.publicId || lot.id; if (!mediaItem.linkedLotIds?.includes(lotIdentifier)) { mediaItem.linkedLotIds?.push(lotIdentifier); } } }); }); return Promise.resolve(mediaItems); }
  async getMediaItem(id: string): Promise<MediaItem | null> { await delay(10); const item = this.data.sampleMediaItems.find((m: MediaItem) => m.id === id); return item ? Promise.resolve(JSON.parse(JSON.stringify(item))) : Promise.resolve(null); }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> { const index = this.data.sampleMediaItems.findIndex((m: MediaItem) => m.id === id); if(index === -1) return {success: false, message: 'Mídia não encontrada.'}; this.data.sampleMediaItems[index] = {...this.data.sampleMediaItems[index], ...metadata}; this._persistData(); return {success: true, message: 'Metadados da mídia atualizados!'}; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { this.data.sampleMediaItems = this.data.sampleMediaItems.filter((m: MediaItem) => m.id !== id); this._persistData(); return {success: true, message: 'Mídia excluída!'}; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { const lotIndex = this.data.sampleLots.findIndex((l: Lot) => l.id === lotId || l.publicId === lotId); if(lotIndex === -1) return {success: false, message: 'Lote não encontrado.'}; const lot = this.data.sampleLots[lotIndex]; lot.mediaItemIds = Array.from(new Set([...(lot.mediaItemIds || []), ...mediaItemIds])); mediaItemIds.forEach(mediaId => { const mediaIndex = this.data.sampleMediaItems.findIndex((m: MediaItem) => m.id === mediaId); if(mediaIndex > -1) { this.data.sampleMediaItems[mediaIndex].linkedLotIds = Array.from(new Set([...(this.data.sampleMediaItems[mediaIndex].linkedLotIds || []), lotId])); }}); this._persistData(); return {success: true, message: 'Mídias vinculadas!'}; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { const lotIndex = this.data.sampleLots.findIndex((l: Lot) => l.id === lotId || l.publicId === lotId); if(lotIndex > -1) { this.data.sampleLots[lotIndex].mediaItemIds = (this.data.sampleLots[lotIndex].mediaItemIds || []).filter(id => id !== mediaItemId); } const mediaIndex = this.data.sampleMediaItems.findIndex((m: MediaItem) => m.id === mediaItemId); if(mediaIndex > -1) { this.data.sampleMediaItems[mediaIndex].linkedLotIds = (this.data.sampleMediaItems[mediaIndex].linkedLotIds || []).filter(id => id !== lotId); } this._persistData(); return {success: true, message: 'Mídia desvinculada!'}; }
  
  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> { await delay(10); return Promise.resolve(JSON.parse(JSON.stringify(this.data.samplePlatformSettings))); }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> { await delay(50); const currentSettings = this.data.samplePlatformSettings || {}; const newSettings = { ...currentSettings, ...data, platformPublicIdMasks: { ...(currentSettings.platformPublicIdMasks || {}), ...(data.platformPublicIdMasks || {}), }, mapSettings: { ...(currentSettings.mapSettings || {}), ...(data.mapSettings || {}), }, mentalTriggerSettings: { ...(currentSettings.mentalTriggerSettings || {}), ...(data.mentalTriggerSettings || {}), }, sectionBadgeVisibility: { ...(currentSettings.sectionBadgeVisibility || {}), ...(data.sectionBadgeVisibility || {}), }, id: 'global', updatedAt: new Date() }; this.data.samplePlatformSettings = newSettings; this._persistData(); return { success: true, message: "Configurações da plataforma atualizadas (Sample Data)!" }; }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleDirectSaleOffers)));
  }
}
