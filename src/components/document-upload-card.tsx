
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, FileText, CheckCircle, X, UploadCloud } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

interface DocumentUploadCardProps {
  title: string;
  description?: string;
  onFileSelect: (file: File | null) => void;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const DEFAULT_MAX_SIZE_MB = 5;

export default function DocumentUploadCard({
  title,
  description,
  onFileSelect,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: DocumentUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    if (fileRejections.length > 0 && fileRejections[0].errors.length > 0) {
      const firstError = fileRejections[0].errors[0];
      if (firstError.code === 'file-too-large') {
        setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB.`);
      } else if (firstError.code === 'file-invalid-type') {
        setError('Tipo de arquivo não permitido.');
      } else {
        setError(firstError.message);
      }
      onFileSelect(null);
      setSelectedFile(null);
    } else if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect, maxSizeMB]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    noClick: true, // Disable click on the dropzone itself, we'll trigger it with a button
    noKeyboard: true,
  });
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    setError(null);
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div {...getRootProps()} className={cn(
          "relative border-2 border-dashed rounded-lg p-4 text-center space-y-2 transition-colors",
          isDragActive && "border-primary bg-primary/10",
          error && "border-destructive bg-destructive/10"
        )}>
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="flex flex-col items-center justify-center text-green-600">
                <CheckCircle className="h-10 w-10 mb-2"/>
                <p className="text-sm font-semibold text-foreground truncate max-w-full">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <UploadCloud className="h-10 w-10 mb-2"/>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs mt-1">
                {isDragActive ? "Solte o arquivo aqui..." : "Arraste um arquivo ou clique no botão abaixo"}
              </p>
            </div>
          )}
        </div>
        <div className="mt-2 text-center">
            {selectedFile ? (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleRemoveFile}
                >
                    <X className="h-3 w-3 mr-1" /> Remover
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={open} // Use the `open` function from react-dropzone
                >
                    Selecionar Arquivo
                </Button>
            )}
        </div>
        {error && <p className="text-xs text-destructive mt-1 text-center">{error}</p>}
      </CardContent>
    </Card>
  );
}
