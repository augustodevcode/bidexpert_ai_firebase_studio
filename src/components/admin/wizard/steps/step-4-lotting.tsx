// src/components/admin/wizard/steps/step-4-lotting.tsx
'use client';

import { useWizard } from '../wizard-context';
import type { Asset, Auction, Lot } from '@/types';
import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/components/admin/lotting/columns';
import { Button } from '@/components/ui/button';
import { Boxes, Box, Eye, PackagePlus } from 'lucide-react';
import CreateLotFromAssetsModal from '@/components/admin/lotting/create-lot-modal';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import AssetDetailsModal from '@/components/admin/assets/asset-details-modal';
import { createLot } from '@/app/admin/lots/actions'; 

interface Step4LottingProps {
  availableAssets: Asset[];
  auctionData: Partial<Auction>;
}

export default function Step4Lotting({ availableAssets, auctionData }: Step4LottingProps) {
  const { wizardData, setWizardData } = useWizard();
  const [rowSelection, setRowSelection] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<Asset | null>(null);
  const { toast } = useToast();
  const [isCreatingIndividualLots, setIsCreatingIndividualLots] = useState(false);

  const assetsForLotting = useMemo(() => {
    // Filter out assets that have already been lotted in this wizard session
    const lottedAssetIds = new Set(wizardData.createdLots?.flatMap(lot => lot.assetIds || []) || []);
    return availableAssets.filter(asset => asset.status === 'DISPONIVEL' && !lottedAssetIds.has(asset.id));
  }, [availableAssets, wizardData.createdLots]);

  const selectedAssets = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    return selectedIndices.map(index => assetsForLotting[index]).filter(Boolean) as Asset[];
  }, [rowSelection, assetsForLotting]);
  
  const handleViewAssetDetails = (asset: Asset) => {
    setSelectedAssetForModal(asset);
    setIsAssetModalOpen(true);
  };
  
  const columns = useMemo(() => createColumns({ onOpenDetails: handleViewAssetDetails }), [handleViewAssetDetails]);

  
  const handleCreateGroupedLotClick = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: "Nenhum ativo selecionado",
        description: "Por favor, selecione um ou mais ativos da lista para criar um lote.",
        variant: "destructive",
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleCreateIndividualLotsClick = async () => {
    if (selectedAssets.length === 0) {
        toast({ title: "Nenhum ativo selecionado", description: "Por favor, selecione pelo menos um ativo.", variant: "destructive" });
        return;
    }
    setIsCreatingIndividualLots(true);
    let successCount = 0;
    let errorCount = 0;

    const selectedAuction = wizardData.auctionDetails;
    const isWizardMode = !auctionData.id; // No wizard, o leilão ainda não foi criado

    for (const asset of selectedAssets) {
        const lotNumber = String((wizardData.createdLots?.length || 0) + successCount + 1).padStart(3, '0');
        const newLotData: Partial<Lot> = {
            title: asset.title,
            number: lotNumber,
            price: asset.evaluationValue || 0,
            initialPrice: asset.evaluationValue || 0,
            status: 'EM_BREVE',
            auctionId: isWizardMode ? undefined : selectedAuction?.id,
            sellerId: selectedAuction?.sellerId,
            categoryId: asset.categoryId,
            type: asset.categoryId || '',
            assetIds: [asset.id],
            imageUrl: asset.imageUrl,
            dataAiHint: asset.dataAiHint,
        };

        if (isWizardMode) {
            // No modo wizard, apenas salva no contexto local (será criado na revisão final)
            const tempLot: Lot = {
                ...(newLotData as Lot),
                id: `temp-lot-${uuidv4()}`,
                publicId: `temp-pub-${uuidv4().substring(0,8)}`,
                auctionId: 'TBD',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            setWizardData(prev => ({
                ...prev,
                createdLots: [...(prev.createdLots || []), tempLot]
            }));
            successCount++;
        } else {
            // Modo edição: cria o lote no banco imediatamente
            const result = await createLot(newLotData);
            if (result.success) {
                successCount++;
                setWizardData(prev => ({
                    ...prev,
                    createdLots: [...(prev.createdLots || []), { ...newLotData, id: result.lotId, publicId: '' } as Lot]
                }));
            } else {
                errorCount++;
                toast({ title: `Erro ao criar lote para "${asset.title}"`, description: result.message, variant: "destructive"});
            }
        }
    }

    toast({
        title: isWizardMode ? "Lotes Preparados" : "Processamento Concluído",
        description: isWizardMode 
            ? `${successCount} lote(s) preparado(s) para criação na revisão final.`
            : `${successCount} lote(s) criado(s) com sucesso. ${errorCount > 0 ? `${errorCount} falharam.` : ''}`,
    });

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
  }

  return (
    <>
      <div className="space-y-4" data-ai-id="wizard-step4-lotting">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 className="text-lg font-semibold">Loteamento de Ativos</h3>
                <p className="text-sm text-muted-foreground">Selecione os ativos disponíveis para criar lotes individuais ou agrupados.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                <Button onClick={handleCreateIndividualLotsClick} variant="outline" className="flex-1" disabled={selectedAssets.length === 0 || isCreatingIndividualLots}>
                    <Box className="mr-2 h-4 w-4" /> Lotear Individualmente
                </Button>
                <Button onClick={handleCreateGroupedLotClick} className="flex-1" disabled={selectedAssets.length === 0 || isCreatingIndividualLots}>
                    <Boxes className="mr-2 h-4 w-4" /> Agrupar em Lote Único
                </Button>
            </div>
        </div>
        
        <DataTable
          columns={columns}
          data={assetsForLotting}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          searchColumnId="title"
          searchPlaceholder="Buscar por título do ativo..."
        />
      </div>

      {wizardData.createdLots && wizardData.createdLots.length > 0 && (
        <div className="mt-6">
            <Separator className="my-4" />
            <h4 className="text-md font-semibold mb-2">Lotes Preparados Nesta Sessão ({wizardData.createdLots.length})</h4>
            <div className="space-y-2 rounded-md border p-2 max-h-48 overflow-y-auto">
                {wizardData.createdLots.map(lot => (
                    <div key={lot.id} className="text-sm p-2 bg-secondary/50 rounded-md">
                        <p className="font-medium">Lote {lot.number}: {lot.title}</p>
                        <p className="text-xs text-muted-foreground">
                            {lot.assetIds?.length} ativo(s) | Lance Inicial: R$ {lot.initialPrice?.toLocaleString('pt-br', {minimumFractionDigits: 2})}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {isModalOpen && <CreateLotFromAssetsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedAssets={selectedAssets}
        auctionId={auctionData.id || ''}
        sellerId={auctionData.sellerId}
        onLotCreated={handleLotCreatedInModal}
      />}
       <AssetDetailsModal 
        asset={selectedAssetForModal} 
        isOpen={isAssetModalOpen} 
        onClose={() => setIsAssetModalOpen(false)} 
      />
    </>
  );
}
