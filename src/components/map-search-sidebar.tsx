// src/components/map-search-sidebar.tsx
/**
 * @fileoverview Painel lateral reutilizável da busca por mapa com formulário, abas e lista.
 */
'use client';

import type { FormEvent } from 'react';
import { MapPin, AlertCircle, Search as SearchIcon, RefreshCcw, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BidExpertListItem from '@/components/BidExpertListItem';
import type { Auction, DirectSaleOffer, Lot, PlatformSettings } from '@/types';
import type { LatLngBounds } from 'leaflet';
import type { MapSearchDataset } from '@/app/map-search/map-search-logic';

const DATASET_TABS: { value: MapSearchDataset; label: string; helper: string }[] = [
  { value: 'lots', label: 'Lotes em Leilão', helper: 'Todos os lotes públicos' },
  { value: 'direct_sale', label: 'Venda Direta', helper: 'Ofertas com compra imediata' },
  { value: 'tomada_de_precos', label: 'Tomada de Preços', helper: 'Processos especiais' },
];

export interface MapSearchSidebarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSubmitSearch: (event: FormEvent<HTMLFormElement>) => void;
  dataset: MapSearchDataset;
  onDatasetChange: (value: MapSearchDataset) => void;
  isLoading: boolean;
  error: string | null;
  platformSettings: PlatformSettings | null;
  displayedItems: Array<Lot | Auction | DirectSaleOffer>;
  resultsLabel: string;
  visibleItemIds: string[] | null;
  activeBounds: LatLngBounds | null;
  onResetFilters: () => void;
  listItemType: 'lot' | 'auction' | 'direct_sale';
  lastUpdatedLabel: string | null;
  isRefreshingDatasets: boolean;
  onForceRefresh: () => void;
  isUsingCache: boolean;
  listDensity?: 'default' | 'compact' | 'map';
}

export default function MapSearchSidebar({
  searchTerm,
  onSearchTermChange,
  onSubmitSearch,
  dataset,
  onDatasetChange,
  isLoading,
  error,
  platformSettings,
  displayedItems,
  resultsLabel,
  visibleItemIds,
  activeBounds,
  onResetFilters,
  listItemType,
  lastUpdatedLabel,
  isRefreshingDatasets,
  onForceRefresh,
  isUsingCache,
  listDensity = 'default',
}: MapSearchSidebarProps) {
  const showResetButton = visibleItemIds !== null;
  const activeTab = DATASET_TABS.find((tab) => tab.value === dataset);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="p-4 space-y-4 border-b">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/40 bg-surface/70 px-3 py-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Tipo de Oferta</p>
            <p className="text-sm font-semibold text-foreground tracking-wide">{activeTab?.label}</p>
          </div>
          <Button
            type="button"
            variant="mapGhost"
            size="sm"
            className="ml-auto h-8"
            onClick={onForceRefresh}
            disabled={isRefreshingDatasets}
          >
            {isRefreshingDatasets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>{lastUpdatedLabel ?? 'Sincronize para atualizar os dados'}</span>
          {isUsingCache && <span className="text-[10px] uppercase tracking-[0.35em] text-primary">Cache</span>}
        </div>
        <form onSubmit={onSubmitSearch} className="flex flex-col gap-3" data-ai-id="map-search-form">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Palavra-chave, cidade ou comitente"
              className="h-11 pl-10 text-sm bg-surface border-border/80"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              data-ai-id="map-search-input"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="h-10 flex-1" variant="mapSolid" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar área'}
            </Button>
            {showResetButton && (
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={onResetFilters}
                title="Mostrar todos os resultados novamente"
                data-ai-id="map-reset-filter"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
        <Tabs value={dataset} onValueChange={(value) => onDatasetChange(value as MapSearchDataset)}>
          <TabsList className="grid grid-cols-3 bg-surface">
            {DATASET_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs leading-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-ai-id={`map-dataset-toggle-${tab.value}`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {activeTab?.helper && (
          <p className="text-xs text-muted-foreground">{activeTab.helper}</p>
        )}
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span data-ai-id="map-search-count">{resultsLabel}</span>
          {activeBounds && <span className="text-[10px] uppercase tracking-widest">Área filtrada</span>}
        </div>
      </div>
      <ScrollArea className="flex-1" data-ai-id="map-search-list">
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Carregando dados do mapa…</p>
            </div>
          )}
          {!isLoading && error && (
            <div className="text-center py-6">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {!isLoading && !error && (!platformSettings || displayedItems.length === 0) && (
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum item dentro do recorte atual. Mova o mapa ou limpe o filtro para ver mais resultados.
              </p>
            </div>
          )}
          {!isLoading && !error && platformSettings && displayedItems.length > 0 && (
            displayedItems.map((item) => (
              <div key={item.id} data-ai-id="map-search-list-item">
                <BidExpertListItem
                  item={item}
                  type={listItemType}
                  platformSettings={platformSettings}
                  parentAuction={listItemType === 'lot' ? (item as Lot).auction : undefined}
                  density={listDensity}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
