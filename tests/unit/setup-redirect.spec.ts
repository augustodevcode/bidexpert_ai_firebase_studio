/**
 * @fileoverview Testes unitários para o gate de setup no cliente.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SetupRedirect } from '@/app/setup/setup-redirect';

const replace = vi.fn();
let pathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

describe.skip('SetupRedirect', () => {
  beforeEach(() => {
    pathname = '/';
    replace.mockReset();
  });

  it('redireciona para /setup quando a configuracao nao foi concluida', async () => {
    pathname = '/admin/dashboard';

    render(React.createElement(SetupRedirect, { isSetupComplete: false }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/setup');
    });
  });

  it('redireciona para o dashboard quando o setup ja foi concluido e o usuario acessa /setup', async () => {
    pathname = '/setup';

    render(React.createElement(SetupRedirect, { isSetupComplete: true }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('nao redireciona quando o usuario ja esta em /setup e o setup ainda nao foi concluido', () => {
    pathname = '/setup';

    render(React.createElement(SetupRedirect, { isSetupComplete: false }));

    expect(replace).not.toHaveBeenCalled();
  });
});
