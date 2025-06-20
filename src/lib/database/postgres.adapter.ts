
// src/lib/database/postgres.adapter.ts
import { Pool, type QueryResultRow } from 'pg';
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
    hasSubcategories: Boolean(row.hasSubcategories || false), // Added
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToSubcategory(row: QueryResultRow): Subcategory {
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

function mapToSellerProfileInfo(row: QueryResultRow): SellerProfileInfo {
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


function mapToRole(row: QueryResultRow): Role {
    return {
        id: String(row.id),
        name: row.name,
        name_normalized: row.nameNormalized,
        description: row.description,
        permissions: row.permissions || [],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}

function mapToUserProfileData(row: QueryResultRow, role?: Role | null): UserProfileData {
    const profile: UserProfileData = {
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        password: row.passwordText,
        roleId: row.roleId ? String(row.roleId) : undefined,
        roleName: role?.name || row.roleName,
        permissions: role?.permissions || row.permissions || [],
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

function mapToAuction(row: QueryResultRow): Auction {
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
        auctionStages: row.auctionStages || [],
        city: row.city,
        state: row.state,
        imageUrl: row.imageUrl,
        dataAiHint: row.dataAiHint,
        documentsUrl: row.documentsUrl,
        totalLots: Number(row.totalLots || 0),
        visits: Number(row.visits || 0),
        initialOffer: row.initialOffer !== null ? Number(row.initialOffer) : undefined,
        isFavorite: row.isFavorite,
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

function mapToLot(row: QueryResultRow): Lot {
  return {
    id: String(row.id),
    publicId: row.publicId,
    auctionId: String(row.auctionId),
    title: row.title,
    number: row.number,
    imageUrl: row.imageUrl,
    dataAiHint: row.dataAiHint,
    galleryImageUrls: row.galleryImageUrls || [],
    mediaItemIds: row.mediaItemIds || [],
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
    isFavorite: row.isFavorite,
    isFeatured: row.isFeatured,
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
    hasKey: row.hasKey,
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

function mapToBidInfo(row: QueryResultRow): BidInfo {
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

function mapToMediaItem(row: QueryResultRow): MediaItem {
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
    linkedLotIds: row.linkedLotIds || [],
    dataAiHint: row.dataAiHint,
  };
}

function mapToPlatformSettings(row: QueryResultRow): PlatformSettings {
    return {
        id: String(row.id),
        siteTitle: row.site_title,
        siteTagline: row.site_tagline,
        galleryImageBasePath: row.gallery_image_base_path,
        activeThemeName: row.active_theme_name,
        themes: row.themes || [],
        platformPublicIdMasks: row.platform_public_id_masks || undefined,
        updatedAt: new Date(row.updated_at),
    };
}

function mapToReview(row: QueryResultRow): Review {
  return {
    id: String(row.id),
    lotId: String(row.lot_id),
    auctionId: String(row.auction_id),
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

function mapToLotQuestion(row: QueryResultRow): LotQuestion {
  return {
    id: String(row.id),
    lotId: String(row.lot_id),
    auctionId: String(row.auction_id),
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    questionText: row.question_text,
    createdAt: new Date(row.created_at),
    answerText: row.answer_text,
    answeredAt: row.answered_at ? new Date(row.answered_at) : undefined,
    answeredByUserId: row.answered_by_user_id,
    answeredByUserDisplayName: row.answered_by_user_display_name,
    isPublic: row.is_public,
  };
}

const defaultRolesData: RoleFormData[] = [
  { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
  { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
  { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
  { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
  { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
];

export class PostgresAdapter implements IDatabaseAdapter {
  constructor() {
    getPool();
  }

  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[]; rolesProcessed?: number }> {
    const client = await getPool().connect();
    const errors: any[] = [];
    console.log('[PostgresAdapter] Iniciando criação/verificação de tabelas...');

    const queries = [
      `DROP TABLE IF EXISTS bids CASCADE;`,
      `DROP TABLE IF EXISTS media_items CASCADE;`,
      `DROP TABLE IF EXISTS lot_reviews CASCADE;`,
      `DROP TABLE IF EXISTS lot_questions CASCADE;`,
      `DROP TABLE IF EXISTS lots CASCADE;`,
      `DROP TABLE IF EXISTS subcategories CASCADE;`, // Added subcategories drop
      `DROP TABLE IF EXISTS auctions CASCADE;`,
      `DROP TABLE IF EXISTS cities CASCADE;`,
      `DROP TABLE IF EXISTS sellers CASCADE;`,
      `DROP TABLE IF EXISTS auctioneers CASCADE;`,
      `DROP TABLE IF EXISTS users CASCADE;`,
      `DROP TABLE IF EXISTS states CASCADE;`,
      `DROP TABLE IF EXISTS lot_categories CASCADE;`,
      `DROP TABLE IF EXISTS roles CASCADE;`,
      `DROP TABLE IF EXISTS platform_settings CASCADE;`,

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

      `CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        password_text VARCHAR(255) NULL,
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
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
      `CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);`,

      `CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
        site_title VARCHAR(100) NULL,
        site_tagline VARCHAR(255) NULL,
        gallery_image_base_path TEXT NOT NULL DEFAULT '/media/gallery/',
        active_theme_name TEXT NULL,
        themes JSONB NOT NULL DEFAULT '[]'::jsonb,
        platform_public_id_masks JSONB,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS lot_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        item_count INTEGER DEFAULT 0,
        has_subcategories BOOLEAN DEFAULT FALSE, -- Added
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_lot_categories_slug ON lot_categories(slug);`,

      `CREATE TABLE IF NOT EXISTS subcategories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        parent_category_id INTEGER NOT NULL REFERENCES lot_categories(id) ON DELETE CASCADE,
        description TEXT,
        item_count INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        icon_url TEXT,
        data_ai_hint_icon TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (slug, parent_category_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_subcategories_parent_id ON subcategories(parent_category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_subcategories_slug_parent_id ON subcategories(slug, parent_category_id);`,

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
        public_id TEXT NOT NULL UNIQUE,
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
      `CREATE INDEX IF NOT EXISTS idx_auctioneers_public_id ON auctioneers(public_id);`,

      `CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        public_id TEXT NOT NULL UNIQUE,
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
      `CREATE INDEX IF NOT EXISTS idx_sellers_public_id ON sellers(public_id);`,

      `CREATE TABLE IF NOT EXISTS auctions (
        id SERIAL PRIMARY KEY,
        public_id TEXT NOT NULL UNIQUE,
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
      `CREATE INDEX IF NOT EXISTS idx_auctions_public_id ON auctions(public_id);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_auction_date ON auctions(auction_date);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_category_id ON auctions(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_auctioneer_id ON auctions(auctioneer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON auctions(seller_id);`,

      `CREATE TABLE IF NOT EXISTS lots (
        id SERIAL PRIMARY KEY,
        public_id TEXT NOT NULL UNIQUE,
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
        category_id INTEGER REFERENCES lot_categories(id) ON DELETE SET NULL,
        subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL, -- Added
        views INTEGER DEFAULT 0,
        price NUMERIC(15,2) NOT NULL,
        initial_price NUMERIC(15,2),
        lot_specific_auction_date TIMESTAMPTZ,
        second_auction_date TIMESTAMPTZ,
        second_initial_price NUMERIC(15,2),
        end_date TIMESTAMPTZ, -- Not NULL constraint removed
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
        seller_id_fk INTEGER REFERENCES sellers(id) ON DELETE SET NULL,
        auctioneer_id_fk INTEGER REFERENCES auctioneers(id) ON DELETE SET NULL,
        condition TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_lots_public_id ON lots(public_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_auction_id ON lots(auction_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_category_id ON lots(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_subcategory_id ON lots(subcategory_id);`, // Added index

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
        bidder_id VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        bidder_display_name VARCHAR(255),
        amount NUMERIC(15,2) NOT NULL,
        "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_bids_lot_id ON bids(lot_id);`,
      `CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);`,

      `CREATE TABLE IF NOT EXISTS lot_reviews (
        id SERIAL PRIMARY KEY,
        lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
        auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
        user_id VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        user_display_name VARCHAR(255),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_lot_reviews_lot_id ON lot_reviews(lot_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lot_reviews_user_id ON lot_reviews(user_id);`,

      `CREATE TABLE IF NOT EXISTS lot_questions (
        id SERIAL PRIMARY KEY,
        lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
        auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
        user_id VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
        user_display_name VARCHAR(255),
        question_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        answer_text TEXT,
        answered_at TIMESTAMPTZ,
        answered_by_user_id VARCHAR(255) REFERENCES users(uid) ON DELETE SET NULL,
        answered_by_user_display_name VARCHAR(255),
        is_public BOOLEAN DEFAULT TRUE
      );`,
      `CREATE INDEX IF NOT EXISTS idx_lot_questions_lot_id ON lot_questions(lot_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lot_questions_user_id ON lot_questions(user_id);`,
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
      console.log('[PostgresAdapter] Esquema de tabelas inicializado/verificado com sucesso.');

      const rolesResult = await this.ensureDefaultRolesExist();
      if (!rolesResult.success) {
        errors.push(new Error(`Falha ao garantir perfis padrão: ${rolesResult.message}`));
      } else {
        console.log(`[PostgresAdapter] ${rolesResult.rolesProcessed || 0} perfis padrão processados.`);
      }

      const settingsResult = await this.getPlatformSettings();
      if (!settingsResult.galleryImageBasePath) {
          errors.push(new Error('Falha ao garantir configurações padrão da plataforma.'));
      } else {
        console.log('[PostgresAdapter] Configurações padrão da plataforma verificadas/criadas.');
      }

      if (errors.length > 0) {
        return { success: false, message: `Esquema PostgreSQL inicializado com ${errors.length} erros nos passos pós-tabelas.`, errors, rolesProcessed: rolesResult.rolesProcessed };
      }
      return { success: true, message: `Esquema PostgreSQL inicializado e perfis padrão verificados (${rolesResult.rolesProcessed || 0} processados). Configurações da plataforma verificadas.`, rolesProcessed: rolesResult.rolesProcessed };

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('[PostgresAdapter - initializeSchema] Erro transacional:', error);
      errors.push(error.message);
      return { success: false, message: `Erro ao inicializar esquema PostgreSQL: ${error.message}`, errors };
    } finally {
      client.release();
    }
  }

  // Subcategory methods
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name);
      const query = `
        INSERT INTO subcategories (name, slug, parent_category_id, description, item_count, display_order, icon_url, data_ai_hint_icon, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 0, $5, $6, $7, NOW(), NOW()) RETURNING id;
      `;
      const values = [
        data.name.trim(), slug, Number(data.parentCategoryId), data.description?.trim() || null,
        data.displayOrder || 0, data.iconUrl || null, data.dataAiHintIcon || null
      ];
      const res = await client.query(query, values);
      const subcategoryId = res.rows[0]?.id;

      // Update hasSubcategories on parent category
      await client.query(
        'UPDATE lot_categories SET has_subcategories = TRUE, updated_at = NOW() WHERE id = $1',
        [Number(data.parentCategoryId)]
      );

      return { success: true, message: 'Subcategoria criada com sucesso (PostgreSQL)!', subcategoryId: String(subcategoryId) };
    } catch (error: any) {
      console.error("[PostgresAdapter - createSubcategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao criar subcategoria (PostgreSQL).' };
    } finally {
      client.release();
    }
  }

  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    const client = await getPool().connect();
    try {
      const query = 'SELECT * FROM subcategories WHERE parent_category_id = $1 ORDER BY display_order ASC, name ASC;';
      const res = await client.query(query, [Number(parentCategoryId)]);
      return mapRowsToCamelCase(res.rows).map(mapToSubcategory);
    } catch (error: any) {
      console.error(`[PostgresAdapter - getSubcategories for parent ${parentCategoryId}] Error:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  async getSubcategory(id: string): Promise<Subcategory | null> {
    const client = await getPool().connect();
    try {
      const query = 'SELECT * FROM subcategories WHERE id = $1;';
      const res = await client.query(query, [Number(id)]);
      if (res.rowCount === 0) return null;
      return mapToSubcategory(mapRowToCamelCase(res.rows[0]));
    } catch (error: any) {
      console.error(`[PostgresAdapter - getSubcategory(${id})] Error:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    const client = await getPool().connect();
    try {
      const query = 'SELECT * FROM subcategories WHERE slug = $1 AND parent_category_id = $2;';
      const res = await client.query(query, [slug, Number(parentCategoryId)]);
      if (res.rowCount === 0) return null;
      return mapToSubcategory(mapRowToCamelCase(res.rows[0]));
    } catch (error: any) {
      console.error(`[PostgresAdapter - getSubcategoryBySlug(${slug}, ${parentCategoryId})] Error:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name) { fields.push(`name = $${paramCount++}`, `slug = $${paramCount++}`); values.push(data.name.trim(), slugify(data.name.trim())); }
      if (data.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(data.description?.trim() || null); }
      if (data.displayOrder !== undefined) { fields.push(`display_order = $${paramCount++}`); values.push(data.displayOrder); }
      if (data.iconUrl !== undefined) { fields.push(`icon_url = $${paramCount++}`); values.push(data.iconUrl || null); }
      if (data.dataAiHintIcon !== undefined) { fields.push(`data_ai_hint_icon = $${paramCount++}`); values.push(data.dataAiHintIcon || null); }

      if (fields.length === 0) return { success: true, message: "Nenhuma alteração para a subcategoria." };

      fields.push(`updated_at = NOW()`);
      const query = `UPDATE subcategories SET ${fields.join(', ')} WHERE id = $${paramCount}`;
      values.push(Number(id));
      await client.query(query, values);
      return { success: true, message: 'Subcategoria atualizada com sucesso (PostgreSQL)!' };
    } catch (error: any) {
      console.error(`[PostgresAdapter - updateSubcategory(${id})] Error:`, error);
      return { success: false, message: error.message || 'Falha ao atualizar subcategoria (PostgreSQL).' };
    } finally {
      client.release();
    }
  }

  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM subcategories WHERE id = $1;', [Number(id)]);
      // Optional: Check if parent category has any remaining subcategories and update has_subcategories flag.
      return { success: true, message: 'Subcategoria excluída com sucesso (PostgreSQL)!' };
    } catch (error: any) {
      console.error(`[PostgresAdapter - deleteSubcategory(${id})] Error:`, error);
      return { success: false, message: error.message || 'Falha ao excluir subcategoria (PostgreSQL).' };
    } finally {
      client.release();
    }
  }

  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
     if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name.trim());
      const queryText = `
        INSERT INTO lot_categories (name, slug, description, item_count, has_subcategories, created_at, updated_at)
        VALUES ($1, $2, $3, $4, FALSE, NOW(), NOW())
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
      const res = await client.query('SELECT id, name, slug, description, item_count, has_subcategories, created_at, updated_at FROM lot_categories ORDER BY name ASC;');
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
        const numericId = parseInt(id, 10);
        let res;
        if (isNaN(numericId)) {
            res = await client.query('SELECT * FROM lot_categories WHERE slug = $1', [id]);
        } else {
            res = await client.query('SELECT * FROM lot_categories WHERE id = $1', [numericId]);
        }
        if (res.rowCount === 0) return null;
        return mapToLotCategory(mapRowToCamelCase(res.rows[0]));
    } catch (error: any) {
        console.error(`[PostgresAdapter - getLotCategory with ID/slug ${id}] Error:`, error);
        return null;
    } finally {
        client.release();
    }
  }

  async updateLotCategory(id: string, data: { name: string; description?: string; hasSubcategories?: boolean }): Promise<{ success: boolean; message: string; }> {
     if (!data.name || data.name.trim() === '') {
      return { success: false, message: 'O nome da categoria é obrigatório.' };
    }
    const client = await getPool().connect();
    try {
      const slug = slugify(data.name.trim());
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      fields.push(`name = $${paramCount++}`); values.push(data.name.trim());
      fields.push(`slug = $${paramCount++}`); values.push(slug);
      fields.push(`description = $${paramCount++}`); values.push(data.description?.trim() || null);
      if (data.hasSubcategories !== undefined) {
        fields.push(`has_subcategories = $${paramCount++}`); values.push(data.hasSubcategories);
      }
      fields.push(`updated_at = NOW()`);

      const queryText = `UPDATE lot_categories SET ${fields.join(', ')} WHERE id = $${paramCount};`;
      values.push(Number(id));

      await client.query(queryText, values);
      return { success: true, message: 'Categoria atualizada com sucesso (PostgreSQL)!' };
    } catch (error: any) {
      console.error("[PostgresAdapter - updateLotCategory] Error:", error);
      return { success: false, message: error.message || 'Falha ao atualizar categoria (PostgreSQL).' };
    } finally {
      client.release();
    }
  }

  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    const client = await getPool().connect();
    try {
        const normalizedName = name.trim();
        const res = await client.query(
            'SELECT * FROM lot_categories WHERE name = $1 OR slug = $2 LIMIT 1',
            [normalizedName, slugify(normalizedName)]
        );
        if (res.rowCount === 0) return null;
        return mapToLotCategory(mapRowToCamelCase(res.rows[0]));
    } catch (error: any) {
        console.error(`[PostgresAdapter - getLotCategoryByName(${name})] Error:`, error);
        return null;
    } finally {
        client.release();
    }
  }
  // ... (rest of the methods: deleteLotCategory, State, City, Auctioneer, Seller, Auction, Lot, Bids, User, Role, Media, PlatformSettings)
  // Ensure all these methods use the helper functions mapRowToCamelCase and mapTo<Entity> if they return data.
  // For all INSERT and UPDATE queries, ensure proper handling of null values for optional fields (pass NULL to SQL).
  // For all SELECT queries that join tables for names (e.g., category_name from lot_categories), make sure the mapTo<Entity> functions correctly use these joined names.
  // Remember to release the connection in a `finally` block for every method.

  deleteLotCategory = async (id: string): Promise<{ success: boolean; message: string; }> => {
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
  deleteState = async (id: string): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM states WHERE id = $1', [Number(id)]);
      return { success: true, message: 'Estado excluído (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - deleteState(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  deleteCity = async (id: string): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM cities WHERE id = $1', [Number(id)]);
      return { success: true, message: 'Cidade excluída (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - deleteCity(${id})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  deleteSeller = async (idOrPublicId: string): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      const numericId = Number(idOrPublicId);
      if (!isNaN(numericId)) {
        await client.query('DELETE FROM sellers WHERE id = $1;', [numericId]);
      } else {
        await client.query('DELETE FROM sellers WHERE public_id = $1;', [idOrPublicId]);
      }
      return { success: true, message: 'Comitente excluído (PostgreSQL)!' };
    } catch (e: any) { console.error(`[PostgresAdapter - deleteSeller(${idOrPublicId})] Error:`, e); return { success: false, message: e.message }; } finally { client.release(); }
  }
  getAuctioneerByName = async (name: string): Promise<AuctioneerProfileInfo | null> => {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM auctioneers WHERE name = $1 LIMIT 1;', [name]);
      if (res.rowCount === 0) return null;
      return mapToAuctioneerProfileInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getAuctioneerByName(${name})] Error:`, e); return null; } finally { client.release(); }
  }
  getSellerByName = async (name: string): Promise<SellerProfileInfo | null> => {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT * FROM sellers WHERE name = $1 LIMIT 1;', [name]);
      if (res.rowCount === 0) return null;
      return mapToSellerProfileInfo(mapRowToCamelCase(res.rows[0]));
    } catch (e: any) { console.error(`[PostgresAdapter - getSellerByName(${name})] Error:`, e); return null; } finally { client.release(); }
  }
  ensureUserRole = async (userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }> => {
    // ... (full implementation as before)
    const client = await getPool().connect();
    try {
        await this.ensureDefaultRolesExist();
        let targetRole: Role | null = null;
        if (roleIdToAssign) targetRole = await this.getRole(roleIdToAssign);
        if (!targetRole) targetRole = await this.getRoleByName(targetRoleName) || await this.getRoleByName('USER');

        if (!targetRole || !targetRole.id) return { success: false, message: `Perfil padrão '${targetRoleName}' ou 'USER' não encontrado.` };

        await client.query('BEGIN');
        const userRes = await client.query('SELECT * FROM users WHERE uid = $1', [userId]);
        let finalProfileData: UserProfileData;

        if (userRes.rowCount > 0) {
            const userDataFromDB = mapToUserProfileData(mapRowToCamelCase(userRes.rows[0]));
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
                const updateFields: string[] = []; const updateValues: any[] = []; let pCount = 1;
                Object.keys(updatePayload).forEach(key => { const sqlColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase(); updateFields.push(`${sqlColumn} = $${pCount++}`); updateValues.push(updatePayload[key]); });
                updateValues.push(userId);
                await client.query(`UPDATE users SET ${updateFields.join(', ')} WHERE uid = $${pCount}`, updateValues);
            }
            finalProfileData = { ...userDataFromDB, ...updatePayload, uid: userId, permissions: targetRole.permissions || [] } as UserProfileData;
        } else {
            const insertQuery = `INSERT INTO users (uid, email, full_name, password_text, role_id, permissions, status, habilitation_status, cpf, cell_phone, date_of_birth, account_type, razao_social, cnpj, inscricao_estadual, website_comitente, zip_code, street, "number", complement, neighborhood, city, state, opt_in_marketing, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()) RETURNING *;`;
            const insertValues = [userId, email, fullName || email.split('@')[0], additionalProfileData?.password || null, Number(targetRole.id), JSON.stringify(targetRole.permissions || []), 'ATIVO', targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS', additionalProfileData?.cpf || null, additionalProfileData?.cellPhone || null, additionalProfileData?.dateOfBirth || null, additionalProfileData?.accountType || null, additionalProfileData?.razaoSocial || null, additionalProfileData?.cnpj || null, additionalProfileData?.inscricaoEstadual || null, additionalProfileData?.websiteComitente || null, additionalProfileData?.zipCode || null, additionalProfileData?.street || null, additionalProfileData?.number || null, additionalProfileData?.complement || null, additionalProfileData?.neighborhood || null, additionalProfileData?.city || null, additionalProfileData?.state || null, additionalProfileData?.optInMarketing || false];
            const newUserRes = await client.query(insertQuery, insertValues);
            finalProfileData = mapToUserProfileData(mapRowToCamelCase(newUserRes.rows[0]), targetRole);
        }
        await client.query('COMMIT');
        return { success: true, message: 'Perfil de usuário assegurado/atualizado (PostgreSQL).', userProfile: finalProfileData };
    } catch (e: any) { await client.query('ROLLBACK'); return { success: false, message: e.message }; } finally { client.release(); }
  }
  getUsersWithRoles = async (): Promise<UserProfileData[]> => {
    const client = await getPool().connect();
    try {
      const res = await client.query(`SELECT u.*, r.name as role_name, r.permissions as role_permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.full_name ASC;`);
      return mapRowsToCamelCase(res.rows).map(row => {
        const profile = mapToUserProfileData(row);
        if ((!profile.permissions || profile.permissions.length === 0) && row.role_permissions) { profile.permissions = row.role_permissions; }
        return profile;
      });
    } catch (e: any) { return []; } finally { client.release(); }
  }
  updateUserRole = async (userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      let roleName = null; let permissions = null;
      if (roleId && roleId !== "---NONE---") {
        const role = await this.getRole(roleId);
        if (role) { roleName = role.name; permissions = JSON.stringify(role.permissions || []); }
        else return { success: false, message: 'Perfil não encontrado.'};
      }
      const queryText = `UPDATE users SET role_id = $1, role_name = $2, permissions = $3::jsonb, updated_at = NOW() WHERE uid = $4`;
      await client.query(queryText, [roleId ? Number(roleId) : null, roleName, permissions, userId]);
      return { success: true, message: 'Perfil do usuário atualizado (PostgreSQL)!'};
    } catch (e: any) { return { success: false, message: e.message }; } finally { client.release(); }
  }
  deleteUserProfile = async (userId: string): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM users WHERE uid = $1', [userId]);
      return { success: true, message: 'Perfil de usuário excluído (PostgreSQL)!'};
    } catch (e: any) { return { success: false, message: e.message }; } finally { client.release(); }
  }
  getUserByEmail = async (email: string): Promise<UserProfileData | null> => {
    const client = await getPool().connect();
    try {
      const query = 'SELECT u.*, r.name as role_name, r.permissions as role_permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = $1 LIMIT 1;';
      const res = await client.query(query, [email.toLowerCase()]);
      if (res.rowCount === 0) return null;
      const userRow = mapRowToCamelCase(res.rows[0]);
      let role: Role | null = null;
      if (userRow.roleId) role = await this.getRole(userRow.roleId);
      const profile = mapToUserProfileData(userRow, role);
      if ((!profile.permissions || profile.permissions.length === 0) && role?.permissions?.length) { profile.permissions = role.permissions; }
      return profile;
    } catch (e: any) { return null; } finally { client.release(); }
  }
  deleteMediaItemFromDb = async (id: string): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      await client.query('DELETE FROM media_items WHERE id = $1;', [Number(id)]);
      return { success: true, message: 'Item de mídia excluído do DB (PostgreSQL).' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { client.release(); }
  }
  linkMediaItemsToLot = async (lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      for (const mediaId of mediaItemIds) {
        await client.query(
          `UPDATE media_items SET linked_lot_ids = COALESCE(linked_lot_ids, '[]'::jsonb) || ($1::TEXT)::jsonb
           WHERE id = $2 AND NOT (linked_lot_ids @> ($1::TEXT)::jsonb);`,
          [JSON.stringify([lotId]), Number(mediaId)]
        );
      }
      await client.query(
        `UPDATE lots SET media_item_ids = COALESCE(media_item_ids, '[]'::jsonb) || $1::jsonb, updated_at = NOW()
         WHERE id = $2;`,
        [JSON.stringify(mediaItemIds), Number(lotId)]
      );
      await client.query('COMMIT');
      return { success: true, message: 'Mídias vinculadas (PostgreSQL).' };
    } catch (e: any) { await client.query('ROLLBACK'); return { success: false, message: e.message }; } finally { client.release(); }
  }
  unlinkMediaItemFromLot = async (lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE media_items SET linked_lot_ids = COALESCE(linked_lot_ids, '[]'::jsonb) - $1
         WHERE id = $2;`,
        [lotId, Number(mediaItemId)]
      );
      await client.query(
        `UPDATE lots SET media_item_ids = COALESCE(media_item_ids, '[]'::jsonb) - $1, updated_at = NOW()
         WHERE id = $2;`,
        [mediaItemId, Number(lotId)]
      );
      await client.query('COMMIT');
      return { success: true, message: 'Mídia desvinculada (PostgreSQL).' };
    } catch (e: any) { await client.query('ROLLBACK'); return { success: false, message: e.message }; } finally { client.release(); }
  }
  getPlatformSettings = async (): Promise<PlatformSettings> => {
    const client = await getPool().connect();
    try {
        const res = await client.query(`SELECT site_title, site_tagline, gallery_image_base_path, active_theme_name, themes, platform_public_id_masks, updated_at FROM platform_settings WHERE id = 'global';`);
        if (res.rowCount > 0) {
            const settingsRow = mapRowToCamelCase(res.rows[0]);
            return { id: 'global', siteTitle: settingsRow.siteTitle, siteTagline: settingsRow.siteTagline, galleryImageBasePath: settingsRow.galleryImageBasePath, activeThemeName: settingsRow.activeThemeName, themes: settingsRow.themes || [], platformPublicIdMasks: settingsRow.platformPublicIdMasks || undefined, updatedAt: new Date(settingsRow.updatedAt) };
        }
        const defaultSettings: PlatformSettings = { id: 'global', siteTitle: 'BidExpert', siteTagline: 'Leilões Online Especializados', galleryImageBasePath: '/media/gallery/', activeThemeName: null, themes: [], platformPublicIdMasks: {}, updatedAt: new Date() };
        await client.query(`INSERT INTO platform_settings (id, site_title, site_tagline, gallery_image_base_path, themes, platform_public_id_masks) VALUES ('global', $1, $2, $3, '[]'::jsonb, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;`, [defaultSettings.siteTitle, defaultSettings.siteTagline, defaultSettings.galleryImageBasePath]);
        return defaultSettings;
    } catch (e: any) { return { id: 'global', siteTitle: 'BidExpert', siteTagline: 'Leilões Online Especializados', galleryImageBasePath: '/media/gallery/', activeThemeName: null, themes: [], platformPublicIdMasks: {}, updatedAt: new Date() }; } finally { client.release(); }
  }
  updatePlatformSettings = async (data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> => {
    const client = await getPool().connect();
    if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) { return { success: false, message: 'Caminho base da galeria inválido. Deve começar e terminar com "/".' }; }
    try {
        const query = `INSERT INTO platform_settings (id, site_title, site_tagline, gallery_image_base_path, active_theme_name, themes, platform_public_id_masks, updated_at) VALUES ('global', $1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET site_title = EXCLUDED.site_title, site_tagline = EXCLUDED.site_tagline, gallery_image_base_path = EXCLUDED.gallery_image_base_path, active_theme_name = EXCLUDED.active_theme_name, themes = EXCLUDED.themes, platform_public_id_masks = EXCLUDED.platform_public_id_masks, updated_at = NOW();`;
        await client.query(query, [data.siteTitle || null, data.siteTagline || null, data.galleryImageBasePath, data.activeThemeName || null, JSON.stringify(data.themes || []), JSON.stringify(data.platformPublicIdMasks || {})]);
        return { success: true, message: 'Configurações atualizadas (PostgreSQL)!' };
    } catch (e: any) { return { success: false, message: e.message }; } finally { client.release(); }
  }
}
