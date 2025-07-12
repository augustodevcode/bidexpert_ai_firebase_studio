// src/app/admin/import/cnj/page.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, FileDown, AlertTriangle, FileUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { searchByProcessNumber, searchByClassAndCourt, importCnjProcesses, type CnjSearchResponse, type CnjHit } from './actions';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export default function CnjImportPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // State for search by number
  const [tribunal, setTribunal] = React.useState('trf1');
  const [processNumber, setProcessNumber] = React.useState('');

  // State for search by class/court
  const [tribunalClass, setTribunalClass] = React.useState('tjdft');
  const [classCode, setClassCode] = React.useState('');
  const [courtCode, setCourtCode] = React.useState('');

  // State for results and pagination
  const [results, setResults] = React.useState<CnjHit[]>([]);
  const [searchResponse, setSearchResponse] = React.useState<CnjSearchResponse | null>(null);
  const [rowSelection, setRowSelection] = React.useState({});
  const [isImporting, setIsImporting] = React.useState(false);

  const handleSearch = async (e: React.FormEvent, searchType: 'number' | 'class') => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchResponse(null);
    setRowSelection({});

    try {
      if (searchType === 'number') {
        if (!processNumber || !tribunal) {
            throw new Error("Número do processo e tribunal são obrigatórios.");
        }
        const res = await searchByProcessNumber(processNumber, tribunal);
        setResults(res.hits.hits || []);
        setSearchResponse(res);
      } else {
         if (!classCode || !courtCode || !tribunalClass) {
            throw new Error("Código da classe, do órgão e tribunal são obrigatórios.");
        }
        const res = await searchByClassAndCourt(classCode, courtCode, tribunalClass);
        setResults(res.hits.hits || []);
        setSearchResponse(res);
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Erro na Busca", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePaginate = async () => {
      if (!searchResponse || results.length === 0) return;
      const lastHit = results[results.length - 1];
      if (!lastHit.sort) return;

      setIsLoading(true);
      try {
        const res = await searchByClassAndCourt(classCode, courtCode, tribunalClass, 100, lastHit.sort);
        setResults(prev => [...prev, ...res.hits.hits]);
        setSearchResponse(res);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Erro na Paginação", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  }

  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection).map(index => results[parseInt(index)]).filter(Boolean);
  }, [rowSelection, results]);

  const handleImport = async () => {
    if (selectedRows.length === 0) {
      toast({ title: "Nenhum processo selecionado", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    const sourcesToImport = selectedRows.map(row => row._source);
    try {
      const result = await importCnjProcesses(sourcesToImport);
       toast({
        title: "Importação Concluída",
        description: `${result.successCount} processos importados com sucesso. ${result.errorCount} falharam.`,
        variant: result.errorCount > 0 ? "default" : "default"
      });
      if (result.successCount > 0) {
        router.push('/admin/judicial-processes');
      }
    } catch(err: any) {
      toast({ title: "Erro na Importação", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const columns = React.useMemo(() => createColumns(), []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline flex items-center">
          <FileUp className="h-7 w-7 mr-3 text-primary" />
          Importar Processos do Datajud (CNJ)
        </CardTitle>
        <CardDescription>
          Busque processos na Base Nacional de Dados do Poder Judiciário para cadastrá-los rapidamente na plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="number" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="number">Busca por Número</TabsTrigger>
            <TabsTrigger value="class">Busca por Classe/Órgão</TabsTrigger>
          </TabsList>
          
          <TabsContent value="number" className="mt-4">
            <form onSubmit={(e) => handleSearch(e, 'number')} className="p-4 border rounded-lg bg-secondary/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="processNumber">Número Único do Processo</Label>
                  <Input id="processNumber" value={processNumber} onChange={(e) => setProcessNumber(e.target.value)} required />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="tribunalNumber">Tribunal</Label>
                  <Input id="tribunalNumber" value={tribunal} onChange={(e) => setTribunal(e.target.value)} required placeholder="Ex: trf1, tjdft" />
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                Buscar Processo
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="class" className="mt-4">
            <form onSubmit={(e) => handleSearch(e, 'class')} className="p-4 border rounded-lg bg-secondary/50 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-1">
                  <Label htmlFor="classCode">Código da Classe</Label>
                  <Input id="classCode" value={classCode} onChange={(e) => setClassCode(e.target.value)} required placeholder="Ex: 1116"/>
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="courtCode">Código do Órgão Julgador</Label>
                  <Input id="courtCode" value={courtCode} onChange={(e) => setCourtCode(e.target.value)} required placeholder="Ex: 13597"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tribunalClass">Tribunal</Label>
                  <Input id="tribunalClass" value={tribunalClass} onChange={(e) => setTribunalClass(e.target.value)} required placeholder="Ex: tjdft"/>
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                Buscar por Classe/Órgão
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold">Resultados da Busca</h3>
             <Button onClick={handleImport} disabled={isImporting || selectedRows.length === 0}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileDown className="mr-2 h-4 w-4"/>}
                Importar ({selectedRows.length})
             </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="h-5 w-5"/>
              <p>{error}</p>
            </div>
          )}
          <DataTable
            columns={columns}
            data={results}
            isLoading={isLoading}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            searchPlaceholder="Filtrar resultados..."
          />
          {searchResponse && searchResponse.hits.total.value > results.length && (
            <div className="mt-4 text-center">
                <Button onClick={handlePaginate} variant="outline" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Carregar mais resultados
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Exibindo {results.length} de {searchResponse.hits.total.value} resultados</p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
