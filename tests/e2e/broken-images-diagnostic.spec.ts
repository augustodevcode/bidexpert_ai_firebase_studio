/**
 * Diagnostic test to identify exactly which images on the homepage are broken
 * and why they fail to load.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9006';

test.use({ viewport: { width: 1280, height: 720 } });

test('identify broken images on homepage', async ({ page }) => {
  test.setTimeout(120_000);

  const networkErrors: { url: string; status: number; statusText: string }[] = [];
  const failedImages: string[] = [];

  // Track all image-related network responses
  page.on('response', (resp) => {
    const url = resp.url();
    if (
      url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)/i) ||
      url.includes('picsum.photos') ||
      url.includes('_next/image')
    ) {
      if (!resp.ok()) {
        networkErrors.push({ url, status: resp.status(), statusText: resp.statusText() });
      }
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (
      url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)/i) ||
      url.includes('picsum.photos') ||
      url.includes('_next/image')
    ) {
      failedImages.push(`${url} → ${req.failure()?.errorText || 'unknown error'}`);
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 90_000 });

  // Wait extra for lazy-loaded images
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2000);

  // Check all <img> elements
  const imgReport = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map((img) => ({
      src: img.getAttribute('src') || img.currentSrc || '',
      alt: img.getAttribute('alt') || '',
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      broken: img.complete && img.naturalWidth === 0,
      displayed: img.offsetWidth > 0 && img.offsetHeight > 0,
      parentDataAiId: img.closest('[data-ai-id]')?.getAttribute('data-ai-id') || '',
    }));
  });

  console.log('\n====== IMAGE REPORT ======');
  console.log(`Total images on page: ${imgReport.length}`);
  
  const brokenImgs = imgReport.filter((i) => i.broken);
  const pendingImgs = imgReport.filter((i) => !i.complete);
  const goodImgs = imgReport.filter((i) => i.complete && i.naturalWidth > 0);

  console.log(`✅ Good images: ${goodImgs.length}`);
  console.log(`❌ Broken images (complete but 0 width): ${brokenImgs.length}`);
  console.log(`⏳ Pending images (not complete): ${pendingImgs.length}`);

  if (brokenImgs.length > 0) {
    console.log('\n--- BROKEN IMAGES ---');
    brokenImgs.forEach((img, i) => {
      console.log(`  ${i + 1}. src: ${img.src}`);
      console.log(`     alt: "${img.alt}"`);
      console.log(`     parent data-ai-id: "${img.parentDataAiId}"`);
      console.log(`     displayed: ${img.displayed}`);
    });
  }

  if (pendingImgs.length > 0) {
    console.log('\n--- PENDING IMAGES ---');
    pendingImgs.forEach((img, i) => {
      console.log(`  ${i + 1}. src: ${img.src}`);
      console.log(`     alt: "${img.alt}"`);
    });
  }

  if (networkErrors.length > 0) {
    console.log('\n--- NETWORK ERRORS (image responses) ---');
    networkErrors.forEach((e, i) => {
      console.log(`  ${i + 1}. [${e.status}] ${e.url}`);
    });
  }

  if (failedImages.length > 0) {
    console.log('\n--- FAILED IMAGE REQUESTS ---');
    failedImages.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f}`);
    });
  }

  // Now check Next.js Image components specifically (they use /_next/image proxy)
  const nextImageReport = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter((img) => (img.getAttribute('src') || '').includes('/_next/image'))
      .map((img) => ({
        src: img.getAttribute('src') || '',
        srcset: img.getAttribute('srcset')?.substring(0, 200) || '',
        loading: img.getAttribute('loading') || '',
        broken: img.complete && img.naturalWidth === 0,
      }));
  });

  if (nextImageReport.length > 0) {
    console.log(`\n--- NEXT.JS IMAGE COMPONENTS: ${nextImageReport.length} ---`);
    const brokenNext = nextImageReport.filter((i) => i.broken);
    console.log(`  Broken: ${brokenNext.length}`);
    brokenNext.forEach((img, i) => {
      console.log(`  ${i + 1}. src: ${img.src}`);
    });
  }

  console.log('\n====== END REPORT ======\n');
});
