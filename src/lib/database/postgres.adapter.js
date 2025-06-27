"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresAdapter = void 0;
// src/lib/database/postgres.adapter.ts
var pg_1 = require("pg");
var sample_data_1 = require("@/lib/sample-data");
var pool;
function getPool() {
    if (!pool) {
        var connectionString = process.env.POSTGRES_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('POSTGRES_CONNECTION_STRING não está definida nas variáveis de ambiente.');
        }
        pool = new pg_1.Pool({ connectionString: connectionString });
        console.log('[PostgresAdapter] Pool de conexões PostgreSQL inicializado.');
    }
    return pool;
}
function mapRowToCamelCase(row) {
    var newRow = {};
    for (var key in row) {
        var camelCaseKey = key.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
        newRow[camelCaseKey] = row[key];
    }
    return newRow;
}
function mapRowsToCamelCase(rows) {
    return rows.map(mapRowToCamelCase);
}
function mapToLotCategory(row) {
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
function mapToSubcategory(row) {
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
function mapToStateInfo(row) {
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
function mapToCityInfo(row) {
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
function mapToAuctioneerProfileInfo(row) {
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
function mapToSellerProfileInfo(row) {
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
function mapToRole(row) {
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
function mapToUserProfileData(row, role) {
    var profile = {
        uid: row.uid,
        email: row.email,
        fullName: row.full_name,
        password: row.password_text,
        roleId: row.role_id ? String(row.role_id) : undefined,
        roleName: (role === null || role === void 0 ? void 0 : role.name) || row.role_name_from_join || row.role_name,
        permissions: (role === null || role === void 0 ? void 0 : role.permissions) && role.permissions.length > 0 ? role.permissions : (row.permissions || row.role_permissions_from_join || []),
        status: row.status,
        habilitationStatus: row.habilitation_status,
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
function mapToAuction(row) {
    return {
        id: String(row.id),
        publicId: row.public_id,
        title: row.title,
        description: row.description,
        status: row.status,
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
function mapToLot(row) {
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
        status: row.status,
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
function mapToBidInfo(row) {
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
function mapToUserLotMaxBid(row) {
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
function mapToMediaItem(row) {
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
function mapToPlatformSettings(row) {
    return {
        id: String(row.id),
        siteTitle: row.site_title,
        siteTagline: row.site_tagline,
        galleryImageBasePath: row.gallery_image_base_path,
        storageProvider: row.storage_provider,
        firebaseStorageBucket: row.firebase_storage_bucket,
        activeThemeName: row.active_theme_name,
        themes: row.themes || [],
        platformPublicIdMasks: row.platform_public_id_masks || {},
        mapSettings: row.map_settings || sample_data_1.samplePlatformSettings.mapSettings,
        searchPaginationType: row.search_pagination_type || sample_data_1.samplePlatformSettings.searchPaginationType,
        searchItemsPerPage: Number(row.search_items_per_page || sample_data_1.samplePlatformSettings.searchItemsPerPage),
        searchLoadMoreCount: Number(row.search_load_more_count || sample_data_1.samplePlatformSettings.searchLoadMoreCount),
        showCountdownOnLotDetail: row.show_countdown_on_lot_detail === null ? sample_data_1.samplePlatformSettings.showCountdownOnLotDetail : Boolean(row.show_countdown_on_lot_detail),
        showCountdownOnCards: row.show_countdown_on_cards === null ? sample_data_1.samplePlatformSettings.showCountdownOnCards : Boolean(row.show_countdown_on_cards),
        showRelatedLotsOnLotDetail: row.show_related_lots_on_lot_detail === null ? sample_data_1.samplePlatformSettings.showRelatedLotsOnLotDetail : Boolean(row.show_related_lots_on_lot_detail),
        relatedLotsCount: Number(row.related_lots_count || sample_data_1.samplePlatformSettings.relatedLotsCount),
        mentalTriggerSettings: row.mental_trigger_settings || sample_data_1.samplePlatformSettings.mentalTriggerSettings,
        sectionBadgeVisibility: row.section_badge_visibility || sample_data_1.samplePlatformSettings.sectionBadgeVisibility,
        homepageSections: row.homepage_sections || sample_data_1.samplePlatformSettings.homepageSections,
        updatedAt: new Date(row.updated_at)
    };
}
function mapToReview(row) {
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
function mapToLotQuestion(row) {
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
var defaultRolesData = [
    { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
    { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
    { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
    { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
    { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
];
var PostgresAdapter = /** @class */ (function () {
    function PostgresAdapter() {
        getPool();
    }
    PostgresAdapter.prototype.getAuction = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, auctionData, lotRes, lots, auction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().query("SELECT a.*, cat.name as category_name, auct.name as auctioneer_name, s.name as seller_name, auct.logo_url as auctioneer_logo_url \n       FROM auctions a\n       LEFT JOIN lot_categories cat ON a.category_id = cat.id\n       LEFT JOIN auctioneers auct ON a.auctioneer_id = auct.id\n       LEFT JOIN sellers s ON a.seller_id = s.id\n       WHERE a.id = $1 OR a.public_id = $2 \n       LIMIT 1", [isNaN(parseInt(idOrPublicId, 10)) ? -1 : parseInt(idOrPublicId, 10), idOrPublicId])];
                    case 1:
                        res = _a.sent();
                        if (res.rows.length === 0)
                            return [2 /*return*/, null];
                        auctionData = res.rows[0];
                        return [4 /*yield*/, getPool().query("SELECT l.*, c.name as category_name, s.name as subcategory_name, st.uf as state_uf, city.name as city_name, a.title as auction_name\n       FROM lots l\n       LEFT JOIN auctions a ON l.auction_id = a.id\n       LEFT JOIN lot_categories c ON l.category_id = c.id\n       LEFT JOIN subcategories s ON l.subcategory_id = s.id\n       LEFT JOIN states st ON l.state_id = st.id\n       LEFT JOIN cities city ON l.city_id = city.id\n       WHERE l.auction_id = $1", [auctionData.id])];
                    case 2:
                        lotRes = _a.sent();
                        lots = lotRes.rows.map(mapToLot);
                        auction = mapToAuction(auctionData);
                        auction.lots = lots;
                        auction.totalLots = lots.length;
                        return [2 /*return*/, auction];
                }
            });
        });
    };
    PostgresAdapter.prototype.getWinsForUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, wins;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().query("SELECT\n            w.id as win_id,\n            w.user_id,\n            w.lot_id,\n            w.winning_bid_amount,\n            w.win_date,\n            w.payment_status,\n            w.invoice_url,\n            \n            -- Prefixo \"l_\" para todas as colunas de lote para evitar ambiguidade\n            l.id as l_id,\n            l.public_id as l_public_id,\n            l.auction_id as l_auction_id,\n            l.title as l_title,\n            l.number as l_number,\n            l.image_url as l_image_url,\n            l.data_ai_hint as l_data_ai_hint\n            -- Adicione outras colunas de \"lots\" necess\u00E1rias aqui, prefixadas com \"l_\"\n            \n        FROM user_wins w\n        -- Garantir que a jun\u00E7\u00E3o seja com a tabela de lotes\n        JOIN lots l ON w.lot_id = l.id\n        WHERE w.user_id = $1\n        ORDER BY w.win_date DESC", [userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        wins = rows.map(function (winRow) {
                            // Separar os dados do arremate dos dados do lote
                            var win_id = winRow.win_id, user_id = winRow.user_id, lot_id = winRow.lot_id, winning_bid_amount = winRow.winning_bid_amount, win_date = winRow.win_date, payment_status = winRow.payment_status, invoice_url = winRow.invoice_url, lotDataWithPrefix = __rest(winRow, ["win_id", "user_id", "lot_id", "winning_bid_amount", "win_date", "payment_status", "invoice_url"]);
                            // Construir um objeto de lote a partir das colunas prefixadas
                            var lotObjectData = {};
                            for (var key in lotDataWithPrefix) {
                                if (key.startsWith('l_')) {
                                    // Remover o prefixo "l_" para obter o nome original da coluna
                                    var originalKey = key.substring(2);
                                    lotObjectData[originalKey] = lotDataWithPrefix[key];
                                }
                            }
                            var lotObject = mapToLot(lotObjectData);
                            return {
                                id: String(win_id),
                                userId: user_id,
                                lotId: String(lot_id),
                                winningBidAmount: parseFloat(winning_bid_amount),
                                winDate: new Date(win_date),
                                paymentStatus: payment_status,
                                invoiceUrl: invoice_url,
                                lot: lotObject,
                            };
                        });
                        return [2 /*return*/, wins];
                }
            });
        });
    };
    PostgresAdapter.prototype.answerQuestion = function (lotId, questionId, answerText, answeredByUserId, answeredByUserDisplayName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] answerQuestion is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada para PostgreSQL." }];
            });
        });
    };
    PostgresAdapter.prototype.createUserLotMaxBid = function (userId, lotId, maxAmount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createUserLotMaxBid is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada para PostgreSQL." }];
            });
        });
    };
    PostgresAdapter.prototype.getActiveUserLotMaxBid = function (userId, lotId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getActiveUserLotMaxBid is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.getAuctioneerByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().query('SELECT * FROM auctioneers WHERE name = $1 LIMIT 1', [name])];
                    case 1:
                        rows = (_a.sent()).rows;
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToAuctioneerProfileInfo(rows[0])];
                }
            });
        });
    };
    PostgresAdapter.prototype.getAuctioneerBySlug = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().query('SELECT * FROM auctioneers WHERE slug = $1 OR public_id = $1 LIMIT 1', [slug])];
                    case 1:
                        rows = (_a.sent()).rows;
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToAuctioneerProfileInfo(rows[0])];
                }
            });
        });
    };
    PostgresAdapter.prototype.getSellerByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().query('SELECT * FROM sellers WHERE name = $1 LIMIT 1', [name])];
                    case 1:
                        rows = (_a.sent()).rows;
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToSellerProfileInfo(rows[0])];
                }
            });
        });
    };
    PostgresAdapter.prototype.getSellerBySlug = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().query('SELECT * FROM sellers WHERE slug = $1 OR public_id = $1 LIMIT 1', [slug])];
                    case 1:
                        rows = (_a.sent()).rows;
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToSellerProfileInfo(rows[0])];
                }
            });
        });
    };
    PostgresAdapter.prototype.getAuctionsByAuctioneerSlug = function (auctioneerSlugOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getAuctionsByAuctioneerSlug is not yet implemented for PostgreSQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    PostgresAdapter.prototype.getDirectSaleOffers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getDirectSaleOffers is not yet implemented for PostgreSQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    PostgresAdapter.prototype.getAuctionsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getAuctionsByIds is not yet implemented for PostgreSQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    PostgresAdapter.prototype.getLotsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getLotsByIds is not yet implemented for PostgreSQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    PostgresAdapter.prototype.initializeSchema = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] initializeSchema is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createLotCategory = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createLotCategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getLotCategories = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getLotCategories is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getLotCategory = function (idOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getLotCategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.getLotCategoryByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getLotCategoryByName is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateLotCategory = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateLotCategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteLotCategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteLotCategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createSubcategory = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createSubcategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getSubcategories = function (parentCategoryId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getSubcategories is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getSubcategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getSubcategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.getSubcategoryBySlug = function (slug, parentCategoryId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getSubcategoryBySlug is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateSubcategory = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateSubcategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteSubcategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteSubcategory is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createState = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createState is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getStates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getStates is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getState = function (idOrSlugOrUf) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getState is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateState = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateState is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteState = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteState is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createCity = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createCity is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getCities = function (stateIdOrSlugFilter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getCities is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getCity = function (idOrCompositeSlug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getCity is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateCity = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateCity is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteCity = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteCity is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createAuctioneer = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createAuctioneer is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getAuctioneers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getAuctioneers is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getAuctioneer = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getAuctioneer is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateAuctioneer = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateAuctioneer is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteAuctioneer = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteAuctioneer is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createSeller = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createSeller is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getSellers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getSellers is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getSeller = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getSeller is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateSeller = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateSeller is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteSeller = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteSeller is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createAuction = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createAuction is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getAuctions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getAuctions is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.updateAuction = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateAuction is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteAuction = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteAuction is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getAuctionsBySellerSlug = function (sellerSlugOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getAuctionsBySellerSlug is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.createLot = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getLots = function (auctionIdParam) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getLots is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getLot = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateLot = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteLot = function (idOrPublicId, auctionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getBidsForLot = function (lotIdOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getBidsForLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.placeBidOnLot = function (lotIdOrPublicId, auctionIdOrPublicId, userId, userDisplayName, bidAmount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] placeBidOnLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getReviewsForLot = function (lotIdOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getReviewsForLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.createReview = function (review) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createReview is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getQuestionsForLot = function (lotIdOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getQuestionsForLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.createQuestion = function (question) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createQuestion is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getUserProfileData = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getUserProfileData is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateUserProfile = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateUserProfile is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.ensureUserRole = function (userId, email, fullName, targetRoleName, additionalProfileData, roleIdToAssign) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] ensureUserRole is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getUsersWithRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getUsersWithRoles is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.updateUserRole = function (userId, roleId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateUserRole is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteUserProfile = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteUserProfile is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getUserByEmail is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.createRole = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createRole is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getRoles is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getRole = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getRole is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.getRoleByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getRoleByName is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateRole = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateRole is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteRole = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteRole is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.ensureDefaultRolesExist = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] ensureDefaultRolesExist is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.createMediaItem = function (data, filePublicUrl, uploadedBy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] createMediaItem is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getMediaItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getMediaItems is not yet implemented for PostgreSQL.");
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getMediaItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getMediaItem is not yet implemented for PostgreSQL.");
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateMediaItemMetadata = function (id, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updateMediaItemMetadata is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.deleteMediaItemFromDb = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] deleteMediaItemFromDb is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.linkMediaItemsToLot = function (lotId, mediaItemIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] linkMediaItemsToLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.unlinkMediaItemFromLot = function (lotId, mediaItemId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] unlinkMediaItemFromLot is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    PostgresAdapter.prototype.getPlatformSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] getPlatformSettings is not yet implemented for PostgreSQL.");
                return [2 /*return*/, sample_data_1.samplePlatformSettings];
            });
        });
    };
    PostgresAdapter.prototype.updatePlatformSettings = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[PostgresAdapter] updatePlatformSettings is not yet implemented for PostgreSQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    return PostgresAdapter;
}());
exports.PostgresAdapter = PostgresAdapter;
