// src/components/admin/auction-preparation/tabs/lotting-tab.tsx
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Grid3x3 } from 'lucide-react';
import type { AuctionPreparationAssetSummary } from '@/types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface LottingTabProps {
  auction: any;
  availableAssets: AuctionPreparationAssetSummary[];
}

export function LottingTab({ auction, availableAssets }: LottingTabProps) {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  const filteredAssets = useMemo(() => {
    return availableAssets.filter((asset) => {
      const matchesSearch = asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.judicialProcessNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (asset.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesSource =
        filterSource === 'all' ||
        (filterSource === 'process' && asset.source === 'PROCESS') ||
        (filterSource === 'consignor' && asset.source === 'CONSIGNOR');
      return matchesSearch && matchesSource;
    });
  }, [availableAssets, searchTerm, filterSource]);

  const toggleAssetSelection = (assetId: string, checked: boolean) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(assetId);
      } else {
        next.delete(assetId);
      }
      return next;
    });
  };

  const isJudicial = auction.type === 'JUDICIAL';
  const hasAssets = filteredAssets.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Loteamento de Bens</CardTitle>
              <CardDescription>
                {isJudicial
                  ? 'Selecione bens de processos e comitentes para criar lotes'
                  : 'Selecione bens de comitentes para criar lotes'}
              </CardDescription>
            </div>
            <Button disabled={selectedAssets.size === 0}>
              <Grid3x3 className="h-4 w-4 mr-2" />
              Criar Lote ({selectedAssets.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar bens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {isJudicial && <SelectItem value="process">Processos Judiciais</SelectItem>}
                <SelectItem value="consignor">Comitentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bens Disponíveis</CardTitle>
            {hasAssets && (
              <Badge variant="secondary" className="text-xs">
                {filteredAssets.length} itens prontos para loteamento
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasAssets ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum bem disponível para loteamento
              </p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Bem
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Bem</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssets.has(asset.id);
                  return (
                    <TableRow key={asset.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleAssetSelection(asset.id, Boolean(checked))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium leading-tight">{asset.title}</p>
                          {asset.judicialProcessNumber && (
                            <p className="text-xs text-muted-foreground">
                              Processo {asset.judicialProcessNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{asset.categoryName ?? '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            asset.source === 'PROCESS'
                              ? 'border-blue-200 text-blue-700'
                              : 'border-emerald-200 text-emerald-700'
                          }
                        >
                          {asset.source === 'PROCESS'
                            ? 'Processo Judicial'
                            : 'Comitente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {currencyFormatter.format(asset.evaluationValue ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={asset.status === 'DISPONIVEL' ? 'secondary' : 'outline'}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lotting Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>1.</strong> Selecione os bens que deseja agrupar em um lote
          </p>
          <p>
            <strong>2.</strong> Clique em "Criar Lote" para abrir o formulário
          </p>
          <p>
            <strong>3.</strong> Configure os parâmetros do lote (lance inicial, incremento, etc.)
          </p>
          <p>
            <strong>4.</strong> O lote ficará vinculado a este leilão
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
