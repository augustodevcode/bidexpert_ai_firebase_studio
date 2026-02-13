/**
 * @fileoverview Barra de ações em lote do SuperGrid.
 * Aparece fixada no rodapé quando há linhas selecionadas.
 */
'use client';

import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
  isDeleting: boolean;
  canDelete: boolean;
  confirmDelete: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onClearSelection,
  isDeleting,
  canDelete,
  confirmDelete,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t bg-card px-6 py-3 shadow-lg"
      data-ai-id="supergrid-bulk-actions-bar"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'registro selecionado' : 'registros selecionados'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          data-ai-id="supergrid-clear-selection-btn"
        >
          <X className="mr-1 h-4 w-4" />
          Limpar seleção
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {canDelete && (
          confirmDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  data-ai-id="supergrid-bulk-delete-btn"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir selecionados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ai-id="supergrid-bulk-delete-confirm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Confirmar exclusão
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedCount}{' '}
                    {selectedCount === 1 ? 'registro' : 'registros'}?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              data-ai-id="supergrid-bulk-delete-btn"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir selecionados
            </Button>
          )
        )}
      </div>
    </div>
  );
}
