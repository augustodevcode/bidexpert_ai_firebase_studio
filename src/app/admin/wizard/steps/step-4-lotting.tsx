

// src/components/admin/wizard/steps/step-4-lotting.tsx
'use client';

import { useWizard } from '../wizard-context';
import type { Bem, Auction, Lot } from '@/types';
import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/components/admin/lotting/columns';
import { Button } from '@/components/ui/button';
import { Boxes, PackagePlus, Box } from 'lucide-react';
import CreateLotFromBensModal from '@/components/admin/lotting/create-lot-modal';
import { useToast } from '@/hooks/use-toast';
import { createIndividualLotsAction } from '@/app/admin/lots/actions';
import { Separator } from '@/components/ui/separator';

interface Step4LottingProps {
  availableBens: Bem[];
  auctionData: Partial<Auction>;
  onLotCreated: () => void;
}

export default function Step4Lotting({ availableBens, auctionData, onLotCreated }: Step4LottingProps) {
  const { wizardData, setWizardData } = useWizard();
  const [rowSelection, setRowSelection] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [isCreatingIndividualLots, setIsCreatingIndividualLots] = useState(false);

  const bensForLotting = useMemo(() => {
    // Filter out bens that have already been lotted in this wizard session
    const lottedBemIds = new Set(wizardData.createdLots?.flatMap(lot => lot.bemIds || []) || []);
    return availableBens.filter(bem => bem.status === 'DISPONIVEL' && !lottedBemIds.has(bem.id));
  }, [availableBens, wizardData.createdLots]);

  const selectedBens = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    return selectedIndices.map(index => bensForLotting[index]).filter(Boolean);
  }, [rowSelection, bensForLotting]);

  const columns = useMemo(() => createColumns(), []);
  
  const handleCreateGroupedLotClick = () => {
    if (selectedBens.length === 0) {
      toast({
        title: "Nenhum bem selecionado",
        description: "Por favor, selecione um ou mais bens da lista para criar um lote.",
        variant: "destructive",
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleCreateIndividualLotsClick = async () => {
    if (selectedBens.length === 0) {
      toast({ title: "Nenhum bem selecionado", variant: "destructive" });
      return;
    }
    setIsCreatingIndividualLots(true);
    const bemIds = selectedBens.map(b => b.id);
    const result = await createIndividualLotsAction(bemIds, auctionData.id!, auctionData.title);
    if (result.success && result.createdLots) {
        setWizardData(prev => ({
            ...prev,
            createdLots: [...(prev.createdLots || []), ...result.createdLots!]
        }));
        toast({ title: "Sucesso!", description: `${result.createdLots.length} lotes individuais criados.` });
        onLotCreated();
    } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
    setIsCreatingIndividualLots(false);
  };
  
  const handleLotCreatedInModal = (newLot: Lot) => {
    setWizardData(prev => ({
        ...prev,
        createdLots: [...(prev.createdLots || []), newLot]
    }));
    setRowSelection({}); // Clear selection after lot creation
    onLotCreated(); // Call parent to refetch data
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 className="text-lg font-semibold">Loteamento de Bens</h3>
                <p className="text-sm text-muted-foreground">Selecione os bens disponíveis e escolha como loteá-los.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleCreateIndividualLotsClick} variant="outline" className="flex-1" disabled={selectedBens.length === 0 || isCreatingIndividualLots}>
                    <Box className="mr-2 h-4 w-4" /> Lotear Individualmente
                </Button>
                <Button onClick={handleCreateGroupedLotClick} className="flex-1" disabled={selectedBens.length === 0 || isCreatingIndividualLots}>
                    <Boxes className="mr-2 h-4 w-4" /> Agrupar em Lote Único
                </Button>
            </div>
        </div>
        
        <DataTable
          columns={columns}
          data={bensForLotting}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          searchColumnId="title"
          searchPlaceholder="Buscar por título do bem..."
        />
      </div>

      {wizardData.createdLots && wizardData.createdLots.length > 0 && (
        <div className="mt-6">
            <Separator className="my-4" />
            <h4 className="text-md font-semibold mb-2">Lotes Criados Nesta Sessão</h4>
            <div className="space-y-2 rounded-md border p-2 max-h-48 overflow-y-auto">
                {wizardData.createdLots.map(lot => (
                    <div key={lot.id} className="text-sm p-2 bg-secondary/50 rounded-md">
                        <p className="font-medium">Lote {lot.number}: {lot.title}</p>
                        <p className="text-xs text-muted-foreground">
                            {lot.bemIds?.length} bem(ns) | Lance Inicial: R$ {lot.initialPrice?.toLocaleString('pt-br')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      )}

      <CreateLotFromBensModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedBens={selectedBens}
        auctionId={auctionData.id || ''}
        sellerName={auctionData.seller}
        sellerId={auctionData.sellerId}
        onLotCreated={handleLotCreatedInModal}
      />
    </>
  );
}
