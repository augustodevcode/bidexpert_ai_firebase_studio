const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== TRIBUNAIS COM COMARCAS ===');
    const tribunais = await prisma.court.findMany({
        select: { id: true, name: true }
    });
    for (const t of tribunais) {
        const comarcas = await prisma.judicialDistrict.findMany({
            where: { courtId: t.id },
            select: { id: true, name: true }
        });
        console.log(`\nTRIBUNAL ID: ${t.id}`);
        console.log(`  Nome: ${t.name}`);
        console.log(`  Comarcas: ${comarcas.length}`);
        comarcas.forEach(c => console.log(`    - [${c.id}] ${c.name}`));
    }

    await prisma.$disconnect();
}

main().catch(console.error);
