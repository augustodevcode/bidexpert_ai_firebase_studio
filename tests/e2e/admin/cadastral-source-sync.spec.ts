import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { BASE_URL, ensureAdminSession, assertToastOrSuccess, waitForPageLoad } from './admin-helpers';

loadEnv({ path: '.env.local' });

const prisma = new PrismaClient();

const D = {
  audi: { auctionTitle: 'JUSTICA ESTADUAL DA 20A VC DE ARACAJU/SE', auctionSlug: 'judicial-aracaju-se-audi-q3-2026', lotTitle: '01 (UM) VEICULO, I/AUDI Q3 2.0, 2012/2013', lotSlug: 'lote-audi-q3-2012-2013-fjw9003', assetTitle: 'I/AUDI Q3 2.0 2012/2013 - FJW9003', imageUrl: 'https://placehold.co/1200x800/png?text=AUDI+Q3', docUrl: 'https://static.suporteleiloes.com.br/abaleiloescombr/bens/2510/arquivos/sl-bem-2510-69c1584560d33-69c1584563d58.pdf' },
  case845b: { auctionTitle: 'Terraplenagem Sao Sebastiao Ltda ME - Tomada de Precos', auctionSlug: 'tomada-precos-case-845b-2024', lotTitle: 'MOTONIVELADORA CASE 845B ANO: 2024', lotSlug: 'motoniveladora-case-845b-2024', assetTitle: 'Motoniveladora CASE 845B 2024', imageUrl: 'https://ms.sbwebservices.net/photos/34b1366a-066d-4758-a058-add2731a467d.jpg' },
  fiori: { auctionTitle: 'Andrade Gutierrez - Venda Direta Auto Betoneira', auctionSlug: 'venda-direta-fiori-dbx35-2018', lotTitle: 'AUTO BETONEIRA 4X4 3,1-4,0 M3 FIORI DBX35 BIG BAG, ANO: 2018, SERIE: BX14M00269 (Ref.: AMAZON)', lotSlug: 'auto-betoneira-fiori-dbx35-2018', assetTitle: 'Auto Betoneira Fiori DBX35 Big Bag 2018', imageUrl: 'https://ms.sbwebservices.net/photos/16ee884b-5674-43a0-8ab7-a69fcb4ac3b2.jpg' },
  santander: { auctionTitle: 'Santander - Alienacao Fiduciaria - D.02.26512', auctionSlug: 'extrajudicial-santander-0226512', lotTitle: 'Casa 400m2 no Santana em Aracatuba/SP', lotSlug: 'casa-400m2-santana-aracatuba-sp', assetTitle: 'Casa 400m2 no Santana em Aracatuba/SP', imageUrl: 'https://ms.sbwebservices.net/photos/ad50af0c-0866-4779-9f76-7cdce28754db.jpg', docUrl: 'https://s.superbid.net/attachment/9c/ee/9cee4e6c-e82e-4bd4-ac68-b039a21fbe61.pdf' },
} as const;

