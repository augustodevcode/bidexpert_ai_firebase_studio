// src/app/admin/auctions/auction-form.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auctionFormSchema, type AuctionFormValues } from './auction-form-schema';
import type { Auction, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, JudicialProcess, StateInfo, CityInfo, MediaItem, PlatformSettings } from '@/types';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Info, Users, Landmark, Map, Gavel, FileText as FileTextIcon, Image as ImageIcon, Settings, DollarSign, Repeat, Clock, PlusCircle, Trash2, TrendingDown } from 'lucide-react';
import EntitySelector from '@/components/ui/entity-selector';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import Image from 'next/image';
import MapPicker from '@/components/map-picker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save } from 'lucide-react';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { getPlatformSettings } from '../settings/actions';

const auctionStatusOptions = [ 'RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO' ];
const auctionTypeOptions = [ 'JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS' ];
const auctionParticipationOptions = [ 'ONLINE', 'PRESENCIAL', 'HIBRIDO' ];
const auctionMethodOptions = [ 'STANDARD', 'DUTCH', 'SILENT' ];

interface AuctionFormProps {
  initialData?: Partial<Auction> | null;
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
  judicialProcesses?: JudicialProcess[];
  onSubmitAction: (data: Partial<AuctionFormValues>) => Promise<any>;
  formTitle: string;
  formDescription: string;
  isWizardMode?: boolean;
  onWizardDataChange?: (data: Partial<AuctionFormValues>) => void;
  formRef?: React.Ref<any>;
}

