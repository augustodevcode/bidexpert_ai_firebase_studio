'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Wallet, PiggyBank, Clock } from 'lucide-react';
import type { UserWin } from '@/types';

interface WinsKPIProps {
  wins: UserWin[];
}

export function WinsKPI({ wins }: WinsKPIProps) {
  const totalWins = wins.length;
  
  const totalInvestment = wins.reduce((acc, win) => {
    const commission = win.winningBidAmount * 0.05;
    return acc + win.winningBidAmount + commission;
  }, 0);

  const pendingPayments = wins.filter(win => win.paymentStatus === 'PENDENTE').length;

  const potentialSavings = wins.reduce((acc, win) => {
    const marketValue = win.lot?.evaluationValue || 0;
    const paidValue = win.winningBidAmount;
    if (marketValue > paidValue) {
      return acc + (marketValue - paidValue);
    }
    return acc;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Arremates</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWins}</div>
          <p className="text-xs text-muted-foreground">
            Lotes conquistados
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
          <p className="text-xs text-muted-foreground">
            Incluindo comissão (5%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Economia Estimada</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(potentialSavings)}</div>
          <p className="text-xs text-muted-foreground">
            Vs. Avaliação de Mercado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{pendingPayments}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando regularização
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
