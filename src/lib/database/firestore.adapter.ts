
// src/lib/database/firestore.adapter.ts
import { db as dbAdmin, ensureAdminInitialized } from '@/lib/firebase/admin';
import type { DatabaseAdapter, Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, Court, JudicialDistrict, JudicialBranch, JudicialProcess, Bem, Subcategory, BemFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, SellerFormData, AuctioneerFormData, CityFormData, StateFormData, UserCreationData, DirectSaleOffer, SubcategoryFormData, UserDocument, ContactMessage, DocumentTemplate } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { firestore } from 'firebase-admin';
import { AuctionSchema, LotSchema, UserProfileDataSchema, SellerProfileInfoSchema, AuctioneerProfileInfoSchema } from '@/lib/zod-schemas';
import { v4 as uuidv4 } from 'uuid';

const AdminFieldValue = firestore.FieldValue;

export class FirestoreAdapter implements DatabaseAdapter {
    private db: FirebaseFirestore.Firestore;

    constructor() {
        console.log('[FirestoreAdapter] LOG: Constructor called. Ensuring Admin SDK is initialized.');
        const { db } = ensureAdminInitialized();
        this.db = db;
        console.log('[FirestoreAdapter] LOG: Initialized successfully with Firestore instance.');
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
    
    async batchWrite(collectionName: string, items: any[]): Promise<{ success: boolean; message: string; }> {
        if (!items || items.length === 0) {
            return { success: true, message: 'Nenhum item para adicionar.' };
        }

        const batchSize = 499; // Firestore batch limit is 500
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }

        try {
            for (const batchItems of batches) {
                const batch = this.db.batch();
                for (const item of batchItems) {
                    const docRef = item.id ? this.db.collection(collectionName).doc(item.id) : this.db.collection(collectionName).doc();
                    const dataToSet = {
                        ...item,
                        id: docRef.id,
                        createdAt: AdminFieldValue.serverTimestamp(),
                        updatedAt: AdminFieldValue.serverTimestamp(),
                    };
                    if (!dataToSet.slug && (dataToSet.name || dataToSet.title)) {
                        dataToSet.slug = slugify(dataToSet.name || dataToSet.title);
                    }
                    // Use set with merge:true to create or update, preventing duplicate errors
                    // and saving on writes if the document already exists.
                    batch.set(docRef, dataToSet, { merge: true });
                }
                await batch.commit();
            }
            return { success: true, message: `${items.length} itens em ${collectionName} adicionados/atualizados com sucesso.` };
        } catch (error: any) {
            console.error(`[FirestoreAdapter] Erro na escrita em lote para ${collectionName}:`, error);
            return { success: false, message: `Falha na escrita em lote: ${error.message}` };
        }
    }


    private async genericCreate<T extends { id?: string; publicId?: string; createdAt?: any; updatedAt?: any; name?: string; title?: string; slug?: string; }>(collectionName: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, schema?: Zod.Schema<any>): Promise<{ success: boolean; message: string; id?: string }> {
        const docRef = this.db.collection(collectionName).doc();
        const dataToSet: Partial<T> = {
            ...data,
            id: docRef.id,
            publicId: `${collectionName.slice(0, 4).toUpperCase()}-${docRef.id.substring(0, 8)}`,
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        };

        if (dataToSet.name && !dataToSet.slug) {
            dataToSet.slug = slugify(dataToSet.name);
        } else if (dataToSet.title && !dataToSet.slug) {
            dataToSet.slug = slugify(dataToSet.title);
        }

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
        try {
            await this.db.collection(collectionName).doc(id).delete();
            return { success: true, message: 'Registro excluído com sucesso.' };
        } catch (error: any) {
             console.error(`[FirestoreAdapter] Deletion Error in ${collectionName}:`, error);
             return { success: false, message: `Falha na exclusão: ${error.message}` };
        }
    }

    async getLots(auctionId?: string): Promise<Lot[]> {
        console.log(`[FirestoreAdapter] LOG: getLots called for auctionId: ${auctionId || 'all'}`);
        let query: FirebaseFirestore.Query = this.db.collection('lots');
        
        if (auctionId) {
            query = query.where('auctionId', '==', auctionId).orderBy('number', 'asc');
        } else {
            query = query.orderBy('createdAt', 'desc');
        }
        
        try {
            const snapshot = await query.get();
            console.log(`[FirestoreAdapter] LOG: getLots found ${snapshot.docs.length} documents.`);
            return snapshot.docs.map(doc => this.toJSON<Lot>(doc));
        } catch (error: any) {
            if (error.code === 5) { // NOT_FOUND
                console.warn(`[FirestoreAdapter] WARN: Collection 'lots' not found or empty. Returning empty array. This is normal if the DB is not seeded.`);
                return [];
            }
            console.error(`[FirestoreAdapter] FATAL: Error fetching lots:`, error);
            throw error;
        }
    }

