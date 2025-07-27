// src/components/ui/data-table-view-options.tsx
"use client"

import * as React from "react"
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { SlidersHorizontal } from "lucide-react"
import { Table, Column } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

// Helper function to extract a readable header name
const getColumnHeader = <TData, TValue>(column: Column<TData, TValue>): string => {
    if (typeof column.columnDef.header === 'function') {
        // Attempt to find the 'title' prop passed to DataTableColumnHeader
        // This is a bit of a workaround because react-table doesn't store meta-data in an easily accessible way here.
        const headerComponent = column.columnDef.header({
            column,
        } as any); // Mock some properties needed by the function

        if (headerComponent && React.isValidElement(headerComponent) && 'props' in headerComponent && 'title' in headerComponent.props) {
            return headerComponent.props.title;
        }
    }
    // Fallback logic
    return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
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
