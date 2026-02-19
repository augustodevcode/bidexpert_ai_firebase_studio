// src/components/dashboard/bidder/bidder-dashboard.tsx
/**
 * @fileoverview Componente principal do dashboard do arrematante
 * Exibe overview e navegação para todas as funcionalidades
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  CreditCard,
  FileText,
  Bell,
  History,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Zap,
  Gavel,
  ExternalLink
} from 'lucide-react';
import { BidderDashboardOverview } from '@/types/bidder-dashboard';
import { WonLotsSection } from './won-lots-section';
import { PaymentsSection } from './payments-section';
import { DocumentsSection } from './documents-section';
import { NotificationsSection } from './notifications-section';
import { HistorySection } from './history-section';
import { ProfileSection } from './profile-section';
import Link from 'next/link';

interface BidderDashboardProps {
  overview: BidderDashboardOverview;
}

export function BidderDashboard({ overview }: BidderDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="wrapper-bidder-dashboard" data-ai-id="bidder-dashboard-main">
      {/* Header */}
      <div className="wrapper-dashboard-header" data-ai-id="bidder-dashboard-header">
        <div className="wrapper-header-title">
          <h1 className="header-dashboard-title" data-ai-id="bidder-dashboard-title">Meu Dashboard</h1>
          <p className="text-dashboard-subtitle" data-ai-id="bidder-dashboard-subtitle">
            Gerencie seus arremates, pagamentos e documentos
          </p>
        </div>
        <div className="wrapper-header-badge">
          <Badge variant="outline" className="badge-user-role" data-ai-id="bidder-dashboard-role">
            <User className="icon-badge-small" />
            Arrematante
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid-dashboard-overview" data-ai-id="bidder-dashboard-overview-grid">
        <Card className="card-overview-item" data-ai-id="bidder-overview-won-lots">
          <CardHeader className="header-overview-item">
            <CardTitle className="title-overview-item">Lotes Arrematados</CardTitle>
            <Trophy className="icon-overview-item" />
          </CardHeader>
          <CardContent className="content-overview-item">
            <div className="text-overview-value">{overview.wonLotsCount}</div>
            <p className="text-overview-helper">
              Total de arremates
            </p>
          </CardContent>
        </Card>

        <Card className="card-overview-item" data-ai-id="bidder-overview-total-invested">
          <CardHeader className="header-overview-item">
            <CardTitle className="title-overview-item">Total Investido</CardTitle>
            <DollarSign className="icon-overview-item" />
          </CardHeader>
          <CardContent className="content-overview-item">
            <div className="text-overview-value">
              R$ {overview.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-overview-helper">
              Valor total dos arremates
            </p>
          </CardContent>
        </Card>

        <Card className="card-overview-item" data-ai-id="bidder-overview-pending-payments">
          <CardHeader className="header-overview-item">
            <CardTitle className="title-overview-item">Pagamentos Pendentes</CardTitle>
            <Clock className="icon-overview-item" />
          </CardHeader>
          <CardContent className="content-overview-item">
            <div className="text-overview-value">{overview.pendingPayments}</div>
            <p className="text-overview-helper">
              {overview.paymentSummary.nextDueDate && (
                <span className="text-highlight-warning">
                  Vence em {overview.paymentSummary.nextDueDate.toLocaleDateString('pt-BR')}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="card-overview-item" data-ai-id="bidder-overview-notifications">
          <CardHeader className="header-overview-item">
            <CardTitle className="title-overview-item">Notificações</CardTitle>
            <Bell className="icon-overview-item" />
          </CardHeader>
          <CardContent className="content-overview-item">
            <div className="text-overview-value">{overview.unreadNotifications}</div>
            <p className="text-overview-helper">
              Não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Habilitações e Lances Automáticos */}
      <div className="grid-dashboard-sections" data-ai-id="bidder-dashboard-detail-grid">
        {/* Habilitações em Leilões */}
        <Card className="card-dashboard-section" data-ai-id="bidder-habilitations-card">
          <CardHeader className="header-dashboard-section">
            <CardTitle className="title-dashboard-section">
              <Gavel className="icon-section-title" />
              Leilões Habilitados
            </CardTitle>
            <CardDescription className="desc-dashboard-section">
              Leilões onde você está habilitado para dar lances
            </CardDescription>
          </CardHeader>
          <CardContent className="content-dashboard-section">
            {overview.auctionHabilitations && overview.auctionHabilitations.length > 0 ? (
              <div className="list-dashboard-items">
                {overview.auctionHabilitations.slice(0, 5).map((hab) => (
                  <div key={hab.id} className="item-dashboard-row" data-ai-id={`bidder-habilitation-${hab.id}`}>
                    <div className="wrapper-item-info">
                      <p className="text-item-title">{hab.auctionTitle}</p>
                      <div className="wrapper-item-badges">
                        <Badge variant={hab.auctionStatus === 'ABERTO' || hab.auctionStatus === 'ABERTO_PARA_LANCES' ? 'default' : 'secondary'} className="badge-item-status">
                          {hab.auctionStatus === 'ABERTO_PARA_LANCES' ? 'Em andamento' : 
                           hab.auctionStatus === 'ABERTO' ? 'Aberto' :
                           hab.auctionStatus === 'EM_BREVE' ? 'Em breve' : hab.auctionStatus}
                        </Badge>
                        {hab.auctionDate && (
                          <span className="text-item-date">
                            {new Date(hab.auctionDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/auctions/${hab.auctionPublicId || hab.auctionId}`}>
                      <Button variant="ghost" size="icon" className="btn-item-action" data-ai-id={`bidder-habilitation-link-${hab.id}`}>
                        <ExternalLink className="icon-item-action" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="wrapper-empty-state-dashboard" data-ai-id="bidder-habilitations-empty">
                <Gavel className="icon-empty-state-dashboard" />
                <p className="text-empty-state-title">Você ainda não está habilitado em nenhum leilão</p>
                <p className="text-empty-state-desc">Explore os leilões e habilite-se para participar!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lances Automáticos Configurados */}
        <Card className="card-dashboard-section" data-ai-id="bidder-autobids-card">
          <CardHeader className="header-dashboard-section">
            <CardTitle className="title-dashboard-section">
              <Zap className="icon-section-title-alt" />
              Lances Automáticos
            </CardTitle>
            <CardDescription className="desc-dashboard-section">
              Lotes com lance máximo configurado
            </CardDescription>
          </CardHeader>
          <CardContent className="content-dashboard-section">
            {overview.activeMaxBids && overview.activeMaxBids.length > 0 ? (
              <div className="list-dashboard-items">
                {overview.activeMaxBids.slice(0, 5).map((mb) => (
                  <div key={mb.id} className="item-dashboard-row" data-ai-id={`bidder-autobid-${mb.id}`}>
                    <div className="wrapper-item-info">
                      <p className="text-item-title">{mb.lotTitle}</p>
                      <p className="text-item-subtitle">{mb.auctionTitle}</p>
                      <div className="wrapper-item-values">
                        <span className="text-item-highlight">
                          Máx: R$ {mb.maxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {mb.currentBid && (
                          <span className="text-item-secondary">
                            Atual: R$ {mb.currentBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <Badge variant={mb.lotStatus === 'ABERTO_PARA_LANCES' ? 'default' : 'secondary'} className="badge-item-status">
                          {mb.lotStatus === 'ABERTO_PARA_LANCES' ? 'Ativo' : mb.lotStatus}
                        </Badge>
                      </div>
                    </div>
                    <Link href={`/auctions/${mb.auctionId}/lots/${mb.lotPublicId || mb.lotId}`}>
                      <Button variant="ghost" size="icon" className="btn-item-action" data-ai-id={`bidder-autobid-link-${mb.id}`}>
                        <ExternalLink className="icon-item-action" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="wrapper-empty-state-dashboard" data-ai-id="bidder-autobids-empty">
                <Zap className="icon-empty-state-dashboard" />
                <p className="text-empty-state-title">Nenhum lance automático configurado</p>
                <p className="text-empty-state-desc">Configure um lance máximo nos lotes de interesse!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-quick-actions" data-ai-id="bidder-quick-actions-card">
        <CardHeader className="header-quick-actions">
          <CardTitle className="title-quick-actions">Ações Rápidas</CardTitle>
          <CardDescription className="desc-quick-actions">
            Acesso rápido às funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="content-quick-actions">
          <div className="grid-quick-actions" data-ai-id="bidder-quick-actions-grid">
            <Button
              variant="outline"
              className="btn-quick-action"
              onClick={() => setActiveTab('won-lots')}
              data-ai-id="btn-quick-won-lots"
            >
              <Trophy className="icon-quick-action" />
              <span className="text-quick-action">Ver Arremates</span>
            </Button>

            <Button
              variant="outline"
              className="btn-quick-action"
              onClick={() => setActiveTab('payments')}
              data-ai-id="btn-quick-payments"
            >
              <CreditCard className="icon-quick-action" />
              <span className="text-quick-action">Pagamentos</span>
            </Button>

            <Button
              variant="outline"
              className="btn-quick-action"
              onClick={() => setActiveTab('documents')}
              data-ai-id="btn-quick-documents"
            >
              <FileText className="icon-quick-action" />
              <span className="text-quick-action">Documentos</span>
            </Button>

            <Button
              variant="outline"
              className="btn-quick-action"
              onClick={() => setActiveTab('notifications')}
              data-ai-id="btn-quick-notifications"
            >
              <Bell className="icon-quick-action" />
              <span className="text-quick-action">Notificações</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Seus últimos arremates e notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview.recentWonLots.length > 0 ? (
              overview.recentWonLots.slice(0, 3).map((lot) => (
                <div key={lot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{lot.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Arrematado em {lot.wonAt.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      R$ {lot.finalBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant={lot.paymentStatus === 'PAGO' ? 'default' : 'secondary'}>
                      {lot.paymentStatus === 'PAGO' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pago
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não arrematou nenhum lote</p>
                <p className="text-sm">Explore os leilões disponíveis para fazer seu primeiro arremate!</p>
              </div>
            )}

            {overview.recentNotifications.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Notificações Recentes</h4>
                {overview.recentNotifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'AUCTION_WON' ? 'bg-green-500' :
                      notification.type === 'PAYMENT_DUE' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {notification.createdAt.toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="wrapper-dashboard-tabs" data-ai-id="bidder-dashboard-tabs">
        <TabsList className="list-dashboard-tabs" data-ai-id="bidder-tabs-list">
          <TabsTrigger value="overview" className="trigger-dashboard-tab" data-ai-id="tab-overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="won-lots" className="trigger-dashboard-tab" data-ai-id="tab-won-lots">Arremates</TabsTrigger>
          <TabsTrigger value="payments" className="trigger-dashboard-tab" data-ai-id="tab-payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="documents" className="trigger-dashboard-tab" data-ai-id="tab-documents">Documentos</TabsTrigger>
          <TabsTrigger value="notifications" className="trigger-dashboard-tab" data-ai-id="tab-notifications">Notificações</TabsTrigger>
          <TabsTrigger value="history" className="trigger-dashboard-tab" data-ai-id="tab-history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Detalhado</CardTitle>
              <CardDescription>
                Informações completas sobre suas atividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Arremates</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de Lotes:</span>
                      <span className="font-medium">{overview.wonLotsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Total:</span>
                      <span className="font-medium">
                        R$ {overview.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Médio:</span>
                      <span className="font-medium">
                        R$ {overview.wonLotsCount > 0
                          ? (overview.totalSpent.div(overview.wonLotsCount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : '0,00'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Pagamentos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pendentes:</span>
                      <span className="font-medium">{overview.pendingPayments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Pendente:</span>
                      <span className="font-medium">
                        R$ {overview.paymentSummary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {overview.paymentSummary.nextDueDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Próximo Vencimento:</span>
                        <span className="font-medium text-orange-600">
                          {overview.paymentSummary.nextDueDate.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="won-lots">
          <WonLotsSection />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsSection />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsSection />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="history">
          <HistorySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
