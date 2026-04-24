/**
 * @fileoverview Página do dashboard administrativo principal com KPIs operacionais e acessos rápidos.
 */
// src/app/admin/dashboard/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Briefcase,
  DollarSign,
  FolderKanban,
  Gavel,
  Image as ImageIcon,
  LineChart as LineChartIcon,
  Megaphone,
  Package,
  Percent,
  PieChart as PieChartIcon,
  Rocket,
  Scale,
  Settings,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ElementType } from 'react';
import type { AdminReportData } from '@/types';
import { getAdminReportDataAction } from '@/app/admin/reports/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useWidgetPreferences } from '@/contexts/widget-preferences-context';
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ElementType;
  description?: string;
  isLoading: boolean;
  colorClass?: string;
  link?: string;
  dataAiId: string;
};

type QuickLinkItem = {
  href: string;
  title: string;
  description: string;
  icon: ElementType;
  accentClass: string;
  dataAiId: string;
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
  colorClass = 'text-primary bg-primary/10',
  link,
  dataAiId,
}: StatCardProps) {
  const card = (
    <Card className="card-admin-stat group relative h-full overflow-hidden border-border/50 bg-card transition-all duration-300 hover:shadow-md hover:border-primary/20" data-ai-id={dataAiId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110', colorClass)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="skeleton-admin-stat-value mt-1 h-8 w-28" />
        ) : (
          <div className="text-admin-stat-value text-2xl font-bold tracking-tight text-foreground">{value}</div>
        )}
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );

  if (!link) {
    return card;
  }

  return (
    <Link href={link} className="link-admin-stat block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      {card}
    </Link>
  );
}

