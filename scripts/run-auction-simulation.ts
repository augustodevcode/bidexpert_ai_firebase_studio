/**
 * @fileoverview Script para rodar simulação de leilão automatizado
 * @description Pode ser executado via cron ou manualmente
 * 
 * Uso:
 *   npx tsx scripts/run-auction-simulation.ts
 *   
 * Ou via cron:
 *   0 * * * * cd /home/z/my-project && npx tsx scripts/run-auction-simulation.ts >> /var/log/auction-simulation.log 2>&1
 */

import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import fs from 'node:fs';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
  bidIncrement: 1000, // R$ 1.000
  minLotValue: 10000, // R$ 10.000
  maxLotValue: 100000, // R$ 100.000
  numberOfLots: 5,
  biddingRounds: 20,
  targetBidValue: 100000,
  logsDir: '/home/z/my-project/sandbox/logs'
};

// ============================================================================
// INTERFACES
// ============================================================================

interface BotUser {
  id: number;
  email: string;
  name: string | null;
  totalBids: number;
}

interface SimulationResult {
  success: boolean;
  auctionId: number;
  lotsCreated: number;
  totalBids: number;
  winners: Array<{ lotNumber: string; winnerId: number; amount: number }>;
  startTime: Date;
  endTime: Date;
  duration: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Salvar em arquivo
  const logFile = path.join(CONFIG.logsDir, `simulation-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage + '\n');
  if (data) {
    fs.appendFileSync(logFile, JSON.stringify(data, null, 2) + '\n');
  }
}

function randomValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// SIMULAÇÃO
// ============================================================================

async function runSimulation(): Promise<SimulationResult> {
  const startTime = new Date();
  log('🚀 Iniciando simulação de leilão automatizado');

  try {
    // 1. Criar leilão
    const auctionTitle = `Leilão Simulado ${Date.now()}`;
    const auctionSlug = auctionTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const auction = await prisma.auction.create({
      data: {
        publicId: `auction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        slug: auctionSlug,
        title: auctionTitle,
        description: 'Leilão simulado automaticamente para testes E2E',
        status: 'RASCUNHO',
        auctionDate: new Date(),
        endDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        totalLots: 0,
        tenantId: 1
      }
    });

    log(`📋 Leilão criado: ${auction.id} - ${auction.title}`);

    // 2. Criar lotes
    const lots = [];
    for (let i = 1; i <= CONFIG.numberOfLots; i++) {
      const lotNumber = String(i).padStart(3, '0');
      const initialPrice = randomValue(CONFIG.minLotValue, CONFIG.maxLotValue);

      const lot = await prisma.lot.create({
        data: {
          publicId: `lot-${Date.now()}-${i}`,
          auctionId: auction.id,
          number: lotNumber,
          title: `Lote ${lotNumber} - Ativo Simulado ${i}`,
          description: `Lote simulado automaticamente`,
          slug: `${auctionSlug}-lote-${lotNumber}`,
          price: initialPrice,
          initialPrice: initialPrice,
          status: 'EM_BREVE',
          type: 'IMOVEL',
          bidsCount: 0,
          views: 0,
          isFeatured: false,
          tenantId: 1
        }
      });

      lots.push(lot);
      log(`📦 Lote criado: ${lot.number} - R$ ${initialPrice.toLocaleString('pt-BR')}`);
    }

    // Atualizar total de lotes
    await prisma.auction.update({
      where: { id: auction.id },
      data: { totalLots: lots.length }
    });

    // 3. Buscar bots
    const bots = await prisma.user.findMany({
      where: {
        email: { startsWith: 'bot' }
      },
      take: 10
    });

    log(`🤖 Bots encontrados: ${bots.length}`);

    // 4. Habilitar bots
    for (const bot of bots) {
      await prisma.user.update({
        where: { id: bot.id },
        data: { isActive: true }
      });
    }
    log('✅ Bots habilitados');

    // 5. Abrir leilão para lances
    await prisma.auction.update({
      where: { id: auction.id },
      data: { status: 'ABERTO_PARA_LANCES' }
    });
    log('🔓 Leilão aberto para lances');

    // 6. Simular lances
    const botUsers: BotUser[] = bots.map(b => ({
      id: b.id,
      email: b.email,
      name: b.name,
      totalBids: 0
    }));

    const allBids: Array<{ lotId: number; bidderId: number; amount: number }> = [];

    for (let round = 0; round < CONFIG.biddingRounds; round++) {
      for (const bot of botUsers) {
        const randomLot = lots[Math.floor(Math.random() * lots.length)];

        // Obter lance atual
        const highestBid = await prisma.bid.findFirst({
          where: { lotId: randomLot.id, status: 'ATIVO' },
          orderBy: { amount: 'desc' }
        });

        const currentPrice = highestBid ? highestBid.amount : randomLot.initialPrice;
        const newBid = currentPrice + CONFIG.bidIncrement;

        if (newBid > CONFIG.targetBidValue) continue;

        // Criar lance
        await prisma.bid.create({
          data: {
            lotId: randomLot.id,
            auctionId: auction.id,
            bidderId: bot.id,
            amount: newBid,
            status: 'ATIVO',
            isAutoBid: false,
            tenantId: 1
          }
        });

        // Atualizar preço do lote
        await prisma.lot.update({
          where: { id: randomLot.id },
          data: {
            price: newBid,
            bidsCount: { increment: 1 }
          }
        });

        bot.totalBids++;
        allBids.push({ lotId: randomLot.id, bidderId: bot.id, amount: newBid });

        await delay(100);
      }
    }

    log(`💰 Lances registrados: ${allBids.length}`);

    // 7. Mudar para PREGAO
    await prisma.auction.update({
      where: { id: auction.id },
      data: { status: 'PREGAO' }
    });
    log('📢 Status alterado para PREGAO');

    // Mais lances na fase pregão
    for (let round = 0; round < 5; round++) {
      for (const bot of botUsers) {
        const randomLot = lots[Math.floor(Math.random() * lots.length)];

        const highestBid = await prisma.bid.findFirst({
          where: { lotId: randomLot.id, status: 'ATIVO' },
          orderBy: { amount: 'desc' }
        });

        const currentPrice = highestBid ? highestBid.amount : randomLot.initialPrice;
        const newBid = currentPrice + CONFIG.bidIncrement;

        if (newBid > CONFIG.targetBidValue) continue;

        await prisma.bid.create({
          data: {
            lotId: randomLot.id,
            auctionId: auction.id,
            bidderId: bot.id,
            amount: newBid,
            status: 'ATIVO',
            isAutoBid: false,
            tenantId: 1
          }
        });

        await prisma.lot.update({
          where: { id: randomLot.id },
          data: {
            price: newBid,
            bidsCount: { increment: 1 }
          }
        });

        bot.totalBids++;
        allBids.push({ lotId: randomLot.id, bidderId: bot.id, amount: newBid });

        await delay(100);
      }
    }

    // 8. Encerrar leilão
    await prisma.auction.update({
      where: { id: auction.id },
      data: { status: 'ENCERRADO' }
    });
    log('🏁 Leilão encerrado');

    // 9. Declarar vencedores
    const winners: Array<{ lotNumber: string; winnerId: number; amount: number }> = [];

    for (const lot of lots) {
      const winningBid = await prisma.bid.findFirst({
        where: { lotId: lot.id, status: 'ATIVO' },
        orderBy: { amount: 'desc' }
      });

      if (winningBid) {
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            status: 'ARREMATADO',
            winnerId: winningBid.bidderId,
            price: winningBid.amount
          }
        });

        winners.push({
          lotNumber: lot.number || 'N/A',
          winnerId: winningBid.bidderId,
          amount: winningBid.amount
        });

        log(`🏆 Lote ${lot.number}: Arrematado por R$ ${winningBid.amount.toLocaleString('pt-BR')}`);
      } else {
        await prisma.lot.update({
          where: { id: lot.id },
          data: { status: 'NAO_VENDIDO' }
        });

        log(`❌ Lote ${lot.number}: Não vendido`);
      }
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    const result: SimulationResult = {
      success: true,
      auctionId: auction.id,
      lotsCreated: lots.length,
      totalBids: allBids.length,
      winners,
      startTime,
      endTime,
      duration
    };

    log('✅ Simulação concluída com sucesso!', result);

    return result;

  } catch (error: any) {
    log('❌ Erro na simulação:', { error: error.message, stack: error.stack });
    
    const endTime = new Date();
    return {
      success: false,
      auctionId: 0,
      lotsCreated: 0,
      totalBids: 0,
      winners: [],
      startTime,
      endTime,
      duration: (endTime.getTime() - startTime.getTime()) / 1000
    };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

// Verificar se está sendo executado diretamente
if (require.main === module) {
  runSimulation()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log('RELATÓRIO DA SIMULAÇÃO');
      console.log('='.repeat(60));
      console.log(`Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
      console.log(`Leilão ID: ${result.auctionId}`);
      console.log(`Lotes criados: ${result.lotsCreated}`);
      console.log(`Total de lances: ${result.totalBids}`);
      console.log(`Vencedores: ${result.winners.length}`);
      console.log(`Duração: ${result.duration.toFixed(2)}s`);
      console.log('='.repeat(60));
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

export { runSimulation };
