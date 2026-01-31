/**
 * @fileoverview Testes unitários do gerador de CSS de tema.
 * BDD: Garantir que tokens completos gerem CSS para light e dark.
 * TDD: Validar a composição correta das variáveis CSS.
 */

import { describe, it, expect } from 'vitest';
import { generateTenantThemeCss } from '../../src/lib/theme-injector';
import { defaultThemeTokensDark, defaultThemeTokensLight } from '../../src/lib/theme-tokens';

describe('Theme Injector', () => {
  it('gera CSS com tokens completos para light e dark', () => {
    const css = generateTenantThemeCss({
      themeColorsLight: defaultThemeTokensLight,
      themeColorsDark: defaultThemeTokensDark,
    });

    expect(css).toContain(':root');
    expect(css).toContain('--background: 0 0% 100%');
    expect(css).toContain('.dark');
    expect(css).toContain('--background: 20 14.3% 4.1%');
  });
});
