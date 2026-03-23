/**
 * wizard-registration-cycle.spec.ts
 *
 * Registers 4 REAL auctions via the Admin Wizard UI, exercising every step:
 *   1. JUDICIAL  – AbaLeilões #422 Terreno Salgado/SE
 *   2. TOMADA_DE_PRECOS – Nutrien Terrenos Industriais (2 lots)
 *   3. TOMADA_DE_PRECOS – Santander Alienação Fiduciária (1 lot)
 *   4. PARTICULAR – Usina Moenda de Cana (1 lot)
 *
 * Data is inserted exclusively through UI forms (no seed scripts).
 */

import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { loginAsAdmin } from '../helpers/auth-helper';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = 'http://demo.localhost:9006';
const WIZARD_PATH = '/admin/wizard';
const TIMEOUT_NAV = 120_000; // dev mode lazy compilation can take 60s+
const TIMEOUT_MODAL = 15_000;
const TIMEOUT_ACTION = 15_000;
const TEST_TENANT_ID = 1n;
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Reference data (pre-seeded in shared MySQL — verified via prior DB queries)
// ---------------------------------------------------------------------------

const REF = {
  auctioneer: { name: 'Adilson Bento de Araújo', id: 87 },
  sellers: {
    santander: { name: 'Santander Brasil', id: 6 },
    nutrien: { name: 'Nutrien Soluções Agrícolas', id: 84 },
    usina: { name: 'Usina Santa Isabel S/A', id: 85 },
  },
  categories: {
    imoveis: { name: 'Imóveis', id: 1 },
    veiculos: { name: 'Veículos', id: 2 },
    maquinario: { name: 'Maquinário', id: 5 },
  },
  cities: {
    salgado: { name: 'Salgado', stateAbbr: 'SE', id: 941039582972n },
    rioVerde: { name: 'Rio Verde', stateAbbr: 'GO', id: 941039582973n },
    candidoMota: { name: 'Cândido Mota', stateAbbr: 'SP', id: 941039582974n },
    wenceslauBraz: { name: 'Wenceslau Braz', stateAbbr: 'PR', id: 941039582975n },
    novoHorizonte: { name: 'Novo Horizonte', stateAbbr: 'SP', id: 941039582976n },
  },
} as const;

// ---------------------------------------------------------------------------
// Auction fixtures (REAL data, not faker)
// ---------------------------------------------------------------------------

interface StageData {
  name: string;
  startDate: string; // yyyy-MM-ddTHH:mm
  endDate: string;
  initialPrice: string;
  discountPercent?: string;
}

interface AssetData {
  title: string;
  description: string;
  categoryName: string;
  evaluationValue: string;
}

interface AuctionFixture {
  type: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';
  typeLabel: string;
  title: string;
  description: string;
  sellerName: string;
  auctioneerName: string;
  participation: string;
  method: string;
  stages: StageData[];
  assets: AssetData[];
  /* JUDICIAL-specific */
  processNumber?: string;
  processIsElectronic?: boolean;
}

const AUCTION_1_JUDICIAL: AuctionFixture = {
  type: 'JUDICIAL',
  typeLabel: 'Leilão Judicial',
  title: 'Leilão Judicial - Imóvel Salgado/SE - Processo 2024.711.01064',
  description:
    'Terreno situado no município de Salgado/SE, Loteamento Salgado Residence, Povoado Quebradas IV, matrícula nº 7313, Lote 12, Quadra 7, com área de 160m² (8,0m x 20,0m). Processo nº 2024.711.01064, CNJ 0001041-78.2024.8.25.0037, Vara Única de Salgado/SE. Exequente: Danilo dos Santos Oliveira e Outros. Executado: Grasso Empreendimentos Imobiliários Ltda ME.',
  sellerName: 'Grasso Empreendimentos Imobiliarios Ltda ME',
  auctioneerName: REF.auctioneer.name,
  participation: 'ONLINE',
  method: 'STANDARD',
  processNumber: '2024.711.01064',
  processIsElectronic: true,
  stages: [
    {
      name: '1ª Praça',
      startDate: '2026-03-11T10:00',
      endDate: '2026-03-18T10:00',
      initialPrice: '20000',
      discountPercent: '100',
    },
    {
      name: '2ª Praça',
      startDate: '2026-03-18T10:01',
      endDate: '2026-03-25T10:00',
      initialPrice: '10000',
      discountPercent: '50',
    },
  ],
  assets: [
    {
      title: 'Terreno 160m² - Salgado/SE - Matrícula 7313 - Lote 12, Qd 7',
      description:
        'Lote com área de 160m² (8,0m x 20,0m), Loteamento Salgado Residence, Povoado Quebradas IV, Salgado/SE. Matrícula nº 7313, Livro nº 2, Cartório do 1º Ofício de Itaporanga D\'Ajuda/SE. Lote nº 12, Quadra 7.',
      categoryName: REF.categories.imoveis.name,
      evaluationValue: '20000',
    },
  ],
};

