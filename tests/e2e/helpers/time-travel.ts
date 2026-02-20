import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const auctionId = process.argv[2];

    if (!auctionId) {
        console.error('Por favor, forneça o ID do leilão. Ex: npx ts-node time-travel.ts <id>');
        process.exit(1);
    }

    try {
        const auction = await prisma.auction.findUnique({
            where: { id: BigInt(auctionId) },
            include: { stages: true, lots: true },
        });

        if (!auction) {
            console.error(`Leilão ${auctionId} não encontrado.`);
            process.exit(1);
        }

        console.log(`=== Viajando no tempo para o Leilão ${auction.title} ===`);

        // Retroceder data de criação e atualização em 35 minutos
        const timeToSubtract = 35 * 60 * 1000;
        const pastDate = new Date(Date.now() - timeToSubtract);

        // Ajustar datas do leilão
        if (auction.startedAt) {
            await prisma.auction.update({
                where: { id: auction.id },
                data: {
                    startedAt: pastDate,
                    updatedAt: new Date()
                }
            });
            console.log('✅ startedAt do leilão ajustado para 35min atrás');
        }

        // Ajustar datas dos lotes
        for (const lot of auction.lots) {
            if (lot.openedAt) {
                await prisma.lot.update({
                    where: { id: lot.id },
                    data: {
                        openedAt: pastDate,
                        updatedAt: new Date()
                    }
                });
                console.log(`✅ openedAt do lote ${lot.lotNumber} ajustado`);
            }
        }

        console.log('✅ Viagem no tempo concluída com sucesso!');
    } catch (error) {
        console.error('Erro na viagem no tempo:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
