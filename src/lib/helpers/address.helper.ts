/**
 * @fileoverview Helper de persistência de endereço para camada de serviço.
 * 
 * Centraliza toda a lógica de transformação de dados de endereço vindos
 * dos formulários (Zod-validated) para o formato esperado pelo Prisma.
 * 
 * Resolve problemas críticos identificados:
 * - Campos individuais (street, number, complement, neighborhood) sendo silenciosamente descartados
 * - latitude/longitude sendo removidos da persistência por destructuring incorreto
 * - Geração duplicada de fullAddress em múltiplos services
 * - Lookup duplicado de city name / state UF a partir de IDs
 * - Falta de addressLink (Google Maps URL)
 * 
 * @example
 * // Numa service layer:
 * import { prepareAddressPrismaData, extractAddressFields } from '@/lib/helpers/address.helper';
 * 
 * async createSeller(data: SellerFormData) {
 *   const { addressFields, remainingData } = extractAddressFields(data);
 *   const addressData = await prepareAddressPrismaData(prisma, addressFields, { 
 *     mode: 'relational',
 *     generateFullAddress: true,
 *   });
 *   
 *   await prisma.seller.create({
 *     data: {
 *       ...remainingData,
 *       ...addressData,
 *       Tenant: { connect: { id: BigInt(tenantId) } },
 *     },
 *   });
 * }
 */

import type { PrismaClient } from '@prisma/client';
import { RELATIONAL_ADDRESS_FIELD_NAMES, TEXT_ADDRESS_FIELD_NAMES } from '@/lib/schemas/address.schema';
import type { RelationalAddressFields, TextAddressFields } from '@/lib/schemas/address.schema';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressPersistenceOptions {
  /** 
   * Modo de persistência:
   * - 'relational': usa cityId/stateId (BigInt FK) + resolve city name e state UF
   * - 'text': usa city/state como strings diretas
   */
  mode: 'relational' | 'text';

  /** 
   * Se true, concatena street + number + complement + neighborhood + zipCode
   * e salva no campo `address`.
   * @default true 
   */
  generateFullAddress?: boolean;

  /** 
   * Se true, gera URL do Google Maps a partir de lat/lng e salva em `addressLink`.
   * @default true 
   */
  generateAddressLink?: boolean;

  /**
   * Se true, faz lookup de city name e state UF a partir dos IDs FK.
   * Útil para models que armazenam tanto FK quanto texto (Seller, Auctioneer).
   * @default false
   */
  resolveNames?: boolean;

  /**
   * Se true, usa City/State connect (Prisma relation) ao invés de cityId/stateId direto.
   * Útil para models que definem relação explícita (Auction, Lot).
   * @default false
   */
  useRelationConnect?: boolean;
}

export interface PreparedAddressData {
  /** Endereço completo concatenado */
  address?: string;
  /** Link do Google Maps */
  addressLink?: string | null;
  /** Campos individuais de endereço */
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  zipCode?: string | null;
  /** Coordenadas geográficas */
  latitude?: number | null;
  longitude?: number | null;
  /** Para modo relational com resolveNames */
  city?: string | null;
  state?: string | null;
  /** Para modo relational com useRelationConnect */
  City?: { connect: { id: bigint } } | undefined;
  State?: { connect: { id: bigint } } | undefined;
  /** Para modo relational sem useRelationConnect */
  cityId?: bigint | null;
  stateId?: bigint | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções Públicas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrai os campos de endereço de um objeto de dados e retorna separadamente.
 * Evita que os campos "contaminem" o restOfData por spread.
 * 
 * @param data Dados do formulário com campos de endereço misturados
 * @param mode 'relational' ou 'text' determina quais campos extrair
 * @returns { addressFields, remainingData }
 */
export function extractAddressFields<T extends Record<string, any>>(
  data: T,
  mode: 'relational' | 'text' = 'relational'
): {
  addressFields: Partial<RelationalAddressFields | TextAddressFields>;
  remainingData: Omit<T, typeof RELATIONAL_ADDRESS_FIELD_NAMES[number] | typeof TEXT_ADDRESS_FIELD_NAMES[number]>;
} {
  const fieldNames = mode === 'relational' ? RELATIONAL_ADDRESS_FIELD_NAMES : TEXT_ADDRESS_FIELD_NAMES;
  const addressFields: Record<string, any> = {};
  const remainingData: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if ((fieldNames as readonly string[]).includes(key)) {
      addressFields[key] = value;
    } else {
      remainingData[key] = value;
    }
  }

  return {
    addressFields: addressFields as Partial<RelationalAddressFields | TextAddressFields>,
    remainingData: remainingData as any,
  };
}

/**
 * Constrói o endereço completo concatenado a partir dos campos individuais.
 * 
 * @param fields Campos de endereço individuais
 * @returns String com endereço formatado ou null se todos os campos estiverem vazios
 */
