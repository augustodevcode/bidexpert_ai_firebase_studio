// src/components/ui/entity-selector.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check, ChevronsUpDown, PlusCircle, Pencil, X, RefreshCw, Loader2, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DataTable } from './data-table';
import type { ColumnDef } from '@tanstack/react-table';

// Interface para as colunas da tabela, conforme especificado
export interface EntityColumn<T> {
  accessorKey: keyof T | 'actions';
  header: string;
  cell?: (row: T) => React.ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
}

interface EntitySelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: { value: string; label: string; [key: string]: any }[];
  placeholder: string;
  searchPlaceholder: string;
  emptyStateMessage: string;
  entityName: string; // Ex: "Comitente", "Leiloeiro"
  createNewUrl?: string | null;
  editUrlPrefix?: string | null;
  onRefetch: () => void;
  isFetching?: boolean;
  disabled?: boolean;
  tableColumns: ColumnDef<any>[]; // Colunas para a DataTable
}

export default function EntitySelector({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyStateMessage,
  entityName,
  createNewUrl,
  editUrlPrefix,
  onRefetch,
  isFetching = false,
  disabled = false,
  tableColumns,
}: EntitySelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);
  
  const handleSelectAndClose = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between flex-grow"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        
        {editUrlPrefix && value && (
            <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" asChild disabled={disabled} title={`Editar ${entityName} selecionado`}>
                <Link href={`${editUrlPrefix}/${value}`} target="_blank">
                    <Pencil className="h-4 w-4" />
                </Link>
            </Button>
        )}
        
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => onChange(null)} disabled={!value || disabled} title={`Limpar seleção de ${entityName}`}>
            <X className="h-4 w-4" />
        </Button>
      </div>

      <DialogContent className="max-w-[90vw] w-full lg:max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary"/>
            Selecionar {entityName}
          </DialogTitle>
          <DialogDescription>
            Pesquise, visualize e selecione um registro. Você também pode criar um novo, se necessário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden p-4">
            <DataTable
                columns={tableColumns}
                data={options.map(opt => ({...opt, id: opt.value}))} // DataTable espera um campo 'id'
                onRowClick={(row) => handleSelectAndClose(row.original.id)}
                searchColumnId="label"
                searchPlaceholder={searchPlaceholder}
                isLoading={isFetching}
            />
        </div>

        <DialogFooter className="p-4 border-t flex justify-between">
           {createNewUrl && (
               <Button variant="secondary" asChild>
                   <Link href={createNewUrl} target="_blank">
                       <PlusCircle className="mr-2 h-4 w-4"/>
                       Novo {entityName}
                   </Link>
               </Button>
           )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Criando uma coluna de seleção padrão que pode ser usada pela DataTable dentro do modal
export const createEntitySelectorColumns = (onSelect: (value: string) => void): ColumnDef<any>[] => [
    {
      accessorKey: "label",
      header: "Nome",
      cell: ({ row }) => <div className="font-medium">{row.getValue("label")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(row.original.value); }}>
                Selecionar
            </Button>
        </div>
      ),
    },
];
