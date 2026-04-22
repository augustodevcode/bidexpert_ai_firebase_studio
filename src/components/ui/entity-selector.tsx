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
export const createEntitySelectorColumns = (
  onSelect: (value: string) => void,
  displayColumns?: ColumnDef<any>[]
): ColumnDef<any>[] => {
  const baseColumns = displayColumns?.length
    ? displayColumns
    : [
        {
          accessorKey: 'label',
          header: 'Nome',
          cell: ({ row }: any) => <div className="font-medium">{row.getValue('label')}</div>,
        },
      ];

  return [
    ...baseColumns,
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(row.original.value);
            }}
          >
            Selecionar
          </Button>
        </div>
      ),
    },
  ];
};

interface EntitySelectorProps {
  value: string | bigint | null | undefined;
  onChange: (value: string | null) => void;
  options: { value: string | bigint; label: string; [key: string]: any }[];
  entityName?: string; 
  createNewUrl?: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyStateMessage: string;
  onAddNew?: () => void;
  editUrlPrefix?: string | null;
  onRefetch?: () => void;
  isFetching?: boolean;
  disabled?: boolean;
  displayColumns?: ColumnDef<any>[];
  dialogDescription?: string;
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
  displayColumns,
  dialogDescription,
}: EntitySelectorProps) {
  const [isListModalOpen, setIsListModalOpen] = React.useState(false);

  const stringValue = value?.toString() ?? null;

  const selectedOption = options.find((option) => option.value.toString() === stringValue);
  
  const handleSelectAndClose = React.useCallback((selectedValue: string | bigint) => {
    onChange(selectedValue.toString());
    setIsListModalOpen(false);
  }, [onChange]);

  const tableData = React.useMemo(
    () => options.map((opt) => ({ ...opt, id: opt.id?.toString?.() ?? opt.value.toString() })),
    [options]
  );
  
  const tableColumns = React.useMemo(
    () => createEntitySelectorColumns(handleSelectAndClose, displayColumns),
    [displayColumns, handleSelectAndClose]
  );

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
            <DialogContent className="content-entity-selector-dialog flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl" data-ai-id={`entity-selector-modal-${entityName}`}>
              <DialogHeader className="header-entity-selector-dialog">
                  <DialogTitle className="title-entity-selector-dialog">
                  <ListChecks className="icon-entity-selector-title"/>
                  Selecionar {entityName}
                  </DialogTitle>
                  <DialogDescription className="desc-entity-selector-dialog">
                {dialogDescription || 'Pesquise, visualize e selecione um registro. Você também pode criar um novo, se necessário.'}
                  </DialogDescription>
              </DialogHeader>
              <div className="wrapper-entity-selector-table min-h-0 flex-1 overflow-hidden">
                  <DataTable
                      columns={tableColumns}
                  data={tableData}
                      searchColumnId="label"
                      searchPlaceholder={searchPlaceholder}
                      isLoading={isFetching}
                      emptyStateMessage={emptyStateMessage}
                  tableContainerClassName="max-h-[60vh] overflow-auto rounded-md border"
                  disableResponsiveLayout={true}
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
