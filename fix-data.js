const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Renomear tribunal ID 402 para diferenciar
    await prisma.court.update({
        where: { id: 402 },
        data: { name: 'Tribunal de Justiça de São Paulo - Capital' }
    });
    console.log('Tribunal 402 renomeado para: Tribunal de Justiça de São Paulo - Capital');

    // Renomear tribunal ID 403 para ficar mais claro  
    await prisma.court.update({
        where: { id: 403 },
        data: { name: 'Tribunal de Justiça de São Paulo - Interior' }
    });
    console.log('Tribunal 403 renomeado para: Tribunal de Justiça de São Paulo - Interior');

    // Verificar resultado
    const tribunais = await prisma.court.findMany();
    console.log('\nTribunais atualizados:');
    tribunais.forEach(t => console.log(`  [${t.id}] ${t.name}`));

    await prisma.$disconnect();
}

main().catch(console.error);
