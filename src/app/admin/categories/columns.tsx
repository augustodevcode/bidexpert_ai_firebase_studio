// src/app/admin/categories/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Categorias de Lotes. Inclui cabeçalhos, renderização de células
 * com links, ações de CRUD (editar, excluir, visualizar lotes) e uma indicação visual
 * se a categoria possui ou não subcategorias.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { LotCategory } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Check, X, Pencil, Trash2, Eye, MoreHorizontal, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { deleteLotCategory } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CategoriesColumnsProps {
  onDelete?: (id: string) => void;
}

export const createColumns = (props?: CategoriesColumnsProps): ColumnDef<LotCategory>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => (
      <Link 
        href={`/admin/categories/${row.original.id}/edit`} 
        className="font-medium hover:text-primary"
        data-ai-id={`category-name-link-${row.original.id}`}
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
  },
  {
    accessorKey: "hasSubcategories",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tem Subcategorias" />,
    cell: ({ row }) => (
      <div className="text-center" data-ai-id={`category-has-subcategories-${row.original.id}`}>
        {row.getValue("hasSubcategories") ? <Check className="h-4 w-4 text-green-500 mx-auto"/> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
      </div>
    ),
    enableGrouping: true,
  },
  {
    id: "actions",
    header: () => <div className="text-center">Ações</div>,
    cell: ({ row }) => {
      const category = row.original;
      return <CategoryActionsCell category={category} onDelete={props?.onDelete} />;
    },
  },
];

function CategoryActionsCell({ category, onDelete }: { category: LotCategory; onDelete?: (id: string) => void }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteLotCategory(category.id);
      if (result.success) {
        toast({
          title: "Categoria excluída",
          description: result.message,
        });
        onDelete?.(category.id);
        router.refresh();
      } else {
        toast({
          title: "Erro ao excluir",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex justify-center" data-ai-id={`category-actions-${category.id}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" data-ai-id={`category-actions-trigger-${category.id}`}>
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/categories/${category.id}/edit`} data-ai-id={`category-edit-link-${category.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/lots?categoryId=${category.id}`} data-ai-id={`category-view-lots-link-${category.id}`}>
              <Package className="mr-2 h-4 w-4" />
              Ver Lotes Vinculados
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem 
                onSelect={(e) => e.preventDefault()} 
                className="text-destructive focus:text-destructive"
                data-ai-id={`category-delete-trigger-${category.id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a categoria "{category.name}"?
                  Esta ação não pode ser desfeita. Se houver lotes ou subcategorias vinculados, a exclusão será impedida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ai-id="category-delete-cancel">Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ai-id="category-delete-confirm"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
