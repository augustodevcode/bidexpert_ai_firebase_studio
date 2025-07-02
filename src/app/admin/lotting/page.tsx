// src/app/admin/lotting/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getJudicialProcesses } from '../judicial-processes/actions';
import { getBens } from '../bens/actions';
import type { JudicialProcess, Bem } from '@/types';
import { Boxes, Package, FileText, Loader2, AlertCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
// Future import: import { createLotWithBens } from '../lots/actions';

export default function LoteamentoPage() {
  const [processes, setProcesses] = useState<JudicialProcess[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [bens, setBens] = useState<Bem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBens, setIsLoadingBens] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = React.useState({});
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProcesses() {
      setIsLoading(true);
      try {
        const fetchedProcesses = await getJudicialProcesses();
        setProcesses(fetchedProcesses);
      } catch (e) {
        setError('Falha ao buscar processos judiciais.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProcesses();
  }, []);

  useEffect(() => {
    async function fetchBensForProcess() {
      if (!selectedProcessId) {
        setBens([]);
        return;
      }
      setIsLoadingBens(true);
      try {
        const fetchedBens = await getBens(selectedProcessId);
        setBens(fetchedBens.filter(b => b.status === 'DISPONIVEL'));
      } catch (e) {
        setError('Falha ao buscar os bens do processo selecionado.');
        setBens([]);
      } finally {
        setIsLoadingBens(false);
      }
    }
    fetchBensForProcess();
  }, [selectedProcessId]);

  const handleCreateLot = async () => {
    const selectedBemIds = Object.keys(rowSelection);
    if (selectedBemIds.length === 0) {
        toast({ title: "Nenhum bem selecionado", description: "Selecione um ou mais bens para criar um lote.", variant: "destructive" });
        return;
    }
    // Placeholder for future implementation
    console.log("Creating lot with Bem IDs:", selectedBemIds);
    toast({ title: "Funcionalidade em Desenvolvimento", description: `Lote seria criado com ${selectedBemIds.length} bens.` });
    // Example call:
    // const result = await createLotWithBens(selectedBemIds);
    // if(result.success) { router.push(`/admin/lots/${result.lotId}/edit`) }
  }

  const columns = useMemo(() => createColumns(), []);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Boxes className="h-6 w-6 mr-2 text-primary" />
            Loteamento de Bens
          </CardTitle>
          <CardDescription>
            Agrupe bens de um processo judicial em lotes para serem leiloados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="max-w-md space-y-2">
                <label htmlFor="process-select" className="text-sm font-medium">Selecione um Processo Judicial</label>
                <Select
                    value={selectedProcessId}
                    onValueChange={setSelectedProcessId}
                    disabled={isLoading}
                >
                    <SelectTrigger id="process-select">
                        <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {processes.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.processNumber}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2"><Package/> Bens Disponíveis no Processo</CardTitle>
                        <CardDescription>Selecione os bens que farão parte do novo lote.</CardDescription>
                    </div>
                    <Button onClick={handleCreateLot} disabled={Object.keys(rowSelection).length === 0}>
                        <Boxes className="mr-2 h-4 w-4" />
                        Criar Lote com Selecionados
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoadingBens ? (
                         <div className="flex items-center justify-center h-48">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando bens...
                        </div>
                    ) : selectedProcessId && bens.length === 0 ? (
                        <div className="text-center py-10">
                            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2"/>
                            <p>Nenhum bem disponível encontrado para este processo.</p>
                        </div>
                    ) : !selectedProcessId ? (
                        <div className="text-center py-10">
                            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2"/>
                            <p>Selecione um processo para visualizar os bens associados.</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={bens}
                            rowSelection={rowSelection}
                            setRowSelection={setRowSelection}
                            enableRowSelection={true}
                            searchColumnId="title"
                            searchPlaceholder="Buscar por título do bem..."
                        />
                    )}
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}
