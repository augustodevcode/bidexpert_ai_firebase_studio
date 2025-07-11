// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction } from '@/types';
import mysql from 'mysql2/promise';

export class MySqlAdapter implements DatabaseAdapter {
    private pool: mysql.Pool | null = null;
    private connectionError: string | null = null;

    constructor() {
        if (!process.env.MYSQL_DATABASE_URL) {
            this.connectionError = "A variável de ambiente MYSQL_DATABASE_URL não está definida.";
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError} Usando dados vazios.`);
            return;
        }
        try {
            this.pool = mysql.createPool(process.env.MYSQL_DATABASE_URL);
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
        // Return an empty array for methods that fetch lists, null for single items
        return Promise.resolve(method.endsWith('s') ? [] : null);
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

    async getAuction(id: string): Promise<Auction | null> {
        if (!this.pool) return null;
        const connection = await this.getConnection();
        try {
            const [auctionRows]: [any[], any] = await connection.execute('SELECT * FROM auctions WHERE id = ?', [id]);
            if (auctionRows.length === 0) {
                return null;
            }
            const auction = auctionRows[0] as Auction;

            // Fetch lots for this auction
            auction.lots = await this.getLots(auction.id);
            auction.totalLots = auction.lots.length;

            return auction;
        } catch (error: any) {
            console.error(`[MySqlAdapter:getAuction] Error fetching auction ${id}: ${error.message}`);
            return null;
        } finally {
            connection.release();
        }
    }

    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        return this._notImplemented('createAuction');
    }

    async updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> {
       if (!this.pool) {
            return { success: false, message: "Conexão com o banco de dados não disponível." };
       }
       // Basic implementation - this should be more robust in a real app
       const connection = await this.getConnection();
       try {
            // Build the SET part of the query dynamically
            const fields = Object.keys(updates);
            if (fields.length === 0) {
                return { success: true, message: "Nenhuma alteração para salvar." };
            }
            const setClauses = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => (updates as any)[field]);

            const sql = `UPDATE auctions SET ${setClauses} WHERE id = ?`;
            values.push(id);

            const [result]: [mysql.OkPacket, any] = await connection.execute(sql, values);

            if (result.affectedRows > 0) {
                return { success: true, message: "Leilão atualizado com sucesso." };
            } else {
                return { success: false, message: "Leilão não encontrado ou nenhuma alteração foi feita." };
            }
       } catch (error: any) {
           console.error(`[MySqlAdapter:updateAuction] Error updating auction ${id}: ${error.message}`);
           return { success: false, message: `Erro ao atualizar leilão: ${error.message}` };
       } finally {
           connection.release();
       }
    }

    async deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
        return this._notImplemented('deleteAuction');
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