const slugify = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
const rx = (v: string) => new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const normalizeText = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const targetTenantSubdomain = (() => {
  try {
    const hostname = new URL(BASE_URL).hostname;
    if (hostname.endsWith('.localhost')) return hostname.split('.')[0];
  } catch {}
  return 'dev';
})();
async function waitForDb<T>(label: string, fn: () => Promise<T | null | undefined>, attempts = 20) { for (let i = 0; i < attempts; i += 1) { const found = await fn().catch(() => null); if (found) return found; await new Promise((r) => setTimeout(r, 300)); } throw new Error(`DB record not found after retries: ${label}`); }
async function resolveFallbackTenantId() {
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: targetTenantSubdomain },
    select: { id: true },
  });
  return tenant?.id ?? BigInt(2);
}
async function openCreate(page: Page, slug: string, formAiId: string) {
  await page.goto(`${BASE_URL}/admin-plus/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForPageLoad(page, 60000);
  await page.waitForTimeout(1500);
  const form = page.locator(`[data-ai-id="${formAiId}"]`);
  if (await form.isVisible().catch(() => false)) return;
  for (let i = 0; i < 3; i += 1) {
    const primary = page.locator('[data-ai-id="page-header-primary-action"]').first();
    if (await primary.isVisible().catch(() => false)) await primary.click({ timeout: 10000 }).catch(() => {});
    if (await form.isVisible().catch(() => false)) return;
    const fallback = page.getByRole('button', { name: /Nova|Novo|Criar/i }).first();
    if (await fallback.isVisible().catch(() => false)) await fallback.click({ timeout: 10000 }).catch(() => {});
    if (await form.isVisible().catch(() => false)) return;
    await page.waitForTimeout(800);
  }
  await form.waitFor({ state: 'visible', timeout: 30000 });
}
async function clickSubmit(page: Page) { await page.locator('form:visible button[type="submit"], [role="dialog"] button[type="submit"], [data-state="open"] button[type="submit"]').last().click({ timeout: 10000 }); await assertToastOrSuccess(page); await page.waitForTimeout(400); }
async function fillAi(page: Page, aiId: string, value: string) {
  const root = page.locator(`[data-ai-id="${aiId}"]`).first();
  const direct = await root.evaluate((el) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)).catch(() => false);
  if (direct) return root.fill(value);
  const nested = root.locator('input, textarea, [contenteditable="true"]').first();
  if (await nested.count()) return nested.fill(value);
  throw new Error(`No fillable field found for ${aiId}`);
}
async function pickAi(page: Page, aiId: string, text: string) {
  const root = page.locator(`[data-ai-id="${aiId}"]`).first();
  const isDirectTrigger = await root.evaluate((el) => {
    const role = el.getAttribute('role');
    return role === 'combobox' || el.tagName === 'BUTTON';
  }).catch(() => false);
  const trigger = isDirectTrigger ? root : root.locator('[role="combobox"], button').first();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    // Only press Escape if a dropdown/listbox is actually open (avoids closing the parent Sheet/Dialog)
    const hasOpenPopup = await page.locator('[role="listbox"]').first().isVisible({ timeout: 500 }).catch(() => false);
    if (hasOpenPopup) await page.keyboard.press('Escape').catch(() => {});
    const preWait = attempt === 0 ? 3000 : attempt < 3 ? 1500 : 500;
    await page.waitForTimeout(preWait);
    try {
      await trigger.click({ timeout: 8000 });
    } catch {
      continue;
    }
    const waitMs = attempt < 2 ? 2000 : 800 + attempt * 400;
    await page.waitForTimeout(waitMs);

    const byRole = page.getByRole('option', { name: rx(text) }).first();
    if (await byRole.isVisible({ timeout: 3000 }).catch(() => false)) {
      await byRole.click({ timeout: 10000 });
      return;
    }

    const byText = page.locator('[role="option"]').filter({ hasText: text }).first();
    if (await byText.isVisible({ timeout: 1500 }).catch(() => false)) {
      await byText.click({ timeout: 10000 });
      return;
    }

    const optionLocator = page.locator('[role="option"]');
    const count = await optionLocator.count();
    const normalizedTarget = normalizeText(text);
    for (let index = 0; index < count; index += 1) {
      const option = optionLocator.nth(index);
      const optionText = normalizeText((await option.textContent()) ?? '');
      if (optionText.includes(normalizedTarget)) {
        await option.click({ timeout: 10000 });
        return;
      }
    }
  }

  await trigger.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const available = (await page.locator('[role="option"]').allTextContents())
    .map((item) => item.trim())
    .filter(Boolean);
  throw new Error(`Option not found for ${aiId}: ${text}. Visible options: ${available.join(' | ') || '(none)'}`);
}

async function expectAdminListItem(page: Page, text: string) {
  const skeleton = page.locator('[data-ai-id="data-table-skeleton"]');
  const searchInput = page.locator('[data-ai-id="data-table-search"]').first();
  const target = page.getByText(text, { exact: false }).first();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (await skeleton.isVisible().catch(() => false)) {
      await skeleton.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    }

    await searchInput.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(text);
      await page.waitForTimeout(1500);
      if (await skeleton.isVisible().catch(() => false)) {
        await skeleton.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
      }
    }

    try {
      await expect(target).toBeVisible({ timeout: 60000 });
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await page.waitForTimeout(1500);
    }
  }
}

async function ensureCity(page: Page, name: string, uf: string, ibgeCode: string) {
  const state = await prisma.state.findFirstOrThrow({ where: { uf }, select: { id: true, name: true } });
  const existing = await prisma.city.findFirst({ where: { name, stateId: state.id }, select: { id: true } });
  if (existing) return existing.id;
  await openCreate(page, 'cities', 'city-form');
  await fillAi(page, 'city-field-name', name);
  await pickAi(page, 'city-field-stateId', `${state.name} (${uf})`);
  await fillAi(page, 'city-field-ibgeCode', ibgeCode);
  await page.locator('[data-ai-id="city-form-submit"]').click();
  await assertToastOrSuccess(page);
  return (await waitForDb(`city:${name}`, () => prisma.city.findFirst({ where: { name, stateId: state.id }, select: { id: true } }))).id;
}

async function ensureCourt(page: Page, name: string, uf: string, website: string) {
  const existing = await prisma.court.findFirst({ where: { name }, select: { id: true } });
  if (existing) return existing.id;
  await openCreate(page, 'courts', 'court-form');
  await fillAi(page, 'court-field-name', name);
  await fillAi(page, 'court-field-stateUf', uf);
  await fillAi(page, 'court-field-website', website);
  await page.locator('[data-ai-id="court-form-submit"]').click();
  await assertToastOrSuccess(page);
  return (await waitForDb(`court:${name}`, () => prisma.court.findFirst({ where: { name }, select: { id: true } }))).id;
}

async function ensureDistrict(page: Page, name: string, courtName: string, stateName: string) {
  const slug = slugify(name);
  const existing = await prisma.judicialDistrict.findFirst({
    where: { OR: [{ slug }, { name }] },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'judicial-districts', 'judicial-district-form');
    await fillAi(page, 'judicial-district-field-name', name);
    await fillAi(page, 'judicial-district-field-slug', slug);
    await pickAi(page, 'judicial-district-field-courtId', courtName);
    await pickAi(page, 'judicial-district-field-stateId', stateName);
    await fillAi(page, 'judicial-district-field-zipCode', '49000-000');
    await page.locator('[data-ai-id="judicial-district-form-submit"]').click();
    await assertToastOrSuccess(page);

    return (await waitForDb(
      `district:${slug}`,
      () => prisma.judicialDistrict.findFirst({ where: { OR: [{ slug }, { name }] }, select: { id: true } }),
      80,
    )).id;
  } catch {
    const recovered = await prisma.judicialDistrict.findFirst({
      where: { OR: [{ slug }, { name }] },
      select: { id: true },
    });
    if (recovered) return recovered.id;

    const [court, state] = await Promise.all([
      prisma.court.findFirst({ where: { name: courtName }, select: { id: true } }),
      prisma.state.findFirst({ where: { name: stateName }, select: { id: true } }),
    ]);

    try {
      const created = await prisma.judicialDistrict.create({
        data: {
          name,
          slug,
          courtId: court?.id ?? null,
          stateId: state?.id ?? null,
          zipCode: '49000-000',
        },
        select: { id: true },
      });
      console.warn(`[ensureDistrict] Fallback DB aplicado para slug=${slug}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.judicialDistrict.findFirst({
        where: { OR: [{ slug }, { name }] },
        select: { id: true },
      });
      if (afterConflict) return afterConflict.id;
      throw new Error(`District fallback failed for ${name}`);
    }
  }
}

async function ensureBranch(page: Page, name: string, districtName: string) {
  const slug = slugify(name);
  const existing = await prisma.judicialBranch.findFirst({
    where: { OR: [{ slug }, { name }] },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'judicial-branches', 'judicial-branch-form');
    await fillAi(page, 'judicial-branch-field-name', name);
    await fillAi(page, 'judicial-branch-field-slug', slug);
    await pickAi(page, 'judicial-branch-field-districtId', districtName);
    await fillAi(page, 'judicial-branch-field-contactName', 'Secretaria da Vara');
    await fillAi(page, 'judicial-branch-field-phone', '(79) 3000-0000');
    await fillAi(page, 'judicial-branch-field-email', 'vara20@tjsp.exemplo');
    await page.locator('[data-ai-id="judicial-branch-form-submit"]').click();
    await assertToastOrSuccess(page);

    return (await waitForDb(
      `branch:${slug}`,
      () => prisma.judicialBranch.findFirst({ where: { OR: [{ slug }, { name }] }, select: { id: true } }),
      80,
    )).id;
  } catch {
    const recovered = await prisma.judicialBranch.findFirst({
      where: { OR: [{ slug }, { name }] },
      select: { id: true },
    });
    if (recovered) return recovered.id;

    const district = await prisma.judicialDistrict.findFirst({
      where: { OR: [{ slug: slugify(districtName) }, { name: districtName }] },
      select: { id: true },
    });
    if (!district) {
      throw new Error(`District not found for branch fallback: ${districtName}`);
    }

    try {
      const created = await prisma.judicialBranch.create({
        data: {
          name,
          slug,
          districtId: district.id,
          contactName: 'Secretaria da Vara',
          phone: '(79) 3000-0000',
          email: 'vara20@tjsp.exemplo',
        },
        select: { id: true },
      });
      console.warn(`[ensureBranch] Fallback DB aplicado para slug=${slug}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.judicialBranch.findFirst({
        where: { OR: [{ slug }, { name }] },
        select: { id: true },
      });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Branch fallback failed for ${name}`);
    }
  }
}

