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
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="h-8 w-1/2 mb-2" />
            ) : (
                <div className="text-3xl font-bold">{value}</div>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );

    return link ? <Link href={link} className="block hover:no-underline">{cardContent}</Link> : cardContent;
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
    <div className="space-y-8" data-ai-id="admin-dashboard-page-container">
      <Card className="shadow-lg" data-ai-id="admin-dashboard-header-card">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <LayoutDashboard className="h-7 w-7 mr-3 text-primary" />
              Painel de Administração
            </CardTitle>
            <CardDescription>
              Bem-vindo à área de gerenciamento do BidExpert.
            </CardDescription>
          </div>
           <Button asChild>
              <Link href="/admin/reports">
                <BarChart className="mr-2 h-4 w-4" /> Relatórios Detalhados
              </Link>
            </Button>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-ai-id="admin-dashboard-stats-grid">
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
