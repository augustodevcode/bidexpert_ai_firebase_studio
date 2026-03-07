/**
 * @fileoverview Normalização centralizada de identificadores de tenant e subdomínio.
 *
 * Remove caracteres de controle e espaços acidentais vindos de headers ou
 * variáveis de ambiente para evitar falhas de resolução multi-tenant.
 */

export function normalizeTenantToken(
  value?: string | null,
  options: { lowercase?: boolean } = {}
): string | null {
  if (!value) {
    return null;
  }

  const sanitized = value
    .replace(/[\u0000-\u001F\u007F]+/g, '')
    .trim();

  if (!sanitized) {
    return null;
  }

  return options.lowercase === false ? sanitized : sanitized.toLowerCase();
}