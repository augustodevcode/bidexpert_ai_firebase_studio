

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
import { sellerFormSchema, type SellerFormValues } from './seller-form-schema';
import type { SellerProfileInfo, MediaItem, JudicialBranch } from '@/types';
import { Loader2, Save, Users, Image as ImageIcon, Scale, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Switch } from '@/components/ui/switch';
import { consultaCepAction } from '@/lib/actions/cep'; 
import EntitySelector from '@/components/ui/entity-selector';
import { getJudicialBranches } from '../judicial-branches/actions';


interface SellerFormProps {
  initialData?: SellerProfileInfo | null;
  judicialBranches: JudicialBranch[];
  onSubmitAction: (data: SellerFormValues) => Promise<{ success: boolean; message: string; sellerId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  isViewMode?: boolean;
  onUpdateSuccess?: () => void;
  onCancelEdit?: () => void;
  /** If provided, this will be the redirect path instead of the admin page. */
  successRedirectPath?: string;
}

export default function SellerForm({
  initialData,
  judicialBranches: initialBranches,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  isViewMode = false,
  onUpdateSuccess,
  onCancelEdit,
  successRedirectPath
}: SellerFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [isCepLoading, setIsCepLoading] = React.useState(false);
  const [judicialBranches, setJudicialBranches] = React.useState(initialBranches);
  const [isFetchingBranches, setIsFetchingBranches] = React.useState(false);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      publicId: initialData?.publicId || '',
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
      judicialBranchId: initialData?.judicialBranchId || null,
      isJudicial: initialData?.isJudicial || false,
    },
  });

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
        form.setValue('logoUrl', selectedMediaItem.urlOriginal);
        form.setValue('logoMediaId', selectedMediaItem.id || null);
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
        form.setValue('address', result.data.logradouro);
        // O campo 'neighborhood' não existe no schema do comitente, então não o preenchemos.
        form.setValue('city', result.data.localidade);
        form.setValue('state', result.data.uf);
    } else {
        toast({ title: 'CEP não encontrado', description: result.message, variant: 'destructive'});
    }
    setIsCepLoading(false);
  }

  async function onSubmit(values: SellerFormValues) {
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
            router.push(successRedirectPath || '/admin/sellers');
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
      console.error("Unexpected error in seller form:", error);
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
        <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <fieldset disabled={isViewMode} className="group">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 bg-secondary/30 p-6 group-disabled:bg-background/30 group-disabled:cursor-not-allowed">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Comitente/Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banco XYZ S.A., 1ª Vara Cível de Lagarto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {initialData?.publicId && (
                <FormField
                control={form.control}
                name="publicId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>ID Público</FormLabel>
                    <FormControl>
                        <Input readOnly disabled className="cursor-not-allowed bg-muted/70" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>Este é o ID público do comitente, gerado pelo sistema.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
            <FormField
              control={form.control}
              name="isJudicial"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                  <div className="space-y-0.5">
                    <FormLabel>É Comitente Judicial?</FormLabel>
                    <FormDescription>
                      Marque se este comitente é uma entidade judicial (Vara, Tribunal, etc).
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {isJudicial && (
                <FormField
                    control={form.control}
                    name="judicialBranchId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Scale className="h-4 w-4"/>Vara Judicial Vinculada (Opcional)</FormLabel>
                        <EntitySelector
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
                        <FormDescription>Se este comitente representa uma entidade judicial, vincule-a aqui.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Contato (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} value={field.value ?? ''}/>
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
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@comitente.com" {...field} value={field.value ?? ''} />
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
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} value={field.value ?? ''} />
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
                      <Input type="url" placeholder="https://www.comitente.com" {...field} value={field.value ?? ''} />
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
                        <div className="flex gap-2">
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
                            <Button type="button" variant="secondary" onClick={() => handleCepLookup(form.getValues('zipCode') || '')} disabled={isCepLoading}>
                                {isCepLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Buscar'}
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
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua Exemplo, 123, Bairro" {...field} value={field.value ?? ''} />
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
                    <FormLabel>Cidade</FormLabel>
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
                    <FormLabel>Estado/UF</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormItem>
              <FormLabel>Logo do Comitente</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                  {logoUrlPreview ? (
                    <Image src={logoUrlPreview} alt="Prévia do Logo" fill className="object-contain" data-ai-hint="previa logo comitente" />
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
                            <Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" />
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
                    <Input placeholder="Ex: banco logo, empresa tecnologia" {...field} value={field.value ?? ''} />
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
                  <FormLabel>Descrição/Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais sobre o comitente..." {...field} value={field.value ?? ''} rows={4} />
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
