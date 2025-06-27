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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlAdapter = void 0;
// src/lib/database/mysql.adapter.ts
var promise_1 = require("mysql2/promise");
var sample_data_1 = require("@/lib/sample-data");
var pool;
function getPool() {
    if (!pool) {
        var connectionString = process.env.MYSQL_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('MYSQL_CONNECTION_STRING não está definida nas variáveis de ambiente.');
        }
        try {
            var url = new URL(connectionString);
            pool = promise_1.default.createPool({
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
        }
        catch (e) {
            console.error("[MySqlAdapter] Erro ao parsear MYSQL_CONNECTION_STRING ou criar pool:", e);
            throw new Error('Formato inválido para MYSQL_CONNECTION_STRING ou falha ao criar pool.');
        }
    }
    return pool;
}
function mapMySqlRowToCamelCase(row) {
    if (!row)
        return {};
    var newRow = {};
    for (var key in row) {
        var camelCaseKey = key.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
        newRow[camelCaseKey] = row[key];
    }
    return newRow;
}
function mapMySqlRowsToCamelCase(rows) {
    return rows.map(mapMySqlRowToCamelCase);
}
function parseJsonColumn(value, defaultValue) {
    if (typeof value === 'string' && value.trim() !== '') {
        try {
            var parsed = JSON.parse(value);
            return parsed;
        }
        catch (e) {
            console.warn("[MySqlAdapter] Failed to parse JSON column: ".concat(value), e);
            return defaultValue;
        }
    }
    return defaultValue;
}
function mapToLotCategory(row) {
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
function mapToSubcategory(row) {
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
function mapToStateInfo(row) {
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
function mapToCityInfo(row) {
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
function mapToAuctioneerProfileInfo(row) {
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
function mapToSellerProfileInfo(row) {
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
function mapToRole(row) {
    return {
        id: String(row.id),
        name: row.name,
        name_normalized: row.nameNormalized,
        description: row.description,
        permissions: parseJsonColumn(row.permissions, []),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}
function mapToUserProfileData(row, role) {
    var profile = {
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        password: row.passwordText,
        roleId: row.roleId ? String(row.roleId) : undefined,
        roleName: (role === null || role === void 0 ? void 0 : role.name) || row.roleNameFromJoin || row.roleName || undefined,
        permissions: (role === null || role === void 0 ? void 0 : role.permissions) && role.permissions.length > 0 ? role.permissions : parseJsonColumn(row.permissions || row.rolePermissionsFromJoin, []),
        status: row.status,
        habilitationStatus: row.habilitationStatus,
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
        accountType: row.accountType,
        razaoSocial: row.razaoSocial,
        cnpj: row.cnpj,
        inscricaoEstadual: row.inscricaoEstadual,
        websiteComitente: row.websiteComitente,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
    return profile;
}
function mapToAuction(row) {
    return {
        id: String(row.id),
        publicId: row.publicId,
        title: row.title,
        description: row.description,
        status: row.status,
        auctionType: row.auctionType,
        category: row.categoryName || row.category,
        categoryId: row.categoryId ? String(row.categoryId) : undefined,
        auctioneer: row.auctioneerName || row.auctioneer,
        auctioneerId: row.auctioneerId ? String(row.auctioneerId) : undefined,
        seller: row.sellerName || row.seller,
        sellerId: row.sellerId ? String(row.sellerId) : undefined,
        auctionDate: new Date(row.auctionDate),
        endDate: row.endDate ? new Date(row.endDate) : null,
        auctionStages: parseJsonColumn(row.auctionStages, []),
        city: row.city,
        state: row.state,
        imageUrl: row.imageUrl,
        dataAiHint: row.dataAiHint,
        documentsUrl: row.documentsUrl,
        totalLots: Number(row.totalLotsCount || 0),
        visits: Number(row.visits || 0),
        initialOffer: row.initialOffer !== null ? Number(row.initialOffer) : undefined,
        isFavorite: Boolean(row.isFavorite),
        currentBid: row.currentBid !== null ? Number(row.currentBid) : undefined,
        bidsCount: Number(row.bidsCount || 0),
        sellingBranch: row.sellingBranch,
        vehicleLocation: row.vehicleLocation,
        latitude: row.latitude !== null ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude !== null ? parseFloat(row.longitude) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        auctioneerLogoUrl: row.auctioneerLogoUrl,
        lots: [],
        automaticBiddingEnabled: Boolean(row.automaticBiddingEnabled),
        allowInstallmentBids: Boolean(row.allowInstallmentBids),
        softCloseEnabled: Boolean(row.softCloseEnabled),
        softCloseMinutes: row.softCloseMinutes !== null ? Number(row.softCloseMinutes) : undefined,
        estimatedRevenue: row.estimatedRevenue !== null ? Number(row.estimatedRevenue) : undefined,
        achievedRevenue: row.achievedRevenue !== null ? Number(row.achievedRevenue) : undefined,
        totalHabilitatedUsers: Number(row.totalHabilitatedUsers || 0),
        isFeaturedOnMarketplace: Boolean(row.isFeaturedOnMarketplace),
        marketplaceAnnouncementTitle: row.marketplaceAnnouncementTitle,
        autoRelistSettings: parseJsonColumn(row.autoRelistSettings, {}),
        originalAuctionId: row.originalAuctionId ? String(row.originalAuctionId) : undefined,
        relistCount: Number(row.relistCount || 0),
        decrementAmount: row.decrementAmount !== null ? Number(row.decrementAmount) : undefined,
        decrementIntervalSeconds: row.decrementIntervalSeconds !== null ? Number(row.decrementIntervalSeconds) : undefined,
        floorPrice: row.floorPrice !== null ? Number(row.floorPrice) : undefined,
        silentBiddingEnabled: Boolean(row.silentBiddingEnabled),
        allowMultipleBidsPerUser: Boolean(row.allowMultipleBidsPerUser),
    };
}
function mapToLot(row) {
    return {
        id: String(row.id),
        publicId: row.publicId,
        auctionId: String(row.auctionId),
        title: row.title,
        number: row.number,
        imageUrl: row.imageUrl,
        dataAiHint: row.dataAiHint,
        galleryImageUrls: parseJsonColumn(row.galleryImageUrls, []),
        mediaItemIds: parseJsonColumn(row.mediaItemIds, []),
        status: row.status,
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
        exteriorInteriorColor: row.exteriorinteriorcolor,
        options: row.options,
        manufacturedIn: row.manufacturedIn,
        vehicleClass: row.vehicleClass,
        vehicleLocationInBranch: row.vehicleLocationInBranch,
        laneRunNumber: row.laneRunNumber,
        aisleStall: row.aisleStall,
        actualCashValue: row.actualCashValue,
        estimatedRepairCost: row.estimatedRepairCost,
        sellerName: row.lotSellerName || row.sellerName,
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
        reservePrice: row.reservePrice !== null ? Number(row.reservePrice) : undefined,
        evaluationValue: row.evaluationValue !== null ? Number(row.evaluationValue) : undefined,
        debtAmount: row.debtAmount !== null ? Number(row.debtAmount) : undefined,
        itbiValue: row.itbiValue !== null ? Number(row.itbiValue) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    };
}
function mapToBidInfo(row) {
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
function mapToUserLotMaxBid(row) {
    return {
        id: String(row.id),
        userId: row.userId,
        lotId: String(row.lotId),
        maxAmount: parseFloat(row.maxAmount),
        isActive: Boolean(row.isActive),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
    };
}
function mapToMediaItem(row) {
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
        linkedLotIds: parseJsonColumn(row.linkedLotIds, []),
        dataAiHint: row.dataAiHint,
        storagePath: row.storagePath
    };
}
function mapToPlatformSettings(row) {
    return {
        id: String(row.id),
        siteTitle: row.siteTitle,
        siteTagline: row.siteTagline,
        galleryImageBasePath: row.galleryImageBasePath,
        storageProvider: row.storageProvider,
        firebaseStorageBucket: row.firebaseStorageBucket,
        activeThemeName: row.activeThemeName,
        themes: parseJsonColumn(row.themes, []),
        platformPublicIdMasks: parseJsonColumn(row.platformPublicIdMasks, {}),
        mapSettings: parseJsonColumn(row.mapSettings, sample_data_1.samplePlatformSettings.mapSettings),
        searchPaginationType: row.searchPaginationType || sample_data_1.samplePlatformSettings.searchPaginationType,
        searchItemsPerPage: Number(row.searchItemsPerPage || sample_data_1.samplePlatformSettings.searchItemsPerPage),
        searchLoadMoreCount: Number(row.searchLoadMoreCount || sample_data_1.samplePlatformSettings.searchLoadMoreCount),
        showCountdownOnLotDetail: row.showCountdownOnLotDetail === null ? sample_data_1.samplePlatformSettings.showCountdownOnLotDetail : Boolean(row.showCountdownOnLotDetail),
        showCountdownOnCards: row.showCountdownOnCards === null ? sample_data_1.samplePlatformSettings.showCountdownOnCards : Boolean(row.showCountdownOnCards),
        showRelatedLotsOnLotDetail: row.showRelatedLotsOnLotDetail === null ? sample_data_1.samplePlatformSettings.showRelatedLotsOnLotDetail : Boolean(row.showRelatedLotsOnLotDetail),
        relatedLotsCount: Number(row.relatedLotsCount || sample_data_1.samplePlatformSettings.relatedLotsCount),
        mentalTriggerSettings: parseJsonColumn(row.mentalTriggerSettings, sample_data_1.samplePlatformSettings.mentalTriggerSettings),
        sectionBadgeVisibility: parseJsonColumn(row.sectionBadgeVisibility, sample_data_1.samplePlatformSettings.sectionBadgeVisibility),
        homepageSections: parseJsonColumn(row.homepageSections, sample_data_1.samplePlatformSettings.homepageSections),
        updatedAt: new Date(row.updatedAt)
    };
}
function mapToReview(row) {
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
function mapToLotQuestion(row) {
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
var defaultRolesData = [
    { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] },
    { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] },
    { name: 'CONSIGNOR', description: 'Comitente.', permissions: ['auctions:manage_own', 'lots:manage_own', 'view_reports', 'media:upload'] },
    { name: 'AUCTIONEER', description: 'Leiloeiro.', permissions: ['auctions:manage_assigned', 'lots:read', 'lots:update', 'conduct_auctions'] },
    { name: 'AUCTION_ANALYST', description: 'Analista de Leilões.', permissions: ['categories:read', 'states:read', 'users:read', 'view_reports'] }
];
var MySqlAdapter = /** @class */ (function () {
    function MySqlAdapter() {
        getPool();
    }
    MySqlAdapter.prototype.getAuction = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows, auctionData, lotRows, lots, auction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().execute("SELECT a.*, cat.name as category_name, auct.name as auctioneer_name, s.name as seller_name, auct.logo_url as auctioneer_logo_url \n       FROM auctions a\n       LEFT JOIN lot_categories cat ON a.category_id = cat.id\n       LEFT JOIN auctioneers auct ON a.auctioneer_id = auct.id\n       LEFT JOIN sellers s ON a.seller_id = s.id\n       WHERE a.id = ? OR a.public_id = ? \n       LIMIT 1", [idOrPublicId, idOrPublicId])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        auctionData = mapMySqlRowToCamelCase(rows[0]);
                        return [4 /*yield*/, getPool().execute("SELECT l.*, c.name as category_name, s.name as subcategory_name, st.uf as state_uf, city.name as city_name, a.title as auction_name\n       FROM lots l\n       LEFT JOIN auctions a ON l.auction_id = a.id\n       LEFT JOIN lot_categories c ON l.category_id = c.id\n       LEFT JOIN subcategories s ON l.subcategory_id = s.id\n       LEFT JOIN states st ON l.state_id = st.id\n       LEFT JOIN cities city ON l.city_id = city.id\n       WHERE l.auction_id = ?", [auctionData.id])];
                    case 2:
                        lotRows = (_a.sent())[0];
                        lots = mapMySqlRowsToCamelCase(lotRows).map(mapToLot);
                        auction = mapToAuction(auctionData);
                        auction.lots = lots;
                        auction.totalLots = lots.length;
                        return [2 /*return*/, auction];
                }
            });
        });
    };
    MySqlAdapter.prototype.getWinsForUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getWinsForUser is not yet implemented for MySQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    MySqlAdapter.prototype.answerQuestion = function (lotId, questionId, answerText, answeredByUserId, answeredByUserDisplayName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] answerQuestion is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada para MySQL." }];
            });
        });
    };
    MySqlAdapter.prototype.createUserLotMaxBid = function (userId, lotId, maxAmount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createUserLotMaxBid is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada para MySQL." }];
            });
        });
    };
    MySqlAdapter.prototype.getActiveUserLotMaxBid = function (userId, lotId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getActiveUserLotMaxBid is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.getAuctioneerByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().execute('SELECT * FROM auctioneers WHERE name = ? LIMIT 1', [name])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(rows[0]))];
                }
            });
        });
    };
    MySqlAdapter.prototype.getAuctioneerBySlug = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().execute('SELECT * FROM auctioneers WHERE slug = ? OR public_id = ? LIMIT 1', [slug, slug])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(rows[0]))];
                }
            });
        });
    };
    MySqlAdapter.prototype.getSellerByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().execute('SELECT * FROM sellers WHERE name = ? LIMIT 1', [name])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToSellerProfileInfo(mapMySqlRowToCamelCase(rows[0]))];
                }
            });
        });
    };
    MySqlAdapter.prototype.getSellerBySlug = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPool().execute('SELECT * FROM sellers WHERE slug = ? OR public_id = ? LIMIT 1', [slug, slug])];
                    case 1:
                        rows = (_a.sent())[0];
                        if (rows.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, mapToSellerProfileInfo(mapMySqlRowToCamelCase(rows[0]))];
                }
            });
        });
    };
    MySqlAdapter.prototype.getAuctionsByAuctioneerSlug = function (auctioneerSlugOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getAuctionsByAuctioneerSlug is not yet implemented for MySQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    MySqlAdapter.prototype.getDirectSaleOffers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getDirectSaleOffers is not yet implemented for MySQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    MySqlAdapter.prototype.getAuctionsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getAuctionsByIds is not yet implemented for MySQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    MySqlAdapter.prototype.getLotsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getLotsByIds is not yet implemented for MySQL.");
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    MySqlAdapter.prototype.initializeSchema = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] initializeSchema is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createLotCategory = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createLotCategory is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getLotCategories = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getLotCategories is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getLotCategory = function (idOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getLotCategory is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.getLotCategoryByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getLotCategoryByName is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateLotCategory = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateLotCategory is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteLotCategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteLotCategory is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createSubcategory = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createSubcategory is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getSubcategories = function (parentCategoryId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getSubcategories is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getSubcategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getSubcategory is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.getSubcategoryBySlug = function (slug, parentCategoryId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getSubcategoryBySlug is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateSubcategory = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateSubcategory is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteSubcategory = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteSubcategory is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createState = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createState is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getStates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getStates is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getState = function (idOrSlugOrUf) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getState is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateState = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateState is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteState = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteState is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createCity = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createCity is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getCities = function (stateIdOrSlugFilter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getCities is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getCity = function (idOrCompositeSlug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getCity is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateCity = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateCity is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteCity = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteCity is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createAuctioneer = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createAuctioneer is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getAuctioneers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getAuctioneers is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getAuctioneer = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getAuctioneer is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateAuctioneer = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateAuctioneer is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteAuctioneer = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteAuctioneer is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createSeller = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createSeller is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getSellers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getSellers is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getSeller = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getSeller is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateSeller = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateSeller is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteSeller = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteSeller is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createAuction = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createAuction is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getAuctions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getAuctions is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.updateAuction = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateAuction is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteAuction = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteAuction is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getAuctionsBySellerSlug = function (sellerSlugOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getAuctionsBySellerSlug is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.createLot = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createLot is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getLots = function (auctionIdParam) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getLots is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getLot = function (idOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getLot is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateLot = function (idOrPublicId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateLot is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteLot = function (idOrPublicId, auctionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteLot is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getBidsForLot = function (lotIdOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getBidsForLot is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.placeBidOnLot = function (lotIdOrPublicId, auctionIdOrPublicId, userId, userDisplayName, bidAmount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] placeBidOnLot is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getReviewsForLot = function (lotIdOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getReviewsForLot is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.createReview = function (review) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createReview is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getQuestionsForLot = function (lotIdOrPublicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getQuestionsForLot is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.createQuestion = function (question) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createQuestion is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getUserProfileData = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getUserProfileData is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateUserProfile = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateUserProfile is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.ensureUserRole = function (userId, email, fullName, targetRoleName, additionalProfileData, roleIdToAssign) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] ensureUserRole is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getUsersWithRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getUsersWithRoles is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.updateUserRole = function (userId, roleId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateUserRole is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteUserProfile = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteUserProfile is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createRole = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createRole is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getRoles is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getRole = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getRole is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateRole = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateRole is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteRole = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteRole is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.ensureDefaultRolesExist = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] ensureDefaultRolesExist is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.createMediaItem = function (data, filePublicUrl, uploadedBy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] createMediaItem is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getMediaItems = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getMediaItems is not yet implemented for MySQL.");
                return [2 /*return*/, []];
            });
        });
    };
    MySqlAdapter.prototype.getMediaItem = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getMediaItem is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.updateMediaItemMetadata = function (id, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updateMediaItemMetadata is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.deleteMediaItemFromDb = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] deleteMediaItemFromDb is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.linkMediaItemsToLot = function (lotId, mediaItemIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] linkMediaItemsToLot is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.unlinkMediaItemFromLot = function (lotId, mediaItemId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] unlinkMediaItemFromLot is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getPlatformSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getPlatformSettings is not yet implemented for MySQL.");
                return [2 /*return*/, sample_data_1.samplePlatformSettings];
            });
        });
    };
    MySqlAdapter.prototype.updatePlatformSettings = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] updatePlatformSettings is not yet implemented for MySQL.");
                return [2 /*return*/, { success: false, message: "Funcionalidade não implementada." }];
            });
        });
    };
    MySqlAdapter.prototype.getRoleByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getRoleByName is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    MySqlAdapter.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[MySqlAdapter] getUserByEmail is not yet implemented for MySQL.");
                return [2 /*return*/, null];
            });
        });
    };
    return MySqlAdapter;
}());
exports.MySqlAdapter = MySqlAdapter;
