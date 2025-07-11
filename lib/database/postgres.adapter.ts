
// src/lib/database/postgres.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo } from '@/types';
import { Pool } from 'pg';
import { samplePlatformSettings } from '@/lib/sample-data';

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
    
    private async executeQuery(query: string, params: any[] = []): Promise<any[]> {
        if (this.connectionError || !this.pool) return [];
        const client = await this.pool.connect();
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

    private async executeMutation(sql: string, params: any[] = []): Promise<{ success: boolean; message: string; insertId?: number }> {
        if (this.connectionError || !this.pool) return { success: false, message: 'Sem conexão com o banco de dados.' };
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return { success: true, message: 'Operação realizada com sucesso.', insertId: result.rows[0]?.id };
        } catch (error: any) {
            console.error(`[PostgresAdapter] Erro na mutação: "${sql.substring(0, 100)}...". Erro: ${error.message}`);
            return { success: false, message: `Erro no banco de dados: ${error.message}` };
        } finally {
            client.release();
        }
    }
    
    // Implementações de leitura
    async getLots(auctionId?: string): Promise<Lot[]> { return this.executeQuery('SELECT * FROM "lots"' + (auctionId ? ' WHERE "auction_id" = $1' : ''), auctionId ? [auctionId] : []); }
    async getLot(id: string): Promise<Lot | null> { return this.executeQueryForSingle('SELECT * FROM "lots" WHERE "id" = $1 OR "public_id" = $1', [id]); }
    async getLotsByIds(ids: string[]): Promise<Lot[]> { if (ids.length === 0) return []; return this.executeQuery('SELECT * FROM "lots" WHERE "id" = ANY($1::text[])', [ids]); }
    async getAuctions(): Promise<Auction[]> { return this.executeQuery('SELECT * FROM "auctions" ORDER BY "auction_date" DESC'); }
    async getAuction(id: string): Promise<Auction | null> { return this.executeQueryForSingle('SELECT * FROM "auctions" WHERE "id" = $1 OR "public_id" = $1', [id]); }
    async getStates(): Promise<StateInfo[]> { return this.executeQuery('SELECT * FROM "states" ORDER BY "name"'); }
    async getCities(stateId?: string): Promise<CityInfo[]> { return this.executeQuery('SELECT * FROM "cities"' + (stateId ? ' WHERE "state_id" = $1' : '') + ' ORDER BY "name"', stateId ? [stateId] : []); }
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM "lot_categories" ORDER BY "name"'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM "sellers" ORDER BY "name"'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM "auctioneers" ORDER BY "name"'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> { return this.executeQuery('SELECT u.*, r.name as "roleName", r.permissions FROM "users" u LEFT JOIN "roles" r ON u.role_id = r.id'); }
    async getUserProfileData(userId: string): Promise<UserProfileData | null> { return this.executeQueryForSingle('SELECT u.*, r.name as "roleName", r.permissions FROM "users" u LEFT JOIN "roles" r ON u.role_id = r.id WHERE u.id = $1 OR u.uid = $1', [userId]); }
    async getRoles(): Promise<Role[]> { return this.executeQuery('SELECT * FROM "roles" ORDER BY "name"'); }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM "media_items" ORDER BY "uploaded_at" DESC'); }
    async getPlatformSettings(): Promise<PlatformSettings | null> {
        const settings = await this.executeQueryForSingle('SELECT settings_data FROM "platform_settings" WHERE id = $1', ['global']);
        if (!settings) {
            console.warn("[PostgresAdapter] Configurações da plataforma não encontradas no DB. Retornando dados de exemplo.");
            return samplePlatformSettings as PlatformSettings;
        }
        return settings.settings_data; // A coluna contém o JSON
    }
    async getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<any[]> { return this.executeQuery('SELECT * FROM "subcategories" WHERE "parent_category_id" = $1 ORDER BY "display_order"', [parentCategoryId]); }
    async getSubcategoryByIdAction(subcategoryId: string): Promise<any | null> { return this.executeQueryForSingle('SELECT * FROM "subcategories" WHERE id = $1', [subcategoryId]); }

    // Métodos não implementados
    async _notImplemented(method: string): Promise<any> { if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null); const message = `[PostgresAdapter] Método ${method} não implementado.`; console.warn(message); return Promise.resolve(method.endsWith('s') ? [] : null); }
    createLot(lotData: any): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    deleteLot(id: string): Promise<{ success: boolean; message: string; }> { return this._notImplemented('deleteLot'); }
    
    async createAuction(auctionData: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        const sql = 'INSERT INTO "auctions" ("title", "description", "status", "auction_date", "auctioneer_id", "seller_id") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        const result = await this.executeMutation(sql, [auctionData.title, auctionData.description, auctionData.status, auctionData.auctionDate, auctionData.auctioneerId, auctionData.sellerId]);
        return { ...result, auctionId: result.insertId?.toString() };
    }
    
    async deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
        const lots = await this.getLots(id);
        if (lots.length > 0) {
            return { success: false, message: `Não é possível excluir. Este leilão tem ${lots.length} lote(s) associado(s).` };
        }
        return this.executeMutation('DELETE FROM "auctions" WHERE id = $1', [id]);
    }
    
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    createMediaItem(item: any, url: string, userId: string): Promise<any> { return this._notImplemented('createMediaItem'); }
    updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}
