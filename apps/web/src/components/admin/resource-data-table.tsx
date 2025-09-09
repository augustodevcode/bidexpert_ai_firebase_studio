'use client';

import * as React from 'react';

interface ResourceDataTableProps<TData> {
  data: TData[];
  columns: any[]; // This should be more specific, but for a placeholder, any is fine
  // Add other props as needed, e.g., pageCount, pageSize, onPaginationChange, etc.
}

export function ResourceDataTable<TData>({ data, columns }: ResourceDataTableProps<TData>) {
  return (
    <div className="p-4 border rounded-md">
      <p className="text-center text-muted-foreground">
        Resource Data Table component is missing. Displaying placeholder.
      </p>
      {/* You might want to display some basic data here for debugging */}
      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
    </div>
  );
}
