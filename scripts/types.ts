import { Prisma } from '@prisma/client';

export const AssetStatus = {
    CADASTRO: 'CADASTRO',
    DISPONIVEL: 'DISPONIVEL',
    LOTEADO: 'LOTEADO',
    VENDIDO: 'VENDIDO',
    REMOVIDO: 'REMOVIDO',
    INATIVADO: 'INATIVADO'
} as const;

export type AssetStatusType = typeof AssetStatus[keyof typeof AssetStatus];

export const LotStatus = {
    EM_BREVE: 'EM_BREVE',
    ABERTO: 'ABERTO',
    FECHADO: 'FECHADO',
    CANCELADO: 'CANCELADO',
    SUSPENSO: 'SUSPENSO',
    ARREMATADO: 'ARREMATADO',
    DESERTO: 'DESERTO',
    CONDICIONAL: 'CONDICIONAL'
} as const;

export type LotStatusType = typeof LotStatus[keyof typeof LotStatus];

export function createConnectId(id: string | number | bigint) {
    return { connect: { id: BigInt(id.toString()) } };
}

export function createConnectIds(ids: (string | number | bigint)[]) {
    return { connect: ids.map(id => ({ id: BigInt(id.toString()) })) };
}

export interface ServiceExtensions {
    getHighestBidForLot: (lotId: string | bigint) => Promise<any>;
    getAuctionsWithoutTenant: () => Promise<any[]>;
    getLotsForAuction: (auctionId: string | bigint) => Promise<any[]>;
}