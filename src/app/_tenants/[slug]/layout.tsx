// src/app/_tenants/[slug]/layout.tsx
/**
 * @fileoverview Layout para tenants acessados via path-based routing.
 * 
 * Este layout é usado quando um tenant é acessado via:
 * - bidexpert.com.br/app/[tenant-slug]/...
 * 
 * O middleware reescreve a URL para /_tenants/[slug]/...
 * mantendo a URL original visível para o usuário.
 * 
 * FUNCIONALIDADES:
 * - Resolve o tenant pelo slug
 * - Injeta tema customizado (CSS variables)
 * - Valida status do tenant (trial expirado, suspenso, etc.)
 * - Redireciona para setup se não configurado
 */

import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { TenantThemeStyle, TenantHeadScripts } from '@/components/tenant-theme-provider';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

async function getTenantBySlug(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: slug.toLowerCase() },
    include: { settings: true },
  });
  return tenant;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = params;
  
  // Resolve o tenant
  const tenant = await getTenantBySlug(slug);
  
  if (!tenant) {
    notFound();
  }

  // Verifica status do tenant
  if (tenant.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Conta Suspensa
          </h1>
          <p className="text-muted-foreground">
            Esta conta foi suspensa. Entre em contato com o suporte para mais informações.
          </p>
          {tenant.suspendedReason && (
            <p className="mt-4 text-sm text-muted-foreground">
              Motivo: {tenant.suspendedReason}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (tenant.status === 'CANCELLED' || tenant.status === 'EXPIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Conta Inativa
          </h1>
          <p className="text-muted-foreground">
            Esta conta não está mais ativa. Entre em contato com o suporte para reativar.
          </p>
        </div>
      </div>
    );
  }

  // Verifica se trial expirou
  if (tenant.status === 'TRIAL' && tenant.trialExpiresAt && new Date() > tenant.trialExpiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">
            Período de Avaliação Expirado
          </h1>
          <p className="text-muted-foreground mb-4">
            Seu período de avaliação gratuita terminou. Para continuar usando o BidExpert,
            é necessário assinar um plano.
          </p>
          <a 
            href={process.env.CRM_UPGRADE_URL || 'https://bidexpert.com.br/pricing'}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Ver Planos
          </a>
        </div>
      </div>
    );
  }

  // Prepara configurações de tema
  const themeConfig = tenant.settings ? {
    primaryColorHsl: tenant.settings.primaryColorHsl,
    primaryForegroundHsl: tenant.settings.primaryForegroundHsl,
    secondaryColorHsl: tenant.settings.secondaryColorHsl,
    secondaryForegroundHsl: tenant.settings.secondaryForegroundHsl,
    accentColorHsl: tenant.settings.accentColorHsl,
    accentForegroundHsl: tenant.settings.accentForegroundHsl,
    destructiveColorHsl: tenant.settings.destructiveColorHsl,
    mutedColorHsl: tenant.settings.mutedColorHsl,
    backgroundColorHsl: tenant.settings.backgroundColorHsl,
    foregroundColorHsl: tenant.settings.foregroundColorHsl,
    borderColorHsl: tenant.settings.borderColorHsl,
    radiusValue: tenant.settings.radiusValue,
    customCss: tenant.settings.customCss,
    customFontUrl: tenant.settings.customFontUrl,
  } : null;

  return (
    <>
      {/* Injeta o tema customizado do tenant */}
      <TenantThemeStyle config={themeConfig} />
      
      {/* Scripts customizados do tenant (use com cuidado!) */}
      {tenant.settings?.customHeadScripts && (
        <TenantHeadScripts scripts={tenant.settings.customHeadScripts} />
      )}
      
      {/* Conteúdo do tenant */}
      {children}
    </>
  );
}

/**
 * Gera metadata dinâmica baseada no tenant.
 */
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const tenant = await getTenantBySlug(params.slug);
  
  if (!tenant) {
    return {
      title: 'Tenant não encontrado',
    };
  }

  return {
    title: tenant.settings?.siteTitle || tenant.name,
    description: tenant.settings?.siteTagline || `Leilões de ${tenant.name}`,
    icons: tenant.settings?.faviconUrl ? [{ url: tenant.settings.faviconUrl }] : undefined,
  };
}