    async getLot(id: string): Promise<Lot | null> {
        console.log(`[FirestoreAdapter] LOG: getLot called for id: ${id}`);
        const doc = await this.db.collection('lots').doc(id).get();
        return doc.exists ? this.toJSON<Lot>(doc) : null;
    }
    
    async createLot(lotData: Partial<Omit<Lot, "id" | "createdAt" | "updatedAt">>): Promise<{ success: boolean; message: string; lotId?: string; }> {
       console.log('[FirestoreAdapter] LOG: createLot called.');
       const result = await this.genericCreate('lots', lotData, LotSchema);
       return { ...result, lotId: result.id };
    }
    
    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> {
        console.log(`[FirestoreAdapter] LOG: updateLot called for id: ${id}`);
        return this.genericUpdate('lots', id, updates, LotSchema.partial());
    }

    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
        console.log(`[FirestoreAdapter] LOG: deleteLot called for id: ${id}`);
        return this.genericDelete('lots', id);
    }

    async getAuctions(): Promise<Auction[]> {
        console.log('[FirestoreAdapter] LOG: getAuctions optimized called.');
        let auctionsSnapshot: FirebaseFirestore.QuerySnapshot;
        let lotsSnapshot: FirebaseFirestore.QuerySnapshot;

        try {
            auctionsSnapshot = await this.db.collection('auctions').orderBy('auctionDate', 'desc').get();
        } catch (error: any) {
            if (error.code === 5) { // NOT_FOUND
                console.warn(`[FirestoreAdapter] WARN: Collection 'auctions' not found. Returning empty array.`);
                return [];
            }
            throw error;
        }

        try {
            lotsSnapshot = await this.db.collection('lots').get();
        } catch (error: any) {
            if (error.code === 5) {
                console.warn(`[FirestoreAdapter] WARN: Collection 'lots' not found during auction assembly. Treating as empty.`);
                lotsSnapshot = { docs: [], empty: true } as any; 
            } else {
                throw error;
            }
        }
        
        const allLots = lotsSnapshot.docs.map(doc => this.toJSON<Lot>(doc));
        const lotsByAuctionId = new Map<string, Lot[]>();

        for (const lot of allLots) {
            if (!lotsByAuctionId.has(lot.auctionId)) {
                lotsByAuctionId.set(lot.auctionId, []);
            }
            lotsByAuctionId.get(lot.auctionId)!.push(lot);
        }

        const auctions = auctionsSnapshot.docs.map(doc => {
            const auction = this.toJSON<Auction>(doc);
            const relatedLots = lotsByAuctionId.get(auction.id) || [];
            auction.lots = relatedLots.sort((a,b) => (parseInt(a.number || '0') || 0) - (parseInt(b.number || '0') || 0));
            auction.totalLots = relatedLots.length;
            return auction;
        });

        console.log(`[FirestoreAdapter] LOG: getAuctions found ${auctions.length} documents and assembled them.`);
        return auctions;
    }
    
    async getAuction(id: string): Promise<Auction | null> {
        console.log(`[FirestoreAdapter] LOG: getAuction called for id: ${id}`);
        const doc = await this.db.collection('auctions').doc(id).get();
        if (!doc.exists) return null;
        const auction = this.toJSON<Auction>(doc);
        auction.lots = await this.getLots(auction.id);
        auction.totalLots = auction.lots.length;
        return auction;
    }
    
    async createAuction(auctionData: Partial<Omit<Auction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        console.log('[FirestoreAdapter] LOG: createAuction called.');
        const result = await this.genericCreate('auctions', auctionData, AuctionSchema);
        return { ...result, auctionId: result.id };
    }

    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
        console.log(`[FirestoreAdapter] LOG: updateAuction called for id: ${id}`);
        return this.genericUpdate('auctions', id, updates, AuctionSchema.partial());
    }

    async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
        console.log(`[FirestoreAdapter] LOG: deleteAuction called for id: ${id}`);
        return this.genericDelete('auctions', id);
    }
    
    async getLotsByIds(ids: string[]): Promise<Lot[]> {
      console.log(`[FirestoreAdapter] LOG: getLotsByIds called for ${ids.length} IDs.`);
      if (ids.length === 0) return [];
      const snapshot = await this.db.collection('lots').where(firestore.FieldPath.documentId(), 'in', ids).get();
      return snapshot.docs.map(doc => this.toJSON<Lot>(doc));
    }
    
    async getLotCategories(): Promise<LotCategory[]> {
        console.log('[FirestoreAdapter] LOG: getLotCategories called.');
        try {
            const snapshot = await this.db.collection('lot_categories').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<LotCategory>(doc));
        } catch (error: any) {
            if (error.code === 5) {
                console.warn("[FirestoreAdapter] WARN: Collection 'lot_categories' not found. Returning empty array.");
                return [];
            }
            throw error;
        }
    }

    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
        console.log('[FirestoreAdapter] LOG: createLotCategory called.');
        const docRef = this.db.collection('lot_categories').doc(data.id || data.slug!);
        await docRef.set({ ...data, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() });
        return { success: true, message: 'Categoria criada.' };
    }
    
    async getSellers(): Promise<SellerProfileInfo[]> {
        console.log('[FirestoreAdapter] LOG: getSellers called.');
        try {
            const snapshot = await this.db.collection('sellers').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<SellerProfileInfo>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
        console.log('[FirestoreAdapter] LOG: getAuctioneers called.');
        try {
            const snapshot = await this.db.collection('auctioneers').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<AuctioneerProfileInfo>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    
    async getUsersWithRoles(): Promise<UserProfileData[]> {
        console.log('[FirestoreAdapter] LOG: getUsersWithRoles called.');
        try {
            const usersSnapshot = await this.db.collection('users').get();
            if (usersSnapshot.empty) return [];

            const rolesSnapshot = await this.db.collection('roles').get();
            const rolesMap = new Map(rolesSnapshot.docs.map(doc => [doc.id, this.toJSON<Role>(doc)]));

            return usersSnapshot.docs.map(userDoc => {
                const userData = this.toJSON<UserProfileData>(userDoc);
                const userRoleIds = userData.roleIds || [];
                userData.roleNames = userRoleIds.map(roleId => rolesMap.get(roleId)?.name).filter((name): name is string => !!name);
                userData.permissions = Array.from(new Set(userRoleIds.flatMap(roleId => rolesMap.get(roleId)?.permissions || [])));
                return userData;
            });
        } catch (error: any) {
             if (error.code === 5) { return []; }
            throw error;
        }
    }
    
    async getUserProfileData(userIdOrEmail: string): Promise<UserProfileData | null> {
        console.log(`[FirestoreAdapter] LOG: getUserProfileData called for: ${userIdOrEmail}`);
        let userDoc: FirebaseFirestore.DocumentSnapshot | null = null;
        try {
            if (userIdOrEmail.includes('@')) {
                const snapshot = await this.db.collection('users').where('email', '==', userIdOrEmail).limit(1).get();
                if (!snapshot.empty) userDoc = snapshot.docs[0];
            } else {
                userDoc = await this.db.collection('users').doc(userIdOrEmail).get();
            }

            if (!userDoc || !userDoc.exists) return null;

            const userData = this.toJSON<UserProfileData>(userDoc);
            
            if (userData.roleIds && userData.roleIds.length > 0) {
                const rolesSnapshot = await this.db.collection('roles').where(firestore.FieldPath.documentId(), 'in', userData.roleIds).get();
                const roles = rolesSnapshot.docs.map(doc => this.toJSON<Role>(doc));
                userData.roleNames = roles.map(r => r.name);
                userData.permissions = Array.from(new Set(roles.flatMap(r => r.permissions || [])));
            } else {
                userData.roleNames = [];
                userData.permissions = [];
            }
            return userData;
        } catch (error: any) {
            if (error.code === 5) { return null; }
            throw error;
        }
    }
    
    async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
        console.log(`[FirestoreAdapter] LOG: createUser called for email: ${data.email}`);
        const { uid, ...restData } = data;
        if (!uid) return { success: false, message: "UID is required to create a user."};
        const docRef = this.db.collection('users').doc(uid);
        
        const dataToSet = { ...restData, id: uid, uid: uid, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };

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
        console.log('[FirestoreAdapter] LOG: getRoles called.');
        try {
            const snapshot = await this.db.collection('roles').get();
            return snapshot.docs.map(doc => this.toJSON<Role>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }

    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; }> {
        console.log(`[FirestoreAdapter] LOG: createRole called for role: ${role.name}`);
        const docId = `role-${slugify(role.name)}`;
        const docRef = this.db.collection('roles').doc(docId);
        await docRef.set({ ...role, id: docId, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() });
        return { success: true, message: 'Role criada.' };
    }

    async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> {
        console.log(`[FirestoreAdapter] LOG: updateUserRoles called for user: ${userId}`);
        await this.db.collection('users').doc(userId).update({ roleIds: roleIds || [] });
        return { success: true, message: "Perfis do usuário atualizados." };
    }
    
    async getMediaItems(): Promise<MediaItem[]> {
        console.log('[FirestoreAdapter] LOG: getMediaItems called.');
        try {
            const snapshot = await this.db.collection('mediaItems').orderBy('uploadedAt', 'desc').get();
            return snapshot.docs.map(doc => this.toJSON<MediaItem>(doc));
        } catch (error: any) {
             if (error.code === 5) { return []; }
            throw error;
        }
    }
    
    async createMediaItem(itemData: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> {
       console.log(`[FirestoreAdapter] LOG: createMediaItem called by user: ${userId}`);
       const docRef = this.db.collection('mediaItems').doc();
       const newItem = { ...itemData, id: docRef.id, urlOriginal: url, urlThumbnail: url, uploadedAt: AdminFieldValue.serverTimestamp(), uploadedBy: userId };
       await docRef.set(newItem);
       return { success: true, message: "Mídia enviada com sucesso", item: newItem as MediaItem };
    }

    async getPlatformSettings(): Promise<PlatformSettings | null> {
        console.log("[FirestoreAdapter] LOG: Getting platform settings from Firestore.");
        try {
            const doc = await this.db.collection('settings').doc('global').get();
            if (doc.exists) {
                console.log("[FirestoreAdapter] LOG: Platform settings document found.");
                return this.toJSON<PlatformSettings>(doc);
            } else {
                console.warn("[FirestoreAdapter] LOG: Platform settings document NOT found.");
                return null;
            }
        } catch (error: any) {
            if (error.code === 5) {
                console.warn("[FirestoreAdapter] WARN: Collection 'settings' not found. Returning null.");
                return null;
            }
            console.error("[FirestoreAdapter] FATAL: Error fetching platform settings:", error);
            throw error;
        }
    }

    async createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> {
        console.log("[FirestoreAdapter] LOG: createPlatformSettings called.");
        await this.db.collection('settings').doc('global').set({ ...data, id: 'global', updatedAt: AdminFieldValue.serverTimestamp() }, { merge: true });
        return { success: true, message: "Configurações criadas com sucesso." };
    }

    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        console.log("[FirestoreAdapter] LOG: updatePlatformSettings called.");
        await this.db.collection('settings').doc('global').set({ ...data, updatedAt: AdminFieldValue.serverTimestamp() }, { merge: true });
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

    async getStates(): Promise<StateInfo[]> {
        try {
            const snapshot = await this.db.collection('states').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<StateInfo>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async getCities(stateId?: string): Promise<CityInfo[]> {
        try {
            let query: FirebaseFirestore.Query = this.db.collection('cities');
            if (stateId) query = query.where('stateId', '==', stateId);
            const snapshot = await query.orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<CityInfo>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async getSubcategoriesByParent(parentCategoryId?: string | undefined): Promise<Subcategory[]> { 
        if (!parentCategoryId) return [];
        try {
            const snapshot = await this.db.collection('subcategories').where('parentCategoryId', '==', parentCategoryId).orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<Subcategory>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async getSubcategory(id: string): Promise<Subcategory | null> { 
        const doc = await this.db.collection('subcategories').doc(id).get();
        return doc.exists ? this.toJSON<Subcategory>(doc) : null;
    }
    async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('subcategories', id, data); }
    async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { return this.genericDelete('subcategories', id); }
    async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('states', id, data); }
    async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this.genericDelete('states', id); }
    async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('cities', id, data); }
    async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this.genericDelete('cities', id); }
    async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('sellers', id, data, SellerProfileInfoSchema.partial()); }
    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return this.genericDelete('sellers', id); }
    async getSeller(id: string): Promise<SellerProfileInfo | null> {
        const doc = await this.db.collection('sellers').doc(id).get();
        return doc.exists ? this.toJSON<SellerProfileInfo>(doc) : null;
    }
    async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { 
        const doc = await this.db.collection('auctioneers').doc(id).get();
        return doc.exists ? this.toJSON<AuctioneerProfileInfo>(doc) : null;
    }
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string | undefined; }> { 
        const result = await this.genericCreate('auctioneers', data);
        return { ...result, auctioneerId: result.id };
    }
    async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('auctioneers', id, data, AuctioneerProfileInfoSchema.partial()); }
    async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return this.genericDelete('auctioneers', id); }
    
    async getCourts(): Promise<Court[]> { 
        try {
            const snapshot = await this.db.collection('courts').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<Court>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('courts', id, data); }
    
    async getJudicialDistricts(): Promise<JudicialDistrict[]> {
        try {
            const snapshot = await this.db.collection('judicial_districts').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<JudicialDistrict>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string | undefined; }> { 
        const result = await this.genericCreate('judicial_districts', data);
        return { ...result, districtId: result.id };
    }

    async getJudicialBranches(): Promise<JudicialBranch[]> { 
        try {
            const snapshot = await this.db.collection('judicial_branches').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<JudicialBranch>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string | undefined; }> { 
        const result = await this.genericCreate('judicial_branches', data);
        return { ...result, branchId: result.id };
    }
    
    async getJudicialProcesses(): Promise<JudicialProcess[]> {
        try {
            const snapshot = await this.db.collection('judicial_processes').get();
            return snapshot.docs.map(doc => this.toJSON<JudicialProcess>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string | undefined; }> { 
        const result = await this.genericCreate('judicial_processes', data);
        return { ...result, processId: result.id };
    }

    async getBem(id: string): Promise<Bem | null> { 
        const doc = await this.db.collection('bens').doc(id).get();
        return doc.exists ? this.toJSON<Bem>(doc) : null;
    }
    async getBens(filter?: { judicialProcessId?: string; sellerId?: string; } | undefined): Promise<Bem[]> { 
        try {
            let query: FirebaseFirestore.Query = this.db.collection('bens');
            if (filter?.judicialProcessId) {
                query = query.where('judicialProcessId', '==', filter.judicialProcessId);
            }
            if (filter?.sellerId) {
                query = query.where('sellerId', '==', filter.sellerId);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => this.toJSON<Bem>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
    async getBensByIds(ids: string[]): Promise<Bem[]> { 
      if (ids.length === 0) return [];
       try {
            const snapshot = await this.db.collection('bens').where(firestore.FieldPath.documentId(), 'in', ids).get();
            return snapshot.docs.map(doc => this.toJSON<Bem>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }
     async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string | undefined; }> { 
        const result = await this.genericCreate('bens', data);
        return { ...result, bemId: result.id };
    }
    async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('bens', id, data); }
    async deleteBem(id: string): Promise<{ success: boolean, message: string }> { return this.genericDelete('bens', id); }

    async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { 
        try {
            const snapshot = await this.db.collection('direct_sales').get();
            return snapshot.docs.map(doc => this.toJSON<DirectSaleOffer>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }

    async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> {
        const docRef = this.db.collection('user_documents').doc();
        const data = { id: docRef.id, userId, documentTypeId, fileUrl, fileName, status: 'PENDING_ANALYSIS', createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
        await docRef.set(data);
        return { success: true, message: "Documento salvo com sucesso." };
    }

    async getDocumentTemplates(): Promise<DocumentTemplate[]> {
        try {
            const snapshot = await this.db.collection('document_templates').orderBy('name').get();
            return snapshot.docs.map(doc => this.toJSON<DocumentTemplate>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }

    async getContactMessages(): Promise<ContactMessage[]> {
        try {
            const snapshot = await this.db.collection('contactMessages').orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => this.toJSON<ContactMessage>(doc));
        } catch (error: any) { if (error.code === 5) { return []; } throw error; }
    }

     async saveContactMessage(message: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>): Promise<{ success: boolean; message: string }> {
        const docRef = this.db.collection('contactMessages').doc();
        await docRef.set({
            ...message,
            id: docRef.id,
            isRead: false,
            createdAt: AdminFieldValue.serverTimestamp(),
        });
        return { success: true, message: 'Mensagem enviada com sucesso!' };
    }
}
