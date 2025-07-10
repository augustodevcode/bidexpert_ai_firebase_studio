// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction } from '@/types';
import mysql from 'mysql2/promise';

export class MySqlAdapter implements DatabaseAdapter {
    private pool: mysql.Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        if (!process.env.MYSQL_DATABASE_URL) {
            this.connectionError = "A variável de ambiente MYSQL_DATABASE_URL não está definida.";
            console.error(`[MySqlAdapter] ERRO: ${this.connectionError}`);
            return;
        }
        try {
            this.pool = mysql.createPool(process.env.MYSQL_DATABASE_URL);
            console.log('[MySqlAdapter] Pool de conexões MySQL inicializado.');
        } catch (error: any) {
            this.connectionError = `Falha ao criar o pool de conexões MySQL: ${error.message}`;
            console.error(`[MySqlAdapter] ERRO: ${this.connectionError}`);
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
        if (this.connectionError) return Promise.resolve([]); // Return empty data if connection failed
        const message = `[MySqlAdapter] Método ${method} não implementado.`;
        console.warn(message);
        return Promise.resolve([]);
    }

    async getLots(auctionId?: string): Promise<any[]> {
        if (!this.pool) return [];
        const connection = await this.getConnection();
        try {
            let sql = 'SELECT * FROM lots';
            const params = [];
            if (auctionId) {
                sql += ' WHERE auction_id = ?';
                params.push(auctionId);
            }
            const [rows] = await connection.execute(sql, params);
            return rows as any[];
        } catch (error: any) {
             console.error(`[MySqlAdapter:getLots] Error: ${error.message}`);
             return [];
        } finally {
            connection.release();
        }
    }
    
    async getAuctions(): Promise<Auction[]> {
        if (!this.pool) return [];
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM auctions ORDER BY auctionDate DESC');
            return rows as Auction[];
        } catch (error: any) {
             console.error(`[MySqlAdapter:getAuctions] Error: ${error.message}`);
             return [];
        } finally {
            connection.release();
        }
    }
    
    getLot(id: string): Promise<any | null> { return this._notImplemented('getLot'); }
    createLot(lotData: any): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    getAuction(id: string): Promise<any | null> { return this._notImplemented('getAuction'); }
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
