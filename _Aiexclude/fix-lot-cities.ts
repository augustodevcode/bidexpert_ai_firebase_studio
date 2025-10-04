/**
 * Script para vincular cidades aos lotes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Vinculando cidades aos lotes...\n');

  try {
    // Buscar todas as cidades disponíveis
    const cities = await prisma.city.findMany({
      include: { state: true },
    });

    console.log(`🏙️  ${cities.length} cidades disponíveis\n`);

    if (cities.length === 0) {
      console.log('❌ Nenhuma cidade encontrada no banco!');
      return;
    }

    // Buscar todos os lotes sem cidade
    const lotsWithoutCity = await prisma.lot.findMany({
      where: { cityId: null },
    });

    console.log(`📦 ${lotsWithoutCity.length} lotes sem cidade\n`);

    let updated = 0;
    let errors = 0;

    // Atualizar cada lote com uma cidade aleatória
    for (const lot of lotsWithoutCity) {
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      try {
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            cityId: randomCity.id,
            cityName: randomCity.name,
            stateId: randomCity.stateId,
            stateUf: randomCity.state.uf,
          },
        });
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`  ✓ ${updated} lotes atualizados...`);
        }
      } catch (e) {
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`\n📊 Resultado:`);
    console.log(`  ✓ Lotes atualizados: ${updated}`);
    console.log(`  ✗ Erros: ${errors}`);
    console.log(`  📈 Taxa de sucesso: ${((updated / lotsWithoutCity.length) * 100).toFixed(2)}%`);

    // Verificar resultado
    const lotsWithCity = await prisma.lot.count({
      where: { cityId: { not: null } },
    });

    console.log(`\n🎯 Lotes com cidade agora: ${lotsWithCity}/${lotsWithoutCity.length + lotsWithCity}`);

    // Mostrar exemplos
    const examples = await prisma.lot.findMany({
      where: { cityId: { not: null } },
      select: {
        title: true,
        cityName: true,
        stateUf: true,
        city: {
          select: { name: true, state: { select: { uf: true } } }
        }
      },
      take: 5,
    });

    console.log('\n📋 Exemplos de lotes atualizados:');
    examples.forEach(lot => {
      console.log(`  - ${lot.title}`);
      console.log(`    📍 ${lot.cityName} - ${lot.stateUf}`);
    });

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
