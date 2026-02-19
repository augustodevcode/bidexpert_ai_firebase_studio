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
import { Filter, CalendarIcon, RefreshCw, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  offerTypes?: { value: DirectSaleOfferType | 'ALL', label: string}[];
  onFilterSubmit: (filters: ActiveFilters) => void;
  onFilterReset: () => void;
  initialFilters?: ActiveFilters;
  filterContext?: 'auctions' | 'directSales' | 'lots' | 'tomada_de_precos';
  disableCategoryFilter?: boolean; // New prop to disable category selection
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
    { value: 'PENDING_APPROVAL', label: 'Pendente Aprovação'}
];

const defaultOfferTypes = [
    { value: 'ALL' as 'ALL', label: 'Todos os Tipos'},
    { value: 'BUY_NOW' as 'BUY_NOW', label: 'Comprar Agora'},
    { value: 'ACCEPTS_PROPOSALS' as 'ACCEPTS_PROPOSALS', label: 'Aceita Propostas'}
];

const praçaOptions = [
  { value: 'todas', label: 'Qualquer número' },
  { value: 'unica', label: 'Praça Única' },
  { value: 'multiplas', label: 'Múltiplas Praças' },
];


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
  disableCategoryFilter = false, // Default to enabled
}: BidExpertFilterProps) {
  
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

  
  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategorySlug(categorySlug);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };
  
  const handleSellerChange = (seller: string) => {
    setSelectedSellers(prev =>
      prev.includes(seller) ? prev.filter(s => s !== seller) : [...prev, seller]
    );
  };

  const handleMakeChange = (makeName: string) => {
    setSelectedMakes(prev =>
      prev.includes(makeName) ? prev.filter(m => m !== makeName) : [...prev, makeName]
    );
  };

  const handleModelChange = (modelName: string) => {
    setSelectedModels(prev =>
      prev.includes(modelName) ? prev.filter(m => m !== modelName) : [...prev, modelName]
    );
  };


  const handleStatusChange = (statusValue: string) => {
    setSelectedStatus(prev =>
      prev.includes(statusValue) ? prev.filter(s => s !== statusValue) : [...prev, statusValue]
    );
  };

  const applyFilters = () => {
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
    };
    onFilterSubmit(currentFilters);
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
  }

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

      <Accordion type="multiple" defaultValue={['categories', 'price', 'status', 'makes', 'praça']} className="accordion-filters" data-ai-id="bidexpert-filter-accordion">
        
        {filterContext === 'auctions' && (
            <AccordionItem value="modality" className="item-filter-accordion" data-ai-id="filter-modality-section">
            <AccordionTrigger className="trigger-filter-accordion">Modalidade do Leilão</AccordionTrigger>
            <AccordionContent className="content-filter-accordion">
                <RadioGroup value={selectedModality} onValueChange={setSelectedModality} className="group-filter-radio" data-ai-id="filter-modality-group">
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
                <RadioGroup value={selectedOfferType} onValueChange={(value) => setSelectedOfferType(value as DirectSaleOfferType | 'ALL')} className="group-filter-radio" data-ai-id="filter-offertype-group">
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
              <RadioGroup value={selectedPraça} onValueChange={(value) => setSelectedPraça(value as 'todas' | 'unica' | 'multiplas')} className="group-filter-radio" data-ai-id="filter-praca-group">
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
            <Slider
              min={0}
              max={1000000}
              step={1000}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              data-ai-id="filter-price-slider"
            />
            <div className="wrapper-filter-price-display" data-ai-id="filter-price-display">
              <span className="text-filter-price-min" data-ai-id="filter-price-min-display">R$ {priceRange[0].toLocaleString('pt-BR')}</span>
              <span className="text-filter-price-max" data-ai-id="filter-price-max-display">R$ {priceRange[1].toLocaleString('pt-BR')}</span>
            </div>
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

      <Button className="btn-filter-apply" onClick={applyFilters} data-ai-id="bidexpert-filter-apply-btn">Aplicar Filtros</Button>
    </aside>
  );
}
