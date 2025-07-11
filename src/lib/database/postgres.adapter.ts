// src/lib/database/postgres.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo } from '@/types';
import { Pool } from 'pg';

export class PostgresAdapter implements DatabaseAdapter {
    private pool: Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        if (!process.env.DATABASE_URL) {
            this.connectionError = "A variável de ambiente DATABASE_URL não está definida.";
            console.warn(`[PostgresAdapter] AVISO: ${this.connectionError} Usando dados vazios.`);
            return;
        }
        try {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
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
             return [];
        } finally {
            client.release();
        }
    }
    
    private async executeQueryForSingle(query: string, params: any[] = []): Promise<any | null> {
        const rows = await this.executeQuery(query, params);
        return rows.length > 0 ? rows[0] : null;
    }
    
    async getLots(auctionId?: string): Promise<Lot[]> {
        let query = 'SELECT * FROM "Lot"';
        const params = [];
        if (auctionId) {
            query += ' WHERE "auctionId" = $1';
            params.push(auctionId);
        }
        return this.executeQuery(query, params);
    }
    
    async getLot(id: string): Promise<Lot | null> {
        return this.executeQueryForSingle('SELECT * FROM "Lot" WHERE "id" = $1', [id]);
    }
    
    async getLotsByIds(ids: string[]): Promise<Lot[]> {
        if (ids.length === 0) return Promise.resolve([]);
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const sql = `SELECT * FROM "Lot" WHERE "id" IN (${placeholders})`;
        return this.executeQuery(sql, ids);
    }

    async getAuctions(): Promise<Auction[]> {
        const auctions = await this.executeQuery('SELECT * FROM "Auction" ORDER BY "auctionDate" DESC');
        for (const auction of auctions) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
        }
        return auctions;
    }
    
    async getAuction(id: string): Promise<Auction | null> {
        const auction = await this.executeQueryForSingle('SELECT * FROM "Auction" WHERE id = $1', [id]);
        if (auction) {
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
        }
        return auction;
    }
    
    async getStates(): Promise<StateInfo[]> { return this.executeQuery('SELECT * FROM "State" ORDER BY "name"'); }
    async getCities(): Promise<CityInfo[]> { return this.executeQuery('SELECT * FROM "City" ORDER BY "name"'); }
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM "LotCategory" ORDER BY "name"'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM "Seller" ORDER BY "name"'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM "Auctioneer" ORDER BY "name"'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> { 
        const sql = `
            SELECT u.*, r.name as "roleName", r.permissions 
            FROM "User" u 
            LEFT JOIN "Role" r ON u."roleId" = r.id
        `;
        return this.executeQuery(sql);
    }
    async getUserProfileData(userId: string): Promise<UserProfileData | null> {
         const sql = `
            SELECT u.*, r.name as "roleName", r.permissions 
            FROM "User" u 
            LEFT JOIN "Role" r ON u."roleId" = r.id 
            WHERE u.id = $1
        `;
        return this.executeQueryForSingle(sql, [userId]);
    }
    async getRoles(): Promise<Role[]> { return this.executeQuery('SELECT * FROM "Role" ORDER BY "name"'); }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM "MediaItem" ORDER BY "uploadedAt" DESC'); }
    async getPlatformSettings(): Promise<PlatformSettings | null> { return this.executeQueryForSingle('SELECT * FROM "PlatformSettings" WHERE id = $1', ['global']); }


    async _notImplemented(method: string): Promise<any> {
        if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null);
        const message = `[PostgresAdapter] Método ${method} não implementado.`;
        console.warn(message);
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }

    createLot(lotData: any): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> { return this._notImplemented('createAuction'); }
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    deleteAuction(id: string): Promise<{ success: boolean, message: string }> { return this._notImplemented('deleteAuction'); }
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    createMediaItem(item: any, url: string, userId: string): Promise<any> { return this._notImplemented('createMediaItem'); }
    updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}
