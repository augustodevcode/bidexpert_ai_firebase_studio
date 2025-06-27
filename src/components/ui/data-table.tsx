// src/components/ui/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  GroupingState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { Button } from "./button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  error?: string | null;
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

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  error,
  searchColumnId,
  searchPlaceholder,
  facetedFilterColumns = [],
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [grouping, setGrouping] = React.useState<GroupingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      grouping,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableRowSelection: true,
  });

  return (
    <div className="space-y-4" id="bid-expert-data-grid">
      <DataTableToolbar 
        table={table}
        searchColumnId={searchColumnId}
        searchPlaceholder={searchPlaceholder}
        facetedFilterColumns={facetedFilterColumns}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Carregando dados...
                        </div>
                    </TableCell>
                </TableRow>
            ) : error ? (
                 <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                         <div className="flex items-center justify-center">
                            <AlertCircle className="mr-2 h-6 w-6" />
                            {error}
                        </div>
                    </TableCell>
                </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                if (row.getIsGrouped()) {
                  return (
                     <TableRow key={row.id} className="bg-muted/50 hover:bg-muted/60 font-medium">
                        <TableCell colSpan={columns.length}>
                           <div className="flex items-center gap-2">
                            <Button
                                variant="ghost" size="icon" className="h-6 w-6"
                                onClick={row.getToggleExpandedHandler()}
                            >
                                {row.getIsExpanded() ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                            <span>
                                {flexRender(
                                  row.getVisibleCells()[0].column.columnDef.header,
                                  row.getVisibleCells()[0].getContext()
                                )}: {row.getVisibleCells()[0].getValue() as string}
                            </span>
                            <span className="text-xs font-normal text-muted-foreground">({row.subRows.length})</span>
                           </div>
                        </TableCell>
                    </TableRow>
                  );
                }
                return (
                    <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    >
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                        {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )}
                        </TableCell>
                    ))}
                    </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

DataTable.displayName = "BidExpertDataGrid";