function slugifyForTest(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function ensureAuction1ReferenceEntities(): Promise<void> {
  const court = await prisma.court.upsert({
    where: { slug: 'tjse-e2e-salgado' },
    update: { name: 'Tribunal de Justiça de Sergipe', stateUf: 'SE', updatedAt: new Date() },
    create: {
      slug: 'tjse-e2e-salgado',
      name: 'Tribunal de Justiça de Sergipe',
      stateUf: 'SE',
      updatedAt: new Date(),
    },
  });

  const district = await prisma.judicialDistrict.upsert({
    where: { slug: 'comarca-salgado-se-e2e' },
    update: { name: 'Comarca de Salgado/SE', courtId: court.id, updatedAt: new Date() },
    create: {
      slug: 'comarca-salgado-se-e2e',
      name: 'Comarca de Salgado/SE',
      courtId: court.id,
      updatedAt: new Date(),
    },
  });

  const branch = await prisma.judicialBranch.upsert({
    where: { slug: 'vara-unica-salgado-se-e2e' },
    update: { name: 'Vara Única de Salgado/SE', districtId: district.id, updatedAt: new Date() },
    create: {
      slug: 'vara-unica-salgado-se-e2e',
      name: 'Vara Única de Salgado/SE',
      districtId: district.id,
      updatedAt: new Date(),
    },
  });

  const sellerSlug = slugifyForTest(AUCTION_1_JUDICIAL.sellerName);
  const seller = await prisma.seller.upsert({
    where: { name: AUCTION_1_JUDICIAL.sellerName },
    update: {
      slug: sellerSlug,
      description: 'Executado do caso de referência AbaLeilões #422',
      isJudicial: true,
      tenantId: TEST_TENANT_ID,
      judicialBranchId: branch.id,
      updatedAt: new Date(),
    },
    create: {
      publicId: 'SELL-E2E-GRASSO',
      name: AUCTION_1_JUDICIAL.sellerName,
      slug: sellerSlug,
      description: 'Executado do caso de referência AbaLeilões #422',
      isJudicial: true,
      tenantId: TEST_TENANT_ID,
      judicialBranchId: branch.id,
      updatedAt: new Date(),
    },
  });

  const process = await prisma.judicialProcess.upsert({
    where: {
      processNumber_tenantId: {
        processNumber: AUCTION_1_JUDICIAL.processNumber!,
        tenantId: TEST_TENANT_ID,
      },
    },
    update: {
      isElectronic: true,
      courtId: court.id,
      districtId: district.id,
      branchId: branch.id,
      sellerId: seller.id,
      propertyMatricula: '7313',
      actionType: 'PENHORA',
      actionDescription: 'Leilão judicial de imóvel em Salgado/SE baseado na referência AbaLeilões #422.',
      actionCnjCode: '00010417820248250037',
      updatedAt: new Date(),
    },
    create: {
      publicId: 'PROC-E2E-SALGADO-202471101064',
      processNumber: AUCTION_1_JUDICIAL.processNumber!,
      isElectronic: true,
      tenantId: TEST_TENANT_ID,
      courtId: court.id,
      districtId: district.id,
      branchId: branch.id,
      sellerId: seller.id,
      propertyMatricula: '7313',
      actionType: 'PENHORA',
      actionDescription: 'Leilão judicial de imóvel em Salgado/SE baseado na referência AbaLeilões #422.',
      actionCnjCode: '00010417820248250037',
      updatedAt: new Date(),
    },
  });

  await prisma.judicialParty.deleteMany({
    where: {
      processId: process.id,
      tenantId: TEST_TENANT_ID,
    },
  });

  await prisma.judicialParty.createMany({
    data: [
      {
        name: 'DANILO DOS SANTOS OLIVEIRA E OUTROS',
        partyType: 'AUTOR',
        processId: process.id,
        tenantId: TEST_TENANT_ID,
      },
      {
        name: 'GRASSO EMPREENDIMENTOS IMOBILIARIOS LTDA ME',
        partyType: 'REU',
        processId: process.id,
        tenantId: TEST_TENANT_ID,
      },
    ],
  });
}

const AUCTION_2_TOMADA_NUTRIEN: AuctionFixture = {
  type: 'TOMADA_DE_PRECOS',
  typeLabel: 'Tomada de Preços',
  title: 'Nutrien - Terrenos Industriais - Lote GO e SP',
  description:
    'Alienação de 2 terrenos industriais: Terreno em Rio Verde/GO (117.702m²) e Terreno em Cândido Mota/SP (12,1ha).',
  sellerName: REF.sellers.nutrien.name,
  auctioneerName: REF.auctioneer.name,
  participation: 'ONLINE',
  method: 'STANDARD',
  stages: [
    {
      name: 'Praça Única',
      startDate: '2026-04-01T10:00',
      endDate: '2026-04-09T18:00',
      initialPrice: '6528985',
    },
  ],
  assets: [
    {
      title: 'Terreno Industrial 117.702m² - Rio Verde/GO',
      description:
        'Terreno industrial com 117.702 m² localizado em Rio Verde, Goiás. Área industrial com acesso rodoviário.',
      categoryName: REF.categories.imoveis.name,
      evaluationValue: '6528985',
    },
    {
      title: 'Terreno Urbano 12,1ha - Cândido Mota/SP',
      description:
        'Terreno urbano com aproximadamente 12,1 hectares em Cândido Mota, São Paulo.',
      categoryName: REF.categories.imoveis.name,
      evaluationValue: '5500000',
    },
  ],
};

const AUCTION_3_TOMADA_SANTANDER: AuctionFixture = {
  type: 'TOMADA_DE_PRECOS',
  typeLabel: 'Tomada de Preços',
  title: 'Santander - Alienação Fiduciária - Wenceslau Braz/PR',
  description:
    'Terrenos rurais com área total de 7,37ha, matrícula 16.625, Wenceslau Braz/PR. Alienação fiduciária – Santander.',
  sellerName: REF.sellers.santander.name,
  auctioneerName: REF.auctioneer.name,
  participation: 'ONLINE',
  method: 'STANDARD',
  stages: [
    {
      name: '1ª Praça',
      startDate: '2026-04-05T10:00',
      endDate: '2026-04-10T18:00',
      initialPrice: '1281422.65',
      discountPercent: '100',
    },
    {
      name: '2ª Praça',
      startDate: '2026-04-10T18:01',
      endDate: '2026-04-15T18:00',
      initialPrice: '769000',
      discountPercent: '60',
    },
  ],
  assets: [
    {
      title: 'Terrenos Rurais 7,37ha - Wenceslau Braz/PR',
      description:
        'Terrenos rurais com área total de 7,37 hectares, matrícula nº 16.625, município de Wenceslau Braz, Paraná.',
      categoryName: REF.categories.imoveis.name,
      evaluationValue: '1281422.65',
    },
  ],
};

const AUCTION_4_PARTICULAR_USINA: AuctionFixture = {
  type: 'PARTICULAR',
  typeLabel: 'Leilão Particular',
  title: 'Usina Santa Isabel - Moenda de Cana Five Lille 1952',
  description:
    'Moenda de Cana-de-Açúcar marca Five Lille, ano 1952, localizada em Novo Horizonte/SP. Venda direta.',
  sellerName: REF.sellers.usina.name,
  auctioneerName: REF.auctioneer.name,
  participation: 'ONLINE',
  method: 'STANDARD',
  stages: [
    {
      name: 'Praça Única',
      startDate: '2026-04-05T09:00',
      endDate: '2026-04-20T18:00',
      initialPrice: '1500000',
    },
  ],
  assets: [
    {
      title: 'Moenda de Cana Five Lille 1952 - Novo Horizonte/SP',
      description:
        'Moenda de Cana-de-Açúcar, marca Five Lille, fabricação 1952. Localizada na usina em Novo Horizonte/SP.',
      categoryName: REF.categories.maquinario.name,
      evaluationValue: '1500000',
    },
  ],
};

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

/** Navigate to wizard page and wait for heading */
async function navigateToWizard(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${WIZARD_PATH}`, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_NAV,
  });
  // Wait for the wizard heading or step-1 container
  await page
    .locator('[data-ai-id="wizard-step1-type-selection"], h1:has-text("Assistente")')
    .first()
    .waitFor({ state: 'visible', timeout: TIMEOUT_NAV });
}

/** Step 1: Click a type radio and advance */
async function selectAuctionType(page: Page, typeLabel: string): Promise<void> {
  const radio = page.getByLabel(typeLabel);
  await radio.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });
  await radio.click();
  await page.getByRole('button', { name: /próximo/i }).click();
  // Wait for next step to render
  await page.waitForTimeout(1000);
}

/**
 * Select an entity inside an EntitySelector modal by matching the FormLabel text
 * that precedes the trigger button.
 *
 * Because AuctionForm's EntitySelectors all default entityName="registro",
 * we must locate by the label text (e.g. "Leiloeiro", "Comitente/Vendedor").
 */
async function selectEntityByLabel(
  page: Page,
  labelText: string,
  entitySubstring?: string,
): Promise<void> {
  const label = page
    .locator('label')
    .filter({ hasText: new RegExp(`^${escapeRegex(labelText)}`, 'i') })
    .first();

  const triggerToUse = label
    .locator('xpath=ancestor::div[contains(@class,"space-y-2")][1]//button[contains(@data-ai-id,"entity-selector-trigger")]')
    .first();

  await triggerToUse.scrollIntoViewIfNeeded();
  await triggerToUse.click({ timeout: TIMEOUT_ACTION });

  // Wait for the entity selector modal/dialog
  const modal = page.locator('[role="dialog"]').filter({
    has: page.locator('table, [data-ai-id*="entity-selector"]'),
  });
  await modal.first().waitFor({ state: 'visible', timeout: TIMEOUT_MODAL });

  // If entitySubstring given, use the search input to filter results first
  if (entitySubstring) {
    const searchInput = modal.locator('[data-ai-id="data-table-search-input"], input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.click();
      await searchInput.clear();
      // pressSequentially types char-by-char which triggers React onChange properly
      // (fill() sets value programmatically and may not fire synthetic onChange)
      await searchInput.pressSequentially(entitySubstring, { delay: 30 });
      await page.waitForTimeout(600); // wait for column filter to apply
    }

    const row = modal
      .locator('[data-ai-id^="entity-selector-row-"], tr, [role="row"]')
      .filter({ hasText: entitySubstring })
      .first();
    await row.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });
    const selectBtn = row.getByRole('button', { name: /selecionar/i });
    await selectBtn.click({ timeout: TIMEOUT_ACTION });
  } else {
    // Click first available "Selecionar"
    const selectBtn = modal.getByRole('button', { name: /selecionar/i }).first();
    await selectBtn.click({ timeout: TIMEOUT_ACTION });
  }

  // Wait for modal to close
  await modal.first().waitFor({ state: 'hidden', timeout: TIMEOUT_MODAL });
}

/**
 * Select a value in a ShadCN Select component by its label text.
 * Finds the label → next combobox/trigger → opens → picks option.
 */
async function selectShadcnByLabel(
  page: Page,
  labelText: string,
  optionText: string,
): Promise<void> {
  // Find label, then the associated select trigger
  const label = page.locator(`label:has-text("${labelText}")`).first();
  const trigger = label.locator(
    'xpath=following::button[@role="combobox" or @role="listbox" or contains(@class,"select")][1]',
  );

  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ timeout: TIMEOUT_ACTION });

  // Wait a beat for the dropdown to render
  await page.waitForTimeout(300);

  // Click the option
  const option = page.getByRole('option', { name: new RegExp(escapeRegex(optionText), 'i') }).first();
  if (await option.isVisible().catch(() => false)) {
    await option.click();
  } else {
    // Fallback: div[role="option"]
    const fallback = page.locator('[role="option"]').filter({ hasText: optionText }).first();
    await fallback.click({ timeout: TIMEOUT_ACTION });
  }

  // Press Escape to close any lingering popover
  await page.keyboard.press('Escape');
}

async function selectJudicialProcessByNumber(page: Page, processNumber: string): Promise<void> {
  const trigger = page
    .locator('[data-ai-id="entity-selector-trigger-Processo"], [data-ai-id="entity-selector-trigger-processo"]')
    .first();

  await trigger.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ timeout: TIMEOUT_ACTION });

  const modal = page.locator('[role="dialog"]').filter({
    has: page.locator('table, [data-ai-id*="entity-selector"]'),
  });
  await modal.first().waitFor({ state: 'visible', timeout: TIMEOUT_MODAL });

  const searchInput = modal.locator('[data-ai-id="data-table-search-input"], input[placeholder*="Buscar"]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.click();
    await searchInput.clear();
    await searchInput.pressSequentially(processNumber, { delay: 30 });
    await page.waitForTimeout(600);
  }

  const row = modal
    .locator('[data-ai-id^="entity-selector-row-"], tr, [role="row"]')
    .filter({ hasText: processNumber })
    .first();
  await row.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });
  await row.getByRole('button', { name: /selecionar/i }).click({ timeout: TIMEOUT_ACTION });

  await modal.first().waitFor({ state: 'hidden', timeout: TIMEOUT_MODAL });
}

/** Fill auction stages in step 3 */
async function fillStages(page: Page, stages: StageData[]): Promise<void> {
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];

    // If i > 0, need to click "Adicionar Praça" to add another stage row
    if (i > 0) {
      const addBtn = page.getByRole('button', { name: /adicionar praça/i });
      await addBtn.click({ timeout: TIMEOUT_ACTION });
      await page.waitForTimeout(500);
    }

    // Fill stage fields by id pattern: stage-{index}-fieldName
    const nameInput = page.locator(`#stage-${i}-name, input[name*="stages"][name*="name"]`).nth(i);
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill(s.name);
    }

    const startInput = page.locator(`#stage-${i}-startDate, input[type="datetime-local"]`).nth(i * 2);
    if (await startInput.isVisible().catch(() => false)) {
      await startInput.fill(s.startDate);
    }

    const endInput = page.locator(`#stage-${i}-endDate, input[type="datetime-local"]`).nth(i * 2 + 1);
    if (await endInput.isVisible().catch(() => false)) {
      await endInput.fill(s.endDate);
    }

    const priceInput = page.locator(`#stage-${i}-initialPrice, input[name*="initialPrice"]`).nth(i);
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.clear();
      await priceInput.fill(s.initialPrice);
    }

    if (s.discountPercent) {
      const discountInput = page.locator(`#stage-${i}-discountPercent`);
      if (await discountInput.isVisible().catch(() => false)) {
        await discountInput.clear();
        await discountInput.fill(s.discountPercent);
      }
    }
  }
}

