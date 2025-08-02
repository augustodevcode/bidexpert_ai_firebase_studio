// src/app/admin/lotting/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getJudicialProcesses } from '../judicial-processes/actions';
import { getBens } from '../bens/actions';
import { getAuctions } from '../auctions/actions';
import type { JudicialProcess, Bem, Auction, Lot } from '@/types';
import { Boxes, Box, Eye, FileText, Loader2, AlertCircle, Package } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/components/admin/lotting/columns';
import { useToast } from '@/hooks/use-toast';
import CreateLotFromBensModal from '@/components/admin/lotting/create-lot-modal';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import BemDetailsModal from '@/components/admin/bens/bem-details-modal';
import { createLot } from '../lots/actions'; // Import the createLot server action

export default function LoteamentoPage() {
  const [processes, setProcesses] = useState<JudicialProcess[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>('');
  
  const [bens, setBens] = useState<Bem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBens, setIsLoadingBens] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isBemModalOpen, setIsBemModalOpen] = useState(false);
  const [selectedBemForModal, setSelectedBemForModal] = useState<Bem | null>(null);
  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedProcesses, fetchedAuctions] = await Promise.all([
        getJudicialProcesses(),
        getAuctions()
      ]);
      setProcesses(fetchedProcesses);
      setAuctions(fetchedAuctions);
    } catch (e) {
      setError('Falha ao buscar dados iniciais.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchBensForProcess = useCallback(async () => {
    if (!selectedProcessId) {
      setBens([]);
      return;
    }
    setIsLoadingBens(true);
    setRowSelection({});
    try {
      const fetchedBens = await getBens({ judicialProcessId: selectedProcessId });
      setBens(fetchedBens.filter(b => b.status === 'DISPONIVEL'));
    } catch (e) {
      setError('Falha ao buscar os bens do processo selecionado.');
      setBens([]);
    } finally {
      setIsLoadingBens(false);
    }
  }, [selectedProcessId]);

  useEffect(() => {
    fetchBensForProcess();
  }, [fetchBensForProcess]);
  
  const selectedBens = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    return selectedIndices.map(index => bens[index]).filter(Boolean) as Bem[];
  }, [rowSelection, bens]);

  const handleCreateGroupedLotClick = () => {
    if (selectedBens.length === 0 || !selectedAuctionId) {
      toast({
        title: "Seleção Incompleta",
        description: "Por favor, selecione um leilão e pelo menos um bem para criar o lote.",
        variant: "destructive"
      });
      return;
    }
    setIsLotModalOpen(true);
  };
  
  const handleCreateIndividualLotsClick = async () => {
    if (selectedBens.length === 0 || !selectedAuctionId) {
        toast({ title: "Seleção Incompleta", description: "Por favor, selecione um leilão de destino e pelo menos um bem.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const bem of selectedBens) {
        const lotNumber = String(Math.floor(Math.random() * 900) + 100); // Placeholder for a better numbering system
        const newLotData: Partial<Lot> = {
            title: bem.title,
            number: lotNumber,
            price: bem.evaluationValue || 0,
            initialPrice: bem.evaluationValue || 0,
            status: 'EM_BREVE',
            auctionId: selectedAuctionId,
            sellerId: bem.sellerId,
            categoryId: bem.categoryId,
            type: bem.categoryId,
            bemIds: [bem.id],
            imageUrl: bem.imageUrl,
            dataAiHint: bem.dataAiHint,
        };
        const result = await createLot(newLotData);
        if (result.success) {
            successCount++;
        } else {
            errorCount++;
            toast({ title: `Erro ao criar lote para "${bem.title}"`, description: result.message, variant: "destructive"});
        }
    }

    toast({
        title: "Processamento Concluído",
        description: `${successCount} lote(s) criado(s) com sucesso. ${errorCount > 0 ? `${errorCount} falharam.` : ''}`,
    });

    setRowSelection({});
    await fetchBensForProcess(); // Refresh the list of available bens
    setIsSubmitting(false);
  };

  const handleViewBemDetails = (bem: Bem) => {
    setSelectedBemForModal(bem);
    setIsBemModalOpen(true);
  };
  
  const columns = useMemo(() => createColumns({ onOpenDetails: handleViewBemDetails }), []);
  const selectedAuction = auctions.find(a => a.id === selectedAuctionId);

  return (
    <>
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
              <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="process-select">1. Selecione um Processo Judicial</Label>
                      <Select value={selectedProcessId} onValueChange={setSelectedProcessId} disabled={isLoading}>
                          <SelectTrigger id="process-select"><SelectValue placeholder={isLoading ? "Carregando..." : "Selecione..."} /></SelectTrigger>
                          <SelectContent>{processes.map(p => (<SelectItem key={p.id} value={p.id}>{p.processNumber}</SelectItem>))}</SelectContent>
                      </Select>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="auction-select">2. Selecione o Leilão de Destino</Label>
                      <Select value={selectedAuctionId} onValueChange={setSelectedAuctionId} disabled={isLoading}>
                          <SelectTrigger id="auction-select"><SelectValue placeholder={isLoading ? "Carregando..." : "Selecione..."} /></SelectTrigger>
                          <SelectContent>{auctions.map(a => (<SelectItem key={a.id} value={a.id}>{a.title} ({a.publicId})</SelectItem>))}</SelectContent>
                      </Select>
                  </div>
              </div>
              
              <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                          <CardTitle className="text-lg flex items-center gap-2"><Package/> 3. Selecione os Bens Disponíveis</CardTitle>
                          <CardDescription>Selecione os bens que farão parte do novo lote.</CardDescription>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleCreateIndividualLotsClick} variant="outline" disabled={selectedBens.length === 0 || isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Box className="mr-2 h-4 w-4" />}
                            Lotear Individualmente
                        </Button>
                        <Button onClick={handleCreateGroupedLotClick} disabled={selectedBens.length === 0 || isSubmitting}>
                            <Boxes className="mr-2 h-4 w-4" />
                            Agrupar em Lote Único
                        </Button>
                      </div>
                  </CardHeader>
                  <CardContent>
                      {isLoadingBens ? (
                           <div className="flex items-center justify-center h-48"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando bens...</div>
                      ) : selectedProcessId && bens.length === 0 ? (
                          <div className="text-center py-10"><AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2"/><p>Nenhum bem disponível encontrado para este processo.</p></div>
                      ) : !selectedProcessId ? (
                          <div className="text-center py-10"><FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2"/><p>Selecione um processo para visualizar os bens associados.</p></div>
                      ) : (
                          <DataTable
                              columns={columns}
                              data={bens}
                              rowSelection={rowSelection}
                              setRowSelection={setRowSelection}
                              searchColumnId="title"
                              searchPlaceholder="Buscar por título do bem..."
                          />
                      )}
                  </CardContent>
              </Card>
          </CardContent>
        </Card>
      </div>
      {isLotModalOpen && (
        <CreateLotFromBensModal
          isOpen={isLotModalOpen}
          onClose={() => setIsLotModalOpen(false)}
          selectedBens={selectedBens}
          auctionId={selectedAuctionId}
          sellerId={selectedAuction?.sellerId}
          onLotCreated={() => {
            setRowSelection({});
            fetchBensForProcess();
          }}
        />
      )}
       <BemDetailsModal 
        bem={selectedBemForModal} 
        isOpen={isBemModalOpen} 
        onClose={() => setIsBemModalOpen(false)} 
      />
    </>
  );
}
