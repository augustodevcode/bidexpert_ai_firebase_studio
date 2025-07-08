
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Settings, Database, Gavel, Package, Users, Users2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { AdminDashboardStats } from '@/types';
import { getAdminDashboardStatsAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ title, value, icon: Icon, link, description, isLoading }: { title: string, value: number | string, icon: React.ElementType, link: string, description: string, isLoading: boolean }) {
    return (
        <Link href={link} className="block hover:no-underline">
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
        </Link>
    );
}


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const fetchedStats = await getAdminDashboardStatsAction();
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
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <LayoutDashboard className="h-7 w-7 mr-3 text-primary" />
              Painel de Administração
            </CardTitle>
            <CardDescription>
              Bem-vindo à área de gerenciamento do BidExpert.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Utilize o menu lateral para navegar pelas diferentes seções de gerenciamento do site.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Leilões" 
                value={stats?.auctions ?? '...'} 
                icon={Gavel} 
                link="/admin/auctions" 
                description="Total de leilões criados." 
                isLoading={isLoading} 
            />
             <StatCard 
                title="Lotes" 
                value={stats?.lots ?? '...'} 
                icon={Package} 
                link="/admin/lots" 
                description="Total de lotes cadastrados." 
                isLoading={isLoading} 
            />
             <StatCard 
                title="Usuários" 
                value={stats?.users ?? '...'} 
                icon={Users} 
                link="/admin/users" 
                description="Total de usuários registrados." 
                isLoading={isLoading} 
            />
            <StatCard 
                title="Comitentes" 
                value={stats?.sellers ?? '...'} 
                icon={Users2} 
                link="/admin/sellers" 
                description="Total de comitentes/vendedores." 
                isLoading={isLoading} 
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
