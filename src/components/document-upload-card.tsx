
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { FileUp, FileText, CheckCircle, X } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
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
          "relative border-2 border-dashed rounded-lg p-6 text-center space-y-2 transition-colors cursor-pointer",
          isDragActive && "border-primary bg-primary/10",
          !selectedFile && "hover:border-primary/70",
          error && "border-destructive bg-destructive/10"
        )}>
          <input {...getInputProps({ ref: inputRef })} />
          
          {selectedFile ? (
            <div className="flex flex-col items-center justify-center text-green-600">
                <CheckCircle className="h-10 w-10 mb-2"/>
                <p className="text-sm font-semibold text-foreground truncate max-w-full">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileUp className="h-10 w-10 mb-2"/>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs mt-1">
                {isDragActive ? "Solte o arquivo aqui..." : "Arraste ou clique para enviar"}
              </p>
            </div>
          )}

          {selectedFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive mt-1 text-center">{error}</p>}
      </CardContent>
    </Card>
  );
}
