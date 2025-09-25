// scripts/seed-db-sample-data.ts
/**
 * @fileoverview Este script popula o banco de dados com um conjunto completo
 * de dados de amostra para demonstração e desenvolvimento. Ele cria entidades
 * como categorias, comitentes, leiloeiros, leilões (de diferentes tipos),
 * ativos e lotes, todos vinculados ao tenant "Landlord" (ID '1').
 * ATENÇÃO: Este script deve ser executado APÓS o seed essencial (`npm run db:seed`).
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { slugify } from '@/lib/ui-helpers';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const TENANT_ID = '1'; // Landlord Tenant
const testRunId = uuidv4().substring(0, 8);

const brazilianStates = [
  { uf: 'AC', name: 'Acre', capital: 'Rio Branco' },
  { uf: 'AL', name: 'Alagoas', capital: 'Maceió' },
  { uf: 'AP', name: 'Amapá', capital: 'Macapá' },
  { uf: 'AM', name: 'Amazonas', capital: 'Manaus' },
  { uf: 'BA', name: 'Bahia', capital: 'Salvador' },
  { uf: 'CE', name: 'Ceará', capital: 'Fortaleza' },
  { uf: 'DF', name: 'Distrito Federal', capital: 'Brasília' },
  { uf: 'ES', name: 'Espírito Santo', capital: 'Vitória' },
  { uf: 'GO', name: 'Goiás', capital: 'Goiânia' },
  { uf: 'MA', name: 'Maranhão', capital: 'São Luís' },
  { uf: 'MT', name: 'Mato Grosso', capital: 'Cuiabá' },
  { uf: 'MS', name: 'Mato Grosso do Sul', capital: 'Campo Grande' },
  { uf: 'MG', name: 'Minas Gerais', capital: 'Belo Horizonte' },
  { uf: 'PA', name: 'Pará', capital: 'Belém' },
  { uf: 'PB', name: 'Paraíba', capital: 'João Pessoa' },
  { uf: 'PR', name: 'Paraná', capital: 'Curitiba' },
  { uf: 'PE', name: 'Pernambuco', capital: 'Recife' },
  { uf: 'PI', name: 'Piauí', capital: 'Teresina' },
  { uf: 'RJ', name: 'Rio de Janeiro', capital: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte', capital: 'Natal' },
  { uf: 'RS', name: 'Rio Grande do Sul', capital: 'Porto Alegre' },
  { uf: 'RO', name: 'Rondônia', capital: 'Porto Velho' },
  { uf: 'RR', name: 'Roraima', capital: 'Boa Vista' },
  { uf: 'SC', name: 'Santa Catarina', capital: 'Florianópolis' },
  { uf: 'SP', name: 'São Paulo', capital: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe', capital: 'Aracaju' },
  { uf: 'TO', name: 'Tocantins', capital: 'Palmas' },
];

async function seedSampleData() {
  // Force rewrite to fix potential parsing issues
  console.log('--- [DB SEED SAMPLES] Iniciando a inserção de dados de amostra completa e aprimorada... ---');

  try {
    // 1. Buscar Dados Essenciais
    console.log('[DB SEED SAMPLES] Buscando dados de base (usuário admin, tenant)...');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });
    const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });

    if (!adminUser || !tenant) {
      throw new Error('Usuário administrador ou Tenant Landlord não encontrado. Execute `npm run db:seed` primeiro.');
    }
    console.log('[DB SEED SAMPLES] ✅ Dados de base encontrados.');

    // 2. Criar Entidades Principais
    console.log('[DB SEED SAMPLES] Criando entidades de amostra (Categorias, Comitentes, Leiloeiro, Judicial, Localidades)...');

    // States and Cities
    const createdStates: Record<string, any> = {};
    const createdCities: Record<string, any> = {};
    const capitalCities: Record<string, any> = {};

    for (const stateData of brazilianStates) {
      const state = await prisma.state.upsert({
        where: { uf: stateData.uf },
        update: {},
        create: { name: stateData.name, uf: stateData.uf },
      });
      createdStates[state.uf] = state;

      const capital = await prisma.city.upsert({
        where: { slug: slugify(`${stateData.capital}-${stateData.uf}`) },
        update: {},
        create: { name: stateData.capital, slug: slugify(`${stateData.capital}-${stateData.uf}`), stateId: state.id },
      });
      createdCities[capital.slug] = capital;
      capitalCities[state.uf] = capital;

      // Add a few more random cities for each state
      for (let i = 0; i < 3; i++) {
        const cityName = faker.location.city();
        const citySlug = slugify(`${cityName}-${stateData.uf}`);
        const city = await prisma.city.upsert({
          where: { slug: citySlug },
          update: {},
          create: { name: cityName, slug: citySlug, stateId: state.id },
        });
        createdCities[city.slug] = city;
      }
    }

    // Categories
    const categoriesData = [
      { name: 'Veículos', slug: 'veiculos' },
      { name: 'Imóveis', slug: 'imoveis' },
      { name: 'Equipamentos Industriais', slug: 'equipamentos-industriais' },
      { name: 'Arte e Antiguidades', slug: 'arte-e-antiguidades' },
      { name: 'Eletrônicos', slug: 'eletronicos' },
      { name: 'Jóias', slug: 'joias' },
      { name: 'Móveis', slug: 'moveis' },
      { name: 'Serviços', slug: 'servicos' },
      { name: 'Diversos', slug: 'diversos' },
    ];
    const categories: Record<string, any> = {};
    for (const cat of categoriesData) {
      categories[cat.slug.replace(/-/g, '')] = await prisma.lotCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }

    // Subcategories
    const subcategoriesData = [
      { name: 'Carros', slug: 'carros', parentSlug: 'veiculos' },
      { name: 'Motos', slug: 'motos', parentSlug: 'veiculos' },
      { name: 'Caminhões', slug: 'caminhoes', parentSlug: 'veiculos' },
      { name: 'Ônibus', slug: 'onibus', parentSlug: 'veiculos' },
      { name: 'Apartamentos', slug: 'apartamentos', parentSlug: 'imoveis' },
      { name: 'Casas', slug: 'casas', parentSlug: 'imoveis' },
      { name: 'Terrenos', slug: 'terrenos', parentSlug: 'imoveis' },
      { name: 'Comerciais', slug: 'comerciais', parentSlug: 'imoveis' },
      { name: 'Máquinas Pesadas', slug: 'maquinas-pesadas', parentSlug: 'equipamentos-industriais' },
      { name: 'Ferramentas', slug: 'ferramentas', parentSlug: 'equipamentos-industriais' },
      { name: 'Pinturas', slug: 'pinturas', parentSlug: 'arte-e-antiguidades' },
      { name: 'Esculturas', slug: 'esculturas', parentSlug: 'arte-e-antiguidades' },
    ];
    const subcategories: Record<string, any> = {};
    for (const subcat of subcategoriesData) {
      const parentCategory = categories[subcat.parentSlug.replace(/-/g, '')];
      subcategories[subcat.slug.replace(/-/g, '')] = await prisma.subcategory.upsert({
        where: { slug: subcat.slug },
        update: {},
        create: {
          name: subcat.name,
          slug: subcat.slug,
          parentCategoryId: parentCategory.id,
        },
      });
    }

    // Auctioneers (2 leiloeiros)
    const auctioneersData = [
      { name: 'Leiloeiro Principal', registrationNumber: 'JUCESP-001' },
      { name: 'Leiloeiro Associado', registrationNumber: 'JUCESP-002' },
    ];
    const auctioneers: Record<string, any> = {};
    for (const auc of auctioneersData) {
      auctioneers[slugify(auc.name).replace(/-/g, '')] = await prisma.auctioneer.upsert({
        where: { name: auc.name },
        update: {},
        create: {
          name: auc.name,
          slug: slugify(auc.name),
          registrationNumber: auc.registrationNumber,
          tenant: { connect: { id: TENANT_ID } },
        },
      });
    }

    // Judicial Entities (Courts, Districts, Branches for each state)
    const judicialEntities: Record<string, any> = {};
    const judicialDistricts: Record<string, any> = {};
    const judicialBranches: Record<string, any> = {};

    for (const stateData of brazilianStates) {
      const court = await prisma.court.upsert({
        where: { name: `Tribunal de Justiça de ${stateData.name}` },
        update: {},
        create: { name: `Tribunal de Justiça de ${stateData.name}`, slug: slugify(`tj-${stateData.uf}`), stateUf: stateData.uf },
      });
      judicialEntities[stateData.uf] = court;

      const district = await prisma.judicialDistrict.upsert({
        where: { slug: slugify(`comarca-${stateData.capital}-${stateData.uf}`) },
        update: {},
        create: { name: `Comarca de ${stateData.capital}`, slug: slugify(`comarca-${stateData.capital}-${stateData.uf}`), courtId: court.id, stateId: createdStates[stateData.uf].id },
      });
      judicialDistricts[stateData.uf] = district;

      const branch = await prisma.judicialBranch.upsert({
        where: { slug: slugify(`1-vara-civel-${stateData.uf}`) },
        update: {},
        create: { name: `1ª Vara Cível de ${stateData.capital}`, slug: slugify(`1-vara-civel-${stateData.uf}`), districtId: district.id },
      });
      judicialBranches[stateData.uf] = branch;
    }

    // Sellers (20 comitentes, including judicial ones)
    const sellersData = [];
    for (let i = 0; i < 15; i++) { // 15 non-judicial sellers
      sellersData.push({ name: faker.company.name(), slug: slugify(faker.company.name()), isJudicial: false });
    }
    // 5 judicial sellers (linked to random varas)
    const allJudicialBranches = Object.values(judicialBranches);
    for (let i = 0; i < 5; i++) {
      const randomBranch = faker.helpers.arrayElement(allJudicialBranches);
      sellersData.push({ name: randomBranch.name, slug: slugify(randomBranch.name), isJudicial: true, judicialBranchId: randomBranch.id });
    }

    const sellers: Record<string, any> = {};
    for (const sel of sellersData) {
      sellers[sel.slug.replace(/-/g, '')] = await prisma.seller.upsert({
        where: { name: sel.name },
        update: {},
        create: {
          name: sel.name,
          slug: sel.slug,
          isJudicial: sel.isJudicial,
          judicialBranch: sel.judicialBranchId ? { connect: { id: sel.judicialBranchId } } : undefined,
          tenant: { connect: { id: TENANT_ID } },
        },
      });
    }
    console.log('[DB SEED SAMPLES] ✅ Entidades de amostra criadas/verificadas.');

    // 3. Criar Leilões e Itens
    console.log('[DB SEED SAMPLES] Criando Leilões, Ativos e Lotes de amostra...');
    const createdAuctions: string[] = [];

    const auctionTypes = ['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'];
    const auctionMethods = ['STANDARD', 'DUTCH', 'SILENT'];
    const participationTypes = ['ONLINE', 'PRESENCIAL', 'HIBRIDO'];
    const auctionStatuses = [
      'RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO',
    ];

    let auctionCounter = 0;
    const lotsPerStateCount: Record<string, number> = {};
    const lotsPerCapitalCount: Record<string, number> = {};

    // Initialize counts
    for (const stateData of brazilianStates) {
      lotsPerStateCount[stateData.uf] = 0;
      lotsPerCapitalCount[stateData.uf] = 0;
    }

    // Helper to get a random image URL
    const getRandomImageUrl = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;
    const getRandomGalleryImages = (seed: string, count: number) => {
      const images = [];
      for (let k = 0; k < count; k++) {
        images.push(`https://picsum.photos/seed/${seed}-${k}/800/600`);
      }
      return images;
    };

    // Main loop for generating auctions
    for (const type of auctionTypes) {
      for (const method of auctionMethods) {
        for (const participation of participationTypes) {
          for (const status of auctionStatuses) {
            for (let i = 0; i < 5; i++) { // 5 auctions per combination
              auctionCounter++;
              const auctionTitle = `${type} ${method} ${participation} - ${status} #${i + 1} (${testRunId})`;
              const auctionDate = faker.date.soon({ days: faker.number.int({ min: 1, max: 60 }) });
              const endDate = faker.date.soon({ days: faker.number.int({ min: 61, max: 120 }) });

              // Select a random auctioneer
              const randomAuctioneer = faker.helpers.arrayElement(Object.values(auctioneers));

              // Determine location for this auction's lots
              let targetState: any;
              let targetCity: any;

              // Prioritize capitals and states to meet minimums
              const statesToFillCapital = brazilianStates.filter(s => lotsPerCapitalCount[s.uf] < 10);
              const statesToFillState = brazilianStates.filter(s => lotsPerStateCount[s.uf] < 100);

              if (statesToFillCapital.length > 0) {
                targetState = faker.helpers.arrayElement(statesToFillCapital);
                targetCity = capitalCities[targetState.uf];
              } else if (statesToFillState.length > 0) {
                targetState = faker.helpers.arrayElement(statesToFillState);
                targetCity = faker.helpers.arrayElement(Object.values(createdCities).filter((c: any) => c.stateId === createdStates[targetState.uf].id));
              } else {
                // If minimums are met, pick randomly
                targetState = faker.helpers.arrayElement(brazilianStates);
                targetCity = faker.helpers.arrayElement(Object.values(createdCities).filter((c: any) => c.stateId === createdStates[targetState.uf].id));
              }

              // Select a random seller
              let randomSeller = faker.helpers.arrayElement(Object.values(sellers).filter((s: any) => !s.isJudicial)); // Default to non-judicial

              // Adjust seller and judicialProcess for JUDICIAL auctionType
              let judicialProcess = undefined;
              if (type === 'JUDICIAL') {
                const judicialBranch = judicialBranches[targetState.uf];
                randomSeller = sellers[slugify(judicialBranch.name).replace(/-/g, '')]; // Ensure judicial seller is the vara
                const court = judicialEntities[targetState.uf];
                const district = judicialDistricts[targetState.uf];

                const generatedProcessNumber = `${faker.number.int({ min: 1000000, max: 9999999 })}-02.${faker.number.int({ min: 2020, max: 2024 })}.8.26.0100`;
                judicialProcess = await prisma.judicialProcess.create({
                  data: {
                    processNumber: generatedProcessNumber,
                    court: { connect: { id: court.id } },
                    district: { connect: { id: district.id } },
                    branch: { connect: { id: judicialBranch.id } },
                    seller: { connect: { id: randomSeller.id } },
                    tenant: { connect: { id: TENANT_ID } },
                    parties: {
                      create: [
                        { name: faker.person.fullName(), partyType: 'AUTOR' },
                        { name: faker.person.fullName(), partyType: 'REU' },
                      ],
                    },
                  },
                });
              }

              const auction = await prisma.auction.create({
                data: {
                  title: auctionTitle,
                  status: status as any,
                  auctionDate: auctionDate,
                  endDate: endDate,
                  auctionType: type as any,
                  auctionMethod: method as any,
                  participationType: participation as any,
                  tenant: { connect: { id: TENANT_ID } },
                  auctioneer: { connect: { id: randomAuctioneer.id } },
                  seller: { connect: { id: randomSeller.id } },
                  category: { connect: { id: faker.helpers.arrayElement(Object.values(categories)).id } },
                  judicialProcess: judicialProcess ? { connect: { id: judicialProcess.id } } : undefined,
                  softCloseEnabled: faker.datatype.boolean(),
                  softCloseMinutes: faker.number.int({ min: 1, max: 10 }),
                },
              });
              createdAuctions.push(auction.title);

              // Create 2-5 lots for each auction, mixing 1:1 and 1:N assets
              const numberOfLots = faker.number.int({ min: 2, max: 5 });
              for (let j = 0; j < numberOfLots; j++) {
                const isGroupedLot = faker.datatype.boolean(); // Randomly decide if it's a grouped lot
                const assetsToCreate = isGroupedLot ? faker.number.int({ min: 2, max: 4 }) : 1; // 1 for 1:1, 2-4 for grouped

                const lotTitle = isGroupedLot ? `Lote Agrupado de ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} (${j + 1})` : faker.commerce.productName();
                const lotEvaluationValue = faker.number.int({ min: 10000, max: 1000000 });
                const lotFeaturedImage = getRandomImageUrl(`lot-${auction.id}-${j}`);

                const createdAssets = [];
                for (let k = 0; k < assetsToCreate; k++) {
                  const assetTitle = faker.commerce.productName();
                  const assetEvaluationValue = faker.number.int({ min: 5000, max: 500000 });
                  const assetImageUrl = getRandomImageUrl(`asset-${auction.id}-${j}-${k}`);
                  const assetGalleryImages = getRandomGalleryImages(`asset-gallery-${auction.id}-${j}-${k}`, faker.number.int({ min: 2, max: 5 }));

                  const asset = await prisma.asset.create({
                    data: {
                      title: assetTitle,
                      description: faker.commerce.productDescription(),
                      evaluationValue: assetEvaluationValue,
                      tenant: { connect: { id: TENANT_ID } },
                      seller: { connect: { id: randomSeller.id } },
                      category: { connect: { id: faker.helpers.arrayElement(Object.values(categories)).id } },
                      subcategory: faker.helpers.arrayElement(Object.values(subcategories)) ? { connect: { id: faker.helpers.arrayElement(Object.values(subcategories)).id } } : undefined,
                      imageUrl: assetImageUrl,
                      galleryImageUrls: assetGalleryImages,
                      dataAiHint: faker.lorem.word(),
                      judicialProcess: judicialProcess ? { connect: { id: judicialProcess.id } } : undefined,
                      state: { connect: { id: createdStates[targetState.uf].id } },
                      city: { connect: { id: targetCity.id } },
                    },
                  });
                  createdAssets.push(asset);
                }

                await prisma.lot.create({
                  data: {
                    title: lotTitle,
                    number: `${auctionCounter}-${j + 1}`,
                    status: status as any,
                    auction: { connect: { id: auction.id } },
                    price: lotEvaluationValue,
                    initialPrice: lotEvaluationValue,
                    assets: { create: createdAssets.map(b => ({ assetId: b.id })) },
                    tenant: { connect: { id: TENANT_ID } },
                    bidIncrementStep: faker.number.int({ min: 50, max: 500 }),
                    imageUrl: lotFeaturedImage,
                    galleryImageUrls: getRandomGalleryImages(`lot-gallery-${auction.id}-${j}`, faker.number.int({ min: 2, max: 5 })),
                    state: { connect: { id: createdStates[targetState.uf].id } },
                    city: { connect: { id: targetCity.id } },
                  },
                });

                // Update counts
                lotsPerStateCount[targetState.uf]++;
                if (targetCity.id === capitalCities[targetState.uf].id) {
                  lotsPerCapitalCount[targetState.uf]++;
                }
              }
            }
          }
        }
      }
    }

    console.log(`[DB SEED SAMPLES] ✅ ${createdAuctions.length} leilões de amostra criados com sucesso.`);
    console.log('Contagem de lotes por estado:', lotsPerStateCount);
    console.log('Contagem de lotes por capital:', lotsPerCapitalCount);

  } catch (error: any) {
    console.error(`[DB SEED SAMPLES] ❌ ERRO ao popular dados de amostra: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await seedSampleData();
    console.log('--- [DB SEED SAMPLES] Processo de seed de amostra concluído com sucesso. ---');
  } catch (error) {
    console.error('[DB SEED SAMPLES] ❌ ERRO FATAL durante o processo de seed de amostra:', error);
    process.exit(1);
  }
}

main();
