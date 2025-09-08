"use client"

import * as React from "react"
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { SlidersHorizontal } from "lucide-react"
import { Table, Column } from "@tanstack/react-table"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

// Helper function to extract a readable header name
const getColumnHeader = <TData, TValue>(column: Column<TData, TValue>): string => {
    // Acessa o objeto de definição da coluna
    const columnDef = column.columnDef;
    
    // Se 'header' é uma string, retorna diretamente
    if (typeof columnDef.header === 'string') {
        return columnDef.header;
    }
    
    // Se 'header' é uma função, tenta extrair o 'title' de 'DataTableColumnHeader'
    if (typeof columnDef.header === 'function') {
        const headerComponent = columnDef.header({ table: {} as Table<TData>, header: { colSpan: 1, column, getContext: () => ({ table, column, header: {} }) } } as any);
        if (headerComponent && React.isValidElement(headerComponent) && 'props' in headerComponent && 'title' in headerComponent.props) {
            return headerComponent.props.title;
        }
    }
    
    // Fallback para o ID da coluna
    return column.id;
};


export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
          data-ai-id="data-table-view-options-button"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Visualização
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            const columnHeader = getColumnHeader(column);
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnHeader}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
