
import AuctionForm from '../../auction-form';
import { getAuction, updateAuction, type AuctionFormData } from '../../actions'; // Corrected path
import { getLotCategories } from '@/app/admin/categories/actions';
import { getLots, deleteLot } from '@/app/admin/lots/actions'; // Importar getLots e deleteLot
import type { Lot } from '@/types';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';
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
import { Badge } from '@/components/ui/badge';
import { getAuctioneers } from '@/app/admin/auctioneers/actions'; // Import getAuctioneers
import { getSellers } from '@/app/admin/sellers/actions'; // Import getSellers

// Client component para o botão de deletar lote, para usar AlertDialog
function DeleteLotButton({ lotId, lotTitle, auctionId, onDelete }: { lotId: string; lotTitle: string; auctionId: string; onDelete: (id: string, auctionId: string) => Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Lote</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão do Lote</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o lote "{lotTitle}" (ID: {lotId}) deste leilão? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(lotId, auctionId);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir Lote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default async function EditAuctionPage({ params }: { params: { auctionId: string } }) {
  const auctionId = params.auctionId;
  const auction = await getAuction(auctionId);
  const categories = await getLotCategories();
  const lotsInAuction = await getLots(auctionId); // Buscar lotes associados
  const auctioneers = await getAuctioneers(); // Fetch auctioneers
  const sellers = await getSellers(); // Fetch sellers


  if (!auction) {
    notFound();
  }

  async function handleUpdateAuction(data: Partial<AuctionFormData>) {
    'use server';
    return updateAuction(auctionId, data);
  }

  async function handleDeleteLotAction(lotId: string, currentAuctionId: string) {
    'use server';
    const result = await deleteLot(lotId, currentAuctionId); // Passar auctionId para revalidação
    if (!result.success) {
        console.error("Failed to delete lot:", result.message);
    }
    // Revalidação é tratada pela action deleteLot
  }

  return (
    <div className="space-y-8">
      <AuctionForm
        initialData={auction}
        categories={categories}
        auctioneers={auctioneers}
        sellers={sellers}
        onSubmitAction={handleUpdateAuction}
        formTitle="Editar Leilão"
        formDescription="Modifique os detalhes do leilão existente."
        submitButtonText="Salvar Alterações"
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lotes do Leilão</CardTitle>
            <CardDescription>Lista de lotes associados a este leilão.</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/admin/lots/new?auctionId=${auctionId}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lote a este Leilão
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {lotsInAuction.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum lote encontrado para este leilão.</p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID Lote</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Encerra em</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotsInAuction.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-mono text-xs">{lot.id.substring(0,10)}{lot.id.length > 10 ? '...' : ''}</TableCell>
                      <TableCell className="font-medium">{lot.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getLotStatusColor(lot.status)} border-current`}>
                            {getAuctionStatusText(lot.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lot.endDate ? format(new Date(lot.endDate), 'dd/MM/yy HH:mm', { locale: ptBR }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700">
                          <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700">
                          <Link href={`/admin/lots/${lot.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteLotButton lotId={lot.id} lotTitle={lot.title} auctionId={auctionId} onDelete={handleDeleteLotAction} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
