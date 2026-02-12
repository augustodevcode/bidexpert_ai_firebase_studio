
// src/lib/zod-enums.ts

// This file centralizes Zod enum definitions to avoid circular dependencies
// and make them easily reusable across different schema files.

import { z } from 'zod';

export const auctionStatusValues: [string, ...string[]] = [
  'RASCUNHO', 'EM_PREPARACAO', 'EM_VALIDACAO', 'EM_AJUSTE', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'EM_PREGAO', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'
];
export const lotStatusValues: [string, ...string[]] = [
  'RASCUNHO', 'AGUARDANDO', 'EM_BREVE', 'ABERTO_PARA_LANCES', 'EM_PREGAO', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'RELISTADO', 'CANCELADO', 'RETIRADO'
];
export const bidStatusValues: [string, ...string[]] = [
  'ATIVO', 'CANCELADO', 'VENCEDOR', 'EXPIRADO'
];
export const userHabilitationStatusValues: [string, ...string[]] = [
  'PENDING_DOCUMENTS', 'PENDING_ANALYSIS', 'HABILITADO', 'REJECTED_DOCUMENTS', 'BLOCKED'
];
export const accountTypeValues: [string, ...string[]] = ['PHYSICAL', 'LEGAL', 'DIRECT_SALE_CONSIGNOR'];
export const paymentStatusValues: [string, ...string[]] = ['PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'REEMBOLSADO', 'CANCELADO'];
export const auctionTypeValues: [string, ...string[]] = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'];
export const auctionMethodValues: [string, ...string[]] = ['STANDARD', 'DUTCH', 'SILENT'];
export const auctionParticipationValues: [string, ...string[]] = ['ONLINE', 'PRESENCIAL', 'HIBRIDO'];
