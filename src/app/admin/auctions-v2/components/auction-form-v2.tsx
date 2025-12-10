// src/app/admin/auctions-v2/components/auction-form-v2.tsx
'use client';

import { useMemo, useTransition, useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Search, Trash2 } from 'lucide-react';
import EntitySelector from '@/components/ui/entity-selector';
import { consultaCepAction } from '@/lib/actions/cep';
import { useToast } from '@/hooks/use-toast';
import type {
  Auction,
  AuctionFormData,
  AuctioneerProfileInfo,
  SellerProfileInfo,
  StateInfo,
  CityInfo,
  JudicialProcess,
  AuctionStatus,
  AuctionStage,
} from '@/types';

// Dynamic import for map to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const auctionStatusValues = [
  'RASCUNHO',
  'EM_PREPARACAO',
  'EM_BREVE',
  'ABERTO',
  'ABERTO_PARA_LANCES',
  'ENCERRADO',
  'VENDIDO',
  'CANCELADO',
] as const;
const auctionTypeValues = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'] as const;
const auctionMethodValues = ['STANDARD', 'DUTCH', 'SILENT'] as const;
const participationValues = ['ONLINE', 'PRESENCIAL', 'HIBRIDO'] as const;

const auctionStatusOptions = auctionStatusValues.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
const auctionTypeOptions = auctionTypeValues.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
const auctionMethodOptions = auctionMethodValues.map((value) => ({ value, label: value }));
const participationOptions = participationValues.map((value) => ({ value, label: value }));

const toDateTimeLocal = (value?: string | Date | null) => {
  if (!value) {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }
  const parsed = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  const offset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
};

const stageSchema = z
  .object({
    name: z.string().min(2, 'Nome da praça obrigatório'),
    startDate: z.string().min(1, 'Defina o início'),
    endDate: z.string().optional(),
    discountPercent: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true;
        const num = Number(value);
        return !Number.isNaN(num) && num > 0 && num <= 100;
      }, { message: 'Informe um percentual válido (1-100)' }),
  })
  .transform((entry) => ({
    ...entry,
    discountPercent: entry.discountPercent?.trim() ?? '100',
  }));

const auctionFormV2Schema = z
  .object({
    title: z.string().min(3, 'Título obrigatório'),
    description: z.string().max(1000).optional(),
    status: z.enum(auctionStatusValues),
    auctionType: z.enum(auctionTypeValues),
    auctionMethod: z.enum(auctionMethodValues),
    participation: z.enum(participationValues),
    auctioneerId: z.string().optional(),
    sellerId: z.string().optional(),
    judicialProcessId: z.string().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    stateId: z.string().optional(),
    cityId: z.string().optional(),
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    onlineUrl: z.string().url('Informe uma URL válida').optional().or(z.literal('')),
    imageMediaId: z.string().optional(),
    allowInstallmentBids: z.boolean().default(true),
    isFeaturedOnMarketplace: z.boolean().default(false),
    softCloseEnabled: z.boolean().default(false),
    softCloseMinutes: z
      .string()
      .optional()
      .refine((value) => !value || Number(value) > 0, 'Informe minutos válidos'),
    auctionStages: z.array(stageSchema).min(1, 'Adicione ao menos uma praça'),
  })
  .superRefine((values, ctx) => {
    if (values.softCloseEnabled && !values.softCloseMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o intervalo',
        path: ['softCloseMinutes'],
      });
    }
    // Validação condicional: campos de endereço obrigatórios para PRESENCIAL ou HIBRIDO
    const requiresAddress = values.participation === 'PRESENCIAL' || values.participation === 'HIBRIDO';
    if (requiresAddress) {
      if (!values.stateId?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Estado é obrigatório para leilões presenciais', path: ['stateId'] });
      }
      if (!values.cityId?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cidade é obrigatória para leilões presenciais', path: ['cityId'] });
      }
      if (!values.zipCode?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CEP é obrigatório para leilões presenciais', path: ['zipCode'] });
      }
      if (!values.street?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Logradouro é obrigatório para leilões presenciais', path: ['street'] });
      }
      if (!values.number?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Número é obrigatório para leilões presenciais', path: ['number'] });
      }
      if (!values.neighborhood?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bairro é obrigatório para leilões presenciais', path: ['neighborhood'] });
      }
    }
  });

type AuctionFormV2Values = z.infer<typeof auctionFormV2Schema>;
type StageFormValue = AuctionFormV2Values['auctionStages'][number];

