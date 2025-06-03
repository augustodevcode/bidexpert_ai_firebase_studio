
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSellers, deleteSeller } from './actions';
import type { SellerProfileInfo } from '@/types';
import { PlusCircle, Edit, Trash2, Users, AlertTriangle, ExternalLink } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function DeleteSellerButton({ sellerId, sellerName, onDelete }: { sellerId: string; sellerName: string; onDelete: (id: string) => Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Comitente</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o comitente "{sellerName}" (ID: {sellerId})? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
                await onDelete(sellerId);
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

export default async function AdminSellersPage() {
  const sellers = await getSellers();

  async function handleDeleteSeller(id: string) {
    'use server';
    const result = await deleteSeller(id);
    if (!result.success) {
        console.error("Failed to delete seller:", result.message);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Comitentes
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova comitentes/vendedores da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/sellers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Comitente
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
              <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
              <p className="font-semibold">Nenhum comitente encontrado.</p>
              <p className="text-sm">Comece adicionando um novo comitente.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Logo</TableHead>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={seller.logoUrl || `https://placehold.co/40x40.png?text=${seller.name.charAt(0)}`} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || "logo comitente"} />
                          <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{seller.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{seller.email || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{seller.phone || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {seller.city && seller.state ? `${seller.city} - ${seller.state}` : seller.city || seller.state || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700" disabled>
                          {/* Link para a página pública do comitente (a ser criada) */}
                          {/* <Link href={`/sellers/${seller.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Ver Comitente</span>
                          </Link> */}
                           <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700">
                          <Link href={`/admin/sellers/${seller.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <DeleteSellerButton sellerId={seller.id} sellerName={seller.name} onDelete={handleDeleteSeller} />
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

    