
// src/lib/database/postgres.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo, UserHabilitationStatus, Subcategory, SubcategoryFormData, SellerFormData, AuctioneerFormData, CourtFormData, JudicialDistrictFormData, JudicialBranchFormData, JudicialProcessFormData, BemFormData, CityFormData, StateFormData } from '@/types';
import { Pool, type QueryResult } from 'pg';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';

export class PostgresAdapter implements DatabaseAdapter {
    private pool: Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        if (!process.env.POSTGRES_DATABASE_URL) {
            this.connectionError = "A variável de ambiente POSTGRES_DATABASE_URL não está definida.";
            console.warn(`[PostgresAdapter] AVISO: ${this.connectionError} Usando dados vazios.`);
            return;
        }
        try {
            this.pool = new Pool({
                connectionString: process.env.POSTGRES_DATABASE_URL,
            });
            console.log('[PostgresAdapter] Pool de conexões PostgreSQL inicializado.');
        } catch (error: any) {
            this.connectionError = `Falha ao criar o pool de conexões PostgreSQL: ${error.message}`;
            console.warn(`[PostgresAdapter] AVISO: ${this.connectionError}`);
            this.pool = null;
        }
    }
    
    private async getClient() {
        if (this.connectionError) {
            throw new Error(this.connectionError);
        }
        if (!this.pool) {
            throw new Error("Pool de conexões PostgreSQL não está disponível.");
        }
        return this.pool.connect();
    }
    
    private async executeQuery(query: string, params: any[] = []): Promise<any[]> {
        if (!this.pool) return [];
        const client = await this.getClient();
        try {
            const res = await client.query(query, params);
            return res.rows;
        } catch (error: any) {
             console.error(`[PostgresAdapter] Erro na query: "${query.substring(0, 100)}...". Erro: ${error.message}`);
             throw error;
        } finally {
            client.release();
        }
    }
    
    private async executeQueryForSingle(query: string, params: any[] = []): Promise<any | null> {
        const rows = await this.executeQuery(query, params);
        return rows.length > 0 ? rows[0] : null;
    }
    
    private async executeMutation(sql: string, params: any[] = []): Promise<{ success: boolean; message: string; rows: any[] }> {
        if (this.connectionError || !this.pool) return { success: false, message: 'Sem conexão com o banco de dados.', rows: [] };
        const client = await this.getClient();
        try {
            const result: QueryResult = await client.query(sql, params);
            return { success: true, message: 'Operação realizada com sucesso.', rows: result.rows };
        } catch (error: any) {
            if (error.code === '23505') { // Unique violation
                return { success: true, message: 'Item já existe, ignorado.', rows: [] };
            }
            console.error(`[PostgresAdapter] Erro na mutação: "${sql.substring(0, 100)}...". Erro: ${error.message}`);
            return { success: false, message: `Erro no banco de dados: ${error.message}`, rows: [] };
        } finally {
            client.release();
        }
    }
    
    // --- CREATE OPERATIONS ---

    async createAuction(data: Partial<Auction>): Promise<{ success: boolean, message: string, auctionId?: string }> {
        const { lots, totalLots, ...auctionData } = data;
        const newId = uuidv4();
        auctionData.id = newId;
        auctionData.publicId = `AUC-PUB-${newId.substring(0,8)}`;
        auctionData.slug = slugify(auctionData.title || '');
        const columns = Object.keys(auctionData).map(key => `"${key}"`).join(', ');
        const values = Object.values(auctionData);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO "Auction" (${columns}) VALUES (${placeholders}) RETURNING id`;
        const result = await this.executeMutation(sql, values);
        return { success: result.success, message: result.message, auctionId: result.rows[0]?.id };
    }
    
     async createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> {
        const { bens, ...dataToInsert } = lotData;
        const newId = uuidv4();
        dataToInsert.id = newId;
        dataToInsert.publicId = `LOT-PUB-${newId.substring(0,8)}`;
        dataToInsert.slug = slugify(dataToInsert.title || '');
        const columns = Object.keys(dataToInsert).map(key => `"${key}"`).join(', ');
        const values = Object.values(dataToInsert);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO "Lot" (${columns}) VALUES (${placeholders}) RETURNING id`;
        const result = await this.executeMutation(sql, values);
        return { success: result.success, message: result.message, lotId: result.rows[0]?.id };
    }

    async createLotCategory(data: Partial<LotCategory>): Promise<{ success: boolean; message: string; }> {
        const { id, name, slug, description, hasSubcategories, iconName, dataAiHintIcon, coverImageUrl, megaMenuImageUrl } = data;
        const sql = `INSERT INTO "LotCategory" (id, name, slug, description, "hasSubcategories", "iconName", "dataAiHintIcon", "coverImageUrl", "megaMenuImageUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`;
        const result = await this.executeMutation(sql, [id, name, slug, description, hasSubcategories, iconName, dataAiHintIcon, coverImageUrl, megaMenuImageUrl]);
        return { success: result.success, message: result.message };
    }

    async createSubcategory(data: Partial<Subcategory>): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
        const { id, name, slug, parentCategoryId, description, displayOrder } = data;
        const sql = `INSERT INTO "Subcategory" (id, name, slug, "parentCategoryId", description, "displayOrder") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING RETURNING id`;
        const result = await this.executeMutation(sql, [id, name, slug, parentCategoryId, description, displayOrder]);
        return { success: result.success, message: result.message, subcategoryId: result.rows[0]?.id };
    }

    async createRole(role: Omit<Role, "id" | "createdAt" | "updatedAt">): Promise<{success: boolean;message: string;}> {
        const { id, name, name_normalized, description, permissions } = { id: `role-${slugify(role.name)}`, ...role};
        const sql = `INSERT INTO "Role" (id, name, name_normalized, description, permissions) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`;
        const result = await this.executeMutation(sql, [id, name, name_normalized, description, JSON.stringify(permissions)]);
        return { success: result.success, message: result.message };
    }
    
    createUser(data: Partial<UserProfileData>): Promise<{ success: boolean; message: string; userId?: string; }> { return this._notImplemented('createUser'); }
    createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { return this._notImplemented('createState'); }
    createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { return this._notImplemented('createCity'); }
    createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> { return this._notImplemented('createSeller'); }
    createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { return this._notImplemented('createAuctioneer'); }
    createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> { return this._notImplemented('createCourt'); }
    createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> { return this._notImplemented('createJudicialDistrict'); }
    createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> { return this._notImplemented('createJudicialBranch'); }
    createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> { return this._notImplemented('createJudicialProcess'); }
    createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> { return this._notImplemented('createBem'); }
    createMediaItem(item: Partial<Omit<MediaItem, 'id'>>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    
    // --- READ OPERATIONS ---

    async getLots(auctionId?: string): Promise<Lot[]> { return this.executeQuery('SELECT * FROM "Lot"' + (auctionId ? ' WHERE "auctionId" = $1' : ''), auctionId ? [auctionId] : []); }
    async getLot(id: string): Promise<Lot | null> { return this.executeQueryForSingle('SELECT * FROM "Lot" WHERE "id" = $1 OR "publicId" = $1', [id]); }
    async getLotsByIds(ids: string[]): Promise<Lot[]> { if (ids.length === 0) return []; return this.executeQuery('SELECT * FROM "Lot" WHERE "id" = ANY($1::text[])', [ids]); }
    async getAuctions(): Promise<Auction[]> { return this.executeQuery('SELECT * FROM "Auction" ORDER BY "auctionDate" DESC'); }
    async getAuction(id: string): Promise<Auction | null> { return this.executeQueryForSingle('SELECT * FROM "Auction" WHERE "id" = $1 OR "publicId" = $1', [id]); }
    async getStates(): Promise<StateInfo[]> { return this.executeQuery('SELECT * FROM "State" ORDER BY "name"'); }
    async getCities(stateId?: string): Promise<CityInfo[]> { return this.executeQuery('SELECT * FROM "City"' + (stateId ? ' WHERE "stateId" = $1' : '') + ' ORDER BY "name"', stateId ? [stateId] : []); }
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM "LotCategory" ORDER BY "name"'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM "Seller" ORDER BY "name"'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM "Auctioneer" ORDER BY "name"'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> { return this.executeQuery('SELECT u.*, r.name as "roleName", r.permissions FROM "User" u LEFT JOIN "Role" r ON u."roleId" = r.id'); }
    async getUserProfileData(userId: string): Promise<UserProfileData | null> { return this.executeQueryForSingle('SELECT u.*, r.name as "roleName", r.permissions FROM "User" u LEFT JOIN "Role" r ON u."roleId" = r.id WHERE u.id = $1 OR u.uid = $1', [userId]); }
    async getRoles(): Promise<Role[]> { return this.executeQuery('SELECT * FROM "Role" ORDER BY "name"'); }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM "MediaItem" ORDER BY "uploadedAt" DESC'); }
    async getPlatformSettings(): Promise<PlatformSettings | null> {
        const settings = await this.executeQueryForSingle('SELECT * FROM "PlatformSettings" WHERE id = $1', ['global']);
        if (!settings) {
            return null;
        }
        return settings;
    }
    async getSubcategoriesByParent(parentCategoryId?: string): Promise<Subcategory[]> {
      if (!parentCategoryId) {
        return this.executeQuery('SELECT * FROM "Subcategory" ORDER BY "displayOrder"');
      }
      return this.executeQuery('SELECT * FROM "Subcategory" WHERE "parentCategoryId" = $1 ORDER BY "displayOrder"', [parentCategoryId]);
    }
    async getSubcategory(id: string): Promise<Subcategory | null> { return this.executeQueryForSingle('SELECT * FROM "Subcategory" WHERE id = $1', [id]); }
    getBens(filter?: { judicialProcessId?: string | undefined; sellerId?: string | undefined; }): Promise<Bem[]> { return this._notImplemented('getBens'); }
    getBem(id: string): Promise<Bem | null> { return this._notImplemented('getBem'); }
    getBensByIds(ids: string[]): Promise<Bem[]> { return this._notImplemented('getBensByIds'); }
    getSeller(id: string): Promise<SellerProfileInfo | null> { return this._notImplemented('getSeller'); }
    getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { return this._notImplemented('getAuctioneer'); }
    getCourts(): Promise<Court[]> { return this._notImplemented('getCourts'); }
    getJudicialDistricts(): Promise<JudicialDistrict[]> { return this._notImplemented('getJudicialDistricts'); }
    getJudicialBranches(): Promise<JudicialBranch[]> { return this._notImplemented('getJudicialBranches'); }
    getJudicialProcesses(): Promise<JudicialProcess[]> { return this._notImplemented('getJudicialProcesses'); }


    // --- UPDATE/DELETE OPERATIONS ---
    updateLot(id: string, updates: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuction'); }
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRoles'); }
    updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
    updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSeller'); }
    deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSeller'); }
    updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuctioneer'); }
    deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuctioneer'); }
    updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateSubcategory'); }
    deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteSubcategory'); }
    updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCity'); }
    deleteCity(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteCity'); }
    updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateState'); }
    deleteState(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteState'); }
    updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateCourt'); }
    updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateBem'); }
    saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('saveUserDocument'); }
    createPlatformSettings(data: PlatformSettings): Promise<{ success: boolean; message: string; }> { return this._notImplemented('createPlatformSettings'); }

    async _notImplemented(method: string): Promise<any> { if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null); const message = `[PostgresAdapter] Método ${method} não implementado.`; console.warn(message); return Promise.resolve(method.endsWith('s') ? [] : null); }
}

    