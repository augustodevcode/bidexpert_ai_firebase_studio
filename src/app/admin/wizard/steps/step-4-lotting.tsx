// src/components/admin/wizard/steps/step-4-lotting.tsx
'use client';

import { useWizard } from '../wizard-context';
import type { Bem, Auction, Lot } from '@/types';
import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/components/admin/lotting/columns';
import { Button } from '@/components/ui/button';
import { Boxes, PackagePlus, Box, Package as PackageIcon } from 'lucide-react';
import CreateLotFromBensModal from '@/components/admin/lotting/create-lot-modal';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';

interface Step4LottingProps {
  availableBens: Bem[];
  auctionData: Partial<Auction>;
  onLotCreated: () => void;
  onAddNewBem: () => void;
}

export default function Step4Lotting({ availableBens, auctionData, onLotCreated, onAddNewBem }: Step4LottingProps) {
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
    return selectedIndices.map(index => bensForLotting[index]).filter(Boolean) as Bem[];
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

  const handleCreateIndividualLotsClick = () => {
    if (selectedBens.length === 0) {
      toast({ title: "Nenhum bem selecionado", variant: "destructive" });
      return;
    }
    setIsCreatingIndividualLots(true);
    const newLots: Lot[] = selectedBens.map((bem, index) => {
      const lotNumber = (wizardData.createdLots?.length || 0) + index + 1;
      return {
        id: `temp-lot-${uuidv4()}`,
        publicId: `temp-pub-${uuidv4().substring(0,8)}`,
        title: bem.title,
        number: String(lotNumber).padStart(3, '0'),
        price: bem.evaluationValue || 0,
        initialPrice: bem.evaluationValue || 0,
        bemIds: [bem.id],
        status: 'EM_BREVE',
        categoryId: bem.categoryId,
        subcategoryId: bem.subcategoryId,
        auctionId: auctionData.id || 'TBD',
      } as Lot;
    });

    setWizardData(prev => ({
        ...prev,
        createdLots: [...(prev.createdLots || []), ...newLots]
    }));
    toast({ title: "Sucesso!", description: `${newLots.length} lotes individuais preparados.` });
    onLotCreated();
    setRowSelection({});
    setIsCreatingIndividualLots(false);
  };
  
  const handleLotCreatedInModal = (newLotData: Omit<Lot, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auctionId'>) => {
    const newCompleteLot: Lot = {
        ...(newLotData as Lot),
        id: `temp-lot-${uuidv4()}`,
        publicId: `temp-pub-${uuidv4().substring(0,8)}`,
        auctionId: auctionData.id || 'TBD',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    setWizardData(prev => ({
        ...prev,
        createdLots: [...(prev.createdLots || []), newCompleteLot]
    }));
    setRowSelection({});
    onLotCreated();
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 className="text-lg font-semibold">Loteamento de Bens</h3>
                <p className="text-sm text-muted-foreground">Selecione os bens disponíveis e loteie-os, ou cadastre um novo bem.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                <Button onClick={onAddNewBem} variant="secondary">
                  <PackagePlus className="mr-2 h-4 w-4" /> Cadastrar Novo Bem
                </Button>
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
            <h4 className="text-md font-semibold mb-2">Lotes Preparados Nesta Sessão</h4>
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
        onLotCreated={handleLotCreatedInModal}
      />
    </>
  );
}
