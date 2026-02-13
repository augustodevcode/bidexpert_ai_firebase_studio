/**
 * @fileoverview Upload zone inline para a Biblioteca de M├¡dia.
 * Drag-and-drop com react-dropzone, progress bars, auto-refresh.
 * data-ai-id="media-upload-zone"
 */
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'image/svg+xml': ['.svg'],
};

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface MediaUploadZoneProps {
  userId: string;
  onUploadComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaUploadZone({ userId, onUploadComplete, isOpen, onClose }: MediaUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadingFiles(newFiles);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('path', 'media');
    acceptedFiles.forEach((f) => formData.append('files', f));

    // Update all to uploading
    setUploadingFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'uploading' as const, progress: 30 }))
    );

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();

      setUploadingFiles((prev) =>
        prev.map((f) => {
          const err = data.errors?.find((e: { fileName: string }) => e.fileName === f.file.name);
          return {
            ...f,
            progress: 100,
            status: err ? ('error' as const) : ('success' as const),
            error: err?.message,
          };
        })
      );

      if (data.urls?.length > 0) {
        onUploadComplete();
      }
    } catch (error) {
      setUploadingFiles((prev) =>
        prev.map((f) => ({
          ...f,
          progress: 100,
          status: 'error' as const,
          error: 'Falha no upload',
        }))
      );
    } finally {
      setIsUploading(false);
    }
  }, [userId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: 50 * 1024 * 1024,
    disabled: isUploading,
  });

  if (!isOpen) return null;

  const successCount = uploadingFiles.filter((f) => f.status === 'success').length;
  const errorCount = uploadingFiles.filter((f) => f.status === 'error').length;
  const allDone = uploadingFiles.length > 0 && !isUploading;

  return (
    <div className="border rounded-lg bg-card p-4 space-y-3" data-ai-id="media-upload-zone">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Enviar Arquivos</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm text-primary font-medium">Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Arraste arquivos ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              JPG, PNG, WebP, GIF, PDF, SVG (m├íx. 50MB)
            </p>
          </div>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {uploadingFiles.map((uf, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {uf.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {uf.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {uf.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
              <span className="truncate flex-1">{uf.file.name}</span>
              {uf.status === 'uploading' && (
                <Progress value={uf.progress} className="w-20 h-1.5" />
              )}
              {uf.error && <span className="text-xs text-destructive">{uf.error}</span>}
            </div>
          ))}

          {allDone && (
            <div className="text-xs text-muted-foreground pt-1 border-t">
              {successCount > 0 && <span className="text-green-600">{successCount} enviado(s)</span>}
              {errorCount > 0 && <span className="text-destructive ml-2">{errorCount} falha(s)</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