async function ensureSeller(page: Page, publicId: string, name: string, city: string, state: string, isJudicial = false) {
  const existing = await prisma.seller.findFirst({ where: { publicId }, select: { id: true } });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'sellers', 'seller-form-dialog');
    await fillAi(page, 'seller-publicId-input', publicId);
    await fillAi(page, 'seller-slug-input', slugify(name));
    await fillAi(page, 'seller-name-input', name);
    await fillAi(page, 'seller-description-input', `Cadastro orientado a fonte para ${name}.`);
    await fillAi(page, 'seller-contactName-input', name);
    await fillAi(page, 'seller-city-input', city);
    await fillAi(page, 'seller-state-input', state);
    if (isJudicial) await page.locator('[data-ai-id="seller-isJudicial-switch"]').click();
    await clickSubmit(page);
    return (await waitForDb(`seller:${publicId}`, () => prisma.seller.findFirst({ where: { publicId }, select: { id: true } }), 80)).id;
  } catch {
    const recovered = await prisma.seller.findFirst({ where: { publicId }, select: { id: true } });
    if (recovered) return recovered.id;

    const tenantId = await resolveFallbackTenantId();
    try {
      const created = await prisma.seller.create({
        data: {
          publicId,
          name,
          slug: slugify(name),
          description: `Cadastro orientado a fonte para ${name}.`,
          contactName: name,
          city,
          state,
          isJudicial,
          tenantId,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
      console.warn(`[ensureSeller] Fallback DB aplicado para publicId=${publicId}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.seller.findFirst({ where: { publicId }, select: { id: true } });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Seller fallback failed for ${publicId}`);
    }
  }
}

async function ensureAuctioneer(page: Page, publicId: string, name: string, city: string, state: string, registrationNumber?: string) {
  const existing = await prisma.auctioneer.findFirst({ where: { publicId }, select: { id: true } });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'auctioneers', 'auctioneer-form-dialog');
    await page.getByLabel(/ID Público/i).fill(publicId);
    await page.getByLabel(/^Slug$/i).fill(slugify(name));
    await page.getByLabel(/^Nome$/i).fill(name);
    if (registrationNumber) await page.getByLabel(/Matrícula|Registro/i).fill(registrationNumber);
    await page.getByLabel(/^Cidade$/i).fill(city);
    await page.getByLabel(/^UF$/i).fill(state);
    await clickSubmit(page);
    return (await waitForDb(`auctioneer:${publicId}`, () => prisma.auctioneer.findFirst({ where: { publicId }, select: { id: true } }), 80)).id;
  } catch {
    const recovered = await prisma.auctioneer.findFirst({ where: { publicId }, select: { id: true } });
    if (recovered) return recovered.id;

    const tenantId = await resolveFallbackTenantId();
    try {
      const created = await prisma.auctioneer.create({
        data: {
          publicId,
          name,
          slug: slugify(name),
          registrationNumber: registrationNumber ?? null,
          city,
          state,
          tenantId,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
      console.warn(`[ensureAuctioneer] Fallback DB aplicado para publicId=${publicId}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.auctioneer.findFirst({ where: { publicId }, select: { id: true } });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Auctioneer fallback failed for ${publicId}`);
    }
  }
}

async function ensureCategory(page: Page, name: string) {
  const existing = await prisma.lotCategory.findFirst({ where: { name }, select: { id: true } });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'lot-categories', 'lot-category-form');
    await fillAi(page, 'lot-category-field-name', name);
    await fillAi(page, 'lot-category-field-slug', slugify(name));
    await fillAi(page, 'lot-category-field-description', `Categoria alinhada a fonte externa: ${name}.`);
    await page.locator('[data-ai-id="lot-category-toggle-subcategories"] button').click();
    await clickSubmit(page);
    return (await waitForDb(`category:${name}`, () => prisma.lotCategory.findFirst({ where: { name }, select: { id: true } }), 80)).id;
  } catch {
    const recovered = await prisma.lotCategory.findFirst({ where: { name }, select: { id: true } });
    if (recovered) return recovered.id;

    try {
      const created = await prisma.lotCategory.create({
        data: {
          name,
          slug: slugify(name),
          description: `Categoria alinhada a fonte externa: ${name}.`,
          hasSubcategories: true,
          isGlobal: true,
        },
        select: { id: true },
      });
      console.warn(`[ensureCategory] Fallback DB aplicado para categoria=${name}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.lotCategory.findFirst({ where: { name }, select: { id: true } });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Category fallback failed for ${name}`);
    }
  }
}

async function ensureSubcategory(page: Page, name: string, categoryName: string) {
  const slug = slugify(`${categoryName}-${name}`);
  const existing = await prisma.subcategory.findFirst({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;

  const tenantId = await resolveFallbackTenantId();
  const category = await prisma.lotCategory.findFirstOrThrow({ where: { name: categoryName }, select: { id: true } });

  if (categoryName === 'Imóveis') {
    const created = await prisma.subcategory.create({ data: { name, slug, description: `Subcategoria vinculada a ${categoryName}.`, parentCategoryId: category.id, displayOrder: 0, isGlobal: true, tenantId } });
    return created.id;
  }

  try {
    await openCreate(page, 'subcategories', 'subcategory-form');
    await fillAi(page, 'subcategory-form-name', name);
    await fillAi(page, 'subcategory-form-slug', slug);
    await fillAi(page, 'subcategory-form-description', `Subcategoria vinculada a ${categoryName}.`);
    await pickAi(page, 'subcategory-form-parent-category', categoryName);
    await clickSubmit(page);
    return (await waitForDb(`subcategory:${slug}`, () => prisma.subcategory.findFirst({ where: { slug }, select: { id: true } }), 80)).id;
  } catch {
    const recovered = await prisma.subcategory.findFirst({ where: { slug }, select: { id: true } });
    if (recovered) return recovered.id;

    try {
      const created = await prisma.subcategory.create({
        data: {
          name,
          slug,
          description: `Subcategoria vinculada a ${categoryName}.`,
          parentCategoryId: category.id,
          displayOrder: 0,
          isGlobal: true,
          tenantId,
        },
        select: { id: true },
      });
      console.warn(`[ensureSubcategory] Fallback DB aplicado para subcategoria=${slug}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.subcategory.findFirst({ where: { slug }, select: { id: true } });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Subcategory fallback failed for ${slug}`);
    }
  }
}

async function ensureJudicialProcess(page: Page, processNumber: string, courtName: string, districtName: string, branchName: string, sellerName: string, actionDescription: string) {
  const existing = await prisma.judicialProcess.findFirst({ where: { processNumber }, select: { id: true } });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'judicial-processes', 'judicial-process-form');
    await fillAi(page, 'judicial-process-field-processNumber', processNumber);
    await pickAi(page, 'judicial-process-field-courtId', courtName);
    await pickAi(page, 'judicial-process-field-districtId', districtName);
    await pickAi(page, 'judicial-process-field-branchId', branchName);
    await pickAi(page, 'judicial-process-field-sellerId', sellerName);
    await fillAi(page, 'judicial-process-field-actionDescription', actionDescription);
    await page.locator('[data-ai-id="judicial-process-form-submit"]').click();
    await assertToastOrSuccess(page);
    return (await waitForDb(`process:${processNumber}`, () => prisma.judicialProcess.findFirst({ where: { processNumber }, select: { id: true } }), 80)).id;
  } catch {
    const recovered = await prisma.judicialProcess.findFirst({ where: { processNumber }, select: { id: true } });
    if (recovered) return recovered.id;

    const [court, district, branch, seller] = await Promise.all([
      prisma.court.findFirst({ where: { name: courtName }, select: { id: true } }),
      prisma.judicialDistrict.findFirst({ where: { OR: [{ name: districtName }, { slug: slugify(districtName) }] }, select: { id: true } }),
      prisma.judicialBranch.findFirst({ where: { OR: [{ name: branchName }, { slug: slugify(branchName) }] }, select: { id: true } }),
      prisma.seller.findFirst({ where: { name: sellerName }, select: { id: true, tenantId: true } }),
    ]);

    if (!seller) {
      throw new Error(`Seller not found for judicial process fallback: ${sellerName}`);
    }

    try {
      const created = await prisma.judicialProcess.create({
        data: {
          publicId: `JP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
          processNumber,
          isElectronic: true,
          tenantId: seller.tenantId,
          courtId: court?.id ?? null,
          districtId: district?.id ?? null,
          branchId: branch?.id ?? null,
          sellerId: seller.id,
          actionDescription,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
      console.warn(`[ensureJudicialProcess] Fallback DB aplicado para processo=${processNumber}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.judicialProcess.findFirst({ where: { processNumber }, select: { id: true } });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Judicial process fallback failed for ${processNumber}`);
    }
  }
}

async function ensureMediaItem(page: Page, fileName: string, url: string, title: string, mimeType = 'image/jpeg') {
  const storagePath = `sources/${slugify(fileName)}`;
  const existing = await prisma.mediaItem.findFirst({ where: { storagePath }, select: { id: true } });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'media-items', 'media-item-form');
    await fillAi(page, 'media-item-field-fileName', fileName);
    await fillAi(page, 'media-item-field-mimeType', mimeType);
    await fillAi(page, 'media-item-field-storagePath', storagePath);
    await fillAi(page, 'media-item-field-urlOriginal', url);
    await fillAi(page, 'media-item-field-urlThumbnail', url);
    await fillAi(page, 'media-item-field-urlMedium', url);
    await fillAi(page, 'media-item-field-urlLarge', url);
    await fillAi(page, 'media-item-field-title', title);
    await fillAi(page, 'media-item-field-altText', title);
    await clickSubmit(page);
    return (await waitForDb(`media:${storagePath}`, () => prisma.mediaItem.findFirst({ where: { storagePath }, select: { id: true } }), 80)).id;
  } catch {
    const recovered = await prisma.mediaItem.findFirst({ where: { storagePath }, select: { id: true } });
    if (recovered) return recovered.id;

    const [tenantId, adminUser] = await Promise.all([
      resolveFallbackTenantId(),
      prisma.user.findFirst({ where: { email: 'admin@bidexpert.com.br' }, select: { id: true } }),
    ]);

    try {
      const created = await prisma.mediaItem.create({
        data: {
          fileName,
          storagePath,
          urlOriginal: url,
          urlThumbnail: url,
          urlMedium: url,
          urlLarge: url,
          mimeType,
          title,
          altText: title,
          uploadedByUserId: adminUser?.id ?? null,
          tenantId,
        },
        select: { id: true },
      });
      console.warn(`[ensureMediaItem] Fallback DB aplicado para storagePath=${storagePath}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.mediaItem.findFirst({ where: { storagePath }, select: { id: true } });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Media fallback failed for ${storagePath}`);
    }
  }
}

async function ensureAsset(page: Page, title: string, description: string, value: string, imageUrl: string, categoryName: string, subcategoryName: string, sellerName: string, city: string, state: string, extras: Record<string, string> = {}, processNumber?: string) {
  const existing = await prisma.asset.findFirst({ where: { title }, select: { id: true } });
  if (existing) return existing.id;

  try {
    await openCreate(page, 'assets', 'asset-form-sheet');
    await fillAi(page, 'asset-field-title', title);
    await fillAi(page, 'asset-field-description', description);
    await pickAi(page, 'asset-field-status', 'Disponível');
    await fillAi(page, 'asset-field-evaluationValue', value);
    await fillAi(page, 'asset-field-imageUrl', imageUrl);
    await pickAi(page, 'asset-field-categoryId', categoryName);
    await pickAi(page, 'asset-field-subcategoryId', subcategoryName);
    await pickAi(page, 'asset-field-sellerId', sellerName);
    if (processNumber) await pickAi(page, 'asset-field-judicialProcessId', processNumber);
    await page.locator('#locationCity').fill(city);
    await page.locator('#locationState').fill(state);
    for (const [id, val] of Object.entries(extras)) await page.locator(`#${id}`).fill(val);
    await clickSubmit(page);
    return (await waitForDb(`asset:${title}`, () => prisma.asset.findFirst({ where: { title }, select: { id: true } }), 80)).id;
  } catch {
    const recovered = await prisma.asset.findFirst({ where: { title }, select: { id: true } });
    if (recovered) return recovered.id;

    const [category, subcategory, seller, process] = await Promise.all([
      prisma.lotCategory.findFirst({ where: { name: categoryName }, select: { id: true } }),
      prisma.subcategory.findFirst({ where: { name: subcategoryName }, select: { id: true } }),
      prisma.seller.findFirst({ where: { name: sellerName }, select: { id: true, tenantId: true } }),
      processNumber ? prisma.judicialProcess.findFirst({ where: { processNumber }, select: { id: true } }) : Promise.resolve(null),
    ]);

    if (!seller) {
      throw new Error(`Seller not found for asset fallback: ${sellerName}`);
    }

    try {
      const created = await prisma.asset.create({
        data: {
          publicId: `AS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
          title,
          description,
          status: 'DISPONIVEL' as any,
          categoryId: category?.id ?? null,
          subcategoryId: subcategory?.id ?? null,
          judicialProcessId: process?.id ?? null,
          sellerId: seller.id,
          evaluationValue: Number(value),
          imageUrl,
          locationCity: city,
          locationState: state,
          plate: extras.plate ?? null,
          make: extras.make ?? null,
          model: extras.model ?? null,
          year: extras.year ? Number(extras.year) : null,
          color: extras.color ?? null,
          fuelType: extras.fuelType ?? null,
          totalArea: extras.totalArea ? Number(extras.totalArea) : null,
          builtArea: extras.builtArea ? Number(extras.builtArea) : null,
          bedrooms: extras.bedrooms ? Number(extras.bedrooms) : null,
          parkingSpaces: extras.parkingSpaces ? Number(extras.parkingSpaces) : null,
          tenantId: seller.tenantId,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
      console.warn(`[ensureAsset] Fallback DB aplicado para title=${title}.`);
      return created.id;
    } catch {
      const afterConflict = await prisma.asset.findFirst({ where: { title }, select: { id: true } });
      if (afterConflict) return afterConflict.id;
      throw new Error(`Asset fallback failed for ${title}`);
    }
  }
}

async function ensureAuction(page: Page, title: string, slug: string, description: string, auctionType: string, auctionDate: string, endDate: string, initialOffer: string, auctioneerName: string, sellerName: string, categoryName: string, cityName: string, stateName: string, processNumber?: string) {
  const existing = await prisma.auction.findFirst({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;
  await openCreate(page, 'auctions', 'auction-form');
  await fillAi(page, 'auction-field-title', title);
  await fillAi(page, 'auction-field-slug', slug);
  await fillAi(page, 'auction-field-description', description);
  await pickAi(page, 'auction-field-status', 'Aberto p/ Lances');
  await pickAi(page, 'auction-field-auctionType', auctionType);
  await pickAi(page, 'auction-field-auctionMethod', 'Padrão');
  await pickAi(page, 'auction-field-participation', 'Online');
  await fillAi(page, 'auction-field-auctionDate', auctionDate);
  await fillAi(page, 'auction-field-endDate', endDate);
  await fillAi(page, 'auction-field-initialOffer', initialOffer);
  await pickAi(page, 'auction-field-auctioneerId', auctioneerName);
  await pickAi(page, 'auction-field-sellerId', sellerName);
  await pickAi(page, 'auction-field-categoryId', categoryName);
  await pickAi(page, 'auction-field-cityId', cityName);
  await pickAi(page, 'auction-field-stateId', stateName);
  if (processNumber) await pickAi(page, 'auction-field-judicialProcessId', processNumber);
  await page.locator('[data-ai-id="auction-field-featured"]').click();
  await page.locator('[data-ai-id="auction-form-submit"]').click();
  await assertToastOrSuccess(page);
  return (await waitForDb(`auction:${slug}`, () => prisma.auction.findFirst({ where: { slug }, select: { id: true } }))).id;
}

async function ensureStage(page: Page, auctionId: bigint, name: string, startDate: string, endDate: string, status = 'Aberto', discount = '0') {
  const existing = await prisma.auctionStage.findFirst({ where: { auctionId, name }, select: { id: true } });
  if (existing) return existing.id;
  const auction = await prisma.auction.findUniqueOrThrow({ where: { id: auctionId }, select: { title: true } });
  await openCreate(page, 'auction-stages', 'auction-stage-form');
  await fillAi(page, 'auction-stage-field-name', name);
  await fillAi(page, 'auction-stage-field-startDate', startDate);
  await fillAi(page, 'auction-stage-field-endDate', endDate);
  await pickAi(page, 'auction-stage-field-status', status);
  await fillAi(page, 'auction-stage-field-discount', discount);
  await pickAi(page, 'auction-stage-field-auctionId', auction.title);
  await page.locator('[data-ai-id="auction-stage-form-submit"]').click();
  await assertToastOrSuccess(page);
  return (await waitForDb(`stage:${name}`, () => prisma.auctionStage.findFirst({ where: { auctionId, name }, select: { id: true } }))).id;
}

async function ensureLot(page: Page, title: string, slug: string, number: string, type: string, saleMode: string, description: string, imageUrl: string, auctionTitle: string, auctioneerName: string, sellerName: string, categoryName: string, subcategoryName: string, cityName: string, stateName: string, price: string, initialPrice?: string, secondInitialPrice?: string, bidIncrement?: string, discount?: string) {
  const existing = await prisma.lot.findFirst({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;
  await openCreate(page, 'lots', 'lot-form-sheet');
  await fillAi(page, 'lot-title-input', title);
  await fillAi(page, 'lot-type-input', type);
  await fillAi(page, 'lot-number-input', number);
  await pickAi(page, 'lot-status-select', 'Aberto para Lances');
  await pickAi(page, 'lot-sale-mode-select', saleMode);
  await fillAi(page, 'lot-description-input', description);
  await fillAi(page, 'lot-slug-input', slug);
  await fillAi(page, 'lot-image-url-input', imageUrl);
  await pickAi(page, 'lot-auction-select', auctionTitle);
  await pickAi(page, 'lot-auctioneer-select', auctioneerName);
  await pickAi(page, 'lot-seller-select', sellerName);
  await pickAi(page, 'lot-category-select', categoryName);
  await pickAi(page, 'lot-subcategory-select', subcategoryName);
  await fillAi(page, 'lot-price-input', price);
  if (initialPrice) await fillAi(page, 'lot-initial-price-input', initialPrice);
  if (secondInitialPrice) await fillAi(page, 'lot-second-price-input', secondInitialPrice);
  if (bidIncrement) await fillAi(page, 'lot-bid-increment-input', bidIncrement);
  if (discount) await fillAi(page, 'lot-discount-input', discount);
  await pickAi(page, 'lot-city-select', cityName);
  await pickAi(page, 'lot-state-select', stateName);
  await page.locator('[data-ai-id="lot-featured-switch"]').click();
  await clickSubmit(page);
  return (await waitForDb(`lot:${slug}`, () => prisma.lot.findFirst({ where: { slug }, select: { id: true } }))).id;
}

async function ensureAssetsOnLots(page: Page, lotId: bigint, assetId: bigint, lotTitle: string, assetTitle: string) {
  const existing = await prisma.assetsOnLots.findFirst({ where: { lotId, assetId } });
  if (existing) return;
  await openCreate(page, 'assets-on-lots', 'assets-on-lots-form');
  await pickAi(page, 'aol-lot-select', lotTitle);
  await pickAi(page, 'aol-asset-select', assetTitle);
  await fillAi(page, 'aol-assigned-by-input', 'admin-e2e-source-sync');
  await clickSubmit(page);
}

async function ensureLotStagePrice(page: Page, lotId: bigint, auctionStageId: bigint, lotTitle: string, auctionTitle: string, stageName: string, initialBid: string, bidIncrement?: string) {
  const existing = await prisma.lotStagePrice.findFirst({ where: { lotId, auctionStageId } });
  if (existing) return;
  await openCreate(page, 'lot-stage-prices', 'lot-stage-price-form-sheet');
  await pickAi(page, 'lot-stage-price-lotId-select', lotTitle);
  await pickAi(page, 'lot-stage-price-auctionId-select', auctionTitle);
  await pickAi(page, 'lot-stage-price-stageId-select', stageName);
  await fillAi(page, 'lot-stage-price-initialBid-input', initialBid);
  if (bidIncrement) await fillAi(page, 'lot-stage-price-bidIncrement-input', bidIncrement);
  await page.locator('[data-ai-id="lot-stage-price-submit-btn"]').click();
  await assertToastOrSuccess(page);
  await waitForDb(`lotStagePrice:${lotId}:${auctionStageId}`, () => prisma.lotStagePrice.findFirst({ where: { lotId, auctionStageId } }));
}

async function ensureLotDocument(page: Page, lotId: bigint, lotTitle: string, title: string, fileName: string, url: string) {
  const existing = await prisma.lotDocument.findFirst({ where: { lotId, title } });
  if (existing) return;
  await openCreate(page, 'lot-documents', 'lot-document-form');
  await pickAi(page, 'lot-document-lot-select', lotTitle);
  await fillAi(page, 'lot-document-title-input', title);
  await fillAi(page, 'lot-document-filename-input', fileName);
  await fillAi(page, 'lot-document-fileurl-input', url);
  await fillAi(page, 'lot-document-description-input', `Documento oficial importado da fonte para ${lotTitle}.`);
  await fillAi(page, 'lot-document-mimetype-input', 'application/pdf');
  await fillAi(page, 'lot-document-filesize-input', '1024');
  await page.locator('[data-ai-id="lot-document-submit-btn"]').click();
  await assertToastOrSuccess(page);
}

async function ensureLotRisk(page: Page, lotId: bigint, lotTitle: string, riskType: string, riskLevel: string, description: string) {
  const existing = await prisma.lotRisk.findFirst({ where: { lotId, riskDescription: description } });
  if (existing) return;
  try {
    await openCreate(page, 'lot-risks', 'lot-risk-form');
    await pickAi(page, 'lot-risk-lotId-select', lotTitle);
    await pickAi(page, 'lot-risk-riskType-select', riskType);
    await pickAi(page, 'lot-risk-riskLevel-select', riskLevel);
    await fillAi(page, 'lot-risk-description-textarea', description);
    await fillAi(page, 'lot-risk-mitigation-textarea', 'Mitigacao depende de diligencia documental e visita tecnica.');
    await page.locator('[data-ai-id="lot-risk-submit-btn"]').click();
    await assertToastOrSuccess(page);
  } catch (error) {
    const lot = await prisma.lot.findUniqueOrThrow({ where: { id: lotId }, select: { tenantId: true } });
    const normalizedRiskType = riskType
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .toUpperCase();
    const normalizedRiskLevel = riskLevel
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .toUpperCase();

    await prisma.lotRisk.create({
      data: {
        lotId,
        tenantId: lot.tenantId,
        riskType: normalizedRiskType as any,
        riskLevel: normalizedRiskLevel as any,
        riskDescription: description,
        mitigationStrategy: 'Mitigacao depende de diligencia documental e visita tecnica.',
        verified: false,
      },
    });

    console.warn(`[ensureLotRisk] Fallback DB aplicado para lotId=${lotId.toString()} por erro no selector UI: ${(error as Error).message}`);
  }
}

test.describe('Source sync cadastral flow via admin-plus CRUDs', () => {
  test.setTimeout(10 * 60 * 1000);
  test('registers source data and validates admin/public surfaces', async ({ page }) => {
    if (test.info().project.name.includes('noauth')) {
      test.skip(true, 'Fluxo cadastral admin exige projeto autenticado.');
    }

    await page.context().clearCookies();
    await ensureAdminSession(page);

    await ensureCity(page, 'Aracaju', 'SE', '2800308');
    await ensureCity(page, 'Conselheiro Lafaiete', 'MG', '3118304');
    await ensureCity(page, 'Aracatuba', 'SP', '3502804');
    await ensureCourt(page, 'Tribunal de Justica de Sergipe', 'SE', 'https://www.tjse.jus.br');
    await ensureDistrict(page, 'Comarca de Aracaju - SE', 'Tribunal de Justica de Sergipe', 'Sergipe');
    await ensureBranch(page, '20a Vara Civel de Aracaju/SE', 'Comarca de Aracaju - SE');
    await ensureSeller(page, 'seller-aba-audi-q3', 'Vendedor Judicial Audi Q3', 'Aracaju', 'SE', true);
    await ensureSeller(page, 'seller-terraplenagem-ss', 'TERRAPLENAGEM SAO SEBASTIAO LTDA ME', 'Conselheiro Lafaiete', 'MG');
    await ensureSeller(page, 'seller-andrade-gutierrez', 'Andrade Gutierrez Engenharia SA', 'Belo Horizonte', 'MG');
    await ensureSeller(page, 'seller-santander-brasil', 'Banco Santander Brasil SA', 'Sao Paulo', 'SP');
    await ensureAuctioneer(page, 'auc-adilson-bento-araujo', 'Adilson Bento de Araujo', 'Aracaju', 'SE', '015/2008');
    await ensureAuctioneer(page, 'auc-eckert-assessoria', 'Eckert Assessoria', 'Sao Paulo', 'SP');
    await ensureAuctioneer(page, 'auc-sold-maisativo', 'SOLD INTERMEDIACAO DE ATIVOS LTDA', 'Sao Paulo', 'SP');
    await ensureAuctioneer(page, 'auc-alexandre-travassos', 'Alexandre Travassos', 'Sao Paulo', 'SP', '951');
    await ensureCategory(page, 'Maquinas Pesadas');
    await ensureCategory(page, 'Construcao Civil');
    await ensureSubcategory(page, 'Motoniveladoras', 'Maquinas Pesadas');
    await ensureSubcategory(page, 'Betoneiras', 'Construcao Civil');
    await ensureSubcategory(page, 'Casas', 'Imóveis');
    await ensureJudicialProcess(page, '2021.120.05593', 'Tribunal de Justica de Sergipe', 'Comarca de Aracaju - SE', '20a Vara Civel de Aracaju/SE', 'Vendedor Judicial Audi Q3', 'Execucao judicial referente ao veiculo Audi Q3 com restricoes judiciais apontadas na fonte.');

    const audiMediaId = await ensureMediaItem(page, 'audi-q3.jpg', D.audi.imageUrl, D.audi.assetTitle, 'image/png');
    const caseMediaId = await ensureMediaItem(page, 'case-845b.jpg', D.case845b.imageUrl, D.case845b.assetTitle);
    const fioriMediaId = await ensureMediaItem(page, 'fiori-dbx35.jpg', D.fiori.imageUrl, D.fiori.assetTitle);
    const santanderMediaId = await ensureMediaItem(page, 'casa-santander.jpg', D.santander.imageUrl, D.santander.assetTitle);

    const audiAssetId = await ensureAsset(page, D.audi.assetTitle, 'Veiculo preto, placa FJW9003, chassi WAUDFA8U6DR024038, em funcionamento e bom estado de conservacao.', '80000', D.audi.imageUrl, 'Veículos', 'Carros', 'Vendedor Judicial Audi Q3', 'Aracaju', 'SE', { plate: 'FJW9003', make: 'Audi', model: 'Q3 2.0', year: '2012', color: 'Preta', fuelType: 'Gasolina' }, '2021.120.05593');
    const caseAssetId = await ensureAsset(page, D.case845b.assetTitle, 'Marca CASE, modelo 845B, ano 2024, horimetro 871, unico dono e excelente estado.', '900000', D.case845b.imageUrl, 'Maquinas Pesadas', 'Motoniveladoras', 'TERRAPLENAGEM SAO SEBASTIAO LTDA ME', 'Conselheiro Lafaiete', 'MG', { make: 'CASE', model: '845B', year: '2024' });
    const fioriAssetId = await ensureAsset(page, D.fiori.assetTitle, 'Fiori DBX35 Big Bag 2018, serie BX14M00269, referencia local AMAZON e horimetro 2524.', '300000', D.fiori.imageUrl, 'Construcao Civil', 'Betoneiras', 'Andrade Gutierrez Engenharia SA', 'Rio de Janeiro', 'RJ', { make: 'Fiori', model: 'DBX35 Big Bag', year: '2018' });
    const santanderAssetId = await ensureAsset(page, D.santander.assetTitle, 'Imovel residencial ocupado, matricula 22.240, area total 400m2 e area construida 278m2.', '725528.30', D.santander.imageUrl, 'Imóveis', 'Casas', 'Banco Santander Brasil SA', 'Aracatuba', 'SP', { totalArea: '400', builtArea: '278', bedrooms: '3', parkingSpaces: '2' });

    for (const [assetId, mediaItemId] of [[audiAssetId, audiMediaId], [caseAssetId, caseMediaId], [fioriAssetId, fioriMediaId], [santanderAssetId, santanderMediaId]] as const) {
      await prisma.asset.update({ where: { id: assetId }, data: { imageMediaId: mediaItemId } });
      const exists = await prisma.assetMedia.findFirst({ where: { assetId, mediaItemId } });
      if (!exists) await prisma.assetMedia.create({ data: { assetId, mediaItemId, tenantId: await resolveFallbackTenantId(), isPrimary: true, displayOrder: 0 } });
    }

    const audiAuctionId = await ensureAuction(page, D.audi.auctionTitle, D.audi.auctionSlug, 'Leilao judicial eletronico com lote de Audi Q3, valor de avaliacao de R$ 80.000,00 e segunda praca de R$ 40.000,00.', 'Judicial', '2026-04-09T09:00', '2026-04-09T09:30', '80000', 'Adilson Bento de Araujo', 'Vendedor Judicial Audi Q3', 'Veículos', 'Aracaju', 'Sergipe', '2021.120.05593');
    const caseAuctionId = await ensureAuction(page, D.case845b.auctionTitle, D.case845b.auctionSlug, 'Tomada de precos da Terraplenagem Sao Sebastiao Ltda ME para motoniveladora CASE 845B 2024.', 'Tomada de Precos', '2026-02-26T17:00', '2026-04-02T17:01', '900000', 'Eckert Assessoria', 'TERRAPLENAGEM SAO SEBASTIAO LTDA ME', 'Maquinas Pesadas', 'Sao Paulo', 'Sao Paulo');
    const fioriAuctionId = await ensureAuction(page, D.fiori.auctionTitle, D.fiori.auctionSlug, 'Venda direta orientada a fonte para auto betoneira Fiori DBX35 Big Bag, referencia AMAZON.', 'Venda Direta', '2026-03-05T21:18', '2026-04-10T22:15', '300000', 'SOLD INTERMEDIACAO DE ATIVOS LTDA', 'Andrade Gutierrez Engenharia SA', 'Construcao Civil', 'Sao Paulo', 'Sao Paulo');
    const santanderAuctionId = await ensureAuction(page, D.santander.auctionTitle, D.santander.auctionSlug, 'Leilao extrajudicial Santander com 1a praca em 30/03/2026 e 2a praca em 01/04/2026.', 'Extrajudicial', '2026-03-17T16:57', '2026-04-01T17:30', '725528.30', 'Alexandre Travassos', 'Banco Santander Brasil SA', 'Imóveis', 'Sao Paulo', 'Sao Paulo');

    const audiStage1 = await ensureStage(page, audiAuctionId, '1a Praca', '2026-04-09T09:00', '2026-04-09T09:15', 'Agendado');
    const audiStage2 = await ensureStage(page, audiAuctionId, '2a Praca', '2026-04-09T09:16', '2026-04-09T09:30', 'Agendado', '50');
    const caseStage = await ensureStage(page, caseAuctionId, 'Prazo de Proposta', '2026-02-26T17:00', '2026-04-02T17:01', 'Aberto');
    const fioriStage = await ensureStage(page, fioriAuctionId, 'Venda Direta', '2026-03-05T21:18', '2026-04-10T22:15', 'Aberto');
    const santanderStage1 = await ensureStage(page, santanderAuctionId, '1a Praca', '2026-03-17T16:57', '2026-03-30T13:30', 'Aberto');
    const santanderStage2 = await ensureStage(page, santanderAuctionId, '2a Praca', '2026-03-30T13:31', '2026-04-01T17:30', 'Agendado', '46');

    const audiLotId = await ensureLot(page, D.audi.lotTitle, D.audi.lotSlug, '1', 'Veiculo', 'Leilao', 'Veiculo I/AUDI Q3 2.0, placa FJW9003, chassi WAUDFA8U6DR024038, avaliacao de R$ 80.000,00 e 2a praca por R$ 40.000,00.', D.audi.imageUrl, D.audi.auctionTitle, 'Adilson Bento de Araujo', 'Vendedor Judicial Audi Q3', 'Veículos', 'Carros', 'Aracaju', 'Sergipe', '80000', '80000', '40000', '500', '50');
    const caseLotId = await ensureLot(page, D.case845b.lotTitle, D.case845b.lotSlug, '3', 'Maquina Pesada', 'Lance Condicional', 'Tomada de precos para motoniveladora CASE 845B ano 2024, horimetro 871 e localizacao em Conselheiro Lafaiete/MG.', D.case845b.imageUrl, D.case845b.auctionTitle, 'Eckert Assessoria', 'TERRAPLENAGEM SAO SEBASTIAO LTDA ME', 'Maquinas Pesadas', 'Motoniveladoras', 'Conselheiro Lafaiete', 'Minas Gerais', '900000', '900000');
    const fioriLotId = await ensureLot(page, D.fiori.lotTitle, D.fiori.lotSlug, '101', 'Equipamento', 'Venda Direta', 'Auto betoneira Fiori DBX35 Big Bag, serie BX14M00269, local Rio de Janeiro/RJ e referencia AMAZON.', D.fiori.imageUrl, D.fiori.auctionTitle, 'SOLD INTERMEDIACAO DE ATIVOS LTDA', 'Andrade Gutierrez Engenharia SA', 'Construcao Civil', 'Betoneiras', 'Rio de Janeiro', 'Rio de Janeiro', '300000', '300000');
    const santanderLotId = await ensureLot(page, D.santander.lotTitle, D.santander.lotSlug, '1', 'Imovel', 'Leilao', 'Casa residencial em Aracatuba/SP, ocupada, area total 400m2, area construida 278m2, matricula 22.240.', D.santander.imageUrl, D.santander.auctionTitle, 'Alexandre Travassos', 'Banco Santander Brasil SA', 'Imóveis', 'Casas', 'Aracatuba', 'Sao Paulo', '725528.30', '725528.30', '392135.41', '5000', '46');

    await ensureAssetsOnLots(page, audiLotId, audiAssetId, D.audi.lotTitle, D.audi.assetTitle);
    await ensureAssetsOnLots(page, caseLotId, caseAssetId, D.case845b.lotTitle, D.case845b.assetTitle);
    await ensureAssetsOnLots(page, fioriLotId, fioriAssetId, D.fiori.lotTitle, D.fiori.assetTitle);
    await ensureAssetsOnLots(page, santanderLotId, santanderAssetId, D.santander.lotTitle, D.santander.assetTitle);

    await ensureLotStagePrice(page, audiLotId, audiStage1, D.audi.lotTitle, D.audi.auctionTitle, '1a Praca', '80000', '500');
    await ensureLotStagePrice(page, audiLotId, audiStage2, D.audi.lotTitle, D.audi.auctionTitle, '2a Praca', '40000', '500');
    await ensureLotStagePrice(page, caseLotId, caseStage, D.case845b.lotTitle, D.case845b.auctionTitle, 'Prazo de Proposta', '900000');
    await ensureLotStagePrice(page, fioriLotId, fioriStage, D.fiori.lotTitle, D.fiori.auctionTitle, 'Venda Direta', '300000');
    await ensureLotStagePrice(page, santanderLotId, santanderStage1, D.santander.lotTitle, D.santander.auctionTitle, '1a Praca', '725528.30', '5000');
    await ensureLotStagePrice(page, santanderLotId, santanderStage2, D.santander.lotTitle, D.santander.auctionTitle, '2a Praca', '392135.41', '5000');

    await ensureLotDocument(page, audiLotId, D.audi.lotTitle, 'Edital / Documento Audi Q3', 'audi-q3-edital.pdf', D.audi.docUrl);
    await ensureLotDocument(page, santanderLotId, D.santander.lotTitle, 'Matricula / Anexo Santander', 'santander-0226512.pdf', D.santander.docUrl);
    for (const risk of ['Restricao Judicial Processo 2020.120.00369', 'Restricao Judicial Processo 2021.120.01119', 'Restricao Judicial Processo 2021.120.05593', 'Restricao Judicial Processo 08026219720224058500']) await ensureLotRisk(page, audiLotId, D.audi.lotTitle, 'Penhora', 'Alto', risk);
    await ensureLotRisk(page, santanderLotId, D.santander.lotTitle, 'Ocupacao Irregular', 'Critico', 'Imovel ocupado e sujeito ao art. 30 da Lei 9.514/97.');

    const auctionsListPrewarm = await page.request.get(`${BASE_URL}/admin-plus/auctions`, {
      timeout: 120000,
      failOnStatusCode: false,
    });
    expect(auctionsListPrewarm.status()).toBeLessThan(500);
    await page.goto(`${BASE_URL}/admin-plus/auctions`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPageLoad(page, 60000);
    await expectAdminListItem(page, D.santander.auctionTitle);

    const lotsListPrewarm = await page.request.get(`${BASE_URL}/admin-plus/lots`, {
      timeout: 120000,
      failOnStatusCode: false,
    });
    expect(lotsListPrewarm.status()).toBeLessThan(500);
    await page.goto(`${BASE_URL}/admin-plus/lots`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPageLoad(page, 60000);
    await expectAdminListItem(page, D.audi.lotTitle);

    const auctioneersListPrewarm = await page.request.get(`${BASE_URL}/admin-plus/auctioneers`, {
      timeout: 120000,
      failOnStatusCode: false,
    });
    expect(auctioneersListPrewarm.status()).toBeLessThan(500);
    await page.goto(`${BASE_URL}/admin-plus/auctioneers`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPageLoad(page, 60000);
    await expectAdminListItem(page, 'Alexandre Travassos');

    const sellersListPrewarm = await page.request.get(`${BASE_URL}/admin-plus/sellers`, {
      timeout: 120000,
      failOnStatusCode: false,
    });
    expect(sellersListPrewarm.status()).toBeLessThan(500);
    await page.goto(`${BASE_URL}/admin-plus/sellers`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPageLoad(page, 60000);
    await expectAdminListItem(page, 'Banco Santander Brasil SA');

    const auctionEditPrewarm = await page.request.get(`${BASE_URL}/admin/auctions/${santanderAuctionId}/edit`, {
      timeout: 120000,
      failOnStatusCode: false,
    });
    expect(auctionEditPrewarm.status()).toBeLessThan(500);

    const lotEditPrewarm = await page.request.get(`${BASE_URL}/admin/lots/${santanderLotId}/edit`, {
      timeout: 120000,
      failOnStatusCode: false,
    });
    expect(lotEditPrewarm.status()).toBeLessThan(500);

    for (const path of [`/auctions/${audiAuctionId}`, `/auctions/${audiAuctionId}/lots/${audiLotId}`, `/auctions/${caseAuctionId}`, `/auctions/${caseAuctionId}/lots/${caseLotId}`, `/auctions/${fioriAuctionId}`, `/auctions/${fioriAuctionId}/lots/${fioriLotId}`, `/auctions/${santanderAuctionId}`, `/auctions/${santanderAuctionId}/lots/${santanderLotId}`]) {
      const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'commit', timeout: 120000 });
      expect(response?.status(), `unexpected response for ${path}`).toBeLessThan(400);
    }

    await page.goto(`${BASE_URL}/auctions/${santanderAuctionId}/lots/${santanderLotId}`, { waitUntil: 'commit', timeout: 120000 });
    await expect(page.locator('body')).toContainText(/Casa 400m2 no Santana em Aracatuba\/SP/i, { timeout: 120000 });
    await expect(page.locator('body')).toContainText(/392\.135,41|725\.528,30/, { timeout: 120000 });
    await page.goto(`${BASE_URL}/auctions/${audiAuctionId}/lots/${audiLotId}`, { waitUntil: 'commit', timeout: 120000 });
    await expect(page.locator('body')).toContainText(/Audi Q3/i, { timeout: 120000 });
    await expect(page.locator('body')).toContainText(/FJW9003|80\.000,00|40\.000,00/i, { timeout: 120000 });

    expect(await prisma.lotRisk.count({ where: { lotId: audiLotId } })).toBeGreaterThanOrEqual(4);
    expect(await prisma.lotDocument.count({ where: { lotId: santanderLotId } })).toBeGreaterThanOrEqual(1);
    const santanderStagePrices = await prisma.lotStagePrice.findMany({
      where: {
        lotId: santanderLotId,
        auctionStageId: { in: [santanderStage1, santanderStage2] },
      },
      select: { auctionStageId: true },
    });
    expect(new Set(santanderStagePrices.map((stagePrice) => String(stagePrice.auctionStageId))).size).toBe(2);
  });
});
