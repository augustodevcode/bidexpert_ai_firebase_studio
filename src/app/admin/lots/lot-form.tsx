
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { lotFormSchema, type LotFormValues } from './lot-form-schema';
import type { Lot, LotStatus, LotCategory, Auction, StateInfo, CityInfo, MediaItem } from '@/types';
import { Loader2, Save, CalendarIcon, Package, ImagePlus, UploadCloud, Trash2, MapPin, FileText, Shield, Banknote, Link as LinkIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, getLotStatusColor, sampleMediaItems } from '@/lib/sample-data'; // Import sampleMediaItems
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';

interface LotFormProps {
  initialData?: Lot | null;
  categories: LotCategory[];
  auctions: Auction[];
  states: StateInfo[];
  allCities: CityInfo[];
  onSubmitAction: (data: LotFormValues) => Promise<{ success: boolean; message: string; lotId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  defaultAuctionId?: string;
}

const lotStatusOptions: { value: LotStatus; label: string }[] = [
  { value: 'EM_BREVE', label: getAuctionStatusText('EM_BREVE') },
  { value: 'ABERTO_PARA_LANCES', label: getAuctionStatusText('ABERTO_PARA_LANCES') },
  { value: 'ENCERRADO', label: getAuctionStatusText('ENCERRADO') },
  { value: 'VENDIDO', label: getAuctionStatusText('VENDIDO') },
  { value: 'NAO_VENDIDO', label: getAuctionStatusText('NAO_VENDIDO') },
];

export default function LotForm({
  initialData,
  categories,
  auctions,
  states,
  allCities,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  defaultAuctionId,
}: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [filteredCities, setFilteredCities] = React.useState<CityInfo[]>([]);
  
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = React.useState<string | null>(initialData?.imageUrl || null);
  const [isMainImageDialogOpen, setIsMainImageDialogOpen] = React.useState(false);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = React.useState(false);

  const [selectedMediaForGallery, setSelectedMediaForGallery] = React.useState<Partial<MediaItem>[]>(() => {
    const itemsMap = new Map<string, Partial<MediaItem>>();
    
    // Process mediaItemIds first
    (initialData?.mediaItemIds || []).forEach(mediaId => {
        const existingMediaItem = sampleMediaItems.find(mi => mi.id === mediaId); // Find full item from sample data
        if (existingMediaItem) {
            itemsMap.set(mediaId, { // Use mediaId as key
                id: existingMediaItem.id,
                urlOriginal: existingMediaItem.urlOriginal,
                title: existingMediaItem.title || existingMediaItem.fileName,
                dataAiHint: existingMediaItem.dataAiHint
            });
        } else {
            // If mediaId not in sampleMediaItems, create a placeholder
            itemsMap.set(mediaId, {
                id: mediaId,
                urlOriginal: `https://placehold.co/100x100.png?text=ID:${mediaId.substring(0,4)}`,
                title: `Item de Mídia ${mediaId.substring(0,4)}`
            });
        }
    });

    // Process galleryImageUrls, adding only those not already covered by mediaItemIds
    (initialData?.galleryImageUrls || []).forEach((url, index) => {
        // Check if this URL is already represented by an item in itemsMap
        const urlExistsInMap = Array.from(itemsMap.values()).some(item => item.urlOriginal === url);
        if (!urlExistsInMap) {
            const uniqueUrlId = `gallery-url-${uuidv4()}`; // Ensure unique ID for URL-only items
            itemsMap.set(uniqueUrlId, {
                id: uniqueUrlId,
                urlOriginal: url,
                title: `Imagem da Galeria (URL) ${index + 1}`
            });
        }
    });
    return Array.from(itemsMap.values());
  });


  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      auctionId: defaultAuctionId || initialData?.auctionId || '',
      auctionName: initialData?.auctionName || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      initialPrice: initialData?.initialPrice || undefined,
      bidIncrementStep: initialData?.bidIncrementStep || undefined,
      status: initialData?.status || 'EM_BREVE',
      stateId: initialData?.stateId || undefined,
      cityId: initialData?.cityId || undefined,
      type: initialData?.type || '',
      imageUrl: initialData?.imageUrl || '',
      galleryImageUrls: initialData?.galleryImageUrls || [],
      mediaItemIds: initialData?.mediaItemIds || [],
      endDate: initialData?.endDate ? new Date(initialData.endDate as Date) : undefined, // Made optional here, derived from auction
      lotSpecificAuctionDate: initialData?.lotSpecificAuctionDate ? new Date(initialData.lotSpecificAuctionDate as Date) : null,
      secondAuctionDate: initialData?.secondAuctionDate ? new Date(initialData.secondAuctionDate as Date) : null,
      secondInitialPrice: initialData?.secondInitialPrice || null,
      views: initialData?.views || 0,
      bidsCount: initialData?.bidsCount || 0,
      latitude: initialData?.latitude ?? undefined,
      longitude: initialData?.longitude ?? undefined,
      mapAddress: initialData?.mapAddress ?? '',
      mapEmbedUrl: initialData?.mapEmbedUrl ?? '',
      mapStaticImageUrl: initialData?.mapStaticImageUrl ?? '',
      judicialProcessNumber: initialData?.judicialProcessNumber || '',
      courtDistrict: initialData?.courtDistrict || '',
      courtName: initialData?.courtName || '',
      publicProcessUrl: initialData?.publicProcessUrl || '',
      propertyRegistrationNumber: initialData?.propertyRegistrationNumber || '',
      propertyLiens: initialData?.propertyLiens || '',
      knownDebts: initialData?.knownDebts || '',
      additionalDocumentsInfo: initialData?.additionalDocumentsInfo || '',
    },
  });

  const selectedStateId = form.watch('stateId');

  React.useEffect(() => {
    if (defaultAuctionId) {
      form.setValue('auctionId', defaultAuctionId);
      const selectedAuction = auctions.find(a => a.id === defaultAuctionId || a.publicId === defaultAuctionId);
      if (selectedAuction) {
        form.setValue('auctionName', selectedAuction.title);
      }
    }
  }, [defaultAuctionId, form, auctions]);

  React.useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(allCities.filter(city => city.stateId === selectedStateId));
      const currentCityId = form.getValues('cityId');
      if (currentCityId && !allCities.find(c => c.id === currentCityId && c.stateId === selectedStateId)) {
        form.setValue('cityId', undefined);
      }
    } else {
      setFilteredCities([]);
      form.setValue('cityId', undefined);
    }
  }, [selectedStateId, allCities, form]);

  React.useEffect(() => {
    if (initialData?.stateId && allCities.length > 0) {
      setFilteredCities(allCities.filter(city => city.stateId === initialData.stateId));
    }
  }, [initialData?.stateId, allCities]);
  
  React.useEffect(() => {
    form.setValue('galleryImageUrls', selectedMediaForGallery.map(item => item.urlOriginal || '').filter(Boolean));
    form.setValue('mediaItemIds', selectedMediaForGallery.map(item => item.id || '').filter(itemid => !itemid.startsWith('gallery-url-')).filter(Boolean));
  }, [selectedMediaForGallery, form]);


  const handleSelectMainImageFromDialog = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem.urlOriginal) {
        setMainImagePreviewUrl(selectedMediaItem.urlOriginal);
        form.setValue('imageUrl', selectedMediaItem.urlOriginal); 
      } else {
          toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive"});
      }
    }
  };

  const handleSelectMediaForGallery = (newlySelectedItems: Partial<MediaItem>[]) => {
    setSelectedMediaForGallery(prev => {
        const currentMediaMap = new Map(prev.map(item => [item.id || item.urlOriginal, item])); // Use URL as fallback key if ID is missing
        newlySelectedItems.forEach(newItem => {
          if (newItem.id || newItem.urlOriginal) { // Ensure there's some identifier
            currentMediaMap.set(newItem.id || newItem.urlOriginal!, newItem);
          }
        });
        return Array.from(currentMediaMap.values());
    });
    toast({
        title: "Mídia Adicionada à Galeria",
        description: `${newlySelectedItems.length} item(ns) adicionado(s) à galeria do lote.`
    });
  };

  const handleRemoveFromGallery = (itemIdToRemove?: string) => {
    if (!itemIdToRemove) return;
    setSelectedMediaForGallery(prev => prev.filter(item => item.id !== itemIdToRemove));
  };

  async function onSubmit(values: LotFormValues) {
    setIsSubmitting(true);
    try {
      // endDate should ideally be null or undefined if it's derived from auction
      // but for the form values, we'll let it pass if it was set (though it's not editable)
      const dataToSubmit: LotFormValues = {
        ...values,
        endDate: values.endDate ? values.endDate : null, // Ensure it's null if not set
        imageUrl: mainImagePreviewUrl || values.imageUrl, 
        galleryImageUrls: selectedMediaForGallery.map(item => item.urlOriginal || '').filter(Boolean),
        mediaItemIds: selectedMediaForGallery.map(item => item.id || '').filter(itemid => !itemid.startsWith('gallery-url-')).filter(Boolean),
      };
      
      const result = await onSubmitAction(dataToSubmit);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        if (defaultAuctionId) {
          const auctionForRedirect = auctions.find(a => a.id === defaultAuctionId || a.publicId === defaultAuctionId);
          router.push(`/admin/auctions/${auctionForRedirect?.publicId || defaultAuctionId}/edit`);
        } else {
          router.push('/admin/lots');
        }
        router.refresh();
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
      console.error("Unexpected error in lot form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <>
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>{formTitle}</CardTitle>
          <CardDescription>{formDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Lote</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Carro Ford Ka 2019" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auctionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leilão Associado</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selectedAuction = auctions.find(a => a.id === value || a.publicId === value);
                        form.setValue('auctionName', selectedAuction?.title || '');
                      }}
                      value={field.value}
                      disabled={!!defaultAuctionId && (initialData?.auctionId === defaultAuctionId || initialData?.auctionId === auctions.find(a=>a.publicId === defaultAuctionId)?.id) }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o leilão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auctions.length === 0 ? (
                          <p className="p-2 text-sm text-muted-foreground">Nenhum leilão cadastrado</p>
                        ) : (
                          auctions.map(auction => (
                            <SelectItem key={auction.id} value={auction.publicId || auction.id}>{auction.title} (ID: ...{(auction.publicId || auction.id).slice(-6)})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>Associe este lote a um leilão existente.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auctionName"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormLabel>Nome do Leilão (Automático)</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
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
                      <Textarea placeholder="Detalhes sobre o lote..." {...field} value={field.value ?? ""} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (Lance Inicial/Atual)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 15000.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lance Inicial Base (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 14500.00" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bidIncrementStep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incremento Mín. Lance (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 100.00" {...field} value={field.value ?? ''}/>
                      </FormControl>
                       <FormDescription className="text-xs">Valor que cada lance deve superar o anterior.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                 <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Lote</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lotStatusOptions.map(option => (
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
                  name="type"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Tipo/Categoria do Lote</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo/categoria" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {categories.length === 0 ? (
                             <p className="p-2 text-sm text-muted-foreground">Nenhuma categoria cadastrada</p>
                           ) : (
                             categories.map(cat => (
                               <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                             ))
                           )}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                  )}
                  />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                      control={form.control}
                      name="stateId"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Estado (Opcional)</FormLabel>
                          <Select
                              onValueChange={(value) => {
                                  const actualValue = value === "---NONE---" ? undefined : value;
                                  field.onChange(actualValue);
                                  form.setValue('cityId', undefined);
                              }}
                              value={field.value || undefined}
                          >
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="---NONE---">Nenhum</SelectItem>
                              {states.filter(s => s.id && String(s.id).trim() !== "").map(state => (
                                  <SelectItem key={state.id} value={state.id}>{state.name} ({state.uf})</SelectItem>
                              ))}
                          </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="cityId"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Cidade (Opcional)</FormLabel>
                          <Select
                              onValueChange={(value) => {
                                  const actualValue = value === "---NONE---" ? undefined : value;
                                  field.onChange(actualValue);
                              }}
                              value={field.value || undefined}
                              disabled={!selectedStateId || filteredCities.length === 0}
                          >
                          <FormControl>
                              <SelectTrigger>
                              <SelectValue placeholder={!selectedStateId ? "Selecione um estado primeiro" : "Selecione a cidade"} />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="---NONE---">Nenhuma</SelectItem>
                              {filteredCities.filter(c => c.id && String(c.id).trim() !== "").map(city => (
                              <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                              ))}
                          </SelectContent>
                          </Select>
                          {!selectedStateId && <FormDescription className="text-xs">Selecione um estado para ver as cidades.</FormDescription>}
                          {selectedStateId && filteredCities.length === 0 && <FormDescription className="text-xs">Nenhuma cidade cadastrada para este estado.</FormDescription>}
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </div>

              <FormItem>
                <FormLabel>Imagem Principal do Lote</FormLabel>
                <Card className="mt-2">
                  <CardContent className="p-4 flex flex-col items-center gap-3">
                    <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden max-w-md mx-auto">
                      {mainImagePreviewUrl ? (
                        <Image
                          src={mainImagePreviewUrl}
                          alt="Prévia da Imagem Principal"
                          fill
                          className="object-contain"
                          data-ai-hint="previa imagem principal"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <ImagePlus className="h-12 w-12 mb-2" />
                          <span>Nenhuma imagem selecionada</span>
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" onClick={() => setIsMainImageDialogOpen(true)}>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {mainImagePreviewUrl ? "Alterar Imagem Principal" : "Escolher Imagem Principal"}
                    </Button>
                  </CardContent>
                </Card>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormDescription>Selecione a imagem de capa para este lote.</FormDescription>
              </FormItem>

              <div className="space-y-2">
                <FormLabel>Galeria de Imagens do Lote</FormLabel>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 border rounded-md min-h-[80px]">
                  {selectedMediaForGallery.map((item, index) => (
                    <div key={item.id || `gallery-item-${index}-${uuidv4()}`} className="relative aspect-square bg-muted rounded overflow-hidden">
                      <Image src={item.urlOriginal || 'https://placehold.co/100x100.png'} alt={item.title || `Imagem ${index + 1}`} fill className="object-cover" data-ai-hint={item.dataAiHint || "miniatura galeria lote"} />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100 p-0"
                        onClick={() => handleRemoveFromGallery(item.id)}
                        title="Remover da galeria do lote"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {selectedMediaForGallery.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="aspect-square flex flex-col items-center justify-center text-muted-foreground hover:text-primary h-full"
                      onClick={() => setIsGalleryDialogOpen(true)}
                    >
                      <ImagePlus className="h-6 w-6 mb-1" />
                      <span className="text-xs">Adicionar</span>
                    </Button>
                  )}
                </div>
                <FormDescription>Adicione mais imagens para este lote clicando em "Adicionar". Máximo de 10 imagens.</FormDescription>
                <FormField control={form.control} name="galleryImageUrls" render={({ field }) => (
                    <FormItem className="hidden"><FormControl><Input type="text" {...field} value={Array.isArray(field.value) ? field.value.join(',') : ''} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="mediaItemIds" render={({ field }) => (
                    <FormItem className="hidden"><FormControl><Input type="text" {...field} value={Array.isArray(field.value) ? field.value.join(',') : ''} /></FormControl></FormItem>
                )} />
              </div>

              <Separator />
              <h3 className="text-md font-semibold text-muted-foreground pt-2 flex items-center gap-2"><MapPin className="h-5 w-5" /> Localização e Mapa (Opcional)</h3>
               <div className="grid md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl><Input type="number" step="any" placeholder="Ex: -23.550520" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl><Input type="number" step="any" placeholder="Ex: -46.633308" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
               <FormField
                    control={form.control}
                    name="mapAddress"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Endereço para Mapa</FormLabel>
                        <FormControl><Input placeholder="Ex: Av. Paulista, 1578, São Paulo, SP" {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>Se diferente do endereço principal do lote, ou para maior precisão no mapa.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mapEmbedUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>URL de Incorporação do Mapa (Embed)</FormLabel>
                        <FormControl><Input type="url" placeholder="Ex: https://www.google.com/maps/embed?pb=..." {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>URL para embutir um mapa interativo (iframe).</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="mapStaticImageUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>URL de Imagem Estática do Mapa</FormLabel>
                        <FormControl><Input type="url" placeholder="Ex: https://maps.googleapis.com/maps/api/staticmap?..." {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>URL para uma imagem estática do mapa (ex: Google Static Maps API ou similar).</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              <Separator />
              <h3 className="text-md font-semibold text-muted-foreground pt-2 flex items-center gap-2"><Shield className="h-5 w-5" /> Informações de Segurança e Due Diligence (Opcional)</h3>
              <FormField control={form.control} name="judicialProcessNumber" render={({ field }) => (
                <FormItem><FormLabel>Nº Processo Judicial</FormLabel><FormControl><Input placeholder="0000000-00.0000.0.00.0000" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="courtDistrict" render={({ field }) => (
                    <FormItem><FormLabel>Comarca</FormLabel><FormControl><Input placeholder="Ex: Comarca de São Paulo" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="courtName" render={({ field }) => (
                    <FormItem><FormLabel>Vara Judicial</FormLabel><FormControl><Input placeholder="Ex: 1ª Vara Cível" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="publicProcessUrl" render={({ field }) => (
                <FormItem><FormLabel>Link Consulta Pública do Processo</FormLabel><FormControl><Input type="url" placeholder="https://esaj.tjsp.jus.br/..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="propertyRegistrationNumber" render={({ field }) => (
                <FormItem><FormLabel>Nº Matrícula do Imóvel</FormLabel><FormControl><Input placeholder="Ex: 123.456 do 1º CRI" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="propertyLiens" render={({ field }) => (
                <FormItem><FormLabel>Ônus/Gravames Conhecidos</FormLabel><FormControl><Textarea placeholder="Descrever brevemente ou link para certidão de ônus." {...field} value={field.value ?? ""} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="knownDebts" render={({ field }) => (
                <FormItem><FormLabel>Dívidas Conhecidas (IPTU, Condomínio, etc.)</FormLabel><FormControl><Textarea placeholder="Listar dívidas conhecidas sobre o bem." {...field} value={field.value ?? ""} rows={2} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="additionalDocumentsInfo" render={({ field }) => (
                <FormItem><FormLabel>Outras Informações/Links de Documentos</FormLabel><FormControl><Textarea placeholder="Espaço para links adicionais de documentos ou observações importantes." {...field} value={field.value ?? ""} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />

              <Separator />
              <h3 className="text-md font-semibold text-muted-foreground pt-2 flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Datas e Prazos (Derivado do Leilão)</h3>
              <FormDescription className="text-sm">
                  As datas de encerramento e praças são gerenciadas na configuração do Leilão ao qual este lote está associado.
              </FormDescription>
              {/* Campos de data foram removidos do formulário do lote */}
              
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <FormField
                      control={form.control}
                      name="views"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Visualizações (Opcional)</FormLabel>
                          <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value,10))} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="bidsCount"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Contagem de Lances (Opcional)</FormLabel>
                          <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value,10))} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {submitButtonText}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <ChooseMediaDialog 
        isOpen={isMainImageDialogOpen}
        onOpenChange={setIsMainImageDialogOpen}
        onMediaSelect={handleSelectMainImageFromDialog}
      />
      <ChooseMediaDialog 
        isOpen={isGalleryDialogOpen}
        onOpenChange={setIsGalleryDialogOpen}
        onMediaSelect={handleSelectMediaForGallery}
        allowMultiple={true} 
      />
    </>
  );
}
    
