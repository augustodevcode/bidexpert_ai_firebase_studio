// src/components/admin/auction-preparation/tabs/closing-tab.tsx
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
import { HandCoins, FileText, Download, CheckCircle, Clock } from 'lucide-react';

interface ClosingTabProps {
  auction: any;
}

export function ClosingTab({ auction }: ClosingTabProps) {
  // Mock data - será substituído por dados reais
  const closedLots = [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lotes Arrematados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">De 0 total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">Arrecadado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aguardando Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Pagos</p>
          </CardContent>
        </Card>
      </div>

      {/* Winners List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Arrematantes</CardTitle>
              <CardDescription>Lotes arrematados e seus vencedores</CardDescription>
            </div>
            <Button variant="outline" disabled={closedLots.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {closedLots.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <HandCoins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Nenhum lote arrematado ainda</p>
              <p className="text-sm text-muted-foreground">
                Os arremates aparecerão aqui após o encerramento dos lotes
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Arrematante</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Winners will be mapped here */}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Pagamentos Confirmados</span>
              </div>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span className="text-sm">Aguardando Confirmação</span>
              </div>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm">Pagamentos Atrasados</span>
              </div>
              <span className="font-medium">0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" disabled>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Auto de Arrematação
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar Pagamento em Lote
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados para Comitentes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
