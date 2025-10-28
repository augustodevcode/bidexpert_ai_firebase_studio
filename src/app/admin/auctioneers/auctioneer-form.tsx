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
import { auctioneerFormSchema, type AuctioneerFormValues } from './auctioneer-form-schema';
import type { AuctioneerProfileInfo, MediaItem, StateInfo, CityInfo } from '@/types';
import { Loader2, Save, Landmark, Image as ImageIcon, XCircle } from 'lucide-react';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { isValidImageUrl } from '@/lib/ui-helpers';
import AddressGroup from '@/components/address-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface AuctioneerFormProps {
  initialData?: AuctioneerProfileInfo | null;
  allStates: StateInfo[];
  allCities: CityInfo[];
  onSubmitAction: (data: AuctioneerFormValues) => Promise<any>;
  onSuccess?: (auctioneerId?: string) => void;
  onCancel?: () => void;
}

const AuctioneerForm = React.forwardRef<any, AuctioneerFormProps>(({
  initialData,
  allStates,
  allCities,
  onSubmitAction,
  onSuccess,
  onCancel,
}, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AuctioneerFormValues>({
    resolver: zodResolver(auctioneerFormSchema),
    mode: 'onChange',
    defaultValues: initialData || {},
  });

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmit),
    formState: form.formState,
  }));
  
  React.useEffect(() => {
    form.reset(initialData || {});
  }, [initialData, form]);
  
  async function onSubmit(values: AuctioneerFormValues) {
    setIsSubmitting(true);
    try {
        const result = await onSubmitAction(values);
        if (result.success) {
            toast({ title: 'Sucesso!', description: result.message });
            if(onSuccess) onSuccess(result.auctioneerId);
        } else {
            toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive'});
        }
    } catch (e: any) {
        toast({ title: 'Erro Inesperado', description: e.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }


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
  
  const validLogoUrl = isValidImageUrl(logoUrlPreview) ? logoUrlPreview : null;

  return (
    <>
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-ai-id="auctioneer-form">
            <Accordion type="multiple" defaultValue={['general', 'contact', 'address']} className="w-full">
              <AccordionItem value="general">
                <AccordionTrigger className="text-md font-semibold">Informações Gerais</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Leiloeiro/Empresa<span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ex: João Silva Leiloeiro Oficial" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Matrícula Oficial (Opcional)</FormLabel><FormControl><Input placeholder="Ex: JUCESP 123" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Sobre o Leiloeiro/Empresa (Opcional)</FormLabel><FormControl><Textarea placeholder="Breve descrição..." {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="contact">
                <AccordionTrigger className="text-md font-semibold">Contato e Mídia</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-6"><FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>Nome do Contato</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)}/><FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email de Contato</FormLabel><FormControl><Input type="email" placeholder="contato@leiloeiro.com" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)}/></div>
                  <div className="grid md:grid-cols-2 gap-6"><FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone Principal</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)}/><FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website</FormLabel><FormControl><Input type="url" placeholder="https://www.leiloeiro.com" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)}/></div>
                  <FormItem>
                    <FormLabel>Logo do Leiloeiro</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border"><div className="flex items-center justify-center h-full text-muted-foreground">{validLogoUrl ? ( <Image src={validLogoUrl} alt="Prévia do Logo" fill className="object-contain" data-ai-hint="previa logo leiloeiro" />) : (<ImageIcon className="h-8 w-8" />)}</div></div>
                      <div className="flex-grow space-y-2"><Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)} data-ai-id="btn-choose-logo">{validLogoUrl ? 'Alterar Logo' : 'Escolher da Biblioteca'}</Button><FormField control={form.control} name="logoUrl" render={({ field }) => (<FormControl><Input type="text" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" /></FormControl>)}/></div>
                    </div>
                  </FormItem>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="address">
                <AccordionTrigger className="text-md font-semibold">Endereço</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                   <AddressGroup form={form} allStates={allStates} allCities={allCities} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="flex justify-end gap-2 pt-4">
                {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>}
                <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}
                    Salvar
                </Button>
            </div>
          </form>
      </Form>
      <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={false} />
    </>
  );
});

AuctioneerForm.displayName = "AuctioneerForm";
export default AuctioneerForm;
