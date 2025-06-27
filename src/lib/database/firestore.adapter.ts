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
  DirectSaleOffer,
  UserLotMaxBid,
  UserWin
} from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { samplePlatformSettings } from '@/lib/sample-data';


const AdminFieldValue = FieldValue;
const ServerTimestamp = Timestamp;

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date(); 
  if (timestampField && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
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
    try {
      await this.db.collection('lotCategories').doc(id).delete();
      return { success: true, message: 'Categoria excluída com sucesso!' };
    } catch (error: any) {
      console.error("[FirestoreAdapter - deleteLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao excluir categoria.' };
    }
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt) } as StateInfo));
    } catch (e: any) { return []; }
  }
  async getState(id: string): Promise<StateInfo | null> {
    try {
      const docSnap = await this.db.collection('states').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as StateInfo;
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
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    try {
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.db.collection('cities');
      if (stateIdFilter) {
        query = query.where('stateId', '==', stateIdFilter);
      }
      const snapshot = await query.orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt) } as CityInfo));
    } catch (e: any) { return []; }
  }
  async getCity(id: string): Promise<CityInfo | null> {
    try {
      const docSnap = await this.db.collection('cities').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as CityInfo;
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt), memberSince: safeConvertOptionalDate(doc.data().memberSince) } as AuctioneerProfileInfo));
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
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as AuctioneerProfileInfo;
    } catch (e: any) { return null; }
  }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    try {
      const snapshot = await this.db.collection('auctioneers').where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...docSnap.data(), createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as AuctioneerProfileInfo;
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt), memberSince: safeConvertOptionalDate(doc.data().memberSince) } as SellerProfileInfo));
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
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as SellerProfileInfo;
    } catch (e: any) { return null; }
  }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    try {
      const snapshot = await this.db.collection('sellers').where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...docSnap.data(), createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), memberSince: safeConvertOptionalDate(data.memberSince) } as SellerProfileInfo;
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
            auctionDate: safeConvertToDate(data.auctionDate), 
            endDate: safeConvertOptionalDate(data.endDate), 
            auctionStages: data.auctionStages?.map((stage: any) => ({...stage, endDate: safeConvertToDate(stage.endDate) })) || [],
            createdAt: safeConvertToDate(data.createdAt), 
            updatedAt: safeConvertToDate(data.updatedAt), 
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
          auctionDate: safeConvertToDate(data.auctionDate), 
          endDate: safeConvertOptionalDate(data.endDate), 
          auctionStages: data.auctionStages?.map((stage: any) => ({...stage, endDate: safeConvertToDate(stage.endDate) })) || [],
          createdAt: safeConvertToDate(data.createdAt), 
          updatedAt: safeConvertToDate(data.updatedAt), 
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
                auctionDate: safeConvertToDate(data.auctionDate), 
                endDate: safeConvertOptionalDate(data.endDate), 
                createdAt: safeConvertToDate(data.createdAt), 
                updatedAt: safeConvertToDate(data.updatedAt), 
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
          endDate: safeConvertToDate(data.endDate), 
          lotSpecificAuctionDate: safeConvertOptionalDate(data.lotSpecificAuctionDate), 
          secondAuctionDate: safeConvertOptionalDate(data.secondAuctionDate), 
          createdAt: safeConvertToDate(data.createdAt), 
          updatedAt: safeConvertToDate(data.updatedAt) 
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: safeConvertToDate(doc.data().timestamp) } as BidInfo));
    } catch (e: any) { return []; }
  }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> {
    try {
      const lotRef = this.db.collection('lots').doc(lotId);
      const lotSnap = await lotRef.get();
      if (!lotSnap.exists) return { success: false, message: "Lote não encontrado."};
      const lotData = lotSnap.data() as Lot;
      if (bidAmount <= lotData.price) return { success: false, message: "Lance deve ser maior que o atual."};
      
      const newBidData = { lotId, auctionId, bidderId: userId, bidderDisplay: userDisplayName, amount: bidAmount, timestamp: AdminFieldValue.serverTimestamp()};
      const bidRef = await this.db.collection('lots').doc(lotId).collection('bids').add(newBidData);
      await lotRef.update({ price: bidAmount, bidsCount: AdminFieldValue.increment(1), updatedAt: AdminFieldValue.serverTimestamp() });
      
      return { success: true, message: "Lance registrado!", updatedLot: { price: bidAmount, bidsCount: (lotData.bidsCount || 0) + 1 }, newBid: { id: bidRef.id, ...newBidData, timestamp: new Date() } as BidInfo };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  // --- Reviews ---
  async getReviewsForLot(lotId: string): Promise<Review[]> {
    try {
      const snapshot = await this.db.collection('lots').doc(lotId).collection('reviews').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt) } as Review));
    } catch (e: any) { console.error(`[getReviewsForLot ${lotId}]`, e); return []; }
  }
  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    try {
      const newReview = { ...reviewData, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await this.db.collection('lots').doc(reviewData.lotId).collection('reviews').add(newReview);
      return { success: true, message: "Avaliação adicionada.", reviewId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  // --- Questions ---
  async getQuestionsForLot(lotId: string): Promise<LotQuestion[]> {
    try {
      const snapshot = await this.db.collection('lots').doc(lotId).collection('questions').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ 
        id: doc.id, ...doc.data(), 
        createdAt: safeConvertToDate(doc.data().createdAt),
        answeredAt: safeConvertOptionalDate(doc.data().answeredAt)
      } as LotQuestion));
    } catch (e: any) { console.error(`[getQuestionsForLot ${lotId}]`, e); return []; }
  }
  async createQuestion(questionData: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string; }> {
    try {
      const newQuestion = { ...questionData, isPublic: true, createdAt: AdminFieldValue.serverTimestamp() };
      const docRef = await this.db.collection('lots').doc(questionData.lotId).collection('questions').add(newQuestion);
      return { success: true, message: "Pergunta enviada.", questionId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async answerQuestion(questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> {
    // Firestore does not have a single "parent" collection concept for subcollections.
    // To update a question, we need the lotId. This should be passed to the action, or retrieved if question doc contains lotId.
    // For now, assuming the question document structure allows finding lotId, or actions.ts handles it.
    // This placeholder will assume the update is on a top-level 'questions' collection if lotId is not accessible here.
    // IDEALLY: you'd pass lotId to this adapter method or the question document contains lotId.
    // For this example, let's assume questionId is the full path segment or we can't implement this fully here.
    
    // Let's refine this: The action should pass the lotId to locate the question.
    // This function signature in the interface should be:
    // answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string)
    // For now, we'll just log the limitation
    console.error("[FirestoreAdapter.answerQuestion] - Placeholder: Cannot fully implement without lotId or different lookup strategy.");
    return { success: false, message: "Placeholder: Lógica de resposta não implementada completamente no adapter Firestore sem lotId." };
    // Actual implementation would be:
    // await this.db.collection('lots').doc(lotId).collection('questions').doc(questionId).update({
    //   answerText, answeredAt: AdminFieldValue.serverTimestamp(), answeredByUserId, answeredByUserDisplayName
    // });
    // return { success: true, message: "Pergunta respondida." };
  }


  // --- Users ---
  async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    try {
      const docSnap = await this.db.collection('users').doc(userId).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { uid: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt), dateOfBirth: safeConvertOptionalDate(data.dateOfBirth), rgIssueDate: safeConvertOptionalDate(data.rgIssueDate) } as UserProfileData;
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
            if (JSON.stringify(userDataFromDB.permissions || []) !== JSON.stringify(targetRole.permissions || [])) { updatePayload.permissions = targetRole.permissions || []; needsUpdate = true; }
            if (needsUpdate) await userDocRef.update(updatePayload);
            finalProfileData = { ...userDataFromDB, ...updatePayload, uid: userId } as UserProfileData;
        } else {
            let authUserRecord;
            if(localAuthAdmin) authUserRecord = await localAuthAdmin.getUser(userId).catch(() => null);

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
                 // Adicionar campos de additionalProfileData
                ...(additionalProfileData || {}),
                dateOfBirth: additionalProfileData?.dateOfBirth ? ServerTimestamp.fromDate(new Date(additionalProfileData.dateOfBirth)) : undefined,
            };
            await userDocRef.set(newUserProfile);
            const createdSnap = await userDocRef.get();
            finalProfileData = { uid: createdSnap.id, ...createdSnap.data() } as UserProfileData;
        }
        return { success: true, message: 'Perfil de usuário assegurado/atualizado (Firestore).', userProfile: finalProfileData };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getUsersWithRoles(): Promise<UserProfileData[]> {
    try {
      const snapshot = await this.db.collection('users').orderBy('fullName').get();
      return Promise.all(snapshot.docs.map(async docSnap => {
        const data = docSnap.data();
        let roleName = data.roleName;
        let permissions = data.permissions || [];
        if (data.roleId && !roleName) { // Attempt to fetch role details if only ID is present
            const roleDoc = await this.getRole(data.roleId);
            if (roleDoc) { roleName = roleDoc.name; permissions = roleDoc.permissions || []; }
        }
        return { uid: docSnap.id, ...data, roleName: roleName || 'Não Definido', permissions, createdAt: safeConvertToDate(data.createdAt) } as UserProfileData;
      }));
    } catch (e: any) { return []; }
  }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = { updatedAt: AdminFieldValue.serverTimestamp() };
      if (roleId && roleId !== "---NONE---") {
        const roleDoc = await this.getRole(roleId); 
        if (roleDoc) { updateData.roleId = roleId; updateData.roleName = roleDoc.name; updateData.permissions = roleDoc.permissions || []; }
        else return { success: false, message: 'Perfil não encontrado.'};
      } else { // Remove role
        updateData.roleId = AdminFieldValue.delete(); 
        updateData.roleName = AdminFieldValue.delete();
        updateData.permissions = AdminFieldValue.delete();
      }
      await this.db.collection('users').doc(userId).update(updateData);
      return { success: true, message: 'Perfil do usuário atualizado!'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.db.collection('users').doc(userId).delete();
      return { success: true, message: 'Perfil de usuário excluído do Firestore!'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  async getUserByEmail(email: string): Promise<UserProfileData | null> {
    try {
      const snapshot = await this.db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
      if (snapshot.empty) return null;
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      let role: Role | null = null;
      if (userData.roleId) role = await this.getRole(userData.roleId);
      
      const profile = { uid: userDoc.id, ...userData } as UserProfileData;
      if (role) {
          profile.roleName = role.name;
          profile.permissions = role.permissions;
      }
      return profile;

    } catch (e: any) {
      console.error(`[FirestoreAdapter - getUserByEmail(${email})] Error:`, e);
      return null;
    }
  }

  // --- Roles ---
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    try {
      const normalizedName = data.name.trim().toUpperCase();
      const existing = await this.db.collection('roles').where('name_normalized', '==', normalizedName).limit(1).get();
      if (!existing.empty) return { success: false, message: `Perfil "${data.name}" já existe.`};
      const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
      const newRoleData = { ...data, name_normalized: normalizedName, permissions: validPermissions, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() };
      const docRef = await this.db.collection('roles').add(newRoleData);
      return { success: true, message: 'Perfil criado!', roleId: docRef.id };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async getRoles(): Promise<Role[]> {
    try {
      const snapshot = await this.db.collection('roles').orderBy('name').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: safeConvertToDate(doc.data().createdAt), updatedAt: safeConvertToDate(doc.data().updatedAt) } as Role));
    } catch (e: any) { return []; }
  }
  async getRole(id: string): Promise<Role | null> {
    try {
      const docSnap = await this.db.collection('roles').doc(id).get();
      if (!docSnap.exists) return null;
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as Role;
    } catch (e: any) { return null; }
  }
  async getRoleByName(name: string): Promise<Role | null> {
    try {
      const normalizedName = name.trim().toUpperCase();
      const snapshot = await this.db.collection('roles').where('name_normalized', '==', normalizedName).limit(1).get();
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      const data = docSnap.data()!;
      return { id: docSnap.id, ...data, createdAt: safeConvertToDate(data.createdAt), updatedAt: safeConvertToDate(data.updatedAt) } as Role;
    } catch (e: any) { return null; }
  }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    try {
      const updateData: any = { ...data, updatedAt: AdminFieldValue.serverTimestamp() };
      if (data.name) {
        const normalizedName = data.name.trim().toUpperCase();
        const currentRoleDoc = await this.db.collection('roles').doc(id).get();
        const currentNormalizedName = currentRoleDoc.data()?.name_normalized;
        if (currentNormalizedName !== 'ADMINISTRATOR' && currentNormalizedName !== 'USER') { 
            updateData.name_normalized = normalizedName;
        }
        updateData.name = data.name.trim();
      }
      if (data.permissions) {
        updateData.permissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
      }
      await this.db.collection('roles').doc(id).update(updateData);
      return { success: true, message: 'Perfil atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      const roleDoc = await this.db.collection('roles').doc(id).get();
      if (roleDoc.exists && ['ADMINISTRATOR', 'USER'].includes(roleDoc.data()!.name_normalized)) {
          return { success: false, message: 'Perfis de sistema não podem ser excluídos.'};
      }
      await this.db.collection('roles').doc(id).delete();
      return { success: true, message: 'Perfil excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
    const defaultRolesData: RoleFormData[] = [ 
      { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
      { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
      { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
      { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
      { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
    ];
    let rolesProcessedCount = 0;
    try {
      const batch = this.db.batch();
      for (const roleData of defaultRolesData) {
        const role = await this.getRoleByName(roleData.name);
        if (!role) {
          const newRoleRef = this.db.collection('roles').doc();
          const validPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
          batch.set(newRoleRef, { ...roleData, name_normalized: roleData.name.trim().toUpperCase(), permissions: validPermissions, createdAt: AdminFieldValue.serverTimestamp(), updatedAt: AdminFieldValue.serverTimestamp() });
          rolesProcessedCount++;
        } else {
          const currentPermissionsSorted = [...(role.permissions || [])].sort();
          const expectedPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
          if (JSON.stringify(currentPermissionsSorted) !== JSON.stringify(expectedPermissions) || role.description !== (roleData.description || '')) {
            batch.update(this.db.collection('roles').doc(role.id), { description: roleData.description, permissions: expectedPermissions, updatedAt: AdminFieldValue.serverTimestamp() });
            rolesProcessedCount++;
          }
        }
      }
      await batch.commit();
      return { success: true, message: 'Perfis padrão verificados/criados (Firestore).', rolesProcessed: rolesProcessedCount };
    } catch (e: any) { return { success: false, message: e.message, rolesProcessed: rolesProcessedCount }; }
  }
  
  // --- Media Items ---
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge' | 'storagePath'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> {
    try {
        const newMediaItemData = { ...data, urlOriginal: filePublicUrl, urlThumbnail: filePublicUrl, urlMedium: filePublicUrl, urlLarge: filePublicUrl, uploadedBy: uploadedBy || 'system', uploadedAt: AdminFieldValue.serverTimestamp(), linkedLotIds: [] };
        const docRef = await this.db.collection('mediaItems').add(newMediaItemData);
        const createdDoc = await docRef.get();
        return { success: true, message: "Item de mídia criado.", item: { id: docRef.id, ...createdDoc.data(), uploadedAt: safeConvertToDate(createdDoc.data()?.uploadedAt) } as MediaItem };
    } catch (e: any) { return { success: false, message: `Erro: ${e.message}`}; }
  }
  async getMediaItems(): Promise<MediaItem[]> {
    try {
        const snapshot = await this.db.collection('mediaItems').orderBy('uploadedAt', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), uploadedAt: safeConvertToDate(doc.data().uploadedAt) } as MediaItem));
    } catch (e: any) { 
        console.warn("[FirestoreAdapter - getMediaItems] Error (falling back to empty array):", e);
        return []; 
    }
  }
  async getMediaItem(id: string): Promise<MediaItem | null> {
    try {
        const docSnap = await this.db.collection('mediaItems').doc(id).get();
        if (!docSnap.exists) return null;
        const data = docSnap.data()!;
        return { id: docSnap.id, ...data, uploadedAt: safeConvertToDate(data.uploadedAt) } as MediaItem;
    } catch (e: any) { return null; }
  }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> {
    try {
        await this.db.collection('mediaItems').doc(id).update({ ...metadata, updatedAt: AdminFieldValue.serverTimestamp() });
        return { success: true, message: 'Metadados atualizados.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> {
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
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { const batch = this.db.batch();
    try {
        const lotRef = this.db.collection('lots').doc(lotId);
        batch.update(lotRef, { mediaItemIds: AdminFieldValue.arrayRemove(mediaItemId), updatedAt: AdminFieldValue.serverTimestamp() });
        const mediaRef = this.db.collection('mediaItems').doc(mediaItemId);
        batch.update(mediaRef, { linkedLotIds: AdminFieldValue.arrayRemove(lotId) });
        await batch.commit();
        return { success: true, message: 'Mídia desvinculada.'};
    } catch (e: any) { return { success: false, message: e.message }; }
  }
  
  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    try {
        const settingsDoc = await this.db.collection('platformSettings').doc('global').get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data()!;
            return { id: 'global', siteTitle: data.siteTitle, siteTagline: data.siteTagline, galleryImageBasePath: data.galleryImageBasePath || '/media/gallery/', activeThemeName: data.activeThemeName || null, themes: data.themes || [], platformPublicIdMasks: data.platformPublicIdMasks || {}, updatedAt: safeConvertToDate(data.updatedAt) };
        }
        const defaultSettings = { siteTitle: 'BidExpert', siteTagline: 'Leilões Online Especializados', galleryImageBasePath: '/media/gallery/', activeThemeName: null, themes: [], platformPublicIdMasks: {}, updatedAt: AdminFieldValue.serverTimestamp()};
        await this.db.collection('platformSettings').doc('global').set(defaultSettings);
        return { id: 'global', ...defaultSettings, updatedAt: new Date() } as PlatformSettings;
    } catch (e: any) { 
        console.error("[FirestoreAdapter - getPlatformSettings] Error, returning default:", e);
        return { id: 'global', ...samplePlatformSettings };
    }
  }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
        return { success: false, message: 'Caminho base da galeria inválido. Deve começar e terminar com "/".' };
    }
    try {
        const updatePayload = { ...data, platformPublicIdMasks: data.platformPublicIdMasks || {}, updatedAt: AdminFieldValue.serverTimestamp() };
        await this.db.collection('platformSettings').doc('global').set(updatePayload, { merge: true });
        return { success: true, message: 'Configurações atualizadas (Firestore)!' };
    } catch (e: any) { return { success: false, message: e.message }; }
  }

  // --- Reviews ---
  async getReviewsForLot(lotId: string): Promise<Review[]> {
    try {
      const snapshot = await this.db.collection('lots').doc(lotId).collection('reviews').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: safeConvertToDate(doc.data().createdAt),
        updatedAt: safeConvertOptionalDate(doc.data().updatedAt)
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
        id: doc.id,
        ...doc.data(),
        createdAt: safeConvertToDate(doc.data().createdAt),
        answeredAt: safeConvertOptionalDate(doc.data().answeredAt)
      } as LotQuestion));
    } catch (error: any) {
      console.error(`[FirestoreAdapter - getQuestionsForLot(${lotId})] Error:`, error);
      return [];
    }
  }

  async createQuestion(questionData: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string; }> {
    try {
      const newQuestion = {
        ...questionData,
        isPublic: true, // Default
        createdAt: AdminFieldValue.serverTimestamp(),
      };
      const docRef = await this.db.collection('lots').doc(questionData.lotId).collection('questions').add(newQuestion);
      return { success: true, message: 'Pergunta enviada com sucesso!', questionId: docRef.id };
    } catch (error: any) {
      console.error(`[FirestoreAdapter - createQuestion for lot ${questionData.lotId}] Error:`, error);
      return { success: false, message: 'Falha ao enviar pergunta.' };
    }
  }

  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> {
    // Esta implementação assume que você tem o lotId para construir o caminho,
    // ou que questionId já é o caminho completo ou uma forma de buscar o documento.
    // Se questionId é apenas o ID, precisaria de uma subcollectionGroup query ou lotId.
    // Para simplificar, vamos assumir que a action ou camada superior resolve o lotId.
    // Por ora, vou logar um aviso e retornar falha se o lotId não for obtido de alguma forma.
    console.warn("[FirestoreAdapter.answerQuestion] - Implementação requer que a action resolva o lotId para construir o caminho correto para a subcoleção 'questions'.");
    // Exemplo de como seria se lotId fosse passado:
    // const questionRef = this.db.collection('lots').doc(lotId).collection('questions').doc(questionId);
    // try {
    //   await questionRef.update({
    //     answerText,
    //     answeredAt: AdminFieldValue.serverTimestamp(),
    //     answeredByUserId,
    //     answeredByUserDisplayName,
    //   });
    //   return { success: true, message: 'Pergunta respondida.' };
    // } catch (e: any) {
    //   return { success: false, message: e.message };
    // }
    return { success: false, message: 'Funcionalidade de responder pergunta não implementada completamente no adapter (requer lotId).' };
  }

}
