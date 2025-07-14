// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo, UserHabilitationStatus, Subcategory, SubcategoryFormData, SellerFormData, AuctioneerFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, BemFormData, CityFormData, StateFormData, UserCreationData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// #region UTILS
function snakeToCamel(s: string): string {
  return s.replace(/(_\w)/g, (m) => m[1].toUpperCase());
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertObjectKeys<T>(obj: any, converter: (key: string) => string): T {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[converter(key)] = obj[key];
        }
    }
    return newObj as T;
}

function convertAllKeysToCamel<T>(data: any[]): T[] {
    if (!data) return [];
    return data.map(item => convertObjectKeys<T>(item, snakeToCamel));
}

function convertAllKeysToSnake(data: any): any {
    if (Array.isArray(data)) {
        return data.map(item => convertObjectKeys(item, camelToSnake));
    }
    return convertObjectKeys(data, camelToSnake);
}
// #endregion

export class MySqlAdapter implements DatabaseAdapter {
    private pool: mysql.Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        console.log('[MySqlAdapter] LOG: Constructor called.');
        if (!process.env.DATABASE_URL) {
            this.connectionError = "A variável de ambiente DATABASE_URL não está definida.";
            console.error(`[MySqlAdapter] FATAL: ${this.connectionError}`);
            return;
        }
        try {
            this.pool = mysql.createPool({
              uri: process.env.DATABASE_URL,
              waitForConnections: true,
              connectionLimit: 10,
              queueLimit: 0,
              timezone: '+00:00' // Use UTC
            });
            console.log('[MySqlAdapter] LOG: Pool de conexões MySQL inicializado com sucesso.');
        } catch (error: any) {
            this.connectionError = `Falha ao criar o pool de conexões MySQL: ${error.message}`;
            console.error(`[MySqlAdapter] FATAL: ${this.connectionError}`);
            this.pool = null;
        }
    }

    private async getConnection() {
        if (this.connectionError) throw new Error(this.connectionError);
        if (!this.pool) throw new Error("Pool de conexões MySQL não está disponível.");
        return this.pool.getConnection();
    }
    
    private async executeQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
        const conn = await this.getConnection();
        try {
            const [rows] = await conn.execute(sql, params);
            return convertAllKeysToCamel<T>(rows as any[]);
        } finally {
            conn.release();
        }
    }

    private async executeQueryForSingle<T>(sql: string, params: any[] = []): Promise<T | null> {
        const results = await this.executeQuery<T>(sql, params);
        return results.length > 0 ? results[0] : null;
    }

    private async genericInsert(tableName: string, data: any, idField: string = 'id'): Promise<{ success: boolean; message: string; id?: string }> {
        const conn = await this.getConnection();
        try {
            const id = data[idField] || uuidv4();
            const dataWithId = { ...data, [idField]: id };
            const snakedData = convertAllKeysToSnake(dataWithId);
            const columns = Object.keys(snakedData).map(k => `\`${k}\``).join(', ');
            const placeholders = Object.keys(snakedData).map(() => '?').join(', ');
            const values = Object.values(snakedData);
            
            const sql = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE \`${idField}\`=\`${idField}\``;

            await conn.execute(sql, values);
            return { success: true, message: "Registro criado com sucesso.", id: id };
        } catch (error: any) {
            console.error(`[MySqlAdapter] Erro ao inserir em ${tableName}:`, error);
            return { success: false, message: `Falha ao inserir em ${tableName}: ${error.message}` };
        } finally {
            conn.release();
        }
    }

    // =================================================================
    // IMPLEMENTAÇÕES
    // =================================================================
    
    async getLots(auctionId?: string): Promise<Lot[]> {
      let sql = 'SELECT * FROM lots';
      if (auctionId) sql += ' WHERE auctionId = ?';
      return this.executeQuery<Lot>(sql, auctionId ? [auctionId] : []);
    }

    async getLot(id: string): Promise<Lot | null> {
      return this.executeQueryForSingle<Lot>('SELECT * FROM lots WHERE id = ? OR publicId = ?', [id, id]);
    }

    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> {
        const result = await this.genericInsert('lots', lotData, 'id');
        return { ...result, lotId: result.id };
    }

    async getAuctions(): Promise<Auction[]> {
        return this.executeQuery<Auction>('SELECT * FROM auctions ORDER BY auctionDate DESC');
    }

    async getAuction(id: string): Promise<Auction | null> {
      const auction = await this.executeQueryForSingle<Auction>('SELECT * FROM auctions WHERE id = ? OR publicId = ?', [id, id]);
      if (auction) {
        auction.lots = await this.getLots(auction.id);
        auction.totalLots = auction.lots.length;
      }
      return auction;
    }

    async getLotsByIds(ids: string[]): Promise<Lot[]> {
        if (ids.length === 0) return [];
        const placeholders = ids.map(() => '?').join(',');
        const sql = `SELECT * FROM lots WHERE id IN (${placeholders}) OR publicId IN (${placeholders})`;
        return this.executeQuery<Lot>(sql, [...ids, ...ids]);
    }
    
    async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
      const result = await this.genericInsert('courts', { ...data, slug: slugify(data.name) });
      return { ...result, courtId: result.id };
    }
    
    async getPlatformSettings(): Promise<PlatformSettings | null> {
      return this.executeQueryForSingle<PlatformSettings>('SELECT * FROM platformSettings LIMIT 1');
    }
    
     async createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> {
        return this.genericInsert('platformSettings', { ...data, id: data.id || 'global' });
    }
    
    async getRoles(): Promise<Role[]> { return this.executeQuery<Role>('SELECT * FROM roles'); }
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery<LotCategory>('SELECT * FROM lotCategories'); }
    async getSubcategoriesByParent(): Promise<Subcategory[]> { return this.executeQuery<Subcategory>('SELECT * FROM subcategories'); }
    async getStates(): Promise<StateInfo[]> { return this.executeQuery<StateInfo>('SELECT * FROM states'); }
    async getCities(): Promise<CityInfo[]> { return this.executeQuery<CityInfo>('SELECT * FROM cities'); }
    async getCourts(): Promise<Court[]> { return this.executeQuery<Court>('SELECT * FROM courts'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> { return this.executeQuery<UserProfileData>('SELECT * FROM users'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery<SellerProfileInfo>('SELECT * FROM sellers'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery<AuctioneerProfileInfo>('SELECT * FROM auctioneers'); }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return this.executeQuery<JudicialDistrict>('SELECT * FROM judicialDistricts'); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return this.executeQuery<JudicialBranch>('SELECT * FROM judicialBranches'); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return this.executeQuery<JudicialProcess>('SELECT * FROM judicialProcesses'); }
    async getBens(): Promise<Bem[]> { return this.executeQuery<Bem>('SELECT * FROM bens'); }
    async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return this.executeQuery<DirectSaleOffer>('SELECT * FROM directSaleOffers'); }
    async getBidsForLot(): Promise<BidInfo[]> { return this._notImplemented('getBidsForLot', true); }
    async getUserWins(): Promise<UserWin[]> { return this._notImplemented('getUserWins', true); }
    async getMediaItems(): Promise<MediaItem[]> { return this._notImplemented('getMediaItems', true); }
    
    // Fallback for methods not fully implemented in sample data adapter
    async _notImplemented(method: string, isList = false): Promise<any> {
        console.warn(`[MySqlAdapter] LOG: Método ${method} não implementado.`);
        return isList ? [] : null;
    }
    
    async close?(): Promise<void> { if (this.pool) await this.pool.end(); }

    // Other methods... (stubs)
    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    async deleteAuction(id: string): Promise<{ success: boolean, message: string }> { return this._notImplemented('deleteAuction'); }
    async getSubcategory(id: string): Promise<Subcategory | null> { return this._notImplemented('getSubcategory'); }
    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean, message: string }> { return this._notImplemented('createLotCategory'); }
    async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean, message: string, subcategoryId?: string }> { return this._notImplemented('createSubcategory'); }
    async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSubcategory'); }
    async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSubcategory'); }
    async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { return this._notImplemented('createState'); }
    async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateState'); }
    async deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteState'); }
    async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { return this._notImplemented('createCity'); }
    async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCity'); }
    async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteCity'); }
    async getSeller(id: string): Promise<SellerProfileInfo | null> { return this._notImplemented('getSeller'); }
    async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> { return this._notImplemented('createSeller'); }
    async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSeller'); }
    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSeller'); }
    async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { return this._notImplemented('getAuctioneer'); }
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { return this._notImplemented('createAuctioneer'); }
    async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuctioneer'); }
    async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuctioneer'); }
    async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCourt'); }
    async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { return this._notImplemented('createJudicialDistrict'); }
    async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { return this._notImplemented('createJudicialBranch'); }
    async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> { return this._notImplemented('createJudicialProcess'); }
    async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> { return this._notImplemented('createBem'); }
    async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateBem'); }
    async deleteBem(id: string): Promise<{ success: boolean, message: string }> { return this._notImplemented('deleteBem'); }
    async getUserProfileData(userIdOrEmail: string): Promise<UserProfileData | null> { return this._notImplemented('getUserProfileData'); }
    async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> { return this._notImplemented('createUser'); }
    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<{success: boolean;message: string;}> { return this._notImplemented('createRole'); }
    async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRoles'); }
    async createMediaItem(item: Partial<Omit<MediaItem, "id">>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
    async getDocumentTemplates?(): Promise<DocumentTemplate[]> { return this._notImplemented('getDocumentTemplates', true); }
    async getDocumentTemplate?(id: string): Promise<DocumentTemplate | null> { return this._notImplemented('getDocumentTemplate'); }
    async saveUserDocument?(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean, message: string }> { return this._notImplemented('saveUserDocument'); }
    async getContactMessages?(): Promise<ContactMessage[]> { return this._notImplemented('getContactMessages', true); }
    async saveContactMessage?(message: Omit<ContactMessage, "id" | "createdAt" | "isRead">): Promise<{ success: boolean; message: string; }> { return this._notImplemented('saveContactMessage'); }
    async getBem(id: string): Promise<Bem | null> { return this._notImplemented('getBem'); }
    async getBensByIds(ids: string[]): Promise<Bem[]> { return this._notImplemented('getBensByIds', true); }

}
