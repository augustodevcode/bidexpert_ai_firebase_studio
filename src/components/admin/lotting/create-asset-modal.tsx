// src/components/admin/lotting/create-asset-modal.tsx
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AssetFormV2 } from '@/app/admin/assets/asset-form-v2';
import type { AssetFormData } from '@/app/admin/assets/asset-form-schema';
import { createAsset } from '@/app/admin/assets/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import type { LotCategory, SellerProfileInfo, JudicialProcess, StateInfo, CityInfo } from '@/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated: (assetId?: string) => void;
  initialSellerId?: string;
  initialJudicialProcessId?: string;
}

export default function CreateAssetModal({
  isOpen,
  onClose,
  onAssetCreated,
  initialSellerId,
  initialJudicialProcessId,
}: CreateAssetModalProps) {
  const [categories, setCategories] = React.useState<LotCategory[]>([]);
  const [sellers, setSellers] = React.useState<SellerProfileInfo[]>([]);
  const [processes, setProcesses] = React.useState<JudicialProcess[]>([]);
  const [states, setStates] = React.useState<StateInfo[]>([]);
  const [cities, setCities] = React.useState<CityInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  
  React.useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [cats, sells, procs, sts, cts] = await Promise.all([
            getLotCategories(),
            getSellers(),
            getJudicialProcesses(),
            getStates(),
            getCities(),
          ]);
          setCategories(cats);
          setSellers(sells);
          setProcesses(procs);
          setStates(sts);
          setCities(cts);
        } catch (error) {
          console.error("Failed to load data for Asset Modal", error);
          toast({ title: 'Erro', description: 'Não foi possível carregar os dados para criar um novo bem.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, toast]);

  const handleCreateAsset = async (data: AssetFormData) => {
    const result = await createAsset(data);
    if (result.success) {
      onAssetCreated(result.assetId);
    }
    return result;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <AssetFormV2
              initialData={{ 
                sellerId: initialSellerId, 
                judicialProcessId: initialJudicialProcessId,
                status: 'DISPONIVEL',
              }}
              categories={categories}
              sellers={sellers}
              processes={processes}
              allStates={states}
              allCities={cities}
              onSubmitAction={handleCreateAsset}
              onSuccess={() => onAssetCreated()}
              onCancel={onClose}
              title="Cadastrar Novo Bem"
              description="Cadastre um bem que ficará imediatamente disponível para loteamento."
            />
        )}
      </DialogContent>
    </Dialog>
  );
}
