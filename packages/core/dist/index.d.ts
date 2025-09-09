import { z } from 'zod';

type AuctionStatus = 'RASCUNHO' | 'EM_PREPARACAO' | 'EM_BREVE' | 'ABERTO' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'CANCELADO' | 'SUSPENSO';
type LotStatus = 'RASCUNHO' | 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO' | 'RELISTADO' | 'CANCELADO';
type UserHabilitationStatus = 'PENDING_DOCUMENTS' | 'PENDING_ANALYSIS' | 'HABILITADO' | 'REJECTED_DOCUMENTS' | 'BLOCKED';
type UserDocumentStatus = 'NOT_SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING_ANALYSIS';
type PaymentStatus = 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'FALHOU' | 'REEMBOLSADO' | 'CANCELADO' | 'ATRASADO';
type DirectSaleOfferStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SOLD' | 'EXPIRED' | 'RASCUNHO';
type DirectSaleOfferType = 'BUY_NOW' | 'ACCEPTS_PROPOSALS';
type DocumentTemplateType = 'WINNING_BID_TERM' | 'EVALUATION_REPORT' | 'AUCTION_CERTIFICATE';
type ProcessPartyType = 'AUTOR' | 'REU' | 'ADVOGADO_AUTOR' | 'ADVOGADO_REU' | 'JUIZ' | 'ESCRIVAO' | 'PERITO' | 'ADMINISTRADOR_JUDICIAL' | 'TERCEIRO_INTERESSADO' | 'OUTRO';
type AccountType = 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
type AuctionType = 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';
type AuctionMethod = 'STANDARD' | 'DUTCH' | 'SILENT';
type AuctionParticipation = 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO';
type BadgeVisibilitySettings = {
    showStatusBadge?: boolean;
    showDiscountBadge?: boolean;
    showUrgencyTimer?: boolean;
    showPopularityBadge?: boolean;
    showHotBidBadge?: boolean;
    showExclusiveBadge?: boolean;
};
type MentalTriggerSettings = {
    showDiscountBadge: boolean;
    showUrgencyTimer: boolean;
    urgencyTimerThresholdDays: number;
    urgencyTimerThresholdHours: number;
    showPopularityBadge: boolean;
    popularityViewThreshold: number;
    showHotBidBadge: boolean;
    hotBidThreshold: number;
    showExclusiveBadge: boolean;
};
type StorageProviderType = 'local' | 'firebase';
type SearchPaginationType = 'loadMore' | 'numberedPages';
type MapProvider = 'google' | 'openstreetmap' | 'staticImage';
interface MapSettings {
    defaultProvider: MapProvider;
    googleMapsApiKey?: string | null;
    staticImageMapZoom: number;
    staticImageMapMarkerColor: string;
}
interface VariableIncrementRule {
    from: number;
    to: number | null;
    increment: number;
}
interface BiddingSettings {
    instantBiddingEnabled: boolean;
    getBidInfoInstantly: boolean;
    biddingInfoCheckIntervalSeconds: number;
}
interface PaymentGatewaySettings {
    defaultGateway: 'Pagarme' | 'Stripe' | 'Manual';
    platformCommissionPercentage: number;
    gatewayApiKey?: string | null;
    gatewayEncryptionKey?: string | null;
}
interface PlatformSettings {
    id: string;
    siteTitle: string;
    siteTagline?: string;
    logoUrl?: string;
    faviconUrl?: string;
    galleryImageBasePath: string;
    storageProvider: StorageProviderType;
    firebaseStorageBucket?: string | null;
    activeThemeName?: string | null;
    themes: {
        name: string;
        colors: Record<string, string>;
    }[];
    platformPublicIdMasks?: {
        auctions?: string;
        lots?: string;
        auctioneers?: string;
        sellers?: string;
    } | null;
    homepageSections: {
        id: string;
        type: string;
        title: string;
        visible: boolean;
        order: number;
        itemCount?: number;
    }[];
    mentalTriggerSettings?: MentalTriggerSettings;
    sectionBadgeVisibility?: {
        featuredLots?: BadgeVisibilitySettings;
        searchGrid?: BadgeVisibilitySettings;
        searchList?: BadgeVisibilitySettings;
        lotDetail?: BadgeVisibilitySettings;
    };
    mapSettings?: MapSettings;
    searchPaginationType: SearchPaginationType;
    searchItemsPerPage: number;
    searchLoadMoreCount: number;
    showCountdownOnLotDetail: boolean;
    showCountdownOnCards: boolean;
    showRelatedLotsOnLotDetail: boolean;
    relatedLotsCount: number;
    defaultUrgencyTimerHours?: number;
    variableIncrementTable?: VariableIncrementRule[];
    biddingSettings?: BiddingSettings;
    paymentGatewaySettings?: PaymentGatewaySettings;
    defaultListItemsPerPage?: number;
    updatedAt: string | Date;
}
interface LotStagePrice {
    id: string;
    auctionStageId: string;
    initialBid: number;
    increment: number;
}
interface Lot {
    id: string;
    publicId: string;
    auctionId: string;
    auctionPublicId?: string;
    number: string;
    title: string;
    description?: string;
    price: number;
    bidIncrementStep?: number | null;
    status: LotStatus;
    bidsCount?: number;
    views?: number;
    isFeatured?: boolean;
    isFavorite?: boolean;
    isExclusive?: boolean;
    discountPercentage?: number | null;
    additionalTriggers?: string[];
    imageUrl?: string;
    imageMediaId?: string | null;
    galleryImageUrls?: string[];
    mediaItemIds?: string[];
    bemIds?: string[];
    bens?: Bem[];
    inheritedMediaFromBemId?: string | null;
    type: string;
    categoryId?: string;
    categoryName?: string;
    subcategoryName?: string;
    subcategoryId?: string;
    auctionName?: string;
    sellerName?: string;
    sellerId?: string;
    auctioneerId?: string;
    cityId?: string;
    stateId?: string;
    cityName?: string;
    stateUf?: string;
    latitude?: number | null;
    longitude?: number | null;
    mapAddress?: string | null;
    mapEmbedUrl?: string | null;
    mapStaticImageUrl?: string | null;
    endDate?: string | Date | null;
    auctionDate?: string | Date;
    lotSpecificAuctionDate?: string | Date | null;
    secondAuctionDate?: string | Date | null;
    condition?: string;
    dataAiHint?: string;
    winnerId?: string | null;
    winningBidTermUrl?: string | null;
    allowInstallmentBids?: boolean;
    isRelisted: boolean;
    relistCount: number;
    originalLotId?: string | null;
    evaluationValue?: number | null;
    initialPrice?: number | null;
    secondInitialPrice?: number | null;
    year?: number;
    make?: string;
    model?: string;
    version?: string;
    odometer?: number;
    hasKey?: boolean;
    vin?: string;
    fuelType?: string;
    transmissionType?: string;
    judicialProcessNumber?: string;
    courtDistrict?: string;
    courtName?: string;
    publicProcessUrl?: string;
    propertyRegistrationNumber?: string;
    propertyLiens?: string;
    knownDebts?: string;
    additionalDocumentsInfo?: string;
    stageDetails?: LotStagePrice[];
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface Auction {
    id: string;
    publicId: string;
    title: string;
    description: string;
    status: AuctionStatus;
    auctionDate: string | Date;
    endDate?: string | Date | null;
    totalLots?: number;
    categoryId?: string;
    category?: LotCategory;
    auctioneer?: AuctioneerProfileInfo;
    auctioneerId?: string;
    auctioneerName?: string;
    auctioneerLogoUrl?: string;
    seller?: SellerProfileInfo;
    sellerId?: string;
    imageUrl?: string;
    imageMediaId?: string | null;
    dataAiHint?: string;
    isFavorite?: boolean;
    visits?: number;
    lots?: Lot[];
    initialOffer?: number;
    auctionType?: AuctionType;
    auctionMethod?: AuctionMethod;
    participation?: AuctionParticipation;
    address?: string | null;
    cityId?: string | null;
    stateId?: string | null;
    zipCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    onlineUrl?: string | null;
    auctionStages?: AuctionStage[];
    documentsUrl?: string;
    evaluationReportUrl?: string | null;
    auctionCertificateUrl?: string | null;
    sellingBranch?: string;
    automaticBiddingEnabled: boolean;
    silentBiddingEnabled: boolean;
    allowMultipleBidsPerUser: boolean;
    allowInstallmentBids: boolean;
    softCloseEnabled: boolean;
    softCloseMinutes: number;
    estimatedRevenue?: number;
    achievedRevenue?: number;
    totalHabilitatedUsers?: number;
    isFeaturedOnMarketplace: boolean;
    marketplaceAnnouncementTitle?: string | null;
    judicialProcessId?: string;
    additionalTriggers?: string[];
    decrementAmount?: number | null;
    decrementIntervalSeconds?: number | null;
    floorPrice?: number | null;
    autoRelistSettings?: {
        enableAutoRelist: boolean;
        recurringAutoRelist: boolean;
        relistIfWinnerNotPaid: boolean;
        relistIfWinnerNotPaidAfterHours?: number | null;
        relistIfNoBids: boolean;
        relistIfNoBidsAfterHours?: number | null;
        relistIfReserveNotMet: boolean;
        relistIfReserveNotMetAfterHours?: number | null;
        relistDurationInHours?: number | null;
    };
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface AuctionStage {
    id: string;
    name: string;
    endDate: string | Date | null;
    startDate: string | Date | null;
    evaluationValue?: number | null;
}
interface RecentlyViewedLotInfo {
    id: string;
    title: string;
    imageUrl?: string;
    auctionId: string;
    dataAiHint?: string;
}
interface UserProfileData {
    id: string;
    uid?: string;
    email: string;
    password?: string;
    fullName: string | null;
    cpf?: string | null;
    cellPhone?: string | null;
    razaoSocial?: string | null;
    cnpj?: string | null;
    dateOfBirth?: string | Date | null;
    zipCode?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    avatarUrl?: string | null;
    dataAiHint?: string | null;
    sellerId?: string | null;
    habilitationStatus: UserHabilitationStatus;
    accountType: AccountType;
    badges?: string[];
    optInMarketing?: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    rgNumber?: string | null;
    rgIssuer?: string | null;
    rgIssueDate?: string | Date | null;
    rgState?: string | null;
    homePhone?: string | null;
    gender?: string | null;
    profession?: string | null;
    nationality?: string | null;
    maritalStatus?: string | null;
    propertyRegime?: string | null;
    spouseName?: string | null;
    spouseCpf?: string | null;
    inscricaoEstadual?: string | null;
    website?: string | null;
    responsibleName?: string | null;
    responsibleCpf?: string | null;
    roles?: {
        role: Role;
    }[];
}
interface UserProfileWithPermissions extends UserProfileData {
    roleName?: string;
    roleNames: string[];
    permissions: string[];
}
interface Role {
    id: string;
    name: string;
    nameNormalized: string;
    description: string;
    permissions: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
    slug?: string;
}
interface UserBid {
    id: string;
    user: UserProfileData;
    amount: number;
    date: string | Date;
    lot: Lot;
    bidStatus: 'GANHANDO' | 'PERDENDO' | 'ARREMATADO' | 'NAO_ARREMATADO' | 'ENCERRADO' | 'CANCELADO';
    userBidAmount: number;
}
interface BidInfo {
    id: string;
    lotId: string;
    auctionId: string;
    bidderId: string;
    bidderDisplay: string;
    amount: number;
    timestamp: string | Date;
}
interface UserWin {
    id: string;
    lotId: string;
    userId: string;
    winningBidAmount: number;
    winDate: string | Date;
    paymentStatus: PaymentStatus;
    paymentDate?: string | Date | null;
    invoiceUrl?: string;
    lot?: Lot;
    installments?: InstallmentPayment[];
}
interface InstallmentPayment {
    id: string;
    userWinId: string;
    userWin?: UserWin;
    installmentNumber: number;
    amount: number;
    dueDate: string | Date;
    status: PaymentStatus;
    paymentDate?: string | Date | null;
    paymentMethod?: string | null;
    transactionId?: string | null;
}
interface LotCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    itemCount?: number;
    hasSubcategories: boolean;
    iconName?: string | null;
    dataAiHintIcon?: string | null;
    logoUrl?: string | null;
    logoMediaId?: string | null;
    coverImageUrl?: string | null;
    coverImageMediaId?: string | null;
    dataAiHintCover?: string | null;
    megaMenuImageUrl?: string | null;
    megaMenuImageMediaId?: string | null;
    dataAiHintMegaMenu?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface Subcategory {
    id: string;
    name: string;
    slug: string;
    parentCategoryId: string;
    parentCategoryName?: string;
    description?: string | null;
    itemCount?: number;
    displayOrder: number;
    iconUrl?: string | null;
    iconMediaId?: string | null;
    dataAiHintIcon?: string | null;
}
interface StateInfo {
    id: string;
    name: string;
    uf: string;
    slug: string;
    cityCount?: number;
}
interface CityInfo {
    id: string;
    name: string;
    slug: string;
    stateId: string;
    stateUf: string;
    ibgeCode?: string;
    lotCount?: number;
}
interface AuctioneerProfileInfo {
    id: string;
    publicId: string;
    slug: string;
    name: string;
    registrationNumber?: string | null;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    logoMediaId?: string | null;
    dataAiHintLogo?: string | null;
    description?: string | null;
    userId?: string | null;
    memberSince?: string | Date;
    rating?: number;
    auctionsConductedCount?: number;
    totalValueSold?: number;
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface SellerProfileInfo {
    id: string;
    publicId: string;
    slug: string;
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    logoMediaId?: string | null;
    dataAiHintLogo?: string | null;
    description?: string | null;
    userId?: string | null;
    memberSince?: string | Date;
    rating?: number;
    activeLotsCount?: number;
    totalSalesValue?: number;
    auctionsFacilitatedCount?: number;
    isJudicial: boolean;
    judicialBranchId?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface DirectSaleOffer {
    id: string;
    publicId: string;
    title: string;
    description: string;
    offerType: DirectSaleOfferType;
    price?: number;
    minimumOfferPrice?: number;
    status: DirectSaleOfferStatus;
    category: string;
    categoryId?: string;
    sellerId: string;
    sellerName: string;
    sellerLogoUrl?: string;
    dataAiHintSellerLogo?: string;
    locationCity?: string;
    locationState?: string;
    imageUrl?: string;
    imageMediaId?: string | null;
    dataAiHint?: string;
    galleryImageUrls?: string[];
    mediaItemIds?: string[];
    itemsIncluded?: string[];
    views?: number;
    expiresAt?: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface DocumentType {
    id: string;
    name: string;
    description: string | null;
    isRequired: boolean | null;
    appliesTo: string | null;
}
interface UserDocument {
    id: string;
    userId: string;
    documentTypeId: string;
    status: string;
    fileUrl: string;
    rejectionReason?: string | null;
    documentType: DocumentType;
}
interface Notification {
    id: string;
    userId: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string | Date;
}
interface UserLotMaxBid {
    id: string;
    userId: string;
    lotId: string;
    maxAmount: number;
    isActive: boolean;
    createdAt: string | Date;
}
interface MediaItem {
    id: string;
    fileName: string;
    storagePath: string;
    title: string;
    altText?: string;
    caption?: string;
    description?: string;
    mimeType: string;
    sizeBytes: number;
    urlOriginal: string;
    urlThumbnail: string;
    urlMedium?: string;
    urlLarge?: string;
    linkedLotIds?: string[];
    judicialProcessId?: string;
    dataAiHint?: string;
    uploadedBy: string;
    uploadedAt: string | Date;
}
interface Court {
    id: string;
    name: string;
    slug: string;
    stateUf: string;
    website: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
interface JudicialDistrict {
    id: string;
    name: string;
    slug: string;
    courtId: string;
    courtName?: string;
    stateId: string;
    stateUf?: string;
    zipCode?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
interface JudicialBranch {
    id: string;
    name: string;
    slug: string;
    districtId: string;
    districtName?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
interface ProcessParty {
    id: string;
    name: string;
    documentNumber?: string;
    partyType: ProcessPartyType;
}
interface JudicialProcess {
    id: string;
    publicId: string;
    processNumber: string;
    isElectronic: boolean;
    courtId: string;
    courtName?: string;
    districtId: string;
    districtName?: string;
    branchId: string;
    branchName?: string;
    sellerId?: string | null;
    sellerName?: string;
    parties: ProcessParty[];
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface Bem {
    id: string;
    publicId: string;
    title: string;
    description?: string | null;
    status: 'CADASTRO' | 'DISPONIVEL' | 'LOTEADO' | 'VENDIDO' | 'REMOVIDO' | 'INATIVADO';
    categoryId: string;
    categoryName?: string;
    subcategoryId?: string | null;
    subcategoryName?: string;
    judicialProcessId?: string | null;
    judicialProcessNumber?: string;
    sellerId?: string | null;
    sellerName?: string;
    evaluationValue?: number | null;
    imageUrl?: string | null;
    imageMediaId?: string | null;
    galleryImageUrls?: string[] | null;
    mediaItemIds?: string[] | null;
    dataAiHint?: string;
    locationCity?: string;
    locationState?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    plate?: string | null;
    make?: string | null;
    model?: string | null;
    version?: string | null;
    year?: number | null;
    modelYear?: number | null;
    mileage?: number | null;
    color?: string | null;
    fuelType?: string | null;
    transmissionType?: string | null;
    bodyType?: string | null;
    vin?: string | null;
    renavam?: string | null;
    enginePower?: string | null;
    numberOfDoors?: number | null;
    vehicleOptions?: string | null;
    detranStatus?: string | null;
    debts?: string | null;
    runningCondition?: string | null;
    bodyCondition?: string | null;
    tiresCondition?: string | null;
    hasKey?: boolean;
    propertyRegistrationNumber?: string | null;
    iptuNumber?: string | null;
    isOccupied?: boolean;
    area?: number | null;
    totalArea?: number | null;
    builtArea?: number | null;
    bedrooms?: number | null;
    suites?: number | null;
    bathrooms?: number | null;
    parkingSpaces?: number | null;
    constructionType?: string | null;
    finishes?: string | null;
    infrastructure?: string | null;
    condoDetails?: string | null;
    improvements?: string | null;
    topography?: string | null;
    liensAndEncumbrances?: string | null;
    propertyDebts?: string | null;
    unregisteredRecords?: string | null;
    hasHabiteSe?: boolean;
    zoningRestrictions?: string | null;
    amenities?: {
        value: string;
    }[];
    brand?: string | null;
    serialNumber?: string | null;
    itemCondition?: string | null;
    specifications?: string | null;
    includedAccessories?: string | null;
    batteryCondition?: string | null;
    hasInvoice?: boolean;
    hasWarranty?: boolean;
    repairHistory?: string | null;
    applianceCapacity?: string | null;
    voltage?: string | null;
    applianceType?: string | null;
    additionalFunctions?: string | null;
    hoursUsed?: number | null;
    engineType?: string | null;
    capacityOrPower?: string | null;
    maintenanceHistory?: string | null;
    installationLocation?: string | null;
    compliesWithNR?: string | null;
    operatingLicenses?: string | null;
    breed?: string | null;
    age?: string | null;
    sex?: 'Macho' | 'Femea' | null;
    weight?: string | null;
    individualId?: string | null;
    purpose?: string | null;
    sanitaryCondition?: string | null;
    vaccinationStatus?: string | null;
    lineage?: string | null;
    isPregnant?: boolean;
    specialSkills?: string | null;
    gtaDocument?: string | null;
    breedRegistryDocument?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}
interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
    createdAt: string | Date;
    isRead: boolean;
}
interface CnjProcessSource {
    numeroProcesso: string;
    formato: {
        nome: string;
    };
    tribunal: string;
    classe: {
        codigo: number;
        nome: string;
    };
    assuntos: {
        codigo: number;
        nome: string;
    }[][];
    dataAjuizamento: string;
    orgaoJulgador: {
        codigo: number;
        nome: string;
    };
}
interface CnjHit {
    _index: string;
    _id: string;
    _score: number;
    _source: CnjProcessSource;
    sort?: (string | number)[];
}
interface CnjSearchResponse {
    took: number;
    timed_out: boolean;
    _shards: {
        total: number;
        successful: number;
        skipped: number;
        failed: number;
    };
    hits: {
        total: {
            value: number;
            relation: string;
        };
        max_score: number;
        hits: CnjHit[];
    };
}
interface AdminReportData {
    users: number;
    auctions: number;
    lots: number;
    sellers: number;
    totalRevenue: number;
    newUsersLast30Days: number;
    activeAuctions: number;
    lotsSoldCount: number;
    salesData: {
        name: string;
        Sales: number;
    }[];
    categoryData: {
        name: string;
        value: number;
    }[];
    averageBidValue: number;
    auctionSuccessRate: number;
    averageLotsPerAuction: number;
}
interface ConsignorDashboardStats {
    totalLotsConsigned: number;
    activeLots: number;
    soldLots: number;
    totalSalesValue: number;
    salesRate: number;
    salesData: {
        name: string;
        sales: number;
    }[];
}
interface AdminDashboardStats {
    users: number;
    auctions: number;
    lots: number;
    sellers: number;
}
interface UserReportData {
    totalLotsWon: number;
    totalAmountSpent: number;
    totalBidsPlaced: number;
    spendingByCategory: {
        name: string;
        value: number;
    }[];
}
interface SellerDashboardData {
    totalRevenue: number;
    totalAuctions: number;
    totalLots: number;
    lotsSoldCount: number;
    salesRate: number;
    averageTicket: number;
    salesByMonth: {
        name: string;
        Faturamento: number;
    }[];
    platformCommissionPercentage?: number;
    totalCommission?: number;
    netValue?: number;
    paidCount?: number;
}
type EditableUserProfileData = Partial<Omit<UserProfileData, 'id' | 'uid' | 'email' | 'sellerId' | 'habilitationStatus' | 'password' | 'createdAt' | 'updatedAt' | 'roleName' | 'roleNames' | 'permissions'>>;
type UserCreationData = Pick<UserProfileData, 'email' | 'password' | 'fullName' | 'accountType' | 'habilitationStatus'> & Partial<Omit<UserProfileData, 'id' | 'email' | 'password' | 'fullName' | 'accountType' | 'habilitationStatus' | 'roleName' | 'roleNames' | 'permissions'>> & {
    roleIds?: string[];
};
type AuctioneerFormData = Partial<Omit<AuctioneerProfileInfo, 'id' | 'publicId' | 'slug' | 'createdAt' | 'updatedAt'>>;

declare const auctionStatusValues: [string, ...string[]];
declare const lotStatusValues: [string, ...string[]];
declare const userHabilitationStatusValues: [string, ...string[]];
declare const accountTypeValues: [string, ...string[]];
declare const paymentStatusValues: [string, ...string[]];
declare const auctionTypeValues: [string, ...string[]];
declare const auctionMethodValues: [string, ...string[]];
declare const auctionParticipationValues: [string, ...string[]];

declare const AuctionSchema: z.ZodObject<{
    id: z.ZodString;
    publicId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<[string, ...string[]]>>;
    auctionDate: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>>;
    totalLots: z.ZodOptional<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodString>;
    auctioneerId: z.ZodString;
    sellerId: z.ZodString;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageMediaId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visits: z.ZodOptional<z.ZodNumber>;
    auctionType: z.ZodOptional<z.ZodEnum<["JUDICIAL", "EXTRAJUDICIAL", "PARTICULAR", "TOMADA_DE_PRECOS", "DUTCH", "SILENT"]>>;
    auctionStages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        endDate: z.ZodUnion<[z.ZodDate, z.ZodString]>;
        initialPrice: z.ZodOptional<z.ZodNumber>;
        statusText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        endDate: string | Date;
        initialPrice?: number | undefined;
        statusText?: string | undefined;
    }, {
        name: string;
        endDate: string | Date;
        initialPrice?: number | undefined;
        statusText?: string | undefined;
    }>, "many">>;
    biddingSettings: z.ZodOptional<z.ZodObject<{
        instantBiddingEnabled: z.ZodDefault<z.ZodBoolean>;
        getBidInfoInstantly: z.ZodDefault<z.ZodBoolean>;
        biddingInfoCheckIntervalSeconds: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        instantBiddingEnabled: boolean;
        getBidInfoInstantly: boolean;
        biddingInfoCheckIntervalSeconds: number;
    }, {
        instantBiddingEnabled?: boolean | undefined;
        getBidInfoInstantly?: boolean | undefined;
        biddingInfoCheckIntervalSeconds?: number | undefined;
    }>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    sellerId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    status: string;
    title: string;
    auctionDate: string | Date;
    auctioneerId: string;
    description?: string | undefined;
    endDate?: string | Date | null | undefined;
    totalLots?: number | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    imageMediaId?: string | null | undefined;
    visits?: number | undefined;
    auctionType?: "JUDICIAL" | "EXTRAJUDICIAL" | "PARTICULAR" | "TOMADA_DE_PRECOS" | "DUTCH" | "SILENT" | undefined;
    auctionStages?: {
        name: string;
        endDate: string | Date;
        initialPrice?: number | undefined;
        statusText?: string | undefined;
    }[] | undefined;
    biddingSettings?: {
        instantBiddingEnabled: boolean;
        getBidInfoInstantly: boolean;
        biddingInfoCheckIntervalSeconds: number;
    } | undefined;
}, {
    id: string;
    sellerId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    title: string;
    auctionDate: string | Date;
    auctioneerId: string;
    description?: string | undefined;
    status?: string | undefined;
    endDate?: string | Date | null | undefined;
    totalLots?: number | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    imageMediaId?: string | null | undefined;
    visits?: number | undefined;
    auctionType?: "JUDICIAL" | "EXTRAJUDICIAL" | "PARTICULAR" | "TOMADA_DE_PRECOS" | "DUTCH" | "SILENT" | undefined;
    auctionStages?: {
        name: string;
        endDate: string | Date;
        initialPrice?: number | undefined;
        statusText?: string | undefined;
    }[] | undefined;
    biddingSettings?: {
        instantBiddingEnabled?: boolean | undefined;
        getBidInfoInstantly?: boolean | undefined;
        biddingInfoCheckIntervalSeconds?: number | undefined;
    } | undefined;
}>;
type AuctionZod = z.infer<typeof AuctionSchema>;
declare const LotSchema: z.ZodObject<{
    id: z.ZodString;
    publicId: z.ZodString;
    auctionId: z.ZodString;
    number: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodNumber;
    initialPrice: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodDefault<z.ZodEnum<[string, ...string[]]>>;
    bidsCount: z.ZodOptional<z.ZodNumber>;
    views: z.ZodOptional<z.ZodNumber>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageMediaId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodString>;
    bemIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    status: string;
    title: string;
    auctionId: string;
    price: number;
    number?: string | undefined;
    description?: string | null | undefined;
    initialPrice?: number | null | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    imageMediaId?: string | null | undefined;
    bidsCount?: number | undefined;
    views?: number | undefined;
    bemIds?: string[] | undefined;
}, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    title: string;
    auctionId: string;
    price: number;
    number?: string | undefined;
    description?: string | null | undefined;
    status?: string | undefined;
    initialPrice?: number | null | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    imageMediaId?: string | null | undefined;
    bidsCount?: number | undefined;
    views?: number | undefined;
    bemIds?: string[] | undefined;
}>;
type LotZod = z.infer<typeof LotSchema>;
declare const UserProfileDataSchema: z.ZodObject<{
    id: z.ZodString;
    uid: z.ZodString;
    email: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    fullName: z.ZodNullable<z.ZodString>;
    habilitationStatus: z.ZodEnum<[string, ...string[]]>;
    accountType: z.ZodEnum<[string, ...string[]]>;
    roleIds: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    uid: string;
    email: string;
    habilitationStatus: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    fullName: string | null;
    accountType: string;
    roleIds: string[];
    password?: string | undefined;
}, {
    id: string;
    uid: string;
    email: string;
    habilitationStatus: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    fullName: string | null;
    accountType: string;
    roleIds: string[];
    password?: string | undefined;
}>;
type UserProfileDataZod = z.infer<typeof UserProfileDataSchema>;
declare const SellerProfileInfoSchema: z.ZodObject<{
    id: z.ZodString;
    publicId: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    isJudicial: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    slug: string;
    name: string;
    isJudicial: boolean;
}, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    slug: string;
    name: string;
    isJudicial?: boolean | undefined;
}>;
type SellerProfileInfoZod = z.infer<typeof SellerProfileInfoSchema>;
declare const AuctioneerProfileInfoSchema: z.ZodObject<{
    id: z.ZodString;
    publicId: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    slug: string;
    name: string;
}, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    publicId: string;
    slug: string;
    name: string;
}>;
type AuctioneerProfileInfoZod = z.infer<typeof AuctioneerProfileInfoSchema>;
declare const checkoutFormSchema: z.ZodEffects<z.ZodObject<{
    paymentMethod: z.ZodEnum<["credit_card", "installments"]>;
    installments: z.ZodOptional<z.ZodNumber>;
    cardDetails: z.ZodOptional<z.ZodObject<{
        cardholderName: z.ZodString;
        cardNumber: z.ZodString;
        expiryDate: z.ZodEffects<z.ZodString, string, string>;
        cvc: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        cardholderName: string;
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    }, {
        cardholderName: string;
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    paymentMethod: "credit_card" | "installments";
    installments?: number | undefined;
    cardDetails?: {
        cardholderName: string;
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    } | undefined;
}, {
    paymentMethod: "credit_card" | "installments";
    installments?: number | undefined;
    cardDetails?: {
        cardholderName: string;
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    } | undefined;
}>, {
    paymentMethod: "credit_card" | "installments";
    installments?: number | undefined;
    cardDetails?: {
        cardholderName: string;
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    } | undefined;
}, {
    paymentMethod: "credit_card" | "installments";
    installments?: number | undefined;
    cardDetails?: {
        cardholderName: string;
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    } | undefined;
}>;

declare const slugify: (text: string) => string;

declare class AuctionService {
    private auctionRepository;
    constructor();
    private mapAuctionsWithDetails;
    getAuctions(): Promise<Auction[]>;
    getAuctionById(id: string): Promise<Auction | null>;
    getAuctionsByIds(ids: string[]): Promise<Auction[]>;
    getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]>;
    getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]>;
    createAuction(data: any): Promise<{
        success: boolean;
        message: string;
        auctionId?: string;
    }>;
    updateAuction(id: string, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAuction(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateAuctionTitle(id: string, newTitle: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateAuctionImage(auctionId: string, mediaItemId: string, imageUrl: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateAuctionFeaturedStatus(id: string, newStatus: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
}

declare class LotService {
    private lotRepository;
    private bidRepository;
    constructor();
    getLots(auctionId?: string): Promise<Lot[]>;
    getLotsBySellerId(sellerId: string): Promise<Lot[]>;
    getLotById(id: string): Promise<Lot | null>;
    getLotsByIds(ids: string[]): Promise<Lot[]>;
    createLot(data: any): Promise<{
        success: boolean;
        message: string;
        lotId?: string;
    }>;
    updateLot(id: string, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteLot(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    finalizeLot(lotId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

declare class SellerService {
    private sellerRepository;
    private lotService;
    private userWinService;
    private auctionRepository;
    constructor();
    getSellers(): Promise<SellerProfileInfo[]>;
    getSellerById(id: string): Promise<SellerProfileInfo | null>;
    findByName(name: string): Promise<SellerProfileInfo | null>;
    getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null>;
    getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]>;
    getAuctionsBySellerSlug(sellerSlugOrId: string): Promise<any[]>;
    createSeller(data: any): Promise<{
        success: boolean;
        message: string;
        sellerId?: string;
    }>;
    updateSeller(id: string, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteSeller(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getSellerDashboardData(sellerId: string): Promise<SellerDashboardData | null>;
    getSellersPerformance(): Promise<any[]>;
}

declare class AuctioneerService {
    private auctioneerRepository;
    private auctionRepository;
    constructor();
    private mapAuctionsWithDetails;
    obterLeiloeiros(): Promise<AuctioneerProfileInfo[]>;
    obterLeiloeiroPorId(id: string): Promise<AuctioneerProfileInfo | null>;
    obterLeiloeiroPorSlug(slugOrId: string): Promise<AuctioneerProfileInfo | null>;
    obterLeiloesPorLeiloeiroSlug(auctioneerSlug: string): Promise<Auction[]>;
    criarLeiloeiro(data: any): Promise<{
        success: boolean;
        message: string;
        auctioneerId?: string;
    }>;
    atualizarLeiloeiro(id: string, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    excluirLeiloeiro(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    obterDadosDashboardLeiloeiro(auctioneerId: string): Promise<SellerDashboardData | null>;
    obterPerformanceLeiloeiros(): Promise<any[]>;
}

declare class BidService {
    private repository;
    private lotService;
    private habilitationService;
    constructor();
    placeBid(lotIdOrPublicId: string, auctionIdOrPublicId: string, userId: string, userDisplayName: string, bidAmount: number): Promise<{
        success: boolean;
        message: string;
        updatedLot?: any;
        newBid?: any;
    }>;
    placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getActiveUserLotMaxBid(lotIdOrPublicId: string, userId: string): Promise<any | null>;
    getBidsForLot(lotIdOrPublicId: string): Promise<any[]>;
    getBidsForUser(userId: string): Promise<any[]>;
}

declare class UserWinService {
    private repository;
    constructor();
    private formatWin;
    getWinDetails(winId: string): Promise<UserWin | null>;
    findWinsByUserId(userId: string): Promise<UserWin[]>;
    getWinsForConsignor(sellerId: string): Promise<UserWin[]>;
    getUserReportData(userId: string): Promise<UserReportData>;
}

declare class ContactMessageService {
    private repository;
    constructor();
    getContactMessages(): Promise<ContactMessage[]>;
    saveMessage(data: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleReadStatus(id: string, isRead: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteMessage(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

declare class DocumentTemplateService {
    private repository;
    constructor();
    getDocumentTemplates(): Promise<any[]>;
    getDocumentTemplateById(id: string): Promise<any | null>;
    createDocumentTemplate(data: any): Promise<{
        success: boolean;
        message: string;
        templateId?: string;
    }>;
    updateDocumentTemplate(id: string, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteDocumentTemplate(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

declare class DocumentTypeService {
    private repository;
    constructor();
    getDocumentTypes(): Promise<DocumentType[]>;
}

declare class HabilitationService {
    private repository;
    constructor();
    getHabilitationRequests(): Promise<UserProfileData[]>;
    habilitateForAuction(userId: string, auctionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    isUserHabilitatedForAuction(userId: string, auctionId: string): Promise<boolean>;
    getUserDocuments(userId: string): Promise<UserDocument[]>;
    saveUserDocument(userId: string, documentTypeId: string, fileUrl: string, fileName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    approveDocument(documentId: string, analystId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectDocument(documentId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

export { type AccountType, type AdminDashboardStats, type AdminReportData, type Auction, type AuctionMethod, type AuctionParticipation, AuctionSchema, AuctionService, type AuctionStage, type AuctionStatus, type AuctionType, type AuctionZod, type SellerDashboardData as AuctioneerDashboardData, type AuctioneerFormData, type AuctioneerProfileInfo, AuctioneerProfileInfoSchema, type AuctioneerProfileInfoZod, AuctioneerService, type BadgeVisibilitySettings, type Bem, type BidInfo, BidService, type BiddingSettings, type CityInfo, type CnjHit, type CnjProcessSource, type CnjSearchResponse, type ConsignorDashboardStats, type ContactMessage, ContactMessageService, type Court, type DirectSaleOffer, type DirectSaleOfferStatus, type DirectSaleOfferType, DocumentTemplateService, type DocumentTemplateType, type DocumentType, DocumentTypeService, type EditableUserProfileData, HabilitationService, type InstallmentPayment, type JudicialBranch, type JudicialDistrict, type JudicialProcess, type Lot, type LotCategory, LotSchema, LotService, type LotStagePrice, type LotStatus, type LotZod, type MapProvider, type MapSettings, type MediaItem, type MentalTriggerSettings, type Notification, type PaymentGatewaySettings, type PaymentStatus, type PlatformSettings, type ProcessParty, type ProcessPartyType, type RecentlyViewedLotInfo, type Role, type SearchPaginationType, type SellerDashboardData, type SellerProfileInfo, SellerProfileInfoSchema, type SellerProfileInfoZod, SellerService, type StateInfo, type StorageProviderType, type Subcategory, type UserBid, type UserCreationData, type UserDocument, type UserDocumentStatus, type UserHabilitationStatus, type UserLotMaxBid, type UserProfileData, UserProfileDataSchema, type UserProfileDataZod, type UserProfileWithPermissions, type UserReportData, type UserWin, UserWinService, type VariableIncrementRule, accountTypeValues, auctionMethodValues, auctionParticipationValues, auctionStatusValues, auctionTypeValues, checkoutFormSchema, lotStatusValues, paymentStatusValues, slugify, userHabilitationStatusValues };
