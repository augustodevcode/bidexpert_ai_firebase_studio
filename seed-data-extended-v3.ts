/**
 * SEED DATA EXTENDED V3 - COMPLETE VERSION
 * Script para popular banco com dados simulados completos de teste
 * Inclui todos os cenários das implementações atuais
 * 
 * Características:
 * - Múltiplos tenants com configurações diferentes
 * - Usuários com vários roles
 * - Auctions de diferentes tipos
 * - Lotes com múltiplas categorias
 * - Lances e histórico de bidding
 * - Habilitações de usuários
 * - Transações seguras com tratamento de erros
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados estendidos V3...\n');

  try {
    // 1. LIMPAR DADOS EXISTENTES
    console.log('🧹 Limpando dados antigos...');
    try {
      // Limpar tudo em uma transação para evitar conflitos de foreign key
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
      await prisma.user.deleteMany({});
      await prisma.tenant.deleteMany({});
      await prisma.role.deleteMany({});
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
    } catch (cleanupError) {
      console.log('⚠️  Aviso: Erro ao limpar dados, continuando...');
    }
    console.log('✅ Limpeza concluída\n');

    // 2. CRIAR TENANTS
    console.log('📦 Criando tenants...');
    const tenants = await Promise.all([
      prisma.tenant.create({
        data: {
          name: 'Leiloeiro Premium',
          subdomain: 'premium-test',
          domain: 'premium.test.local',
        },
      }),
      prisma.tenant.create({
        data: {
          name: 'Leiloeiro Standard',
          subdomain: 'standard-test',
          domain: 'standard.test.local',
        },
      }),
      prisma.tenant.create({
        data: {
          name: 'Leiloeiro Test',
          subdomain: 'test-test',
          domain: 'test.test.local',
        },
      }),
    ]);
    console.log(`✅ ${tenants.length} tenants criados\n`);

    // 3. CRIAR ROLES SE NÃO EXISTIREM
    console.log('🎯 Configurando roles...');
    const roleNames = ['LEILOEIRO', 'COMPRADOR', 'ADMIN', 'ADVOGADO', 'VENDEDOR', 'AVALIADOR'];
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['manage_all'],
      LEILOEIRO: ['conduct_auctions', 'auctions:manage_assigned', 'lots:manage_assigned'],
      ADVOGADO: ['lawyer_dashboard:view', 'lawyer_cases:view', 'lawyer_documents:manage'],
      COMPRADOR: ['place_bids', 'view_auctions', 'view_lots'],
      VENDEDOR: ['consignor_dashboard:view', 'auctions:manage_own', 'lots:manage_own'],
      AVALIADOR: ['documents:generate_report']
    };
    const roles: any = {};
    
    for (const roleName of roleNames) {
      let role = await prisma.role.findUnique({
        where: { name: roleName },
      });
      
      const permissions = rolePermissions[roleName] || [];
      
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: roleName,
            nameNormalized: roleName.toUpperCase(),
            description: `Role ${roleName}`,
            permissions: permissions,
          },
        });
      } else {
        // Update permissions if role exists
        role = await prisma.role.update({
          where: { id: role.id },
          data: { permissions: permissions },
        });
      }
      roles[roleName] = role;
    }
    console.log(`✅ ${Object.keys(roles).length} roles configurados\n`);

    // 4. CRIAR USUÁRIOS COM MÚLTIPLOS ROLES
    console.log('👥 Criando usuários com múltiplos roles...');
    const senhaHash = await bcrypt.hash('Test@12345', 10);

    // Usuário 1: Leiloeiro (Admin)
    const leiloeiroUser = await prisma.user.create({
      data: {
        email: 'test.leiloeiro@bidexpert.com',
        password: senhaHash,
        fullName: 'Leiloeiro Test Premium',
        cpf: '11122233344',
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });

    await Promise.all([
      prisma.usersOnRoles.create({
        data: {
          userId: leiloeiroUser.id,
          roleId: roles['LEILOEIRO'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.create({
        data: {
          userId: leiloeiroUser.id,
          roleId: roles['COMPRADOR'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.create({
        data: {
          userId: leiloeiroUser.id,
          roleId: roles['ADMIN'].id,
          assignedBy: 'system',
        },
      }),
    ]);

    // Usuário 2: Comprador
    const compradorUser = await prisma.user.create({
      data: {
        email: 'test.comprador@bidexpert.com',
        password: senhaHash,
        fullName: 'Comprador Test',
        cpf: '55566677788',
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });

    await prisma.usersOnRoles.create({
      data: {
        userId: compradorUser.id,
        roleId: roles['COMPRADOR'].id,
        assignedBy: 'system',
      },
    });

    // Usuário 3: Advogado
    const advogadoUser = await prisma.user.create({
      data: {
        email: 'advogado@bidexpert.com.br',
        password: senhaHash,
        fullName: 'Dr. Advogado Test',
        cpf: '99988877766',
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });

    await Promise.all([
      prisma.usersOnRoles.create({
        data: {
          userId: advogadoUser.id,
          roleId: roles['ADVOGADO'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.create({
        data: {
          userId: advogadoUser.id,
          roleId: roles['COMPRADOR'].id,
          assignedBy: 'system',
        },
      }),
    ]);

    // Usuário 4: Vendedor
    const vendedorUser = await prisma.user.create({
      data: {
        email: 'test.vendedor@bidexpert.com',
        password: senhaHash,
        fullName: 'Vendedor Test',
        cpf: '44455566677',
        accountType: 'LEGAL',
        habilitationStatus: 'HABILITADO',
      },
    });

    await Promise.all([
      prisma.usersOnRoles.create({
        data: {
          userId: vendedorUser.id,
          roleId: roles['VENDEDOR'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.create({
        data: {
          userId: vendedorUser.id,
          roleId: roles['COMPRADOR'].id,
          assignedBy: 'system',
        },
      }),
    ]);

    // Usuário 5: Avaliador
    const avaliadorUser = await prisma.user.create({
      data: {
        email: 'test.avaliador@bidexpert.com',
        password: senhaHash,
        fullName: 'Avaliador Test',
        cpf: '77788899900',
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });

    await prisma.usersOnRoles.create({
      data: {
        userId: avaliadorUser.id,
        roleId: roles['AVALIADOR'].id,
        assignedBy: 'system',
      },
    });

    // Associar usuários aos tenants
    await Promise.all([
      prisma.usersOnTenants.create({
        data: {
          userId: leiloeiroUser.id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.usersOnTenants.create({
        data: {
          userId: compradorUser.id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.usersOnTenants.create({
        data: {
          userId: advogadoUser.id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.usersOnTenants.create({
        data: {
          userId: vendedorUser.id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.usersOnTenants.create({
        data: {
          userId: avaliadorUser.id,
          tenantId: tenants[0].id,
        },
      }),
    ]);

    console.log(`✅ 5 usuários criados\n`);

    // 5. CRIAR ESTRUTURA JUDICIAL PARA O PAINEL DO ADVOGADO
    console.log('⚖️  Criando estrutura judicial para advogado...');
    
    const judicialTimestamp = Date.now();
    
    // Criar Court (Tribunal)
    const court = await prisma.court.create({
      data: {
        slug: `tribunal-sp-${judicialTimestamp}`,
        name: 'Tribunal de Justiça de São Paulo',
        stateUf: 'SP',
        website: 'https://www.tjsp.jus.br',
      },
    });

    // Criar JudicialDistrict (Comarca)
    const district = await prisma.judicialDistrict.create({
      data: {
        slug: `comarca-sao-paulo-${judicialTimestamp}`,
        name: `Comarca de São Paulo ${judicialTimestamp}`,
        courtId: court.id,
      },
    });

    // Criar JudicialBranch (Vara)
    const judicialBranch = await prisma.judicialBranch.create({
      data: {
        slug: `vara-civel-01-${judicialTimestamp}`,
        name: `Vara Cível da Capital ${judicialTimestamp}`,
        districtId: district.id,
        contactName: 'Dr. João Silva',
        phone: '(11) 3133-1000',
        email: 'vara.civel@tjsp.jus.br',
      },
    });

    // Criar Seller (Leiloeiro/Vendedor Judicial)
    const seller = await prisma.seller.create({
      data: {
        publicId: `seller-${judicialTimestamp}`,
        slug: `leiloeiro-judicial-sp-${judicialTimestamp}`,
        name: `Leiloeiro Judicial SP ${judicialTimestamp}`,
        description: 'Leiloeiro autorizado pelo Tribunal de Justiça de São Paulo',
        logoUrl: null,
        tenantId: tenants[0].id,
        judicialBranchId: judicialBranch.id,
      },
    });

    console.log('✅ Estrutura judicial criada\n');

    // 5. CRIAR AUCTIONS (LEILÕES)
    console.log('🔨 Criando auctions...');
    const timestamp = Date.now();
    
    const auctions = await Promise.all([
      // Leilão 1: Judicial - Imóveis (com processo judicial)
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-1`,
          slug: `auction-judicial-imovel-${timestamp}-1`,
          title: 'Leilão Judicial - Imóveis Comerciais',
          description: 'Leilão de imóveis comerciais de primeira linha. Leilão de caráter judicial com imóveis de alta qualidade.',
          status: 'ABERTO',
          auctionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          tenantId: tenants[0].id,
          auctionType: 'JUDICIAL',
          auctionMethod: 'STANDARD',
          participation: 'ONLINE',
          sellerId: seller.id,
        },
      }),
      // Leilão 2: Extrajudicial - Veículos
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-2`,
          slug: `auction-extrajudicial-veiculo-${timestamp}-2`,
          title: 'Leilão Extrajudicial - Veículos',
          description: 'Leilão de veículos apreendidos. Veículos de diversos modelos e marcas.',
          status: 'ABERTO',
          auctionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          tenantId: tenants[0].id,
          auctionType: 'EXTRAJUDICIAL',
          auctionMethod: 'STANDARD',
          participation: 'ONLINE',
        },
      }),
      // Leilão 3: Particular - Maquinários
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-3`,
          slug: `auction-particular-maquinario-${timestamp}-3`,
          title: 'Leilão Particular - Maquinários Industriais',
          description: 'Leilão de maquinários e equipamentos industriais. Equipamentos de indústria pesada.',
          status: 'EM_PREPARACAO',
          auctionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          tenantId: tenants[0].id,
          auctionType: 'PARTICULAR',
          auctionMethod: 'STANDARD',
          participation: 'HIBRIDO',
        },
      }),
      // Leilão 4: Tomada de Preços - Mobiliários
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-4`,
          slug: `auction-tomada-preco-mobiliario-${timestamp}-4`,
          title: 'Tomada de Preços - Móveis e Equipamentos',
          description: 'Tomada de preços para diversos móveis e equipamentos de escritório.',
          status: 'ABERTO_PARA_LANCES',
          auctionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          tenantId: tenants[1].id,
          auctionType: 'TOMADA_DE_PRECOS',
          auctionMethod: 'STANDARD',
          participation: 'PRESENCIAL',
        },
      }),
    ]);
    console.log(`✅ ${auctions.length} auctions criados\n`);

    // 6.1 CRIAR PROCESSOS JUDICIAIS PARA O PAINEL DO ADVOGADO
    console.log('⚖️  Criando processos judiciais...');
    
    // Processo Judicial 1 - Para Sala Comercial
    const judicialProcess1 = await prisma.judicialProcess.create({
      data: {
        publicId: `process-${judicialTimestamp}-001`,
        processNumber: `0012345-06.2024.8.26.0100-${judicialTimestamp}`,
        isElectronic: true,
        tenantId: tenants[0].id,
        courtId: court.id,
        districtId: district.id,
        branchId: judicialBranch.id,
        sellerId: seller.id,
        parties: {
          create: [
            {
              name: 'Banco Brasil S.A.',
              documentNumber: '00.000.000/0000-00',
              partyType: 'AUTOR',
            },
            {
              name: 'João da Silva Santos',
              documentNumber: '123.456.789-10',
              partyType: 'REU',
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
            },
          ],
        },
      },
    });

    // Processo Judicial 2 - Para Apartamento
    const judicialProcess2 = await prisma.judicialProcess.create({
      data: {
        publicId: `process-${judicialTimestamp}-002`,
        processNumber: `0054321-12.2024.8.26.0100-${judicialTimestamp}`,
        isElectronic: true,
        tenantId: tenants[0].id,
        courtId: court.id,
        districtId: district.id,
        branchId: judicialBranch.id,
        sellerId: seller.id,
        parties: {
          create: [
            {
              name: 'Caixa Econômica Federal',
              documentNumber: '70.000.000/0000-00',
              partyType: 'AUTOR',
            },
            {
              name: 'Maria Silva Costa',
              documentNumber: '987.654.321-00',
              partyType: 'REU',
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
            },
          ],
        },
      },
    });

    // Processo Judicial 3 - Para Galpão
    const judicialProcess3 = await prisma.judicialProcess.create({
      data: {
        publicId: `process-${judicialTimestamp}-003`,
        processNumber: `0098765-03.2024.8.26.0100-${judicialTimestamp}`,
        isElectronic: true,
        tenantId: tenants[0].id,
        courtId: court.id,
        districtId: district.id,
        branchId: judicialBranch.id,
        sellerId: seller.id,
        parties: {
          create: [
            {
              name: 'Banco do Brasil S.A.',
              documentNumber: '00.000.000/0001-91',
              partyType: 'AUTOR',
            },
            {
              name: 'Empresa XYZ Comércio LTDA',
              documentNumber: '00.000.000/0000-99',
              partyType: 'REU',
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
            },
          ],
        },
      },
    });

    console.log('✅ 3 processos judiciais criados\n');

    // 6. CRIAR LOTS (LOTES)
    console.log('📦 Criando lots...');
    const lots = await Promise.all([
      // Lotes do Leilão 1 (Imóveis)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-1`,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Sala Comercial 100m² - Centro',
          description: 'Sala comercial de 100m² localizada no centro da cidade com infraestrutura completa. Imóvel objeto de execução judicial.',
          type: 'IMOVEL',
          price: new Prisma.Decimal('150000.00'),
          initialPrice: new Prisma.Decimal('120000.00'),
          bidIncrementStep: new Prisma.Decimal('1000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-2`,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
          number: 'L002',
          title: 'Apartamento 2Q - Zona Residencial',
          description: 'Apartamento com 2 quartos, 1 banheiro, cozinha, garagem para 1 veículo. Imóvel sob execução hipotecária.',
          type: 'IMOVEL',
          price: new Prisma.Decimal('250000.00'),
          initialPrice: new Prisma.Decimal('200000.00'),
          bidIncrementStep: new Prisma.Decimal('2000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-3`,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
          number: 'L003',
          title: 'Galpão Industrial 500m² - Zona Industrial',
          description: 'Galpão industrial com 500m², pé direito 6m, porto de carga. Perfeito para indústria. Bem penhorado em processo judicial.',
          type: 'IMOVEL',
          price: new Prisma.Decimal('450000.00'),
          initialPrice: new Prisma.Decimal('380000.00'),
          bidIncrementStep: new Prisma.Decimal('5000.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      }),
      // Lotes do Leilão 2 (Veículos)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-4`,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Honda Civic 2020 Automático',
          description: 'Honda Civic modelo 2020, automático, branco, 45.000 km, em perfeito estado.',
          type: 'VEICULO',
          price: new Prisma.Decimal('75000.00'),
          initialPrice: new Prisma.Decimal('60000.00'),
          bidIncrementStep: new Prisma.Decimal('500.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-5`,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
          number: 'L002',
          title: 'Toyota Corolla 2019 Automático',
          description: 'Toyota Corolla modelo 2019, automático, prata, 52.000 km, revisado.',
          type: 'VEICULO',
          price: new Prisma.Decimal('65000.00'),
          initialPrice: new Prisma.Decimal('52000.00'),
          bidIncrementStep: new Prisma.Decimal('500.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-6`,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
          number: 'L003',
          title: 'Fiat Uno 2018 Hatch',
          description: 'Fiat Uno 2018, hatch, 1.0, vermelho, 35.000 km, impecável.',
          type: 'VEICULO',
          price: new Prisma.Decimal('45000.00'),
          initialPrice: new Prisma.Decimal('38000.00'),
          bidIncrementStep: new Prisma.Decimal('300.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      }),
      // Lotes do Leilão 3 (Maquinários)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-7`,
          auctionId: auctions[2].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Torno Mecânico CNC - Indústria',
          description: 'Torno mecânico CNC profissional, modelo industrial, totalmente funcional.',
          type: 'MAQUINARIO',
          price: new Prisma.Decimal('850000.00'),
          initialPrice: new Prisma.Decimal('700000.00'),
          bidIncrementStep: new Prisma.Decimal('10000.00'),
          status: 'RASCUNHO',
        },
      }),
      // Lotes do Leilão 4 (Mobiliários)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-8`,
          auctionId: auctions[3].id,
          tenantId: tenants[1].id,
          number: 'L001',
          title: 'Lote de 50 Cadeiras Gamer',
          description: 'Lote contendo 50 cadeiras gamer de qualidade premium, novas.',
          type: 'MOBILIARIO',
          price: new Prisma.Decimal('25000.00'),
          initialPrice: new Prisma.Decimal('20000.00'),
          bidIncrementStep: new Prisma.Decimal('500.00'),
          status: 'ABERTO_PARA_LANCES',
        },
      }),
    ]);
    console.log(`✅ ${lots.length} lots criados\n`);

    // 7. CRIAR BIDS (LANCES)
    console.log('💰 Criando bids...');
    const bids = await Promise.all([
      // Bids no Lote 1 (Sala Comercial)
      prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auctions[0].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('125000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auctions[0].id,
          bidderId: advogadoUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('135000.00'),
          bidderDisplay: 'Dr. Advogado Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auctions[0].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('140000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      // Bids no Lote 2 (Apartamento)
      prisma.bid.create({
        data: {
          lotId: lots[1].id,
          auctionId: auctions[0].id,
          bidderId: advogadoUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('210000.00'),
          bidderDisplay: 'Dr. Advogado Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[1].id,
          auctionId: auctions[0].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('220000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      // Bids no Lote 3 (Galpão)
      prisma.bid.create({
        data: {
          lotId: lots[2].id,
          auctionId: auctions[0].id,
          bidderId: vendedorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('400000.00'),
          bidderDisplay: 'Vendedor Test',
        },
      }),
      // Bids nos Veículos
      prisma.bid.create({
        data: {
          lotId: lots[3].id,
          auctionId: auctions[1].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('62000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[3].id,
          auctionId: auctions[1].id,
          bidderId: advogadoUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('68000.00'),
          bidderDisplay: 'Dr. Advogado Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[4].id,
          auctionId: auctions[1].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('55000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[5].id,
          auctionId: auctions[1].id,
          bidderId: vendedorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('40000.00'),
          bidderDisplay: 'Vendedor Test',
        },
      }),
      // Bids no lote de móveis
      prisma.bid.create({
        data: {
          lotId: lots[7].id,
          auctionId: auctions[3].id,
          bidderId: compradorUser.id,
          tenantId: tenants[1].id,
          amount: new Prisma.Decimal('21000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
    ]);
    console.log(`✅ ${bids.length} bids criados\n`);

    // 8. CRIAR HABILITAÇÃO PARA AUCTIONS
    console.log('✅ Habilitando usuários para auctions...');
    const habilitacoes = await Promise.all([
      // Habilitações para Leilão 1
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auctions[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[0].id,
        },
      }),
      // Habilitações para Leilão 2
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[1].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auctions[1].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[1].id,
        },
      }),
      // Habilitações para Leilão 3
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[2].id,
        },
      }),
      // Habilitações para Leilão 4
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[3].id,
        },
      }),
    ]);
    console.log(`✅ ${habilitacoes.length} habilitações criadas\n`);

    console.log('\n✨ SEED CONCLUÍDO COM SUCESSO!\n');
    console.log('📊 RESUMO:');
    console.log(`   • Tenants: ${tenants.length}`);
    console.log(`   • Roles: ${Object.keys(roles).length}`);
    console.log(`   • Usuários: 5`);
    console.log(`   • Auctions: ${auctions.length}`);
    console.log(`   • Lots: ${lots.length}`);
    console.log(`   • Bids: ${bids.length}`);
    console.log(`   • Habilitações: ${habilitacoes.length}`);
    console.log(`   • Tribunais: 1 (Tribunal de Justiça de SP)`);
    console.log(`   • Comarcas: 1 (Comarca de São Paulo)`);
    console.log(`   • Varas Judiciais: 1 (Vara Cível da Capital)`);
    console.log(`   • Vendedores Judiciais: 1`);
    console.log(`   • Processos Judiciais: 3 (com partes e advogados)`);
    
    console.log('\n🔐 CREDENCIAIS DE TESTE:');
    console.log('\n   1️⃣  LEILOEIRO (ADMIN):');
    console.log('   Email: test.leiloeiro@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: LEILOEIRO, COMPRADOR, ADMIN');
    
    console.log('\n   2️⃣  COMPRADOR:');
    console.log('   Email: test.comprador@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: COMPRADOR');
    
    console.log('\n   3️⃣  ADVOGADO (com painel completo):');
    console.log('   Email: advogado@bidexpert.com.br');
    console.log('   Senha: Test@12345');
    console.log('   Roles: ADVOGADO, COMPRADOR');
    console.log('   • 3 Processos Judiciais vinculados');
    console.log('   • Acesso completo ao painel do advogado');
    console.log('   • Visualização de partes e dados processuais');
    
    console.log('\n   4️⃣  VENDEDOR:');
    console.log('   Email: test.vendedor@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: VENDEDOR, COMPRADOR');
    
    console.log('\n   5️⃣  AVALIADOR:');
    console.log('   Email: test.avaliador@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: AVALIADOR');
    
    // 7. CRIAR DADOS ADICIONAIS PARA TENANT 1 - ESTRUTURA EXPANDIDA
    console.log('\n📍 Criando dados expandidos para tenant 1...');

    // Importar services (usando dynamic require para compatibilidade com seed)
    const { JudicialProcessService } = require('@/services/judicial-process.service');

    const judicialProcessService = new JudicialProcessService();

    const tenant1Id = tenants[0].id.toString();

    // 7.1 CRIAR MAIS LEILOEIROS
    console.log('👨‍💼 Criando leiloeiros adicionais...');
    const auctioneerEmails = [
      'leiloeiro.sp.01@bidexpert.com',
      'leiloeiro.rj.01@bidexpert.com',
      'leiloeiro.mg.01@bidexpert.com',
    ];

    const additionalAuctioneers = [];
    for (const email of auctioneerEmails) {
      const senhaHash = await bcrypt.hash('Test@12345', 10);
      const auctioneer = await prisma.user.create({
        data: {
          email,
          password: senhaHash,
          fullName: email.split('@')[0].replace(/\./g, ' ').toUpperCase(),
          cpf: Math.floor(Math.random() * 100000000000).toString().padStart(11, '0'),
          accountType: 'PHYSICAL',
          habilitationStatus: 'HABILITADO',
        },
      });

      await prisma.usersOnRoles.create({
        data: {
          userId: auctioneer.id,
          roleId: roles['LEILOEIRO'].id,
          assignedBy: 'system',
        },
      });

      await prisma.usersOnTenants.create({
        data: {
          userId: auctioneer.id,
          tenantId: tenants[0].id,
        },
      });

      // Criar Auctioneer record com slug único
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const auctioneerRecord = await prisma.auctioneer.create({
        data: {
          publicId: `auctn-${timestamp}-${randomSuffix}`,
          slug: `leiloeiro-${email.split('@')[0].replace(/\./g, '-')}-${randomSuffix}`,
          name: email.split('@')[0].replace(/\./g, ' ').toUpperCase(),
          tenantId: tenants[0].id,
          userId: auctioneer.id,
        },
      });

      additionalAuctioneers.push(auctioneerRecord);
    }
    console.log('✅ 3 leiloeiros adicionais criados\n');

    // 7.2 CRIAR MAIS COMARCAS E VARAS
    console.log('⚖️  Criando estrutura judicial expandida...');
    
    const additionalDistricts = await Promise.all([
      prisma.judicialDistrict.create({
        data: {
          slug: `comarca-rj-${judicialTimestamp}`,
          name: `Comarca do Rio de Janeiro ${judicialTimestamp}`,
          courtId: court.id,
        },
      }),
      prisma.judicialDistrict.create({
        data: {
          slug: `comarca-mg-${judicialTimestamp}`,
          name: `Comarca de Belo Horizonte ${judicialTimestamp}`,
          courtId: court.id,
        },
      }),
    ]);

    const additionalBranches = await Promise.all([
      prisma.judicialBranch.create({
        data: {
          slug: `vara-civel-rj-${judicialTimestamp}`,
          name: `Vara Cível RJ ${judicialTimestamp}`,
          districtId: additionalDistricts[0].id,
          contactName: 'Dra. Maria Silva',
          phone: '(21) 2131-1000',
          email: 'vara.civel.rj@tribunal.rj.jus.br',
        },
      }),
      prisma.judicialBranch.create({
        data: {
          slug: `vara-civel-mg-${judicialTimestamp}`,
          name: `Vara Cível MG ${judicialTimestamp}`,
          districtId: additionalDistricts[1].id,
          contactName: 'Dr. Carlos Costa',
          phone: '(31) 3207-1000',
          email: 'vara.civel.mg@tribunal.mg.jus.br',
        },
      }),
    ]);

    console.log('✅ 2 comarcas e 2 varas adicionais criadas\n');

    // 7.3 CRIAR VENDEDORES JUDICIAIS ADICIONAIS
    console.log('🏛️  Criando vendedores judiciais adicionais...');
    const additionalSellers = await Promise.all([
      prisma.seller.create({
        data: {
          publicId: `seller-rj-${judicialTimestamp}`,
          slug: `leiloeiro-judicial-rj-${judicialTimestamp}`,
          name: `Leiloeiro Judicial RJ ${judicialTimestamp}`,
          description: 'Leiloeiro autorizado pelo Tribunal de Justiça do Rio de Janeiro',
          logoUrl: null,
          tenantId: tenants[0].id,
          judicialBranchId: additionalBranches[0].id,
        },
      }),
      prisma.seller.create({
        data: {
          publicId: `seller-mg-${judicialTimestamp}`,
          slug: `leiloeiro-judicial-mg-${judicialTimestamp}`,
          name: `Leiloeiro Judicial MG ${judicialTimestamp}`,
          description: 'Leiloeiro autorizado pelo Tribunal de Justiça de Minas Gerais',
          logoUrl: null,
          tenantId: tenants[0].id,
          judicialBranchId: additionalBranches[1].id,
        },
      }),
    ]);

    console.log('✅ 2 vendedores judiciais adicionais criados\n');

    // 7.4 CRIAR MAIS AUCTIONS DIRETAMENTE
    console.log('🔨 Criando auctions adicionais...');
    
    const additionalAuctionsData = [
      {
        publicId: `auction-rj-${judicialTimestamp}-1`,
        slug: `auction-judicial-rj-${judicialTimestamp}`,
        title: 'Leilão Judicial - Imóveis RJ',
        description: 'Leilão de imóveis comerciais e residenciais - Rio de Janeiro',
        auctionType: 'JUDICIAL',
        sellerId: additionalSellers[0].id,
        auctioneerId: additionalAuctioneers[0].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
      },
      {
        publicId: `auction-mg-${judicialTimestamp}-1`,
        slug: `auction-judicial-mg-${judicialTimestamp}`,
        title: 'Leilão Judicial - Propriedades MG',
        description: 'Leilão de fazendas e propriedades rurais - Minas Gerais',
        auctionType: 'JUDICIAL',
        sellerId: additionalSellers[1].id,
        auctioneerId: additionalAuctioneers[1].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
      },
      {
        publicId: `auction-sp-equip-${judicialTimestamp}`,
        slug: `auction-equip-${judicialTimestamp}`,
        title: 'Leilão Extrajudicial - Equipamentos SP',
        description: 'Leilão de máquinas e equipamentos industriais',
        auctionType: 'EXTRAJUDICIAL',
        sellerId: seller.id,
        auctioneerId: additionalAuctioneers[2].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
      },
    ];

    const additionalAuctions = await Promise.all(
      additionalAuctionsData.map(data =>
        prisma.auction.create({
          data: {
            ...data,
            tenantId: tenants[0].id,
            auctionMethod: 'STANDARD',
            participation: 'ONLINE',
          },
        })
      )
    );

    console.log(`✅ ${additionalAuctions.length} auctions adicionais criados\n`);

    // 7.5 CRIAR LOTES COM LOCALIZAÇÃO E LOTEAMENTOS
    console.log('📍 Criando lotes com localização expandida...');

    const lotLocations = [
      { city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Centro', address: 'Av. Rio Branco, 1500' },
      { city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Copacabana', address: 'Av. Atlântica, 3000' },
      { city: 'Belo Horizonte', state: 'MG', neighborhood: 'Savassi', address: 'Rua Bahia, 2500' },
    ];

    let lotsCreated = 0;
    for (let i = 0; i < Math.min(additionalAuctions.length, lotLocations.length); i++) {
      const location = lotLocations[i];
      
      // Encontrar ou criar cidade
      let city = await prisma.city.findFirst({
        where: { name: location.city },
      });
      
      if (!city) {
        const state = await prisma.state.findFirst({
          where: { uf: location.state },
        });
        if (state) {
          city = await prisma.city.create({
            data: {
              name: location.city,
              stateId: state.id,
              slug: location.city.toLowerCase().replace(/\s+/g, '-'),
            },
          });
        }
      }

      // Criar lotes para cada auction
      const lotsData = [
        {
          number: `L00${lotsCreated + 1}`,
          title: `Imóvel Comercial - ${location.neighborhood}`,
          description: `Propriedade localizada em ${location.neighborhood}, ${location.address}. Lote de primeira categoria.`,
          type: 'IMOVEL',
          price: new Prisma.Decimal((150000 + Math.random() * 200000).toFixed(2)),
          initialPrice: new Prisma.Decimal((100000 + Math.random() * 150000).toFixed(2)),
          cityId: city?.id,
        },
        {
          number: `L00${lotsCreated + 2}`,
          title: `Apartamento - ${location.neighborhood}`,
          description: `Apartamento com 3 quartos em ${location.neighborhood}. Obra concluída.`,
          type: 'IMOVEL',
          price: new Prisma.Decimal((250000 + Math.random() * 150000).toFixed(2)),
          initialPrice: new Prisma.Decimal((200000 + Math.random() * 100000).toFixed(2)),
          cityId: city?.id,
        },
      ];

      for (const lotData of lotsData) {
        try {
          await prisma.lot.create({
            data: {
              publicId: `lot-${Date.now()}-${Math.random()}`,
              auctionId: additionalAuctions[i].id,
              tenantId: tenants[0].id,
              bidIncrementStep: new Prisma.Decimal('1000'),
              status: 'ABERTO_PARA_LANCES',
              ...lotData,
            },
          });
          lotsCreated++;
        } catch (e) {
          console.log(`⚠️  Erro ao criar lote: ${(e as any).message}`);
        }
      }
    }

    console.log(`✅ ${lotsCreated} lotes com localização criados\n`);

    // 7.6 CRIAR PROCESSOS JUDICIAIS ADICIONAIS
    console.log('⚖️  Criando processos judiciais adicionais...');

    const additionalProcesses = [];
    const branches = [judicialBranch, additionalBranches[0], additionalBranches[1]];
    const sellers_for_process = [seller, additionalSellers[0], additionalSellers[1]];

    for (let i = 0; i < 3; i++) {
      const result = await judicialProcessService.createJudicialProcess(tenant1Id, {
        processNumber: `000${i + 4}567-0${i + 1}.2024.8.26.0100-${judicialTimestamp}`,
        isElectronic: true,
        courtId: court.id.toString(),
        districtId: branches[i].districtId?.toString(),
        branchId: branches[i].id.toString(),
        sellerId: sellers_for_process[i].id.toString(),
        parties: [
          {
            name: i === 0 ? 'Banco Itaú S.A.' : i === 1 ? 'Banco Bradesco S.A.' : 'Banco Santander S.A.',
            documentNumber: i === 0 ? '00.000.000/0000-20' : i === 1 ? '00.000.000/0000-30' : '00.000.000/0000-40',
            partyType: 'AUTOR' as const,
          },
          {
            name: i === 0 ? 'João Silva' : i === 1 ? 'Maria Santos' : 'Carlos Costa',
            documentNumber: i === 0 ? '111.222.333-44' : i === 1 ? '222.333.444-55' : '333.444.555-66',
            partyType: 'REU' as const,
          },
          {
            name: 'Dr. Advogado Test',
            documentNumber: '99988877766',
            partyType: 'ADVOGADO_AUTOR' as const,
          },
        ],
      });

      if (result.success && result.processId) {
        additionalProcesses.push(result.processId);
      }
    }

    console.log(`✅ ${additionalProcesses.length} processos judiciais adicionais criados\n`);

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
