// src/components/admin/auction-preparation/tabs/habilitations-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, UserCheck, UserX, Eye, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AuctionPreparationHabilitation } from '@/types';

interface HabilitationsTabProps {
  auction: any;
  habilitations: AuctionPreparationHabilitation[];
}

export function HabilitationsTab({ auction: _auction, habilitations }: HabilitationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
  };

  const filtered = useMemo(() => {
    return habilitations.filter((hab) => {
      const matchesSearch =
        hab.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hab.documentNumber?.includes(searchTerm) ?? false) ||
        (hab.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus =
        statusFilter === 'all' || hab.status === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [habilitations, searchTerm, statusFilter]);

  const totals = useMemo(() => {
    return habilitations.reduce(
      (acc, hab) => {
        acc[hab.status] = (acc[hab.status] ?? 0) + 1;
        return acc;
      },
      { APPROVED: 0, PENDING: 0, REJECTED: 0 } as Record<string, number>
    );
  }, [habilitations]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habilitations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totals.PENDING ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totals.APPROVED ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totals.REJECTED ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Habilitations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Habilitações</CardTitle>
              <CardDescription>
                Usuários cadastrados que se habilitaram para este leilão
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="APPROVED">Aprovados</SelectItem>
                <SelectItem value="REJECTED">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <p className="text-muted-foreground mb-2">
                Nenhuma habilitação recebida ainda
              </p>
              <p className="text-sm text-muted-foreground">
                As habilitações aparecerão aqui quando usuários se cadastrarem para o leilão
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((hab) => (
                  <TableRow key={`${hab.userId}-${hab.createdAt}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{hab.userName}</p>
                        <p className="text-xs text-muted-foreground">{hab.email ?? '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{hab.documentNumber ?? '—'}</TableCell>
                    <TableCell>{hab.email ?? '—'}</TableCell>
                    <TableCell>{hab.phone ?? '—'}</TableCell>
                    <TableCell>
                      {new Date(hab.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[hab.status] ?? 'bg-slate-500'} text-white`}>
                        {statusLabels[hab.status] ?? hab.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Eye className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium">Visualizar Detalhes</p>
              <p className="text-muted-foreground">
                Veja informações completas e documentos do usuário
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UserCheck className="h-4 w-4 mt-1 text-green-600" />
            <div>
              <p className="font-medium">Aprovar Habilitação</p>
              <p className="text-muted-foreground">
                Autorize o usuário a participar do leilão
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UserX className="h-4 w-4 mt-1 text-red-600" />
            <div>
              <p className="font-medium">Rejeitar Habilitação</p>
              <p className="text-muted-foreground">
                Recuse a habilitação com justificativa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
