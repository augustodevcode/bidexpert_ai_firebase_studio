
// src/lib/database/postgres.adapter.ts
import { Pool, type QueryResultRow } from 'pg';
import type {
  IDatabaseAdapter,
  LotCategory, StateInfo, StateFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData,
  Lot, LotFormData,
  BidInfo,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData,
} from '@/types';
import { slugify } from '@/lib/sample-data';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';

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

function mapRowToCamelCase(row: QueryResultRow): any {
    const newRow: { [key: string]: any } = {};
    for (const key in row) {
        const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newRow[camelCaseKey] = row[key];
    }
    return newRow;
}

function mapRowsToCamelCase(rows: QueryResultRow[]): any[] {
    return rows.map(mapRowToCamelCase);
}

function mapToLotCategory(row: QueryResultRow): LotCategory {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    itemCount: Number(row.itemCount || 0),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToStateInfo(row: QueryResultRow): StateInfo {
    return {
        id: String(row.id),
        name: row.name,
        uf: row.uf,
        slug: row.slug,
        cityCount: Number(row.cityCount || 0),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToCityInfo(row: QueryResultRow): CityInfo {
    return {
        id: String(row.id),
        name: row.name,
        slug: row.slug,
        stateId: String(row.stateId),
        stateUf: row.stateUf,
        ibgeCode: row.ibgeCode,
        lotCount: Number(row.lotCount || 0),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToAuctioneerProfileInfo(row: QueryResultRow): AuctioneerProfileInfo {
    return {
        id: String(row.id),
        name: row.name,
        slug: row.slug,
        registrationNumber: row.registrationNumber,
        contactName: row.contactName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        website: row.website,
        logoUrl: row.logoUrl,
        dataAiHintLogo: row.dataAiHintLogo,
        description: row.description,
        memberSince: row.memberSince ? new Date(row.memberSince) : undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
        auctionsConductedCount: Number(row.auctionsConductedCount || 0),
        totalValueSold: Number(row.totalValueSold || 0),
        userId: row.userId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToSellerProfileInfo(row: QueryResultRow): SellerProfileInfo {
    return {
        id: String(row.id),
        name: row.name,
        slug: row.slug,
        contactName: row.contactName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        website: row.website,
        logoUrl: row.logoUrl,
        dataAiHintLogo: row.dataAiHintLogo,
        description: row.description,
        memberSince: row.memberSince ? new Date(row.memberSince) : undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
        activeLotsCount: Number(row.activeLotsCount || 0),
        totalSalesValue: Number(row.totalSalesValue || 0),
        auctionsFacilitatedCount: Number(row.auctionsFacilitatedCount || 0),
        userId: row.userId,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}


function mapToRole(row: QueryResultRow): Role {
    return {
        id: String(row.id),
        name: row.name,
        name_normalized: row.nameNormalized,
        description: row.description,
        permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions || [],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToUserProfileData(row: QueryResultRow, role?: Role | null): UserProfileData {
    const profile: UserProfileData = {
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        roleId: row.roleId ? String(row.roleId) : undefined,
        roleName: role?.name || row.roleName, // Use roleName from join if available
        permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (role?.permissions || row.permissions || []),
        status: row.status,
        habilitationStatus: row.habilitationStatus as UserHabilitationStatus,
        cpf: row.cpf,
        rgNumber: row.rgNumber,
        rgIssuer: row.rgIssuer,
        rgIssueDate: row.rgIssueDate ? new Date(row.rgIssueDate) : undefined,
        rgState: row.rgState,
        dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
        cellPhone: row.cellPhone,
        homePhone: row.homePhone,
        gender: row.gender,
        profession: row.profession,
        nationality: row.nationality,
        maritalStatus: row.maritalStatus,
        propertyRegime: row.propertyRegime,
        spouseName: row.spouseName,
        spouseCpf: row.spouseCpf,
        zipCode: row.zipCode,
        street: row.street,
        number: row.number,
        complement: row.complement,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        optInMarketing: row.optInMarketing,
        avatarUrl: row.avatarUrl,
        dataAiHint: row.dataAiHint,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
    return profile;
}


export class PostgresAdapter implements IDatabaseAdapter {
  constructor() {
    getPool(); 
  }

  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[] }> {
    const client = await getPool().connect();
    const errors: any[] = [];
    console.log('[PostgresAdapter] Iniciando criação/verificação de tabelas...');

    const queries = [
      // Drop in reverse order of creation / dependency
      `DROP TABLE IF EXISTS bids;`,
      `DROP TABLE IF EXISTS media_items;`,
      `DROP TABLE IF EXISTS lots;`,
      `DROP TABLE IF EXISTS auctions;`,
      `DROP TABLE IF EXISTS cities;`,
      `DROP TABLE IF EXISTS sellers;`,
      `DROP TABLE IF EXISTS auctioneers;`,
      `DROP TABLE IF EXISTS user_profiles;`,
      `DROP TABLE IF EXISTS states;`,
      `DROP TABLE IF EXISTS lot_categories;`,
      `DROP TABLE IF EXISTS roles;`,
      `DROP TABLE IF EXISTS platform_settings;`,

      // Create in order of dependency
      `CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        name_normalized VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_roles_name_normalized ON roles(name_normalized);`,

      `CREATE TABLE IF NOT EXISTS user_profiles (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
        permissions JSONB,
        status VARCHAR(50),
        habilitation_status VARCHAR(50),
        cpf VARCHAR(20),
        rg_number VARCHAR(30),
        rg_issuer VARCHAR(100),
        rg_issue_date DATE,
        rg_state VARCHAR(2),
        date_of_birth DATE,
        cell_phone VARCHAR(20),
        home_phone VARCHAR(20),
        gender VARCHAR(50),
        profession VARCHAR(100),
        nationality VARCHAR(100),
        marital_status VARCHAR(50),
        property_regime VARCHAR(100),
        spouse_name VARCHAR(255),
        spouse_cpf VARCHAR(20),
        zip_code VARCHAR(10),
        street VARCHAR(255),
        "number" VARCHAR(20),
        complement VARCHAR(100),
        neighborhood VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(100),
        opt_in_marketing BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        data_ai_hint TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);`,
      `CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);`,

      `CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
        gallery_image_base_path TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS lot_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        item_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_lot_categories_slug ON lot_categories(slug);`,

      `CREATE TABLE IF NOT EXISTS states (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        uf VARCHAR(2) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        city_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_states_slug ON states(slug);`,
      `CREATE INDEX IF NOT EXISTS idx_states_uf ON states(uf);`,

      `CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL,
        state_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
        state_uf VARCHAR(2),
        ibge_code VARCHAR(10) UNIQUE,
        lot_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (slug, state_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);`,
      `CREATE INDEX IF NOT EXISTS idx_cities_slug_state_id ON cities(slug, state_id);`,

      `CREATE TABLE IF NOT EXISTS auctioneers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        registration_number VARCHAR(100),
        contact_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        website TEXT,
        logo_url TEXT,
        data_ai_hint_logo TEXT,
        description TEXT,
        member_since TIMESTAMPTZ,
        rating NUMERIC(3,1),
        auctions_conducted_count INTEGER,
        total_value_sold NUMERIC(15,2),
        user_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_auctioneers_slug ON auctioneers(slug);`,

      `CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        contact_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        website TEXT,
        logo_url TEXT,
        data_ai_hint_logo TEXT,
        description TEXT,
        member_since TIMESTAMPTZ,
        rating NUMERIC(3,1),
        active_lots_count INTEGER,
        total_sales_value NUMERIC(15,2),
        auctions_facilitated_count INTEGER,
        user_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(slug);`,

      `CREATE TABLE IF NOT EXISTS auctions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        full_title TEXT,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        auction_type VARCHAR(50),
        category_id INTEGER REFERENCES lot_categories(id) ON DELETE SET NULL,
        auctioneer_id INTEGER REFERENCES auctioneers(id) ON DELETE SET NULL,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE SET NULL,
        auction_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ,
        auction_stages JSONB,
        city VARCHAR(100),
        state VARCHAR(2),
        image_url TEXT,
        data_ai_hint TEXT,
        documents_url TEXT,
        total_lots INTEGER DEFAULT 0,
        visits INTEGER DEFAULT 0,
        initial_offer NUMERIC(15,2),
        is_favorite BOOLEAN DEFAULT FALSE,
        current_bid NUMERIC(15,2),
        bids_count INTEGER DEFAULT 0,
        selling_branch VARCHAR(100),
        vehicle_location VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_auction_date ON auctions(auction_date);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_category_id ON auctions(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_auctioneer_id ON auctions(auctioneer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON auctions(seller_id);`,
      
      `CREATE TABLE IF NOT EXISTS lots (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
        title VARCHAR(255) NOT NULL,
        "number" VARCHAR(50),
        image_url TEXT,
        data_ai_hint TEXT,
        gallery_image_urls JSONB,
        media_item_ids JSONB,
        status VARCHAR(50) NOT NULL,
        state_id INTEGER REFERENCES states(id) ON DELETE SET NULL,
        city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
        type VARCHAR(100),
        views INTEGER DEFAULT 0,
        auction_name VARCHAR(255),
        price NUMERIC(15,2) NOT NULL,
        initial_price NUMERIC(15,2),
        lot_specific_auction_date TIMESTAMPTZ,
        second_auction_date TIMESTAMPTZ,
        second_initial_price NUMERIC(15,2),
        end_date TIMESTAMPTZ NOT NULL,
        bids_count INTEGER DEFAULT 0,
        is_favorite BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        description TEXT,
        year INTEGER,
        make VARCHAR(100),
        model VARCHAR(100),
        series VARCHAR(100),
        stock_number VARCHAR(100),
        selling_branch VARCHAR(100),
        vin VARCHAR(100),
        vin_status VARCHAR(50),
        loss_type VARCHAR(100),
        primary_damage VARCHAR(100),
        title_info VARCHAR(100),
        title_brand VARCHAR(100),
        start_code VARCHAR(100),
        has_key BOOLEAN,
        odometer VARCHAR(50),
        airbags_status VARCHAR(100),
        body_style VARCHAR(100),
        engine_details TEXT,
        transmission_type VARCHAR(100),
        drive_line_type VARCHAR(50),
        fuel_type VARCHAR(50),
        cylinders VARCHAR(20),
        restraint_system VARCHAR(255),
        exterior_interior_color VARCHAR(100),
        options TEXT,
        manufactured_in VARCHAR(100),
        vehicle_class VARCHAR(100),
        vehicle_location_in_branch VARCHAR(255),
        lane_run_number VARCHAR(50),
        aisle_stall VARCHAR(50),
        actual_cash_value VARCHAR(50),
        estimated_repair_cost VARCHAR(50),
        seller_name VARCHAR(255),
        seller_id_fk INTEGER REFERENCES sellers(id) ON DELETE SET NULL,
        auctioneer_name VARCHAR(255),
        auctioneer_id_fk INTEGER REFERENCES auctioneers(id) ON DELETE SET NULL,
        condition TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_lots_auction_id ON lots(auction_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_type ON lots(type);`,

      `CREATE TABLE IF NOT EXISTS media_items (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(255),
        title TEXT,
        alt_text TEXT,
        caption TEXT,
        description TEXT,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NOT NULL,
        dimensions_width INTEGER,
        dimensions_height INTEGER,
        url_original TEXT NOT NULL,
        url_thumbnail TEXT,
        url_medium TEXT,
        url_large TEXT,
        linked_lot_ids JSONB,
        data_ai_hint TEXT
      );`,
      `CREATE INDEX IF NOT EXISTS idx_media_items_uploaded_by ON media_items(uploaded_by);`,
      `CREATE INDEX IF NOT EXISTS idx_media_items_mime_type ON media_items(mime_type);`,

      `CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
        auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
        bidder_id VARCHAR(255) REFERENCES user_profiles(uid) ON DELETE CASCADE NOT NULL,
        bidder_display_name VARCHAR(255),
        amount NUMERIC(15,2) NOT NULL,
        "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_bids_lot_id ON bids(lot_id);`,
      `CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);`,
    ];

    try {
      await client.query('BEGIN');
      for (const query of queries) {
        try {
          await client.query(query);
          const tableNameMatch = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
          const indexNameMatch = query.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
          const dropTableNameMatch = query.match(/DROP TABLE IF EXISTS (\w+)/i);

          if (tableNameMatch) {
            console.log(`[PostgresAdapter] Tabela '${tableNameMatch[1]}' verificada/criada com sucesso.`);
          } else if (indexNameMatch) {
            console.log(`[PostgresAdapter] Índice '${indexNameMatch[1]}' verificado/criado com sucesso.`);
          } else if (dropTableNameMatch) {
             console.log(`[PostgresAdapter] Tentativa de excluir tabela '${dropTableNameMatch[1]}' (IF EXISTS).`);
          }
        } catch (tableError: any) {
          console.warn(`[PostgresAdapter] Aviso ao executar query: ${tableError.message}. Query: ${query.substring(0,100)}...`);
        }
      }
      await client.query('COMMIT');
      console.log('[PostgresAdapter] Esquema inicializado com sucesso.');
      return { success: true, message: 'Esquema PostgreSQL inicializado/verificado com sucesso.' };
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('[PostgresAdapter - initializeSchema] Erro transacional:', error);
      errors.push(error.message);
      return { success: false, message: `Erro ao inicializar esquema PostgreSQL: ${error.message}`, errors };
    } finally {
      client.release();
    }
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
      return { success: true, message: 'Categoria criada com sucesso (PostgreSQL)!', categoryId: String(categoryId) };
    } catch (error: any) {
      console.error("[PostgresAdapter - createLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao criar categoria (PostgreSQL).' };
    } finally {
      client.release();
    }
  }

  async getLotCategories(): Promise<LotCategory[]> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT id, name, slug, description, item_count, created_at, updated_at FROM lot_categories ORDER BY name ASC;');
      return mapRowsToCamelCase(res.rows).map(mapToLotCategory);
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
        const res = await client.query(queryText, [Number(id)]);
        if (res.rows.length > 0) {
            return mapToLotCategory(mapRowToCamelCase(res.rows[0]));
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
      return { success: true, message: 'Categoria atualizada com sucesso (PostgreSQL)!' };
    } catch (error: any) {
      console.error("[PostgresAdapter - updateLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao atualizar categoria (PostgreSQL).' };
    } finally {
      client.release();
    }
  }

  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM lot_categories WHERE id = $1;', [Number(id)]);
      return { success: true, message: 'Categoria excluída com sucesso (PostgreSQL)!' };
    } catch (error: any) {
      console.error("[PostgresAdapter - deleteLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao excluir categoria (PostgreSQL).' };
    } finally {
      client.release();
    }
  }
  
  // --- States ---
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name);
      const query = `INSERT INTO states (name, uf, slug, city_count, created_at, updated_at) VALUES ($1, $2, $3, 0, NOW(), NOW()) RETURNING id`;
      const res = await client.query(query, [data.name, data.uf.toUpperCase(), slug]);
      return { success: true, message: 'Estado criado (PostgreSQL)!', stateId: String(res.rows[0].id) };
    } catch (e: any) { console.error(`[PostgresAdapter - createState] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  async getStates(): Promise<StateInfo[]> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT id, name, uf, slug, city_count, created_at, updated_at FROM states ORDER BY name ASC');
      return mapRowsToCamelCase(res.rows).map(mapToStateInfo);
    } catch (e: any) { console.error(`[PostgresAdapter - getStates] Error:`, e); return []; } finally { client.release(); }
  }
   async getState(id: string): Promise<StateInfo | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT id, name, uf, slug, city_count, created_at, updated_at FROM states WHERE id = $1', [Number(id)]);
      if (res.rowCount === 0) return null;
      return mapToStateInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getState(${id})] Error:`, e); return null; } finally { client.release(); }
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let query = 'UPDATE states SET ';
      let paramCount = 1;
      if (data.name) { fields.push(`name = $${paramCount++}`); values.push(data.name); fields.push(`slug = $${paramCount++}`); values.push(slugify(data.name)); }
      if (data.uf) { fields.push(`uf = $${paramCount++}`); values.push(data.uf.toUpperCase()); }
      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o estado."};
      
      fields.push(`updated_at = NOW()`);
      query += fields.join(', ') + ` WHERE id = $${paramCount}`;
      values.push(Number(id));
      await client.query(query, values);
      return { success: true, message: 'Estado atualizado (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - updateState(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM states WHERE id = $1', [Number(id)]);
      return { success: true, message: 'Estado excluído (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - deleteState(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }

  // --- Cities ---
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    const client = await getPool().connect();
    try {
        const parentStateRes = await client.query('SELECT uf FROM states WHERE id = $1', [Number(data.stateId)]);
        if (parentStateRes.rowCount === 0) return { success: false, message: 'Estado pai não encontrado.' };
        const stateUf = parentStateRes.rows[0].uf;
        const slug = slugify(data.name);
        const query = `INSERT INTO cities (name, slug, state_id, state_uf, ibge_code, lot_count, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW()) RETURNING id`;
        const res = await client.query(query, [data.name, slug, Number(data.stateId), stateUf, data.ibgeCode || null]);
        return { success: true, message: 'Cidade criada (PostgreSQL)!', cityId: String(res.rows[0].id) };
    } catch (e: any) { console.error(`[PostgresAdapter - createCity] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const client = await getPool().connect();
    try {
        let queryText = 'SELECT id, name, slug, state_id, state_uf, ibge_code, lot_count, created_at, updated_at FROM cities';
        const values = [];
        if (stateIdFilter) { queryText += ' WHERE state_id = $1'; values.push(Number(stateIdFilter)); }
        queryText += ' ORDER BY name ASC';
        const res = await client.query(queryText, values);
        return mapRowsToCamelCase(res.rows).map(mapToCityInfo);
    } catch (e: any) { console.error(`[PostgresAdapter - getCities] Error:`, e); return []; } finally { client.release(); }
  }
  async getCity(id: string): Promise<CityInfo | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT id, name, slug, state_id, state_uf, ibge_code, lot_count, created_at, updated_at FROM cities WHERE id = $1', [Number(id)]);
      if (res.rowCount === 0) return null;
      return mapToCityInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getCity(${id})] Error:`, e); return null; } finally { client.release(); }
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
     const client = await getPool().connect();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let query = 'UPDATE cities SET ';
        let paramCount = 1;

        if (data.name) { fields.push(`name = $${paramCount++}`); values.push(data.name); fields.push(`slug = $${paramCount++}`); values.push(slugify(data.name)); }
        if (data.stateId) {
            const parentStateRes = await client.query('SELECT uf FROM states WHERE id = $1', [Number(data.stateId)]);
            if (parentStateRes.rowCount === 0) return { success: false, message: 'Estado pai não encontrado.' };
            fields.push(`state_id = $${paramCount++}`); values.push(Number(data.stateId));
            fields.push(`state_uf = $${paramCount++}`); values.push(parentStateRes.rows[0].uf);
        }
        if (data.ibgeCode !== undefined) { fields.push(`ibge_code = $${paramCount++}`); values.push(data.ibgeCode || null); }
        
        if (fields.length === 0) return { success: true, message: "Nenhuma alteração para a cidade."};

        fields.push(`updated_at = NOW()`);
        query += fields.join(', ') + ` WHERE id = $${paramCount}`;
        values.push(Number(id));
        
        await client.query(query, values);
        return { success: true, message: 'Cidade atualizada (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - updateCity(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM cities WHERE id = $1', [Number(id)]);
      return { success: true, message: 'Cidade excluída (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - deleteCity(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }

  // --- Auctioneers ---
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name);
      const query = `
        INSERT INTO auctioneers 
          (name, slug, registration_number, contact_name, email, phone, address, city, state, zip_code, website, logo_url, data_ai_hint_logo, description, member_since, rating, auctions_conducted_count, total_value_sold, user_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), 0, 0, 0, $15, NOW(), NOW())
        RETURNING id;
      `;
      const values = [
        data.name, slug, data.registrationNumber || null, data.contactName || null, data.email || null, data.phone || null,
        data.address || null, data.city || null, data.state || null, data.zipCode || null, data.website || null,
        data.logoUrl || null, data.dataAiHintLogo || null, data.description || null, data.userId || null
      ];
      const res = await client.query(query, values);
      return { success: true, message: 'Leiloeiro criado (PostgreSQL)!', auctioneerId: String(res.rows[0].id) };
    } catch (e: any) { console.error(`[PostgresAdapter - createAuctioneer] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }

  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM auctioneers ORDER BY name ASC;');
      return mapRowsToCamelCase(res.rows).map(mapToAuctioneerProfileInfo);
    } catch (e: any) { console.error(`[PostgresAdapter - getAuctioneers] Error:`, e); return []; } finally { client.release(); }
  }

  async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM auctioneers WHERE id = $1;', [Number(id)]);
      if (res.rowCount === 0) return null;
      return mapToAuctioneerProfileInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getAuctioneer(${id})] Error:`, e); return null; } finally { client.release(); }
  }

  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM auctioneers WHERE slug = $1 LIMIT 1;', [slug]);
      if (res.rowCount === 0) return null;
      return mapToAuctioneerProfileInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getAuctioneerBySlug(${slug})] Error:`, e); return null; } finally { client.release(); }
  }

  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      (Object.keys(data) as Array<keyof AuctioneerFormData>).forEach(key => {
        if (data[key] !== undefined) {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            fields.push(`${sqlColumn} = $${paramCount++}`);
            values.push(data[key] === '' ? null : data[key]);
        }
      });
      if (data.name) { fields.push(`slug = $${paramCount++}`); values.push(slugify(data.name)); }

      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o leiloeiro." };

      fields.push(`updated_at = NOW()`);
      const queryText = `UPDATE auctioneers SET ${fields.join(', ')} WHERE id = $${paramCount}`;
      values.push(Number(id));

      await client.query(queryText, values);
      return { success: true, message: 'Leiloeiro atualizado (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - updateAuctioneer(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }

  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM auctioneers WHERE id = $1;', [Number(id)]);
      return { success: true, message: 'Leiloeiro excluído (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - deleteAuctioneer(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  
  // --- Sellers ---
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name);
      const query = `
        INSERT INTO sellers 
          (name, slug, contact_name, email, phone, address, city, state, zip_code, website, logo_url, data_ai_hint_logo, description, member_since, rating, active_lots_count, total_sales_value, auctions_facilitated_count, user_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), 0, 0, 0, 0, $15, NOW(), NOW())
        RETURNING id;
      `;
      const values = [
        data.name, slug, data.contactName || null, data.email || null, data.phone || null,
        data.address || null, data.city || null, data.state || null, data.zipCode || null, data.website || null,
        data.logoUrl || null, data.dataAiHintLogo || null, data.description || null, data.userId || null
      ];
      const res = await client.query(query, values);
      return { success: true, message: 'Comitente criado (PostgreSQL)!', sellerId: String(res.rows[0].id) };
    } catch (e: any) { console.error(`[PostgresAdapter - createSeller] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }

  async getSellers(): Promise<SellerProfileInfo[]> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM sellers ORDER BY name ASC;');
      return mapRowsToCamelCase(res.rows).map(mapToSellerProfileInfo);
    } catch (e: any) { console.error(`[PostgresAdapter - getSellers] Error:`, e); return []; } finally { client.release(); }
  }

  async getSeller(id: string): Promise<SellerProfileInfo | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM sellers WHERE id = $1;', [Number(id)]);
      if (res.rowCount === 0) return null;
      return mapToSellerProfileInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getSeller(${id})] Error:`, e); return null; } finally { client.release(); }
  }

  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM sellers WHERE slug = $1 LIMIT 1;', [slug]);
      if (res.rowCount === 0) return null;
      return mapToSellerProfileInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getSellerBySlug(${slug})] Error:`, e); return null; } finally { client.release(); }
  }

  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      (Object.keys(data) as Array<keyof SellerFormData>).forEach(key => {
        if (data[key] !== undefined) {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            fields.push(`${sqlColumn} = $${paramCount++}`);
            values.push(data[key] === '' ? null : data[key]);
        }
      });
      if (data.name) { fields.push(`slug = $${paramCount++}`); values.push(slugify(data.name)); }

      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o comitente." };

      fields.push(`updated_at = NOW()`);
      const queryText = `UPDATE sellers SET ${fields.join(', ')} WHERE id = $${paramCount}`;
      values.push(Number(id));

      await client.query(queryText, values);
      return { success: true, message: 'Comitente atualizado (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - updateSeller(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }

  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM sellers WHERE id = $1;', [Number(id)]);
      return { success: true, message: 'Comitente excluído (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - deleteSeller(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }

  // --- Users ---
  async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    const client = await getPool().connect();
    try {
      const query = `
        SELECT up.*, r.name as role_name_from_join, r.permissions as role_permissions_from_join 
        FROM user_profiles up 
        LEFT JOIN roles r ON up.role_id = r.id 
        WHERE up.uid = $1
      `;
      const res = await client.query(query, [userId]);
      if (res.rowCount === 0) return null;
      const row = mapRowToCamelCase(res.rows[0]);
      return mapToUserProfileData(row, { name: row.roleNameFromJoin, permissions: row.rolePermissionsFromJoin } as Role);
    } catch (e: any) {
      console.error(`[PostgresAdapter - getUserProfileData(${userId})] Error:`, e);
      return null;
    } finally {
      client.release();
    }
  }

  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      const fieldsToUpdate: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      (Object.keys(data) as Array<keyof EditableUserProfileData>).forEach(key => {
        if (data[key] !== undefined) {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            fieldsToUpdate.push(`"${sqlColumn}" = $${paramCount++}`); // Ensure "number" is quoted
            values.push(data[key] === '' ? null : data[key]);
        }
      });
      
      if (fieldsToUpdate.length === 0) {
        return { success: true, message: 'Nenhum dado para atualizar.' };
      }

      fieldsToUpdate.push(`updated_at = NOW()`);
      values.push(userId);

      const queryText = `UPDATE user_profiles SET ${fieldsToUpdate.join(', ')} WHERE uid = $${paramCount}`;
      await client.query(queryText, values);
      return { success: true, message: 'Perfil de usuário atualizado (PostgreSQL)!' };
    } catch (e: any) {
      console.error(`[PostgresAdapter - updateUserProfile(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }
  
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const existingUserRes = await client.query('SELECT * FROM user_profiles WHERE uid = $1', [userId]);
      let userProfileData: UserProfileData;
      let roleToAssign = await this.getRoleByName(targetRoleName); // This makes its own connection

      if (!roleToAssign) {
        await this.ensureDefaultRolesExist(); // This makes its own connection
        roleToAssign = await this.getRoleByName('USER'); // This makes its own connection
        if (!roleToAssign) {
          await client.query('ROLLBACK');
          return { success: false, message: `Perfil padrão USER não encontrado e não pôde ser criado.` };
        }
      }
      
      const permissionsToAssign = roleToAssign.permissions || [];

      if (existingUserRes.rowCount > 0) {
        const dbUser = mapRowToCamelCase(existingUserRes.rows[0]);
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIdx = 1;
        let needsUpdate = false;

        if (String(dbUser.roleId) !== roleToAssign.id) { updateFields.push(`role_id = $${paramIdx++}`); updateValues.push(Number(roleToAssign.id)); needsUpdate = true; }
        if (JSON.stringify(dbUser.permissions || []) !== JSON.stringify(permissionsToAssign)) {
            updateFields.push(`permissions = $${paramIdx++}`); updateValues.push(JSON.stringify(permissionsToAssign)); needsUpdate = true;
        }
        
        if (needsUpdate) {
            updateFields.push(`updated_at = NOW()`);
            const query = `UPDATE user_profiles SET ${updateFields.join(', ')} WHERE uid = $${paramIdx}`;
            updateValues.push(userId);
            await client.query(query, updateValues);
        }
        userProfileData = mapToUserProfileData(dbUser, roleToAssign);
      } else {
        const habilitation = targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS';
        const insertQuery = `
          INSERT INTO user_profiles (uid, email, full_name, role_id, permissions, status, habilitation_status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *;
        `;
        const insertRes = await client.query(insertQuery, [userId, email.toLowerCase(), fullName, Number(roleToAssign.id), JSON.stringify(permissionsToAssign), 'ATIVO', habilitation]);
        userProfileData = mapToUserProfileData(mapRowToCamelCase(insertRes.rows[0]), roleToAssign);
      }
      await client.query('COMMIT');
      return { success: true, message: 'Perfil de usuário assegurado/atualizado (PostgreSQL).', userProfile: userProfileData };
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error(`[PostgresAdapter - ensureUserRole(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }

  async getUsersWithRoles(): Promise<UserProfileData[]> {
    const client = await getPool().connect();
    try {
      const query = `
        SELECT up.*, r.name as role_name_from_join, r.permissions as role_permissions_from_join 
        FROM user_profiles up 
        LEFT JOIN roles r ON up.role_id = r.id 
        ORDER BY up.full_name ASC;
      `;
      const res = await client.query(query);
      return mapRowsToCamelCase(res.rows).map(row => mapToUserProfileData(row, { name: row.roleNameFromJoin, permissions: row.rolePermissionsFromJoin } as Role));
    } catch (e: any) {
      console.error(`[PostgresAdapter - getUsersWithRoles] Error:`, e);
      return [];
    } finally {
      client.release();
    }
  }

  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      let newRoleIdInt: number | null = null;
      let newPermissions: string[] = [];
      if (roleId && roleId !== "---NONE---") {
        const role = await this.getRole(roleId); // This uses its own connection
        if (!role) return { success: false, message: "Perfil não encontrado." };
        newRoleIdInt = Number(role.id); // PG ID is number
        newPermissions = role.permissions || [];
      }
      
      await client.query(
        'UPDATE user_profiles SET role_id = $1, permissions = $2, updated_at = NOW() WHERE uid = $3',
        [newRoleIdInt, JSON.stringify(newPermissions), userId]
      );
      return { success: true, message: 'Perfil do usuário atualizado (PostgreSQL)!' };
    } catch (e: any) {
      console.error(`[PostgresAdapter - updateUserRole(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }

  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM user_profiles WHERE uid = $1', [userId]);
      return { success: true, message: 'Perfil de usuário excluído do DB (PostgreSQL)!' };
    } catch (e: any) {
      console.error(`[PostgresAdapter - deleteUserProfile(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }

  // --- Roles ---
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    const client = await getPool().connect();
    try {
      const normalizedName = data.name.trim().toUpperCase();
      const existingRes = await client.query('SELECT id FROM roles WHERE name_normalized = $1 LIMIT 1', [normalizedName]);
      if (existingRes.rowCount > 0) {
        return { success: false, message: `Perfil "${data.name}" já existe (PostgreSQL).`};
      }
      const validPermissions = JSON.stringify((data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)));
      const query = `
        INSERT INTO roles (name, name_normalized, description, permissions, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id;
      `;
      const res = await client.query(query, [data.name.trim(), normalizedName, data.description || null, validPermissions]);
      return { success: true, message: 'Perfil criado (PostgreSQL)!', roleId: String(res.rows[0].id) };
    } catch (e: any) {
      console.error(`[PostgresAdapter - createRole] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }

  async getRoles(): Promise<Role[]> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM roles ORDER BY name ASC;');
      return mapRowsToCamelCase(res.rows).map(mapToRole);
    } catch (e: any) {
      console.error(`[PostgresAdapter - getRoles] Error:`, e);
      return [];
    } finally {
      client.release();
    }
  }

  async getRole(id: string): Promise<Role | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM roles WHERE id = $1', [Number(id)]);
      if (res.rowCount === 0) return null;
      return mapToRole(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) {
      console.error(`[PostgresAdapter - getRole(${id})] Error:`, e);
      return null;
    } finally {
      client.release();
    }
  }

  async getRoleByName(name: string): Promise<Role | null> {
    const client = await getPool().connect();
    try {
      const normalizedName = name.trim().toUpperCase();
      const res = await client.query('SELECT * FROM roles WHERE name_normalized = $1 LIMIT 1', [normalizedName]);
      if (res.rowCount === 0) return null;
      return mapToRole(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) {
      console.error(`[PostgresAdapter - getRoleByName(${name})] Error:`, e);
      return null;
    } finally {
      client.release();
    }
  }
  
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      const currentRole = await this.getRole(id); // This uses its own connection
      if (!currentRole) return { success: false, message: 'Perfil não encontrado.' };

      const fieldsToUpdate: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name && data.name.trim() !== currentRole.name) {
        const normalizedName = data.name.trim().toUpperCase();
        if (currentRole.name_normalized !== 'ADMINISTRATOR' && currentRole.name_normalized !== 'USER') {
            const existingRes = await client.query('SELECT id FROM roles WHERE name_normalized = $1 AND id != $2 LIMIT 1', [normalizedName, Number(id)]);
            if (existingRes.rowCount > 0) return { success: false, message: `Perfil com nome "${data.name}" já existe.`};
            fieldsToUpdate.push(`name_normalized = $${paramCount++}`); values.push(normalizedName);
        }
        fieldsToUpdate.push(`name = $${paramCount++}`); values.push(data.name.trim());
      }
      if (data.description !== undefined && data.description !== currentRole.description) {
        fieldsToUpdate.push(`description = $${paramCount++}`); values.push(data.description || null);
      }
      if (data.permissions !== undefined && JSON.stringify((data.permissions || []).sort()) !== JSON.stringify((currentRole.permissions || []).sort())) {
        fieldsToUpdate.push(`permissions = $${paramCount++}`);
        values.push(JSON.stringify((data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p))));
      }
      
      if (fieldsToUpdate.length === 0) {
        return { success: true, message: 'Nenhum dado para atualizar no perfil (PostgreSQL).' };
      }

      fieldsToUpdate.push(`updated_at = NOW()`);
      values.push(Number(id));
      const queryText = `UPDATE roles SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramCount}`;
      
      await client.query(queryText, values);
      return { success: true, message: 'Perfil atualizado (PostgreSQL)!' };
    } catch (e: any) {
      console.error(`[PostgresAdapter - updateRole(${id})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      const role = await this.getRole(id); // This uses its own connection
      if (role && (role.name_normalized === 'ADMINISTRATOR' || role.name_normalized === 'USER')) {
        return { success: false, message: 'Perfis de sistema não podem ser excluídos.' };
      }
      await client.query('DELETE FROM roles WHERE id = $1', [Number(id)]);
      return { success: true, message: 'Perfil excluído (PostgreSQL)!' };
    } catch (e: any) {
      console.error(`[PostgresAdapter - deleteRole(${id})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }
  
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; }> {
    const defaultRolesData: RoleFormData[] = [ 
      { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
      { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
      { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
      { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
      { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
    ];
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      for (const roleData of defaultRolesData) {
        const normalizedName = roleData.name.trim().toUpperCase();
        const existingRes = await client.query('SELECT * FROM roles WHERE name_normalized = $1 LIMIT 1', [normalizedName]);
        
        if (existingRes.rowCount === 0) {
          const validPermissions = JSON.stringify((roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)));
          const query = `
            INSERT INTO roles (name, name_normalized, description, permissions, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, NOW(), NOW());
          `;
          await client.query(query, [roleData.name.trim(), normalizedName, roleData.description || null, validPermissions]);
        } else {
          const role = mapToRole(mapRowToCamelCase(existingRes.rows[0]));
          const currentPermissionsSorted = [...(role.permissions || [])].sort();
          const expectedPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
          if (JSON.stringify(currentPermissionsSorted) !== JSON.stringify(expectedPermissions) || role.description !== (roleData.description || null)) {
            const updateQuery = `UPDATE roles SET description = $1, permissions = $2, updated_at = NOW() WHERE id = $3`;
            await client.query(updateQuery, [roleData.description || null, JSON.stringify(expectedPermissions), Number(role.id)]);
          }
        }
      }
      await client.query('COMMIT');
      return { success: true, message: 'Perfis padrão verificados/criados (PostgreSQL).'};
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error(`[PostgresAdapter - ensureDefaultRolesExist] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      client.release();
    }
  }

  // --- Auctions (Scaffold) ---
  async createAuction(data: AuctionFormData): Promise<{ success: boolean; message: string; auctionId?: string; }> { console.warn("PostgresAdapter.createAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuctions(): Promise<Auction[]> { console.warn("PostgresAdapter.getAuctions not implemented."); return []; }
  async getAuction(id: string): Promise<Auction | null> { console.warn("PostgresAdapter.getAuction not implemented."); return null; }
  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> { console.warn("PostgresAdapter.getAuctionsBySellerSlug not implemented."); return [];}
  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteAuction not implemented."); return {success: false, message: "Not implemented"}; }

  // --- Lots (Scaffold) ---
  async createLot(data: LotFormData): Promise<{ success: boolean; message: string; lotId?: string; }> { console.warn("PostgresAdapter.createLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getLots(auctionIdParam?: string): Promise<Lot[]> { console.warn("PostgresAdapter.getLots not implemented."); return []; }
  async getLot(id: string): Promise<Lot | null> { console.warn("PostgresAdapter.getLot not implemented."); return null; }
  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateLot not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { console.warn("PostgresAdapter.getBidsForLot not implemented."); return []; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> { console.warn("PostgresAdapter.placeBidOnLot not implemented."); return {success: false, message: "Not implemented"}; }
  
  // --- Media Items (Scaffold) ---
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { console.warn("PostgresAdapter.createMediaItem not implemented."); return {success: false, message: "Not implemented"}; }
  async getMediaItems(): Promise<MediaItem[]> { console.warn("PostgresAdapter.getMediaItems not implemented."); return []; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updateMediaItemMetadata not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.deleteMediaItemFromDb not implemented."); return {success: false, message: "Not implemented"}; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.linkMediaItemsToLot not implemented."); return {success: false, message: "Not implemented"}; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.unlinkMediaItemFromLot not implemented."); return {success: false, message: "Not implemented"}; }
  
  // Settings
  async getPlatformSettings(): Promise<PlatformSettings> { console.warn("PostgresAdapter.getPlatformSettings not implemented."); return { id: 'global', galleryImageBasePath: '/pg/default/path/', updatedAt: new Date() };}
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> { console.warn("PostgresAdapter.updatePlatformSettings not implemented."); return {success: false, message: "Not implemented"}; }
}
    

    

    




    