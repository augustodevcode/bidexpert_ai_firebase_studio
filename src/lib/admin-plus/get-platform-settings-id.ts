/**
 * @fileoverview Helper para obter o platformSettingsId a partir do tenantId.
 * Utilizado por todas as entidades singleton de configuração (Tier 2) no Admin Plus.
 */

import { prisma } from '@/lib/prisma';

/**
 * Retorna o id do PlatformSettings associado ao tenant.
 * Lança erro se não encontrado.
 */
export async function getPlatformSettingsId(tenantId: string): Promise<bigint> {
  const ps = await prisma.platformSettings.findUnique({
    where: { tenantId: BigInt(tenantId) },
    select: { id: true },
  });
  if (!ps) throw new Error('PlatformSettings não encontrada para este tenant. Execute o seed primeiro.');
  return ps.id;
}
