/**
 * @fileoverview Testes unitários da persistência em cookie do SuperGrid.
 */

import { describe, expect, it } from 'vitest';
import {
  getGridStateCookieName,
  readGridStateCookie,
  serializeGridStateCookie,
} from '@/components/super-grid/utils/statePersistence';

describe('SuperGrid state persistence', () => {
  it('serializa o estado visual do grid em cookie', () => {
    const cookie = serializeGridStateCookie('auctions-supergrid', {
      columnSizing: { title: 320 },
      density: 'compact',
      grouping: ['status'],
    });

    expect(cookie).toContain(`${getGridStateCookieName('auctions-supergrid')}=`);
    expect(cookie).toContain('path=/');
    expect(cookie).toContain('max-age=31536000');
    expect(cookie).toContain('samesite=lax');
  });

  it('restaura o estado visual a partir do cookie correto', () => {
    const cookieSource = [
      'foo=bar',
      serializeGridStateCookie('auctions-supergrid', {
        columnSizing: { title: 320, status: 180 },
        columnVisibility: { createdAt: false },
        density: 'comfortable',
        grouping: ['status', 'auctionType'],
      }),
    ].join('; ');

    expect(readGridStateCookie(cookieSource, 'auctions-supergrid')).toEqual({
      columnSizing: { title: 320, status: 180 },
      columnVisibility: { createdAt: false },
      density: 'comfortable',
      grouping: ['status', 'auctionType'],
    });
  });

  it('ignora cookies inválidos sem quebrar o grid', () => {
    expect(readGridStateCookie('bidexpert_supergrid_auctions-supergrid=%7Binvalid-json', 'auctions-supergrid')).toEqual({});
  });
});