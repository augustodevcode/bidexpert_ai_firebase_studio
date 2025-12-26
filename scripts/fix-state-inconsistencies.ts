/**
 * @fileoverview Script para diagnosticar e corrigir inconsistências de estado
 * entre Leilão (Auction), Lote (Lot) e Ativo (Asset).
 * 
 * Este script verifica:
 * 1. Leilões ABERTO/ABERTO_PARA_LANCES com Lotes em RASCUNHO
 * 2. Lotes ABERTO_PARA_LANCES com Leilão ENCERRADO/FINALIZADO
 * 3. Lotes sem Ativos vinculados (quando obrigatório)
 * 4. Ativos com status LOTEADO que não estão vinculados a nenhum Lote
 * 5. Ativos vinculados a Lotes mas com status diferente de LOTEADO
 * 
 * Uso:
 *   npx ts-node --project tsconfig.json scripts/fix-state-inconsistencies.ts [--fix]
 * 
 * Sem --fix: apenas diagnóstico (dry-run)
 * Com --fix: aplica correções automaticamente
 */

import { PrismaClient, AuctionStatus, LotStatus, AssetStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface InconsistencyReport {
  type: string;
  entityType: 'Auction' | 'Lot' | 'Asset';
  entityId: string;
  entityPublicId?: string | null;
  currentStatus: string;
  expectedStatus?: string;
  relatedEntity?: string;
  relatedEntityStatus?: string;
  message: string;
  autoFixable: boolean;
  fixAction?: string;
}

// Status de Leilão que permitem modificações nos Lotes
const AUCTION_EDITABLE_STATUSES: AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO'];

// Status de Leilão que indicam que está "aberto" para operações de lance
const AUCTION_OPEN_STATUSES: AuctionStatus[] = ['ABERTO', 'ABERTO_PARA_LANCES'];

// Status de Leilão que indicam encerramento
const AUCTION_CLOSED_STATUSES: AuctionStatus[] = ['ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'];

// Status de Lote que requerem Leilão ativo
const LOT_REQUIRES_ACTIVE_AUCTION: LotStatus[] = ['ABERTO_PARA_LANCES'];

// Status de Lote que indicam "rascunho" ou preparação
const LOT_DRAFT_STATUSES: LotStatus[] = ['RASCUNHO'];

// Status de Lote que indicam encerramento
const LOT_CLOSED_STATUSES: LotStatus[] = ['ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO', 'RETIRADO'];

async function findInconsistencies(): Promise<InconsistencyReport[]> {
  const issues: InconsistencyReport[] = [];

  console.log('\n🔍 Buscando inconsistências de estado...\n');

  // 1. Leilões ABERTO/ABERTO_PARA_LANCES com Lotes em RASCUNHO
  console.log('  [1/5] Verificando Leilões abertos com Lotes em rascunho...');
  const openAuctionsWithDraftLots = await prisma.auction.findMany({
    where: {
      status: { in: AUCTION_OPEN_STATUSES },
      lots: {
        some: {
          status: { in: LOT_DRAFT_STATUSES }
        }
      }
    },
    include: {
      lots: {
        where: { status: { in: LOT_DRAFT_STATUSES } },
        select: { id: true, publicId: true, status: true, title: true }
      }
    }
  });

  for (const auction of openAuctionsWithDraftLots) {
    for (const lot of auction.lots) {
      issues.push({
        type: 'OPEN_AUCTION_WITH_DRAFT_LOT',
        entityType: 'Auction',
        entityId: auction.id.toString(),
        entityPublicId: auction.publicId,
        currentStatus: auction.status,
        relatedEntity: `Lot ${lot.publicId} (${lot.title})`,
        relatedEntityStatus: lot.status,
        message: `Leilão "${auction.title}" está ${auction.status} mas possui Lote "${lot.title}" em ${lot.status}`,
        autoFixable: true,
        fixAction: `Reverter Leilão para EM_PREPARACAO ou avançar Lote para EM_BREVE`
      });
    }
  }

  // 2. Lotes ABERTO_PARA_LANCES com Leilão não ativo
  console.log('  [2/5] Verificando Lotes abertos com Leilão encerrado...');
  const openLotsWithClosedAuction = await prisma.lot.findMany({
    where: {
      status: { in: LOT_REQUIRES_ACTIVE_AUCTION },
      auction: {
        status: { in: AUCTION_CLOSED_STATUSES }
      }
    },
    include: {
      auction: {
        select: { id: true, publicId: true, status: true, title: true }
      }
    }
  });

  for (const lot of openLotsWithClosedAuction) {
    issues.push({
      type: 'OPEN_LOT_WITH_CLOSED_AUCTION',
      entityType: 'Lot',
      entityId: lot.id.toString(),
      entityPublicId: lot.publicId,
      currentStatus: lot.status,
      relatedEntity: `Auction ${lot.auction.publicId} (${lot.auction.title})`,
      relatedEntityStatus: lot.auction.status,
      message: `Lote "${lot.title}" está ${lot.status} mas Leilão "${lot.auction.title}" está ${lot.auction.status}`,
      autoFixable: true,
      fixAction: `Encerrar Lote automaticamente (mudar para ENCERRADO ou NAO_VENDIDO)`
    });
  }

  // 3. Lotes ABERTO_PARA_LANCES sem Ativos vinculados
  console.log('  [3/5] Verificando Lotes abertos sem Ativos vinculados...');
  const openLotsWithoutAssets = await prisma.lot.findMany({
    where: {
      status: { in: ['ABERTO_PARA_LANCES', 'EM_BREVE'] },
      assets: {
        none: {}
      }
    },
    select: {
      id: true,
      publicId: true,
      title: true,
      status: true,
      auctionId: true,
      auction: { select: { title: true, publicId: true } }
    }
  });

  for (const lot of openLotsWithoutAssets) {
    issues.push({
      type: 'OPEN_LOT_WITHOUT_ASSETS',
      entityType: 'Lot',
      entityId: lot.id.toString(),
      entityPublicId: lot.publicId,
      currentStatus: lot.status,
      relatedEntity: `Auction ${lot.auction.publicId}`,
      message: `Lote "${lot.title}" está ${lot.status} mas não possui nenhum Ativo vinculado`,
      autoFixable: true,
      fixAction: `Reverter Lote para RASCUNHO`
    });
  }

  // 4. Ativos com status LOTEADO mas não vinculados a nenhum Lote
  console.log('  [4/5] Verificando Ativos LOTEADO sem vínculo com Lote...');
  const loteadoAssetsWithoutLots = await prisma.asset.findMany({
    where: {
      status: 'LOTEADO',
      lots: {
        none: {}
      }
    },
    select: {
      id: true,
      publicId: true,
      title: true,
      status: true
    }
  });

  for (const asset of loteadoAssetsWithoutLots) {
    issues.push({
      type: 'LOTEADO_ASSET_WITHOUT_LOT',
      entityType: 'Asset',
      entityId: asset.id.toString(),
      entityPublicId: asset.publicId,
      currentStatus: asset.status,
      message: `Ativo "${asset.title}" está LOTEADO mas não está vinculado a nenhum Lote`,
      autoFixable: true,
      fixAction: `Reverter status para DISPONIVEL`
    });
  }

  // 5. Ativos vinculados a Lotes mas com status diferente de LOTEADO
  console.log('  [5/5] Verificando Ativos vinculados a Lotes mas não LOTEADO...');
  const assetsInLotsNotLoteado = await prisma.asset.findMany({
    where: {
      status: { not: 'LOTEADO' },
      lots: {
        some: {}
      }
    },
    include: {
      lots: {
        include: {
          lot: {
            select: { id: true, publicId: true, title: true, status: true }
          }
        }
      }
    }
  });

  for (const asset of assetsInLotsNotLoteado) {
    // Ignora se o status é VENDIDO (ativo já foi vendido via lote)
    if (asset.status === 'VENDIDO') continue;
    
    const activeLots = asset.lots.filter(l => !LOT_CLOSED_STATUSES.includes(l.lot.status as LotStatus));
    if (activeLots.length > 0) {
      issues.push({
        type: 'ASSET_IN_LOT_NOT_LOTEADO',
        entityType: 'Asset',
        entityId: asset.id.toString(),
        entityPublicId: asset.publicId,
        currentStatus: asset.status,
        relatedEntity: `Lot ${activeLots[0].lot.publicId} (${activeLots[0].lot.title})`,
        relatedEntityStatus: activeLots[0].lot.status,
        message: `Ativo "${asset.title}" está vinculado ao Lote "${activeLots[0].lot.title}" mas seu status é ${asset.status} (deveria ser LOTEADO)`,
        autoFixable: true,
        fixAction: `Atualizar status para LOTEADO`
      });
    }
  }

  return issues;
}

async function applyFixes(issues: InconsistencyReport[]): Promise<void> {
  console.log('\n🔧 Aplicando correções...\n');

  let fixedCount = 0;
  let errorCount = 0;

  for (const issue of issues) {
    if (!issue.autoFixable) {
      console.log(`  ⏭️  [${issue.type}] Não é auto-corrigível: ${issue.message}`);
      continue;
    }

    try {
      switch (issue.type) {
        case 'OPEN_AUCTION_WITH_DRAFT_LOT':
          // Estratégia: Reverter o Leilão para EM_PREPARACAO (mais seguro)
          await prisma.auction.update({
            where: { id: BigInt(issue.entityId) },
            data: { status: 'EM_PREPARACAO', updatedAt: new Date() }
          });
          console.log(`  ✅ Leilão ${issue.entityPublicId} revertido para EM_PREPARACAO`);
          fixedCount++;
          break;

        case 'OPEN_LOT_WITH_CLOSED_AUCTION':
          // Encerrar o Lote
          await prisma.lot.update({
            where: { id: BigInt(issue.entityId) },
            data: { status: 'ENCERRADO', updatedAt: new Date() }
          });
          console.log(`  ✅ Lote ${issue.entityPublicId} encerrado automaticamente`);
          fixedCount++;
          break;

        case 'OPEN_LOT_WITHOUT_ASSETS':
          // Reverter para RASCUNHO
          await prisma.lot.update({
            where: { id: BigInt(issue.entityId) },
            data: { status: 'RASCUNHO', updatedAt: new Date() }
          });
          console.log(`  ✅ Lote ${issue.entityPublicId} revertido para RASCUNHO (sem ativos)`);
          fixedCount++;
          break;

        case 'LOTEADO_ASSET_WITHOUT_LOT':
          // Reverter para DISPONIVEL
          await prisma.asset.update({
            where: { id: BigInt(issue.entityId) },
            data: { status: 'DISPONIVEL', updatedAt: new Date() }
          });
          console.log(`  ✅ Ativo ${issue.entityPublicId} revertido para DISPONIVEL`);
          fixedCount++;
          break;

        case 'ASSET_IN_LOT_NOT_LOTEADO':
          // Atualizar para LOTEADO
          await prisma.asset.update({
            where: { id: BigInt(issue.entityId) },
            data: { status: 'LOTEADO', updatedAt: new Date() }
          });
          console.log(`  ✅ Ativo ${issue.entityPublicId} atualizado para LOTEADO`);
          fixedCount++;
          break;

        default:
          console.log(`  ⚠️  Tipo de inconsistência desconhecido: ${issue.type}`);
      }
    } catch (error) {
      console.error(`  ❌ Erro ao corrigir ${issue.type} (${issue.entityPublicId}):`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Resumo: ${fixedCount} correções aplicadas, ${errorCount} erros`);
}

function printReport(issues: InconsistencyReport[]): void {
  if (issues.length === 0) {
    console.log('\n✅ Nenhuma inconsistência encontrada! O sistema está íntegro.\n');
    return;
  }

  console.log(`\n📋 RELATÓRIO DE INCONSISTÊNCIAS (${issues.length} encontradas)\n`);
  console.log('='.repeat(80));

  const groupedByType = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, InconsistencyReport[]>);

  for (const [type, typeIssues] of Object.entries(groupedByType)) {
    console.log(`\n🔸 ${type} (${typeIssues.length})`);
    console.log('-'.repeat(60));
    
    for (const issue of typeIssues) {
      console.log(`  • ${issue.message}`);
      if (issue.fixAction) {
        console.log(`    → Correção: ${issue.fixAction}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  
  const autoFixableCount = issues.filter(i => i.autoFixable).length;
  console.log(`\n📊 Total: ${issues.length} inconsistências | ${autoFixableCount} auto-corrigíveis`);
  console.log('\n💡 Use --fix para aplicar correções automaticamente\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   BidExpert - Diagnóstico de Consistência de Estados           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nModo: ${shouldFix ? '🔧 CORREÇÃO AUTOMÁTICA' : '🔍 APENAS DIAGNÓSTICO (dry-run)'}`);

  try {
    const issues = await findInconsistencies();
    printReport(issues);

    if (shouldFix && issues.length > 0) {
      await applyFixes(issues);
      
      // Re-verificar após correções
      console.log('\n🔄 Verificando novamente após correções...');
      const remainingIssues = await findInconsistencies();
      
      if (remainingIssues.length === 0) {
        console.log('\n✅ Todas as inconsistências foram corrigidas!\n');
      } else {
        console.log(`\n⚠️  ${remainingIssues.length} inconsistências ainda permanecem.\n`);
        printReport(remainingIssues);
      }
    }
  } catch (error) {
    console.error('\n❌ Erro durante execução:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
