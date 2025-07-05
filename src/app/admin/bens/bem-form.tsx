// src/app/admin/bens/bem-form.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { bemFormSchema, type BemFormData } from './bem-form-schema';
import type { Bem, LotCategory, JudicialProcess, Subcategory, MediaItem, SellerProfileInfo } from '@/types';
import { Loader2, Save, Package, Gavel, Image as ImageIcon, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction } from '../subcategories/actions';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import Image from 'next/image';

interface BemFormProps {
  initialData?: Partial<Bem> | null;
  processes: JudicialProcess[];
  categories: LotCategory[];
  sellers: SellerProfileInfo[];
  onSubmitAction: (data: BemFormData) => Promise<{ success: boolean; message: string; bemId?: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

const bemStatusOptions: { value: Bem['status']; label: string }[] = [
    { value: 'DISPONIVEL', label: 'Disponível' },
    { value: 'LOTEADO', label: 'Loteado' },
    { value: 'VENDIDO', label: 'Vendido' },
    { value: 'REMOVIDO', label: 'Removido' },
];

export default function BemForm({
  initialData,
  processes,
  categories,
  sellers,
  onSubmitAction,
  onSuccess,
  onCancel,
  formTitle,
  formDescription,
  submitButtonText,
}: BemFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availableSubcategories, setAvailableSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);

  const form = useForm<BemFormData>({
    resolver: zodResolver(bemFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'DISPONIVEL',
      categoryId: initialData?.categoryId || '',
      subcategoryId: initialData?.subcategoryId || undefined,
      judicialProcessId: initialData?.judicialProcessId || undefined,
      sellerId: initialData?.sellerId || null,
      evaluationValue: initialData?.evaluationValue || undefined,
      imageUrl: initialData?.imageUrl || '',
      imageMediaId: initialData?.imageMediaId || null,
      dataAiHint: initialData?.dataAiHint || '',
      locationCity: initialData?.locationCity || '',
      locationState: initialData?.locationState || '',
      address: initialData?.address || '',
      latitude: initialData?.latitude || undefined,
      longitude: initialData?.longitude || undefined,
    },
  });

  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });

  React.useEffect(() => {
    const fetchSubcats = async (parentId: string) => {
        setIsLoadingSubcategories(true);
        setAvailableSubcategories([]); 
        try {
            const parentCategory = categories.find(cat => cat.id === parentId);
            if (parentCategory && parentCategory.hasSubcategories) {
                const subcats = await getSubcategoriesByParentIdAction(parentCategory.id);
                setAvailableSubcategories(subcats);
                const currentSubcategoryId = form.getValues('subcategoryId');
                if (currentSubcategoryId && !subcats.find(s => s.id === currentSubcategoryId)) {
                   form.setValue('subcategoryId', undefined);
                }
            } else {
                form.setValue('subcategoryId', undefined);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            toast({ title: "Erro ao buscar subcategorias", variant: "destructive" });
        } finally {
            setIsLoadingSubcategories(false);
        }
    };
    if (selectedCategoryId) fetchSubcats(selectedCategoryId);
     else { setAvailableSubcategories([]); form.setValue('subcategoryId', undefined); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, categories, form.setValue, toast]);

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('imageUrl', selectedMediaItem.urlOriginal);
        form.setValue('imageMediaId', selectedMediaItem.id);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };


  async function onSubmit(values: BemFormData) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/bens');
          router.refresh();
        }
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (onCancel) {
        onCancel();
    } else {
        router.push('/admin/bens');
    }
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
          <CardDescription>{formDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField name="title" control={form.control} render={({ field }) => (<FormItem><FormLabel>Título/Nome do Bem</FormLabel><FormControl><Input placeholder="Ex: Apartamento 3 quartos, Trator Massey Ferguson" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="description" control={form.control} render={({ field }) => (<FormItem><FormLabel>Descrição Detalhada</FormLabel><FormControl><Textarea placeholder="Descreva todas as características, estado, etc." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField name="status" control={form.control} render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{bemStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="evaluationValue" control={form.control} render={({ field }) => (<FormItem><FormLabel>Valor de Avaliação (R$)</FormLabel><FormControl><Input type="number" placeholder="150000.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField name="categoryId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="subcategoryId" control={form.control} render={({ field }) => (<FormItem><FormLabel>Subcategoria (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={isLoadingSubcategories || availableSubcategories.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingSubcategories ? 'Carregando...' : 'Selecione a subcategoria'} /></SelectTrigger></FormControl><SelectContent>{availableSubcategories.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <FormField name="judicialProcessId" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo Judicial (Opcional)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value ?? 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Vincule a um processo judicial" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {processes.map(p => <SelectItem key={p.id} value={p.id}>{p.processNumber}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormDescription>Vincule este bem a um processo judicial previamente cadastrado.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="sellerId" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> Comitente do Bem (Opcional)</FormLabel>
                   <Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value || 'none'}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Padrão do Processo/Leilão" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormDescription>Selecione um comitente específico para este bem. Se "Nenhum" for selecionado, ele herdará o comitente do processo ou do leilão.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormItem><FormLabel>Imagem Principal</FormLabel><div className="flex items-center gap-4"><div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{imageUrlPreview ? (<Image src={imageUrlPreview} alt="Prévia da Imagem" fill className="object-contain" data-ai-hint="previa imagem bem" />) : (<div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>)}</div><div className="flex-grow space-y-2"><Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>{imageUrlPreview ? 'Alterar Imagem' : 'Escolher da Biblioteca'}</Button><FormField control={form.control} name="imageUrl" render={({ field }) => (<FormControl><Input type="text" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" /></FormControl>)}/></div></div></FormItem>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitButtonText}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={false} />
    </>
  );
}
