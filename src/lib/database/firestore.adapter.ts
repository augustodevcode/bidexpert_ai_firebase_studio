// src/lib/database/firestore.adapter.ts
import { db as dbAdmin, ensureAdminInitialized } from '@/lib/firebase/admin';
import type { DatabaseAdapter, Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, Court, JudicialDistrict, JudicialBranch, JudicialProcess, Bem, Subcategory, BemFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, SellerFormData, AuctioneerFormData, CityFormData, StateFormData, UserCreationData, DirectSaleOffer, SubcategoryFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { firestore } from 'firebase-admin';
import { AuctionSchema, LotSchema, UserProfileDataSchema, SellerProfileInfoSchema } from '@/lib/zod-schemas';

const AdminFieldValue = firestore.FieldValue;

export class FirestoreAdapter implements DatabaseAdapter {
    private db: FirebaseFirestore.Firestore;

    constructor() {
        const { db, error } = ensureAdminInitialized();
        if (error || !db) {
            throw new Error(`Firestore não pôde ser inicializado: ${error?.message}`);
        }
        this.db = db;
        console.log('[FirestoreAdapter] Inicializado com sucesso.');
    }
    
    private toJSON<T>(doc: FirebaseFirestore.DocumentSnapshot): T {
        const data = doc.data();
        if (!data) {
            throw new Error("Document data is undefined for an existing document.");
        }
        Object.keys(data).forEach(key => {
            if (data[key] instanceof firestore.Timestamp) {
                data[key] = (data[key] as firestore.Timestamp).toDate().toISOString();
            } else if (Array.isArray(data[key])) {
                data[key] = data[key].map(item => 
                    item instanceof firestore.Timestamp ? item.toDate().toISOString() : item
                );
            }
        });
        return { id: doc.id, ...data } as T;
    }

    private async genericCreate<T extends { id?: string; publicId?: string; createdAt?: any; updatedAt?: any }>(collectionName: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, schema?: Zod.Schema<any>): Promise<{ success: boolean; message: string; id?: string }> {
        const docRef = this.db.collection(collectionName).doc();
        const dataToSet: Partial<T> = {
            ...data,
            id: docRef.id,
            publicId: `${collectionName.slice(0, 4).toUpperCase()}-${docRef.id.substring(0, 8)}`,
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        try {
            if (schema) {
                schema.parse(dataToSet);
            }
            await docRef.set(dataToSet);
            return { success: true, message: "Registro criado com sucesso!", id: docRef.id };
        } catch (error: any) {
            console.error(`[FirestoreAdapter] Validation/Create Error in ${collectionName}:`, error);
            return { success: false, message: `Falha na validação ou criação: ${error.message}` };
        }
    }

    private async genericUpdate<T>(collectionName: string, id: string, data: Partial<T>, schema?: Zod.Schema<Partial<T>>): Promise<{ success: boolean; message: string }> {
        const dataToUpdate = {
            ...data,
            updatedAt: AdminFieldValue.serverTimestamp(),
        };
        try {
            if (schema) {
                schema.parse(dataToUpdate);
            }
            await this.db.collection(collectionName).doc(id).update(dataToUpdate);
            return { success: true, message: "Registro atualizado com sucesso." };
        } catch (error: any) {
            console.error(`[FirestoreAdapter] Validation/Update Error in ${collectionName}:`, error);
            return { success: false, message: `Falha na validação ou atualização: ${error.message}` };
        }
    }
    
    private async genericDelete(collectionName: string, id: string): Promise<{ success: boolean; message: string; }> {
        await this.db.collection(collectionName).doc(id).delete();
        return { success: true, message: 'Registro excluído com sucesso.' };
    }

    async getLots(auctionId?: string): Promise<Lot[]> {
        let query: FirebaseFirestore.Query = this.db.collection('lots');
        if (auctionId) {
            query = query.where('auctionId', '==', auctionId);
        }
        const snapshot = await query.orderBy('number', 'asc').get();
        return snapshot.docs.map(doc => this.toJSON<Lot>(doc));
    }

    async getLot(id: string): Promise<Lot | null> {
        const doc = await this.db.collection('lots').doc(id).get();
        return doc.exists ? this.toJSON<Lot>(doc) : null;
    }
    
    async createLot(lotData: Partial<Omit<Lot, "id" | "createdAt" | "updatedAt">>): Promise<{ success: boolean; message: string; lotId?: string; }> {
       const result = await this.genericCreate('lots', lotData, LotSchema);
       return { ...result, lotId: result.id };
    }
    
    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('lots', id, updates, LotSchema.partial());
    }

    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
        return this.genericDelete('lots', id);
    }

    async getAuctions(): Promise<Auction[]> {
        const snapshot = await this.db.collection('auctions').orderBy('auctionDate', 'desc').get();
        return snapshot.docs.map(doc => this.toJSON<Auction>(doc));
    }
    
    async getAuction(id: string): Promise<Auction | null> {
        const doc = await this.db.collection('auctions').doc(id).get();
        if (!doc.exists) return null;
        const auction = this.toJSON<Auction>(doc);
        auction.lots = await this.getLots(auction.id);
        auction.totalLots = auction.lots.length;
        return auction;
    }
    
    async createAuction(auctionData: Partial<Omit<Auction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        const result = await this.genericCreate('auctions', auctionData, AuctionSchema);
        return { ...result, auctionId: result.id };
    }

    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('auctions', id, updates, AuctionSchema.partial());
    }

    async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
        return this.genericDelete('auctions', id);
    }
    
    async getLotsByIds(ids: string[]): Promise<Lot[]> {
      if (ids.length === 0) return [];
      const snapshot = await this.db.collection('lots').where(firestore.FieldPath.documentId(), 'in', ids).get();
      return snapshot.docs.map(doc => this.toJSON<Lot>(doc));
    }
    
    async getLotCategories(): Promise<LotCategory[]> {
        const snapshot = await this.db.collection('lot_categories').orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<LotCategory>(doc));
    }

    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
        const docRef = this.db.collection('lot_categories').doc(data.id || data.slug!);
        await docRef.set({ ...data, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() });
        return { success: true, message: 'Categoria criada.' };
    }
    
    async getSellers(): Promise<SellerProfileInfo[]> {
        const snapshot = await this.db.collection('sellers').orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<SellerProfileInfo>(doc));
    }
    
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
        const snapshot = await this.db.collection('auctioneers').orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<AuctioneerProfileInfo>(doc));
    }
    
    async getUsersWithRoles(): Promise<UserProfileData[]> {
        const snapshot = await this.db.collection('users').get();
        return snapshot.docs.map(doc => this.toJSON<UserProfileData>(doc));
    }
    
    async getUserProfileData(userIdOrEmail: string): Promise<UserProfileData | null> {
        let snapshot: FirebaseFirestore.QuerySnapshot;
        if (userIdOrEmail.includes('@')) {
            snapshot = await this.db.collection('users').where('email', '==', userIdOrEmail).limit(1).get();
        } else {
            const doc = await this.db.collection('users').doc(userIdOrEmail).get();
            if (doc.exists) return this.toJSON<UserProfileData>(doc);
            return null;
        }

        if (snapshot.empty) return null;
        return this.toJSON<UserProfileData>(snapshot.docs[0]);
    }
    
    async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
        const { uid, ...restData } = data;
        if (!uid) return { success: false, message: "UID is required to create a user."};
        const docRef = this.db.collection('users').doc(uid);
        
        const dataToSet = {
            ...restData,
            id: uid, // Use uid as both id and uid in Firestore doc
            uid: uid,
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        try {
            UserProfileDataSchema.partial().parse(dataToSet);
            await docRef.set(dataToSet);
            return { success: true, message: 'Usuário criado com sucesso!', userId: uid };
        } catch (error: any) {
            console.error(`[FirestoreAdapter] Validation/Create Error for user ${uid}:`, error);
            return { success: false, message: `Falha na validação ou criação do usuário: ${error.message}` };
        }
    }
    
    async getRoles(): Promise<Role[]> {
        const snapshot = await this.db.collection('roles').get();
        return snapshot.docs.map(doc => this.toJSON<Role>(doc));
    }

    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; }> {
        const { id, ...rest } = role as any;
        const docRef = this.db.collection('roles').doc(id);
        await docRef.set({ ...rest, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() });
        return { success: true, message: 'Role criada.' };
    }

    async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('users').doc(userId).update({ roleIds: roleIds || [] });
        return { success: true, message: "Perfis do usuário atualizados." };
    }
    
    async getMediaItems(): Promise<MediaItem[]> {
        const snapshot = await this.db.collection('mediaItems').orderBy('uploadedAt', 'desc').get();
        return snapshot.docs.map(doc => this.toJSON<MediaItem>(doc));
    }
    
    async createMediaItem(itemData: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> {
       const docRef = this.db.collection('mediaItems').doc();
       const newItem = {
           ...itemData,
           id: docRef.id,
           urlOriginal: url,
           urlThumbnail: url, // Placeholder
           uploadedAt: AdminFieldValue.serverTimestamp(),
           uploadedBy: userId,
       };
       await docRef.set(newItem);
       return { success: true, message: "Mídia enviada com sucesso", item: newItem as MediaItem };
    }

    async getPlatformSettings(): Promise<PlatformSettings | null> {
        const doc = await this.db.collection('settings').doc('global').get();
        return doc.exists ? this.toJSON<PlatformSettings>(doc) : null;
    }

    async createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('settings').doc('global').set({
            ...data,
            id: 'global',
            updatedAt: AdminFieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true, message: "Configurações criadas com sucesso." };
    }

    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('settings').doc('global').set({
            ...data,
            updatedAt: AdminFieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true, message: "Configurações atualizadas com sucesso." };
    }

    async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
        const result = await this.genericCreate('sellers', data);
        return { ...result, sellerId: result.id };
    }
    
    async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
        const result = await this.genericCreate('courts', data);
        return { ...result, courtId: result.id };
    }

    async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
        const result = await this.genericCreate('states', data);
        return { ...result, stateId: result.id };
    }

    async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
        const result = await this.genericCreate('cities', data);
        return { ...result, cityId: result.id };
    }

    async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
        const result = await this.genericCreate('subcategories', data);
        return { ...result, subcategoryId: result.id };
    }

    async _notImplemented(method: string): Promise<any> {
        const message = `[FirestoreAdapter] O método ${method} não foi implementado.`;
        console.warn(message);
        return Promise.resolve({ success: false, message });
    }
    
    // MÉTODOS AINDA NÃO IMPLEMENTADOS COMPLETAMENTE
    async getStates(): Promise<StateInfo[]> {
        const snapshot = await this.db.collection('states').orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<StateInfo>(doc));
    }
    async getCities(stateId?: string): Promise<CityInfo[]> {
        let query: FirebaseFirestore.Query = this.db.collection('cities');
        if (stateId) {
            query = query.where('stateId', '==', stateId);
        }
        const snapshot = await query.orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<CityInfo>(doc));
    }
    async getSubcategoriesByParent(parentCategoryId?: string | undefined): Promise<Subcategory[]> { 
        if (!parentCategoryId) return [];
        const snapshot = await this.db.collection('subcategories').where('parentCategoryId', '==', parentCategoryId).orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<Subcategory>(doc));
    }
    async getSubcategory(id: string): Promise<Subcategory | null> { return this._notImplemented('getSubcategory'); }
    async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSubcategory'); }
    async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSubcategory'); }
    async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateState'); }
    async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteState'); }
    async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCity'); }
    async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteCity'); }
    async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('sellers', id, data, SellerProfileInfoSchema.partial()); }
    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return this.genericDelete('sellers', id); }
    async getSeller(id: string): Promise<SellerProfileInfo | null> {
        const doc = await this.db.collection('sellers').doc(id).get();
        return doc.exists ? this.toJSON<SellerProfileInfo>(doc) : null;
    }
    async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { return this._notImplemented('getAuctioneer'); }
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string | undefined; }> { return this._notImplemented('createAuctioneer'); }
    async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuctioneer'); }
    async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuctioneer'); }
    async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCourt'); }
    async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string | undefined; }> { return this._notImplemented('createJudicialDistrict'); }
    async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string | undefined; }> { return this._notImplemented('createJudicialBranch'); }
    async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string | undefined; }> { return this._notImplemented('createJudicialProcess'); }
    async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string | undefined; }> { return this._notImplemented('createBem'); }
    async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateBem'); }
    async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('saveUserDocument'); }
    async deleteBem(id: string): Promise<{ success: boolean, message: string }> { return this._notImplemented('deleteBem'); }
    async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return Promise.resolve([]); }
    async getCourts(): Promise<Court[]> { 
        const snapshot = await this.db.collection('courts').orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<Court>(doc));
    }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return Promise.resolve([]); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return Promise.resolve([]); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return Promise.resolve([]); }
    async getBem(id: string): Promise<Bem | null> { return this._notImplemented('getBem'); }
    async getBens(filter?: { judicialProcessId?: string; sellerId?: string; } | undefined): Promise<Bem[]> { return Promise.resolve([]); }
    async getBensByIds(ids: string[]): Promise<Bem[]> { return this._notImplemented('getBensByIds'); }
}
