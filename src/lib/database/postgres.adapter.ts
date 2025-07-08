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
  UserDocument,
  DocumentType,
  Notification,
  BlogPost,
  UserBid,
  AdminDashboardStats,
  ConsignorDashboardStats
} from '@/types';
import { samplePlatformSettings } from '@/lib/sample-data';
import { slugify } from '@/lib/sample-data-helpers';
import { v4 as uuidv4 } from 'uuid';
import type { WizardData } from '@/components/admin/wizard/wizard-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  
  async getConsignorDashboardStats(sellerId: string): Promise<ConsignorDashboardStats> {
    const defaultStats: ConsignorDashboardStats = {
      totalLotsConsigned: 0, activeLots: 0, soldLots: 0, totalSalesValue: 0, salesRate: 0, salesByMonth: [],
    };
    if (!sellerId) return defaultStats;

    try {
      const lotsResult = await getPool().query(
        "SELECT status, price, updated_at FROM lots WHERE seller_id = $1",
        [sellerId]
      );
      const lotsRows = lotsResult.rows;

      const totalLotsConsigned = lotsRows.length;
      const activeLots = lotsRows.filter(l => l.status === 'ABERTO_PARA_LANCES').length;
      const soldLots = lotsRows.filter(l => l.status === 'VENDIDO');
      const totalSalesValue = soldLots.reduce((sum, lot) => sum + parseFloat(lot.price), 0);
      const finishedLotsCount = lotsRows.filter(l => ['VENDIDO', 'NAO_VENDIDO'].includes(l.status)).length;
      const salesRate = finishedLotsCount > 0 ? (soldLots.length / finishedLotsCount) * 100 : 0;
      
      const salesByMonthMap = new Map<string, number>();
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        salesByMonthMap.set(monthKey, 0);
      }
      soldLots.forEach(lot => {
        const saleDate = new Date(lot.updated_at);
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        if (salesByMonthMap.has(monthKey)) {
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + parseFloat(lot.price));
        }
      });
      const salesByMonth = Array.from(salesByMonthMap.entries())
        .map(([name, sales]) => ({ name: format(new Date(name + '-02'), 'MMM/yy', { locale: ptBR }), sales }))
        .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());


      return { totalLotsConsigned, activeLots, soldLots: soldLots.length, totalSalesValue, salesRate, salesByMonth };

    } catch (error: any) {
        console.error(`Error fetching consignor stats for seller ${sellerId}:`, error);
        return defaultStats;
    }
  }

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const { rows } = await getPool().query(`
        SELECT
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM auctions) as auctions,
            (SELECT COUNT(*) FROM lots) as lots,
            (SELECT COUNT(*) FROM sellers) as sellers
    `);
    return mapRowToCamelCase(rows[0]) as AdminDashboardStats;
  }

  async getAdminReportData(): Promise<AdminReportData> {
      console.warn("[PostgresAdapter] getAdminReportData: Sales data is a placeholder.");
      const { rows: [stats] } = await getPool().query(`
          SELECT
              (SELECT SUM(price) FROM lots WHERE status = 'VENDIDO') as "totalRevenue",
              (SELECT COUNT(*) FROM lots WHERE status = 'VENDIDO') as "lotsSoldCount",
              (SELECT COUNT(*) FROM auctions WHERE status = 'ABERTO_PARA_LANCES') as "activeAuctions",
              (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as "newUsersLast30Days"
      `);
      
      const { rows: categoryRows } = await getPool().query(`
          SELECT c.name, COUNT(l.id)::int as value
          FROM lots l
          JOIN lot_categories c ON l.category_id = c.id
          WHERE l.status = 'VENDIDO'
          GROUP BY c.name
          ORDER BY value DESC
          LIMIT 5
      `);

      return {
          totalRevenue: Number(stats.totalRevenue) || 0,
          newUsersLast30Days: Number(stats.newUsersLast30Days) || 0,
          activeAuctions: Number(stats.activeAuctions) || 0,
          lotsSoldCount: Number(stats.lotsSoldCount) || 0,
          salesData: [], // Placeholder
          categoryData: categoryRows.map(r => ({ ...r, value: Number(r.value) })),
      };
  }

  async getAuctionsForConsignor(sellerId: string): Promise<Auction[]> {
    const { rows } = await getPool().query('SELECT * FROM auctions WHERE seller_id = $1 ORDER BY auction_date DESC', [sellerId]);
    return rows.map(mapToAuction);
  }

  async getLotsForConsignor(sellerId: string): Promise<Lot[]> {
    const { rows } = await getPool().query(`
        SELECT l.*, a.title as auction_name FROM lots l JOIN auctions a ON l.auction_id = a.id WHERE a.seller_id = $1 ORDER BY l.created_at DESC
    `, [sellerId]);
    return rows.map(mapToLot);
  }

  async getWinsForSeller(sellerId: string): Promise<UserWin[]> {
    const { rows } = await getPool().query(`
      SELECT w.*, l.title as lot_title, l.number as lot_number, l.image_url as lot_image_url, l.data_ai_hint as lot_data_ai_hint, l.public_id as lot_public_id, l.auction_id as lot_auction_id
      FROM user_wins w
      JOIN lots l ON w.lot_id = l.id
      WHERE l.seller_id = $1
      ORDER BY w.win_date DESC
    `, [sellerId]);

    return rows.map(row => ({
      id: String(row.win_id),
      userId: row.user_id,
      lotId: String(row.lot_id),
      winningBidAmount: parseFloat(row.winning_bid_amount),
      winDate: new Date(row.win_date),
      paymentStatus: row.payment_status,
      invoiceUrl: row.invoice_url,
      lot: {
        id: String(row.lot_id),
        publicId: row.lot_public_id,
        title: row.lot_title,
        number: row.lot_number,
        imageUrl: row.lot_image_url,
        dataAiHint: row.lot_data_ai_hint,
        auctionId: String(row.lot_auction_id)
      } as Lot,
    }));
  }

  async getDirectSaleOffersForSeller(sellerId: string): Promise<DirectSaleOffer[]> {
    const { rows } = await getPool().query('SELECT * FROM direct_sale_offers WHERE seller_id = $1 ORDER BY created_at DESC', [sellerId]);
    // This assumes a mapToDirectSaleOffer function exists
    // return rows.map(mapToDirectSaleOffer);
    return []; // Placeholder
  }
}
