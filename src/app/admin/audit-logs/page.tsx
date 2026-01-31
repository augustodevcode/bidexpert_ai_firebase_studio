'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userName?: string;
  userEmail?: string;
  timestamp: string;
  traceId?: string;
  oldValues?: object;
  newValues?: object;
  changes?: object;
}

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [modelFilter, setModelFilter] = useState('');
  
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (modelFilter) params.append('model', modelFilter);
      
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      
      if (json.success) {
        setLogs(json.data.logs);
      } else {
        toast({ title: 'Error', description: json.error, variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error loading logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6" data-ai-id="audit-page-container">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit & Observability 360</h1>
          <p className="text-muted-foreground">Monitor system integrity and performance.</p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          <Activity className="mr-2 h-4 w-4" />
          Refresh Live Stream
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Search Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Filter by Entity (e.g., Auction, Asset)..." 
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              />
            </div>
            <Button onClick={fetchLogs}><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Trace ID (IT Ops)</TableHead>
                <TableHead>Diff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No logs found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} data-ai-id={`log-row-${log.entityType}`}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)} variant="outline">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{log.entityType}</span>
                      <span className="text-xs text-muted-foreground block">#{log.entityId}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{log.userName || 'System'}</span>
                        <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.traceId ? (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{log.traceId.substring(0, 8)}...</code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} data-ai-id="view-diff-btn">
                            <Eye className="h-4 w-4 mr-2" /> View Diff
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Audit Detail: {log.entityType} #{log.entityId}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-red-50 p-4 rounded-md">
                              <h3 className="font-bold text-red-700 mb-2">Old Values (Snapshot)</h3>
                              <pre className="text-xs overflow-auto max-h-60 bg-white p-2 border rounded">
                                {JSON.stringify(log.oldValues || {}, null, 2)}
                              </pre>
                            </div>
                            <div className="bg-green-50 p-4 rounded-md">
                              <h3 className="font-bold text-green-700 mb-2">New Values (Snapshot)</h3>
                              <pre className="text-xs overflow-auto max-h-60 bg-white p-2 border rounded">
                                {JSON.stringify(log.newValues || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                             <h3 className="font-bold mb-2">Technical Metadata</h3>
                             <div className="grid grid-cols-2 gap-2 text-sm">
                               <p><strong>Trace ID:</strong> {log.traceId || 'N/A'}</p>
                               <p><strong>IP Address:</strong> {log.ipAddress || 'Unknown'}</p>
                               <p><strong>User Agent:</strong> {log.userAgent || 'Unknown'}</p>
                             </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
