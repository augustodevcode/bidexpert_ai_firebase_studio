
// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo, UserHabilitationStatus, Subcategory, SubcategoryFormData, SellerFormData, AuctioneerFormData } from '@/types';
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { samplePlatformSettings } from '@/lib/sample-data';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
}

function convertKeysToCamelCase<T extends {}>(obj: any): T {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[toCamelCase(key)] = obj[key];
        }
    }
    return newObj as T;
}


function convertKeysToSnakeCase(obj: Record<string, any>): Record<string, any> {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[toSnakeCase(key)] = obj[key];
        }
    }
    return newObj;
}


export class MySqlAdapter implements DatabaseAdapter {
    private pool: Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl || !dbUrl.startsWith('mysql://')) {
            this.connectionError = "A variável de ambiente MYSQL_DATABASE_URL não está definida. Usando dados vazios.";
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError}`);
            return;
        }
        try {
            this.pool = mysql.createPool(dbUrl);
            console.log('[MySqlAdapter] Pool de conexões MySQL inicializado.');
        } catch (error: any) {
            this.connectionError = `Falha ao criar o pool de conexões MySQL: ${error.message}`;
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError}`);
            this.pool = null;
        }
    }

    private async getConnection() {
        if (this.connectionError) {
            throw new Error(this.connectionError);
        }
        if (!this.pool) {
            throw new Error("Pool de conexões MySQL não está disponível.");
        }
        return this.pool.getConnection();
    }
    
    private async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
        if (!this.pool) return [];
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return (rows as any[]).map(row => convertKeysToCamelCase(row));
        } catch (error: any) {
             console.error(`[MySqlAdapter] Erro na query: "${sql.substring(0, 100)}...". Erro: ${error.message}`);
             throw error; 
        } finally {
            connection.release();
        }
    }
    
    private async executeQueryForSingle(sql: string, params: any[] = []): Promise<any | null> {
        const rows = await this.executeQuery(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }
    
    private async executeMutation(sql: string, params: any[] = []): Promise<{ success: boolean; message: string; insertId?: number }> {
        if (!this.pool) return { success: false, message: 'Sem conexão com o banco de dados.' };
        const connection = await this.getConnection();
        try {
            const [result] = await connection.execute(sql, params);
            const header = result as ResultSetHeader;
            return { success: true, message: 'Operação realizada com sucesso.', insertId: header.insertId };
        } catch (error: any) {
            console.error(`[MySqlAdapter] Erro na mutação: "${sql.substring(0, 100)}...". Erro: ${error.message}`);
            return { success: false, message: `Erro no banco de dados: ${error.message}` };
        } finally {
            connection.release();
        }
    }


    // --- READ OPERATIONS ---
    
    async getLots(auctionId?: string): Promise<Lot[]> {
        let sql = 'SELECT * FROM `lots`';
        const params = [];
        if (auctionId) {
            sql += ' WHERE `auction_id` = ?';
            params.push(auctionId);
        }
        return this.executeQuery(sql, params);
    }
    
    async getLot(id: string): Promise<Lot | null> {
        return this.executeQueryForSingle('SELECT * FROM `lots` WHERE `id` = ? OR `public_id` = ?', [id, id]);
    }
    
    getLotsByIds(ids: string[]): Promise<Lot[]> {
        if (ids.length === 0) return Promise.resolve([]);
        const placeholders = ids.map(() => '?').join(',');
        const sql = `SELECT * FROM \`lots\` WHERE \`id\` IN (${placeholders}) OR \`public_id\` IN (${placeholders})`;
        return this.executeQuery(sql, [...ids, ...ids]);
    }

    async getAuctions(): Promise<Auction[]> {
        const auctions = await this.executeQuery('SELECT * FROM `auctions` ORDER BY `auction_date` DESC');
        for (const auction of auctions) {
            const lots = await this.executeQuery('SELECT * FROM `lots` WHERE `auction_id` = ?', [auction.id]);
            auction.lots = lots;
            auction.totalLots = lots.length;
        }
        return auctions;
    }

    async getAuction(id: string): Promise<Auction | null> {
        const auction = await this.executeQueryForSingle('SELECT * FROM `auctions` WHERE `id` = ? OR `public_id` = ?', [id, id]);
        if (auction) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
        }
        return auction;
    }
    
    async getStates(): Promise<StateInfo[]> { return this.executeQuery('SELECT * FROM `states` ORDER BY `name`'); }
    async getCities(stateId?: string): Promise<CityInfo[]> {
        let sql = 'SELECT * FROM `cities`';
        if (stateId) {
            sql += ' WHERE `state_id` = ? ORDER BY `name`';
            return this.executeQuery(sql, [stateId]);
        }
        return this.executeQuery(sql + ' ORDER BY `name`');
    }
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM `lot_categories` ORDER BY `name`'); }
    
    async getSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
        return this.executeQuery('SELECT * FROM `subcategories` WHERE `parent_category_id` = ? ORDER BY `display_order`', [parentCategoryId]);
    }
    async getSubcategory(id: string): Promise<Subcategory | null> {
        return this.executeQueryForSingle('SELECT * FROM `subcategories` WHERE `id` = ?', [id]);
    }


    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM `sellers` ORDER BY `name`'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM `auctioneers` ORDER BY `name`'); }
    
    async getUsersWithRoles(): Promise<UserProfileData[]> {
        const sql = 'SELECT u.*, r.name as `role_name`, r.permissions FROM `users` u LEFT JOIN `roles` r ON u.role_id = r.id';
        return this.executeQuery(sql);
    }
    
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const sql = 'SELECT u.*, r.name as `role_name`, r.permissions FROM `users` u LEFT JOIN `roles` r ON u.role_id = r.id WHERE u.id = ? OR u.uid = ?';
        return this.executeQueryForSingle(sql, [userId, userId]);
    }
    
    async getRoles(): Promise<Role[]> { return this.executeQuery('SELECT * FROM `roles` ORDER BY `name`'); }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM `media_items` ORDER BY `uploaded_at` DESC'); }
    
    async getPlatformSettings(): Promise<PlatformSettings | null> {
        const settings = await this.executeQueryForSingle('SELECT * FROM `platform_settings` WHERE id = ?', ['global']);
        if (!settings) {
            console.warn("[MySqlAdapter] Configurações da plataforma não encontradas no DB. Retornando null.");
            return null;
        }
        try {
            // Safely parse JSON fields
            const fieldsToParse = ['themes', 'homepageSections', 'mentalTriggerSettings', 'sectionBadgeVisibility', 'mapSettings', 'variableIncrementTable', 'biddingSettings'];
            for (const field of fieldsToParse) {
                if (settings[field] && typeof settings[field] === 'string') {
                    settings[field] = JSON.parse(settings[field]);
                }
            }
        } catch(e: any) {
            console.error(`Error parsing PlatformSettings JSON from DB: ${e.message}`);
            // Return null or throw an error if parsing fails, to avoid propagating malformed data.
            return null;
        }
        return settings;
    }
    
    // --- WRITE/UPDATE/DELETE OPERATIONS ---
    
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
      const newId = uuidv4();
      const publicId = `AUC-PUB-${newId.substring(0,8)}`;
      const dataToInsert = {
        id: newId,
        public_id: publicId,
        slug: slugify(auctionData.title || `auction-${newId}`),
        ...auctionData,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      const snakeCaseData = convertKeysToSnakeCase(dataToInsert);
      delete snakeCaseData.lots; // Ensure lots array isn't sent to SQL
      
      const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
      const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
      const values = Object.values(snakeCaseData);

      const sql = `INSERT INTO \`auctions\` (${fields}) VALUES (${placeholders})`;
      const result = await this.executeMutation(sql, values);
      if (result.success) {
        return { success: true, message: "Leilão criado com sucesso!", auctionId: newId };
      }
      return result;
    }
    
    async deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
      const result = await this.executeMutation('DELETE FROM `auctions` WHERE `id` = ?', [id]);
      return result;
    }

    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
       const snakeCaseUpdates = convertKeysToSnakeCase(updates);
       snakeCaseUpdates['updated_at'] = new Date();
       if (updates.title) {
           snakeCaseUpdates['slug'] = slugify(updates.title);
       }
       
       delete snakeCaseUpdates.lots; // Ensure lots array isn't sent to SQL

       const fieldsToUpdate = Object.keys(snakeCaseUpdates).map(key => `\`${key}\` = ?`).join(', ');
       const values = Object.values(snakeCaseUpdates);

       const sql = `UPDATE \`auctions\` SET ${fieldsToUpdate} WHERE id = ?`;
       return this.executeMutation(sql, [...values, id]);
    }

    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> {
      const newId = uuidv4();
      const publicId = `LOT-PUB-${newId.substring(0,8)}`;
      const dataToInsert = {
        id: newId,
        public_id: publicId,
        slug: slugify(lotData.title || `lot-${newId}`),
        ...lotData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const snakeCaseData = convertKeysToSnakeCase(dataToInsert);
      delete snakeCaseData.bens;

      const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
      const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
      const values = Object.values(snakeCaseData);

      const sql = `INSERT INTO \`lots\` (${fields}) VALUES (${placeholders})`;
      const result = await this.executeMutation(sql, values);
       if (result.success) {
        return { success: true, message: "Lote criado com sucesso!", lotId: newId };
      }
      return result;
    }

    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
      return this.executeMutation('DELETE FROM `lots` WHERE id = ?', [id]);
    }

    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> {
        const snakeCaseUpdates = convertKeysToSnakeCase(updates);
        snakeCaseUpdates['updated_at'] = new Date();
        if (updates.title) {
            snakeCaseUpdates['slug'] = slugify(updates.title);
        }
        delete snakeCaseUpdates.bens;
        
        const fieldsToUpdate = Object.keys(snakeCaseUpdates).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(snakeCaseUpdates);

        const sql = `UPDATE \`lots\` SET ${fieldsToUpdate} WHERE id = ?`;
        return this.executeMutation(sql, [...values, id]);
    }
    
    async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean, message: string, subcategoryId?: string }> {
        return this._notImplemented('createSubcategory');
    }
    async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean, message: string }> {
        return this._notImplemented('updateSubcategory');
    }
    async deleteSubcategory(id: string): Promise<{ success: boolean, message: string }> {
        return this._notImplemented('deleteSubcategory');
    }


    async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
      const newId = uuidv4();
      const sellerData = {
          id: newId,
          public_id: `SELL-PUB-${newId.substring(0,8)}`,
          slug: slugify(data.name),
          ...data,
          created_at: new Date(),
          updated_at: new Date()
      };
      const snakeCaseData = convertKeysToSnakeCase(sellerData);
      const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
      const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
      const result = await this.executeMutation(`INSERT INTO \`sellers\` (${fields}) VALUES (${placeholders})`, Object.values(snakeCaseData));
      if (result.success) {
          return { ...result, sellerId: newId };
      }
      return result;
    }

    async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
      const updates = { ...convertKeysToSnakeCase(data), updated_at: new Date() };
      if(data.name) updates['slug'] = slugify(data.name);
      const setClause = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
      return this.executeMutation(`UPDATE \`sellers\` SET ${setClause} WHERE id = ?`, [...Object.values(updates), id]);
    }

    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
        return this.executeMutation('DELETE FROM `sellers` WHERE id = ?', [id]);
    }
    
    async getSeller(id: string): Promise<SellerProfileInfo | null> {
        return this.executeQueryForSingle('SELECT * FROM `sellers` WHERE id = ? OR public_id = ?', [id, id]);
    }
    
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
        const newId = uuidv4();
        const auctioneerData = {
            id: newId,
            public_id: `AUCT-PUB-${newId.substring(0,8)}`,
            slug: slugify(data.name),
            ...data,
            created_at: new Date(),
            updated_at: new Date()
        };
        const snakeCaseData = convertKeysToSnakeCase(auctioneerData);
        const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
        const result = await this.executeMutation(`INSERT INTO \`auctioneers\` (${fields}) VALUES (${placeholders})`, Object.values(snakeCaseData));
        if (result.success) {
            return { ...result, auctioneerId: newId };
        }
        return result;
    }

    async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
        const updates = { ...convertKeysToSnakeCase(data), updated_at: new Date() };
        if(data.name) updates['slug'] = slugify(data.name);
        const setClause = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
        return this.executeMutation(`UPDATE \`auctioneers\` SET ${setClause} WHERE id = ?`, [...Object.values(updates), id]);
    }

    async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> {
        return this.executeMutation('DELETE FROM `auctioneers` WHERE id = ?', [id]);
    }
    
    async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
        return this.executeQueryForSingle('SELECT * FROM `auctioneers` WHERE id = ? OR public_id = ?', [id, id]);
    }

    async saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean, message: string }> {
        const id = uuidv4();
        const sql = 'INSERT INTO `user_documents` (id, user_id, document_type_id, file_url, file_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const result = await this.executeMutation(sql, [id, userId, documentTypeId, fileUrl, fileName, 'PENDING_ANALYSIS', new Date(), new Date()]);
        
        // After inserting, update user status if needed
        if (result.success) {
            await this.executeMutation('UPDATE `users` SET habilitation_status = ? WHERE uid = ? AND habilitation_status = ?', ['PENDING_ANALYSIS', userId, 'PENDING_DOCUMENTS']);
        }
        
        return result;
    }
    
     async _notImplemented(method: string): Promise<any> {
        if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null);
        const message = `[MySqlAdapter] Método ${method} não implementado.`;
        console.warn(message);
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }
    
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    
    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
        const snakeCaseData = convertKeysToSnakeCase(data);
        const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
        return this.executeMutation(`INSERT INTO \`lot_categories\` (${fields}) VALUES (${placeholders})`, Object.values(snakeCaseData));
    }

    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        const snakeCaseData = convertKeysToSnakeCase(data);
        const updateData: Record<string, any> = {};

        for (const [key, value] of Object.entries(snakeCaseData)) {
            if (typeof value === 'object' && value !== null) {
                updateData[key] = JSON.stringify(value);
            } else {
                updateData[key] = value;
            }
        }
        updateData['updated_at'] = new Date();

        const fieldsToUpdate = Object.keys(updateData).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(updateData);
        
        const sql = `UPDATE \`platform_settings\` SET ${fieldsToUpdate} WHERE id = ?`;
        return this.executeMutation(sql, [...values, 'global']);
    }
}
