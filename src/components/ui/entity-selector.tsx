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

// Importando os formulários que poderão ser renderizados no modal
import SellerForm from '@/app/admin/sellers/seller-form';
import AuctioneerForm from '@/app/admin/auctioneers/auctioneer-form';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

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

// Componente para renderizar o formulário correto dentro do modal
function EditEntityModal({
  isOpen,
  onClose,
  entityName,
  entityId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityId: string;
  onSuccess: () => void;
}) {
    // Este componente carregaria os dados necessários para o formulário específico.
    // Por simplicidade, vamos passar dados mockados ou vazios por enquanto.
    // Em uma implementação real, faríamos um fetch aqui com base no entityId.
    const [judicialBranches, setJudicialBranches] = React.useState<any[]>([]);

    React.useEffect(() => {
        if(entityName === 'seller') {
            getJudicialBranches().then(setJudicialBranches);
        }
    }, [entityName]);


    const renderForm = () => {
        switch (entityName) {
            case 'seller':
                return (
                    <SellerForm
                        initialData={{ id: entityId }} // Apenas um exemplo
                        judicialBranches={judicialBranches}
                        onSubmitAction={async (data) => {
                            // A lógica de update real estaria aqui
                            console.log("Updating seller:", entityId, data);
                            return { success: true, message: "Comitente atualizado com sucesso." };
                        }}
                        onUpdateSuccess={() => {
                            onSuccess();
                            onClose();
                        }}
                    />
                );
            case 'auctioneer':
                 return (
                    <AuctioneerForm
                        initialData={{ id: entityId }}
                        onSubmitAction={async (data) => {
                             console.log("Updating auctioneer:", entityId, data);
                             return { success: true, message: "Leiloeiro atualizado." };
                        }}
                         onUpdateSuccess={() => {
                            onSuccess();
                            onClose();
                        }}
                    />
                );
            // Adicionar outros casos para outras entidades
            default:
                return <p>Formulário para "{entityName}" não implementado.</p>;
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Editar {entityName}</DialogTitle>
                </DialogHeader>
                {renderForm()}
            </DialogContent>
        </Dialog>
    );
}


interface EntitySelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: { value: string; label: string; [key: string]: any }[];
  entityName: string; // Adicionado para saber qual entidade gerenciar
  placeholder: string;
  searchPlaceholder: string;
  emptyStateMessage: string;
  createNewUrl?: string | null;
  onRefetch?: () => void;
  isFetching?: boolean;
  disabled?: boolean;
}

export default function EntitySelector({
  value,
  onChange,
  options,
  entityName,
  placeholder,
  searchPlaceholder,
  emptyStateMessage,
  createNewUrl,
  onRefetch,
  isFetching = false,
  disabled = false,
}: EntitySelectorProps) {
  const [isListModalOpen, setIsListModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);
  
  const handleSelectAndClose = (selectedValue: string) => {
    onChange(selectedValue);
    setIsListModalOpen(false);
  }
  
  const tableColumns = React.useMemo(() => createEntitySelectorColumns(handleSelectAndClose), [handleSelectAndClose]);

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onRefetch?.(); // Atualiza a lista de opções após a edição
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isListModalOpen}
            className="w-full justify-between flex-grow"
            disabled={disabled}
            onClick={() => setIsListModalOpen(true)}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        
        {value && (
            <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setIsEditModalOpen(true)} disabled={disabled} title="Editar registro selecionado">
                <Pencil className="h-4 w-4" />
            </Button>
        )}
        
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => onChange(null)} disabled={!value || disabled} title="Limpar seleção">
            <X className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
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
                  data={options.map(opt => ({...opt, id: opt.value}))}
                  onRowClick={(row) => handleSelectAndClose(row.original.value)}
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
                         Criar Novo
                     </Link>
                 </Button>
             )}
            {onRefetch && (
              <Button variant="outline" onClick={onRefetch} disabled={isFetching}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Atualizar Lista
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsListModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {value && (
        <EditEntityModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            entityName={entityName}
            entityId={value}
            onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
