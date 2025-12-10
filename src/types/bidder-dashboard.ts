// src/types/bidder-dashboard.ts
/**
 * @fileoverview Tipos TypeScript para o sistema de painel do arrematante (bidder dashboard)
 * Define todas as interfaces e enums necessários para o funcionamento do dashboard
 * IDs usam bigint conforme diretriz do projeto
 */

import { Decimal } from '@prisma/client/runtime/library';

// -----------------------------
// Enums
// -----------------------------
export enum BidderDocumentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum BidderNotificationType {
  AUCTION_WON = 'AUCTION_WON',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  AUCTION_ENDING = 'AUCTION_ENDING',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum ParticipationResult {
  WON = 'WON',
  LOST = 'LOST',
  WITHDRAWN = 'WITHDRAWN'
}

export enum WonLotStatus {
  WON = 'WON',
  PAID = 'PAID',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}

// -----------------------------
// Interfaces
// -----------------------------
export interface BidderProfile {
  id: bigint;
  userId: bigint;
  fullName?: string;
  cpf?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  documentStatus: BidderDocumentStatus;
  submittedDocuments?: any;
  emailNotifications: boolean;
  smsNotifications: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WonLot {
  id: bigint;
  bidderId: bigint;
  lotId: bigint;
  auctionId: bigint;
  title: string;
  finalBid: Decimal;
  wonAt: Date;
  status: WonLotStatus;
  paymentStatus: string; // PaymentStatus enum
  totalAmount: Decimal;
  paidAmount: Decimal;
  dueDate?: Date;
  deliveryStatus: DeliveryStatus;
  trackingCode?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BidderNotification {
  id: bigint;
  bidderId: bigint;
  type: BidderNotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface PaymentMethod {
  id: bigint;
  bidderId: bigint;
  type: PaymentMethodType;
  isDefault: boolean;
  cardLast4?: string;
  cardBrand?: string;
  cardToken?: string;
  pixKey?: string;
  pixKeyType?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipationHistory {
  id: bigint;
  bidderId: bigint;
  lotId: bigint;
  auctionId: bigint;
  title: string;
  auctionName: string;
  maxBid?: Decimal;
  finalBid?: Decimal;
  result: ParticipationResult;
  participatedAt: Date;
  bidCount: number;
  createdAt: Date;
}

// Interface para habilitação em leilão
export interface AuctionHabilitation {
  id: string;
  auctionId: string;
  auctionPublicId?: string;
  auctionTitle: string;
  auctionDate?: Date | null;
  auctionStatus: string;
  habilitatedAt: Date;
  isActive: boolean;
}

// Interface para lance máximo configurado
export interface ActiveMaxBid {
  id: string;
  lotId: string;
  lotPublicId?: string;
  lotTitle: string;
  auctionId: string;
  auctionTitle: string;
  maxAmount: number;
  currentBid?: number | null;
  isActive: boolean;
  lotStatus: string;
  createdAt: Date;
  updatedAt?: Date;
}

// -----------------------------
// Dashboard Overview Types
// -----------------------------
export interface BidderDashboardOverview {
  wonLotsCount: number;
  totalSpent: Decimal;
  pendingPayments: number;
  overduePayments: number;
  documentsPending: number;
  unreadNotifications: number;
  recentWonLots: WonLot[];
  recentNotifications: BidderNotification[];
  paymentSummary: {
    totalPending: Decimal;
    totalOverdue: Decimal;
    nextDueDate?: Date | null;
  };
  // Novas propriedades para habilitações e lances máximos
  auctionHabilitations?: AuctionHabilitation[];
  activeMaxBids?: ActiveMaxBid[];
}

// -----------------------------
// API Request/Response Types
// -----------------------------
export interface CreateBidderProfileRequest {
  fullName?: string;
  cpf?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface UpdateBidderProfileRequest extends CreateBidderProfileRequest {
  documentStatus?: BidderDocumentStatus;
  isActive?: boolean;
}

export interface CreatePaymentMethodRequest {
  type: PaymentMethodType;
  isDefault?: boolean;
  cardLast4?: string;
  cardBrand?: string;
  cardToken?: string;
  pixKey?: string;
  pixKeyType?: string;
}

export interface UpdatePaymentMethodRequest extends CreatePaymentMethodRequest {
  isActive?: boolean;
}

export interface SubmitDocumentRequest {
  documentType: string; // DocumentType.name
  fileName: string;
  fileUrl: string;
  fileSize?: number;
}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}

export interface PayWonLotRequest {
  wonLotId: string;
  paymentMethodId: string;
  amount?: Decimal; // Optional for full payment
}

export interface GenerateBoletoRequest {
  wonLotId: string;
  dueDate?: Date;
}

// -----------------------------
// API Response Types
// -----------------------------
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface WonLotsResponse extends PaginatedResponse<WonLot> {
  summary: {
    totalWon: number;
    totalSpent: Decimal;
    pendingPayments: number;
    paidLots: number;
  };
}

export interface PaymentMethodsResponse {
  methods: PaymentMethod[];
  defaultMethod?: PaymentMethod;
}

export interface NotificationsResponse extends PaginatedResponse<BidderNotification> {
  unreadCount: number;
}

export interface ParticipationHistoryResponse extends PaginatedResponse<ParticipationHistory> {
  summary: {
    totalParticipations: number;
    totalWon: number;
    totalLost: number;
    winRate: number;
    totalSpent: Decimal;
    averageBid: Decimal;
  };
}

export interface BoletoResponse {
  boletoUrl: string;
  dueDate: Date;
  barcode: string;
  amount: Decimal;
  instructions: string;
}

// -----------------------------
// Form Types
// -----------------------------
export interface BidderProfileFormData {
  fullName: string;
  cpf: string;
  phone: string;
  dateOfBirth: Date;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface PaymentMethodFormData {
  type: PaymentMethodType;
  isDefault: boolean;
  // Credit Card fields
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardHolderName?: string;
  // PIX fields
  pixKey?: string;
  pixKeyType?: string;
}

export interface DocumentUploadFormData {
  documentType: string;
  file: File;
  description?: string;
}

// -----------------------------
// Component Props Types
// -----------------------------
export interface WonLotCardProps {
  wonLot: WonLot;
  onPay?: (wonLotId: string) => void;
  onViewDetails?: (wonLotId: string) => void;
  onGenerateBoleto?: (wonLotId: string) => void;
  onTrackDelivery?: (wonLotId: string) => void;
}

export interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  isDefault: boolean;
  onSetDefault?: (paymentMethodId: string) => void;
  onEdit?: (paymentMethodId: string) => void;
  onDelete?: (paymentMethodId: string) => void;
}

export interface NotificationItemProps {
  notification: BidderNotification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
}

export interface ParticipationHistoryItemProps {
  participation: ParticipationHistory;
  onViewDetails?: (participationId: string) => void;
}

// -----------------------------
// Filter and Sort Types
// -----------------------------
export interface WonLotsFilters {
  status?: WonLotStatus[];
  paymentStatus?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

export interface ParticipationHistoryFilters {
  result?: ParticipationResult[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

export interface NotificationsFilters {
  type?: BidderNotificationType[];
  isRead?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export type WonLotsSortField = 'wonAt' | 'title' | 'finalBid' | 'status' | 'paymentStatus';
export type ParticipationHistorySortField = 'participatedAt' | 'title' | 'maxBid' | 'result';
export type NotificationsSortField = 'createdAt' | 'type' | 'isRead';

export interface SortConfig<T> {
  field: T;
  direction: 'asc' | 'desc';
}

// -----------------------------
// Hook Return Types
// -----------------------------
export interface UseBidderDashboardReturn {
  overview: BidderDashboardOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseWonLotsReturn {
  wonLots: WonLot[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<WonLot>['pagination'] | null;
  filters: WonLotsFilters;
  sort: SortConfig<WonLotsSortField>;
  setFilters: (filters: WonLotsFilters) => void;
  setSort: (sort: SortConfig<WonLotsSortField>) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  defaultMethod: PaymentMethod | null;
  loading: boolean;
  error: string | null;
  createMethod: (data: CreatePaymentMethodRequest) => Promise<ApiResponse<PaymentMethod>>;
  updateMethod: (id: string, data: UpdatePaymentMethodRequest) => Promise<ApiResponse<PaymentMethod>>;
  deleteMethod: (id: string) => Promise<ApiResponse<void>>;
  setDefault: (id: string) => Promise<ApiResponse<void>>;
  refresh: () => Promise<void>;
}

export interface UseNotificationsReturn {
  notifications: BidderNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<BidderNotification>['pagination'] | null;
  filters: NotificationsFilters;
  sort: SortConfig<NotificationsSortField>;
  setFilters: (filters: NotificationsFilters) => void;
  setSort: (sort: SortConfig<NotificationsSortField>) => void;
  markAsRead: (ids: string[]) => Promise<ApiResponse<void>>;
  markAllAsRead: () => Promise<ApiResponse<void>>;
  delete: (id: string) => Promise<ApiResponse<void>>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseParticipationHistoryReturn {
  participations: ParticipationHistory[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<ParticipationHistory>['pagination'] | null;
  summary: ParticipationHistoryResponse['summary'] | null;
  filters: ParticipationHistoryFilters;
  sort: SortConfig<ParticipationHistorySortField>;
  setFilters: (filters: ParticipationHistoryFilters) => void;
  setSort: (sort: SortConfig<ParticipationHistorySortField>) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// -----------------------------
// Admin Impersonation Types
// -----------------------------
export interface AdminImpersonationState {
  isImpersonating: boolean;
  targetBidder: BidderProfile | null;
  originalUser: any | null; // Admin user data
}

export interface AdminBidderViewData {
  bidder: BidderProfile;
  overview: BidderDashboardOverview;
  wonLots: WonLot[];
  paymentMethods: PaymentMethod[];
  notifications: BidderNotification[];
  participationHistory: ParticipationHistory[];
  metrics: {
    totalWonLots: number;
    totalSpent: Decimal;
    averageBid: Decimal;
    winRate: number;
    paymentCompliance: number;
    documentCompletion: number;
    lastActivity: Date;
  };
}

// -----------------------------
// Validation Types
// -----------------------------
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// -----------------------------
// Utility Types
// -----------------------------
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];
