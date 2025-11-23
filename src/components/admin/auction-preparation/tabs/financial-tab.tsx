// src/components/admin/auction-preparation/tabs/financial-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  DollarSign,
} from 'lucide-react';

interface FinancialTabProps {
  auction: any;
}

export function FinancialTab({ auction }: FinancialTabProps) {
  // Mock data - será substituído por dados reais
  const transactions = [];

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Arrecadado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Despesas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">A receber</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">Margem: 0%</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cobranças
            </CardTitle>
            <CardDescription>Status dos pagamentos dos arrematantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <span className="text-sm">Pagos</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md">
              <span className="text-sm">Pendentes</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
              <span className="text-sm">Atrasados</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas Fiscais
            </CardTitle>
            <CardDescription>Documentação fiscal do leilão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Emitidas</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm">Pendentes</span>
              <span className="font-medium">0</span>
            </div>
            <Button variant="outline" className="w-full mt-2">
              Gerar Notas Pendentes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimentações Financeiras</CardTitle>
              <CardDescription>Histórico de transações do leilão</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Nenhuma movimentação financeira registrada
              </p>
              <p className="text-sm text-muted-foreground">
                As transações aparecerão aqui após os arremates e pagamentos
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Transactions will be mapped here */}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Comissão do Leiloeiro</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Marketing e Divulgação</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Taxas e Tributos</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Outros Custos</span>
              <span className="font-medium">R$ 0,00</span>
            </div>
            <div className="pt-3 border-t flex items-center justify-between font-medium">
              <span>Total de Custos</span>
              <span>R$ 0,00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
