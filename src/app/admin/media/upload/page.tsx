
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, useRef } from 'react';
import { handleImageUpload } from '../actions';

export default function MediaUploadPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref para o input de arquivo

  const processAndSubmitFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({ title: 'Nenhum arquivo selecionado', variant: 'destructive'});
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file); // O nome 'files' deve corresponder ao esperado na action
      // Para enviar metadados adicionais por arquivo, como dataAiHint, você pode usar
      // formData.append(`dataAiHint_${file.name}`, 'sua_dica_aqui');
      // Isso requer que a action handleImageUpload seja ajustada para ler esses campos.
    });

    const result = await handleImageUpload(formData);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Upload Concluído',
        description: result.message,
      });
      router.refresh();
      router.push('/admin/media');
    } else {
      toast({
        title: 'Falha no Upload',
        description: result.message,
        variant: 'destructive',
      });
    }
    // Limpar o valor do input de arquivo para permitir o re-upload do mesmo arquivo se necessário
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await processAndSubmitFiles(event.target.files);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await processAndSubmitFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="outline" size="sm" asChild className="mb-4 print:hidden" disabled={isLoading}>
        <Link href="/admin/media">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Biblioteca
        </Link>
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Enviar Nova Mídia</CardTitle>
          <CardDescription>
            Arraste arquivos para cá ou clique no botão para selecionar do seu computador.
          </CardDescription>
        </CardHeader>
        <CardContent
          className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-10 text-center space-y-4 hover:border-primary/70 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={isLoading ? undefined : handleDrop}
          onDragOver={isLoading ? undefined : handleDragOver}
        >
          {isLoading ? (
            <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
          ) : (
            <UploadCloud className="mx-auto h-16 w-16 text-muted-foreground/70" />
          )}
          <p className="text-lg font-medium text-muted-foreground">
            {isLoading ? 'Processando...' : 'Solte arquivos aqui para enviar'}
          </p>
          <p className="text-sm text-muted-foreground">ou</p>
          
          <Input 
            id="file-upload" 
            type="file" 
            multiple 
            className="hidden" 
            onChange={handleFileSelect}
            accept="image/png, image/jpeg, image/webp, application/pdf" // Ajuste conforme necessário
            disabled={isLoading}
            ref={fileInputRef} // Atribuir a ref
          />
          <Label
            htmlFor="file-upload"
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 
            ${isLoading ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Selecionar Arquivos'
            )}
          </Label>
        </CardContent>
        <CardFooter className="flex-col items-start text-xs text-muted-foreground pt-4">
          <p>Você pode enviar múltiplos arquivos de uma vez.</p>
          <p>Tamanho máximo de upload de arquivo: 10 MB.</p>
          <p className="mt-2">Formatos suportados: PNG, JPG/JPEG, WEBP, PDF.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
