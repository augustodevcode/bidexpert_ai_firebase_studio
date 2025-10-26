// src/components/dashboard/bidder/history-section.tsx
/**
 * @fileoverview Seção de histórico de participações no dashboard do bidder
 */

'use client';

import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History,
  Search,
  Filter,
  Trophy,
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye
} from 'lucide-react';
import { ParticipationHistory, ParticipationResult } from '@/types/bidder-dashboard';

interface HistorySectionProps {}

export function HistorySection({}: HistorySectionProps) {
  const [participations, setParticipations] = useState<ParticipationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<ParticipationResult | ''>('');
  const [selectedParticipation, setSelectedParticipation] = useState<ParticipationHistory | null>(null);

  // TODO: Implementar hooks para buscar dados
  // const { participations, summary, loading } = useParticipationHistory();

  useEffect(() => {
    // TODO: Implementar busca de dados
    setLoading(false);
  }, [search, resultFilter]);

  const getResultBadge = (result: ParticipationResult) => {
    switch (result) {
      case 'WON':
        return (
          <Badge variant="default" className="bg-green-500">
            <Trophy className="h-3 w-3 mr-1" />
            Ganho
          </Badge>
        );
      case 'LOST':
        return (
          <Badge variant="secondary">
            <X className="h-3 w-3 mr-1" />
            Perdido
          </Badge>
        );
      case 'WITHDRAWN':
        return (
          <Badge variant="outline">
            Retirado
          </Badge>
        );
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const getResultColor = (result: ParticipationResult) => {
    switch (result) {
      case 'WON':
        return 'text-green-600';
      case 'LOST':
        return 'text-red-600';
      case 'WITHDRAWN':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleViewDetails = (participation: ParticipationHistory) => {
    setSelectedParticipation(participation);
  };

  const calculateWinRate = () => {
    if (participations.length === 0) return 0;
    const won = participations.filter(p => p.result === 'WON').length;
    return (won / participations.length) * 100;
  };

  const calculateTotalSpent = () => {
    return participations
      .filter(p => p.result === 'WON')
      .reduce((total, p) => total.add(p.finalBid || 0), new Decimal(0));
  };

  const calculateAverageBid = () => {
    const bids = participations.filter(p => p.maxBid).map(p => p.maxBid!);
    if (bids.length === 0) return new Decimal(0);
    const total = bids.reduce((sum, bid) => sum.add(bid), new Decimal(0));
    return total.div(bids.length);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Participações
          </CardTitle>
          <CardDescription>
            Acompanhe todas as suas participações em leilões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {participations.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Participações</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {participations.filter(p => p.result === 'WON').length}
              </div>
              <div className="text-sm text-green-600">Arremates Ganhos</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {calculateWinRate().toFixed(1)}%
              </div>
              <div className="text-sm text-blue-600">Taxa de Sucesso</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                R$ {calculateTotalSpent().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-purple-600">Total Investido</div>
            </div>
          </div>

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
              value={resultFilter}
              onValueChange={(value) => setResultFilter(value as ParticipationResult | '')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="WON">Ganho</SelectItem>
                <SelectItem value="LOST">Perdido</SelectItem>
                <SelectItem value="WITHDRAWN">Retirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Leilão</TableHead>
                  <TableHead>Seu Lance Máximo</TableHead>
                  <TableHead>Lance Final</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Nº de Lances</TableHead>
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
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : participations.length > 0 ? (
                  participations.map((participation) => (
                    <TableRow key={participation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{participation.title}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {participation.lotId.toString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{participation.auctionName}</div>
                      </TableCell>
                      <TableCell>
                        {participation.maxBid ? (
                          <span className="font-medium">
                            R$ {participation.maxBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {participation.finalBid ? (
                          <span className="font-medium">
                            R$ {participation.finalBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getResultBadge(participation.result)}
                      </TableCell>
                      <TableCell>
                        {participation.participatedAt.toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {participation.bidCount} lance{participation.bidCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(participation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <History className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Nenhuma participação encontrada</p>
                        <p className="text-sm text-muted-foreground">
                          Explore os leilões disponíveis para participar!
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Performance Summary */}
          {participations.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Análise de Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {calculateWinRate().toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    R$ {calculateAverageBid().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Lance Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {participations.filter(p => p.bidCount > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Leilões Ativos</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participation Details Modal */}
      <Dialog open={!!selectedParticipation} onOpenChange={() => setSelectedParticipation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Participação</DialogTitle>
            <DialogDescription>
              Informações completas sobre sua participação neste leilão
            </DialogDescription>
          </DialogHeader>

          {selectedParticipation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lote</label>
                  <p className="font-medium">{selectedParticipation.title}</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedParticipation.lotId.toString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Leilão</label>
                  <p className="font-medium">{selectedParticipation.auctionName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Seu Lance Máximo</label>
                  <p className="font-bold text-lg">
                    {selectedParticipation.maxBid
                      ? `R$ ${selectedParticipation.maxBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'Não informado'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lance Final</label>
                  <p className="font-medium">
                    {selectedParticipation.finalBid
                      ? `R$ ${selectedParticipation.finalBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'Leilão em andamento'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resultado</label>
                  <div className="mt-1">{getResultBadge(selectedParticipation.result)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número de Lances</label>
                  <p className="font-medium">{selectedParticipation.bidCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data da Participação</label>
                  <p className="font-medium">
                    {selectedParticipation.participatedAt.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                  <p className="font-medium">
                    {selectedParticipation.createdAt.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {selectedParticipation.result === 'WON' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Parabéns! Você ganhou este leilão.</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Verifique a seção "Meus Arremates" para mais informações sobre o pagamento e entrega.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedParticipation(null)}>
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
