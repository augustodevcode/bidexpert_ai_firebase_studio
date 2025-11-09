import { Prisma } from '@prisma/client';

export function toBigInt(value: string | number | bigint): bigint {
    return BigInt(value.toString());
}

export function toBigIntOrUndefined(value: string | number | bigint | undefined | null): bigint | undefined {
    if (value === undefined || value === null) return undefined;
    return toBigInt(value);
}

export type AssetStatus = 'DISPONIVEL' | 'EM_LOTE' | 'VENDIDO' | 'RETIRADO' | 'PENDENTE';

export function toAssetStatus(status: string): AssetStatus {
    if (!['DISPONIVEL', 'EM_LOTE', 'VENDIDO', 'RETIRADO', 'PENDENTE'].includes(status)) {
        throw new Error(`Status inválido: ${status}`);
    }
    return status as AssetStatus;
}

export const prismaHelpers = {
    connect: {
        byId: (id: string | number | bigint) => ({ 
            connect: { id: toBigInt(id) } 
        }),
        byIds: (ids: (string | number | bigint)[]) => ({
            connect: ids.map(id => ({ id: toBigInt(id) }))
        })
    }
};