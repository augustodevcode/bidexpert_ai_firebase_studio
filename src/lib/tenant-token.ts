/**
 * @fileoverview Normalização centralizada de identificadores de tenant/subdomínio.
 *
 * Remove caracteres de controle comuns em variáveis de ambiente e headers e
 * normaliza o casing quando necessário para evitar erros de roteamento.
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