const AuctionForm = React.forwardRef<any, AuctionFormProps>((
{
  initialData,
  categories: initialCategories,
  auctioneers: initialAuctioneers,
  sellers: initialSellers,
  states: initialStates,
  allCities: initialAllCities,
  judicialProcesses: initialJudicialProcesses,
  onSubmitAction,
  isWizardMode = false,
  onWizardDataChange,
}, ref) => {
  
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    getPlatformSettings().then(settings => setPlatformSettings(settings as PlatformSettings));
  }, []);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
        ...initialData,
        auctionDate: initialData?.auctionDate ? new Date(initialData.auctionDate) : new Date(),
        endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
        auctionStages: initialData?.auctionStages?.map(s => ({...s, startDate: new Date(s.startDate), endDate: new Date(s.endDate)})) || [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), initialPrice: null }],
    },
  });
  
  const watchedValues = useWatch({ control: form.control });

  React.useEffect(() => {
    if (isWizardMode && onWizardDataChange) {
      const subscription = form.watch((value) => {
        onWizardDataChange(value as Partial<AuctionFormValues>);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isWizardMode, onWizardDataChange]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
    setValue: form.setValue,
    getValues: form.getValues,
  }));

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "auctionStages",
  });
  
  const watchedImageMediaId = useWatch({ control: form.control, name: 'imageMediaId' });
  const watchedImageUrl = useWatch({ control: form.control, name: 'imageUrl' });
  const watchedAuctionMethod = useWatch({ control: form.control, name: 'auctionMethod' });

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
        form.setValue('imageMediaId', selectedItems[0]?.id || null);
        form.setValue('imageUrl', selectedItems[0]?.urlOriginal || null);
    }
    setIsMediaDialogOpen(false);
  };
  
  async function onSubmit(values: AuctionFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmitAction(values);
    } catch (error) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleAddStage = () => {
    const lastStage = fields[fields.length - 1];
    const durationDays = platformSettings?.biddingSettings?.defaultStageDurationDays || 7;
    const intervalDays = platformSettings?.biddingSettings?.defaultDaysBetweenStages || 1;

    let newStartDate = new Date();
    if (lastStage?.endDate) {
      newStartDate = addDays(new Date(lastStage.endDate), intervalDays);
    } else {
      newStartDate = addDays(new Date(), 1); 
    }
    
    const newEndDate = addDays(newStartDate, durationDays);

    append({ name: `Praça ${fields.length + 1}`, startDate: newStartDate, endDate: newEndDate, initialPrice: null });
  };
  
  const handleStageChange = (index: number, field: keyof (typeof fields)[0], value: any) => {
    form.setValue(`auctionStages.${index}.${field as any}`, value, { shouldDirty: true });
  };

  const accordionContent = (section: string) => {
    switch (section) {
        case "geral": return (
            <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título do Leilão</FormLabel><FormControl><Input placeholder="Ex: Leilão de Veículos da Empresa X" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Descreva os detalhes gerais do leilão, regras de visitação, etc." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{auctionStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria Principal</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={(initialCategories||[]).map(c=>({value: c.id, label:c.name}))} placeholder="Selecione..." searchPlaceholder='Buscar...' emptyStateMessage='Nenhuma categoria.' createNewUrl="/admin/categories/new" /><FormMessage /></FormItem>)} />
                </div>
            </div>
        );
        case "participantes": return (
             <div className="space-y-4">
                 <FormField control={form.control} name="auctioneerId" render={({ field }) => (<FormItem><FormLabel>Leiloeiro</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={(initialAuctioneers||[]).map(c=>({value: c.id, label:c.name}))} placeholder="Selecione o leiloeiro" searchPlaceholder='Buscar...' emptyStateMessage='Nenhum leiloeiro.' createNewUrl="/admin/auctioneers/new" /><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="sellerId" render={({ field }) => (<FormItem><FormLabel>Comitente/Vendedor</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={(initialSellers||[]).map(c=>({value: c.id, label:c.name}))} placeholder="Selecione o comitente" searchPlaceholder='Buscar...' emptyStateMessage='Nenhum comitente.' createNewUrl="/admin/sellers/new" /><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="judicialProcessId" render={({ field }) => (<FormItem><FormLabel>Processo Judicial (Opcional)</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={(initialJudicialProcesses||[]).map(p=>({value: p.id, label:p.processNumber}))} placeholder="Vincule a um processo" searchPlaceholder='Buscar processo...' emptyStateMessage='Nenhum processo.' createNewUrl="/admin/judicial-processes/new" /><FormDescription>Para bens de origem judicial.</FormDescription></FormItem>)} />
             </div>
        );
        case "modalidade": return (
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="auctionType" render={({ field }) => (<FormItem><FormLabel>Modalidade do Leilão</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{auctionTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="participation" render={({ field }) => (<FormItem><FormLabel>Forma de Participação</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{auctionParticipationOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="auctionMethod" render={({ field }) => (<FormItem><FormLabel>Método de Disputa</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{auctionMethodOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="onlineUrl" render={({ field }) => (<FormItem><FormLabel>URL do Leilão Online</FormLabel><FormControl><Input placeholder="https://meet.google.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        );
        case "localizacao": return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-2"><FormField control={form.control} name="zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''}/></FormControl></FormItem>)}/><FormField control={form.control} name="address" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Endereço Completo</FormLabel><FormControl><Input placeholder="Rua, Número, Bairro..." {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField control={form.control} name="cityId" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={(allCities||[]).map(c=>({value:c.id, label:`${c.name} - ${c.stateUf}`}))} placeholder="Selecione a cidade" searchPlaceholder='Buscar cidade...' emptyStateMessage='Nenhuma cidade.'/><FormMessage /></FormItem>)}/><FormField control={form.control} name="stateId" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={(initialStates||[]).map(s=>({value: s.id, label: s.name}))} placeholder="Selecione o estado" searchPlaceholder='Buscar estado...' emptyStateMessage='Nenhum estado.'/><FormMessage /></FormItem>)}/></div>
                <MapPicker latitude={form.getValues('latitude')} longitude={form.getValues('longitude')} setValue={form.setValue} />
            </div>
        );
        case "prazos": return (
            <AuctionStagesTimeline
                stages={fields}
                isEditable={true}
                onStageChange={handleStageChange}
                onAddStage={handleAddStage}
                onRemoveStage={remove}
                platformSettings={platformSettings}
            />
        );
        case "midia": return (
            <div className="space-y-4">
                <FormField control={form.control} name="imageMediaId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Imagem Principal do Leilão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'CUSTOM'}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUSTOM">Imagem Customizada</SelectItem><SelectItem value="INHERIT">Herdar do Lote em Destaque</SelectItem></SelectContent></Select>
                        <FormDescription>Você pode definir uma imagem específica ou herdar dinamicamente da imagem do lote que estiver marcado como destaque.</FormDescription>
                        <FormMessage/>
                    </FormItem>
                )}/>
                {watchedImageMediaId !== 'INHERIT' && (
                    <FormItem>
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">{watchedImageUrl ? (<Image src={watchedImageUrl} alt="Prévia" fill className="object-contain" />) : (<ImageIcon className="h-8 w-8 text-muted-foreground m-auto"/>)}</div>
                            <div className="space-y-2 flex-grow">
                                <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>{watchedImageUrl ? 'Alterar Imagem' : 'Escolher da Biblioteca'}</Button>
                                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} /></FormControl>)} />
                            </div>
                        </div>
                    </FormItem>
                )}
                {watchedImageMediaId === 'INHERIT' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 flex items-center gap-3">
                       <Info className="h-5 w-5 flex-shrink-0"/>
                       <div>A imagem deste leilão será a mesma do lote que você marcar como &quot;Destaque&quot;. Se nenhum lote for marcado, uma imagem padrão será usada.</div>
                    </div>
                )}
            </div>
        );
        case "opcoes": return (
            <div className="container-opcoes-leilao space-y-4">
                {watchedAuctionMethod === 'DUTCH' && (
                    <Card className="card-leilao-holandes">
                        <CardHeader className="card-header-leilao-holandes">
                            <CardTitle className="titulo-card-leilao-holandes">
                                <TrendingDown className="icone-titulo-leilao-holandes"/>Configurações do Leilão Holandês
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="conteudo-card-leilao-holandes">
                            <FormField control={form.control} name="decrementAmount" render={({ field }) => (<FormItem><FormLabel className="label-campo-form">Valor do Decremento (R$)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="decrementIntervalSeconds" render={({ field }) => (<FormItem><FormLabel className="label-campo-form">Intervalo do Decremento (Segundos)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="floorPrice" render={({ field }) => (<FormItem><FormLabel className="label-campo-form">Preço Mínimo (R$)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>
                )}
                <FormField control={form.control} name="isFeaturedOnMarketplace" render={({ field }) => (<FormItem className="item-switch-form"><div className="espaco-label-switch"><FormLabel>Destaque no Marketplace</FormLabel><FormDescription className="descricao-switch">Exibir este leilão na seção de destaques da home page.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="allowInstallmentBids" render={({ field }) => (<FormItem className="item-switch-form"><div className="espaco-label-switch"><FormLabel>Permitir Lances Parcelados</FormLabel><FormDescription className="descricao-switch">Habilita a opção de checkout com parcelamento para os lotes deste leilão.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            </div>
        );
        default: return null;
    }
  }

  return (
    <>
      <div data-ai-id="admin-auction-form-card">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Accordion type="multiple" defaultValue={["geral", "participantes"]} className="w-full">
                    <AccordionItem value="geral"><AccordionTrigger>Informações Gerais</AccordionTrigger><AccordionContent className="p-4">{accordionContent("geral")}</AccordionContent></AccordionItem>
                    <AccordionItem value="participantes"><AccordionTrigger>Participantes</AccordionTrigger><AccordionContent className="p-4">{accordionContent("participantes")}</AccordionContent></AccordionItem>
                    <AccordionItem value="modalidade"><AccordionTrigger>Modalidade e Local</AccordionTrigger><AccordionContent className="p-4">{accordionContent("modalidade")}{accordionContent("localizacao")}</AccordionContent></AccordionItem>
                    <AccordionItem value="prazos"><AccordionTrigger>Datas e Prazos</AccordionTrigger><AccordionContent className="p-4">{accordionContent("prazos")}</AccordionContent></AccordionItem>
                    <AccordionItem value="midia"><AccordionTrigger>Mídia</AccordionTrigger><AccordionContent className="p-4">{accordionContent("midia")}</AccordionContent></AccordionItem>
                    <AccordionItem value="opcoes"><AccordionTrigger>Opções Avançadas</AccordionTrigger><AccordionContent className="p-4">{accordionContent("opcoes")}</AccordionContent></AccordionItem>
                </Accordion>
                 {!isWizardMode && (
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                      { "Salvar Alterações"}
                    </Button>
                  </div>
                )}
            </form>
        </Form>
      </div>
      <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={false} />
    </>
  );
});

AuctionForm.displayName = "AuctionForm";

export default AuctionForm;
