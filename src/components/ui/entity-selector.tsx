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
    <div className="wrapper-entity-selector" data-ai-id={`entity-selector-container-${entityName}`}>
      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
          <DialogTrigger asChild>
              <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isListModalOpen}
                  className="btn-entity-selector-trigger"
                  disabled={disabled}
                  data-ai-id={`entity-selector-trigger-${entityName}`}
              >
                  <span className="text-entity-selector-label">
                  {selectedOption ? selectedOption.label : placeholder}
                  </span>
                  <ChevronsUpDown className="icon-entity-selector-chevron" />
              </Button>
          </DialogTrigger>
          <DialogContent className="content-entity-selector-dialog" data-ai-id={`entity-selector-modal-${entityName}`}>
              <DialogHeader className="header-entity-selector-dialog">
                  <DialogTitle className="title-entity-selector-dialog">
                  <ListChecks className="icon-entity-selector-title"/>
                  Selecionar {entityName}
                  </DialogTitle>
                  <DialogDescription className="desc-entity-selector-dialog">
                  Pesquise, visualize e selecione um registro. Você também pode criar um novo, se necessário.
                  </DialogDescription>
              </DialogHeader>
              <div className="wrapper-entity-selector-table">
                  <DataTable
                      columns={tableColumns}
                      data={options.map(opt => ({...opt, id: opt.value.toString()}))}
                      searchColumnId="label"
                      searchPlaceholder={searchPlaceholder}
                      isLoading={isFetching}
                      emptyStateMessage={emptyStateMessage}
                  />
              </div>
              <DialogFooter className="footer-entity-selector-dialog">
                  {onAddNew && (
                      <Button variant="secondary" onClick={onAddNew} data-ai-id={`entity-selector-add-new-${entityName}`} className="btn-entity-selector-add">
                          <PlusCircle className="icon-btn-start"/>
                          Criar Novo
                      </Button>
                  )}
                  <div className="wrapper-entity-selector-footer-actions">
                    {onRefetch && (
                    <Button variant="outline" onClick={onRefetch} disabled={isFetching} data-ai-id={`entity-selector-refetch-${entityName}`} className="btn-entity-selector-refresh">
                        <RefreshCw className={cn("icon-btn-start", isFetching && "icon-spin")} />
                        Atualizar Lista
                    </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsListModalOpen(false)} className="btn-entity-selector-close">
                    Fechar
                    </Button>
                  </div>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {value && editUrlPrefix && (
           <Button type="button" variant="outline" size="icon" className="btn-entity-selector-edit" disabled={disabled} title="Editar registro selecionado" asChild data-ai-id={`entity-selector-edit-${entityName}`}>
              <Link href={`${editUrlPrefix}/${value}`} target="_blank" className="link-entity-selector-edit">
                  <Pencil className="icon-btn-action" />
              </Link>
          </Button>
      )}
      
      <Button type="button" variant="outline" size="icon" className="btn-entity-selector-clear" onClick={() => onChange(null)} disabled={!value || disabled} title="Limpar seleção" data-ai-id={`entity-selector-clear-${entityName}`}>
          <X className="icon-btn-action" />
      </Button>
    </div>
  );
}
