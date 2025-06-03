
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLots, deleteLot } from './actions';
import type { Lot } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Edit, Trash2, Package, AlertTriangle, Eye } from 'lucide-react';
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
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';

// Client component to handle delete action with confirmation
function DeleteLotButton({ lotId, lotTitle, onDelete }: { lotId: string; lotTitle: string; onDelete: (id: string) => Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o lote "{lotTitle}" (ID: {lotId})? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(lotId);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default async function AdminLotsPage() {
  const lots = await getLots();

  async function handleDeleteLot(id: string) {
    'use server';
    const result = await deleteLot(id);
    if (!result.success) {
        console.error("Failed to delete lot:", result.message);
    }
    // Revalidation is handled by the action
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Package className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Lotes
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova lotes para os leilões.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/lots/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Lote
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {lots.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
              <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
              <p className="font-semibold">Nenhum lote encontrado.</p>
              <p className="text-sm">Comece adicionando um novo lote.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID Lote</TableHead>
                    <TableHead className="min-w-[200px]">Título</TableHead>
                    <TableHead>Leilão ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Encerr. em</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-mono text-xs">{lot.id.substring(0,10)}{lot.id.length > 10 ? '...' : ''}</TableCell>
                      <TableCell className="font-medium">{lot.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{lot.auctionId}</TableCell>
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
                            <span className="sr-only">Ver Lote</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700">
                          <Link href={`/admin/lots/${lot.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <DeleteLotButton lotId={lot.id} lotTitle={lot.title} onDelete={handleDeleteLot} />
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
