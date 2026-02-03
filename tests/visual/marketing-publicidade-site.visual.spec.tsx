/**
 * @fileoverview Teste visual da página de Publicidade do Site.
 * BDD: Renderizar o formulário do módulo Marketing > Publicidade do Site.
 * TDD: Capturar screenshot para regressão visual.
 */

import React from 'react';
import { describe, it, beforeEach, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { useForm } from 'react-hook-form';
import { Form } from '../../src/components/ui/form';
import SiteAdsSettingsFields from '../../src/components/admin/settings/site-ads-settings-fields';

function SiteAdsSettingsVisualHarness() {
  const form = useForm({
    defaultValues: {
      marketingSiteAdsSuperOpportunitiesEnabled: true,
      marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: 6,
    },
  });

  return (
    <Form {...form}>
      <SiteAdsSettingsFields form={form} />
    </Form>
  );
}

describe('Publicidade do Site - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('renderiza layout para regressão visual', async () => {
    await render(
      <div data-testid="marketing-site-ads-visual" className="p-6 bg-background">
        <SiteAdsSettingsVisualHarness />
      </div>
    );

    const container = page.getByTestId('marketing-site-ads-visual');
    await expect(container).toMatchScreenshot('marketing-publicidade-site.png');
  });
});