export function buildFullAddress(fields: {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  zipCode?: string | null;
}): string | null {
  const parts = [
    fields.street,
    fields.number,
    fields.complement,
    fields.neighborhood,
  ].filter(Boolean);

  if (fields.zipCode) {
    parts.push(`CEP: ${fields.zipCode}`);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Gera link do Google Maps a partir de coordenadas geográficas.
 * 
 * @param latitude Latitude decimal
 * @param longitude Longitude decimal
 * @returns URL do Google Maps ou null se coordenadas faltantes
 */
export function buildAddressLink(
  latitude?: number | null,
  longitude?: number | null
): string | null {
  if (latitude == null || longitude == null) return null;
  if (isNaN(latitude) || isNaN(longitude)) return null;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Resolve nomes de cidade e estado a partir dos IDs FK.
 * 
 * @param prisma Instância do Prisma Client
 * @param cityId ID da cidade (string ou BigInt)
 * @param stateId ID do estado (string ou BigInt)
 * @returns { cityName, stateUf } ou nulls se não encontrados
 */
export async function resolveAddressNames(
  prisma: PrismaClient | any,
  cityId?: string | bigint | null,
  stateId?: string | bigint | null
): Promise<{ cityName: string | null; stateUf: string | null }> {
  let cityName: string | null = null;
  let stateUf: string | null = null;

  if (cityId) {
    const city = await prisma.city.findUnique({
      where: { id: BigInt(cityId) },
      select: { name: true },
    });
    if (city) cityName = city.name;
  }

  if (stateId) {
    const state = await prisma.state.findUnique({
      where: { id: BigInt(stateId) },
      select: { uf: true },
    });
    if (state) stateUf = state.uf;
  }

  return { cityName, stateUf };
}

/**
 * Prepara os dados de endereço para persistência via Prisma.
 * Centraliza TODA a lógica de transformação form → database.
 * 
 * @param prisma Instância do Prisma Client (necessário para resolveNames)
 * @param addressFields Campos de endereço vindos do formulário (Zod-validated)
 * @param options Opções de persistência
 * @returns Objeto pronto para spread no prisma.create() ou prisma.update()
 */
export async function prepareAddressPrismaData(
  prisma: PrismaClient | any,
  addressFields: Partial<RelationalAddressFields & TextAddressFields>,
  options: AddressPersistenceOptions
): Promise<PreparedAddressData> {
  const {
    mode,
    generateFullAddress = true,
    generateAddressLink = true,
    resolveNames = false,
    useRelationConnect = false,
  } = options;

  const result: PreparedAddressData = {};

  // ── Campos individuais de endereço ─────────────────────────────────────
  if (addressFields.street !== undefined) result.street = addressFields.street;
  if (addressFields.number !== undefined) result.number = addressFields.number;
  if (addressFields.complement !== undefined) result.complement = addressFields.complement;
  if (addressFields.neighborhood !== undefined) result.neighborhood = addressFields.neighborhood;
  if (addressFields.zipCode !== undefined) result.zipCode = addressFields.zipCode;

  // ── Coordenadas geográficas ────────────────────────────────────────────
  if (addressFields.latitude !== undefined) result.latitude = addressFields.latitude;
  if (addressFields.longitude !== undefined) result.longitude = addressFields.longitude;

  // ── Endereço completo concatenado ──────────────────────────────────────
  if (generateFullAddress) {
    const fullAddress = buildFullAddress(addressFields);
    if (fullAddress) {
      result.address = fullAddress;
    }
  }

  // ── Link do Google Maps ────────────────────────────────────────────────
  if (generateAddressLink) {
    result.addressLink = buildAddressLink(
      addressFields.latitude,
      addressFields.longitude
    );
  }

  // ── City/State handling ────────────────────────────────────────────────
  if (mode === 'relational') {
    const relFields = addressFields as Partial<RelationalAddressFields>;

    if (useRelationConnect) {
      // Modo com Prisma relation connect (Auction, Lot)
      result.City = relFields.cityId ? { connect: { id: BigInt(relFields.cityId) } } : undefined;
      result.State = relFields.stateId ? { connect: { id: BigInt(relFields.stateId) } } : undefined;
    } else {
      // Modo direto (fallback)
      if (relFields.cityId !== undefined) {
        result.cityId = relFields.cityId ? BigInt(relFields.cityId) : null;
      }
      if (relFields.stateId !== undefined) {
        result.stateId = relFields.stateId ? BigInt(relFields.stateId) : null;
      }
    }

    // Resolve nomes textuais (para models como Seller/Auctioneer que guardam texto)
    if (resolveNames) {
      const { cityName, stateUf } = await resolveAddressNames(
        prisma,
        relFields.cityId,
        relFields.stateId
      );
      if (cityName !== null) result.city = cityName;
      if (stateUf !== null) result.state = stateUf;
    }
  } else {
    // Modo text (User, BidderProfile)
    const txtFields = addressFields as Partial<TextAddressFields>;
    if (txtFields.city !== undefined) result.city = txtFields.city;
    if (txtFields.state !== undefined) result.state = txtFields.state;
  }

  return result;
}
