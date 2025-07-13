
'use client';

import { useState, useEffect, useCallback } from 'react';
import SellerForm from '../../seller-form';
import { getSeller, updateSeller, deleteSeller, type SellerFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteSellerButton({ sellerId, sellerName, onAction }: { sellerId: string; sellerName: string; onAction: () => void; }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Basic check: in a real app, this would query for related auctions/lots
  const canDelete = true; 

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSeller(sellerId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/sellers');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
     <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting || !canDelete}>
          {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é permanente. Tem certeza que deseja excluir o comitente "{sellerName}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
            {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Confirmar Exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function EditSellerPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  
  const [seller, setSeller] = useState<SellerFormData | null>(null);
  const [judicialBranches, setJudicialBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(true);

  const fetchPageData = useCallback(async () => {
      if (!sellerId) return;
      setIsLoading(true);
      try {
        const [sellerData, branchesData] = await Promise.all([
            getSeller(sellerId),
            getJudicialBranches()
        ]);

        if (!sellerData) {
            notFound();
            return;
        }
        setSeller(sellerData);
        setJudicialBranches(branchesData);
      } catch (e) {
          console.error("Error fetching seller data", e);
          notFound();
      } finally {
        setIsLoading(false);
      }
  }, [sellerId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  

  if (isLoading || !seller) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }


  return (
     <div className="space-y-4">
        <div className="flex justify-end gap-2">
           {isViewMode ? (
            <Button onClick={() => setIsViewMode(false)}>
              <Edit className="mr-2 h-4 w-4" /> Entrar em Modo de Edição
            </Button>
           ) : null}
            <DeleteSellerButton sellerId={sellerId} sellerName={seller.name} onAction={fetchPageData} />
        </div>
        <SellerForm
          initialData={seller}
          judicialBranches={judicialBranches}
          onSubmitAction={(data) => updateSeller(sellerId, data)}
          formTitle={isViewMode ? "Visualizar Comitente" : "Editar Comitente"}
          formDescription={isViewMode ? "Consulte as informações abaixo." : "Modifique os detalhes do comitente existente."}
          submitButtonText="Salvar Alterações"
          isViewMode={isViewMode}
          onUpdateSuccess={() => {
              fetchPageData();
              setIsViewMode(true);
          }}
          onCancelEdit={() => setIsViewMode(true)}
        />
     </div>
  );
}