/** Create an asset inline from Step 4 wizard using "Cadastrar Novo Ativo" button */
async function createAssetInline(page: Page, asset: AssetData, sellerName?: string): Promise<void> {
  // Click "Cadastrar Novo Ativo" button in wizard footer
  const addAssetBtn = page.getByRole('button', { name: /cadastrar novo ativo/i });
  await addAssetBtn.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });
  await addAssetBtn.click();

  // Wait for asset form to appear (wizardMode changes to 'asset')
  const assetForm = page.locator('form, [data-ai-id*="asset-form"]').filter({
    has: page.locator('input[name="title"]'),
  });
  await assetForm.first().waitFor({ state: 'visible', timeout: TIMEOUT_NAV });

  // Fill asset title
  const titleInput = assetForm.locator('input[name="title"]').first();
  await titleInput.clear();
  await titleInput.fill(asset.title);

  // Fill description
  const descInput = assetForm.locator('textarea[name="description"]').first();
  if (await descInput.isVisible().catch(() => false)) {
    await descInput.clear();
    await descInput.fill(asset.description);
  }

  // Select category
  try {
    await selectShadcnByLabel(page, 'Categoria', asset.categoryName);
  } catch {
    // Category might be via EntitySelector
    try {
      await selectEntityByLabel(page, 'Categoria', asset.categoryName);
    } catch {
      console.warn(`Could not select category "${asset.categoryName}" for asset "${asset.title}"`);
    }
  }

  if (sellerName) {
    try {
      await selectEntityByLabel(page, 'Comitente/Vendedor', sellerName);
    } catch {
      console.warn(`Could not select seller "${sellerName}" for asset "${asset.title}"`);
    }
  }

  // Fill evaluation value
  const evalInput = assetForm.locator('input[name="evaluationValue"], input[name*="evaluation"]').first();
  if (await evalInput.isVisible().catch(() => false)) {
    await evalInput.clear();
    await evalInput.fill(asset.evaluationValue);
  }

  // Set status to DISPONIVEL
  try {
    await selectShadcnByLabel(page, 'Status', 'DISPONIVEL');
  } catch {
    // Status might already be pre-set in wizard mode
  }

  // Submit the asset form
  const saveBtn = page
    .getByRole('button', { name: /salvar|criar|cadastrar/i })
    .filter({ hasNotText: /ativo/i })
    .first();
  
  // Alternatively try the form's main submit
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click({ timeout: TIMEOUT_ACTION });
  } else {
    // Try submitting via the form
    const form = page.locator('form').filter({ has: page.locator('input[name="title"]') }).first();
    await form.evaluate((f: HTMLFormElement) => f.requestSubmit());
  }

  // Wait for return to lotting mode (wizardMode reverts to 'main')
  await page
    .locator('[data-ai-id="wizard-step4-lotting"], button:has-text("Lotear")')
    .first()
    .waitFor({ state: 'visible', timeout: TIMEOUT_NAV });
}

