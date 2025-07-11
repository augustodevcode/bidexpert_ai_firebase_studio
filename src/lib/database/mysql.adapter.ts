
// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo } from '@/types';
import mysql from 'mysql2/promise';

export class MySqlAdapter implements DatabaseAdapter {
    private pool: mysql.Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        if (!process.env.DATABASE_URL) {
            this.connectionError = "A variável de ambiente DATABASE_URL não está definida.";
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError} Usando dados vazios.`);
            return;
        }
        try {
            this.pool = mysql.createPool(process.env.DATABASE_URL);
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
    
    async _notImplemented(method: string): Promise<any> {
        if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null);
        const message = `[MySqlAdapter] Método ${method} não implementado.`;
        console.warn(message);
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }
    
    private async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
        if (!this.pool) return [];
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return rows as any[];
        } catch (error: any) {
             console.error(`[MySqlAdapter] Erro na query: "${sql.substring(0, 100)}...". Erro: ${error.message}`);
             return [];
        } finally {
            connection.release();
        }
    }
    
    private async executeQueryForSingle(sql: string, params: any[] = []): Promise<any | null> {
        const rows = await this.executeQuery(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }
    
    async getLots(auctionId?: string): Promise<Lot[]> {
        let sql = 'SELECT * FROM lots';
        const params = [];
        if (auctionId) {
            sql += ' WHERE auctionId = ?';
            params.push(auctionId);
        }
        return this.executeQuery(sql, params);
    }
    
    async getLot(id: string): Promise<Lot | null> {
        return this.executeQueryForSingle('SELECT * FROM lots WHERE id = ?', [id]);
    }
    
    getLotsByIds(ids: string[]): Promise<Lot[]> {
        if (ids.length === 0) return Promise.resolve([]);
        const placeholders = ids.map(() => '?').join(',');
        const sql = `SELECT * FROM lots WHERE id IN (${placeholders})`;
        return this.executeQuery(sql, ids);
    }

    async getAuctions(): Promise<Auction[]> {
        const auctions = await this.executeQuery('SELECT * FROM auctions ORDER BY auctionDate DESC');
        for (const auction of auctions) {
            const lots = await this.getLots(auction.id);
            auction.lots = lots;
            auction.totalLots = lots.length;
        }
        return auctions;
    }

    async getAuction(id: string): Promise<Auction | null> {
        const auction = await this.executeQueryForSingle('SELECT * FROM auctions WHERE id = ?', [id]);
        if (auction) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
        }
        return auction;
    }
    
    async getStates(): Promise<StateInfo[]> { return this.executeQuery('SELECT * FROM states ORDER BY name'); }
    async getCities(stateId?: string): Promise<CityInfo[]> {
        let sql = 'SELECT * FROM cities';
        if (stateId) {
            sql += ' WHERE stateId = ? ORDER BY name';
            return this.executeQuery(sql, [stateId]);
        }
        return this.executeQuery(sql + ' ORDER BY name');
    }
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM lot_categories ORDER BY name'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM sellers ORDER BY name'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM auctioneers ORDER BY name'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> {
        const sql = `
            SELECT u.*, r.name as roleName, r.permissions 
            FROM users u 
            LEFT JOIN roles r ON u.roleId = r.id
        `;
        return this.executeQuery(sql);
    }
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const sql = `
            SELECT u.*, r.name as roleName, r.permissions 
            FROM users u 
            LEFT JOIN roles r ON u.roleId = r.id 
            WHERE u.id = ?
        `;
        return this.executeQueryForSingle(sql, [userId]);
    }
    async getRoles(): Promise<Role[]> { return this.executeQuery('SELECT * FROM roles ORDER BY name'); }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM media_items ORDER BY uploadedAt DESC'); }
    async getPlatformSettings(): Promise<PlatformSettings | null> { return this.executeQueryForSingle('SELECT * FROM platform_settings WHERE id = ?', ['global']); }

    async getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<any[]> {
        return this.executeQuery('SELECT * FROM subcategories WHERE parentCategoryId = ? ORDER BY displayOrder', [parentCategoryId]);
    }
    async getSubcategoryByIdAction(subcategoryId: string): Promise<any | null> {
        return this.executeQueryForSingle('SELECT * FROM subcategories WHERE id = ?', [subcategoryId]);
    }
    async getBens(filter?: { judicialProcessId?: string; sellerId?: string; }): Promise<Bem[]> {
        let sql = 'SELECT * FROM bens';
        let params = [];
        let conditions = [];
        if (filter?.judicialProcessId) {
            conditions.push('judicialProcessId = ?');
            params.push(filter.judicialProcessId);
        }
        if (filter?.sellerId) {
            conditions.push('sellerId = ?');
            params.push(filter.sellerId);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        return this.executeQuery(sql, params);
    }
    async getCourts(): Promise<Court[]> { return this.executeQuery('SELECT * FROM courts ORDER BY name'); }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return this.executeQuery('SELECT * FROM judicial_districts ORDER BY name'); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return this.executeQuery('SELECT * FROM judicial_branches ORDER BY name'); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return this.executeQuery('SELECT * FROM judicial_processes'); }
    async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return this.executeQuery('SELECT * FROM direct_sale_offers'); }
    async getDocumentTemplates(): Promise<DocumentTemplate[]> { return this.executeQuery('SELECT * FROM document_templates'); }
    async getContactMessages(): Promise<ContactMessage[]> { return this.executeQuery('SELECT * FROM contact_messages ORDER BY createdAt DESC'); }
    async getUserDocuments(userId: string): Promise<UserDocument[]> {
        return this.executeQuery('SELECT * FROM user_documents WHERE userId = ?', [userId]);
    }
    async getHabilitationRequests(): Promise<UserProfileData[]> {
        const sql = `
            SELECT u.* FROM users u 
            WHERE u.habilitationStatus IN ('PENDING_ANALYSIS', 'PENDING_DOCUMENTS', 'REJECTED_DOCUMENTS')
        `;
        return this.executeQuery(sql);
    }
    async getUserWins(userId: string): Promise<UserWin[]> {
        const sql = `
            SELECT w.*, l.title as lotTitle, l.number as lotNumber 
            FROM user_wins w 
            JOIN lots l ON w.lotId = l.id
            WHERE w.userId = ?
        `;
        return this.executeQuery(sql, [userId]);
    }
    async getUserBids(userId: string): Promise<any[]> {
        const sql = `
            SELECT b.*, l.title as lotTitle, l.price as lotPrice, l.status as lotStatus, l.id as lotPublicId, l.auctionId as lotAuctionId, a.title as lotAuctionName
            FROM bids b
            JOIN lots l ON b.lotId = l.id
            JOIN auctions a ON l.auctionId = a.id
            WHERE b.bidderId = ?
            ORDER BY b.timestamp DESC
        `;
        const userBids = await this.executeQuery(sql, [userId]);
        return userBids.map(bid => {
            let bidStatus: string = 'PERDENDO';
            if(bid.amount >= bid.lotPrice) {
                bidStatus = 'GANHANDO';
            }
            if(bid.lotStatus === 'VENDIDO' && bid.bidderId === 'user-placeholder-winner') { // Placeholder logic
                bidStatus = 'ARREMATADO';
            } else if (bid.lotStatus === 'VENDIDO') {
                bidStatus = 'NAO_ARREMATADO';
            }
            return {
                ...bid,
                lot: { id: bid.lotId, publicId: bid.lotPublicId, title: bid.lotTitle, price: bid.lotPrice, status: bid.lotStatus, auctionId: bid.lotAuctionId, auctionName: bid.lotAuctionName },
                userBidAmount: bid.amount,
                bidStatus: bidStatus
            };
        });
    }
    async getFinancialDataForConsignor(sellerId: string): Promise<any[]> {
        const sql = `
            SELECT w.*, l.title as lotTitle, l.number as lotNumber
            FROM user_wins w
            JOIN lots l ON w.lotId = l.id
            WHERE l.sellerId = ?
        `;
        return this.executeQuery(sql, [sellerId]);
    }
    async getLotsForConsignorAction(sellerId: string): Promise<any[]> {
        return this.executeQuery('SELECT * FROM lots WHERE sellerId = ?', [sellerId]);
    }

    // --- Write/Update/Delete Operations ---
    createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    deleteAuction(id: string): Promise<{ success: boolean, message: string }> { return this._notImplemented('deleteAuction'); }
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    createMediaItem(item: Partial<Omit<MediaItem, "id">>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}

    