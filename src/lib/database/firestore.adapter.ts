// src/lib/database/firestore.adapter.ts
import { 
  type Firestore, 
  FieldValue, 
  Timestamp
} from 'firebase-admin/firestore';

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
  JudicialDistrict, JudicialDistrictFormData
} from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { samplePlatformSettings } from '@/lib/sample-data';


const AdminFieldValue = FieldValue;
const ServerTimestamp = Timestamp;

function safeConvertToISOString(timestampField: any): string {
  if (!timestampField) return new Date().toISOString(); 
  if (timestampField && typeof timestampField.toDate === 'function') {
    return timestampField.toDate().toISOString();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000).toISOString();
  }
  if (timestampField instanceof Date) return timestampField.toISOString();
  
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate.toISOString();
  
  console.warn(`[FirestoreAdapter] Could not convert timestamp: ${JSON.stringify(timestampField)}. Returning current date as ISO string.`);
  return new Date().toISOString();
}


function safeConvertOptionalISOString(timestampField: any): string | undefined | null {
    if (timestampField === null || timestampField === undefined) {
      return null;
    }
    return safeConvertToISOString(timestampField);
}

export class FirestoreAdapter implements IDatabaseAdapter {
  private db: Firestore;

  constructor(firestoreInstance: Firestore) {
    if (!firestoreInstance) {
      const errorMessage = `FirestoreAdapter: Firestore instance (dbAdmin) not provided to constructor. This should be passed from getDatabaseAdapter after ensuring Firebase Admin is initialized.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.db = firestoreInstance;
    console.log("[FirestoreAdapter] Instance created with provided Firestore service.");
  }

  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[] }> {
    console.log('[FirestoreAdapter] Schema initialization is not typically required for Firestore in the same way as SQL. Collections are created on first use.');
    try {
        await this.ensureDefaultRolesExist();
        await this.getPlatformSettings(); 
        return { success: true, message: 'Firestore adapter ready. Collections will be created on first document write. Default roles and settings ensured.' };
    } catch (error: any) {
        return { success: false, message: `Error during Firestore post-init checks: ${error.message}`, errors: [error] };
    }
  }

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
          hasSubcategories: data.hasSubcategories || false,
          createdAt: safeConvertToISOString(data.createdAt),
          updatedAt: safeConvertToISOString(data.updatedAt),
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
            hasSubcategories: data.hasSubcategories || false,
            createdAt: safeConvertToISOString(data.createdAt),
            updatedAt: safeConvertToISOString(data.updatedAt),
        } as LotCategory;
      }
      return null;
    } catch (error: any) {
      console.error(`[FirestoreAdapter - getLotCategory with ID ${id}] Error:`, error);
      return null;
    }
  }

  async updateLotCategory(id: string, data: { name: string; description?: string; hasSubcategories?: boolean; }): Promise<{ success: boolean; message: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    try {
      const categoryDocRef = this.db.collection('lotCategories').doc(id);
      const updateData: any = {
        name: data.name.trim(),
        slug: slugify(data.name.trim()),
        description: data.description?.trim() || '',
        updatedAt: AdminFieldValue.serverTimestamp(),
      };
      if (data.hasSubcategories !== undefined) {
          updateData.hasSubcategories = data.hasSubcategories;
      }
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
  
  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    console.warn("[FirestoreAdapter] getLotCategoryByName not implemented.");
    return null;
  }
  
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
      console.warn("[FirestoreAdapter] createSubcategory not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
      console.warn("[FirestoreAdapter] getSubcategories not implemented.");
      return [];
  }
  async getSubcategory(id: string): Promise<Subcategory | null> {
      console.warn("[FirestoreAdapter] getSubcategory not implemented.");
      return null;
  }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
      console.warn("[FirestoreAdapter] getSubcategoryBySlug not implemented.");
      return null;
  }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
      console.warn("[FirestoreAdapter] updateSubcategory not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
      console.warn("[FirestoreAdapter] deleteSubcategory not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }

  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    try {
      const slug = slugify(data.name);
      const newStateData = { ...data, slug, cityCount: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      await this.db.collection('states').doc(slug).set(newStateData);
      return { success: true, message: 'Estado criado!', stateId: slug };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getStates(): Promise<StateInfo[]> {
    try {
      const snapshot = await this.db.collection('states').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToISOString(doc.data().createdAt), updatedAt: safeConvertToISOString(doc.data().updatedAt) } as StateInfo));
    } catch (e: any) { return []; }
  }
  async getState(id: string): Promise<StateInfo | null> {
    try {
      const docSnap = await this.db.collection('states').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt) } as StateInfo;
    } catch (e: any) { return null; }
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if(data.name) updateData.slug = slugify(data.name);
      await this.db.collection('states').doc(id).update(updateData);
      return { success: true, message: 'Estado atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('states').doc(id).delete();
      return { success: true, message: 'Estado excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    try {
      const parentStateDoc = await this.db.collection('states').doc(data.stateId).get();
      if (!parentStateDoc.exists) return { success: false, message: 'Estado pai não encontrado.' };
      const parentState = parentStateDoc.data() as StateInfo;
      const citySlug = slugify(data.name);
      const cityDocId = `${data.stateId}-${citySlug}`;
      const newCityData = { ...data, slug: citySlug, stateUf: parentState.uf, lotCount: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      await this.db.collection('cities').doc(cityDocId).set(newCityData);
      return { success: true, message: 'Cidade criada!', cityId: cityDocId };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> {
    try {
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.db.collection('cities');
      if (stateIdOrSlugFilter) {
        query = query.where('stateId', '==', stateIdOrSlugFilter);
      }
      const snapshot = await query.orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToISOString(doc.data().createdAt), updatedAt: safeConvertToISOString(doc.data().updatedAt) } as CityInfo));
    } catch (e: any) { return []; }
  }
  async getCity(id: string): Promise<CityInfo | null> {
    try {
      const docSnap = await this.db.collection('cities').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt) } as CityInfo;
    } catch (e: any) { return null; }
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if (data.name) updateData.slug = slugify(data.name); 
      if (data.stateId) {
          const parentStateDoc = await this.db.collection('states').doc(data.stateId).get();
          if (!parentStateDoc.exists) return { success: false, message: 'Estado pai não encontrado.' };
          updateData.stateUf = (parentStateDoc.data() as StateInfo).uf;
      }
      await this.db.collection('cities').doc(id).update(updateData);
      return { success: true, message: 'Cidade atualizada!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('cities').doc(id).delete();
      return { success: true, message: 'Cidade excluída!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    try {
      const newAuctioneerData = { ...data, publicId: `AUCT-PUB-${uuidv4()}`, slug: slugify(data.name), memberSince: AdminFieldValue.serverTimestamp(), rating: 0, auctionsConductedCount: 0, totalValueSold: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await this.db.collection('auctioneers').add(newAuctioneerData);
      return { success: true, message: 'Leiloeiro criado!', auctioneerId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    try {
      const snapshot = await this.db.collection('auctioneers').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToISOString(doc.data().createdAt), updatedAt: safeConvertToISOString(doc.data().updatedAt), memberSince: safeConvertOptionalISOString(doc.data().memberSince) } as AuctioneerProfileInfo));
    } catch (e: any) { return []; }
  }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    try {
      let docSnap = await this.db.collection('auctioneers').doc(idOrPublicId).get();
      if (!docSnap.exists) {
        const querySnapshot = await this.db.collection('auctioneers').where('publicId', '==', idOrPublicId).limit(1).get();
        if (!querySnapshot.empty) {
          docSnap = querySnapshot.docs[0];
        } else {
          return null;
        }
      }
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt), memberSince: safeConvertOptionalISOString(data.memberSince) } as AuctioneerProfileInfo;
    } catch (e: any) { return null; }
  }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    try {
      const snapshot = await this.db.collection('auctioneers').where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...docSnap.data(), createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt), memberSince: safeConvertOptionalISOString(data.memberSince) } as AuctioneerProfileInfo;
    } catch (e: any) { return null; }
  }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if(data.name) updateData.slug = slugify(data.name);
      await this.db.collection('auctioneers').doc(id).update(updateData);
      return { success: true, message: 'Leiloeiro atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('auctioneers').doc(id).delete();
      return { success: true, message: 'Leiloeiro excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
    console.warn("[FirestoreAdapter] getAuctioneerByName not implemented.");
    return null;
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    try {
      const newSellerData = { ...data, publicId: `SELL-PUB-${uuidv4()}`, slug: slugify(data.name), memberSince: AdminFieldValue.serverTimestamp(), rating: 0, activeLotsCount: 0, totalSalesValue: 0, auctionsFacilitatedCount: 0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await this.db.collection('sellers').add(newSellerData);
      return { success: true, message: 'Comitente criado!', sellerId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getSellers(): Promise<SellerProfileInfo[]> {
    try {
      const snapshot = await this.db.collection('sellers').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToISOString(doc.data().createdAt), updatedAt: safeConvertToISOString(doc.data().updatedAt), memberSince: safeConvertOptionalISOString(doc.data().memberSince) } as SellerProfileInfo));
    } catch (e: any) { return []; }
  }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
    try {
      let docSnap = await this.db.collection('sellers').doc(idOrPublicId).get();
      if (!docSnap.exists) {
        const querySnapshot = await this.db.collection('sellers').where('publicId', '==', idOrPublicId).limit(1).get();
        if (!querySnapshot.empty) {
          docSnap = querySnapshot.docs[0];
        } else {
          return null;
        }
      }
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt), memberSince: safeConvertOptionalISOString(data.memberSince) } as SellerProfileInfo;
    } catch (e: any) { return null; }
  }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    try {
      const snapshot = await this.db.collection('sellers').where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...docSnap.data(), createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt), memberSince: safeConvertOptionalISOString(data.memberSince) } as SellerProfileInfo;
    } catch (e: any) { return null; }
  }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if(data.name) updateData.slug = slugify(data.name);
      await this.db.collection('sellers').doc(id).update(updateData);
      return { success: true, message: 'Comitente atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('sellers').doc(id).delete();
      return { success: true, message: 'Comitente excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> {
    console.warn("[FirestoreAdapter] getSellerByName not implemented.");
    return null;
  }

  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    try {
      const newAuctionData: any = { 
        ...data,
        publicId: `AUC-PUB-${uuidv4()}`,
        auctionDate: ServerTimestamp.fromDate(data.auctionDate as Date),
        endDate: data.endDate ? ServerTimestamp.fromDate(data.endDate as Date) : null, 
        totalLots:0, visits:0, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() 
      };
      if (data.endDate === null || data.endDate === undefined) newAuctionData.endDate = null;
      
      const docRef = await this.db.collection('auctions').add(newAuctionData);
      return { success: true, message: 'Leilão criado!', auctionId: docRef.id };
    } catch (e: any) { 
      console.error("[FirestoreAdapter - createAuction] Error:", e);
      return { success: false, message: e.message }; 
    }
  }

  async getAuctions(): Promise<Auction[]> {
    try {
      const snapshot = await this.db.collection('auctions').orderBy('auctionDate', 'desc').get();
      return Promise.all(snapshot.docs.map(async docSnap => {
        const data = docSnap.data();
        let categoryName = data.category; 
        let auctioneerName = data.auctioneer;
        let sellerName = data.seller;

        if (data.categoryId) {
            const catDoc = await this.db.collection('lotCategories').doc(data.categoryId).get();
            if(catDoc.exists) categoryName = catDoc.data()?.name || data.category;
        }
        if (data.auctioneerId) {
            const aucDoc = await this.db.collection('auctioneers').doc(data.auctioneerId).get();
            if(aucDoc.exists) auctioneerName = aucDoc.data()?.name || data.auctioneer;
        }
        if (data.sellerId) {
            const selDoc = await this.db.collection('sellers').doc(data.sellerId).get();
            if(selDoc.exists) sellerName = selDoc.data()?.name || data.seller;
        }

        return { 
            id: docSnap.id, 
            ...data, 
            category: categoryName,
            auctioneer: auctioneerName,
            seller: sellerName,
            auctionDate: safeConvertToISOString(data.auctionDate), 
            endDate: safeConvertOptionalISOString(data.endDate), 
            auctionStages: data.auctionStages?.map((stage: any) => ({...stage, endDate: safeConvertToISOString(stage.endDate) })) || [],
            createdAt: safeConvertToISOString(data.createdAt), 
            updatedAt: safeConvertToISOString(data.updatedAt), 
            lots: data.lots || [] 
        } as Auction;
      }));
    } catch (e: any) { return []; }
  }

  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    try {
      let docSnap: FirebaseFirestore.DocumentSnapshot | undefined;
      const docById = await this.db.collection('auctions').doc(idOrPublicId).get();
      if (docById.exists) {
        docSnap = docById;
      } else {
        const queryByPublicId = await this.db.collection('auctions').where('publicId', '==', idOrPublicId).limit(1).get();
        if (!queryByPublicId.empty) {
          docSnap = queryByPublicId.docs[0];
        } else {
          return null;
        }
      }
      
      const data = docSnap.data()!;
      
      let categoryName = data.category;
      let auctioneerName = data.auctioneer;
      let sellerName = data.seller;

      if (data.categoryId) {
          const catDoc = await this.db.collection('lotCategories').doc(data.categoryId).get();
          if(catDoc.exists) categoryName = catDoc.data()?.name || data.category;
      }
      if (data.auctioneerId) {
          const aucDoc = await this.db.collection('auctioneers').doc(data.auctioneerId).get();
          if(aucDoc.exists) auctioneerName = aucDoc.data()?.name || data.auctioneer;
      }
      if (data.sellerId) {
          const selDoc = await this.db.collection('sellers').doc(data.sellerId).get();
          if(selDoc.exists) sellerName = selDoc.data()?.name || data.seller;
      }

      const auction = { 
          id: docSnap.id, 
          ...data, 
          category: categoryName,
          auctioneer: auctioneerName,
          seller: sellerName,
          auctionDate: safeConvertToISOString(data.auctionDate), 
          endDate: safeConvertOptionalISOString(data.endDate), 
          auctionStages: data.auctionStages?.map((stage: any) => ({...stage, endDate: safeConvertToISOString(stage.endDate) })) || [],
          createdAt: safeConvertToISOString(data.createdAt), 
          updatedAt: safeConvertToISOString(data.updatedAt), 
          lots: [] // Initialize empty
        } as Auction;
      
      const lotsSnapshot = await this.db.collection('lots').where('auctionId', '==', docSnap.id).get();
      auction.lots = await Promise.all(lotsSnapshot.docs.map(lotDoc => this.mapLotDocument(lotDoc)));
      auction.totalLots = auction.lots.length;

      return auction;

    } catch (e: any) { return null; }
  }

  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> {
    try {
        const sellerSnapshot = await this.db.collection('sellers').where('slug', '==', sellerSlug).limit(1).get();
        if (sellerSnapshot.empty) return [];
        const sellerId = sellerSnapshot.docs[0].id;
        const sellerName = sellerSnapshot.docs[0].data().name;
        
        const snapshot = await this.db.collection('auctions').where('sellerId', '==', sellerId).orderBy('auctionDate', 'desc').get();
        return Promise.all(snapshot.docs.map(async docSnap => {
            const data = docSnap.data();
            let categoryName = data.category;
            let auctioneerName = data.auctioneer;

            if (data.categoryId) {
                const catDoc = await this.db.collection('lotCategories').doc(data.categoryId).get();
                if(catDoc.exists) categoryName = catDoc.data()?.name || data.category;
            }
            if (data.auctioneerId) {
                 const aucDoc = await this.db.collection('auctioneers').doc(data.auctioneerId).get();
                if(aucDoc.exists) auctioneerName = aucDoc.data()?.name || data.auctioneer;
            }
            
            return { 
                id: docSnap.id, 
                ...data, 
                category: categoryName, 
                auctioneer: auctioneerName, 
                seller: sellerName, // Use fetched seller name
                auctionDate: safeConvertToISOString(data.auctionDate), 
                endDate: safeConvertOptionalISOString(data.endDate), 
                createdAt: safeConvertToISOString(data.createdAt), 
                updatedAt: safeConvertToISOString(data.updatedAt), 
                lots: data.lots || [] 
            } as Auction;
        }));
    } catch (e: any) { return []; }
  }

  async updateAuction(id: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = { ...data, updatedAt: AdminFieldValue.serverTimestamp() };
      if (data.auctionDate) updateData.auctionDate = ServerTimestamp.fromDate(new Date(data.auctionDate));
      if (data.hasOwnProperty('endDate')) updateData.endDate = data.endDate ? ServerTimestamp.fromDate(new Date(data.endDate)) : null;

      await this.db.collection('auctions').doc(id).update(updateData);
      return { success: true, message: 'Leilão atualizado!' };
    } catch (e: any) { 
      console.error("[FirestoreAdapter - updateAuction] Error:", e);
      return { success: false, message: e.message }; 
    }
  }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('auctions').doc(id).delete();
      return { success: true, message: 'Leilão excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  async getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    console.warn("[FirestoreAdapter] getAuctionsByIds not implemented.");
    return [];
  }
  
  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
    console.warn("[FirestoreAdapter] getAuctionsByAuctioneerSlug not implemented.");
    return [];
  }

  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; }> {
    try {
      const newLotData: any = { 
          ...data, 
          publicId: `LOT-PUB-${uuidv4()}`,
          views: data.views || 0, 
          bidsCount: data.bidsCount || 0, 
          auctionName: data.auctionName || `Lote ${data.title.substring(0,20)}`, 
          endDate: ServerTimestamp.fromDate(new Date(data.endDate!)),
          lotSpecificAuctionDate: data.lotSpecificAuctionDate ? ServerTimestamp.fromDate(new Date(data.lotSpecificAuctionDate)) : null,
          secondAuctionDate: data.secondAuctionDate ? ServerTimestamp.fromDate(new Date(data.secondAuctionDate)) : null,
          mediaItemIds: data.mediaItemIds || [],
          galleryImageUrls: data.galleryImageUrls || [],
          createdAt: AdminFieldValue.serverTimestamp(), 
          updatedAt: AdminFieldValue.serverTimestamp() 
      };
      delete newLotData.type; 

      const docRef = await this.db.collection('lots').add(newLotData);
      return { success: true, message: 'Lote criado!', lotId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  private async mapLotDocument(docSnap: FirebaseFirestore.DocumentSnapshot): Promise<Lot> {
      const data = docSnap.data()!;
      let typeName = data.type; 
      if (data.categoryId) {
          const catSnap = await this.db.collection('lotCategories').doc(data.categoryId).get();
          if (catSnap.exists) typeName = catSnap.data()?.name || typeName;
      }
      let auctionTitle = data.auctionName;
      if (data.auctionId && !auctionTitle) {
          const aucSnap = await this.db.collection('auctions').doc(data.auctionId).get();
          if (aucSnap.exists) auctionTitle = aucSnap.data()?.title || auctionTitle;
      }
      let stateName = data.stateUf;
      if (data.stateId && !stateName) {
          const stateSnap = await this.db.collection('states').doc(data.stateId).get();
          if (stateSnap.exists) stateName = stateSnap.data()?.uf || stateName;
      }
      let cityName = data.cityName;
      if (data.cityId && !cityName) {
          const citySnap = await this.db.collection('cities').doc(data.cityId).get();
          if (citySnap.exists) cityName = citySnap.data()?.name || cityName;
      }

      return { 
          id: docSnap.id, ...data, 
          type: typeName,
          auctionName: auctionTitle,
          stateUf: stateName,
          cityName: cityName,
          endDate: safeConvertToISOString(data.endDate), 
          lotSpecificAuctionDate: safeConvertOptionalISOString(data.lotSpecificAuctionDate), 
          secondAuctionDate: safeConvertOptionalISOString(data.secondAuctionDate), 
          createdAt: safeConvertToISOString(data.createdAt), 
          updatedAt: safeConvertToISOString(data.updatedAt) 
      } as Lot;
  }


  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    try {
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.db.collection('lots');
      if (auctionIdParam) {
        query = query.where('auctionId', '==', auctionIdParam);
      }
      const snapshot = await query.orderBy('title').get(); 
      
      return Promise.all(snapshot.docs.map(docSnap => this.mapLotDocument(docSnap)));
    } catch (e: any) { console.error("[FirestoreAdapter - getLots] Error:", e); return []; }
  }
  
  async getLotsByIds(ids: string[]): Promise<Lot[]> {
      console.warn("[FirestoreAdapter] getLotsByIds not implemented.");
      return [];
  }

  async getLot(idOrPublicId: string): Promise<Lot | null> {
    try {
      let docSnap: FirebaseFirestore.DocumentSnapshot | undefined;
      const docById = await this.db.collection('lots').doc(idOrPublicId).get();
      if (docById.exists) {
        docSnap = docById;
      } else {
        const querySnapshot = await this.db.collection('lots').where('publicId', '==', idOrPublicId).limit(1).get();
        if (!querySnapshot.empty) {
          docSnap = querySnapshot.docs[0];
        } else {
          return null; // Not found by ID or publicId
        }
      }
        
      return this.mapLotDocument(docSnap);
    } catch (e: any) { return null; }
  }

  async updateLot(id: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = { ...data };
      
      if (data.endDate) updateData.endDate = ServerTimestamp.fromDate(new Date(data.endDate));
      if (data.hasOwnProperty('lotSpecificAuctionDate')) updateData.lotSpecificAuctionDate = data.lotSpecificAuctionDate ? ServerTimestamp.fromDate(new Date(data.lotSpecificAuctionDate)) : null;
      if (data.hasOwnProperty('secondAuctionDate')) updateData.secondAuctionDate = data.secondAuctionDate ? ServerTimestamp.fromDate(new Date(data.secondAuctionDate)) : null;
      
      updateData.updatedAt = AdminFieldValue.serverTimestamp();
      await this.db.collection('lots').doc(id).update(updateData);
      return { success: true, message: 'Lote atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('lots').doc(id).delete();
      return { success: true, message: 'Lote excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> {
    try {
      const snapshot = await this.db.collection('lots').doc(lotId).collection('bids').orderBy('timestamp', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: safeConvertToISOString(doc.data().timestamp) } as BidInfo));
    } catch (e: any) { return []; }
  }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status' | 'endDate'>>; newBid?: BidInfo }> {
    try {
      const lotRef = this.db.collection('lots').doc(lotId);
      const lotSnap = await lotRef.get();
      if (!lotSnap.exists) return { success: false, message: "Lote não encontrado."};
      const lotData = lotSnap.data() as Lot;
      if (bidAmount <= lotData.price) return { success: false, message: "Lance deve ser maior que o atual."};
      
      const newBidData = { lotId, auctionId, bidderId: userId, bidderDisplay: userDisplayName, amount: bidAmount, timestamp: AdminFieldValue.serverTimestamp()};
      const bidRef = await this.db.collection('lots').doc(lotId).collection('bids').add(newBidData);
      await lotRef.update({ price: bidAmount, bidsCount: AdminFieldValue.increment(1), updatedAt: AdminFieldValue.serverTimestamp() });
      
      return { success: true, message: "Lance registrado!", updatedLot: { price: bidAmount, bidsCount: (lotData.bidsCount || 0) + 1 }, newBid: { id: bidRef.id, ...newBidData, timestamp: new Date().toISOString() } as BidInfo };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> {
    console.warn("[FirestoreAdapter] createUserLotMaxBid not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }

  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    console.warn("[FirestoreAdapter] getActiveUserLotMaxBid not implemented.");
    return null;
  }
  
  async getWinsForUser(userId: string): Promise<UserWin[]> {
    console.warn("[FirestoreAdapter] getWinsForUser not implemented.");
    return [];
  }

  // --- Reviews ---
  async getReviewsForLot(lotId: string): Promise<Review[]> {
    try {
      const snapshot = await this.db.collection('lots').doc(lotId).collection('reviews').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: safeConvertToISOString(doc.data().createdAt),
        updatedAt: safeConvertOptionalISOString(doc.data().updatedAt)
      } as Review));
    } catch (error: any) {
      console.error(`[FirestoreAdapter - getReviewsForLot(${lotId})] Error:`, error);
      return [];
    }
  }

  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    try {
      const newReview = {
        ...reviewData,
        createdAt: AdminFieldValue.serverTimestamp(),
        updatedAt: AdminFieldValue.serverTimestamp(),
      };
      const docRef = await this.db.collection('lots').doc(reviewData.lotId).collection('reviews').add(newReview);
      return { success: true, message: "Avaliação adicionada com sucesso!", reviewId: docRef.id };
    } catch (error: any) {
      console.error(`[FirestoreAdapter - createReview for lot ${reviewData.lotId}] Error:`, error);
      return { success: false, message: 'Falha ao adicionar avaliação.' };
    }
  }

  // --- Questions ---
  async getQuestionsForLot(lotId: string): Promise<LotQuestion[]> {
    try {
      const snapshot = await this.db.collection('lots').doc(lotId).collection('questions').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ 
        id: doc.id, ...doc.data(), 
        createdAt: safeConvertToISOString(doc.data().createdAt),
        answeredAt: safeConvertOptionalISOString(doc.data().answeredAt)
      } as LotQuestion));
    } catch (e: any) { console.error(`[getQuestionsForLot ${lotId}]`, e); return []; }
  }
  async createQuestion(questionData: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> {
    try {
      const newQuestion = { ...questionData, isPublic: true, createdAt: AdminFieldValue.serverTimestamp() };
      const docRef = await this.db.collection('lots').doc(questionData.lotId).collection('questions').add(newQuestion);
      return { success: true, message: "Pergunta enviada.", questionId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { 
    console.error("[FirestoreAdapter.answerQuestion] - Placeholder: Cannot fully implement without lotId or different lookup strategy.");
    return { success: false, message: "Placeholder: Lógica de resposta não implementada completamente no adapter Firestore sem lotId." };
  }


  // --- Users ---
  async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    try {
      const docSnap = await this.db.collection('users').doc(userId).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { uid: docSnap.id, ...data, createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt), dateOfBirth: safeConvertOptionalISOString(data.dateOfBirth), rgIssueDate: safeConvertOptionalISOString(data.rgIssueDate) } as UserProfileData;
    } catch (e: any) { return null; }
  }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = {...data, updatedAt: AdminFieldValue.serverTimestamp()};
      if (data.dateOfBirth) updateData.dateOfBirth = ServerTimestamp.fromDate(new Date(data.dateOfBirth));
      if (data.rgIssueDate) updateData.rgIssueDate = ServerTimestamp.fromDate(new Date(data.rgIssueDate));
      await this.db.collection('users').doc(userId).update(updateData);
      return { success: true, message: 'Perfil atualizado!'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }> {
     const { ensureAdminInitialized: ensureFbAdmin } = await import('@/lib/firebase/admin');
     const { auth: localAuthAdmin, error: sdkError } = ensureFbAdmin();
    if (sdkError || !localAuthAdmin) {
      console.warn(`[FirestoreAdapter - ensureUserRole] Admin SDK Auth não disponível ou erro de inicialização: ${sdkError?.message}. Continuando sem interação Auth se possível.`);
    }
    try {
        await this.ensureDefaultRolesExist(); // Ensure default roles are in Firestore
        let targetRole: Role | null = null;
        if (roleIdToAssign) {
            console.log(`[FirestoreAdapter - ensureUserRole] Tentando buscar perfil por ID fornecido: ${roleIdToAssign}`);
            targetRole = await this.getRole(roleIdToAssign);
        }
        if (!targetRole) {
            console.log(`[FirestoreAdapter - ensureUserRole] Perfil por ID não encontrado ou ID não fornecido. Buscando por nome: ${targetRoleName}`);
            targetRole = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER');
        }

        if (!targetRole || !targetRole.id) {
            console.error(`[FirestoreAdapter - ensureUserRole] CRITICAL: Perfil '${targetRoleName}' ou 'USER' não encontrado ou sem ID.`);
            return { success: false, message: `Perfil padrão '${targetRoleName}' ou 'USER' não encontrado ou sem ID.` };
        }
         console.log(`[FirestoreAdapter - ensureUserRole] Perfil alvo determinado: ${targetRole.name} (ID: ${targetRole.id})`);

        const userDocRef = this.db.collection('users').doc(userId);
        const userSnap = await userDocRef.get();
        let finalProfileData: UserProfileData;

        if (userSnap.exists) {
            const userDataFromDB = userSnap.data() as UserProfileData;
            const updatePayload: any = { updatedAt: AdminFieldValue.serverTimestamp() };
            let needsUpdate = false;
            if (userDataFromDB.roleId !== targetRole.id) { updatePayload.roleId = targetRole.id; needsUpdate = true; }
            if (userDataFromDB.roleName !== targetRole.name) { updatePayload.roleName = targetRole.name; needsUpdate = true; }
            if (JSON.stringify(userDataFromDB.permissions || []) !== JSON.stringify(targetRole.permissions || [])) {
              updatePayload.permissions = targetRole.permissions; needsUpdate = true;
            }

            if (needsUpdate) {
              console.log(`[FirestoreAdapter - ensureUserRole] ATUALIZANDO perfil existente ${userId} para role ${targetRole.name}`);
               await userDocRef.update(updatePayload);
            } else {
                console.log(`[FirestoreAdapter - ensureUserRole] Perfil ${userId} já existe e está atualizado.`);
            }
             finalProfileData = { uid: userId, ...userDataFromDB, roleId: targetRole.id, roleName: targetRole.name, permissions: targetRole.permissions };

        } else {
            console.log(`[FirestoreAdapter - ensureUserRole] Criando novo perfil para ${userId} com role ${targetRole.name}`);
            const creationPayload: any = { email, fullName, roleId: targetRole.id, roleName: targetRole.name, permissions: targetRole.permissions, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
             if (additionalProfileData) {
                    Object.assign(creationPayload, additionalProfileData);
                    if (additionalProfileData.dateOfBirth) {
                        creationPayload.dateOfBirth = ServerTimestamp.fromDate(new Date(additionalProfileData.dateOfBirth));
                    }
               }
               await userDocRef.set(creationPayload);
               finalProfileData = { uid: userId, email, fullName, roleId: targetRole.id, roleName: targetRole.name, permissions: targetRole.permissions } as UserProfileData;
        }

        return { success: true, message: "Perfil assegurado com sucesso.", userProfile: finalProfileData };

    } catch (e: any) { console.error("[FirestoreAdapter - ensureUserRole] " + e.message); return { success: false, message: e.message }; }
}

  async getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
    try {
      const snapshot = await this.db.collection('users').get();
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data(), createdAt: safeConvertToISOString(doc.data().createdAt), updatedAt: safeConvertToISOString(doc.data().updatedAt), dateOfBirth: safeConvertOptionalISOString(doc.data().dateOfBirth), rgIssueDate: safeConvertOptionalISOString(doc.data().rgIssueDate) } as UserProfileWithPermissions));
    } catch (e: any) { return []; }
  }
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    try {
      const snapshot = await this.db.collection('users').where('email', '==', email).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { uid: doc.id, ...data, createdAt: safeConvertToISOString(data.createdAt), updatedAt: safeConvertToISOString(data.updatedAt), dateOfBirth: safeConvertOptionalISOString(data.dateOfBirth), rgIssueDate: safeConvertOptionalISOString(data.rgIssueDate) } as UserProfileWithPermissions;
    } catch (e: any) { console.error("[FirestoreAdapter - getUserByEmail] " + e.message); return null; }
  }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = { roleId: roleId || null, updatedAt: AdminFieldValue.serverTimestamp() };
      await this.db.collection('users').doc(userId).update(updateData);
      return { success: true, message: 'Perfil do usuário atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('users').doc(userId).delete();
      return { success: true, message: 'Usuário excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    try {
      const newRoleData = { ...data, name_normalized: data.name.toUpperCase(), createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await this.db.collection('roles').add(newRoleData);
      return { success: true, message: 'Perfil criado!', roleId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getRoles(): Promise<Role[]> {
    try {
      const snapshot = await this.db.collection('roles').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToISOString(doc.data().createdAt), updatedAt: safeConvertToISOString(doc.data().updatedAt) } as Role));
    } catch (e: any) { return []; }
  }
  async getRole(id: string): Promise<Role | null> {
    try {
      const docSnap = await this.db.collection('roles').doc(id).get();
      if (!docSnap.exists) return null;
      return { id: docSnap.id, ...docSnap.data(), createdAt: safeConvertToISOString(docSnap.data()!.createdAt), updatedAt: safeConvertToISOString(docSnap.data()!.updatedAt) } as Role;
    } catch (e: any) { return null; }
  }
   async getRoleByName(name: string): Promise<Role | null> {
    try {
      const snapshot = await this.db.collection('roles').where('name_normalized', '==', name.toUpperCase()).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data(), createdAt: safeConvertToISOString(docSnap.data().createdAt), updatedAt: safeConvertToISOString(docSnap.data().updatedAt) } as Role;
    } catch (e: any) { console.error(`[getRoleByName] ${e.message}`); return null; }
  }

  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = { ...data, updatedAt: AdminFieldValue.serverTimestamp() };
       if (data.name) updateData.name_normalized = data.name.toUpperCase();
      await this.db.collection('roles').doc(id).update(updateData);
      return { success: true, message: 'Perfil atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('roles').doc(id).delete();
      return { success: true, message: 'Perfil excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
      try {
           const roles = [
                { name: 'ADMINISTRATOR', permissions: ['manage_all'] },
                { name: 'USER', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
                { name: 'CONSIGNOR', permissions: ['auctions:manage_own', 'lots:manage_own'] },
                { name: 'ARREMATANTE', permissions: ['view_wins', 'manage_payments', 'schedule_retrieval'] }
            ];
            let rolesProcessed = 0;

            for (const roleInfo of roles) {
                const existingRole = await this.getRoleByName(roleInfo.name);
                if (!existingRole) {
                    console.log(`[FirestoreAdapter] Creating default role: ${roleInfo.name}`);
                    await this.createRole({ name: roleInfo.name, description: `Perfil padrão ${roleInfo.name}.`, permissions: roleInfo.permissions });
                } else {
                    console.log(`[FirestoreAdapter] Default role already exists: ${roleInfo.name}`);
                }
                rolesProcessed++;
            }
            return { success: true, message: 'Default roles ensured.', rolesProcessed };
        } catch (e: any) {
            console.error("[FirestoreAdapter - ensureDefaultRolesExist] " + e.message);
            return { success: false, message: e.message };
        }
  }

  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> {
    try {
      const newItemData = { ...data, uploadedAt: AdminFieldValue.serverTimestamp(), urlOriginal: filePublicUrl, urlThumbnail: filePublicUrl, urlMedium: filePublicUrl, urlLarge: filePublicUrl, storagePath: filePublicUrl, uploadedBy: uploadedBy || 'system' };
      const docRef = await this.db.collection('media').add(newItemData);
      return { success: true, message: 'Mídia criada!', item: { id: docRef.id, ...newItemData } as MediaItem };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getMediaItems(): Promise<MediaItem[]> {
    try {
      const snapshot = await this.db.collection('media').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), uploadedAt: safeConvertToISOString(doc.data().uploadedAt) } as MediaItem));
    } catch (e: any) { return []; }
  }
  async getMediaItem(id: string): Promise<MediaItem | null> {
    try {
      const docSnap = await this.db.collection('media').doc(id).get();
      if (!docSnap.exists) return null;
      return { id: docSnap.id, ...docSnap.data(), uploadedAt: safeConvertToISOString(docSnap.data().uploadedAt) } as MediaItem;
    } catch (e: any) { return null; }
  }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData = { ...metadata, updatedAt: AdminFieldValue.serverTimestamp() };
      await this.db.collection('media').doc(id).update(updateData);
      return { success: true, message: 'Metadados da mídia atualizados!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('media').doc(id).delete();
      return { success: true, message: 'Mídia excluída!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> {
    console.warn("[FirestoreAdapter] linkMediaItemsToLot not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[FirestoreAdapter] unlinkMediaItemFromLot not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }

  async getPlatformSettings(): Promise<PlatformSettings> {
    try {
      const docRef = this.db.collection('settings').doc('global');
      let doc = await docRef.get();

      if (!doc.exists) {
          console.log("[FirestoreAdapter] No PlatformSettings found, creating default settings.");
           await this.updatePlatformSettings(samplePlatformSettings);
           doc = await docRef.get();
      }
      const data = doc.data()!;
       return {
            id: doc.id,
            siteTitle: data.siteTitle,
            siteTagline: data.siteTagline,
            galleryImageBasePath: data.galleryImageBasePath,
            storageProvider: data.storageProvider,
            firebaseStorageBucket: data.firebaseStorageBucket,
            activeThemeName: data.activeThemeName,
            themes: data.themes,
            platformPublicIdMasks: data.platformPublicIdMasks,
            homepageSections: data.homepageSections,
            mentalTriggerSettings: data.mentalTriggerSettings,
            sectionBadgeVisibility: data.sectionBadgeVisibility,
            mapSettings: data.mapSettings,
            biddingSettings: data.biddingSettings,
            searchPaginationType: data.searchPaginationType,
            searchItemsPerPage: data.searchItemsPerPage,
            searchLoadMoreCount: data.searchLoadMoreCount,
            showCountdownOnLotDetail: data.showCountdownOnLotDetail,
            showCountdownOnCards: data.showCountdownOnCards,
            showRelatedLotsOnLotDetail: data.showRelatedLotsOnLotDetail,
            relatedLotsCount: data.relatedLotsCount,
            variableIncrementTable: data.variableIncrementTable,
            defaultListItemsPerPage: data.defaultListItemsPerPage,
            updatedAt: safeConvertToISOString(data.updatedAt)
        } as PlatformSettings;
    } catch (e: any) {
        console.error("[FirestoreAdapter - getPlatformSettings] " + e.message);
        return samplePlatformSettings as PlatformSettings;
    }
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    try {
       const settingsRef = this.db.collection('settings').doc('global');
       await settingsRef.set({ ...data, updatedAt: AdminFieldValue.serverTimestamp() }, { merge: true });
       return { success: true, message: "Configurações da plataforma atualizadas!" };
    } catch (e: any) { console.error("[FirestoreAdapter - updatePlatformSettings] " + e.message); return { success: false, message: e.message }; }
  }

  // --- Direct Sales
  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    console.warn("[FirestoreAdapter] getDirectSaleOffers not implemented.");
    return [];
  }
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    console.warn("[FirestoreAdapter] getDirectSaleOffer not implemented.");
    return null;
  }
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
      console.warn("[FirestoreAdapter] createDirectSaleOffer not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
      console.warn("[FirestoreAdapter] updateDirectSaleOffer not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
      console.warn("[FirestoreAdapter] deleteDirectSaleOffer not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }

  // --- Judicial ---
  async getCourts(): Promise<Court[]> { console.warn("[FirestoreAdapter] getCourts not implemented."); return []; }
  async getCourt(id: string): Promise<Court | null> { console.warn("[FirestoreAdapter] getCourt not implemented."); return null; }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { console.warn("[FirestoreAdapter] createCourt not implemented."); return { success: false, message: "Not implemented." }; }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[FirestoreAdapter] updateCourt not implemented."); return { success: false, message: "Not implemented." }; }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> { console.warn("[FirestoreAdapter] deleteCourt not implemented."); return { success: false, message: "Not implemented." }; }
  
  async getJudicialDistricts(): Promise<JudicialDistrict[]> { console.warn("[FirestoreAdapter] getJudicialDistricts not implemented."); return []; }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> { console.warn("[FirestoreAdapter] getJudicialDistrict not implemented."); return null; }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { console.warn("[FirestoreAdapter] createJudicialDistrict not implemented."); return { success: false, message: "Not implemented." }; }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> { console.warn("[FirestoreAdapter] updateJudicialDistrict not implemented."); return { success: false, message: "Not implemented." }; }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[FirestoreAdapter] deleteJudicialDistrict not implemented.");
    return { success: false, message: "Not implemented" };
  }
}