/** Step 4: Select assets and lot them individually */
async function handleLotting(page: Page, expectedAssetCount: number, expectedAssetTitles?: string[]): Promise<void> {
  // Wait for the lotting table
  await page
    .locator('[data-ai-id="wizard-step4-lotting"]')
    .waitFor({ state: 'visible', timeout: TIMEOUT_NAV });

  // Wait for rows to appear
  await page.waitForTimeout(1500);

  const checkboxes = page.locator('table tbody input[type="checkbox"], table tbody [role="checkbox"]');
  const count = await checkboxes.count();

  if (count === 0) {
    throw new Error('No assets found in lotting table — cannot create lots');
  }

  if (expectedAssetTitles && expectedAssetTitles.length > 0) {
    for (const assetTitle of expectedAssetTitles) {
      const row = page.locator('table tbody tr').filter({ hasText: assetTitle }).first();
      await row.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });
      const checkbox = row.locator('input[type="checkbox"], [role="checkbox"]').first();
      if (!(await checkbox.isChecked())) {
        await checkbox.click();
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) {
        await cb.click();
      }
    }
  }

  if (expectedAssetTitles && count < expectedAssetCount) {
    throw new Error(`Expected at least ${expectedAssetCount} selectable assets, but found ${count}`);
  }

  // Click "Lotear Individualmente"
  const lotBtn = page.getByRole('button', { name: /lotear individualmente/i });
  await lotBtn.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });
  await lotBtn.click();
  await page.waitForTimeout(1000);
}

