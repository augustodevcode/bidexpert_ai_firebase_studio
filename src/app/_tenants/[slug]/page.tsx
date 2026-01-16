// src/app/_tenants/[slug]/page.tsx
/**
 * @fileoverview Página inicial do tenant (path-based routing).
 * 
 * Esta página é exibida quando o usuário acessa:
 * - bidexpert.com.br/app/[tenant-slug]
 * 
 * Redireciona para a home do tenant ou para o setup se necessário.
 */

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

interface TenantPageProps {
  params: { slug: string };
}

async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { subdomain: slug.toLowerCase() },
    include: { settings: true },
  });
}

export default async function TenantIndexPage({ params }: TenantPageProps) {
  const tenant = await getTenantBySlug(params.slug);
  
  if (!tenant) {
    redirect('/');
  }

  // Se setup não está completo, redireciona para configuração
  if (!tenant.settings?.isSetupComplete) {
    redirect(`/app/${params.slug}/tenant-setup`);
  }

  // Redireciona para a página inicial do tenant
  // Por enquanto, mostra uma página simples
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {tenant.settings?.siteTitle || tenant.name}
          </h1>
          {tenant.settings?.siteTagline && (
            <p className="text-xl text-muted-foreground mb-8">
              {tenant.settings.siteTagline}
            </p>
          )}
          
          {tenant.settings?.logoUrl && (
            <img 
              src={tenant.settings.logoUrl} 
              alt={tenant.name}
              className="mx-auto h-24 w-auto mb-8"
            />
          )}
          
          <div className="grid gap-4 max-w-md mx-auto">
            <a 
              href={`/app/${params.slug}/auctions`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ver Leilões
            </a>
            <a 
              href={`/app/${params.slug}/lots`}
              className="inline-flex items-center justify-center rounded-md bg-secondary px-6 py-3 text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              Ver Lotes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
