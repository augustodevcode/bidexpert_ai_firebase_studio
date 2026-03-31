import { describe, it, expect } from 'vitest';
import { getAuctionMinimumOffer, getLotDetailedDescription, getLotDisplayLocation, getLotDisplayPrice, isAuctionInPregaoWindow } from '../../src/lib/ui-helpers';
import { addDays, subDays } from 'date-fns';

// Mock types locally to avoid complex Prisma imports in unit test if possible,
// or cast as any for simplicity in this specific logic test.
// We are testing the logic flow, not the TypeORM binding.

describe('getLotDisplayPrice', () => {
    // Helper to create mock objects
    const createLot = (overrides: any = {}) => ({
        id: 1,
        title: 'Test Lot',
        price: 1000,
        initialPrice: 1000,
        bidsCount: 0,
        ...overrides
    });

    const createAuction = (stages: any[] = []) => ({
        id: 1,
        auctionStages: stages.map((s, i) => ({
            id: i + 1,
            name: `Stage ${i + 1}`,
            startDate: new Date(),
            endDate: new Date(),
            discountPercent: 100,
            ...s
        }))
    });

    it('should return "Lance Atual" and current price if bids exist', () => {
        // Arrange
        const lot = createLot({ bidsCount: 1, price: 1500 });
        const auction = createAuction(); // No active stage needed logic-wise if has bids, but passed typically

        // Act
        const result = getLotDisplayPrice(lot as any, auction as any);

        // Assert
        expect(result).toEqual({ value: 1500, label: 'Lance Atual' });
    });

    it('should return "Lance Inicial" if no bids and active stage is first stage', () => {
        // Arrange
        const now = new Date();
        const lot = createLot({ bidsCount: 0, initialPrice: 1000 });
        const auction = createAuction([
            { id: 1, startDate: subDays(now, 1), endDate: addDays(now, 1) } // Active
        ]);

        // Act
        const result = getLotDisplayPrice(lot as any, auction as any);

        // Assert
        expect(result).toEqual({ value: 1000, label: 'Lance Inicial' });
    });

    it('should return "Lance Mínimo" with discount if no bids and active stage is second stage', () => {
        // Arrange
        const now = new Date();
        const lot = createLot({ bidsCount: 0, initialPrice: 2000 });
        const auction = createAuction([
            { id: 1, startDate: subDays(now, 5), endDate: subDays(now, 2) }, // Past
            { id: 2, startDate: subDays(now, 1), endDate: addDays(now, 1), discountPercent: 50 } // Active (50% discount)
        ]);

        // Act
        const result = getLotDisplayPrice(lot as any, auction as any);

        // Assert
        // Logic: 50% of 2000 = 1000
        expect(result).toEqual({ value: 1000, label: 'Lance Mínimo' });
    });

    it('should return "Lance Inicial" (default) if no stage active', () => {
        // Arrange
        const now = new Date();
        const lot = createLot({ bidsCount: 0, initialPrice: 1000 });
        const auction = createAuction([
            { id: 1, startDate: subDays(now, 5), endDate: subDays(now, 2) }, // Past
            // No active stage currently
        ]);

        // Act
        const result = getLotDisplayPrice(lot as any, auction as any);

        // Assert
        expect(result).toEqual({ value: 1000, label: 'Lance Inicial' });
    });
});

describe('isAuctionInPregaoWindow', () => {
    it('returns true when auction is open and now is within open/end window', () => {
        const now = new Date('2026-02-21T12:00:00Z');

        const result = isAuctionInPregaoWindow(
            {
                status: 'ABERTO_PARA_LANCES',
                openDate: '2026-02-21T10:00:00Z',
                endDate: '2026-02-21T14:00:00Z',
            },
            now
        );

        expect(result).toBe(true);
    });

    it('returns false when auction is not ABERTO_PARA_LANCES', () => {
        const result = isAuctionInPregaoWindow({
            status: 'EM_BREVE',
            openDate: '2026-02-21T10:00:00Z',
            endDate: '2026-02-21T14:00:00Z',
        });

        expect(result).toBe(false);
    });

    it('returns false when now is before the effective opening date', () => {
        const now = new Date('2026-02-21T08:00:00Z');

        const result = isAuctionInPregaoWindow(
            {
                status: 'ABERTO_PARA_LANCES',
                actualOpenDate: '2026-02-21T10:00:00Z',
                endDate: '2026-02-21T14:00:00Z',
            },
            now
        );

        expect(result).toBe(false);
    });

    it('returns false when now is after end date', () => {
        const now = new Date('2026-02-21T15:00:00Z');

        const result = isAuctionInPregaoWindow(
            {
                status: 'ABERTO_PARA_LANCES',
                openDate: '2026-02-21T10:00:00Z',
                endDate: '2026-02-21T14:00:00Z',
            },
            now
        );

        expect(result).toBe(false);
    });
});

describe('getLotDetailedDescription', () => {
    it('returns the explicit lot description when present', () => {
        const result = getLotDetailedDescription({ description: 'Descrição do lote' } as any);

        expect(result).toBe('Descrição do lote');
    });

    it('falls back to the linked asset description when the lot description is empty', () => {
        const result = getLotDetailedDescription({
            description: '',
            AssetsOnLots: [
                {
                    Asset: {
                        description: 'Descrição herdada do ativo judicial',
                    },
                },
            ],
        } as any);

        expect(result).toBe('Descrição herdada do ativo judicial');
    });
});

describe('getLotDisplayLocation', () => {
    it('prioritizes city/state informed directly on the lot', () => {
        const result = getLotDisplayLocation({ cityName: 'Jaboticabal', stateUf: 'SP' } as any);

        expect(result).toBe('Jaboticabal - SP');
    });

    it('falls back to the asset address when the lot has no city/state', () => {
        const result = getLotDisplayLocation({
            assets: [
                {
                    address: 'Rua Luiz Fernando Campos, 68 - Jardim Elite',
                },
            ],
        } as any);

        expect(result).toBe('Rua Luiz Fernando Campos, 68 - Jardim Elite');
    });

    it('supports the nested AssetsOnLots shape returned by the public auction query', () => {
        const result = getLotDisplayLocation({
            AssetsOnLots: [
                {
                    Asset: {
                        locationCity: 'Santa Rosa de Viterbo',
                        locationState: 'SP',
                    },
                },
            ],
        } as any);

        expect(result).toBe('Santa Rosa de Viterbo - SP');
    });
});

describe('getAuctionMinimumOffer', () => {
    it('returns the explicit auction initial offer when available', () => {
        const result = getAuctionMinimumOffer({ initialOffer: 9000 } as any);

        expect(result).toBe(9000);
    });

    it('derives the minimum offer from lots when the auction field is empty', () => {
        const result = getAuctionMinimumOffer({
            lots: [
                { price: 12232.2 },
                { price: 75000 },
            ],
        } as any);

        expect(result).toBe(12232.2);
    });
});
