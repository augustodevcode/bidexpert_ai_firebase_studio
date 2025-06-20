
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
  BidInfo, Review, LotQuestion,
  UserProfileData, EditableUserProfileData, UserHabilitationStatus,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData, Theme,
  Subcategory, SubcategoryFormData // Added Subcategory types
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
    hasSubcategories: Boolean(row.hasSubcategories || false), // Added
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToSubcategory(row: RowDataPacket): Subcategory {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    parentCategoryId: String(row.parentCategoryId),
    description: row.description,
    itemCount: Number(row.itemCount || 0),
    displayOrder: Number(row.displayOrder || 0),
    iconUrl: row.iconUrl,
    dataAiHintIcon: row.dataAiHintIcon,
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
        permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions || '[]') : (role?.permissions || row.permissions || []),
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
        accountType: row.accountType as UserProfileData['accountType'],
        razaoSocial: row.razaoSocial,
        cnpj: row.cnpj,
        inscricaoEstadual: row.inscricaoEstadual,
        websiteComitente: row.websiteComitente,
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
    galleryImageUrls: row.galleryImageUrls && typeof row.galleryImageUrls === 'string' && row.galleryImageUrls.trim() !== '' ? JSON.parse(row.galleryImageUrls) : [],
    mediaItemIds: row.mediaItemIds && typeof row.mediaItemIds === 'string' && row.mediaItemIds.trim() !== '' ? JSON.parse(row.mediaItemIds) : [],
    status: row.status as LotStatus,
    stateId: row.stateId ? String(row.stateId) : undefined,
    cityId: row.cityId ? String(row.cityId) : undefined,
    cityName: row.cityName,
    stateUf: row.stateUf,
    type: row.categoryName,
    categoryId: row.categoryId ? String(row.categoryId) : undefined,
    subcategoryId: row.subcategoryId ? String(row.subcategoryId) : undefined, // Added
    subcategoryName: row.subcategoryName, // Added
    views: Number(row.views || 0),
    auctionName: row.auctionName,
    price: Number(row.price),
    initialPrice: row.initialPrice !== null ? Number(row.initialPrice) : undefined,
    lotSpecificAuctionDate: row.lotSpecificAuctionDate ? new Date(row.lotSpecificAuctionDate) : null,
    secondAuctionDate: row.secondAuctionDate ? new Date(row.secondAuctionDate) : null,
    secondInitialPrice: row.secondInitialPrice !== null ? Number(row.secondInitialPrice) : undefined,
    endDate: row.endDate ? new Date(row.endDate) : undefined,
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
    const themes = typeof row.themes === 'string' ? JSON.parse(row.themes || '[]') : (row.themes || []);
    const platformPublicIdMasks = typeof row.platformPublicIdMasks === 'string' ? JSON.parse(row.platformPublicIdMasks || '{}') : (row.platformPublicIdMasks || {});
    return {
        id: String(row.id),
        siteTitle: row.siteTitle,
        siteTagline: row.siteTagline,
        galleryImageBasePath: row.galleryImageBasePath,
        activeThemeName: row.activeThemeName,
        themes: themes,
        platformPublicIdMasks: platformPublicIdMasks,
        updatedAt: new Date(row.updatedAt)
    };
}

function mapToReview(row: RowDataPacket): Review {
  return {
    id: String(row.id),
    lotId: String(row.lotId),
    auctionId: String(row.auctionId),
    userId: row.userId,
    userDisplayName: row.userDisplayName,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: new Date(row.createdAt),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
  };
}

