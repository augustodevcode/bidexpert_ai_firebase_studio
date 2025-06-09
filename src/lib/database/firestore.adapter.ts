
// src/lib/database/firestore.adapter.ts
import { 
  ensureAdminInitialized, 
  AdminFieldValue, 
  ServerTimestamp 
} from '@/lib/firebase/admin';
import type { 
  IDatabaseAdapter, 
  LotCategory, 
  StateInfo, StateFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData,
  Lot, LotFormData,
  BidInfo,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData
} from '@/types';
import { slugify } from '@/lib/sample-data';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema'; // For default roles

// Helper from categories/actions.ts (could be moved to a common util if used elsewhere)
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof ServerTimestamp || timestampField instanceof (global as any).FirebaseFirestore?.Timestamp) {
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new ServerTimestamp(timestampField.seconds, timestampField.nanoseconds).toDate();
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`[FirestoreAdapter] Could not convert timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}
function safeConvertOptionalDate(timestampField: any): Date | undefined | null {
    if (timestampField === null || timestampField === undefined) {
      return null;
    }
    return safeConvertToDate(timestampField);
}


export class FirestoreAdapter implements IDatabaseAdapter {
  private db: FirebaseFirestore.Firestore;
  private auth: FirebaseFirestore.Auth | undefined; // Keep auth if needed for some user ops

  constructor() {
    const { db: adminDb, auth: adminAuth, error } = ensureAdminInitialized();
    if (error || !adminDb) {
      const errorMessage = `FirestoreAdapter: Failed to initialize Firestore Admin SDK - ${error?.message || 'dbAdmin not available'}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.db = adminDb;
    this.auth = adminAuth; // Store auth instance if needed later
    console.log('[FirestoreAdapter] Initialized with Firestore Admin SDK.');
  }

  // --- Categories ---
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    try {
      const newCategoryData = {
        name: data.name.trim(),
        slug: slugify(data.name.trim()),
        description: data.description?.trim() || '',
        itemCount: 0,
        createdAt: AdminFieldValue.serverTimestamp(),
        updatedAt: AdminFieldValue.serverTimestamp(),
      };
      const docRef = await this.db.collection('lotCategories').add(newCategoryData);
      return { success: true, message: 'Categoria criada com sucesso!', categoryId: docRef.id };
    } catch (error: any) {
      console.error("[FirestoreAdapter - createLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao criar categoria.' };
    }
  }

  async getLotCategories(): Promise<LotCategory[]> {
    try {
      const snapshot = await this.db.collection('lotCategories').orderBy('name', 'asc').get();
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          itemCount: data.itemCount || 0,
          createdAt: safeConvertToDate(data.createdAt),
          updatedAt: safeConvertToDate(data.updatedAt),
        } as LotCategory;
      });
    } catch (error: any) {
      console.error("[FirestoreAdapter - getLotCategories] Error:", error);
      return [];
    }
  }

  async getLotCategory(id: string): Promise<LotCategory | null> {
     try {
      const docSnap = await this.db.collection('lotCategories').doc(id).get();
      if (docSnap.exists) {
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            name: data.name,
            slug: data.slug,
            description: data.description || '',
            itemCount: data.itemCount || 0,
            createdAt: safeConvertToDate(data.createdAt),
            updatedAt: safeConvertToDate(data.updatedAt),
        } as LotCategory;
      }
      return null;
    } catch (error: any) {
      console.error(`[FirestoreAdapter - getLotCategory with ID ${id}] Error:`, error);
      return null;
    }
  }

  async updateLotCategory(id: string, data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    try {
      const categoryDocRef = this.db.collection('lotCategories').doc(id);
      const updateData = {
        name: data.name.trim(),
        slug: slugify(data.name.trim()),
        description: data.description?.trim() || '',
        updatedAt: AdminFieldValue.serverTimestamp(),
      };
      await categoryDocRef.update(updateData);
      return { success: true, message: 'Categoria atualizada com sucesso!' };
    } catch (error: any) {
      console.error("[FirestoreAdapter - updateLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao atualizar categoria.' };
    }
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('lotCategories').doc(id).delete();
      return { success: true, message: 'Categoria excluída com sucesso!' };
    } catch (error: any) {
      console.error("[FirestoreAdapter - deleteLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao excluir categoria.' };
    }
  }

  // --- States ---
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    if (!data.name || data.name.trim() === '') return { success: false, message: 'O nome do estado é obrigatório.' };
    if (!data.uf || data.uf.trim() === '' || data.uf.trim().length !== 2) return { success: false, message: 'A UF do estado é obrigatória e deve ter 2 caracteres.' };
    try {
      const newStateData = {
        name: data.name.trim(),
        uf: data.uf.trim().toUpperCase(),
        slug: slugify(data.name.trim()),
        cityCount: 0,
        createdAt: AdminFieldValue.serverTimestamp(),
        updatedAt: AdminFieldValue.serverTimestamp(),
      };
      const docRef = await this.db.collection('states').add(newStateData);
      return { success: true, message: 'Estado criado com sucesso!', stateId: docRef.id };
    } catch (error: any) {
      return { success: false, message: error.message || 'Falha ao criar estado.' };
    }
  }
  async getStates(): Promise<StateInfo[]> {
    try {
      const snapshot = await this.db.collection('states').orderBy('name', 'asc').get();
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id, name: data.name, uf: data.uf, slug: data.slug,
          cityCount: data.cityCount || 0,
          createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt),
        } as StateInfo;
      });
    } catch (error: any) { return []; }
  }
  async getState(id: string): Promise<StateInfo | null> {
    try {
      const docSnap = await this.db.collection('states').doc(id).get();
      if (docSnap.exists) {
        const data = docSnap.data()!;
        return {
          id: docSnap.id, name: data.name, uf: data.uf, slug: data.slug,
          cityCount: data.cityCount || 0,
          createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt),
        } as StateInfo;
      } return null;
    } catch (error: any) { return null; }
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    if (data.name !== undefined && (data.name === null || data.name.trim() === '')) return { success: false, message: 'O nome do estado não pode ser vazio.' };
    if (data.uf !== undefined && (data.uf === null || data.uf.trim() === '' || data.uf.trim().length !== 2)) return { success: false, message: 'A UF do estado não pode ser vazia e deve ter 2 caracteres.' };
    try {
      const updatePayload: Partial<Omit<StateInfo, 'id' | 'createdAt' | 'cityCount'>> = {};
      if (data.name) { updatePayload.name = data.name.trim(); updatePayload.slug = slugify(data.name.trim()); }
      if (data.uf) { updatePayload.uf = data.uf.trim().toUpperCase(); }
      (updatePayload as any).updatedAt = AdminFieldValue.serverTimestamp();
      await this.db.collection('states').doc(id).update(updatePayload);
      return { success: true, message: 'Estado atualizado com sucesso!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Falha ao atualizar estado.' };
    }
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('states').doc(id).delete();
      return { success: true, message: 'Estado excluído com sucesso!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Falha ao excluir estado.' };
    }
  }

  // --- Cities ---
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    if (!data.name || !data.stateId) return { success: false, message: 'Nome e Estado são obrigatórios.'};
    try {
        const parentStateDoc = await this.db.collection('states').doc(data.stateId).get();
        if (!parentStateDoc.exists) return { success: false, message: 'Estado pai não encontrado.' };
        const parentState = parentStateDoc.data() as StateInfo;
        const newCityData = {
            name: data.name.trim(), slug: slugify(data.name.trim()),
            stateId: data.stateId, stateUf: parentState.uf,
            ibgeCode: data.ibgeCode || '', lotCount: 0,
            createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp(),
        };
        const docRef = await this.db.collection('cities').add(newCityData);
        return { success: true, message: 'Cidade criada!', cityId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
      try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.db.collection('cities');
        if (stateIdFilter) {
            query = query.where('stateId', '==', stateIdFilter);
        }
        const snapshot = await query.orderBy('name', 'asc').get();
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id, name: data.name, slug: data.slug,
                stateId: data.stateId, stateUf: data.stateUf, ibgeCode: data.ibgeCode,
                lotCount: data.lotCount || 0,
                createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt),
            } as CityInfo;
        });
      } catch (e: any) { return []; }
  }
  async getCity(id: string): Promise<CityInfo | null> {
      try {
        const docSnap = await this.db.collection('cities').doc(id).get();
        if (docSnap.exists) {
            const data = docSnap.data()!;
            return {
                id: docSnap.id, name: data.name, slug: data.slug,
                stateId: data.stateId, stateUf: data.stateUf, ibgeCode: data.ibgeCode,
                lotCount: data.lotCount || 0,
                createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt),
            } as CityInfo;
        } return null;
      } catch(e:any) { return null; }
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
      if (data.name !== undefined && !data.name.trim()) return { success: false, message: 'Nome da cidade não pode ser vazio.' };
      if (data.stateId !== undefined && !data.stateId.trim()) return { success: false, message: 'Estado não pode ser vazio.' };
      try {
        const updatePayload: Partial<Omit<CityInfo, 'id'|'createdAt'|'lotCount'>> = {};
        if (data.name) { updatePayload.name = data.name.trim(); updatePayload.slug = slugify(data.name.trim()); }
        if (data.stateId) {
            const parentStateDoc = await this.db.collection('states').doc(data.stateId).get();
            if (!parentStateDoc.exists) return { success: false, message: 'Estado pai não encontrado.' };
            updatePayload.stateId = data.stateId;
            updatePayload.stateUf = (parentStateDoc.data() as StateInfo).uf;
        }
        if (data.ibgeCode !== undefined) updatePayload.ibgeCode = data.ibgeCode;
        (updatePayload as any).updatedAt = AdminFieldValue.serverTimestamp();
        await this.db.collection('cities').doc(id).update(updatePayload);
        return { success: true, message: 'Cidade atualizada!'};
      } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await this.db.collection('cities').doc(id).delete();
        return { success: true, message: 'Cidade excluída!'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  // Implement other IDatabaseAdapter methods here, always using this.db
  // For example:
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { /* ... */ return []; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { /* ... */ return null; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> { /* ... */ return null; }


  async getSellers(): Promise<SellerProfileInfo[]> { /* ... */ return []; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getSeller(id: string): Promise<SellerProfileInfo | null> { /* ... */ return null; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> { /* ... */ return null; }

  async getAuctions(): Promise<Auction[]> { /* ... */ return []; }
  async createAuction(data: AuctionFormData): Promise<{ success: boolean; message: string; auctionId?: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getAuction(id: string): Promise<Auction | null> { /* ... */ return null; }
  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> { /* ... */ return []; }


  async getLots(auctionIdParam?: string): Promise<Lot[]> { /* ... */ return []; }
  async createLot(data: LotFormData): Promise<{ success: boolean; message: string; lotId?: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getLot(id: string): Promise<Lot | null> { /* ... */ return null; }
  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { /* ... */ return []; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> { /* ... */ return {success: false, message: "Not implemented"}; }


  async getUserProfileData(userId: string): Promise<UserProfileData | null> { /* ... */ return null; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getUsersWithRoles(): Promise<UserProfileData[]> { /* ... */ return []; }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }


  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async getRoles(): Promise<Role[]> { /* ... */ return []; }
  async getRole(id: string): Promise<Role | null> { /* ... */ return null; }
  async getRoleByName(name: string): Promise<Role | null> { /* ... */ return null; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { /* ... */ return {success: false, message: "Not implemented"}; }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; }> {
    console.log('[FirestoreAdapter] ensureDefaultRolesExist called');
    // This is a simplified version. The original logic from roles/actions.ts is more complete.
    // This should ideally call the roles/actions.ts version or replicate its logic fully.
    const defaultRolesToEnsure: RoleFormData[] = [
        { name: 'ADMINISTRATOR', description: 'Acesso total.', permissions: ['manage_all'] },
        { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids'] },
    ];
    let allGood = true;
    let messages: string[] = [];

    for (const roleData of defaultRolesToEnsure) {
        const normalizedName = roleData.name.trim().toUpperCase();
        const q = this.db.collection('roles').where('name_normalized', '==', normalizedName).limit(1);
        const existing = await q.get();
        if (existing.empty) {
            const result = await this.createRole(roleData);
            if (!result.success) allGood = false;
            messages.push(result.message);
        } else {
            const existingDoc = existing.docs[0];
            const existingPerms = (existingDoc.data().permissions || []).sort();
            const expectedPerms = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
            if (JSON.stringify(existingPerms) !== JSON.stringify(expectedPerms) || existingDoc.data().description !== (roleData.description || '')) {
                await this.updateRole(existingDoc.id, {
                    description: roleData.description,
                    permissions: expectedPerms
                });
                messages.push(`Perfil ${roleData.name} atualizado.`);
            } else {
                 messages.push(`Perfil ${roleData.name} já existe e está sincronizado.`);
            }
        }
    }
    return { success: allGood, message: messages.join(' ') };
  }
  
  // Media Items (Storage interaction is separate)
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> {
    try {
        const newMediaItemData = {
            ...data,
            urlOriginal: filePublicUrl,
            urlThumbnail: filePublicUrl, // Placeholder, generate real thumbnails later
            urlMedium: filePublicUrl,
            urlLarge: filePublicUrl,
            uploadedBy: uploadedBy || 'system',
            uploadedAt: AdminFieldValue.serverTimestamp(),
            linkedLotIds: [],
        };
        const docRef = await this.db.collection('mediaItems').add(newMediaItemData);
        const createdItem = {
            id: docRef.id,
            ...newMediaItemData,
            uploadedAt: new Date(), // For immediate use
        } as MediaItem;
        return { success: true, message: "Item de mídia criado no Firestore.", item: createdItem };
    } catch (e: any) {
        return { success: false, message: `Erro ao criar item de mídia no Firestore: ${e.message}`};
    }
  }
  async getMediaItems(): Promise<MediaItem[]> {
    try {
        const snapshot = await this.db.collection('mediaItems').orderBy('uploadedAt', 'desc').get();
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
            id: docSnap.id,
            ...data,
            uploadedAt: safeConvertToDate(data.uploadedAt),
            } as MediaItem;
        });
    } catch (e: any) { return []; }
  }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> {
    try {
        await this.db.collection('mediaItems').doc(id).update({ ...metadata, updatedAt: AdminFieldValue.serverTimestamp() });
        return { success: true, message: 'Metadados atualizados.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { // Renamed for clarity
    try {
        await this.db.collection('mediaItems').doc(id).delete();
        return { success: true, message: 'Item de mídia excluído do Firestore.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> {
    const batch = this.db.batch();
    try {
        const lotRef = this.db.collection('lots').doc(lotId);
        batch.update(lotRef, { mediaItemIds: AdminFieldValue.arrayUnion(...mediaItemIds), updatedAt: AdminFieldValue.serverTimestamp() });
        mediaItemIds.forEach(mediaId => {
            const mediaRef = this.db.collection('mediaItems').doc(mediaId);
            batch.update(mediaRef, { linkedLotIds: AdminFieldValue.arrayUnion(lotId) });
        });
        await batch.commit();
        return { success: true, message: 'Mídias vinculadas.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> {
     const batch = this.db.batch();
    try {
        const lotRef = this.db.collection('lots').doc(lotId);
        batch.update(lotRef, { mediaItemIds: AdminFieldValue.arrayRemove(mediaItemId), updatedAt: AdminFieldValue.serverTimestamp() });
        const mediaRef = this.db.collection('mediaItems').doc(mediaItemId);
        batch.update(mediaRef, { linkedLotIds: AdminFieldValue.arrayRemove(lotId) });
        await batch.commit();
        return { success: true, message: 'Mídia desvinculada.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  // Settings
  async getPlatformSettings(): Promise<PlatformSettings> {
    try {
        const settingsDoc = await this.db.collection('platformSettings').doc('global').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data()!;
            return {
                id: 'global',
                galleryImageBasePath: data.galleryImageBasePath || '/media/gallery/',
                updatedAt: safeConvertToDate(data.updatedAt),
            };
        }
        // Create default if not exists
        const defaultSettings = { galleryImageBasePath: '/media/gallery/', updatedAt: AdminFieldValue.serverTimestamp()};
        await this.db.collection('platformSettings').doc('global').set(defaultSettings);
        return { id: 'global', ...defaultSettings, updatedAt: new Date() } as PlatformSettings;
    } catch (e: any) {
        return { id: 'global', galleryImageBasePath: '/media/gallery/', updatedAt: new Date() };
    }
  }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
      return { success: false, message: 'Caminho base inválido.' };
    }
    try {
        const updatePayload = {
            galleryImageBasePath: data.galleryImageBasePath,
            updatedAt: AdminFieldValue.serverTimestamp(),
        };
        await this.db.collection('platformSettings').doc('global').set(updatePayload, { merge: true });
        return { success: true, message: 'Configurações atualizadas.' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
}
