
'use client';

import { useState, useEffect, useCallback } from 'react';
import AuctioneerForm from '../../auctioneer-form';
import { getAuctioneer, updateAuctioneer, deleteAuctioneer, type AuctioneerFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2, XCircle } from 'lucide-react';
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

function DeleteAuctioneerButton({ auctioneerId, auctioneerName, onAction }: { auctioneerId: string; auctioneerName: string; onAction: () => void; }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Basic check: in a real app, this would query for related auctions
  const canDelete = true; 

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAuctioneer(auctioneerId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/auctioneers');
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
            Esta ação é permanente. Tem certeza que deseja excluir o leiloeiro "{auctioneerName}"?
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


export default function EditAuctioneerPage() {
  const params = useParams();
  const auctioneerId = params.auctioneerId as string;
  
  const [auctioneer, setAuctioneer] = useState<AuctioneerFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
  
  const fetchPageData = useCallback(async () => {
    if (!auctioneerId) return;
    setIsLoading(true);
    const fetchedAuctioneer = await getAuctioneer(auctioneerId);
    if (!fetchedAuctioneer) {
      notFound();
      return;
    }
    setAuctioneer(fetchedAuctioneer);
    setIsLoading(false);
  }, [auctioneerId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  

  if (isLoading || !auctioneer) {
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
            <DeleteAuctioneerButton auctioneerId={auctioneerId} auctioneerName={auctioneer.name} onAction={fetchPageData} />
        </div>
      <AuctioneerForm
        initialData={auctioneer}
        onSubmitAction={(data) => updateAuctioneer(auctioneerId, data)}
        formTitle={isViewMode ? "Visualizar Leiloeiro" : "Editar Leiloeiro"}
        formDescription={isViewMode ? "Consulte as informações abaixo." : "Modifique os detalhes do leiloeiro existente."}
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
