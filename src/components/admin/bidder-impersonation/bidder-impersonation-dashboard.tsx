// src/components/admin/bidder-impersonation/bidder-impersonation-dashboard.tsx
/**
 * @fileoverview Componente de visualização como arrematante para administradores
 * Permite que admins naveguem pelo dashboard como se fossem um arrematante específico
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  User,
  Eye,
  EyeOff,
  Users,
  Trophy,
  CreditCard,
  FileText,
  Bell,
  History,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { BidderProfile, BidderDashboardOverview } from '@/types/bidder-dashboard';
import { BidderDashboard } from '@/components/dashboard/bidder/bidder-dashboard';

interface BidderImpersonationDashboardProps {
  bidders: (BidderProfile & { _count: any })[];
}

export function BidderImpersonationDashboard({ bidders }: BidderImpersonationDashboardProps) {
  const [selectedBidderId, setSelectedBidderId] = useState<string>('');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedBidder, setImpersonatedBidder] = useState<BidderProfile | null>(null);
  const [bidderOverview, setBidderOverview] = useState<BidderDashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedBidder = bidders.find(b => b.id === selectedBidderId);

  const handleStartImpersonation = async () => {
    if (!selectedBidderId) return;

    setLoading(true);
    try {
      // TODO: Implementar API para buscar dados do bidder selecionado
      // const response = await fetch(`/api/admin/bidders/${selectedBidderId}/dashboard`);
      // const result = await response.json();

      // Simular dados para desenvolvimento
      const mockOverview: BidderDashboardOverview = {
        wonLotsCount: selectedBidder?._count.wonLots || 0,
        totalSpent: new Decimal(12500),
        pendingPayments: 2,
        overduePayments: 0,
        documentsPending: selectedBidder?.documentStatus === 'PENDING' ? 1 : 0,
        unreadNotifications: selectedBidder?._count.notifications || 0,
        recentWonLots: [],
        recentNotifications: [],
        paymentSummary: {
          totalPending: new Decimal(2500),
          totalOverdue: new Decimal(0),
          nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      };

      setImpersonatedBidder(selectedBidder!);
      setBidderOverview(mockOverview);
      setIsImpersonating(true);
    } catch (error) {
      console.error('Error impersonating bidder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExitImpersonation = () => {
    setIsImpersonating(false);
    setImpersonatedBidder(null);
    setBidderOverview(null);
    setSelectedBidderId('');
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">Pendente</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="secondary">Em Análise</Badge>;
      case 'APPROVED':
        return <Badge variant="default">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isImpersonating && impersonatedBidder && bidderOverview) {
    return (
      <div className="space-y-4">
        {/* Impersonation Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Eye className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                Visualizando como: {impersonatedBidder.fullName || impersonatedBidder.user.email}
              </span>
              {getDocumentStatusBadge(impersonatedBidder.documentStatus)}
              <Badge variant={impersonatedBidder.isActive ? 'default' : 'secondary'}>
                {impersonatedBidder.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleExitImpersonation}>
              <EyeOff className="h-4 w-4 mr-2" />
              Sair da Visualização
            </Button>
          </AlertDescription>
        </Alert>

        {/* Bidder Dashboard */}
        <BidderDashboard overview={bidderOverview} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Visualização como Arrematante
          </CardTitle>
          <CardDescription>
            Selecione um arrematante para visualizar seu dashboard e dados como se você fosse ele
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Bidder Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecionar Arrematante</label>
              <Select value={selectedBidderId} onValueChange={setSelectedBidderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um arrematante para visualizar" />
                </SelectTrigger>
                <SelectContent>
                  {bidders.map((bidder) => (
                    <SelectItem key={bidder.id} value={bidder.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">
                            {bidder.fullName || bidder.user.email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bidder.cpf || 'CPF não informado'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getDocumentStatusBadge(bidder.documentStatus)}
                          <Badge variant={bidder.isActive ? 'default' : 'secondary'}>
                            {bidder.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Bidder Info */}
            {selectedBidder && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Arrematante Selecionado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Nome:</span>
                      </div>
                      <p className="font-medium">
                        {selectedBidder.fullName || 'Não informado'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">CPF:</span>
                      </div>
                      <p className="font-medium">
                        {selectedBidder.cpf || 'Não informado'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Arremates:</span>
                      </div>
                      <p className="font-medium">
                        {selectedBidder._count.wonLots} lote{selectedBidder._count.wonLots !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Notificações:</span>
                      </div>
                      <p className="font-medium">
                        {selectedBidder._count.notifications} notificação{selectedBidder._count.notifications !== 1 ? 'ões' : ''}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Pagamentos:</span>
                      </div>
                      <p className="font-medium">
                        {selectedBidder._count.paymentMethods} método{selectedBidder._count.paymentMethods !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Status:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDocumentStatusBadge(selectedBidder.documentStatus)}
                        <Badge variant={selectedBidder.isActive ? 'default' : 'secondary'}>
                          {selectedBidder.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Membro desde {selectedBidder.createdAt.toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar visualização rápida
                            console.log('Quick view:', selectedBidder);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualização Rápida
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleStartImpersonation}
                          disabled={loading}
                        >
                          {loading ? 'Carregando...' : 'Iniciar Visualização'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Ao visualizar como um arrematante, você terá acesso a todos os dados pessoais,
                informações de pagamento e histórico de atividades deste usuário. Use esta funcionalidade apenas para
                suporte e análise, e nunca para fins inadequados.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Arrematantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bidders.length}</div>
            <p className="text-xs text-muted-foreground">
              Arrematantes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Arrematantes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bidders.filter(b => b.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Com status ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documentação Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {bidders.filter(b => b.documentStatus === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documentação Aprovada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bidders.filter(b => b.documentStatus === 'APPROVED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Documentos OK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bidders */}
      <Card>
        <CardHeader>
          <CardTitle>Arrematantes Recentes</CardTitle>
          <CardDescription>
            Lista dos arrematantes mais recentes cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bidders.slice(0, 5).map((bidder) => (
              <div key={bidder.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {bidder.fullName || bidder.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bidder.cpf || 'CPF não informado'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getDocumentStatusBadge(bidder.documentStatus)}
                  <Badge variant={bidder.isActive ? 'default' : 'secondary'}>
                    {bidder.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBidderId(bidder.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
