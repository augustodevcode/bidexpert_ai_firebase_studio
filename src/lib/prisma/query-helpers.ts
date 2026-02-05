/**
 * Query Helpers para Compatibilidade MySQL/PostgreSQL
 * ====================================================
 * Este módulo fornece funções auxiliares para garantir que queries
 * funcionem corretamente em ambos os bancos de dados.
 * 
 * Principais diferenças tratadas:
 * - PostgreSQL é case-sensitive por padrão em comparações de strings
 * - MySQL é case-insensitive por padrão
 * 
 * Uso:
 * import { insensitiveContains, insensitiveStartsWith, getDatabaseType } from '@/lib/prisma/query-helpers';
 */

/**
 * Detecta o tipo de banco de dados a partir da DATABASE_URL
 */
export function getDatabaseType(): 'mysql' | 'postgresql' | 'unknown' {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (dbUrl.includes('mysql://')) {
    return 'mysql';
  }
  
  if (dbUrl.includes('postgres://') || dbUrl.includes('postgresql://')) {
    return 'postgresql';
  }
  
  return 'unknown';
}

/**
 * Verifica se o banco atual é MySQL
 */
export function isMySQL(): boolean {
  return getDatabaseType() === 'mysql';
}

/**
 * Verifica se o banco atual é PostgreSQL
 */
export function isPostgreSQL(): boolean {
  return getDatabaseType() === 'postgresql';
}

/**
 * Retorna configuração de 'contains' compatível com ambos os bancos
 * PostgreSQL requer mode: 'insensitive' para busca case-insensitive
 * MySQL já é case-insensitive por padrão
 * 
 * @param value - Valor a ser buscado
 * @returns Objeto de filtro Prisma compatível
 * 
 * @example
 * // Antes (incompatível):
 * where: { name: { contains: 'teste' } }
 * 
 * // Depois (compatível):
 * where: { name: insensitiveContains('teste') }
 */
export function insensitiveContains(value: string) {
  if (isPostgreSQL()) {
    return {
      contains: value,
      mode: 'insensitive' as const,
    };
  }
  
  // MySQL - case insensitive por padrão
  return {
    contains: value,
  };
}

/**
 * Retorna configuração de 'startsWith' compatível com ambos os bancos
 * 
 * @param value - Valor a ser buscado
 * @returns Objeto de filtro Prisma compatível
 * 
 * @example
 * where: { email: insensitiveStartsWith('admin') }
 */
export function insensitiveStartsWith(value: string) {
  if (isPostgreSQL()) {
    return {
      startsWith: value,
      mode: 'insensitive' as const,
    };
  }
  
  return {
    startsWith: value,
  };
}

/**
 * Retorna configuração de 'endsWith' compatível com ambos os bancos
 * 
 * @param value - Valor a ser buscado
 * @returns Objeto de filtro Prisma compatível
 * 
 * @example
 * where: { email: insensitiveEndsWith('@example.com') }
 */
export function insensitiveEndsWith(value: string) {
  if (isPostgreSQL()) {
    return {
      endsWith: value,
      mode: 'insensitive' as const,
    };
  }
  
  return {
    endsWith: value,
  };
}

/**
 * Retorna configuração de 'equals' compatível com ambos os bancos
 * Útil para comparações exatas case-insensitive
 * 
 * @param value - Valor a ser comparado
 * @returns Objeto de filtro Prisma compatível
 * 
 * @example
 * where: { slug: insensitiveEquals('demo') }
 */
export function insensitiveEquals(value: string) {
  if (isPostgreSQL()) {
    return {
      equals: value,
      mode: 'insensitive' as const,
    };
  }
  
  return {
    equals: value,
  };
}

/**
 * Log informativo sobre o tipo de banco detectado
 * Útil para debug e seeds
 */
export function logDatabaseType(): void {
  const dbType = getDatabaseType();
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Oculta a senha na URL para log seguro
  const safeUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  
  console.log(`\n🗄️  Database Type Detected: ${dbType.toUpperCase()}`);
  console.log(`📍 Connection: ${safeUrl.substring(0, 50)}...`);
  
  if (dbType === 'postgresql') {
    console.log('ℹ️  Using case-insensitive mode for string comparisons');
  } else if (dbType === 'mysql') {
    console.log('ℹ️  MySQL default collation handles case-insensitivity');
  } else {
    console.warn('⚠️  Unknown database type - defaulting to MySQL behavior');
  }
  console.log('');
}
