
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Filter, CalendarIcon, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SidebarFiltersProps {
  categories?: string[];
  locations?: string[];
  sellers?: string[];
  // Adicione mais props para outros tipos de filtros conforme necessário
}

export default function SidebarFilters({ categories = [], locations = [], sellers = [] }: SidebarFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Garante que o código que depende do window rode apenas no cliente
  }, []);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
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

  const applyFilters = () => {
    // Lógica para aplicar filtros (simulada por enquanto)
    console.log({
      priceRange,
      selectedCategories,
      selectedLocations,
      selectedSellers,
      startDate,
      endDate,
    });
    alert('Filtros aplicados (simulação)! Veja o console.');
  };

  const resetFilters = () => {
    setPriceRange([0, 500000]);
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedSellers([]);
    setStartDate(undefined);
    setEndDate(undefined);
    alert('Filtros resetados (simulação)!');
  };
  
  if (!isClient) {
    // Pode retornar um skeleton loader aqui se preferir
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
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-muted-foreground hover:text-primary">
          <RefreshCw className="mr-1 h-3 w-3" /> Limpar
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['categories', 'price']} className="w-full">
        {categories.length > 0 && (
            <AccordionItem value="categories">
            <AccordionTrigger className="text-md font-medium">Categorias</AccordionTrigger>
            <AccordionContent className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`cat-${category}`} 
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <Label htmlFor={`cat-${category}`} className="text-sm font-normal cursor-pointer">{category}</Label>
                </div>
                ))}
            </AccordionContent>
            </AccordionItem>
        )}

        <AccordionItem value="price">
          <AccordionTrigger className="text-md font-medium">Faixa de Preço</AccordionTrigger>
          <AccordionContent className="pt-2 space-y-3">
            <Slider
              defaultValue={[0, 500000]}
              min={0}
              max={1000000} // Ajuste o máximo conforme seus dados
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
            <AccordionContent className="space-y-2">
                 {['EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                        <Checkbox id={`status-${status}`} />
                        <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer">
                            {status === 'EM_BREVE' ? 'Em Breve' : status === 'ABERTO_PARA_LANCES' ? 'Aberto para Lances' : 'Encerrado'}
                        </Label>
                    </div>
                 ))}
            </AccordionContent>
        </AccordionItem>

      </Accordion>

      <Button className="w-full" onClick={applyFilters}>Aplicar Filtros</Button>
    </aside>
  );
}
