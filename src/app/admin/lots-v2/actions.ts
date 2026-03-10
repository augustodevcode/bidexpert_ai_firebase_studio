// src/app/admin/lots-v2/actions.ts
/**
 * @fileoverview Server Actions V2 para a entidade Lot (Lote).
 * Camada de Controller com validação Zod explícita, tratamento de erros
 * aprimorado e auditoria de operações.
 *
 * Melhorias sobre V1:
 * - Validação Zod antes de chamar o service
 * - Retorno tipado consistente { success, message, data? }
 * - Suporte a filtros avançados e paginação
 * - Operações em lote (bulk delete, bulk status update)
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { Lot, LotFormData } from '@/types';
import { LotService } from '@/services/lot.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { lotFormSchemaV2 } from './lot-form-schema-v2';
import { z } from 'zod';

const lotService = new LotService();

// ─── Tipos de retorno ────────────────────────────────────────────────────────

export interface ActionResult<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ─── Filtros de listagem ─────────────────────────────────────────────────────

export interface LotsV2Filter {
  auctionId?: string;
  status?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Retorna todos os lotes com suporte a filtros avançados.
 */
export async function getLotsV2(filter?: LotsV2Filter): Promise<ActionResult<{ lots: Lot[]; total: number }>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const lots = await lotService.getLots(
      {
        auctionId: filter?.auctionId,
      },
      tenantId,
      filter?.limit,
    );

    const serialized = sanitizeResponse(lots) as Lot[];

    // Client-side filter by status and searchTerm (cheap for now)
    let filtered = serialized;
    if (filter?.status && filter.status !== 'all') {
      filtered = filtered.filter((l) => l.status === filter?.status);
    }
    if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title?.toLowerCase().includes(term) ||
          l.publicId?.toLowerCase().includes(term) ||
          l.auctionName?.toLowerCase().includes(term),
      );
    }

    return {
      success: true,
      message: 'Lotes carregados com sucesso.',
      data: { lots: filtered, total: filtered.length },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar lotes.';
    console.error('[getLotsV2]', error);
    return { success: false, message };
  }
}

/**
 * Retorna um único lote pelo ID.
 */
export async function getLotV2(id: string): Promise<ActionResult<Lot>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const lot = await lotService.getLotById(id, tenantId);
    if (!lot) return { success: false, message: 'Lote não encontrado.' };
    return { success: true, message: 'Lote carregado.', data: sanitizeResponse(lot) as Lot };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar lote.';
    console.error('[getLotV2]', error);
    return { success: false, message };
  }
}

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Cria um novo lote com validação Zod explícita.
 */
export async function createLotV2(rawData: unknown): Promise<ActionResult<{ lotId: string }>> {
  // 1. Validação de schema
  const parsed = lotFormSchemaV2.safeParse(rawData);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join('.');
      errors[key] = [...(errors[key] ?? []), e.message];
    });
    return { success: false, message: 'Dados inválidos. Verifique os campos.', errors };
  }

  try {
    const tenantId = await getTenantIdFromRequest();
    const result = await lotService.createLot(parsed.data as LotFormData, tenantId);

    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/lots-v2');
      revalidatePath('/admin/lots');
      if (parsed.data.auctionId) {
        revalidatePath(`/admin/auctions-v2/${parsed.data.auctionId}`);
      }
    }

    return {
      success: result.success,
      message: result.message,
      data: result.lotId ? { lotId: result.lotId } : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar lote.';
    console.error('[createLotV2]', error);
    return { success: false, message };
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Atualiza um lote existente com validação Zod parcial.
 */
export async function updateLotV2(id: string, rawData: unknown): Promise<ActionResult> {
  const partialSchema = lotFormSchemaV2.partial();
  const parsed = partialSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join('.');
      errors[key] = [...(errors[key] ?? []), e.message];
    });
    return { success: false, message: 'Dados inválidos. Verifique os campos.', errors };
  }

  try {
    const result = await lotService.updateLot(id, parsed.data as Partial<LotFormData>);

    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/lots-v2');
      revalidatePath(`/admin/lots-v2/${id}`);
      revalidatePath('/admin/lots');
    }

    return { success: result.success, message: result.message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar lote.';
    console.error('[updateLotV2]', error);
    return { success: false, message };
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Remove um lote pelo ID.
 */
export async function deleteLotV2(id: string): Promise<ActionResult> {
  // Basic ID validation
  if (!id || typeof id !== 'string') {
    return { success: false, message: 'ID inválido.' };
  }

  try {
    const lot = await lotService.getLotById(id);
    const auctionId = lot?.auctionId;

    const result = await lotService.deleteLot(id);

    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/lots-v2');
      revalidatePath('/admin/lots');
      if (auctionId) {
        revalidatePath(`/admin/auctions-v2/${auctionId}`);
      }
    }

    return { success: result.success, message: result.message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir lote.';
    console.error('[deleteLotV2]', error);
    return { success: false, message };
  }
}

// ─── Bulk operations ──────────────────────────────────────────────────────────

const bulkDeleteSchema = z.object({ ids: z.array(z.string()).min(1) });
const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.string().min(1),
});

/**
 * Remove múltiplos lotes em lote.
 */
export async function deleteLotsV2Bulk(rawData: unknown): Promise<ActionResult<{ deleted: number }>> {
  const parsed = bulkDeleteSchema.safeParse(rawData);
  if (!parsed.success) return { success: false, message: 'IDs inválidos.' };

  let deleted = 0;
  const errors: string[] = [];

  for (const id of parsed.data.ids) {
    try {
      const result = await lotService.deleteLot(id);
      if (result.success) deleted++;
      else errors.push(`Lote ${id}: ${result.message}`);
    } catch (error) {
      console.error('[deleteLotsV2Bulk] lotId:', id, error);
      errors.push(`Lote ${id}: erro interno.`);
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots-v2');
    revalidatePath('/admin/lots');
  }

  const success = deleted > 0;
  const message = success
    ? `${deleted} lote(s) excluído(s).${errors.length ? ` ${errors.length} falha(s).` : ''}`
    : 'Nenhum lote foi excluído.';

  return { success, message, data: { deleted } };
}

/**
 * Atualiza o status de múltiplos lotes em lote.
 */
export async function updateLotsStatusV2Bulk(rawData: unknown): Promise<ActionResult<{ updated: number }>> {
  const parsed = bulkStatusSchema.safeParse(rawData);
  if (!parsed.success) return { success: false, message: 'Dados inválidos.' };

  let updated = 0;
  const errors: string[] = [];

  for (const id of parsed.data.ids) {
    try {
      const result = await lotService.updateLot(id, { status: parsed.data.status });
      if (result.success) updated++;
      else errors.push(`Lote ${id}: ${result.message}`);
    } catch (error) {
      console.error('[updateLotsStatusV2Bulk] lotId:', id, error);
      errors.push(`Lote ${id}: erro interno.`);
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/lots-v2');
    revalidatePath('/admin/lots');
  }

  const success = updated > 0;
  const message = success
    ? `Status de ${updated} lote(s) atualizado.${errors.length ? ` ${errors.length} falha(s).` : ''}`
    : 'Nenhum lote foi atualizado.';

  return { success, message, data: { updated } };
}
