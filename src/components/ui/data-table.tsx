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
  getExpandedRowModel,
  ExpandedState,
  FilterFn,
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

const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    const item = row.original;
    const searchTerm = value.toLowerCase();

    // Check title (or name, which is more generic)
    if (item.title?.toLowerCase().includes(searchTerm)) return true;
    if (item.name?.toLowerCase().includes(searchTerm)) return true;

    // Specific check for judicialProcessNumber in assets
    if (item.judicialProcessNumber?.toLowerCase().includes(searchTerm)) return true;
    
    // Specific check for processNumber in judicial processes
    if (item.processNumber?.toLowerCase().includes(searchTerm)) return true;
    
    // Add more fields to search globally as needed
    if (item.email?.toLowerCase().includes(searchTerm)) return true;


    return false;
};


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  error?: string | null;
  searchColumnId?: string; // Kept for indicating search is enabled, now used for global search
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
  rowSelection?: {};
  setRowSelection?: React.Dispatch<React.SetStateAction<{}>>;
  onDeleteSelected?: (selectedRows: TData[]) => Promise<void>;
  tableInstance?: any;
  renderChildrenAboveTable?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode;
  dataTestId?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  error,
  searchColumnId,
  searchPlaceholder,
  facetedFilterColumns = [],
  rowSelection: controlledRowSelection,
  setRowSelection: setControlledRowSelection,
  onDeleteSelected,
  tableInstance,
  renderChildrenAboveTable,
  dataTestId,
}: DataTableProps<TData, TValue>) {
  const [uncontrolledRowSelection, setUncontrolledRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = React.useState(''); // State for global filter

  const isControlled = controlledRowSelection !== undefined && setControlledRowSelection !== undefined;
  const rowSelection = isControlled ? controlledRowSelection : uncontrolledRowSelection;
  const setRowSelection = isControlled ? setControlledRowSelection : setUncontrolledRowSelection;


  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      grouping,
      expanded,
      globalFilter, // Pass global filter state
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter, // Handle global filter changes
    globalFilterFn: globalFilterFn, // Use the custom global filter function
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableRowSelection: true,
  });

  return (
    <div className="space-y-4" data-ai-id="data-table-container" data-testid={dataTestId}>
      <DataTableToolbar 
        table={table}
        searchColumnId={searchColumnId}
        searchPlaceholder={searchPlaceholder}
        facetedFilterColumns={facetedFilterColumns}
        onDeleteSelected={onDeleteSelected}
      />
      {renderChildrenAboveTable && renderChildrenAboveTable(table)}
      <div className="rounded-md border md:border-0">
        <Table className="responsive-table">
          <TableHeader className="hidden md:table-header-group">
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
                        <TableCell colSpan={columns.length} className='cursor-pointer' onClick={row.getToggleExpandedHandler()}>
                           <div className="flex items-center gap-2">
                            <Button
                                variant="ghost" size="icon" className="h-6 w-6"
                            >
                                {row.getIsExpanded() ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                            {flexRender(
                                row.getGroupingValue(row.groupingColumnId!),
                                { cell: { getValue: row.getGroupingValue } }
                            )}
                            <span className="text-xs text-muted-foreground ml-1">({row.subRows.length})</span>
                           </div>
                        </TableCell>
                    </TableRow>
                  );
                }
                return (
                    <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="block md:table-row mb-4 md:mb-0 border md:border-b rounded-lg md:rounded-none shadow-md md:shadow-none"
                    >
                    {row.getVisibleCells().map((cell) => (
                        <TableCell 
                            key={cell.id} 
                            className="flex items-center justify-between md:table-cell px-4 py-2 md:px-4 md:py-4 border-b md:border-b-0"
                            data-label={typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}
                        >
                          <span className="font-bold text-sm text-foreground md:hidden mr-2">{typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}:</span>
                          <div className="text-right md:text-left">
                            {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                            )}
                          </div>
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
