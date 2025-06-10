
// src/lib/database/firestore.adapter.ts
import { 
  ensureAdminInitialized, 
  AdminFieldValue, 
  ServerTimestamp 
} from '@/lib/firebase/admin';
import type { FirebaseFirestore } from 'firebase-admin/firestore';
import type { 
  IDatabaseAdapter, 
  LotCategory, StateInfo, StateFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData,
  Lot, LotFormData,
  BidInfo,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData,
  UserFormValues
} from '@/types';
import { slugify } from '@/lib/sample-data';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import { getLotCategoryByName } from '@/app/admin/categories/actions';
import { getAuctioneerByName } from '@/app/admin/auctioneers/actions';
import { getSellerByName } from '@/app/admin/sellers/actions';

// Helper to convert various timestamp types to JS Date
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
  private getDbAdmin(): FirebaseFirestore.Firestore {
    const { db, error } = ensureAdminInitialized();
    if (error || !db) {
      const errorMessage = `FirestoreAdapter: Failed to initialize Firestore Admin SDK - ${error?.message || 'dbAdmin not available'}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    return db;
  }

  // --- Categories ---
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const db = this.getDbAdmin();
    try {
      const newCategoryData = {
        name: data.name.trim(),
        slug: slugify(data.name.trim()),
        description: data.description?.trim() || '',
        itemCount: 0,
        createdAt: AdminFieldValue.serverTimestamp(),
        updatedAt: AdminFieldValue.serverTimestamp(),
      };
      const docRef = await db.collection('lotCategories').add(newCategoryData);
      return { success: true, message: 'Categoria criada com sucesso!', categoryId: docRef.id };
    } catch (error: any) {
      console.error("[FirestoreAdapter - createLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao criar categoria.' };
    }
  }

  async getLotCategories(): Promise<LotCategory[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('lotCategories').orderBy('name', 'asc').get();
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
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('lotCategories').doc(id).get();
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
    const db = this.getDbAdmin();
    try {
      const categoryDocRef = db.collection('lotCategories').doc(id);
      const updateData: any = {
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
    const db = this.getDbAdmin();
    try {
      await db.collection('lotCategories').doc(id).delete();
      return { success: true, message: 'Categoria excluída com sucesso!' };
    } catch (error: any) {
      console.error("[FirestoreAdapter - deleteLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao excluir categoria.' };
    }
  }

  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    const db = this.getDbAdmin();
    try {
      const newStateData = { ...data, slug: slugify(data.name), cityCount: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await db.collection('states').add(newStateData);
      return { success: true, message: 'Estado criado!', stateId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getStates(): Promise<StateInfo[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('states').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt) } as StateInfo));
    } catch (e: any) { return []; }
  }
  async getState(id: string): Promise<StateInfo | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('states').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as StateInfo;
    } catch (e: any) { return null; }
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if(data.name) updateData.slug = slugify(data.name);
      await db.collection('states').doc(id).update(updateData);
      return { success: true, message: 'Estado atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      await db.collection('states').doc(id).delete();
      return { success: true, message: 'Estado excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    const db = this.getDbAdmin();
    try {
      const parentStateDoc = await db.collection('states').doc(data.stateId).get();
      if (!parentStateDoc.exists) return { success: false, message: 'Estado pai não encontrado.' };
      const parentState = parentStateDoc.data() as StateInfo;
      const newCityData = { ...data, slug: slugify(data.name), stateUf: parentState.uf, lotCount: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await db.collection('cities').add(newCityData);
      return { success: true, message: 'Cidade criada!', cityId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const db = this.getDbAdmin();
    try {
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('cities');
      if (stateIdFilter) {
        query = query.where('stateId', '==', stateIdFilter);
      }
      const snapshot = await query.orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt) } as CityInfo));
    } catch (e: any) { return []; }
  }
  async getCity(id: string): Promise<CityInfo | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('cities').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as CityInfo;
    } catch (e: any) { return null; }
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if (data.name) updateData.slug = slugify(data.name);
      if (data.stateId) {
          const parentStateDoc = await db.collection('states').doc(data.stateId).get();
          if (!parentStateDoc.exists) return { success: false, message: 'Estado pai não encontrado.' };
          updateData.stateUf = (parentStateDoc.data() as StateInfo).uf;
      }
      await db.collection('cities').doc(id).update(updateData);
      return { success: true, message: 'Cidade atualizada!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      await db.collection('cities').doc(id).delete();
      return { success: true, message: 'Cidade excluída!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    const db = this.getDbAdmin();
    try {
      const newAuctioneerData = { ...data, slug: slugify(data.name), memberSince: AdminFieldValue.serverTimestamp(), rating: 0, auctionsConductedCount: 0, totalValueSold: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await db.collection('auctioneers').add(newAuctioneerData);
      return { success: true, message: 'Leiloeiro criado!', auctioneerId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('auctioneers').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt), memberSince: safeConvertOptionalDate(doc.data().memberSince) } as AuctioneerProfileInfo));
    } catch (e: any) { return []; }
  }
  async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('auctioneers').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as AuctioneerProfileInfo;
    } catch (e: any) { return null; }
  }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('auctioneers').where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as AuctioneerProfileInfo;
    } catch (e: any) { return null; }
  }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if(data.name) updateData.slug = slugify(data.name);
      await db.collection('auctioneers').doc(id).update(updateData);
      return { success: true, message: 'Leiloeiro atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      await db.collection('auctioneers').doc(id).delete();
      return { success: true, message: 'Leiloeiro excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const db = this.getDbAdmin();
    try {
      const newSellerData = { ...data, slug: slugify(data.name), memberSince: AdminFieldValue.serverTimestamp(), rating: 0, activeLotsCount: 0, totalSalesValue: 0, auctionsFacilitatedCount: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await db.collection('sellers').add(newSellerData);
      return { success: true, message: 'Comitente criado!', sellerId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getSellers(): Promise<SellerProfileInfo[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('sellers').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt), memberSince: safeConvertOptionalDate(doc.data().memberSince) } as SellerProfileInfo));
    } catch (e: any) { return []; }
  }
  async getSeller(id: string): Promise<SellerProfileInfo | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('sellers').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as SellerProfileInfo;
    } catch (e: any) { return null; }
  }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('sellers').where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as SellerProfileInfo;
    } catch (e: any) { return null; }
  }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if(data.name) updateData.slug = slugify(data.name);
      await db.collection('sellers').doc(id).update(updateData);
      return { success: true, message: 'Comitente atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      await db.collection('sellers').doc(id).delete();
      return { success: true, message: 'Comitente excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async createAuction(data: AuctionFormData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    const db = this.getDbAdmin();
    try {
      let categoryId: string | undefined;
      let auctioneerId: string | undefined;
      let sellerId: string | undefined;

      if (data.category) {
        const categoryDoc = await getLotCategoryByName(data.category);
        if (!categoryDoc) return { success: false, message: `Categoria '${data.category}' não encontrada.`};
        categoryId = categoryDoc.id;
      }
      if (data.auctioneer) {
        const auctioneerDoc = await getAuctioneerByName(data.auctioneer);
        if (!auctioneerDoc) return { success: false, message: `Leiloeiro '${data.auctioneer}' não encontrado.`};
        auctioneerId = auctioneerDoc.id;
      }
      if (data.seller) {
        const sellerDoc = await getSellerByName(data.seller);
        if (sellerDoc) sellerId = sellerDoc.id;
        // Seller is optional, so don't fail if not found, just leave sellerId undefined
      }

      const { category, auctioneer, seller, ...restOfData } = data;

      const newAuctionData: any = { 
        ...restOfData,
        categoryId,
        auctioneerId,
        sellerId,
        auctionDate: ServerTimestamp.fromDate(data.auctionDate as Date),
        endDate: data.endDate ? ServerTimestamp.fromDate(data.endDate as Date) : null, 
        totalLots:0, visits:0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() 
      };
      if (data.endDate === null || data.endDate === undefined) newAuctionData.endDate = null;
      
      const docRef = await db.collection('auctions').add(newAuctionData);
      return { success: true, message: 'Leilão criado!', auctionId: docRef.id };
    } catch (e: any) { 
      console.error("[FirestoreAdapter - createAuction] Error:", e);
      return { success: false, message: e.message }; 
    }
  }
  async getAuctions(): Promise<Auction[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('auctions').orderBy('auctionDate', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), auctionDate: safeConvertToDate(doc.data().auctionDate), endDate: safeConvertOptionalDate(doc.data().endDate), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt), lots: doc.data().lots || [] } as Auction));
    } catch (e: any) { return []; }
  }
  async getAuction(id: string): Promise<Auction | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('auctions').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, auctionDate: safeConvertToDate(data.auctionDate), endDate: safeConvertOptionalDate(data.endDate), createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), lots: data.lots || [] } as Auction;
    } catch (e: any) { return null; }
  }
  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> {
    const db = this.getDbAdmin();
    try {
        const sellerDoc = await getSellerBySlug(sellerSlug);
        if (!sellerDoc) return [];
        
        const snapshot = await db.collection('auctions').where('sellerId', '==', sellerDoc.id).orderBy('auctionDate', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), auctionDate: safeConvertToDate(doc.data().auctionDate), endDate: safeConvertOptionalDate(doc.data().endDate), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt), lots: doc.data().lots || [] } as Auction));
    } catch (e: any) { return []; }
  }
  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = { ...data, updatedAt: AdminFieldValue.serverTimestamp() };
      
      if (data.category) {
        const categoryDoc = await getLotCategoryByName(data.category);
        if (!categoryDoc) return { success: false, message: `Categoria '${data.category}' não encontrada.`};
        updateData.categoryId = categoryDoc.id;
        delete updateData.category; 
      }
      if (data.auctioneer) {
        const auctioneerDoc = await getAuctioneerByName(data.auctioneer);
        if (!auctioneerDoc) return { success: false, message: `Leiloeiro '${data.auctioneer}' não encontrado.`};
        updateData.auctioneerId = auctioneerDoc.id;
        delete updateData.auctioneer;
      }
      if (data.seller) {
        const sellerDoc = await getSellerByName(data.seller);
        if (sellerDoc) updateData.sellerId = sellerDoc.id;
        else updateData.sellerId = null; // Or handle as error if seller is mandatory
        delete updateData.seller;
      } else if (data.hasOwnProperty('seller') && data.seller === null) { // Explicitly setting seller to null
         updateData.sellerId = null;
         delete updateData.seller;
      }


      if (data.auctionDate) updateData.auctionDate = ServerTimestamp.fromDate(new Date(data.auctionDate));
      if (data.hasOwnProperty('endDate')) updateData.endDate = data.endDate ? ServerTimestamp.fromDate(new Date(data.endDate)) : null;

      await db.collection('auctions').doc(id).update(updateData);
      return { success: true, message: 'Leilão atualizado!' };
    } catch (e: any) { 
      console.error("[FirestoreAdapter - updateAuction] Error:", e);
      return { success: false, message: e.message }; 
    }
  }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      await db.collection('auctions').doc(id).delete();
      return { success: true, message: 'Leilão excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async createLot(data: LotFormData): Promise<{ success: boolean; message: string; lotId?: string; }> {
    const db = this.getDbAdmin();
    try {
      const { lotSpecificAuctionDate, secondAuctionDate, endDate, stateId, cityId, mediaItemIds, galleryImageUrls, ...restData } = data;
      const newLotData: any = { ...restData, views: data.views || 0, bidsCount: data.bidsCount || 0, auctionName: data.auctionName || `Lote ${data.title.substring(0,20)}`, endDate: ServerTimestamp.fromDate(new Date(endDate)), mediaItemIds: mediaItemIds || [], galleryImageUrls: galleryImageUrls || [], createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      if (stateId) {
        const stateDoc = await db.collection('states').doc(stateId).get();
        if (stateDoc.exists) { newLotData.stateId = stateId; newLotData.stateUf = (stateDoc.data() as StateInfo).uf; }
      }
      if (cityId) {
        const cityDoc = await db.collection('cities').doc(cityId).get();
        if (cityDoc.exists) { newLotData.cityId = cityId; newLotData.cityName = (cityDoc.data() as CityInfo).name; }
      }
      newLotData.lotSpecificAuctionDate = lotSpecificAuctionDate ? ServerTimestamp.fromDate(new Date(lotSpecificAuctionDate)) : null;
      newLotData.secondAuctionDate = secondAuctionDate ? ServerTimestamp.fromDate(new Date(secondAuctionDate)) : null;
      const docRef = await db.collection('lots').add(newLotData);
      return { success: true, message: 'Lote criado!', lotId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    const db = this.getDbAdmin();
    try {
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('lots');
      if (auctionIdParam) {
        query = query.where('auctionId', '==', auctionIdParam);
      }
      const snapshot = await query.orderBy('title').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), endDate: safeConvertToDate(doc.data().endDate), lotSpecificAuctionDate: safeConvertOptionalDate(doc.data().lotSpecificAuctionDate), secondAuctionDate: safeConvertOptionalDate(doc.data().secondAuctionDate), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt) } as Lot));
    } catch (e: any) { return []; }
  }
  async getLot(id: string): Promise<Lot | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('lots').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, endDate: safeConvertToDate(data.endDate), lotSpecificAuctionDate: safeConvertOptionalDate(data.lotSpecificAuctionDate), secondAuctionDate: safeConvertOptionalDate(data.secondAuctionDate), createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as Lot;
    } catch (e: any) { return null; }
  }
  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = (data as any)[key];
            if (key === 'endDate' || key === 'lotSpecificAuctionDate' || key === 'secondAuctionDate') {
                updateData[key] = value ? ServerTimestamp.fromDate(new Date(value)) : null;
            } else if (key === 'stateId') {
                if (value) { const stateDoc = await db.collection('states').doc(value).get(); if (stateDoc.exists) { updateData.stateId = value; updateData.stateUf = (stateDoc.data() as StateInfo).uf; } else { updateData.stateId = null; updateData.stateUf = null;} } else { updateData.stateId = null; updateData.stateUf = null; }
            } else if (key === 'cityId') {
                if (value) { const cityDoc = await db.collection('cities').doc(value).get(); if (cityDoc.exists) { updateData.cityId = value; updateData.cityName = (cityDoc.data() as CityInfo).name; } else { updateData.cityId = null; updateData.cityName = null;} } else { updateData.cityId = null; updateData.cityName = null; }
            } else if (key === 'mediaItemIds' || key === 'galleryImageUrls') {
                 updateData[key] = Array.isArray(value) ? value : [];
            } else if (value !== undefined) {
                updateData[key] = value;
            }
        }
      }
      updateData.updatedAt = AdminFieldValue.serverTimestamp();
      await db.collection('lots').doc(id).update(updateData);
      return { success: true, message: 'Lote atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      await db.collection('lots').doc(id).delete();
      return { success: true, message: 'Lote excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('lots').doc(lotId).collection('bids').orderBy('timestamp', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: safeConvertToDate(doc.data().timestamp) } as BidInfo));
    } catch (e: any) { return []; }
  }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> {
    const db = this.getDbAdmin();
    try {
      const lotRef = db.collection('lots').doc(lotId);
      const lotSnap = await lotRef.get();
      if (!lotSnap.exists) return { success: false, message: "Lote não encontrado."};
      const lotData = lotSnap.data() as Lot;
      if (bidAmount <= lotData.price) return { success: false, message: "Lance deve ser maior que o atual."};
      
      const newBidData = { lotId, auctionId, bidderId: userId, bidderDisplay: userDisplayName, amount: bidAmount, timestamp: AdminFieldValue.serverTimestamp()};
      const bidRef = await db.collection('lots').doc(lotId).collection('bids').add(newBidData);
      await lotRef.update({ price: bidAmount, bidsCount: AdminFieldValue.increment(1), updatedAt: AdminFieldValue.serverTimestamp() });
      
      return { success: true, message: "Lance registrado!", updatedLot: { price: bidAmount, bidsCount: (lotData.bidsCount || 0) + 1 }, newBid: { id: bidRef.id, ...newBidData, timestamp: new Date() } as BidInfo };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('users').doc(userId).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { uid: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), dateOfBirth: safeConvertOptionalDate(data.dateOfBirth), rgIssueDate: safeConvertOptionalDate(data.rgIssueDate) } as UserProfileData;
    } catch (e: any) { return null; }
  }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if (data.dateOfBirth) updateData.dateOfBirth = ServerTimestamp.fromDate(new Date(data.dateOfBirth));
      if (data.rgIssueDate) updateData.rgIssueDate = ServerTimestamp.fromDate(new Date(data.rgIssueDate));
      await db.collection('users').doc(userId).update(updateData);
      return { success: true, message: 'Perfil atualizado!'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
    const db = this.getDbAdmin();
    const { auth } = ensureAdminInitialized();
    if (!auth) return { success: false, message: 'Auth Admin SDK não inicializado.'};
    try {
        await this.ensureDefaultRolesExist();
        const targetRole = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER');
        if (!targetRole) return { success: false, message: 'Perfil padrão USER não encontrado.'};

        const userDocRef = db.collection('users').doc(userId);
        const userSnap = await userDocRef.get();
        let finalProfileData: UserProfileData;

        if (userSnap.exists) {
            const userDataFromDB = userSnap.data() as UserProfileData;
            const updatePayload: any = { updatedAt: AdminFieldValue.serverTimestamp() };
            let needsUpdate = false;
            if (userDataFromDB.roleId !== targetRole.id) { updatePayload.roleId = targetRole.id; needsUpdate = true; }
            if (userDataFromDB.roleName !== targetRole.name) { updatePayload.roleName = targetRole.name; needsUpdate = true; }
            if (JSON.stringify(userDataFromDB.permissions || []) !== JSON.stringify(targetRole.permissions || [])) { updatePayload.permissions = targetRole.permissions || []; needsUpdate = true; }
            if (needsUpdate) await userDocRef.update(updatePayload);
            finalProfileData = { ...userDataFromDB, ...updatePayload, uid: userId } as UserProfileData;
        } else {
            const authUserRecord = await auth.getUser(userId).catch(() => null);
            const newUserProfile: Omit<UserProfileData, 'uid'> & { uid: string, createdAt: any, updatedAt: any } = {
                uid: userId,
                email: email,
                fullName: fullName || authUserRecord?.displayName || email.split('@')[0],
                roleId: targetRole.id,
                roleName: targetRole.name,
                permissions: targetRole.permissions || [],
                status: 'ATIVO',
                habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
                createdAt: AdminFieldValue.serverTimestamp(),
                updatedAt: AdminFieldValue.serverTimestamp(),
            };
            await userDocRef.set(newUserProfile);
            const createdSnap = await userDocRef.get();
            finalProfileData = { uid: createdSnap.id, ...createdSnap.data() } as UserProfileData;
        }
        return { success: true, message: 'Perfil de usuário assegurado/atualizado.', userProfile: finalProfileData };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getUsersWithRoles(): Promise<UserProfileData[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('users').orderBy('fullName').get();
      return Promise.all(snapshot.docs.map(async docSnap => {
        const data = docSnap.data();
        let roleName = data.roleName;
        let permissions = data.permissions || [];
        if (data.roleId && !roleName) {
            const roleDoc = await this.getRole(data.roleId);
            if (roleDoc) { roleName = roleDoc.name; permissions = roleDoc.permissions || []; }
        }
        return { uid: docSnap.id, ...data, roleName: roleName || 'Não Definido', permissions, createdAt: safeConvertToDate(data.createdAt) } as UserProfileData;
      }));
    } catch (e: any) { return []; }
  }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = { updatedAt: AdminFieldValue.serverTimestamp() };
      if (roleId && roleId !== "---NONE---") {
        const roleDoc = await this.getRole(roleId);
        if (roleDoc) { updateData.roleId = roleId; updateData.roleName = roleDoc.name; updateData.permissions = roleDoc.permissions || []; }
        else return { success: false, message: 'Perfil não encontrado.'};
      } else {
        updateData.roleId = AdminFieldValue.delete(); updateData.roleName = AdminFieldValue.delete(); updateData.permissions = AdminFieldValue.delete();
      }
      await db.collection('users').doc(userId).update(updateData);
      return { success: true, message: 'Perfil atualizado!'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    const { auth } = ensureAdminInitialized();
    if (!auth) return { success: false, message: 'Auth Admin SDK não inicializado.'};
    try {
      await auth.deleteUser(userId).catch(e => { if (e.code !== 'auth/user-not-found') throw e;});
      await db.collection('users').doc(userId).delete();
      return { success: true, message: 'Usuário excluído!'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    const db = this.getDbAdmin();
    try {
      const normalizedName = data.name.trim().toUpperCase();
      const existing = await db.collection('roles').where('name_normalized', '==', normalizedName).limit(1).get();
      if (!existing.empty) return { success: false, message: `Perfil "${data.name}" já existe.`};
      const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
      const newRoleData = { ...data, name_normalized: normalizedName, permissions: validPermissions, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await db.collection('roles').add(newRoleData);
      return { success: true, message: 'Perfil criado!', roleId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getRoles(): Promise<Role[]> {
    const db = this.getDbAdmin();
    try {
      const snapshot = await db.collection('roles').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt) } as Role));
    } catch (e: any) { return []; }
  }
  async getRole(id: string): Promise<Role | null> {
    const db = this.getDbAdmin();
    try {
      const docSnap = await db.collection('roles').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as Role;
    } catch (e: any) { return null; }
  }
  async getRoleByName(name: string): Promise<Role | null> {
    const db = this.getDbAdmin();
    try {
      const normalizedName = name.trim().toUpperCase();
      const snapshot = await db.collection('roles').where('name_normalized', '==', normalizedName).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as Role;
    } catch (e: any) { return null; }
  }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const updateData: any = { ...data, updatedAt: AdminFieldValue.serverTimestamp() };
      if (data.name) {
        const normalizedName = data.name.trim().toUpperCase();
        const currentRole = await this.getRole(id);
        if (currentRole?.name_normalized !== 'ADMINISTRATOR' && currentRole?.name_normalized !== 'USER') { 
            updateData.name_normalized = normalizedName;
        }
        updateData.name = data.name.trim();
      }
      if (data.permissions) {
        updateData.permissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
      }
      await db.collection('roles').doc(id).update(updateData);
      return { success: true, message: 'Perfil atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
      const roleDoc = await db.collection('roles').doc(id).get();
      if (roleDoc.exists && ['ADMINISTRATOR', 'USER'].includes(roleDoc.data()!.name_normalized)) {
          return { success: false, message: 'Perfis de sistema não podem ser excluídos.'};
      }
      await db.collection('roles').doc(id).delete();
      return { success: true, message: 'Perfil excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    const defaultRolesData: RoleFormData[] = [ 
      { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
      { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
      { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
      { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
      { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
    ];
    try {
      for (const roleData of defaultRolesData) {
        const role = await this.getRoleByName(roleData.name);
        if (!role) {
          await this.createRole(roleData);
        } else { 
          const currentPermissionsSorted = [...(role.permissions || [])].sort();
          const expectedPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
          if (JSON.stringify(currentPermissionsSorted) !== JSON.stringify(expectedPermissions) || role.description !== (roleData.description || '')) {
            await this.updateRole(role.id, { description: roleData.description, permissions: expectedPermissions });
          }
        }
      }
      return { success: true, message: 'Perfis padrão verificados/criados.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> {
    const db = this.getDbAdmin();
    try {
        const newMediaItemData = { ...data, urlOriginal: filePublicUrl, urlThumbnail: filePublicUrl, urlMedium: filePublicUrl, urlLarge: filePublicUrl, uploadedBy: uploadedBy || 'system', uploadedAt: AdminFieldValue.serverTimestamp(), linkedLotIds: [] };
        const docRef = await db.collection('mediaItems').add(newMediaItemData);
        return { success: true, message: "Item de mídia criado.", item: { id: docRef.id, ...newMediaItemData, uploadedAt: new Date() } as MediaItem };
    } catch (e: any) { return { success: false, message: `Erro: ${e.message}`}; }
  }
  async getMediaItems(): Promise<MediaItem[]> {
    const db = this.getDbAdmin();
    try {
        const snapshot = await db.collection('mediaItems').orderBy('uploadedAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), uploadedAt: safeConvertToDate(doc.data().uploadedAt) } as MediaItem));
    } catch (e: any) { 
        console.warn("[FirestoreAdapter - getMediaItems] Error (falling back to empty array):", e);
        // Não lançar erro aqui para permitir que o fallback para dados de exemplo funcione na UI
        // se a permissão do Firestore for o problema.
        return []; 
    }
  }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
        await db.collection('mediaItems').doc(id).update({ ...metadata, updatedAt: AdminFieldValue.serverTimestamp() });
        return { success: true, message: 'Metadados atualizados.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    try {
        await db.collection('mediaItems').doc(id).delete();
        return { success: true, message: 'Item de mídia excluído do Firestore.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    const batch = db.batch();
    try {
        const lotRef = db.collection('lots').doc(lotId);
        batch.update(lotRef, { mediaItemIds: AdminFieldValue.arrayUnion(...mediaItemIds), updatedAt: AdminFieldValue.serverTimestamp() });
        mediaItemIds.forEach(mediaId => {
            const mediaRef = db.collection('mediaItems').doc(mediaId);
            batch.update(mediaRef, { linkedLotIds: AdminFieldValue.arrayUnion(lotId) });
        });
        await batch.commit();
        return { success: true, message: 'Mídias vinculadas.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    const batch = db.batch();
    try {
        const lotRef = db.collection('lots').doc(lotId);
        batch.update(lotRef, { mediaItemIds: AdminFieldValue.arrayRemove(mediaItemId), updatedAt: AdminFieldValue.serverTimestamp() });
        const mediaRef = db.collection('mediaItems').doc(mediaItemId);
        batch.update(mediaRef, { linkedLotIds: AdminFieldValue.arrayRemove(lotId) });
        await batch.commit();
        return { success: true, message: 'Mídia desvinculada.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async getPlatformSettings(): Promise<PlatformSettings> {
    const db = this.getDbAdmin();
    try {
        const settingsDoc = await db.collection('platformSettings').doc('global').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data()!;
            return { id: 'global', galleryImageBasePath: data.galleryImageBasePath || '/media/gallery/', updatedAt: safeConvertToDate(data.updatedAt) };
        }
        const defaultSettings = { galleryImageBasePath: '/media/gallery/', updatedAt: AdminFieldValue.serverTimestamp()};
        await db.collection('platformSettings').doc('global').set(defaultSettings);
        return { id: 'global', ...defaultSettings, updatedAt: new Date() } as PlatformSettings;
    } catch (e: any) { return { id: 'global', galleryImageBasePath: '/media/gallery/', updatedAt: new Date() }; }
  }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    const db = this.getDbAdmin();
    if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) return { success: false, message: 'Caminho base inválido.' };
    try {
        const updatePayload = { galleryImageBasePath: data.galleryImageBasePath, updatedAt: AdminFieldValue.serverTimestamp() };
        await db.collection('platformSettings').doc('global').set(updatePayload, { merge: true });
        return { success: true, message: 'Configurações atualizadas.' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
}

