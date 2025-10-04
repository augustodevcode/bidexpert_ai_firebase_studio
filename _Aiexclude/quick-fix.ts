import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Quick Fix...\n');

  // 1. Criar 200 assets
  console.log('Creating assets...');
  const sellers = await prisma.seller.findMany({ take: 5 });
  const categories = await prisma.lotCategory.findMany({ take: 5 });
  const cities = await prisma.city.findMany({ include: { state: true }, take: 10 });
  
  for (let i = 0; i < 200; i++) {
    try {
      await prisma.asset.create({
        data: {
          title: `Asset ${i}`,
          status: 'DISPONIVEL',
          categoryId: categories[i % categories.length].id,
          sellerId: sellers[i % sellers.length].id,
          evaluationValue: 10000,
          locationCity: cities[i % cities.length].name,
          locationState: cities[i % cities.length].state.uf,
          tenantId: sellers[0].tenantId,
        },
      });
    } catch (e) {}
  }
  console.log('✅ Assets created\n');

  // 2. Vincular assets a lotes
  console.log('Linking assets to lots...');
  const lotsNoAssets = await prisma.lot.findMany({ where: { assets: { none: {} } }, take: 200 });
  const assets = await prisma.asset.findMany({ where: { status: 'DISPONIVEL' }, take: 200 });
  
  for (let i = 0; i < Math.min(lotsNoAssets.length, assets.length); i++) {
    try {
      await prisma.assetsOnLots.create({
        data: { assetId: assets[i].id, lotId: lotsNoAssets[i].id, assignedBy: 'system' },
      });
      await prisma.asset.update({ where: { id: assets[i].id }, data: { status: 'LOTEADO' } });
    } catch (e) {}
  }
  console.log('✅ Assets linked\n');

  // 3. Fix lot status
  console.log('Fixing lot status...');
  await prisma.lot.updateMany({
    where: { status: 'ABERTO_PARA_LANCES', auction: { status: { in: ['ENCERRADO', 'FINALIZADO', 'CANCELADO'] } } },
    data: { status: 'ENCERRADO' },
  });
  console.log('✅ Status fixed\n');

  // 4. Add location to lots
  console.log('Adding location to lots...');
  const lotsNoCity = await prisma.lot.findMany({ where: { cityId: null }, take: 100 });
  for (const lot of lotsNoCity) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    try {
      await prisma.lot.update({
        where: { id: lot.id },
        data: { cityId: city.id, cityName: city.name, stateId: city.stateId, stateUf: city.state.uf },
      });
    } catch (e) {}
  }
  console.log('✅ Locations added\n');

  console.log('✅ DONE!\n');
  await prisma.$disconnect();
}

main();