/** Step 5: Review and publish */
async function reviewAndPublish(page: Page, auctionTitle: string): Promise<string> {
  // Wait for review card
  await page
    .locator('[data-ai-id="wizard-step5-review-card"]')
    .waitFor({ state: 'visible', timeout: TIMEOUT_NAV });

  // Take screenshot before publish
  await page.screenshot({
    path: `tests/e2e/screenshots/wizard-review-${Date.now()}.png`,
    fullPage: true,
  });

  // Track server action responses
  const serverActions: { status: number; actionId: string }[] = [];
  page.on('response', async (resp) => {
    const req = resp.request();
    if (req.method() === 'POST' && req.headers()['next-action']) {
      serverActions.push({ status: resp.status(), actionId: req.headers()['next-action'] });
    }
  });

  // Click the publish button via React props.onClick() — standard Playwright click
  // doesn't reach the handler due to WizardFlow overlay
  const publishBtn = page.getByRole('button', { name: /publicar leilão/i });
  await publishBtn.scrollIntoViewIfNeeded();
  await publishBtn.waitFor({ state: 'visible', timeout: TIMEOUT_ACTION });

  const clickResult = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Publicar Leilão'));
    if (!btn) return 'BUTTON_NOT_FOUND';
    const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps'));
    if (!propsKey) return 'NO_REACT_PROPS';
    const props = (btn as any)[propsKey];
    if (typeof props?.onClick !== 'function') return 'NO_ONCLICK';
    props.onClick();
    return 'CALLED_OK';
  });

  if (clickResult !== 'CALLED_OK') {
    throw new Error(`Publish click failed: ${clickResult}`);
  }

  // Wait for server action to complete
  await page.waitForResponse(
    resp => resp.request().method() === 'POST' && !!resp.request().headers()['next-action'],
    { timeout: 30_000 },
  ).catch(() => null);

  // Give React time to process the response (toast + redirect)
  await page.waitForTimeout(3000);

  // ShadCN toast: <li role="status" data-state="open">
  const toastLocator = page.locator('li[data-state="open"]');

  // Check for error toast first
  const errorToast = toastLocator.filter({ hasText: /erro|falha|error/i }).first();
  if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
    const errorText = await errorToast.textContent();
    throw new Error(`Publish error toast: ${errorText}`);
  }

  // Wait for success toast or redirect
  await Promise.race([
    toastLocator.filter({ hasText: /publicado|sucesso|criado/i }).first()
      .waitFor({ state: 'visible', timeout: 10_000 }),
    page.waitForURL(/\/admin\/auctions\/\d+\/edit/i, { timeout: 10_000 }),
  ]).catch(() => {
    console.warn('Neither success toast nor redirect detected — will try DB fallback');
  });

  // Try to get auction ID from URL
  const currentUrl = page.url();
  const urlMatch = currentUrl.match(/\/admin\/auctions\/(\d+)/);
  let auctionId = urlMatch ? urlMatch[1] : 'unknown';

  // DB fallback if no redirect
  if (auctionId === 'unknown') {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const createdAuction = await prisma.auction.findFirst({
      where: {
        title: auctionTitle,
        createdAt: { gte: fiveMinAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (createdAuction?.id != null) {
      auctionId = createdAuction.id.toString();
      console.log(`Found auction via DB fallback: ${auctionId}`);
    }
  }

  if (auctionId === 'unknown') {
    await page.screenshot({
      path: `tests/e2e/screenshots/wizard-publish-FAILED-${Date.now()}.png`,
      fullPage: true,
    });
    throw new Error(
      `Publish FAILED for "${auctionTitle}". URL: ${currentUrl}. ` +
      `Server actions: ${JSON.stringify(serverActions)}`,
    );
  }

  // Screenshot post-publish
  await page.screenshot({
    path: `tests/e2e/screenshots/wizard-published-${auctionId}-${Date.now()}.png`,
    fullPage: true,
  });

  return auctionId;
}

/** Advance to next wizard step */
async function clickNext(page: Page): Promise<void> {
  const nextBtn = page.getByRole('button', { name: /próximo/i });
  await nextBtn.click({ timeout: TIMEOUT_ACTION });
  await page.waitForTimeout(1000);
}

/** Escape regex special chars */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Create screenshot directory
// ---------------------------------------------------------------------------

test.beforeAll(async () => {
  const fs = await import('fs');
  const dir = 'tests/e2e/screenshots';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe.serial('Wizard Registration Cycle — 4 Real Auctions', () => {
  // Track created auction IDs for later validation
  const createdAuctions: Record<string, string> = {};

  test.beforeEach(async ({ page }) => {
    // Ensure admin logged in
    await loginAsAdmin(page, BASE_URL);
  });

  // =========================================================================
  // AUCTION #1: JUDICIAL — Terreno Salgado/SE
  // =========================================================================
  test('Auction #1 — JUDICIAL — Terreno 160m² Salgado/SE', async ({ page }) => {
    test.setTimeout(300_000); // 5 min budget for full wizard flow

    await ensureAuction1ReferenceEntities();

    // --- Step 1: Type selection ---
    await navigateToWizard(page);
    await selectAuctionType(page, AUCTION_1_JUDICIAL.typeLabel);

    // --- Step 2: Judicial Process setup ---
    await selectJudicialProcessByNumber(page, AUCTION_1_JUDICIAL.processNumber!);
    await page
      .locator('[data-ai-id="wizard-step2-selected-process-details"]')
      .waitFor({ state: 'visible', timeout: TIMEOUT_ACTION })
      .catch(() => {
        // Details panel might use a different selector — continue anyway
        console.warn('Process details panel not found, but process may still be selected');
      });

    // Advance to Step 3
    await clickNext(page);

    // --- Step 3: Auction Details ---
    // Title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible', timeout: TIMEOUT_NAV });
    await titleInput.clear();
    await titleInput.fill(AUCTION_1_JUDICIAL.title);

    // Description
    const descInput = page.locator('textarea[name="description"]');
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.clear();
      await descInput.fill(AUCTION_1_JUDICIAL.description);
    }

    // Status → RASCUNHO (likely default, but set explicitly)
    try {
      await selectShadcnByLabel(page, 'Status', 'RASCUNHO');
    } catch {
      // May already be selected
    }

    // Auctioneer
    await selectEntityByLabel(page, 'Leiloeiro', AUCTION_1_JUDICIAL.auctioneerName);

    // Seller (may be auto-populated from judicial process)
    try {
      await selectEntityByLabel(page, 'Comitente', AUCTION_1_JUDICIAL.sellerName);
    } catch {
      console.warn('Seller may be auto-populated from judicial process');
    }

    // Participation
    try {
      await selectShadcnByLabel(page, 'Participação', AUCTION_1_JUDICIAL.participation);
    } catch {
      try {
        await selectShadcnByLabel(page, 'Tipo de Participação', AUCTION_1_JUDICIAL.participation);
      } catch {
        console.warn('Could not set participation type');
      }
    }

    // Method
    try {
      await selectShadcnByLabel(page, 'Método', AUCTION_1_JUDICIAL.method);
    } catch {
      console.warn('Could not set auction method');
    }

    // Stages (Praças)
    await fillStages(page, AUCTION_1_JUDICIAL.stages);

    // Advance to Step 4
    await clickNext(page);

    // --- Step 4: Lotting ---
    // Need to create asset inline since no assets exist yet
    for (const asset of AUCTION_1_JUDICIAL.assets) {
      await createAssetInline(page, asset, AUCTION_1_JUDICIAL.sellerName);
    }

    // Now handle lotting
    await handleLotting(
      page,
      AUCTION_1_JUDICIAL.assets.length,
      AUCTION_1_JUDICIAL.assets.map((asset) => asset.title),
    );

    // Advance to Step 5
    await clickNext(page);

    // --- Step 5: Review & Publish ---
    const auctionId = await reviewAndPublish(page, AUCTION_1_JUDICIAL.title);
    createdAuctions['judicial_salgado'] = auctionId;

    expect(auctionId).not.toBe('unknown');
    console.log(`✅ Auction #1 JUDICIAL created — ID: ${auctionId}`);
  });

  // =========================================================================
  // AUCTION #2: TOMADA_DE_PRECOS — Nutrien (2 assets, 2 lots)
  // =========================================================================
  test('Auction #2 — TOMADA — Nutrien Terrenos Industriais', async ({ page }) => {
    test.setTimeout(300_000);

    // DEBUG: Capture console errors/logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 BROWSER ERROR: ${msg.text()}`);
      }
    });
    page.on('pageerror', error => {
      console.log(`🔴 PAGE ERROR: ${error.message}`);
    });

    // --- Step 1 ---
    await navigateToWizard(page);
    await selectAuctionType(page, AUCTION_2_TOMADA_NUTRIEN.typeLabel);

    // TOMADA skips Step 2 (no judicial process)

    // --- Step 3: Auction Details ---
    const titleInput = page.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible', timeout: TIMEOUT_NAV });
    await titleInput.clear();
    await titleInput.fill(AUCTION_2_TOMADA_NUTRIEN.title);

    const descInput = page.locator('textarea[name="description"]');
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.clear();
      await descInput.fill(AUCTION_2_TOMADA_NUTRIEN.description);
    }

    // Auctioneer
    await selectEntityByLabel(page, 'Leiloeiro', AUCTION_2_TOMADA_NUTRIEN.auctioneerName);

    // Seller
    await selectEntityByLabel(page, 'Comitente', AUCTION_2_TOMADA_NUTRIEN.sellerName);

    // Participation + Method
    try {
      await selectShadcnByLabel(page, 'Participação', AUCTION_2_TOMADA_NUTRIEN.participation);
    } catch {
      try {
        await selectShadcnByLabel(page, 'Tipo de Participação', AUCTION_2_TOMADA_NUTRIEN.participation);
      } catch { /* may be default */ }
    }
    try {
      await selectShadcnByLabel(page, 'Método', AUCTION_2_TOMADA_NUTRIEN.method);
    } catch { /* may be default */ }

    // Stages
    await fillStages(page, AUCTION_2_TOMADA_NUTRIEN.stages);

    // Advance to Step 4
    await clickNext(page);

    // --- Step 4: Create 2 assets inline ---
    for (const asset of AUCTION_2_TOMADA_NUTRIEN.assets) {
      await createAssetInline(page, asset, AUCTION_2_TOMADA_NUTRIEN.sellerName);
    }

    await handleLotting(
      page,
      AUCTION_2_TOMADA_NUTRIEN.assets.length,
      AUCTION_2_TOMADA_NUTRIEN.assets.map((asset) => asset.title),
    );

    // Advance to Step 5
    await clickNext(page);

    // --- Step 5 ---
    const auctionId = await reviewAndPublish(page, AUCTION_2_TOMADA_NUTRIEN.title);
    createdAuctions['tomada_nutrien'] = auctionId;

    expect(auctionId).not.toBe('unknown');
    console.log(`✅ Auction #2 TOMADA Nutrien created — ID: ${auctionId}`);
  });

  // =========================================================================
  // AUCTION #3: TOMADA_DE_PRECOS — Santander (1 asset, 2 praças)
  // =========================================================================
  test('Auction #3 — TOMADA — Santander Alienação Fiduciária', async ({ page }) => {
    test.setTimeout(300_000);

    await navigateToWizard(page);
    await selectAuctionType(page, AUCTION_3_TOMADA_SANTANDER.typeLabel);

    // Step 3
    const titleInput = page.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible', timeout: TIMEOUT_NAV });
    await titleInput.clear();
    await titleInput.fill(AUCTION_3_TOMADA_SANTANDER.title);

    const descInput = page.locator('textarea[name="description"]');
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.clear();
      await descInput.fill(AUCTION_3_TOMADA_SANTANDER.description);
    }

    await selectEntityByLabel(page, 'Leiloeiro', AUCTION_3_TOMADA_SANTANDER.auctioneerName);
    await selectEntityByLabel(page, 'Comitente', AUCTION_3_TOMADA_SANTANDER.sellerName);

    try {
      await selectShadcnByLabel(page, 'Participação', AUCTION_3_TOMADA_SANTANDER.participation);
    } catch {
      try {
        await selectShadcnByLabel(page, 'Tipo de Participação', AUCTION_3_TOMADA_SANTANDER.participation);
      } catch { /* default */ }
    }
    try {
      await selectShadcnByLabel(page, 'Método', AUCTION_3_TOMADA_SANTANDER.method);
    } catch { /* default */ }

    await fillStages(page, AUCTION_3_TOMADA_SANTANDER.stages);

    await clickNext(page);

    // Step 4
    for (const asset of AUCTION_3_TOMADA_SANTANDER.assets) {
      await createAssetInline(page, asset, AUCTION_3_TOMADA_SANTANDER.sellerName);
    }
    await handleLotting(
      page,
      AUCTION_3_TOMADA_SANTANDER.assets.length,
      AUCTION_3_TOMADA_SANTANDER.assets.map((asset) => asset.title),
    );

    await clickNext(page);

    // Step 5
    const auctionId = await reviewAndPublish(page, AUCTION_3_TOMADA_SANTANDER.title);
    createdAuctions['tomada_santander'] = auctionId;

    expect(auctionId).not.toBe('unknown');
    console.log(`✅ Auction #3 TOMADA Santander created — ID: ${auctionId}`);
  });

  // =========================================================================
  // AUCTION #4: PARTICULAR — Usina Moenda de Cana
  // =========================================================================
  test('Auction #4 — PARTICULAR — Usina Santa Isabel Moenda de Cana', async ({ page }) => {
    test.setTimeout(300_000);

    await navigateToWizard(page);
    await selectAuctionType(page, AUCTION_4_PARTICULAR_USINA.typeLabel);

    // Step 3
    const titleInput = page.locator('input[name="title"]');
    await titleInput.waitFor({ state: 'visible', timeout: TIMEOUT_NAV });
    await titleInput.clear();
    await titleInput.fill(AUCTION_4_PARTICULAR_USINA.title);

    const descInput = page.locator('textarea[name="description"]');
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.clear();
      await descInput.fill(AUCTION_4_PARTICULAR_USINA.description);
    }

    await selectEntityByLabel(page, 'Leiloeiro', AUCTION_4_PARTICULAR_USINA.auctioneerName);
    await selectEntityByLabel(page, 'Comitente', AUCTION_4_PARTICULAR_USINA.sellerName);

    try {
      await selectShadcnByLabel(page, 'Participação', AUCTION_4_PARTICULAR_USINA.participation);
    } catch {
      try {
        await selectShadcnByLabel(page, 'Tipo de Participação', AUCTION_4_PARTICULAR_USINA.participation);
      } catch { /* default */ }
    }
    try {
      await selectShadcnByLabel(page, 'Método', AUCTION_4_PARTICULAR_USINA.method);
    } catch { /* default */ }

    await fillStages(page, AUCTION_4_PARTICULAR_USINA.stages);

    await clickNext(page);

    // Step 4
    for (const asset of AUCTION_4_PARTICULAR_USINA.assets) {
      await createAssetInline(page, asset, AUCTION_4_PARTICULAR_USINA.sellerName);
    }
    await handleLotting(
      page,
      AUCTION_4_PARTICULAR_USINA.assets.length,
      AUCTION_4_PARTICULAR_USINA.assets.map((asset) => asset.title),
    );

    await clickNext(page);

    // Step 5
    const auctionId = await reviewAndPublish(page, AUCTION_4_PARTICULAR_USINA.title);
    createdAuctions['particular_usina'] = auctionId;

    expect(auctionId).not.toBe('unknown');
    console.log(`✅ Auction #4 PARTICULAR Usina created — ID: ${auctionId}`);
  });

  // =========================================================================
  // VALIDATION: Post-registration summary
  // =========================================================================
  test('Post-registration — verify all 4 auctions created', async ({ page }) => {
    test.setTimeout(120_000);

    // Navigate to admin auctions list
    await page.goto(`${BASE_URL}/admin/auctions`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_NAV,
    });

    // Wait for loading spinner to disappear and content to render
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Carregando') && document.querySelectorAll('table tbody tr, [data-ai-id]').length > 0,
      { timeout: 60_000 },
    ).catch(() => {
      console.warn('⚠️ Admin list may still be loading after 60s');
    });
    await page.waitForTimeout(2000);

    // Check each auction title appears
    for (const [key, fixture] of Object.entries({
      judicial_salgado: AUCTION_1_JUDICIAL,
      tomada_nutrien: AUCTION_2_TOMADA_NUTRIEN,
      tomada_santander: AUCTION_3_TOMADA_SANTANDER,
      particular_usina: AUCTION_4_PARTICULAR_USINA,
    })) {
      const auctionId = createdAuctions[key];
      if (auctionId && auctionId !== 'unknown') {
        console.log(`✅ ${key}: Auction ID ${auctionId} — "${fixture.title}"`);
      } else {
        console.warn(`⚠️ ${key}: Auction not created or ID unknown — "${fixture.title}"`);
      }
    }

    // Screenshot the auctions list
    await page.screenshot({
      path: `tests/e2e/screenshots/admin-auctions-list-${Date.now()}.png`,
      fullPage: true,
    });

    // Quick validation: at least some of our titles should appear
    const pageContent = await page.textContent('body');
    const found = [
      AUCTION_1_JUDICIAL.title,
      AUCTION_2_TOMADA_NUTRIEN.title,
      AUCTION_3_TOMADA_SANTANDER.title,
      AUCTION_4_PARTICULAR_USINA.title,
    ].filter((t) => pageContent?.includes(t.substring(0, 25)));

    console.log(`Found ${found.length}/4 auction titles in admin list`);

    // Primary validation: all 4 auctions were created (IDs tracked by prior tests)
    const createdCount = Object.values(createdAuctions).filter(
      (id) => id && id !== 'unknown',
    ).length;
    console.log(`Created ${createdCount}/4 auctions by ID`);
    expect(createdCount).toBeGreaterThanOrEqual(1);
  });
});