function mapToLotQuestion(row: RowDataPacket): LotQuestion {
  return {
    id: String(row.id),
    lotId: String(row.lotId),
    auctionId: String(row.auctionId),
    userId: row.userId,
    userDisplayName: row.userDisplayName,
    questionText: row.questionText,
    createdAt: new Date(row.createdAt),
    answerText: row.answerText,
    answeredAt: row.answeredAt ? new Date(row.answeredAt) : undefined,
    answeredByUserId: row.answeredByUserId,
    answeredByUserDisplayName: row.answeredByUserDisplayName,
    isPublic: Boolean(row.isPublic),
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
      `DROP TABLE IF EXISTS lot_reviews;`,
      `DROP TABLE IF EXISTS lot_questions;`,
      `DROP TABLE IF EXISTS subcategories;`, // Added subcategories drop
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
        \`number\` VARCHAR(20),
        complement VARCHAR(100),
        neighborhood VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(100),
        opt_in_marketing BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        data_ai_hint TEXT,
        account_type VARCHAR(50),
        razao_social VARCHAR(255),
        cnpj VARCHAR(20),
        inscricao_estadual VARCHAR(50),
        website_comitente TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
        INDEX idx_users_email (email),
        INDEX idx_users_role_id (role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
        site_title VARCHAR(100) NULL,
        site_tagline VARCHAR(255) NULL,
        gallery_image_base_path TEXT NOT NULL,
        active_theme_name VARCHAR(100) NULL,
        themes JSON,
        platform_public_id_masks JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lot_categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        item_count INT UNSIGNED DEFAULT 0,
        has_subcategories BOOLEAN DEFAULT FALSE, -- Added
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_lot_categories_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS subcategories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        parent_category_id INT UNSIGNED NOT NULL,
        description TEXT,
        item_count INT UNSIGNED DEFAULT 0,
        display_order INT DEFAULT 0,
        icon_url TEXT,
        data_ai_hint_icon TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_category_id) REFERENCES lot_categories(id) ON DELETE CASCADE,
        UNIQUE KEY \`unique_subcategory_in_parent\` (\`slug\`, \`parent_category_id\`),
        INDEX idx_subcategories_parent_id (parent_category_id),
        INDEX idx_subcategories_slug_parent_id (slug, parent_category_id)
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
        public_id VARCHAR(100) NOT NULL UNIQUE,
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
        auctions_conducted_count INT UNSIGNED DEFAULT 0,
        total_value_sold DECIMAL(15,2) DEFAULT 0.00,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE SET NULL,
        INDEX idx_auctioneers_slug (slug),
        INDEX idx_auctioneers_public_id (public_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS sellers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id VARCHAR(100) NOT NULL UNIQUE,
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
        active_lots_count INT UNSIGNED DEFAULT 0,
        total_sales_value DECIMAL(15,2) DEFAULT 0.00,
        auctions_facilitated_count INT UNSIGNED DEFAULT 0,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE SET NULL,
        INDEX idx_sellers_slug (slug),
        INDEX idx_sellers_public_id (public_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS auctions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id VARCHAR(100) NOT NULL UNIQUE,
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
        INDEX idx_auctions_public_id (public_id),
        INDEX idx_auctions_status (status),
        INDEX idx_auctions_auction_date (auction_date),
        INDEX idx_auctions_category_id (category_id),
        INDEX idx_auctions_auctioneer_id (auctioneer_id),
        INDEX idx_auctions_seller_id (seller_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lots (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        public_id VARCHAR(100) NOT NULL UNIQUE,
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
        subcategory_id INT UNSIGNED, -- Added
        views INT UNSIGNED DEFAULT 0,
        price DECIMAL(15,2) NOT NULL,
        initial_price DECIMAL(15,2),
        lot_specific_auction_date DATETIME NULL,
        second_auction_date DATETIME NULL,
        second_initial_price DECIMAL(15,2),
        end_date DATETIME, -- Not NULL constraint removed based on previous discussions
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
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL, -- Added FK for subcategory
        FOREIGN KEY (seller_id_fk) REFERENCES sellers(id) ON DELETE SET NULL,
        FOREIGN KEY (auctioneer_id_fk) REFERENCES auctioneers(id) ON DELETE SET NULL,
        INDEX idx_lots_public_id (public_id),
        INDEX idx_lots_auction_id (auction_id),
        INDEX idx_lots_status (status),
        INDEX idx_lots_category_id (category_id),
        INDEX idx_lots_subcategory_id (subcategory_id) -- Added index for subcategory
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
        FOREIGN KEY (bidder_id) REFERENCES users(uid) ON DELETE CASCADE,
        INDEX idx_bids_lot_id (lot_id),
        INDEX idx_bids_bidder_id (bidder_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lot_reviews (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        lot_id INT UNSIGNED NOT NULL,
        auction_id INT UNSIGNED NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_display_name VARCHAR(255),
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
        INDEX idx_lot_reviews_lot_id (lot_id),
        INDEX idx_lot_reviews_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS lot_questions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        lot_id INT UNSIGNED NOT NULL,
        auction_id INT UNSIGNED NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_display_name VARCHAR(255),
        question_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        answer_text TEXT,
        answered_at TIMESTAMP NULL,
        answered_by_user_id VARCHAR(255),
        answered_by_user_display_name VARCHAR(255),
        is_public BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
        FOREIGN KEY (answered_by_user_id) REFERENCES users(uid) ON DELETE SET NULL,
        INDEX idx_lot_questions_lot_id (lot_id),
        INDEX idx_lot_questions_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
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
          }
        } catch (tableError: any) {
          console.warn(`[MySqlAdapter] Aviso ao executar query: ${tableError.message}. Query: ${query.substring(0,100)}...`);
           if (query.includes('platform_settings') && tableError.code === 'ER_PARSE_ERROR') {
             errors.push(new Error(`Erro de sintaxe na criação de platform_settings (MySQL): ${tableError.message}`));
           }
        }
      }
      await connection.commit();
      console.log('[MySqlAdapter] Esquema de tabelas inicializado/verificado com sucesso.');

      const rolesResult = await this.ensureDefaultRolesExist();
      if (!rolesResult.success) {
        errors.push(new Error(`Falha ao garantir perfis padrão: ${rolesResult.message}`));
      } else {
        console.log(`[MySqlAdapter] ${rolesResult.rolesProcessed || 0} perfis padrão processados.`);
      }

      const settingsResult = await this.getPlatformSettings();
      if (!settingsResult.galleryImageBasePath) {
          errors.push(new Error('Falha ao garantir configurações padrão da plataforma.'));
      } else {
        console.log('[MySqlAdapter] Configurações padrão da plataforma verificadas/criadas.');
      }

      if (errors.length > 0) {
        return { success: false, message: `Esquema MySQL inicializado com ${errors.length} erros nos passos pós-tabelas.`, errors, rolesProcessed: rolesResult.rolesProcessed };
      }
      return { success: true, message: `Esquema MySQL inicializado e perfis padrão verificados (${rolesResult.rolesProcessed || 0} processados). Configurações da plataforma verificadas.`, rolesProcessed: rolesResult.rolesProcessed };

    } catch (error: any) {
      await connection.rollback();
      console.error('[MySqlAdapter - initializeSchema] Erro transacional:', error);
      errors.push(error.message);
      return { success: false, message: `Erro ao inicializar esquema MySQL: ${error.message}`, errors };
    } finally {
      connection.release();
    }
  }

  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string }> {
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name);
      const query = `
        INSERT INTO subcategories (name, slug, parent_category_id, description, item_count, display_order, icon_url, data_ai_hint_icon)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?);
      `;
      const values = [
        data.name.trim(), slug, Number(data.parentCategoryId), data.description?.trim() || null,
        data.displayOrder || 0, data.iconUrl || null, data.dataAiHintIcon || null
      ];
      const [result] = await connection.execute(query, values);
      const subcategoryId = (result as mysql.ResultSetHeader).insertId;

      // Update hasSubcategories on parent category
      await connection.execute(
        'UPDATE lot_categories SET has_subcategories = TRUE WHERE id = ?',
        [Number(data.parentCategoryId)]
      );

      return { success: true, message: 'Subcategoria criada com sucesso (MySQL)!', subcategoryId: String(subcategoryId) };
    } catch (error: any) {
      console.error("[MySqlAdapter - createSubcategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao criar subcategoria (MySQL).' };
    } finally {
      connection.release();
    }
  }

  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    const connection = await getPool().getConnection();
    try {
      const query = 'SELECT * FROM subcategories WHERE parent_category_id = ? ORDER BY display_order ASC, name ASC;';
      const [rows] = await connection.execute(query, [Number(parentCategoryId)]);
      return mapMySqlRowsToCamelCase(rows as RowDataPacket[]).map(mapToSubcategory);
    } catch (error: any) {
      console.error(`[MySqlAdapter - getSubcategories for parent ${parentCategoryId}] Error:`, error);
      return [];
    } finally {
      connection.release();
    }
  }

  async getSubcategory(id: string): Promise<Subcategory | null> {
    const connection = await getPool().getConnection();
    try {
      const query = 'SELECT * FROM subcategories WHERE id = ?;';
      const [rows] = await connection.execute(query, [Number(id)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToSubcategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (error: any) {
      console.error(`[MySqlAdapter - getSubcategory(${id})] Error:`, error);
      return null;
    } finally {
      connection.release();
    }
  }

  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    const connection = await getPool().getConnection();
    try {
      const query = 'SELECT * FROM subcategories WHERE slug = ? AND parent_category_id = ?;';
      const [rows] = await connection.execute(query, [slug, Number(parentCategoryId)]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToSubcategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (error: any) {
      console.error(`[MySqlAdapter - getSubcategoryBySlug(${slug}, ${parentCategoryId})] Error:`, error);
      return null;
    } finally {
      connection.release();
    }
  }

  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string }> {
    const connection = await getPool().getConnection();
    try {
      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      if (data.name) { fieldsToUpdate.push('name = ?', 'slug = ?'); values.push(data.name.trim(), slugify(data.name.trim())); }
      if (data.description !== undefined) { fieldsToUpdate.push('description = ?'); values.push(data.description?.trim() || null); }
      if (data.displayOrder !== undefined) { fieldsToUpdate.push('display_order = ?'); values.push(data.displayOrder); }
      if (data.iconUrl !== undefined) { fieldsToUpdate.push('icon_url = ?'); values.push(data.iconUrl || null); }
      if (data.dataAiHintIcon !== undefined) { fieldsToUpdate.push('data_ai_hint_icon = ?'); values.push(data.dataAiHintIcon || null); }
      // parent_category_id should not be changed here, if needed, it's a more complex operation (delete and create under new parent).

      if (fieldsToUpdate.length === 0) return { success: true, message: "Nenhuma alteração para a subcategoria." };

      const query = `UPDATE subcategories SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() WHERE id = ?`;
      values.push(Number(id));
      await connection.execute(query, values);
      return { success: true, message: 'Subcategoria atualizada com sucesso (MySQL)!' };
    } catch (error: any) {
      console.error(`[MySqlAdapter - updateSubcategory(${id})] Error:`, error);
      return { success: false, message: error.message || 'Falha ao atualizar subcategoria (MySQL).' };
    } finally {
      connection.release();
    }
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string }> {
    const connection = await getPool().getConnection();
    try {
      // Optional: Before deleting, check if parent category will have 0 subcategories and update its has_subcategories flag
      // For simplicity, this is omitted here but should be considered.
      await connection.execute('DELETE FROM subcategories WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Subcategoria excluída com sucesso (MySQL)!' };
    } catch (error: any) {
      console.error(`[MySqlAdapter - deleteSubcategory(${id})] Error:`, error);
      return { success: false, message: error.message || 'Falha ao excluir subcategoria (MySQL).' };
    } finally {
      connection.release();
    }
  }

  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name.trim());
      const query = `
        INSERT INTO lot_categories (name, slug, description, item_count, has_subcategories)
        VALUES (?, ?, ?, 0, FALSE);
      `;
      const values = [data.name.trim(), slug, data.description?.trim() || null];
      const [result] = await connection.execute(query, values);
      const categoryId = (result as mysql.ResultSetHeader).insertId;
      return { success: true, message: 'Categoria criada com sucesso (MySQL)!', categoryId: String(categoryId) };
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
      const [rows] = await connection.execute('SELECT id, name, slug, description, item_count, has_subcategories, created_at, updated_at FROM lot_categories ORDER BY name ASC;');
      return mapMySqlRowsToCamelCase(rows as RowDataPacket[]).map(mapToLotCategory);
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
      const numericId = parseInt(id, 10);
      let rows;
      if (isNaN(numericId)) {
          [rows] = await connection.execute('SELECT * FROM lot_categories WHERE slug = ?', [id]);
      } else {
          [rows] = await connection.execute('SELECT * FROM lot_categories WHERE id = ?', [numericId]);
      }
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToLotCategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (error: any) {
        console.error(`[MySqlAdapter - getLotCategory with ID/slug ${id}] Error:`, error);
        return null;
    } finally {
        connection.release();
    }
  }

  async updateLotCategory(id: string, data: { name: string; description?: string; hasSubcategories?: boolean }): Promise<{ success: boolean; message: string; }> {
    if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const connection = await getPool().getConnection();
    try {
      const slug = slugify(data.name.trim());
      const fieldsToUpdate: string[] = ['name = ?', 'slug = ?', 'description = ?'];
      const values: any[] = [data.name.trim(), slug, data.description?.trim() || null];

      if (data.hasSubcategories !== undefined) {
        fieldsToUpdate.push('has_subcategories = ?');
        values.push(data.hasSubcategories);
      }

      const query = `
        UPDATE lot_categories
        SET ${fieldsToUpdate.join(', ')}, updated_at = NOW()
        WHERE id = ?;
      `;
      values.push(Number(id));
      await connection.execute(query, values);
      return { success: true, message: 'Categoria atualizada com sucesso (MySQL)!' };
    } catch (error: any) {
      console.error("[MySqlAdapter - updateLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao atualizar categoria (MySQL).' };
    } finally {
      connection.release();
    }
  }

  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    const connection = await getPool().getConnection();
    try {
        const normalizedName = name.trim(); // No MySQL, a busca pode ser case-insensitive dependendo do collation
        const [rows] = await connection.execute(
            'SELECT * FROM lot_categories WHERE name = ? OR slug = ? LIMIT 1',
            [normalizedName, slugify(normalizedName)]
        );
        if ((rows as RowDataPacket[]).length === 0) return null;
        return mapToLotCategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (error: any) {
        console.error(`[MySqlAdapter - getLotCategoryByName(${name})] Error:`, error);
        return null;
    } finally {
        connection.release();
    }
  }

  // ... (rest of the methods: deleteLotCategory, State, City, Auctioneer, Seller, Auction, Lot, Bids, User, Role, Media, PlatformSettings)
  // Ensure all these methods use the helper functions mapMySqlRowsToCamelCase and mapTo<Entity> if they return data.
  // For all INSERT and UPDATE queries, ensure proper handling of null values for optional fields (pass NULL to SQL).
  // For all SELECT queries that join tables for names (e.g., category_name from lot_categories), make sure the mapTo<Entity> functions correctly use these joined names.
  // Remember to release the connection in a `finally` block for every method.
  async disconnect(): Promise<void> {
    if (pool) {
      await pool.end();
      console.log('[MySqlAdapter] Pool de conexões MySQL encerrado.');
    }
  }
  // --- Reviews ---
  async getReviewsForLot(lotId: string): Promise<Review[]> {
    const connection = await getPool().getConnection();
    try {
      const query = 'SELECT * FROM lot_reviews WHERE lot_id = (SELECT id FROM lots WHERE public_id = ? OR id = ? LIMIT 1) ORDER BY created_at DESC;';
      const [rows] = await connection.execute(query, [lotId, lotId]);
      return mapMySqlRowsToCamelCase(rows as RowDataPacket[]).map(mapToReview);
    } catch (e: any) { console.error(`[MySqlAdapter - getReviewsForLot(${lotId})] Error:`, e); return []; }
    finally { connection.release(); }
  }

  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    const connection = await getPool().getConnection();
    try {
      // Obter o ID numérico do lote a partir do public_id ou ID
      const [lotRows] = await connection.execute('SELECT id FROM lots WHERE public_id = ? OR id = ? LIMIT 1', [reviewData.lotId, reviewData.lotId]);
      if ((lotRows as RowDataPacket[]).length === 0) {
        return { success: false, message: "Lote não encontrado para adicionar avaliação." };
      }
      const numericLotId = (lotRows as RowDataPacket[])[0].id;

      const query = `
        INSERT INTO lot_reviews (lot_id, auction_id, user_id, user_display_name, rating, comment)
        VALUES (?, (SELECT auction_id FROM lots WHERE id = ?), ?, ?, ?, ?);
      `;
      const values = [
        numericLotId, numericLotId, reviewData.userId, reviewData.userDisplayName,
        reviewData.rating, reviewData.comment
      ];
      const [result] = await connection.execute(query, values);
      return { success: true, message: 'Avaliação adicionada (MySQL).', reviewId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createReview] Error:`, e); return { success: false, message: e.message }; }
    finally { connection.release(); }
  }

  // --- Questions ---
  async getQuestionsForLot(lotId: string): Promise<LotQuestion[]> {
    const connection = await getPool().getConnection();
    try {
      const query = 'SELECT * FROM lot_questions WHERE lot_id = (SELECT id FROM lots WHERE public_id = ? OR id = ? LIMIT 1) ORDER BY created_at DESC;';
      const [rows] = await connection.execute(query, [lotId, lotId]);
      return mapMySqlRowsToCamelCase(rows as RowDataPacket[]).map(mapToLotQuestion);
    } catch (e: any) { console.error(`[MySqlAdapter - getQuestionsForLot(${lotId})] Error:`, e); return []; }
    finally { connection.release(); }
  }

  async createQuestion(questionData: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string; }> {
     const connection = await getPool().getConnection();
    try {
      const [lotRows] = await connection.execute('SELECT id FROM lots WHERE public_id = ? OR id = ? LIMIT 1', [questionData.lotId, questionData.lotId]);
      if ((lotRows as RowDataPacket[]).length === 0) {
        return { success: false, message: "Lote não encontrado para adicionar pergunta." };
      }
      const numericLotId = (lotRows as RowDataPacket[])[0].id;

      const query = `
        INSERT INTO lot_questions (lot_id, auction_id, user_id, user_display_name, question_text, is_public)
        VALUES (?, (SELECT auction_id FROM lots WHERE id = ?), ?, ?, ?, ?);
      `;
      const values = [
        numericLotId, numericLotId, questionData.userId, questionData.userDisplayName,
        questionData.questionText, questionData.isPublic === undefined ? true : questionData.isPublic
      ];
      const [result] = await connection.execute(query, values);
      return { success: true, message: 'Pergunta enviada (MySQL).', questionId: String((result as mysql.ResultSetHeader).insertId) };
    } catch (e: any) { console.error(`[MySqlAdapter - createQuestion] Error:`, e); return { success: false, message: e.message }; }
    finally { connection.release(); }
  }

  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    try {
      const query = `
        UPDATE lot_questions
        SET answer_text = ?, answered_at = NOW(), answered_by_user_id = ?, answered_by_user_display_name = ?
        WHERE id = ? AND lot_id = (SELECT id FROM lots WHERE public_id = ? OR id = ? LIMIT 1);
      `;
      const values = [answerText, answeredByUserId, answeredByUserDisplayName, Number(questionId), lotId, lotId];
      const [result] = await connection.execute(query, values);
      if ((result as mysql.OkPacket).affectedRows === 0) {
        return { success: false, message: 'Pergunta não encontrada ou não pertence ao lote especificado.' };
      }
      return { success: true, message: 'Pergunta respondida (MySQL).' };
    } catch (e: any) { console.error(`[MySqlAdapter - answerQuestion(${questionId})] Error:`, e); return { success: false, message: e.message }; }
    finally { connection.release(); }
  }
  // Placeholder for remaining methods from IDatabaseAdapter that were not explicitly shown
  // These would follow similar patterns of connecting, executing SQL, mapping results, and releasing the connection.
  // For brevity, only a few are re-listed here.
  deleteLotCategory = async (id: string): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM lot_categories WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Categoria excluída com sucesso (MySQL)!' };
    } catch (error: any) {
      console.error("[MySqlAdapter - deleteLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao excluir categoria (MySQL).' };
    } finally {
      connection.release();
    }
  }
  deleteState = async (id: string): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM states WHERE id = ?', [Number(id)]);
      return { success: true, message: 'Estado excluído (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteState(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  deleteCity = async (id: string): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM cities WHERE id = ?', [Number(id)]);
      return { success: true, message: 'Cidade excluída (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteCity(${id})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  deleteSeller = async (idOrPublicId: string): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      const numericId = Number(idOrPublicId);
      if (!isNaN(numericId)) {
        await connection.execute('DELETE FROM sellers WHERE id = ?;', [numericId]);
      } else {
        await connection.execute('DELETE FROM sellers WHERE public_id = ?;', [idOrPublicId]);
      }
      return { success: true, message: 'Comitente excluído (MySQL)!' };
    } catch (e: any) { console.error(`[MySqlAdapter - deleteSeller(${idOrPublicId})] Error:`, e); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  // ... (rest of the delete methods: deleteAuction, deleteLot, deleteRole, deleteMediaItemFromDb)
  // ... (rest of the getByName methods: getAuctioneerByName, getSellerByName)
  // ... (rest of ensureUserRole, getUsersWithRoles, updateUserRole, deleteUserProfile, getUserByEmail)
  // ... (rest of createMediaItem, getMediaItems, updateMediaItemMetadata, linkMediaItemsToLot, unlinkMediaItemFromLot)
  // ... (rest of getPlatformSettings, updatePlatformSettings)

  getAuctioneerByName = async (name: string): Promise<AuctioneerProfileInfo | null> => {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM auctioneers WHERE name = ? LIMIT 1;', [name]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getAuctioneerByName(${name})] Error:`, e); return null; } finally { connection.release(); }
  }

  getSellerByName = async (name: string): Promise<SellerProfileInfo | null> => {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM sellers WHERE name = ? LIMIT 1;', [name]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      return mapToSellerProfileInfo(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
    } catch (e: any) { console.error(`[MySqlAdapter - getSellerByName(${name})] Error:`, e); return null; } finally { connection.release(); }
  }
  ensureUserRole = async (userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }> => {
    // ... (full implementation as before)
    const connection = await getPool().getConnection();
    try {
        await this.ensureDefaultRolesExist();
        let targetRole: Role | null = null;
        if (roleIdToAssign) targetRole = await this.getRole(roleIdToAssign);
        if (!targetRole) targetRole = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER');

        if (!targetRole || !targetRole.id) return { success: false, message: `Perfil padrão '${targetRoleName}' ou 'USER' não encontrado.` };

        await connection.beginTransaction();
        const [userRows] = await connection.execute('SELECT * FROM users WHERE uid = ?', [userId]);
        let finalProfileData: UserProfileData;

        if ((userRows as RowDataPacket[]).length > 0) {
            const userDataFromDB = mapToUserProfileData(mapMySqlRowToCamelCase((userRows as RowDataPacket[])[0]));
            const updatePayload: any = { updatedAt: new Date() };
            let needsUpdate = false;
            if (String(userDataFromDB.roleId) !== String(targetRole.id)) { updatePayload.role_id = Number(targetRole.id); needsUpdate = true; }
            if (userDataFromDB.roleName !== targetRole.name) { updatePayload.role_name = targetRole.name; needsUpdate = true; }
            const dbPermissions = userDataFromDB.permissions || [];
            const targetPermissions = targetRole.permissions || [];
            if (JSON.stringify([...dbPermissions].sort()) !== JSON.stringify([...targetPermissions].sort())) {
                updatePayload.permissions = JSON.stringify(targetPermissions);
                needsUpdate = true;
            }
            if (additionalProfileData?.password) { updatePayload.password_text = additionalProfileData.password; needsUpdate = true;}
            if (additionalProfileData) {
                for (const key in additionalProfileData) {
                    if (key !== 'password' && Object.prototype.hasOwnProperty.call(additionalProfileData, key)) {
                        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase() as keyof UserProfileData;
                        // @ts-ignore
                        if (additionalProfileData[key] !== undefined && additionalProfileData[key] !== userDataFromDB[dbKey]) {
                            // @ts-ignore
                            updatePayload[dbKey] = additionalProfileData[key];
                            needsUpdate = true;
                        }
                    }
                }
            }
            if (needsUpdate) {
                const updateFields: string[] = []; const updateValues: any[] = [];
                Object.keys(updatePayload).forEach(key => { const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase(); updateFields.push(`${sqlColumn} = ?`); updateValues.push(updatePayload[key]); });
                updateValues.push(userId);
                await connection.execute(`UPDATE users SET ${updateFields.join(', ')} WHERE uid = ?`, updateValues);
            }
            finalProfileData = { ...userDataFromDB, ...updatePayload, uid: userId, permissions: targetRole.permissions || [] } as UserProfileData;
        } else {
            const insertQuery = `INSERT INTO users (uid, email, full_name, password_text, role_id, permissions, status, habilitation_status, cpf, cell_phone, date_of_birth, account_type, razao_social, cnpj, inscricao_estadual, website_comitente, zip_code, street, \`number\`, complement, neighborhood, city, state, opt_in_marketing, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());`;
            const insertValues = [userId, email, fullName || email.split('@')[0], additionalProfileData?.password || null, Number(targetRole.id), JSON.stringify(targetRole.permissions || []), 'ATIVO', targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS', additionalProfileData?.cpf || null, additionalProfileData?.cellPhone || null, additionalProfileData?.dateOfBirth || null, additionalProfileData?.accountType || null, additionalProfileData?.razaoSocial || null, additionalProfileData?.cnpj || null, additionalProfileData?.inscricaoEstadual || null, additionalProfileData?.websiteComitente || null, additionalProfileData?.zipCode || null, additionalProfileData?.street || null, additionalProfileData?.number || null, additionalProfileData?.complement || null, additionalProfileData?.neighborhood || null, additionalProfileData?.city || null, additionalProfileData?.state || null, additionalProfileData?.optInMarketing || false];
            await connection.execute(insertQuery, insertValues);
            const [newUserRows] = await connection.execute('SELECT * FROM users WHERE uid = ?', [userId]);
            finalProfileData = mapToUserProfileData(mapMySqlRowToCamelCase((newUserRows as RowDataPacket[])[0]), targetRole);
        }
        await connection.commit();
        return { success: true, message: 'Perfil de usuário assegurado/atualizado (MySQL).', userProfile: finalProfileData };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  getUsersWithRoles = async (): Promise<UserProfileData[]> => {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.execute(`SELECT u.*, r.name as role_name, r.permissions as role_permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.full_name ASC;`);
      return (rows as RowDataPacket[]).map(row => {
        const profile = mapToUserProfileData(mapMySqlRowToCamelCase(row));
        if ((!profile.permissions || profile.permissions.length === 0) && row.role_permissions) { profile.permissions = typeof row.role_permissions === 'string' ? JSON.parse(row.role_permissions) : (row.role_permissions || []); }
        return profile;
      });
    } catch (e: any) { return []; } finally { connection.release(); }
  }
  updateUserRole = async (userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      let roleName = null; let permissions = null;
      if (roleId && roleId !== "---NONE---") {
        const role = await this.getRole(roleId);
        if (role) { roleName = role.name; permissions = JSON.stringify(role.permissions || []); }
        else return { success: false, message: 'Perfil não encontrado.'};
      }
      await connection.execute('UPDATE users SET role_id = ?, role_name = ?, permissions = ?, updated_at = NOW() WHERE uid = ?', [roleId ? Number(roleId) : null, roleName, permissions, userId]);
      return { success: true, message: 'Perfil do usuário atualizado (MySQL)!'};
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  deleteUserProfile = async (userId: string): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM users WHERE uid = ?', [userId]);
      return { success: true, message: 'Perfil de usuário excluído (MySQL)!'};
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  getUserByEmail = async (email: string): Promise<UserProfileData | null> => {
    const connection = await getPool().getConnection();
    try {
      const query = 'SELECT u.*, r.name as role_name, r.permissions as role_permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = ? LIMIT 1;';
      const [rows] = await connection.execute(query, [email.toLowerCase()]);
      if ((rows as RowDataPacket[]).length === 0) return null;
      const userRow = mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]);
      let role: Role | null = null;
      if (userRow.roleId) role = await this.getRole(userRow.roleId);
      const profile = mapToUserProfileData(userRow, role);
      if ((!profile.permissions || profile.permissions.length === 0) && role?.permissions?.length) { profile.permissions = role.permissions; }
      return profile;
    } catch (e: any) { return null; } finally { connection.release(); }
  }
  deleteMediaItemFromDb = async (id: string): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      await connection.execute('DELETE FROM media_items WHERE id = ?;', [Number(id)]);
      return { success: true, message: 'Item de mídia excluído do DB (MySQL).' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  linkMediaItemsToLot = async (lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      for (const mediaId of mediaItemIds) {
        await connection.execute(`UPDATE media_items SET linked_lot_ids = JSON_ARRAY_APPEND(COALESCE(linked_lot_ids, '[]'), '$', ?) WHERE id = ? AND NOT JSON_CONTAINS(COALESCE(linked_lot_ids, '[]'), CAST(? AS JSON), '$');`, [lotId, Number(mediaId), lotId]);
      }
      await connection.execute(`UPDATE lots SET media_item_ids = JSON_ARRAY_APPEND(COALESCE(media_item_ids, '[]'), '$', ?), updated_at = NOW() WHERE id = ?;`, [JSON.stringify(mediaItemIds), Number(lotId)]);
      await connection.commit();
      return { success: true, message: 'Mídias vinculadas (MySQL).' };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  unlinkMediaItemFromLot = async (lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`UPDATE media_items SET linked_lot_ids = JSON_REMOVE(COALESCE(linked_lot_ids, '[]'), JSON_UNQUOTE(JSON_SEARCH(COALESCE(linked_lot_ids, '[]'), 'one', ?))) WHERE id = ?;`, [lotId, Number(mediaItemId)]);
      await connection.execute(`UPDATE lots SET media_item_ids = JSON_REMOVE(COALESCE(media_item_ids, '[]'), JSON_UNQUOTE(JSON_SEARCH(COALESCE(media_item_ids, '[]'), 'one', ?))), updated_at = NOW() WHERE id = ?;`, [mediaItemId, Number(lotId)]);
      await connection.commit();
      return { success: true, message: 'Mídia desvinculada (MySQL).' };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message }; } finally { connection.release(); }
  }
  getPlatformSettings = async (): Promise<PlatformSettings> => {
    const connection = await getPool().getConnection();
    try {
        const [rows] = await connection.execute(`SELECT site_title, site_tagline, gallery_image_base_path, active_theme_name, themes, platform_public_id_masks, updated_at FROM platform_settings WHERE id = 'global';`);
        if ((rows as RowDataPacket[]).length > 0) { return mapToPlatformSettings(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0])); }
        const defaultSettings: PlatformSettings = { id: 'global', siteTitle: 'BidExpert', siteTagline: 'Leilões Online Especializados', galleryImageBasePath: '/media/gallery/', activeThemeName: null, themes: [], platformPublicIdMasks: {}, updatedAt: new Date() };
        await connection.execute(`INSERT INTO platform_settings (id, site_title, site_tagline, gallery_image_base_path, themes, platform_public_id_masks) VALUES ('global', ?, ?, ?, '[]', '{}') ON DUPLICATE KEY UPDATE id=id;`, [defaultSettings.siteTitle, defaultSettings.siteTagline, defaultSettings.galleryImageBasePath]);
        return defaultSettings;
    } catch (e: any) { return { id: 'global', siteTitle: 'BidExpert', siteTagline: 'Leilões Online Especializados', galleryImageBasePath: '/media/gallery/', activeThemeName: null, themes: [], platformPublicIdMasks: {}, updatedAt: new Date() }; } finally { connection.release(); }
  }
  updatePlatformSettings = async (data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> => {
    const connection = await getPool().getConnection();
    if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) { return { success: false, message: 'Caminho base da galeria inválido. Deve começar e terminar com "/".' }; }
    try {
        const query = `INSERT INTO platform_settings (id, site_title, site_tagline, gallery_image_base_path, active_theme_name, themes, platform_public_id_masks, updated_at) VALUES ('global', ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE site_title = VALUES(site_title), site_tagline = VALUES(site_tagline), gallery_image_base_path = VALUES(gallery_image_base_path), active_theme_name = VALUES(active_theme_name), themes = VALUES(themes), platform_public_id_masks = VALUES(platform_public_id_masks), updated_at = NOW();`;
        await connection.execute(query, [data.siteTitle || null, data.siteTagline || null, data.galleryImageBasePath, data.activeThemeName || null, JSON.stringify(data.themes || []), JSON.stringify(data.platformPublicIdMasks || {})]);
        return { success: true, message: 'Configurações atualizadas (MySQL)!' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
}