function QuickLinkCard({ href, title, description, icon: Icon, accentClass, dataAiId }: QuickLinkItem) {
  return (
    <Link
      href={href}
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-ai-id={dataAiId}
    >
      <Card className="h-full overflow-hidden border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-primary/20 dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
        <CardContent className="flex h-full flex-col gap-4 p-5 relative">
          <div className="absolute right-[-10px] top-[-10px] opacity-0 transition-opacity duration-300 group-hover:opacity-5">
            <Icon className="h-24 w-24" aria-hidden="true" />
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300', accentClass)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1 z-10">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const COLORS = ['#0284c7', '#14b8a6', '#f59e0b', '#f97316', '#8b5cf6'];

const QUICK_LINKS: QuickLinkItem[] = [
  {
    href: '/admin/wizard',
    title: 'Novo leilão',
    description: 'Inicia rapidamente o cadastro assistido.',
    icon: Rocket,
    accentClass: 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20',
    dataAiId: 'admin-dashboard-quicklink-new-auction',
  },
  {
    href: '/admin/auctions',
    title: 'Leilões',
    description: 'Acompanha status, agenda e operação.',
    icon: Activity,
    accentClass: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20',
    dataAiId: 'admin-dashboard-quicklink-auctions',
  },
  {
    href: '/admin/lots',
    title: 'Lotes',
    description: 'Gerencia disponibilidade, preços e revisão.',
    icon: Package,
    accentClass: 'bg-blue-600/10 text-blue-600 group-hover:bg-blue-600/20',
    dataAiId: 'admin-dashboard-quicklink-lots',
  },
  {
    href: '/admin/assets',
    title: 'Ativos',
    description: 'Organiza bens, cadastro e loteamento.',
    icon: FolderKanban,
    accentClass: 'bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500/20',
    dataAiId: 'admin-dashboard-quicklink-assets',
  },
  {
    href: '/admin/media',
    title: 'Mídias',
    description: 'Centraliza biblioteca visual e uploads.',
    icon: ImageIcon,
    accentClass: 'bg-violet-500/10 text-violet-600 group-hover:bg-violet-500/20',
    dataAiId: 'admin-dashboard-quicklink-media',
  },
  {
    href: '/admin/settings/marketing',
    title: 'Marketing',
    description: 'Configura publicidade e módulos promocionais.',
    icon: Megaphone,
    accentClass: 'bg-rose-500/10 text-rose-600 group-hover:bg-rose-500/20',
    dataAiId: 'admin-dashboard-quicklink-marketing',
  },
  {
    href: '/admin/judicial-processes',
    title: 'Processos',
    description: 'Controla vínculos judiciais e andamentos.',
    icon: Scale,
    accentClass: 'bg-cyan-600/10 text-cyan-600 group-hover:bg-cyan-600/20',
    dataAiId: 'admin-dashboard-quicklink-judicial-processes',
  },
  {
    href: '/admin/sellers',
    title: 'Comitentes',
    description: 'Consulta parceiros e origem dos ativos.',
    icon: UserCheck,
    accentClass: 'bg-teal-500/10 text-teal-600 group-hover:bg-teal-500/20',
    dataAiId: 'admin-dashboard-quicklink-sellers',
  },
  {
    href: '/admin/users',
    title: 'Usuários',
    description: 'Acompanha compradores e equipe interna.',
    icon: Users,
    accentClass: 'bg-sky-500/10 text-sky-600 group-hover:bg-sky-500/20',
    dataAiId: 'admin-dashboard-quicklink-users',
  },
  {
    href: '/admin/settings',
    title: 'Configurações',
    description: 'Ajusta regras operacionais e parâmetros.',
    icon: Settings,
    accentClass: 'bg-slate-600/10 text-slate-600 group-hover:bg-slate-600/20',
    dataAiId: 'admin-dashboard-quicklink-settings',
  },
];

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
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const salesData = stats?.salesData ?? [];
  const categoryData = stats?.categoryData ?? [];
  const successRate = `${Math.round(stats?.auctionSuccessRate ?? 0)}%`;
  const averageBidValue = (stats?.averageBidValue ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const averageLotsPerAuction = (stats?.averageLotsPerAuction ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <div className="container-admin-dashboard flex flex-col gap-8 pb-10" data-ai-id="admin-dashboard-page-container">
      <section className="space-y-4" aria-labelledby="admin-dashboard-quick-access-title">
        <div className="space-y-1">
          <h2 id="admin-dashboard-quick-access-title" className="text-2xl font-bold tracking-tight text-foreground">
            Acessos rápidos
          </h2>
          <p className="text-sm text-muted-foreground">
            Atalhos para as superfícies mais usadas na operação diária da plataforma.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" data-ai-id="admin-dashboard-quicklinks-grid">
          {QUICK_LINKS.map((item) => (
            <QuickLinkCard key={item.dataAiId} {...item} />
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="admin-dashboard-kpis-title">
        <div className="space-y-1">
          <h2 id="admin-dashboard-kpis-title" className="text-2xl font-bold tracking-tight text-foreground">
            Visão geral e KPIs
          </h2>
          <p className="text-sm text-muted-foreground">
            Indicadores de operação, conversão e volume para leitura rápida do negócio.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-ai-id="admin-dashboard-stats-grid">
          {isWidgetVisible('totalRevenue') ? (
            <StatCard
              title="Faturamento total"
              value={(stats?.totalRevenue ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              icon={DollarSign}
              description="Soma dos lotes já arrematados."
              colorClass="bg-sky-500/15 text-sky-600"
              link="/admin/reports"
              isLoading={isLoading}
              dataAiId="admin-dashboard-stat-total-revenue"
            />
          ) : null}
          {isWidgetVisible('activeAuctions') ? (
            <StatCard
              title="Leilões ativos"
              value={stats?.activeAuctions ?? '...'}
              icon={Gavel}
              description="Leilões atualmente abertos para lances."
              colorClass="bg-teal-500/15 text-teal-600"
              link="/admin/auctions"
              isLoading={isLoading}
              dataAiId="admin-dashboard-stat-active-auctions"
            />
          ) : null}
          {isWidgetVisible('lotsSoldCount') ? (
            <StatCard
              title="Lotes vendidos"
              value={stats?.lotsSoldCount ?? '...'}
              icon={Package}
              description="Total arrematado na operação atual."
              colorClass="bg-blue-500/15 text-blue-600"
              link="/admin/lots/analysis"
              isLoading={isLoading}
              dataAiId="admin-dashboard-stat-lots-sold"
            />
          ) : null}
          {isWidgetVisible('newUsers') ? (
            <StatCard
              title="Novos usuários (30d)"
              value={`+${stats?.newUsersLast30Days ?? '...'}`}
              icon={Users}
              description="Cadastros recentes na base da plataforma."
              colorClass="bg-indigo-500/15 text-indigo-600"
              link="/admin/users/analysis"
              isLoading={isLoading}
              dataAiId="admin-dashboard-stat-new-users"
            />
          ) : null}
          <StatCard
            title="Taxa de sucesso"
            value={successRate}
            icon={Percent}
            description="Relação entre leilões concluídos e vendidos."
            colorClass="bg-emerald-500/15 text-emerald-600"
            isLoading={isLoading}
            dataAiId="admin-dashboard-stat-success-rate"
          />
          <StatCard
            title="Ticket médio"
            value={averageBidValue}
            icon={TrendingUp}
            description="Valor médio das arrematações registradas."
            colorClass="bg-amber-500/15 text-amber-600"
            isLoading={isLoading}
            dataAiId="admin-dashboard-stat-average-bid"
          />
          <StatCard
            title="Lotes por leilão"
            value={averageLotsPerAuction}
            icon={Briefcase}
            description="Média operacional de loteamento por evento."
            colorClass="bg-purple-500/15 text-purple-600"
            isLoading={isLoading}
            dataAiId="admin-dashboard-stat-average-lots"
          />
          <StatCard
            title="Comitentes ativos"
            value={stats?.sellers ?? '0'}
            icon={UserCheck}
            description="Parceiros com operação cadastrada."
            colorClass="bg-slate-500/15 text-slate-700 dark:text-slate-400"
            link="/admin/sellers"
            isLoading={isLoading}
            dataAiId="admin-dashboard-stat-sellers"
          />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="admin-dashboard-charts-title">
        <div className="space-y-1">
          <h2 id="admin-dashboard-charts-title" className="text-2xl font-bold tracking-tight text-foreground">
            Gráficos de desempenho
          </h2>
          <p className="text-sm text-muted-foreground">
            Evolução de faturamento e composição das vendas por categoria.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" data-ai-id="admin-dashboard-charts-grid">
          <Card className="card-admin-chart-large border-border/50 shadow-sm" data-ai-id="admin-chart-sales">
            <CardHeader className="header-admin-chart space-y-1 pb-2">
              <CardTitle className="title-admin-chart flex items-center gap-2 text-lg font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LineChartIcon className="icon-admin-chart-header h-4 w-4" aria-hidden="true" />
                </div>
                Vendas mensais (últimos 12 meses)
              </CardTitle>
              <CardDescription>Leitura rápida do faturamento consolidado mês a mês.</CardDescription>
            </CardHeader>
            <CardContent className="content-admin-chart h-[350px] pt-4">
              {isLoading ? (
                <Skeleton className="skeleton-admin-chart h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} dy={8} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dx={-4}
                      tickFormatter={(value) => `R$ ${Math.round(Number(value) / 1000)}k`}
                    />
                    <Tooltip
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                      type="monotone"
                      dataKey="Sales"
                      name="Faturamento"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="card-admin-chart-small border-border/50 shadow-sm" data-ai-id="admin-chart-categories">
            <CardHeader className="header-admin-chart space-y-1 pb-2">
              <CardTitle className="title-admin-chart flex items-center gap-2 text-lg font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PieChartIcon className="icon-admin-chart-header h-4 w-4" aria-hidden="true" />
                </div>
                Lotes vendidos por categoria
              </CardTitle>
              <CardDescription>Distribuição das categorias com melhor conversão.</CardDescription>
            </CardHeader>
            <CardContent className="content-admin-chart h-[350px] pt-4">
              {isLoading ? (
                <Skeleton className="skeleton-admin-chart h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={70} outerRadius={108} paddingAngle={2} label={false}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`category-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}`, 'Lotes']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
