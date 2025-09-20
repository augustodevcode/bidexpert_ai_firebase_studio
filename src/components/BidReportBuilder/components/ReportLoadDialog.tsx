// src/components/BidReportBuilder/components/ReportLoadDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Trash2 } from 'lucide-react';
import { getReportsAction, deleteReportAction } from '@/app/admin/reports/actions';
import type { Report } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (report: Report) => void;
}

export default function ReportLoadDialog({
  isOpen,
  onClose,
  onLoad,
}: ReportLoadDialogProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const fetchedReports = await getReportsAction();
      setReports(fetchedReports);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation(); // Prevent card click when deleting
    if (!confirm('Você tem certeza que deseja excluir este relatório?')) return;
    
    await deleteReportAction(reportId);
    await fetchReports(); // Refresh the list
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Carregar Relatório Salvo</DialogTitle>
          <DialogDescription>
            Selecione um relatório da lista para carregar no editor.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum relatório salvo encontrado.</p>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {reports.map(report => (
                  <Card 
                    key={report.id} 
                    className="hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onLoad(report)}
                  >
                    <div className="flex items-center justify-between p-3">
                        <div>
                            <CardTitle className="text-base">{report.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                                {report.description || 'Sem descrição'}
                            </CardDescription>
                            <p className="text-xs text-muted-foreground/80 mt-1">
                                Salvo em: {format(new Date(report.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDelete(e, report.id)}
                            aria-label="Excluir Relatório"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
