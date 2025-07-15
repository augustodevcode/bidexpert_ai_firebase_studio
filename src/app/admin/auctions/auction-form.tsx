// src/app/admin/auctions/auction-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auctionFormSchema, type AuctionFormValues } from './auction-form-schema';
import type { Auction, AuctionStatus, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage, MediaItem } from '@/types';
import { Loader2, Save, CalendarIcon, Gavel, Bot, Percent, FileText, PlusCircle, Trash2, Landmark, ClockIcon, Image as ImageIcon, Zap, TrendingDown, HelpCircle, Repeat, MicOff, FileSignature, XCircle, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import { Separator } from '@/components/ui/separator';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface AuctionFormProps {
  initialData?: Auction | null;
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[]; 
  sellers: SellerProfileInfo[];    
  onSubmitAction: (data: AuctionFormValues) => Promise<{ success: boolean; message: string; auctionId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  isViewMode?: boolean;
  onUpdateSuccess?: () => void;
  onCancelEdit?: () => void;
}

const auctionStatusOptions: { value: AuctionStatus; label: string }[] = [
  { value: 'RASCUNHO', label: getAuctionStatusText('RASCUNHO') },
  { value: 'EM_PREPARACAO', label: getAuctionStatusText('EM_PREPARACAO') },
  { value: 'EM_BREVE', label: getAuctionStatusText('EM_BREVE') },
  { value: 'ABERTO', label: getAuctionStatusText('ABERTO') }, 
  { value: 'ABERTO_PARA_LANCES', label: getAuctionStatusText('ABERTO_PARA_LANCES') },
  { value: 'ENCERRADO', label: getAuctionStatusText('ENCERRADO') },
  { value: 'FINALIZADO', label: getAuctionStatusText('FINALIZADO') }, 
  { value: 'CANCELADO', label: getAuctionStatusText('CANCELADO') },
  { value: 'SUSPENSO', label: getAuctionStatusText('SUSPENSO') },
];

const auctionTypeOptions = [
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
  { value: 'DUTCH', label: 'Holandês (Reverso)' },
  { value: 'SILENT', label: 'Silencioso (Lance Fechado)' },
];

export default function AuctionForm({
  initialData,
  categories,
  auctioneers, 
  sellers,    
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  isViewMode = false,
  onUpdateSuccess,
  onCancelEdit,
}: AuctionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'RASCUNHO',
      auctionType: initialData?.auctionType || undefined,
      auctioneer: initialData?.auctioneer || '', 
      seller: initialData?.seller || '',       
      auctionDate: initialData?.auctionDate ? new Date(initialData.auctionDate as Date) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate as Date) : null,
      mapAddress: initialData?.mapAddress || '',
      imageUrl: initialData?.imageUrl || '',
      documentsUrl: initialData?.documentsUrl || '',
      evaluationReportUrl: initialData?.evaluationReportUrl || '',
      auctionCertificateUrl: initialData?.auctionCertificateUrl || '',
      sellingBranch: initialData?.sellingBranch || '',
      automaticBiddingEnabled: initialData?.automaticBiddingEnabled || false,
      silentBiddingEnabled: initialData?.silentBiddingEnabled || false,
      allowMultipleBidsPerUser: initialData?.allowMultipleBidsPerUser === false ? false : true,
      softCloseEnabled: initialData?.softCloseEnabled || false,
      softCloseMinutes: initialData?.softCloseMinutes || 2,
      estimatedRevenue: initialData?.estimatedRevenue || undefined,
      isFeaturedOnMarketplace: initialData?.isFeaturedOnMarketplace || false,
      marketplaceAnnouncementTitle: initialData?.marketplaceAnnouncementTitle || '',
      auctionStages: initialData?.auctionStages?.map(stage => ({ ...stage, endDate: new Date(stage.endDate as Date) })) || [{ name: '1ª Praça', endDate: new Date() }],
      decrementAmount: initialData?.decrementAmount || undefined,
      decrementIntervalSeconds: initialData?.decrementIntervalSeconds || undefined,
      floorPrice: initialData?.floorPrice || undefined,
      autoRelistSettings: initialData?.autoRelistSettings || {
        enableAutoRelist: false,
        recurringAutoRelist: false,
        relistIfWinnerNotPaid: false,
        relistIfWinnerNotPaidAfterHours: 2,
        relistIfNoBids: false,
        relistIfNoBidsAfterHours: 2,
        relistIfReserveNotMet: false,
        relistIfReserveNotMetAfterHours: 2,
        relistDurationInHours: 150,
      }
    },
  });
  
  const imageUrlPreview = useWatch({ control: form.control, name: 'imageUrl' });
  const softCloseEnabled = useWatch({ control: form.control, name: 'softCloseEnabled' });
  const watchedAuctionType = useWatch({ control: form.control, name: 'auctionType' });
  const watchedAutoRelist = useWatch({ control: form.control, name: 'autoRelistSettings' });
  const watchedSilentBidding = form.watch('silentBiddingEnabled');

  const uniqueAuctioneers = React.useMemo(() => {
    const seenNames = new Set();
    return auctioneers.filter(auc => {
        if (seenNames.has(auc.name)) {
            return false;
        }
        seenNames.add(auc.name);
        return true;
    });
  }, [auctioneers]);

  const uniqueSellers = React.useMemo(() => {
    const seenNames = new Set();
    return sellers.filter(sel => {
        if (seenNames.has(sel.name)) {
            return false;
        }
        seenNames.add(sel.name);
        return true;
    });
  }, [sellers]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "auctionStages",
  });

  const watchedAuctionDate = useWatch({ control: form.control, name: 'auctionDate' });
  const watchedStages = useWatch({ control: form.control, name: 'auctionStages' });

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('imageUrl', selectedMediaItem.urlOriginal);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };

  async function onSubmit(values: AuctionFormValues) {
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
            router.push('/admin/auctions');
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
      console.error("Unexpected error in auction form:", error);
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
    <TooltipProvider>
    <ChooseMediaDialog
      isOpen={isMediaDialogOpen}
      onOpenChange={setIsMediaDialogOpen}
      onMediaSelect={handleMediaSelect}
      allowMultiple={false}
    />
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gavel className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <fieldset disabled={isViewMode} className="group">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30 group-disabled:bg-muted/10">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Leilão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Leilão de Imóveis da Empresa X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes sobre o leilão, informações importantes, etc." {...field} value={field.value ?? ""} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Leilão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auctionStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="auctionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade de Leilão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo/modalidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auctionTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value!}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedAuctionType === 'DUTCH' && (
              <>
                  <Separator />
                  <h3 className="text-md font-semibold text-muted-foreground pt-2 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" /> Configurações do Leilão Holandês
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 p-4 border rounded-lg bg-background">
                      <FormField control={form.control} name="floorPrice" render={({ field }) => (
                          <FormItem><FormLabel>Preço Mínimo (R$)</FormLabel><FormControl><Input type="number" placeholder="1000.00" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">O preço não cairá abaixo disso.</FormDescription><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="decrementAmount" render={({ field }) => (
                          <FormItem><FormLabel>Decremento (R$)</FormLabel><FormControl><Input type="number" placeholder="50.00" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">Valor a ser subtraído a cada intervalo.</FormDescription><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="decrementIntervalSeconds" render={({ field }) => (
                          <FormItem><FormLabel>Intervalo (Segundos)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">Tempo entre cada decremento.</FormDescription><FormMessage /></FormItem>
                      )} />
                  </div>
              </>
            )}
            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="auctioneer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leiloeiro Responsável</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o leiloeiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uniqueAuctioneers.length === 0 ? (
                            <p className="p-2 text-sm text-muted-foreground">Nenhum leiloeiro cadastrado</p>
                          ) : (
                            uniqueAuctioneers.map(auc => (
                              <SelectItem key={auc.id} value={auc.name}>{auc.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="seller"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Comitente/Vendedor Principal (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione o comitente" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {uniqueSellers.length === 0 ? (
                                <p className="p-2 text-sm text-muted-foreground">Nenhum comitente cadastrado</p>
                            ) : (
                            uniqueSellers.map(sel => (
                                <SelectItem key={sel.id} value={sel.name}>{sel.name}</SelectItem>
                            ))
                            )}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <Separator />
             <FormField
                control={form.control}
                name="auctionDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data Principal de Início do Leilão</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                            >
                            {field.value ? format(field.value, "PPP HH:mm", { locale: ptBR }) : <span>Escolha data e hora</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        <div className="p-2 border-t">
                            <Input type="time" defaultValue={field.value ? format(field.value, "HH:mm") : "10:00"}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = field.value ? new Date(field.value) : new Date();
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                            }} />
                        </div>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>Data e hora de início do evento principal do leilão.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground flex items-center"><ClockIcon className="h-4 w-4 mr-2"/>Praças / Etapas do Leilão</h3>
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 space-y-3 bg-background">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Praça / Etapa {index + 1}</h4>
                  {!isViewMode && fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80 h-7 w-7">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`auctionStages.${index}.name`}
                    render={({ field: stageField }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nome da Praça/Etapa</FormLabel>
                        <FormControl><Input {...stageField} placeholder={`Ex: ${index+1}ª Praça`} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`auctionStages.${index}.endDate`}
                    render={({ field: stageField }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs">Data de Encerramento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal bg-background", !stageField.value && "text-muted-foreground")}>
                                {stageField.value ? format(stageField.value, "dd/MM/yy HH:mm", { locale: ptBR }) : <span>Escolha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={stageField.value} onSelect={stageField.onChange} initialFocus />
                            <div className="p-2 border-t">
                                <Input type="time" defaultValue={stageField.value ? format(stageField.value, "HH:mm") : "10:00"}
                                onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':');
                                    const newDate = stageField.value ? new Date(stageField.value) : new Date();
                                    newDate.setHours(Number(hours), Number(minutes));
                                    stageField.onChange(newDate);
                                }} />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}
            {!isViewMode && (
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: `${fields.length + 1}ª Praça`, endDate: new Date() })} className="text-xs">
                    <PlusCircle className="mr-2 h-3.5 w-3.5" /> Adicionar Praça/Etapa
                </Button>
            )}
            
            <AuctionStagesTimeline auctionOverallStartDate={watchedAuctionDate} stages={watchedStages as AuctionStage[]} />

            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground flex items-center"><Landmark className="h-4 w-4 mr-2"/>Localização e Documentos</h3>
             <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Encerramento Geral (Opcional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                            {field.value ? format(field.value, "PPP HH:mm", { locale: ptBR }) : <span>Escolha data e hora (se aplicável)</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                         <div className="p-2 border-t">
                            <Input type="time" defaultValue={field.value ? format(field.value, "HH:mm") : "17:00"}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = field.value ? new Date(field.value) : new Date();
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                            }}/>
                        </div>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>Data final para todos os lances, se não definida por praças individuais.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            
             <FormField
                  control={form.control}
                  name="mapAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Endereço do Leilão (Para Mapa)</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua Exemplo, 123, Bairro, Cidade - UF, 00000-000" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>Usado para gerar o link do mapa. Seja o mais completo possível.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
              />
            
            <FormItem>
              <FormLabel>Imagem de Capa (Opcional)</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                  {imageUrlPreview ? (
                    <Image src={imageUrlPreview} alt="Prévia da Imagem" fill className="object-contain" data-ai-hint="previa imagem leilao" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-grow space-y-2">
                  <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>
                    {imageUrlPreview ? 'Alterar Imagem' : 'Escolher da Biblioteca'}
                  </Button>
                  <FormField
                    control={form.control}
                    name="imageUrl"
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
            
            <FormField control={form.control} name="documentsUrl" render={({ field }) => (<FormItem><FormLabel>URL do Edital/Documentos</FormLabel><FormControl><Input type="url" placeholder="https://exemplo.com/edital.pdf" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="evaluationReportUrl" render={({ field }) => (<FormItem><FormLabel>URL do Laudo de Avaliação (Gerado)</FormLabel><FormControl><Input disabled {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este campo é preenchido automaticamente após a geração do laudo.</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="auctionCertificateUrl" render={({ field }) => (<FormItem><FormLabel>URL do Certificado do Leilão (Gerado)</FormLabel><FormControl><Input disabled {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este campo é preenchido automaticamente após a geração do certificado.</FormDescription><FormMessage /></FormItem>)} />
            
            <FormField
                control={form.control}
                name="sellingBranch"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Filial de Venda (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ex: Matriz SP, Filial RJ" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground flex items-center"><Bot className="h-4 w-4 mr-2"/> Configurações de Automação e Lances</h3>
            <FormField
                control={form.control}
                name="automaticBiddingEnabled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                    <div className="space-y-0.5">
                        <FormLabel>Robô de Lances (Global)</FormLabel>
                        <FormDescription>Permitir lances automáticos (robô) para este leilão?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="silentBiddingEnabled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                    <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2"><MicOff className="h-4 w-4 text-purple-500"/> Ativar Lances Silenciosos</FormLabel>
                        <FormDescription>Os lances são ocultos. O maior lance vence no final.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {watchedSilentBidding && (
                <FormField
                    control={form.control}
                    name="allowMultipleBidsPerUser"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm ml-4 bg-background/70">
                        <div className="space-y-0.5">
                            <FormLabel>Permitir Múltiplos Lances Silenciosos</FormLabel>
                            <FormDescription>Se desativado, cada usuário pode dar apenas um lance.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="softCloseEnabled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                    <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Soft-Close (Anti-Sniping)</FormLabel>
                        <FormDescription>Estender o tempo final se houver lances nos últimos minutos?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {softCloseEnabled && (
                 <FormField
                    control={form.control}
                    name="softCloseMinutes"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Minutos para Soft-Close</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value ?? 2} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                        <FormDescription>Se um lance ocorrer neste período final, o leilão será estendido.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
            
             <FormField
                control={form.control}
                name="estimatedRevenue"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Faturamento Estimado (R$ - Opcional)</FormLabel>
                    <FormControl><Input type="number" placeholder="Ex: 100000.00" {...field} value={field.value ?? ""} /></FormControl>
                    <FormDescription>Estimativa de valor total a ser arrecadado.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground flex items-center"><Percent className="h-4 w-4 mr-2"/> Configurações de Marketplace</h3>
             <FormField
                control={form.control}
                name="isFeaturedOnMarketplace"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                    <div className="space-y-0.5">
                        <FormLabel>Destaque no Marketplace</FormLabel>
                        <FormDescription>Marcar este leilão como destaque na plataforma?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="marketplaceAnnouncementTitle"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Título do Anúncio no Marketplace (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ex: Grande Oportunidade! Leilão Imperdível!" {...field} value={field.value ?? ""} /></FormControl>
                    <FormDescription>Título curto para exibição em áreas de destaque.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />

            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground flex items-center"><Repeat className="h-4 w-4 mr-2"/> Configurações de Relançamento Automático</h3>
            <FormField control={form.control} name="autoRelistSettings.enableAutoRelist" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>Ativar Relançamento Automático</FormLabel><FormDescription>Permitir que leilões não vendidos sejam relançados automaticamente.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            {watchedAutoRelist?.enableAutoRelist && (
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <FormField control={form.control} name="autoRelistSettings.recurringAutoRelist" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Relançamento Recorrente</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <Separator />
                <div className="space-y-3">
                  <FormField control={form.control} name="autoRelistSettings.relistIfWinnerNotPaid" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Relançar se vencedor não pagar</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                  {watchedAutoRelist.relistIfWinnerNotPaid && (<FormField control={form.control} name="autoRelistSettings.relistIfWinnerNotPaidAfterHours" render={({ field }) => (<FormItem><FormLabel className="text-xs">Relançar após (horas)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />)}
                </div>
                <div className="space-y-3">
                  <FormField control={form.control} name="autoRelistSettings.relistIfNoBids" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Relançar se não houver lances</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                  {watchedAutoRelist.relistIfNoBids && (<FormField control={form.control} name="autoRelistSettings.relistIfNoBidsAfterHours" render={({ field }) => (<FormItem><FormLabel className="text-xs">Relançar após (horas)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />)}
                </div>
                 <div className="space-y-3">
                  <FormField control={form.control} name="autoRelistSettings.relistIfReserveNotMet" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Relançar se preço de reserva não for atingido</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                  {watchedAutoRelist.relistIfReserveNotMet && (<FormField control={form.control} name="autoRelistSettings.relistIfReserveNotMetAfterHours" render={({ field }) => (<FormItem><FormLabel className="text-xs">Relançar após (horas)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />)}
                </div>
                <Separator />
                <FormField control={form.control} name="autoRelistSettings.relistDurationInHours" render={({ field }) => (<FormItem><FormLabel>Duração do Novo Leilão (em horas)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
              </div>
            )}


          </CardContent>
          {!isViewMode && (
              <CardFooter className="flex justify-end gap-2 p-6 border-t">
                <Button type="button" variant="outline" onClick={handleCancelClick} disabled={isSubmitting}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancelar Edição
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
    </TooltipProvider>
  );
}
