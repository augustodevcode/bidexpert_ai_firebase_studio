// src/components/BidExpertFilter.tsx
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Filter, CalendarIcon, RefreshCw, ShoppingCart, MapPin } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LotCategory, DirectSaleOfferType, VehicleMake, VehicleModel } from '@/types';
import BidExpertFilterSkeleton from './BidExpertFilterSkeleton';

export interface ActiveFilters {
  modality: string; // For auctions
  category: string;
  priceRange: [number, number];
  locations: string[];
  sellers: string[];
  makes: string[];
  models: string[];
  startDate?: Date;
  endDate?: Date;
  status: string[];
  offerType?: DirectSaleOfferType | 'ALL'; // Specific to Direct Sales
  praça?: 'todas' | 'unica' | 'multiplas';
}

interface BidExpertFilterProps {
  categories?: LotCategory[];
  locations?: string[];
  sellers?: string[];
  makes?: VehicleMake[];
  models?: VehicleModel[];
  modalities?: { value: string, label: string }[];
  statuses?: { value: string, label: string }[];
  offerTypes?: { value: DirectSaleOfferType | 'ALL', label: string }[];
  onFilterSubmit: (filters: ActiveFilters) => void;
  onFilterReset: () => void;
  initialFilters?: ActiveFilters;
  filterContext?: 'auctions' | 'directSales' | 'lots' | 'tomada_de_precos';
  disableCategoryFilter?: boolean;
  hideMapCTA?: boolean;
  pricePoints?: number[];
  autoApply?: boolean;
}

const defaultModalities = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  // { value: 'VENDA_DIRETA', label: 'Venda Direta' }, // Venda direta é um tipo de oferta, não modalidade de leilão
];

const defaultAuctionStatuses = [
  { value: 'EM_BREVE', label: 'Em Breve' },
  { value: 'ABERTO_PARA_LANCES', label: 'Aberto para Lances' },
  { value: 'ENCERRADO', label: 'Encerrado' },
];

const defaultDirectSaleStatuses = [
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'SOLD', label: 'Vendida' },
  { value: 'EXPIRED', label: 'Expirada' },
  { value: 'PENDING_APPROVAL', label: 'Pendente Aprovação' }
];

const defaultOfferTypes = [
  { value: 'ALL' as 'ALL', label: 'Todos os Tipos' },
  { value: 'BUY_NOW' as 'BUY_NOW', label: 'Comprar Agora' },
  { value: 'ACCEPTS_PROPOSALS' as 'ACCEPTS_PROPOSALS', label: 'Aceita Propostas' }
];

const praçaOptions = [
  { value: 'todas', label: 'Qualquer número' },
  { value: 'unica', label: 'Praça Única' },
  { value: 'multiplas', label: 'Múltiplas Praças' },
];


import { useRouter, useSearchParams } from 'next/navigation';

// ---- PriceRangeBooking: Booking.com-style dual-handle slider with histogram ----
interface PriceRangeBookingProps {
  value: [number, number];
  pricePoints: number[];
  onChange: (value: [number, number]) => void;
  onCommit: (value: [number, number]) => void;
}

