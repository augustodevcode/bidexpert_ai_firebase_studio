// types/bidexpert-crm-integration.d.ts
/**
 * @fileoverview Tipos TypeScript para integração CRM ↔ BidExpert API.
 * 
 * Use este arquivo no projeto do CRM para ter tipagem completa nas chamadas de API.
 * 
 * Instalação no CRM:
 * 1. Copie este arquivo para seu projeto
 * 2. Importe os tipos onde necessário
 * 
 * @version 2.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export type TenantStatus = 'PENDING' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type ResolutionStrategy = 'SUBDOMAIN' | 'PATH' | 'CUSTOM_DOMAIN';

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Dados do usuário administrador a ser criado junto com o tenant.
 */
export interface AdminUserInput {
  /** Email do administrador (será usado como login) */
  email: string;
  /** Nome completo do administrador */
  fullName: string;
  /** Senha (opcional - se não informada, será gerada automaticamente) */
  password?: string;
  /** CPF do administrador (opcional) */
  cpf?: string;
  /** Telefone do administrador (opcional) */
  phone?: string;
}

/**
 * Configurações de branding/visual iniciais do tenant.
 */
export interface BrandingInput {
  /** Título do site */
  siteTitle?: string;
  /** Slogan/tagline do site */
  siteTagline?: string;
  /** URL do logo (deve ser uma URL pública acessível) */
  logoUrl?: string;
  /** URL do favicon */
  faviconUrl?: string;
  /** Cor primária em formato HSL (ex: "220 70% 50%") */
  primaryColorHsl?: string;
  /** Cor secundária em formato HSL */
  secondaryColorHsl?: string;
}

/**
 * Payload para criar um novo tenant via API de provisionamento.
 */
export interface ProvisionTenantRequest {
  /** Nome do tenant/empresa (mínimo 3 caracteres) */
  name: string;
  
  /** 
   * Slug do subdomínio (apenas letras minúsculas, números e hífens)
   * Exemplo: "joao-silva" → joao-silva.bidexpert.com.br
   */
  subdomain: string;
  
  /** Estratégia de resolução de URL (default: SUBDOMAIN) */
  resolutionStrategy?: ResolutionStrategy;
  
  /** Domínio customizado (se resolutionStrategy = CUSTOM_DOMAIN) */
  customDomain?: string;
  
  /** Status inicial do tenant (default: TRIAL) */
  status?: 'PENDING' | 'TRIAL' | 'ACTIVE';
  
  /** ID do plano contratado no CRM */
  planId?: string;
  
  /** Limite máximo de usuários */
  maxUsers?: number;
  
  /** Limite de storage em bytes (default: 1GB = 1073741824) */
  maxStorageBytes?: number;
  
  /** Limite de leilões simultâneos */
  maxAuctions?: number;
  
  /** ID do cliente no CRM (para reconciliação) */
  externalId?: string;
  
  /** URL para receber webhooks de eventos do tenant */
  webhookUrl?: string;
  
  /** Metadados customizados livres */
  metadata?: Record<string, unknown>;
  
  /** Dados do usuário administrador (obrigatório) */
  adminUser: AdminUserInput;
  
  /** Configurações de branding iniciais (opcional) */
  branding?: BrandingInput;
}

/**
 * Payload para verificar disponibilidade de subdomínio.
 */
export interface CheckSubdomainRequest {
  /** Subdomínio a verificar */
  subdomain: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Informações do tenant criado.
 */
export interface TenantInfo {
  /** ID do tenant no BidExpert */
  id: string;
  /** Nome do tenant */
  name: string;
  /** Subdomínio */
  subdomain: string;
  /** Domínio customizado (se configurado) */
  domain: string | null;
  /** Status atual */
  status: TenantStatus;
  /** Estratégia de resolução de URL */
  resolutionStrategy: ResolutionStrategy;
  /** API Key do tenant (para integrações futuras) */
  apiKey: string;
  /** Data de expiração do trial (se aplicável) */
  trialExpiresAt: string | null;
  /** Token para verificação de domínio customizado */
  customDomainVerifyToken: string | null;
}

/**
 * Informações do usuário admin criado.
 */
export interface AdminUserInfo {
  /** ID do usuário no BidExpert */
  id: string;
  /** Email do usuário */
  email: string;
  /** Nome completo */
  fullName: string;
  /** Se o usuário foi criado agora (true) ou já existia (false) */
  isNewUser: boolean;
  /** Senha temporária (apenas se isNewUser = true) */
  temporaryPassword: string | null;
}

/**
 * Resposta de sucesso do provisionamento.
 */
export interface ProvisionTenantSuccessResponse {
  success: true;
  message: string;
  data: {
    tenant: TenantInfo;
    adminUser: AdminUserInfo;
    /** URL completa de acesso ao tenant */
    accessUrl: string;
    /** URL da página de setup inicial */
    setupUrl: string;
    /** Status do provisionamento */
    status: 'ready';
  };
}

/**
 * Resposta de erro do provisionamento.
 */
export interface ProvisionTenantErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR' | 'SUBDOMAIN_EXISTS' | 'EXTERNAL_ID_EXISTS' | 'ROLE_NOT_FOUND' | 'INTERNAL_ERROR' | 'UNAUTHORIZED' | 'INVALID_AUTH_FORMAT' | 'SERVER_MISCONFIGURED';
  message: string;
  details?: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
}

export type ProvisionTenantResponse = ProvisionTenantSuccessResponse | ProvisionTenantErrorResponse;

/**
 * Resposta quando subdomínio está disponível.
 */
export interface SubdomainAvailableResponse {
  available: true;
  subdomain: string;
  suggestedUrl: string;
  loginUrl: string;
}

/**
 * Resposta quando subdomínio não está disponível.
 */
export interface SubdomainUnavailableResponse {
  available: false;
  subdomain: string;
  reason: 'RESERVED' | 'IN_USE';
  message: string;
  suggestions: string[];
  suggestedUrl: null;
}

export type CheckSubdomainResponse = SubdomainAvailableResponse | SubdomainUnavailableResponse;

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export type TenantEventType = 
  | 'tenant.created'
  | 'tenant.activated'
  | 'tenant.trial_expiring'
  | 'tenant.trial_expired'
  | 'tenant.suspended'
  | 'tenant.deleted';

/**
 * Payload de webhook enviado pelo BidExpert para o CRM.
 */
export interface TenantWebhookPayload {
  /** Tipo do evento */
  event: TenantEventType;
  /** ID do tenant */
  tenantId: string;
  /** Subdomínio do tenant */
  subdomain: string;
  /** ID externo (se configurado) */
  externalId: string | null;
  /** Dados específicos do evento */
  data: Record<string, unknown>;
  /** Timestamp do evento em ISO 8601 */
  timestamp: string;
}

// ============================================================================
// CLIENT CLASS INTERFACE
// ============================================================================

/**
 * Interface para o cliente de integração BidExpert.
 */
export interface IBidExpertCRMClient {
  /**
   * Provisiona um novo tenant com usuário admin.
   */
  provisionTenant(data: ProvisionTenantRequest): Promise<ProvisionTenantResponse>;
  
  /**
   * Verifica se um subdomínio está disponível.
   */
  checkSubdomain(subdomain: string): Promise<CheckSubdomainResponse>;
  
  /**
   * Gera um slug válido a partir de um nome.
   */
  generateSubdomain(name: string): string;
}
