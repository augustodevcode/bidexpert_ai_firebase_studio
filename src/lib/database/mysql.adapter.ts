// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo, UserHabilitationStatus, Subcategory, SubcategoryFormData, SellerFormData, AuctioneerFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, BemFormData, CityFormData, StateFormData } from '@/types';
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

function convertObjectToSnakeCase(obj: Record<string, any>): Record<string, any> {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value instanceof Date) {
              newObj[toSnakeCase(key)] = value.toISOString().slice(0, 19).replace('T', ' ');
            } else if (typeof value === 'boolean') {
              newObj[toSnakeCase(key)] = value ? 1 : 0;
            } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
              newObj[toSnakeCase(key)] = JSON.stringify(value);
            } else {
              newObj[toSnakeCase(key)] = value;
            }
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
            this.connectionError = "A variável de ambiente DATABASE_URL (para MySQL) não está definida.";
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
             console.error(`[MySqlAdapter] Erro na query: "${sql}". Erro: ${error.message}`);
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
            console.error(`[MySqlAdapter] Erro na mutação: "${sql}". Erro: ${error.message}`);
            return { success: false, message: `Erro no banco de dados: ${error.message}` };
        } finally {
            connection.release();
        }
    }
    
    private async genericCreate(tableName: string, data: Record<string, any>, idPrefix?: string, publicIdPrefix?: string): Promise<{ success: boolean; message: string; insertId?: string }> {
      const newId = idPrefix ? `${idPrefix}-${uuidv4()}` : uuidv4();
      const publicId = publicIdPrefix ? `${publicIdPrefix}-PUB-${newId.substring(newId.length - 8)}` : null;

      const dataToInsert: Record<string, any> = { id: newId };
      if (publicId) dataToInsert['publicId'] = publicId;
      if (data.name && !data.slug) dataToInsert['slug'] = slugify(data.name);
      if (data.title && !data.slug) dataToInsert['slug'] = slugify(data.title);

      Object.assign(dataToInsert, data);

      dataToInsert['createdAt'] = new Date();
      dataToInsert['updatedAt'] = new Date();
      
      const snakeCaseData = convertObjectToSnakeCase(dataToInsert);

      const fields = Object.keys(snakeCaseData).map(k => `\`${k}\``).join(', ');
      const placeholders = Object.keys(snakeCaseData).map(() => '?').join(', ');
      const values = Object.values(snakeCaseData);

      const sql = `INSERT INTO \`${tableName}\` (${fields}) VALUES (${placeholders})`;
      const result = await this.executeMutation(sql, values);
      if (result.success) {
        return { success: true, message: "Registro criado com sucesso!", insertId: newId };
      }
      return { success: false, message: result.message };
    }

    private async genericUpdate(tableName: string, id: string, data: Record<string, any>): Promise<{ success: boolean; message: string; }> {
        const updates = { ...data, updatedAt: new Date() };
        if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
        if (updates.title && !updates.slug) updates.slug = slugify(updates.title);

        const snakeCaseUpdates = convertObjectToSnakeCase(updates);
        
        const fieldsToUpdate = Object.keys(snakeCaseUpdates).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(snakeCaseUpdates);

        if (values.length === 0) return { success: true, message: "Nenhum campo para atualizar." };

        const sql = `UPDATE \`${tableName}\` SET ${fieldsToUpdate} WHERE id = ?`;
        return this.executeMutation(sql, [...values, id]);
    }

    // --- ENTITY IMPLEMENTATIONS ---

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
    
    async getLotsByIds(ids: string[]): Promise<Lot[]> {
        if (ids.length === 0) return Promise.resolve([]);
        const placeholders = ids.map(() => '?').join(',');
        const sql = `SELECT * FROM \`lots\` WHERE \`id\` IN (${placeholders}) OR \`public_id\` IN (${placeholders})`;
        return this.executeQuery(sql, [...ids, ...ids]);
    }

    async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> {
      const { bens, ...data } = lotData;
      const result = await this.genericCreate('lots', data, 'lot', 'LOT');
      if (result.success && result.insertId && bens) {
          for (const bem of bens) {
              await this.executeMutation('INSERT INTO `lot_bens` (`lotId`, `bemId`) VALUES (?, ?)', [result.insertId, bem.id]);
          }
      }
      return { ...result, lotId: result.insertId };
    }

    async updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> {
      return this.genericUpdate('lots', id, updates);
    }

    async deleteLot(id: string): Promise<{ success: boolean; message: string; }> {
      return this.executeMutation('DELETE FROM `lots` WHERE id = ?', [id]);
    }
    
    async getBens(filter?: { judicialProcessId?: string; sellerId?: string; }): Promise<Bem[]> {
        let sql = 'SELECT b.*, cat.name as category_name, sub.name as subcategory_name FROM `bens` b LEFT JOIN `lot_categories` cat ON b.category_id = cat.id LEFT JOIN `subcategories` sub ON b.subcategory_id = sub.id';
        const params = [];
        const whereClauses = [];
        if (filter?.judicialProcessId) {
            whereClauses.push('b.`judicial_process_id` = ?');
            params.push(filter.judicialProcessId);
        }
        if (filter?.sellerId) {
            whereClauses.push('b.`seller_id` = ?');
            params.push(filter.sellerId);
        }
        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }
        return this.executeQuery(sql, params);
    }

    async getBem(id: string): Promise<Bem | null> {
        return this.executeQueryForSingle('SELECT * FROM `bens` WHERE `id` = ?', [id]);
    }
    
    async getBensByIds(ids: string[]): Promise<Bem[]> {
        if (!ids || ids.length === 0) return [];
        const placeholders = ids.map(() => '?').join(',');
        return this.executeQuery(`SELECT * FROM \`bens\` WHERE id IN (${placeholders})`, ids);
    }
    
    async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
      const result = await this.genericCreate('bens', data, 'bem', 'BEM');
      return {...result, bemId: result.insertId};
    }
    
    async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('bens', id, data);
    }

    async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
        return this.executeMutation('DELETE FROM `bens` WHERE id = ?', [id]);
    }

    async getAuctions(): Promise<Auction[]> {
        const auctions = await this.executeQuery('SELECT * FROM `auctions` ORDER BY `auction_date` DESC');
        for (const auction of auctions) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
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
    
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
      const { lots, ...data } = auctionData;
      const result = await this.genericCreate('auctions', data, 'auc', 'AUC');
      return { ...result, auctionId: result.insertId };
    }
    
    async deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
      return this.executeMutation('DELETE FROM `auctions` WHERE `id` = ?', [id]);
    }

    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
       return this.genericUpdate('auctions', id, updates);
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
        const sql = 'SELECT u.*, r.name as `role_name`, r.permissions FROM `users` u LEFT JOIN `roles` r ON u.roleId = r.id';
        const users = await this.executeQuery(sql);
        return users.map(u => {
            if (typeof u.permissions === 'string') {
                try { u.permissions = JSON.parse(u.permissions); } catch(e) { u.permissions = []; }
            } else if (!u.permissions) {
                u.permissions = [];
            }
            return u;
        });
    }
    
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const sql = 'SELECT u.*, r.name as `role_name`, r.permissions FROM `users` u LEFT JOIN `roles` r ON u.roleId = r.id WHERE u.id = ? OR u.uid = ?';
        const user = await this.executeQueryForSingle(sql, [userId, userId]);
        if(user && typeof user.permissions === 'string') {
          try { user.permissions = JSON.parse(user.permissions); } catch(e) { user.permissions = []; }
        } else if (user && !user.permissions) {
          user.permissions = [];
        }
        return user;
    }
    
    async getRoles(): Promise<Role[]> { 
        const roles = await this.executeQuery('SELECT * FROM `roles` ORDER BY `name`'); 
        return roles.map(r => {
            if (typeof r.permissions === 'string') {
                 try { r.permissions = JSON.parse(r.permissions); } catch(e) { r.permissions = []; }
            } else if (!r.permissions) {
                r.permissions = [];
            }
            return r;
        });
    }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM `media_items` ORDER BY `uploaded_at` DESC'); }
    
    async getPlatformSettings(): Promise<PlatformSettings | null> {
        const settings = await this.executeQueryForSingle('SELECT * FROM `platform_settings` WHERE id = ?', ['global']);
        if (!settings) return null;
        
        try {
            const fieldsToParse = ['themes', 'homepageSections', 'mentalTriggerSettings', 'sectionBadgeVisibility', 'mapSettings', 'variableIncrementTable', 'biddingSettings', 'platformPublicIdMasks'];
            for (const field of fieldsToParse) {
                if (settings[field] && typeof settings[field] === 'string') {
                    settings[field] = JSON.parse(settings[field]);
                }
            }
        } catch(e: any) {
            console.error(`Error parsing PlatformSettings JSON from DB: ${e.message}`);
            return null; // Retorna null se houver erro no parse para evitar que a aplicação quebre
        }
        return settings;
    }

    async getCourts(): Promise<Court[]> { return this.executeQuery('SELECT * FROM `courts` ORDER BY `name`'); }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return this.executeQuery('SELECT * FROM `judicial_districts` ORDER BY `name`'); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return this.executeQuery('SELECT * FROM `judicial_branches` ORDER BY `name`'); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return this.executeQuery('SELECT * FROM `judicial_processes` ORDER BY `created_at` DESC'); }

    async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
      const result = await this.genericCreate('courts', data, 'court');
      return {...result, courtId: result.insertId};
    }

    async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('courts', id, data);
    }
    
    async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
        const result = await this.genericCreate('judicial_districts', data, 'dist');
        return {...result, districtId: result.insertId};
    }

    async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
      const result = await this.genericCreate('judicial_branches', data, 'branch');
      return {...result, branchId: result.insertId};
    }

    async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
        const { parties, ...processData } = data;
        const result = await this.genericCreate('judicial_processes', processData, 'proc', 'PROC');
        if (result.success && result.insertId && parties && parties.length > 0) {
            for (const party of parties) {
                await this.genericCreate('judicial_parties', { ...party, process_id: result.insertId }, 'party');
            }
        }
        return {...result, processId: result.insertId};
    }
    
    async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
      const result = await this.genericCreate('states', data, `state-${data.uf.toLowerCase()}`);
      return {...result, stateId: result.insertId};
    }

    async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
        const result = await this.genericCreate('cities', data, 'city');
        return {...result, cityId: result.insertId};
    }

    async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
      const result = await this.genericCreate('sellers', data, 'seller', 'SELL');
      return {...result, sellerId: result.insertId};
    }

    async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
      return this.genericUpdate('sellers', id, data);
    }

    async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
        return this.executeMutation('DELETE FROM `sellers` WHERE id = ?', [id]);
    }
    
    async getSeller(id: string): Promise<SellerProfileInfo | null> {
        return this.executeQueryForSingle('SELECT * FROM `sellers` WHERE id = ? OR public_id = ?', [id, id]);
    }
    
    async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
        const result = await this.genericCreate('auctioneers', data, 'auct', 'AUCT');
        return {...result, auctioneerId: result.insertId};
    }

    async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('auctioneers', id, data);
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
        
        if (result.success) {
            await this.executeMutation('UPDATE `users` SET habilitation_status = ? WHERE uid = ? AND habilitation_status = ?', ['PENDING_ANALYSIS', userId, 'PENDING_DOCUMENTS']);
        }
        
        return result;
    }
    
    async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this.genericUpdate('users', userId, { role_id: roleId }); }
    createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    
    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
        const result = await this.genericCreate('lot_categories', data, 'cat');
        return { success: result.success, message: result.message };
    }

    async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('platform_settings', 'global', data);
    }

    async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string }> {
      return this.genericUpdate('cities', id, data);
    }

    async deleteCity(id: string): Promise<{ success: boolean; message: string }> {
      return this.executeMutation('DELETE FROM `cities` WHERE id = ?', [id]);
    }
    
    async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
        return this.genericUpdate('subcategories', id, data);
    }

    async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
       return this.executeMutation('DELETE FROM `subcategories` WHERE id = ?', [id]);
    }

    async _notImplemented(method: string): Promise<any> {
        if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null);
        const message = `[MySqlAdapter] Método ${method} não implementado.`;
        console.warn(message);
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }
}
