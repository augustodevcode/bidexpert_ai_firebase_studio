
// src/components/admin/wizard/steps/step-4-lotting.tsx
'use client';

import { useWizard } from '../wizard-context';
import type { Bem, Auction } from '@/types';
import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/components/admin/lotting/columns';
import { Button } from '@/components/ui/button';
import { Boxes } from 'lucide-react';
import CreateLotFromBensModal from '@/components/admin/lotting/create-lot-modal';
import { useToast } from '@/hooks/use-toast';

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
  
  const handleCreateLotClick = () => {
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
  
  const handleLotCreated = () => {
    setRowSelection({}); // Clear selection after lot creation
    onLotCreated(); // Call parent to refetch data
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold">Loteamento de Bens</h3>
                <p className="text-sm text-muted-foreground">Selecione os bens disponíveis abaixo e agrupe-os em um lote.</p>
            </div>
            <Button onClick={handleCreateLotClick} disabled={selectedBens.length === 0}>
                <Boxes className="mr-2 h-4 w-4" />
                Criar Lote ({selectedBens.length} selecionados)
            </Button>
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

      <CreateLotFromBensModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedBens={selectedBens}
        auctionId={auctionData.id || ''} // Should have an ID at this point
        sellerName={auctionData.seller}
        sellerId={auctionData.sellerId}
        onLotCreated={handleLotCreated}
      />
    </>
  );
}
