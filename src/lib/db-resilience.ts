/**
 * @fileoverview Utilitários de resiliência para falhas de banco de dados.
 *
 * Centraliza a detecção de erros de indisponibilidade do Prisma/DB e a lógica
 * de fallback para ambientes onde o banco pode não estar provisionado
 * (ex.: Vercel Preview com DATABASE_URL apontando para Prisma Data Proxy sem
 * integração ativa).
 *
 * BDD: Em VERCEL_ENV=preview com DB indisponível, rotas públicas devem
 *      renderizar com dados padrão em vez de retornar HTTP 500.
 * TDD: Cobrir isDbUnavailableError e shouldAllowDbFallback com mocks de erro.
 */

interface ErrorLike {
  name?: string;
  message?: string;
}

function getErrorMessage(error: unknown): string {
  if (!error) return '';
  const err = error as ErrorLike;
  return err.message ?? '';
}

/**
 * Detecta erros que indicam indisponibilidade do banco de dados ou do proxy Prisma.
 * Inclui erros de inicialização do cliente, falhas de conexão e erros de
 * validação de datasource (ex.: URL inválida ou proxy inacessível).
 */
export function isDbUnavailableError(error: unknown): boolean {
  if (!error) return false;

  const err = error as ErrorLike;
  const name: string = err.name ?? '';
  const msg = getErrorMessage(error);

  // PrismaClientInitializationError sempre indica falha ao conectar
  if (name === 'PrismaClientInitializationError') return true;

  // Padrões de mensagem que indicam DB/proxy inacessível
  const unavailablePatterns = [
    "Can't reach database server",
    'db.prisma.io',
    'Error validating datasource',
    'Connection refused',
    'ECONNREFUSED',
    'Connection timed out',
    'ETIMEDOUT',
    'P1001', // Prisma: Can't reach database server
    'P1002', // Prisma: Database server timed out
    'P1008', // Prisma: Operations timed out
    'P1017', // Prisma: Server closed the connection
  ];

  return unavailablePatterns.some((pattern) => msg.includes(pattern));
}

export function isMissingColumnError(error: unknown, columnName?: string): boolean {
  const msg = getErrorMessage(error);
  if (!msg.includes('P2022') && !msg.includes('does not exist in the current database')) {
    return false;
  }

  if (!columnName) {
    return true;
  }

  return msg.toLowerCase().includes(columnName.toLowerCase());
}

/**
 * Retorna `true` quando o ambiente atual é um Preview ou Development da Vercel.
 *
 * A Vercel define `VERCEL_ENV` como `'preview'` em deployments de branch/PR e
 * como `'development'` em `vercel dev` local. Em ambos os casos, `NODE_ENV`
 * pode ser `'production'`, então não podemos depender apenas de `NODE_ENV` para
 * distinguir preview de produção real.
 */
export function isVercelPreviewOrDevelopment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  return vercelEnv === 'preview' || vercelEnv === 'development';
}

/**
 * Retorna um rótulo de ambiente legível para uso em mensagens de log.
 * Exemplos: "Vercel preview", "Vercel development", "desenvolvimento local".
 */
export function getEnvironmentLabel(): string {
  if (isVercelPreviewOrDevelopment()) {
    return `Vercel ${process.env.VERCEL_ENV}`;
  }
  return 'desenvolvimento local';
}

/**
 * Decide se um erro de DB deve acionar o fallback tenantId='1' em vez de lançar.
 *
 * O fallback é permitido quando:
 * - O erro é de indisponibilidade de banco (não um erro de lógica/query), E
 * - O ambiente é desenvolvimento local (NODE_ENV !== 'production') OU
 *   um Vercel Preview/Development (`VERCEL_ENV === 'preview' | 'development'`).
 *
 * Em VERCEL_ENV=production o fallback é negado para não mascarar falhas reais.
 */
export function shouldAllowDbFallback(error: unknown): boolean {
  if (!isDbUnavailableError(error)) return false;
  return process.env.NODE_ENV !== 'production' || isVercelPreviewOrDevelopment();
}

export function shouldAllowSchemaFallback(error: unknown): boolean {
  if (!isMissingColumnError(error)) return false;
  return process.env.NODE_ENV !== 'production' || isVercelPreviewOrDevelopment();
}
