import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSeedData() {
  console.log('🔍 Verificando dados do seed...\n');

  try {
    // Verificar usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        habilitationStatus: true,
        accountType: true,
        _count: {
          select: {
            roles: true,
            tenants: true
          }
        }
      }
    });

    console.log(`👥 Usuários encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - Roles: ${user._count.roles}, Tenants: ${user._count.tenants}`);
    });

    // Verificar auctions
    const auctions = await prisma.auction.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        auctionType: true,
        auctionMethod: true,
        participation: true,
        _count: {
          select: {
            lots: true
          }
        }
      }
    });

    console.log(`\n🏛️ Auctions encontrados: ${auctions.length}`);
    auctions.forEach(auction => {
      console.log(`  - ${auction.title} (${auction.auctionType}) - Status: ${auction.status} - Lots: ${auction._count.lots}`);
    });

    // Verificar lots
    const lots = await prisma.lot.findMany({
      select: {
        id: true,
        number: true,
        title: true,
        type: true,
        status: true,
        price: true,
        initialPrice: true,
        auction: {
          select: {
            title: true
          }
        }
      }
    });

    console.log(`\n📦 Lots encontrados: ${lots.length}`);
    lots.forEach(lot => {
      console.log(`  - ${lot.number}: ${lot.title} (${lot.type}) - Preço: R$ ${lot.price} - Auction: ${lot.auction.title}`);
    });

    // Verificar roles
    const roles = await prisma.role.findMany({
      select: {
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log(`\n🎯 Roles encontrados: ${roles.length}`);
    roles.forEach(role => {
      console.log(`  - ${role.name} - Usuários: ${role._count.users}`);
    });

    // Verificar tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        _count: {
          select: {
            users: true,
            auctions: true
          }
        }
      }
    });

    // Verificar bids
    const bids = await prisma.bid.findMany({
      select: {
        id: true,
        amount: true,
        lot: {
          select: {
            number: true,
            title: true
          }
        },
        bidder: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log(`\n💰 Bids encontrados: ${bids.length}`);
    bids.forEach(bid => {
      console.log(`  - R$ ${bid.amount} por ${bid.bidder?.fullName || 'Usuário desconhecido'} no lote ${bid.lot.number}: ${bid.lot.title}`);
    });

    // Verificar assets
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: {
            lots: true
          }
        }
      },
      take: 10
    });

    console.log(`\n🏗️ Assets encontrados: ${assets.length}`);
    assets.forEach(asset => {
      console.log(`  - ${asset.title} - Status: ${asset.status} - Lots: ${asset._count.lots}`);
    });

    // Verificar judicial processes
    const judicialProcesses = await prisma.judicialProcess.findMany({
      select: {
        id: true,
        processNumber: true,
        court: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            auctions: true
          }
        }
      }
    });

    console.log(`\n⚖️ Processos judiciais encontrados: ${judicialProcesses.length}`);
    judicialProcesses.forEach(process => {
      console.log(`  - ${process.processNumber} - Tribunal: ${process.court.name} - Auctions: ${process._count.auctions}`);
    });

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeedData();