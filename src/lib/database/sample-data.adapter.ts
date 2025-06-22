
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

// This adapter simulates a database using the static data from sample-data.ts
// It now reads from/writes to a .json file for persistence across server restarts.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const dataFilePath = path.join(process.cwd(), 'sample-data.local.json');

type SampleDataContainer = ReturnType<typeof getSampleData>;

export class SampleDataAdapter implements IDatabaseAdapter {
  private data: SampleDataContainer;
  private isDirty = false; // Flag to check if data has changed

  constructor() {
    this.data = this._loadData();
    console.log("[SampleDataAdapter] Instance created. Using data source:", fs.existsSync(dataFilePath) ? dataFilePath : "in-memory default");
  }

  private _loadData(): SampleDataContainer {
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
        return parsedData as SampleDataContainer;
      }
    } catch (error) {
      console.error(`[SampleDataAdapter] Error loading from ${dataFilePath}, falling back to default. Error:`, error);
    }
    // Fallback to pristine data if file doesn't exist or fails to parse
    const pristineData = getSampleData();
    // Persist for next time
    fs.writeFileSync(dataFilePath, JSON.stringify(pristineData, null, 2), 'utf-8');
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
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string }> {
    console.log(`[SampleDataAdapter] Creating LotCategory: ${data.name}`);
    await delay(50);
    const newCategory: LotCategory = {
        ...data,
        id: `sample-cat-${uuidv4()}`,
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
    console.log(`[SampleDataAdapter] Creating Subcategory: ${data.name}`);
    await delay(50);
    const parentCat = this.data.sampleLotCategories.find(c => c.id === data.parentCategoryId);
    const newSubcategory: Subcategory = {
        ...data,
        id: `sample-subcat-${uuidv4()}`,
        slug: slugify(data.name),
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentCategoryName: parentCat?.name,
    };
    this.data.sampleSubcategories.push(newSubcategory);
    await this._persistData();
    return { success: true, message: 'Subcategoria criada!', subcategoryId: newSubcategory.id };
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
    console.log(`[SampleDataAdapter] Updating Subcategory ID: ${id}`);
    await delay(50);
    const index = this.data.sampleSubcategories.findIndex(s => s.id === id);
    if(index === -1) return { success: false, message: 'Subcategoria não encontrada.' };
    this.data.sampleSubcategories[index] = { ...this.data.sampleSubcategories[index], ...data, slug: slugify(data.name || this.data.sampleSubcategories[index].name), updatedAt: new Date() };
    await this._persistData();
    return { success: true, message: 'Subcategoria atualizada!' };
  }
  
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.log(`[SampleDataAdapter] Deleting Subcategory ID: ${id}`);
    await delay(50);
    const initialLength = this.data.sampleSubcategories.length;
    this.data.sampleSubcategories = this.data.sampleSubcategories.filter(s => s.id !== id);
    if (this.data.sampleSubcategories.length < initialLength) {
        await this._persistData();
        return { success: true, message: 'Subcategoria excluída!' };
    }
    return { success: false, message: 'Subcategoria não encontrada.' };
  }

  // --- States and Cities (Read-only) ---
  async getStates(): Promise<StateInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleStates))); }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> { await delay(20); const state = this.data.sampleStates.find(s => s.id === idOrSlugOrUf || s.slug === idOrSlugOrUf || s.uf === idOrSlugOrUf.toUpperCase()); return Promise.resolve(state ? JSON.parse(JSON.stringify(state)) : null); }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { await delay(20); let cities = this.data.sampleCities; if (stateIdOrSlugFilter) { const state = await this.getState(stateIdOrSlugFilter); if (state) { cities = cities.filter(c => c.stateId === state.id); } else { return Promise.resolve([]); } } return Promise.resolve(JSON.parse(JSON.stringify(cities))); }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> { await delay(20); const city = this.data.sampleCities.find(c => c.id === idOrCompositeSlug || `${c.stateId}-${c.slug}` === idOrCompositeSlug); return Promise.resolve(city ? JSON.parse(JSON.stringify(city)) : null); }
  
  // --- Auctioneers & Sellers (Read-only) ---
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctioneers))); }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { await delay(20); const item = this.data.sampleAuctioneers.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId || a.slug === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> { return this.getAuctioneer(slugOrPublicId); }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { await delay(20); const item = this.data.sampleAuctioneers.find(a => a.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getSellers(): Promise<SellerProfileInfo[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleSellers))); }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { await delay(20); const item = this.data.sampleSellers.find(s => s.id === idOrPublicId || s.publicId === idOrPublicId || s.slug === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> { return this.getSeller(slugOrPublicId); }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { await delay(20); const item = this.data.sampleSellers.find(s => s.name.toLowerCase() === name.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }

  // --- Auctions & Lots ---
  async getAuctions(): Promise<Auction[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleAuctions))); }
  async getAuction(idOrPublicId: string): Promise<Auction | null> { await delay(20); const item = this.data.sampleAuctions.find(a => a.id === idOrPublicId || a.publicId === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> { const seller = await this.getSellerBySlug(sellerSlugOrPublicId); if (!seller) return Promise.resolve([]); const items = this.data.sampleAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name); return Promise.resolve(JSON.parse(JSON.stringify(items))); }
  async getLots(auctionIdParam?: string): Promise<Lot[]> { await delay(20); let lots = this.data.sampleLots; if (auctionIdParam) { const auction = await this.getAuction(auctionIdParam); if (auction) { lots = lots.filter(l => l.auctionId === auction.id || l.auctionId === auction.publicId); } else { return Promise.resolve([]); } } return Promise.resolve(JSON.parse(JSON.stringify(lots))); }
  async getLot(idOrPublicId: string): Promise<Lot | null> { await delay(20); const item = this.data.sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }

  // --- Users & Roles ---
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> { return Promise.resolve({ success: true, message: 'Default roles ensured.', rolesProcessed: this.data.sampleRoles.length }); }
  async getRoles(): Promise<Role[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleRoles))); }
  async getRole(id: string): Promise<Role | null> { await delay(20); const item = this.data.sampleRoles.find(r => r.id === id); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getRoleByName(name: string): Promise<Role | null> { await delay(20); const item = this.data.sampleRoles.find(r => r.name_normalized === name.toUpperCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleUserProfiles))); }
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> { await delay(20); const item = this.data.sampleUserProfiles.find(u => u.uid === userId); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> { await delay(20); const item = this.data.sampleUserProfiles.find(u => u.email.toLowerCase() === email.toLowerCase()); return Promise.resolve(item ? JSON.parse(JSON.stringify(item)) : null); }

  // --- Write operations ---
  
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    const newRole: Role = { ...data, id: `sample-role-${uuidv4()}`, name_normalized: data.name.toUpperCase(), createdAt: new Date(), updatedAt: new Date() };
    this.data.sampleRoles.push(newRole); await this._persistData();
    return { success: true, message: 'Role created!', roleId: newRole.id };
  }

  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    const index = this.data.sampleRoles.findIndex(r => r.id === id); if(index === -1) return { success: false, message: 'Role not found.'};
    this.data.sampleRoles[index] = { ...this.data.sampleRoles[index], ...data, name_normalized: (data.name || this.data.sampleRoles[index].name).toUpperCase(), updatedAt: new Date() }; await this._persistData();
    return { success: true, message: 'Role updated!' };
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    this.data.sampleRoles = this.data.sampleRoles.filter(r => r.id !== id); await this._persistData();
    return { success: true, message: 'Role deleted!' };
  }
  
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    const userIndex = this.data.sampleUserProfiles.findIndex(u => u.uid === userId); if(userIndex === -1) return { success: false, message: 'User not found.' };
    const role = roleId ? await this.getRole(roleId) : null;
    this.data.sampleUserProfiles[userIndex].roleId = role?.id; this.data.sampleUserProfiles[userIndex].roleName = role?.name; this.data.sampleUserProfiles[userIndex].permissions = role?.permissions || [];
    await this._persistData(); return { success: true, message: 'User role updated!' };
  }

  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    const index = this.data.sampleAuctions.findIndex(a => a.id === idOrPublicId || a.publicId === idOrPublicId); if(index === -1) return { success: false, message: `Auction not found.` };
    this.data.sampleAuctions[index] = { ...this.data.sampleAuctions[index], ...data, updatedAt: new Date() }; await this._persistData();
    return { success: true, message: 'Auction (simulated) updated!' };
  }

  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    const index = this.data.sampleLots.findIndex(l => l.id === idOrPublicId || l.publicId === idOrPublicId); if(index === -1) return { success: false, message: `Lot not found.` };
    this.data.sampleLots[index] = { ...this.data.sampleLots[index], ...data, updatedAt: new Date() }; await this._persistData();
    return { success: true, message: 'Lot (simulated) updated!' };
  }
  
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    this.data.samplePlatformSettings = { ...this.data.samplePlatformSettings, ...data, updatedAt: new Date() }; await this._persistData();
    return { success: true, message: 'Platform settings updated!' };
  }
  
  // --- Remaining placeholders ---
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { console.warn("createState not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateState not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteState not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { console.warn("createCity not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateCity not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteCity not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { console.warn("createAuctioneer not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateAuctioneer not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteAuctioneer not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { console.warn("createSeller not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateSeller not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteSeller not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { console.warn("createAuction not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteAuction not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> { console.warn("createLot not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteLot not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status">>; newBid?: BidInfo }> { console.warn("placeBidOnLot not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { await delay(20); return Promise.resolve(this.data.sampleBids.filter(b => b.lotId === lotId)); }
  async createReview(reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string | undefined; }> { await delay(50); return { success: true, message: 'Review (simulated) created!' }; }
  async getReviewsForLot(lotId: string): Promise<Review[]> { await delay(20); return Promise.resolve(this.data.sampleLotReviews.filter(r => r.lotId === lotId)); }
  async createQuestion(questionData: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string | undefined; }> { await delay(50); return { success: true, message: 'Question (simulated) created!' }; }
  async getQuestionsForLot(lotId: string): Promise<LotQuestion[]> { await delay(20); return Promise.resolve(this.data.sampleLotQuestions.filter(q => q.lotId === lotId)); }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { await delay(50); return { success: true, message: 'Question (simulated) answered!' }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<UserProfileData>, roleIdToAssign?: string | undefined): Promise<{ success: boolean; message: string; userProfile?: UserProfileData | undefined; }> { const existing = await this.getUserByEmail(email); if(existing) return { success: true, message: 'User profile exists (SampleData).', userProfile: existing }; const role = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER'); const newUser: UserProfileData = { uid: userId, email, fullName: fullName || email.split('@')[0], roleId: role?.id, roleName: role?.name, permissions: role?.permissions, status: 'ATIVO', habilitationStatus: 'PENDENTE_DOCUMENTOS', ...(additionalProfileData || {}), createdAt: new Date(), updatedAt: new Date() }; return { success: true, message: 'User profile ensured (SampleData).', userProfile: newUser }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteUserProfile not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { console.warn("updateUserProfile not implemented in SampleDataAdapter"); return { success: false, message: "Not implemented" }; }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { await delay(50); return { success: true, message: 'Media item (simulated) created!' }; }
  async getMediaItems(): Promise<MediaItem[]> { await delay(20); return Promise.resolve(JSON.parse(JSON.stringify(this.data.sampleMediaItems))); }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> { await delay(50); return { success: true, message: 'Media metadata (simulated) updated!' }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { await delay(50); return { success: true, message: 'Media item (simulated) deleted!' }; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { await delay(50); return { success: true, message: 'Media (simulated) linked!' }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { await delay(50); return { success: true, message: 'Media (simulated) unlinked!' }; }
}
