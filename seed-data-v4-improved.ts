/**
 * SEED DATA V4 - VERSÃO MELHORADA E SIMPLIFICADA
 * 
 * Características:
 * - Multi-tenant por padrão (1 tenant principal)
 * - Estrutura judicial completa
 * - Processos judiciais com assets
 * - Assets vinculados a lotes
 * - Auctions de diferentes tipos
 * - Usuários com múltiplos roles
 * - Dados realistas e consistentes
 * 
 * Filosofia:
 * - Isolamento por tenant
 * - Processos judiciais → Assets → Lotes
 * - Sistema de roles e permissões
 * - Credenciais claras para teste
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 SEED DATA V4 - VERSÃO MELHORADA\n');
  
  try {
    const timestamp = Date.now();
    const senhaHash = await bcrypt.hash('Test@12345', 10);
    
    // ========================================
    // 1. CRIAR TENANT PRINCIPAL
    // ========================================
    console.log('📦 Criando tenant principal...');
    const tenant = await prisma.tenant.create({
      data: {
        name: 'BidExpert Tenant Principal',
        subdomain: 'principal',
        domain: 'localhost',
      },
    });
    console.log(`✅ Tenant criado: ID ${tenant.id}\n`);

    // ========================================
    // 1.1 CRIAR TENANT SECUNDÁRIO (Para testes de isolamento)
    // ========================================
    console.log('📦 Criando tenant secundário...');
    const tenantB = await prisma.tenant.create({
      data: {
        name: 'BidExpert Tenant Secundário',
        subdomain: 'tenant-b',
        domain: 'tenant-b.localhost',
      },
    });
    console.log(`✅ Tenant Secundário criado: ID ${tenantB.id}\n`);
    
    // ========================================
    // 2. CRIAR ROLES
    // ========================================
    console.log('🎯 Criando roles...');
    const roleData = [
      { name: 'ADMIN', permissions: ['manage_all'] },
      { name: 'LEILOEIRO', permissions: ['conduct_auctions', 'auctions:manage_assigned', 'lots:manage_assigned'] },
      { name: 'ADVOGADO', permissions: ['lawyer_dashboard:view', 'lawyer_cases:view', 'lawyer_documents:manage'] },
      { name: 'COMPRADOR', permissions: ['place_bids', 'view_auctions', 'view_lots'] },
      { name: 'VENDEDOR', permissions: ['consignor_dashboard:view', 'auctions:manage_own', 'lots:manage_own'] },
      { name: 'AVALIADOR', permissions: ['documents:generate_report'] },
    ];
    
    const roles: Record<string, any> = {};
    for (const roleInfo of roleData) {
      const role = await prisma.role.create({
        data: {
          name: roleInfo.name,
          nameNormalized: roleInfo.name.toUpperCase(),
          description: `Role ${roleInfo.name}`,
          permissions: roleInfo.permissions,
        },
      });
      roles[roleInfo.name] = role;
    }
    console.log(`✅ ${Object.keys(roles).length} roles criados\n`);
    
    // ========================================
    // 3. CRIAR USUÁRIOS
    // ========================================
    console.log('👥 Criando usuários...');
    
    // Usuário 1: Admin/Leiloeiro
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@bidexpert.com',
        password: senhaHash,
        fullName: 'Admin BidExpert',
        cpf: `11111111111`,
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });
    
    await Promise.all([
      prisma.usersOnRoles.create({ data: { userId: adminUser.id, roleId: roles.ADMIN.id, assignedBy: 'system' } }),
      prisma.usersOnRoles.create({ data: { userId: adminUser.id, roleId: roles.LEILOEIRO.id, assignedBy: 'system' } }),
      prisma.usersOnRoles.create({ data: { userId: adminUser.id, roleId: roles.COMPRADOR.id, assignedBy: 'system' } }),
      prisma.usersOnTenants.create({ data: { userId: adminUser.id, tenantId: tenant.id } }),
    ]);
    
    // Usuário 2: Comprador
    const compradorUser = await prisma.user.create({
      data: {
        email: 'comprador@bidexpert.com',
        password: senhaHash,
        fullName: 'João Silva Comprador',
        cpf: `22222222222`,
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });
    
    await Promise.all([
      prisma.usersOnRoles.create({ data: { userId: compradorUser.id, roleId: roles.COMPRADOR.id, assignedBy: 'system' } }),
      prisma.usersOnTenants.create({ data: { userId: compradorUser.id, tenantId: tenant.id } }),
    ]);
    
    // Usuário 3: Advogado
    const advogadoUser = await prisma.user.create({
      data: {
        email: 'advogado@bidexpert.com',
        password: senhaHash,
        fullName: 'Dr. Paulo Advogado',
        cpf: `33333333333`,
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });
    
    await Promise.all([
      prisma.usersOnRoles.create({ data: { userId: advogadoUser.id, roleId: roles.ADVOGADO.id, assignedBy: 'system' } }),
      prisma.usersOnRoles.create({ data: { userId: advogadoUser.id, roleId: roles.COMPRADOR.id, assignedBy: 'system' } }),
      prisma.usersOnTenants.create({ data: { userId: advogadoUser.id, tenantId: tenant.id } }),
    ]);
    
    // Usuário 4: Vendedor
    const vendedorUser = await prisma.user.create({
      data: {
        email: 'vendedor@bidexpert.com',
        password: senhaHash,
        fullName: 'Empresa Vendedora LTDA',
        cnpj: '11111111000111',
        accountType: 'LEGAL',
        habilitationStatus: 'HABILITADO',
      },
    });
    
    await Promise.all([
      prisma.usersOnRoles.create({ data: { userId: vendedorUser.id, roleId: roles.VENDEDOR.id, assignedBy: 'system' } }),
      prisma.usersOnRoles.create({ data: { userId: vendedorUser.id, roleId: roles.COMPRADOR.id, assignedBy: 'system' } }),
      prisma.usersOnTenants.create({ data: { userId: vendedorUser.id, tenantId: tenant.id } }),
    ]);
    
    // Usuário 5: Avaliador
    const avaliadorUser = await prisma.user.create({
      data: {
        email: 'avaliador@bidexpert.com',
        password: senhaHash,
        fullName: 'Carlos Avaliador',
        cpf: `55555555555`,
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });
    
    await Promise.all([
      prisma.usersOnRoles.create({ data: { userId: avaliadorUser.id, roleId: roles.AVALIADOR.id, assignedBy: 'system' } }),
      prisma.usersOnTenants.create({ data: { userId: avaliadorUser.id, tenantId: tenant.id } }),
    ]);
    
    console.log('✅ 5 usuários criados\n');

    // Usuário 6: Comprador Tenant B
    const userTenantB = await prisma.user.create({
      data: {
        email: 'user@tenant-b.com',
        password: senhaHash,
        fullName: 'Usuário Tenant B',
        cpf: `66666666666`,
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });
    
    await Promise.all([
      prisma.usersOnRoles.create({ data: { userId: userTenantB.id, roleId: roles.COMPRADOR.id, assignedBy: 'system' } }),
      prisma.usersOnTenants.create({ data: { userId: userTenantB.id, tenantId: tenantB.id } }),
    ]);
    console.log('✅ Usuário Tenant B criado\n');
    
    // ========================================
    // 4. CRIAR ESTRUTURA JUDICIAL
    // ========================================
    console.log('⚖️  Criando estrutura judicial...');
    
    const court = await prisma.court.create({
      data: {
        slug: `tribunal-sp-${timestamp}`,
        name: 'Tribunal de Justiça de São Paulo',
        stateUf: 'SP',
        website: 'https://www.tjsp.jus.br',
      },
    });
    
    const district = await prisma.judicialDistrict.create({
      data: {
        slug: `comarca-sp-capital-${timestamp}`,
        name: `Comarca de São Paulo - Capital`,
        courtId: court.id,
      },
    });
    
    const branch = await prisma.judicialBranch.create({
      data: {
        slug: `vara-civel-sp-${timestamp}`,
        name: `1ª Vara Cível - Capital/SP`,
        districtId: district.id,
        contactName: 'Dr. João da Silva',
        phone: '(11) 3133-1000',
        email: 'vara1civel@tjsp.jus.br',
      },
    });
    
    console.log('✅ Estrutura judicial criada\n');
    
    // ========================================
    // 5. CRIAR SELLER (LEILOEIRO JUDICIAL)
    // ========================================
    console.log('🏛️  Criando seller judicial...');
    
    const seller = await prisma.seller.create({
      data: {
        publicId: `seller-${timestamp}`,
        slug: `leiloeiro-oficial-sp-${timestamp}`,
        name: `Leiloeiro Oficial SP`,
        description: 'Leiloeiro oficial autorizado pelo TJSP',
        tenantId: tenant.id,
        judicialBranchId: branch.id,
        isJudicial: true,
      },
    });
    
    console.log('✅ Seller criado\n');
    
    // ========================================
    // 6. CRIAR AUCTIONEER
    // ========================================
    console.log('👨‍⚖️ Criando auctioneer...');
    
    const auctioneer = await prisma.auctioneer.create({
      data: {
        publicId: `auctnr-${timestamp}`,
        slug: `auctioneer-oficial-${timestamp}`,
        name: 'Leiloeiro Oficial João Silva',
        registrationNumber: 'JUCISPA-12345',
        tenantId: tenant.id,
        userId: adminUser.id,
      },
    });
    
    console.log('✅ Auctioneer criado\n');
    
    // ========================================
    // 7. CRIAR PROCESSOS JUDICIAIS COM PARTES
    // ========================================
    console.log('⚖️  Criando processos judiciais...');
    
    const processes = [];
    
    // Processo 1
    const process1 = await prisma.judicialProcess.create({
      data: {
        publicId: `proc-${timestamp}-001`,
        processNumber: `0012345-67.2024.8.26.0100`,
        isElectronic: true,
        tenantId: tenant.id,
        courtId: court.id,
        districtId: district.id,
        branchId: branch.id,
        sellerId: seller.id,
        parties: {
          create: [
            { name: 'Banco Brasil S.A.', documentNumber: '00000000000191', partyType: 'AUTOR', tenantId: tenant.id },
            { name: 'Maria Silva Santos', documentNumber: '11122233344', partyType: 'REU', tenantId: tenant.id },
            { name: 'Dr. Paulo Advogado', documentNumber: '33333333333', partyType: 'ADVOGADO_AUTOR', tenantId: tenant.id },
          ],
        },
      },
    });
    processes.push(process1);
    
    // Processo 2
    const process2 = await prisma.judicialProcess.create({
      data: {
        publicId: `proc-${timestamp}-002`,
        processNumber: `0098765-43.2024.8.26.0100`,
        isElectronic: true,
        tenantId: tenant.id,
        courtId: court.id,
        districtId: district.id,
        branchId: branch.id,
        sellerId: seller.id,
        parties: {
          create: [
            { name: 'Caixa Econômica Federal', documentNumber: '00360305000104', partyType: 'AUTOR', tenantId: tenant.id },
            { name: 'José Carlos Costa', documentNumber: '55566677788', partyType: 'REU', tenantId: tenant.id },
            { name: 'Dr. Paulo Advogado', documentNumber: '33333333333', partyType: 'ADVOGADO_AUTOR', tenantId: tenant.id },
          ],
        },
      },
    });
    processes.push(process2);
    
    // Processo 3
    const process3 = await prisma.judicialProcess.create({
      data: {
        publicId: `proc-${timestamp}-003`,
        processNumber: `0054321-98.2024.8.26.0100`,
        isElectronic: true,
        tenantId: tenant.id,
        courtId: court.id,
        districtId: district.id,
        branchId: branch.id,
        sellerId: seller.id,
        parties: {
          create: [
            { name: 'Banco Santander S.A.', documentNumber: '90400888000142', partyType: 'AUTOR', tenantId: tenant.id },
            { name: 'Empresa XYZ Ltda', documentNumber: '12345678000190', partyType: 'REU', tenantId: tenant.id },
            { name: 'Dr. Paulo Advogado', documentNumber: '33333333333', partyType: 'ADVOGADO_AUTOR', tenantId: tenant.id },
          ],
        },
      },
    });
    processes.push(process3);
    
    console.log(`✅ ${processes.length} processos judiciais criados\n`);
    
    // ========================================
    // 8. CRIAR ASSETS VINCULADOS AOS PROCESSOS
    // ========================================
    console.log('🏘️  Criando assets...');
    
    const assets = [];
    
    // Assets do Processo 1
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-001`,
          title: 'Sala Comercial 80m² - Centro SP',
          description: 'Sala comercial bem localizada no centro de São Paulo, próximo ao metrô',
          status: 'LOTEADO',
          judicialProcessId: process1.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('180000.00'),
          tenantId: tenant.id,
          dataAiHint: 'IMOVEL',
        },
      })
    );
    
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-002`,
          title: 'Apartamento 2 Dormitórios - Zona Sul',
          description: 'Apartamento de 2 dormitórios, 1 vaga, 60m²',
          status: 'LOTEADO',
          judicialProcessId: process1.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('280000.00'),
          tenantId: tenant.id,
          dataAiHint: 'IMOVEL',
        },
      })
    );
    
    // Assets do Processo 2
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-003`,
          title: 'Casa 3 Dormitórios - Zona Oeste',
          description: 'Casa térrea com 3 dormitórios, quintal e garagem',
          status: 'LOTEADO',
          judicialProcessId: process2.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('450000.00'),
          tenantId: tenant.id,
          dataAiHint: 'IMOVEL',
        },
      })
    );
    
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-004`,
          title: 'Toyota Corolla 2020',
          description: 'Veículo sedan, automático, completo, 45.000 km',
          status: 'DISPONIVEL',
          judicialProcessId: process2.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('75000.00'),
          tenantId: tenant.id,
          dataAiHint: 'VEICULO',
        },
      })
    );
    
    // Assets do Processo 3
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-005`,
          title: 'Galpão Industrial 400m²',
          description: 'Galpão industrial com pé direito alto, ideal para logística',
          status: 'LOTEADO',
          judicialProcessId: process3.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('550000.00'),
          tenantId: tenant.id,
          dataAiHint: 'IMOVEL',
        },
      })
    );
    
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-006`,
          title: 'Equipamentos de Escritório',
          description: 'Lote com mesas, cadeiras, computadores e impressoras',
          status: 'CADASTRO',
          judicialProcessId: process3.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('25000.00'),
          tenantId: tenant.id,
          dataAiHint: 'MOBILIARIO',
        },
      })
    );
    
    // Mais assets variados
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-007`,
          title: 'Honda Civic 2019',
          description: 'Sedan completo, revisado, único dono',
          status: 'DISPONIVEL',
          judicialProcessId: process1.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('68000.00'),
          tenantId: tenant.id,
          dataAiHint: 'VEICULO',
        },
      })
    );
    
    assets.push(
      await prisma.asset.create({
        data: {
          publicId: `asset-${timestamp}-008`,
          title: 'Terreno 300m² - Zona Norte',
          description: 'Terreno plano, escriturado, pronto para construir',
          status: 'CADASTRO',
          judicialProcessId: process2.id,
          sellerId: seller.id,
          evaluationValue: new Prisma.Decimal('150000.00'),
          tenantId: tenant.id,
          dataAiHint: 'IMOVEL',
        },
      })
    );
    
    console.log(`✅ ${assets.length} assets criados\n`);
    
    // ========================================
    // 9. CRIAR AUCTIONS
    // ========================================
    console.log('🔨 Criando auctions...');
    
    const auctions = [];
    
    // Auction 1: Judicial - Imóveis
    const auction1 = await prisma.auction.create({
      data: {
        publicId: `auction-${timestamp}-001`,
        slug: `leilao-judicial-imoveis-sp-${timestamp}`,
        title: 'Leilão Judicial - Imóveis Comerciais e Residenciais',
        description: 'Leilão de imóveis de primeira linha em São Paulo',
        status: 'ABERTO',
        auctionType: 'JUDICIAL',
        auctionMethod: 'STANDARD',
        participation: 'ONLINE',
        auctionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        tenantId: tenant.id,
        sellerId: seller.id,
        auctioneerId: auctioneer.id,
      },
    });
    auctions.push(auction1);
    
    // Auction 2: Extrajudicial - Veículos
    const auction2 = await prisma.auction.create({
      data: {
        publicId: `auction-${timestamp}-002`,
        slug: `leilao-veiculos-${timestamp}`,
        title: 'Leilão Extrajudicial - Veículos',
        description: 'Leilão de veículos diversos em bom estado',
        status: 'ABERTO',
        auctionType: 'EXTRAJUDICIAL',
        auctionMethod: 'STANDARD',
        participation: 'ONLINE',
        auctionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        tenantId: tenant.id,
        sellerId: seller.id,
        auctioneerId: auctioneer.id,
      },
    });
    auctions.push(auction2);
    
    // Auction 3: Particular
    const auction3 = await prisma.auction.create({
      data: {
        publicId: `auction-${timestamp}-003`,
        slug: `leilao-particular-${timestamp}`,
        title: 'Leilão Particular - Diversos',
        description: 'Leilão particular com diversos bens',
        status: 'EM_PREPARACAO',
        auctionType: 'PARTICULAR',
        auctionMethod: 'STANDARD',
        participation: 'HIBRIDO',
        auctionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        tenantId: tenant.id,
        sellerId: seller.id,
        auctioneerId: auctioneer.id,
      },
    });
    auctions.push(auction3);
    
    console.log(`✅ ${auctions.length} auctions criados\n`);
    
    // ========================================
    // 10. CRIAR LOTS
    // ========================================
    console.log('📦 Criando lots...');
    
    const lots = [];
    
    // Lots do Auction 1 (Judicial - Imóveis)
    lots.push(
      await prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-001`,
          auctionId: auction1.id,
          tenantId: tenant.id,
          number: 'L001',
          title: 'Sala Comercial 80m² - Centro SP',
          description: 'Sala comercial bem localizada no centro de São Paulo',
          type: 'IMOVEL',
          price: new Prisma.Decimal('180000.00'),
          initialPrice: new Prisma.Decimal('150000.00'),
          bidIncrementStep: new Prisma.Decimal('2000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      })
    );
    
    lots.push(
      await prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-002`,
          auctionId: auction1.id,
          tenantId: tenant.id,
          number: 'L002',
          title: 'Apartamento 2 Dormitórios - Zona Sul',
          description: 'Apartamento de 2 dormitórios com 1 vaga',
          type: 'IMOVEL',
          price: new Prisma.Decimal('280000.00'),
          initialPrice: new Prisma.Decimal('230000.00'),
          bidIncrementStep: new Prisma.Decimal('3000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      })
    );
    
    lots.push(
      await prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-003`,
          auctionId: auction1.id,
          tenantId: tenant.id,
          number: 'L003',
          title: 'Casa 3 Dormitórios - Zona Oeste',
          description: 'Casa térrea com quintal e garagem',
          type: 'IMOVEL',
          price: new Prisma.Decimal('450000.00'),
          initialPrice: new Prisma.Decimal('400000.00'),
          bidIncrementStep: new Prisma.Decimal('5000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      })
    );
    
    lots.push(
      await prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-004`,
          auctionId: auction1.id,
          tenantId: tenant.id,
          number: 'L004',
          title: 'Galpão Industrial 400m²',
          description: 'Galpão ideal para logística',
          type: 'IMOVEL',
          price: new Prisma.Decimal('550000.00'),
          initialPrice: new Prisma.Decimal('480000.00'),
          bidIncrementStep: new Prisma.Decimal('8000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      })
    );
    
    // Lots do Auction 2 (Veículos)
    lots.push(
      await prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-005`,
          auctionId: auction2.id,
          tenantId: tenant.id,
          number: 'L001',
          title: 'Toyota Corolla 2020',
          description: 'Sedan automático completo',
          type: 'VEICULO',
          price: new Prisma.Decimal('75000.00'),
          initialPrice: new Prisma.Decimal('65000.00'),
          bidIncrementStep: new Prisma.Decimal('1000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      })
    );
    
    lots.push(
      await prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-006`,
          auctionId: auction2.id,
          tenantId: tenant.id,
          number: 'L002',
          title: 'Honda Civic 2019',
          description: 'Sedan revisado, único dono',
          type: 'VEICULO',
          price: new Prisma.Decimal('68000.00'),
          initialPrice: new Prisma.Decimal('58000.00'),
          bidIncrementStep: new Prisma.Decimal('1000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      })
    );
    
    console.log(`✅ ${lots.length} lots criados\n`);
    
    // ========================================
    // 11. VINCULAR ASSETS AOS LOTS (AssetsOnLots)
    // ========================================
    console.log('🔗 Vinculando assets aos lots...');
    
    const assetsOnLots = [];
    
    // Vincular assets LOTEADOS aos seus respectivos lots
    assetsOnLots.push(
      await prisma.assetsOnLots.create({
        data: {
          assetId: assets[0].id, // Sala Comercial
          lotId: lots[0].id,
          tenantId: tenant.id,
          assignedBy: 'system',
        },
      })
    );
    
    assetsOnLots.push(
      await prisma.assetsOnLots.create({
        data: {
          assetId: assets[1].id, // Apartamento
          lotId: lots[1].id,
          tenantId: tenant.id,
          assignedBy: 'system',
        },
      })
    );
    
    assetsOnLots.push(
      await prisma.assetsOnLots.create({
        data: {
          assetId: assets[2].id, // Casa
          lotId: lots[2].id,
          tenantId: tenant.id,
          assignedBy: 'system',
        },
      })
    );
    
    assetsOnLots.push(
      await prisma.assetsOnLots.create({
        data: {
          assetId: assets[4].id, // Galpão
          lotId: lots[3].id,
          tenantId: tenant.id,
          assignedBy: 'system',
        },
      })
    );
    
    console.log(`✅ ${assetsOnLots.length} assets vinculados aos lots\n`);
    
    // ========================================
    // 12. CRIAR BIDS
    // ========================================
    console.log('💰 Criando bids...');
    
    const bids = [];
    
    // Bids no Lot 1
    bids.push(
      await prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auction1.id,
          bidderId: compradorUser.id,
          bidderDisplay: 'João Silva Comprador',
          amount: new Prisma.Decimal('155000.00'),
          tenantId: tenant.id,
        },
      })
    );
    
    bids.push(
      await prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auction1.id,
          bidderId: advogadoUser.id,
          bidderDisplay: 'Dr. Paulo Advogado',
          amount: new Prisma.Decimal('160000.00'),
          tenantId: tenant.id,
        },
      })
    );
    
    // Bids no Lot 2
    bids.push(
      await prisma.bid.create({
        data: {
          lotId: lots[1].id,
          auctionId: auction1.id,
          bidderId: compradorUser.id,
          bidderDisplay: 'João Silva Comprador',
          amount: new Prisma.Decimal('240000.00'),
          tenantId: tenant.id,
        },
      })
    );
    
    // Bids no Lot 5
    bids.push(
      await prisma.bid.create({
        data: {
          lotId: lots[4].id,
          auctionId: auction2.id,
          bidderId: advogadoUser.id,
          bidderDisplay: 'Dr. Paulo Advogado',
          amount: new Prisma.Decimal('67000.00'),
          tenantId: tenant.id,
        },
      })
    );
    
    console.log(`✅ ${bids.length} bids criados\n`);
    
    // ========================================
    // 13. CRIAR HABILITAÇÕES
    // ========================================
    console.log('✅ Criando habilitações...');
    
    const habilitations = [];
    
    habilitations.push(
      await prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auction1.id,
          tenantId: tenant.id,
        },
      })
    );
    
    habilitations.push(
      await prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auction1.id,
          tenantId: tenant.id,
        },
      })
    );
    
    habilitations.push(
      await prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auction2.id,
          tenantId: tenant.id,
        },
      })
    );
    
    habilitations.push(
      await prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auction2.id,
          tenantId: tenant.id,
        },
      })
    );
    
    console.log(`✅ ${habilitations.length} habilitações criadas\n`);

    // ========================================
    // 14. CRIAR TICKETS ITSM
    // ========================================
    console.log('🎫 Criando tickets ITSM...');
    
    // Ticket 1
    await prisma.iTSM_Ticket.create({
        data: {
            publicId: `ticket-${timestamp}-001`,
            userId: adminUser.id,
            title: 'Erro ao acessar relatório',
            description: 'Não consigo visualizar o relatório de vendas mensal.',
            status: 'ABERTO',
            priority: 'ALTA',
            category: 'BUG',
            tenantId: tenant.id,
        }
    });

    // Ticket 2
    await prisma.iTSM_Ticket.create({
        data: {
            publicId: `ticket-${timestamp}-002`,
            userId: compradorUser.id,
            title: 'Dúvida sobre lance',
            description: 'Como funciona o incremento automático?',
            status: 'RESOLVIDO',
            priority: 'BAIXA',
            category: 'DUVIDA',
            tenantId: tenant.id,
        }
    });

    // Ticket 3
    await prisma.iTSM_Ticket.create({
        data: {
            publicId: `ticket-${timestamp}-003`,
            userId: adminUser.id,
            title: 'Solicitação de novo recurso',
            description: 'Gostaria de exportar os dados para Excel.',
            status: 'EM_ANDAMENTO',
            priority: 'MEDIA',
            category: 'SUGESTAO',
            tenantId: tenant.id,
        }
    });
    
    console.log('✅ Tickets criados\n');
    
    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('\n✨ SEED CONCLUÍDO COM SUCESSO!\n');
    console.log('═'.repeat(60));
    console.log('📊 RESUMO DOS DADOS CRIADOS:');
    console.log('═'.repeat(60));
    console.log(`   • Tenants: 1`);
    console.log(`   • Roles: ${Object.keys(roles).length}`);
    console.log(`   • Usuários: 5`);
    console.log(`   • Tribunais: 1`);
    console.log(`   • Comarcas: 1`);
    console.log(`   • Varas: 1`);
    console.log(`   • Sellers: 1`);
    console.log(`   • Auctioneers: 1`);
    console.log(`   • Processos Judiciais: ${processes.length}`);
    console.log(`   • Assets: ${assets.length}`);
    console.log(`   • Auctions: ${auctions.length}`);
    console.log(`   • Lots: ${lots.length}`);
    console.log(`   • Assets→Lots: ${assetsOnLots.length}`);
    console.log(`   • Bids: ${bids.length}`);
    console.log(`   • Habilitações: ${habilitations.length}`);
    console.log('');
    console.log('═'.repeat(60));
    console.log('🔐 CREDENCIAIS DE TESTE:');
    console.log('═'.repeat(60));
    console.log('   Senha padrão: Test@12345\n');
    console.log('   1️⃣  ADMIN/LEILOEIRO:');
    console.log('       Email: admin@bidexpert.com');
    console.log('       Roles: ADMIN, LEILOEIRO, COMPRADOR\n');
    console.log('   2️⃣  COMPRADOR:');
    console.log('       Email: comprador@bidexpert.com');
    console.log('       Roles: COMPRADOR\n');
    console.log('   3️⃣  ADVOGADO:');
    console.log('       Email: advogado@bidexpert.com');
    console.log('       Roles: ADVOGADO, COMPRADOR');
    console.log(`       Processos: ${processes.length}\n`);
    console.log('   4️⃣  VENDEDOR:');
    console.log('       Email: vendedor@bidexpert.com');
    console.log('       Roles: VENDEDOR, COMPRADOR\n');
    console.log('   5️⃣  AVALIADOR:');
    console.log('       Email: avaliador@bidexpert.com');
    console.log('       Roles: AVALIADOR');
    console.log('═'.repeat(60));
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
