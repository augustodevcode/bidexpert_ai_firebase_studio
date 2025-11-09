import { PrismaClient } from '@prisma/client';
import { seedLogger } from './seed-logger';

export class TransactionManager {
    constructor(private prisma: PrismaClient) {}

    async executeInTransaction<T>(
        operation: string,
        callback: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
    ): Promise<T> {
        const startTime = Date.now();
        
        try {
            const result = await this.prisma.$transaction(callback, {
                maxWait: 10000, // 10s máximo de espera
                timeout: 60000  // 60s timeout da transação
            });

            const duration = Date.now() - startTime;
            seedLogger.metric(operation, duration, true);
            return result;

        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            seedLogger.metric(operation, duration, false, { error: errorMessage });
            seedLogger.error(`Falha na transação: ${operation}`, { message: errorMessage });
            throw error;
        }
    }

    async withRetry<T>(
        operation: string,
        callback: () => Promise<T>,
        maxRetries = 3,
        delayMs = 1000
    ): Promise<T> {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await callback();
            } catch (error) {
                lastError = error;
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                seedLogger.warn(
                    operation,
                    `Tentativa ${attempt} de ${maxRetries} falhou`,
                    { error: errorMessage }
                );

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
                }
            }
        }

        seedLogger.error(
            operation,
            `Todas as ${maxRetries} tentativas falharam`
        );
        throw lastError;
    }
}