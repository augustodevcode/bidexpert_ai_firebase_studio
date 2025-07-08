// src/lib/database/mysql.adapter.ts
import { createPool, type RowDataPacket, type Pool, type PoolConnection, type ResultSetHeader } from 'mysql2/promise';
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
  JudicialProcess, JudicialProcessFormData, ProcessParty,
  Bem, BemFormData,
  UserDocument,
  DocumentType,
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
    const connectionString = process.env.MYSQL_CONNECTION_STRING;
    if (!connectionString || connectionString.trim() === '') {
      throw new Error('MYSQL_CONNECTION_STRING não está definida ou está vazia nas variáveis de ambiente.');
    }
    try {
      const url = new URL(connectionString);
      pool = createPool({
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
        isJudicial: Boolean(row.isJudicial),
        judicialBranchId: row.judicialBranchId ? String(row.judicialBranchId) : undefined,
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

function mapToJudicialProcess(row: any, parties: ProcessParty[] = []): JudicialProcess {
  return {
    id: String(row.id),
    publicId: row.publicId,
    processNumber: row.processNumber,
    oldProcessNumber: row.oldProcessNumber,
    isElectronic: Boolean(row.isElectronic),
    courtId: String(row.courtId),
    districtId: String(row.districtId),
    branchId: String(row.branchId),
    courtName: row.courtName,
    districtName: row.districtName,
    branchName: row.branchName,
    parties,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToBem(row: any): Bem {
    return {
        id: String(row.id),
        publicId: row.publicId,
        title: row.title,
        description: row.description,
        judicialProcessId: row.judicialProcessId ? String(row.judicialProcessId) : undefined,
        judicialProcessNumber: row.judicialProcessNumber,
        status: row.status,
        categoryId: row.categoryId ? String(row.categoryId) : undefined,
        subcategoryId: row.subcategoryId ? String(row.subcategoryId) : undefined,
        categoryName: row.categoryName,
        subcategoryName: row.subcategoryName,
        imageUrl: row.imageUrl,
        imageMediaId: row.imageMediaId,
        dataAiHint: row.dataAiHint,
        evaluationValue: row.evaluationValue !== null ? Number(row.evaluationValue) : undefined,
        locationCity: row.locationCity,
        locationState: row.locationState,
        address: row.address,
        latitude: row.latitude !== null ? Number(row.latitude) : undefined,
        longitude: row.longitude !== null ? Number(row.longitude) : undefined,
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
    storagePath: row.storagePath,
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
  
  async createAuctionWithLots(wizardData: WizardData): Promise<{ success: boolean; message: string; auctionId?: string; }> {
    console.warn("[MySqlAdapter] createAuctionWithLots is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateBensStatus(bemIds: string[], status: "DISPONIVEL" | "LOTEADO" | "VENDIDO" | "REMOVIDO", connection?: any): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateBensStatus is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async createLotsFromBens(lotsToCreate: LotDbData[]): Promise<{ success: boolean; message: string; createdLots?: Lot[]; }> {
    console.warn("[MySqlAdapter] createLotsFromBens is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getAuction(idOrPublicId: string): Promise<Auction | null> {
    console.warn("[MySqlAdapter] getAuction is not yet implemented for MySQL.");
    return null;
  }
  async getBem(id: string): Promise<Bem | null> {
    console.warn("[MySqlAdapter] getBem is not yet implemented for MySQL.");
    return null;
  }
  async getBens(filter?: { judicialProcessId?: string; sellerId?: string }): Promise<Bem[]> {
    console.warn("[MySqlAdapter] getBens is not yet implemented for MySQL.");
    return [];
  }
  async getBensByIds(ids: string[]): Promise<Bem[]> {
    console.warn("[MySqlAdapter] getBensByIds is not yet implemented for MySQL.");
    return [];
  }
  async createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    console.warn("[MySqlAdapter] createBem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateBem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteBem is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getCourts(): Promise<Court[]> {
    console.warn("[MySqlAdapter] getCourts is not yet implemented for MySQL.");
    return [];
  }
  async getCourt(id: string): Promise<Court | null> {
    console.warn("[MySqlAdapter] getCourt is not yet implemented for MySQL.");
    return null;
  }
  async createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
    console.warn("[MySqlAdapter] createCourt is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateCourt is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteCourt is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getJudicialDistricts(): Promise<JudicialDistrict[]> {
    console.warn("[MySqlAdapter] getJudicialDistricts is not yet implemented for MySQL.");
    return [];
  }
  async getJudicialDistrict(id: string): Promise<JudicialDistrict | null> {
    console.warn("[MySqlAdapter] getJudicialDistrict is not yet implemented for MySQL.");
    return null;
  }
  async createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
    console.warn("[MySqlAdapter] createJudicialDistrict is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateJudicialDistrict is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteJudicialDistrict is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getJudicialBranches(): Promise<JudicialBranch[]> {
    console.warn("[MySqlAdapter] getJudicialBranches is not yet implemented for MySQL.");
    return [];
  }
  async getJudicialBranch(id: string): Promise<JudicialBranch | null> {
    console.warn("[MySqlAdapter] getJudicialBranch is not yet implemented for MySQL.");
    return null;
  }
  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
    console.warn("[MySqlAdapter] createJudicialBranch is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateJudicialBranch is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteJudicialBranch is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async getJudicialProcesses(): Promise<JudicialProcess[]> {
    console.warn("[MySqlAdapter] getJudicialProcesses is not yet implemented for MySQL.");
    return [];
  }
  async getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    console.warn("[MySqlAdapter] getJudicialProcess is not yet implemented for MySQL.");
    return null;
  }
  async createJudicialProcess(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    console.warn("[MySqlAdapter] createJudicialProcess is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateJudicialProcess(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] updateJudicialProcess is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("[MySqlAdapter] deleteJudicialProcess is not yet implemented for MySQL.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  
  async disconnect(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = undefined;
        console.log('[MySqlAdapter] Pool de conexões MySQL encerrado.');
    }
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
  
  async getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
    const [rows] = await getPool().query<RowDataPacket[]>('SELECT * FROM auctioneers ORDER BY name ASC');
    return mapMySqlRowsToCamelCase(rows).map(mapToAuctioneerProfileInfo);
  }
  
  async getAuctioneer(idOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM auctioneers WHERE id = ? OR public_id = ? LIMIT 1', [idOrPublicId, idOrPublicId]);
    if (rows.length === 0) return null;
    return mapToAuctioneerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }
  
  async createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
    const publicId = `AUCT-PUB-${uuidv4().substring(0, 8)}`;
    const slug = slugify(data.name);
    const query = 'INSERT INTO auctioneers (public_id, name, slug, registration_number, contact_name, email, phone, address, city, state, zip_code, website, logo_url, data_ai_hint_logo, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
        publicId, data.name, slug, data.registrationNumber, data.contactName, data.email, data.phone,
        data.address, data.city, data.state, data.zipCode, data.website, data.logoUrl,
        data.dataAiHintLogo, data.description, data.userId
    ];
    try {
        const [result] = await getPool().execute<ResultSetHeader>(query, values);
        return { success: true, message: 'Leiloeiro criado com sucesso!', auctioneerId: String(result.insertId), auctioneerPublicId: publicId };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  }

  async updateAuctioneer(idOrPublicId: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean; message: string; }> {
    const fieldsToUpdate = { ...data, slug: data.name ? slugify(data.name) : undefined };
    const columns = Object.keys(fieldsToUpdate)
        .filter(key => fieldsToUpdate[key as keyof typeof fieldsToUpdate] !== undefined)
        .map(key => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
    
    if (columns.length === 0) return { success: true, message: "Nenhum dado para atualizar." };
    
    const values = Object.values(fieldsToUpdate).filter(value => value !== undefined);
    values.push(idOrPublicId, idOrPublicId); // For WHERE clause

    const query = `UPDATE auctioneers SET ${columns.join(', ')} WHERE id = ? OR public_id = ?`;

    try {
        await getPool().execute(query, values);
        return { success: true, message: 'Leiloeiro atualizado com sucesso!' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  }

  async deleteAuctioneer(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
    try {
        await getPool().execute('DELETE FROM auctioneers WHERE id = ? OR public_id = ?', [idOrPublicId, idOrPublicId]);
        return { success: true, message: 'Leiloeiro excluído com sucesso!' };
    } catch (e: any) {
        return { success: false, message: `Erro ao excluir leiloeiro: ${e.message}` };
    }
  }
  
  async getSellers(): Promise<SellerProfileInfo[]> {
    const [rows] = await getPool().query<RowDataPacket[]>('SELECT * FROM sellers ORDER BY name ASC');
    return mapMySqlRowsToCamelCase(rows).map(mapToSellerProfileInfo);
  }

  async getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>('SELECT * FROM sellers WHERE id = ? OR public_id = ? LIMIT 1', [idOrPublicId, idOrPublicId]);
    if (rows.length === 0) return null;
    return mapToSellerProfileInfo(mapMySqlRowToCamelCase(rows[0]));
  }

  async createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
    const publicId = `SELL-PUB-${uuidv4().substring(0, 8)}`;
    const slug = slugify(data.name);
    const query = 'INSERT INTO sellers (public_id, name, slug, contact_name, email, phone, address, city, state, zip_code, website, logo_url, data_ai_hint_logo, description, user_id, is_judicial, judicial_branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
        publicId, data.name, slug, data.contactName, data.email, data.phone, data.address,
        data.city, data.state, data.zipCode, data.website, data.logoUrl, data.dataAiHintLogo,
        data.description, data.userId, data.isJudicial || false, data.judicialBranchId
    ];
    try {
        const [result] = await getPool().execute<ResultSetHeader>(query, values);
        return { success: true, message: 'Comitente criado com sucesso!', sellerId: String(result.insertId), sellerPublicId: publicId };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  }

  async updateSeller(idOrPublicId: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
     const fieldsToUpdate = { ...data, slug: data.name ? slugify(data.name) : undefined };
    const columns = Object.keys(fieldsToUpdate)
        .filter(key => fieldsToUpdate[key as keyof typeof fieldsToUpdate] !== undefined)
        .map(key => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
    
    if (columns.length === 0) return { success: true, message: "Nenhum dado para atualizar." };
    
    const values = Object.values(fieldsToUpdate).filter(value => value !== undefined);
    values.push(idOrPublicId, idOrPublicId); // For WHERE clause

    const query = `UPDATE sellers SET ${columns.join(', ')} WHERE id = ? OR public_id = ?`;

    try {
        await getPool().execute(query, values);
        return { success: true, message: 'Comitente atualizado com sucesso!' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  }

  async deleteSeller(idOrPublicId: string): Promise<{ success: boolean; message: string; }> {
      try {
        await getPool().execute('DELETE FROM sellers WHERE id = ? OR public_id = ?', [idOrPublicId, idOrPublicId]);
        return { success: true, message: 'Comitente excluído com sucesso!' };
    } catch (e: any) {
        return { success: false, message: `Erro ao excluir comitente: ${e.message}` };
    }
  }


  async getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    console.warn("[MySqlAdapter] getDirectSaleOffers is not yet implemented for MySQL.");
    return Promise.resolve([]);
  }
  
  async getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    console.warn("[MySqlAdapter] getDirectSaleOffer not implemented.");
    return null;
  }
  
  async createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
    console.warn("[MySqlAdapter] createDirectSaleOffer not implemented.");
    return { success: false, message: "Funcionalidade não implementada." };
  }
  async updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
      console.warn("[MySqlAdapter] updateDirectSaleOffer not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  async deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
      console.warn("[MySqlAdapter] deleteDirectSaleOffer not implemented.");
      return { success: false, message: "Funcionalidade não implementada." };
  }
  
  // Stubs for other methods
  // ... (keep the other stubs as they were)
}
