# MySQL Schema (from Prisma) - Minimal Data Model Guide

This document contains the current, functional database schema derived from `prisma/schema.prisma`. It serves as the minimal data model reference for the application. It can be extended, but not reduced without careful consideration.

```prisma
// prisma/schema.prisma

datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
}

// ===============================================
//                 ENUMS
// ===============================================

enum AuctionStatus {
  RASCUNHO
  EM_PREPARACAO
  EM_BREVE
  ABERTO
  ABERTO_PARA_LANCES
  ENCERRADO
  FINALIZADO
  CANCELADO
  SUSPENSO
}

enum AuctionType {
  JUDICIAL
  EXTRAJUDICIAL
  PARTICULAR
  TOMADA_DE_PRECOS
}

enum AuctionMethod {
  STANDARD
  DUTCH
  SILENT
}

enum AuctionParticipation {
  ONLINE
  PRESENCIAL
  HIBRIDO
}

enum BemStatus {
  CADASTRO
  DISPONIVEL
  LOTEADO
  VENDIDO
  REMOVIDO
  INATIVADO
}

enum AnimalSex {
  Macho
  Femea
}

enum DirectSaleOfferStatus {
  ACTIVE
  PENDING_APPROVAL
  SOLD
  EXPIRED
  RASCUNHO
}

enum DirectSaleOfferType {
  BUY_NOW
  ACCEPTS_PROPOSALS
}

enum DocumentTemplateType {
  WINNING_BID_TERM
  EVALUATION_REPORT
  AUCTION_CERTIFICATE
}

enum UserHabilitationStatus {
  PENDING_DOCUMENTS
  PENDING_ANALYSIS
  HABILITADO
  REJECTED_DOCUMENTS
  BLOCKED
}

enum AccountType {
  PHYSICAL
  LEGAL
  DIRECT_SALE_CONSIGNOR
}

enum ProcessPartyType {
  AUTOR
  REU
  ADVOGADO_AUTOR
  ADVOGADO_REU
  JUIZ
  ESCRIVAO
  PERITO
  ADMINISTRADOR_JUDICIAL
  TERCEIRO_INTERESSADO
  OUTRO
}

enum LotStatus {
  RASCUNHO
  EM_BREVE
  ABERTO_PARA_LANCES
  ENCERRADO
  VENDIDO
  NAO_VENDIDO
  RELISTADO
  CANCELADO
}

enum UserDocumentStatus {
  NOT_SENT
  SUBMITTED
  APPROVED
  REJECTED
  PENDING_ANALYSIS
}

enum PaymentStatus {
  PENDENTE
  PROCESSANDO
  PAGO
  FALHOU
  REEMBOLSADO
  CANCELADO
  ATRASADO
}

// ===============================================
//                 MODELS
// ===============================================

model User {
  id                 String                 @id @default(uuid())
  email              String                 @unique
  password           String?
  fullName           String?
  habilitationStatus UserHabilitationStatus @default(PENDING_DOCUMENTS)
  accountType        AccountType            @default(PHYSICAL)
  avatarUrl          String?
  dataAiHint         String?
  badges             Json?
  cpf                String?
  rgNumber           String?
  rgIssuer           String?
  rgIssueDate        DateTime?              @db.DateTime(3)
  rgState            String?
  dateOfBirth        DateTime?              @db.DateTime(3)
  cellPhone          String?
  homePhone          String?
  gender             String?
  profession         String?
  nationality        String?
  maritalStatus      String?
  propertyRegime     String?
  spouseName         String?
  spouseCpf          String?
  zipCode            String?
  street             String?
  number             String?
  complement         String?
  neighborhood       String?
  city               String?
  state              String?
  optInMarketing     Boolean?               @default(false)
  razaoSocial        String?
  cnpj               String?
  inscricaoEstadual  String?
  website            String?
  responsibleName    String?
  responsibleCpf     String?
  createdAt          DateTime               @default(now()) @db.DateTime(3)
  updatedAt          DateTime               @updatedAt @db.DateTime(3)
  // Relations
  roles              UsersOnRoles[]
  bids               Bid[]
  notifications      Notification[]
  documents          UserDocument[]
  maxBids            UserLotMaxBid[]
  sellerProfile      Seller?
  auctioneerProfile  Auctioneer?
  wins               UserWin[]              @relation("UserWinToUser")
  wonLots            Lot[]                  @relation("LotWinner")
  habilitations      AuctionHabilitation[]
  mediaItems         MediaItem[]
  questions          LotQuestion[]
  reviews            Review[]
}

model Role {
  id             String         @id @default(uuid())
  name           String         @unique @db.VarChar(50)
  nameNormalized String         @unique @db.VarChar(50)
  description    String?        @db.VarChar(255)
  permissions    Json
  createdAt      DateTime       @default(now()) @db.DateTime(3)
  updatedAt      DateTime       @updatedAt @db.DateTime(3)
  // Relations
  users          UsersOnRoles[]
}

model UsersOnRoles {
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  roleId     String
  assignedAt DateTime @default(now()) @db.DateTime(3)
  assignedBy String

  @@id([userId, roleId])
  @@index([roleId])
}

model Seller {
  id                String            @id @default(uuid())
  publicId          String?           @unique
  slug              String?           @unique @db.VarChar(150)
  name              String            @unique @db.VarChar(150)
  contactName       String?           @db.VarChar(150)
  email             String?           @db.VarChar(150)
  phone             String?           @db.VarChar(20)
  address           String?           @db.VarChar(200)
  city              String?           @db.VarChar(100)
  state             String?           @db.VarChar(50)
  zipCode           String?           @db.VarChar(10)
  website           String?           @db.VarChar(191)
  logoUrl           String?           @db.VarChar(191)
  logoMediaId       String?           @db.VarChar(191)
  dataAiHintLogo    String?           @db.VarChar(191)
  description       String?           @db.Text
  userId            String?           @unique
  user              User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  isJudicial        Boolean           @default(false)
  judicialBranchId  String?
  judicialBranch    JudicialBranch?   @relation(fields: [judicialBranchId], references: [id], onDelete: SetNull)
  createdAt         DateTime          @default(now()) @db.DateTime(3)
  updatedAt         DateTime          @updatedAt @db.DateTime(3)
  // Relations
  auctions          Auction[]
  lots              Lot[]             @relation("LotSeller")
  bens              Bem[]
  directSaleOffers  DirectSaleOffer[]
  judicialProcesses JudicialProcess[]

  @@index([judicialBranchId])
}

model Auctioneer {
  id                 String    @id @default(uuid())
  publicId           String?   @unique
  slug               String?   @unique @db.VarChar(150)
  name               String    @db.VarChar(150)
  registrationNumber String?   @db.VarChar(50)
  contactName        String?   @db.VarChar(150)
  email              String?   @db.VarChar(150)
  phone              String?   @db.VarChar(20)
  address            String?   @db.VarChar(200)
  city               String?   @db.VarChar(100)
  state              String?   @db.VarChar(50)
  zipCode            String?   @db.VarChar(10)
  website            String?   @db.VarChar(191)
  logoUrl            String?   @db.VarChar(191)
  logoMediaId        String?   @db.VarChar(191)
  dataAiHintLogo     String?   @db.VarChar(191)
  description        String?   @db.Text
  userId             String?   @unique
  user               User?     @relation(fields: [userId], references: [id])
  createdAt          DateTime  @default(now()) @db.DateTime(3)
  updatedAt          DateTime  @updatedAt @db.DateTime(3)
  // Relations
  auctions           Auction[]
  lots               Lot[]     @relation("AuctioneerToLot")

  @@index([userId])
}

model Auction {
  id                           String               @id @default(uuid())
  publicId                     String?              @unique @db.VarChar(100)
  slug                         String?              @unique @db.VarChar(255)
  title                        String               @db.VarChar(255)
  description                  String?              @db.Text
  status                       AuctionStatus        @default(RASCUNHO)
  auctionDate                  DateTime?            @db.DateTime(3)
  endDate                      DateTime?            @db.DateTime(3)
  auctioneerId                 String               @db.VarChar(191)
  sellerId                     String               @db.VarChar(191)
  categoryId                   String?              @db.VarChar(191)
  auctionType                  AuctionType?
  auctionMethod                AuctionMethod        @default(STANDARD)
  participation                AuctionParticipation @default(ONLINE)
  imageUrl                     String?              @db.VarChar(191)
  imageMediaId                 String?              @db.VarChar(191)
  dataAiHint                   String?              @db.VarChar(100)
  documentsUrl                 String?              @db.VarChar(191)
  address                      String?              @db.VarChar(191)
  zipCode                      String?              @db.VarChar(191)
  latitude                     Float?
  longitude                    Float?
  visits                       Int?                 @default(0)
  totalLots                    Int?                 @default(0)
  initialOffer                 Decimal?             @db.Decimal(15, 2)
  isFavorite                   Boolean?             @default(false)
  evaluationReportUrl          String?              @db.VarChar(191)
  auctionCertificateUrl        String?              @db.VarChar(191)
  sellingBranch                String?              @db.VarChar(100)
  automaticBiddingEnabled      Boolean              @default(false)
  allowInstallmentBids         Boolean              @default(true)
  silentBiddingEnabled         Boolean              @default(false)
  allowMultipleBidsPerUser     Boolean              @default(true)
  softCloseEnabled             Boolean              @default(false)
  softCloseMinutes             Int?                 @default(2)
  estimatedRevenue             Decimal?             @db.Decimal(15, 2)
  achievedRevenue              Decimal?             @db.Decimal(15, 2)
  totalHabilitatedUsers        Int?                 @default(0)
  isFeaturedOnMarketplace      Boolean              @default(false)
  marketplaceAnnouncementTitle String?              @db.VarChar(150)
  decrementAmount              Decimal?             @db.Decimal(15, 2)
  decrementIntervalSeconds     Int?
  floorPrice                   Decimal?             @db.Decimal(15, 2)
  autoRelistSettings           Json?
  judicialProcessId            String?              @db.VarChar(191)
  courtId                      String?              @db.VarChar(191)
  districtId                   String?              @db.VarChar(191)
  branchId                     String?              @db.VarChar(191)
  cityId                       String?              @db.VarChar(191)
  stateId                      String?              @db.VarChar(191)
  createdAt                    DateTime             @default(now()) @db.DateTime(3)
  updatedAt                    DateTime             @updatedAt @db.DateTime(3)

  // Relations
  auctioneer      Auctioneer            @relation(fields: [auctioneerId], references: [id])
  seller          Seller                @relation(fields: [sellerId], references: [id])
  category        LotCategory?          @relation(fields: [categoryId], references: [id])
  judicialProcess JudicialProcess?      @relation(fields: [judicialProcessId], references: [id])
  court           Court?                @relation(fields: [courtId], references: [id])
  district        JudicialDistrict?     @relation(fields: [districtId], references: [id])
  branch          JudicialBranch?       @relation(name: "AuctionBranch", fields: [branchId], references: [id])
  city            City?                 @relation(fields: [cityId], references: [id])
  state           State?                @relation(fields: [stateId], references: [id])
  lots            Lot[]
  stages          AuctionStage[]
  habilitations   AuctionHabilitation[]
  bids            Bid[]

  @@index([sellerId])
  @@index([categoryId])
  @@index([judicialProcessId])
  @@index([courtId])
  @@index([districtId])
  @@index([branchId])
  @@index([cityId])
  @@index([stateId])
  @@index([auctioneerId])
  @@map("Auction")
}

model AuctionStage {
  id              String                   @id @default(uuid())
  name            String
  startDate       DateTime
  endDate         DateTime
  evaluationValue Decimal?                 @db.Decimal(15, 2)
  auctionId       String
  // Relations
  auction         Auction                  @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  lotStageDetails LotAuctionStageDetails[]

  @@index([auctionId])
}

model LotAuctionStageDetails {
  id           String       @id @default(uuid())
  lotId        String
  stageId      String
  initialBid   Decimal?     @db.Decimal(15, 2)
  bidIncrement Decimal?     @db.Decimal(10, 2)
  // Relations
  lot          Lot          @relation(fields: [lotId], references: [id], onDelete: Cascade)
  stage        AuctionStage @relation(fields: [stageId], references: [id], onDelete: Cascade)

  @@unique([lotId, stageId])
  @@index([stageId])
}

model AuctionHabilitation {
  id        String   @id @default(uuid())
  userId    String
  auctionId String
  createdAt DateTime @default(now()) @db.DateTime(3)
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  auction   Auction  @relation(fields: [auctionId], references: [id], onDelete: Cascade)

  @@unique([userId, auctionId])
  @@index([auctionId])
}

model State {
  id                String             @id @default(uuid())
  name              String             @db.VarChar(100)
  uf                String             @unique @db.VarChar(2)
  slug              String             @unique @db.VarChar(100)
  // Relations
  cities            City[]
  courts            Court[]
  judicialDistricts JudicialDistrict[]
  auctions          Auction[]
  lots              Lot[]
}

model City {
  id       String    @id @default(uuid())
  name     String    @db.VarChar(150)
  slug     String    @db.VarChar(150)
  stateId  String
  stateUf  String?
  ibgeCode String?   @unique @db.VarChar(10)
  lotCount Int?      @default(0)
  // Relations
  state    State     @relation(fields: [stateId], references: [id], onDelete: Cascade)
  lots     Lot[]
  auctions Auction[]

  @@index([stateId])
}

model Court {
  id                String             @id @default(uuid())
  name              String             @db.VarChar(150)
  slug              String?            @db.VarChar(150)
  stateId           String?
  stateUf           String?            @db.VarChar(2)
  website           String?            @db.VarChar(191)
  createdAt         DateTime           @default(now()) @db.DateTime(3)
  updatedAt         DateTime           @updatedAt @db.DateTime(3)
  // Relations
  state             State?             @relation(fields: [stateId], references: [id], onDelete: SetNull)
  districts         JudicialDistrict[]
  judicialProcesses JudicialProcess[]
  auctions          Auction[]

  @@index([stateId])
}

model JudicialDistrict {
  id        String            @id @default(uuid())
  name      String            @db.VarChar(150)
  slug      String            @unique @db.VarChar(150)
  courtId   String?
  stateId   String
  zipCode   String?           @db.VarChar(10)
  createdAt DateTime          @default(now()) @db.DateTime(3)
  updatedAt DateTime          @updatedAt @db.DateTime(3)
  // Relations
  court     Court?            @relation(fields: [courtId], references: [id], onDelete: SetNull)
  state     State             @relation(fields: [stateId], references: [id])
  branches  JudicialBranch[]
  processes JudicialProcess[]
  auctions  Auction[]

  @@index([courtId])
  @@index([stateId])
}

model JudicialBranch {
  id                String            @id @default(uuid())
  name              String            @db.VarChar(150)
  slug              String            @unique @db.VarChar(150)
  districtId        String?
  contactName       String?           @db.VarChar(150)
  phone             String?           @db.VarChar(20)
  email             String?           @db.VarChar(150)
  createdAt         DateTime          @default(now()) @db.DateTime(3)
  updatedAt         DateTime          @updatedAt @db.DateTime(3)
  // Relations
  district          JudicialDistrict? @relation(fields: [districtId], references: [id], onDelete: SetNull)
  judicialProcesses JudicialProcess[]
  seller            Seller?
  auctions          Auction[]         @relation("AuctionBranch")

  @@index([districtId])
}

model JudicialProcess {
  id            String            @id @default(uuid())
  publicId      String?           @unique
  processNumber String            @db.VarChar(100)
  isElectronic  Boolean           @default(true)
  courtId       String?
  districtId    String?
  branchId      String?
  sellerId      String?
  createdAt     DateTime          @default(now()) @db.DateTime(3)
  updatedAt     DateTime          @updatedAt @db.DateTime(3)
  // Relations
  court         Court?            @relation(fields: [courtId], references: [id], onDelete: SetNull)
  district      JudicialDistrict? @relation(fields: [districtId], references: [id], onDelete: SetNull)
  branch        JudicialBranch?   @relation(fields: [branchId], references: [id], onDelete: SetNull)
  seller        Seller?           @relation(fields: [sellerId], references: [id], onDelete: SetNull)
  parties       JudicialParty[]
  bens          Bem[]
  auctions      Auction[]
  mediaItems    MediaItem[]

  @@index([courtId])
  @@index([districtId])
  @@index([branchId])
  @@index([sellerId])
}

model JudicialParty {
  id             String           @id @default(uuid())
  processId      String
  name           String
  documentNumber String?          @db.VarChar(50)
  partyType      ProcessPartyType
  // Relations
  process        JudicialProcess  @relation(fields: [processId], references: [id], onDelete: Cascade)

  @@index([processId])
}

model LotCategory {
  id                   String            @id @default(uuid())
  name                 String            @unique
  slug                 String            @unique
  description          String?           @db.VarChar(500)
  hasSubcategories     Boolean?
  logoUrl              String?           @db.VarChar(191)
  logoMediaId          String?           @db.VarChar(191)
  dataAiHintLogo       String?           @db.VarChar(191)
  coverImageUrl        String?           @db.VarChar(191)
  coverImageMediaId    String?           @db.VarChar(191)
  dataAiHintCover      String?           @db.VarChar(191)
  megaMenuImageUrl     String?           @db.VarChar(191)
  megaMenuImageMediaId String?           @db.VarChar(191)
  dataAiHintMegaMenu   String?           @db.VarChar(191)
  createdAt            DateTime          @default(now()) @db.DateTime(3)
  updatedAt            DateTime          @updatedAt @db.DateTime(3)
  // Relations
  lots                 Lot[]
  bens                 Bem[]
  subcategories        Subcategory[]
  directSaleOffers     DirectSaleOffer[]
  auctions             Auction[]
}

model Subcategory {
  id               String      @id @default(uuid())
  name             String
  slug             String
  parentCategoryId String
  description      String?     @db.VarChar(500)
  displayOrder     Int         @default(0)
  iconUrl          String?     @db.VarChar(191)
  iconMediaId      String?     @db.VarChar(191)
  dataAiHintIcon   String?     @db.VarChar(191)
  // Relations
  parentCategory   LotCategory @relation(fields: [parentCategoryId], references: [id], onDelete: Cascade)
  lots             Lot[]
  bens             Bem[]

  @@index([parentCategoryId])
}

model Bem {
  id                         String           @id @default(uuid())
  publicId                   String           @unique
  title                      String
  description                String?          @db.Text
  status                     BemStatus        @default(DISPONIVEL)
  categoryId                 String
  subcategoryId              String?
  judicialProcessId          String?
  sellerId                   String?
  evaluationValue            Decimal?         @db.Decimal(15, 2)
  imageUrl                   String?
  imageMediaId               String?
  galleryImageUrls           Json?
  mediaItemIds               Json?
  dataAiHint                 String?
  locationCity               String?
  locationState              String?
  address                    String?
  latitude                   Decimal?         @db.Decimal(10, 8)
  longitude                  Decimal?         @db.Decimal(11, 8)
  plate                      String?
  make                       String?
  model                      String?
  version                    String?
  year                       Int?
  modelYear                  Int?
  mileage                    Int?
  color                      String?
  fuelType                   String?
  transmissionType           String?
  bodyType                   String?
  vin                        String?          @unique
  renavam                    String?          @unique
  enginePower                String?
  numberOfDoors              Int?
  vehicleOptions             String?          @db.Text
  detranStatus               String?
  debts                      String?          @db.Text
  runningCondition           String?
  bodyCondition              String?
  tiresCondition             String?
  hasKey                     Boolean?
  propertyRegistrationNumber String?
  iptuNumber                 String?
  isOccupied                 Boolean?
  totalArea                  Decimal?         @db.Decimal(15, 2)
  builtArea                  Decimal?         @db.Decimal(15, 2)
  bedrooms                   Int?
  suites                     Int?
  bathrooms                  Int?
  parkingSpaces              Int?
  constructionType           String?
  finishes                   String?          @db.Text
  infrastructure             String?          @db.Text
  condoDetails               String?          @db.Text
  improvements               String?          @db.Text
  topography                 String?
  liensAndEncumbrances       String?          @db.Text
  propertyDebts              String?          @db.Text
  unregisteredRecords        String?          @db.Text
  hasHabiteSe                Boolean?
  zoningRestrictions         String?
  brand                      String?
  serialNumber               String?
  itemCondition              String?
  specifications             String?          @db.Text
  includedAccessories        String?          @db.Text
  batteryCondition           String?
  hasInvoice                 Boolean?
  hasWarranty                Boolean?
  repairHistory              String?          @db.Text
  applianceCapacity          String?
  voltage                    String?
  applianceType              String?
  additionalFunctions        String?
  hoursUsed                  Int?
  engineType                 String?
  capacityOrPower            String?
  maintenanceHistory         String?          @db.Text
  installationLocation       String?
  compliesWithNR             String?
  operatingLicenses          String?
  breed                      String?
  age                        String?
  sex                        AnimalSex?
  weight                     String?
  individualId               String?
  purpose                    String?
  sanitaryCondition          String?
  vaccinationStatus          String?
  lineage                    String?
  isPregnant                 Boolean?
  specialSkills              String?
  gtaDocument                String?
  breedRegistryDocument      String?
  furnitureType              String?
  material                   String?
  style                      String?
  dimensions                 String?
  pieceCount                 Int?
  jewelryType                String?
  metal                      String?
  gemstones                  String?
  totalWeight                String?
  jewelrySize                String?
  authenticityCertificate    String?
  workType                   String?
  artist                     String?
  period                     String?
  technique                  String?
  provenance                 String?          @db.Text
  boatType                   String?          @db.VarChar(191)
  boatLength                 String?
  hullMaterial               String?
  onboardEquipment           String?          @db.Text
  productName                String?
  quantity                   String?
  packagingType              String?
  expirationDate             DateTime?        @db.DateTime(3)
  storageConditions          String?
  preciousMetalType          String?
  purity                     String?
  forestGoodsType            String?
  volumeOrQuantity           String?
  species                    String?
  dofNumber                  String?
  createdAt                  DateTime         @default(now()) @db.DateTime(3)
  updatedAt                  DateTime         @updatedAt @db.DateTime(3)
  // Relations
  category                   LotCategory      @relation(fields: [categoryId], references: [id])
  subcategory                Subcategory?     @relation(fields: [subcategoryId], references: [id])
  judicialProcess            JudicialProcess? @relation(fields: [judicialProcessId], references: [id], onDelete: SetNull)
  seller                     Seller?          @relation(fields: [sellerId], references: [id], onDelete: SetNull)
  lots                       LotBens[]

  @@index([categoryId])
  @@index([subcategoryId])
  @@index([judicialProcessId])
  @@index([sellerId])
}

model LotBens {
  lot   Lot    @relation(fields: [lotId], references: [id], onDelete: Cascade)
  lotId String
  bem   Bem    @relation(fields: [bemId], references: [id], onDelete: Cascade)
  bemId String

  @@id([lotId, bemId])
  @@index([lotId])
  @@index([bemId])
}

model Lot {
  id                      String                   @id @default(uuid())
  publicId                String?                  @unique @db.VarChar(100)
  auctionId               String
  slug                    String?                  @db.VarChar(255)
  number                  String?                  @db.VarChar(20)
  title                   String                   @db.VarChar(255)
  description             String?                  @db.Text
  price                   Decimal                  @db.Decimal(15, 2)
  initialPrice            Decimal?                 @db.Decimal(15, 2)
  secondInitialPrice      Decimal?                 @db.Decimal(15, 2)
  bidIncrementStep        Decimal?                 @db.Decimal(10, 2)
  status                  LotStatus                @default(EM_BREVE)
  bidsCount               Int?                     @default(0)
  views                   Int?                     @default(0)
  isFeatured              Boolean?                 @default(false)
  isExclusive             Boolean?                 @default(false)
  discountPercentage      Int?
  additionalTriggers      Json?
  imageUrl                String?                  @db.VarChar(191)
  imageMediaId            String?                  @db.VarChar(191)
  galleryImageUrls        Json?
  mediaItemIds            Json?
  type                    String                   @db.VarChar(100)
  categoryId              String?
  subcategoryId           String?
  auctionName             String?                  @db.VarChar(255)
  sellerId                String?
  sellerName              String?                  @db.VarChar(150)
  auctioneerId            String?
  cityId                  String?
  stateId                 String?
  cityName                String?                  @db.VarChar(100)
  stateUf                 String?                  @db.VarChar(2)
  latitude                Decimal?                 @db.Decimal(10, 8)
  longitude               Decimal?                 @db.Decimal(11, 8)
  mapAddress              String?                  @db.VarChar(255)
  mapEmbedUrl             String?                  @db.VarChar(500)
  mapStaticImageUrl       String?                  @db.VarChar(191)
  endDate                 DateTime?                @db.DateTime(3)
  auctionDate             DateTime?                @db.DateTime(3)
  lotSpecificAuctionDate  DateTime?                @db.DateTime(3)
  secondAuctionDate       DateTime?                @db.DateTime(3)
  condition               String?                  @db.VarChar(100)
  dataAiHint              String?                  @db.VarChar(100)
  winnerId                String?
  winningBidTermUrl       String?                  @db.VarChar(191)
  allowInstallmentBids    Boolean?                 @default(false)
  isRelisted              Boolean                  @default(false)
  relistCount             Int                      @default(0)
  originalLotId           String?                  @unique
  inheritedMediaFromBemId String?
  createdAt               DateTime                 @default(now()) @db.DateTime(3)
  updatedAt               DateTime                 @updatedAt @db.DateTime(3)
  // Relations
  auction                 Auction                  @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  category                LotCategory?             @relation(fields: [categoryId], references: [id])
  subcategory             Subcategory?             @relation(fields: [subcategoryId], references: [id])
  seller                  Seller?                  @relation("LotSeller", fields: [sellerId], references: [id])
  city                    City?                    @relation(fields: [cityId], references: [id])
  state                   State?                   @relation(fields: [stateId], references: [id])
  winner                  User?                    @relation("WonLots", fields: [winnerId], references: [id], onDelete: SetNull)
  originalLot             Lot?                     @relation("RelistHistory", fields: [originalLotId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  relistedLots            Lot[]                    @relation("RelistHistory")
  bids                    Bid[]
  wins                    UserWin[]                @relation("LotWin")
  bens                    LotBens[]
  maxBids                 UserLotMaxBid[]
  auctioneer              Auctioneer[]             @relation("AuctioneerToLot")
  stageDetails            LotAuctionStageDetails[]

  @@index([auctionId])
  @@index([categoryId])
  @@index([subcategoryId])
  @@index([sellerId])
  @@index([cityId])
  @@index([stateId])
  @@index([winnerId])
}

model Bid {
  id            String   @id @default(uuid())
  lotId         String
  auctionId     String
  bidderId      String
  bidderDisplay String?
  amount        Decimal  @db.Decimal(15, 2)
  timestamp     DateTime @default(now()) @db.DateTime(3)
  // Relations
  lot           Lot      @relation(fields: [lotId], references: [id], onDelete: Cascade)
  bidder        User     @relation(fields: [bidderId], references: [id], onDelete: Cascade)
  auction       Auction  @relation(fields: [auctionId], references: [id], onDelete: Cascade)

  @@index([lotId])
  @@index([bidderId])
  @@index([auctionId])
}

model UserWin {
  id               String               @id @default(uuid())
  lotId            String               @unique
  userId           String
  winningBidAmount Decimal              @db.Decimal(15, 2)
  winDate          DateTime             @default(now()) @db.DateTime(3)
  paymentStatus    PaymentStatus        @default(PENDENTE)
  invoiceUrl       String?
  // Relations
  lot              Lot                  @relation("LotWin", fields: [lotId], references: [id])
  user             User                 @relation("UserWinToUser", fields: [userId], references: [id])
  installments     InstallmentPayment[]

  @@index([userId])
}

model InstallmentPayment {
  id                String        @id @default(uuid())
  userWinId         String
  installmentNumber Int
  amount            Decimal       @db.Decimal(15, 2)
  dueDate           DateTime      @db.DateTime(3)
  status            PaymentStatus @default(PENDENTE)
  paymentDate       DateTime?     @db.DateTime(3)
  paymentMethod     String?
  transactionId     String?
  // Relations
  win               UserWin       @relation(fields: [userWinId], references: [id], onDelete: Cascade)

  @@index([userWinId])
}

model UserLotMaxBid {
  id        String   @id @default(uuid())
  userId    String
  lotId     String
  maxAmount Decimal  @db.Decimal(15, 2)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now()) @db.DateTime(3)
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lot       Lot      @relation(fields: [lotId], references: [id], onDelete: Cascade)

  @@unique([userId, lotId])
  @@index([lotId])
}

model MediaItem {
  id                String           @id @default(uuid())
  fileName          String
  storagePath       String
  title             String?
  altText           String?
  caption           String?          @db.VarChar(500)
  description       String?          @db.Text
  mimeType          String           @db.VarChar(100)
  sizeBytes         Int?
  urlOriginal       String
  urlThumbnail      String?
  urlMedium         String?
  urlLarge          String?
  linkedLotIds      Json?
  judicialProcessId String?
  dataAiHint        String?          @db.VarChar(100)
  uploadedByUserId  String
  uploadedAt        DateTime         @default(now()) @db.DateTime(3)
  // Relations
  uploadedBy        User             @relation(fields: [uploadedByUserId], references: [id])
  judicialProcess   JudicialProcess? @relation(fields: [judicialProcessId], references: [id], onDelete: SetNull)

  @@index([uploadedByUserId])
  @@index([judicialProcessId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  message   String
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.DateTime(3)
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model LotQuestion {
  id                      String    @id @default(uuid())
  lotId                   String
  auctionId               String
  userId                  String
  userDisplayName         String
  questionText            String    @db.Text
  answerText              String?   @db.Text
  answeredByUserId        String?
  answeredByUserDisplayName String?
  isPublic                Boolean   @default(true)
  createdAt               DateTime  @default(now()) @db.DateTime(3)
  answeredAt              DateTime? @db.DateTime(3)
  // Relations
  lot                     Lot       @relation(fields: [lotId], references: [id], onDelete: Cascade)
  user                    User      @relation(fields: [userId], references: [id])

  @@index([lotId])
}

model Review {
  id              String   @id @default(uuid())
  lotId           String
  auctionId       String
  userId          String
  userDisplayName String
  rating          Int
  comment         String   @db.Text
  createdAt       DateTime @default(now()) @db.DateTime(3)
  // Relations
  lot             Lot      @relation(fields: [lotId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id])

  @@index([lotId])
}

model DocumentType {
  id          String         @id @default(uuid())
  name        String         @db.VarChar(150)
  description String?        @db.VarChar(255)
  isRequired  Boolean        @default(true)
  appliesTo   String?
  // Relations
  documents   UserDocument[]
}

model UserDocument {
  id              String             @id @default(uuid())
  userId          String
  documentTypeId  String
  status          UserDocumentStatus @default(PENDING_ANALYSIS)
  fileUrl         String
  fileName        String?
  rejectionReason String?            @db.Text
  // Relations
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  documentType    DocumentType       @relation(fields: [documentTypeId], references: [id], onDelete: Cascade)

  @@unique([userId, documentTypeId])
  @@index([documentTypeId])
}

model DirectSaleOffer {
  id                   String                @id @default(uuid())
  publicId             String?               @unique @db.VarChar(100)
  title                String                @db.VarChar(255)
  description          String?               @db.Text
  offerType            DirectSaleOfferType
  price                Decimal?              @db.Decimal(15, 2)
  minimumOfferPrice    Decimal?              @db.Decimal(15, 2)
  status               DirectSaleOfferStatus @default(ACTIVE)
  categoryName         String?               @db.VarChar(100)
  categoryId           String
  sellerId             String
  sellerName           String?               @db.VarChar(150)
  sellerLogoUrl        String?               @db.VarChar(191)
  dataAiHintSellerLogo String?               @db.VarChar(100)
  locationCity         String?               @db.VarChar(100)
  locationState        String?               @db.VarChar(100)
  imageUrl             String?               @db.VarChar(191)
  imageMediaId         String?               @db.VarChar(191)
  dataAiHint           String?               @db.VarChar(100)
  galleryImageUrls     Json?
  mediaItemIds         Json?
  itemsIncluded        Json?
  views                Int?                  @default(0)
  expiresAt            DateTime?             @db.DateTime(3)
  createdAt            DateTime              @default(now()) @db.DateTime(3)
  updatedAt            DateTime              @updatedAt @db.DateTime(3)
  // Relations
  category             LotCategory           @relation(fields: [categoryId], references: [id])
  seller               Seller                @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([categoryId])
  @@index([sellerId])
}

model DocumentTemplate {
  id        String               @id @default(uuid())
  name      String               @db.VarChar(150)
  type      DocumentTemplateType
  content   String?              @db.Text
  createdAt DateTime             @default(now()) @db.DateTime(3)
  updatedAt DateTime             @updatedAt @db.DateTime(3)
}

model ContactMessage {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(150)
  email     String   @db.VarChar(150)
  subject   String?
  message   String   @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.DateTime(3)
}

model PlatformSettings {
  id                         String    @id @default("global")
  siteTitle                  String?
  siteTagline                String?
  logoUrl                    String?
  faviconUrl                 String?
  galleryImageBasePath       String?
  storageProvider            String?
  firebaseStorageBucket      String?
  activeThemeName            String?
  themes                     Json?
  platformPublicIdMasks      Json?
  homepageSections           Json?
  mentalTriggerSettings      Json?
  sectionBadgeVisibility     Json?
  mapSettings                Json?
  searchPaginationType       String?
  searchItemsPerPage         Int?
  searchLoadMoreCount        Int?
  showCountdownOnLotDetail   Boolean?
  showCountdownOnCards       Boolean?
  showRelatedLotsOnLotDetail Boolean?
  relatedLotsCount           Int?
  defaultUrgencyTimerHours   Int?
  variableIncrementTable     Json?
  biddingSettings            Json?
  paymentGatewaySettings     Json?
  defaultListItemsPerPage    Int?
  updatedAt                  DateTime? @updatedAt @db.DateTime(3)
}

model VehicleMake {
  id     String         @id @default(uuid())
  name   String         @unique
  slug   String         @unique
  // Relations
  models VehicleModel[]
}

model VehicleModel {
  id     String      @id @default(uuid())
  name   String
  slug   String
  makeId String
  // Relations
  make   VehicleMake @relation(fields: [makeId], references: [id], onDelete: Cascade)

  @@unique([name, makeId])
  @@index([makeId])
}
```