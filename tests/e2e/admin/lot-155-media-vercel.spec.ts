/**
 * @fileoverview BDD/TDD regression check for linked-asset thumbnail layout on lot edit pages.
 * Given a lot edit page with linked assets
 * When an admin opens the lot form
 * Then the thumbnail wrapper must keep the image constrained to the expected 80px slot.
 */
import { expect, test } from '@playwright/test';
import { ensureSeedExecuted, loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'https://demo.bidexpert.com.br';
const LOT_ID = process.env.PLAYWRIGHT_LOT_ID || '155';
const EXPECTED_THUMBNAIL_SIZE = Number(process.env.PLAYWRIGHT_EXPECTED_THUMBNAIL_SIZE || '80');
const SHOULD_EXPECT_REAL_MEDIA =
  process.env.PLAYWRIGHT_EXPECT_REAL_MEDIA === '1' || /demo\.bidexpert\.com\.br/i.test(BASE_URL);
const VERCEL_SHARE_TOKEN = process.env.VERCEL_SHARE_TOKEN || '';

test.describe('Lot linked-asset thumbnail layout regression', () => {
  test.beforeAll(async () => {
    await ensureSeedExecuted(BASE_URL);
  });

  test('keeps the linked-asset thumbnail inside a fixed wrapper', async ({ page }) => {
    if (VERCEL_SHARE_TOKEN) {
      await page.goto(`${BASE_URL}/?_vercel_share=${VERCEL_SHARE_TOKEN}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
    }

    await page.goto(`${BASE_URL}/admin/lots/${LOT_ID}/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    if (/\/auth\/login/i.test(page.url())) {
      await loginAsAdmin(page, BASE_URL);
      await page.goto(`${BASE_URL}/admin/lots/${LOT_ID}/edit`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
    }

    await page.waitForFunction(
      () => !document.body.innerText.includes('Carregando painel administrativo'),
      { timeout: 60_000 },
    ).catch(() => undefined);

    const wrapper = page.locator('.wrapper-bem-list-image').first();
    await expect(wrapper).toBeVisible({ timeout: 60_000 });

    const metrics = await page.evaluate(() => {
      const wrapperElement = document.querySelector<HTMLElement>('.wrapper-bem-list-image');
      const imageElement = wrapperElement?.querySelector<HTMLImageElement>('img');

      if (!wrapperElement || !imageElement) {
        return null;
      }

      const wrapperRect = wrapperElement.getBoundingClientRect();
      const imageRect = imageElement.getBoundingClientRect();
      const wrapperStyle = getComputedStyle(wrapperElement);
      const imageStyle = getComputedStyle(imageElement);

      return {
        wrapper: {
          width: Math.round(wrapperRect.width),
          height: Math.round(wrapperRect.height),
          position: wrapperStyle.position,
          overflow: wrapperStyle.overflow,
          display: wrapperStyle.display,
        },
        image: {
          width: Math.round(imageRect.width),
          height: Math.round(imageRect.height),
          sizes: imageElement.getAttribute('sizes'),
          objectFit: imageStyle.objectFit,
          src: imageElement.getAttribute('src') || '',
          alt: imageElement.getAttribute('alt') || '',
        },
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics?.wrapper.position).toBe('relative');
    expect(metrics?.wrapper.overflow).toBe('hidden');
    expect(metrics?.wrapper.display).toBe('block');
    expect(metrics?.wrapper.width).toBeGreaterThanOrEqual(EXPECTED_THUMBNAIL_SIZE - 20);
    expect(metrics?.wrapper.width).toBeLessThanOrEqual(EXPECTED_THUMBNAIL_SIZE + 40);
    expect(metrics?.wrapper.height).toBeGreaterThanOrEqual(EXPECTED_THUMBNAIL_SIZE - 20);
    expect(metrics?.wrapper.height).toBeLessThanOrEqual(EXPECTED_THUMBNAIL_SIZE + 40);

    expect(metrics?.image.sizes).toBe(`${EXPECTED_THUMBNAIL_SIZE}px`);
    expect(metrics?.image.objectFit).toBe('cover');
    expect(metrics?.image.width).toBeGreaterThanOrEqual(EXPECTED_THUMBNAIL_SIZE - 5);
    expect(metrics?.image.width).toBeLessThanOrEqual((metrics?.wrapper.width ?? EXPECTED_THUMBNAIL_SIZE) + 5);
    expect(metrics?.image.height).toBeGreaterThanOrEqual(EXPECTED_THUMBNAIL_SIZE - 5);
    expect(metrics?.image.height).toBeLessThanOrEqual((metrics?.wrapper.height ?? EXPECTED_THUMBNAIL_SIZE) + 5);

    if (SHOULD_EXPECT_REAL_MEDIA) {
      expect(metrics?.image.src).toContain('public.blob.vercel-storage.com');
      expect(metrics?.image.src).not.toContain('picsum.photos');
      expect(metrics?.image.src).not.toContain('placehold.co');
    }
  });
});