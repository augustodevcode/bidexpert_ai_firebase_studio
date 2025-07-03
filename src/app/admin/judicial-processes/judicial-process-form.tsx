// src/app/admin/judicial-processes/judicial-process-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { judicialProcessFormSchema, type JudicialProcessFormValues } from './judicial-process-form-schema';
import type { JudicialProcess, Court, JudicialDistrict, JudicialBranch, ProcessPartyType, SellerProfileInfo } from '@/types';
import { Loader2, Save, Gavel, PlusCircle, Trash2, Users, Building, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createSeller, getSeller } from '@/app/admin/sellers/actions'; // Import createSeller and getSeller

interface JudicialProcessFormProps {
  initialData?: JudicialProcess | null;
  courts: Court[];
  allDistricts: JudicialDistrict[];
  allBranches: JudicialBranch[];
  sellers: SellerProfileInfo[];
  onSubmitAction: (data: JudicialProcessFormValues) => Promise<{ success: boolean; message: string; processId?: string }>;
  onSuccess?: (newProcessId?: string) => void;
  onCancel?: () => void;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

const partyTypeOptions: { value: ProcessPartyType; label: string }[] = [
    { value: 'AUTOR', label: 'Autor / Exequente' }, { value: 'REU', label: 'Réu / Executado' },
    { value: 'ADVOGADO_AUTOR', label: 'Advogado (Autor)' }, { value: 'ADVOGADO_REU', label: 'Advogado (Réu)' },
    { value: 'JUIZ', label: 'Juiz(a)' }, { value: 'ESCRIVAO', label: 'Escrivão(ã)' },
    { value: 'PERITO', label: 'Perito(a)' }, { value: 'ADMINISTRADOR_JUDICIAL', label: 'Administrador Judicial' },
    { value: 'TERCEIRO_INTERESSADO', label: 'Terceiro Interessado' }, { value: 'OUTRO', label: 'Outro' },
];

export default function JudicialProcessForm({
  initialData, courts, allDistricts, allBranches, sellers: initialSellers,
  onSubmitAction, 
  onSuccess,
  onCancel,
  formTitle,
  formDescription,
  submitButtonText,
}: JudicialProcessFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCreatingSeller, setIsCreatingSeller] = React.useState(false);
  const [sellersForSelect, setSellersForSelect] = React.useState(initialSellers);
  const [showCreateSellerButton, setShowCreateSellerButton] = React.useState(false);

