'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: string;
  oldValues?: any;
  newValues?: any;
  traceId?: string;
  changes?: any;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'ALL') params.append('action', filterAction);
      // Simulating search on client or passed to API if supported
      
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Logs de Atividade (Audit 360º)</h1>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por ID ou Entidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Ações</SelectItem>
              <SelectItem value="CREATE">Criação (Create)</SelectItem>
              <SelectItem value="UPDATE">Atualização (Update)</SelectItem>
              <SelectItem value="DELETE">Exclusão (Delete)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID Entidade</TableHead>
                  <TableHead>Trace ID</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.filter(l => 
                    l.entityType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    l.entityId.includes(searchTerm)
                  ).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          log.action === 'CREATE' ? 'default' :
                          log.action === 'UPDATE' ? 'secondary' :
                          log.action === 'DELETE' ? 'destructive' : 'outline'
                        }>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.traceId ? (
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {log.traceId.substring(0, 8)}...
                            </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                         <pre className="text-xs max-w-[200px] overflow-hidden whitespace-nowrap text-muted-foreground">
                            {JSON.stringify(log.newValues || log.changes || {})}
                         </pre>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
