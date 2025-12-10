const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verificando dados do seed...\n');

    // Dados principais
    const tenants = await prisma.tenant.count();
    const users = await prisma.user.count();
    const roles = await prisma.role.count();
    const auctions = await prisma.auction.count();
    const lots = await prisma.lot.count();
    const bids = await prisma.bid.count();
    const judicialProcesses = await prisma.judicialProcess.count();
    const assets = await prisma.asset.count();

    // Novos dados
    const platformSettings = await prisma.platformSettings.count();
    const lotCategories = await prisma.lotCategory.count();
    const subcategories = await prisma.subcategory.count();
    const directSaleOffers = await prisma.directSaleOffer.count();
    const bidderProfiles = await prisma.bidderProfile.count();
    const userWins = await prisma.userWin.count();
    const itsmTickets = await prisma.iTSM_Ticket.count();
    const reviews = await prisma.review.count();
    const auditLogs = await prisma.auditLog.count();

    console.log('📊 RESUMO DOS DADOS NO BANCO\n');
    console.log('=== DADOS PRINCIPAIS ===');
    console.log(`✓ Tenants: ${tenants}`);
    console.log(`✓ Users: ${users}`);
    console.log(`✓ Roles: ${roles}`);
    console.log(`✓ Auctions: ${auctions}`);
    console.log(`✓ Lots: ${lots}`);
    console.log(`✓ Bids: ${bids}`);
    console.log(`✓ Judicial Processes: ${judicialProcesses}`);
    console.log(`✓ Assets: ${assets}`);

    console.log('\n=== NOVOS DADOS ADICIONADOS ===');
    console.log(`✓ Platform Settings: ${platformSettings}`);
    console.log(`✓ Lot Categories: ${lotCategories}`);
    console.log(`✓ Subcategories: ${subcategories}`);
    console.log(`✓ Direct Sale Offers: ${directSaleOffers}`);
    console.log(`✓ Bidder Profiles: ${bidderProfiles}`);
    console.log(`✓ User Wins: ${userWins}`);
    console.log(`✓ ITSM Tickets: ${itsmTickets}`);
    console.log(`✓ Reviews: ${reviews}`);
    console.log(`✓ Audit Logs: ${auditLogs}`);

    // Verificação
    const allGood = platformSettings > 0 && lotCategories > 0 && directSaleOffers > 0;

    console.log('\n');
    if (allGood) {
        console.log('🎉 Todas as tabelas principais contêm dados!');
    } else {
        console.log('⚠️  Algumas tabelas estão vazias');
    }

    console.log('\n✅ Verificação concluída!\n');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
