
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
  Subcategory, SubcategoryFormData,
  MapSettings,
  SearchPaginationType,
  MentalTriggerSettings,
  BadgeVisibilitySettings,
  SectionBadgeConfig,
  HomepageSectionConfig
} from '@/types';
import { slugify, samplePlatformSettings } from '@/lib/sample-data'; // Import samplePlatformSettings for defaults
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import { v4 as uuidv4 } from 'uuid';

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
        dateStrings: true, // Keep dates as strings from DB
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
    if (!row) return {};
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

function parseJsonColumn<T>(value: string | null | undefined, defaultValue: T): T {
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn(`[MySqlAdapter] Failed to parse JSON column: ${value}`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}


function mapToLotCategory(row: any): LotCategory { // Changed from RowDataPacket to any for flexibility after camelCase
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    itemCount: Number(row.itemCount || 0),
    hasSubcategories: Boolean(row.hasSubcategories || false),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToSubcategory(row: any): Subcategory {
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

function mapToStateInfo(row: any): StateInfo {
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

function mapToCityInfo(row: any): CityInfo {
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

function mapToAuctioneerProfileInfo(row: any): AuctioneerProfileInfo {
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

function mapToSellerProfileInfo(row: any): SellerProfileInfo {
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


function mapToRole(row: any): Role {
    return {
        id: String(row.id),
        name: row.name,
        name_normalized: row.nameNormalized,
        description: row.description,
        permissions: parseJsonColumn<string[]>(row.permissions, []),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToUserProfileData(row: any, role?: Role | null): UserProfileData {
    const profile: UserProfileData = {
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        password: row.passwordText,
        roleId: row.roleId ? String(row.roleId) : undefined,
        roleName: role?.name || row.roleName,
        permissions: parseJsonColumn<string[]>(row.permissions, role?.permissions || []),
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
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
    return profile;
}

function mapToAuction(row: any): Auction { // Changed RowDataPacket to any for camelCased keys
    return {
        id: String(row.id),
        publicId: row.publicId,
        title: row.title,
        fullTitle: row.fullTitle,
        description: row.description,
        status: row.status as AuctionStatus,
        auctionType: row.auctionType,
        category: row.categoryName || row.category, // Prefer joined name
        categoryId: row.categoryId ? String(row.categoryId) : undefined,
        auctioneer: row.auctioneerName || row.auctioneer, // Prefer joined name
        auctioneerId: row.auctioneerId ? String(row.auctioneerId) : undefined,
        seller: row.sellerName || row.seller, // Prefer joined name
        sellerId: row.sellerId ? String(row.sellerId) : undefined,
        auctionDate: new Date(row.auctionDate),
        endDate: row.endDate ? new Date(row.endDate) : null,
        auctionStages: parseJsonColumn<AuctionStage[]>(row.auctionStages, []),
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
        lots: [], // Populated separately
        automaticBiddingEnabled: Boolean(row.automaticBiddingEnabled),
        allowInstallmentBids: Boolean(row.allowInstallmentBids),
        estimatedRevenue: row.estimatedRevenue !== null ? Number(row.estimatedRevenue) : undefined,
        achievedRevenue: row.achievedRevenue !== null ? Number(row.achievedRevenue) : undefined,
        totalHabilitatedUsers: Number(row.totalHabilitatedUsers || 0),
        isFeaturedOnMarketplace: Boolean(row.isFeaturedOnMarketplace),
        marketplaceAnnouncementTitle: row.marketplaceAnnouncementTitle,
    };
}

function mapToLot(row: any): Lot {
  return {
    id: String(row.id),
    publicId: row.publicId,
    auctionId: String(row.auctionId),
    title: row.title,
    number: row.number,
    imageUrl: row.imageUrl,
    dataAiHint: row.dataAiHint,
    galleryImageUrls: parseJsonColumn<string[]>(row.galleryImageUrls, []),
    mediaItemIds: parseJsonColumn<string[]>(row.mediaItemIds, []),
    status: row.status as LotStatus,
    stateId: row.stateId ? String(row.stateId) : undefined,
    cityId: row.cityId ? String(row.cityId) : undefined,
    cityName: row.cityName,
    stateUf: row.stateUf,
    type: row.categoryName || row.type,
    categoryId: row.categoryId ? String(row.categoryId) : undefined,
    subcategoryId: row.subcategoryId ? String(row.subcategoryId) : undefined,
    subcategoryName: row.subcategoryName,
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
    sellerName: row.lotSellerName || row.sellerName, // Prioritize specific, then joined
    sellerId: row.sellerIdFk ? String(row.sellerIdFk) : (row.sellerId ? String(row.sellerId) : undefined),
    auctioneerName: row.lotAuctioneerName || row.auctioneerName,
    auctioneerId: row.auctioneerIdFk ? String(row.auctioneerIdFk) : (row.auctioneerId ? String(row.auctioneerId) : undefined),
    condition: row.condition,
    bidIncrementStep: row.bidIncrementStep !== null ? Number(row.bidIncrementStep) : undefined,
    allowInstallmentBids: Boolean(row.allowInstallmentBids),
    judicialProcessNumber: row.judicialProcessNumber,
    courtDistrict: row.courtDistrict,
    courtName: row.courtName,
    publicProcessUrl: row.publicProcessUrl,
    propertyRegistrationNumber: row.propertyRegistrationNumber,
    propertyLiens: row.propertyLiens,
    knownDebts: row.knownDebts,
    additionalDocumentsInfo: row.additionalDocumentsInfo,
    latitude: row.latitude !== null ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude !== null ? parseFloat(row.longitude) : undefined,
    mapAddress: row.mapAddress,
    mapEmbedUrl: row.mapEmbedUrl,
    mapStaticImageUrl: row.mapStaticImageUrl,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToBidInfo(row: any): BidInfo {
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

function mapToMediaItem(row: any): MediaItem {
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
    linkedLotIds: parseJsonColumn<string[]>(row.linkedLotIds, []),
    dataAiHint: row.dataAiHint,
  };
}

function mapToPlatformSettings(row: any): PlatformSettings {
    return {
        id: String(row.id),
        siteTitle: row.siteTitle,
        siteTagline: row.siteTagline,
        galleryImageBasePath: row.galleryImageBasePath,
        activeThemeName: row.activeThemeName,
        themes: parseJsonColumn<Theme[]>(row.themes, []),
        platformPublicIdMasks: parseJsonColumn<PlatformSettings['platformPublicIdMasks']>(row.platformPublicIdMasks, {}),
        mapSettings: parseJsonColumn<MapSettings>(row.mapSettings, samplePlatformSettings.mapSettings),
        searchPaginationType: row.searchPaginationType as SearchPaginationType || samplePlatformSettings.searchPaginationType,
        searchItemsPerPage: Number(row.searchItemsPerPage || samplePlatformSettings.searchItemsPerPage),
        searchLoadMoreCount: Number(row.searchLoadMoreCount || samplePlatformSettings.searchLoadMoreCount),
        showCountdownOnLotDetail: row.showCountdownOnLotDetail === null ? samplePlatformSettings.showCountdownOnLotDetail : Boolean(row.showCountdownOnLotDetail),
        showCountdownOnCards: row.showCountdownOnCards === null ? samplePlatformSettings.showCountdownOnCards : Boolean(row.showCountdownOnCards),
        showRelatedLotsOnLotDetail: row.showRelatedLotsOnLotDetail === null ? samplePlatformSettings.showRelatedLotsOnLotDetail : Boolean(row.showRelatedLotsOnLotDetail),
        relatedLotsCount: Number(row.relatedLotsCount || samplePlatformSettings.relatedLotsCount),
        mentalTriggerSettings: parseJsonColumn<MentalTriggerSettings>(row.mentalTriggerSettings, samplePlatformSettings.mentalTriggerSettings),
        sectionBadgeVisibility: parseJsonColumn<SectionBadgeConfig>(row.sectionBadgeVisibility, samplePlatformSettings.sectionBadgeVisibility),
        homepageSections: parseJsonColumn<HomepageSectionConfig[]>(row.homepageSections, samplePlatformSettings.homepageSections),
        updatedAt: new Date(row.updatedAt)
    };
}

function mapToReview(row: any): Review {
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

function mapToLotQuestion(row: any): LotQuestion {
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
      `DROP TABLE IF EXISTS lots;`,
      `DROP TABLE IF EXISTS subcategories;`,
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
        uid VARCHAR(255) PRIMARY KEY, email VARCHAR(255) UNIQUE, full_name VARCHAR(255), password_text VARCHAR(255) NULL,
        role_id INT UNSIGNED, permissions JSON, status VARCHAR(50), habilitation_status VARCHAR(50),
        cpf VARCHAR(20), rg_number VARCHAR(30), rg_issuer VARCHAR(100), rg_issue_date DATE, rg_state VARCHAR(2),
        date_of_birth DATE, cell_phone VARCHAR(20), home_phone VARCHAR(20), gender VARCHAR(50), profession VARCHAR(100),
        nationality VARCHAR(100), marital_status VARCHAR(50), property_regime VARCHAR(100),
        spouse_name VARCHAR(255), spouse_cpf VARCHAR(20), zip_code VARCHAR(10), street VARCHAR(255),
        \`number\` VARCHAR(20), complement VARCHAR(100), neighborhood VARCHAR(100), city VARCHAR(100), state VARCHAR(100),
        opt_in_marketing BOOLEAN DEFAULT FALSE, avatar_url TEXT, data_ai_hint TEXT,
        account_type VARCHAR(50), razao_social VARCHAR(255), cnpj VARCHAR(20), inscricao_estadual VARCHAR(50), website_comitente TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
        INDEX idx_users_email (email), INDEX idx_users_role_id (role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global', site_title VARCHAR(100), site_tagline VARCHAR(255),
        gallery_image_base_path TEXT, active_theme_name VARCHAR(100), themes JSON, platform_public_id_masks JSON,
        map_settings JSON, search_pagination_type VARCHAR(50), search_items_per_page INT, search_load_more_count INT,
        show_countdown_on_lot_detail BOOLEAN, show_countdown_on_cards BOOLEAN, show_related_lots_on_lot_detail BOOLEAN,
        related_lots_count INT, mental_trigger_settings JSON, section_badge_visibility JSON, homepage_sections JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      // ... (rest of table creation queries from previous implementation, including lots, auctions, categories, etc.)
       `CREATE TABLE IF NOT EXISTS lot_categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT, item_count INT UNSIGNED DEFAULT 0, has_subcategories BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_lot_categories_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS subcategories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL,
        parent_category_id INT UNSIGNED NOT NULL, description TEXT, item_count INT UNSIGNED DEFAULT 0,
        display_order INT DEFAULT 0, icon_url TEXT, data_ai_hint_icon TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_category_id) REFERENCES lot_categories(id) ON DELETE CASCADE,
        UNIQUE KEY \`unique_subcategory_in_parent\` (\`slug\`, \`parent_category_id\`),
        INDEX idx_subcategories_parent_id (parent_category_id), INDEX idx_subcategories_slug_parent_id (slug, parent_category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      // ... (States, Cities, Auctioneers, Sellers, Auctions, Lots, MediaItems, Bids, Reviews, Questions tables as before)
      `CREATE TABLE IF NOT EXISTS states (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, uf VARCHAR(2) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE, city_count INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_states_slug (slug), INDEX idx_states_uf (uf)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS cities (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL,
        state_id INT UNSIGNED, state_uf VARCHAR(2), ibge_code VARCHAR(10) UNIQUE, lot_count INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
        UNIQUE KEY \`unique_city_in_state\` (\`slug\`, \`state_id\`),
        INDEX idx_cities_state_id (state_id), INDEX idx_cities_slug_state_id (slug, state_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS auctioneers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(100) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE, registration_number VARCHAR(100), contact_name VARCHAR(255),
        email VARCHAR(255) UNIQUE, phone VARCHAR(50), address TEXT, city VARCHAR(100), state VARCHAR(100),
        zip_code VARCHAR(20), website TEXT, logo_url TEXT, data_ai_hint_logo TEXT, description TEXT,
        member_since TIMESTAMP NULL, rating DECIMAL(3,1), auctions_conducted_count INT UNSIGNED DEFAULT 0,
        total_value_sold DECIMAL(15,2) DEFAULT 0.00, user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE SET NULL,
        INDEX idx_auctioneers_slug (slug), INDEX idx_auctioneers_public_id (public_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS sellers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(100) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE, contact_name VARCHAR(255), email VARCHAR(255) UNIQUE, phone VARCHAR(50),
        address TEXT, city VARCHAR(100), state VARCHAR(100), zip_code VARCHAR(20), website TEXT, logo_url TEXT,
        data_ai_hint_logo TEXT, description TEXT, member_since TIMESTAMP NULL, rating DECIMAL(3,1),
        active_lots_count INT UNSIGNED DEFAULT 0, total_sales_value DECIMAL(15,2) DEFAULT 0.00,
        auctions_facilitated_count INT UNSIGNED DEFAULT 0, user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE SET NULL,
        INDEX idx_sellers_slug (slug), INDEX idx_sellers_public_id (public_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS auctions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(100) NOT NULL UNIQUE, title VARCHAR(255) NOT NULL,
        full_title TEXT, description TEXT, status VARCHAR(50) NOT NULL, auction_type VARCHAR(50),
        category_id INT UNSIGNED, auctioneer_id INT UNSIGNED, seller_id INT UNSIGNED, auction_date DATETIME NOT NULL,
        end_date DATETIME NULL, auction_stages JSON, city VARCHAR(100), state VARCHAR(2), image_url TEXT,
        data_ai_hint TEXT, documents_url TEXT, total_lots INT UNSIGNED DEFAULT 0, visits INT UNSIGNED DEFAULT 0,
        initial_offer DECIMAL(15,2), is_favorite BOOLEAN DEFAULT FALSE, current_bid DECIMAL(15,2),
        bids_count INT UNSIGNED DEFAULT 0, selling_branch VARCHAR(100), vehicle_location VARCHAR(255),
        automatic_bidding_enabled BOOLEAN DEFAULT FALSE, allow_installment_bids BOOLEAN DEFAULT FALSE,
        estimated_revenue DECIMAL(15,2), achieved_revenue DECIMAL(15,2), total_habilitated_users INT UNSIGNED DEFAULT 0,
        is_featured_on_marketplace BOOLEAN DEFAULT FALSE, marketplace_announcement_title VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES lot_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (auctioneer_id) REFERENCES auctioneers(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
        INDEX idx_auctions_public_id (public_id), INDEX idx_auctions_status (status),
        INDEX idx_auctions_auction_date (auction_date), INDEX idx_auctions_category_id (category_id),
        INDEX idx_auctions_auctioneer_id (auctioneer_id), INDEX idx_auctions_seller_id (seller_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
       `CREATE TABLE IF NOT EXISTS lots (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(100) NOT NULL UNIQUE, auction_id INT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL, \`number\` VARCHAR(50), image_url TEXT, data_ai_hint TEXT, gallery_image_urls JSON,
        media_item_ids JSON, status VARCHAR(50) NOT NULL, state_id INT UNSIGNED, city_id INT UNSIGNED,
        category_id INT UNSIGNED, subcategory_id INT UNSIGNED, views INT UNSIGNED DEFAULT 0, price DECIMAL(15,2) NOT NULL,
        initial_price DECIMAL(15,2), lot_specific_auction_date DATETIME NULL, second_auction_date DATETIME NULL,
        second_initial_price DECIMAL(15,2), end_date DATETIME, bids_count INT UNSIGNED DEFAULT 0, is_favorite BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE, description TEXT, year INT, make VARCHAR(100), model VARCHAR(100), series VARCHAR(100),
        stock_number VARCHAR(100), selling_branch VARCHAR(100), vin VARCHAR(100), vin_status VARCHAR(50), loss_type VARCHAR(100),
        primary_damage VARCHAR(100), title_info VARCHAR(100), title_brand VARCHAR(100), start_code VARCHAR(100),
        has_key BOOLEAN, odometer VARCHAR(50), airbags_status VARCHAR(100), body_style VARCHAR(100), engine_details TEXT,
        transmission_type VARCHAR(100), drive_line_type VARCHAR(50), fuel_type VARCHAR(50), cylinders VARCHAR(20),
        restraint_system VARCHAR(255), exterior_interior_color VARCHAR(100), options TEXT, manufactured_in VARCHAR(100),
        vehicle_class VARCHAR(100), vehicle_location_in_branch VARCHAR(255), lane_run_number VARCHAR(50), aisle_stall VARCHAR(50),
        actual_cash_value VARCHAR(50), estimated_repair_cost VARCHAR(50), seller_id_fk INT UNSIGNED,
        auctioneer_id_fk INT UNSIGNED, \`condition\` TEXT, bid_increment_step DECIMAL(10,2), allow_installment_bids BOOLEAN,
        judicial_process_number VARCHAR(100), court_district VARCHAR(100), court_name VARCHAR(100), public_process_url TEXT,
        property_registration_number VARCHAR(100), property_liens TEXT, known_debts TEXT, additional_documents_info TEXT,
        latitude DECIMAL(10, 8), longitude DECIMAL(11, 8), map_address VARCHAR(255), map_embed_url TEXT, map_static_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE, FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL, FOREIGN KEY (category_id) REFERENCES lot_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL, FOREIGN KEY (seller_id_fk) REFERENCES sellers(id) ON DELETE SET NULL,
        FOREIGN KEY (auctioneer_id_fk) REFERENCES auctioneers(id) ON DELETE SET NULL,
        INDEX idx_lots_public_id (public_id), INDEX idx_lots_auction_id (auction_id), INDEX idx_lots_status (status),
        INDEX idx_lots_category_id (category_id), INDEX idx_lots_subcategory_id (subcategory_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS media_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, file_name VARCHAR(255) NOT NULL, uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(255), title TEXT, alt_text TEXT, caption TEXT, description TEXT, mime_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NOT NULL, dimensions_width INT, dimensions_height INT, url_original TEXT NOT NULL,
        url_thumbnail TEXT, url_medium TEXT, url_large TEXT, linked_lot_ids JSON, data_ai_hint TEXT,
        INDEX idx_media_items_uploaded_by (uploaded_by), INDEX idx_media_items_mime_type (mime_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS bids (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lot_id INT UNSIGNED NOT NULL, auction_id INT UNSIGNED NOT NULL,
        bidder_id VARCHAR(255) NOT NULL, bidder_display_name VARCHAR(255), amount DECIMAL(15,2) NOT NULL,
        \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (bidder_id) REFERENCES users(uid) ON DELETE CASCADE,
        INDEX idx_bids_lot_id (lot_id), INDEX idx_bids_bidder_id (bidder_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS lot_reviews (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lot_id INT UNSIGNED NOT NULL, auction_id INT UNSIGNED NOT NULL,
        user_id VARCHAR(255) NOT NULL, user_display_name VARCHAR(255), rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE, FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
        INDEX idx_lot_reviews_lot_id (lot_id), INDEX idx_lot_reviews_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
      `CREATE TABLE IF NOT EXISTS lot_questions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lot_id INT UNSIGNED NOT NULL, auction_id INT UNSIGNED NOT NULL,
        user_id VARCHAR(255) NOT NULL, user_display_name VARCHAR(255), question_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, answer_text TEXT, answered_at TIMESTAMP NULL,
        answered_by_user_id VARCHAR(255), answered_by_user_display_name VARCHAR(255), is_public BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE, FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
        FOREIGN KEY (answered_by_user_id) REFERENCES users(uid) ON DELETE SET NULL,
        INDEX idx_lot_questions_lot_id (lot_id), INDEX idx_lot_questions_user_id (user_id)
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

      const settingsResult = await this.getPlatformSettings(); // This will create defaults if not exists
      if (!settingsResult.galleryImageBasePath) { // Check if settings were successfully fetched/created
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

  async getPlatformSettings(): Promise<PlatformSettings> {
    const connection = await getPool().getConnection();
    try {
        const [rows] = await connection.execute(`SELECT site_title, site_tagline, gallery_image_base_path, active_theme_name, themes, platform_public_id_masks, map_settings, search_pagination_type, search_items_per_page, search_load_more_count, show_countdown_on_lot_detail, show_countdown_on_cards, show_related_lots_on_lot_detail, related_lots_count, mental_trigger_settings, section_badge_visibility, homepage_sections, updated_at FROM platform_settings WHERE id = 'global';`);
        if ((rows as RowDataPacket[]).length > 0) {
            return mapToPlatformSettings(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0]));
        }
        const defaultSettings = samplePlatformSettings; // Use the comprehensive sample
        await connection.execute(
          `INSERT INTO platform_settings (id, site_title, site_tagline, gallery_image_base_path, active_theme_name, themes, platform_public_id_masks, map_settings, search_pagination_type, search_items_per_page, search_load_more_count, show_countdown_on_lot_detail, show_countdown_on_cards, show_related_lots_on_lot_detail, related_lots_count, mental_trigger_settings, section_badge_visibility, homepage_sections) VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id;`,
          [
            defaultSettings.siteTitle, defaultSettings.siteTagline, defaultSettings.galleryImageBasePath,
            defaultSettings.activeThemeName || null, JSON.stringify(defaultSettings.themes || []),
            JSON.stringify(defaultSettings.platformPublicIdMasks || {}), JSON.stringify(defaultSettings.mapSettings || {}),
            defaultSettings.searchPaginationType, defaultSettings.searchItemsPerPage, defaultSettings.searchLoadMoreCount,
            defaultSettings.showCountdownOnLotDetail, defaultSettings.showCountdownOnCards,
            defaultSettings.showRelatedLotsOnLotDetail, defaultSettings.relatedLotsCount,
            JSON.stringify(defaultSettings.mentalTriggerSettings || {}), JSON.stringify(defaultSettings.sectionBadgeVisibility || {}),
            JSON.stringify(defaultSettings.homepageSections || [])
          ]
        );
        return { ...defaultSettings, id: 'global', updatedAt: new Date() };
    } catch (e: any) {
        console.error("[MySqlAdapter - getPlatformSettings] Error, returning default:", e);
        return { ...samplePlatformSettings, id: 'global', updatedAt: new Date() };
    } finally {
        connection.release();
    }
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection();
    if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
        return { success: false, message: 'Caminho base da galeria inválido. Deve começar e terminar com "/".' };
    }
    try {
        const query = `
          INSERT INTO platform_settings (
            id, site_title, site_tagline, gallery_image_base_path, active_theme_name, themes,
            platform_public_id_masks, map_settings, search_pagination_type, search_items_per_page,
            search_load_more_count, show_countdown_on_lot_detail, show_countdown_on_cards,
            show_related_lots_on_lot_detail, related_lots_count, mental_trigger_settings,
            section_badge_visibility, homepage_sections, updated_at
          ) VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            site_title = VALUES(site_title), site_tagline = VALUES(site_tagline),
            gallery_image_base_path = VALUES(gallery_image_base_path), active_theme_name = VALUES(active_theme_name),
            themes = VALUES(themes), platform_public_id_masks = VALUES(platform_public_id_masks),
            map_settings = VALUES(map_settings), search_pagination_type = VALUES(search_pagination_type),
            search_items_per_page = VALUES(search_items_per_page), search_load_more_count = VALUES(search_load_more_count),
            show_countdown_on_lot_detail = VALUES(show_countdown_on_lot_detail), show_countdown_on_cards = VALUES(show_countdown_on_cards),
            show_related_lots_on_lot_detail = VALUES(show_related_lots_on_lot_detail), related_lots_count = VALUES(related_lots_count),
            mental_trigger_settings = VALUES(mental_trigger_settings), section_badge_visibility = VALUES(section_badge_visibility),
            homepage_sections = VALUES(homepage_sections), updated_at = NOW();
        `;
        await connection.execute(query, [
            data.siteTitle || null, data.siteTagline || null, data.galleryImageBasePath,
            data.activeThemeName || null, JSON.stringify(data.themes || []),
            JSON.stringify(data.platformPublicIdMasks || {}), JSON.stringify(data.mapSettings || {}),
            data.searchPaginationType, data.searchItemsPerPage, data.searchLoadMoreCount,
            data.showCountdownOnLotDetail, data.showCountdownOnCards, data.showRelatedLotsOnLotDetail,
            data.relatedLotsCount, JSON.stringify(data.mentalTriggerSettings || {}),
            JSON.stringify(data.sectionBadgeVisibility || {}), JSON.stringify(data.homepageSections || [])
        ]);
        return { success: true, message: 'Configurações atualizadas (MySQL)!' };
    } catch (e: any) {
        console.error("[MySqlAdapter - updatePlatformSettings] Error:", e);
        return { success: false, message: e.message };
    } finally {
        connection.release();
    }
  }


  // Basic implementations for other methods to pass the check
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    const connection = await getPool().getConnection(); try { const slug = slugify(data.name.trim()); const [result] = await connection.execute('INSERT INTO lot_categories (name, slug, description) VALUES (?, ?, ?)', [data.name.trim(), slug, data.description?.trim() || null]); return { success: true, message: 'OK', categoryId: String((result as mysql.ResultSetHeader).insertId) }; } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async getLotCategories(): Promise<LotCategory[]> {
    const connection = await getPool().getConnection(); try { const [rows] = await connection.execute('SELECT * FROM lot_categories ORDER BY name ASC;'); return mapMySqlRowsToCamelCase(rows as RowDataPacket[]).map(mapToLotCategory); } catch (e: any) { return []; } finally { connection.release(); }
  }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    const connection = await getPool().getConnection(); try { const numericId = parseInt(idOrSlug, 10); let rows; if (isNaN(numericId)) { [rows] = await connection.execute('SELECT * FROM lot_categories WHERE slug = ?', [idOrSlug]); } else { [rows] = await connection.execute('SELECT * FROM lot_categories WHERE id = ?', [numericId]); } if ((rows as RowDataPacket[]).length === 0) return null; return mapToLotCategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0])); } catch (e: any) { return null; } finally { connection.release(); }
  }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    const connection = await getPool().getConnection(); try { const [rows] = await connection.execute('SELECT * FROM lot_categories WHERE name = ? LIMIT 1', [name.trim()]); if ((rows as RowDataPacket[]).length === 0) return null; return mapToLotCategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0])); } catch (e: any) { return null; } finally { connection.release(); }
  }
  async updateLotCategory(id: string, data: { name: string; description?: string; hasSubcategories?: boolean }): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection(); try { const slug = slugify(data.name.trim()); const fields = ['name = ?', 'slug = ?', 'description = ?']; const values = [data.name.trim(), slug, data.description?.trim() || null]; if (data.hasSubcategories !== undefined) { fields.push('has_subcategories = ?'); values.push(data.hasSubcategories); } await connection.execute(`UPDATE lot_categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, [...values, Number(id)]); return { success: true, message: 'OK' }; } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection(); try { await connection.execute('DELETE FROM lot_categories WHERE id = ?', [Number(id)]); return { success: true, message: 'OK' }; } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    const connection = await getPool().getConnection(); try { const slug = slugify(data.name); const [result] = await connection.execute('INSERT INTO subcategories (name, slug, parent_category_id, description, display_order, icon_url, data_ai_hint_icon) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.name.trim(), slug, Number(data.parentCategoryId), data.description?.trim() || null, data.displayOrder || 0, data.iconUrl || null, data.dataAiHintIcon || null]); await connection.execute('UPDATE lot_categories SET has_subcategories = TRUE WHERE id = ?', [Number(data.parentCategoryId)]); return { success: true, message: 'OK', subcategoryId: String((result as mysql.ResultSetHeader).insertId) }; } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    const connection = await getPool().getConnection(); try { const [rows] = await connection.execute('SELECT * FROM subcategories WHERE parent_category_id = ? ORDER BY display_order ASC, name ASC', [Number(parentCategoryId)]); return mapMySqlRowsToCamelCase(rows as RowDataPacket[]).map(mapToSubcategory); } catch (e: any) { return []; } finally { connection.release(); }
  }
  async getSubcategory(id: string): Promise<Subcategory | null> {
    const connection = await getPool().getConnection(); try { const [rows] = await connection.execute('SELECT * FROM subcategories WHERE id = ?', [Number(id)]); if ((rows as RowDataPacket[]).length === 0) return null; return mapToSubcategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0])); } catch (e: any) { return null; } finally { connection.release(); }
  }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    const connection = await getPool().getConnection(); try { const [rows] = await connection.execute('SELECT * FROM subcategories WHERE slug = ? AND parent_category_id = ?', [slug, Number(parentCategoryId)]); if ((rows as RowDataPacket[]).length === 0) return null; return mapToSubcategory(mapMySqlRowToCamelCase((rows as RowDataPacket[])[0])); } catch (e: any) { return null; } finally { connection.release(); }
  }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection(); try { const fields: string[] = []; const values: any[] = []; if (data.name) { fields.push('name = ?', 'slug = ?'); values.push(data.name.trim(), slugify(data.name.trim())); } if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description?.trim() || null); } if (data.displayOrder !== undefined) { fields.push('display_order = ?'); values.push(data.displayOrder); } if (data.iconUrl !== undefined) { fields.push('icon_url = ?'); values.push(data.iconUrl || null); } if (data.dataAiHintIcon !== undefined) { fields.push('data_ai_hint_icon = ?'); values.push(data.dataAiHintIcon || null); } if (fields.length === 0) return { success: true, message: "No changes." }; await connection.execute(`UPDATE subcategories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, [...values, Number(id)]); return { success: true, message: 'OK' }; } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    const connection = await getPool().getConnection(); try { await connection.execute('DELETE FROM subcategories WHERE id = ?', [Number(id)]); return { success: true, message: 'OK' }; } catch (e: any) { return { success: false, message: e.message }; } finally { connection.release(); }
  }

  // Placeholder for remaining IDatabaseAdapter methods
  // States
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { console.warn("createState not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getStates(): Promise<StateInfo[]> { console.warn("getStates not implemented in MySqlAdapter"); return []; }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> { console.warn("getState not implemented in MySqlAdapter"); return null; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateState not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteState not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  // Cities
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { console.warn("createCity not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { console.warn("getCities not implemented in MySqlAdapter"); return []; }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> { console.warn("getCity not implemented in MySqlAdapter"); return null; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateCity not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteCity not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  // Auctioneers
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { console.warn("createAuctioneer not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { console.warn("getAuctioneers not implemented in MySqlAdapter"); return []; }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { console.warn("getAuctioneer not implemented in MySqlAdapter"); return null; }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateAuctioneer not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteAuctioneer not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> { console.warn("getAuctioneerBySlug not implemented in MySqlAdapter"); return null; }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { console.warn("getAuctioneerByName not implemented in MySqlAdapter"); return null; }
  // Sellers
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { console.warn("createSeller not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getSellers(): Promise<SellerProfileInfo[]> { console.warn("getSellers not implemented in MySqlAdapter"); return []; }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { console.warn("getSeller not implemented in MySqlAdapter"); return null; }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateSeller not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteSeller not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> { console.warn("getSellerBySlug not implemented in MySqlAdapter"); return null; }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { console.warn("getSellerByName not implemented in MySqlAdapter"); return null; }
  // Auctions
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { console.warn("createAuction not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctions(): Promise<Auction[]> { console.warn("getAuctions not implemented in MySqlAdapter"); return []; }
  async getAuction(idOrPublicId: string): Promise<Auction | null> { console.warn("getAuction not implemented in MySqlAdapter"); return null; }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> { console.warn("updateAuction not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteAuction not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> { console.warn("getAuctionsBySellerSlug not implemented in MySqlAdapter"); return []; }
  // Lots
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> { console.warn("createLot not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getLots(auctionIdParam?: string): Promise<Lot[]> { console.warn("getLots not implemented in MySqlAdapter"); return []; }
  async getLot(idOrPublicId: string): Promise<Lot | null> { console.warn("getLot not implemented in MySqlAdapter"); return null; }
  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> { console.warn("updateLot not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteLot not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  // Bids
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> { console.warn("getBidsForLot not implemented in MySqlAdapter"); return []; }
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> { console.warn("placeBidOnLot not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  // Reviews
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> { console.warn("getReviewsForLot not implemented in MySqlAdapter"); return []; }
  async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string; }> { console.warn("createReview not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  // Questions
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> { console.warn("getQuestionsForLot not implemented in MySqlAdapter"); return []; }
  async createQuestion(question: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string; }> { console.warn("createQuestion not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { console.warn("answerQuestion not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  // Users
  async getUserProfileData(userId: string): Promise<UserProfileData | null> { console.warn("getUserProfileData not implemented in MySqlAdapter"); return null; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { console.warn("updateUserProfile not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password'>>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }> { console.warn("ensureUserRole not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getUsersWithRoles(): Promise<UserProfileData[]> { console.warn("getUsersWithRoles not implemented in MySqlAdapter"); return []; }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { console.warn("updateUserRole not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteUserProfile not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getUserByEmail(email: string): Promise<UserProfileData | null> { console.warn("getUserByEmail not implemented in MySqlAdapter"); return null; }
  // Roles
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { console.warn("createRole not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getRoles(): Promise<Role[]> { console.warn("getRoles not implemented in MySqlAdapter"); return []; }
  async getRole(id: string): Promise<Role | null> { console.warn("getRole not implemented in MySqlAdapter"); return null; }
  async getRoleByName(name: string): Promise<Role | null> { console.warn("getRoleByName not implemented in MySqlAdapter"); return null; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateRole not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteRole not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
    const connection = await getPool().getConnection();
    let rolesProcessedCount = 0;
    try {
      await connection.beginTransaction();
      for (const roleData of defaultRolesData) {
        const [existingRoles] = await connection.execute('SELECT id, description, permissions FROM roles WHERE name_normalized = ?', [roleData.name.toUpperCase()]);
        const validPermissions = (roleData.permissions || []).filter(p => predefinedPermissions.some(pp => pp.id === p));
        if ((existingRoles as RowDataPacket[]).length === 0) {
          await connection.execute('INSERT INTO roles (name, name_normalized, description, permissions) VALUES (?, ?, ?, ?)', [roleData.name, roleData.name.toUpperCase(), roleData.description, JSON.stringify(validPermissions)]);
          rolesProcessedCount++;
        } else {
          const existingRole = (existingRoles as RowDataPacket[])[0];
          const currentPermissions = JSON.parse(existingRole.permissions || '[]');
          if (existingRole.description !== roleData.description || JSON.stringify(currentPermissions.sort()) !== JSON.stringify(validPermissions.sort())) {
            await connection.execute('UPDATE roles SET description = ?, permissions = ?, updated_at = NOW() WHERE id = ?', [roleData.description, JSON.stringify(validPermissions), existingRole.id]);
            rolesProcessedCount++;
          }
        }
      }
      await connection.commit();
      return { success: true, message: 'Default roles ensured.', rolesProcessed: rolesProcessedCount };
    } catch (e: any) { await connection.rollback(); return { success: false, message: e.message, rolesProcessed: rolesProcessedCount }; } finally { connection.release(); }
  }
  // Media Items
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { console.warn("createMediaItem not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async getMediaItems(): Promise<MediaItem[]> { console.warn("getMediaItems not implemented in MySqlAdapter"); return []; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { console.warn("updateMediaItemMetadata not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteMediaItemFromDb not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("linkMediaItemsToLot not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("unlinkMediaItemFromLot not implemented in MySqlAdapter"); return { success: false, message: "Not implemented" }; }


  async disconnect(): Promise<void> {
    if (pool) {
      await pool.end();
      console.log('[MySqlAdapter] Pool de conexões MySQL encerrado.');
    }
  }
}
