/**
 * @fileoverview Teste UI E2E do submódulo Publicidade do Site.
 * BDD: Permitir alternar a seção Super Oportunidades e ajustar a rolagem.
 * TDD: Verificar interação com switch e campo numérico.
 */

import React from 'react';
import { describe, it, beforeEach, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { useForm } from 'react-hook-form';
import { Form } from '../../src/components/ui/form';
import SiteAdsSettingsFields from '../../src/components/admin/settings/site-ads-settings-fields';

function SiteAdsSettingsHarness() {
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

describe('Publicidade do Site - UI', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('permite alternar o toggle e ajustar o intervalo', async () => {
    await render(
      <div data-testid="site-ads-settings-test" className="p-6 bg-background">
        <SiteAdsSettingsHarness />
      </div>
    );

    const toggle = page.getByTestId('marketing-site-ads-super-opportunities-toggle');
    await expect.element(toggle).toBeVisible();
    await userEvent.click(toggle);

    const intervalInput = page.getByTestId('marketing-site-ads-super-opportunities-interval');
    await expect.element(intervalInput).toBeVisible();
    await userEvent.clear(intervalInput);
    await userEvent.type(intervalInput, '5');
  });
});
