/**
 * @file lot-image-consistency.spec.ts
 * @description E2E tests validating that lot images are consistent across:
 *   - Lot cards (list/grid views)
 *   - Quick preview modal
 *   - Lot detail page
 *   - Admin media library (entity links)
 *
 * Root cause fixed: getLots() was missing `CoverImage: true` in its Prisma include,
 * causing cards to fall back to picsum seeded by sequential numeric DB ID instead of
 * the real MediaItem URL from the database.
 *
 * @see src/services/lot.service.ts — getLots(), getLotsByIds()
 * @see src/components/cards/lot-card.tsx
 * @see src/components/cards/lot-list-item.tsx
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9005';

/** 
 * Picsum URLs seeded by small sequential numeric IDs (1–200) are the bad fallback pattern.
 * Real media library URLs use longer seeds like "bGLuLcx" or "lot-1772936965668-0-1".
 */
function isSequentialIdPicsumUrl(url: string): boolean {
  // Match picsum.photos/seed/<1-4 digit number>/
  return /picsum\.photos\/seed\/\d{1,4}\//.test(url);
}

test.describe('Lot Image Consistency', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * TC-IMG-01: Lot cards must NOT use sequential numeric DB ID as picsum seed.
   * After the fix, all lot cards should show either:
   * - The real MediaItem URL (urlOriginal from CoverImage)
   * - A placehold.co placeholder (consistent fallback)
   */
  test('TC-IMG-01: lot cards do not use sequential numeric ID as picsum seed', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');

    const cardImages = page.locator('[data-ai-id^="lot-card-main-image"]');
    const count = await cardImages.count();

    if (count === 0) {
      test.skip(true, 'No lot cards found on search page — seed database first');
      return;
    }

    const badUrls: string[] = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      const src = await cardImages.nth(i).getAttribute('src') || '';
      // Also check srcset for the offending pattern
      const srcset = await cardImages.nth(i).getAttribute('srcset') || '';
      const combined = src + srcset;

      // Decode the encoded URL in _next/image?url=... wrappers
      const decoded = decodeURIComponent(combined);
      if (isSequentialIdPicsumUrl(decoded)) {
        badUrls.push(decoded);
      }
    }

    expect(badUrls, 
      `Found ${badUrls.length} card(s) using picsum seeded by sequential numeric ID.\n` +
      `This means imageMediaId/CoverImage is not being included in the getLots() query.\n` +
      `Bad URLs (sample): ${badUrls.slice(0, 3).join(', ')}`
    ).toHaveLength(0);
  });

  /**
   * TC-IMG-02: Images in lot card, quick preview, and detail page should be consistent.
   * All three views should resolve to the same source URL for the same lot.
   */
  test('TC-IMG-02: lot card, quick preview, and detail page show consistent images', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');

    // Find the first lot card with a real image (not placehold.co)
    const cardImages = page.locator('[data-ai-id^="lot-card-main-image"]');
    const count = await cardImages.count();

    if (count === 0) {
      test.skip(true, 'No lot cards found on search page — seed database first');
      return;
    }

    // Find first card with a non-placeholder image
    let cardImageSrc = '';
    let cardIndex = -1;
    for (let i = 0; i < Math.min(count, 10); i++) {
      const rawSrc = await cardImages.nth(i).getAttribute('src') || '';
      const decoded = decodeURIComponent(rawSrc);
      if (!decoded.includes('placehold.co') && decoded.length > 0) {
        cardImageSrc = decoded;
        cardIndex = i;
        break;
      }
    }

    if (cardIndex === -1) {
      test.skip(true, 'No lot card with a real image found — check seed data');
      return;
    }

    // Get the card element to find the detail URL
    const card = page.locator('[data-testid="lot-card"]').nth(cardIndex);
    const cardLink = card.locator('a[data-ai-id="lot-card-link-main"]').first();
    const detailHref = await cardLink.getAttribute('href');
    expect(detailHref, 'Lot card should have a detail page link').toBeTruthy();

    // --- Quick Preview ---
    const previewBtn = card.locator('[data-ai-id="lot-card-preview-btn"]').first();
    if (await previewBtn.isVisible()) {
      await previewBtn.click();

      // Wait for modal to appear
      const previewModal = page.locator('[role="dialog"]').first();
      await expect(previewModal).toBeVisible({ timeout: 5000 });

      // Get image in preview modal
      const previewImage = previewModal.locator('img').first();
      await expect(previewImage).toBeVisible({ timeout: 5000 });
      const previewSrc = decodeURIComponent(await previewImage.getAttribute('src') || '');

      // Extract base URL to compare (strip _next/image wrapper and query params)
      const extractBaseImageUrl = (src: string): string => {
        // If it's a _next/image URL, extract the `url` param
        const match = src.match(/url=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
        return src;
      };

      const cardBase = extractBaseImageUrl(cardImageSrc);
      const previewBase = extractBaseImageUrl(previewSrc);

      // Both should have the same domain/seed (not one being picsum-by-id and other placehold.co)
      const cardIsPlaceholder = cardBase.includes('placehold.co');
      const previewIsPlaceholder = previewBase.includes('placehold.co');

      if (!cardIsPlaceholder && !previewIsPlaceholder) {
        // If both have real images, they should be from the same source
        expect(previewBase, 
          `Quick preview image (${previewBase}) should match card image (${cardBase})`
        ).toBe(cardBase);
      }

      // Close modal
      const closeBtn = previewModal.locator('[aria-label="Close"], [data-radix-collection-item]').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
      await page.keyboard.press('Escape');
    }

    // --- Detail Page ---
    await page.goto(`${BASE_URL}${detailHref}`);
    await page.waitForLoadState('networkidle');

    // Find main detail image
    const detailImage = page.locator('[data-ai-hint="imagem principal lote"], [data-ai-hint*="imagem lote"] img, .object-contain img').first();
    
    if (await detailImage.isVisible({ timeout: 5000 })) {
      const detailSrc = decodeURIComponent(await detailImage.getAttribute('src') || '');

      const extractBaseImageUrl = (src: string): string => {
        const match = src.match(/url=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
        return src;
      };

      const cardBase = extractBaseImageUrl(cardImageSrc);
      const detailBase = extractBaseImageUrl(detailSrc);

      const cardIsPlaceholder = cardBase.includes('placehold.co');
      const detailIsPlaceholder = detailBase.includes('placehold.co');
      const detailIsImgDisponivel = detailBase.includes('Imagem+Indisponivel') || detailBase.includes('Imagem_Indisponivel');

      if (!cardIsPlaceholder) {
        // Card has a real image — detail page should NOT show "Imagem Indisponivel"
        expect(detailIsImgDisponivel, 
          `Detail page shows "Imagem Indisponivel" but card shows a real image: ${cardBase}`
        ).toBe(false);

        if (!detailIsPlaceholder) {
          // Both have real images — should be from the same source
          expect(detailBase, 
            `Detail page image (${detailBase}) should match card image (${cardBase})`
          ).toBe(cardBase);
        }
      }
    }
  });

  /**
   * TC-IMG-03: Lot list items do NOT use sequential numeric DB ID as picsum seed.
   */
  test('TC-IMG-03: lot list items do not use sequential numeric ID as picsum seed', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');

    // Switch to list view if possible
    const listViewBtn = page.locator('[aria-label*="list" i], [aria-label*="lista" i], [data-ai-id*="list-view"], button:has(svg.lucide-list)').first();
    if (await listViewBtn.isVisible({ timeout: 3000 })) {
      await listViewBtn.click();
      await page.waitForLoadState('networkidle');
    }

    const listImages = page.locator('[data-ai-hint*="imagem lote lista"] img, [data-ai-hint*="lot list"] img');
    const count = await listImages.count();

    if (count === 0) {
      // List view may not be available, skip gracefully
      return;
    }

    const badUrls: string[] = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      const src = await listImages.nth(i).getAttribute('src') || '';
      const srcset = await listImages.nth(i).getAttribute('srcset') || '';
      const decoded = decodeURIComponent(src + srcset);
      if (isSequentialIdPicsumUrl(decoded)) {
        badUrls.push(decoded);
      }
    }

    expect(badUrls,
      `Found ${badUrls.length} list item(s) using picsum seeded by sequential numeric ID.\n` +
      `Bad URLs (sample): ${badUrls.slice(0, 3).join(', ')}`
    ).toHaveLength(0);
  });

  /**
   * TC-IMG-04: Auction detail page lot cards show consistent images.
   */
  test('TC-IMG-04: auction detail page lot cards show real images (not sequential-ID picsum)', async ({ page }) => {
    // Navigate to search to find an auction
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');

    // Get the first lot card's auction link from auction-id badge
    const auctionIdBadge = page.locator('[data-ai-id="lot-card-auction-info"] span').first();
    if (!(await auctionIdBadge.isVisible({ timeout: 3000 }))) {
      test.skip(true, 'No auction info found on search page');
      return;
    }

    // Navigate to the first auction detail page via the card
    const firstCard = page.locator('[data-testid="lot-card"]').first();
    const mainLink = firstCard.locator('[data-ai-id="lot-card-link-main"]').first();
    const lotHref = await mainLink.getAttribute('href');
    
    if (!lotHref) {
      test.skip(true, 'Cannot find lot link');
      return;
    }

    // Extract auction ID from href like /auctions/43/lots/lot-xxx
    const auctionMatch = lotHref.match(/\/auctions\/([^/]+)\//);
    if (!auctionMatch) {
      test.skip(true, 'Cannot extract auction ID from lot href');
      return;
    }
    
    const auctionId = auctionMatch[1];
    await page.goto(`${BASE_URL}/auctions/${auctionId}`);
    await page.waitForLoadState('networkidle');

    const cardImages = page.locator('[data-ai-id^="lot-card-main-image"]');
    const count = await cardImages.count();

    if (count === 0) {
      return; // No lot cards on auction page, skip
    }

    const badUrls: string[] = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      const src = await cardImages.nth(i).getAttribute('src') || '';
      const decoded = decodeURIComponent(src);
      if (isSequentialIdPicsumUrl(decoded)) {
        badUrls.push(decoded);
      }
    }

    expect(badUrls,
      `Found ${badUrls.length} lot card(s) on auction page using picsum seeded by sequential numeric ID.\n` +
      `Bad URLs (sample): ${badUrls.slice(0, 3).join(', ')}`
    ).toHaveLength(0);
  });
});