function PriceRangeBooking({ value, pricePoints, onChange, onCommit }: PriceRangeBookingProps) {
  const sliderMin = pricePoints.length > 0 ? Math.floor(Math.min(...pricePoints) / 1000) * 1000 : 0;
  const sliderMax = pricePoints.length > 0 ? Math.ceil(Math.max(...pricePoints) / 1000) * 1000 : 1000000;

  const [minInput, setMinInput] = useState(String(value[0]));
  const [maxInput, setMaxInput] = useState(String(value[1]));
  useEffect(() => { setMinInput(String(value[0])); }, [value[0]]);
  useEffect(() => { setMaxInput(String(value[1])); }, [value[1]]);

  const BARS = 20;
  const histogramBars = useMemo(() => {
    if (pricePoints.length === 0 || sliderMax === sliderMin) return Array(BARS).fill(1);
    const binSize = (sliderMax - sliderMin) / BARS;
    const bins = Array(BARS).fill(0);
    pricePoints.forEach(p => {
      const idx = Math.min(Math.floor((p - sliderMin) / binSize), BARS - 1);
      if (idx >= 0) bins[idx]++;
    });
    return bins;
  }, [pricePoints, sliderMin, sliderMax]);

  const maxBinCount = Math.max(...histogramBars, 1);

  const isBarActive = (i: number) => {
    if (sliderMax === sliderMin) return true;
    const binSize = (sliderMax - sliderMin) / BARS;
    const barMin = sliderMin + i * binSize;
    const barMax = sliderMin + (i + 1) * binSize;
    return barMax >= value[0] && barMin <= value[1];
  };

  const commitMin = () => {
    const parsed = parseInt(minInput.replace(/\D/g, ''), 10);
    const newMin = isNaN(parsed) ? sliderMin : Math.max(sliderMin, Math.min(parsed, value[1] - 1000));
    onChange([newMin, value[1]]);
    onCommit([newMin, value[1]]);
    setMinInput(String(newMin));
  };

  const commitMax = () => {
    const parsed = parseInt(maxInput.replace(/\D/g, ''), 10);
    const newMax = isNaN(parsed) ? sliderMax : Math.min(sliderMax, Math.max(parsed, value[0] + 1000));
    onChange([value[0], newMax]);
    onCommit([value[0], newMax]);
    setMaxInput(String(newMax));
  };

  return (
    <div className="wrapper-filter-price-booking" data-ai-id="filter-price-booking">
      <div className="wrapper-filter-price-inputs">
        <div className="wrapper-filter-price-input-group">
          <label className="label-filter-price-input" htmlFor="filter-price-min-input">Mínimo</label>
          <div className="wrapper-filter-price-input-field">
            <span className="prefix-filter-price-input" aria-hidden="true">R$</span>
            <Input
              id="filter-price-min-input"
              className="input-filter-price-value"
              value={minInput}
              onChange={e => setMinInput(e.target.value)}
              onBlur={commitMin}
              onKeyDown={e => e.key === 'Enter' && commitMin()}
              inputMode="numeric"
              aria-label="Preço mínimo"
              data-ai-id="filter-price-min-input"
            />
          </div>
        </div>
        <div className="wrapper-filter-price-input-group">
          <label className="label-filter-price-input" htmlFor="filter-price-max-input">Máximo</label>
          <div className="wrapper-filter-price-input-field">
            <span className="prefix-filter-price-input" aria-hidden="true">R$</span>
            <Input
              id="filter-price-max-input"
              className="input-filter-price-value"
              value={maxInput}
              onChange={e => setMaxInput(e.target.value)}
              onBlur={commitMax}
              onKeyDown={e => e.key === 'Enter' && commitMax()}
              inputMode="numeric"
              aria-label="Preço máximo"
              data-ai-id="filter-price-max-input"
            />
          </div>
        </div>
      </div>
      {pricePoints.length > 0 && (
        <div
          className="wrapper-filter-price-histogram"
          aria-hidden="true"
          role="presentation"
          data-ai-id="filter-price-histogram"
        >
          {histogramBars.map((count, i) => (
            <div
              key={i}
              className={`bar-filter-price-histogram${isBarActive(i) ? ' bar-filter-price-histogram--active' : ''}`}
              style={{ height: `${Math.max(8, Math.round((count / maxBinCount) * 100))}%` }}
            />
          ))}
        </div>
      )}
      <Slider
        min={sliderMin}
        max={sliderMax || 1000000}
        step={1000}
        value={[Math.max(sliderMin, value[0]), Math.min(sliderMax || 1000000, value[1])]}
        onValueChange={(v) => onChange(v as [number, number])}
        onValueCommit={(v) => onCommit(v as [number, number])}
        data-ai-id="filter-price-range-slider"
      />
    </div>
  );
}