  const form = useForm<JudicialProcessFormValues>({
    resolver: zodResolver(judicialProcessFormSchema),
    defaultValues: {
      processNumber: initialData?.processNumber || '',
      isElectronic: initialData?.isElectronic ?? true,
      courtId: initialData?.courtId || '',
      districtId: initialData?.districtId || '',
      branchId: initialData?.branchId || '',
      sellerId: initialData?.sellerId || null,
      parties: initialData?.parties?.map(p => ({...p, id: p.id || `temp-${Math.random()}`})) || [{ name: '', partyType: 'AUTOR' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "parties" });

  const selectedCourtId = useWatch({ control: form.control, name: 'courtId' });
  const selectedDistrictId = useWatch({ control: form.control, name: 'districtId' });
  const selectedBranchId = useWatch({ control: form.control, name: 'branchId' });

  const judicialSellers = React.useMemo(() => {
    return sellersForSelect.filter(s => s.isJudicial);
  }, [sellersForSelect]);
  
  const filteredDistricts = React.useMemo(() => allDistricts.filter(d => d.courtId === selectedCourtId), [selectedCourtId, allDistricts]);
  const filteredBranches = React.useMemo(() => allBranches.filter(b => b.districtId === selectedDistrictId), [selectedDistrictId, allBranches]);

  React.useEffect(() => {
    if (selectedCourtId && !filteredDistricts.find(d => d.id === form.getValues('districtId'))) {
        form.setValue('districtId', '');
        form.setValue('branchId', '');
    }
  }, [selectedCourtId, filteredDistricts, form]);

  React.useEffect(() => {
    if (selectedDistrictId && !filteredBranches.find(b => b.id === form.getValues('branchId'))) {
        form.setValue('branchId', '');
    }
  }, [selectedDistrictId, filteredBranches, form]);

  React.useEffect(() => {
    if (!selectedBranchId) {
      setShowCreateSellerButton(false);
      return;
    }
    const linkedSeller = sellersForSelect.find(s => s.judicialBranchId === selectedBranchId);
    if (linkedSeller) {
      form.setValue('sellerId', linkedSeller.id);
      setShowCreateSellerButton(false);
    } else {
      form.setValue('sellerId', null);
      setShowCreateSellerButton(true);
    }
  }, [selectedBranchId, sellersForSelect, form]);

  const handleAutoCreateSeller = async () => {
    const branch = allBranches.find(b => b.id === selectedBranchId);
    if (!branch) {
      toast({ title: "Erro", description: "Selecione uma vara válida primeiro.", variant: "destructive"});
      return;
    }

    setIsCreatingSeller(true);
    try {
      const result = await createSeller({
        name: branch.name,
        isJudicial: true,
        judicialBranchId: branch.id,
      });

      if (result.success && result.sellerId) {
        toast({ title: "Sucesso!", description: `Comitente "${branch.name}" criado e vinculado.` });
        const newSeller = await getSeller(result.sellerId);
        if (newSeller) {
          setSellersForSelect(prev => [...prev, newSeller]);
          form.setValue('sellerId', newSeller.id);
        }
      } else {
        toast({ title: "Erro ao Criar Comitente", description: result.message, variant: "destructive" });
      }
    } catch(e: any) {
        toast({ title: "Erro Inesperado", description: e.message, variant: "destructive" });
    } finally {
        setIsCreatingSeller(false);
    }
  };

  async function onSubmit(values: JudicialProcessFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if (onSuccess) {
            onSuccess(result.processId);
        } else {
            router.push('/admin/judicial-processes');
            router.refresh();
        }
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/admin/judicial-processes');
    }
  };


  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gavel className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="processNumber" render={({ field }) => (<FormItem><FormLabel>Número do Processo*</FormLabel><FormControl><Input placeholder="0000000-00.0000.0.00.0000" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="isElectronic" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Processo Eletrônico</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
            
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground pt-2">Localização e Comitente</h3>
            <FormField control={form.control} name="courtId" render={({ field }) => (<FormItem><FormLabel>Tribunal*</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o Tribunal" /></SelectTrigger></FormControl><SelectContent>{courts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="districtId" render={({ field }) => (<FormItem><FormLabel>Comarca*</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourtId}><FormControl><SelectTrigger><SelectValue placeholder={!selectedCourtId ? "Selecione um tribunal primeiro" : "Selecione a Comarca"} /></SelectTrigger></FormControl><SelectContent>{filteredDistricts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="branchId" render={({ field }) => (<FormItem><FormLabel>Vara*</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistrictId}><FormControl><SelectTrigger><SelectValue placeholder={!selectedDistrictId ? "Selecione uma comarca primeiro" : "Selecione a Vara"} /></SelectTrigger></FormControl><SelectContent>{filteredBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
            
             <FormField control={form.control} name="sellerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Comitente Principal</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      value={field.value || 'none'}
                      disabled={showCreateSellerButton || isCreatingSeller}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-grow">
                          <SelectValue placeholder="Selecione um comitente judicial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {judicialSellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {showCreateSellerButton && (
                      <Button type="button" variant="outline" onClick={handleAutoCreateSeller} disabled={isCreatingSeller}>
                        {isCreatingSeller ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Building className="mr-2 h-4 w-4" />}
                        Criar Comitente da Vara
                      </Button>
                    )}
                  </div>
                  <FormDescription>O comitente será preenchido automaticamente se houver um vinculado à vara selecionada.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />


            <Separator />
            <div className="flex justify-between items-center pt-2">
                <h3 className="text-md font-semibold text-muted-foreground flex items-center gap-2"><Users className="h-5 w-5"/>Partes Envolvidas*</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', partyType: 'OUTRO' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Parte</Button>
            </div>
            {fields.map((field, index) => (
              <Card key={field.id} className="p-3 bg-secondary/30">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <FormField control={form.control} name={`parties.${index}.name`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Nome</FormLabel><FormControl><Input placeholder="Nome da Parte/Advogado" {...field} /></FormControl><FormMessage className="text-xs"/></FormItem>)}/>
                    <FormField control={form.control} name={`parties.${index}.partyType`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="text-xs h-9"><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl><SelectContent>{partyTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)}/>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive/80" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitButtonText}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
