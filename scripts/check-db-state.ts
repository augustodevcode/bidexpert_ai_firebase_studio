import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO ESTADO DO BANCO ===\n');
  
  // Check tenants
  const tenants = await prisma.tenant.findMany();
  console.log(`📦 Tenants: ${tenants.length}`);
  tenants.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));
  
  // Check users with roles
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: { role: true }
      }
    },
    take: 10
  });
  console.log(`\n👥 Usuários (primeiros 10): ${users.length}`);
  users.forEach(u => {
    const roleNames = u.roles.map(r => r.role.name).join(', ');
    console.log(`   - ${u.email} | Roles: ${roleNames}`);
  });
  
  // Check auctioneers
  const auctioneers = await prisma.auctioneer.findMany();
  console.log(`\n🔨 Leiloeiros: ${auctioneers.length}`);
  auctioneers.slice(0, 3).forEach(a => console.log(`   - ${a.name} (ID: ${a.id}, Tenant: ${a.tenantId})`));
  
  // Check sellers
  const sellers = await prisma.seller.findMany();
  console.log(`\n🏪 Vendedores/Comitentes: ${sellers.length}`);
  sellers.slice(0, 3).forEach(s => console.log(`   - ${s.name} (ID: ${s.id})`));
  
  // Check cities
  const cities = await prisma.city.findMany({ include: { state: true } });
  console.log(`\n🏙️  Cidades: ${cities.length}`);
  const maringa = cities.find(c => c.name === 'Maringá');
  if (maringa) {
    console.log(`   ✓ Maringá encontrada: ID ${maringa.id}, Estado: ${maringa.state.name}`);
  } else {
    console.log(`   ⚠️  Maringá NÃO encontrada`);
  }
  
  // Check auctions
  const auctions = await prisma.auction.findMany();
  console.log(`\n🎯 Leilões: ${auctions.length}`);
  auctions.slice(0, 3).forEach(a => console.log(`   - ${a.title} (Status: ${a.status})`));
  
  // Check lots
  const lots = await prisma.lot.findMany();
  console.log(`\n📦 Lotes: ${lots.length}`);
  
  // Check assets
  const assets = await prisma.asset.findMany();
  console.log(`\n🏍️  Ativos: ${assets.length}`);
  const moto = assets.find(a => a.title?.includes('YAMAHA'));
  if (moto) {
    console.log(`   ✓ Moto YAMAHA encontrada: ID ${moto.id}`);
  }
  
  console.log('\n=== FIM DA VERIFICAÇÃO ===');
}

main()
  .catch(e => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
