// src/components/admin/auction-preparation/tabs/marketing-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Megaphone,
  Globe,
  Facebook,
  Instagram,
  Mail,
  Eye,
  TrendingUp,
  Image as ImageIcon,
  Users,
  HandCoins,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  Auction,
  AuctionPreparationBid,
  AuctionPreparationHabilitation,
  AuctionPreparationWin,
} from '@/types';

interface MarketingTabProps {
  auction: Auction;
  bids: AuctionPreparationBid[];
  habilitations: AuctionPreparationHabilitation[];
  userWins: AuctionPreparationWin[];
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function MarketingTab({ auction, bids, habilitations, userWins }: MarketingTabProps) {
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [googleAdsEnabled, setGoogleAdsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const metrics = useMemo(() => {
    const visits = auction.visits ?? 0;
    const totalBids = bids.length;
    const uniqueBidders = new Set(bids.map((bid) => bid.bidderId)).size;
    const totalBidValue = bids.reduce((sum, bid) => sum + (bid.amount || 0), 0);
    const totalWinsValue = userWins.reduce((sum, win) => sum + (win.value || 0), 0);
    const totalRecipients = habilitations.length;
    const conversionBase = visits > 0 ? visits : totalRecipients || 1;
    const conversionRate = conversionBase > 0
      ? ((auction.totalHabilitatedUsers ?? totalRecipients) / conversionBase) * 100
      : 0;

    return {
      visits,
      totalBids,
      totalBidValue,
      totalWinsValue,
      uniqueBidders,
      conversionRate,
      totalRecipients,
    };
  }, [auction, bids, habilitations, userWins]);

  return (
    <div className="space-y-6">
      {/* Marketing Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(metrics.visits)}</div>
            <p className="text-xs text-muted-foreground mt-1">Visitas ao leilão</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(metrics.totalBids)}</div>
            <p className="text-xs text-muted-foreground mt-1">Interações em "Dar lance"</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Visitas que viraram habilitações aprovadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HandCoins className="h-4 w-4" />
              Valor em Lances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(metrics.totalBidValue || metrics.totalWinsValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Volume financeiro disputado</p>
          </CardContent>
        </Card>
      </div>

      {/* Website Promotion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Promoção no Site
          </CardTitle>
          <CardDescription>Configure banners e destaques no site principal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-1">
              <Label htmlFor="banner-home">Banner na Página Inicial</Label>
              <p className="text-sm text-muted-foreground">
                Exibir este leilão em destaque na home
              </p>
            </div>
            <Switch
              id="banner-home"
              checked={bannerEnabled}
              onCheckedChange={setBannerEnabled}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-1">
              <Label htmlFor="banner-category">Banner em Categorias</Label>
              <p className="text-sm text-muted-foreground">
                Exibir nas páginas de categorias relacionadas
              </p>
            </div>
            <Switch id="banner-category" />
          </div>
          <Button variant="outline" className="w-full">
            <ImageIcon className="h-4 w-4 mr-2" />
            Gerenciar Banners
          </Button>
        </CardContent>
      </Card>

      {/* Digital Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Anúncios Digitais
          </CardTitle>
          <CardDescription>Configure campanhas de anúncios online</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-1">
              <Label htmlFor="google-ads">Google Ads</Label>
              <p className="text-sm text-muted-foreground">
                Anunciar no Google e rede de display
              </p>
            </div>
            <Switch
              id="google-ads"
              checked={googleAdsEnabled}
              onCheckedChange={setGoogleAdsEnabled}
            />
          </div>
          {googleAdsEnabled && (
            <div className="ml-4 p-4 bg-muted rounded-md space-y-2">
              <p className="text-sm font-medium">Configurações do Google Ads</p>
              <Button variant="outline" size="sm">
                Configurar Campanha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Redes Sociais
          </CardTitle>
          <CardDescription>Promova o leilão nas redes sociais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-1 flex items-center gap-3">
              <Facebook className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <p className="text-sm text-muted-foreground">
                  Publicar automaticamente
                </p>
              </div>
            </div>
            <Switch id="facebook" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-1 flex items-center gap-3">
              <Instagram className="h-5 w-5 text-pink-600" />
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <p className="text-sm text-muted-foreground">
                  Criar stories e posts
                </p>
              </div>
            </div>
            <Switch id="instagram" />
          </div>
          <Button variant="outline" className="w-full">
            Gerar Conteúdo para Redes Sociais
          </Button>
        </CardContent>
      </Card>

      {/* Email Marketing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Marketing
          </CardTitle>
          <CardDescription>
            Alcance direto com {metrics.totalRecipients} participantes habilitados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-1">
              <Label htmlFor="email-campaign">Campanha de Email</Label>
              <p className="text-sm text-muted-foreground">
                Enviar para base de arrematantes cadastrados
              </p>
            </div>
            <Switch
              id="email-campaign"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>
          {emailEnabled && (
            <div className="ml-4 space-y-3">
              <Button variant="outline" size="sm" className="w-full">
                Criar Template de Email
              </Button>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>{metrics.totalRecipients}</strong> destinatários na base
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Relatório de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span>Total de participantes engajados</span>
                <span className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {numberFormatter.format(metrics.uniqueBidders)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Valor arrematado até agora</span>
                <span className="font-semibold">
                  {currencyFormatter.format(metrics.totalWinsValue)}
                </span>
              </div>
            </div>
            <div className="text-center py-2">
              <Button variant="outline">Ver Analytics Detalhado</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