// Percentuais padrão por praça: Praça 1 = 100%, Praça 2 = 60%, Praça 3+ = 50%
const getDefaultDiscountPercent = (index: number): string => {
  if (index === 0) return '100';
  if (index === 1) return '60';
  return '50';
};

const buildStage = (index: number, stage?: StageFormValue) => ({
  name: stage?.name ?? `Praça ${index + 1}`,
  startDate: toDateTimeLocal(stage?.startDate),
  endDate: stage?.endDate ? toDateTimeLocal(stage.endDate) : '',
  discountPercent: stage?.discountPercent ?? getDefaultDiscountPercent(index),
});

const cleanText = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

// Componente interno de mapa para evitar SSR issues
interface LocationMapPreviewProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  setValue: (name: 'latitude' | 'longitude', value: number) => void;
}

function LocationMapPreview({ latitude, longitude, setValue }: LocationMapPreviewProps) {
  const [isClient, setIsClient] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    // Fix Leaflet's default icon path issue
    import('leaflet').then((L) => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setLeafletLoaded(true);
    });
  }, []);

  if (!isClient || !leafletLoaded) {
    return <div className="h-72 w-full bg-muted animate-pulse rounded-md flex items-center justify-center text-muted-foreground">Carregando mapa...</div>;
  }

  const center: [number, number] = [
    latitude || -14.235, // Default to center of Brazil
    longitude || -51.9253
  ];
  const zoom = latitude && longitude ? 15 : 4;

  return (
    <MapContainer 
      key={`${center.join('-')}-${zoom}`} 
      center={center} 
      zoom={zoom} 
      scrollWheelZoom={true} 
      className="h-72 w-full rounded-md z-0 border border-border"
      // @ts-ignore - onClick exists but not typed
      onClick={(e: any) => {
        if (e.latlng) {
          setValue('latitude', e.latlng.lat);
          setValue('longitude', e.latlng.lng);
        }
      }}
    >
      <TileLayer
        // @ts-ignore
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {latitude && longitude && (
        // @ts-ignore
        <Marker position={[latitude, longitude]} />
      )}
    </MapContainer>
  );
}

interface AuctionFormV2Props {
  initialData?: Auction | null;
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
  judicialProcesses?: JudicialProcess[];
  isEditing?: boolean;
  onSubmit: (data: Partial<AuctionFormData>) => Promise<{ success: boolean; message: string; auctionId?: string }>;
}

