// src/components/admin/auctioneers/auctioneer-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form'; // Added useWatch
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auctioneerFormSchema, type AuctioneerFormValues } from './auctioneer-form-schema';
import type { AuctioneerProfileInfo, MediaItem } from '@/types';
import { Loader2, Save, Landmark, Image as ImageIcon, XCircle } from 'lucide-react'; // Added ImageIcon, XCircle
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Image from 'next/image'; // Added Image
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog'; // Added ChooseMediaDialog

interface AuctioneerFormProps {
  initialData?: AuctioneerProfileInfo | null;
  onSubmitAction: (data: AuctioneerFormValues) => Promise<{ success: boolean; message: string; auctioneerId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  isViewMode?: boolean;
  onUpdateSuccess?: () => void;
  onCancelEdit?: () => void;
}

export default function AuctioneerForm({
  initialData,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  isViewMode = false,
  onUpdateSuccess,
  onCancelEdit,
}: AuctioneerFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);

  const form = useForm<AuctioneerFormValues>({
    resolver: zodResolver(auctioneerFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      registrationNumber: initialData?.registrationNumber || '',
      contactName: initialData?.contactName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zipCode: initialData?.zipCode || '',
      website: initialData?.website || '',
      logoUrl: initialData?.logoUrl || '',
      logoMediaId: initialData?.logoMediaId || null,
      dataAiHintLogo: initialData?.dataAiHintLogo || '',
      description: initialData?.description || '',
      userId: initialData?.userId || '',
    },
  });

  const logoUrlPreview = useWatch({ control: form.control, name: 'logoUrl' });

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('logoUrl', selectedMediaItem.urlOriginal);
        form.setValue('logoMediaId', selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };

  async function onSubmit(values: AuctioneerFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        if (onUpdateSuccess) {
            onUpdateSuccess();
        } else {
            router.push('/admin/auctioneers');
            router.refresh();
        }
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
      console.error("Unexpected error in auctioneer form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancelClick = () => {
    if (onCancelEdit) {
      onCancelEdit();
    } else {
      router.back();
    }
  };


  return (
    <>
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
          <CardDescription>{formDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
            <fieldset disabled={isViewMode} className="group">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6 bg-secondary/30 group-disabled:bg-muted/10">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Leiloeiro/Empresa de Leilões</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva Leiloeiro Oficial, Leilões Brasil Ltda." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Registro Oficial (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: JUCESP 123, Matrícula 001/AA" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>Número de matrícula na Junta Comercial ou órgão competente.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contato (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@leiloeiro.com" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Principal (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://www.leiloeiro.com" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço do Escritório/Pátio (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua Exemplo, 123, Bairro" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado/UF (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               
               <FormItem>
                  <FormLabel>Logo do Leiloeiro</FormLabel>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                      {logoUrlPreview ? (
                        <Image src={logoUrlPreview} alt="Prévia do Logo" fill className="object-contain" data-ai-hint="previa logo leiloeiro" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow space-y-2">
                      <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>
                        {logoUrlPreview ? 'Alterar Logo' : 'Escolher da Biblioteca'}
                      </Button>
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                            <FormControl>
                                <Input type="text" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" />
                            </FormControl>
                        )}
                        />
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              <FormField
                control={form.control}
                name="dataAiHintLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dica para IA (Logo - Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: martelo leilao, logo escritorio" {...field} value={field.value ?? ""} />
                    </FormControl>
                     <FormDescription>Duas palavras chave para ajudar a IA encontrar uma imagem de placeholder, se a URL do logo não for fornecida.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobre o Leiloeiro/Empresa (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Breve descrição, especialidades, áreas de atuação..." {...field} value={field.value ?? ""} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            {!isViewMode && (
                <CardFooter className="flex justify-end gap-2 p-6 border-t">
                    <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isSubmitting}>
                        <XCircle className="mr-2 h-4 w-4"/> Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {submitButtonText}
                    </Button>
                </CardFooter>
            )}
          </form>
          </fieldset>
        </Form>
      </Card>
      <ChooseMediaDialog
        isOpen={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onMediaSelect={handleMediaSelect}
        allowMultiple={false}
      />
    </>
  );
}
