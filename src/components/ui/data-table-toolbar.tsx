// src/components/ui/data-table-toolbar.tsx
"use client"

import { X, ListTree } from "lucide-react"
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
}

export function DataTableToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = "Buscar...",
  facetedFilterColumns = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const groupableColumns = table.getAllColumns().filter(c => c.getCanGroup());
  const groupingState = table.getState().grouping;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchColumnId && (
            <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumnId)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn(searchColumnId)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
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
              value={(groupingState[0] as string) ?? ""}
              onValueChange={(value) => table.setGrouping(value ? [value] : [])}
            >
              <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs" aria-label="Agrupar por">
                <SelectValue placeholder="Agrupar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum grupo</SelectItem>
                {groupableColumns.map((column) => {
                    const columnHeader = typeof column.columnDef.header === 'string' 
                        ? column.columnDef.header 
                        : column.id;
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
      <DataTableViewOptions table={table} />
    </div>
  )
}
