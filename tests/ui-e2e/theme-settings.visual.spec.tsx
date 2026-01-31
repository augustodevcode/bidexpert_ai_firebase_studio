/**
 * @fileoverview Teste visual da página de Identidade Visual e Temas.
 * BDD: Renderizar o formulário com tokens completos de tema.
 * TDD: Garantir renderização estável para captura visual.
 */

import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import ThemeSettingsFields from '../../src/components/admin/settings/theme-settings-fields';
import { defaultThemeTokensDark, defaultThemeTokensLight, defaultRadiusValue } from '../../src/lib/theme-tokens';
import { Form } from '../../src/components/ui/form';
import { useForm } from 'react-hook-form';
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));


function ThemeSettingsFormHarness() {
  const form = useForm({
    defaultValues: {
      siteTitle: 'BidExpert',
      siteTagline: 'A elite dos leilões judiciais',
      logoUrl: '',
      logoMediaId: null,
      radiusValue: defaultRadiusValue,
      themeColorsLight: defaultThemeTokensLight,
      themeColorsDark: defaultThemeTokensDark,
    },
  });

  return (
    <Form {...form}>
      <ThemeSettingsFields
        form={form}
        onSelectLogo={() => undefined}
        onClearLogo={() => undefined}
      />
    </Form>
  );
}

describe('Theme Settings Visual', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('renderiza o layout com tokens completos', async () => {
    await render(
      <div data-testid="theme-settings-visual" className="p-6 bg-background">
        <ThemeSettingsFormHarness />
      </div>
    );
    const container = page.getByTestId('theme-settings-visual');
    await expect(container).toMatchScreenshot('theme-settings-page.png');
  });
});
