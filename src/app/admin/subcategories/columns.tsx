// src/app/admin/subcategories/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Subcategorias. Inclui ações de CRUD (editar, excluir, visualizar lotes).
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Subcategory } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Pencil, Trash2, MoreHorizontal, Package } from 'lucide-react';
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
import { deleteSubcategoryAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface SubcategoriesColumnsProps {
  onDelete?: (id: string) => void;
}

export const createColumns = (props?: SubcategoriesColumnsProps): ColumnDef<Subcategory>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome da Subcategoria" />,
    cell: ({ row }) => (
      <Link 
        href={`/admin/subcategories/${row.original.id}/edit`}
        className="font-medium hover:text-primary"
        data-ai-id={`subcategory-name-link-${row.original.id}`}
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "parentCategoryName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria Principal" />,
    enableGrouping: true,
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contagem de Itens" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("itemCount") || 0}</div>
  },
  {
    id: "actions",
    header: () => <div className="text-center">Ações</div>,
    cell: ({ row }) => {
      const subcategory = row.original;
      return <SubcategoryActionsCell subcategory={subcategory} onDelete={props?.onDelete} />;
    },
  },
];

function SubcategoryActionsCell({ subcategory, onDelete }: { subcategory: Subcategory; onDelete?: (id: string) => void }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSubcategoryAction(subcategory.id);
      if (result.success) {
        toast({
          title: "Subcategoria excluída",
          description: result.message,
        });
        onDelete?.(subcategory.id);
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
    <div className="flex justify-center" data-ai-id={`subcategory-actions-${subcategory.id}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" data-ai-id={`subcategory-actions-trigger-${subcategory.id}`}>
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/subcategories/${subcategory.id}/edit`} data-ai-id={`subcategory-edit-link-${subcategory.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/lots?subcategoryId=${subcategory.id}`} data-ai-id={`subcategory-view-lots-link-${subcategory.id}`}>
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
                data-ai-id={`subcategory-delete-trigger-${subcategory.id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a subcategoria "{subcategory.name}"?
                  Esta ação não pode ser desfeita. Se houver lotes vinculados, a exclusão será impedida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ai-id="subcategory-delete-cancel">Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ai-id="subcategory-delete-confirm"
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
