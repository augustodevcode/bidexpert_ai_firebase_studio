
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAuctioneers, deleteAuctioneer } from './actions';
import type { AuctioneerProfileInfo } from '@/types';
import { PlusCircle, Edit, Trash2, Landmark, AlertTriangle, ExternalLink } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function DeleteAuctioneerButton({ auctioneerId, auctioneerName, onDelete }: { auctioneerId: string; auctioneerName: string; onDelete: (id: string) => Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Leiloeiro</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o leiloeiro "{auctioneerName}" (ID: {auctioneerId})? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(auctioneerId);
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

export default async function AdminAuctioneersPage() {
  const auctioneers = await getAuctioneers();

  async function handleDeleteAuctioneer(id: string) {
    'use server';
    const result = await deleteAuctioneer(id);
    if (!result.success) {
        console.error("Failed to delete auctioneer:", result.message);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Landmark className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Leiloeiros
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova leiloeiros da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctioneers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leiloeiro
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {auctioneers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
              <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
              <p className="font-semibold">Nenhum leiloeiro encontrado.</p>
              <p className="text-sm">Comece adicionando um novo leiloeiro.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Logo</TableHead>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctioneers.map((auctioneer) => (
                    <TableRow key={auctioneer.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={auctioneer.logoUrl || `https://placehold.co/40x40.png?text=${auctioneer.name.charAt(0)}`} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo || "logo leiloeiro"} />
                          <AvatarFallback>{auctioneer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{auctioneer.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{auctioneer.registrationNumber || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{auctioneer.email || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{auctioneer.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700" disabled>
                          {/* Link para a página pública do leiloeiro (a ser criada) */}
                          {/* <Link href={`/auctioneers/${auctioneer.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Ver Leiloeiro</span>
                          </Link> */}
                           <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700">
                          <Link href={`/admin/auctioneers/${auctioneer.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <DeleteAuctioneerButton auctioneerId={auctioneer.id} auctioneerName={auctioneer.name} onDelete={handleDeleteAuctioneer} />
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

    