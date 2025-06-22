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

// This adapter simulates a database using the static data from sample-data.ts
// It now correctly modifies the in-memory data for the duration of the session.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SampleDataAdapter implements IDatabaseAdapter {
  private data: ReturnType<typeof getSampleData>;

  constructor() {
    this.data = getSampleData();
    console.log("[SampleDataAdapter] Instance created. Using in-memory sample data via getSampleData().");
  }

  async initializeSchema(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Schema initialization is not required for sample data.');
    return Promise.resolve({ success: true, message: 'Sample data adapter ready.', rolesProcessed: this.data.sampleRoles.length });
  }

  // --- LotCategory ---
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string }> {
    console.log(`[SampleDataAdapter] Simulating createLotCategory for: ${data.name}`);
    await delay(50);
    return { success: true, message: 'Categoria (simulada) criada com sucesso!', categoryId: `sample-cat-${uuidv4()}` };
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
    console.log(`[SampleDataAdapter] Simulating updateLotCategory for ID: ${id}`);
    await delay(50);
    return { success: true, message: 'Categoria (simulada) atualizada com sucesso!' };
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Simulating deleteLotCategory for ID: ${id}`);
    await delay(50);
    return { success: true, message: 'Categoria (simulada) excluída com sucesso!' };
  }

  // --- Subcategory ---
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    console.log(`[SampleDataAdapter] Simulating createSubcategory for: ${data.name}`);
    await delay(50);
    return { success: true, message: 'Subcategoria (simulada) criada!', subcategoryId: `sample-subcat-${uuidv4()}` };
  }
  
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    console.log(`[SampleDataAdapter] Fetching Subcategories for parent: ${parentCategoryId}`);
    await delay(20);
    const subcategories = this.data.sampleSubcategories.filter(sub => sub.parentCategoryId === parentCategoryId);
    return Promise.resolve(JSON.parse(JSON.stringify(subcategories)));
  }

  async getSubcategory(id: string): Promise<Subcategory | null> {
    console.log(`[SampleDataAdapter] Fetching Subcategory by ID: ${id}`);
    await delay(20);
    const subcategory = this.data.sampleSubcategories.find(sub => sub.id === id);
    return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }

  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    console.log(`[SampleDataAdapter] Fetching Subcategory by slug: ${slug} in parent ${parentCategoryId}`);
    await delay(20);
    const subcategory = this.data.sampleSubcategories.find(sub => sub.slug === slug && sub.parentCategoryId === parentCategoryId);
    return Promise.resolve(subcategory ? JSON.parse(JSON.stringify(subcategory)) : null);
  }
  
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Simulating updateSubcategory for ID: ${id}`);
    await delay(50);
    return { success: true, message: 'Subcategoria (simulada) atualizada!' };
  }
  
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Simulating deleteSubcategory for ID: ${id}`);
    await delay(50);
    return { success: true, message: 'Subcategoria (simulada) excluída!' };
  }

  // --- States and Cities ---
  async getStates(): Promise<StateInfo[]> {
    console.log('[SampleDataAdapter] Fetching States.');
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleStates)));
  }

  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> {
    console.log(`[SampleDataAdapter] Fetching State by id/slug/uf: ${idOrSlugOrUf}`);
    await delay(20);
    const state = this.data.sampleStates.find(s => s.id === idOrSlugOrUf || s.slug === idOrSlugOrUf || s.uf === idOrSlugOrUf.toUpperCase());
    return Promise.resolve(state ? JSON.parse(JSON.stringify(state)) : null);
  }
  
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> {
    console.log(`[SampleDataAdapter] Fetching Cities with filter: ${stateIdOrSlugFilter}`);
    await delay(20);
    let cities = this.data.sampleCities;
    if (stateIdOrSlugFilter) {
      const state = await this.getState(stateIdOrSlugFilter);
      if (state) {
        cities = cities.filter(c => c.stateId === state.id);
      } else {
        return Promise.resolve([]);
      }
    }
    return Promise.resolve(JSON.parse(JSON.stringify(cities)));
  }

  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> {
     console.log(`[SampleDataAdapter] Fetching City by id/composite: ${idOrCompositeSlug}`);
     await delay(20);
     const city = this.data.sampleCities.find(c => c.id === idOrCompositeSlug || `${c.stateId}-${c.slug}` === idOrCompositeSlug);
     return Promise.resolve(city ? JSON.parse(JSON.stringify(city)) : null);
  }

  // --- Auctioneers & Sellers (Read-only from sample data) ---
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    console.log('[SampleDataAdapter] Fetching Auctioneers.');
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctioneers)));
  }

  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    console.log(`[SampleDataAdapter] Fetching Auctioneer by id/publicId: ${idOrPublicId}`);
    await delay(20);
    const item = this.data.sampleAuctioneers.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId || a.slug === idOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    console.log(`[SampleDataAdapter] Fetching Auctioneer by slug/publicId: ${slugOrPublicId}`);
    return this.getAuctioneer(slugOrPublicId);
  }

  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
    console.log(`[SampleDataAdapter] Fetching Auctioneer by name: ${name}`);
    await delay(20);
    const item = this.data.sampleAuctioneers.find(a => a.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  async getSellers(): Promise<SellerProfileInfo[]> {
    console.log('[SampleDataAdapter] Fetching Sellers.');
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleSellers)));
  }

  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
    console.log(`[SampleDataAdapter] Fetching Seller by id/publicId: ${idOrPublicId}`);
    await delay(20);
    const item = this.data.sampleSellers.find(s => s.id === idOrPublicId || s.publicId === idOrPublicId || s.slug === idOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> {
    console.log(`[SampleDataAdapter] Fetching Seller by slug/publicId: ${slugOrPublicId}`);
    return this.getSeller(slugOrPublicId);
  }

  async getSellerByName(name: string): Promise<SellerProfileInfo | null> {
    console.log(`[SampleDataAdapter] Fetching Seller by name: ${name}`);
    await delay(20);
    const item = this.data.sampleSellers.find(s => s.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  // --- Auctions ---
  async getAuctions(): Promise<Auction[]> {
    console.log('[SampleDataAdapter] Fetching Auctions.');
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctions)));
  }

  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    console.log(`[SampleDataAdapter] Fetching Auction by id/publicId: ${idOrPublicId}`);
    await delay(20);
    const item = this.data.sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    console.log(`[SampleDataAdapter] Fetching Auctions by seller slug/publicId: ${sellerSlugOrPublicId}`);
    await delay(20);
    const seller = await this.getSellerBySlug(sellerSlugOrPublicId);
    if (!seller) return Promise.resolve([]);
    const items = this.data.sampleAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
    return Promise.resolve(JSON.parse(JSON.stringify(items)));
  }

  // --- Lots ---
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    console.log(`[SampleDataAdapter] Fetching Lots with auction filter: ${auctionIdParam}`);
    await delay(20);
    let lots = this.data.sampleLots;
    if (auctionIdParam) {
      const auction = await this.getAuction(auctionIdParam);
      if (auction) {
        lots = lots.filter(l => l.auctionId === auction.id);
      } else {
        return Promise.resolve([]);
      }
    }
    return Promise.resolve(JSON.parse(JSON.stringify(lots)));
  }

  async getLot(idOrPublicId: string): Promise<Lot | null> {
    console.log(`[SampleDataAdapter] Fetching Lot by id/publicId: ${idOrPublicId}`);
    await delay(20);
    const item = this.data.sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    console.log('[SampleDataAdapter] Fetching PlatformSettings.');
    await delay(10);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.samplePlatformSettings)));
  }

  // --- Users & Roles ---
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
    console.log('[SampleDataAdapter] Default roles are static, no processing needed.');
    return Promise.resolve({ success: true, message: 'Default roles ensured.', rolesProcessed: this.data.sampleRoles.length });
  }

  async getRoles(): Promise<Role[]> {
    console.log('[SampleDataAdapter] Fetching Roles.');
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleRoles)));
  }

  async getRole(id: string): Promise<Role | null> {
    console.log(`[SampleDataAdapter] Fetching Role by ID: ${id}`);
    await delay(20);
    const item = this.data.sampleRoles.find(r => r.id === id);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  
  async getRoleByName(name: string): Promise<Role | null> {
    console.log(`[SampleDataAdapter] Fetching Role by name: ${name}`);
    await delay(20);
    const item = this.data.sampleRoles.find(r => r.name_normalized === name.toUpperCase());
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }
  
  async getUsersWithRoles(): Promise<UserProfileData[]> {
    console.log('[SampleDataAdapter] Fetching Users with Roles.');
    await delay(20);
    return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleUserProfiles)));
  }
  
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    console.log(`[SampleDataAdapter] Fetching UserProfileData by ID: ${userId}`);
    await delay(20);
    const item = this.data.sampleUserProfiles.find(u => u.uid === userId);
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    console.log(`[SampleDataAdapter] Fetching User by email: ${email}`);
    await delay(20);
    const item = this.data.sampleUserProfiles.find(u => u.email.toLowerCase() === email.toLowerCase());
    return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null);
  }

  // --- Write operations (Implemented to modify in-memory data) ---
  
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Updating auction ID/publicId: ${idOrPublicId} with`, data);
    await delay(50);
    const auctionIndex = this.data.sampleAuctions.findIndex(a => a.id === idOrPublicId || a.publicId === idOrPublicId);
    
    if (auctionIndex === -1) {
      return { success: false, message: `Auction with ID/PublicID "${idOrPublicId}" not found in sample data.` };
    }

    this.data.sampleAuctions[auctionIndex] = { ...this.data.sampleAuctions[auctionIndex], ...data, updatedAt: new Date() };
    console.log(`[SampleDataAdapter] Auction "${this.data.sampleAuctions[auctionIndex].title}" updated in memory.`);
    return { success: true, message: 'Auction (simulated) updated!' };
  }

  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Updating lot ID/publicId: ${idOrPublicId} with`, data);
    await delay(50);
    const lotIndex = this.data.sampleLots.findIndex(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
    
    if (lotIndex === -1) {
      return { success: false, message: `Lot with ID/PublicID "${idOrPublicId}" not found in sample data.` };
    }

    this.data.sampleLots[lotIndex] = { ...this.data.sampleLots[lotIndex], ...data, updatedAt: new Date() };
    console.log(`[SampleDataAdapter] Lot "${this.data.sampleLots[lotIndex].title}" updated in memory.`);
    return { success: true, message: 'Lot (simulated) updated!' };
  }

  // --- Other Write operations (Simulated) ---

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { console.log(`[SampleDataAdapter] Simulating createRole for: ${data.name}`); await delay(50); return { success: true, message: 'Role (simulated) created!', roleId: `sample-role-${uuidv4()}` }; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateRole for ID: ${id}`); await delay(50); return { success: true, message: 'Role (simulated) updated!' }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteRole for ID: ${id}`); await delay(50); return { success: true, message: 'Role (simulated) deleted!' }; }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { console.log(`[SampleDataAdapter] Simulating createState for: ${data.name}`); await delay(50); return { success: true, message: 'State (simulated) created!', stateId: `sample-state-${uuidv4()}` }; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateState for ID: ${id}`); await delay(50); return { success: true, message: 'State (simulated) updated!' }; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteState for ID: ${id}`); await delay(50); return { success: true, message: 'State (simulated) deleted!' }; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { console.log(`[SampleDataAdapter] Simulating createCity for: ${data.name}`); await delay(50); return { success: true, message: 'City (simulated) created!', cityId: `sample-city-${uuidv4()}` }; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateCity for ID: ${id}`); await delay(50); return { success: true, message: 'City (simulated) updated!' }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteCity for ID: ${id}`); await delay(50); return { success: true, message: 'City (simulated) deleted!' }; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { console.log(`[SampleDataAdapter] Simulating createAuctioneer for: ${data.name}`); await delay(50); return { success: true, message: 'Auctioneer (simulated) created!', auctioneerId: `sample-auct-${uuidv4()}`, auctioneerPublicId: `AUCT-PUB-${uuidv4()}` }; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateAuctioneer for ID: ${id}`); await delay(50); return { success: true, message: 'Auctioneer (simulated) updated!' }; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteAuctioneer for ID: ${id}`); await delay(50); return { success: true, message: 'Auctioneer (simulated) deleted!' }; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { console.log(`[SampleDataAdapter] Simulating createSeller for: ${data.name}`); await delay(50); return { success: true, message: 'Seller (simulated) created!', sellerId: `sample-seller-${uuidv4()}`, sellerPublicId: `SELL-PUB-${uuidv4()}` }; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateSeller for ID: ${id}`); await delay(50); return { success: true, message: 'Seller (simulated) updated!' }; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteSeller for ID: ${id}`); await delay(50); return { success: true, message: 'Seller (simulated) deleted!' }; }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { console.log(`[SampleDataAdapter] Simulating createAuction for: ${data.title}`); await delay(50); return { success: true, message: 'Auction (simulated) created!', auctionId: `sample-auc-${uuidv4()}`, auctionPublicId: `AUC-PUB-${uuidv4()}` }; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteAuction for ID: ${id}`); await delay(50); return { success: true, message: 'Auction (simulated) deleted!' }; }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> { console.log(`[SampleDataAdapter] Simulating createLot for: ${data.title}`); await delay(50); return { success: true, message: 'Lot (simulated) created!', lotId: `sample-lot-${uuidv4()}`, lotPublicId: `LOT-PUB-${uuidv4()}` }; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteLot for ID: ${id}`); await delay(50); return { success: true, message: 'Lot (simulated) deleted!' }; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateUserProfile for ID: ${userId}`); await delay(50); return { success: true, message: 'Profile (simulated) updated!' }; }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateUserRole for ID: ${userId}`); await delay(50); return { success: true, message: 'User role (simulated) updated!' }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteUserProfile for ID: ${userId}`); await delay(50); return { success: true, message: 'User (simulated) deleted!' }; }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updatePlatformSettings.`); await delay(50); return { success: true, message: 'Platform settings (simulated) updated!' }; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status">>; newBid?: BidInfo }> { console.log(`[SampleDataAdapter] Simulating placeBidOnLot for lot ID: ${lotId}`); await delay(50); const lot = this.data.sampleLots.find(l => l.id === lotId); return { success: true, message: 'Bid (simulated) placed!', updatedLot: { price: bidAmount, bidsCount: (lot?.bidsCount || 0) + 1 }}; }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { console.log(`[SampleDataAdapter] Fetching bids for lot ID: ${lotId}`); return Promise.resolve(this.data.sampleBids.filter(b => b.lotId === lotId)); }
  async createReview(reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string | undefined; }> { console.log(`[SampleDataAdapter] Simulating createReview.`); await delay(50); return { success: true, message: 'Review (simulated) created!' }; }
  async getReviewsForLot(lotId: string): Promise<Review[]> { console.log(`[SampleDataAdapter] Fetching reviews for lot ID: ${lotId}`); return Promise.resolve(this.data.sampleLotReviews.filter(r => r.lotId === lotId)); }
  async createQuestion(questionData: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string | undefined; }> { console.log(`[SampleDataAdapter] Simulating createQuestion.`); await delay(50); return { success: true, message: 'Question (simulated) created!' }; }
  async getQuestionsForLot(lotId: string): Promise<LotQuestion[]> { console.log(`[SampleDataAdapter] Fetching questions for lot ID: ${lotId}`); return Promise.resolve(this.data.sampleLotQuestions.filter(q => q.lotId === lotId)); }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating answerQuestion for question ID: ${questionId}`); await delay(50); return { success: true, message: 'Question (simulated) answered!' }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<UserProfileData>, roleIdToAssign?: string | undefined): Promise<{ success: boolean; message: string; userProfile?: UserProfileData | undefined; }> {
    console.log(`[SampleDataAdapter] Simulating ensureUserRole for email: ${email}`);
    const existing = await this.getUserByEmail(email);
    if(existing) return { success: true, message: 'User profile exists (SampleData).', userProfile: existing };
    const role = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER');
    const newUser: UserProfileData = {
        uid: userId, email, fullName: fullName || email.split('@')[0], roleId: role?.id, roleName: role?.name,
        permissions: role?.permissions, status: 'ATIVO', habilitationStatus: 'PENDENTE_DOCUMENTOS',
        ...(additionalProfileData || {}), createdAt: new Date(), updatedAt: new Date()
    };
    return { success: true, message: 'User profile ensured (SampleData).', userProfile: newUser };
  }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { console.log(`[SampleDataAdapter] Simulating createMediaItem.`); await delay(50); return { success: true, message: 'Media item (simulated) created!' }; }
  async getMediaItems(): Promise<MediaItem[]> { console.log(`[SampleDataAdapter] Fetching media items.`); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleMediaItems))); }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating updateMediaItemMetadata for ID: ${id}`); await delay(50); return { success: true, message: 'Media metadata (simulated) updated!' }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating deleteMediaItemFromDb for ID: ${id}`); await delay(50); return { success: true, message: 'Media item (simulated) deleted!' }; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating linkMediaItemsToLot.`); await delay(50); return { success: true, message: 'Media (simulated) linked!' }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.log(`[SampleDataAdapter] Simulating unlinkMediaItemFromLot.`); await delay(50); return { success: true, message: 'Media (simulated) unlinked!' }; }
}
