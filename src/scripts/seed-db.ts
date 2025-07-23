// scripts/seed-db.ts
import { prisma } from '@/lib/prisma';
import { 
  sampleSellers, 
  sampleAuctioneers, 
  sampleJudicialDistricts, 
  sampleJudicialBranches,
  sampleJudicialProcesses,
  sampleAuctions,
  sampleLots,
  sampleBens,
  sampleDirectSaleOffers,
  sampleBids,
  sampleUserWins,
  sampleUsers
} from '@/lib/sample-data';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seedFullData() {
    console.log('\n--- [DB SEED] Seeding Full Demo Data ---');

    try {
        // Seeding Admin User
        console.log('[DB SEED] Seeding Admin User...');
        const adminUserFromSample = sampleUsers.find(u => u.email === 'admin@bidexpert.com.br');
        if (adminUserFromSample) {
            const adminRole = await prisma.role.findFirst({ where: { name: 'ADMINISTRATOR' } });
            if (adminRole) {
                const adminUser = await prisma.user.upsert({
                    where: { email: adminUserFromSample.email },
                    update: {},
                    create: {
                        email: adminUserFromSample.email,
                        fullName: adminUserFromSample.fullName,
                        password: await bcrypt.hash(adminUserFromSample.password || 'Admin@123', 10),
                        habilitationStatus: 'HABILITADO',
                        accountType: 'PHYSICAL',
                    }
                });
                // Ensure the join table record exists
                await prisma.usersOnRoles.upsert({
                    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
                    update: {},
                    create: { userId: adminUser.id, roleId: adminRole.id, assignedBy: 'seed-script' }
                });

                console.log("[DB SEED] ✅ SUCCESS: Admin user created or already exists.");
            } else {
                 console.error("[DB SEED] ❌ ERROR: Administrator role not found. Cannot create admin user.");
            }
        }
        
        console.log('[DB SEED] Seeding Sellers...');
        for (const seller of sampleSellers) {
            await prisma.seller.upsert({ where: { id: seller.id }, update: {}, create: seller as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleSellers.length} sellers processed.`);

        console.log('[DB SEED] Seeding Auctioneers...');
        for (const auctioneer of sampleAuctioneers) {
            await prisma.auctioneer.upsert({ where: { id: auctioneer.id }, update: {}, create: auctioneer as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleAuctioneers.length} auctioneers processed.`);
        
        console.log('[DB SEED] Seeding Judicial Districts...');
        for (const district of sampleJudicialDistricts) {
             await prisma.judicialDistrict.upsert({ where: { id: district.id }, update: {}, create: district as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleJudicialDistricts.length} judicial districts processed.`);
        
        console.log('[DB SEED] Seeding Judicial Branches...');
        for (const branch of sampleJudicialBranches) {
            await prisma.judicialBranch.upsert({ where: { id: branch.id }, update: {}, create: branch as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleJudicialBranches.length} judicial branches processed.`);
        
        console.log('[DB SEED] Seeding Judicial Processes...');
        for (const process of sampleJudicialProcesses) {
             await prisma.judicialProcess.upsert({ where: { id: process.id }, update: {}, create: process as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleJudicialProcesses.length} judicial processes processed.`);

        console.log('[DB SEED] Seeding Bens...');
        for (const bem of sampleBens) {
            await prisma.bem.upsert({ where: { id: bem.id }, update: {}, create: bem as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleBens.length} bens processed.`);
        
        console.log('[DB SEED] Seeding Auctions...');
        for (const auction of sampleAuctions) {
            await prisma.auction.upsert({ where: { id: auction.id }, update: {}, create: auction as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleAuctions.length} auctions processed.`);

        console.log('[DB SEED] Seeding Lots...');
        for (const lot of sampleLots) {
            await prisma.lot.upsert({ where: { id: lot.id }, update: {}, create: lot as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleLots.length} lots processed.`);
        
        console.log('[DB SEED] Seeding Direct Sale Offers...');
        for (const offer of sampleDirectSaleOffers) {
            await prisma.directSaleOffer.upsert({ where: { id: offer.id }, update: {}, create: offer as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleDirectSaleOffers.length} direct sale offers processed.`);
        
        console.log('[DB SEED] Seeding Bids...');
        for (const bid of sampleBids) {
            await prisma.bid.upsert({ where: { id: bid.id }, update: {}, create: bid as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleBids.length} bids processed.`);

        console.log('[DB SEED] Seeding User Wins...');
        for (const win of sampleUserWins) {
            await prisma.userWin.upsert({ where: { id: win.id }, update: {}, create: win as any });
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${sampleUserWins.length} wins processed.`);

        console.log('[DB SEED] Seeding Non-Admin Users with Hashed Passwords...');
        const otherUsers = sampleUsers.filter(u => u.email !== 'admin@bidexpert.com.br');
        for (const user of otherUsers) {
            const existingUser = await prisma.user.findUnique({ where: { email: user.email }});
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(user.password || 'password123', 10);
                const role = await prisma.role.findFirst({ where: { id: user.roleId }});
                if (role) {
                     const newUser = await prisma.user.create({
                        data: {
                            email: user.email,
                            fullName: user.fullName,
                            password: hashedPassword,
                            habilitationStatus: 'HABILITADO',
                            accountType: 'PHYSICAL',
                            seller: user.sellerId ? { connect: { id: user.sellerId }} : undefined,
                        }
                    });
                    await prisma.usersOnRoles.create({
                        data: { userId: newUser.id, roleId: role.id, assignedBy: 'seed-script' }
                    });
                }
            }
        }
        console.log(`[DB SEED] ✅ SUCCESS: ${otherUsers.length} other users processed.`);

    } catch (error: any) {
        console.error(`[DB SEED] ❌ ERROR seeding full demo data: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
    
    console.log('--- [DB SEED] Full Demo Data seeding finished ---');
}

seedFullData().catch(async (error) => {
    console.error("[DB SEED] ❌ FATAL ERROR during seeding:", error);
    await prisma.$disconnect();
    process.exit(1);
});
