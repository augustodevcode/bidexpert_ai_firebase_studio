// src/app/consignor-dashboard/financial/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart3, TrendingUp, CircleDollarSign, Loader2, AlertCircle, Gavel, ListChecks, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { createFinancialColumns } from './columns';
import { getFinancialDataForConsignor } from './actions';
import type { UserWin, SellerProfileInfo } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getPaymentStatusText } from '@/lib/sample-data-helpers';
import { LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { hasPermission } from '@/lib/permissions';
import { getSellers } from '@/app/admin/sellers/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialStats = {
  totalRevenue: 0,
  totalCommission: 0,
  netValue: 0,
  paidCount: 0,
};

export default function ConsignorFinancialPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [wins, setWins] = useState<UserWin[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isUserAdmin = hasPermission(userProfileWithPermissions, 'manage_all');

  useEffect(() => {
    if (isUserAdmin) {
      getSellers().then(sellers => {
        setAllSellers(sellers);
        if (!selectedSellerId && sellers.length > 0) {
          setSelectedSellerId(sellers[0].id);
        }
      });
    }
  }, [isUserAdmin, selectedSellerId]);

  const fetchFinancials = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userWins = await getFinancialDataForConsignor(sellerId);
      setWins(userWins);
    } catch (err) {
      console.error("Error fetching consignor financials:", err);
      toast({ title: "Erro ao buscar dados financeiros", variant: "destructive" });
      setError("Não foi possível carregar os dados financeiros.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const targetSellerId = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    if (!authLoading && targetSellerId) {
      fetchFinancials(targetSellerId);
    } else if (!authLoading && !isUserAdmin) {
      setError("Perfil de comitente não encontrado.");
      setIsLoading(false);
    } else if (!authLoading && isUserAdmin && allSellers.length === 0) {
        setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchFinancials, isUserAdmin, selectedSellerId, allSellers.length]);

  const columns = useMemo(() => createFinancialColumns(), []);

  const { totalRevenue, totalCommission, netValue, paidCount } = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    wins.forEach(win => {
      if (win.paymentStatus === 'PAGO') {
        totalRevenue += win.winningBidAmount;
        paidCount++;
      }
    });
    const totalCommission = totalRevenue * 0.05; // Assuming a flat 5% commission
    const netValue = totalRevenue - totalCommission;
    return { totalRevenue, totalCommission, netValue, paidCount };
  }, [wins]);

  const statusOptions = useMemo(() => 
    [...new Set(wins.map(w => w.paymentStatus))]
      .map(status => ({ value: status, label: getPaymentStatusText(status) })),
  [wins]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'paymentStatus', title: 'Status Pagamento', options: statusOptions },
  ], [statusOptions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <DollarSign className="h-7 w-7 mr-3 text-primary" />
            Relatório Financeiro
          </CardTitle>
          <CardDescription>
            Acompanhe o faturamento, comissões e valores a receber de seus leilões.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {isUserAdmin && (
        <Card>
            <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2"><Users /> Selecionar Comitente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSellerId || ''} onValueChange={setSelectedSellerId}>
                  <SelectTrigger className="w-full md:w-[300px] mt-1">
                      <SelectValue placeholder="Selecione um comitente..." />
                  </SelectTrigger>
                  <SelectContent>
                      {allSellers.map(seller => (
                          <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Faturamento Bruto (Pago)</CardTitle><BarChart3 className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Comissão da Plataforma</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valor Líquido a Receber</CardTitle><CircleDollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold text-primary">{netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lotes Pagos</CardTitle><Gavel className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">{paidCount}</div></CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Extrato de Arremates</CardTitle>
              <CardDescription>Lista detalhada de todos os lotes vendidos e seus status financeiros.</CardDescription>
          </CardHeader>
          <CardContent>
              <DataTable
                columns={columns}
                data={wins}
                isLoading={isLoading || authLoading}
                error={error}
                searchColumnId="lot.title"
                searchPlaceholder="Buscar por lote..."
                facetedFilterColumns={facetedFilterColumns}
              />
          </CardContent>
      </Card>
    </div>
  );
}
