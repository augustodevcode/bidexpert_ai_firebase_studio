/**
 * @fileoverview Testes E2E para validação das regras de consistência de estado
 * entre Leilão (Auction), Lote (Lot) e Ativo (Asset).
 * 
 * Cenários BDD testados:
 * 
 * 1. DADO um Leilão em RASCUNHO com Lotes em RASCUNHO sem Ativos
 *    QUANDO tentar abrir o Leilão
 *    ENTÃO deve falhar com mensagem de erro apropriada
 * 
 * 2. DADO um Leilão com Lotes válidos (com Ativos e dados completos)
 *    QUANDO abrir o Leilão
 *    ENTÃO os Lotes devem ser abertos automaticamente
 * 
 * 3. DADO um Leilão ABERTO
 *    QUANDO encerrar o Leilão
 *    ENTÃO todos os Lotes abertos devem ser encerrados
 * 
 * 4. DADO um Ativo vinculado a um Lote ativo
 *    QUANDO tentar excluir o Ativo
 *    ENTÃO deve falhar com mensagem de erro
 * 
 * 5. DADO um Ativo DISPONIVEL
 *    QUANDO vincular a um Lote
 *    ENTÃO o status deve mudar para LOTEADO automaticamente
 */

import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { AuctionService, AuctionIntegrityValidation } from '@/services/auction.service';
import { LotService, LotIntegrityValidation } from '@/services/lot.service';
import { AssetService } from '@/services/asset.service';

// Tenant de teste
const TEST_TENANT_ID = '1';

// Helpers para criar dados de teste
async function createTestAuction(tenantId: string, options: {
  title?: string;
  status?: string;
} = {}) {
  const auction = await prisma.auction.create({
    data: {
      publicId: `TEST-AUCTION-${Date.now()}`,
      title: options.title || 'Leilão de Teste - Consistência',
      slug: `leilao-teste-${Date.now()}`,
      status: (options.status as any) || 'RASCUNHO',
      auctionDate: new Date(),
      tenantId: BigInt(tenantId),
      auctioneerId: BigInt(1), // Assumindo que existe
      sellerId: BigInt(1), // Assumindo que existe
    }
  });
  return auction;
}

async function createTestLot(auctionId: bigint, tenantId: string, options: {
  title?: string;
  status?: string;
  price?: number;
} = {}) {
  const lot = await prisma.lot.create({
    data: {
      publicId: `TEST-LOT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: options.title || 'Lote de Teste',
      number: Math.floor(Math.random() * 10000),
      status: (options.status as any) || 'RASCUNHO',
      price: options.price || 1000,
      initialPrice: options.price || 1000,
      auctionId,
      tenantId: BigInt(tenantId),
    }
  });
  return lot;
}

async function createTestAsset(tenantId: string, options: {
  title?: string;
  status?: string;
} = {}) {
  const asset = await prisma.asset.create({
    data: {
      publicId: `TEST-ASSET-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: options.title || 'Ativo de Teste',
      status: (options.status as any) || 'DISPONIVEL',
      tenantId: BigInt(tenantId),
    }
  });
  return asset;
}

async function linkAssetToLot(lotId: bigint, assetId: bigint, tenantId: string) {
  await prisma.assetsOnLots.create({
    data: {
      lotId,
      assetId,
      tenantId: BigInt(tenantId),
      assignedBy: 'TEST'
    }
  });
}

// Cleanup helper
async function cleanupTestData(prefix: string) {
  await prisma.assetsOnLots.deleteMany({
    where: {
      OR: [
        { lot: { publicId: { startsWith: prefix } } },
        { asset: { publicId: { startsWith: prefix } } }
      ]
    }
  });
  await prisma.lot.deleteMany({
    where: { publicId: { startsWith: prefix } }
  });
  await prisma.auction.deleteMany({
    where: { publicId: { startsWith: prefix } }
  });
  await prisma.asset.deleteMany({
    where: { publicId: { startsWith: prefix } }
  });
}

