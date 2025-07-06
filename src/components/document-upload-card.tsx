'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, FileText, CheckCircle, X, UploadCloud, Loader2, Eye, FileWarning, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { UserDocumentStatus } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getAuctionStatusText, getUserDocumentStatusColor } from '@/lib/sample-data-helpers';


interface DocumentUploadCardProps {
  title: string;
  description?: string;
  status: UserDocumentStatus;
  rejectionReason?: string | null;
  fileUrl?: string | null;
  onFileUpload: (fileDetails: { file: File, url: string, name: string }) => Promise<void>;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    if (fileRejections.length > 0 && fileRejections[0].errors.length > 0) {
      const firstError = fileRejections[0].errors[0];
      const errorMessage = firstError.code === 'file-too-large'
        ? `Arquivo muito grande. Máximo: ${maxSizeMB}MB.`
        : 'Tipo de arquivo não permitido.';
      setError(errorMessage);
      setSelectedFile(null);
    } else if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, [maxSizeMB]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', selectedFile);
    // userId and docType are now passed in the upload API request
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
        setUploadProgress(oldProgress => {
            if (oldProgress === null) return 10;
            if (oldProgress >= 95) {
                clearInterval(progressInterval);
                return oldProgress;
            }
            return Math.min(oldProgress + 5, 95);
        });
    }, 200);

    try {
        const response = await fetch('/api/upload/document', {
            method: 'POST',
            body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Falha no upload.');

        await onFileUpload({ file: selectedFile, url: result.publicUrl, name: selectedFile.name });

    } catch (err: any) {
      toast({ title: 'Erro no Upload', description: err.message, variant: 'destructive' });
      setError(err.message);
    } finally {
        setTimeout(() => setUploadProgress(null), 1000);
    }
  };

  const statusColorClasses = getUserDocumentStatusColor(status);

  const getStatusIcon = (status: UserDocumentStatus) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'REJECTED': return <FileWarning className="h-5 w-5 text-red-600" />;
      case 'PENDING_ANALYSIS': case 'SUBMITTED': return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={`border-l-4 ${statusColorClasses}`}>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4">
        <div className="flex items-start space-x-3">
          {getStatusIcon(status)}
          <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
            {status === 'REJECTED' && rejectionReason && (
              <Alert variant="destructive" className="mt-2 text-xs p-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Motivo da Rejeição:</AlertTitle>
                <AlertDescription>{rejectionReason}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end items-center">
            {status === 'APPROVED' && fileUrl && (
                <Button variant="outline" size="sm" asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" /> Ver Enviado</a>
                </Button>
            )}
            {(status === 'NOT_SENT' || status === 'REJECTED') && (
                <div {...getRootProps()} className="w-full">
                    <input {...getInputProps()} />
                    {selectedFile ? (
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-muted-foreground truncate flex-1">{selectedFile.name}</div>
                            <Button size="sm" onClick={handleUpload} disabled={uploadProgress !== null}>
                                {uploadProgress !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                                Enviar
                            </Button>
                        </div>
                    ) : (
                         <Button type="button" variant="outline" size="sm" onClick={open} className="w-full">
                            {status === 'REJECTED' ? 'Reenviar Documento' : 'Selecionar Documento'}
                        </Button>
                    )}
                </div>
            )}
            {(status === 'PENDING_ANALYSIS' || status === 'SUBMITTED') && (
                <Badge variant="outline" className={`py-1 px-3 text-xs ${getUserDocumentStatusColor(status)}`}>{getAuctionStatusText(status)}</Badge>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

