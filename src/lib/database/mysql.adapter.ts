// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings } from '@/types';
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
        let sql = 'SELECT * FROM Lot';
        const params = [];
        if (auctionId) {
            sql += ' WHERE auctionId = ?';
            params.push(auctionId);
        }
        return this.executeQuery(sql, params);
    }
    
    async getLot(id: string): Promise<Lot | null> {
        return this.executeQueryForSingle('SELECT * FROM Lot WHERE id = ?', [id]);
    }
    
    getLotsByIds(ids: string[]): Promise<Lot[]> {
        if (ids.length === 0) return Promise.resolve([]);
        const placeholders = ids.map(() => '?').join(',');
        const sql = `SELECT * FROM Lot WHERE id IN (${placeholders})`;
        return this.executeQuery(sql, ids);
    }

    async getAuctions(): Promise<Auction[]> {
        const auctions = await this.executeQuery('SELECT * FROM Auction ORDER BY auctionDate DESC');
        // Para cada leilão, podemos buscar a contagem de lotes ou até mesmo os lotes
        for (const auction of auctions) {
            const lots = await this.getLots(auction.id);
            auction.lots = lots;
            auction.totalLots = lots.length;
        }
        return auctions;
    }

    async getAuction(id: string): Promise<Auction | null> {
        const auction = await this.executeQueryForSingle('SELECT * FROM Auction WHERE id = ?', [id]);
        if (auction) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
        }
        return auction;
    }

    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM LotCategory ORDER BY name'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM Seller ORDER BY name'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM Auctioneer ORDER BY name'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> {
        const sql = `
            SELECT u.*, r.name as roleName, r.permissions 
            FROM User u 
            LEFT JOIN Role r ON u.roleId = r.id
        `;
        return this.executeQuery(sql);
    }
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
        const sql = `
            SELECT u.*, r.name as roleName, r.permissions 
            FROM User u 
            LEFT JOIN Role r ON u.roleId = r.id 
            WHERE u.id = ?
        `;
        return this.executeQueryForSingle(sql, [userId]);
    }
    async getRoles(): Promise<Role[]> { return this.executeQuery('SELECT * FROM Role ORDER BY name'); }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM MediaItem ORDER BY uploadedAt DESC'); }
    async getPlatformSettings(): Promise<PlatformSettings | null> { return this.executeQueryForSingle('SELECT * FROM PlatformSettings WHERE id = ?', ['global']); }
    
    // Métodos de escrita ainda precisam de implementação detalhada
    createLot(lotData: Partial<Lot>): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: Partial<Lot>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteAuction'); }
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    createMediaItem(item: Partial<Omit<MediaItem, "id">>, url: string, userId: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> { return this._notImplemented('createMediaItem'); }
    updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}
