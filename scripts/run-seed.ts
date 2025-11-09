import { prisma } from '../src/lib/prisma';
import { seedLogger } from './seed-logger';
import { SeedValidator } from './seed-validator';
import { TransactionManager } from './transaction-manager';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runSeed() {
    const startTime = Date.now();
    seedLogger.info('Iniciando processo completo de seed');

    try {
        // Limpar banco de dados
        seedLogger.info('Limpando banco de dados');
        await execAsync('npx prisma migrate reset --force');

        // Executar seed
        seedLogger.info('Executando seed principal');
        await execAsync('ts-node scripts/seed-data-extended-v3.ts');

        // Validar resultados
        const validator = new SeedValidator({
            users: 50,
            auctions: 10,
            lots: 100,
            sellers: 5,
            auctioneers: 3,
            assets: 200,
            categories: 3,
            cities: 2,
            states: 2
        });

        const isValid = await validator.validateAll();

        if (!isValid) {
            throw new Error('Validação do seed falhou');
        }

        const duration = Date.now() - startTime;
        seedLogger.info('Seed concluído com sucesso', { 
            duration: `${duration/1000} segundos`
        });

    } catch (error) {
        seedLogger.error('Falha no processo de seed', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runSeed();