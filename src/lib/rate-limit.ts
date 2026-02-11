/**
 * @fileoverview Rate limiter in-memory para proteger endpoints críticos (bidding, auth)
 * contra ataques de bots. Implementa sliding window com limite configurável por IP.
 * 
 * GAP-FIX: Proteção contra ataques de força bruta em endpoints de lance e autenticação.
 * Sem rate limiting, bots podem enviar centenas de requisições por segundo.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpa entradas expiradas periodicamente (a cada 60s)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

export interface RateLimitConfig {
  /** Janela de tempo em milissegundos (default: 60000 = 1 min) */
  windowMs?: number;
  /** Máximo de requisições por janela (default: 100) */
  maxRequests?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterMs?: number;
}

/**
 * Verifica se uma requisição está dentro do rate limit.
 * 
 * @param identifier - Identificador único (geralmente IP + endpoint)
 * @param config - Configuração de limites
 * @returns Resultado do rate limit check
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { windowMs = 60000, maxRequests = 100 } = config;
  const now = Date.now();

  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterMs: entry.resetTime - now,
    };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

/** Presets de rate limiting por tipo de endpoint */
export const RATE_LIMIT_PRESETS = {
  /** Endpoints de lance: 30 req/min por IP */
  bidding: { windowMs: 60000, maxRequests: 30 },
  /** Endpoints de autenticação: 10 req/min por IP */
  auth: { windowMs: 60000, maxRequests: 10 },
  /** API geral: 100 req/min por IP */
  general: { windowMs: 60000, maxRequests: 100 },
  /** Busca: 60 req/min por IP */
  search: { windowMs: 60000, maxRequests: 60 },
} as const;
