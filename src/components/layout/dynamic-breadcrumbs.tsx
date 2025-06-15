
// src/components/layout/dynamic-breadcrumbs.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { 
    sampleAuctions, 
    sampleLots, 
    sampleLotCategories, 
    getCategoryNameFromSlug, 
    slugify,
    sampleSellers,
    sampleAuctioneers,
    sampleDirectSaleOffers
} from '@/lib/sample-data';
import type { BreadcrumbItem } from '@/components/ui/breadcrumbs';
import Breadcrumbs from '@/components/ui/breadcrumbs'; // O componente visual
import { useEffect, useState, useMemo } from 'react';

// Cache simples para evitar re-cálculos desnecessários em cada renderização
let breadcrumbCache: { [path: string]: BreadcrumbItem[] } = {};

export default function DynamicBreadcrumbs() {
  const pathname = usePathname();
  
  const items = useMemo(() => {
    // console.log('[DynamicBreadcrumbs useMemo] Pathname changed:', pathname);
    if (breadcrumbCache[pathname]) {
      // console.log('[DynamicBreadcrumbs useMemo] Using cached breadcrumbs for:', pathname);
      return breadcrumbCache[pathname];
    }

    const pathSegments = pathname.split('/').filter(segment => segment);
    const breadcrumbItems: BreadcrumbItem[] = [{ label: 'Início', href: '/' }]; // Alterado "Home" para "Início"

    if (pathSegments.length === 0) { // Home page
      return []; // Não mostrar breadcrumbs na home
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
      } else if (pathSegments[i-1] === 'admin' && pathSegments[i] !== 'dashboard') {
          if (segment === 'categories') label = 'Categorias';
          else if (segment === 'auctions') label = 'Leilões';
          else if (segment === 'lots') label = 'Lotes';
          else if (segment === 'sellers') label = 'Comitentes';
          else if (segment === 'auctioneers') label = 'Leiloeiros';
          else if (segment === 'states') label = 'Estados';
          else if (segment === 'cities') label = 'Cidades';
          else if (segment === 'users') label = 'Usuários';
          else if (segment === 'roles') label = 'Perfis';
          else if (segment === 'settings') label = 'Configurações';
          else if (segment === 'media') label = 'Mídia';
          else if (i + 1 < pathSegments.length && (pathSegments[i+1] === 'new' || pathSegments[i+2] === 'edit')) {
              const prevLabel = breadcrumbItems[breadcrumbItems.length - 1].label;
              const entityName = prevLabel.endsWith('s') ? prevLabel.slice(0, -1) : prevLabel; // Remove 's'
              if (pathSegments[i+1] === 'new') {
                  label = `Novo ${entityName}`;
              } else if (pathSegments[i+1] && pathSegments[i+2] === 'edit') {
                  label = `Editar ${entityName}: ${pathSegments[i+1].substring(0,8)}...`;
              }
          } else if (pathSegments[i-1] === 'media' && segment === 'upload') {
              label = 'Upload de Mídia';
          }
      } else if (segment === 'auctions' && i + 1 < pathSegments.length && pathSegments[i+1] !== 'create') {
        const auctionIdOrPublicId = pathSegments[i+1];
        const auction = sampleAuctions.find(a => a.id === auctionIdOrPublicId || a.publicId === auctionIdOrPublicId);
        label = auction?.title || `Leilão ${auctionIdOrPublicId}`;
        href = `/auctions/${auctionIdOrPublicId}`;
        
        if (i + 2 < pathSegments.length && pathSegments[i+2] === 'lots' && i + 3 < pathSegments.length) {
          breadcrumbItems.push({ label, href });
          const lotIdOrPublicId = pathSegments[i+3];
          const lot = sampleLots.find(l => (l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId) && (l.auctionId === auction?.id || l.auctionId === auction?.publicId));
          currentPath += `/lots/${lotIdOrPublicId}`; // Corrigido para usar o ID do lote
          label = lot?.title || `Lote ${lotIdOrPublicId}`;
          href = currentPath;
          i = i + 2; // Pula 'lots' e o lotId
        } else if (i + 2 < pathSegments.length && pathSegments[i+2] === 'live') {
           breadcrumbItems.push({ label, href });
           label = "Auditório Ao Vivo";
           href = `${currentPath}/live`;
           i = i + 1; // Pula 'live'
        }
      } else if (segment === 'category' && i + 1 < pathSegments.length) {
        const categorySlug = pathSegments[i+1];
        const categoryName = getCategoryNameFromSlug(categorySlug);
        label = categoryName || label;
        href = `/category/${categorySlug}`;
        i++; // Pula o slug da categoria, pois o href já está completo
      } else if (segment === 'sellers' && i + 1 < pathSegments.length) {
          const sellerIdOrSlug = pathSegments[i+1];
          const seller = sampleSellers.find(s => s.slug === sellerIdOrSlug || s.publicId === sellerIdOrSlug || s.id === sellerIdOrSlug);
          label = seller?.name || "Comitente";
          href = `/sellers/${sellerIdOrSlug}`;
          i++;
      } else if (segment === 'auctioneers' && i + 1 < pathSegments.length) {
          const auctioneerIdOrSlug = pathSegments[i+1];
          const auctioneer = sampleAuctioneers.find(a => a.slug === auctioneerIdOrSlug || a.publicId === auctioneerIdOrSlug || a.id === auctioneerIdOrSlug);
          label = auctioneer?.name || "Leiloeiro";
          href = `/auctioneers/${auctioneerIdOrSlug}`;
          i++;
      } else if (segment === 'direct-sales') {
          label = "Venda Direta";
          href = '/direct-sales';
          if (i + 1 < pathSegments.length) {
              const offerId = pathSegments[i+1];
              const offer = sampleDirectSaleOffers.find(o => o.id === offerId);
              breadcrumbItems.push({ label, href });
              label = offer?.title || "Oferta";
              href = `/direct-sales/${offerId}`;
              i++;
          }
      } else if (segment === 'search') {
        label = "Resultados da Busca";
        href = undefined; // Página de busca não é clicável a partir dela mesma
      } else if (segment === 'profile' && i + 1 < pathSegments.length && pathSegments[i+1] === 'edit') {
          breadcrumbItems.push({label: 'Meu Perfil', href: '/profile'});
          label = 'Editar Perfil';
          href = '/profile/edit';
          i++;
      } else if (segment === 'dashboard' && i + 1 < pathSegments.length) {
          breadcrumbItems.push({label: 'Meu Painel', href: '/dashboard/overview'});
          const subPage = pathSegments[i+1];
          if (subPage === 'overview') label = 'Visão Geral';
          else if (subPage === 'bids') label = 'Meus Lances';
          else if (subPage === 'wins') label = 'Meus Arremates';
          else if (subPage === 'documents') label = 'Meus Documentos';
          else if (subPage === 'history') label = 'Histórico';
          else if (subPage === 'notifications') label = 'Notificações';
          else if (subPage === 'reports') label = 'Relatórios';
          else if (subPage === 'favorites') label = 'Favoritos';
          else label = subPage.charAt(0).toUpperCase() + subPage.slice(1);
          href = `/dashboard/${subPage}`;
          i++;
      } else if (segment === 'consignor-dashboard' && i + 1 < pathSegments.length) {
           breadcrumbItems.push({label: 'Painel Comitente', href: '/consignor-dashboard/overview'});
           const subPage = pathSegments[i+1];
           if (subPage === 'overview') label = 'Visão Geral';
           else if (subPage === 'auctions') label = 'Meus Leilões';
           else if (subPage === 'lots') label = 'Meus Lotes';
           else if (subPage === 'direct-sales') label = 'Vendas Diretas';
           else if (subPage === 'financial') label = 'Financeiro';
           else label = subPage.charAt(0).toUpperCase() + subPage.slice(1);
           href = `/consignor-dashboard/${subPage}`;
           i++;
      } else if (segment === 'auth' && i + 1 < pathSegments.length) {
          if (pathSegments[i+1] === 'login') label = 'Login';
          else if (pathSegments[i+1] === 'register') label = 'Registro';
          else label = pathSegments[i+1].charAt(0).toUpperCase() + pathSegments[i+1].slice(1);
          href = `/auth/${pathSegments[i+1]}`;
          i++;
      } else if (i === pathSegments.length - 1) { // Last segment
          href = undefined;
      }

      breadcrumbItems.push({ label, href });
    }
    
    breadcrumbCache[pathname] = breadcrumbItems;
    return breadcrumbItems;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only recompute when pathname changes

  if (pathname === '/' || items.length <= 1) { // Do not render for home or if only "Home" exists
    return null;
  }

  return <Breadcrumbs items={items} />;
}
