/**
 * Script para verificar se os lotes têm cidades vinculadas
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando vínculos de Lotes com Cidades...\n');

  try {
    // 1. Verificar lotes com cityId
    const lotsWithCity = await prisma.lot.findMany({
      where: { cityId: { not: null } },
      select: {
        id: true,
        title: true,
        cityId: true,
        cityName: true,
        stateUf: true,
        city: {
          select: { name: true, state: { select: { uf: true } } }
        }
      },
      take: 10,
    });

    console.log(`📊 Lotes COM cityId: ${lotsWithCity.length}`);
    if (lotsWithCity.length > 0) {
      console.log('\n✅ Exemplos de lotes com cidade:');
      lotsWithCity.slice(0, 5).forEach(lot => {
        console.log(`  - ${lot.title}`);
        console.log(`    cityId: ${lot.cityId}`);
        console.log(`    cityName: ${lot.cityName || 'N/A'}`);
        console.log(`    stateUf: ${lot.stateUf || 'N/A'}`);
        if (lot.city) {
          console.log(`    Cidade vinculada: ${lot.city.name} - ${lot.city.state.uf}`);
        }
        console.log('');
      });
    }

    // 2. Verificar lotes SEM cityId
    const lotsWithoutCity = await prisma.lot.count({
      where: { cityId: null },
    });

    console.log(`\n❌ Lotes SEM cityId: ${lotsWithoutCity}`);

    // 3. Verificar total de lotes
    const totalLots = await prisma.lot.count();
    console.log(`\n📈 Total de lotes: ${totalLots}`);
    console.log(`📊 Percentual com cidade: ${((lotsWithCity.length / totalLots) * 100).toFixed(2)}%`);

    // 4. Verificar cidades disponíveis
    const cities = await prisma.city.findMany({
      select: { id: true, name: true, state: { select: { uf: true } } },
      take: 10,
    });

    console.log(`\n🏙️  Cidades disponíveis no banco: ${cities.length}`);
    cities.slice(0, 5).forEach(city => {
      console.log(`  - ${city.name} (${city.state.uf}) - ID: ${city.id}`);
    });

    // 5. Verificar se há lotes com cityName mas sem cityId
    const lotsWithNameButNoId = await prisma.lot.count({
      where: {
        cityName: { not: null },
        cityId: null,
      },
    });

    console.log(`\n⚠️  Lotes com cityName mas SEM cityId: ${lotsWithNameButNoId}`);

    // 6. Verificar lotes por status
    const lotsByStatus = await prisma.lot.groupBy({
      by: ['status'],
      _count: true,
      where: { cityId: { not: null } },
    });

    console.log('\n📋 Lotes com cidade por status:');
    lotsByStatus.forEach(group => {
      console.log(`  - ${group.status}: ${group._count} lotes`);
    });

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
