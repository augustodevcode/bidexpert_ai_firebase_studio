// src/components/dashboard/bidder/won-lots-section.tsx
/**
 * @fileoverview Seção de lotes arrematados no dashboard do bidder
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Trophy,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CreditCard,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { WonLot, WonLotsFilters, WonLotsSortField } from '@/types/bidder-dashboard';

interface WonLotsSectionProps {}

export function WonLotsSection({}: WonLotsSectionProps) {
  const [wonLots, setWonLots] = useState<WonLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<WonLotsFilters>({});
  const [sort, setSort] = useState<{ field: WonLotsSortField; direction: 'asc' | 'desc' }>({
    field: 'wonAt',
    direction: 'desc'
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLot, setSelectedLot] = useState<WonLot | null>(null);

  // TODO: Implementar hooks para buscar dados
  // const { wonLots, loading, pagination } = useWonLots();

  useEffect(() => {
    // TODO: Implementar busca de dados
    setLoading(false);
  }, [filters, sort, search, page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WON':
        return <Badge variant="default"><Trophy className="h-3 w-3 mr-1" />Ganho</Badge>;
      case 'PAID':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'DELIVERED':
        return <Badge variant="outline"><Truck className="h-3 w-3 mr-1" />Entregue</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'PAGO':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'ATRASADO':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePay = (lotId: string) => {
    // TODO: Implementar modal de pagamento
    console.log('Pay lot:', lotId);
  };

  const handleGenerateBoleto = (lotId: string) => {
    // TODO: Implementar geração de boleto
    console.log('Generate boleto:', lotId);
  };

  const handleViewDetails = (lot: WonLot) => {
    setSelectedLot(lot);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Meus Arremates
          </CardTitle>
          <CardDescription>
            Gerencie todos os lotes que você arrematou
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título do lote..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status?.[0] || ''}
              onValueChange={(value) => setFilters({ ...filters, status: value ? [value] : undefined })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status do arremate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="WON">Ganho</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="DELIVERED">Entregue</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.paymentStatus?.[0] || ''}
              onValueChange={(value) => setFilters({ ...filters, paymentStatus: value ? [value] : undefined })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status do pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="ATRASADO">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Valor do Arremate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Data do Arremate</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : wonLots.length > 0 ? (
                  wonLots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lot.title}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {lot.lotId.toString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          R$ {lot.finalBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: R$ {lot.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lot.status)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(lot.paymentStatus)}
                        {lot.paymentStatus === 'PENDENTE' && lot.dueDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Vence: {lot.dueDate.toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lot.deliveryStatus === 'PENDING' ? 'Pendente' :
                           lot.deliveryStatus === 'SHIPPED' ? 'Enviado' :
                           lot.deliveryStatus === 'DELIVERED' ? 'Entregue' : lot.deliveryStatus}
                        </Badge>
                        {lot.trackingCode && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {lot.trackingCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {lot.wonAt.toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(lot)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {lot.paymentStatus === 'PENDENTE' && (
                              <DropdownMenuItem onClick={() => handlePay(lot.id)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pagar Agora
                              </DropdownMenuItem>
                            )}
                            {lot.paymentStatus === 'PENDENTE' && (
                              <DropdownMenuItem onClick={() => handleGenerateBoleto(lot.id)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Gerar Boleto
                              </DropdownMenuItem>
                            )}
                            {lot.deliveryStatus === 'SHIPPED' && (
                              <DropdownMenuItem>
                                <Truck className="h-4 w-4 mr-2" />
                                Acompanhar Entrega
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Trophy className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Nenhum lote arrematado encontrado</p>
                        <p className="text-sm text-muted-foreground">
                          Explore os leilões disponíveis para fazer seu primeiro arremate!
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {/* TODO: Implementar paginação */}
        </CardContent>
      </Card>

      {/* Lot Details Modal */}
      <Dialog open={!!selectedLot} onOpenChange={() => setSelectedLot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Arremate</DialogTitle>
            <DialogDescription>
              Informações completas sobre o lote arrematado
            </DialogDescription>
          </DialogHeader>

          {selectedLot && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Título do Lote</label>
                  <p className="font-medium">{selectedLot.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor do Arremate</label>
                  <p className="font-bold text-lg">
                    R$ {selectedLot.finalBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                  <p className="font-medium">
                    R$ {selectedLot.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Arremate</label>
                  <p className="font-medium">{selectedLot.wonAt.toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedLot.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pagamento</label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedLot.paymentStatus)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entrega</label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedLot.deliveryStatus}</Badge>
                    {selectedLot.trackingCode && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Código: {selectedLot.trackingCode}
                      </p>
                    )}
                  </div>
                </div>
                {selectedLot.dueDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vencimento</label>
                    <p className="font-medium">{selectedLot.dueDate.toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {selectedLot.invoiceUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nota Fiscal</label>
                  <Button variant="outline" size="sm" className="ml-2">
                    <FileText className="h-4 w-4 mr-2" />
                    Baixar NF
                  </Button>
                </div>
              )}

              {selectedLot.receiptUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Comprovante</label>
                  <Button variant="outline" size="sm" className="ml-2">
                    <FileText className="h-4 w-4 mr-2" />
                    Baixar Recibo
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {selectedLot.paymentStatus === 'PENDENTE' && (
                  <>
                    <Button onClick={() => handlePay(selectedLot.id)}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar Agora
                    </Button>
                    <Button variant="outline" onClick={() => handleGenerateBoleto(selectedLot.id)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Boleto
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedLot(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
