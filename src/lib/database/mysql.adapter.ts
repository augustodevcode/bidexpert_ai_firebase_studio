// src/lib/database/mysql.adapter.ts
import mysql, { type RowDataPacket, type Pool } from 'mysql2/promise';
import type {
  IDatabaseAdapter,
  LotCategory, StateInfo, StateFormData,
  CityInfo, CityFormData,
  AuctioneerProfileInfo, AuctioneerFormData,
  SellerProfileInfo, SellerFormData,
  Auction, AuctionFormData, AuctionDbData,
  Lot, LotFormData, LotDbData,
  BidInfo,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData, Theme
} from '@/types';
import { slugify } from '@/lib/sample-data';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import { v4 as uuidv4 } from 'uuid'; // For generating public IDs

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
        dateStrings: true,
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
        publicId: row.publicId,
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

function mapToSellerProfileInfo(row: RowDataPacket): SellerProfileInfo {
    return {
        id: String(row.id),
        publicId: row.publicId,
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
        password: row.passwordText,
        roleId: row.roleId ? String(row.roleId) : undefined,
        roleName: role?.name || row.roleName,
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
        optInMarketing: Boolean(row.optInMarketing),
        avatarUrl: row.avatarUrl,
        dataAiHint: row.dataAiHint,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
    return profile;
}

function mapToAuction(row: RowDataPacket): Auction {
    return {
        id: String(row.id),
        publicId: row.publicId,
        title: row.title,
        fullTitle: row.fullTitle,
        description: row.description,
        status: row.status as AuctionStatus,
        auctionType: row.auctionType,
        category: row.categoryName,
        categoryId: row.categoryId ? String(row.categoryId) : undefined,
        auctioneer: row.auctioneerName,
        auctioneerId: row.auctioneerId ? String(row.auctioneerId) : undefined,
        seller: row.sellerName,
        sellerId: row.sellerId ? String(row.sellerId) : undefined,
        auctionDate: new Date(row.auctionDate),
        endDate: row.endDate ? new Date(row.endDate) : null,
        auctionStages: row.auctionStages ? JSON.parse(row.auctionStages) : [],
        city: row.city,
        state: row.state,
        imageUrl: row.imageUrl,
        dataAiHint: row.dataAiHint,
        documentsUrl: row.documentsUrl,
        totalLots: Number(row.totalLots || 0),
        visits: Number(row.visits || 0),
        initialOffer: row.initialOffer !== null ? Number(row.initialOffer) : undefined,
        isFavorite: Boolean(row.isFavorite),
        currentBid: row.currentBid !== null ? Number(row.currentBid) : undefined,
        bidsCount: Number(row.bidsCount || 0),
        sellingBranch: row.sellingBranch,
        vehicleLocation: row.vehicleLocation,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        auctioneerLogoUrl: row.auctioneerLogoUrl,
        lots: []
    };
}

function mapToLot(row: RowDataPacket): Lot {
  return {
    id: String(row.id),
    publicId: row.publicId,
    auctionId: String(row.auctionId),
    title: row.title,
    number: row.number,
    imageUrl: row.imageUrl,
    dataAiHint: row.dataAiHint,
    galleryImageUrls: row.galleryImageUrls ? JSON.parse(row.galleryImageUrls) : [],
    mediaItemIds: row.mediaItemIds ? JSON.parse(row.mediaItemIds) : [],
    status: row.status as LotStatus,
    stateId: row.stateId ? String(row.stateId) : undefined,
    cityId: row.cityId ? String(row.cityId) : undefined,
    cityName: row.cityName,
    stateUf: row.stateUf,
    type: row.categoryName,
    categoryId: row.categoryId ? String(row.categoryId) : undefined,
    views: Number(row.views || 0),
    auctionName: row.auctionName,
    price: Number(row.price),
    initialPrice: row.initialPrice !== null ? Number(row.initialPrice) : undefined,
    lotSpecificAuctionDate: row.lotSpecificAuctionDate ? new Date(row.lotSpecificAuctionDate) : null,
    secondAuctionDate: row.secondAuctionDate ? new Date(row.secondAuctionDate) : null,
    secondInitialPrice: row.secondInitialPrice !== null ? Number(row.secondInitialPrice) : undefined,
    endDate: new Date(row.endDate),
    bidsCount: Number(row.bidsCount || 0),
    isFavorite: Boolean(row.isFavorite),
    isFeatured: Boolean(row.isFeatured),
    description: row.description,
    year: row.year !== null ? Number(row.year) : undefined,
    make: row.make,
    model: row.model,
    series: row.series,
    stockNumber: row.stockNumber,
    sellingBranch: row.sellingBranch,
    vin: row.vin,
    vinStatus: row.vinStatus,
    lossType: row.lossType,
    primaryDamage: row.primaryDamage,
    titleInfo: row.titleInfo,
    titleBrand: row.titleBrand,
    startCode: row.startCode,
    hasKey: Boolean(row.hasKey),
    odometer: row.odometer,
    airbagsStatus: row.airbagsStatus,
    bodyStyle: row.bodyStyle,
    engineDetails: row.engineDetails,
    transmissionType: row.transmissionType,
    driveLineType: row.driveLineType,
    fuelType: row.fuelType,
    cylinders: row.cylinders,
    restraintSystem: row.restraintSystem,
    exteriorInteriorColor: row.exteriorInteriorColor,
    options: row.options,
    manufacturedIn: row.manufacturedIn,
    vehicleClass: row.vehicleClass,
    vehicleLocationInBranch: row.vehicleLocationInBranch,
    laneRunNumber: row.laneRunNumber,
    aisleStall: row.aisleStall,
    actualCashValue: row.actualCashValue,
    estimatedRepairCost: row.estimatedRepairCost,
    sellerName: row.lotSellerName,
    sellerId: row.sellerIdFk ? String(row.sellerIdFk) : undefined,
    auctioneerName: row.lotAuctioneerName,
    auctioneerId: row.auctioneerIdFk ? String(row.auctioneerIdFk) : undefined,
    condition: row.condition,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToBidInfo(row: RowDataPacket): BidInfo {
    return {
        id: String(row.id),
        lotId: String(row.lotId),
        auctionId: String(row.auctionId),
        bidderId: row.bidderId,
        bidderDisplay: row.bidderDisplayName,
        amount: parseFloat(row.amount),
        timestamp: new Date(row.timestamp),
    };
}

function mapToMediaItem(row: RowDataPacket): MediaItem {
  return {
    id: String(row.id),
    fileName: row.fileName,
    uploadedAt: new Date(row.uploadedAt),
    uploadedBy: row.uploadedBy,
    title: row.title,
    altText: row.altText,
    caption: row.caption,
    description: row.description,
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    dimensions: row.dimensionsWidth && row.dimensionsHeight ? { width: Number(row.dimensionsWidth), height: Number(row.dimensionsHeight) } : undefined,
    urlOriginal: row.urlOriginal,
    urlThumbnail: row.urlThumbnail,
    urlMedium: row.urlMedium,
    urlLarge: row.urlLarge,
    linkedLotIds: row.linkedLotIds ? JSON.parse(row.linkedLotIds) : [],
    dataAiHint: row.dataAiHint,
  };
}

function mapToPlatformSettings(row: RowDataPacket): PlatformSettings {
    return {
        id: String(row.id),
        galleryImageBasePath: row.galleryImageBasePath,
        themes: typeof settingsRow.themes === 'string' ? (() => {
    try {
        return JSON.parse(settingsRow.themes);
    } catch (e) {
        console.error('[MySqlAdapter - getPlatformSettings] Error parsing themes JSON:', e);
        return [];
    }
})() : (settingsRow.themes || []),
        platformPublicIdMasks: typeof settingsRow.platformPublicIdMasks === 'string' ? (() => {
    try {
        return JSON.parse(settingsRow.platformPublicIdMasks);
    } catch (e) {
        console.error('[MySqlAdapter - getPlatformSettings] Error parsing platformPublicIdMasks JSON:', e);
        return {};
    }
})() : (settingsRow.platformPublicIdMasks || {}),
        updatedAt: new Date(row.updatedAt)
    };
}


const defaultRolesData: RoleFormData[] = [
  { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
  { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
  { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
  { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
  { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
];

export class MySqlAdapter implements IDatabaseAdapter {
  constructor() {
    getPool();
  }

  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[]; rolesProcessed?: number }> {
    const connection = await getPool().getConnection();
    const errors: any[] = [];
    console.log('[MySqlAdapter] Iniciando criação/verificação de tabelas...');

    const queries = [
      `SET FOREIGN_KEY_CHECKS = 0;`,
      `DROP TABLE IF EXISTS bids;`,
      `DROP TABLE IF EXISTS media_items;`,
      `DROP TABLE IF EXISTS lots;`,
      `DROP TABLE IF EXISTS auctions;`,
      `DROP TABLE IF EXISTS cities;`,
      `DROP TABLE IF EXISTS sellers;`,
      `DROP TABLE IF EXISTS auctioneers;`,
      `DROP TABLE IF EXISTS users;`,
      `DROP TABLE IF EXISTS states;`,
      `DROP TABLE IF EXISTS lot_categories;`,
      `DROP TABLE IF EXISTS roles;`,
      `DROP TABLE IF EXISTS platform_settings;`,

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

      `CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        password_text VARCHAR(255) NULL,
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
        number VARCHAR(20),
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
        INDEX idx_users_email (email),
        INDEX idx_users_role_id (role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
        gallery_image_base_path TEXT NOT NULL,
        themes JSON,
        platform_public_id_masks JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lot_categories (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        name VARCHAR(255) NOT NULL,\n        slug VARCHAR(255) NOT NULL UNIQUE,\n        description TEXT,\n        item_count INT UNSIGNED DEFAULT 0,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        INDEX idx_lot_categories_slug (slug)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS states (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        name VARCHAR(100) NOT NULL,\n        uf VARCHAR(2) NOT NULL UNIQUE,\n        slug VARCHAR(100) NOT NULL UNIQUE,\n        city_count INT UNSIGNED DEFAULT 0,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        INDEX idx_states_slug (slug),\n        INDEX idx_states_uf (uf)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS cities (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        name VARCHAR(150) NOT NULL,\n        slug VARCHAR(150) NOT NULL,\n        state_id INT UNSIGNED,\n        state_uf VARCHAR(2),\n        ibge_code VARCHAR(10) UNIQUE,\n        lot_count INT UNSIGNED DEFAULT 0,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,\n        UNIQUE KEY \`unique_city_in_state\` (\`slug\`, \`state_id\`),\n        INDEX idx_cities_state_id (state_id),\n        INDEX idx_cities_slug_state_id (slug, state_id)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS auctioneers (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        public_id VARCHAR(100) NOT NULL UNIQUE,\n        name VARCHAR(255) NOT NULL,\n        slug VARCHAR(255) NOT NULL UNIQUE,\n        registration_number VARCHAR(100),\n        contact_name VARCHAR(255),\n        email VARCHAR(255) UNIQUE,\n        phone VARCHAR(50),\n        address TEXT,\n        city VARCHAR(100),\n        state VARCHAR(100),\n        zip_code VARCHAR(20),\n        website TEXT,\n        logo_url TEXT,\n        data_ai_hint_logo TEXT,\n        description TEXT,\n        member_since TIMESTAMP NULL,\n        rating DECIMAL(3,1),\n        auctions_conducted_count INT UNSIGNED DEFAULT 0,\n        total_value_sold DECIMAL(15,2) DEFAULT 0.00,\n        user_id VARCHAR(255),\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        INDEX idx_auctioneers_slug (slug),\n        INDEX idx_auctioneers_public_id (public_id)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS sellers (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        public_id VARCHAR(100) NOT NULL UNIQUE,\n        name VARCHAR(255) NOT NULL,\n        slug VARCHAR(255) NOT NULL UNIQUE,\n        contact_name VARCHAR(255),\n        email VARCHAR(255) UNIQUE,\n        phone VARCHAR(50),\n        address TEXT,\n        city VARCHAR(100),\n        state VARCHAR(100),\n        zip_code VARCHAR(20),\n        website TEXT,\n        logo_url TEXT,\n        data_ai_hint_logo TEXT,\n        description TEXT,\n        member_since TIMESTAMP NULL,\n        rating DECIMAL(3,1),\n        active_lots_count INT UNSIGNED DEFAULT 0,\n        total_sales_value DECIMAL(15,2) DEFAULT 0.00,\n        auctions_facilitated_count INT UNSIGNED DEFAULT 0,\n        user_id VARCHAR(255),\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        INDEX idx_sellers_slug (slug),\n        INDEX idx_sellers_public_id (public_id)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS auctions (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        public_id VARCHAR(100) NOT NULL UNIQUE,\n        title VARCHAR(255) NOT NULL,\n        full_title TEXT,\n        description TEXT,\n        status VARCHAR(50) NOT NULL,\n        auction_type VARCHAR(50),\n        category_id INT UNSIGNED,\n        auctioneer_id INT UNSIGNED,\n        seller_id INT UNSIGNED,\n        auction_date DATETIME NOT NULL,\n        end_date DATETIME NULL,\n        auction_stages JSON,\n        city VARCHAR(100),\n        state VARCHAR(2),\n        image_url TEXT,\n        data_ai_hint TEXT,\n        documents_url TEXT,\n        total_lots INT UNSIGNED DEFAULT 0,\n        visits INT UNSIGNED DEFAULT 0,\n        initial_offer DECIMAL(15,2),\n        is_favorite BOOLEAN DEFAULT FALSE,\n        current_bid DECIMAL(15,2),\n        bids_count INT UNSIGNED DEFAULT 0,\n        selling_branch VARCHAR(100),\n        vehicle_location VARCHAR(255),\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        FOREIGN KEY (category_id) REFERENCES lot_categories(id) ON DELETE SET NULL,\n        FOREIGN KEY (auctioneer_id) REFERENCES auctioneers(id) ON DELETE SET NULL,\n        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,\n        INDEX idx_auctions_public_id (public_id),\n        INDEX idx_auctions_status (status),\n        INDEX idx_auctions_auction_date (auction_date),\n        INDEX idx_auctions_category_id (category_id),\n        INDEX idx_auctions_auctioneer_id (auctioneer_id),\n        INDEX idx_auctions_seller_id (seller_id)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lots (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        public_id VARCHAR(100) NOT NULL UNIQUE,\n        auction_id INT UNSIGNED NOT NULL,\n        title VARCHAR(255) NOT NULL,\n        \`number\` VARCHAR(50),\n        image_url TEXT,\n        data_ai_hint TEXT,\n        gallery_image_urls JSON,\n        media_item_ids JSON,\n        status VARCHAR(50) NOT NULL,\n        state_id INT UNSIGNED,\n        city_id INT UNSIGNED,\n        category_id INT UNSIGNED,\n        views INT UNSIGNED DEFAULT 0,\n        price DECIMAL(15,2) NOT NULL,\n        initial_price DECIMAL(15,2),\n        lot_specific_auction_date DATETIME NULL,\n        second_auction_date DATETIME NULL,\n        second_initial_price DECIMAL(15,2),\n        end_date DATETIME NOT NULL,\n        bids_count INT UNSIGNED DEFAULT 0,\n        is_favorite BOOLEAN DEFAULT FALSE,\n        is_featured BOOLEAN DEFAULT FALSE,\n        description TEXT,\n        year INT,\n        make VARCHAR(100),\n        model VARCHAR(100),\n        series VARCHAR(100),\n        stock_number VARCHAR(100),\n        selling_branch VARCHAR(100),\n        vin VARCHAR(100),\n        vin_status VARCHAR(50),\n        loss_type VARCHAR(100),\n        primary_damage VARCHAR(100),\n        title_info VARCHAR(100),\n        title_brand VARCHAR(100),\n        start_code VARCHAR(100),\n        has_key BOOLEAN,\n        odometer VARCHAR(50),\n        airbags_status VARCHAR(100),\n        body_style VARCHAR(100),\n        engine_details TEXT,\n        transmission_type VARCHAR(100),\n        drive_line_type VARCHAR(50),\n        fuel_type VARCHAR(50),\n        cylinders VARCHAR(20),\n        restraint_system VARCHAR(255),\n        exterior_interior_color VARCHAR(100),\n        options TEXT,\n        manufactured_in VARCHAR(100),\n        vehicle_class VARCHAR(100),\n        vehicle_location_in_branch VARCHAR(255),\n        lane_run_number VARCHAR(50),\n        aisle_stall VARCHAR(50),\n        actual_cash_value VARCHAR(50),\n        estimated_repair_cost VARCHAR(50),\n        seller_id_fk INT UNSIGNED,\n        auctioneer_id_fk INT UNSIGNED,\n        \`condition\` TEXT,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,\n        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,\n        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,\n        FOREIGN KEY (category_id) REFERENCES lot_categories(id) ON DELETE SET NULL,\n        FOREIGN KEY (seller_id_fk) REFERENCES sellers(id) ON DELETE SET NULL,\n        FOREIGN KEY (auctioneer_id_fk) REFERENCES auctioneers(id) ON DELETE SET NULL,\n        INDEX idx_lots_public_id (public_id),\n        INDEX idx_lots_auction_id (auction_id),\n        INDEX idx_lots_status (status),\n        INDEX idx_lots_category_id (category_id)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS media_items (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        file_name VARCHAR(255) NOT NULL,\n        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        uploaded_by VARCHAR(255),\n        title TEXT,\n        alt_text TEXT,\n        caption TEXT,\n        description TEXT,\n        mime_type VARCHAR(100) NOT NULL,\n        size_bytes BIGINT NOT NULL,\n        dimensions_width INT,\n        dimensions_height INT,\n        url_original TEXT NOT NULL,\n        url_thumbnail TEXT,\n        url_medium TEXT,\n        url_large TEXT,\n        linked_lot_ids JSON,\n        data_ai_hint TEXT,\n        INDEX idx_media_items_uploaded_by (uploaded_by),\n        INDEX idx_media_items_mime_type (mime_type)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS bids (\n        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n        lot_id INT UNSIGNED NOT NULL,\n        auction_id INT UNSIGNED NOT NULL,\n        bidder_id VARCHAR(255) NOT NULL,\n        bidder_display_name VARCHAR(255),\n        amount DECIMAL(15,2) NOT NULL,\n        \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,\n        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,\n        FOREIGN KEY (bidder_id) REFERENCES users(uid) ON DELETE CASCADE,\n        INDEX idx_bids_lot_id (lot_id),\n        INDEX idx_bids_bidder_id (bidder_id)\n      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `SET FOREIGN_KEY_CHECKS = 1;`
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
          }\
        } catch (tableError: any) {\n          console.warn(`[MySqlAdapter] Aviso ao executar query: ${tableError.message}. Query: ${query.substring(0,100)}...`);\n           if (query.includes(\'platform_settings\') && tableError.code === \'ER_PARSE_ERROR\') {\n             errors.push(new Error(`Erro de sint