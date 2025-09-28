// src/components/document-upload-card.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, FileText, CheckCircle, X, UploadCloud, Loader2, Eye, FileWarning, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { UserDocumentStatus } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getUserDocumentStatusInfo } from '@/lib/ui-helpers';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

interface DocumentUploadCardProps {
  title: string;
  description?: string;
  status: UserDocumentStatus;
  rejectionReason?: string | null;
  fileUrl?: string | null;
  onFileUpload: (fileDetails: { file: File, url: string, name: string }) => Promise<void>;
  acceptedFileTypes?: { [key: string]: string[] };
  maxSizeMB?: number;
}

const DEFAULT_ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'application/pdf': [] };
const DEFAULT_MAX_SIZE_MB = 5;

export default function DocumentUploadCard({
  title,
  description,
  status,
  rejectionReason,
  fileUrl,
  onFileUpload,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: DocumentUploadCardProps) {
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    if (fileRejections.length > 0 && fileRejections[0].errors.length > 0) {
      const firstError = fileRejections[0].errors[0];
      const errorMessage = firstError.code === 'file-too-large'
        ? `Arquivo muito grande. Máximo: ${maxSizeMB}MB.`
        : 'Tipo de arquivo não permitido.';
      setError(errorMessage);
      toast({ title: 'Arquivo Inválido', description: errorMessage, variant: 'destructive'});
      setSelectedFile(null);
    } else if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, [maxSizeMB, toast]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleUpload = async () => {
    if (!selectedFile || !userProfileWithPermissions?.id) {
        toast({ title: 'Erro', description: 'Nenhum arquivo selecionado ou usuário não autenticado.', variant: 'destructive'});
        return;
    };

    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      // We are sending the real user ID from the logged-in session now.
      formData.append('userId', userProfileWithPermissions.id); 
      // The parent component will pass the documentTypeId when calling onFileUpload
      
      // The API route now handles creating the UserDocument record.
      // This component just needs to call onFileUpload with the details.
      // We will simulate the URL for now, but a real API would return it.
      await onFileUpload({ file: selectedFile, url: `/uploads/documents/${userProfileWithPermissions.id}/${selectedFile.name}`, name: selectedFile.name });
      setSelectedFile(null);

    } catch (err: any) {
      toast({ title: 'Erro no Upload', description: err.message, variant: 'destructive' });
      setError(err.message);
    } finally {
        setIsUploading(false);
    }
  };
  
  const statusInfo = getUserDocumentStatusInfo(status);
  const StatusIcon = statusInfo.icon;
  const statusColorClass = statusInfo.color.replace('text-', 'border-').replace(/-\d+/, '-500');

  return (
    <Card className={`border-l-4 ${statusColorClass} transition-all`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start space-x-3 flex-grow">
            <StatusIcon className={`h-5 w-5 mt-1 flex-shrink-0 ${statusInfo.textColor}`} />
            <div>
              <h4 className="font-semibold">{title}</h4>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 sm:pl-4 w-full sm:w-auto justify-end">
            {(status === 'NOT_SENT' || status === 'REJECTED') && (
              <Button type="button" variant={status === 'REJECTED' ? 'destructive' : 'outline'} size="sm" onClick={open} disabled={isUploading}>
                {status === 'REJECTED' ? <FileWarning className="mr-2 h-4 w-4"/> : <FileUp className="mr-2 h-4 w-4"/>}
                {status === 'REJECTED' ? 'Reenviar' : 'Enviar Documento'}
              </Button>
            )}
             {status === 'APPROVED' && fileUrl && (
                <Button variant="outline" size="sm" asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" /> Ver Enviado</a>
                </Button>
            )}
            {(status === 'PENDING_ANALYSIS' || status === 'SUBMITTED') && (
                <Badge variant={statusInfo.badgeVariant as any} className="py-1 px-3 text-xs">{statusInfo.text}</Badge>
            )}
          </div>
        </div>
        {status === 'REJECTED' && rejectionReason && (
            <Alert variant="destructive" className="mt-3 text-xs p-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold text-sm">Motivo da Rejeição:</AlertTitle>
            <AlertDescription className="mt-1">{rejectionReason}</AlertDescription>
            </Alert>
        )}
        {selectedFile && (
            <div className="mt-3 p-2 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground truncate">{selectedFile.name}</div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} disabled={isUploading}><X className="mr-1 h-3 w-3"/>Cancelar</Button>
                    <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Confirmar Envio
                    </Button>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
