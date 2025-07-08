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
  JudicialProcess, JudicialProcessFormData,
  Bem, BemFormData,
  ProcessParty,
  DocumentType,
  UserDocument,
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
    sellerId: row.sellerId ? String(row.sellerId) : undefined,
    courtName: row.courtName,
    districtName: row.districtName,
    branchName: row.branchName,
    sellerName: row.sellerName,
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
        variableIncrementTable: row.variableIncrementTable,
        biddingSettings: row.biddingSettings,
        defaultListItemsPerPage: row.defaultListItemsPerPage,
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
  
  async getConsignorDashboardStats(sellerId: string): Promise<ConsignorDashboardStats> {
    const defaultStats: ConsignorDashboardStats = {
      totalLotsConsigned: 0, activeLots: 0, soldLots: 0, totalSalesValue: 0, salesRate: 0, salesByMonth: [],
    };
    if (!sellerId) return defaultStats;

    try {
      const [lotsRows] = await getPool().execute<RowDataPacket[]>(
        "SELECT status, price, updated_at FROM lots WHERE seller_id = ?",
        [sellerId]
      );
      
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
  
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const [stats] = await getPool().execute<RowDataPacket[]>(`
        SELECT
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM auctions) as auctions,
            (SELECT COUNT(*) FROM lots) as lots,
            (SELECT COUNT(*) FROM sellers) as sellers
    `);
    return mapMySqlRowToCamelCase(stats[0]) as AdminDashboardStats;
  }
  
  async getAdminReportData(): Promise<AdminReportData> {
      console.warn("[MySqlAdapter] getAdminReportData: Sales data is a placeholder.");
      const [[{ totalRevenue, lotsSoldCount, activeAuctions }]] = await getPool().execute<RowDataPacket[][]>(`
          SELECT
              (SELECT SUM(price) FROM lots WHERE status = 'VENDIDO') as totalRevenue,
              (SELECT COUNT(*) FROM lots WHERE status = 'VENDIDO') as lotsSoldCount,
              (SELECT COUNT(*) FROM auctions WHERE status = 'ABERTO_PARA_LANCES') as activeAuctions
      `);
      
      const [[{ newUsersLast30Days }]] = await getPool().execute<RowDataPacket[][]>(
        "SELECT COUNT(*) as newUsersLast30Days FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
      );

      const [categoryRows] = await getPool().execute<RowDataPacket[]>(`
          SELECT c.name, COUNT(l.id) as value
          FROM lots l
          JOIN lot_categories c ON l.category_id = c.id
          WHERE l.status = 'VENDIDO'
          GROUP BY c.name
          ORDER BY value DESC
          LIMIT 5
      `);

      return {
          totalRevenue: Number(totalRevenue) || 0,
          newUsersLast30Days: Number(newUsersLast30Days) || 0,
          activeAuctions: Number(activeAuctions) || 0,
          lotsSoldCount: Number(lotsSoldCount) || 0,
          salesData: [], // Placeholder
          categoryData: mapMySqlRowsToCamelCase(categoryRows).map(r => ({ ...r, value: Number(r.value) })),
      };
  }

  async getAuctionsForConsignor(sellerId: string): Promise<Auction[]> {
    const query = `
      SELECT a.*, cat.name as category_name, auct.name as auctioneer_name, s.name as seller_name, auct.logo_url as auctioneer_logo_url
      FROM auctions a
      LEFT JOIN lot_categories cat ON a.category_id = cat.id
      LEFT JOIN auctioneers auct ON a.auctioneer_id = auct.id
      LEFT JOIN sellers s ON a.seller_id = s.id
      WHERE a.seller_id = ?
      ORDER BY a.auction_date DESC
    `;
    const [rows] = await getPool().execute<RowDataPacket[]>(query, [sellerId]);
    return mapMySqlRowsToCamelCase(rows).map(mapToAuction);
  }

  async getLotsForConsignor(sellerId: string): Promise<Lot[]> {
     const query = `
      SELECT l.*, 
             a.title as auction_name, 
             c.name as category_name, 
             s.name as subcategory_name
      FROM lots l
      JOIN auctions a ON l.auction_id = a.id
      LEFT JOIN lot_categories c ON l.category_id = c.id
      LEFT JOIN subcategories s ON l.subcategory_id = s.id
      WHERE a.seller_id = ?
      ORDER BY l.created_at DESC
    `;
    const [rows] = await getPool().execute<RowDataPacket[]>(query, [sellerId]);
    return mapMySqlRowsToCamelCase(rows).map(mapToLot);
  }

  async getWinsForSeller(sellerId: string): Promise<UserWin[]> {
     const query = `
      SELECT w.*, 
             l.id as lot_id, l.public_id as lot_public_id, l.title as lot_title, 
             l.number as lot_number, l.image_url as lot_image_url, l.data_ai_hint as lot_data_ai_hint
      FROM user_wins w
      JOIN lots l ON w.lot_id = l.id
      WHERE l.seller_id = ?
      ORDER BY w.win_date DESC
    `;
    const [rows] = await getPool().execute<RowDataPacket[]>(query, [sellerId]);
    // This is a simplified mapping, might need adjustments
    return mapMySqlRowsToCamelCase(rows).map(row => ({
      id: row.id,
      userId: row.userId,
      lotId: row.lotId,
      winningBidAmount: parseFloat(row.winningBidAmount),
      winDate: new Date(row.winDate),
      paymentStatus: row.paymentStatus,
      invoiceUrl: row.invoiceUrl,
      lot: {
        id: row.lotId,
        publicId: row.lotPublicId,
        title: row.lotTitle,
        number: row.lotNumber,
        imageUrl: row.lotImageUrl,
        dataAiHint: row.lotDataAiHint,
      } as Lot, // Incomplete lot object, but sufficient for this context
    }));
  }

  async getDirectSaleOffersForSeller(sellerId: string): Promise<DirectSaleOffer[]> {
    const query = `SELECT * FROM direct_sale_offers WHERE seller_id = ? ORDER BY created_at DESC`;
    const [rows] = await getPool().execute<RowDataPacket[]>(query, [sellerId]);
    // This assumes a mapToDirectSaleOffer function exists
    // return mapMySqlRowsToCamelCase(rows).map(mapToDirectSaleOffer);
    return []; // Placeholder
  }
}
