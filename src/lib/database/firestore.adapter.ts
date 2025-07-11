// src/lib/database/firestore.adapter.ts
import { db as dbAdmin, ensureAdminInitialized, AdminFieldValue, ServerTimestamp } from '@/lib/firebase/admin';
import type { DatabaseAdapter, Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import admin from 'firebase-admin';

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
            throw new Error("Document data is undefined.");
        }
        // Converte Timestamps para strings ISO
        Object.keys(data).forEach(key => {
            if (data[key] instanceof ServerTimestamp) {
                data[key] = data[key].toDate().toISOString();
            }
        });
        return { id: doc.id, ...data } as T;
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
    
    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> {
       const docRef = this.db.collection('lots').doc(); // Auto-generate ID
       await docRef.set({
           ...lotData,
           createdAt: AdminFieldValue.serverTimestamp(),
           updatedAt: AdminFieldValue.serverTimestamp(),
       });
       return { success: true, message: "Lote criado com sucesso!", lotId: docRef.id };
    }
    
     async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('lots').doc(id).update({
            ...updates,
            updatedAt: AdminFieldValue.serverTimestamp()
        });
        return { success: true, message: "Lote atualizado com sucesso." };
    }

    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('lots').doc(id).delete();
        return { success: true, message: "Lote excluído com sucesso." };
    }

    async getAuctions(): Promise<Auction[]> {
        const snapshot = await this.db.collection('auctions').orderBy('auctionDate', 'desc').get();
        return snapshot.docs.map(doc => this.toJSON<Auction>(doc));
    }
    
    async getAuction(id: string): Promise<Auction | null> {
        const doc = await this.db.collection('auctions').doc(id).get();
        if (!doc.exists) return null;
        const auction = this.toJSON<Auction>(doc);
        // Fetch lots separately
        auction.lots = await this.getLots(auction.id);
        auction.totalLots = auction.lots.length;
        return auction;
    }
    
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        const docRef = this.db.collection('auctions').doc(); // Auto-generate ID
        await docRef.set({
            ...auctionData,
            createdAt: AdminFieldValue.serverTimestamp(),
            updatedAt: AdminFieldValue.serverTimestamp(),
        });
        return { success: true, message: "Leilão criado com sucesso!", auctionId: docRef.id };
    }

    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('auctions').doc(id).update({
            ...updates,
            updatedAt: AdminFieldValue.serverTimestamp()
        });
        return { success: true, message: "Leilão atualizado com sucesso." };
    }

    async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('auctions').doc(id).delete();
        return { success: true, message: "Leilão excluído com sucesso." };
    }
    
    async getLotsByIds(ids: string[]): Promise<Lot[]> {
      if (ids.length === 0) return [];
      const snapshot = await this.db.collection('lots').where(admin.firestore.FieldPath.documentId(), 'in', ids).get();
      return snapshot.docs.map(doc => this.toJSON<Lot>(doc));
    }
    
    async getLotCategories(): Promise<LotCategory[]> {
        const snapshot = await this.db.collection('categories').orderBy('name').get();
        return snapshot.docs.map(doc => this.toJSON<LotCategory>(doc));
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
    
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const doc = await this.db.collection('users').doc(userId).get();
        return doc.exists ? this.toJSON<UserProfileData>(doc) : null;
    }
    
    async getRoles(): Promise<Role[]> {
        const snapshot = await this.db.collection('roles').get();
        return snapshot.docs.map(doc => this.toJSON<Role>(doc));
    }

    async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('users').doc(userId).update({ roleId: roleId || null });
        return { success: true, message: "Perfil do usuário atualizado." };
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

    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        await this.db.collection('settings').doc('global').set({
            ...data,
            updatedAt: AdminFieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true, message: "Configurações atualizadas com sucesso." };
    }
}
