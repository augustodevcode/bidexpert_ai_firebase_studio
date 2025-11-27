/**
 * Teste de Validação do Seed V4
 * 
 * Valida que todos os dados do seed V4 foram criados corretamente
 * e que as relações entre entidades estão funcionando.
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Validação do Seed V4', () => {
  
  test('Deve ter 1 tenant principal', async () => {
    const tenants = await prisma.tenant.findMany();
    expect(tenants).toHaveLength(1);
    expect(tenants[0].name).toBe('BidExpert Tenant Principal');
    expect(tenants[0].subdomain).toBe('principal');
  });
  
  test('Deve ter 6 roles criados', async () => {
    const roles = await prisma.role.findMany();
    expect(roles).toHaveLength(6);
    
    const roleNames = roles.map(r => r.name);
    expect(roleNames).toContain('ADMIN');
    expect(roleNames).toContain('LEILOEIRO');
    expect(roleNames).toContain('ADVOGADO');
    expect(roleNames).toContain('COMPRADOR');
    expect(roleNames).toContain('VENDEDOR');
    expect(roleNames).toContain('AVALIADOR');
  });
  
  test('Deve ter 5 usuários criados com credenciais corretas', async () => {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    expect(users).toHaveLength(5);
    
    // Verificar Admin
    const admin = users.find(u => u.email === 'admin@bidexpert.com');
    expect(admin).toBeDefined();
    expect(admin?.fullName).toBe('Admin BidExpert');
    expect(admin?.roles).toHaveLength(3); // ADMIN, LEILOEIRO, COMPRADOR
    
    // Verificar Comprador
    const comprador = users.find(u => u.email === 'comprador@bidexpert.com');
    expect(comprador).toBeDefined();
    expect(comprador?.roles).toHaveLength(1); // COMPRADOR
    
    // Verificar Advogado
    const advogado = users.find(u => u.email === 'advogado@bidexpert.com');
    expect(advogado).toBeDefined();
    expect(advogado?.roles).toHaveLength(2); // ADVOGADO, COMPRADOR
    
    // Verificar Vendedor
    const vendedor = users.find(u => u.email === 'vendedor@bidexpert.com');
    expect(vendedor).toBeDefined();
    expect(vendedor?.accountType).toBe('LEGAL');
    expect(vendedor?.roles).toHaveLength(2); // VENDEDOR, COMPRADOR
    
    // Verificar Avaliador
    const avaliador = users.find(u => u.email === 'avaliador@bidexpert.com');
    expect(avaliador).toBeDefined();
    expect(avaliador?.roles).toHaveLength(1); // AVALIADOR
  });
  
  test('Deve ter estrutura judicial completa', async () => {
    const courts = await prisma.court.findMany();
    expect(courts).toHaveLength(1);
    expect(courts[0].name).toBe('Tribunal de Justiça de São Paulo');
    
    const districts = await prisma.judicialDistrict.findMany();
    expect(districts).toHaveLength(1);
    
    const branches = await prisma.judicialBranch.findMany();
    expect(branches).toHaveLength(1);
  });
  
  test('Deve ter 3 processos judiciais com partes', async () => {
    const processes = await prisma.judicialProcess.findMany({
      include: {
        parties: true,
        assets: true
      }
    });
    
    expect(processes).toHaveLength(3);
    
    // Cada processo deve ter 3 partes
    processes.forEach(process => {
      expect(process.parties).toHaveLength(3);
      expect(process.assets.length).toBeGreaterThan(0);
      
      // Verificar que há autor, réu e advogado
      const partyTypes = process.parties.map(p => p.partyType);
      expect(partyTypes).toContain('AUTOR');
      expect(partyTypes).toContain('REU');
      expect(partyTypes).toContain('ADVOGADO_AUTOR');
    });
  });
  
  test('Deve ter 8 assets com status corretos', async () => {
    const assets = await prisma.asset.findMany({
      include: {
        judicialProcess: true,
        lots: true
      }
    });
    
    expect(assets).toHaveLength(8);
    
    // Contar por status
    const statusCount = {
      LOTEADO: assets.filter(a => a.status === 'LOTEADO').length,
      DISPONIVEL: assets.filter(a => a.status === 'DISPONIVEL').length,
      CADASTRO: assets.filter(a => a.status === 'CADASTRO').length
    };
    
    expect(statusCount.LOTEADO).toBe(4);
    expect(statusCount.DISPONIVEL).toBe(2);
    expect(statusCount.CADASTRO).toBe(2);
    
    // Todos os assets devem estar vinculados a um processo
    assets.forEach(asset => {
      expect(asset.judicialProcessId).not.toBeNull();
      expect(asset.judicialProcess).toBeDefined();
    });
  });
  
  test('Deve ter 3 auctions de tipos diferentes', async () => {
    const auctions = await prisma.auction.findMany({
      include: {
        lots: true,
        bids: true
      }
    });
    
    expect(auctions).toHaveLength(3);
    
    // Verificar tipos
    const types = auctions.map(a => a.auctionType);
    expect(types).toContain('JUDICIAL');
    expect(types).toContain('EXTRAJUDICIAL');
    expect(types).toContain('PARTICULAR');
    
    // Leilão judicial deve ter 4 lotes
    const judicial = auctions.find(a => a.auctionType === 'JUDICIAL');
    expect(judicial?.lots).toHaveLength(4);
    expect(judicial?.bids.length).toBeGreaterThan(0);
    
    // Leilão de veículos deve ter 2 lotes
    const veiculo = auctions.find(a => a.auctionType === 'EXTRAJUDICIAL');
    expect(veiculo?.lots).toHaveLength(2);
  });
  
  test('Deve ter 6 lots criados', async () => {
    const lots = await prisma.lot.findMany({
      include: {
        assets: true,
        bids: true
      }
    });
    
    expect(lots).toHaveLength(6);
    
    // Verificar que alguns lots têm assets vinculados
    const lotsComAssets = lots.filter(l => l.assets.length > 0);
    expect(lotsComAssets.length).toBeGreaterThan(0);
  });
  
  test('Deve ter 4 assets vinculados a lots (AssetsOnLots)', async () => {
    const assetsOnLots = await prisma.assetsOnLots.findMany({
      include: {
        asset: true,
        lot: true
      }
    });
    
    expect(assetsOnLots).toHaveLength(4);
    
    // Todos os vínculos devem ter asset e lot válidos
    assetsOnLots.forEach(link => {
      expect(link.asset).toBeDefined();
      expect(link.lot).toBeDefined();
      expect(link.asset.status).toBe('LOTEADO');
    });
  });
  
  test('Deve ter bids criados', async () => {
    const bids = await prisma.bid.findMany({
      include: {
        lot: true,
        auction: true
      }
    });
    
    expect(bids.length).toBeGreaterThan(0);
    
    // Todos os bids devem estar vinculados a lot e auction
    bids.forEach(bid => {
      expect(bid.lot).toBeDefined();
      expect(bid.auction).toBeDefined();
      expect(bid.amount).toBeDefined();
    });
  });
  
  test('Deve ter habilitações criadas', async () => {
    const habilitations = await prisma.auctionHabilitation.findMany({
      include: {
        user: true,
        auction: true
      }
    });
    
    expect(habilitations.length).toBeGreaterThan(0);
    
    // Verificar que usuários estão habilitados
    habilitations.forEach(hab => {
      expect(hab.user).toBeDefined();
      expect(hab.auction).toBeDefined();
    });
  });
  
  test('Todos os dados devem estar vinculados ao mesmo tenant', async () => {
    const tenant = await prisma.tenant.findFirst();
    expect(tenant).toBeDefined();
    
    const tenantId = tenant!.id;
    
    // Verificar auctions
    const auctions = await prisma.auction.findMany();
    auctions.forEach(a => {
      expect(a.tenantId).toBe(tenantId);
    });
    
    // Verificar lots
    const lots = await prisma.lot.findMany();
    lots.forEach(l => {
      expect(l.tenantId).toBe(tenantId);
    });
    
    // Verificar assets
    const assets = await prisma.asset.findMany();
    assets.forEach(a => {
      expect(a.tenantId).toBe(tenantId);
    });
    
    // Verificar bids
    const bids = await prisma.bid.findMany();
    bids.forEach(b => {
      expect(b.tenantId).toBe(tenantId);
    });
    
    // Verificar processos
    const processes = await prisma.judicialProcess.findMany();
    processes.forEach(p => {
      expect(p.tenantId).toBe(tenantId);
    });
  });
  
  test('Advogado deve ter acesso aos 3 processos', async () => {
    const advogado = await prisma.user.findFirst({
      where: { email: 'advogado@bidexpert.com' }
    });
    
    expect(advogado).toBeDefined();
    
    // Buscar processos onde o advogado é parte
    const processes = await prisma.judicialProcess.findMany({
      include: {
        parties: true
      }
    });
    
    const processosDoAdvogado = processes.filter(p =>
      p.parties.some(party => 
        party.documentNumber === advogado?.cpf && 
        party.partyType === 'ADVOGADO_AUTOR'
      )
    );
    
    expect(processosDoAdvogado).toHaveLength(3);
  });
  
  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
