// src/app/admin/dashboard/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Settings, DollarSign, Gavel, Package, Users, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { AdminReportData } from '@/types';
import { getAdminReportDataAction } from '../reports/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWidgetPreferences } from '@/contexts/widget-preferences-context'; // Import the hook

function StatCard({ title, value, icon: Icon, description, isLoading, colorClass = 'bg-primary text-primary-foreground', link }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean, colorClass?: string, link?: string }) {
    const cardContent = (
      <Card className={`${colorClass} shadow-lg transition-transform hover:scale-105`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">{title}</span>
               {isLoading ? (
                <Skeleton className="h-9 w-24 bg-white/20" />
            ) : (
                <span className="text-4xl font-bold">{value}</span>
            )}
            </div>
            <Icon className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
    );

     return link ? <Link href={link} className="block hover:no-underline">{cardContent}</Link> : cardContent;
}


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWidgetVisible } = useWidgetPreferences(); // Use the hook

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
    <div className="space-y-6" data-ai-id="admin-dashboard-page-container">
      {/* O cabeçalho com título foi movido para o AdminHeader e AdminLayout */}

       <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Informação</AlertTitle>
          <AlertDescription>
           Olá! Esta é uma área de demonstração. Os dados abaixo são gerados para ilustrar as capacidades da plataforma.
          </AlertDescription>
      </Alert>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-ai-id="admin-dashboard-stats-grid">
            {isWidgetVisible('totalRevenue') && (
              <StatCard 
                  title="Faturamento Total" 
                  value={(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})} 
                  icon={DollarSign} 
                  description="Soma de todos os lotes vendidos"
                  colorClass="bg-sky-500 text-white"
                  link="/admin/reports"
                  isLoading={isLoading} 
              />
            )}
            {isWidgetVisible('activeAuctions') && (
              <StatCard 
                  title="Leilões Ativos" 
                  value={stats?.activeAuctions ?? '...'} 
                  icon={Gavel} 
                  description="Leilões abertos para lances" 
                  colorClass="bg-teal-500 text-white"
                  link="/admin/auctions"
                  isLoading={isLoading} 
              />
            )}
            {isWidgetVisible('lotsSoldCount') && (
              <StatCard 
                  title="Lotes Vendidos" 
                  value={stats?.lotsSoldCount ?? '...'} 
                  icon={Package} 
                  description="Total de lotes arrematados"
                  colorClass="bg-blue-800 text-white"
                  link="/admin/lots/analysis"
                  isLoading={isLoading} 
              />
            )}
            {isWidgetVisible('newUsers') && (
              <StatCard 
                  title="Novos Usuários (30d)" 
                  value={`+${stats?.newUsersLast30Days ?? '...'}`} 
                  icon={Users} 
                  description="Novos registros no último mês"
                  colorClass="bg-indigo-500 text-white"
                  link="/admin/users/analysis" 
                  isLoading={isLoading} 
              />
            )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Análise do Site</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Componente de gráfico de análise será adicionado aqui.</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
