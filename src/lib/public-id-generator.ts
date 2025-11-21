// src/lib/public-id-generator.ts
/**
 * @fileoverview Utilitário centralizado para geração de publicIds usando máscaras configuráveis.
 * Suporta variáveis de data, contadores auto-incrementais e texto estático.
 * 
 * Formato de Máscara Suportado:
 * - {YYYY} - Ano com 4 dígitos (ex: 2024)
 * - {YY}   - Ano com 2 dígitos (ex: 24)
 * - {MM}   - Mês com 2 dígitos (ex: 01-12)
 * - {DD}   - Dia com 2 dígitos (ex: 01-31)
 * - {####} - Contador auto-incremental com 4 dígitos (ex: 0001, 0002, ...)
 * - {###}  - Contador auto-incremental com 3 dígitos (ex: 001, 002, ...)
 * - {#####} - Contador auto-incremental com 5 dígitos (ex: 00001, 00002, ...)
 * - Texto estático - Qualquer outro texto permanece como está
 * 
 * Exemplos:
 * - "AUC-{YYYY}-{####}" → "AUC-2024-0001"
 * - "LOTE-{YY}{MM}-{#####}" → "LOTE-2411-00001"
 * - "COM-{YYYY}-{###}" → "COM-2024-001"
 */

import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export type EntityType = 
  | 'auction' 
  | 'lot' 
  | 'asset' 
  | 'auctioneer' 
  | 'seller' 
  | 'user'
  | 'category'
  | 'subcategory'
  | 'judicialProcess'
  | 'directSaleOffer';

/**
 * Fallbacks padrão para quando não houver máscara configurada
 */
const DEFAULT_PREFIXES: Record<EntityType, string> = {
  auction: 'AUC',
  lot: 'LOTE',
  asset: 'ASSET',
  auctioneer: 'LEILOE',
  seller: 'COM',
  user: 'USER',
  category: 'CAT',
  subcategory: 'SUBCAT',
  judicialProcess: 'PROC',
  directSaleOffer: 'DSO',
};

/**
 * Obtém o próximo valor do contador para um tipo de entidade em um tenant
 */
async function getNextCounterValue(tenantId: bigint, entityType: EntityType): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    // Tenta encontrar o contador existente
    let counter = await tx.counterState.findUnique({
      where: {
        tenantId_entityType: {
          tenantId,
          entityType,
        },
      },
    });

    // Se não existir, cria um novo começando em 1
    if (!counter) {
      counter = await tx.counterState.create({
        data: {
          tenantId,
          entityType,
          currentValue: 1,
        },
      });
      return 1;
    }

    // Incrementa o contador existente
    const updatedCounter = await tx.counterState.update({
      where: {
        tenantId_entityType: {
          tenantId,
          entityType,
        },
      },
      data: {
        currentValue: { increment: 1 },
      },
    });

    return updatedCounter.currentValue;
  });

  return result;
}

/**
 * Aplica uma máscara para gerar um publicId
 */
