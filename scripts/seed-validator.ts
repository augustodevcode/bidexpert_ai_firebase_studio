import { prisma } from '../src/lib/prisma';
import { seedLogger } from './seed-logger';

export interface SeedValidationConfig {
    users: number;
    auctions: number;
    lots: number;
    sellers: number;
    auctioneers: number;
    assets: number;
    categories: number;
    cities: number;
    states: number;
}

export class SeedValidator {
    constructor(private expectedCounts: SeedValidationConfig) {}

    async validateAll(): Promise<boolean> {
        try {
            seedLogger.info('Iniciando validação do seed');

            const startTime = Date.now();
            const results = await this.getAllCounts();
            const duration = Date.now() - startTime;

            const validationResults = this.compareResults(results);
            
            seedLogger.metric('seed-validation', duration, validationResults.success, {
                expected: this.expectedCounts,
                actual: results,
                failures: validationResults.failures
            });

            if (!validationResults.success) {
                seedLogger.error('Validação do seed falhou', {
                    failures: validationResults.failures
                });
                return false;
            }

            seedLogger.info('Validação do seed concluída com sucesso', results);
            return true;

        } catch (error) {
            seedLogger.error('Erro durante validação do seed', error);
            return false;
        }
    }

    private async getAllCounts() {
        return {
            users: await prisma.user.count(),
            auctions: await prisma.auction.count(),
            lots: await prisma.lot.count(),
            sellers: await prisma.seller.count(),
            auctioneers: await prisma.auctioneer.count(),
            assets: await prisma.asset.count(),
            categories: await prisma.lotCategory.count(),
            cities: await prisma.city.count(),
            states: await prisma.state.count()
        };
    }

    private compareResults(actual: Record<string, number>) {
        const failures: string[] = [];

        for (const [key, expectedValue] of Object.entries(this.expectedCounts)) {
            const actualValue = actual[key];
            if (actualValue < expectedValue) {
                failures.push(
                    `${key}: esperado ${expectedValue}, encontrado ${actualValue}`
                );
            }
        }

        return {
            success: failures.length === 0,
            failures
        };
    }
}