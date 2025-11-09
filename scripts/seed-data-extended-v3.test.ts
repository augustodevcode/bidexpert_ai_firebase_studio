import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { seedLogger } from './seed-logger';
import { SeedValidator } from './seed-validator';
import { TransactionManager } from './transaction-manager';

describe('Seed Data Extended V3', () => {
    let validator: SeedValidator;
    let transactionManager: TransactionManager;

    beforeAll(() => {
        validator = new SeedValidator({
            users: 1, // números menores para teste
            auctions: 1,
            lots: 1,
            sellers: 1,
            auctioneers: 1,
            assets: 1,
            categories: 1,
            cities: 1,
            states: 1
        });
        transactionManager = new TransactionManager(prisma);
    });

    it('deve criar registros básicos corretamente', async () => {
        const startTime = Date.now();

        try {
            // Teste de criação de estado
            const stateResult = await transactionManager.executeInTransaction(
                'create-test-state',
                async (tx) => {
                    return await tx.state.create({
                        data: {
                            name: 'Estado Teste',
                            uf: 'TS',
                            slug: 'estado-teste'
                        }
                    });
                }
            );

            expect(stateResult).toBeDefined();
            expect(stateResult.uf).toBe('TS');

            // Teste de criação de cidade
            const cityResult = await transactionManager.executeInTransaction(
                'create-test-city',
                async (tx) => {
                    return await tx.city.create({
                        data: {
                            name: 'Cidade Teste',
                            state: {
                                connect: {
                                    id: stateResult.id
                                }
                            }
                        }
                    });
                }
            );

            expect(cityResult).toBeDefined();
            expect(cityResult.name).toBe('Cidade Teste');

        } catch (error) {
            seedLogger.error('Falha nos testes de seed', error);
            throw error;
        } finally {
            const duration = Date.now() - startTime;
            seedLogger.metric('seed-test-basic-records', duration, true);
        }
    });

    it('deve validar contagens corretamente', async () => {
        const isValid = await validator.validateAll();
        expect(isValid).toBe(true);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
});