/**
 * @fileoverview Página do dashboard administrativo principal com métricas reais da plataforma.
 */
// src/app/admin/dashboard/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, DollarSign, Gavel, Package, Users, BarChart3, TrendingUp, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { AdminReportData } from '@/types';
import { getAdminReportDataAction } from '@/app/admin/reports/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetPreferences } from '@/contexts/widget-preferences-context';
import { LineChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Cell } from 'recharts';


function StatCard({ title, value, icon: Icon, description, isLoading, colorClass = 'bg-primary text-primary-foreground', link }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean, colorClass?: string, link?: string }) {
    const cardContent = (
      <Card className={cn("card-admin-stat", colorClass)} data-ai-id={`admin-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardContent className="content-card-admin-stat">
          <div className="wrapper-admin-stat-content">
            <div className="wrapper-admin-stat-text">
              <span className="text-admin-stat-title">{title}</span>
               {isLoading ? (
                <Skeleton className="skeleton-admin-stat-value" />
            ) : (
                <span className="text-admin-stat-value">{value}</span>
            )}
            </div>
            <Icon className="icon-admin-stat-card" />
          </div>
        </CardContent>
      </Card>
    );

     return link ? <Link href={link} className="link-admin-stat">{cardContent}</Link> : cardContent;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWidgetVisible } = useWidgetPreferences();

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
      {/* O cabeçalho com título foi movido para o AdminHeader e AdminLayout */}

       <div className="grid-admin-dashboard-stats" data-ai-id="admin-dashboard-stats-grid">
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

      <div className="grid-admin-dashboard-charts" data-ai-id="admin-dashboard-charts-grid">
        <Card className="card-admin-chart-large" data-ai-id="admin-chart-sales">
            <CardHeader className="header-admin-chart">
                <CardTitle className="title-admin-chart"><LineChartIcon className="icon-admin-chart-header"/> Vendas Mensais (Últimos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent className="content-admin-chart">
                {isLoading ? <Skeleton className="skeleton-admin-chart" /> : (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                    <Legend />
                    <Line type="monotone" dataKey="Sales" name="Vendas" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                </LineChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
         <Card className="card-admin-chart-small" data-ai-id="admin-chart-categories">
            <CardHeader className="header-admin-chart">
                <CardTitle className="title-admin-chart"><PieChartIcon className="icon-admin-chart-header"/> Lotes Vendidos por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="content-admin-chart">
                {isLoading ? <Skeleton className="skeleton-admin-chart" /> : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={stats?.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {stats?.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
