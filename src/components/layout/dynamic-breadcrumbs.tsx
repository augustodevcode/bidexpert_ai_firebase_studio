// src/components/layout/dynamic-breadcrumbs.tsx
'use client';

import { usePathname } from 'next/navigation';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useMemo } from 'react';

// NOTE: This component has been simplified to remove direct data dependencies,
// which are no longer available in client components after refactoring to a database adapter pattern.
// It now uses generic labels for dynamic segments (e.g., "Leilão [ID]") instead of fetching entity titles.

// Cache simples para evitar re-cálculos desnecessários em cada renderização
let breadcrumbCache: { [path: string]: BreadcrumbItem[] } = {};

export default function DynamicBreadcrumbs() {
  const pathname = usePathname();

  const items = useMemo(() => {
    if (breadcrumbCache[pathname]) {
      return breadcrumbCache[pathname];
    }

    const pathSegments = pathname.split('/').filter(segment => segment);
    const breadcrumbItems: BreadcrumbItem[] = [{ label: 'Início', href: '/' }];

    if (pathSegments.length === 0) {
      return [];
    }

    let currentPath = '';

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      let label = decodeURIComponent(segment).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      let href: string | undefined = currentPath;

      if (segment === 'admin') {
        label = 'Painel Admin';
        href = '/admin/dashboard';
      } else if (pathSegments[i - 1] === 'admin' && pathSegments[i] !== 'dashboard') {
        const entityMap: Record<string, string> = {
          categories: 'Categorias',
          subcategories: 'Subcategorias',
          auctions: 'Leilões',
          lots: 'Lotes',
          sellers: 'Comitentes',
          auctioneers: 'Leiloeiros',
          states: 'Estados',
          cities: 'Cidades',
          users: 'Usuários',
          roles: 'Perfis',
          settings: 'Configurações',
          media: 'Mídia',
          "judicial-processes": 'Processos Judiciais',
          "judicial-districts": 'Comarcas',
          "judicial-branches": 'Varas',
          "courts": "Tribunais",
          "direct-sales": "Vendas Diretas",
          "document-templates": "Templates de Documento",
          "habilitations": "Habilitações",
          "reports": "Relatórios",
          "import": "Importação"
        };
        label = entityMap[segment] || label;

        const nextSegment = pathSegments[i + 1];
        const thirdSegment = pathSegments[i + 2];
        if (nextSegment === 'new') {
          breadcrumbItems.push({ label, href });
          label = 'Novo';
          href = `${currentPath}/new`;
          i++;
        } else if (thirdSegment === 'edit') {
          breadcrumbItems.push({ label, href });
          label = `Editar`;
          href = `${currentPath}/${nextSegment}/edit`;
          i += 2;
        } else if (segment === 'media' && nextSegment === 'upload') {
            breadcrumbItems.push({ label, href });
            label = 'Upload';
            href = `${currentPath}/upload`;
            i++;
        } else if (nextSegment === 'analysis') {
           breadcrumbItems.push({ label, href: `/admin/${segment}` });
           label = 'Análise';
           href = `${currentPath}/analysis`;
           i++;
        }
      } else if (segment === 'auctions' && i + 1 < pathSegments.length && pathSegments[i + 1] !== 'create') {
        label = 'Leilões'; // Parent
        breadcrumbItems.push({ label, href: '/search?type=auctions' });

        const auctionId = pathSegments[i + 1];
        label = `Leilão`; // Generic label
        href = `/auctions/${auctionId}`;
        i++;

        if (pathSegments[i + 1] === 'lots' && i + 2 < pathSegments.length) {
          breadcrumbItems.push({ label, href });
          const lotId = pathSegments[i + 2];
          label = `Lote`;
          href = `${href}/lots/${lotId}`;
          i += 2;
        } else if (pathSegments[i + 1] === 'live') {
          breadcrumbItems.push({ label, href });
          label = 'Auditório Ao Vivo';
          href = `${href}/live`;
          i++;
        }
      } else if (segment === 'category' && i + 1 < pathSegments.length) {
        label = 'Categorias';
        breadcrumbItems.push({ label, href: '/search?tab=categories' });

        const categorySlug = pathSegments[i + 1];
        label = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Generic from slug
        href = `/category/${categorySlug}`;
        i++;
      } else if (segment === 'sellers' && i + 1 < pathSegments.length) {
        label = 'Comitentes';
        breadcrumbItems.push({ label, href: '/sellers' });
        label = `Comitente`;
        href = `/sellers/${pathSegments[i + 1]}`;
        i++;
      } else if (segment === 'auctioneers' && i + 1 < pathSegments.length) {
        label = 'Leiloeiros';
        breadcrumbItems.push({ label, href: '/auctioneers' });
        label = `Leiloeiro`;
        href = `/auctioneers/${pathSegments[i + 1]}`;
        i++;
      } else if (segment === 'direct-sales') {
        label = 'Venda Direta';
        href = '/direct-sales';
        if (i + 1 < pathSegments.length) {
          breadcrumbItems.push({ label, href });
          label = `Oferta`;
          href = `/direct-sales/${pathSegments[i + 1]}`;
          i++;
        }
      } else if (segment === 'search') {
        label = 'Resultados da Busca';
        href = undefined;
      } else if (segment === 'profile' && i + 1 < pathSegments.length && pathSegments[i + 1] === 'edit') {
        breadcrumbItems.push({ label: 'Meu Perfil', href: '/profile' });
        label = 'Editar Perfil';
        href = '/profile/edit';
        i++;
        } else if (segment === 'dashboard' && i + 1 < pathSegments.length) {
          breadcrumbItems.push({label: 'Meu Painel', href: '/dashboard/overview'});
          const subPage = pathSegments[i+1];
          if (subPage === 'profile' && i + 2 < pathSegments.length && pathSegments[i + 2] === 'edit') {
           breadcrumbItems.push({ label: 'Meu Perfil', href: '/profile' });
           label = 'Editar Perfil';
           href = '/dashboard/profile/edit';
           i += 2;
           breadcrumbItems.push({ label, href });
           continue;
          }
          const subPageLabelMap: Record<string, string> = {
             overview: 'Visão Geral', bids: 'Meus Lances', wins: 'Meus Arremates',
             documents: 'Meus Documentos', history: 'Histórico', notifications: 'Notificações',
             reports: 'Relatórios', favorites: 'Favoritos'
          };
          label = subPageLabelMap[subPage] || subPage.charAt(0).toUpperCase() + subPage.slice(1);
          href = `/dashboard/${subPage}`;
          i++;
      } else if (segment === 'consignor-dashboard' && i + 1 < pathSegments.length) {
           breadcrumbItems.push({label: 'Painel Comitente', href: '/consignor-dashboard/overview'});
           const subPage = pathSegments[i+1];
           const subPageLabelMap: Record<string, string> = {
             overview: 'Visão Geral', auctions: 'Meus Leilões', lots: 'Meus Lotes',
             'direct-sales': 'Vendas Diretas', financial: 'Financeiro'
           };
           label = subPageLabelMap[subPage] || subPage.charAt(0).toUpperCase() + subPage.slice(1);
           href = `/consignor-dashboard/${subPage}`;
           i++;
      } else if (segment === 'auth' && i + 1 < pathSegments.length) {
          if (pathSegments[i+1] === 'login') label = 'Login';
          else if (pathSegments[i+1] === 'register') label = 'Registro';
          else label = pathSegments[i+1].charAt(0).toUpperCase() + pathSegments[i+1].slice(1);
          href = `/auth/${pathSegments[i+1]}`;
          i++;
      } else if (i === pathSegments.length - 1) {
        href = undefined;
      }

      breadcrumbItems.push({ label, href });
    }

    breadcrumbCache[pathname] = breadcrumbItems;
    return breadcrumbItems;
  }, [pathname]);

  if (pathname === '/' || items.length <= 1) {
    return null;
  }

  return (
    <div className="bg-muted/40 text-muted-foreground border-b border-border/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
      <div className="container mx-auto px-4">
        <nav
          aria-label="Breadcrumb"
          className="flex h-11 items-center overflow-x-auto text-[13px] sm:text-sm"
        >
          <Breadcrumbs items={items} className="flex-nowrap" />
        </nav>
      </div>
    </div>
  );
}
