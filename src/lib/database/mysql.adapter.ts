// src/lib/database/mysql.adapter.ts
import mysql, { type RowDataPacket, type Pool } from 'mysql2/promise';
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
        queueLimit: 0,
        dateStrings: true, // Importante para receber datas como strings
      });
      console.log('[MySqlAdapter] Pool de conexões MySQL inicializado.');
    } catch (e) {
      console.error("[MySqlAdapter] Erro ao parsear MYSQL_CONNECTION_STRING ou criar pool:", e);
      throw new Error('Formato inválido para MYSQL_CONNECTION_STRING ou falha ao criar pool.');
    }
  }
  return pool;
}

function mapMySqlRowToCamelCase(row: RowDataPacket): any {
    const newRow: { [key: string]: any } = {};
    for (const key in row) {
        const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newRow[camelCaseKey] = row[key];
    }
    return newRow;
}

function mapMySqlRowsToCamelCase(rows: RowDataPacket[]): any[] {
    return rows.map(mapMySqlRowToCamelCase);
}


function mapToLotCategory(row: RowDataPacket): LotCategory {
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

function mapToStateInfo(row: RowDataPacket): StateInfo {
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

function mapToCityInfo(row: RowDataPacket): CityInfo {
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

function mapToAuctioneerProfileInfo(row: RowDataPacket): AuctioneerProfileInfo {
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

function mapToRole(row: RowDataPacket): Role {
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

function mapToUserProfileData(row: RowDataPacket, role?: Role | null): UserProfileData {
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
        number: row.number, // Escaped with backticks in queries if column is named 'number'
        complement: row.complement,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        optInMarketing: Boolean(row.optInMarketing),
        avatarUrl: row.avatarUrl,
        dataAiHint: row.dataAiHint,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
    return profile;
}


export class MySqlAdapter implements IDatabaseAdapter {
  constructor() {
    getPool(); 
  }

  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[] }> {
    const connection = await getPool().getConnection();
    const errors: any[] = [];
    console.log('[MySqlAdapter] Iniciando criação/verificação de tabelas...');
    
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
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        name_normalized VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_roles_name_normalized (name_normalized)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS user_profiles (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        role_id INT UNSIGNED,
        permissions JSON,
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
        \`number\` VARCHAR(20),
        complement VARCHAR(100),
        neighborhood VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(100),
        opt_in_marketing BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        data_ai_hint TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
        INDEX idx_user_profiles_email (email),
        INDEX idx_user_profiles_role_id (role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      
      `CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
        gallery_image_base_path TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lot_categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        item_count INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_lot_categories_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      
      `CREATE TABLE IF NOT EXISTS states (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        uf VARCHAR(2) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        city_count INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_states_slug (slug),
        INDEX idx_states_uf (uf)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS cities (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL,
        state_id INT UNSIGNED,
        state_uf VARCHAR(2),
        ibge_code VARCHAR(10) UNIQUE,
        lot_count INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
        UNIQUE KEY \`unique_city_in_state\` (\`slug\`, \`state_id\`),
        INDEX idx_cities_state_id (state_id),
        INDEX idx_cities_slug_state_id (slug, state_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS auctioneers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
        member_since TIMESTAMP NULL,
        rating DECIMAL(3,1),
        auctions_conducted_count INT UNSIGNED,
        total_value_sold DECIMAL(15,2),
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_auctioneers_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS sellers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
        member_since TIMESTAMP NULL,
        rating DECIMAL(3,1),
        active_lots_count INT UNSIGNED,
        total_sales_value DECIMAL(15,2),
        auctions_facilitated_count INT UNSIGNED,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sellers_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      
      `CREATE TABLE IF NOT EXISTS auctions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        full_title TEXT,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        auction_type VARCHAR(50),
        category_id INT UNSIGNED,
        auctioneer_id INT UNSIGNED,
        seller_id INT UNSIGNED,
        auction_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NULL,
        auction_stages JSON,
        city VARCHAR(100),
        state VARCHAR(2),
        image_url TEXT,
        data_ai_hint TEXT,
        documents_url TEXT,
        total_lots INT UNSIGNED DEFAULT 0,
        visits INT UNSIGNED DEFAULT 0,
        initial_offer DECIMAL(15,2),
        is_favorite BOOLEAN DEFAULT FALSE,
        current_bid DECIMAL(15,2),
        bids_count INT UNSIGNED DEFAULT 0,
        selling_branch VARCHAR(100),
        vehicle_location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES lot_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (auctioneer_id) REFERENCES auctioneers(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
        INDEX idx_auctions_status (status),
        INDEX idx_auctions_auction_date (auction_date),
        INDEX idx_auctions_category_id (category_id),
        INDEX idx_auctions_auctioneer_id (auctioneer_id),
        INDEX idx_auctions_seller_id (seller_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lots (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        auction_id INT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        \`number\` VARCHAR(50),
        image_url TEXT,
        data_ai_hint TEXT,
        gallery_image_urls JSON,
        media_item_ids JSON,
        status VARCHAR(50) NOT NULL,
        state_id INT UNSIGNED, 
        city_id INT UNSIGNED, 
        type VARCHAR(100),
        views INT UNSIGNED DEFAULT 0,
        auction_name VARCHAR(255),
        price DECIMAL(15,2) NOT NULL,
        initial_price DECIMAL(15,2),
        lot_specific_auction_date TIMESTAMP NULL,
        second_auction_date TIMESTAMP NULL,
        second_initial_price DECIMAL(15,2),
        end_date TIMESTAMP NOT NULL,
        bids_count INT UNSIGNED DEFAULT 0,
        is_favorite BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        description TEXT,
        year INT,
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
        seller_id_fk INT UNSIGNED, 
        auctioneer_name VARCHAR(255),
        auctioneer_id_fk INT UNSIGNED, 
        \`condition\` TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id_fk) REFERENCES sellers(id) ON DELETE SET NULL,
        FOREIGN KEY (auctioneer_id_fk) REFERENCES auctioneers(id) ON DELETE SET NULL,
        INDEX idx_lots_auction_id (auction_id),
        INDEX idx_lots_status (status),
        INDEX idx_lots_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS media_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(255),
        title TEXT,
        alt_text TEXT,
        caption TEXT,
        description TEXT,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NOT NULL,
        dimensions_width INT,
        dimensions_height INT,
        url_original TEXT NOT NULL,
        url_thumbnail TEXT,
        url_medium TEXT,
        url_large TEXT,
        linked_lot_ids JSON,
        data_ai_hint TEXT,
        INDEX idx_media_items_uploaded_by (uploaded_by),
        INDEX idx_media_items_mime_type (mime_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS bids (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        lot_id INT UNSIGNED NOT NULL,
        auction_id INT UNSIGNED NOT NULL,
        bidder_id VARCHAR(255) NOT NULL,
        bidder_display_name VARCHAR(255),
        amount DECIMAL(15,2) NOT NULL,
        \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (bidder_id) REFERENCES user_profiles(uid) ON DELETE CASCADE,
        INDEX idx_bids_lot_id (lot_id),
        INDEX idx_bids_bidder_id (bidder_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
    ];

    try {
      await connection.beginTransaction();
      for (const query of queries) {
        try {
          await connection.query(query);
          const tableNameMatch = query.match(/CREATE TABLE IF NOT EXISTS \`?(\w+)\`?/i);
          const dropTableNameMatch = query.match(/DROP TABLE IF EXISTS \`?(\w+)\`?/i);
           if (tableNameMatch) {
            console.log(`[MySqlAdapter] Tabela '${tableNameMatch[1]}' verificada/criada com sucesso.`);
          } else if (dropTableNameMatch) {
             console.log(`[MySqlAdapter] Tentativa de excluir tabela '${dropTableNameMatch[1]}' (IF EXISTS).`);
          }
        } catch (tableError: any) {
          console.warn(`[MySqlAdapter] Aviso ao executar query: ${tableError.message}. Query: ${query.substring(0,100)}...`);
        }
      }
      await connection.commit();
      console.log('[MySqlAdapter] Esquema inicializado com sucesso.');
      return { success: true, message: 'Esquema MySQL inicializado/verificado com sucesso.' };
    } catch (error: any) {
      await connection.rollback();
      console.error('[MySqlAdapter - initializeSchema] Erro transacional:', error);
      errors.push(error.message);
      return { success: false, message: `Erro ao inicializar esquema MySQL: ${error.message}`, errors };
    } finally {
      connection.release();
    }
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
      return (rows as RowDataPacket[]).map(row => mapToLotCategory(mapMySqlRowToCamelCase(row)));
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
            return mapToLotCategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
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
  
  // --- States ---
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name);
      const query = `INSERT INTO states (name, uf, slug, city_count, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())`;
      const [result] = await connection.execute(query, [data.name, data.uf.toUpperCase(), slug]);
      return { success: true, message: 'Estado criado (MySQL)!', stateId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createState] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async getStates(): Promise<StateInfo[]> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT id, name, uf, slug, city_count, created_at, updated_at FROM states ORDER BY name ASC');
      return (rows as RowDataPacket[]).map(row => mapToStateInfo(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getStates] Error:`, e); return []; } finally { connection.release(); }
  }
  async getState(id: string): Promise<StateInfo | null> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT id, name, uf, slug, city_count, created_at, updated_at FROM states WHERE id = ?', [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToStateInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getState(${id})] Error:`, e); return null; } finally { connection.release(); }
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let query = 'UPDATE states SET ';
      if (data.name) { fields.push(`name = ?`); values.push(data.name); fields.push(`slug = ?`); values.push(slugify(data.name)); }
      if (data.uf) { fields.push(`uf = ?`); values.push(data.uf.toUpperCase()); }
      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o estado."};

      fields.push(`updated_at = NOW()`);
      query += fields.join(', ') + ` WHERE id = ?`;
      values.push(Number(id));
      await connection.execute(query, values);
      return { success: true, message: 'Estado atualizado (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - updateState(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM states WHERE id = ?', [Number(id)]);
      return { success: true, message: 'Estado excluído (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteState(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  // --- Cities ---
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    const connection = await getPool().getConnection();
    try {
        const [parentStateRows] = await connection.query('SELECT uf FROM states WHERE id = ?', [Number(data.stateId)]);
        if ((parentStateRows as RowDataPacket[]).length === 0) return { success: false, message: 'Estado pai não encontrado.' };
        const stateUf = (parentStateRows as RowDataPacket[])[0].uf;
        const slug = slugify(data.name);
        const query = `INSERT INTO cities (name, slug, state_id, state_uf, ibge_code, lot_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`;
        const [result] = await connection.execute(query, [data.name, slug, Number(data.stateId), stateUf, data.ibgeCode || null]);
        return { success: true, message: 'Cidade criada (MySQL)!', cityId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createCity] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const connection = await getPool().getConnection();
    try {
        let queryText = 'SELECT id, name, slug, state_id, state_uf, ibge_code, lot_count, created_at, updated_at FROM cities';
        const values = [];
        if (stateIdFilter) { queryText += ' WHERE state_id = ?'; values.push(Number(stateIdFilter)); }
        queryText += ' ORDER BY name ASC';
        const [rows] = await connection.query(queryText, values);
        return (rows as RowDataPacket[]).map(row => mapToCityInfo(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getCities] Error:`, e); return []; } finally { connection.release(); }
  }
  async getCity(id: string): Promise<CityInfo | null> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT id, name, slug, state_id, state_uf, ibge_code, lot_count, created_at, updated_at FROM cities WHERE id = ?', [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToCityInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getCity(${id})] Error:`, e); return null; } finally { connection.release(); }
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
     const connection = await getPool().getConnection();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let query = 'UPDATE cities SET ';
        if (data.name) { fields.push(`name = ?`); values.push(data.name); fields.push(`slug = ?`); values.push(slugify(data.name)); }
        if (data.stateId) {
            const [parentStateRows] = await connection.query('SELECT uf FROM states WHERE id = ?', [Number(data.stateId)]);
            if ((parentStateRows as RowDataPacket[]).length === 0) return { success: false, message: 'Estado pai não encontrado.' };
            fields.push(`state_id = ?`); values.push(Number(data.stateId));
            fields.push(`state_uf = ?`); values.push((parentStateRows as RowDataPacket[])[0].uf);
        }
        if (data.ibgeCode !== undefined) { fields.push(`ibge_code = ?`); values.push(data.ibgeCode || null); }
        
        if (fields.length === 0) return { success: true, message: "Nenhuma alteração para a cidade."};
        
        fields.push(`updated_at = NOW()`);
        query += fields.join(', ') + ` WHERE id = ?`;
        values.push(Number(id));
        
        await connection.execute(query, values);
        return { success: true, message: 'Cidade atualizada (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - updateCity(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM cities WHERE id = ?', [Number(id)]);
      return { success: true, message: 'Cidade excluída (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteCity(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  // --- Auctioneers ---
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; }> {
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name);
      const query = `
        INSERT INTO auctioneers 
          (name, slug, registration_number, contact_name, email, phone, address, city, state, zip_code, website, logo_url, data_ai_hint_logo, description, member_since, rating, auctions_conducted_count, total_value_sold, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0, 0, ?, NOW(), NOW());
      `;
      const values = [
        data.name, slug, data.registrationNumber || null, data.contactName || null, data.email || null, data.phone || null,
        data.address || null, data.city || null, data.state || null, data.zipCode || null, data.website || null,
        data.logoUrl || null, data.dataAiHintLogo || null, data.description || null, data.userId || null
      ];
      const [result] = await connection.execute(query, values);
      return { success: true, message: 'Leiloeiro criado (MySQL)!', auctioneerId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createAuctioneer] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM auctioneers ORDER BY name ASC;');
      return (rows as RowDataPacket[]).map(row => mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getAuctioneers] Error:`, e); return []; } finally { connection.release(); }
  }

  async getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM auctioneers WHERE id = ?;', [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getAuctioneer(${id})] Error:`, e); return null; } finally { connection.release(); }
  }

  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM auctioneers WHERE slug = ? LIMIT 1;', [slug]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getAuctioneerBySlug(${slug})] Error:`, e); return null; } finally { connection.release(); }
  }

  async updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let query = 'UPDATE auctioneers SET ';

      (Object.keys(data) as Array<keyof AuctioneerFormData>).forEach(key => {
        if (data[key] !== undefined) {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            fields.push(`${sqlColumn} = ?`);
            values.push(data[key] === '' ? null : data[key]);
        }
      });
      if (data.name) { fields.push(`slug = ?`); values.push(slugify(data.name)); }

      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o leiloeiro." };

      fields.push(`updated_at = NOW()`);
      query += fields.join(', ') + ` WHERE id = ?`;
      values.push(Number(id));

      await connection.execute(query, values);
      return { success: true, message: 'Leiloeiro atualizado (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - updateAuctioneer(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async deleteAuctioneer(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM auctioneers WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Leiloeiro excluído (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteAuctioneer(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  // --- Users ---
  async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    const connection = await getPool().getConnection();
    try {
      const queryText = `
        SELECT up.*, r.name as role_name_from_join, r.permissions as role_permissions_from_join
        FROM user_profiles up
        LEFT JOIN roles r ON up.role_id = r.id
        WHERE up.uid = ?`;
      const [rows] = await connection.query(queryText, [userId]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      
      const row = mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]);
      let finalPermissions = row.permissions;
      if (typeof row.permissions === 'string') {
          try { finalPermissions = JSON.parse(row.permissions); } catch { finalPermissions = []; }
      }
      if ((!finalPermissions || finalPermissions.length === 0) && row.rolePermissionsFromJoin) {
          finalPermissions = typeof row.rolePermissionsFromJoin === 'string' ? JSON.parse(row.rolePermissionsFromJoin) : row.rolePermissionsFromJoin || [];
      }

      return mapToUserProfileData(row, {name: row.roleNameFromJoin, permissions: finalPermissions} as Role);

    } catch (e: any) {
      console.error(`[MySqlAdapter - getUserProfileData(${userId})] Error:`, e);
      return null;
    } finally {
      connection.release();
    }
  }

  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      (Object.keys(data) as Array<keyof EditableUserProfileData>).forEach(key => {
        if (data[key] !== undefined) {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            const escapedColumn = sqlColumn === 'number' ? `\`number\`` : sqlColumn;
            fieldsToUpdate.push(`${escapedColumn} = ?`);
            values.push(data[key] === '' ? null : data[key]);
        }
      });
      
      if (fieldsToUpdate.length === 0) {
        return { success: true, message: 'Nenhum dado para atualizar.' };
      }

      fieldsToUpdate.push(`updated_at = NOW()`);
      values.push(userId);

      const queryText = `UPDATE user_profiles SET ${fieldsToUpdate.join(', ')} WHERE uid = ?`;
      await connection.execute(queryText, values);
      return { success: true, message: 'Perfil de usuário atualizado (MySQL)!' };
    } catch (e: any) {
      console.error(`[MySqlAdapter - updateUserProfile(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
    }
  }
  
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      const [existingUserRows] = await connection.query('SELECT * FROM user_profiles WHERE uid = ?', [userId]);
      let userProfileData: UserProfileData;
      let roleToAssign = await this.getRoleByName(targetRoleName);

      if (!roleToAssign) {
        await this.ensureDefaultRolesExist();
        roleToAssign = await this.getRoleByName('USER');
        if (!roleToAssign) {
          await connection.rollback();
          return { success: false, message: `Perfil padrão USER não encontrado e não pôde ser criado.` };
        }
      }
      
      const permissionsToAssign = roleToAssign.permissions || [];

      if ((existingUserRows as RowDataPacket[]).length > 0) {
        const dbUser = mapMySqlRowToCamelCase((existingUserRows as RowDataPacket[])[0]);
        const updateFields: any = {};
        let needsUpdate = false;
        if (String(dbUser.roleId) !== roleToAssign.id) { updateFields.role_id = Number(roleToAssign.id); needsUpdate = true; }
        if (JSON.stringify(dbUser.permissions ? (typeof dbUser.permissions === 'string' ? JSON.parse(dbUser.permissions) : dbUser.permissions) : []) !== JSON.stringify(permissionsToAssign)) {
            updateFields.permissions = JSON.stringify(permissionsToAssign);
            needsUpdate = true;
        }

        if (needsUpdate) {
            updateFields.updated_at = new Date(); // MySQL NOW() will handle this
            const setClauses = Object.keys(updateFields).map(key => `${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`).join(', ');
            await connection.execute(`UPDATE user_profiles SET ${setClauses} WHERE uid = ?`, [...Object.values(updateFields), userId]);
        }
        userProfileData = mapToUserProfileData(dbUser, roleToAssign);
      } else {
        const habilitation = targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS';
        const insertQuery = `
          INSERT INTO user_profiles (uid, email, full_name, role_id, permissions, status, habilitation_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
        `;
        await connection.execute(insertQuery, [userId, email.toLowerCase(), fullName, Number(roleToAssign.id), JSON.stringify(permissionsToAssign), 'ATIVO', habilitation]);
        const [newRows] = await connection.query('SELECT * FROM user_profiles WHERE uid = ?', [userId]);
        userProfileData = mapToUserProfileData(mapMySqlRowToCamelCase((newRows as RowDataPacket[])[0]), roleToAssign);
      }
      await connection.commit();
      return { success: true, message: 'Perfil de usuário assegurado/atualizado (MySQL).', userProfile: userProfileData };
    } catch (e: any) {
      await connection.rollback();
      console.error(`[MySqlAdapter - ensureUserRole(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
    }
  }

  async getUsersWithRoles(): Promise<UserProfileData[]> {
    const connection = await getPool().getConnection();
    try {
      const query = `
        SELECT up.*, r.name as role_name_from_join, r.permissions as role_permissions_from_join 
        FROM user_profiles up 
        LEFT JOIN roles r ON up.role_id = r.id 
        ORDER BY up.full_name ASC;
      `;
      const [rows] = await connection.query(query);
      return (rows as RowDataPacket[]).map(row => {
        const mappedRow = mapMySqlRowToCamelCase(row);
        let finalPermissions = mappedRow.permissions;
         if (typeof mappedRow.permissions === 'string') {
            try { finalPermissions = JSON.parse(mappedRow.permissions); } catch { finalPermissions = []; }
        }
        if ((!finalPermissions || finalPermissions.length === 0) && mappedRow.rolePermissionsFromJoin) {
            finalPermissions = typeof mappedRow.rolePermissionsFromJoin === 'string' ? JSON.parse(mappedRow.rolePermissionsFromJoin) : mappedRow.rolePermissionsFromJoin || [];
        }
        return mapToUserProfileData(mappedRow, { name: mappedRow.roleNameFromJoin, permissions: finalPermissions } as Role);
      });
    } catch (e: any) {
      console.error(`[MySqlAdapter - getUsersWithRoles] Error:`, e);
      return [];
    } finally {
      connection.release();
    }
  }

  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      let newRoleIdInt: number | null = null;
      let newPermissions: string[] = [];
      if (roleId && roleId !== "---NONE---") {
        const role = await this.getRole(roleId); // Uses its own connection
        if (!role) return { success: false, message: "Perfil não encontrado." };
        newRoleIdInt = Number(role.id); // SQL ID is number
        newPermissions = role.permissions || [];
      }
      
      await connection.execute(
        'UPDATE user_profiles SET role_id = ?, permissions = ?, updated_at = NOW() WHERE uid = ?',
        [newRoleIdInt, JSON.stringify(newPermissions), userId]
      );
      return { success: true, message: 'Perfil do usuário atualizado (MySQL)!' };
    } catch (e: any) {
      console.error(`[MySqlAdapter - updateUserRole(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
    }
  }

  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM user_profiles WHERE uid = ?', [userId]);
      return { success: true, message: 'Perfil de usuário excluído do DB (MySQL)!' };
    } catch (e: any) {
      console.error(`[MySqlAdapter - deleteUserProfile(${userId})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
    }
  }

  // --- Roles ---
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    const connection = await getPool().getConnection();
    try {
      const normalizedName = data.name.trim().toUpperCase();
      const [existingRows] = await connection.query('SELECT id FROM roles WHERE name_normalized = ? LIMIT 1', [normalizedName]);
      if ((existingRows as RowDataPacket[]).length > 0) {
        return { success: false, message: `Perfil "${data.name}" já existe (MySQL).`};
      }
      const validPermissions = JSON.stringify((data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)));
      const query = `
        INSERT INTO roles (name, name_normalized, description, permissions, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW());
      `;
      const [result] = await connection.execute(query, [data.name.trim(), normalizedName, data.description || null, validPermissions]);
      return { success: true, message: 'Perfil criado (MySQL)!', roleId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) {
      console.error(`[MySqlAdapter - createRole] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
    }
  }

  async getRoles(): Promise<Role[]> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM roles ORDER BY name ASC;');
      return (rows as RowDataPacket[]).map(row => mapToRole(mapMySqlRowToCamelCase(row)));
    } catch (e: any) {
      console.error(`[MySqlAdapter - getRoles] Error:`, e);
      return [];
    } finally {
      connection.release();
    }
  }

  async getRole(id: string): Promise<Role | null> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM roles WHERE id = ?', [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToRole(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) {
      console.error(`[MySqlAdapter - getRole(${id})] Error:`, e);
      return null;
    } finally {
      connection.release();
    }
  }

  async getRoleByName(name: string): Promise<Role | null> {
    const connection = await getPool().getConnection();
    try {
      const normalizedName = name.trim().toUpperCase();
      const [rows] = await connection.query('SELECT * FROM roles WHERE name_normalized = ? LIMIT 1', [normalizedName]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToRole(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) {
      console.error(`[MySqlAdapter - getRoleByName(${name})] Error:`, e);
      return null;
    } finally {
      connection.release();
    }
  }
  
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const currentRole = await this.getRole(id); // This uses its own connection
      if (!currentRole) return { success: false, message: 'Perfil não encontrado.' };

      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      if (data.name && data.name.trim() !== currentRole.name) {
        const normalizedName = data.name.trim().toUpperCase();
        if (currentRole.name_normalized !== 'ADMINISTRATOR' && currentRole.name_normalized !== 'USER') {
            const [existingRows] = await connection.query('SELECT id FROM roles WHERE name_normalized = ? AND id != ? LIMIT 1', [normalizedName, Number(id)]);
            if ((existingRows as RowDataPacket[]).length > 0) return { success: false, message: `Perfil com nome "${data.name}" já existe.`};
            fieldsToUpdate.push(`name_normalized = ?`); values.push(normalizedName);
        }
        fieldsToUpdate.push(`name = ?`); values.push(data.name.trim());
      }
      if (data.description !== undefined && data.description !== currentRole.description) {
        fieldsToUpdate.push(`description = ?`); values.push(data.description || null);
      }
      if (data.permissions !== undefined && JSON.stringify((data.permissions || []).sort()) !== JSON.stringify((currentRole.permissions || []).sort())) {
        fieldsToUpdate.push(`permissions = ?`);
        values.push(JSON.stringify((data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p))));
      }
      
      if (fieldsToUpdate.length === 0) {
        return { success: true, message: 'Nenhum dado para atualizar no perfil (MySQL).' };
      }

      fieldsToUpdate.push(`updated_at = NOW()`);
      values.push(Number(id));
      const queryText = `UPDATE roles SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
      
      await connection.execute(queryText, values);
      return { success: true, message: 'Perfil atualizado (MySQL)!' };
    } catch (e: any) {
      console.error(`[MySqlAdapter - updateRole(${id})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
    }
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const role = await this.getRole(id); // This uses its own connection
      if (role && (role.name_normalized === 'ADMINISTRATOR' || role.name_normalized === 'USER')) {
        return { success: false, message: 'Perfis de sistema não podem ser excluídos.' };
      }
      await connection.execute('DELETE FROM roles WHERE id = ?', [Number(id)]);
      return { success: true, message: 'Perfil excluído (MySQL)!' };
    } catch (e: any) {
      console.error(`[MySqlAdapter - deleteRole(${id})] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
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
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      for (const roleData of defaultRolesData) {
        const normalizedName = roleData.name.trim().toUpperCase();
        const [existingRows] = await connection.query('SELECT * FROM roles WHERE name_normalized = ? LIMIT 1', [normalizedName]);
        
        if ((existingRows as RowDataPacket[]).length === 0) {
          const validPermissions = JSON.stringify((roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)));
          const query = `
            INSERT INTO roles (name, name_normalized, description, permissions, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW());
          `;
          await connection.execute(query, [roleData.name.trim(), normalizedName, roleData.description || null, validPermissions]);
        } else {
          const role = mapToRole(mapMySqlRowToCamelCase((existingRows as RowDataPacket[])[0]));
          const currentPermissionsSorted = [...(role.permissions || [])].sort();
          const expectedPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p)).sort();
          if (JSON.stringify(currentPermissionsSorted) !== JSON.stringify(expectedPermissions) || role.description !== (roleData.description || null)) {
            const updateQuery = `UPDATE roles SET description = ?, permissions = ?, updated_at = NOW() WHERE id = ?`;
            await connection.execute(updateQuery, [roleData.description || null, JSON.stringify(expectedPermissions), Number(role.id)]);
          }
        }
      }
      await connection.commit();
      return { success: true, message: 'Perfis padrão verificados/criados (MySQL).'};
    } catch (e: any) {
      await connection.rollback();
      console.error(`[MySqlAdapter - ensureDefaultRolesExist] Error:`, e);
      return { success: false, message: e.message };
    } finally {
      connection.release();
    }
  }

  // --- Sellers (Scaffold) ---
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> { console.warn("MySqlAdapter.createSeller not implemented."); return {success: false, message: "Not implemented"}; }
  async getSellers(): Promise<SellerProfileInfo[]> { console.warn("MySqlAdapter.getSellers not implemented."); return []; }
  async getSeller(id: string): Promise<SellerProfileInfo | null> { console.warn("MySqlAdapter.getSeller not implemented."); return null; }
  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> { console.warn("MySqlAdapter.getSellerBySlug not implemented."); return null; }
  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateSeller not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteSeller not implemented."); return {success: false, message: "Not implemented"}; }

  // --- Auctions (Scaffold) ---
  async createAuction(data: AuctionFormData): Promise<{ success: boolean; message: string; auctionId?: string; }> { console.warn("MySqlAdapter.createAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async getAuctions(): Promise<Auction[]> { console.warn("MySqlAdapter.getAuctions not implemented."); return []; }
  async getAuction(id: string): Promise<Auction | null> { console.warn("MySqlAdapter.getAuction not implemented."); return null; }
  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> { console.warn("MySqlAdapter.getAuctionsBySellerSlug not implemented."); return [];}
  async updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateAuction not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteAuction not implemented."); return {success: false, message: "Not implemented"}; }

  // --- Lots (Scaffold) ---
  async createLot(data: LotFormData): Promise<{ success: boolean; message: string; lotId?: string; }> { console.warn("MySqlAdapter.createLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getLots(auctionIdParam?: string): Promise<Lot[]> { console.warn("MySqlAdapter.getLots not implemented."); return []; }
  async getLot(id: string): Promise<Lot | null> { console.warn("MySqlAdapter.getLot not implemented."); return null; }
  async updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateLot not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteLot not implemented."); return {success: false, message: "Not implemented"}; }
  async getBidsForLot(lotId: string): Promise<BidInfo[]> { console.warn("MySqlAdapter.getBidsForLot not implemented."); return []; }
  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> { console.warn("MySqlAdapter.placeBidOnLot not implemented."); return {success: false, message: "Not implemented"}; }
  
  // --- Media Items (Scaffold) ---
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { console.warn("MySqlAdapter.createMediaItem not implemented."); return {success: false, message: "Not implemented"}; }
  async getMediaItems(): Promise<MediaItem[]> { console.warn("MySqlAdapter.getMediaItems not implemented."); return []; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updateMediaItemMetadata not implemented."); return {success: false, message: "Not implemented"}; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.deleteMediaItemFromDb not implemented."); return {success: false, message: "Not implemented"}; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.linkMediaItemsToLot not implemented."); return {success: false, message: "Not implemented"}; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.unlinkMediaItemFromLot not implemented."); return {success: false, message: "Not implemented"}; }
  
  // Settings
  async getPlatformSettings(): Promise<PlatformSettings> { console.warn("MySqlAdapter.getPlatformSettings not implemented."); return { id: 'global', galleryImageBasePath: '/mysql/default/path/', updatedAt: new Date() };}
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> { console.warn("MySqlAdapter.updatePlatformSettings not implemented."); return {success: false, message: "Not implemented"}; }
}
    

    

    


