/**
 * @fileoverview Página de Dashboard do Admin Plus.
 * Exibe cards resumo com totais de cada grupo de entidades,
 * links rápidos e atividade recente.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  Users,
  Hammer,
  Layers,
  Package,
  Scale,
  Bell,
  ScrollText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';

export const metadata: Metadata = {
  title: 'Admin Plus — Dashboard',
  description: 'Visão geral do sistema de administração.',
};

const quickLinks = [
  { label: 'Leilões', href: `${ADMIN_PLUS_BASE_PATH}/auctions`, icon: Hammer, color: 'text-chart-1' },
  { label: 'Lotes', href: `${ADMIN_PLUS_BASE_PATH}/lots`, icon: Layers, color: 'text-chart-2' },
  { label: 'Usuários', href: `${ADMIN_PLUS_BASE_PATH}/users`, icon: Users, color: 'text-chart-3' },
  { label: 'Ativos', href: `${ADMIN_PLUS_BASE_PATH}/assets`, icon: Package, color: 'text-chart-4' },
  { label: 'Tenants', href: `${ADMIN_PLUS_BASE_PATH}/tenants`, icon: Building2, color: 'text-chart-5' },
  { label: 'Processos Judiciais', href: `${ADMIN_PLUS_BASE_PATH}/judicial-processes`, icon: Scale, color: 'text-primary' },
  { label: 'Notificações', href: `${ADMIN_PLUS_BASE_PATH}/notifications`, icon: Bell, color: 'text-muted-foreground' },
  { label: 'Logs de Auditoria', href: `${ADMIN_PLUS_BASE_PATH}/audit-logs`, icon: ScrollText, color: 'text-chart-1' },
];

export default function AdminPlusDashboardPage() {
  return (
    <div className="space-y-8" data-ai-id="admin-plus-dashboard">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Plus</h1>
        <p className="text-muted-foreground mt-1">
          Painel unificado de administração — gerencie todas as entidades do sistema.
        </p>
      </div>

      <section aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="text-lg font-semibold mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card
                className="group hover:shadow-md transition-shadow cursor-pointer"
                data-ai-id={`dashboard-quick-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{link.label}</CardTitle>
                  <link.icon className={`h-5 w-5 ${link.color}`} aria-hidden="true" />
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1">
                    Gerenciar <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
