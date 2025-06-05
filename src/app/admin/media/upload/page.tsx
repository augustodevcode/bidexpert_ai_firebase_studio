
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Necessário para o input de arquivo real
import { Label } from '@/components/ui/label';
import { UploadCloud, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Para navegação programática, se necessário

export default function MediaUploadPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Placeholder: Simular início do upload
      toast({
        title: 'Arquivos Selecionados (Simulação)',
        description: `${files.length} arquivo(s) selecionado(s). Em um app real, o upload começaria aqui.`,
      });
      // Em um app real, você chamaria uma função para fazer o upload dos `files`
      // e depois talvez redirecionar para /admin/media ou mostrar o progresso.
      // Por enquanto, podemos redirecionar de volta para a biblioteca após um delay simbólico.
      setTimeout(() => {
        router.push('/admin/media');
      }, 2000);
    }
  };

  // Placeholder para drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      toast({
        title: 'Arquivos Arrastados (Simulação)',
        description: `${files.length} arquivo(s) pronto(s) para upload.`,
      });
      // Simular o mesmo comportamento do handleFileSelect
      // Em uma aplicação real, você passaria os `files` para sua função de upload.
       setTimeout(() => {
        router.push('/admin/media');
      }, 2000);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="outline" size="sm" asChild className="mb-4 print:hidden">
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
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-10 text-center space-y-4 hover:border-primary/70 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <UploadCloud className="mx-auto h-16 w-16 text-muted-foreground/70" />
          <p className="text-lg font-medium text-muted-foreground">
            Solte arquivos aqui para enviar
          </p>
          <p className="text-sm text-muted-foreground">ou</p>
          
          {/* Input de arquivo real, mas escondido e acionado pelo Label/Button */}
          <Input 
            id="file-upload" 
            type="file" 
            multiple 
            className="hidden" 
            onChange={handleFileSelect}
            accept="image/png, image/jpeg, image/webp, application/pdf" // Limitar tipos de arquivo
          />
          <Label
            htmlFor="file-upload"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
          >
            Selecionar Arquivos
          </Label>
        </CardContent>
        <CardFooter className="flex-col items-start text-xs text-muted-foreground pt-4">
          <p>Você pode enviar múltiplos arquivos de uma vez.</p>
          <p>Tamanho máximo de upload de arquivo: 5 MB (configuração de exemplo).</p>
          <p className="mt-2">Formatos suportados: PNG, JPG/JPEG, WEBP, PDF.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
