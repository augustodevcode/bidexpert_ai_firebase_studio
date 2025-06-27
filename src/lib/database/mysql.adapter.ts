
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
  UserProfileData, EditableUserProfileData, UserHabilitationStatus, UserProfileWithPermissions,
  Role, RoleFormData,
  MediaItem,
  PlatformSettings, PlatformSettingsFormData, Theme,
  Subcategory, SubcategoryFormData,
  MapSettings,
  SearchPaginationType,
  MentalTriggerSettings,
  BadgeVisibilitySettings,
  SectionBadgeConfig,
  HomepageSectionConfig,
  AuctionStage,
  DirectSaleOffer,
  UserLotMaxBid,
  UserWin
} from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import { samplePlatformSettings } from '@/lib/sample-data';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

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
      const parsed = JSON.parse(value);
      return parsed;
    } catch (e) {
      console.warn(`[MySqlAdapter] Failed to parse JSON column: ${value}`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}


function mapToLotCategory(row: any): LotCategory {
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

function mapToUserProfileData(row: any, role?: Role | null): UserProfileWithPermissions {
    const profile: UserProfileWithPermissions = {
        uid: row.uid,
        email: row.email,
        fullName: row.fullName,
        password: row.passwordText,
        roleId: row.roleId ? String(row.roleId) : undefined,
        roleName: role?.name || row.roleNameFromJoin || row.roleName || undefined,
        permissions: role?.permissions && role.permissions.length > 0 ? role.permissions : parseJsonColumn<string[]>(row.permissions || row.rolePermissionsFromJoin, []),
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

function mapToAuction(row: any): Auction {
    return {
        id: String(row.id),
        publicId: row.publicId,
        title: row.title,
        description: row.description,
        status: row.status as AuctionStatus,
        auctionType: row.auctionType,
        category: row.categoryName || row.category,
        categoryId: row.categoryId ? String(row.categoryId) : undefined,
        auctioneer: row.auctioneerName || row.auctioneer,
        auctioneerId: row.auctioneerId ? String(row.auctioneerId) : undefined,
        seller: row.sellerName || row.seller,
        sellerId: row.sellerId ? String(row.sellerId) : undefined,
        auctionDate: new Date(row.auctionDate),
        endDate: row.endDate ? new Date(row.endDate) : null,
        auctionStages: parseJsonColumn<AuctionStage[]>(row.auctionStages, []),
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

function mapToUserLotMaxBid(row: any): UserLotMaxBid {
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
    storagePath: row.storagePath
  };
}

function mapToPlatformSettings(row: any): PlatformSettings {
    return {
        id: String(row.id),
        siteTitle: row.siteTitle,
        siteTagline: row.siteTagline,
        galleryImageBasePath: row.galleryImageBasePath,
        storageProvider: row.storageProvider as PlatformSettings['storageProvider'],
        firebaseStorageBucket: row.firebaseStorageBucket,
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
  
  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>(
      `SELECT a.*, cat.name as category_name, auct.name as auctioneer_name, s.name as seller_name, auct.logo_url as auctioneer_logo_url 
       FROM auctions a
       LEFT JOIN lot_categories cat ON a.category_id = cat.id
       LEFT JOIN auctioneers auct ON a.auctioneer_id = auct.id
       LEFT JOIN sellers s ON a.seller_id = s.id
       WHERE a.id = ? OR a.public_id = ? 
       LIMIT 1`,
      [idOrPublicId, idOrPublicId]
    );

    if (rows.length === 0) return null;
    const auctionData = mapMySqlRowToCamelCase(rows[0]);
    
    // Now fetch the lots associated with this auction
    const [lotRows] = await getPool().execute<RowDataPacket[]>(
      `SELECT l.*, c.name as category_name, s.name as subcategory_name, st.uf as state_uf, city.name as city_name, a.title as auction_name
       FROM lots l
       LEFT JOIN auctions a ON l.auction_id = a.id
       LEFT JOIN lot_categories c ON l.category_id = c.id
       LEFT JOIN subcategories s ON l.subcategory_id = s.id
       LEFT JOIN states st ON l.state_id = st.id
       LEFT JOIN cities city ON l.city_id = city.id
       WHERE l.auction_id = ?`,
      [auctionData.id]
    );

    const lots = mapMySqlRowsToCamelCase(lotRows).map(mapToLot);
    
    const auction = mapToAuction(auctionData);
    auction.lots = lots;
    auction.totalLots = lots.length;

    return auction;
  }
  
  async getWinsForUser(userId: string): Promise<UserWin[]> {
    console.warn("[MySqlAdapter] getWinsForUser is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async answerQuestion(lotId: string, questionId: string, answerText: string, answeredByUserId: string, answeredByUserDisplayName: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] answerQuestion is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada para MySQL." };
  }

  async createUserLotMaxBid(userId: string, lotId: string, maxAmount: number): Promise<{ success: boolean; message: string; maxBidId?: string; }> {
    console.warn("[MySqlAdapter] createUserLotMaxBid is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada para MySQL." };
  }

  async getActiveUserLotMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    console.warn("[MySqlAdapter] getActiveUserLotMaxBid is not yet implemented for MySQL.");
    return null;
  }
  
  async getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM auctioneers WHERE name = ? LIMIT 1', [name]);
    if (rows.length === 0) return null;
    return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }
  
  async getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM auctioneers WHERE slug = ? OR public_id = ? LIMIT 1', [slug, slug]);
    if (rows.length === 0) return null;
    return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }

  async getSellerByName(name: string): Promise<SellerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM sellers WHERE name = ? LIMIT 1', [name]);
    if (rows.length === 0) return null;
    return mapToSellerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }

  async getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM sellers WHERE slug = ? OR public_id = ? LIMIT 1', [slug, slug]);
    if (rows.length === 0) return null;
    return mapToSellerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }

  async getAuctionsByAuctioneerSlug(auctioneerSlugOrPublicId: string): Promise<Auction[]> {
    console.warn("[MySqlAdapter] getAuctionsByAuctioneerSlug is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }

  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    console.warn("[MySqlAdapter] getDirectSaleOffers is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }

  async getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    console.warn("[MySqlAdapter] getAuctionsByIds is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async getLotsByIds(ids: string[]): Promise<Lot[]> {
    console.warn("[MySqlAdapter] getLotsByIds is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async initializeSchema(): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] initializeSchema is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createLotCategory(data: { name: string; }): Promise<{ success: boolean; message: string; categoryId?: string; }> {
    console.warn("[MySqlAdapter] createLotCategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getLotCategories(): Promise<LotCategory[]> {
    console.warn("[MySqlAdapter] getLotCategories is not yet implemented for MySQL.");
    return [];
  }
  async getLotCategory(idOrSlug: string): Promise<LotCategory | null> {
    console.warn("[MySqlAdapter] getLotCategory is not yet implemented for MySQL.");
    return null;
  }
  async getLotCategoryByName(name: string): Promise<LotCategory | null> {
    console.warn("[MySqlAdapter] getLotCategoryByName is not yet implemented for MySQL.");
    return null;
  }
  async updateLotCategory(id: string, data: Partial<{ name: string; description?: string; hasSubcategories?: boolean; }>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateLotCategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteLotCategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteLotCategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    console.warn("[MySqlAdapter] createSubcategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
    console.warn("[MySqlAdapter] getSubcategories is not yet implemented for MySQL.");
    return [];
  }
  async getSubcategory(id: string): Promise<Subcategory | null> {
    console.warn("[MySqlAdapter] getSubcategory is not yet implemented for MySQL.");
    return null;
  }
  async getSubcategoryBySlug(slug: string, parentCategoryId: string): Promise<Subcategory | null> {
    console.warn("[MySqlAdapter] getSubcategoryBySlug is not yet implemented for MySQL.");
    return null;
  }
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateSubcategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteSubcategory(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteSubcategory is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createState(data: StateFormData): Promise<{ success: boolean; message: string; stateId?: string; }> {
    console.warn("[MySqlAdapter] createState is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getStates(): Promise<StateInfo[]> {
    console.warn("[MySqlAdapter] getStates is not yet implemented for MySQL.");
    return [];
  }
  async getState(idOrSlugOrUf: string): Promise<StateInfo | null> {
    console.warn("[MySqlAdapter] getState is not yet implemented for MySQL.");
    return null;
  }
  async updateState(id: string, data: Partial<StateFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateState is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteState(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteState is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createCity(data: CityFormData): Promise<{ success: boolean; message: string; cityId?: string; }> {
    console.warn("[MySqlAdapter] createCity is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getCities(stateIdOrSlugFilter?: string): Promise<CityInfo[]> {
    console.warn("[MySqlAdapter] getCities is not yet implemented for MySQL.");
    return [];
  }
  async getCity(idOrCompositeSlug: string): Promise<CityInfo | null> {
    console.warn("[MySqlAdapter] getCity is not yet implemented for MySQL.");
    return null;
  }
  async updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateCity is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteCity(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteCity is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
    console.warn("[MySqlAdapter] createAuctioneer is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    console.warn("[MySqlAdapter] getAuctioneers is not yet implemented for MySQL.");
    return [];
  }
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    console.warn("[MySqlAdapter] getAuctioneer is not yet implemented for MySQL.");
    return null;
  }
  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateAuctioneer is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteAuctioneer is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
    console.warn("[MySqlAdapter] createSeller is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getSellers(): Promise<SellerProfileInfo[]> {
    console.warn("[MySqlAdapter] getSellers is not yet implemented for MySQL.");
    return [];
  }
  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
    console.warn("[MySqlAdapter] getSeller is not yet implemented for MySQL.");
    return null;
  }
  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateSeller is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteSeller is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createAuction(data: AuctionDbData): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> {
    console.warn("[MySqlAdapter] createAuction is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctions(): Promise<Auction[]> {
    console.warn("[MySqlAdapter] getAuctions is not yet implemented for MySQL.");
    return [];
  }
  async updateAuction(idOrPublicId: string, data: Partial<AuctionDbData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateAuction is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteAuction(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteAuction is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    console.warn("[MySqlAdapter] getAuctionsBySellerSlug is not yet implemented for MySQL.");
    return [];
  }
  async createLot(data: LotDbData): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
    console.warn("[MySqlAdapter] createLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getLots(auctionIdParam?: string): Promise<Lot[]> {
    console.warn("[MySqlAdapter] getLots is not yet implemented for MySQL.");
    return [];
  }
  async getLot(idOrPublicId: string): Promise<Lot | null> {
    console.warn("[MySqlAdapter] getLot is not yet implemented for MySQL.");
    return null;
  }
  async updateLot(idOrPublicId: string, data: Partial<LotDbData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteLot(idOrPublicId: string, auctionId?: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    console.warn("[MySqlAdapter] getBidsForLot is not yet implemented for MySQL.");
    return [];
  }
  async placeBidOnLot(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, "price" | "bidsCount" | "status" | "endDate">>; newBid?: BidInfo; }> {
    console.warn("[MySqlAdapter] placeBidOnLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
    console.warn("[MySqlAdapter] getReviewsForLot is not yet implemented for MySQL.");
    return [];
  }
  async createReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; message: string; reviewId?: string; }> {
    console.warn("[MySqlAdapter] createReview is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    console.warn("[MySqlAdapter] getQuestionsForLot is not yet implemented for MySQL.");
    return [];
  }
  async createQuestion(question: Omit<LotQuestion, "id" | "createdAt" | "answeredAt" | "answeredByUserId" | "answeredByUserDisplayName" | "isPublic">): Promise<{ success: boolean; message: string; questionId?: string; }> {
    console.warn("[MySqlAdapter] createQuestion is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    console.warn("[MySqlAdapter] getUserProfileData is not yet implemented for MySQL.");
    return null;
  }
  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateUserProfile is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async ensureUserRole(userId: string, email: string, fullName: string | null, targetRoleName: string, additionalProfileData?: Partial<Pick<UserProfileData, "cpf" | "cellPhone" | "dateOfBirth" | "password" | "accountType" | "razaoSocial" | "cnpj" | "inscricaoEstadual" | "websiteComitente" | "zipCode" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "optInMarketing">>, roleIdToAssign?: string): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions; }> {
    console.warn("[MySqlAdapter] ensureUserRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getUsersWithRoles(): Promise<UserProfileData[]> {
    console.warn("[MySqlAdapter] getUsersWithRoles is not yet implemented for MySQL.");
    return [];
  }
  async updateUserRole(userId: string, roleId: string | null): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateUserRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteUserProfile(userId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteUserProfile is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string; }> {
    console.warn("[MySqlAdapter] createRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getRoles(): Promise<Role[]> {
    console.warn("[MySqlAdapter] getRoles is not yet implemented for MySQL.");
    return [];
  }
  async getRole(id: string): Promise<Role | null> {
    console.warn("[MySqlAdapter] getRole is not yet implemented for MySQL.");
    return null;
  }
  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteRole is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number; }> {
    console.warn("[MySqlAdapter] ensureDefaultRolesExist is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createMediaItem(data: Omit<MediaItem, "id" | "uploadedAt" | "urlOriginal" | "urlThumbnail" | "urlMedium" | "urlLarge" | "storagePath">, filePublicUrl: string, uploadedBy?: string): Promise<{ success: boolean; message: string; item?: MediaItem; }> {
    console.warn("[MySqlAdapter] createMediaItem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getMediaItems(): Promise<MediaItem[]> {
    console.warn("[MySqlAdapter] getMediaItems is not yet implemented for MySQL.");
    return [];
  }
  async getMediaItem(id: string): Promise<MediaItem | null> {
    console.warn("[MySqlAdapter] getMediaItem is not yet implemented for MySQL.");
    return null;
  }
  async updateMediaItemMetadata(id: string, metadata: Partial<Pick<MediaItem, "title" | "altText" | "caption" | "description">>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateMediaItemMetadata is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteMediaItemFromDb(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteMediaItemFromDb is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] linkMediaItemsToLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] unlinkMediaItemFromLot is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getPlatformSettings(): Promise<PlatformSettings> {
    console.warn("[MySqlAdapter] getPlatformSettings is not yet implemented for MySQL.");
    return samplePlatformSettings;
  }
  async updatePlatformSettings(data: PlatformSettingsFormData): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updatePlatformSettings is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  
  async getRoleByName(name: string): Promise<Role | null> {
    console.warn("[MySqlAdapter] getRoleByName is not yet implemented for MySQL.");
    return null;
  }
  
  async getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    console.warn("[MySqlAdapter] getUserByEmail is not yet implemented for MySQL.");
    return null;
  }
}
