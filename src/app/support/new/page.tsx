'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUpload {
  file: File;
  previewUrl?: string;
}

export default function NewTicketPage() {
  console.log('[NewTicketPage] Rendering...');
  const router = useRouter();
  const { userProfileWithPermissions: user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DUVIDA');
  const [priority, setPriority] = useState('MEDIA');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [shareData, setShareData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>({});

  useEffect(() => {
    // Coleta dados do navegador
    setBrowserInfo({
      userAgent: navigator.userAgent,
      browserInfo: `${navigator.appName} - ${navigator.appVersion}`,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      pageUrl: window.location.href,
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach(f => formData.append('files', f.file));
    formData.append('path', 'support-tickets');
    // Ensure userId is present if session is available
    if (user?.id) {
        formData.append('userId', user.id);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Falha no upload de arquivos');
    }

    const data = await response.json();
    // Assuming API returns array of MediaItems with url property
    return data.files || data.items || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para abrir um ticket.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload files
      let uploadedAttachments = [];
      if (files.length > 0) {
        const uploadResult = await uploadFiles();
        // Map upload result to attachment structure
        // Adjust this based on actual API response from /api/upload
        uploadedAttachments = uploadResult.map((item: any) => ({
            fileName: item.originalName || item.name || 'arquivo',
            fileUrl: item.url,
            fileSize: item.size || 0,
            mimeType: item.mimeType || 'application/octet-stream'
        }));
      }

      // 2. Create Ticket
      const ticketData = {
        userId: user.id,
        title,
        description,
        category,
        priority,
        userSnapshot: shareData ? { ...user } : null,
        userAgent: shareData ? browserInfo.userAgent : null,
        browserInfo: shareData ? browserInfo.browserInfo : null,
        screenSize: shareData ? browserInfo.screenSize : null,
        pageUrl: shareData ? browserInfo.pageUrl : null,
        attachments: uploadedAttachments
      };

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) throw new Error('Falha ao criar ticket');

      toast({
        title: "Sucesso!",
        description: "Seu ticket foi criado com sucesso.",
      });

      // Redirect to support list or dashboard
      // Assuming there is a list page, if not, create one later.
      router.push('/support'); 

    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o ticket. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Abrir Novo Ticket de Suporte</CardTitle>
          <CardDescription>
            Descreva seu problema ou dúvida. Nossa equipe responderá o mais breve possível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DUVIDA">Dúvida</SelectItem>
                  <SelectItem value="TECNICO">Problema Técnico</SelectItem>
                  <SelectItem value="FUNCIONAL">Problema Funcional</SelectItem>
                  <SelectItem value="SUGESTAO">Sugestão</SelectItem>
                  <SelectItem value="BUG">Bug / Erro</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Assunto</Label>
              <Input 
                id="title" 
                placeholder="Resumo do problema" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada</Label>
              <Textarea 
                id="description" 
                placeholder="Descreva o que aconteceu, passos para reproduzir, etc." 
                className="min-h-[150px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Anexos (Imagens, PDFs, Documentos)</Label>
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique ou arraste arquivos para anexar
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded-md text-sm bg-muted/20">
                      {f.previewUrl ? (
                         <img src={f.previewUrl} alt="preview" className="h-8 w-8 object-cover rounded" />
                      ) : (
                        <FileText className="h-8 w-8 p-1" />
                      )}
                      <span className="truncate flex-1">{f.file.name}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start space-x-2 py-4 border-t border-b bg-muted/20 p-4 rounded-md">
              <Checkbox 
                id="shareData" 
                checked={shareData} 
                onCheckedChange={(c) => setShareData(!!c)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="shareData" className="flex items-center font-semibold cursor-pointer">
                  Compartilhar dados técnicos para diagnóstico
                </Label>
                <p className="text-sm text-muted-foreground">
                  Inclui informações do navegador ({browserInfo.browserInfo}), tamanho da tela e página atual. 
                  Isso ajuda nosso time a identificar problemas mais rápido.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Abrir Ticket'}
            </Button>

          </form>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Seus dados são tratados de acordo com nossa Política de Privacidade e LGPD.
        </p>
      </div>
    </div>
  );
}
