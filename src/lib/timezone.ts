// src/lib/timezone.ts
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SAO_PAULO_TZ = 'America/Sao_Paulo';

export function nowInSaoPaulo(): Date {
  return new Date();
}

export function formatInSaoPaulo(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  return format(dateObj, formatStr, { locale: ptBR });
}

export function convertUtcToSaoPaulo(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

export function convertSaoPauloToUtc(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

export function nowIsoSaoPaulo(): string {
  return new Date().toISOString();
}