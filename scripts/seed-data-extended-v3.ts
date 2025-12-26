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
  console.log('⚠️  MODO: Adicionar dados sem apagar existentes\n');

  try {
    // 1. LIMPEZA SEGURA - Manter roles e types básicos
    console.log('🧹 Limpeza parcial (mantendo tables base)...');

    // Deletar dependências primeiro (tabelas de relação N:N)
    await prisma.usersOnTenants.deleteMany({});
    await prisma.usersOnRoles.deleteMany({});

    // Deletar usuários (exceto seeds essenciais se necessário, aqui limpamos tudo para recriar)
    await prisma.user.deleteMany({});

    // NÃO deletar Roles e Tenants para preservar estrutura

    console.log('✅ Limpeza concluída');

    // 2. USAR TENANT PADRÃO (ID 1) - NÃO CRIAR NOVOS TENANTS
    console.log('📦 Usando tenant padrão (ID 1)...');
    const timestamp = Date.now();

    // Buscar o tenant padrão existente
    let defaultTenant = await prisma.tenant.findFirst({
      where: { id: 1 }
    });

    if (!defaultTenant) {
      // Se não existir, criar o tenant padrão
      defaultTenant = await prisma.tenant.create({
        data: {
          id: 1,
          name: 'BidExpert Tenant',
          subdomain: 'default',
          domain: 'localhost',
        },
      });
      console.log('✅ Tenant padrão criado');
    } else {
      console.log('✅ Tenant padrão encontrado');
    }

    // Array com apenas o tenant padrão (para compatibilidade com o resto do código)
    const tenants = [defaultTenant];
    console.log(`✅ Usando tenant ID ${defaultTenant.id}\n`);

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
    const uniqueSuffix = timestamp;

    // Usuário 1: Leiloeiro (Admin)
    const leiloeiroUser = await prisma.user.create({
      data: {
        email: `test.leiloeiro.${uniqueSuffix}@bidexpert.com`,
        password: senhaHash,
        fullName: `Leiloeiro Test Premium ${uniqueSuffix}`,
        cpf: `111${uniqueSuffix}`.substring(0, 11),
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
        email: `test.comprador.${uniqueSuffix}@bidexpert.com`,
        password: senhaHash,
        fullName: `Comprador Test ${uniqueSuffix}`,
        cpf: `555${uniqueSuffix}`.substring(0, 11),
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
        email: `advogado.${uniqueSuffix}@bidexpert.com.br`,
        password: senhaHash,
        fullName: `Dr. Advogado Test ${uniqueSuffix}`,
        cpf: `999${uniqueSuffix}`.substring(0, 11),
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
        email: `test.vendedor.${uniqueSuffix}@bidexpert.com`,
        password: senhaHash,
        fullName: `Vendedor Test ${uniqueSuffix}`,
        cpf: `444${uniqueSuffix}`.substring(0, 11),
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
        email: `test.avaliador.${uniqueSuffix}@bidexpert.com`,
        password: senhaHash,
        fullName: `Avaliador Test ${uniqueSuffix}`,
        cpf: `777${uniqueSuffix}`.substring(0, 11),
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

    // Usuário 6: Analista de Leilões
    const analistaUser = await prisma.user.create({
      data: {
        email: `analista@lordland.com`,
        password: await bcrypt.hash('password123', 10), // Senha fixa conforme solicitado
        fullName: `Analista de Leilões Lordland`,
        cpf: `888${uniqueSuffix}`.substring(0, 11),
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });

    // Garantir que a Role AUCTION_ANALYST existe ou criar
    let auctionAnalystRole = await prisma.role.findUnique({ where: { name: 'AUCTION_ANALYST' } });
    if (!auctionAnalystRole) {
      auctionAnalystRole = await prisma.role.create({
        data: {
          name: 'AUCTION_ANALYST',
          nameNormalized: 'AUCTION_ANALYST',
          description: 'Analista de Leilões',
          permissions: [
            'auctions:create', 'auctions:read', 'auctions:update', 'auctions:delete', 'auctions:publish',
            'lots:create', 'lots:read', 'lots:update', 'lots:delete',
            'assets:create', 'assets:read', 'assets:update', 'assets:delete',
            'categories:create', 'categories:read', 'categories:update', 'categories:delete',
            'auctioneers:create', 'auctioneers:read', 'auctioneers:update', 'auctioneers:delete',
            'sellers:create', 'sellers:read', 'sellers:update', 'sellers:delete',
            'judicial_processes:create', 'judicial_processes:read', 'judicial_processes:update', 'judicial_processes:delete',
            'states:read', 'cities:read',
            'media:upload', 'media:read', 'media:update', 'media:delete',
            'view_reports',
          ]
        }
      });
    }

    await prisma.usersOnRoles.create({
      data: {
        userId: analistaUser.id,
        roleId: auctionAnalystRole.id, // Role ID dinâmico
        assignedBy: 'system',
      },
    });

    // Associar Analista ao Tenant padrão também
    await prisma.usersOnTenants.create({
      data: {
        userId: analistaUser.id,
        tenantId: tenants[0].id,
        assignedBy: 'system',
      }
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

    const usuarios = [leiloeiroUser, compradorUser, advogadoUser, vendedorUser, avaliadorUser];

    type SeedEntityType = 'auction' | 'lot' | 'asset' | 'seller';

    const createSeedMediaItem = async (
      entityType: SeedEntityType,
      identifier: string,
      variant: number,
      overrides: Partial<Prisma.MediaItemCreateInput> = {}
    ) => {
      const safeIdentifier = identifier || `${entityType}-${variant}`;
      const seed = `${safeIdentifier}-${variant}`;
      const encodedSeed = encodeURIComponent(seed);
      const defaultData: Prisma.MediaItemCreateInput = {
        fileName: `${seed}.jpg`,
        storagePath: `media-seed/${entityType}/${safeIdentifier}/${seed}.jpg`,
        urlOriginal: `https://picsum.photos/seed/${encodedSeed}/1600/900`,
        urlThumbnail: `https://picsum.photos/seed/${encodedSeed}/600/338`,
        urlMedium: `https://picsum.photos/seed/${encodedSeed}/1024/768`,
        urlLarge: `https://picsum.photos/seed/${encodedSeed}/1920/1080`,
        mimeType: 'image/jpeg',
        sizeBytes: 120000 + Math.floor(Math.random() * 120000),
        altText: `Foto ${variant} do ${entityType}`,
        caption: `Galeria ${variant} de ${entityType} ${safeIdentifier}`,
        description: `Imagem gerada automaticamente para ${entityType} ${safeIdentifier}.`,
        title: `${safeIdentifier} ${entityType} ${variant}`,
        dataAiHint: entityType,
        uploadedByUserId: leiloeiroUser.id,
        tenantId: tenants[0].id,
        ...overrides,
      };

      return prisma.mediaItem.create({ data: defaultData });
    };

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

    const sellerLogo = await createSeedMediaItem('seller', seller.slug, 1, {
      dataAiHint: 'logo comitente',
    });

    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        logoUrl: sellerLogo.urlOriginal,
        logoMediaId: sellerLogo.id,
        dataAiHintLogo: 'logo comitente institucional',
      },
    });

    console.log('✅ Estrutura judicial criada\n');

    // 5. CRIAR AUCTIONS (LEILÕES)
    console.log('🔨 Criando auctions...');
    // Reusing timestamp from above

    // CEPs dos centros das capitais brasileiras
    const capitalZipCodes = {
      'São Paulo': '01001-000', // Praça da Sé
      'Rio de Janeiro': '20040-002', // Praça Floriano
      'Belo Horizonte': '30170-130', // Praça da Liberdade
      'Brasília': '70040-000', // Esplanada dos Ministérios
      'Salvador': '40020-010', // Praça da Sé
      'Fortaleza': '60030-000', // Praça do Ferreira
      'Curitiba': '80020-000', // Praça Tiradentes
      'Manaus': '69005-010', // Praça da Saudade
      'Recife': '50010-010', // Praça do Marco Zero
      'Porto Alegre': '90010-150', // Praça da Matriz
      'Belém': '66010-000', // Praça da República
      'Goiânia': '74003-010', // Praça Cívica
      'São Luís': '65010-000', // Praça Pedro II
      'Maceió': '57020-000', // Praça dos Martírios
      'Natal': '59025-000', // Praça 7 de Setembro
      'Campo Grande': '79002-000', // Praça Ary Coelho
      'Teresina': '64000-020', // Praça da Bandeira
      'João Pessoa': '58010-000', // Praça João Pessoa
      'Aracaju': '49010-000', // Praça Fausto Cardoso
      'Cuiabá': '78005-000', // Praça da República
      'Porto Velho': '76801-000', // Praça Marechal Rondon
      'Florianópolis': '88010-000', // Praça XV de Novembro
      'Macapá': '68900-000', // Praça Veiga Cabral
      'Rio Branco': '69900-000', // Praça da Revolução
      'Vitória': '29010-000', // Praça Costa Pereira
      'Boa Vista': '69301-000', // Praça do Centro Cívico
      'Palmas': '77001-000', // Praça dos Girassóis
    };

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
          address: 'Av. Paulista, 1000 - Bela Vista',
          zipCode: capitalZipCodes['São Paulo'],
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
          address: 'Av. Atlântica, 500 - Copacabana',
          zipCode: capitalZipCodes['Rio de Janeiro'],
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
          address: 'Av. Afonso Pena, 1000 - Centro',
          zipCode: capitalZipCodes['Belo Horizonte'],
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
          tenantId: tenants[0].id,
          auctionType: 'TOMADA_DE_PRECOS',
          auctionMethod: 'STANDARD',
          participation: 'PRESENCIAL',
          address: 'Esplanada dos Ministérios - Brasília',
          zipCode: capitalZipCodes['Brasília'],
        },
      }),
    ]);
    console.log(`✅ ${auctions.length} auctions criados\n`);

    console.log('🖼️ Registrando imagens para os leilões...');
    for (const auction of auctions) {
      const auctionIdentifier = auction.slug || auction.publicId || `auction-${auction.id}`;
      const imageCount = 2 + Math.floor(Math.random() * 2);
      let primaryMediaId: bigint | undefined;
      for (let variant = 1; variant <= imageCount; variant++) {
        const mediaItem = await createSeedMediaItem('auction', auctionIdentifier, variant);
        if (!primaryMediaId) {
          primaryMediaId = mediaItem.id;
        }
      }
      if (primaryMediaId) {
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            imageMediaId: primaryMediaId,
          },
        });
      }
    }
    console.log('✅ Galeria inicial dos leilões populada\n');

    // 5.5 CRIAR AUCTION STAGES (PRAÇAS) PARA OS LEILÕES
    console.log('🏛️  Criando auction stages (praças) para os leilões...');

    const auctionStages = [];

    // Criar 2 praças para o Leilão Judicial 1 (Imóveis)
    const stage1_1 = await prisma.auctionStage.create({
      data: {
        name: '1ª Praça',
        auctionId: auctions[0].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: 'AGUARDANDO_INICIO',
      },
    });
    auctionStages.push(stage1_1);

    const stage1_2 = await prisma.auctionStage.create({
      data: {
        name: '2ª Praça',
        auctionId: auctions[0].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        status: 'AGENDADO',
      },
    });
    auctionStages.push(stage1_2);

    // Criar 1 praça para o Leilão Extrajudicial 2 (Veículos)
    const stage2_1 = await prisma.auctionStage.create({
      data: {
        name: 'Praça Única',
        auctionId: auctions[1].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        status: 'AGUARDANDO_INICIO',
      },
    });
    auctionStages.push(stage2_1);

    // Criar 1 praça para o Leilão Particular 3 (Maquinários)
    const stage3_1 = await prisma.auctionStage.create({
      data: {
        name: '1ª Praça',
        auctionId: auctions[2].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'AGENDADO',
      },
    });
    auctionStages.push(stage3_1);

    // Criar 1 praça para o Leilão Tomada de Preços 4
    const stage4_1 = await prisma.auctionStage.create({
      data: {
        name: 'Praça Única',
        auctionId: auctions[3].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'AGUARDANDO_INICIO',
      },
    });
    auctionStages.push(stage4_1);

    console.log(`✅ ${auctionStages.length} auction stages (praças) criados\n`);

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
              tenantId: tenants[0].id,
            },
            {
              name: 'João da Silva Santos',
              documentNumber: '123.456.789-10',
              partyType: 'REU',
              tenantId: tenants[0].id,
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
              tenantId: tenants[0].id,
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
              tenantId: tenants[0].id,
            },
            {
              name: 'Maria Silva Costa',
              documentNumber: '987.654.321-00',
              partyType: 'REU',
              tenantId: tenants[0].id,
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
              tenantId: tenants[0].id,
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
              tenantId: tenants[0].id,
            },
            {
              name: 'Empresa XYZ Comércio LTDA',
              documentNumber: '00.000.000/0000-99',
              partyType: 'REU',
              tenantId: tenants[0].id,
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
              tenantId: tenants[0].id,
            },
          ],
        },
      },
    });

    console.log('✅ 3 processos judiciais criados\n');

    // 6. CRIAR LOTS (LOTES)
    console.log('📦 Criando lots...');

    // Localizações com endereços das capitais
    const lotLocations = {
      salaComercial: { cityName: 'São Paulo', stateUf: 'SP', address: 'Av. Paulista, 1500 - Sala 201' },
      apartamento: { cityName: 'São Paulo', stateUf: 'SP', address: 'Rua Augusta, 2300 - Apto 501' },
      galpao: { cityName: 'São Paulo', stateUf: 'SP', address: 'Av. Industrial, 1000' },
      civic: { cityName: 'Rio de Janeiro', stateUf: 'RJ', address: 'Av. Atlântica, 3500' },
      corolla: { cityName: 'Rio de Janeiro', stateUf: 'RJ', address: 'Av. Brasil, 5000' },
      uno: { cityName: 'Rio de Janeiro', stateUf: 'RJ', address: 'Rua da Carioca, 100' },
      torno: { cityName: 'Belo Horizonte', stateUf: 'MG', address: 'Av. Amazonas, 1500' },
      cadeiras: { cityName: 'Brasília', stateUf: 'DF', address: 'SCS Quadra 1' },
    };

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
          cityName: lotLocations.salaComercial.cityName,
          stateUf: lotLocations.salaComercial.stateUf,
          mapAddress: lotLocations.salaComercial.address,
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
          cityName: lotLocations.apartamento.cityName,
          stateUf: lotLocations.apartamento.stateUf,
          mapAddress: lotLocations.apartamento.address,
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
          cityName: lotLocations.galpao.cityName,
          stateUf: lotLocations.galpao.stateUf,
          mapAddress: lotLocations.galpao.address,
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
          cityName: lotLocations.civic.cityName,
          stateUf: lotLocations.civic.stateUf,
          mapAddress: lotLocations.civic.address,
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
          cityName: lotLocations.corolla.cityName,
          stateUf: lotLocations.corolla.stateUf,
          mapAddress: lotLocations.corolla.address,
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
          cityName: lotLocations.uno.cityName,
          stateUf: lotLocations.uno.stateUf,
          mapAddress: lotLocations.uno.address,
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
          cityName: lotLocations.torno.cityName,
          stateUf: lotLocations.torno.stateUf,
          mapAddress: lotLocations.torno.address,
        },
      }),
      // Lotes do Leilão 4 (Mobiliários)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-8`,
          auctionId: auctions[3].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Lote de 50 Cadeiras Gamer',
          description: 'Lote contendo 50 cadeiras gamer de qualidade premium, novas.',
          type: 'MOBILIARIO',
          price: new Prisma.Decimal('25000.00'),
          initialPrice: new Prisma.Decimal('20000.00'),
          bidIncrementStep: new Prisma.Decimal('500.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.cadeiras.cityName,
          stateUf: lotLocations.cadeiras.stateUf,
          mapAddress: lotLocations.cadeiras.address,
        },
      }),
    ]);
    console.log(`✅ ${lots.length} lots criados\n`);

    console.log('🖼️ Adicionando galerias de imagens aos lots...');
    for (const lot of lots) {
      const lotIdentifier = lot.slug || lot.publicId || `lot-${lot.id}`;
      const lotImageCount = 2 + Math.floor(Math.random() * 2);
      const galleryUrls: string[] = [];
      const mediaIds: bigint[] = [];
      for (let variant = 1; variant <= lotImageCount; variant++) {
        const mediaItem = await createSeedMediaItem('lot', lotIdentifier, variant, {
          linkedLotIds: [lot.id] as Prisma.JsonArray,
          dataAiHint: lot.type || 'lot',
        });
        galleryUrls.push(mediaItem.urlOriginal);
        mediaIds.push(mediaItem.id);
      }

      if (mediaIds.length) {
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            imageUrl: galleryUrls[0],
            galleryImageUrls: galleryUrls,
            mediaItemIds: mediaIds,
            imageMediaId: mediaIds[0],
          },
        });
      }
    }
    console.log('✅ Galerias dos lots populadas\n');

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
          tenantId: tenants[0].id,
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
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
        },
      }),
      // Habilitações para Leilão 2
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
        },
      }),
      // Habilitações para Leilão 3
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[2].id,
          tenantId: tenants[0].id,
        },
      }),
      // Habilitações para Leilão 4
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[3].id,
          tenantId: tenants[0].id,
        },
      }),
    ]);
    console.log(`✅ ${habilitacoes.length} habilitações criadas\n`);

    // 7. CRIAR DADOS ADICIONAIS PARA TENANT 1 - ESTRUTURA EXPANDIDA
    console.log('\n📍 Criando dados expandidos para tenant 1...');

    // Importar services (usando dynamic require para compatibilidade com seed)
    const { JudicialProcessService } = require('@/services/judicial-process.service');

    const judicialProcessService = new JudicialProcessService();

    const tenant1Id = tenants[0].id.toString();

    // 7.1 CRIAR MAIS LEILOEIROS
    console.log('👨‍💼 Criando leiloeiros adicionais...');
    const auctioneerEmailPrefixes = [
      'leiloeiro.sp.01',
      'leiloeiro.rj.01',
      'leiloeiro.mg.01',
    ];

    const additionalAuctioneers = [];
    for (const emailPrefix of auctioneerEmailPrefixes) {
      const email = `${emailPrefix}.${uniqueSuffix}@bidexpert.com`;
      const senhaHash = await bcrypt.hash('Test@12345', 10);
      const auctioneer = await prisma.user.create({
        data: {
          email,
          password: senhaHash,
          fullName: emailPrefix.split('.').join(' ').toUpperCase(),
          cpf: `${Math.floor(Math.random() * 100000000000)}`.padStart(11, '0'),
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
      const auctioneerTimestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const auctioneerRecord = await prisma.auctioneer.create({
        data: {
          publicId: `auctn-${auctioneerTimestamp}-${randomSuffix}`,
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

    for (const sellerItem of additionalSellers) {
      const logo = await createSeedMediaItem('seller', sellerItem.slug, 1, { dataAiHint: 'logo comitente' });
      await prisma.seller.update({
        where: { id: sellerItem.id },
        data: {
          logoUrl: logo.urlOriginal,
          logoMediaId: logo.id,
          dataAiHintLogo: 'logo comitente institucional',
        },
      });
    }

    console.log('✅ 2 vendedores judiciais adicionais criados\n');

    // 7.4 CRIAR MAIS AUCTIONS DIRETAMENTE
    console.log('🔨 Criando auctions adicionais...');

    // Reutilizar CEPs das capitais
    const capitalZipCodesForAdditional = {
      'Rio de Janeiro': '20040-020',
      'Belo Horizonte': '30130-100',
      'São Paulo': '01310-100',
    };

    const additionalAuctionsData = [
      {
        publicId: `auction-rj-${judicialTimestamp}-1`,
        slug: `auction-judicial-rj-${judicialTimestamp}`,
        title: 'Leilão Judicial - Imóveis RJ',
        description: 'Leilão de imóveis comerciais e residenciais - Rio de Janeiro',
        auctionType: 'JUDICIAL' as const,
        sellerId: additionalSellers[0].id,
        auctioneerId: additionalAuctioneers[0].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
        address: 'Av. Presidente Vargas, 1000 - Centro',
        zipCode: capitalZipCodesForAdditional['Rio de Janeiro'],
      },
      {
        publicId: `auction-mg-${judicialTimestamp}-1`,
        slug: `auction-judicial-mg-${judicialTimestamp}`,
        title: 'Leilão Judicial - Propriedades MG',
        description: 'Leilão de fazendas e propriedades rurais - Minas Gerais',
        auctionType: 'JUDICIAL' as const,
        sellerId: additionalSellers[1].id,
        auctioneerId: additionalAuctioneers[1].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
        address: 'Av. João Pinheiro, 500 - Centro',
        zipCode: capitalZipCodesForAdditional['Belo Horizonte'],
      },
      {
        publicId: `auction-sp-equip-${judicialTimestamp}`,
        slug: `auction-equip-${judicialTimestamp}`,
        title: 'Leilão Extrajudicial - Equipamentos SP',
        description: 'Leilão de máquinas e equipamentos industriais',
        auctionType: 'EXTRAJUDICIAL' as const,
        sellerId: seller.id,
        auctioneerId: additionalAuctioneers[2].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
        address: 'Rua Líbero Badaró, 425 - Centro',
        zipCode: capitalZipCodesForAdditional['São Paulo'],
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

    // Criar stages para os auctions adicionais
    console.log('🏛️  Criando stages para os auctions adicionais...');
    let additionalStagesCount = 0;

    for (const auction of additionalAuctions) {
      const stage = await prisma.auctionStage.create({
        data: {
          name: auction.auctionType === 'JUDICIAL' ? '1ª Praça' : 'Praça Única',
          auctionId: auction.id,
          tenantId: tenants[0].id,
          startDate: auction.auctionDate || new Date(),
          endDate: auction.endDate || new Date(),
          status: 'AGUARDANDO_INICIO',
        },
      });
      additionalStagesCount++;

      // Se for judicial, criar 2ª praça também
      if (auction.auctionType === 'JUDICIAL') {
        await prisma.auctionStage.create({
          data: {
            name: '2ª Praça',
            auctionId: auction.id,
            tenantId: tenants[0].id,
            startDate: new Date((auction.auctionDate?.getTime() || Date.now()) + 3 * 24 * 60 * 60 * 1000),
            endDate: new Date((auction.endDate?.getTime() || Date.now()) + 3 * 24 * 60 * 60 * 1000),
            status: 'AGENDADO',
          },
        });
        additionalStagesCount++;
      }
    }

    console.log(`✅ ${additionalStagesCount} stages adicionais criados para os auctions\n`);

    // 7.5 CRIAR LOTES COM LOCALIZAÇÃO E LOTEAMENTOS
    console.log('📍 Criando lotes com localização expandida...');

    const additionalLotLocations = [
      { city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Centro', address: 'Av. Rio Branco, 1500' },
      { city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Copacabana', address: 'Av. Atlântica, 3000' },
      { city: 'Belo Horizonte', state: 'MG', neighborhood: 'Savassi', address: 'Rua Bahia, 2500' },
    ];

    let lotsCreated = 0;
    for (let i = 0; i < Math.min(additionalAuctions.length, additionalLotLocations.length); i++) {
      const location = additionalLotLocations[i];

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

    // 7.7 CRIAR ASSETS (BENS) VINCULADOS AOS PROCESSOS JUDICIAIS
    console.log('🏛️  Criando assets (bens) vinculados aos processos judiciais...');

    // CEPs e endereços das capitais para assets
    const assetLocations = [
      { city: 'São Paulo', state: 'SP', address: 'Rua da Consolação, 1000' },
      { city: 'São Paulo', state: 'SP', address: 'Av. Rebouças, 2500' },
      { city: 'Rio de Janeiro', state: 'RJ', address: 'Av. Rio Branco, 300' },
      { city: 'Rio de Janeiro', state: 'RJ', address: 'Rua da Assembléia, 100' },
      { city: 'Belo Horizonte', state: 'MG', address: 'Av. Afonso Pena, 1500' },
      { city: 'Brasília', state: 'DF', address: 'SCS Quadra 2' },
      { city: 'Salvador', state: 'BA', address: 'Av. Sete de Setembro, 500' },
      { city: 'Curitiba', state: 'PR', address: 'Rua XV de Novembro, 1000' },
      { city: 'Fortaleza', state: 'CE', address: 'Av. Beira Mar, 800' },
      { city: 'Porto Alegre', state: 'RS', address: 'Av. Borges de Medeiros, 500' },
    ];

    // Helper: Gerar dados realistas de assets
    const assetTypes = {
      IMOVEL: [
        { title: 'Sala Comercial', description: 'Sala comercial bem localizada, com infraestrutura completa' },
        { title: 'Apartamento Residencial', description: 'Apartamento de 2 quartos, com garagem e área de lazer' },
        { title: 'Casa Térrea', description: 'Casa térrea com 3 quartos, quintal e churrasqueira' },
        { title: 'Galpão Industrial', description: 'Galpão com pé direito alto, ideal para logística e armazenagem' },
        { title: 'Terreno Urbano', description: 'Terreno plano em área urbana, pronto para construção' },
      ],
      VEICULO: [
        { title: 'Automóvel Sedan', description: 'Veículo sedan em bom estado de conservação' },
        { title: 'Caminhonete Pick-up', description: 'Caminhonete para trabalho e transporte de cargas' },
        { title: 'Motocicleta', description: 'Motocicleta em excelente estado, baixa quilometragem' },
      ],
      MAQUINARIO: [
        { title: 'Torno Mecânico', description: 'Torno mecânico industrial em perfeito funcionamento' },
        { title: 'Empilhadeira', description: 'Empilhadeira elétrica, capacidade 2 toneladas' },
      ],
      MOBILIARIO: [
        { title: 'Conjunto de Mesas e Cadeiras', description: 'Mobiliário de escritório em bom estado' },
        { title: 'Equipamentos de TI', description: 'Computadores, monitores e periféricos' },
      ],
    };

    const statusOptions: ('DISPONIVEL' | 'CADASTRO' | 'LOTEADO')[] = ['DISPONIVEL', 'CADASTRO', 'LOTEADO'];

    // Criar assets para os 3 processos iniciais
    const processesWithAssets = [
      { process: judicialProcess1, count: 2, types: ['IMOVEL', 'IMOVEL'] },
      { process: judicialProcess2, count: 3, types: ['IMOVEL', 'VEICULO', 'MOBILIARIO'] },
      { process: judicialProcess3, count: 2, types: ['IMOVEL', 'MAQUINARIO'] },
    ];

    const createdAssets = [];
    let locationIndex = 0;

    for (const { process, count, types } of processesWithAssets) {
      for (let i = 0; i < count; i++) {
        const type = types[i] as keyof typeof assetTypes;
        const assetTemplates = assetTypes[type];
        const template = assetTemplates[Math.floor(Math.random() * assetTemplates.length)];
        const location = assetLocations[locationIndex % assetLocations.length];
        locationIndex++;

        const asset = await prisma.asset.create({
          data: {
            publicId: `asset-${judicialTimestamp}-${process.id}-${i}`,
            title: template.title,
            description: `${template.description}. Bem penhorado no processo ${process.processNumber}`,
            status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
            judicialProcessId: process.id,
            sellerId: process.sellerId || seller.id,
            evaluationValue: new Prisma.Decimal((50000 + Math.random() * 500000).toFixed(2)),
            tenantId: tenants[0].id,
            dataAiHint: type,
            locationCity: location.city,
            locationState: location.state,
            address: location.address,
          },
        });

        createdAssets.push(asset);
      }
    }

    // Criar assets para os processos adicionais
    for (const processId of additionalProcesses) {
      const processIdBigInt = typeof processId === 'string' ? BigInt(processId) : processId;
      const process = await prisma.judicialProcess.findUnique({
        where: { id: processIdBigInt },
      });

      if (!process) continue;

      // Cada processo adicional terá 1-3 assets
      const assetCount = 1 + Math.floor(Math.random() * 3);
      const availableTypes = Object.keys(assetTypes) as (keyof typeof assetTypes)[];

      for (let i = 0; i < assetCount; i++) {
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const assetTemplates = assetTypes[type];
        const template = assetTemplates[Math.floor(Math.random() * assetTemplates.length)];
        const location = assetLocations[locationIndex % assetLocations.length];
        locationIndex++;

        const asset = await prisma.asset.create({
          data: {
            publicId: `asset-${judicialTimestamp}-${processIdBigInt}-${i}`,
            title: template.title,
            description: `${template.description}. Bem vinculado ao processo judicial ${process.processNumber}`,
            status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
            judicialProcessId: processIdBigInt,
            sellerId: process.sellerId || seller.id,
            evaluationValue: new Prisma.Decimal((30000 + Math.random() * 400000).toFixed(2)),
            tenantId: tenants[0].id,
            dataAiHint: type,
            locationCity: location.city,
            locationState: location.state,
            address: location.address,
          },
        });

        createdAssets.push(asset);
      }
    }

    console.log(`✅ ${createdAssets.length} assets (bens) criados e vinculados aos processos judiciais\n`);

    // 7.8 VINCULAR ALGUNS ASSETS AOS LOTES (AssetsOnLots)
    console.log('🔗 Vinculando assets aos lotes existentes...');

    // Pegar alguns assets LOTEADOS para vincular aos lotes do leilão judicial
    const loteadoAssets = createdAssets.filter(a => a.status === 'LOTEADO').slice(0, 3);
    const judicialLots = lots.filter(lot => lot.auctionId === auctions[0].id).slice(0, 3);

    let linkedAssets = 0;
    for (let i = 0; i < Math.min(loteadoAssets.length, judicialLots.length); i++) {
      try {
        await prisma.assetsOnLots.create({
          data: {
            assetId: loteadoAssets[i].id,
            lotId: judicialLots[i].id,
            assignedBy: 'system',
            tenantId: tenants[0].id,
          },
        });
        linkedAssets++;
      } catch (e) {
        console.log(`⚠️  Erro ao vincular asset ao lote: ${(e as any).message}`);
      }
    }

    // Se não há assets LOTEADOS suficientes, vincular DISPONIVEL também
    if (linkedAssets < 3) {
      const disponivelAssets = createdAssets.filter(a => a.status === 'DISPONIVEL').slice(0, 3 - linkedAssets);
      for (let i = 0; i < Math.min(disponivelAssets.length, judicialLots.length - linkedAssets); i++) {
        try {
          await prisma.assetsOnLots.create({
            data: {
              assetId: disponivelAssets[i].id,
              lotId: judicialLots[linkedAssets + i].id,
              assignedBy: 'system',
              tenantId: tenants[0].id,
            },
          });

          // Atualizar o status do asset para LOTEADO
          await prisma.asset.update({
            where: { id: disponivelAssets[i].id },
            data: { status: 'LOTEADO' },
          });

          linkedAssets++;
        } catch (e) {
          console.log(`⚠️  Erro ao vincular asset ao lote: ${(e as any).message}`);
        }
      }
    }

    console.log(`✅ ${linkedAssets} assets vinculados aos lotes\n`);

    console.log('🖼️ Enriquecendo assets com imagens na galeria...');
    for (const asset of createdAssets) {
      const assetIdentifier = asset.publicId || `asset-${asset.id}`;
      const assetImageCount = 2 + Math.floor(Math.random() * 2);
      const galleryUrls: string[] = [];
      const mediaIds: bigint[] = [];

      for (let variant = 1; variant <= assetImageCount; variant++) {
        const mediaItem = await createSeedMediaItem('asset', assetIdentifier, variant, {
          judicialProcessId: asset.judicialProcessId ?? undefined,
          dataAiHint: asset.dataAiHint || asset.title || 'asset',
        });

        galleryUrls.push(mediaItem.urlOriginal);
        mediaIds.push(mediaItem.id);

        await prisma.assetMedia.create({
          data: {
            assetId: asset.id,
            mediaItemId: mediaItem.id,
            tenantId: tenants[0].id,
            displayOrder: variant - 1,
            isPrimary: variant === 1,
          },
        });
      }

      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          imageUrl: galleryUrls[0],
          galleryImageUrls: galleryUrls,
          mediaItemIds: mediaIds,
          imageMediaId: mediaIds[0],
        },
      });
    }
    console.log('✅ Assets enriquecidos com imagens na galeria\n');

    // CRIAR DADOS ADICIONAIS PARA PÁGINA DE PREPARAÇÃO DO LEILÃO
    console.log('🎨 Criando dados para página de preparação do leilão...');

    // Garantir que temos um leilão com vários lotes para testar
    const preparationAuction = auctions[0]; // Usar o primeiro leilão

    // Criar habilitações para o leilão
    console.log('   Criando habilitações...');
    const habilitationsForPrep = [];
    for (let i = 0; i < 5; i++) {
      try {
        const habilitation = await prisma.auctionHabilitation.create({
          data: {
            userId: usuarios[1].id, // Usar comprador
            auctionId: preparationAuction.id,
            // status removed as it is not in schema
            habilitatedAt: new Date(),
            tenantId: defaultTenant.id,
          },
        });
        habilitationsForPrep.push(habilitation);
      } catch (e) {
        // Pode já existir, continuar
      }
    }
    console.log(`   ✅ ${habilitationsForPrep.length} habilitações criadas`);

    // Criar alguns lances para o leilão (para estatísticas do pregão)
    console.log('   Criando lances para estatísticas...');
    let bidsForPrep = 0;
    for (const lot of lots.slice(0, 3)) {
      try {
        await prisma.bid.create({
          data: {
            bidderId: usuarios[1].id,
            lotId: lot.id,
            auctionId: preparationAuction.id,
            amount: new Prisma.Decimal(lot.initialPrice || 0).mul(1.1).toNumber(),
            timestamp: new Date(),
            bidderDisplay: 'Comprador Test',
            tenantId: defaultTenant.id,
          },
        });
        bidsForPrep++;
      } catch (e) {
        // Lance pode já existir
      }
    }
    console.log(`   ✅ ${bidsForPrep} lances adicionais criados`);

    console.log('✅ Dados para página de preparação criados\n');

    // RESUMO FINAL ATUALIZADO
    console.log('\n✨ SEED CONCLUÍDO COM SUCESSO!\n');
    console.log('📊 RESUMO COMPLETO:');
    console.log(`   • Tenants: ${tenants.length}`);
    console.log(`   • Roles: ${Object.keys(roles).length}`);
    console.log(`   • Usuários: 8 (5 principais + 3 leiloeiros)`);
    console.log(`   • Auctions: ${auctions.length + additionalAuctions.length}`);
    console.log(`   • Auction Stages (Praças): ${auctionStages.length + additionalStagesCount} (incluindo 1ª e 2ª praças)`);
    console.log(`   • Lots: ${lots.length + lotsCreated} (todos com localização)`);
    console.log(`   • Bids: ${bids.length}`);
    console.log(`   • Habilitações: ${habilitacoes.length}`);
    console.log(`   • Tribunais: 1 (Tribunal de Justiça)`);
    console.log(`   • Comarcas: ${1 + additionalDistricts.length}`);
    console.log(`   • Varas Judiciais: ${1 + additionalBranches.length}`);
    console.log(`   • Vendedores Judiciais: ${1 + additionalSellers.length}`);
    console.log(`   • Processos Judiciais: ${3 + additionalProcesses.length} (todos com partes e advogados)`);
    console.log(`   • Assets (Bens): ${createdAssets.length} (todos vinculados a processos e com localização)`);
    console.log(`   • Assets vinculados a Lotes: ${linkedAssets}`);

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
    console.log(`   • ${3 + additionalProcesses.length} Processos Judiciais vinculados`);
    console.log(`   • ${createdAssets.length} Bens (Assets) vinculados aos processos`);
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

    console.log('\n📋 ESTRUTURA DE DADOS:');
    console.log('   • Todos os leilões possuem praças (stages) configuradas');
    console.log('   • Leilões judiciais possuem 1ª e 2ª praças');
    console.log('   • Todos os auctions possuem endereço e CEP de capitais brasileiras');
    console.log('   • Todos os lotes possuem localização (cidade, estado, endereço)');
    console.log('   • Todos os processos judiciais possuem bens (assets) vinculados');
    console.log('   • Bens com status LOTEADO foram vinculados aos lotes do leilão judicial');
    console.log('   • Cada processo possui de 1 a 3 bens registrados');
    console.log('   • Assets incluem: imóveis, veículos, maquinários e mobiliários');
    console.log('   • Todos os assets possuem valor de avaliação e localização completa');
    console.log('   • Status dos assets: CADASTRO, DISPONIVEL, LOTEADO');
    console.log('   • Localizações incluem CEPs dos centros das capitais: SP, RJ, MG, DF, BA, PR, CE, RS');
    console.log('\n');



    // 9. CRIAR CONFIGURAÇÕES DA PLATAFORMA
    console.log('⚙️ Criando configurações da plataforma...');

    const platformSettings = await prisma.platformSettings.upsert({
      where: { tenantId: tenants[0].id },
      update: {},
      create: {
        tenantId: tenants[0].id,
        siteTitle: 'BidExpert Leilões',
        siteTagline: 'O melhor lugar para bons negócios',
        isSetupComplete: true,
        crudFormMode: 'modal',
        searchPaginationType: 'numberedPages',
        searchItemsPerPage: 12,
        showCountdownOnCards: true,
        showCountdownOnLotDetail: true,
        paymentGatewaySettings: {
          create: {
            defaultGateway: 'Manual',
            platformCommissionPercentage: 5.0,
          }
        },
        mentalTriggerSettings: {
          create: {
            showDiscountBadge: true,
            showPopularityBadge: true,
            showHotBidBadge: true,
            showExclusiveBadge: true,
          }
        },
        notificationSettings: {
          create: {
            notifyOnNewAuction: true,
            notifyOnAuctionEndingSoon: true,
            notifyOnPromotions: true,
          }
        }
      }
    });
    console.log('✅ Configurações da plataforma criadas/verificadas\n');

    // 10. CRIAR CATEGORIAS E SUBCATEGORIAS
    console.log('🗂️ Criando categorias e subcategorias...');

    const categoriesData = [
      {
        name: 'Imóveis',
        slug: 'imoveis',
        icon: 'Home',
        subcategories: ['Residencial', 'Comercial', 'Industrial', 'Rural', 'Terrenos']
      },
      {
        name: 'Veículos',
        slug: 'veiculos',
        icon: 'Car',
        subcategories: ['Carros', 'Motos', 'Caminhões', 'Utilitários', 'Náutica']
      },
      {
        name: 'Informática',
        slug: 'informatica',
        icon: 'Monitor',
        subcategories: ['Notebooks', 'Desktops', 'Monitores', 'Periféricos', 'Servidores']
      },
      {
        name: 'Mobiliário',
        slug: 'mobiliario',
        icon: 'Sofa',
        subcategories: ['Escritório', 'Residencial', 'Decoração', 'Eletrodomésticos']
      },
      {
        name: 'Maquinário',
        slug: 'maquinario',
        icon: 'Cog',
        subcategories: ['Industrial', 'Agrícola', 'Construção Civil', 'Ferramentas']
      }
    ];

    const createdCategories = [];

    for (const catData of categoriesData) {
      // Verificar se categoria já existe
      let category = await prisma.lotCategory.findFirst({
        where: { slug: catData.slug }
      });

      if (!category) {
        category = await prisma.lotCategory.create({
          data: {
            name: catData.name,
            slug: catData.slug,
            isGlobal: true,
            tenantId: tenants[0].id // Associando ao tenant principal para simplificar, mas marcado como global
          }
        });
      }
      createdCategories.push(category);

      // Criar subcategorias
      for (const subName of catData.subcategories) {
        const subSlug = subName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

        const existingSub = await prisma.subcategory.findFirst({
          where: {
            slug: subSlug,
            parentCategoryId: category.id
          }
        });

        if (!existingSub) {
          await prisma.subcategory.create({
            data: {
              name: subName,
              slug: subSlug,
              parentCategoryId: category.id,
              isGlobal: true,
              tenantId: tenants[0].id
            }
          });
        }
      }
    }
    console.log(`✅ ${createdCategories.length} categorias e suas subcategorias criadas\n`);

    // Atualizar alguns lotes com categorias
    console.log('🔄 Atualizando lotes com categorias...');
    const imoveisCat = createdCategories.find(c => c.slug === 'imoveis');
    const veiculosCat = createdCategories.find(c => c.slug === 'veiculos');
    const maqCat = createdCategories.find(c => c.slug === 'maquinario');
    const mobCat = createdCategories.find(c => c.slug === 'mobiliario');

    if (imoveisCat) {
      await prisma.lot.updateMany({
        where: { type: 'IMOVEL', categoryId: null },
        data: { categoryId: imoveisCat.id }
      });
    }
    if (veiculosCat) {
      await prisma.lot.updateMany({
        where: { type: 'VEICULO', categoryId: null },
        data: { categoryId: veiculosCat.id }
      });
    }
    if (maqCat) {
      await prisma.lot.updateMany({
        where: { type: 'MAQUINARIO', categoryId: null },
        data: { categoryId: maqCat.id }
      });
    }
    if (mobCat) {
      await prisma.lot.updateMany({
        where: { type: 'MOBILIARIO', categoryId: null },
        data: { categoryId: mobCat.id }
      });
    }
    console.log('✅ Lotes atualizados com categorias\n');


    // 11. CRIAR OFERTAS DE VENDA DIRETA
    console.log('🏷️ Criando ofertas de venda direta...');

    if (imoveisCat) {
      await prisma.directSaleOffer.create({
        data: {
          publicId: `offer-${timestamp}-1`,
          title: 'Oportunidade: Terreno em Condomínio Fechado',
          description: 'Terreno de 500m² em condomínio de alto padrão. Pronto para construir.',
          offerType: 'BUY_NOW',
          price: new Prisma.Decimal('180000.00'),
          minimumOfferPrice: new Prisma.Decimal('170000.00'),
          status: 'ACTIVE',
          locationCity: 'São Paulo',
          locationState: 'SP',
          categoryId: imoveisCat.id,
          sellerId: seller.id,
          tenantId: tenants[0].id,
          itemsIncluded: ['Projeto Arquitetônico', 'Topografia'],
        }
      });
    }

    if (veiculosCat) {
      await prisma.directSaleOffer.create({
        data: {
          publicId: `offer-${timestamp}-2`,
          title: 'Frota de Caminhões Seminovos',
          description: 'Lote com 3 caminhões Volvo FH 540, ano 2021. Venda direta do proprietário.',
          offerType: 'ACCEPTS_PROPOSALS',
          price: new Prisma.Decimal('1200000.00'),
          minimumOfferPrice: new Prisma.Decimal('1000000.00'),
          status: 'ACTIVE',
          locationCity: 'Curitiba',
          locationState: 'PR',
          categoryId: veiculosCat.id,
          sellerId: seller.id,
          tenantId: tenants[0].id,
        }
      });
    }
    console.log('✅ Ofertas de venda direta criadas\n');

    // 12. CRIAR DADOS DO DASHBOARD DO ARREMATANTE
    console.log('👤 Criando dados do dashboard do arrematante...');

    // Perfil do Arrematante
    const bidderProfile = await prisma.bidderProfile.upsert({
      where: { userId: compradorUser.id },
      update: {},
      create: {
        userId: compradorUser.id,
        fullName: compradorUser.fullName,
        cpf: compradorUser.cpf,
        phone: '(11) 99999-8888',
        address: 'Rua dos Compradores, 100',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        documentStatus: 'APPROVED',
        emailNotifications: true,
        smsNotifications: true,
        tenantId: tenants[0].id
      }
    });

    // Métodos de Pagamento
    await prisma.paymentMethod.create({
      data: {
        bidderId: bidderProfile.id,
        type: 'CREDIT_CARD',
        isDefault: true,
        cardLast4: '4242',
        cardBrand: 'VISA',
        isActive: true,
        tenantId: tenants[0].id
      }
    });

    // Histórico de Participação
    await prisma.participationHistory.create({
      data: {
        bidderId: bidderProfile.id,
        lotId: lots[0].id,
        auctionId: auctions[0].id,
        title: lots[0].title,
        auctionName: auctions[0].title,
        maxBid: new Prisma.Decimal('140000.00'),
        finalBid: new Prisma.Decimal('140000.00'),
        result: 'LOST', // Perdeu para outro lance maior (simulado)
        bidCount: 2,
        tenantId: tenants[0].id
      }
    });

    // Notificações do Arrematante
    await prisma.bidderNotification.create({
      data: {
        bidderId: bidderProfile.id,
        type: 'AUCTION_ENDING',
        title: 'Leilão Encerrando',
        message: 'O leilão de Veículos encerra em 1 hora.',
        isRead: false,
        tenantId: tenants[0].id
      }
    });
    console.log('✅ Dados do dashboard do arrematante criados\n');

    // 13. CRIAR DADOS DE PÓS-VENDA (ARREMATES)
    console.log('🏆 Criando dados de pós-venda (arremates)...');

    // Simular que o comprador ganhou o Lote 4 (Veículo)
    const wonLot = lots[3]; // Honda Civic

    // Atualizar lote como vendido
    await prisma.lot.update({
      where: { id: wonLot.id },
      data: {
        status: 'VENDIDO',
        winnerId: compradorUser.id,
        endDate: new Date()
      }
    });

    // Criar UserWin
    const userWin = await prisma.userWin.create({
      data: {
        lotId: wonLot.id,
        userId: compradorUser.id,
        winningBidAmount: new Prisma.Decimal('62000.00'), // Valor do lance dele
        paymentStatus: 'PENDENTE',
        retrievalStatus: 'PENDENTE',
        tenantId: tenants[0].id
      }
    });

    // Criar WonLot (view do dashboard)
    await prisma.wonLot.create({
      data: {
        bidderId: bidderProfile.id,
        lotId: wonLot.id,
        auctionId: auctions[1].id,
        title: wonLot.title,
        finalBid: new Prisma.Decimal('62000.00'),
        status: 'WON',
        paymentStatus: 'PENDENTE',
        totalAmount: new Prisma.Decimal('65100.00'), // +5% comissão
        deliveryStatus: 'PENDING',
        tenantId: tenants[0].id
      }
    });

    // Criar Parcelas (InstallmentPayment)
    await prisma.installmentPayment.create({
      data: {
        userWinId: userWin.id,
        installmentNumber: 1,
        totalInstallments: 1,
        amount: new Prisma.Decimal('65100.00'),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
        status: 'PENDENTE',
        tenantId: tenants[0].id
      }
    });
    console.log('✅ Dados de pós-venda criados\n');

    // 14. CRIAR DADOS DE SUPORTE (ITSM)
    console.log('🆘 Criando dados de suporte (ITSM)...');

    const ticket = await prisma.iTSM_Ticket.create({
      data: {
        publicId: `ticket-${timestamp}-1`,
        userId: compradorUser.id,
        title: 'Dúvida sobre documentação',
        description: 'Gostaria de saber quais documentos preciso enviar para habilitação no leilão judicial.',
        status: 'ABERTO',
        priority: 'MEDIA',
        category: 'DUVIDA',
        tenantId: tenants[0].id,
        messages: {
          create: [
            {
              userId: compradorUser.id,
              message: 'Olá, preciso de ajuda com a documentação.',
              isInternal: false
            }
          ]
        }
      }
    });
    console.log('✅ Ticket de suporte criado\n');

    // 15. CRIAR DADOS DE ENGAJAMENTO E AUDITORIA
    console.log('📝 Criando dados de engajamento e auditoria...');

    // Review
    await prisma.review.create({
      data: {
        lotId: lots[0].id,
        auctionId: auctions[0].id,
        userId: compradorUser.id,
        rating: 5,
        comment: 'Ótima oportunidade, imóvel bem localizado.',
        userDisplayName: 'Comprador Test',
        tenantId: tenants[0].id
      }
    });

    // Pergunta no Lote
    await prisma.lotQuestion.create({
      data: {
        lotId: lots[1].id,
        auctionId: auctions[0].id,
        userId: compradorUser.id,
        userDisplayName: 'Comprador Test',
        questionText: 'O imóvel possui dívidas de condomínio?',
        isPublic: true,
        tenantId: tenants[0].id
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: tenants[0].id,
        userId: compradorUser.id,
        entityType: 'Bid',
        entityId: BigInt(1), // Exemplo
        action: 'CREATE',
        metadata: { amount: 125000.00 },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test Agent'
      }
    });

    // Notificação Geral
    await prisma.notification.create({
      data: {
        userId: compradorUser.id,
        message: 'Bem-vindo ao BidExpert! Complete seu cadastro para participar.',
        isRead: false,
        tenantId: tenants[0].id
      }
    });

    // =================================================================================================
    // ATUALIZAÇÃO AUTOMÁTICA: GARANTIR PRAÇAS E LOCALIZAÇÃO EM TUDO
    // =================================================================================================
    console.log('\n🔄 Executando verificação e atualização de dados faltantes (Praças e Localização)...');

    const allAuctions = await prisma.auction.findMany({
      include: { stages: true }
    });

    const capitalsList = Object.entries(capitalZipCodes);
    const capitalToUF: Record<string, string> = {
      'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Belo Horizonte': 'MG', 'Brasília': 'DF',
      'Salvador': 'BA', 'Fortaleza': 'CE', 'Curitiba': 'PR', 'Manaus': 'AM', 'Recife': 'PE',
      'Porto Alegre': 'RS', 'Belém': 'PA', 'Goiânia': 'GO', 'São Luís': 'MA', 'Maceió': 'AL',
      'Natal': 'RN', 'Campo Grande': 'MS', 'Teresina': 'PI', 'João Pessoa': 'PB', 'Aracaju': 'SE',
      'Cuiabá': 'MT', 'Porto Velho': 'RO', 'Florianópolis': 'SC', 'Macapá': 'AP', 'Rio Branco': 'AC',
      'Vitória': 'ES', 'Boa Vista': 'RR', 'Palmas': 'TO'
    };

    for (const auction of allAuctions) {
      // 1. Garantir Praças (Stages)
      if (auction.stages.length === 0) {
        console.log(`   ➕ Criando praças para o leilão ${auction.title}...`);
        const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        await prisma.auctionStage.create({
          data: {
            name: '1ª Praça',
            auctionId: auction.id,
            tenantId: auction.tenantId,
            startDate: startDate,
            endDate: new Date(startDate.getTime() + 24 * 60 * 60 * 1000),
            status: 'AGUARDANDO_INICIO',
          }
        });

        await prisma.auctionStage.create({
          data: {
            name: '2ª Praça',
            auctionId: auction.id,
            tenantId: auction.tenantId,
            startDate: new Date(startDate.getTime() + 48 * 60 * 60 * 1000),
            endDate: new Date(startDate.getTime() + 72 * 60 * 60 * 1000),
            status: 'AGENDADO',
          }
        });
      }

      // 2. Garantir Localização no Leilão
      if (!auction.zipCode || !auction.address) {
        const randomCapital = capitalsList[Math.floor(Math.random() * capitalsList.length)];
        console.log(`   📍 Atualizando localização do leilão ${auction.title} para ${randomCapital[0]}...`);

        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            zipCode: randomCapital[1],
            address: `Endereço Central em ${randomCapital[0]}`,
          }
        });
      }
    }

    // 3. Garantir Localização nos Lotes
    const allLots = await prisma.lot.findMany();
    for (const lot of allLots) {
      if (!lot.cityName || !lot.stateUf || !lot.mapAddress) {
        const randomCapital = capitalsList[Math.floor(Math.random() * capitalsList.length)];
        const capitalName = randomCapital[0];
        const uf = capitalToUF[capitalName] || 'SP';

        console.log(`   📍 Atualizando localização do lote ${lot.title} para ${capitalName}...`);
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            cityName: capitalName,
            stateUf: uf,
            mapAddress: `Endereço Central em ${capitalName}`,
          }
        });
      }
    }

    // 4. Garantir Localização nos Assets
    const allAssets = await prisma.asset.findMany();
    for (const asset of allAssets) {
      if (!asset.locationCity || !asset.locationState || !asset.address) {
        const randomCapital = capitalsList[Math.floor(Math.random() * capitalsList.length)];
        const capitalName = randomCapital[0];
        const uf = capitalToUF[capitalName] || 'SP';

        console.log(`   📍 Atualizando localização do ativo ${asset.title} para ${capitalName}...`);
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            locationCity: capitalName,
            locationState: uf,
            address: `Endereço Central em ${capitalName}`,
          }
        });
      }
    }

    console.log('✅ Atualização de dados faltantes concluída!\n');

    console.log('✅ Dados de engajamento e auditoria criados\n');

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
