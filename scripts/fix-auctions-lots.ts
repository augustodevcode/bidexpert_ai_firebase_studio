import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAuctionsAndLots() {
  try {
    console.log('=== Iniciando correção de leilões e lotes ===');
    
    // 1. Atualizar status dos leilões
    console.log('Atualizando status dos leilões...');
    await prisma.auction.updateMany({
      where: {
        status: 'CANCELADO'
      },
      data: {
        status: 'ABERTO_PARA_LANCES',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias a partir de agora
      }
    });

    // 2. Atualizar o preço inicial para os lotes que estão como null
    console.log('Atualizando preços iniciais dos lotes...');
    await prisma.lot.updateMany({
      where: {
        initialPrice: null
      },
      data: {
        initialPrice: 0 // Definindo um valor padrão, pois o campo é obrigatório
      }
    });
    
    // Atualizar o preço inicial para ser igual ao preço atual
    const lotsToUpdate = await prisma.lot.findMany({
      where: {
        initialPrice: 0,
        price: { not: undefined }
      },
      select: {
        id: true,
        price: true
      }
    });
    
    for (const lot of lotsToUpdate) {
      if (lot.price !== null && lot.price !== undefined) {
        await prisma.lot.update({
          where: { id: lot.id },
          data: { initialPrice: lot.price }
        });
      }
    }

    // 3. Atualizar status dos lotes
    console.log('Atualizando status dos lotes...');
    await prisma.lot.updateMany({
      where: {
        status: 'RASCUNHO',
        auction: {
          status: 'ABERTO_PARA_LANCES'
        }
      },
      data: {
        status: 'ABERTO_PARA_LANCES'
      }
    });

    console.log('=== Correção concluída com sucesso! ===');
    
    // 4. Mostrar estatísticas atualizadas
    const updatedAuctions = await prisma.auction.count({
      where: { status: 'ABERTO_PARA_LANCES' }
    });
    
    const updatedLots = await prisma.lot.count({
      where: { status: 'ABERTO_PARA_LANCES' }
    });
    
    console.log(`\n=== Estatísticas Atualizadas ===`);
    console.log(`- Leilões ABERTOS_PARA_LANCES: ${updatedAuctions}`);
    console.log(`- Lotes ABERTOS_PARA_LANCES: ${updatedLots}`);
    
  } catch (error) {
    console.error('Erro ao corrigir leilões e lotes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a correção
fixAuctionsAndLots();
