// src/components/admin/bidder-impersonation/bidder-impersonation-dashboard.tsx
/**
 * @fileoverview Componente de visualização como arrematante para administradores.
 * Permite que admins naveguem pelo dashboard como se fossem um arrematante específico.
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Eye, EyeOff, Users, Trophy, CreditCard, FileText, Bell, History, TrendingUp, AlertTriangle } from 'lucide-react';
import type { UserProfileWithPermissions, ConsignorDashboardStats } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import ConsignorOverviewPage from '@/app/consignor-dashboard/overview/page';

interface BidderImpersonationDashboardProps {
  bidders: UserProfileWithPermissions[];
}

export function BidderImpersonationDashboard({ bidders }: BidderImpersonationDashboardProps) {
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedBidder, setImpersonatedBidder] = useState<UserProfileWithPermissions | null>(null);
  const [bidderOverview, setBidderOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedBidder = bidders.find(b => b.id === selectedBidderId);

  const handleStartImpersonation = async () => {
    if (!selectedBidder) {
        toast({ title: "Selecione um arrematante", variant: "destructive" });
        return;
    }
    setLoading(true);
    // Em um cenário real, aqui seria feita uma chamada à API para buscar os dados do dashboard do usuário.
    // Por enquanto, vamos apenas simular a entrada no modo de impersonação.
    setImpersonatedBidder(selectedBidder);
    setIsImpersonating(true);
    setLoading(false);
    toast({ title: "Visualização Ativada", description: `Agora você está vendo o painel como ${selectedBidder.fullName || selectedBidder.email}.` });
  };

  const handleExitImpersonation = () => {
    setIsImpersonating(false);
    setImpersonatedBidder(null);
    setSelectedBidderId(null);
  };
  
  const HabilitationStatusBadge = ({ status }: { status: UserProfileWithPermissions['habilitationStatus'] }) => {
    const statusInfo = getUserHabilitationStatusInfo(status);
    const Icon = statusInfo.icon;
    return <Badge variant="outline" className={`border-l-2 ${statusInfo.textColor.replace('text-', 'border-')}`}><Icon className={`mr-1 h-3 w-3 ${statusInfo.textColor}`} />{statusInfo.text}</Badge>
  }


  if (isImpersonating && impersonatedBidder) {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/30">
          <Eye className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Visualizando como: {impersonatedBidder.fullName || impersonatedBidder.email}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExitImpersonation}>
              <EyeOff className="h-4 w-4 mr-2" />
              Sair da Visualização
            </Button>
          </AlertDescription>
        </Alert>

        {/* Aqui seria renderizado o dashboard real do usuário.
            Por enquanto, vamos usar um placeholder.
            Futuramente, podemos passar o `impersonatedBidder` para os componentes do dashboard. */}
        <ConsignorOverviewPage />
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
            Selecione um arrematante para visualizar seu dashboard e dados como se você fosse ele.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-lg">
             <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Arrematante</label>
              <Select value={selectedBidderId || ''} onValueChange={setSelectedBidderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um arrematante..." />
                </SelectTrigger>
                <SelectContent>
                  {bidders.map((bidder) => (
                    <SelectItem key={bidder.id} value={bidder.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{bidder.fullName || bidder.email}</span>
                        <HabilitationStatusBadge status={bidder.habilitationStatus} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleStartImpersonation}
              disabled={loading || !selectedBidderId}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
              Iniciar Visualização
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
