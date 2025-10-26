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
  DollarSign
} from 'lucide-react';
import { BidderDashboardOverview } from '@/types/bidder-dashboard';
import { WonLotsSection } from './won-lots-section';
import { PaymentsSection } from './payments-section';
import { DocumentsSection } from './documents-section';
import { NotificationsSection } from './notifications-section';
import { HistorySection } from './history-section';
import { ProfileSection } from './profile-section';

interface BidderDashboardProps {
  overview: BidderDashboardOverview;
}

export function BidderDashboard({ overview }: BidderDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meu Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie seus arremates, pagamentos e documentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <User className="h-3 w-3 mr-1" />
            Arrematante
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Arrematados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.wonLotsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de arremates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {overview.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total dos arremates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              {overview.paymentSummary.nextDueDate && (
                <span className="text-orange-600">
                  Vence em {overview.paymentSummary.nextDueDate.toLocaleDateString('pt-BR')}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('won-lots')}
            >
              <Trophy className="h-6 w-6" />
              <span className="text-sm">Ver Arremates</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('payments')}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Pagamentos</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Documentos</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="h-6 w-6" />
              <span className="text-sm">Notificações</span>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="won-lots">Arremates</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
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
