
// src/lib/database/mysql.adapter.ts
import type { DatabaseAdapter, Auction, Lot, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, MediaItem, PlatformSettings, StateInfo, CityInfo, JudicialProcess, Court, JudicialDistrict, JudicialBranch, Bem, DirectSaleOffer, DocumentTemplate, ContactMessage, UserDocument, UserWin, BidInfo } from '@/types';
import mysql from 'mysql2/promise';
import { samplePlatformSettings } from '@/lib/sample-data';

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
            this.pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10 });
            console.log('[MySqlAdapter] Pool de conexões MySQL inicializado.');
        } catch (error: any) {
            this.connectionError = `Falha ao criar o pool de conexões MySQL: ${error.message}`;
            console.warn(`[MySqlAdapter] AVISO: ${this.connectionError}`);
            this.pool = null;
        }
    }
    
    private async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
        if (this.connectionError || !this.pool) return [];
        let connection;
        try {
            connection = await this.pool.getConnection();
            const [rows] = await connection.execute(sql, params);
            return rows as any[];
        } catch (error: any) {
             console.error(`[MySqlAdapter] Erro na query: "${sql.substring(0, 100)}...". Erro: ${error.message}`);
             return [];
        } finally {
            if (connection) connection.release();
        }
    }
    
    private async executeQueryForSingle(sql: string, params: any[] = []): Promise<any | null> {
        const rows = await this.executeQuery(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }

    private async executeMutation(sql: string, params: any[] = []): Promise<{ success: boolean; message: string; insertId?: number }> {
        if (this.connectionError || !this.pool) return { success: false, message: 'Sem conexão com o banco de dados.' };
        let connection;
        try {
            connection = await this.pool.getConnection();
            const [result] = await connection.execute(sql, params) as [mysql.ResultSetHeader, any];
            return { success: true, message: 'Operação realizada com sucesso.', insertId: result.insertId };
        } catch (error: any) {
            console.error(`[MySqlAdapter] Erro na mutação: "${sql.substring(0, 100)}...". Erro: ${error.message}`);
            return { success: false, message: `Erro no banco de dados: ${error.message}` };
        } finally {
            if (connection) connection.release();
        }
    }
    
    // Implementações completas dos métodos de leitura
    async getLots(auctionId?: string): Promise<Lot[]> { return this.executeQuery('SELECT * FROM `lots`' + (auctionId ? ' WHERE `auction_id` = ?' : ''), auctionId ? [auctionId] : []); }
    async getLot(id: string): Promise<Lot | null> { return this.executeQueryForSingle('SELECT * FROM `lots` WHERE `id` = ? OR `public_id` = ?', [id, id]); }
    async getLotsByIds(ids: string[]): Promise<Lot[]> { if (ids.length === 0) return []; return this.executeQuery(`SELECT * FROM \`lots\` WHERE \`id\` IN (?)`, [ids]); }
    async getAuctions(): Promise<Auction[]> { return this.executeQuery('SELECT * FROM `auctions` ORDER BY `auction_date` DESC'); }
    async getAuction(id: string): Promise<Auction | null> { return this.executeQueryForSingle('SELECT * FROM `auctions` WHERE `id` = ? OR `public_id` = ?', [id, id]); }
    async getStates(): Promise<StateInfo[]> { return this.executeQuery('SELECT * FROM `states` ORDER BY `name`'); }
    async getCities(stateId?: string): Promise<CityInfo[]> { return this.executeQuery('SELECT * FROM `cities`' + (stateId ? ' WHERE `state_id` = ?' : '') + ' ORDER BY `name`', stateId ? [stateId] : []); }
    async getLotCategories(): Promise<LotCategory[]> { return this.executeQuery('SELECT * FROM `lot_categories` ORDER BY `name`'); }
    async getSellers(): Promise<SellerProfileInfo[]> { return this.executeQuery('SELECT * FROM `sellers` ORDER BY `name`'); }
    async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { return this.executeQuery('SELECT * FROM `auctioneers` ORDER BY `name`'); }
    async getUsersWithRoles(): Promise<UserProfileData[]> { return this.executeQuery('SELECT u.*, r.name as roleName, r.permissions FROM `users` u LEFT JOIN `roles` r ON u.role_id = r.id'); }
    async getUserProfileData(userId: string): Promise<UserProfileData | null> { return this.executeQueryForSingle('SELECT u.*, r.name as roleName, r.permissions FROM `users` u LEFT JOIN `roles` r ON u.role_id = r.id WHERE u.id = ? OR u.uid = ?', [userId, userId]); }
    async getRoles(): Promise<Role[]> { return this.executeQuery('SELECT * FROM `roles` ORDER BY `name`'); }
    async getMediaItems(): Promise<MediaItem[]> { return this.executeQuery('SELECT * FROM `media_items` ORDER BY `uploaded_at` DESC'); }
    async getPlatformSettings(): Promise<PlatformSettings | null> { const settings = await this.executeQueryForSingle('SELECT settings_data FROM `platform_settings` WHERE id = ?', ['global']); return settings ? JSON.parse(settings.settings_data) : samplePlatformSettings as PlatformSettings; }
    async getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<any[]> { return this.executeQuery('SELECT * FROM `subcategories` WHERE `parent_category_id` = ? ORDER BY `display_order`', [parentCategoryId]); }
    async getSubcategoryByIdAction(subcategoryId: string): Promise<any | null> { return this.executeQueryForSingle('SELECT * FROM `subcategories` WHERE id = ?', [subcategoryId]); }
    async getBens(filter?: { judicialProcessId?: string; sellerId?: string; }): Promise<Bem[]> { let q = 'SELECT * FROM `bens`'; const p = []; const w = []; if (filter?.judicialProcessId) { w.push('`judicial_process_id` = ?'); p.push(filter.judicialProcessId); } if (filter?.sellerId) { w.push('`seller_id` = ?'); p.push(filter.sellerId); } if (w.length) q += ' WHERE ' + w.join(' AND '); return this.executeQuery(q, p); }
    async getCourts(): Promise<Court[]> { return this.executeQuery('SELECT * FROM `courts` ORDER BY `name`'); }
    async getJudicialDistricts(): Promise<JudicialDistrict[]> { return this.executeQuery('SELECT * FROM `judicial_districts` ORDER BY `name`'); }
    async getJudicialBranches(): Promise<JudicialBranch[]> { return this.executeQuery('SELECT * FROM `judicial_branches` ORDER BY `name`'); }
    async getJudicialProcesses(): Promise<JudicialProcess[]> { return this.executeQuery('SELECT * FROM `judicial_processes`'); }
    async getDirectSaleOffers(): Promise<DirectSaleOffer[]> { return this.executeQuery('SELECT * FROM `direct_sale_offers`'); }
    async getDocumentTemplates(): Promise<DocumentTemplate[]> { return this.executeQuery('SELECT * FROM `document_templates`'); }
    async getContactMessages(): Promise<ContactMessage[]> { return this.executeQuery('SELECT * FROM `contact_messages` ORDER BY `created_at` DESC'); }
    async getUserDocuments(userId: string): Promise<UserDocument[]> { return this.executeQuery('SELECT * FROM `user_documents` WHERE `user_id` = ?', [userId]); }
    async getHabilitationRequests(): Promise<UserProfileData[]> { return this.executeQuery("SELECT * FROM `users` WHERE `habilitation_status` IN ('PENDING_ANALYSIS', 'PENDING_DOCUMENTS', 'REJECTED_DOCUMENTS')"); }
    async getUserWins(userId: string): Promise<UserWin[]> { return this.executeQuery('SELECT w.*, l.title as lotTitle, l.number as lotNumber FROM `user_wins` w JOIN `lots` l ON w.lot_id = l.id WHERE w.user_id = ?', [userId]); }
    async getUserBids(userId: string): Promise<any[]> { return this._notImplemented('getUserBids'); }
    async getFinancialDataForConsignor(sellerId: string): Promise<any[]> { return this._notImplemented('getFinancialDataForConsignor'); }
    async getLotsForConsignorAction(sellerId: string): Promise<any[]> { return this._notImplemented('getLotsForConsignorAction'); }

    // Implementações de escrita
    async createAuction(data: Partial<Auction>): Promise<{ success: boolean; message: string; auctionId?: string; }> {
        const sql = 'INSERT INTO `auctions` (`title`, `description`, `status`, `auction_date`, `auctioneer_id`, `seller_id`) VALUES (?, ?, ?, ?, ?, ?)';
        const result = await this.executeMutation(sql, [data.title, data.description, data.status, data.auctionDate, data.auctioneerId, data.sellerId]);
        return { ...result, auctionId: result.insertId?.toString() };
    }

    async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
        // Primeiro, verificar se existem lotes associados
        const lots = await this.getLots(id);
        if (lots.length > 0) {
            return { success: false, message: `Não é possível excluir. Este leilão tem ${lots.length} lote(s) associado(s).` };
        }
        return this.executeMutation('DELETE FROM `auctions` WHERE id = ?', [id]);
    }
    
    // Métodos _notImplemented
    async _notImplemented(method: string): Promise<any> { if (this.connectionError) return Promise.resolve(method.endsWith('s') ? [] : null); const message = `[MySqlAdapter] Método ${method} não implementado.`; console.warn(message); return Promise.resolve(method.endsWith('s') ? [] : null); }
    createLot(lotData: any): Promise<{ success: boolean; message: string; lotId?: string; }> { return this._notImplemented('createLot'); }
    updateLot(id: string, updates: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateLot'); }
    updateAuction(id: string, updates: Partial<Auction>): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateAuction'); }
    updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updateUserRole'); }
    createMediaItem(item: any, url: string, userId: string): Promise<any> { return this._notImplemented('createMediaItem'); }
    updatePlatformSettings(data: any): Promise<{ success: boolean; message: string; }> { return this._notImplemented('updatePlatformSettings'); }
}
