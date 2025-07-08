// src/lib/database/postgres.adapter.ts
import { Pool, type QueryResultRow } from 'pg';
import type {
  IDatabaseAdapter,
  LotCategory, StateInfo, StateFormData, CategoryFormData,
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
  MapSettings, SearchPaginationType, MentalTriggerSettings, SectionBadgeConfig, HomepageSectionConfig, AuctionStage,
  DirectSaleOffer, DirectSaleOfferFormData,
  UserLotMaxBid,
  UserWin,
  AuctionStatus, LotStatus,
  Court, CourtFormData,
  JudicialDistrict, JudicialDistrictFormData,
  JudicialBranch, JudicialBranchFormData,
  JudicialProcess, JudicialProcessFormData,
  Bem, BemFormData,
  ProcessParty,
  DocumentType,
  UserDocument,
  Notification,
  BlogPost,
  AdminDashboardStats,
  ConsignorDashboardStats,
  UserBid
} from '@/types';
import { samplePlatformSettings } from '@/lib/sample-data';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import type { WizardData } from '@/components/admin/wizard/wizard-context';

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_CONNECTION_STRING;
    if (!connectionString || connectionString.trim() === '') {
      throw new Error('POSTGRES_CONNECTION_STRING não está definida ou está vazia nas variáveis de ambiente.');
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
        isJudicial: row.is_judicial,
        judicialBranchId: row.judicial_branch_id ? String(row.judicial_branch_id) : undefined,
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
        permissions: (role?.permissions && role.permissions.length > 0 ? role.permissions : (row.permissions || row.role_permissions_from_join || [])),
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
        accountType: row.account_type as UserProfileData['accountType'],
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
        totalLots: Number(row.total_lots_count || 0),
        visits: Number(row.visits || 0),
        initialOffer: row.initial_offer !== null ? Number(row.initial_offer) : undefined,
        isFavorite: row.is_favorite,
        currentBid: row.current_bid !== null ? Number(row.current_bid) : undefined,
        bidsCount: Number(row.bids_count || 0),
        sellingBranch: row.selling_branch,
        vehicleLocation: row.vehicle_location,
        latitude: row.latitude !== null ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude !== null ? parseFloat(row.longitude) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        auctioneerLogoUrl: row.auctioneer_logo_url,
        lots: [],
        automaticBiddingEnabled: row.automatic_bidding_enabled,
        allowInstallmentBids: row.allow_installment_bids,
        softCloseEnabled: row.soft_close_enabled,
        softCloseMinutes: row.soft_close_minutes !== null ? Number(row.soft_close_minutes) : undefined,
        estimatedRevenue: row.estimated_revenue !== null ? Number(row.estimated_revenue) : undefined,
        achievedRevenue: row.achieved_revenue !== null ? Number(row.achieved_revenue) : undefined,
        totalHabilitatedUsers: Number(row.total_habilitated_users || 0),
        isFeaturedOnMarketplace: row.is_featured_on_marketplace,
        marketplaceAnnouncementTitle: row.marketplace_announcement_title,
        autoRelistSettings: row.auto_relist_settings || {},
        originalAuctionId: row.original_auction_id ? String(row.original_auction_id) : undefined,
        relistCount: Number(row.relist_count || 0),
        decrementAmount: row.decrement_amount !== null ? Number(row.decrement_amount) : undefined,
        decrementIntervalSeconds: row.decrement_interval_seconds !== null ? Number(row.decrement_interval_seconds) : undefined,
        floorPrice: row.floor_price !== null ? Number(row.floor_price) : undefined,
        silentBiddingEnabled: Boolean(row.silent_bidding_enabled),
        allowMultipleBidsPerUser: Boolean(row.allow_multiple_bids_per_user),
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
    reservePrice: row.reserve_price !== null ? Number(row.reserve_price) : undefined,
    evaluationValue: row.evaluation_value !== null ? Number(row.evaluation_value) : undefined,
    debtAmount: row.debt_amount !== null ? Number(row.debt_amount) : undefined,
    itbiValue: row.itbi_value !== null ? Number(row.itbi_value) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapToJudicialProcess(row: any, parties: ProcessParty[] = []): JudicialProcess {
  return {
    id: String(row.id),
    publicId: row.public_id,
    processNumber: row.process_number,
    oldProcessNumber: row.old_process_number,
    isElectronic: row.is_electronic,
    courtId: String(row.court_id),
    districtId: String(row.district_id),
    branchId: String(row.branch_id),
    sellerId: row.seller_id ? String(row.seller_id) : undefined,
    courtName: row.court_name,
    districtName: row.district_name,
    branchName: row.branch_name,
    sellerName: row.seller_name,
    parties,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapToBem(row: any): Bem {
  return {
    id: String(row.id),
    publicId: row.public_id,
    title: row.title,
    description: row.description,
    judicialProcessId: row.judicial_process_id ? String(row.judicial_process_id) : undefined,
    judicialProcessNumber: row.judicial_process_number,
    status: row.status as Bem['status'],
    categoryId: row.category_id ? String(row.category_id) : undefined,
    subcategoryId: row.subcategory_id ? String(row.subcategory_id) : undefined,
    categoryName: row.category_name,
    subcategoryName: row.subcategory_name,
    imageUrl: row.image_url,
    imageMediaId: row.image_media_id,
    dataAiHint: row.data_ai_hint,
    evaluationValue: row.evaluation_value !== null ? Number(row.evaluation_value) : undefined,
    locationCity: row.location_city,
    locationState: row.location_state,
    address: row.address,
    latitude: row.latitude !== null ? Number(row.latitude) : undefined,
    longitude: row.longitude !== null ? Number(row.longitude) : undefined,
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

function mapToUserLotMaxBid(row: QueryResultRow): UserLotMaxBid {
    return {
        id: String(row.id),
        userId: row.user_id,
        lotId: String(row.lot_id),
        maxAmount: parseFloat(row.max_amount),
        isActive: Boolean(row.is_active),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
    };
}

function mapToMediaItem(row: QueryResultRow): MediaItem {
  return {
    id: String(row.id),
    fileName: row.file_name,
    uploadedAt: new Date(row.uploaded_at),
    uploadedBy: row.uploaded_by,
    storagePath: row.storage_path,
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
        storageProvider: row.storage_provider as PlatformSettings['storageProvider'],
        firebaseStorageBucket: row.firebase_storage_bucket,
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
        variableIncrementTable: row.variable_increment_table,
        biddingSettings: row.bidding_settings,
        defaultListItemsPerPage: row.default_list_items_per_page,
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

  async getWinsForUser(userId: string): Promise<UserWin[]> {
    const { rows } = await getPool().query(
        `SELECT
            w.id as win_id,
            w.user_id,
            w.lot_id,
            w.winning_bid_amount,
            w.win_date,
            w.payment_status,
            w.invoice_url,
            
            l.id as l_id,
            l.public_id as l_public_id,
            l.auction_id as l_auction_id,
            l.title as l_title,
            l.number as l_number,
            l.image_url as l_image_url,
            l.data_ai_hint as l_data_ai_hint
            
        FROM user_wins w
        JOIN lots l ON w.lot_id = l.id
        WHERE w.user_id = $1
        ORDER BY w.win_date DESC`,
        [userId]
    );

    const wins: UserWin[] = rows.map(winRow => {
        const { win_id, user_id, lot_id, winning_bid_amount, win_date, payment_status, invoice_url, ...lotDataWithPrefix } = winRow;
        
        const lotObjectData: { [key: string]: any } = {};
        for (const key in lotDataWithPrefix) {
            if (key.startsWith('l_')) {
                const originalKey = key.substring(2);
                lotObjectData[originalKey] = lotDataWithPrefix[key];
            }
        }
        
        const lotObject = mapToLot(lotObjectData);

        return {
            id: String(win_id),
            userId: user_id,
            lotId: String(lot_id),
            winningBidAmount: parseFloat(winning_bid_amount),
            winDate: new Date(win_date),
            paymentStatus: payment_status as UserWin['paymentStatus'],
            invoiceUrl: invoice_url,
            lot: lotObject,
        };
    });
    return wins;
  }
  
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[PostgresAdapter] answerQuestion is not yet implemented for PostgreSQL.");
    return { success: false, message: "Funcionalidade não implementada para PostgreSQL." };
  }

  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> {
    console.warn("[PostgresAdapter] createUserLotMaxBid is not yet implemented for PostgreSQL.");
    return { success: false, message: "Funcionalidade não implementada para PostgreSQL." };
  }

  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    console.warn("[PostgresAdapter] getActiveUserLotMaxBid is not yet implemented for PostgreSQL.");
    return null;
  }
  
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
    const { rows } = await getPool().query('SELECT * FROM auctioneers WHERE name = $1 LIMIT 1', [name]);
    if (rows.length === 0) return null;
    return mapToAuctioneerProfileInfo(rows[0]);
  }

  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    const { rows } = await getPool().query('SELECT * FROM auctioneers WHERE slug = $1 OR public_id = $1 LIMIT 1', [slug]);
    if (rows.length === 0) return null;
    return mapToAuctioneerProfileInfo(rows[0]);
  }

  async getSellerByName(name: string): Promise<SellerProfileInfo | null> {
    const { rows } = await getPool().query('SELECT * FROM sellers WHERE name = $1 LIMIT 1', [name]);
    if (rows.length === 0) return null;
    return mapToSellerProfileInfo(rows[0]);
  }

  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    const { rows } = await getPool().query('SELECT * FROM sellers WHERE slug = $1 OR public_id = $1 LIMIT 1', [slug]);
    if (rows.length === 0) return null;
    return mapToSellerProfileInfo(rows[0]);
  }

  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
    console.warn("[PostgresAdapter] getAuctionsByAuctioneerSlug is not yet implemented for PostgreSQL.");
    return Promise.resolve([]);
  }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    console.warn("[PostgresAdapter] getDirectSaleOffers is not yet implemented for PostgreSQL.");
    return Promise.resolve([]);
  }

  async getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    if (ids.length === 0) return [];
    const { rows } = await getPool().query(`
      SELECT a.*, cat.name as category_name, auct.name as auctioneer_name, s.name as seller_name, auct.logo_url as auctioneer_logo_url
      FROM auctions a
      LEFT JOIN lot_categories cat ON a.category_id = cat.id
      LEFT JOIN auctioneers auct ON a.auctioneer_id = auct.id
      LEFT JOIN sellers s ON a.seller_id = s.id
      WHERE a.id = ANY($1::int[])
    `, [ids]);
    return rows.map(mapToAuction);
  }

  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    if (ids.length === 0) return [];
    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const publicIds = ids.filter(id => isNaN(parseInt(id, 10)));
    
    const { rows } = await getPool().query(`
      SELECT l.*, a.title as auction_name, cat.name as category_name
      FROM lots l
      LEFT JOIN auctions a ON l.auction_id = a.id
      LEFT JOIN lot_categories cat ON l.category_id = cat.id
      WHERE l.id = ANY($1::int[]) OR l.public_id = ANY($2::text[])
    `, [numericIds, publicIds]);
    return rows.map(mapToLot);
  }
  
  async initializeSchema(): Promise<{ success: boolean; message: string; errors?: any[], rolesProcessed?: number }> {
    const client = await getPool().connect();
    const errors: any[] = [];
    
    const queries = [
      `CREATE TABLE IF NOT EXISTS roles ( id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, name_normalized VARCHAR(100) NOT NULL UNIQUE, description TEXT, permissions JSONB, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS users ( uid VARCHAR(255) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, full_name VARCHAR(255), password_text VARCHAR(255), role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL, status VARCHAR(50), habilitation_status VARCHAR(50), cpf VARCHAR(20), rg_number VARCHAR(20), rg_issuer VARCHAR(50), rg_issue_date DATE, rg_state VARCHAR(2), date_of_birth DATE, cell_phone VARCHAR(20), home_phone VARCHAR(20), gender VARCHAR(50), profession VARCHAR(100), nationality VARCHAR(100), marital_status VARCHAR(50), property_regime VARCHAR(50), spouse_name VARCHAR(255), spouse_cpf VARCHAR(20), zip_code VARCHAR(10), street VARCHAR(255), number VARCHAR(20), complement VARCHAR(100), neighborhood VARCHAR(100), city VARCHAR(100), state VARCHAR(100), opt_in_marketing BOOLEAN DEFAULT FALSE, avatar_url TEXT, data_ai_hint VARCHAR(255), account_type VARCHAR(50), razao_social VARCHAR(255), cnpj VARCHAR(20), inscricao_estadual VARCHAR(50), website_comitente VARCHAR(255), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS lot_categories ( id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, description TEXT, item_count INTEGER DEFAULT 0, has_subcategories BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS subcategories ( id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, parent_category_id INTEGER NOT NULL REFERENCES lot_categories(id) ON DELETE CASCADE, description TEXT, item_count INTEGER DEFAULT 0, display_order INTEGER DEFAULT 0, icon_url TEXT, data_ai_hint_icon VARCHAR(255), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE (parent_category_id, slug) );`,
      `CREATE TABLE IF NOT EXISTS states ( id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, uf VARCHAR(2) NOT NULL UNIQUE, slug VARCHAR(100) NOT NULL UNIQUE, city_count INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS cities ( id SERIAL PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL, state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE, state_uf VARCHAR(2), ibge_code VARCHAR(10), lot_count INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS auctioneers ( id SERIAL PRIMARY KEY, public_id VARCHAR(255) UNIQUE, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL UNIQUE, registration_number VARCHAR(50), contact_name VARCHAR(150), email VARCHAR(150), phone VARCHAR(20), address VARCHAR(200), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(10), website TEXT, logo_url TEXT, data_ai_hint_logo VARCHAR(50), description TEXT, member_since TIMESTAMPTZ, rating NUMERIC(3, 2), auctions_conducted_count INTEGER DEFAULT 0, total_value_sold NUMERIC(15, 2) DEFAULT 0, user_id VARCHAR(255), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS sellers ( id SERIAL PRIMARY KEY, public_id VARCHAR(255) UNIQUE, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL UNIQUE, contact_name VARCHAR(150), email VARCHAR(150), phone VARCHAR(20), address VARCHAR(200), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(10), website TEXT, logo_url TEXT, data_ai_hint_logo VARCHAR(50), description TEXT, member_since TIMESTAMPTZ, rating NUMERIC(3, 2), active_lots_count INTEGER, total_sales_value NUMERIC(15, 2), auctions_facilitated_count INTEGER, user_id VARCHAR(255), cnpj VARCHAR(20), razao_social VARCHAR(255), inscricao_estadual VARCHAR(50), is_judicial BOOLEAN DEFAULT FALSE, judicial_branch_id INTEGER, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS auctions ( id SERIAL PRIMARY KEY, public_id VARCHAR(255) UNIQUE, title VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50), auction_type VARCHAR(50), category_id INTEGER REFERENCES lot_categories(id), auctioneer_id INTEGER REFERENCES auctioneers(id), seller_id INTEGER REFERENCES sellers(id), judicial_process_id INTEGER, auction_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ, city VARCHAR(100), state VARCHAR(2), image_url TEXT, data_ai_hint VARCHAR(255), documents_url TEXT, visits INTEGER DEFAULT 0, initial_offer NUMERIC(15, 2), soft_close_enabled BOOLEAN DEFAULT FALSE, soft_close_minutes INTEGER, automatic_bidding_enabled BOOLEAN DEFAULT FALSE, silent_bidding_enabled BOOLEAN DEFAULT FALSE, allow_multiple_bids_per_user BOOLEAN DEFAULT TRUE, allow_installment_bids BOOLEAN, estimated_revenue NUMERIC(15, 2), achieved_revenue NUMERIC(15, 2), total_habilitated_users INTEGER, total_lots INTEGER, is_featured_on_marketplace BOOLEAN, marketplace_announcement_title VARCHAR(150), auction_stages JSONB, auto_relist_settings JSONB, decrement_amount NUMERIC(15, 2), decrement_interval_seconds INTEGER, floor_price NUMERIC(15, 2), original_auction_id INTEGER REFERENCES auctions(id), relist_count INTEGER, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS lots ( id SERIAL PRIMARY KEY, public_id VARCHAR(255) UNIQUE, auction_id INTEGER REFERENCES auctions(id) ON DELETE SET NULL, bem_ids JSONB, number VARCHAR(50), title VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50), price NUMERIC(15, 2), initial_price NUMERIC(15, 2), bids_count INTEGER DEFAULT 0, is_featured BOOLEAN DEFAULT FALSE, reserve_price NUMERIC(15, 2), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS platform_settings ( id SERIAL PRIMARY KEY, site_title VARCHAR(255), site_tagline TEXT, gallery_image_base_path VARCHAR(255), storage_provider VARCHAR(50), firebase_storage_bucket VARCHAR(255), active_theme_name VARCHAR(100), themes JSONB, platform_public_id_masks JSONB, map_settings JSONB, search_pagination_type VARCHAR(50), search_items_per_page INTEGER, search_load_more_count INTEGER, show_countdown_on_lot_detail BOOLEAN, show_countdown_on_cards BOOLEAN, show_related_lots_on_lot_detail BOOLEAN, related_lots_count INTEGER, mental_trigger_settings JSONB, section_badge_visibility JSONB, homepage_sections JSONB, variable_increment_table JSONB, bidding_settings JSONB, default_list_items_per_page INTEGER, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS courts ( id SERIAL PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL UNIQUE, website TEXT, state_uf VARCHAR(2) NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS judicial_districts ( id SERIAL PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL, court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE RESTRICT, state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE RESTRICT, zip_code VARCHAR(10), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE (slug, state_id) );`,
      `CREATE TABLE IF NOT EXISTS judicial_branches ( id SERIAL PRIMARY KEY, name VARCHAR(150) NOT NULL, slug VARCHAR(150) NOT NULL, district_id INTEGER NOT NULL REFERENCES judicial_districts(id) ON DELETE CASCADE, contact_name VARCHAR(150), phone VARCHAR(20), email VARCHAR(150), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE (slug, district_id) );`,
      `CREATE TABLE IF NOT EXISTS judicial_processes ( id SERIAL PRIMARY KEY, public_id VARCHAR(255) UNIQUE, process_number VARCHAR(100) NOT NULL UNIQUE, old_process_number VARCHAR(100), is_electronic BOOLEAN DEFAULT true, court_id INTEGER NOT NULL REFERENCES courts(id), district_id INTEGER NOT NULL REFERENCES judicial_districts(id), branch_id INTEGER NOT NULL REFERENCES judicial_branches(id), seller_id INTEGER REFERENCES sellers(id), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS process_parties ( id SERIAL PRIMARY KEY, process_id INTEGER NOT NULL REFERENCES judicial_processes(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, document_number VARCHAR(50), party_type VARCHAR(50) NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS bens ( id SERIAL PRIMARY KEY, public_id VARCHAR(255) UNIQUE, title VARCHAR(255) NOT NULL, description TEXT, judicial_process_id INTEGER REFERENCES judicial_processes(id), status VARCHAR(50) DEFAULT 'DISPONIVEL', category_id INTEGER REFERENCES lot_categories(id), subcategory_id INTEGER REFERENCES subcategories(id), image_url TEXT, image_media_id VARCHAR(255), data_ai_hint VARCHAR(255), evaluation_value NUMERIC(15, 2), location_city VARCHAR(100), location_state VARCHAR(100), address VARCHAR(255), latitude NUMERIC(10, 8), longitude NUMERIC(11, 8), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS user_wins ( id SERIAL PRIMARY KEY, user_id VARCHAR(255) NOT NULL REFERENCES users(uid), lot_id INTEGER NOT NULL REFERENCES lots(id), winning_bid_amount NUMERIC(15, 2) NOT NULL, win_date TIMESTAMPTZ NOT NULL, payment_status VARCHAR(50) DEFAULT 'PENDENTE', invoice_url TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`,
      `CREATE TABLE IF NOT EXISTS bids ( id SERIAL PRIMARY KEY, lot_id INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE, auction_id INTEGER, bidder_id VARCHAR(255) NOT NULL, bidder_display_name VARCHAR(255), amount NUMERIC(15,2) NOT NULL, timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP );`
    ];

    try {
        await client.query('BEGIN');
        console.log('[PostgresAdapter] Executing schema creation queries...');
        for (const [index, query] of queries.entries()) {
          try {
              await client.query(query);
              console.log(`  - Query ${index + 1}/${queries.length} executed successfully.`);
          } catch (err: any) {
              console.error(`  - FAILED to execute Query ${index + 1}: ${err.message}`);
              errors.push({ query: query.substring(0, 50) + '...', error: err.message });
          }
        }
        
        if (errors.length > 0) {
            await client.query('ROLLBACK');
            return { success: false, message: 'Falha ao criar uma ou mais tabelas.', errors };
        }
        
        console.log('[PostgresAdapter] Tables created. Ensuring default roles...');
        const rolesResult = await this.ensureDefaultRolesExist(client);
        
        if (!rolesResult.success) {
            await client.query('ROLLBACK');
            return { success: false, message: rolesResult.message, errors: rolesResult.errors };
        }
        
        await client.query('COMMIT');
        return { success: true, message: `Esquema PostgreSQL inicializado ou verificado com sucesso.`, rolesProcessed: rolesResult.rolesProcessed };
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('[PostgresAdapter - initializeSchema] Erro de transação:', error);
        return { success: false, message: `Erro na transação do banco de dados: ${error.message}`, errors: [error] };
    } finally {
        client.release();
    }
  }

  async ensureDefaultRolesExist(client: Pool | any): Promise<{ success: boolean, message: string, errors?: any[], rolesProcessed?: number }> {
    let rolesProcessed = 0;
    const errors: any[] = [];
    for (const roleData of defaultRolesData) {
      try {
        const { rows } = await client.query('SELECT id FROM roles WHERE name_normalized = $1', [roleData.name]);
        const permissionsJson = JSON.stringify(roleData.permissions);
        if (rows.length === 0) {
          await client.query(
            'INSERT INTO roles (name, name_normalized, description, permissions) VALUES ($1, $2, $3, $4)',
            [roleData.name, roleData.name, roleData.description, permissionsJson]
          );
          rolesProcessed++;
        } else {
          await client.query(
            'UPDATE roles SET description = $1, permissions = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [roleData.description, permissionsJson, rows[0].id]
          );
        }
      } catch(err: any) {
        errors.push({ role: roleData.name, error: err.message });
      }
    }
    if (errors.length > 0) {
      return { success: false, message: "Erro ao processar perfis padrão.", errors, rolesProcessed };
    }
    return { success: true, message: 'Perfis padrão garantidos.', rolesProcessed };
  }
  
  // --- LotCategory ---
  async createLotCategory(data: { name: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    console.warn("[PostgresAdapter] createLotCategory is not yet implemented for PostgreSQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getLotCategories(): Promise<LotCategory[]> {
    console.warn("[PostgresAdapter] getLotCategories is not yet implemented for PostgreSQL.");
    return [];
  }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    console.warn("[PostgresAdapter] getLotCategory is not yet implemented for PostgreSQL.");
    return null;
  }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    console.warn("[PostgresAdapter] getLotCategoryByName is not yet implemented for PostgreSQL.");
    return null;
  }
  async updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[PostgresAdapter] updateLotCategory is not yet implemented for PostgreSQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[PostgresAdapter] deleteLotCategory is not yet implemented for PostgreSQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  
  // --- Auctioneer ---
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
    try {
        const publicId = `AUCT-PUB-${uuidv4().substring(0, 12)}`;
        const slug = slugify(data.name);
        const { rows } = await getPool().query(
            `INSERT INTO auctioneers (public_id, name, slug, registration_number, contact_name, email, phone, address, city, state, zip_code, website, logo_url, data_ai_hint_logo, description, user_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
            [publicId, data.name, slug, data.registrationNumber, data.contactName, data.email, data.phone, data.address, data.city, data.state, data.zipCode, data.website, data.logoUrl, data.dataAiHintLogo, data.description, data.userId]
        );
        return { success: true, message: 'Leiloeiro criado com sucesso!', auctioneerId: String(rows[0].id), auctioneerPublicId: publicId };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  }

  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
      const { rows } = await getPool().query('SELECT * FROM auctioneers ORDER BY name ASC');
      return rows.map(mapToAuctioneerProfileInfo);
  }

  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
      const { rows } = await getPool().query('SELECT * FROM auctioneers WHERE id = $1 OR public_id = $2 LIMIT 1', [isNaN(parseInt(idOrPublicId)) ? -1 : idOrPublicId, idOrPublicId]);
      if (rows.length === 0) return null;
      return mapToAuctioneerProfileInfo(rows[0]);
  }
  
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
      try {
        const setClauses: string[] = [];
        const values: any[] = [];
        let valueIndex = 1;

        if (data.name) {
            (data as any).slug = slugify(data.name);
        }

        for (const [key, value] of Object.entries(data)) {
            const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            setClauses.push(`${snakeCaseKey} = $${valueIndex++}`);
            values.push(value);
        }

        if (setClauses.length === 0) return { success: true, message: 'Nenhuma alteração para salvar.' };
        
        const idIndex = valueIndex++;
        const publicIdIndex = valueIndex;
        values.push(isNaN(parseInt(idOrPublicId)) ? -1 : idOrPublicId, idOrPublicId);

        const updateQuery = `UPDATE auctioneers SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idIndex} OR public_id = $${publicIdIndex}`;
        
        const result = await getPool().query(updateQuery, values);
        
        if (result.rowCount > 0) return { success: true, message: 'Leiloeiro atualizado com sucesso!' };
        return { success: false, message: 'Leiloeiro não encontrado.' };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  }
  
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
      try {
        const result = await getPool().query('DELETE FROM auctioneers WHERE id = $1 OR public_id = $2', [isNaN(parseInt(idOrPublicId)) ? -1 : idOrPublicId, idOrPublicId]);
        if (result.rowCount > 0) return { success: true, message: 'Leiloeiro excluído com sucesso!' };
        return { success: false, message: 'Leiloeiro não encontrado.' };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  }

  // ... (all other stubs remain as they are for this fix)
}