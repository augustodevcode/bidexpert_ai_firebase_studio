
// src/lib/database/mysql.adapter.ts
import mysql, { type RowDataPacket } from 'mysql2/promise';
import type { 
  IDatabaseAdapter, 
  LotCategory, StateInfo, StateFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData,
  Lot, LotFormData,
  BidInfo,
  UserProfileData, EditableUserProfileData,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData,
  UserFormValues
} from '@/types';
import { slugify } from '@/lib/sample-data';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';

let pool: mysql.Pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.MYSQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('MYSQL_CONNECTION_STRING não está definida nas variáveis de ambiente.');
    }
    try {
      const url = new URL(connectionString);
      pool = mysql.createPool({
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('[MySqlAdapter] Pool de conexões MySQL inicializado.');
    } catch (e) {
      console.error("[MySqlAdapter] Erro ao parsear MYSQL_CONNECTION_STRING ou criar pool:", e);
      throw new Error('Formato inválido para MYSQL_CONNECTION_STRING ou falha ao criar pool.');
    }
  }
  return pool;
}

function mapRowToLotCategory(row: RowDataPacket): LotCategory {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    itemCount: Number(row.item_count || 0),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class MySqlAdapter implements IDatabaseAdapter {
  constructor() {
    getPool();
  }

  // --- Categories ---
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
     if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name.trim());
      const queryText = `
        INSERT INTO lot_categories (name, slug, description, item_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW());
      `;
      const values = [data.name.trim(), slug, data.description?.trim() || null, 0];
      const [result] = await connection.execute(queryText, values);
      const insertId = (result as mysql.ResultSetHeader).insertId;
      return { success: true, message: 'Categoria criada com sucesso (MySQL)!', categoryId: String(insertId) };
    } catch (error: any) {
      console.error("[MySqlAdapter - createLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao criar categoria (MySQL).' };
    } finally {
      connection.release();
    }
  }

  async getLotCategories(): Promise<LotCategory[]> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT id, name, slug, description, item_count, created_at, updated_at FROM lot_categories ORDER BY name ASC;');
      return (rows as RowDataPacket[]).map(mapRowToLotCategory);
    } catch (error: any) {
      console.error("[MySqlAdapter - getLotCategories] Error:", error);
      return [];
    } finally {
      connection.release();
    }
  }
  
  async getLotCategory(id: string): Promise<LotCategory | null> {
    const connection = await getPool().getConnection();
    try {
        const queryText = 'SELECT id, name, slug, description, item_count, created_at, updated_at FROM lot_categories WHERE id = ?;';
        const [rows] = await connection.query(queryText, [Number(id)]);
        if ((rows as RowDataPacket[]).length > 0) {
            return mapRowToLotCategory((rows as RowDataPacket[])[0]);
        }
        return null;
    } catch (error: any) {
        console.error(`[MySqlAdapter - getLotCategory with ID ${id}] Error:`, error);
        return null;
    } finally {
        connection.release();
    }
  }

  async updateLotCategory(id: string, data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; }> {
     if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name.trim());
      const queryText = `
        UPDATE lot_categories
        SET name = ?, slug = ?, description = ?, updated_at = NOW()
        WHERE id = ?;
      `;
      const values = [data.name.trim(), slug, data.description?.trim() || null, Number(id)];
      await connection.execute(queryText, values);
      return { success: true, message: 'Categoria atualizada com sucesso (MySQL)!' };
    } catch (error: any) {
      console.error("[MySqlAdapter - updateLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao atualizar categoria (MySQL).' };
    } finally {
      connection.release();
    }
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.query('DELETE FROM lot_categories WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Categoria excluída com sucesso (MySQL)!' };
    } catch (error: any) {
      console.error("[MySqlAdapter - deleteLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao excluir categoria (MySQL).' };
    } finally {
      connection.release();
    }
  }
  
  // --- States (Scaffold) ---
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { console.warn("MySqlAdapter.createState not implemented."); return {success: false, message: "Not implemented"}; }
  async getStates(): Promise<StateInfo[]> { console.warn("MySqlAdapter.getStates not implemented."); return []; }
  async getState(id: string): Promise<StateInfo | null> { console.warn("MySqlAdapter.getState not implemented."); return null; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateState not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteState not implemented."); return {success: false, message: "Not implemented"}; }

  // --- Cities (Scaffold) ---
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { console.warn("MySqlAdapter.createCity not implemented."); return {success: false, message: "Not implemented"}; }
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> { console.warn("MySqlAdapter.getCities not implemented."); return []; }
  async getCity(id: string): Promise<CityInfo | null> { console.warn("MySqlAdapter.getCity not implemented."); return null; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateCity not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteCity not implemented."); return {success: false, message: "Not implemented"}; }
  
  // Implement other methods from IDatabaseAdapter similarly
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { console.warn("MySqlAdapter.getAuctioneers not implemented."); return []; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { console.warn("MySqlAdapter.createAuctioneer not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { console.warn("MySqlAdapter.getAuctioneer not implemented."); return null; }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> { console.warn("MySqlAdapter.getAuctioneerBySlug not implemented."); return null; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateAuctioneer not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteAuctioneer not implemented."); return {success: false, message: "Not implemented"}; }

  async getSellers(): Promise<SellerProfileInfo[]> { console.warn("MySqlAdapter.getSellers not implemented."); return []; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> { console.warn("MySqlAdapter.createSeller not implemented."); return {success: false, message: "Not implemented"}; }
  async getSeller(id: string): Promise<SellerProfileInfo | null> { console.warn("MySqlAdapter.getSeller not implemented."); return null; }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> { console.warn("MySqlAdapter.getSellerBySlug not implemented."); return null; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateSeller not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteSeller not implemented."); return {success: false, message: "Not implemented"}; }

  async getAuctions(): Promise<Auction[]> { console.warn("MySqlAdapter.getAuctions not implemented."); return []; }
  async createAuction(data: AuctionFormData): Promise<{ success: boolean; message: string; auctionId?: string; }> { console.warn("MySqlAdapter.createAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuction(id: string): Promise<Auction | null> { console.warn("MySqlAdapter.getAuction not implemented."); return null; }
  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> { console.warn("MySqlAdapter.getAuctionsBySellerSlug not implemented."); return [];}
  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteAuction not implemented."); return {success: false, message: "Not implemented"}; }

  async getLots(auctionIdParam?: string): Promise<Lot[]> { console.warn("MySqlAdapter.getLots not implemented."); return []; }
  async createLot(data: LotFormData): Promise<{ success: boolean; message: string; lotId?: string; }> { console.warn("MySqlAdapter.createLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getLot(id: string): Promise<Lot | null> { console.warn("MySqlAdapter.getLot not implemented."); return null; }
  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateLot not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { console.warn("MySqlAdapter.getBidsForLot not implemented."); return []; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> { console.warn("MySqlAdapter.placeBidOnLot not implemented."); return {success: false, message: "Not implemented"}; }
  
  async getUserProfileData(userId: string): Promise<UserProfileData | null> { console.warn("MySqlAdapter.getUserProfileData not implemented."); return null; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateUserProfile not implemented."); return {success: false, message: "Not implemented"}; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> { console.warn("MySqlAdapter.ensureUserRole not implemented."); return {success: false, message: "Not implemented"}; }
  async getUsersWithRoles(): Promise<UserProfileData[]> { console.warn("MySqlAdapter.getUsersWithRoles not implemented."); return []; }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateUserRole not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteUserProfile not implemented."); return {success: false, message: "Not implemented"}; }

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { console.warn("MySqlAdapter.createRole not implemented."); return {success: false, message: "Not implemented"}; }
  async getRoles(): Promise<Role[]> { console.warn("MySqlAdapter.getRoles not implemented."); return []; }
  async getRole(id: string): Promise<Role | null> { console.warn("MySqlAdapter.getRole not implemented."); return null; }
  async getRoleByName(name: string): Promise<Role | null> { console.warn("MySqlAdapter.getRoleByName not implemented."); return null; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateRole not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteRole not implemented."); return {success: false, message: "Not implemented"}; }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.ensureDefaultRolesExist not implemented."); return {success: false, message: "Not implemented"}; }

  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { console.warn("MySqlAdapter.createMediaItem not implemented."); return {success: false, message: "Not implemented"}; }
  async getMediaItems(): Promise<MediaItem[]> { console.warn("MySqlAdapter.getMediaItems not implemented."); return []; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateMediaItemMetadata not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteMediaItemFromDb not implemented."); return {success: false, message: "Not implemented"}; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.linkMediaItemsToLot not implemented."); return {success: false, message: "Not implemented"}; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.unlinkMediaItemFromLot not implemented."); return {success: false, message: "Not implemented"}; }

  async getPlatformSettings(): Promise<PlatformSettings> { console.warn("MySqlAdapter.getPlatformSettings not implemented."); return { id: 'global', galleryImageBasePath: '/mysql/default/path/', updatedAt: new Date() };}
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updatePlatformSettings not implemented."); return {success: false, message: "Not implemented"}; }

}
