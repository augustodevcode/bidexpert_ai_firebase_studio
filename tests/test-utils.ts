// tests/test-utils.ts
import { prisma } from '@/lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Asset, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch, Tenant } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { tenantContext } from '@/lib/prisma';

// Import Server Actions
import { createAuction, getAuction, deleteAuction } from '@/app/admin/auctions/actions';
import { createLot, getLot, deleteLot, finalizeLot } from '@/app/admin/lots/actions';
import { createUser, getUserProfileData, deleteUser } from '@/app/admin/users/actions';
import { createSeller, getSeller, deleteSeller } from '@/app/admin/sellers/actions';
import { createJudicialProcessAction, deleteJudicialProcess } from '@/app/admin/judicial-processes/actions';
import { createAsset, deleteAsset } from '@/app/admin/assets/actions';
import { createRole, getRoles } from '@/app/admin/roles/actions';
import { habilitateForAuctionAction } from '@/app/admin/habilitations/actions';
import { placeBidOnLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import { createAuctioneer } from '@/app/admin/auctioneers/actions';


export async function callActionAsUser<T>(action: (...args: any[]) => Promise<T>, user: UserProfileWithPermissions | null, ...args: any[]): Promise<T> {
    const originalGetSession = require('@/app/auth/actions').getSession;
    const tenantId = user?.tenants?.[0]?.tenant.id || '1'; // Default to landlord if user has no specific tenant
    
    require('@/app/auth/actions').getSession = async () => user ? { userId: user.id, tenantId: tenantId, permissions: user.permissions } : null;

    try {
        return await tenantContext.run({ tenantId }, () => action(...args));
    } finally {
        require('@/app/auth/actions').getSession = originalGetSession;
    }
}

export async function createTestPrerequisites(testRunId: string, prefix: string) {
    const tenant = await prisma.tenant.create({ data: { name: `${prefix} Tenant ${testRunId}`, subdomain: `${prefix}-${testRunId}` } });

    const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
    const userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { id: 'role-user', name: 'User', nameNormalized: 'USER', permissions: ['view_auctions'] } });
    
    // Admin user must be created in the context of the new tenant
    const adminRes = await callActionAsUser(createUser, null, {
        fullName: `Admin ${prefix} ${testRunId}`,
        email: `admin-${prefix}-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [adminRole!.id],
        tenantId: tenant.id,
        habilitationStatus: 'HABILITADO'
    });
    const adminUser = await callActionAsUser(getUserProfileData, null, adminRes.userId!);

    const unauthorizedUserRes = await callActionAsUser(createUser, null, {
        fullName: `Unauthorized ${prefix} ${testRunId}`,
        email: `unauthorized-${prefix}-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [userRole!.id],
        tenantId: tenant.id,
        habilitationStatus: 'PENDING_DOCUMENTS'
    });
    const unauthorizedUser = await callActionAsUser(getUserProfileData, null, unauthorizedUserRes.userId!);
    
    const category = await prisma.lotCategory.create({ data: { name: `Cat ${prefix} ${testRunId}`, slug: `cat-${prefix}-${testRunId}`, hasSubcategories: false } });
    const auctioneerRes = await callActionAsUser(createAuctioneer, adminUser, { name: `Auctioneer ${prefix} ${testRunId}` } as any);
    const auctioneer = (await prisma.auctioneer.findUnique({where: {id: auctioneerRes.auctioneerId}}))!;
    
    const uniqueUf = `${prefix.substring(0,1).toUpperCase()}${testRunId.substring(0, 1).toUpperCase()}`;
    const state = await prisma.state.upsert({ where: { uf: uniqueUf }, update: {}, create: { name: `State ${prefix} ${testRunId}`, uf: uniqueUf, slug: `st-${prefix}-${testRunId}` } });
    const court = await prisma.court.create({ data: { name: `Court ${prefix} ${testRunId}`, stateUf: state.uf, slug: `court-${prefix}-${testRunId}` } });
    const district = await prisma.judicialDistrict.create({ data: { name: `District ${prefix} ${testRunId}`, slug: `dist-${prefix}-${testRunId}`, courtId: court.id, stateId: state.id } });
    const branch = await prisma.judicialBranch.create({ data: { name: `Branch ${prefix} ${testRunId}`, slug: `branch-${prefix}-${testRunId}`, districtId: district.id } });
    
    const judicialSellerRes = await callActionAsUser(createSeller, adminUser, { name: `Vara ${prefix} ${testRunId}`, isJudicial: true, judicialBranchId: branch.id } as any);
    const judicialSeller = (await callActionAsUser(getSeller, adminUser, judicialSellerRes.sellerId!))!;

    const procRes = await callActionAsUser(createJudicialProcessAction, adminUser, { processNumber: `500-${prefix}-${testRunId}`, isElectronic: true, courtId: court.id, districtId: district.id, branchId: branch.id, sellerId: judicialSeller.id, parties: [{ name: `Autor ${testRunId}`, partyType: 'AUTOR' }] } as any);
    const judicialProcess = (await prisma.judicialProcess.findUnique({where: {id: procRes.processId}, include: { parties: true }}))!;

    const assetRes = await callActionAsUser(createAsset, adminUser, { title: `Asset para ${prefix} ${testRunId}`, judicialProcessId: judicialProcess.id, categoryId: category.id, status: 'DISPONIVEL', evaluationValue: 50000.00 } as any);
    const asset = (await prisma.asset.findUnique({where: {id: assetRes.assetId}}))!;

    return { tenant, adminUser, unauthorizedUser, category, auctioneer, judicialSeller, state, court, district, branch, judicialProcess, asset };
}

export async function cleanup(testRunId: string, prefix: string) {
    const tenant = await prisma.tenant.findFirst({ where: { name: { contains: `${prefix} Tenant ${testRunId}` } } });
    if (!tenant) return;

    try {
        await tenantContext.run({ tenantId: tenant.id }, async () => {
            const userEmails = [ `admin-${prefix}-${testRunId}@test.com`, `unauthorized-${prefix}-${testRunId}@test.com` ];
            const users = await prisma.user.findMany({ where: { email: { in: userEmails } }});
            if (users.length > 0) {
                 const userIds = users.map(u => u.id);
                 await prisma.usersOnRoles.deleteMany({ where: { userId: { in: userIds } } });
                 await prisma.usersOnTenants.deleteMany({ where: { userId: { in: userIds } } });
                 await prisma.user.deleteMany({ where: { id: { in: userIds } } });
            }
            await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.asset.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.judicialProcess.deleteMany({ where: { processNumber: { contains: testRunId } } });
            await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
            await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        });
        await prisma.judicialBranch.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.judicialDistrict.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.court.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.state.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.tenant.delete({ where: { id: tenant.id } });

    } catch (error) {
        console.error(`[E2E Cleanup - ${prefix}] Error during cleanup:`, error);
    }
}
