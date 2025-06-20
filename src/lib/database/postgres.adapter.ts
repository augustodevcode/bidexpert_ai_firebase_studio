
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
  UserProfileData, EditableUserProfileData, UserHabilitationStatus, UserProfileWithPermissions,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData, Theme,
  Subcategory, SubcategoryFormData,
  MapSettings, SearchPaginationType, MentalTriggerSettings, SectionBadgeConfig, HomepageSectionConfig, AuctionStage
} from '@/types';
import { slugify, samplePlatformSettings } from '@/lib/sample-data';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';


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
    itemCount: Number(row.item_count || 0),
    hasSubcategories: Boolean(row.has_subcategories || false),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapToSubcategory(row: QueryResultRow): Subcategory {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    parentCategoryId: String(row.parent_category_id),
    description: row.description,
    itemCount: Number(row.item_count || 0),
    displayOrder: Number(row.display_order || 0),
    iconUrl: row.icon_url,
    dataAiHintIcon: row.data_ai_hint_icon,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapToStateInfo(row: QueryResultRow): StateInfo {
    return {
        id: String(row.id),
        name: row.name,
        uf: row.uf,
        slug: row.slug,
        cityCount: Number(row.city_count || 0),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function mapToCityInfo(row: QueryResultRow): CityInfo {
    return {
        id: String(row.id),
        name: row.name,
        slug: row.slug,
        stateId: String(row.state_id),
        stateUf: row.state_uf,
        ibgeCode: row.ibge_code,
        lotCount: Number(row.lot_count || 0),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function mapToAuctioneerProfileInfo(row: QueryResultRow): AuctioneerProfileInfo {
    return {
        id: String(row.id),
        publicId: row.public_id,
        name: row.name,
        slug: row.slug,
        registrationNumber: row.registration_number,
        contactName: row.contact_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        website: row.website,
        logoUrl: row.logo_url,
        dataAiHintLogo: row.data_ai_hint_logo,
        description: row.description,
        memberSince: row.member_since ? new Date(row.member_since) : undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
        auctionsConductedCount: Number(row.auctions_conducted_count || 0),
        totalValueSold: Number(row.total_value_sold || 0),
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function mapToSellerProfileInfo(row: QueryResultRow): SellerProfileInfo {
    return {
        id: String(row.id),
        publicId: row.public_id,
        name: row.name,
        slug: row.slug,
        contactName: row.contact_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        website: row.website,
        logoUrl: row.logo_url,
        dataAiHintLogo: row.data_ai_hint_logo,
        description: row.description,
        memberSince: row.member_since ? new Date(row.member_since) : undefined,
        rating: row.rating !== null ? Number(row.rating) : undefined,
        activeLotsCount: Number(row.active_lots_count || 0),
        totalSalesValue: Number(row.total_sales_value || 0),
        auctionsFacilitatedCount: Number(row.auctions_facilitated_count || 0),
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}


function mapToRole(row: QueryResultRow): Role {
    return {
        id: String(row.id),
        name: row.name,
        name_normalized: row.name_normalized,
        description: row.description,
        permissions: row.permissions || [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

function mapToUserProfileData(row: QueryResultRow, role?: Role | null): UserProfileWithPermissions {
    const profile: UserProfileWithPermissions = {
        uid: row.uid,
        email: row.email,
        fullName: row.full_name,
        password: row.password_text,
        roleId: row.role_id ? String(row.role_id) : undefined,
        roleName: role?.name || row.role_name_from_join || row.role_name,
        permissions: role?.permissions && role.permissions.length > 0 ? role.permissions : (row.permissions || row.role_permissions_from_join || []),
        status: row.status,
        habilitationStatus: row.habilitation_status as UserHabilitationStatus,
        cpf: row.cpf,
        rgNumber: row.rg_number,
        rgIssuer: row.rg_issuer,
        rgIssueDate: row.rg_issue_date ? new Date(row.rg_issue_date) : undefined,
        rgState: row.rg_state,
        dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : undefined,
        cellPhone: row.cell_phone,
        homePhone: row.home_phone,
        gender: row.gender,
        profession: row.profession,
        nationality: row.nationality,
        maritalStatus: row.marital_status,
        propertyRegime: row.property_regime,
        spouseName: row.spouse_name,
        spouseCpf: row.spouse_cpf,
        zipCode: row.zip_code,
        street: row.street,
        number: row.number,
        complement: row.complement,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        optInMarketing: row.opt_in_marketing,
        avatarUrl: row.avatar_url,
        dataAiHint: row.data_ai_hint,
        accountType: row.account_type,
        razaoSocial: row.razao_social,
        cnpj: row.cnpj,
        inscricaoEstadual: row.inscricao_estadual,
        websiteComitente: row.website_comitente,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
    return profile;
}

function mapToAuction(row: QueryResultRow): Auction {
    return {
        id: String(row.id),
        publicId: row.public_id,
        title: row.title,
        fullTitle: row.full_title,
        description: row.description,
        status: row.status as AuctionStatus,
        auctionType: row.auction_type,
        category: row.category_name || row.category,
        categoryId: row.category_id ? String(row.category_id) : undefined,
        auctioneer: row.auctioneer_name || row.auctioneer,
        auctioneerId: row.auctioneer_id ? String(row.auctioneer_id) : undefined,
        seller: row.seller_name || row.seller,
        sellerId: row.seller_id ? String(row.seller_id) : undefined,
        auctionDate: new Date(row.auction_date),
        endDate: row.end_date ? new Date(row.end_date) : null,
        auctionStages: row.auction_stages || [],
        city: row.city,
        state: row.state,
        imageUrl: row.image_url,
        dataAiHint: row.data_ai_hint,
        documentsUrl: row.documents_url,
        totalLots: Number(row.total_lots || 0),
        visits: Number(row.visits || 0),
        initialOffer: row.initial_offer !== null ? Number(row.initial_offer) : undefined,
        isFavorite: row.is_favorite,
        currentBid: row.current_bid !== null ? Number(row.current_bid) : undefined,
        bidsCount: Number(row.bids_count || 0),
        sellingBranch: row.selling_branch,
        vehicleLocation: row.vehicle_location,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        auctioneerLogoUrl: row.auctioneer_logo_url,
        lots: [],
        automaticBiddingEnabled: row.automatic_bidding_enabled,
        allowInstallmentBids: row.allow_installment_bids,
        estimatedRevenue: row.estimated_revenue !== null ? Number(row.estimated_revenue) : undefined,
        achievedRevenue: row.achieved_revenue !== null ? Number(row.achieved_revenue) : undefined,
        totalHabilitatedUsers: Number(row.total_habilitated_users || 0),
        isFeaturedOnMarketplace: row.is_featured_on_marketplace,
        marketplaceAnnouncementTitle: row.marketplace_announcement_title,
    };
}

function mapToLot(row: QueryResultRow): Lot {
  return {
    id: String(row.id),
    publicId: row.public_id,
    auctionId: String(row.auction_id),
    title: row.title,
    number: row.number,
    imageUrl: row.image_url,
    dataAiHint: row.data_ai_hint,
    galleryImageUrls: row.gallery_image_urls || [],
    mediaItemIds: row.media_item_ids || [],
    status: row.status as LotStatus,
    stateId: row.state_id ? String(row.state_id) : undefined,
    cityId: row.city_id ? String(row.city_id) : undefined,
    cityName: row.city_name,
    stateUf: row.state_uf,
    type: row.category_name,
    categoryId: row.category_id ? String(row.category_id) : undefined,
    subcategoryId: row.subcategory_id ? String(row.subcategory_id) : undefined,
    subcategoryName: row.subcategory_name,
    views: Number(row.views || 0),
    auctionName: row.auction_name,
    price: Number(row.price),
    initialPrice: row.initial_price !== null ? Number(row.initial_price) : undefined,
    lotSpecificAuctionDate: row.lot_specific_auction_date ? new Date(row.lot_specific_auction_date) : null,
    secondAuctionDate: row.second_auction_date ? new Date(row.second_auction_date) : null,
    secondInitialPrice: row.second_initial_price !== null ? Number(row.second_initial_price) : undefined,
    endDate: row.end_date ? new Date(row.end_date) : undefined,
    bidsCount: Number(row.bids_count || 0),
    isFavorite: row.is_favorite,
    isFeatured: row.is_featured,
    description: row.description,
    year: row.year !== null ? Number(row.year) : undefined,
    make: row.make,
    model: row.model,
    series: row.series,
    stockNumber: row.stock_number,
    sellingBranch: row.selling_branch,
    vin: row.vin,
    vinStatus: row.vin_status,
    lossType: row.loss_type,
    primaryDamage: row.primary_damage,
    titleInfo: row.title_info,
    titleBrand: row.title_brand,
    startCode: row.start_code,
    hasKey: row.has_key,
    odometer: row.odometer,
    airbagsStatus: row.airbags_status,
    bodyStyle: row.body_style,
    engineDetails: row.engine_details,
    transmissionType: row.transmission_type,
    driveLineType: row.drive_line_type,
    fuelType: row.fuel_type,
    cylinders: row.cylinders,
    restraintSystem: row.restraint_system,
    exteriorInteriorColor: row.exteriorinteriorcolor,
    options: row.options,
    manufacturedIn: row.manufactured_in,
    vehicleClass: row.vehicle_class,
    vehicleLocationInBranch: row.vehicle_location_in_branch,
    laneRunNumber: row.lane_run_number,
    aisleStall: row.aisle_stall,
    actualCashValue: row.actual_cash_value,
    estimatedRepairCost: row.estimated_repair_cost,
    sellerName: row.lot_seller_name || row.seller_name,
    sellerId: row.seller_id_fk ? String(row.seller_id_fk) : (row.seller_id ? String(row.seller_id) : undefined),
    auctioneerName: row.lot_auctioneer_name || row.auctioneer_name,
    auctioneerId: row.auctioneer_id_fk ? String(row.auctioneer_id_fk) : (row.auctioneer_id ? String(row.auctioneer_id) : undefined),
    condition: row.condition,
    bidIncrementStep: row.bid_increment_step !== null ? Number(row.bid_increment_step) : undefined,
    allowInstallmentBids: Boolean(row.allow_installment_bids),
    judicialProcessNumber: row.judicial_process_number,
    courtDistrict: row.court_district,
    courtName: row.court_name,
    publicProcessUrl: row.public_process_url,
    propertyRegistrationNumber: row.property_registration_number,
    propertyLiens: row.property_liens,
    knownDebts: row.known_debts,
    additionalDocumentsInfo: row.additional_documents_info,
    latitude: row.latitude !== null ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude !== null ? parseFloat(row.longitude) : undefined,
    mapAddress: row.map_address,
    mapEmbedUrl: row.map_embed_url,
    mapStaticImageUrl: row.map_static_image_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapToBidInfo(row: QueryResultRow): BidInfo {
    return {
        id: String(row.id),
        lotId: String(row.lot_id),
        auctionId: String(row.auction_id),
        bidderId: row.bidder_id,
        bidderDisplay: row.bidder_display_name,
        amount: parseFloat(row.amount),
        timestamp: new Date(row.timestamp),
    };
}

function mapToMediaItem(row: QueryResultRow): MediaItem {
  return {
    id: String(row.id),
    fileName: row.file_name,
    uploadedAt: new Date(row.uploaded_at),
    uploadedBy: row.uploaded_by,
    title: row.title,
    altText: row.alt_text,
    caption: row.caption,
    description: row.description,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    dimensions: row.dimensions_width && row.dimensions_height ? { width: Number(row.dimensions_width), height: Number(row.dimensions_height) } : undefined,
    urlOriginal: row.url_original,
    urlThumbnail: row.url_thumbnail,
    urlMedium: row.url_medium,
    urlLarge: row.url_large,
    linkedLotIds: row.linked_lot_ids || [],
    dataAiHint: row.data_ai_hint,
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
        platformPublicIdMasks: row.platform_public_id_masks || {},
        mapSettings: row.map_settings || samplePlatformSettings.mapSettings,
        searchPaginationType: (row.search_pagination_type as SearchPaginationType) || samplePlatformSettings.searchPaginationType,
        searchItemsPerPage: Number(row.search_items_per_page || samplePlatformSettings.searchItemsPerPage),
        searchLoadMoreCount: Number(row.search_load_more_count || samplePlatformSettings.searchLoadMoreCount),
        showCountdownOnLotDetail: row.show_countdown_on_lot_detail === null ? samplePlatformSettings.showCountdownOnLotDetail : Boolean(row.show_countdown_on_lot_detail),
        showCountdownOnCards: row.show_countdown_on_cards === null ? samplePlatformSettings.showCountdownOnCards : Boolean(row.show_countdown_on_cards),
        showRelatedLotsOnLotDetail: row.show_related_lots_on_lot_detail === null ? samplePlatformSettings.showRelatedLotsOnLotDetail : Boolean(row.show_related_lots_on_lot_detail),
        relatedLotsCount: Number(row.related_lots_count || samplePlatformSettings.relatedLotsCount),
        mentalTriggerSettings: row.mental_trigger_settings || samplePlatformSettings.mentalTriggerSettings,
        sectionBadgeVisibility: row.section_badge_visibility || samplePlatformSettings.sectionBadgeVisibility,
        homepageSections: row.homepage_sections || samplePlatformSettings.homepageSections,
        updatedAt: new Date(row.updated_at)
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
      `DROP TABLE IF EXISTS bids, media_items, lot_reviews, lot_questions, lots, subcategories, auctions, cities, sellers, auctioneers, users, states, lot_categories, roles, platform_settings CASCADE;`,

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
        permissions JSONB, status VARCHAR(50), habilitation_status VARCHAR(50),
        cpf VARCHAR(20), rg_number VARCHAR(30), rg_issuer VARCHAR(100), rg_issue_date DATE, rg_state VARCHAR(2),
        date_of_birth DATE, cell_phone VARCHAR(20), home_phone VARCHAR(20), gender VARCHAR(50), profession VARCHAR(100),
        nationality VARCHAR(100), marital_status VARCHAR(50), property_regime VARCHAR(100),
        spouse_name VARCHAR(255), spouse_cpf VARCHAR(20), zip_code VARCHAR(10), street VARCHAR(255),
        "number" VARCHAR(20), complement VARCHAR(100), neighborhood VARCHAR(100), city VARCHAR(100), state VARCHAR(100),
        opt_in_marketing BOOLEAN DEFAULT FALSE, avatar_url TEXT, data_ai_hint TEXT,
        account_type VARCHAR(50), razao_social VARCHAR(255), cnpj VARCHAR(20), inscricao_estadual VARCHAR(50), website_comitente TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
      `CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);`,

      `CREATE TABLE IF NOT EXISTS platform_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global', site_title VARCHAR(100) NULL, site_tagline VARCHAR(255) NULL,
        gallery_image_base_path TEXT NOT NULL DEFAULT '/media/gallery/', active_theme_name TEXT NULL,
        themes JSONB NOT NULL DEFAULT '[]'::jsonb, platform_public_id_masks JSONB,
        map_settings JSONB, search_pagination_type VARCHAR(50), search_items_per_page INTEGER, search_load_more_count INTEGER,
        show_countdown_on_lot_detail BOOLEAN, show_countdown_on_cards BOOLEAN, show_related_lots_on_lot_detail BOOLEAN,
        related_lots_count INTEGER, mental_trigger_settings JSONB, section_badge_visibility JSONB, homepage_sections JSONB,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,

       `CREATE TABLE IF NOT EXISTS lot_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        item_count INTEGER DEFAULT 0,
        has_subcategories BOOLEAN DEFAULT FALSE,
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
        automatic_bidding_enabled BOOLEAN DEFAULT FALSE,
        allow_installment_bids BOOLEAN DEFAULT FALSE,
        estimated_revenue NUMERIC(15,2),
        achieved_revenue NUMERIC(15,2),
        total_habilitated_users INTEGER DEFAULT 0,
        is_featured_on_marketplace BOOLEAN DEFAULT FALSE,
        marketplace_announcement_title VARCHAR(150),
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
        subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,
        views INTEGER DEFAULT 0,
        price NUMERIC(15,2) NOT NULL,
        initial_price NUMERIC(15,2),
        lot_specific_auction_date TIMESTAMPTZ,
        second_auction_date TIMESTAMPTZ,
        second_initial_price NUMERIC(15,2),
        end_date TIMESTAMPTZ,
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
        exteriorInteriorColor VARCHAR(100),
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
        bid_increment_step NUMERIC(10,2),
        allow_installment_bids BOOLEAN,
        judicial_process_number VARCHAR(100),
        court_district VARCHAR(100),
        court_name VARCHAR(100),
        public_process_url TEXT,
        property_registration_number VARCHAR(100),
        property_liens TEXT,
        known_debts TEXT,
        additional_documents_info TEXT,
        latitude NUMERIC(10, 8),
        longitude NUMERIC(11, 8),
        map_address VARCHAR(255),
        map_embed_url TEXT,
        map_static_image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE INDEX IF NOT EXISTS idx_lots_public_id ON lots(public_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_auction_id ON lots(auction_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_category_id ON lots(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lots_subcategory_id ON lots(subcategory_id);`,

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
          const dropTableNameMatch = query.match(/DROP TABLE IF EXISTS ([\w,\s]+) CASCADE/i);

          if (tableNameMatch) {
            console.log(`[PostgresAdapter] Tabela '${tableNameMatch[1]}' verificada/criada com sucesso.`);
          } else if (indexNameMatch) {
            console.log(`[PostgresAdapter] Índice '${indexNameMatch[1]}' verificado/criado com sucesso.`);
          } else if (dropTableNameMatch) {
             console.log(`[PostgresAdapter] Tentativa de excluir tabelas: '${dropTableNameMatch[1]}'.`);
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

  // --- Implementations for all methods ---
  async getPlatformSettings(): Promise<PlatformSettings> {
    const client = await getPool().connect();
    try {
        const res = await client.query(`SELECT site_title, site_tagline, gallery_image_base_path, active_theme_name, themes, platform_public_id_masks, map_settings, search_pagination_type, search_items_per_page, search_load_more_count, show_countdown_on_lot_detail, show_countdown_on_cards, show_related_lots_on_lot_detail, related_lots_count, mental_trigger_settings, section_badge_visibility, homepage_sections, updated_at FROM platform_settings WHERE id = 'global';`);
        if (res.rowCount && res.rowCount > 0) {
            return mapToPlatformSettings(mapRowToCamelCase(res.rows[0]));
        }
        const defaultSettings = samplePlatformSettings;
        const insertQuery = `
          INSERT INTO platform_settings (
            id, site_title, site_tagline, gallery_image_base_path, active_theme_name, themes,
            platform_public_id_masks, map_settings, search_pagination_type, search_items_per_page,
            search_load_more_count, show_countdown_on_lot_detail, show_countdown_on_cards,
            show_related_lots_on_lot_detail, related_lots_count, mental_trigger_settings,
            section_badge_visibility, homepage_sections
          ) VALUES ('global', $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb, $17::jsonb)
          ON CONFLICT (id) DO NOTHING;
        `;
        await client.query(insertQuery, [
            defaultSettings.siteTitle, defaultSettings.siteTagline, defaultSettings.galleryImageBasePath,
            defaultSettings.activeThemeName || null, JSON.stringify(defaultSettings.themes || []),
            JSON.stringify(defaultSettings.platformPublicIdMasks || {}), JSON.stringify(defaultSettings.mapSettings || {}),
            defaultSettings.searchPaginationType, defaultSettings.searchItemsPerPage, defaultSettings.searchLoadMoreCount,
            defaultSettings.showCountdownOnLotDetail, defaultSettings.showCountdownOnCards,
            defaultSettings.showRelatedLotsOnLotDetail, defaultSettings.relatedLotsCount,
            JSON.stringify(defaultSettings.mentalTriggerSettings || {}), JSON.stringify(defaultSettings.sectionBadgeVisibility || {}),
            JSON.stringify(defaultSettings.homepageSections || [])
        ]);
        return { ...defaultSettings, id: 'global', updatedAt: new Date() };
    } catch (e: any) {
        console.error("[PostgresAdapter - getPlatformSettings] Error, returning default:", e);
        return { ...samplePlatformSettings, id: 'global', updatedAt: new Date() };
    } finally {
        client.release();
    }
  }

  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    const client = await getPool().connect();
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
          ) VALUES ('global', $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb, $17::jsonb, NOW())
          ON CONFLICT (id) DO UPDATE SET
            site_title = EXCLUDED.site_title, site_tagline = EXCLUDED.site_tagline,
            gallery_image_base_path = EXCLUDED.gallery_image_base_path, active_theme_name = EXCLUDED.active_theme_name,
            themes = EXCLUDED.themes, platform_public_id_masks = EXCLUDED.platform_public_id_masks,
            map_settings = EXCLUDED.map_settings, search_pagination_type = EXCLUDED.search_pagination_type,
            search_items_per_page = EXCLUDED.search_items_per_page, search_load_more_count = EXCLUDED.search_load_more_count,
            show_countdown_on_lot_detail = EXCLUDED.show_countdown_on_lot_detail, show_countdown_on_cards = EXCLUDED.show_countdown_on_cards,
            show_related_lots_on_lot_detail = EXCLUDED.show_related_lots_on_lot_detail, related_lots_count = EXCLUDED.related_lots_count,
            mental_trigger_settings = EXCLUDED.mental_trigger_settings, section_badge_visibility = EXCLUDED.section_badge_visibility,
            homepage_sections = EXCLUDED.homepage_sections, updated_at = NOW();
        `;
        await client.query(query, [
            data.siteTitle || null, data.siteTagline || null, data.galleryImageBasePath,
            data.activeThemeName || null, JSON.stringify(data.themes || []),
            JSON.stringify(data.platformPublicIdMasks || {}), JSON.stringify(data.mapSettings || {}),
            data.searchPaginationType, data.searchItemsPerPage, data.searchLoadMoreCount,
            data.showCountdownOnLotDetail, data.showCountdownOnCards, data.showRelatedLotsOnLotDetail,
            data.relatedLotsCount, JSON.stringify(data.mentalTriggerSettings || {}),
            JSON.stringify(data.sectionBadgeVisibility || {}), JSON.stringify(data.homepageSections || [])
        ]);
        return { success: true, message: 'Configurações atualizadas (PostgreSQL)!' };
    } catch (e: any) {
        console.error("[PostgresAdapter - updatePlatformSettings] Error:", e);
        return { success: false, message: e.message };
    } finally {
        client.release();
    }
  }

  // --- Other placeholder implementations ---
  async createLotCategory(data: { name: string; description?: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> { console.warn("createLotCategory not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getLotCategories(): Promise<LotCategory[]> { console.warn("getLotCategories not implemented in PostgresAdapter"); return []; }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> { console.warn("getLotCategory not implemented in PostgresAdapter"); return null; }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> { console.warn("getLotCategoryByName not implemented in PostgresAdapter"); return null; }
  async updateLotCategory(id: string, data: { name: string; description?: string; hasSubcategories?: boolean }): Promise<{ success: boolean; message: string; }> { console.warn("updateLotCategory not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteLotCategory not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> { console.warn("createSubcategory not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> { console.warn("getSubcategories not implemented in PostgresAdapter"); return []; }
  async getSubcategory(id: string): Promise<Subcategory | null> { console.warn("getSubcategory not implemented in PostgresAdapter"); return null; }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> { console.warn("getSubcategoryBySlug not implemented in PostgresAdapter"); return null; }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateSubcategory not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteSubcategory not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> { console.warn("createState not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getStates(): Promise<StateInfo[]> { console.warn("getStates not implemented in PostgresAdapter"); return []; }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> { console.warn("getState not implemented in PostgresAdapter"); return null; }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateState not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteState not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> { console.warn("createCity not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> { console.warn("getCities not implemented in PostgresAdapter"); return []; }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> { console.warn("getCity not implemented in PostgresAdapter"); return null; }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateCity not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteCity not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> { console.warn("createAuctioneer not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> { console.warn("getAuctioneers not implemented in PostgresAdapter"); return []; }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> { console.warn("getAuctioneer not implemented in PostgresAdapter"); return null; }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateAuctioneer not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteAuctioneer not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> { console.warn("getAuctioneerBySlug not implemented in PostgresAdapter"); return null; }
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> { console.warn("getAuctioneerByName not implemented in PostgresAdapter"); return null; }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> { console.warn("createSeller not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getSellers(): Promise<SellerProfileInfo[]> { console.warn("getSellers not implemented in PostgresAdapter"); return []; }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> { console.warn("getSeller not implemented in PostgresAdapter"); return null; }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateSeller not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteSeller not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> { console.warn("getSellerBySlug not implemented in PostgresAdapter"); return null; }
  async getSellerByName(name: string): Promise<SellerProfileInfo | null> { console.warn("getSellerByName not implemented in PostgresAdapter"); return null; }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> { console.warn("createAuction not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctions(): Promise<Auction[]> { console.warn("getAuctions not implemented in PostgresAdapter"); return []; }
  async getAuction(idOrPublicId: string): Promise<Auction | null> { console.warn("getAuction not implemented in PostgresAdapter"); return null; }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> { console.warn("updateAuction not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteAuction not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> { console.warn("getAuctionsBySellerSlug not implemented in PostgresAdapter"); return []; }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> { console.warn("createLot not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getLots(auctionIdParam?: string): Promise<Lot[]> { console.warn("getLots not implemented in PostgresAdapter"); return []; }
  async getLot(idOrPublicId: string): Promise<Lot | null> { console.warn("getLot not implemented in PostgresAdapter"); return null; }
  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> { console.warn("updateLot not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteLot not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> { console.warn("getBidsForLot not implemented in PostgresAdapter"); return []; }
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> { console.warn("placeBidOnLot not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> { console.warn("getReviewsForLot not implemented in PostgresAdapter"); return []; }
  async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; reviewId?: string; }> { console.warn("createReview not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> { console.warn("getQuestionsForLot not implemented in PostgresAdapter"); return []; }
  async createQuestion(question: Omit<LotQuestion, 'id' | 'createdAt' | 'answeredAt' | 'answeredByUserId' | 'answeredByUserDisplayName' | 'isPublic'>): Promise<{ success: boolean; message: string; questionId?: string; }> { console.warn("createQuestion not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> { console.warn("answerQuestion not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getUserProfileData(userId: string): Promise<UserProfileData | null> { console.warn("getUserProfileData not implemented in PostgresAdapter"); return null; }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> { console.warn("updateUserProfile not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, "cpf" | "cellPhone" | "dateOfBirth" | "password" | "accountType" | "razaoSocial" | "cnpj" | "inscricaoEstadual" | "websiteComitente" | "zipCode" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "optInMarketing">>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileData; }> { console.warn("ensureUserRole not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getUsersWithRoles(): Promise<UserProfileData[]> { console.warn("getUsersWithRoles not implemented in PostgresAdapter"); return []; }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> { console.warn("updateUserRole not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteUserProfile not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> { console.warn("createRole not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getRoles(): Promise<Role[]> { console.warn("getRoles not implemented in PostgresAdapter"); return []; }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> { console.warn("updateRole not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteRole not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async createMediaItem(data: Omit<MediaItem, 'id' | 'uploadedAt' | 'urlOriginal' | 'urlThumbnail' | 'urlMedium' | 'urlLarge'>, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem }> { console.warn("createMediaItem not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async getMediaItems(): Promise<MediaItem[]> { console.warn("getMediaItems not implemented in PostgresAdapter"); return []; }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>): Promise<{ success: boolean; message: string; }> { console.warn("updateMediaItemMetadata not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> { console.warn("deleteMediaItemFromDb not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> { console.warn("linkMediaItemsToLot not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> { console.warn("unlinkMediaItemFromLot not implemented in PostgresAdapter"); return { success: false, message: "Not implemented" }; }

}