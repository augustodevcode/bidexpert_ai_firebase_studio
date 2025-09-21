
// scripts/seed-db-sample-data.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';

const prisma = new PrismaClient();
const TENANT_ID = '1'; // Landlord Tenant

// Implementação local para evitar problemas de path alias
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

function createImage(text: string, width = 600, height = 400) {
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}/EEE/31343C?text=${encodedText}`;
}

async function seedSampleData() {
  console.log('--- [DB SEED SAMPLES] Starting sample data seeding ---');

  try {
    // 1. Get Essential Base Data
    console.log('[DB SEED SAMPLES] Fetching base data (admin user, tenant)...');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });
    if (!adminUser) {
      throw new Error('Admin user not found. Please run the essential seed first.');
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
    if (!tenant) {
      throw new Error(`Tenant with ID ${TENANT_ID} not found.`);
    }
    
    console.log('[DB SEED SAMPLES] ✅ SUCCESS: Base data fetched.');

    // 2. Create Core Entities
    console.log('[DB SEED SAMPLES] Seeding core sample entities (Categories, Sellers, etc)...');

    const categories = {
      veiculos: await prisma.category.upsert({ where: { slug: 'veiculos' }, update: {}, create: { name: 'Veículos', slug: 'veiculos', tenantId: TENANT_ID } }),
      imoveis: await prisma.category.upsert({ where: { slug: 'imoveis' }, update: {}, create: { name: 'Imóveis', slug: 'imoveis', tenantId: TENANT_ID } }),
      equipamentos: await prisma.category.upsert({ where: { slug: 'equipamentos-industriais' }, update: {}, create: { name: 'Equipamentos Industriais', slug: 'equipamentos-industriais', tenantId: TENANT_ID } }),
      arte: await prisma.category.upsert({ where: { slug: 'arte-e-antiguidades' }, update: {}, create: { name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades', tenantId: TENANT_ID } }),
    };

    const auctioneer = await prisma.auctioneer.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        name: 'Leiloeiro Oficial Admin',
        registrationNumber: 'JUCESP-001',
        bio: 'Leiloeiro oficial da plataforma BidExpert.',
        slug: 'leiloeiro-oficial-admin',
        tenantId: TENANT_ID,
      },
    });

    const sellers = {
      bancoInvest: await prisma.seller.upsert({
        where: { document: '11.111.111/0001-11' },
        update: {},
        create: { name: 'Banco Invest S.A.', document: '11.111.111/0001-11', type: 'LEGAL', tenantId: TENANT_ID, slug: 'banco-invest-sa' },
      }),
      construtoraMoura: await prisma.seller.upsert({
        where: { document: '22.222.222/0001-22' },
        update: {},
        create: { name: 'Construtora Moura', document: '22.222.222/0001-22', type: 'LEGAL', tenantId: TENANT_ID, slug: 'construtora-moura' },
      }),
      colecionadorSilva: await prisma.seller.upsert({
        where: { document: '123.456.789-00' },
        update: {},
        create: { name: 'José Silva (Colecionador)', document: '123.456.789-00', type: 'INDIVIDUAL', tenantId: TENANT_ID, slug: 'jose-silva-colecionador' },
      }),
      prefeituraSp: await prisma.seller.upsert({
        where: { document: '33.333.333/0001-33' },
        update: {},
        create: { name: 'Prefeitura de São Paulo', document: '33.333.333/0001-33', type: 'LEGAL', tenantId: TENANT_ID, slug: 'prefeitura-sp' },
      }),
    };
    
    const judicialEntities = {
        tjsp: await prisma.court.upsert({ where: { name: 'Tribunal de Justiça de São Paulo' }, update: {}, create: { name: 'Tribunal de Justiça de São Paulo', slug: 'tjsp' } }),
        trf3: await prisma.court.upsert({ where: { name: 'Tribunal Regional Federal da 3ª Região' }, update: {}, create: { name: 'Tribunal Regional Federal da 3ª Região', slug: 'trf3' } }),
    };

    console.log('[DB SEED SAMPLES] ✅ SUCCESS: Core entities seeded.');

    // 3. Seed Auctions
    console.log('[DB SEED SAMPLES] Seeding Auctions...');

    for (let i = 1; i <= 5; i++) {
      // EXTRAJUDICIAL
      const bemTrator = {
        title: `Trator John Deere 8R ${300 + i * 10}`,
        description: 'Trator agrícola de alta potência, com poucas horas de uso.',
        evaluationValue: 250000 + i * 10000,
      };
      await prisma.auction.create({
        data: {
          title: `Leilão Extrajudicial de Frota Agrícola ${i}`,
          auctionType: 'EXTRAJUDICIAL',
          status: 'ABERTO_PARA_LANCES',
          auctionDate: faker.date.future(),
          auctioneerId: auctioneer.id,
          sellerId: sellers.bancoInvest.id,
          tenantId: TENANT_ID,
          lots: {
            create: {
              number: `L00${i}`,
              title: `Lote Único: ${bemTrator.title}`,
              status: 'ABERTO_PARA_LANCES',
              tenantId: TENANT_ID,
              bens: {
                create: {
                  ...bemTrator,
                  tenantId: TENANT_ID,
                  categoryId: categories.equipamentos.id,
                  media: {
                    create: [
                      { url: createImage(bemTrator.title), isFeatured: true, tenantId: TENANT_ID },
                      { url: createImage(`${bemTrator.title} (vista lateral)`), isFeatured: false, tenantId: TENANT_ID },
                    ]
                  }
                }
              }
            }
          }
        }
      });

      // JUDICIAL
      const bemImovel = {
        title: `Apartamento 2 dorms em Pinheiros, SP ${i}`,
        description: 'Apartamento bem localizado, próximo ao metrô. Matrícula 123.456.',
        evaluationValue: 500000 + i * 20000,
      };
      await prisma.auction.create({
        data: {
          title: `Leilão Judicial de Imóvel em São Paulo ${i}`,
          auctionType: 'JUDICIAL',
          status: 'ABERTO_PARA_LANCES',
          auctionDate: faker.date.future(),
          auctioneerId: auctioneer.id,
          sellerId: sellers.bancoInvest.id,
          tenantId: TENANT_ID,
          judicialProcess: {
            create: {
              processNumber: `0012345-67.2022.8.26.000${i}`,
              courtId: judicialEntities.tjsp.id,
              author: 'Banco Invest S.A.',
              defendant: `Devedor Fictício ${i}`,
              tenantId: TENANT_ID,
            }
          },
          lots: {
            create: {
              number: `J00${i}`,
              title: `Lote Único: ${bemImovel.title}`,
              status: 'ABERTO_PARA_LANCES',
              tenantId: TENANT_ID,
              bens: {
                create: {
                  ...bemImovel,
                  tenantId: TENANT_ID,
                  categoryId: categories.imoveis.id,
                  media: {
                    create: [
                      { url: createImage(bemImovel.title), isFeatured: true, tenantId: TENANT_ID },
                      { url: createImage(`${bemImovel.title} (planta)`), isFeatured: false, tenantId: TENANT_ID },
                    ]
                  }
                }
              }
            }
          }
        }
      });

      // PARTICULAR
      const bemArte = {
        title: `Pintura a Óleo Abstrata de Artista Famoso ${i}`,
        description: 'Obra de arte moderna, assinada pelo artista.',
        evaluationValue: 20000 + i * 1000,
      };
      await prisma.auction.create({
        data: {
          title: `Leilão de Arte Contemporânea ${i}`,
          auctionType: 'PARTICULAR',
          status: 'EM_BREVE',
          auctionDate: faker.date.future({ years: 1 }),
          auctioneerId: auctioneer.id,
          sellerId: sellers.colecionadorSilva.id,
          tenantId: TENANT_ID,
          lots: {
            create: {
              number: `P00${i}`,
              title: `Lote Único: ${bemArte.title}`,
              status: 'EM_BREVE',
              tenantId: TENANT_ID,
              bens: {
                create: {
                  ...bemArte,
                  tenantId: TENANT_ID,
                  categoryId: categories.arte.id,
                  media: {
                    create: [
                      { url: createImage(bemArte.title), isFeatured: true, tenantId: TENANT_ID },
                    ]
                  }
                }
              }
            }
          }
        }
      });
      
      // TOMADA DE PRECOS
      const bemVeiculo = {
        title: `Veículo Oficial - Sedan Executivo ${i}`,
        description: 'Veículo usado da frota da prefeitura, com manutenção em dia.',
        evaluationValue: 45000 + i * 1000,
      };
      await prisma.auction.create({
        data: {
          title: `Tomada de Preços - Renovação de Frota ${i}`,
          auctionType: 'TOMADA_DE_PRECOS',
          status: 'ABERTO_PARA_LANCES',
          auctionDate: faker.date.future(),
          auctioneerId: auctioneer.id,
          sellerId: sellers.prefeituraSp.id,
          tenantId: TENANT_ID,
          lots: {
            create: {
              number: `T00${i}`,
              title: `Lote Único: ${bemVeiculo.title}`,
              status: 'ABERTO_PARA_LANCES',
              tenantId: TENANT_ID,
              bens: {
                create: {
                  ...bemVeiculo,
                  tenantId: TENANT_ID,
                  categoryId: categories.veiculos.id,
                  media: {
                    create: [
                      { url: createImage(bemVeiculo.title), isFeatured: true, tenantId: TENANT_ID },
                    ]
                  }
                }
              }
            }
          }
        }
      });
    }
    
    console.log('[DB SEED SAMPLES] ✅ SUCCESS: Auctions, Lots, and Bens seeded.');

  } catch (error: any) {
    console.error(`[DB SEED SAMPLES] ❌ ERROR seeding sample data: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    await seedSampleData();
  } catch (error) {
    console.error("[DB SEED SAMPLES] ❌ FATAL ERROR during sample seeding process:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
