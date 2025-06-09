
// src/lib/database/postgres.adapter.ts
import { Pool, type QueryResultRow } from 'pg';
import type { 
  IDatabaseAdapter, 
  LotCategory,
  StateInfo, StateFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData,
  Lot, LotFormData,
  BidInfo,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData
} from '@/types';
import { slugify } from '@/lib/sample-data';

let pool: Pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('POSTGRES_CONNECTION_STRING não está definida nas variáveis de ambiente.');
    }
    pool = new Pool({ connectionString });
    console.log('[PostgresAdapter] Pool de conexões PostgreSQL inicializado.');
  }
  return pool;
}

// Helper para converter linha do PG para o tipo esperado, tratando datas
function mapRowToLotCategory(row: QueryResultRow): LotCategory {
  return {
    id: String(row.id), // Assumindo que o ID no PG é serial/integer
    name: row.name,
    slug: row.slug,
    description: row.description,
    itemCount: Number(row.item_count || 0),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}


export class PostgresAdapter implements IDatabaseAdapter {
  constructor() {
    getPool(); // Garante que o pool seja inicializado
  }

  // --- Categories ---
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name.trim());
      const queryText = `
        INSERT INTO lot_categories (name, slug, description, item_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id;
      `;
      const values = [data.name.trim(), slug, data.description?.trim() || null, 0];
      const res = await client.query(queryText, values);
      const categoryId = res.rows[0]?.id;
      return { success: true, message: 'Categoria criada com sucesso!', categoryId: String(categoryId) };
    } catch (error: any) {
      console.error("[PostgresAdapter - createLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao criar categoria.' };
    } finally {
      client.release();
    }
  }

  async getLotCategories(): Promise<LotCategory[]> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT id, name, slug, description, item_count, created_at, updated_at FROM lot_categories ORDER BY name ASC;');
      return res.rows.map(mapRowToLotCategory);
    } catch (error: any) {
      console.error("[PostgresAdapter - getLotCategories] Error:", error);
      return [];
    } finally {
      client.release();
    }
  }
  
  async getLotCategory(id: string): Promise<LotCategory | null> {
    const client = await getPool().connect();
    try {
        const queryText = 'SELECT id, name, slug, description, item_count, created_at, updated_at FROM lot_categories WHERE id = $1;';
        const res = await client.query(queryText, [Number(id)]); // Assumindo ID numérico
        if (res.rows.length > 0) {
            return mapRowToLotCategory(res.rows[0]);
        }
        return null;
    } catch (error: any) {
        console.error(`[PostgresAdapter - getLotCategory with ID ${id}] Error:`, error);
        return null;
    } finally {
        client.release();
    }
  }

  async updateLotCategory(id: string, data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name.trim());
      const queryText = `
        UPDATE lot_categories
        SET name = $1, slug = $2, description = $3, updated_at = NOW()
        WHERE id = $4;
      `;
      const values = [data.name.trim(), slug, data.description?.trim() || null, Number(id)];
      await client.query(queryText, values);
      return { success: true, message: 'Categoria atualizada com sucesso!' };
    } catch (error: any) {
      console.error("[PostgresAdapter - updateLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao atualizar categoria.' };
    } finally {
      client.release();
    }
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM lot_categories WHERE id = $1;', [Number(id)]);
      return { success: true, message: 'Categoria excluída com sucesso!' };
    } catch (error: any) {
      console.error("[PostgresAdapter - deleteLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao excluir categoria.' };
    } finally {
      client.release();
    }
  }

  // --- States (Scaffold) ---
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { console.warn("PostgresAdapter.createState not implemented."); return {success: false, message: "Not implemented"}; }
  async getStates(): Promise<StateInfo[]> { console.warn("PostgresAdapter.getStates not implemented."); return []; }
  async getState(id: string): Promise<StateInfo | null> { console.warn("PostgresAdapter.getState not implemented."); return null; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateState not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteState not implemented."); return {success: false, message: "Not implemented"}; }

  // --- Cities (Scaffold) ---
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { console.warn("PostgresAdapter.createCity not implemented."); return {success: false, message: "Not implemented"}; }
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> { console.warn("PostgresAdapter.getCities not implemented."); return []; }
  async getCity(id: string): Promise<CityInfo | null> { console.warn("PostgresAdapter.getCity not implemented."); return null; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateCity not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteCity not implemented."); return {success: false, message: "Not implemented"}; }

  // Implement other methods from IDatabaseAdapter similarly
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { console.warn("PostgresAdapter.getAuctioneers not implemented."); return []; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> { console.warn("PostgresAdapter.createAuctioneer not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> { console.warn("PostgresAdapter.getAuctioneer not implemented."); return null; }
  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateAuctioneer not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteAuctioneer not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> { console.warn("PostgresAdapter.getAuctioneerBySlug not implemented."); return null; }


  async getSellers(): Promise<SellerProfileInfo[]> { console.warn("PostgresAdapter.getSellers not implemented."); return []; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> { console.warn("PostgresAdapter.createSeller not implemented."); return {success: false, message: "Not implemented"}; }
  async getSeller(id: string): Promise<SellerProfileInfo | null> { console.warn("PostgresAdapter.getSeller not implemented."); return null; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateSeller not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteSeller not implemented."); return {success: false, message: "Not implemented"}; }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> { console.warn("PostgresAdapter.getSellerBySlug not implemented."); return null; }

  async getAuctions(): Promise<Auction[]> { console.warn("PostgresAdapter.getAuctions not implemented."); return []; }
  async createAuction(data: AuctionFormData): Promise<{ success: boolean; message: string; auctionId?: string; }> { console.warn("PostgresAdapter.createAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuction(id: string): Promise<Auction | null> { console.warn("PostgresAdapter.getAuction not implemented."); return null; }
  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> { console.warn("PostgresAdapter.getAuctionsBySellerSlug not implemented."); return []; }


  async getLots(auctionIdParam?: string): Promise<Lot[]> { console.warn("PostgresAdapter.getLots not implemented."); return []; }
  async createLot(data: LotFormData): Promise<{ success: boolean; message: string; lotId?: string; }> { console.warn("PostgresAdapter.createLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getLot(id: string): Promise<Lot | null> { console.warn("PostgresAdapter.getLot not implemented."); return null; }
  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateLot not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { console.warn("PostgresAdapter.getBidsForLot not implemented."); return []; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> { console.warn("PostgresAdapter.placeBidOnLot not implemented."); return {success: false, message: "Not implemented"}; }


  async getUserProfileData(userId: string): Promise<UserProfileData | null> { console.warn("PostgresAdapter.getUserProfileData not implemented."); return null; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateUserProfile not implemented."); return {success: false, message: "Not implemented"}; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> { console.warn("PostgresAdapter.ensureUserRole not implemented."); return {success: false, message: "Not implemented"}; }
  async getUsersWithRoles(): Promise<UserProfileData[]> { console.warn("PostgresAdapter.getUsersWithRoles not implemented."); return []; }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateUserRole not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteUserProfile not implemented."); return {success: false, message: "Not implemented"}; }

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { console.warn("PostgresAdapter.createRole not implemented."); return {success: false, message: "Not implemented"}; }
  async getRoles(): Promise<Role[]> { console.warn("PostgresAdapter.getRoles not implemented."); return []; }
  async getRole(id: string): Promise<Role | null> { console.warn("PostgresAdapter.getRole not implemented."); return null; }
  async getRoleByName(name: string): Promise<Role | null> { console.warn("PostgresAdapter.getRoleByName not implemented."); return null; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateRole not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteRole not implemented."); return {success: false, message: "Not implemented"}; }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.ensureDefaultRolesExist not implemented."); return {success: false, message: "Not implemented"}; }
  
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { console.warn("PostgresAdapter.createMediaItem not implemented."); return {success: false, message: "Not implemented"}; }
  async getMediaItems(): Promise<MediaItem[]> { console.warn("PostgresAdapter.getMediaItems not implemented."); return []; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateMediaItemMetadata not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteMediaItemFromDb not implemented."); return {success: false, message: "Not implemented"}; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.linkMediaItemsToLot not implemented."); return {success: false, message: "Not implemented"}; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.unlinkMediaItemFromLot not implemented."); return {success: false, message: "Not implemented"}; }
  
  async getPlatformSettings(): Promise<PlatformSettings> { console.warn("PostgresAdapter.getPlatformSettings not implemented."); return { id: 'global', galleryImageBasePath: '/pg/default/path/', updatedAt: new Date() };}
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updatePlatformSettings not implemented."); return {success: false, message: "Not implemented"}; }
}
