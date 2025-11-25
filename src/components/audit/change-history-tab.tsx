// src/components/audit/change-history-tab.tsx
// Change History Tab Component for displaying entity audit logs

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BidExpertCard } from '@/components/BidExpertCard';

interface ChangeHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  modifiedOn: string;
  operationType: string;
  changes: Array<{
    propertyName: string;
    oldValue: any;
    newValue: any;
  }>;
  ipAddress?: string;
}

interface ChangeHistoryTabProps {
  entityType: string;
  entityId: string;
  tenantId?: string;
  showUserFilter?: boolean;
  defaultPageSize?: 20 | 50 | 100;
}

export function ChangeHistoryTab({
  entityType,
  entityId,
  tenantId,
  showUserFilter = false,
  defaultPageSize = 20,
}: ChangeHistoryTabProps) {
  const [logs, setLogs] = useState<ChangeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'userName' | 'modifiedOn' | 'operationType'>('modifiedOn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch audit logs
  useEffect(() => {
    fetchAuditLogs();
  }, [entityType, entityId, currentPage, pageSize, sortBy, sortOrder]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const response = await fetch(`/api/audit/${entityType}/${entityId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.totalRecords);
      } else {
        setError(data.error || 'Failed to fetch audit logs');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      // Filter logs client-side for now
      // TODO: Implement server-side search
      const filtered = logs.filter(log =>
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.operationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.changes.some(change =>
          change.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setLogs(filtered);
    } else {
      fetchAuditLogs();
    }
  };

  // Handle sort
  const handleSort = (column: 'userName' | 'modifiedOn' | 'operationType') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle checkbox selection
  const handleSelectLog = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map(log => log.id)));
    }
  };

  // Format operation type badge
  const getOperationBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      CREATE: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
      PUBLISH: 'default',
      UNPUBLISH: 'outline',
    };
    return (
      <Badge variant={variants[type] || 'outline'} className="font-medium">
        {type}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {date.toLocaleDateString()}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      </div>
    );
  };

  // Render sort indicator
  const renderSortIndicator = (column: 'userName' | 'modifiedOn' | 'operationType') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 inline" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Text to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-background"
          />
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={handleSearch}
          title="Quick Search"
        >
          <span className="font-bold">Q</span>
        </Button>
      </div>

      {/* Table */}
      <BidExpertCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading change history...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">
            Error: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No change history available
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="w-12 p-3 text-left">
                      <Checkbox
                        checked={selectedLogs.size === logs.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th
                      className="p-3 text-left font-medium cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('userName')}
                    >
                      User Name
                      {renderSortIndicator('userName')}
                    </th>
                    <th
                      className="p-3 text-left font-medium cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('modifiedOn')}
                    >
                      Modified On
                      {renderSortIndicator('modifiedOn')}
                    </th>
                    <th
                      className="p-3 text-left font-medium cursor-pointer hover:bg-muted/70"
                      onClick={() => handleSort('operationType')}
                    >
                      Operation Type
                      {renderSortIndicator('operationType')}
                    </th>
                    <th className="p-3 text-left font-medium">Property Name</th>
                    <th className="p-3 text-left font-medium">Old Value</th>
                    <th className="p-3 text-left font-medium">New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.flatMap((log) => {
                    if (log.changes.length === 0) {
                      // Single row for operations without field changes
                      return (
                        <tr key={log.id} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedLogs.has(log.id)}
                              onCheckedChange={() => handleSelectLog(log.id)}
                            />
                          </td>
                          <td className="p-3 font-medium">{log.userName}</td>
                          <td className="p-3">{formatDate(log.modifiedOn)}</td>
                          <td className="p-3">{getOperationBadge(log.operationType)}</td>
                          <td className="p-3 text-muted-foreground" colSpan={3}>
                            —
                          </td>
                        </tr>
                      );
                    }

                    // Multiple rows for field changes
                    return log.changes.map((change, index) => (
                      <tr key={`${log.id}-${index}`} className="border-b hover:bg-muted/30">
                        {index === 0 && (
                          <>
                            <td className="p-3" rowSpan={log.changes.length}>
                              <Checkbox
                                checked={selectedLogs.has(log.id)}
                                onCheckedChange={() => handleSelectLog(log.id)}
                              />
                            </td>
                            <td className="p-3 font-medium" rowSpan={log.changes.length}>
                              {log.userName}
                            </td>
                            <td className="p-3" rowSpan={log.changes.length}>
                              {formatDate(log.modifiedOn)}
                            </td>
                            <td className="p-3" rowSpan={log.changes.length}>
                              {getOperationBadge(log.operationType)}
                            </td>
                          </>
                        )}
                        <td className="p-3 font-mono text-sm">{change.propertyName}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {change.oldValue !== null && change.oldValue !== undefined
                            ? String(change.oldValue)
                            : '—'}
                        </td>
                        <td className="p-3 text-sm font-medium" title={String(change.newValue)}>
                          {change.newValue !== null && change.newValue !== undefined
                            ? String(change.newValue)
                            : '—'}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedLogs.has(log.id)}
                      onCheckedChange={() => handleSelectLog(log.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{log.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.modifiedOn).toLocaleString()}
                      </div>
                      <div className="mt-2">{getOperationBadge(log.operationType)}</div>
                    </div>
                  </div>
                  {log.changes.length > 0 && (
                    <div className="space-y-2 pl-9">
                      {log.changes.map((change, index) => (
                        <div key={index} className="text-sm border-l-2 border-primary/20 pl-3">
                          <div className="font-mono font-medium">{change.propertyName}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{String(change.oldValue || '—')}</span>
                            <span>→</span>
                            <span className="font-medium text-foreground">
                              {String(change.newValue || '—')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </BidExpertCard>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-background border rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium">
            {currentPage}
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-4">
            Page {currentPage} of {totalPages} ({totalRecords} records)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page size:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
