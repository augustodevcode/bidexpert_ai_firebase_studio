// src/app/admin/media/upload/page.tsx
/**
 * @fileoverview Página para upload de múltiplos arquivos de mídia.
 * Este componente utiliza `react-dropzone` para criar uma área de arrastar e soltar
 * (drag-and-drop), valida os arquivos no lado do cliente (tamanho e tipo) e os
 * envia para uma rota de API (`/api/upload`) para processamento e armazenamento.
 */
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, ArrowLeft, Loader2, FileImage, X, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types';
import { useAuth } from '@/contexts/auth-context';

interface UploadError {
  fileName: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  items?: MediaItem[];
  errors?: UploadError[];
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'image/svg+xml'];
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function AdvancedMediaUploadPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { userProfileWithPermissions } = useAuth();
  
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { isValid: false, error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máx: ${MAX_FILE_SIZE_MB}MB` };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { isValid: false, error: `Tipo de arquivo não permitido.` };
    }
    return { isValid: true };
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        if (!files.find(f => f.name === file.name && f.size === file.size)) {
          validFiles.push(file);
        }
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast({ title: 'Arquivos Inválidos', description: errors.join('\n'), variant: 'destructive', duration: 7000 });
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setUploadResult(null);
    }
  }, [files, toast]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({ title: 'Nenhum arquivo para enviar', variant: 'destructive'});
      return;
    }

    if (!userProfileWithPermissions?.id) {
        toast({ title: 'Usuário não autenticado', description: 'Por favor, faça login novamente para enviar arquivos.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);
    setUploadResult(null);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('userId', userProfileWithPermissions.id);
    formData.append('path', 'media');
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result: UploadResult = await response.json();
        setUploadResult(result);

        if (response.ok && result.success) {
            toast({ title: 'Upload Concluído', description: result.message });
            setFiles([]);
            setTimeout(() => router.push('/admin/media?refresh=' + new Date().getTime()), 1000);
        } else if (response.ok && !result.success && result.errors) {
            toast({ title: 'Upload Parcial', description: result.message, variant: 'default' });
            const successfulFileNames = new Set((result.items || []).map(item => item.fileName));
            setFiles(currentFiles => currentFiles.filter(f => !successfulFileNames.has(f.name)));
        } else {
            throw new Error(result.message || `Erro HTTP: ${response.status}`);
        }
    } catch (error: any) {
        console.error("Upload error:", error);
        toast({ title: 'Falha no Upload', description: error.message || 'Ocorreu um erro na comunicação com o servidor.', variant: 'destructive' });
        setUploadResult({ success: false, message: error.message || 'Erro de comunicação.', errors: [{fileName: 'Erro Geral', message: 'Verifique sua conexão ou o console do servidor.'}]});
    } finally {
        setIsLoading(false);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="outline" size="sm" asChild className="mb-4 print:hidden" disabled={isLoading}>
        <Link href="/admin/media"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Biblioteca</Link>
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Enviar Nova Mídia</CardTitle>
          <CardDescription>Arraste arquivos ou selecione do seu computador. Os arquivos válidos aparecerão na lista abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn("border-2 border-dashed rounded-lg p-10 text-center space-y-4 transition-colors", 
              isLoading ? 'opacity-50 cursor-not-allowed' : 'border-muted-foreground/30',
              dragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/70'
            )}
            onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground/70" />
            <p className="text-lg font-medium text-muted-foreground">Solte os arquivos aqui ou</p>
            <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileSelect} disabled={isLoading} ref={fileInputRef} accept={ALLOWED_TYPES.join(',')} />
            <Label htmlFor="file-upload" className={cn("font-semibold text-primary underline-offset-4 hover:underline cursor-pointer", isLoading && "pointer-events-none")}>
              selecione do seu computador
            </Label>
            <p className="text-xs text-muted-foreground">Máx. {MAX_FILE_SIZE_MB}MB por arquivo. Tipos suportados: JPG, PNG, WEBP, GIF, PDF, SVG</p>
          </div>
        </CardContent>
      </Card>
      
      {files.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Arquivos para Enviar ({files.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 border rounded-md bg-secondary/50">
                        <div className="flex items-center gap-3 min-w-0">
                            <FileImage className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)} - {file.type}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="text-destructive hover:text-destructive h-7 w-7 flex-shrink-0" disabled={isLoading}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
             <CardFooter className="flex justify-end">
                <Button size="lg" onClick={handleUpload} disabled={isLoading || files.length === 0}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                    Enviar {files.length} {files.length === 1 ? 'Arquivo' : 'Arquivos'}
                </Button>
            </CardFooter>
        </Card>
      )}

      {uploadResult && (uploadResult.items || uploadResult.errors) && (
        <Card>
            <CardHeader>
                <CardTitle>Resultado do Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {uploadResult.items && uploadResult.items.length > 0 && (
                    <div className="p-3 border rounded-md bg-green-50 border-green-200">
                        <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2"><CheckCircle className="h-5 w-5"/>Sucessos ({uploadResult.items.length})</h4>
                        <ul className="space-y-1 text-xs text-green-700 list-disc list-inside">
                           {uploadResult.items.map(item => <li key={item.id}>{item.fileName}</li>)}
                        </ul>
                    </div>
                )}
                 {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="p-3 border rounded-md bg-red-50 border-red-200">
                        <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2"><AlertCircle className="h-5 w-5"/>Falhas ({uploadResult.errors.length})</h4>
                        <ul className="space-y-1 text-xs text-red-700 list-disc list-inside">
                           {uploadResult.errors.map((err, i) => <li key={i}><strong>{err.fileName}:</strong> {err.message}</li>)}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
