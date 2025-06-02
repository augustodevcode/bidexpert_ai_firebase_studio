
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
import { Filter, CalendarIcon, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definindo os tipos para os filtros que serão passados
export interface ActiveFilters {
  modality: string;
  category: string;
  priceRange: [number, number];
  locations: string[];
  sellers: string[];
  startDate?: Date;
  endDate?: Date;
  status: string[];
}

interface SidebarFiltersProps {
  categories?: string[];
  locations?: string[];
  sellers?: string[];
  modalities?: { value: string, label: string }[];
  statuses?: { value: string, label: string }[];
  onFilterSubmit: (filters: ActiveFilters) => void;
  onFilterReset: () => void;
}

const defaultModalities = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  { value: 'VENDA_DIRETA', label: 'Venda Direta' },
];

const defaultStatuses = [
  { value: 'EM_BREVE', label: 'Em Breve' },
  { value: 'ABERTO_PARA_LANCES', label: 'Aberto para Lances' },
  { value: 'ENCERRADO', label: 'Encerrado' },
];


export default function SidebarFilters({
  categories = [],
  locations = [],
  sellers = [],
  modalities = defaultModalities,
  statuses = defaultStatuses,
  onFilterSubmit,
  onFilterReset,
}: SidebarFiltersProps) {
  const [selectedModality, setSelectedModality] = useState<string>(modalities.length > 0 ? modalities[0].value : '');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories.length > 0 ? categories[0] : 'TODAS'); // 'TODAS' as default
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
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

  const handleStatusChange = (statusValue: string) => {
    setSelectedStatus(prev =>
      prev.includes(statusValue) ? prev.filter(s => s !== statusValue) : [...prev, statusValue]
    );
  };

  const applyFilters = () => {
    const currentFilters: ActiveFilters = {
      modality: selectedModality,
      category: selectedCategory,
      priceRange,
      locations: selectedLocations,
      sellers: selectedSellers,
      startDate,
      endDate,
      status: selectedStatus,
    };
    onFilterSubmit(currentFilters);
  };

  const resetInternalFilters = () => {
    setSelectedModality(modalities.length > 0 ? modalities[0].value : '');
    setSelectedCategory(categories.length > 0 ? categories[0] : 'TODAS');
    setPriceRange([0, 500000]);
    setSelectedLocations([]);
    setSelectedSellers([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedStatus([]);
  }

  const handleResetFilters = () => {
    resetInternalFilters();
    onFilterReset(); // Chama o callback da página pai
  };
  
  if (!isClient) {
    return (
      <aside className="w-full md:w-72 lg:w-80 space-y-6 p-1">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          {[1,2,3,4].map(i => (
            <div key={i} className="mb-4">
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ))}
          <div className="h-10 bg-primary rounded mt-4"></div>
        </div>
      </aside>
    );
  }


  return (
    <aside className="w-full md:w-72 lg:w-80 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Filter className="mr-2 h-5 w-5 text-primary" /> Filtros
        </h2>
        <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-muted-foreground hover:text-primary">
          <RefreshCw className="mr-1 h-3 w-3" /> Limpar
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['modality', 'categories', 'price']} className="w-full">
        
        <AccordionItem value="modality">
          <AccordionTrigger className="text-md font-medium">Modalidade</AccordionTrigger>
          <AccordionContent>
            <RadioGroup value={selectedModality} onValueChange={setSelectedModality} className="space-y-1">
              {modalities.map(modal => (
                <div key={modal.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={modal.value} id={`mod-${modal.value}`} />
                  <Label htmlFor={`mod-${modal.value}`} className="text-sm font-normal cursor-pointer">{modal.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
        
        {categories.length > 0 && (
            <AccordionItem value="categories">
            <AccordionTrigger className="text-md font-medium">Categorias</AccordionTrigger>
            <AccordionContent>
                <RadioGroup value={selectedCategory} onValueChange={handleCategoryChange} className="space-y-1 max-h-60 overflow-y-auto pr-2">
                    <div key="TODAS" className="flex items-center space-x-2">
                        <RadioGroupItem value="TODAS" id="cat-TODAS" />
                        <Label htmlFor="cat-TODAS" className="text-sm font-normal cursor-pointer">Todas</Label>
                    </div>
                    {categories.map(category => (
                        <div key={category} className="flex items-center space-x-2">
                            <RadioGroupItem value={category} id={`cat-${category}`} />
                            <Label htmlFor={`cat-${category}`} className="text-sm font-normal cursor-pointer">{category}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </AccordionContent>
            </AccordionItem>
        )}

        <AccordionItem value="price">
          <AccordionTrigger className="text-md font-medium">Faixa de Preço</AccordionTrigger>
          <AccordionContent className="pt-2 space-y-3">
            <Slider
              min={0}
              max={1000000}
              step={1000}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ {priceRange[0].toLocaleString('pt-BR')}</span>
              <span>R$ {priceRange[1].toLocaleString('pt-BR')}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        {locations.length > 0 && (
            <AccordionItem value="locations">
            <AccordionTrigger className="text-md font-medium">Localizações</AccordionTrigger>
            <AccordionContent className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {locations.map(location => (
                <div key={location} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`loc-${location}`} 
                        checked={selectedLocations.includes(location)}
                        onCheckedChange={() => handleLocationChange(location)}
                     />
                    <Label htmlFor={`loc-${location}`} className="text-sm font-normal cursor-pointer">{location}</Label>
                </div>
                ))}
            </AccordionContent>
            </AccordionItem>
        )}
        
        {sellers.length > 0 && (
            <AccordionItem value="sellers">
            <AccordionTrigger className="text-md font-medium">Comitentes/Vendedores</AccordionTrigger>
            <AccordionContent className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {sellers.map(seller => (
                <div key={seller} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`sel-${seller}`} 
                        checked={selectedSellers.includes(seller)}
                        onCheckedChange={() => handleSellerChange(seller)}
                    />
                    <Label htmlFor={`sel-${seller}`} className="text-sm font-normal cursor-pointer">{seller}</Label>
                </div>
                ))}
            </AccordionContent>
            </AccordionItem>
        )}

        <AccordionItem value="dates">
          <AccordionTrigger className="text-md font-medium">Período do Leilão</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1">
            <div>
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                   <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="status">
            <AccordionTrigger className="text-md font-medium">Status</AccordionTrigger>
            <AccordionContent className="space-y-2 max-h-60 overflow-y-auto pr-2">
                 {statuses.map(statusItem => (
                    <div key={statusItem.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${statusItem.value}`}
                          checked={selectedStatus.includes(statusItem.value)}
                          onCheckedChange={() => handleStatusChange(statusItem.value)}
                        />
                        <Label htmlFor={`status-${statusItem.value}`} className="text-sm font-normal cursor-pointer">
                            {statusItem.label}
                        </Label>
                    </div>
                 ))}
            </AccordionContent>
        </AccordionItem>

         {/* Placeholders for future filters */}
        <AccordionItem value="subCategory_placeholder" disabled>
          <AccordionTrigger className="text-md font-medium text-muted-foreground/70">Subcategoria (Em breve)</AccordionTrigger>
          <AccordionContent><p className="text-xs text-muted-foreground">Filtro por subcategoria será adicionado aqui.</p></AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand_placeholder" disabled>
          <AccordionTrigger className="text-md font-medium text-muted-foreground/70">Marca (Em breve)</AccordionTrigger>
          <AccordionContent><p className="text-xs text-muted-foreground">Filtro por marca será adicionado aqui.</p></AccordionContent>
        </AccordionItem>

        <AccordionItem value="model_placeholder" disabled>
          <AccordionTrigger className="text-md font-medium text-muted-foreground/70">Modelo (Em breve)</AccordionTrigger>
          <AccordionContent><p className="text-xs text-muted-foreground">Filtro por modelo será adicionado aqui.</p></AccordionContent>
        </AccordionItem>

      </Accordion>

      <Button className="w-full" onClick={applyFilters}>Aplicar Filtros</Button>
    </aside>
  );
}

