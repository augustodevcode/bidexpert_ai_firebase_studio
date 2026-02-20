import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function triggerCron() {
    console.log('🔄 Iniciando simulação do Cronjob de Encerramento...');

    try {
        // 1. Buscar lotes abertos para lances ou em pregão que já passaram do horário
        // Na nossa simulação o leilão deve estar em pregão e com o tempo de pregão esgotado
        // Como fizemos o time travel, qualquer coisa aberta > 30 min atrás está pronta para fechar

        // Simplificando o cronjob para o teste: 
        // Mudar lotes de IN_AUDITORIUM para FINISHED e associar vencedor
        const lotsToClose = await prisma.lot.findMany({
            where: {
                status: 'IN_AUDITORIUM'
            },
            include: {
                bids: {
                    orderBy: { amount: 'desc' },
                    take: 1
                }
            }
        });

        console.log(`Encontrados ${lotsToClose.length} lotes para encerrar.`);

        for (const lot of lotsToClose) {
            const winningBid = lot.bids[0];

            const updateData: any = {
                status: 'FINISHED',
                soldInfo: `Arrematado via pregão automatizado (TEST E2E)`
            };

            if (winningBid) {
                updateData.winningBidId = winningBid.id;
                console.log(`🏆 Lote ${lot.lotNumber} VENDIDO para Bid ID ${winningBid.id} por R$ ${winningBid.amount}`);
            } else {
                console.log(`❌ Lote ${lot.lotNumber} FECHADO SEM LANCES`);
            }

            await prisma.lot.update({
                where: { id: lot.id },
                data: updateData
            });
        }

        // 2. Fechar o leilão se todos os lotes estiverem finalizados
        const auctionsToCheck = await prisma.auction.findMany({
            where: {
                status: { in: ['IN_AUDITORIUM', 'PUBLISHED'] }
            },
            include: {
                lots: true
            }
        });

        for (const auction of auctionsToCheck) {
            const allFinished = auction.lots.every(l => l.status === 'FINISHED' || l.status === 'WITHDRAWN' || l.status === 'UNSOLD');
            if (allFinished && auction.lots.length > 0) {
                await prisma.auction.update({
                    where: { id: auction.id },
                    data: { status: 'FINISHED' }
                });
                console.log(`✅ Leilão "${auction.title}" ENCERRADO com sucesso!`);
            }
        }

    } catch (err) {
        console.error('Erro ao executar cronjob simulado:', err);
    } finally {
        await prisma.$disconnect();
        console.log('🏁 Cronjob simulado finalizado.');
    }
}

triggerCron();
