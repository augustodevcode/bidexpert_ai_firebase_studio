
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

  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[] }> {
    const connection = await getPool().getConnection();
    const errors: any[] = [];
    console.log('[MySqlAdapter] Iniciando criação/verificação de tabelas...');
    
    const queries = [
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
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
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
        auction_date DATETIME NOT NULL,
        end_date DATETIME NULL,
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
        category_id INT UNSIGNED,
        views INT UNSIGNED DEFAULT 0,
        price DECIMAL(15,2) NOT NULL,
        initial_price DECIMAL(15,2),
        lot_specific_auction_date DATETIME NULL,
        second_auction_date DATETIME NULL,
        second_initial_price DECIMAL(15,2),
        end_date DATETIME NOT NULL,
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
        seller_id_fk INT UNSIGNED, 
        auctioneer_id_fk INT UNSIGNED, 
        \`condition\` TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES lot_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id_fk) REFERENCES sellers(id) ON DELETE SET NULL,
        FOREIGN KEY (auctioneer_id_fk) REFERENCES auctioneers(id) ON DELETE SET NULL,
        INDEX idx_lots_auction_id (auction_id),
        INDEX idx_lots_status (status),
        INDEX idx_lots_category_id (category_id)
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
  
  // --- Sellers ---
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name);
      const query = `
        INSERT INTO sellers 
          (name, slug, contact_name, email, phone, address, city, state, zip_code, website, logo_url, data_ai_hint_logo, description, member_since, rating, active_lots_count, total_sales_value, auctions_facilitated_count, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0, 0, 0, ?, NOW(), NOW());
      `;
      const values = [
        data.name, slug, data.contactName || null, data.email || null, data.phone || null,
        data.address || null, data.city || null, data.state || null, data.zipCode || null, data.website || null,
        data.logoUrl || null, data.dataAiHintLogo || null, data.description || null, data.userId || null
      ];
      const [result] = await connection.execute(query, values);
      return { success: true, message: 'Comitente criado (MySQL)!', sellerId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createSeller] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async getSellers(): Promise<SellerProfileInfo[]> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM sellers ORDER BY name ASC;');
      return (rows as RowDataPacket[]).map(row => mapToSellerProfileInfo(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getSellers] Error:`, e); return []; } finally { connection.release(); }
  }

  async getSeller(id: string): Promise<SellerProfileInfo | null> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM sellers WHERE id = ?;', [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToSellerProfileInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getSeller(${id})] Error:`, e); return null; } finally { connection.release(); }
  }

  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM sellers WHERE slug = ? LIMIT 1;', [slug]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToSellerProfileInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getSellerBySlug(${slug})] Error:`, e); return null; } finally { connection.release(); }
  }

  async updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let query = 'UPDATE sellers SET ';

      (Object.keys(data) as Array<keyof SellerFormData>).forEach(key => {
        if (data[key] !== undefined) {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            fields.push(`${sqlColumn} = ?`);
            values.push(data[key] === '' ? null : data[key]);
        }
      });
      if (data.name) { fields.push(`slug = ?`); values.push(slugify(data.name)); }

      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o comitente." };

      fields.push(`updated_at = NOW()`);
      query += fields.join(', ') + ` WHERE id = ?`;
      values.push(Number(id));

      await connection.execute(query, values);
      return { success: true, message: 'Comitente atualizado (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - updateSeller(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM sellers WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Comitente excluído (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteSeller(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }


  // --- Auctions ---
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    const connection = await getPool().getConnection();
    try {
      const query = `
        INSERT INTO auctions 
          (title, full_title, description, status, auction_type, category_id, auctioneer_id, seller_id, auction_date, end_date, auction_stages, city, state, image_url, data_ai_hint, documents_url, total_lots, visits, initial_offer, selling_branch, vehicle_location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, NOW(), NOW());
      `;
      const values = [
        data.title, data.fullTitle || null, data.description || null, data.status, data.auctionType || null,
        data.categoryId ? Number(data.categoryId) : null, 
        data.auctioneerId ? Number(data.auctioneerId) : null, 
        data.sellerId ? Number(data.sellerId) : null,
        data.auctionDate, data.endDate || null, data.auctionStages ? JSON.stringify(data.auctionStages) : null,
        data.city || null, data.state || null, data.imageUrl || null, data.dataAiHint || null, data.documentsUrl || null,
        data.initialOffer || null, data.sellingBranch || null, data.vehicleLocation || null
      ];
      const [result] = await connection.execute(query, values);
      return { success: true, message: 'Leilão criado (MySQL)!', auctionId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createAuction] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  
  async getAuctions(): Promise<Auction[]> {
    const connection = await getPool().getConnection();
    try {
      const query = `
        SELECT a.*, lc.name as category_name, act.name as auctioneer_name, s.name as seller_name, act.logo_url as auctioneer_logo_url
        FROM auctions a
        LEFT JOIN lot_categories lc ON a.category_id = lc.id
        LEFT JOIN auctioneers act ON a.auctioneer_id = act.id
        LEFT JOIN sellers s ON a.seller_id = s.id
        ORDER BY a.auction_date DESC;
      `;
      const [rows] = await connection.query(query);
      return (rows as RowDataPacket[]).map(row => mapToAuction(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getAuctions] Error:`, e); return []; } finally { connection.release(); }
  }

  async getAuction(id: string): Promise<Auction | null> {
    const connection = await getPool().getConnection();
    try {
      const query = `
        SELECT a.*, lc.name as category_name, act.name as auctioneer_name, s.name as seller_name, act.logo_url as auctioneer_logo_url
        FROM auctions a
        LEFT JOIN lot_categories lc ON a.category_id = lc.id
        LEFT JOIN auctioneers act ON a.auctioneer_id = act.id
        LEFT JOIN sellers s ON a.seller_id = s.id
        WHERE a.id = ?;
      `;
      const [rows] = await connection.query(query, [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToAuction(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getAuction(${id})] Error:`, e); return null; } finally { connection.release(); }
  }

  async getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> {
    const connection = await getPool().getConnection();
    try {
        const [sellerRows] = await connection.query('SELECT id, name FROM sellers WHERE slug = ? LIMIT 1', [sellerSlug]);
        if ((sellerRows as RowDataPacket[]).length === 0) return [];
        const sellerId = (sellerRows as RowDataPacket[])[0].id;
        const sellerName = (sellerRows as RowDataPacket[])[0].name;

        const query = `
            SELECT a.*, lc.name as category_name, act.name as auctioneer_name, ? as seller_name, act.logo_url as auctioneer_logo_url
            FROM auctions a
            LEFT JOIN lot_categories lc ON a.category_id = lc.id
            LEFT JOIN auctioneers act ON a.auctioneer_id = act.id
            WHERE a.seller_id = ?
            ORDER BY a.auction_date DESC;
        `;
        const [rows] = await connection.query(query, [sellerName, sellerId]);
        return (rows as RowDataPacket[]).map(row => mapToAuction(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getAuctionsBySellerSlug(${sellerSlug})] Error:`, e); return []; } finally { connection.release(); }
  }

  async updateAuction(id: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let query = 'UPDATE auctions SET ';

      (Object.keys(data) as Array<keyof AuctionDbData>).forEach(key => {
        if (data[key] !== undefined && key !== 'auctionDate' && key !== 'endDate' && key !== 'auctionStages') {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            fields.push(`${sqlColumn} = ?`);
            values.push(data[key] === '' || data[key] === null ? null : data[key]);
        }
      });
      if (data.auctionDate) { fields.push(`auction_date = ?`); values.push(data.auctionDate); }
      if (data.hasOwnProperty('endDate')) { fields.push(`end_date = ?`); values.push(data.endDate); } 
      if (data.auctionStages) { fields.push(`auction_stages = ?`); values.push(JSON.stringify(data.auctionStages)); }


      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o leilão." };

      fields.push(`updated_at = NOW()`);
      query += fields.join(', ') + ` WHERE id = ?`;
      values.push(Number(id));

      await connection.execute(query, values);
      return { success: true, message: 'Leilão atualizado (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - updateAuction(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async deleteAuction(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM auctions WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Leilão excluído (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteAuction(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  // --- Lots ---
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; }> {
    const connection = await getPool().getConnection();
    try {
      const query = `
        INSERT INTO lots (
          auction_id, title, \`number\`, image_url, data_ai_hint, gallery_image_urls, media_item_ids, status, 
          state_id, city_id, category_id, views, price, initial_price, 
          lot_specific_auction_date, second_auction_date, second_initial_price, end_date, 
          bids_count, is_favorite, is_featured, description, year, make, model, series,
          stock_number, selling_branch, vin, vin_status, loss_type, primary_damage, title_info,
          title_brand, start_code, has_key, odometer, airbags_status, body_style, engine_details,
          transmission_type, drive_line_type, fuel_type, cylinders, restraint_system,
          exterior_interior_color, options, manufactured_in, vehicle_class,
          vehicle_location_in_branch, lane_run_number, aisle_stall, actual_cash_value,
          estimated_repair_cost, seller_id_fk, auctioneer_id_fk, \`condition\`,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          NOW(), NOW()
        );
      `;
      const values = [
        Number(data.auctionId), data.title, data.number || null, data.imageUrl || null, data.dataAiHint || null,
        JSON.stringify(data.galleryImageUrls || []), JSON.stringify(data.mediaItemIds || []), data.status,
        data.stateId ? Number(data.stateId) : null, data.cityId ? Number(data.cityId) : null, data.categoryId ? Number(data.categoryId) : null,
        data.views || 0, data.price, data.initialPrice || null,
        data.lotSpecificAuctionDate || null, data.secondAuctionDate || null, data.secondInitialPrice || null, data.endDate,
        data.bidsCount || 0, data.isFavorite || false, data.isFeatured || false, data.description || null,
        data.year || null, data.make || null, data.model || null, data.series || null, data.stockNumber || null,
        data.sellingBranch || null, data.vin || null, data.vinStatus || null, data.lossType || null,
        data.primaryDamage || null, data.titleInfo || null, data.titleBrand || null, data.startCode || null,
        data.hasKey === undefined ? null : data.hasKey, data.odometer || null, data.airbagsStatus || null,
        data.bodyStyle || null, data.engineDetails || null, data.transmissionType || null, data.driveLineType || null,
        data.fuelType || null, data.cylinders || null, data.restraintSystem || null, data.exteriorInteriorColor || null,
        data.options || null, data.manufacturedIn || null, data.vehicleClass || null,
        data.vehicleLocationInBranch || null, data.laneRunNumber || null, data.aisleStall || null,
        data.actualCashValue || null, data.estimatedRepairCost || null,
        data.sellerId ? Number(data.sellerId) : null,
        data.auctioneerId ? Number(data.auctioneerId) : null,
        data.condition || null
      ];
      const [result] = await connection.execute(query, values);
      return { success: true, message: 'Lote criado (MySQL)!', lotId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createLot] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    const connection = await getPool().getConnection();
    try {
      let queryText = `
        SELECT 
          l.*, 
          a.title as auction_name, 
          lc.name as category_name, 
          s.uf as state_uf, 
          ci.name as city_name,
          sel.name as lot_seller_name,
          act.name as lot_auctioneer_name
        FROM lots l
        LEFT JOIN auctions a ON l.auction_id = a.id
        LEFT JOIN lot_categories lc ON l.category_id = lc.id
        LEFT JOIN states s ON l.state_id = s.id
        LEFT JOIN cities ci ON l.city_id = ci.id
        LEFT JOIN sellers sel ON l.seller_id_fk = sel.id
        LEFT JOIN auctioneers act ON l.auctioneer_id_fk = act.id
      `;
      const values = [];
      if (auctionIdParam) {
        queryText += ' WHERE l.auction_id = ?';
        values.push(Number(auctionIdParam));
        queryText += ' ORDER BY l.title ASC;';
      } else {
        queryText += ' ORDER BY l.created_at DESC;';
      }
      const [rows] = await connection.query(queryText, values);
      return (rows as RowDataPacket[]).map(row => mapToLot(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getLots] Error:`, e); return []; } finally { connection.release(); }
  }

  async getLot(id: string): Promise<Lot | null> {
    const connection = await getPool().getConnection();
    try {
      const queryText = `
        SELECT 
          l.*, 
          a.title as auction_name, 
          lc.name as category_name, 
          s.uf as state_uf, 
          ci.name as city_name,
          sel.name as lot_seller_name,
          act.name as lot_auctioneer_name
        FROM lots l
        LEFT JOIN auctions a ON l.auction_id = a.id
        LEFT JOIN lot_categories lc ON l.category_id = lc.id
        LEFT JOIN states s ON l.state_id = s.id
        LEFT JOIN cities ci ON l.city_id = ci.id
        LEFT JOIN sellers sel ON l.seller_id_fk = sel.id
        LEFT JOIN auctioneers act ON l.auctioneer_id_fk = act.id
        WHERE l.id = ?;
      `;
      const [rows] = await connection.query(queryText, [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToLot(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getLot(${id})] Error:`, e); return null; } finally { connection.release(); }
  }

  async updateLot(id: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let query = 'UPDATE lots SET ';

      (Object.keys(data) as Array<keyof LotDbData>).forEach(key => {
        if (data[key] !== undefined && key !== 'endDate' && key !== 'lotSpecificAuctionDate' && key !== 'secondAuctionDate' && key !== 'type' && key !== 'auctionName') {
            const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            const escapedColumn = sqlColumn === 'number' || sqlColumn === 'condition' ? `\`${sqlColumn}\`` : sqlColumn;
            fields.push(`${escapedColumn} = ?`);
            const value = data[key];
            if (key === 'galleryImageUrls' || key === 'mediaItemIds') {
                values.push(JSON.stringify(value || []));
            } else {
                values.push(value === '' ? null : value);
            }
        }
      });
      if (data.endDate) { fields.push(`end_date = ?`); values.push(data.endDate); }
      if (data.hasOwnProperty('lotSpecificAuctionDate')) { fields.push(`lot_specific_auction_date = ?`); values.push(data.lotSpecificAuctionDate); }
      if (data.hasOwnProperty('secondAuctionDate')) { fields.push(`second_auction_date = ?`); values.push(data.secondAuctionDate); }
      
      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o lote." };

      fields.push(`updated_at = NOW()`);
      query += fields.join(', ') + ` WHERE id = ?`;
      values.push(Number(id));
      
      await connection.execute(query, values);
      return { success: true, message: 'Lote atualizado (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - updateLot(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async deleteLot(id: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM lots WHERE id = ?', [Number(id)]);
      return { success: true, message: 'Lote excluído (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteLot(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async getBidsForLot(lotId: string): Promise<BidInfo[]> {
    const connection = await getPool().getConnection();
    try {
        const query = 'SELECT * FROM bids WHERE lot_id = ? ORDER BY `timestamp` DESC;';
        const [rows] = await connection.query(query, [Number(lotId)]);
        return (rows as RowDataPacket[]).map(row => mapToBidInfo(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getBidsForLot(${lotId})] Error:`, e); return []; } finally { connection.release(); }
  }

  async placeBidOnLot(lotId: string, auctionId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> {
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();
        const [lotRows] = await connection.query('SELECT price, bids_count FROM lots WHERE id = ? FOR UPDATE', [Number(lotId)]);
        if ((lotRows as RowDataPacket[]).length === 0) { await connection.rollback(); return { success: false, message: "Lote não encontrado."}; }
        const lotData = mapMySqlRowToCamelCase((lotRows as RowDataPacket[])[0]);
        if (bidAmount <= Number(lotData.price)) { await connection.rollback(); return { success: false, message: "Lance deve ser maior que o atual."}; }
        
        const insertBidQuery = 'INSERT INTO bids (lot_id, auction_id, bidder_id, bidder_display_name, amount, `timestamp`) VALUES (?, ?, ?, ?, ?, NOW())';
        const [insertResult] = await connection.execute(insertBidQuery, [Number(lotId), Number(auctionId), userId, userDisplayName, bidAmount]);
        const newBidId = (insertResult as mysql.ResultSetHeader).insertId;
        
        const updateLotQuery = 'UPDATE lots SET price = ?, bids_count = bids_count + 1, updated_at = NOW() WHERE id = ?;';
        await connection.execute(updateLotQuery, [bidAmount, Number(lotId)]);
        
        await connection.commit();
        const [newBidRows] = await connection.query('SELECT * FROM bids WHERE id = ?', [newBidId]);

        return { 
            success: true, 
            message: "Lance registrado!", 
            updatedLot: { price: bidAmount, bidsCount: Number(lotData.bidsCount || 0) + 1 }, 
            newBid: mapToBidInfo(mapMySqlRowToCamelCase((newBidRows as RowDataPacket[])[0]))
        };
    } catch (e: any) { 
        await connection.rollback();
        console.error(`[MySqlAdapter - placeBidOnLot(${lotId})] Error:`, e); 
        return { success: false, message: e.message }; 
    } finally { connection.release(); }
  }
  
  // --- Roles ---
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    const connection = await getPool().getConnection();
    try {
        const nameNormalized = data.name.trim().toUpperCase();
        const [existingRows] = await connection.query('SELECT id FROM roles WHERE name_normalized = ? LIMIT 1', [nameNormalized]);
        if ((existingRows as RowDataPacket[]).length > 0) return { success: false, message: `Perfil "${data.name}" já existe.`};
        
        const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
        const query = `
            INSERT INTO roles (name, name_normalized, description, permissions, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW());
        `;
        const values = [data.name.trim(), nameNormalized, data.description || null, JSON.stringify(validPermissions)];
        const [result] = await connection.execute(query, values);
        return { success: true, message: 'Perfil criado!', roleId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  
  async getRoles(): Promise<Role[]> {
    const connection = await getPool().getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM roles ORDER BY name ASC;');
        return (rows as RowDataPacket[]).map(row => mapToRole(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { return []; } finally { connection.release(); }
  }

  async getRole(id: string): Promise<Role | null> {
    const connection = await getPool().getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM roles WHERE id = ?;', [Number(id)]);
        if ((rows as RowDataPacket[]).length === 0) return null;
        return mapToRole(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { return null; } finally { connection.release(); }
  }

  async getRoleByName(name: string): Promise<Role | null> {
    const connection = await getPool().getConnection();
    try {
        const normalizedName = name.trim().toUpperCase();
        const [rows] = await connection.query('SELECT * FROM roles WHERE name_normalized = ? LIMIT 1;', [normalizedName]);
        if ((rows as RowDataPacket[]).length === 0) return null;
        return mapToRole(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { return null; } finally { connection.release(); }
  }

  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let query = 'UPDATE roles SET ';

        const [currentRoleRows] = await connection.query('SELECT name_normalized FROM roles WHERE id = ?', [Number(id)]);
        if ((currentRoleRows as RowDataPacket[]).length === 0) return { success: false, message: "Perfil não encontrado."};
        const currentNormalizedName = (currentRoleRows as RowDataPacket[])[0].name_normalized;
        
        if (data.name && currentNormalizedName !== 'ADMINISTRATOR' && currentNormalizedName !== 'USER') {
            fields.push(`name = ?`); values.push(data.name.trim());
            fields.push(`name_normalized = ?`); values.push(data.name.trim().toUpperCase());
        } else if (data.name) {
             if (data.description !== undefined) { 
                fields.push(`description = ?`); values.push(data.description || null);
            }
        }
        if (data.description !== undefined && (!data.name || (currentNormalizedName === 'ADMINISTRATOR' || currentNormalizedName === 'USER'))) {
             fields.push(`description = ?`); values.push(data.description || null);
        }

        if (data.permissions) {
            const validPermissions = (data.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
            fields.push(`permissions = ?`); values.push(JSON.stringify(validPermissions));
        }
        
        if (fields.length === 0) return { success: true, message: "Nenhuma alteração para o perfil."};
        
        fields.push(`updated_at = NOW()`);
        query += fields.join(', ') + ` WHERE id = ?`;
        values.push(Number(id));
        await connection.execute(query, values);
        return { success: true, message: 'Perfil atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
        const [roleRows] = await connection.query('SELECT name_normalized FROM roles WHERE id = ?', [Number(id)]);
        if ((roleRows as RowDataPacket[]).length > 0 && 
            ['ADMINISTRATOR', 'USER'].includes((roleRows as RowDataPacket[])[0].name_normalized)) {
            return { success: false, message: 'Perfis de sistema não podem ser excluídos.'};
        }
        await connection.execute('DELETE FROM roles WHERE id = ?', [Number(id)]);
        return { success: true, message: 'Perfil excluído!' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
        await connection.beginTransaction();
        for (const roleData of defaultRolesData) {
            const normalizedName = roleData.name.trim().toUpperCase();
            const [existingRows] = await connection.query('SELECT id, permissions, description FROM roles WHERE name_normalized = ? LIMIT 1', [normalizedName]);
            const validPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));

            if ((existingRows as RowDataPacket[]).length === 0) {
                await connection.query(
                    'INSERT INTO roles (name, name_normalized, description, permissions) VALUES (?, ?, ?, ?)',
                    [roleData.name.trim(), normalizedName, roleData.description || null, JSON.stringify(validPermissions)]
                );
            } else {
                const existingRole = mapMySqlRowToCamelCase((existingRows as RowDataPacket[])[0]);
                const currentPermsSorted = [...(typeof existingRole.permissions === 'string' ? JSON.parse(existingRole.permissions) : existingRole.permissions || [])].sort();
                const expectedPermsSorted = [...validPermissions].sort();
                if (JSON.stringify(currentPermsSorted) !== JSON.stringify(expectedPermsSorted) || existingRole.description !== (roleData.description || null)) {
                     await connection.query(
                        'UPDATE roles SET description = ?, permissions = ?, updated_at = NOW() WHERE id = ?',
                        [roleData.description || null, JSON.stringify(expectedPermsSorted), existingRole.id]
                    );
                }
            }
        }
        await connection.commit();
        return { success: true, message: 'Perfis padrão verificados/criados (MySQL).'};
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  
  // --- Users ---
  async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    const connection = await getPool().getConnection();
    try {
        const [rows] = await connection.query('SELECT up.*, r.name as role_name FROM user_profiles up LEFT JOIN roles r ON up.role_id = r.id WHERE up.uid = ?', [userId]);
        if ((rows as RowDataPacket[]).length === 0) return null;
        const userRow = mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]);
        let role: Role | null = null;
        if (userRow.roleId) role = await this.getRole(userRow.roleId);
        return mapToUserProfileData(userRow, role);
    } catch (e: any) { return null; } finally { connection.release(); }
  }

  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        (Object.keys(data) as Array<keyof EditableUserProfileData>).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) { // Check for null specifically
                fields.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`);
                values.push(data[key]);
            } else if (data[key] === null) { // Handle explicit nulls to clear fields
                 fields.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = NULL`);
            }
        });
        if (fields.length === 0) return { success: true, message: "Nenhuma alteração no perfil."};
        fields.push(`updated_at = NOW()`);
        const queryText = `UPDATE user_profiles SET ${fields.join(', ')} WHERE uid = ?`;
        values.push(userId);
        await connection.execute(queryText, values);
        return { success: true, message: 'Perfil atualizado!'};
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }> {
    const connection = await getPool().getConnection();
    try {
        await this.ensureDefaultRolesExist(); 
        const targetRole = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER');
        if (!targetRole) return { success: false, message: 'Perfil padrão USER não encontrado.'};

        await connection.beginTransaction();
        const [userRows] = await connection.query('SELECT * FROM user_profiles WHERE uid = ?', [userId]);
        let finalProfileData: UserProfileData;

        if ((userRows as RowDataPacket[]).length > 0) {
            const userDataFromDB = mapToUserProfileData(mapMySqlRowToCamelCase((userRows as RowDataPacket[])[0]));
            const updatePayload: any = { updatedAt: new Date() };
            let needsUpdate = false;
            if (userDataFromDB.roleId !== targetRole.id) { updatePayload.roleId = Number(targetRole.id); needsUpdate = true; }
            if (userDataFromDB.roleName !== targetRole.name) { updatePayload.roleName = targetRole.name; needsUpdate = true; }
            if (JSON.stringify(userDataFromDB.permissions || []) !== JSON.stringify(targetRole.permissions || [])) { updatePayload.permissions = targetRole.permissions || []; needsUpdate = true; }
            
            if (needsUpdate) {
                const updateFields: string[] = [];
                const updateValues: any[] = [];
                Object.keys(updatePayload).forEach(key => {
                    const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
                    updateFields.push(`${sqlColumn} = ?`);
                    updateValues.push(updatePayload[key] === 'permissions' ? JSON.stringify(updatePayload[key]) : updatePayload[key]);
                });
                updateValues.push(userId);
                await connection.execute(`UPDATE user_profiles SET ${updateFields.join(', ')} WHERE uid = ?`, updateValues);
            }
             finalProfileData = { ...userDataFromDB, ...updatePayload, uid: userId } as UserProfileData;
        } else {
            const insertQuery = `
                INSERT INTO user_profiles (uid, email, full_name, role_id, permissions, status, habilitation_status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
            `;
            const insertValues = [
                userId, email, fullName || email.split('@')[0], Number(targetRole.id), JSON.stringify(targetRole.permissions || []),
                'ATIVO', targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS'
            ];
            await connection.execute(insertQuery, insertValues);
            const [createdRows] = await connection.query('SELECT * FROM user_profiles WHERE uid = ?', [userId]);
            finalProfileData = mapToUserProfileData(mapMySqlRowToCamelCase((createdRows as RowDataPacket[])[0]), targetRole);
        }
        await connection.commit();
        return { success: true, message: 'Perfil de usuário assegurado/atualizado (MySQL).', userProfile: finalProfileData };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async getUsersWithRoles(): Promise<UserProfileData[]> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT up.*, r.name as role_name, r.permissions as role_permissions 
        FROM user_profiles up 
        LEFT JOIN roles r ON up.role_id = r.id 
        ORDER BY up.full_name ASC;
      `);
      return (rows as RowDataPacket[]).map(row => {
        const profile = mapToUserProfileData(mapMySqlRowToCamelCase(row));
        if ((!profile.permissions || profile.permissions.length === 0) && row.role_permissions) {
            profile.permissions = typeof row.role_permissions === 'string' ? JSON.parse(row.role_permissions) : row.role_permissions;
        }
        return profile;
      });
    } catch (e: any) { return []; } finally { connection.release(); }
  }

  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      let roleName = null;
      let permissions = null;
      if (roleId && roleId !== "---NONE---") {
        const role = await this.getRole(roleId);
        if (role) { roleName = role.name; permissions = JSON.stringify(role.permissions || []); }
        else return { success: false, message: 'Perfil não encontrado.'};
      }
      const queryText = `UPDATE user_profiles SET role_id = ?, role_name = ?, permissions = ?, updated_at = NOW() WHERE uid = ?`;
      await connection.execute(queryText, [roleId ? Number(roleId) : null, roleName, permissions, userId]);
      return { success: true, message: 'Perfil do usuário atualizado!' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM user_profiles WHERE uid = ?', [userId]);
      return { success: true, message: 'Perfil de usuário excluído (MySQL)!' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  
  // --- Media Items ---
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> {
    const connection = await getPool().getConnection();
    try {
      const query = `
        INSERT INTO media_items (
          file_name, uploaded_by, title, alt_text, caption, description, mime_type, size_bytes,
          dimensions_width, dimensions_height, url_original, url_thumbnail, url_medium, url_large,
          linked_lot_ids, data_ai_hint, uploaded_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
      `;
      const values = [
        data.fileName, uploadedBy || null, data.title || null, data.altText || null, data.caption || null,
        data.description || null, data.mimeType, data.sizeBytes, data.dimensions?.width || null,
        data.dimensions?.height || null, filePublicUrl, filePublicUrl, filePublicUrl, filePublicUrl, // Simplified URLs
        JSON.stringify(data.linkedLotIds || []), data.dataAiHint || null
      ];
      const [result] = await connection.execute(query, values);
      const insertId = (result as mysql.ResultSetHeader).insertId;
      const [newRows] = await connection.query('SELECT * FROM media_items WHERE id = ?', [insertId]);
      return { success: true, message: "Item de mídia criado (MySQL).", item: mapToMediaItem(mapMySqlRowToCamelCase((newRows as RowDataPacket[])[0])) };
    } catch (e: any) { console.error(`[MySqlAdapter - createMediaItem] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async getMediaItems(): Promise<MediaItem[]> {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM media_items ORDER BY uploaded_at DESC;');
      return (rows as RowDataPacket[]).map(row => mapToMediaItem(mapMySqlRowToCamelCase(row)));
    } catch (e: any) { console.error(`[MySqlAdapter - getMediaItems] Error:`, e); return []; } finally { connection.release(); }
  }

  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      (Object.keys(metadata) as Array<keyof typeof metadata>).forEach(key => {
        fields.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`);
        values.push(metadata[key]);
      });
      if (fields.length === 0) return { success: true, message: "Nenhuma alteração." };
      const query = `UPDATE media_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
      values.push(Number(id));
      await connection.execute(query, values);
      return { success: true, message: 'Metadados atualizados (MySQL).' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM media_items WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Item de mídia excluído do DB (MySQL).' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      // Link to media_items
      for (const mediaId of mediaItemIds) {
        await connection.execute(
          'UPDATE media_items SET linked_lot_ids = JSON_MERGE_PRESERVE(COALESCE(linked_lot_ids, JSON_ARRAY()), JSON_ARRAY(?)) WHERE id = ? AND (linked_lot_ids IS NULL OR NOT JSON_CONTAINS(linked_lot_ids, JSON_QUOTE(?)))',
          [lotId, Number(mediaId), lotId]
        );
      }
      // Link to lots table (assuming media_item_ids is JSON)
      await connection.execute(
        'UPDATE lots SET media_item_ids = JSON_MERGE_PRESERVE(COALESCE(media_item_ids, JSON_ARRAY()), ?), updated_at = NOW() WHERE id = ?',
        [JSON.stringify(mediaItemIds), Number(lotId)]
      );
      await connection.commit();
      return { success: true, message: 'Mídias vinculadas (MySQL).' };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "UPDATE media_items SET linked_lot_ids = JSON_REMOVE(COALESCE(linked_lot_ids, JSON_ARRAY()), JSON_UNQUOTE(JSON_SEARCH(COALESCE(linked_lot_ids, JSON_ARRAY()), 'one', ?))) WHERE id = ?",
        [lotId, Number(mediaItemId)]
      );
      await connection.execute(
        "UPDATE lots SET media_item_ids = JSON_REMOVE(COALESCE(media_item_ids, JSON_ARRAY()), JSON_UNQUOTE(JSON_SEARCH(COALESCE(media_item_ids, JSON_ARRAY()), 'one', ?))), updated_at = NOW() WHERE id = ?",
        [mediaItemId, Number(lotId)]
      );
      await connection.commit();
      return { success: true, message: 'Mídia desvinculada (MySQL).' };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  
  // --- Platform Settings ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    const connection = await getPool().getConnection();
    try {
        const [rows] = await connection.query(`SELECT gallery_image_base_path, updated_at FROM platform_settings WHERE id = 'global';`);
        if ((rows as RowDataPacket[]).length > 0) {
            return { id: 'global', ...mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]) } as PlatformSettings;
        }
        // Default settings if not found
        const defaultPath = '/media/gallery/';
        await connection.execute(`INSERT INTO platform_settings (id, gallery_image_base_path) VALUES ('global', ?) ON DUPLICATE KEY UPDATE id=id;`, [defaultPath]);
        return { id: 'global', galleryImageBasePath: defaultPath, updatedAt: new Date() };
    } catch (e: any) {
        console.error("[MySqlAdapter - getPlatformSettings] Error, returning default:", e);
        return { id: 'global', galleryImageBasePath: '/media/gallery/', updatedAt: new Date() };
    } finally { connection.release(); }
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
        return { success: false, message: 'Caminho base da galeria inválido. Deve começar e terminar com "/".' };
    }
    try {
        const query = `
            INSERT INTO platform_settings (id, gallery_image_base_path, updated_at) 
            VALUES ('global', ?, NOW()) 
            ON DUPLICATE KEY UPDATE gallery_image_base_path = VALUES(gallery_image_base_path), updated_at = NOW();
        `;
        await connection.execute(query, [data.galleryImageBasePath]);
        return { success: true, message: 'Configurações atualizadas (MySQL)!' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
}
    

    

    




    

