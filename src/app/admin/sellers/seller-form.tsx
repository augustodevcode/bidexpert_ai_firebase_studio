// src/components/admin/sellers/seller-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { sellerFormSchema, type SellerFormValues } from '@/app/admin/sellers/seller-form-schema';
import type { SellerProfileInfo, MediaItem, JudicialBranch, StateInfo, CityInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Image as ImageIcon, Scale, Save } from 'lucide-react';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import EntitySelector from '@/components/ui/entity-selector';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { isValidImageUrl } from '@/lib/ui-helpers';
import AddressGroup from '@/components/address-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


interface SellerFormProps {
  initialData?: Partial<SellerProfileInfo> | null;
  judicialBranches: JudicialBranch[];
  allStates: StateInfo[];
  allCities: CityInfo[];
  onSubmitAction: (data: SellerFormValues) => Promise<any>;
  onSuccess?: (sellerId?: string) => void;
  onCancel?: () => void;
}

const SellerForm = React.forwardRef<any, SellerFormProps>(({
  initialData,
  judicialBranches: initialBranches,
  allStates,
  allCities,
  onSubmitAction,
  onSuccess,
  onCancel,
}, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [judicialBranches, setJudicialBranches] = React.useState(initialBranches);
  const [isFetchingBranches, setIsFetchingBranches] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
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

  const logoUrlPreview = useWatch({ control: form.control, name: 'logoUrl' });
  const isJudicial = useWatch({ control: form.control, name: 'isJudicial' });

  const handleRefetchBranches = React.useCallback(async () => {
    setIsFetchingBranches(true);
    const data = await getJudicialBranches();
    setJudicialBranches(data);
    setIsFetchingBranches(false);
  }, []);

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
  
   async function onSubmit(values: SellerFormValues) {
    setIsSubmitting(true);
    try {
        const result = await onSubmitAction(values);
        if(result.success) {
            toast({ title: "Sucesso!", description: result.message });
            if(onSuccess) onSuccess(result.sellerId);
        } else {
            toast({ title: "Erro ao Salvar", description: result.message, variant: "destructive"});
        }
    } catch (e: any) {
        toast({ title: "Erro Inesperado", description: e.message, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  }

  const validLogoPreviewUrl = isValidImageUrl(logoUrlPreview) ? logoUrlPreview : null;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-ai-id="seller-form">
           <Accordion type="multiple" defaultValue={['general', 'contact', 'address']} className="w-full">
            <AccordionItem value="general">
              <AccordionTrigger className="text-md font-semibold">Informações Gerais</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem data-ai-id="form-field-seller-name">
                          <FormLabel>Nome do Comitente/Empresa<span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input placeholder="Ex: Banco XYZ S.A., 1ª Vara Cível de Lagarto" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                     {initialData?.publicId && (
                        <FormField control={form.control} name="publicId" render={({ field }) => (<FormItem><FormLabel>ID Público</FormLabel><FormControl><Input readOnly disabled className="cursor-not-allowed bg-muted/70" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este é o ID público do comitente, gerado pelo sistema.</FormDescription><FormMessage /></FormItem>)} />
                    )}
                    <FormField control={form.control} name="isJudicial" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>É Comitente Judicial?</FormLabel><FormDescription>Marque se este comitente é uma entidade judicial (Vara, Tribunal, etc).</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                      )} />
                    {isJudicial && (
                        <FormField control={form.control} name="judicialBranchId" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-2"><Scale className="h-4 w-4"/>Vara Judicial Vinculada (Opcional)</FormLabel>
                                <EntitySelector 
                                    entityName="judicialBranch"
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={judicialBranches.map(b => ({ value: b.id, label: `${b.name} - ${b.districtName}` }))}
                                    placeholder="Nenhuma vara judicial vinculada"
                                    searchPlaceholder="Buscar vara..."
                                    emptyStateMessage="Nenhuma vara encontrada."
                                    createNewUrl="/admin/judicial-branches/new"
                                    editUrlPrefix="/admin/judicial-branches"
                                    onRefetch={handleRefetchBranches}
                                    isFetching={isFetchingBranches}
                                />
                                <FormDescription>Se este comitente representa uma entidade judicial, vincule-a aqui.</FormDescription><FormMessage /></FormItem>
                            )} />
                    )}
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição/Observações (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais sobre o comitente..." {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="contact">
              <AccordionTrigger className="text-md font-semibold">Contato e Mídia</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>Nome do Contato (Opcional)</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" placeholder="contato@comitente.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                   <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://www.comitente.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                    <FormItem>
                      <FormLabel>Logo do Comitente</FormLabel>
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                          {validLogoPreviewUrl ? ( <Image src={validLogoPreviewUrl} alt="Prévia do Logo" fill className="object-contain" data-ai-hint="previa logo comitente" />) : (<div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>)}
                        </div>
                        <div className="flex-grow space-y-2">
                          <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)} data-ai-id="btn-choose-logo">{validLogoPreviewUrl ? 'Alterar Logo' : 'Escolher da Biblioteca'}</Button>
                          <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormControl><Input type="text" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>)} />
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                    <FormField control={form.control} name="dataAiHintLogo" render={({ field }) => (<FormItem><FormLabel>Dica para IA (Logo - Opcional)</FormLabel><FormControl><Input placeholder="Ex: banco logo, empresa tecnologia" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Duas palavras chave para ajudar a IA encontrar uma imagem de placeholder, se a URL do logo não for fornecida.</FormDescription><FormMessage /></FormItem>)} />
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

SellerForm.displayName = "SellerForm";
export default SellerForm;
