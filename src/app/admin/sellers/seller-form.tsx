// src/app/admin/sellers/seller-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { sellerFormSchema, type SellerFormValues } from './seller-form-schema';
import type { SellerProfileInfo, JudicialBranch, MediaItem } from '@bidexpert/core';
import { Loader2, Save, Users, Building2, Link2, Image as ImageIcon, Contact, MapPin, Trash2, ImagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import EntitySelector from '@/components/ui/entity-selector';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

interface SellerFormProps {
  initialData?: SellerProfileInfo | null;
  judicialBranches: JudicialBranch[];
  onSubmitAction: (data: SellerFormValues) => Promise<{ success: boolean; message: string; sellerId?: string }>;
}

const SellerForm = React.forwardRef<any, SellerFormProps>(({ initialData, judicialBranches: initialBranches, onSubmitAction }, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [judicialBranches, setJudicialBranches] = React.useState(initialBranches);
  const [isFetchingBranches, setIsFetchingBranches] = React.useState(false);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      name: initialData?.name || '',
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
      description: initialData?.description || '',
      isJudicial: initialData?.isJudicial || false,
      judicialBranchId: initialData?.judicialBranchId || null,
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
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
      description: initialData?.description || '',
      isJudicial: initialData?.isJudicial || false,
      judicialBranchId: initialData?.judicialBranchId || null,
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

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
        form.setValue('logoUrl', selectedMediaItem.urlOriginal, { shouldDirty: true });
        form.setValue('logoMediaId', selectedMediaItem.id || null, { shouldDirty: true });
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
          <div data-ai-id="seller-form-company-info">
            <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-4">Informações da Empresa</h3>
            <div className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome / Razão Social</FormLabel><FormControl><Input placeholder="Ex: Comitente Vendedor S.A." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Breve descrição sobre o comitente..." {...field} value={field.value ?? ""} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Link2 className="h-4 w-4"/> Website (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://www.comitente.com.br" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                        {logoUrlPreview ? (<Image src={logoUrlPreview} alt="Prévia do Logo" fill className="object-contain" />) : (<ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>)}
                    </div>
                    <div className="flex-grow space-y-2">
                        <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>{logoUrlPreview ? 'Alterar Logo' : 'Escolher da Biblioteca'}</Button>
                        <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>)} />
                        <FormMessage />
                    </div>
                  </div>
              </FormItem>
            </div>
          </div>
          
          <Separator />
          
           <div data-ai-id="seller-form-contact-info">
            <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-4">Informações de Contato</h3>
             <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Contact className="h-4 w-4"/> Nome do Contato Principal</FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="mt-4"><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contato@comitente.com" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          <Separator />

          <div data-ai-id="seller-form-address-info">
             <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-4">Endereço</h3>
             <div className="grid md:grid-cols-3 gap-4">
              <FormField control={form.control} name="zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="city" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Ex: São Paulo" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="mt-4"><FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Endereço Completo</FormLabel><FormControl><Input placeholder="Rua Exemplo, 123, Bairro" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          
           <Separator />
           
          <div data-ai-id="seller-form-judicial-info">
             <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-4">Configuração Judicial</h3>
             <FormField
                control={form.control}
                name="isJudicial"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                        <div className="space-y-0.5">
                            <FormLabel>Comitente Judicial?</FormLabel>
                            <FormDescription className="text-xs">
                                Marque esta opção se o comitente for uma entidade judicial (ex: Vara, Tribunal).
                            </FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {isJudicial && (
                <FormField
                    control={form.control}
                    name="judicialBranchId"
                    render={({ field }) => (
                        <FormItem className="mt-4">
                            <FormLabel>Vara Judicial Associada</FormLabel>
                            <EntitySelector
                                value={field.value}
                                onChange={field.onChange}
                                options={judicialBranches.map(b => ({ value: b.id, label: `${b.name} - ${b.districtName}` }))}
                                placeholder="Selecione a vara"
                                searchPlaceholder="Buscar vara..."
                                emptyStateMessage="Nenhuma vara encontrada."
                                createNewUrl="/admin/judicial-branches/new"
                                editUrlPrefix="/admin/judicial-branches"
                                onRefetch={handleRefetchBranches}
                                isFetching={isFetchingBranches}
                            />
                            <FormDescription>
                                Vincule este comitente a uma vara judicial específica.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
          </div>
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
SellerForm.displayName = "SellerForm";
export default SellerForm;
