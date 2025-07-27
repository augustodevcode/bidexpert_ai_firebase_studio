// src/app/admin/habilitations/[userId]/document-review-client.tsx
'use client';

import { useState } from 'react';
import type { UserDocument, UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Eye, Download, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { approveDocument, rejectDocument } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { getUserDocumentStatusInfo } from '@/lib/ui-helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DocumentReviewClientProps {
  initialDocuments: UserDocument[];
  user: UserProfileData;
}

export default function DocumentReviewClient({ initialDocuments, user }: DocumentReviewClientProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [docToReject, setDocToReject] = useState<UserDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();
  const router = useRouter();


  const handleApprove = async (docId: string) => {
    setIsLoading(prev => ({ ...prev, [docId]: true }));
    const result = await approveDocument(docId, user.id); // Pass analystId
    if (result.success) {
      toast({ title: "Sucesso!", description: "Documento aprovado." });
      // Re-fetch or optimistically update
      const updatedDocs = documents.map(d => d.id === docId ? { ...d, status: 'APPROVED', rejectionReason: null } as UserDocument : d);
      setDocuments(updatedDocs);
       router.refresh(); // Refresh server-side props to get updated user habilitation status
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
    setIsLoading(prev => ({ ...prev, [docId]: false }));
  };

  const openRejectionModal = (doc: UserDocument) => {
    setDocToReject(doc);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };

  const handleReject = async () => {
    if (!docToReject || !rejectionReason.trim()) {
      toast({ title: "Erro", description: "O motivo da rejeição é obrigatório.", variant: "destructive" });
      return;
    }
    const docId = docToReject.id;
    setIsLoading(prev => ({ ...prev, [docId]: true }));
    setRejectionModalOpen(false);

    const result = await rejectDocument(docId, rejectionReason);
    if (result.success) {
      toast({ title: "Sucesso!", description: "Documento rejeitado." });
       const updatedDocs = documents.map(d => d.id === docId ? { ...d, status: 'REJECTED', rejectionReason } as UserDocument : d);
       setDocuments(updatedDocs);
        router.refresh();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
    setIsLoading(prev => ({ ...prev, [docId]: false }));
    setDocToReject(null);
  };

  return (
    <div className="space-y-4">
      {documents.length > 0 ? documents.map(doc => {
        const statusInfo = getUserDocumentStatusInfo(doc.status);
        const StatusIcon = statusInfo.icon;
        
        return (
          <Card key={doc.id} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">{doc.documentType.name}</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.textColor}`} />
                {statusInfo.text}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                <Button variant="link" asChild className="p-0 h-auto">
                    <a href={doc.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <Eye className="h-4 w-4"/> Ver Documento Enviado
                    </a>
                </Button>
                {doc.rejectionReason && (
                    <p className="text-xs text-destructive mt-1 flex items-start"><MessageSquare className="h-3 w-3 mr-1.5 mt-0.5"/>Motivo da Rejeição: {doc.rejectionReason}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => openRejectionModal(doc)} disabled={isLoading[doc.id] || doc.status === 'REJECTED'}>
                  {isLoading[doc.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-2"/>} Rejeitar
                </Button>
                 <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(doc.id)} disabled={isLoading[doc.id] || doc.status === 'APPROVED'}>
                  {isLoading[doc.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2"/>} Aprovar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }) : (
        <Card>
            <CardContent className="text-center py-10">
                 <p className="text-muted-foreground">Este usuário não enviou nenhum documento ainda.</p>
            </CardContent>
        </Card>
      )}

      {/* Rejection Reason Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Documento: {docToReject?.documentType.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
            <Textarea 
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Documento ilegível, informação incorreta, etc."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Confirmar Rejeição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