export default function AuctionFormV2({
  initialData,
  auctioneers,
  sellers,
  states,
  allCities,
  judicialProcesses = [],
  isEditing = false,
  onSubmit,
}: AuctionFormV2Props) {
  const initialStages = useMemo(() => {
    const stages = initialData?.auctionStages?.map((stage: AuctionStage, index: number) => ({
      name: stage?.name ?? `Praça ${index + 1}`,
      startDate: toDateTimeLocal(stage?.startDate),
      endDate: stage?.endDate ? toDateTimeLocal(stage.endDate) : '',
      discountPercent:
        stage?.discountPercent !== null && stage?.discountPercent !== undefined
          ? String(stage.discountPercent)
          : getDefaultDiscountPercent(index),
    }));
    return stages && stages.length ? stages : [buildStage(0)];
  }, [initialData]);

  const defaultValues = useMemo<AuctionFormV2Values>(() => ({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    status: (initialData?.status as AuctionFormV2Values['status']) ?? 'RASCUNHO',
    auctionType: (initialData?.auctionType as AuctionFormV2Values['auctionType']) ?? 'JUDICIAL',
    auctionMethod: (initialData?.auctionMethod as AuctionFormV2Values['auctionMethod']) ?? 'STANDARD',
    participation: (initialData?.participation as AuctionFormV2Values['participation']) ?? 'ONLINE',
    auctioneerId: initialData?.auctioneerId ?? '',
    sellerId: initialData?.sellerId ?? '',
    judicialProcessId: initialData?.judicialProcessId ?? '',
    latitude: (initialData as Record<string, unknown>)?.latitude as number ?? null,
    longitude: (initialData as Record<string, unknown>)?.longitude as number ?? null,
    stateId: initialData?.stateId ?? '',
    cityId: initialData?.cityId ?? '',
    zipCode: initialData?.zipCode ?? '',
    street: (initialData as Record<string, unknown>)?.street as string ?? '',
    number: (initialData as Record<string, unknown>)?.number as string ?? '',
    complement: (initialData as Record<string, unknown>)?.complement as string ?? '',
    neighborhood: (initialData as Record<string, unknown>)?.neighborhood as string ?? '',
    onlineUrl: initialData?.onlineUrl ?? '',
    imageMediaId: initialData?.imageMediaId ? String(initialData.imageMediaId) : '',
    allowInstallmentBids: (initialData as Record<string, unknown>)?.allowInstallmentBids as boolean ?? true,
    isFeaturedOnMarketplace: initialData?.isFeaturedOnMarketplace ?? false,
    softCloseEnabled: (initialData as Record<string, unknown>)?.softCloseEnabled as boolean ?? false,
    softCloseMinutes: (initialData as Record<string, unknown>)?.softCloseMinutes ? String((initialData as Record<string, unknown>).softCloseMinutes) : '',
    auctionStages: initialStages,
  }), [initialData, initialStages]);

  const form = useForm<AuctionFormV2Values>({
    mode: 'onSubmit',
    resolver: zodResolver(auctionFormV2Schema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'auctionStages' });
  const selectedStateId = useWatch({ control: form.control, name: 'stateId' });
  const watchedLatitude = useWatch({ control: form.control, name: 'latitude' });
  const watchedLongitude = useWatch({ control: form.control, name: 'longitude' });
  const citiesForState = useMemo(
    () => (selectedStateId ? allCities.filter((city) => city.stateId === selectedStateId) : []),
    [selectedStateId, allCities]
  );
  const [isCepPending, startCepTransition] = useTransition();
  const { toast } = useToast();

  const handleCepLookup = () => {
    const currentZipCode = form.getValues('zipCode');
    if (!currentZipCode || currentZipCode.replace(/\D/g, '').length !== 8) {
      toast({ 
        title: 'CEP inválido', 
        description: 'Por favor, insira um CEP com 8 dígitos.', 
        variant: 'destructive'
      });
      return;
    }

    startCepTransition(async () => {
      const result = await consultaCepAction(currentZipCode);
      if (result.success && result.data) {
        const { uf, localidade, logradouro, bairro } = result.data;
        
        // Set street and neighborhood from CEP lookup
        if (logradouro) {
          form.setValue('street', logradouro, { shouldDirty: true });
        }
        if (bairro) {
          form.setValue('neighborhood', bairro, { shouldDirty: true });
        }
        
        // Find and set state
        const foundState = states.find(s => s.uf === uf);
        if (foundState) {
          form.setValue('stateId', foundState.id, { shouldDirty: true });
          
          // Find city filtering by stateId (more reliable than stateUf)
          const normalizedLocalidade = localidade
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
          
          const foundCity = allCities.find(c => {
            if (c.stateId !== foundState.id) return false;
            const normalizedCityName = c.name
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim();
            return normalizedCityName === normalizedLocalidade;
          });
          
          if (foundCity) {
            form.setValue('cityId', foundCity.id, { shouldDirty: true });
          }
        }

        // Geocode the address to get coordinates for the map
        try {
          const query = encodeURIComponent(`${logradouro}, ${localidade}, ${uf}, Brazil`);
          const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
          const geoData = await geoResponse.json();
          if (geoData && geoData.length > 0) {
            const { lat, lon } = geoData[0];
            form.setValue('latitude', parseFloat(lat), { shouldDirty: true });
            form.setValue('longitude', parseFloat(lon), { shouldDirty: true });
          }
        } catch (geoError) {
          console.error("Geocoding error:", geoError);
        }

        toast({ 
          title: 'Endereço encontrado!', 
          description: `${logradouro}, ${bairro} - ${localidade}/${uf}` 
        });
      } else {
        toast({ 
          title: 'CEP não encontrado', 
          description: result.message, 
          variant: 'destructive'
        });
      }
    });
  };

  const handleAddStage = () => append(buildStage(fields.length));

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const imageMediaIdValue = cleanText(values.imageMediaId);
    const payload: Partial<AuctionFormData> = {
      title: values.title.trim(),
      description: cleanText(values.description),
      status: values.status as AuctionStatus,
      auctionType: values.auctionType,
      auctionMethod: values.auctionMethod,
      participation: values.participation,
      auctioneerId: cleanText(values.auctioneerId),
      sellerId: cleanText(values.sellerId),
      judicialProcessId: cleanText(values.judicialProcessId),
      latitude: values.latitude,
      longitude: values.longitude,
      stateId: cleanText(values.stateId),
      cityId: cleanText(values.cityId),
      zipCode: cleanText(values.zipCode),
      street: cleanText(values.street),
      number: cleanText(values.number),
      complement: cleanText(values.complement),
      neighborhood: cleanText(values.neighborhood),
      onlineUrl: cleanText(values.onlineUrl),
      imageMediaId: imageMediaIdValue ? BigInt(imageMediaIdValue) : null,
      isFeaturedOnMarketplace: values.isFeaturedOnMarketplace,
      auctionStages: values.auctionStages.map((stage) => ({
        name: stage.name.trim(),
        startDate: new Date(stage.startDate),
        endDate: stage.endDate ? new Date(stage.endDate) : new Date(stage.startDate),
        discountPercent: stage.discountPercent ? Number(stage.discountPercent) : 100,
      })) as AuctionFormData['auctionStages'],
    };

    await onSubmit(payload);
  });

  const { isSubmitting } = form.formState;
  const submitLabel = isEditing ? 'Atualizar leilão' : 'Criar leilão';

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Leilão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Leilão Industrial" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} placeholder="Contexto rápido do evento" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {auctionStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auctionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {auctionTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auctionMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {auctionMethodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="participation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participação</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {participationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="auctioneerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leiloeiro</FormLabel>
                  <FormControl>
                    <EntitySelector
                      value={field.value}
                      onChange={field.onChange}
                      options={auctioneers.map((item) => ({ value: item.id, label: item.name }))}
                      placeholder="Selecione um leiloeiro"
                      searchPlaceholder="Buscar leiloeiro..."
                      emptyStateMessage="Nenhum leiloeiro encontrado"
                      isFetching={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comitente</FormLabel>
                  <FormControl>
                    <EntitySelector
                      value={field.value}
                      onChange={field.onChange}
                      options={sellers.map((item) => ({ value: item.id, label: item.name }))}
                      placeholder="Selecione um comitente"
                      searchPlaceholder="Buscar comitente..."
                      emptyStateMessage="Nenhum comitente encontrado"
                      isFetching={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="judicialProcessId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo Judicial</FormLabel>
                  <FormControl>
                    <EntitySelector
                      value={field.value}
                      onChange={field.onChange}
                      options={judicialProcesses.map((item) => ({
                        value: item.id,
                        label: item.processNumber,
                      }))}
                      placeholder="Associe um processo"
                      searchPlaceholder="Buscar processo..."
                      emptyStateMessage="Nenhum processo encontrado"
                      isFetching={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Address Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="stateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.id} value={state.id}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {citiesForState.map((city) => (
                                <SelectItem key={city.id} value={city.id}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00000-000" 
                            {...field} 
                            disabled={isCepPending}
                            maxLength={9} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    onClick={handleCepLookup} 
                    disabled={isCepPending}
                    className="self-end"
                    variant="outline"
                  >
                    {isCepPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Buscar CEP
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Avenida, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="Nº" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Sala, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="onlineUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do leilão</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageMediaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column - Map Preview */}
              <div className="space-y-4">
                <FormLabel>Mapa de Localização</FormLabel>
                <LocationMapPreview
                  latitude={watchedLatitude}
                  longitude={watchedLongitude}
                  setValue={form.setValue}
                />
                <p className="text-xs text-muted-foreground">
                  Clique no mapa para definir a localização exata do leilão. 
                  O mapa será atualizado automaticamente após a busca do CEP.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Praças e Prazos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{`Praça ${index + 1}`}</p>
                  {fields.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label="Remover praça"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`auctionStages.${index}.name` as const}
                    render={({ field: stageField }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...stageField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`auctionStages.${index}.startDate` as const}
                    render={({ field: stageField }) => (
                      <FormItem>
                        <FormLabel>Início</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...stageField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`auctionStages.${index}.endDate` as const}
                    render={({ field: stageField }) => (
                      <FormItem>
                        <FormLabel>Fim</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...stageField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`auctionStages.${index}.discountPercent` as const}
                  render={({ field: stageField }) => (
                    <FormItem>
                      <FormLabel>Percentual da Praça (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="1" max="100" placeholder="Ex: 100, 60, 50" {...stageField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddStage} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar praça
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="allowInstallmentBids"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-semibold">Permitir parcelamento</p>
                      <p className="text-xs text-muted-foreground">Controle se os lances podem ser parcelados.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFeaturedOnMarketplace"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-semibold">Destaque no marketplace</p>
                      <p className="text-xs text-muted-foreground">Leilão em destaque no feed.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Separator />
            <FormField
              control={form.control}
              name="softCloseEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-semibold">Soft close</p>
                    <p className="text-xs text-muted-foreground">Bloqueia lances nos instantes finais.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch('softCloseEnabled') && (
              <FormField
                control={form.control}
                name="softCloseMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intervalo (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" className="max-w-[160px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