export default function BidExpertFilter({
  categories = [],
  locations = [],
  sellers = [],
  makes = [],
  models = [],
  modalities = defaultModalities,
  statuses: providedStatuses, // Renamed to avoid conflict
  offerTypes = defaultOfferTypes,
  onFilterSubmit,
  onFilterReset,
  initialFilters,
  filterContext = 'auctions',
  disableCategoryFilter = false,
  hideMapCTA = false,
  pricePoints = [] as number[],
  autoApply = false,
}: BidExpertFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statuses = filterContext === 'directSales' ? defaultDirectSaleStatuses : defaultAuctionStatuses;

  const [selectedModality, setSelectedModality] = useState<string>(initialFilters?.modality || (modalities.length > 0 ? modalities[0].value : ''));
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(initialFilters?.category || 'TODAS');
  const [priceRange, setPriceRange] = useState<[number, number]>(initialFilters?.priceRange || [0, 500000]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initialFilters?.locations || []);
  const [selectedSellers, setSelectedSellers] = useState<string[]>(initialFilters?.sellers || []);
  const [selectedMakes, setSelectedMakes] = useState<string[]>(initialFilters?.makes || []);
  const [selectedModels, setSelectedModels] = useState<string[]>(initialFilters?.models || []);
  const [startDate, setStartDate] = useState<Date | undefined>(initialFilters?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialFilters?.endDate);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(initialFilters?.status || (filterContext === 'directSales' ? ['ACTIVE'] : []));
  const [selectedOfferType, setSelectedOfferType] = useState<DirectSaleOfferType | 'ALL'>(initialFilters?.offerType || 'ALL');
  const [selectedPraça, setSelectedPraça] = useState<'todas' | 'unica' | 'multiplas'>(initialFilters?.praça || 'todas');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (initialFilters) {
      setSelectedModality(initialFilters.modality);
      setSelectedCategorySlug(initialFilters.category);
      setPriceRange(initialFilters.priceRange);
      setSelectedLocations(initialFilters.locations);
      setSelectedSellers(initialFilters.sellers);
      setSelectedMakes(initialFilters.makes || []);
      setSelectedModels(initialFilters.models || []);
      setStartDate(initialFilters.startDate);
      setEndDate(initialFilters.endDate);
      setSelectedStatus(initialFilters.status || (filterContext === 'directSales' ? ['ACTIVE'] : []));
      setSelectedOfferType(initialFilters.offerType || 'ALL');
      setSelectedPraça(initialFilters.praça || 'todas');
    }
  }, [initialFilters, filterContext]);


  const applyFilters = (overrides?: Partial<ActiveFilters>) => {
    const currentFilters: ActiveFilters = {
      modality: selectedModality,
      category: selectedCategorySlug,
      priceRange,
      locations: selectedLocations,
      sellers: selectedSellers,
      makes: selectedMakes,
      models: selectedModels,
      startDate,
      endDate,
      status: selectedStatus,
      offerType: filterContext === 'directSales' ? selectedOfferType : undefined,
      praça: selectedPraça,
      ...overrides,
    };
    onFilterSubmit(currentFilters);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategorySlug(categorySlug);
    if (autoApply) applyFilters({ category: categorySlug });
  };

  const handleModalityChange = (modality: string) => {
    setSelectedModality(modality);
    if (autoApply) applyFilters({ modality });
  };

  const handlePraçaChange = (praça: string) => {
    setSelectedPraça(praça as 'todas' | 'unica' | 'multiplas');
    if (autoApply) applyFilters({ praça: praça as 'todas' | 'unica' | 'multiplas' });
  };

  const handleOfferTypeChange = (offerType: string) => {
    setSelectedOfferType(offerType as DirectSaleOfferType | 'ALL');
    if (autoApply) applyFilters({ offerType: offerType as DirectSaleOfferType | 'ALL' });
  };

  const handleLocationChange = (location: string) => {
    const newLocations = selectedLocations.includes(location)
      ? selectedLocations.filter(l => l !== location)
      : [...selectedLocations, location];
    setSelectedLocations(newLocations);
    if (autoApply) applyFilters({ locations: newLocations });
  };

  const handleSellerChange = (seller: string) => {
    const newSellers = selectedSellers.includes(seller)
      ? selectedSellers.filter(s => s !== seller)
      : [...selectedSellers, seller];
    setSelectedSellers(newSellers);
    if (autoApply) applyFilters({ sellers: newSellers });
  };

  const handleMakeChange = (makeName: string) => {
    const newMakes = selectedMakes.includes(makeName)
      ? selectedMakes.filter(m => m !== makeName)
      : [...selectedMakes, makeName];
    setSelectedMakes(newMakes);
    if (autoApply) applyFilters({ makes: newMakes });
  };

  const handleModelChange = (modelName: string) => {
    const newModels = selectedModels.includes(modelName)
      ? selectedModels.filter(m => m !== modelName)
      : [...selectedModels, modelName];
    setSelectedModels(newModels);
    if (autoApply) applyFilters({ models: newModels });
  };

  const handleStatusChange = (statusValue: string) => {
    const newStatus = selectedStatus.includes(statusValue)
      ? selectedStatus.filter(s => s !== statusValue)
      : [...selectedStatus, statusValue];
    setSelectedStatus(newStatus);
    if (autoApply) applyFilters({ status: newStatus });
  };

  const resetInternalFilters = () => {
    setSelectedModality(modalities.length > 0 ? modalities[0].value : '');
    if (!disableCategoryFilter) {
      setSelectedCategorySlug('TODAS');
    }
    setPriceRange([0, 500000]);
    setSelectedLocations([]);
    setSelectedSellers([]);
    setSelectedMakes([]);
    setSelectedModels([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedStatus(filterContext === 'directSales' ? ['ACTIVE'] : []);
    setSelectedOfferType('ALL');
    setSelectedPraça('todas');
  };

  const handleResetFilters = () => {
    resetInternalFilters();
    onFilterReset();
  };

  if (!isClient) {
    return <BidExpertFilterSkeleton />;
  }


  return (
    <aside className="wrapper-filters" data-ai-id="bidexpert-filter-container">
      <div className="wrapper-filter-header">
        <h2 className="header-filter-title" data-ai-id="bidexpert-filter-title">
          <Filter className="icon-filter-title" /> Filtros
        </h2>
        <Button variant="ghost" size="sm" onClick={handleResetFilters} className="btn-filter-reset" data-ai-id="bidexpert-filter-reset-btn">
          <RefreshCw className="icon-filter-reset" /> Limpar
        </Button>
      </div>

      {!hideMapCTA && (
      <div className="mb-4 mt-2 px-1" data-ai-id="bidexpert-minimap-trigger">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              const currentParams = searchParams ? searchParams.toString() : '';
              router.push(`/map-search?${currentParams}`);
            }
          }}
          onClick={() => {
            const currentParams = searchParams ? searchParams.toString() : '';
            router.push(`/map-search?${currentParams}`);
          }}
          className="group relative flex h-[100px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/30 transition-all hover:border-primary/50 hover:shadow-md"
        >
          {/* Map pattern background */}
          <div className="absolute inset-0 opacity-40 mix-blend-multiply dark:opacity-20 dark:mix-blend-screen map-pattern-bg"></div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 to-transparent"></div>

          <Button variant="default" className="relative z-10 gap-2 shadow-lg transition-transform group-hover:scale-105 pointer-events-none">
            <MapPin className="h-4 w-4" /> Mostrar no mapa
          </Button>
        </div>
      </div>
      )}

      <Accordion type="multiple" defaultValue={['categories', 'price', 'status', 'makes', 'praça']} className="accordion-filters" data-ai-id="bidexpert-filter-accordion">

        {filterContext === 'auctions' && (
          <AccordionItem value="modality" className="item-filter-accordion" data-ai-id="filter-modality-section">
            <AccordionTrigger className="trigger-filter-accordion">Modalidade do Leilão</AccordionTrigger>
            <AccordionContent className="content-filter-accordion">
              <RadioGroup value={selectedModality} onValueChange={handleModalityChange} className="group-filter-radio" data-ai-id="filter-modality-group">
                {modalities.map(modal => (
                  <div key={modal.value} className="wrapper-filter-option" data-ai-id={`filter-modality-${modal.value}`}>
                    <RadioGroupItem value={modal.value} id={`mod-${modal.value}`} data-ai-id={`filter-modality-${modal.value}-radio`} />
                    <Label htmlFor={`mod-${modal.value}`} className="label-filter-option">{modal.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

        {filterContext === 'directSales' && (
          <AccordionItem value="offerType" className="item-filter-accordion" data-ai-id="filter-offertype-section">
            <AccordionTrigger className="trigger-filter-accordion">Tipo de Oferta</AccordionTrigger>
            <AccordionContent className="content-filter-accordion">
              <RadioGroup value={selectedOfferType} onValueChange={handleOfferTypeChange} className="group-filter-radio" data-ai-id="filter-offertype-group">
                {offerTypes.map(type => (
                  <div key={type.value} className="wrapper-filter-option" data-ai-id={`filter-offertype-${type.value}`}>
                    <RadioGroupItem value={type.value} id={`offerType-${type.value}`} data-ai-id={`filter-offertype-${type.value}-radio`} />
                    <Label htmlFor={`offerType-${type.value}`} className="label-filter-option">{type.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

        {categories.length > 0 && (
          <AccordionItem value="categories" className="item-filter-accordion" disabled={disableCategoryFilter} data-ai-id="filter-category-section">
            <AccordionTrigger className="trigger-filter-accordion" disabled={disableCategoryFilter}>
              Categorias {disableCategoryFilter && <span className="text-filter-current-category">(Atual)</span>}
            </AccordionTrigger>
            <AccordionContent className="content-filter-accordion">
              <RadioGroup value={selectedCategorySlug} onValueChange={handleCategoryChange} className="group-filter-radio-scroll" data-ai-id="filter-category-group">
                <div key="TODAS" className="wrapper-filter-option" data-ai-id="filter-category-all">
                  <RadioGroupItem value="TODAS" id="cat-slug-TODAS" data-ai-id="filter-category-all-radio" />
                  <Label htmlFor="cat-slug-TODAS" className="label-filter-option">Todas as Categorias</Label>
                </div>
                {categories.map(category => (
                  <div key={category.id} className="wrapper-filter-option" data-ai-id={`filter-category-${category.slug}`}>
                    <RadioGroupItem value={category.slug} id={`cat-slug-${category.slug}`} data-ai-id={`filter-category-${category.slug}-radio`} />
                    <Label htmlFor={`cat-slug-${category.slug}`} className="label-filter-option">{category.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

        {filterContext === 'auctions' || filterContext === 'tomada_de_precos' ? (
          <AccordionItem value="praça" className="item-filter-accordion" data-ai-id="filter-praca-section">
            <AccordionTrigger className="trigger-filter-accordion">Praças</AccordionTrigger>
            <AccordionContent className="content-filter-accordion">
              <RadioGroup value={selectedPraça} onValueChange={handlePraçaChange} className="group-filter-radio" data-ai-id="filter-praca-group">
                {praçaOptions.map(option => (
                  <div key={option.value} className="wrapper-filter-option" data-ai-id={`filter-praca-${option.value}`}>
                    <RadioGroupItem value={option.value} id={`praça-${option.value}`} data-ai-id={`filter-praca-${option.value}-radio`} />
                    <Label htmlFor={`praça-${option.value}`} className="label-filter-option">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        ) : null}

        <AccordionItem value="price" className="item-filter-accordion" data-ai-id="filter-price-section">
          <AccordionTrigger className="trigger-filter-accordion">Faixa de Preço</AccordionTrigger>
          <AccordionContent className="content-filter-accordion-price">
            <PriceRangeBooking
              value={priceRange}
              pricePoints={pricePoints}
              onChange={(v) => setPriceRange(v)}
              onCommit={(v) => { setPriceRange(v); applyFilters({ priceRange: v }); }}
            />
          </AccordionContent>
        </AccordionItem>

        {filterContext === 'lots' && makes && makes.length > 0 && (
          <AccordionItem value="makes" className="item-filter-accordion" data-ai-id="filter-makes-section">
            <AccordionTrigger className="trigger-filter-accordion">Marca</AccordionTrigger>
            <AccordionContent className="content-filter-accordion-scroll">
              {makes.map(make => (
                <div key={make.id} className="wrapper-filter-option" data-ai-id={`filter-makes-${make.id}`}>
                  <Checkbox id={`make-${make.id}`} checked={selectedMakes.includes(make.name)} onCheckedChange={() => handleMakeChange(make.name)} data-ai-id={`filter-makes-${make.id}-checkbox`} />
                  <Label htmlFor={`make-${make.id}`} className="label-filter-option">{make.name}</Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {filterContext === 'lots' && models && models.length > 0 && (
          <AccordionItem value="models" className="item-filter-accordion" data-ai-id="filter-models-section">
            <AccordionTrigger className="trigger-filter-accordion">Modelo</AccordionTrigger>
            <AccordionContent className="content-filter-accordion-scroll">
              {models.map(model => (
                <div key={model.id} className="wrapper-filter-option" data-ai-id={`filter-models-${model.id}`}>
                  <Checkbox id={`model-${model.id}`} checked={selectedModels.includes(model.name)} onCheckedChange={() => handleModelChange(model.name)} data-ai-id={`filter-models-${model.id}-checkbox`} />
                  <Label htmlFor={`model-${model.id}`} className="label-filter-option">{model.name}</Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}


        {locations.length > 0 && (
          <AccordionItem value="locations" className="item-filter-accordion" data-ai-id="filter-locations-section">
            <AccordionTrigger className="trigger-filter-accordion">Localizações</AccordionTrigger>
            <AccordionContent className="content-filter-accordion-scroll">
              {locations.map(location => (
                <div key={location} className="wrapper-filter-option" data-ai-id={`filter-locations-${location}`}>
                  <Checkbox
                    id={`loc-${location}`}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => handleLocationChange(location)}
                    data-ai-id={`filter-locations-${location}-checkbox`}
                  />
                  <Label htmlFor={`loc-${location}`} className="label-filter-option">{location}</Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {sellers.length > 0 && (
          <AccordionItem value="sellers" className="item-filter-accordion" data-ai-id="filter-sellers-section">
            <AccordionTrigger className="trigger-filter-accordion">Comitentes/Vendedores</AccordionTrigger>
            <AccordionContent className="content-filter-accordion-scroll">
              {sellers.map(seller => (
                <div key={seller} className="wrapper-filter-option" data-ai-id={`filter-sellers-${seller}`}>
                  <Checkbox
                    id={`sel-${seller}`}
                    checked={selectedSellers.includes(seller)}
                    onCheckedChange={() => handleSellerChange(seller)}
                    data-ai-id={`filter-sellers-${seller}-checkbox`}
                  />
                  <Label htmlFor={`sel-${seller}`} className="label-filter-option">{seller}</Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {(filterContext === 'auctions' || filterContext === 'tomada_de_precos') && (
          <AccordionItem value="dates" className="item-filter-accordion" data-ai-id="filter-dates-section">
            <AccordionTrigger className="trigger-filter-accordion">Período do Leilão</AccordionTrigger>
            <AccordionContent className="content-filter-accordion-dates">
              <div className="wrapper-filter-date-field" data-ai-id="filter-startdate-group">
                <Label htmlFor="start-date" className="label-filter-date">Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="btn-filter-date-picker" data-ai-id="filter-startdate-picker-trigger">
                      <CalendarIcon className="icon-filter-date" />
                      {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="content-filter-date-popover">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus data-ai-id="filter-startdate-calendar" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="wrapper-filter-date-field" data-ai-id="filter-enddate-group">
                <Label htmlFor="end-date" className="label-filter-date">Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="btn-filter-date-picker" data-ai-id="filter-enddate-picker-trigger">
                      <CalendarIcon className="icon-filter-date" />
                      {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="content-filter-date-popover">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus data-ai-id="filter-enddate-calendar" />
                  </PopoverContent>
                </Popover>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="status" className="item-filter-accordion" data-ai-id="filter-status-section">
          <AccordionTrigger className="trigger-filter-accordion">Status</AccordionTrigger>
          <AccordionContent className="content-filter-accordion-scroll">
            {statuses.map(statusItem => (
              <div key={statusItem.value} className="wrapper-filter-option" data-ai-id={`filter-status-${statusItem.value}`}>
                <Checkbox
                  id={`status-${statusItem.value}`}
                  checked={selectedStatus.includes(statusItem.value)}
                  onCheckedChange={() => handleStatusChange(statusItem.value)}
                  data-ai-id={`filter-status-${statusItem.value}-checkbox`}
                />
                <Label htmlFor={`status-${statusItem.value}`} className="label-filter-option">
                  {statusItem.label}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {!autoApply && <Button className="btn-filter-apply" onClick={() => applyFilters()} data-ai-id="bidexpert-filter-apply-btn">Aplicar Filtros</Button>}
    </aside>
  );
}
