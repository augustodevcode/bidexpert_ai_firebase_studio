// src/app/api/v1/admin/tenant/provision/route.ts
/**
 * @fileoverview API de Provisionamento de Tenant para Control Plane (BidExpertCRM).
 * 
 * Este endpoint é chamado pelo CRM quando um novo cliente se registra e paga.
 * Ele cria o tenant completo com todas as configurações iniciais.
 * 
 * FLUXO:
 * 1. CRM recebe pagamento confirmado
 * 2. CRM chama POST /api/v1/admin/tenant/provision
 * 3. BidExpert cria: Tenant, PlatformSettings, User Admin, UsersOnTenants
 * 4. Retorna URL de acesso e credenciais
 * 
 * SEGURANÇA:
 * - Protegido por ADMIN_API_KEY (header Authorization: Bearer <key>)
 * - Apenas o Control Plane deve ter acesso a esta key
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';
import { slugify } from '@/lib/ui-helpers';
import { hashPassword } from '@/server/lib/password';
import { 
  generateDomainVerifyToken, 
  generateTenantApiKey, 
  calculateTrialExpiration,
  invalidateTenantCache 
} from '@/server/lib/tenant-context';

// Tipo para cliente de transação Prisma
type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ============================================================================
// Schema de Validação
// ============================================================================

const provisionTenantSchema = z.object({
  // Identificação do Tenant
  name: z.string().min(3, "Nome do tenant deve ter no mínimo 3 caracteres."),
  subdomain: z.string()
    .min(3, "Subdomínio deve ter no mínimo 3 caracteres.")
    .max(50, "Subdomínio deve ter no máximo 50 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Subdomínio pode conter apenas letras minúsculas, números e hífens."),
  
  // Estratégia de Resolução de URL
  resolutionStrategy: z.enum(['SUBDOMAIN', 'PATH', 'CUSTOM_DOMAIN']).default('SUBDOMAIN'),
  customDomain: z.string().optional(),
  
  // Plano e Status
  planId: z.string().optional(),
  status: z.enum(['PENDING', 'TRIAL', 'ACTIVE']).default('TRIAL'),
  
  // Limites
  maxUsers: z.number().int().positive().optional(),
  maxStorageBytes: z.number().int().positive().optional(),
  maxAuctions: z.number().int().positive().optional(),
  
  // ID externo do CRM
  externalId: z.string().optional(),
  
  // Webhook para notificações
  webhookUrl: z.string().url().optional(),
  
  // Metadados customizados
  metadata: z.record(z.any()).optional(),
  
  // Usuário Administrador (obrigatório)
  adminUser: z.object({
    email: z.string().email("Email do administrador inválido."),
    fullName: z.string().min(3, "Nome completo do administrador é obrigatório."),
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres.").optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  }),
  
  // Configurações iniciais de branding (opcional)
  branding: z.object({
    siteTitle: z.string().optional(),
    siteTagline: z.string().optional(),
    logoUrl: z.string().url().optional(),
    faviconUrl: z.string().url().optional(),
    primaryColorHsl: z.string().optional(),
    secondaryColorHsl: z.string().optional(),
  }).optional(),
});

export type ProvisionTenantInput = z.infer<typeof provisionTenantSchema>;

// ============================================================================
// Handler POST - Provisionar Novo Tenant
// ============================================================================

export async function POST(request: NextRequest) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return authResult.error!;
  }

  try {
    // 2. Parse e validar body
    const body = await request.json();
    const validation = provisionTenantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dados de provisionamento inválidos.',
        details: validation.error.flatten(),
      }, { status: 400 });
    }

    const data = validation.data;
    const cleanSubdomain = slugify(data.subdomain);

    // 3. Verificar se subdomínio já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: cleanSubdomain },
    });

    if (existingTenant) {
      return NextResponse.json({
        success: false,
        error: 'SUBDOMAIN_EXISTS',
        message: `O subdomínio '${cleanSubdomain}' já está em uso.`,
      }, { status: 409 });
    }

    // 4. Verificar se externalId já existe (se fornecido)
    if (data.externalId) {
      const existingExternal = await prisma.tenant.findUnique({
        where: { externalId: data.externalId },
      });

      if (existingExternal) {
        return NextResponse.json({
          success: false,
          error: 'EXTERNAL_ID_EXISTS',
          message: `O externalId '${data.externalId}' já está em uso.`,
        }, { status: 409 });
      }
    }

    // 5. Verificar se email do admin já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminUser.email },
    });

    // 6. Buscar role ADMIN
    const adminRole = await prisma.role.findFirst({
      where: { 
        OR: [
          { nameNormalized: 'ADMIN' },
          { nameNormalized: 'ADMINISTRATOR' },
          { name: 'Administrador' },
        ]
      },
    });

    if (!adminRole) {
      console.error('[Provision] Role ADMIN não encontrada no sistema!');
      return NextResponse.json({
        success: false,
        error: 'ROLE_NOT_FOUND',
        message: 'Role de administrador não configurada no sistema. Execute o seed.',
      }, { status: 500 });
    }

    // 7. Criar tudo em uma transação
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 7.1 Criar Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          subdomain: cleanSubdomain,
          domain: data.customDomain?.toLowerCase() || null,
          resolutionStrategy: data.resolutionStrategy,
          customDomainVerified: false,
          customDomainVerifyToken: data.customDomain ? generateDomainVerifyToken() : null,
          status: data.status,
          trialStartedAt: data.status === 'TRIAL' ? new Date() : null,
          trialExpiresAt: data.status === 'TRIAL' ? calculateTrialExpiration() : null,
          activatedAt: data.status === 'ACTIVE' ? new Date() : null,
          planId: data.planId || null,
          maxUsers: data.maxUsers ?? 5,
          maxStorageBytes: data.maxStorageBytes ? BigInt(data.maxStorageBytes) : BigInt(1073741824),
          maxAuctions: data.maxAuctions ?? 10,
          externalId: data.externalId || null,
          apiKey: generateTenantApiKey(),
          webhookUrl: data.webhookUrl || null,
          webhookSecret: data.webhookUrl ? generateTenantApiKey() : null,
          metadata: data.metadata || null,
        },
      });

      // 7.2 Criar PlatformSettings
      await tx.platformSettings.create({
        data: {
          tenantId: tenant.id,
          siteTitle: data.branding?.siteTitle || data.name,
          siteTagline: data.branding?.siteTagline || 'Plataforma de Leilões',
          logoUrl: data.branding?.logoUrl || null,
          faviconUrl: data.branding?.faviconUrl || null,
          primaryColorHsl: data.branding?.primaryColorHsl || null,
          secondaryColorHsl: data.branding?.secondaryColorHsl || null,
          isSetupComplete: false, // Usuário vai completar o setup na primeira entrada
          enableBlockchain: false,
          enableRealtime: true,
          enableSoftClose: true,
          enableDirectSales: true,
          enableMapSearch: true,
          enableAIFeatures: false,
        },
      });

      // 7.3 Criar ou reutilizar User
      let user;
      const generatedPassword = data.adminUser.password || generateRandomPassword();
      
      if (existingUser) {
        // Usuário já existe - apenas vincular ao novo tenant
        user = existingUser;
      } else {
        // Criar novo usuário
        const hashedPassword = await hashPassword(generatedPassword);
        
        user = await tx.user.create({
          data: {
            email: data.adminUser.email,
            fullName: data.adminUser.fullName,
            password: hashedPassword,
            cpf: data.adminUser.cpf || null,
            cellPhone: data.adminUser.phone || null,
            habilitationStatus: 'HABILITADO', // Admin já vem habilitado
            accountType: 'PHYSICAL',
          },
        });
      }

      // 7.4 Vincular User ao Tenant
      await tx.usersOnTenants.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          assignedBy: 'system-provision-api',
        },
      });

      // 7.5 Vincular Role ADMIN ao User (se não tiver)
      const existingRole = await tx.usersOnRoles.findUnique({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: adminRole.id,
          },
        },
      });

      if (!existingRole) {
        await tx.usersOnRoles.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
            assignedBy: 'system-provision-api',
          },
        });
      }

      return {
        tenant,
        user,
        isNewUser: !existingUser,
        generatedPassword: !existingUser ? generatedPassword : null,
      };
    });

    // 8. Invalidar cache
    invalidateTenantCache(result.tenant.id.toString());

    // 9. Construir URL de acesso
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'bidexpert.com.br';
    let accessUrl: string;

    switch (data.resolutionStrategy) {
      case 'SUBDOMAIN':
        accessUrl = `https://${cleanSubdomain}.${appDomain}`;
        break;
      case 'PATH':
        accessUrl = `https://${appDomain}/app/${cleanSubdomain}`;
        break;
      case 'CUSTOM_DOMAIN':
        accessUrl = data.customDomain 
          ? `https://${data.customDomain}` 
          : `https://${cleanSubdomain}.${appDomain}`;
        break;
      default:
        accessUrl = `https://${cleanSubdomain}.${appDomain}`;
    }

    // 10. Retornar resultado
    return NextResponse.json({
      success: true,
      message: 'Tenant provisionado com sucesso.',
      data: {
        tenant: {
          id: result.tenant.id.toString(),
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
          domain: result.tenant.domain,
          status: result.tenant.status,
          resolutionStrategy: result.tenant.resolutionStrategy,
          apiKey: result.tenant.apiKey,
          trialExpiresAt: result.tenant.trialExpiresAt?.toISOString() || null,
          customDomainVerifyToken: result.tenant.customDomainVerifyToken,
        },
        adminUser: {
          id: result.user.id.toString(),
          email: result.user.email,
          fullName: result.user.fullName,
          isNewUser: result.isNewUser,
          // Só retorna senha se usuário foi criado agora
          temporaryPassword: result.generatedPassword,
        },
        accessUrl,
        setupUrl: `${accessUrl}/tenant-setup`,
        status: 'ready',
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Provision API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: `Erro interno ao provisionar tenant: ${error.message}`,
    }, { status: 500 });
  }
}

// ============================================================================
// Utilitários
// ============================================================================

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
