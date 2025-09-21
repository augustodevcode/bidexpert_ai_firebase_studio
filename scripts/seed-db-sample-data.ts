// scripts/seed-db-sample-data.ts
/**
 * @fileoverview Este script popula o banco de dados com um conjunto completo
 * de dados de amostra para demonstração e desenvolvimento. Ele cria entidades
 * como categorias, comitentes, leiloeiros, leilões (de diferentes tipos),
 * bens e lotes, todos vinculados ao tenant "Landlord" (ID '1').
 * ATENÇÃO: Este script deve ser executado APÓS o seed essencial (`npm run db:seed`).
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { slugify } from '@/lib/ui-helpers';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const TENANT_ID = '1'; // Landlord Tenant
const testRunId = uuidv4().substring(0, 8); // Adicionando a variável que faltava

async function seedSampleData() {
  console.log('--- [DB SEED SAMPLES] Iniciando a inserção de dados de amostra... ---');

  try {
    // 1. Buscar Dados Essenciais (Garantir que o seed principal foi executado)
    console.log('[DB SEED SAMPLES] Buscando dados de base (usuário admin, tenant)...');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });
    const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });

    if (!adminUser || !tenant) {
      throw new Error('Usuário administrador ou Tenant Landlord não encontrado. Execute `npm run db:seed` primeiro.');
    }
    console.log('[DB SEED SAMPLES] ✅ Dados de base encontrados.');

    // 2. Criar Entidades Principais
    console.log('[DB SEED SAMPLES] Criando entidades de amostra (Categorias, Comitentes, Leiloeiro)...');
    const categories = {
      veiculos: await prisma.lotCategory.upsert({ where: { slug: 'veiculos' }, update: {}, create: { name: 'Veículos', slug: 'veiculos' } }),
      imoveis: await prisma.lotCategory.upsert({ where: { slug: 'imoveis' }, update: {}, create: { name: 'Imóveis', slug: 'imoveis' } }),
      equipamentos: await prisma.lotCategory.upsert({ where: { slug: 'equipamentos-industriais' }, update: {}, create: { name: 'Equipamentos Industriais', slug: 'equipamentos-industriais' } }),
      arte: await prisma.lotCategory.upsert({ where: { slug: 'arte-e-antiguidades' }, update: {}, create: { name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades' } }),
    };

    const auctioneer = await prisma.auctioneer.upsert({
      where: { name: 'Leiloeiro Oficial Admin' },
      update: {},
      create: {
        name: 'Leiloeiro Oficial Admin',
        slug: 'leiloeiro-oficial-admin',
        registrationNumber: 'JUCESP-001',
        tenant: { connect: { id: TENANT_ID } },
      },
    });

    const sellers = {
      bancoInvest: await prisma.seller.upsert({ where: { name: 'Banco Invest S.A.' }, update: {}, create: { name: 'Banco Invest S.A.', slug: 'banco-invest-sa', tenant: { connect: { id: TENANT_ID } } } }),
      construtoraMoura: await prisma.seller.upsert({ where: { name: 'Construtora Moura' }, update: {}, create: { name: 'Construtora Moura', slug: 'construtora-moura', tenant: { connect: { id: TENANT_ID } } } }),
      colecionadorSilva: await prisma.seller.upsert({ where: { name: 'José Silva (Colecionador)' }, update: {}, create: { name: 'José Silva (Colecionador)', slug: 'jose-silva-colecionador', tenant: { connect: { id: TENANT_ID } } } }),
    };
    
    const judicialEntities = {
        tjsp: await prisma.court.upsert({ where: { name: 'Tribunal de Justiça de São Paulo' }, update: {}, create: { name: 'Tribunal de Justiça de São Paulo', slug: 'tjsp', stateUf: 'SP' } }),
    };
    const spState = await prisma.state.findUnique({where: {uf: 'SP'}});
    if (!spState) throw new Error("Estado de SP não encontrado no seed básico.");

    const spComarca = await prisma.judicialDistrict.upsert({where: {slug: 'comarca-sao-paulo'}, update: {}, create: {name: 'Comarca de São Paulo', slug: 'comarca-sao-paulo', courtId: judicialEntities.tjsp.id, stateId: spState.id}});
    const spVara = await prisma.judicialBranch.upsert({where: {slug: '1-vara-civel-sp'}, update: {}, create: {name: '1ª Vara Cível', slug: '1-vara-civel-sp', districtId: spComarca.id}});
    
    // Criar um comitente judicial vinculado à vara
    const judicialSeller = await prisma.seller.upsert({where: {name: spVara.name}, update: {}, create: {name: spVara.name, slug: slugify(spVara.name), isJudicial: true, judicialBranchId: spVara.id, tenant: { connect: { id: TENANT_ID } } }});

    console.log('[DB SEED SAMPLES] ✅ Entidades de amostra criadas/verificadas.');


    // 3. Criar Leilões e Itens
    console.log('[DB SEED SAMPLES] Criando Leilões, Bens e Lotes de amostra...');
    const createdItems = [];
    for (let i = 1; i <= 3; i++) {
        // --- Leilão de Veículos ---
        const auctionVeiculos = await prisma.auction.create({
            data: {
                title: `Leilão de Frota Renovada ${i} (${testRunId})`,
                status: i === 1 ? 'ABERTO_PARA_LANCES' : 'EM_BREVE',
                auctionDate: faker.date.soon({ days: i * 5 }),
                auctionType: 'EXTRAJUDICIAL',
                tenant: { connect: { id: TENANT_ID } },
                auctioneer: { connect: { id: auctioneer.id } },
                seller: { connect: { id: sellers.construtoraMoura.id } },
                category: { connect: { id: categories.veiculos.id } }
            }
        });
        const bemCaminhao = await prisma.bem.create({
            data: {
                title: `Caminhão Scania R450 ${2015+i}`,
                description: `Caminhão de alta performance, com ${faker.number.int({min: 100000, max: 400000})} km rodados.`,
                evaluationValue: faker.number.int({min: 250000, max: 350000}),
                tenant: { connect: { id: TENANT_ID } },
                seller: { connect: { id: sellers.construtoraMoura.id } },
                category: { connect: { id: categories.veiculos.id } },
                imageUrl: `https://picsum.photos/seed/truck${i}/600/400`,
                dataAiHint: 'truck',
            }
        });
        await prisma.lot.create({
            data: {
                title: bemCaminhao.title,
                number: `V00${i}`,
                status: i === 1 ? 'ABERTO_PARA_LANCES' : 'EM_BREVE',
                auction: { connect: { id: auctionVeiculos.id } },
                price: bemCaminhao.evaluationValue,
                initialPrice: bemCaminhao.evaluationValue,
                bens: { create: [{ bemId: bemCaminhao.id }] },
                tenant: { connect: { id: TENANT_ID } },
            }
        });
        createdItems.push(`Leilão de Veículos ${i}`);

        // --- Leilão Judicial de Imóvel ---
        const judicialProcess = await prisma.judicialProcess.create({
            data: {
                processNumber: `${faker.number.int({min: 1000000, max: 9999999})}-02.${2020+i}.8.26.0100`,
                court: { connect: { id: judicialEntities.tjsp.id } },
                district: { connect: { id: spComarca.id } },
                branch: { connect: { id: spVara.id } },
                seller: { connect: { id: judicialSeller.id } },
                tenant: { connect: { id: TENANT_ID } },
            }
        });
        const bemApartamento = await prisma.bem.create({
            data: {
                title: `Apartamento ${i+1} dorms na Av. Paulista`,
                description: `Apartamento com ${faker.number.int({min: 50, max: 120})}m², bem localizado. Matrícula: ${faker.number.int({min: 100000, max: 999999})}`,
                evaluationValue: faker.number.int({min: 400000, max: 900000}),
                tenant: { connect: { id: TENANT_ID } },
                judicialProcess: { connect: { id: judicialProcess.id } },
                seller: { connect: { id: judicialSeller.id } },
                category: { connect: { id: categories.imoveis.id } },
                imageUrl: `https://picsum.photos/seed/apt${i}/600/400`,
                dataAiHint: 'apartment building',
            }
        });
         const auctionImoveis = await prisma.auction.create({
            data: {
                title: `Leilão Judicial de Imóvel ${i} (${testRunId})`,
                status: 'ABERTO_PARA_LANCES',
                auctionDate: faker.date.soon({ days: i * 3 }),
                auctionType: 'JUDICIAL',
                tenant: { connect: { id: TENANT_ID } },
                auctioneer: { connect: { id: auctioneer.id } },
                seller: { connect: { id: judicialSeller.id } },
                judicialProcess: { connect: { id: judicialProcess.id } },
                category: { connect: { id: categories.imoveis.id } },
            }
        });
        await prisma.lot.create({
            data: {
                title: bemApartamento.title,
                number: `J00${i}`,
                status: 'ABERTO_PARA_LANCES',
                auction: { connect: { id: auctionImoveis.id } },
                price: bemApartamento.evaluationValue,
                initialPrice: bemApartamento.evaluationValue,
                bens: { create: [{ bemId: bemApartamento.id }] },
                tenant: { connect: { id: TENANT_ID } },
            }
        });
        createdItems.push(`Leilão Judicial ${i}`);
    }
    console.log(`[DB SEED SAMPLES] ✅ ${createdItems.length} leilões de amostra criados com sucesso.`);

  } catch (error: any) {
    console.error(`[DB SEED SAMPLES] ❌ ERRO ao popular dados de amostra: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    await seedSampleData();
    console.log('--- [DB SEED SAMPLES] Processo de seed de amostra concluído com sucesso. ---');
  } catch (error) {
    console.error("[DB SEED SAMPLES] ❌ ERRO FATAL durante o processo de seed de amostra:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
