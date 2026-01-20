// bidexpert-crm-client.ts
/**
 * @fileoverview Cliente TypeScript para integração CRM ↔ BidExpert API.
 * 
 * Este arquivo pode ser copiado diretamente para o projeto do CRM.
 * 
 * INSTALAÇÃO:
 * 1. Copie este arquivo para seu projeto CRM
 * 2. Configure a variável de ambiente BIDEXPERT_ADMIN_API_KEY
 * 3. Configure BIDEXPERT_API_URL (opcional, default: https://bidexpert.com.br)
 * 
 * USO:
 * ```typescript
 * const client = new BidExpertCRMClient();
 * 
 * // Verificar subdomínio disponível
 * const check = await client.checkSubdomain('joao-silva');
 * 
 * // Provisionar tenant
 * const result = await client.provisionTenant({
 *   name: 'Leiloeiro João Silva',
 *   subdomain: 'joao-silva',
 *   adminUser: {
 *     email: 'joao@email.com',
 *     fullName: 'João Silva'
 *   }
 * });
 * 
 * // Redirecionar cliente
 * window.location.href = result.data.accessUrl;
 * ```
 * 
 * @version 2.0.0
 */

// ============================================================================
// TIPOS (inline para facilitar cópia)
// ============================================================================

export type TenantStatus = 'PENDING' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type ResolutionStrategy = 'SUBDOMAIN' | 'PATH' | 'CUSTOM_DOMAIN';

export interface AdminUserInput {
  email: string;
  fullName: string;
  password?: string;
  cpf?: string;
  phone?: string;
}

export interface BrandingInput {
  siteTitle?: string;
  siteTagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColorHsl?: string;
  secondaryColorHsl?: string;
}

export interface ProvisionTenantRequest {
  name: string;
  subdomain: string;
  resolutionStrategy?: ResolutionStrategy;
  customDomain?: string;
  status?: 'PENDING' | 'TRIAL' | 'ACTIVE';
  planId?: string;
  maxUsers?: number;
  maxStorageBytes?: number;
  maxAuctions?: number;
  externalId?: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  adminUser: AdminUserInput;
  branding?: BrandingInput;
}

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  status: TenantStatus;
  resolutionStrategy: ResolutionStrategy;
  apiKey: string;
  trialExpiresAt: string | null;
  customDomainVerifyToken: string | null;
}

export interface AdminUserInfo {
  id: string;
  email: string;
  fullName: string;
  isNewUser: boolean;
  temporaryPassword: string | null;
}

export interface ProvisionTenantSuccessResponse {
  success: true;
  message: string;
  data: {
    tenant: TenantInfo;
    adminUser: AdminUserInfo;
    accessUrl: string;
    setupUrl: string;
    status: 'ready';
  };
}

export interface ProvisionTenantErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
}

export type ProvisionTenantResponse = ProvisionTenantSuccessResponse | ProvisionTenantErrorResponse;

export interface SubdomainAvailableResponse {
  available: true;
  subdomain: string;
  suggestedUrl: string;
  loginUrl: string;
}

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
// EXCEÇÕES CUSTOMIZADAS
// ============================================================================

export class BidExpertAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'BidExpertAPIError';
  }
}

export class SubdomainUnavailableError extends BidExpertAPIError {
  constructor(
    subdomain: string,
    public readonly suggestions: string[]
  ) {
    super(
      `O subdomínio '${subdomain}' não está disponível.`,
      'SUBDOMAIN_UNAVAILABLE',
      409
    );
    this.name = 'SubdomainUnavailableError';
  }
}

// ============================================================================
// CLIENTE DE INTEGRAÇÃO
// ============================================================================

export interface BidExpertCRMClientConfig {
  /** URL base da API BidExpert (default: process.env.BIDEXPERT_API_URL ou https://bidexpert.com.br) */
  apiUrl?: string;
  /** API Key administrativa (default: process.env.BIDEXPERT_ADMIN_API_KEY) */
  adminApiKey?: string;
  /** Timeout em ms para requisições (default: 30000) */
  timeout?: number;
}

export class BidExpertCRMClient {
  private readonly apiUrl: string;
  private readonly adminApiKey: string;
  private readonly timeout: number;

