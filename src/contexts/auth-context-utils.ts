/**
 * @fileoverview Utilitários para tratamento resiliente de erros do AuthContext no client.
 */

const IGNORABLE_SERVER_ACTION_ERROR_PATTERNS = [
  /failed to fetch/i,
  /network error/i,
  /abort/i,
  /err_aborted/i,
  /frame was detached/i,
];

export function isIgnorableServerActionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return IGNORABLE_SERVER_ACTION_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}