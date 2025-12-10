import { describe, it, expect } from 'vitest';
import type { Auction, DirectSaleOffer, Lot } from '@/types';
import {
  selectDatasetItems,
  filterBySearchTerm,
  filterByVisibleIds,
  resolveDatasetFromParam,
  type MapSearchDataset,
} from '@/app/map-search/map-search-logic';

const mockLot = (overrides: Partial<Lot> = {}): Lot => ({
  id: overrides.id ?? `lot-${Math.random()}`,
  auctionId: 'auction-1',
  tenantId: 'tenant-1',
  title: 'Apartamento Centro',
  publicId: 'L-001',
  slug: 'apartamento-centro',
  cityName: 'São Paulo',
  stateUf: 'SP',
  description: 'Lote especial',
  auction: {
    id: 'auction-1',
    title: 'Leilão Principal',
    auctionType: 'EXTRAJUDICIAL',
  },
  ...overrides,
} as unknown as Lot);

const mockAuction = (overrides: Partial<Auction> = {}): Auction => ({
  id: overrides.id ?? `auction-${Math.random()}`,
  title: 'Tomada Pública',
  auctionType: 'TOMADA_DE_PRECOS',
  description: 'Processo especial',
  ...overrides,
} as unknown as Auction);

const mockDirectSale = (overrides: Partial<DirectSaleOffer> = {}): DirectSaleOffer => ({
  id: overrides.id ?? `offer-${Math.random()}`,
  title: 'Venda Direta VIP',
  sellerName: 'Comitente XPTO',
  description: 'Oferta exclusiva',
  status: 'ACTIVE',
  locationCity: 'Rio de Janeiro',
  locationState: 'RJ',
  ...overrides,
} as unknown as DirectSaleOffer);

describe('map-search-logic helpers', () => {
  it('resolveDatasetFromParam penaliza valores inválidos como lots', () => {
    const datasets: Array<[string | null | undefined, MapSearchDataset]> = [
      ['direct_sale', 'direct_sale'],
      ['tomada_de_precos', 'tomada_de_precos'],
      ['invalid', 'lots'],
      [null, 'lots'],
    ];
    datasets.forEach(([value, expected]) => {
      expect(resolveDatasetFromParam(value)).toBe(expected);
    });
  });

  it('selectDatasetItems respeita filtros por dataset', () => {
    const lots = [
      mockLot({ id: 'lot-1' }),
      mockLot({
        id: 'lot-2',
        auction: { id: 'auction-special', title: 'Tomada Especial', auctionType: 'TOMADA_DE_PRECOS' } as any,
      }),
    ];
    const auctions = [mockAuction({ id: 'auction-1' }), mockAuction({ id: 'auction-2', auctionType: 'EXTRAJUDICIAL' })];
    const offers = [mockDirectSale({ id: 'offer-1' }), mockDirectSale({ id: 'offer-2', status: 'INACTIVE' as any })];

    const filteredLots = selectDatasetItems({ dataset: 'lots', lots, auctions, directSales: offers });
    const filteredDirect = selectDatasetItems({ dataset: 'direct_sale', lots, auctions, directSales: offers });
    const filteredTomada = selectDatasetItems({ dataset: 'tomada_de_precos', lots, auctions, directSales: offers });

    expect(filteredLots.map(item => item.id)).toEqual(['lot-1']);
    expect(filteredDirect.map(item => item.id)).toEqual(['offer-1']);
    expect(filteredTomada.map(item => item.id)).toEqual(['auction-1']);
  });

  it('filterBySearchTerm procura em múltiplos campos relacionados', () => {
    const items = [
      mockLot({ id: 'lot-geo', cityName: 'Curitiba', auction: { title: 'Curitiba Autos' } as any }),
      mockDirectSale({ id: 'offer-brand', sellerName: 'Distribuidora Sul' }),
    ];
    const filteredCity = filterBySearchTerm(items, 'curitiba');
    const filteredSeller = filterBySearchTerm(items, 'distribuidora');

    expect(filteredCity.map(item => item.id)).toEqual(['lot-geo']);
    expect(filteredSeller.map(item => item.id)).toEqual(['offer-brand']);
  });

  it('filterByVisibleIds mantém itens quando conjunto é nulo e aplica filtro quando informado', () => {
    const items = [mockLot({ id: 'lot-a' }), mockLot({ id: 'lot-b' })];
    expect(filterByVisibleIds(items, null).length).toBe(2);
    expect(filterByVisibleIds(items, ['lot-b']).map(item => item.id)).toEqual(['lot-b']);
  });
});
