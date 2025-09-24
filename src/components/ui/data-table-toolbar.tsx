// src/components/ui/data-table-toolbar.tsx
"use client"

import { X, ListTree, Trash2 } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "@/components/ui/alert-dialog"


interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchColumnId?: string;
  searchPlaceholder?: string;
  facetedFilterColumns?: {
    id: string;
    title: string;
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
  onDeleteSelected?: (selectedRows: TData[]) => Promise<void>;
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = "Buscar...",
  facetedFilterColumns = [],
  onDeleteSelected,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const groupableColumns = table.getAllColumns().filter(c => c.getCanGroup());
  const groupingState = table.getState().grouping;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  const handleDelete = () => {
    if (onDeleteSelected) {
      onDeleteSelected(table.getFilteredSelectedRowModel().rows.map(r => r.original));
    }
  }

  // Helper function to extract a readable header name
  const getColumnHeader = (column: any): string => {
    if (typeof column.columnDef.header === 'function') {
      // Attempt to find the 'title' prop passed to DataTableColumnHeader
      const headerProps = column.columnDef.header?.({
        column,
        header: {} // Mock header object
      } as any)?.props;
      return headerProps?.title || column.id;
    }
    return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2" data-ai-id="data-table-toolbar">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchColumnId && (
            <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumnId)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn(searchColumnId)?.setFilterValue(event.target.value)
            }
            className="h-8 w-full sm:w-[150px] lg:w-[250px]"
            data-ai-id="data-table-search-input"
            />
        )}
        {facetedFilterColumns.map(col => table.getColumn(col.id) ? (
            <DataTableFacetedFilter
                key={col.id}
                column={table.getColumn(col.id)}
                title={col.title}
                options={col.options}
            />
        ) : null)}
        {groupableColumns.length > 0 && (
          <div className="flex items-center gap-1">
            <ListTree className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select
              value={(groupingState[0] as string) ?? "__NONE__"}
              onValueChange={(value) => table.setGrouping(value === "__NONE__" ? [] : [value])}
            >
              <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs" aria-label="Agrupar por">
                <SelectValue placeholder="Agrupar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Nenhum grupo</SelectItem>
                {groupableColumns.map((column) => {
                    const columnHeader = getColumnHeader(column);
                    return (
                        <SelectItem key={column.id} value={column.id}>
                            {columnHeader}
                        </SelectItem>
                    )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
       <div className="flex w-full sm:w-auto items-center justify-end gap-2">
          {selectedRowsCount > 0 && onDeleteSelected && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-8">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir ({selectedRowsCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão em Massa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é permanente e não pode ser desfeita. Você tem certeza que deseja excluir os {selectedRowsCount} itens selecionados? Itens que possuem vínculos (ex: leilões com lotes) não serão excluídos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Confirmar Exclusão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          )}
          <DataTableViewOptions table={table} />
       </div>
    </div>
  )
}