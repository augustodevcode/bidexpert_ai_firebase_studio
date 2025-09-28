// src/app/admin/dashboard/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Settings, Database, Gavel, Package, Users, Users2, BarChart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { AdminReportData } from '@/types';
import { getAdminReportDataAction } from '../reports/actions';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ title, value, icon: Icon, link, description, isLoading }: { title: string, value: number | string, icon: React.ElementType, link?: string, description: string, isLoading: boolean }) {
    const cardContent = (
      <Card className="card-stat">
        <CardHeader className="card-header-stat">
            <CardTitle className="card-title-stat">{title}</CardTitle>
            <Icon className="icon-stat-card" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="skeleton-stat-value" />
            ) : (
                <div className="text-stat-value">{value}</div>
            )}
            <p className="text-stat-description">{description}</p>
        </CardContent>
      </Card>
    );

    return link ? <Link href={link} className="link-stat-card">{cardContent}</Link> : cardContent;
}


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const fetchedStats = await getAdminReportDataAction();
        setStats(fetchedStats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="container-admin-dashboard" data-ai-id="admin-dashboard-page-container">
      <Card className="card-dashboard-header" data-ai-id="admin-dashboard-header-card">
        <CardHeader className="card-header-dashboard">
          <div>
            <CardTitle className="title-dashboard">
              <LayoutDashboard className="icon-dashboard-title" />
              Painel de Administração
            </CardTitle>
            <CardDescription className="description-dashboard">
              Bem-vindo à área de gerenciamento do BidExpert.
            </CardDescription>
          </div>
           <Button asChild className="btn-detailed-reports">
              <Link href="/admin/reports">
                <BarChart className="icon-btn-reports" /> Relatórios Detalhados
              </Link>
            </Button>
        </CardHeader>
        <CardContent className="card-content-dashboard">
           <div className="grid-stats" data-ai-id="admin-dashboard-stats-grid">
             <StatCard 
                title="Faturamento Total" 
                value={(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})} 
                icon={Gavel} 
                description="Total de lotes vendidos" 
                isLoading={isLoading} 
            />
            <StatCard 
                title="Leilões Ativos" 
                value={stats?.activeAuctions ?? '...'} 
                icon={Gavel} 
                link="/admin/auctions" 
                description="Leilões abertos para lances" 
                isLoading={isLoading} 
            />
             <StatCard 
                title="Lotes Vendidos" 
                value={stats?.lotsSoldCount ?? '...'} 
                icon={Package} 
                description="Total de lotes arrematados" 
                isLoading={isLoading} 
            />
            <StatCard 
                title="Novos Usuários (30d)" 
                value={`+${stats?.newUsersLast30Days ?? '...'}`} 
                icon={Users} 
                link="/admin/users" 
                description="Novos registros no último mês" 
                isLoading={isLoading} 
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
