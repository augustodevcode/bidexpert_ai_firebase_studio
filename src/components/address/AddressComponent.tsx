/**
 * @fileoverview Componente reutilizável de endereço para o BidExpert.
 * 
 * Este é o componente central de endereço do sistema. Ele renderiza todos os
 * campos de endereço necessários (CEP, logradouro, número, complemento, bairro,
 * estado, cidade, latitude, longitude, mapa interativo e link do Google Maps).
 * 
 * Suporta dois modos:
 * - `relational` (padrão): usa EntitySelector com FK para City/State
 * - `text`: usa inputs de texto para city/state (User, BidderProfile)
 * 
 * Features:
 * - Auto-fetch de states/cities (não requer props do pai)
 * - Busca de CEP via ViaCEP (server action)
 * - Mapa interativo Leaflet com click-to-place
 * - Geocoding via Nominatim
 * - Auto-geração de addressLink (Google Maps URL)
 * - Link clicável do Google Maps
 * - Configuração de campos visíveis via prop
 * - data-ai-id em todos os elementos para testabilidade
 * 
 * @example
 * ```tsx
 * import { AddressComponent } from '@/components/address';
 * import { relationalAddressFields, addressDefaults } from '@/lib/schemas/address.schema';
 * 
 * const formSchema = z.object({
 *   name: z.string().min(1),
 * }).merge(relationalAddressFields);
 * 
 * function MyForm() {
 *   const form = useForm({
 *     resolver: zodResolver(formSchema),
 *     defaultValues: { name: '', ...addressDefaults.relational },
 *   });
 *   
 *   return (
 *     <Form {...form}>
 *       <AddressComponent form={form} />
 *     </Form>
 *   );
 * }
 * ```
 * 
 * @example Com campos visíveis personalizados (ex: Lot form, sem street/number)
 * ```tsx
 * <AddressComponent
 *   form={form}
 *   visibleFields={['zipCode', 'stateId', 'cityId', 'latitude', 'longitude', 'map']}
 * />
 * ```
 * 
 * @example Modo texto (User/BidderProfile)
 * ```tsx
 * <AddressComponent form={form} mode="text" />
 * ```
 */
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { UseFormReturn, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CityInfo, StateInfo } from '@/types';
import EntitySelector from '@/components/ui/entity-selector';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { buildAddressLink } from '@/lib/helpers/address.helper';

const AddressMapPicker = dynamic(() => import('./AddressMapPicker'), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-md" />,
});

// ─────────────────────────────────────────────────────────────────────────────
// Tipos / Constantes
// ─────────────────────────────────────────────────────────────────────────────

/** Campos que podem ser ocultados via prop `visibleFields` */
export type AddressFieldKey =
  | 'zipCode'
  | 'street'
  | 'number'
  | 'complement'
  | 'neighborhood'
  | 'stateId'
  | 'cityId'
  | 'city'
  | 'state'
  | 'latitude'
  | 'longitude'
  | 'map'
  | 'addressLink';

/** Todos os campos visíveis por padrão no modo relacional */
const DEFAULT_RELATIONAL_FIELDS: AddressFieldKey[] = [
  'map',       // MapPicker inclui zipCode internamente
  'street',
  'number',
  'complement',
  'neighborhood',
  'stateId',
  'cityId',
  'latitude',
  'longitude',
  'addressLink',
];

