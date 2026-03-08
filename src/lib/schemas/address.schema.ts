/**
 * @fileoverview Schema Zod compartilhado para campos de endereço.
 * 
 * Este módulo centraliza a definição dos campos de endereço usados em
 * todos os formulários do sistema (Auction, Seller, Auctioneer, Asset, Lot, User).
 * 
 * Dois modos são suportados:
 * - `relationalAddressFields`: para entidades com FK para City/State (Auction, Seller, Auctioneer, Asset, Lot)
 * - `textAddressFields`: para entidades com city/state como texto puro (User, BidderProfile)
 * 
 * @example
 * // No schema de um formulário:
 * import { relationalAddressFields, addressDefaults } from '@/lib/schemas/address.schema';
 * 
 * export const myFormSchema = z.object({
 *   name: z.string().min(1),
 *   // ...outros campos
 * }).merge(relationalAddressFields);
 * 
 * const defaultValues = {
 *   name: '',
 *   ...addressDefaults.relational,
 * };
 */

import * as z from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Campos de endereço com relação FK para City/State
// Usado por: Auction, Seller, Auctioneer, Asset, Lot
// ─────────────────────────────────────────────────────────────────────────────

export const relationalAddressFields = z.object({
  street: z.string().max(255, 'Logradouro não pode exceder 255 caracteres.').optional().nullable(),
  number: z.string().max(20, 'Número não pode exceder 20 caracteres.').optional().nullable(),
  complement: z.string().max(100, 'Complemento não pode exceder 100 caracteres.').optional().nullable(),
  neighborhood: z.string().max(100, 'Bairro não pode exceder 100 caracteres.').optional().nullable(),
  zipCode: z.string().max(10, 'CEP não pode exceder 10 caracteres.').optional().nullable(),
  cityId: z.string().optional().nullable(),
  stateId: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  addressLink: z.string().max(500, 'Link do endereço não pode exceder 500 caracteres.').optional().nullable(),
});

/** Tipo inferido do schema relacional de endereço */
export type RelationalAddressFields = z.infer<typeof relationalAddressFields>;

// ─────────────────────────────────────────────────────────────────────────────
// Campos de endereço com city/state como texto puro
// Usado por: User, BidderProfile, Registration, Profile
// ─────────────────────────────────────────────────────────────────────────────

export const textAddressFields = z.object({
  street: z.string().max(255, 'Logradouro não pode exceder 255 caracteres.').optional().nullable(),
  number: z.string().max(20, 'Número não pode exceder 20 caracteres.').optional().nullable(),
  complement: z.string().max(100, 'Complemento não pode exceder 100 caracteres.').optional().nullable(),
  neighborhood: z.string().max(100, 'Bairro não pode exceder 100 caracteres.').optional().nullable(),
  zipCode: z.string().max(10, 'CEP não pode exceder 10 caracteres.').optional().nullable(),
  city: z.string().max(100, 'Cidade não pode exceder 100 caracteres.').optional().nullable(),
  state: z.string().max(2, 'Estado deve ter no máximo 2 caracteres (UF).').optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  addressLink: z.string().max(500, 'Link do endereço não pode exceder 500 caracteres.').optional().nullable(),
});

/** Tipo inferido do schema textual de endereço */
export type TextAddressFields = z.infer<typeof textAddressFields>;

// ─────────────────────────────────────────────────────────────────────────────
// Valores padrão para react-hook-form
// ─────────────────────────────────────────────────────────────────────────────

export const addressDefaults = {
  /** Defaults para modo relacional (FK para City/State) */
  relational: {
    street: null,
    number: null,
    complement: null,
    neighborhood: null,
    zipCode: null,
    cityId: null,
    stateId: null,
    latitude: null,
    longitude: null,
    addressLink: null,
  } satisfies RelationalAddressFields,

  /** Defaults para modo texto (city/state como string) */
  text: {
    street: null,
    number: null,
    complement: null,
    neighborhood: null,
    zipCode: null,
    city: null,
    state: null,
    latitude: null,
    longitude: null,
    addressLink: null,
  } satisfies TextAddressFields,
};

// ─────────────────────────────────────────────────────────────────────────────
// Nomes dos campos de endereço (útil para destructuring dinâmico)
// ─────────────────────────────────────────────────────────────────────────────

/** Lista de todos os nomes de campos de endereço no modo relacional */
export const RELATIONAL_ADDRESS_FIELD_NAMES = [
  'street', 'number', 'complement', 'neighborhood', 'zipCode',
  'cityId', 'stateId', 'latitude', 'longitude', 'addressLink',
] as const;

/** Lista de todos os nomes de campos de endereço no modo texto */
export const TEXT_ADDRESS_FIELD_NAMES = [
  'street', 'number', 'complement', 'neighborhood', 'zipCode',
  'city', 'state', 'latitude', 'longitude', 'addressLink',
] as const;
