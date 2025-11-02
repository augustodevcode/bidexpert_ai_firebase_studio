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

interface EntitySelectorProps {
  value: string | bigint | null | undefined;
  onChange: (value: string | null) => void;
  options: { value: string | bigint; label: string; [key: string]: any }[];
  entityName?: string; 
  placeholder: string;
  searchPlaceholder: string;
  emptyStateMessage: string;
  onAddNew?: () => void;
  editUrlPrefix?: string | null;
  onRefetch?: () => void;
  isFetching?: boolean;
  disabled?: boolean;
}

export default function EntitySelector({
  value,
  onChange,
  options,
  entityName = "registro",
  placeholder,
  searchPlaceholder,
  emptyStateMessage,
  onAddNew,
  editUrlPrefix,
  onRefetch,
  isFetching = false,
  disabled = false,
}: EntitySelectorProps) {
  const [isListModalOpen, setIsListModalOpen] = React.useState(false);

  const stringValue = value?.toString() ?? null;

  const selectedOption = options.find((option) => option.value.toString() === stringValue);
  
  const handleSelectAndClose = (selectedValue: string | bigint) => {
    onChange(selectedValue.toString());
    setIsListModalOpen(false);
  }
  
  const tableColumns = React.useMemo(() => createEntitySelectorColumns(handleSelectAndClose), [handleSelectAndClose]);

  return (
    <div className="flex items-center gap-2" data-ai-id={`entity-selector-container-${entityName}`}>
      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
          <DialogTrigger asChild>
              <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isListModalOpen}
                  className="w-full justify-between flex-grow"
                  disabled={disabled}
                  data-ai-id={`entity-selector-trigger-${entityName}`}
              >
                  <span className="truncate">
                  {selectedOption ? selectedOption.label : placeholder}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] w-full lg:max-w-4xl h-[80vh] flex flex-col p-0" data-ai-id={`entity-selector-modal-${entityName}`}>
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
                      data={options.map(opt => ({...opt, id: opt.value.toString()}))}
                      searchColumnId="label"
                      searchPlaceholder={searchPlaceholder}
                      isLoading={isFetching}
                      emptyStateMessage={emptyStateMessage}
                  />
              </div>
              <DialogFooter className="p-4 border-t flex justify-between">
                  {onAddNew && (
                      <Button variant="secondary" onClick={onAddNew} data-ai-id={`entity-selector-add-new-${entityName}`}>
                          <PlusCircle className="mr-2 h-4 w-4"/>
                          Criar Novo
                      </Button>
                  )}
                  <div className="flex items-center gap-2">
                    {onRefetch && (
                    <Button variant="outline" onClick={onRefetch} disabled={isFetching} data-ai-id={`entity-selector-refetch-${entityName}`}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Atualizar Lista
                    </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsListModalOpen(false)}>
                    Fechar
                    </Button>
                  </div>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {value && editUrlPrefix && (
           <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" disabled={disabled} title="Editar registro selecionado" asChild>
              <Link href={`${editUrlPrefix}/${value}`} target="_blank">
                  <Pencil className="h-4 w-4" />
              </Link>
          </Button>
      )}
      
      <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => onChange(null)} disabled={!value || disabled} title="Limpar seleção">
          <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