  constructor(config: BidExpertCRMClientConfig = {}) {
    this.apiUrl = config.apiUrl || process.env.BIDEXPERT_API_URL || 'https://bidexpert.com.br';
    this.adminApiKey = config.adminApiKey || process.env.BIDEXPERT_ADMIN_API_KEY || '';
    this.timeout = config.timeout || 30000;

    if (!this.adminApiKey) {
      console.warn('[BidExpertCRMClient] AVISO: BIDEXPERT_ADMIN_API_KEY não configurada!');
    }
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS
  // ==========================================================================

  /**
   * Provisiona um novo tenant com usuário administrador.
   * 
   * @param data Dados do tenant e admin
   * @returns Informações do tenant criado incluindo URL de acesso
   * @throws BidExpertAPIError em caso de erro
   * 
   * @example
   * ```typescript
   * const result = await client.provisionTenant({
   *   name: 'Empresa XYZ',
   *   subdomain: 'empresa-xyz',
   *   status: 'TRIAL',
   *   adminUser: {
   *     email: 'admin@empresa.com',
   *     fullName: 'Administrador'
   *   }
   * });
   * 
   * console.log(result.data.accessUrl); // https://empresa-xyz.bidexpert.com.br
   * ```
   */
  async provisionTenant(data: ProvisionTenantRequest): Promise<ProvisionTenantSuccessResponse> {
    // Normaliza o subdomínio antes de enviar
    const normalizedData = {
      ...data,
      subdomain: this.generateSubdomain(data.subdomain),
    };

    const response = await this.request<ProvisionTenantResponse>(
      '/api/v1/admin/tenant/provision',
      {
        method: 'POST',
        body: JSON.stringify(normalizedData),
      }
    );

    if (!response.success) {
      throw new BidExpertAPIError(
        response.message,
        response.error,
        400,
        response.details
      );
    }

    return response;
  }

  /**
   * Verifica se um subdomínio está disponível para uso.
   * 
   * @param subdomain Subdomínio a verificar
   * @returns Informações de disponibilidade e sugestões
   * 
   * @example
   * ```typescript
   * const check = await client.checkSubdomain('empresa-xyz');
   * 
   * if (check.available) {
   *   console.log('Disponível:', check.suggestedUrl);
   * } else {
   *   console.log('Indisponível. Sugestões:', check.suggestions);
   * }
   * ```
   */
  async checkSubdomain(subdomain: string): Promise<CheckSubdomainResponse> {
    const normalized = this.generateSubdomain(subdomain);
    
    return this.request<CheckSubdomainResponse>(
      `/api/v1/admin/tenant/check-subdomain?subdomain=${encodeURIComponent(normalized)}`,
      { method: 'GET' }
    );
  }

  /**
   * Verifica disponibilidade e retorna o subdomínio ou lança erro com sugestões.
   * 
   * @param subdomain Subdomínio desejado
   * @returns Subdomínio normalizado se disponível
   * @throws SubdomainUnavailableError se não disponível
   * 
   * @example
   * ```typescript
   * try {
   *   const available = await client.ensureSubdomainAvailable('empresa-xyz');
   *   // Prosseguir com provisionamento
   * } catch (error) {
   *   if (error instanceof SubdomainUnavailableError) {
   *     // Mostrar sugestões ao usuário
   *     console.log('Sugestões:', error.suggestions);
   *   }
   * }
   * ```
   */
  async ensureSubdomainAvailable(subdomain: string): Promise<string> {
    const check = await this.checkSubdomain(subdomain);

    if (!check.available) {
      throw new SubdomainUnavailableError(check.subdomain, check.suggestions);
    }

    return check.subdomain;
  }

  /**
   * Gera um slug de subdomínio válido a partir de um nome.
   * 
   * @param name Nome para converter em slug
   * @returns Slug válido para uso como subdomínio
   * 
   * @example
   * ```typescript
   * client.generateSubdomain('João Silva Leilões'); // 'joao-silva-leiloes'
   * client.generateSubdomain('Empresa & Cia'); // 'empresa-cia'
   * ```
   */
  generateSubdomain(name: string): string {
    if (!name) return '';
    
    return name
      .toString()
      .toLowerCase()
      .trim()
      // Remove acentos
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Substitui espaços e caracteres especiais por hífen
      .replace(/[^a-z0-9]+/g, '-')
      // Remove hífens duplicados
      .replace(/-+/g, '-')
      // Remove hífens no início e fim
      .replace(/^-+|-+$/g, '')
      // Limita a 50 caracteres
      .substring(0, 50);
  }

  /**
   * Fluxo completo: verifica disponibilidade e provisiona.
   * Útil para simplificar o código do checkout.
   * 
   * @param data Dados do tenant (subdomain será gerado do name se não informado)
   * @returns Resultado do provisionamento
   * 
   * @example
   * ```typescript
   * const result = await client.checkAndProvision({
   *   name: 'Empresa XYZ',
   *   adminUser: { email: 'admin@xyz.com', fullName: 'Admin' }
   * });
   * 
   * // Redirecionar
   * window.location.href = result.data.accessUrl;
   * ```
   */
  async checkAndProvision(
    data: Omit<ProvisionTenantRequest, 'subdomain'> & { subdomain?: string }
  ): Promise<ProvisionTenantSuccessResponse> {
    // Gera subdomain do nome se não informado
    const subdomain = data.subdomain || this.generateSubdomain(data.name);

    // Verifica disponibilidade primeiro
    await this.ensureSubdomainAvailable(subdomain);

    // Provisiona
    return this.provisionTenant({
      ...data,
      subdomain,
    });
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS
  // ==========================================================================

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.adminApiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok && !data.success) {
        throw new BidExpertAPIError(
          data.message || 'Erro desconhecido na API',
          data.error || 'UNKNOWN_ERROR',
          response.status,
          data.details
        );
      }

      return data as T;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof BidExpertAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new BidExpertAPIError(
            'Timeout na requisição à API BidExpert',
            'TIMEOUT',
            408
          );
        }
        throw new BidExpertAPIError(
          `Erro de rede: ${error.message}`,
          'NETWORK_ERROR',
          0
        );
      }

      throw new BidExpertAPIError(
        'Erro desconhecido',
        'UNKNOWN_ERROR',
        0
      );
    }
  }
}