/** Todos os campos visíveis por padrão no modo texto */
const DEFAULT_TEXT_FIELDS: AddressFieldKey[] = [
  'map',
  'street',
  'number',
  'complement',
  'neighborhood',
  'state',
  'city',
  'latitude',
  'longitude',
  'addressLink',
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressComponentProps {
  /** Instância do react-hook-form useForm() */
  form: UseFormReturn<any>;

  /**
   * Modo de funcionamento:
   * - 'relational': usa EntitySelector para cityId/stateId (FK)
   * - 'text': usa Input para city/state (texto)
   * @default 'relational'
   */
  mode?: 'relational' | 'text';

  /**
   * Campos de endereço a serem exibidos.
   * Útil para formulários que só precisam de um subconjunto (ex: Lot só precisa de city/state + lat/lng).
   * Se não informado, exibe todos os campos do modo selecionado.
   */
  visibleFields?: AddressFieldKey[];

  /**
   * Estados pré-carregados (SSR optimization).
   * Se omitido, o componente busca automaticamente via server action.
   */
  initialStates?: StateInfo[];

  /**
   * Cidades pré-carregadas (SSR optimization).
   * Se omitido, o componente busca automaticamente via server action.
   */
  initialCities?: CityInfo[];

  /** Título da seção de endereço. @default 'Endereço' */
  sectionTitle?: string;

  /** Se true, mostra título/header da seção. @default false */
  showSectionTitle?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export default function AddressComponent({
  form,
  mode = 'relational',
  visibleFields,
  initialStates,
  initialCities,
  sectionTitle = 'Endereço',
  showSectionTitle = false,
}: AddressComponentProps) {
  const [states, setStates] = React.useState<StateInfo[]>(initialStates ?? []);
  const [cities, setCities] = React.useState<CityInfo[]>(initialCities ?? []);
  const [isFetchingStates, setIsFetchingStates] = React.useState(false);
  const [isFetchingCities, setIsFetchingCities] = React.useState(false);
  const [hasLoadedStates, setHasLoadedStates] = React.useState(!!initialStates);
  const [hasLoadedCities, setHasLoadedCities] = React.useState(!!initialCities);

  // Determinar campos visíveis
  const effectiveFields = React.useMemo(() => {
    if (visibleFields) return visibleFields;
    return mode === 'relational' ? DEFAULT_RELATIONAL_FIELDS : DEFAULT_TEXT_FIELDS;
  }, [visibleFields, mode]);

  const isVisible = React.useCallback(
    (field: AddressFieldKey) => effectiveFields.includes(field),
    [effectiveFields]
  );

  // ── Auto-fetch de states/cities ──────────────────────────────────────────
  React.useEffect(() => {
    if (!hasLoadedStates && mode === 'relational') {
      setIsFetchingStates(true);
      getStates()
        .then((data) => {
          setStates(data);
          setHasLoadedStates(true);
        })
        .catch(console.error)
        .finally(() => setIsFetchingStates(false));
    }
  }, [hasLoadedStates, mode]);

  React.useEffect(() => {
    if (!hasLoadedCities && mode === 'relational') {
      setIsFetchingCities(true);
      getCities()
        .then((data) => {
          setCities(data);
          setHasLoadedCities(true);
        })
        .catch(console.error)
        .finally(() => setIsFetchingCities(false));
    }
  }, [hasLoadedCities, mode]);

  // ── State/City filtering + reset ─────────────────────────────────────────
  const selectedStateId = useWatch({
    control: form.control,
    name: 'stateId',
  });

  const filteredCities = React.useMemo(() => {
    if (!selectedStateId || mode === 'text') return [];
    return cities.filter((city) => String(city.stateId) === String(selectedStateId));
  }, [selectedStateId, cities, mode]);

  // Reset city when state changes
  React.useEffect(() => {
    if (mode !== 'relational') return;
    const currentCityId = form.getValues('cityId');
    if (
      currentCityId &&
      !filteredCities.some((city) => String(city.id) === String(currentCityId))
    ) {
      form.setValue('cityId', null, { shouldValidate: true });
    }
  }, [filteredCities, form, mode]);

  // ── Auto-update addressLink quando lat/lng mudam ─────────────────────────
  const watchedLatitude = form.watch('latitude');
  const watchedLongitude = form.watch('longitude');

  React.useEffect(() => {
    if (watchedLatitude && watchedLongitude) {
      const link = buildAddressLink(watchedLatitude, watchedLongitude);
      const currentLink = form.getValues('addressLink');
      if (link !== currentLink) {
        form.setValue('addressLink', link, { shouldDirty: true });
      }
    }
  }, [watchedLatitude, watchedLongitude, form]);

  // ── Refetch handlers ─────────────────────────────────────────────────────
  const handleRefetchStates = React.useCallback(async () => {
    setIsFetchingStates(true);
    const data = await getStates();
    setStates(data);
    setIsFetchingStates(false);
  }, []);

  const handleRefetchCities = React.useCallback(async () => {
    setIsFetchingCities(true);
    const data = await getCities();
    setCities(data);
    setIsFetchingCities(false);
  }, []);

  const zipCode = form.watch('zipCode');

  return (
    <div className="space-y-4" data-ai-id="address-component-container">
      {showSectionTitle && (
        <h3 className="text-lg font-semibold" data-ai-id="address-component-title">
          {sectionTitle}
        </h3>
      )}

      {/* ── MapPicker (inclui CEP) ─────────────────────────────────────── */}
      {isVisible('map') && (
        <AddressMapPicker
          latitude={watchedLatitude}
          longitude={watchedLongitude}
          zipCode={zipCode}
          control={form.control}
          setValue={form.setValue}
          allCities={cities}
          allStates={states}
          mode={mode}
        />
      )}

      {/* ── Logradouro ─────────────────────────────────────────────────── */}
      {isVisible('street') && (
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem data-ai-id="address-component-street">
              <FormLabel>Logradouro (Rua/Avenida)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Avenida Paulista" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* ── Número, Complemento, Bairro ────────────────────────────────── */}
      {(isVisible('number') || isVisible('complement') || isVisible('neighborhood')) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-ai-id="address-component-details-row">
          {isVisible('number') && (
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-number">
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1578" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {isVisible('complement') && (
            <FormField
              control={form.control}
              name="complement"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-complement">
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Andar 4, Sala 10" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {isVisible('neighborhood') && (
            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-neighborhood">
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bela Vista" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* ── Estado/Cidade (modo relacional - EntitySelector) ───────────── */}
      {mode === 'relational' && (isVisible('stateId') || isVisible('cityId')) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-ai-id="address-component-state-city-row">
          {isVisible('stateId') && (
            <FormField
              control={form.control}
              name="stateId"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-state-selector">
                  <FormLabel>Estado</FormLabel>
                  <EntitySelector
                    entityName="state"
                    value={field.value}
                    onChange={field.onChange}
                    options={states.map((s) => ({ value: String(s.id), label: s.name }))}
                    placeholder="Selecione o estado"
                    searchPlaceholder="Buscar estado..."
                    emptyStateMessage="Nenhum estado."
                    onRefetch={handleRefetchStates}
                    isFetching={isFetchingStates}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {isVisible('cityId') && (
            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-city-selector">
                  <FormLabel>Cidade</FormLabel>
                  <EntitySelector
                    entityName="city"
                    value={field.value}
                    onChange={field.onChange}
                    options={filteredCities.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    placeholder={
                      !selectedStateId
                        ? 'Selecione um estado primeiro'
                        : 'Selecione a cidade'
                    }
                    searchPlaceholder="Buscar cidade..."
                    emptyStateMessage="Nenhuma cidade encontrada para este estado."
                    onRefetch={handleRefetchCities}
                    isFetching={isFetchingCities}
                    disabled={!selectedStateId}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* ── Estado/Cidade (modo texto) ────────────────────────────────── */}
      {mode === 'text' && (isVisible('state') || isVisible('city')) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-ai-id="address-component-state-city-text-row">
          {isVisible('state') && (
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-state-text">
                  <FormLabel>Estado (UF)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SP"
                      maxLength={2}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {isVisible('city') && (
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-city-text">
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: São Paulo" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* ── Latitude / Longitude ───────────────────────────────────────── */}
      {(isVisible('latitude') || isVisible('longitude')) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-ai-id="address-component-coords-row">
          {isVisible('latitude') && (
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-latitude">
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="-23.550520"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          {isVisible('longitude') && (
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem data-ai-id="address-component-longitude">
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="-46.633308"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* ── Address Link (read-only, auto-gerado) ──────────────────────── */}
      {isVisible('addressLink') && (
        <FormField
          control={form.control}
          name="addressLink"
          render={({ field }) => (
            <FormItem data-ai-id="address-component-address-link">
              <FormLabel>Link do Endereço (Google Maps)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Auto-gerado a partir das coordenadas"
                  {...field}
                  value={field.value ?? ''}
                  readOnly
                  className="bg-muted/50 text-muted-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
