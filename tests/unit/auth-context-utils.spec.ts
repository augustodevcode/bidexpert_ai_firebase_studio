/**
 * @fileoverview Garante que abortos esperados de server actions não poluam o console client-side.
 */

import { describe, expect, it } from 'vitest';
import { isIgnorableServerActionError } from '@/contexts/auth-context-utils';

describe('isIgnorableServerActionError', () => {
  it('ignora falhas transitórias de fetch e abortos de navegação', () => {
    expect(isIgnorableServerActionError(new Error('TypeError: Failed to fetch'))).toBe(true);
    expect(isIgnorableServerActionError(new Error('TypeError: network error'))).toBe(true);
    expect(isIgnorableServerActionError(new Error('net::ERR_ABORTED; maybe frame was detached?'))).toBe(true);
  });

  it('mantém erros reais visíveis no console', () => {
    expect(isIgnorableServerActionError(new Error('Permission denied'))).toBe(false);
    expect(isIgnorableServerActionError('Database offline')).toBe(false);
  });
});