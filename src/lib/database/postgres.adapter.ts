// src/lib/database/postgres.adapter.ts
import type { DatabaseAdapter, Auction } from '@/types';
import { Pool } from 'pg';

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
    
    async _notImplemented(method: string): Promise<any> {
        if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null);
        const message = `[PostgresAdapter] Método ${method} não implementado.`;
        console.warn(message);
        // Return an empty array for methods that fetch lists, null for single items
        return Promise.resolve(method.endsWith('s') ? [] : null);
    }
    
    async getLots(auctionId?: string): Promise<any[]> {
        if (!this.pool) return [];
        const client = await this.getClient();
        try {
            let query = 'SELECT * FROM "Lot"'; // Note as aspas duplas para nomes de tabelas/colunas em maiúsculas
            const params = [];
            if (auctionId) {
                query += ' WHERE "auctionId" = $1';
                params.push(auctionId);
            }
            const res = await client.query(query, params);
            return res.rows;
        } catch (error: any) {
             console.error(`[PostgresAdapter:getLots] Error: ${error.message}`);
             return [];
        } finally {
            client.release();
        }
    }
    
    async getAuctions(): Promise<Auction[]> {
        if (!this.pool) return [];
        const client = await this.getClient();
        try {
            const res = await client.query('SELECT * FROM "Auction" ORDER BY "auctionDate" DESC');
            return res.rows as Auction[];
        } catch (error: any) {
             console.error(`[PostgresAdapter:getAuctions] Error: ${error.message}`);
             return [];
        } finally {
            client.release();
        }
    }
    
    async getAuction(id: string): Promise<Auction | null> {
        if (!this.pool) return null;
        const client = await this.getClient();
        try {
            const res = await client.query('SELECT * FROM "Auction" WHERE id = $1', [id]);
            if (res.rows.length === 0) {
                return null;
            }
            const auction = res.rows[0] as Auction;

            // Fetch lots for this auction
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;
            
            return auction;
        } catch (error: any) {
            console.error(`[PostgresAdapter:getAuction] Error fetching auction ${id}: ${error.message}`);
            return null;
        } finally {
            client.release();
        }
    }
    
    getLot(id: string): Promise<any | null> { return this._notImplemented('getLot'); }
    createLot(lotData: any): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    getLotsByIds(ids: string[]): Promise<any[]> { return this._notImplemented('getLotsByIds'); }
    getLotCategories(): Promise<any[]> { return this._notImplemented('getLotCategories'); }
    getSellers(): Promise<any[]> { return this._notImplemented('getSellers'); }
    getAuctioneers(): Promise<any[]> { return this._notImplemented('getAuctioneers'); }
    getUsersWithRoles(): Promise<any[]> { return this._notImplemented('getUsersWithRoles'); }
    getUserProfileData(userId: string): Promise<any | null> { return this._notImplemented('getUserProfileData'); }
    getRoles(): Promise<any[]> { return this._notImplemented('getRoles'); }
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    getMediaItems(): Promise<any[]> { return this._notImplemented('getMediaItems'); }
    createMediaItem(item: any, url: string, userId: string): Promise<any> { return this._notImplemented('createMediaItem'); }
    getPlatformSettings(): Promise<any | null> { return this._notImplemented('getPlatformSettings'); }
    updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}
