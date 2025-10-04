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
import AssetForm from '@/app/admin/assets/asset-form';
import type { AssetFormData } from '@/app/admin/assets/asset-form-schema';
import { createAsset } from '@/app/admin/assets/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import type { LotCategory, SellerProfileInfo, JudicialProcess } from '@/types';
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
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  
  React.useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [cats, sells, procs] = await Promise.all([
            getLotCategories(),
            getSellers(),
            getJudicialProcesses(),
          ]);
          setCategories(cats);
          setSellers(sells);
          setProcesses(procs);
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
            <AssetForm
              initialData={{ 
                sellerId: initialSellerId, 
                judicialProcessId: initialJudicialProcessId,
                status: 'DISPONIVEL',
              }}
              categories={categories}
              sellers={sellers}
              processes={processes}
              onSubmitAction={handleCreateAsset}
              onSuccess={() => onAssetCreated()}
              onCancel={onClose}
              formTitle="Cadastrar Novo Bem"
              formDescription="Cadastre um bem que ficará imediatamente disponível para loteamento."
              submitButtonText="Criar e Adicionar"
            />
        )}
      </DialogContent>
    </Dialog>
  );
}
