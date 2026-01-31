import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

test.describe('Verificação de Exibição de Preços nos Cards', () => {
    test.setTimeout(120000); // Increase timeout for dev mode
    let auctionId: string;
    let stage2AuctionId: string;
    let lotId: string;
    let stage2LotId: string;

    test.beforeAll(async () => {
        // Setup dates
        const now = new Date();
        const yesterday = subDays(now, 1);
        const tomorrow = addDays(now, 1);
        const twoDaysAgo = subDays(now, 2);

        const tenantId = 1; // lordland
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Ensure Role exists
        const adminRole = await prisma.role.upsert({
            where: { name: 'ADMIN' },
            update: {},
            create: { name: 'ADMIN', nameNormalized: 'admin', description: 'Admin', permissions: [] }
        });

        // Ensure Tenant exists
        await prisma.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: 'Lordland', subdomain: 'lordland', domain: 'lordland.localhost' }
        });

        // Ensure admin user exists with Role
        // Note: Check if user exists first to avoid duplicate connection error if creating fresh
        const userExists = await prisma.user.findUnique({ where: { email: 'admin@lordland.com' } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    email: 'admin@lordland.com',
                    password: hashedPassword,
                    fullName: 'Admin Test',
                    tenants: { create: { tenantId, assignedBy: 'test' } },
                    roles: { create: { roleId: adminRole.id, assignedBy: 'test' } }
                }
            });
        }
        // If exists, assume seeded correctly or ignore (simple test)

        // 1. Create Normal Auction for "Lance Atual" test
        const auction = await prisma.auction.create({
            data: {
                title: 'Leilão Teste Preço Atual',
                status: 'ABERTO_PARA_LANCES',
                tenantId: BigInt(tenantId),
                auctionDate: now,
                endDate: tomorrow,
                auctionType: 'JUDICIAL',
                stages: {
                    create: [
                        { name: '1ª Praça', startDate: now, endDate: tomorrow, tenantId: BigInt(tenantId) }
                    ]
                }
            }
        });
        auctionId = auction.id.toString();

        const lot = await prisma.lot.create({
            data: {
                title: 'Lote Teste Lance Atual',
                number: '001',
                status: 'ABERTO_PARA_LANCES',
                auctionId: auction.id,
                initialPrice: 1000,
                price: 1000,
                bidIncrementStep: 100,
                endDate: tomorrow,
                endDate: tomorrow,
                tenantId: BigInt(tenantId),
                type: 'GENERIC'
            }
        });
        lotId = lot.id.toString();

        // 2. Create 2nd Stage Auction for "Lance Mínimo" test
        // Stage 1: Past
        // Stage 2: Current (Active) -> Should trigger "Lance Mínimo"
        const auction2 = await prisma.auction.create({
            data: {
                title: 'Leilão Teste 2ª Praça',
                status: 'ABERTO_PARA_LANCES',
                tenantId: BigInt(tenantId),
                auctionDate: twoDaysAgo,
                endDate: tomorrow,
                auctionType: 'JUDICIAL',
                stages: {
                    create: [
                        { name: '1ª Praça', startDate: twoDaysAgo, endDate: yesterday, tenantId: BigInt(tenantId) },
                        { name: '2ª Praça', startDate: subDays(now, 0.5), endDate: tomorrow, discountPercent: 50, tenantId: BigInt(tenantId) }
                    ]
                }
            }
        });
        stage2AuctionId = auction2.id.toString();

        // Lot for 2nd stage: initialPrice 2000 => Min Bid should be 1000 (50%)
        const lot2 = await prisma.lot.create({
            data: {
                title: 'Lote Teste Lance Mínimo',
                number: '002',
                status: 'ABERTO_PARA_LANCES',
                auctionId: auction2.id,
                initialPrice: 2000,
                price: 2000,
                bidIncrementStep: 100,
                endDate: tomorrow,
                tenantId: BigInt(tenantId),
                type: 'GENERIC',
                // We populate stageDetails to simulate accurate data if necessary, 
                // but the helper calculates based on discountPercent if activeStage is found.
                // Let's rely on the helper's calculation first.
            }
        });
        stage2LotId = lot2.id.toString();
    });

    test('Deve exibir "Lance Atual" após dar um lance', async ({ page }) => {
        // Login as admin
        await page.goto('http://localhost:3000/auth/login');
        await page.fill('input[name="email"]', 'admin@lordland.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:3000/');

        // Find the specific lot by text
        await page.goto(`http://localhost:3000/auctions/${auctionId}`); // Go to auction page directly to find list
        const lotCard = page.locator(`text=Lote Teste Lance Atual`).first();
        await expect(lotCard).toBeVisible();

        // Verify initial state: "Lance Inicial"
        await expect(page.locator('[data-ai-id="lot-card-price"]', { hasText: 'Lance Inicial' }).filter({ has: page.locator(`text=R$ 1.000,00`) })).toBeVisible();

        // Navigate to details and bid
        await lotCard.click();
        await page.waitForURL(/\/lots\//);

        // Place bid
        // Assuming there is a bid button. 
        // NOTE: Admin usually can't bid on own auction? 
        // Wait, seed says admin tenantId is same.
        // If admin cannot bid, this test fails. Bidder role is better.
        // Let's assume Admin implies superuser who might be able to, OR better yet, let's use a bidder account if possible.
        // But the user said "log como admin". I will stick to user request. 
        // If admin cannot bid, I will see the error.

        // Trying to click "Dar Lance" button.
        const bidButton = page.getByRole('button', { name: /Dar Lance|Confirmar Lance/i }).first();

        // If button not visible or disabled, we might have a permission issue. 
        // But let's assume it works for now or create a bidder user on the fly if needed?
        // User asked to "log como admin e dê um lance". I will trust the user.

        // Type if there is an input, or just click increment.
        // Usually there is a "Dar Lance R$ 1.100,00" button or similar.
        // Checking previous code or blindly trying:
        await page.getByRole('button', { name: /R\$\s*1\.100,00/i }).click(); // Increment button usually prefilled
        // Or confirm modal
        await page.getByRole('button', { name: /Confirmar/i }).click().catch(() => { }); // Optional confirm

        // Go back to list and check
        await page.goto(`http://localhost:3000/auctions/${auctionId}`);
        await page.reload();

        // Verify "Lance Atual" and new price
        const priceContainer = page.locator('[data-ai-id="lot-card-price"]');
        await expect(priceContainer).toContainText('Lance Atual');
        await expect(priceContainer).toContainText('R$ 1.100,00');
    });

    test('Deve exibir "Lance Mínimo" com desconto na 2ª praça', async ({ page }) => {
        // Assume already logged in from previous test or reuse state. 
        // Playwright isolation means we might need login again or use storage state. 
        // For simplicity, re-login.
        await page.goto('http://localhost:3000/auth/login');
        await page.fill('input[name="email"]', 'admin@lordland.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:3000/');

        // Go to Stage 2 Auction
        await page.goto(`http://localhost:3000/auctions/${stage2AuctionId}`);

        // Verify Lot Card Logic
        const priceContainer = page.locator('[data-ai-id="lot-card-price"]');

        // Evaluation: 2000. Discount 50% => 1000.
        // Label should be "Lance Mínimo"
        await expect(priceContainer).toContainText('Lance Mínimo');
        await expect(priceContainer).toContainText('R$ 1.000,00');
    });
});