test.describe('Consistência de Estado - Auction/Lot/Asset', () => {
  const auctionService = new AuctionService();
  const lotService = new LotService();
  const assetService = new AssetService();

  test.beforeEach(async () => {
    // Limpar dados de teste anteriores
    await cleanupTestData('TEST-');
  });

  test.afterEach(async () => {
    // Limpar dados após cada teste
    await cleanupTestData('TEST-');
  });

  test('Cenário 1: Não deve abrir Leilão com Lotes sem Ativos', async () => {
    // DADO um Leilão em RASCUNHO
    const auction = await createTestAuction(TEST_TENANT_ID, {
      title: 'Leilão Sem Ativos',
      status: 'RASCUNHO'
    });

    // E um Lote sem Ativos vinculados
    await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote Vazio',
      price: 5000
    });

    // QUANDO tentar validar a integridade do Leilão
    const validation = await auctionService.validateAuctionIntegrity(auction.id.toString());

    // ENTÃO deve falhar
    expect(validation.isValid).toBe(false);
    expect(validation.lotsWithIssues.length).toBeGreaterThan(0);
    expect(validation.lotsWithIssues[0].issues).toContain('Não possui Ativos vinculados');
  });

  test('Cenário 2: Deve validar Leilão com Lotes completos', async () => {
    // DADO um Leilão em RASCUNHO
    const auction = await createTestAuction(TEST_TENANT_ID, {
      title: 'Leilão Completo',
      status: 'RASCUNHO'
    });

    // E um Lote com todos os dados preenchidos
    const lot = await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote Completo',
      price: 10000
    });

    // E um Ativo vinculado ao Lote
    const asset = await createTestAsset(TEST_TENANT_ID, {
      title: 'Ativo do Lote',
      status: 'DISPONIVEL'
    });
    await linkAssetToLot(lot.id, asset.id, TEST_TENANT_ID);

    // QUANDO validar a integridade do Leilão
    const validation = await auctionService.validateAuctionIntegrity(auction.id.toString());

    // ENTÃO deve passar (isValid = true)
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  test('Cenário 3: Deve validar integridade do Lote individualmente', async () => {
    // DADO um Leilão
    const auction = await createTestAuction(TEST_TENANT_ID, {
      status: 'ABERTO'
    });

    // E um Lote sem Ativos
    const lotWithoutAssets = await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote Sem Ativos',
      price: 5000
    });

    // QUANDO validar a integridade do Lote
    const validation = await lotService.validateLotIntegrity(lotWithoutAssets.id.toString());

    // ENTÃO deve falhar por falta de Ativos
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Lote deve possuir pelo menos 1 Ativo vinculado para ser aberto');
  });

  test('Cenário 4: Deve impedir exclusão de Ativo vinculado a Lote ativo', async () => {
    // DADO um Leilão ABERTO
    const auction = await createTestAuction(TEST_TENANT_ID, {
      status: 'ABERTO'
    });

    // E um Lote ABERTO_PARA_LANCES
    const lot = await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote Ativo',
      status: 'ABERTO_PARA_LANCES',
      price: 15000
    });

    // E um Ativo vinculado ao Lote
    const asset = await createTestAsset(TEST_TENANT_ID, {
      title: 'Ativo em Leilão',
      status: 'LOTEADO'
    });
    await linkAssetToLot(lot.id, asset.id, TEST_TENANT_ID);

    // QUANDO tentar excluir o Ativo
    const result = await assetService.deleteAsset(asset.id.toString());

    // ENTÃO deve falhar
    expect(result.success).toBe(false);
    expect(result.message).toContain('Não é possível excluir');
    expect(result.message).toContain('Lotes ativos');
  });

  test('Cenário 5: Deve sincronizar status do Ativo ao vincular a Lote', async () => {
    // DADO um Ativo DISPONIVEL
    const asset = await createTestAsset(TEST_TENANT_ID, {
      title: 'Ativo Para Loteamento',
      status: 'DISPONIVEL'
    });

    // E um Leilão com Lote
    const auction = await createTestAuction(TEST_TENANT_ID, {
      status: 'RASCUNHO'
    });
    const lot = await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote para Ativo'
    });

    // QUANDO vincular o Ativo ao Lote usando o serviço
    const linkResult = await lotService.linkAssetsToLot(
      lot.id.toString(), 
      [asset.id.toString()], 
      TEST_TENANT_ID
    );

    // ENTÃO o vínculo deve ser criado
    expect(linkResult.success).toBe(true);

    // E o status do Ativo deve ser LOTEADO
    const updatedAsset = await prisma.asset.findUnique({
      where: { id: asset.id }
    });
    expect(updatedAsset?.status).toBe('LOTEADO');
  });

  test('Cenário 6: Deve reverter status do Ativo ao desvincular de todos os Lotes', async () => {
    // DADO um Ativo LOTEADO vinculado a um Lote
    const asset = await createTestAsset(TEST_TENANT_ID, {
      title: 'Ativo Loteado',
      status: 'LOTEADO'
    });

    const auction = await createTestAuction(TEST_TENANT_ID, {
      status: 'RASCUNHO'
    });
    const lot = await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote com Ativo'
    });
    await linkAssetToLot(lot.id, asset.id, TEST_TENANT_ID);

    // QUANDO desvincular o Ativo do Lote
    const unlinkResult = await lotService.unlinkAssetsFromLot(
      lot.id.toString(), 
      [asset.id.toString()]
    );

    // ENTÃO a operação deve ser bem sucedida
    expect(unlinkResult.success).toBe(true);

    // E o status do Ativo deve voltar para DISPONIVEL
    const updatedAsset = await prisma.asset.findUnique({
      where: { id: asset.id }
    });
    expect(updatedAsset?.status).toBe('DISPONIVEL');
  });

  test('Cenário 7: Não deve abrir Lote se Leilão não está aberto', async () => {
    // DADO um Leilão em RASCUNHO
    const auction = await createTestAuction(TEST_TENANT_ID, {
      status: 'RASCUNHO'
    });

    // E um Lote com dados completos
    const lot = await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote Pronto',
      price: 10000
    });

    const asset = await createTestAsset(TEST_TENANT_ID);
    await linkAssetToLot(lot.id, asset.id, TEST_TENANT_ID);

    // QUANDO tentar validar o Lote para abertura
    const validation = await lotService.validateLotIntegrity(lot.id.toString());

    // ENTÃO deve falhar porque o Leilão não está aberto
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('Leilão'))).toBe(true);
  });

  test('Cenário 8: Deve verificar se Ativo pode ser vinculado a Lote', async () => {
    // DADO um Ativo VENDIDO
    const soldAsset = await createTestAsset(TEST_TENANT_ID, {
      title: 'Ativo Vendido',
      status: 'VENDIDO'
    });

    // QUANDO verificar se pode vincular a um Lote
    const canLink = await assetService.canLinkToLot(soldAsset.id.toString());

    // ENTÃO deve retornar que não é permitido
    expect(canLink.allowed).toBe(false);
    expect(canLink.reason).toContain('vendido');
  });

  test('Cenário 9: Deve impedir modificação de Lote em Leilão fechado', async () => {
    // DADO um Leilão ENCERRADO
    const auction = await createTestAuction(TEST_TENANT_ID, {
      status: 'ENCERRADO'
    });

    // E um Lote nesse Leilão
    const lot = await createTestLot(auction.id, TEST_TENANT_ID, {
      title: 'Lote em Leilão Fechado',
      status: 'ENCERRADO'
    });

    // QUANDO verificar se pode modificar o Lote
    const canModify = await lotService.canModifyLot(lot.id.toString());

    // ENTÃO deve retornar que não é permitido
    expect(canModify.allowed).toBe(false);
    expect(canModify.reason).toContain('não é possível modificar');
  });
});
