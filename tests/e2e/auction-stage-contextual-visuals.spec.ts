import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function resolveStageScenario(request: import('@playwright/test').APIRequestContext, baseUrl: string) {
  const response = await request.get(`${baseUrl}/api/debug/lots`);
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  const routes = Array.isArray(payload.step1_routes) ? payload.step1_routes : [];
  const stageCounts = Array.isArray(payload.step1_hasAuctionStage) ? payload.step1_hasAuctionStage : [];
  const priceCounts = Array.isArray(payload.step1_hasPrices) ? payload.step1_hasPrices : [];
  const scenarioIndex = routes.findIndex(
    (_entry: { auctionId?: string | null; lotId?: string | null }, index: number) =>
      routes[index]?.auctionId &&
      routes[index]?.lotId &&
      Number(stageCounts[index] || 0) > 1 &&
      Number(priceCounts[index] || 0) > 1
  );
  const scenario = scenarioIndex >= 0 ? routes[scenarioIndex] : null;

  expect(scenario).toBeTruthy();
  return scenario as { auctionId: string; lotId: string; lotTitle: string; auctionTitle: string };
}

test.describe('Praças com visuais contextuais', () => {
  test('renderiza ícones em detalhes e preserva compactação em card/listitem', async ({ page, request, baseURL }) => {
    const baseUrl = baseURL || 'http://demo.localhost:9007';
    const scenario = await resolveStageScenario(request, baseUrl);

    await page.goto(`${baseUrl}/auctions/${scenario.auctionId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const auctionTimeline = page.locator('[data-ai-id="bidexpert-auction-timeline"][data-variant="extended"]').first();
    await expect(auctionTimeline).toBeVisible();
    await expect(auctionTimeline.locator('[data-ai-id^="bidexpert-auction-stage-icon-"]').first()).toBeVisible();
    await expect(auctionTimeline.locator('[data-ai-id^="bidexpert-auction-stage-badge-"]').first()).toBeVisible();
    await expect(auctionTimeline).not.toContainText('R$');

    const lotsTab = page.getByRole('tab', { name: /lotes/i });
    if (await lotsTab.isVisible().catch(() => false)) {
      await lotsTab.click();
    }

    const gridToggle = page.getByRole('button', { name: /visualização em grade/i });
    if (await gridToggle.isVisible().catch(() => false)) {
      await gridToggle.click();
    }

    const lotCard = page.locator('[data-ai-id^="lot-card-"]').filter({ hasText: scenario.lotTitle }).first();
    await expect(lotCard).toBeVisible();
    await expect(lotCard.locator('[data-ai-id="lot-card-timeline"] [data-ai-id^="bidexpert-auction-stage-icon-"]')).toHaveCount(0);

    await page.goto(`${baseUrl}/auctions/${scenario.auctionId}/lots/${scenario.lotId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const detailedTimeline = page.locator('[data-ai-id="bidexpert-auction-timeline"][data-variant="detailed"]').first();
    await expect(detailedTimeline).toBeVisible();
    await expect(detailedTimeline.locator('[data-ai-id^="bidexpert-auction-stage-icon-"]').first()).toBeVisible();
    await expect(detailedTimeline.locator('[data-ai-id^="bidexpert-auction-stage-badge-"]').first()).toBeVisible();
    await expect(detailedTimeline).toContainText('R$');

    const stepCount = await detailedTimeline.locator('[data-ai-id^="bidexpert-auction-timeline-step-"]').count();
    expect(stepCount).toBeGreaterThan(1);
  });
});