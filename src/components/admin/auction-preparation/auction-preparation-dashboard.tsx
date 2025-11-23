// src/components/admin/auction-preparation/auction-preparation-dashboard.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LayoutDashboard,
  Grid3x3,
  Package,
  Users,
  Gavel,
  HandCoins,
  Wallet,
  Megaphone,
  BarChart3,
} from 'lucide-react';
import { DashboardTab } from './tabs/dashboard-tab';
import { LottingTab } from './tabs/lotting-tab';
import { LotsTab } from './tabs/lots-tab';
import { HabilitationsTab } from './tabs/habilitations-tab';
import { AuctionTab } from './tabs/auction-tab';
import { ClosingTab } from './tabs/closing-tab';
import { FinancialTab } from './tabs/financial-tab';
import { MarketingTab } from './tabs/marketing-tab';
import { AnalyticsTab } from './tabs/analytics-tab';
import type { AuctionPreparationData } from '@/types';

interface AuctionPreparationDashboardProps {
  data: AuctionPreparationData;
}

export function AuctionPreparationDashboard({ data }: AuctionPreparationDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { auction, availableAssets, habilitations, bids, userWins } = data;

  const tabs = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'lotting', label: 'Loteamento', icon: Grid3x3 },
    { value: 'lots', label: 'Lotes', icon: Package },
    { value: 'marketing', label: 'Marketing', icon: Megaphone },
    { value: 'habilitations', label: 'Habilitações', icon: Users },
    { value: 'auction', label: 'Pregão', icon: Gavel },
    { value: 'closing', label: 'Arremates', icon: HandCoins },
    { value: 'financial', label: 'Financeiro', icon: Wallet },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="w-full h-full">
      {/* Auction Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Central de Gerenciamento do Leilão</h1>
        <p className="text-muted-foreground mt-2">
          {auction.title} - {auction.publicId}
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 mb-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <DashboardTab auction={auction} bids={bids} habilitations={habilitations} userWins={userWins} />
        </TabsContent>

        <TabsContent value="lotting" className="space-y-4">
          <LottingTab auction={auction} availableAssets={availableAssets} />
        </TabsContent>

        <TabsContent value="lots" className="space-y-4">
          <LotsTab auction={auction} bids={bids} />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <MarketingTab
            auction={auction}
            bids={bids}
            habilitations={habilitations}
            userWins={userWins}
          />
        </TabsContent>

        <TabsContent value="habilitations" className="space-y-4">
          <HabilitationsTab auction={auction} habilitations={habilitations} />
        </TabsContent>

        <TabsContent value="auction" className="space-y-4">
          <AuctionTab auction={auction} bids={bids} />
        </TabsContent>

        <TabsContent value="closing" className="space-y-4">
          <ClosingTab auction={auction} userWins={userWins} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialTab auction={auction} userWins={userWins} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab
            auction={auction}
            bids={bids}
            habilitations={habilitations}
            userWins={userWins}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