async function applyMask(
  mask: string,
  tenantId: bigint,
  entityType: EntityType
): Promise<string> {
  const now = new Date();
  let result = mask;

  // Substitui variáveis de data
  result = result.replace(/{YYYY}/g, now.getFullYear().toString());
  result = result.replace(/{YY}/g, now.getFullYear().toString().slice(-2));
  result = result.replace(/{MM}/g, String(now.getMonth() + 1).padStart(2, '0'));
  result = result.replace(/{DD}/g, String(now.getDate()).padStart(2, '0'));

  // Detecta e substitui contadores auto-incrementais
  const counterPattern = /{(#+)}/g;
  const counterMatches = mask.match(counterPattern);

  if (counterMatches && counterMatches.length > 0) {
    // Obtém o próximo valor do contador (apenas uma vez por chamada)
    const counterValue = await getNextCounterValue(tenantId, entityType);
    
    // Substitui todos os padrões de contador pelo mesmo valor
    counterMatches.forEach((match) => {
      const digits = match.length - 2; // Remove { e }
      const paddedValue = String(counterValue).padStart(digits, '0');
      result = result.replace(match, paddedValue);
    });
  }

  return result;
}

/**
 * Obtém a máscara configurada para um tipo de entidade
 */
async function getMaskForEntity(
  tenantId: bigint,
  entityType: EntityType
): Promise<string | null> {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { tenantId },
      include: { platformPublicIdMasks: true },
    });

    if (!settings?.platformPublicIdMasks) {
      return null;
    }

    const masks = settings.platformPublicIdMasks;
    
    switch (entityType) {
      case 'auction':
        return masks.auctionCodeMask;
      case 'lot':
        return masks.lotCodeMask;
      case 'asset':
        return masks.assetCodeMask;
      case 'auctioneer':
        return masks.auctioneerCodeMask;
      case 'seller':
        return masks.sellerCodeMask;
      case 'user':
        return masks.userCodeMask;
      case 'category':
        return masks.categoryCodeMask;
      case 'subcategory':
        return masks.subcategoryCodeMask;
      default:
        return null;
    }
  } catch (error) {
    console.error(`[PublicIdGenerator] Erro ao obter máscara para ${entityType}:`, error);
    return null;
  }
}

/**
 * Gera um publicId usando fallback UUID
 */
function generateFallbackPublicId(entityType: EntityType): string {
  const prefix = DEFAULT_PREFIXES[entityType] || 'ENTITY';
  return `${prefix}-${uuidv4()}`;
}

/**
 * Função principal para gerar um publicId
 * 
 * @param tenantId - ID do tenant
 * @param entityType - Tipo da entidade
 * @returns publicId gerado
 */
export async function generatePublicId(
  tenantId: bigint | string | number,
  entityType: EntityType
): Promise<string> {
  const tenantIdBigInt = BigInt(tenantId);

  try {
    // Obtém a máscara configurada
    const mask = await getMaskForEntity(tenantIdBigInt, entityType);

    // Se não houver máscara, usa fallback UUID
    if (!mask || mask.trim() === '') {
      console.warn(`[PublicIdGenerator] Nenhuma máscara configurada para ${entityType} no tenant ${tenantId}. Usando UUID.`);
      return generateFallbackPublicId(entityType);
    }

    // Aplica a máscara
    const publicId = await applyMask(mask, tenantIdBigInt, entityType);
    
    console.log(`[PublicIdGenerator] Gerado publicId: ${publicId} para ${entityType}`);
    return publicId;

  } catch (error) {
    console.error(`[PublicIdGenerator] Erro ao gerar publicId para ${entityType}:`, error);
    // Em caso de erro, usa fallback UUID
    return generateFallbackPublicId(entityType);
  }
}

/**
 * Valida se uma máscara é válida
 * 
 * @param mask - Máscara a ser validada
 * @returns true se válida, false caso contrário
 */
export function validateMask(mask: string): boolean {
  if (!mask || mask.trim() === '') {
    return false;
  }

  // Padrões válidos
  const validPatterns = [
    /{YYYY}/,
    /{YY}/,
    /{MM}/,
    /{DD}/,
    /{#+}/,
  ];

  // Verifica se contém pelo menos um padrão válido ou é apenas texto estático
  const hasValidPattern = validPatterns.some(pattern => pattern.test(mask));
  
  // Se não tem padrão, ainda pode ser válido se for texto estático não vazio
  return hasValidPattern || mask.trim().length > 0;
}

/**
 * Reseta o contador para um tipo de entidade (útil para testes)
 * 
 * @param tenantId - ID do tenant
 * @param entityType - Tipo da entidade
 */
export async function resetCounter(
  tenantId: bigint | string | number,
  entityType: EntityType
): Promise<void> {
  const tenantIdBigInt = BigInt(tenantId);
  
  await prisma.counterState.upsert({
    where: {
      tenantId_entityType: {
        tenantId: tenantIdBigInt,
        entityType,
      },
    },
    update: {
      currentValue: 0,
    },
    create: {
      tenantId: tenantIdBigInt,
      entityType,
      currentValue: 0,
    },
  });
}
