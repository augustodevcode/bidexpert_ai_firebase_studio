// src/app/admin/auctioneers/auctioneer-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Leiloeiros.
 * Utiliza `react-hook-form` para gerenciamento de estado e Zod para validação.
 * Inclui campos para todas as informações do perfil do leiloeiro, como dados
 * de contato, endereço, logo e integração com a biblioteca de mídia.
 */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { Loader2, Save, Landmark, Image as ImageIcon, XCircle } from 'lucide-react';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { consultaCepAction } from '@/lib/actions/cep';
import { isValidImageUrl } from '@/lib/ui-helpers';

interface AuctioneerFormProps {
  initialData?: AuctioneerProfileInfo | null;
  onSubmitAction: (data: AuctioneerFormValues) => Promise<any>;
}

const AuctioneerForm = React.forwardRef<any, AuctioneerFormProps>(({
  initialData,
  onSubmitAction,
}, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [isCepLoading, setIsCepLoading] = React.useState(false);

  const form = useForm<AuctioneerFormValues>({
    resolver: zodResolver(auctioneerFormSchema),
    mode: 'onChange',
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

  React.useEffect(() => {
    if (initialData) {
      form.reset({
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
      });
    }
  }, [initialData, form]);

  useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
    formState: form.formState,
  }));

  const logoUrlPreview = useWatch({ control: form.control, name: 'logoUrl' });

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('logoUrl', selectedMediaItem.urlOriginal, { shouldDirty: true, shouldValidate: true });
        form.setValue('logoMediaId', selectedMediaItem.id || null, { shouldDirty: true });
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };
  
  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;
    setIsCepLoading(true);
    const result = await consultaCepAction(cep);
    if (result.success && result.data) {
        form.setValue('address', result.data.logradouro, { shouldDirty: true });
        form.setValue('city', result.data.localidade, { shouldDirty: true });
        form.setValue('state', result.data.uf, { shouldDirty: true, shouldValidate: true });
    } else {
        toast({ title: 'CEP não encontrado', description: result.message, variant: 'destructive'});
    }
    setIsCepLoading(false);
  }
  
  const validLogoUrl = isValidImageUrl(logoUrlPreview) ? logoUrlPreview : null;

  return (
    <>
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6" data-ai-id="auctioneer-form">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Leiloeiro/Empresa de Leilões<span className="text-destructive">*</span></FormLabel>
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
                name="zipCode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <FormControl>
                                <Input 
                                    placeholder="00000-000"
                                    {...field}
                                    value={field.value ?? ''} 
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (e.target.value.replace(/\D/g, '').length === 8) {
                                            handleCepLookup(e.target.value);
                                        }
                                    }}
                                />
                            </FormControl>
                            <Button type="button" variant="secondary" onClick={() => handleCepLookup(form.getValues('zipCode') || '')} disabled={isCepLoading} className="w-full sm:w-auto">
                                {isCepLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Buscar Endereço'}
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
              />
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
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} value={field.value ?? ''} />
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
                        <Input placeholder="SP" {...field} value={field.value ?? ''} />
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
                      {validLogoUrl ? (
                        <Image src={validLogoUrl} alt="Prévia do Logo" fill className="object-contain" data-ai-hint="previa logo leiloeiro" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow space-y-2">
                      <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)} data-ai-id="btn-choose-logo">
                        {validLogoUrl ? 'Alterar Logo' : 'Escolher da Biblioteca'}
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
          </form>
      </Form>
      <ChooseMediaDialog
        isOpen={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onMediaSelect={handleMediaSelect}
        allowMultiple={false}
      />
    </>
  );
});

AuctioneerForm.displayName = "AuctioneerForm";
export default AuctioneerForm;
