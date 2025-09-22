// src/lib/timezone.ts
import { format } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const SAO_PAULO_TZ = 'America/Sao_Paulo';

/**
 * Returns the current date and time in the São Paulo timezone.
 * @returns {Date} A Date object representing the current time in São Paulo.
 */
export function nowInSaoPaulo(): Date {
  return utcToZonedTime(new Date(), SAO_PAULO_TZ);
}

/**
 * Formats a given date into a string in the São Paulo timezone.
 * @param {Date | string} date - The date to format. Can be a Date object or an ISO string.
 * @param {string} formatStr - The format string (e.g., 'dd/MM/yyyy HH:mm:ss').
 * @returns {string} The formatted date string.
 */
export function formatInSaoPaulo(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    // Handle invalid dates gracefully
    return 'Data inválida';
  }
  const zonedDate = utcToZonedTime(dateObj, SAO_PAULO_TZ);
  return format(zonedDate, formatStr, { timeZone: SAO_PAULO_TZ, locale: ptBR });
}


/**
 * Converts a date from UTC to the São Paulo timezone.
 * @param {Date | string} date - The date to convert.
 * @returns {Date} A Date object representing the date in São Paulo timezone.
 */
export function convertUtcToSaoPaulo(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return utcToZonedTime(dateObj, SAO_PAULO_TZ);
}

/**
 * Converts a date from São Paulo timezone to UTC.
 * @param {Date | string} date - The date to convert.
 * @returns {Date} A Date object representing the date in UTC.
 */
export function convertSaoPauloToUtc(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return zonedTimeToUtc(dateObj, SAO_PAULO_TZ);
}

/**
 * Returns the current date in ISO 8601 format in São Paulo timezone.
 * @returns {string} The current date in ISO 8601 format (e.g., '2025-09-15T10:00:00-03:00').
 */
export function nowIsoSaoPaulo(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: SAO_PAULO_TZ, locale: ptBR });
}