// ============================================================================
// EXEMPLO DE USO NO CHECKOUT DO CRM
// ============================================================================

/**
 * Exemplo de função de checkout que integra com BidExpert.
 * 
 * ESTE É APENAS UM EXEMPLO - adapte para seu projeto!
 */
export async function exampleCheckoutFlow(customerData: {
  companyName: string;
  adminEmail: string;
  adminName: string;
  planId: string;
  crmCustomerId: string;
}) {
  const client = new BidExpertCRMClient();

  try {
    // 1. Gera subdomínio a partir do nome da empresa
    const subdomain = client.generateSubdomain(customerData.companyName);

    // 2. Verifica disponibilidade (opcional, mas recomendado)
    const availability = await client.checkSubdomain(subdomain);
    
    if (!availability.available) {
      // Mostrar sugestões ao usuário e pedir para escolher
      console.log('Subdomínio indisponível. Sugestões:', availability.suggestions);
      return {
        success: false,
        error: 'SUBDOMAIN_UNAVAILABLE',
        suggestions: availability.suggestions,
      };
    }

    // 3. Provisiona o tenant
    const result = await client.provisionTenant({
      name: customerData.companyName,
      subdomain,
      status: 'TRIAL',
      planId: customerData.planId,
      externalId: customerData.crmCustomerId,
      adminUser: {
        email: customerData.adminEmail,
        fullName: customerData.adminName,
      },
    });

    // 4. Salvar informações no CRM
    console.log('Tenant criado:', {
      tenantId: result.data.tenant.id,
      subdomain: result.data.tenant.subdomain,
      apiKey: result.data.tenant.apiKey,
      accessUrl: result.data.accessUrl,
    });

    // 5. Enviar email de boas-vindas
    console.log('Enviar email para:', customerData.adminEmail, {
      accessUrl: result.data.accessUrl,
      temporaryPassword: result.data.adminUser.temporaryPassword,
    });

    // 6. Retornar URL para redirecionamento
    return {
      success: true,
      redirectUrl: result.data.accessUrl,
      tenantId: result.data.tenant.id,
    };

  } catch (error) {
    if (error instanceof SubdomainUnavailableError) {
      return {
        success: false,
        error: 'SUBDOMAIN_UNAVAILABLE',
        suggestions: error.suggestions,
      };
    }

    if (error instanceof BidExpertAPIError) {
      console.error('Erro BidExpert:', error.code, error.message);
      return {
        success: false,
        error: error.code,
        message: error.message,
      };
    }

    throw error;
  }
}

// Export default para facilitar import
export default BidExpertCRMClient;
