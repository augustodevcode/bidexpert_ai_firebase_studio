/**
 * @fileoverview Script de Seed Massivo para o Ambiente Demo (BidExpert).
 * 
 * Este script gera uma massa de dados completa para demonstração, seguindo as regras:
 * - Sufixo "Demo [UF/Cidade]" para comitentes, leiloeiros, etc.
 * - Usuários para cada perfil com sufixo ".Demo@bidexpert.com.br".
 * - Senha padrão: "ZPmFhFZS6wLvm!" para todos.
 * - 1 Vara por cidade (principais cidades do Brasil).
 * - Leilões distribuídos ao longo de 2026 (1-2 por dia).
 * - Leilões encerrados/cancelados em Janeiro de 2026.
 * - No mínimo 3 lotes ativos por comitente.
 */

import { PrismaClient, $Enums, ProcessPartyType, AuctionStatus } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
}

// Configurações
const DEMO_PASSWORD = 'ZPmFhFZS6wLvm!';
const DEMO_TENANT_ID = 4; // ID fixo para o tenant Demo

// Dados Geográficos Simplificados (Principais Cidades/UFs)
const BRAZIL_STATES = [
    { uf: 'SP', name: 'São Paulo', cities: ['São Paulo', 'Campinas', 'Guarulhos', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'São José dos Campos', 'Sorocaba', 'Santos'] },
    { uf: 'RJ', name: 'Rio de Janeiro', cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti'] },
    { uf: 'MG', name: 'Minas Gerais', cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba'] },
    { uf: 'BA', name: 'Bahia', cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro'] },
    { uf: 'PR', name: 'Paraná', cities: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu'] },
    { uf: 'RS', name: 'Rio Grande do Sul', cities: ['Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria', 'Gravataí', 'Viamão'] },
    { uf: 'PE', name: 'Pernambuco', cities: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista'] },
    { uf: 'CE', name: 'Ceará', cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'] },
    { uf: 'PA', name: 'Pará', cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal'] },
    { uf: 'SC', name: 'Santa Catarina', cities: ['Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Itajaí', 'Chapecó'] },
    { uf: 'GO', name: 'Goiás', cities: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'] },
    { uf: 'MA', name: 'Maranhão', cities: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon'] },
    { uf: 'ES', name: 'Espírito Santo', cities: ['Serra', 'Vila Velha', 'Cariacica', 'Vitória'] },
    { uf: 'PB', name: 'Paraíba', cities: ['João Pessoa', 'Campina Grande'] },
    { uf: 'RN', name: 'Rio Grande do Norte', cities: ['Natal', 'Mossoró'] },
    { uf: 'AL', name: 'Alagoas', cities: ['Maceió'] },
    { uf: 'PI', name: 'Piauí', cities: ['Teresina'] },
    { uf: 'AM', name: 'Amazonas', cities: ['Manaus'] },
    { uf: 'DF', name: 'Distrito Federal', cities: ['Brasília'] },
    { uf: 'MT', name: 'Mato Grosso', cities: ['Cuiabá', 'Várzea Grande'] },
    { uf: 'MS', name: 'Mato Grosso do Sul', cities: ['Campo Grande'] },
    { uf: 'SE', name: 'Sergipe', cities: ['Aracaju'] },
    { uf: 'RO', name: 'Rondônia', cities: ['Porto Velho'] },
    { uf: 'TO', name: 'Tocantins', cities: ['Palmas'] },
    { uf: 'AC', name: 'Acre', cities: ['Rio Branco'] },
    { uf: 'AP', name: 'Amapá', cities: ['Macapá'] },
    { uf: 'RR', name: 'Roraima', cities: ['Boa Vista'] },
];

async function main() {
    console.log('[DEMO SEED] Iniciando geração de dados para Ambiente Demo...');

    const hashedPassword = await bcryptjs.hash(DEMO_PASSWORD, 10);

    // 1. Garantir Tenant Demo
    const tenant = await prisma.tenant.upsert({
        where: { id: BigInt(DEMO_TENANT_ID) },
        update: { name: 'BidExpert Demo' },
        create: {
            id: BigInt(DEMO_TENANT_ID),
            name: 'BidExpert Demo',
            subdomain: 'demo',
            domain: 'demo.bidexpert.com.br',
            status: 'ACTIVE'
        }
    });

    console.log('[DEMO SEED] Tenant Demo configurado.');

    // 2. Garantir Perfis/Roles
    const roleNames = [
        'ADMIN', 'AUCTIONEER', 'SELLER', 'AUCTION_ANALYST', 'BIDDER', 
        'CONSIGNOR', 'USER', 'TENANT_ADMIN'
    ];

    for (const name of roleNames) {
        await prisma.role.upsert({
            where: { nameNormalized: name.toLowerCase() },
            update: {},
            create: { 
                name, 
                permissions: JSON.stringify(['ALL']),
                nameNormalized: name.toLowerCase()
            }
        });
    }

    // 3. Criar Usuários Demo para cada perfil
    const demoUsers = [
        { email: 'Admin.Demo@bidexpert.com.br', name: 'Administrador Demo', role: 'ADMIN' },
        { email: 'Arrematante.Demo@bidexpert.com.br', name: 'Arrematante Demo', role: 'BIDDER' },
        { email: 'Comitente.Demo@bidexpert.com.br', name: 'Comitente Demo', role: 'CONSIGNOR' },
        { email: 'Advogado.Demo@bidexpert.com.br', name: 'Advogado Demo', role: 'USER' },
        { email: 'Vendedor.Demo@bidexpert.com.br', name: 'Vendedor Demo', role: 'SELLER' },
        { email: 'AnalistaLeiloes.Demo@bidexpert.com.br', name: 'Analista de Leilões Demo', role: 'AUCTION_ANALYST' },
        { email: 'Leiloeiro.Demo@bidexpert.com.br', name: 'Leiloeiro Demo', role: 'AUCTIONEER' },
    ];

    for (const u of demoUsers) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: { password: hashedPassword },
            create: {
                email: u.email,
                fullName: u.name,
                password: hashedPassword,
                tenants: {
                    create: { tenantId: tenant.id }
                },
                roles: {
                    create: {
                        role: { connect: { name: u.role } },
                        assignedBy: 'system'
                    }
                }
            }
        });
        console.log(`[DEMO SEED] Usuário criado: ${u.email}`);
    }

    // 4. Categorias (Standard)
    const categories = [
        { name: 'Imóveis', slug: 'imoveis' },
        { name: 'Veículos', slug: 'veiculos' },
        { name: 'Eletrônicos', slug: 'eletronicos' },
        { name: 'Máquinas e Equipamentos', slug: 'maquinas' },
        { name: 'Sucatas', slug: 'sucatas' },
        { name: 'Mobiliário', slug: 'mobiliario' },
    ];

    const categoryIds: bigint[] = [];
    for (const cat of categories) {
        const c = await prisma.lotCategory.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { name: cat.name, slug: cat.slug, tenantId: tenant.id }
        });
        categoryIds.push(c.id);
    }

    // 5. Estrutura Geográfica, Varas e Comitentes Judiciais
    console.log('[DEMO SEED] Gerando Varas e Comitentes Judiciais...');
    const judicialSellers = [];
    const auctioneers = [];

    // Criar Leiloeiros Oficiais Demo
    for (const state of BRAZIL_STATES.slice(0, 5)) {
        const slug = `leiloeiro-demo-${state.uf.toLowerCase()}`;
        const auctioneer = await prisma.auctioneer.upsert({
            where: { slug },
            update: {},
            create: {
                publicId: uuidv4(),
                name: `Leiloeiro Demo ${state.uf}`,
                registrationNumber: `JUCEP-${state.uf}-${Math.floor(Math.random() * 1000)} demo ${state.uf}`,
                tenantId: tenant.id,
                email: `leiloeiro.${state.uf.toLowerCase()}@demo.bidexpert.com.br`,
                slug
            }
        });
        auctioneers.push(auctioneer);
    }

    for (const state of BRAZIL_STATES) {
        const stateSlug = slugify(state.name);
        const stateRecord = await prisma.state.upsert({
            where: { uf: state.uf },
            update: {},
            create: { 
                name: state.name, 
                uf: state.uf,
                slug: stateSlug
            }
        });

        // Criar Tribunal
        const courtSlug = slugify(`Tribunal de Justica ${state.name}`);
        const courtTj = await prisma.court.upsert({
            where: { slug: courtSlug },
            update: {},
            create: {
                name: `Tribunal de Justiça de ${state.name}`,
                stateUf: state.uf,
                slug: courtSlug
            }
        });

        for (const cityName of state.cities) {
            const citySlug = slugify(`${cityName}-${state.uf}`);
            const city = await prisma.city.upsert({
                where: { name_stateId: { name: cityName, stateId: stateRecord.id } },
                update: {},
                create: { 
                    name: cityName, 
                    stateId: stateRecord.id,
                    slug: citySlug
                }
            });

            // Upsert JudicialDistrict (Comarca)
            const districtSlug = slugify(`Comarca ${cityName} ${state.uf}`);
            const district = await prisma.judicialDistrict.upsert({
                where: { slug: districtSlug },
                update: {},
                create: {
                    name: `Comarca de ${cityName}`,
                    slug: districtSlug,
                    courtId: courtTj.id,
                    stateId: stateRecord.id
                }
            });

            // Upsert JudicialBranch (Vara)
            const branchSlug = slugify(`1 Vara Civel ${cityName} ${state.uf}`);
            let branch = await prisma.judicialBranch.findUnique({ where: { slug: branchSlug } });
            if (!branch) {
                branch = await prisma.judicialBranch.create({
                    data: {
                        name: `1ª Vara Cível de ${cityName}`,
                        slug: branchSlug,
                        districtId: district.id
                    }
                });
            }

            // Upsert Judicial Seller (Comitente vinculado à Vara)
            const sellerSlug = slugify(`Comitente 1 Vara Civel ${cityName} ${state.uf}`);
            const seller = await prisma.seller.upsert({
                where: { slug: sellerSlug },
                update: {},
                create: {
                    publicId: uuidv4(),
                    name: `1ª Vara Cível de ${cityName} - Comitente`,
                    slug: sellerSlug,
                    isJudicial: true,
                    judicialBranchId: branch.id,
                    tenantId: tenant.id,
                    city: cityName,
                    state: state.uf
                }
            });
            // Mantendo a estrutura para uso posterior, mapeando 'court' para 'branch' (a Vara)
            judicialSellers.push({ seller, court: branch, district, city, state: stateRecord });
        }
    }

    // 6. Comitentes Extrajudiciais (Top 100 cidades/bancos)
    const extraSellers = [];
    const banks = ['Banco Demo Brasil', 'Itaú Demo', 'Bradesco Demo', 'Santander Demo', 'Caixa Demo'];
    
    for (let i = 1; i <= 100; i++) {
        const bank = banks[i % banks.length];
        const state = BRAZIL_STATES[i % BRAZIL_STATES.length];
        const city = state.cities[0];
        
        const sellerName = `${bank} - Unidade ${city} Demo ${state.uf}`;
        const sellerSlug = slugify(sellerName);

        const seller = await prisma.seller.upsert({
            where: { slug: sellerSlug },
            update: {},
            create: {
                publicId: uuidv4(),
                name: sellerName,
                slug: sellerSlug,
                tenantId: tenant.id,
                isJudicial: false,
                email: `extra.${i}@demo.bidexpert.com.br`
            }
        });
        extraSellers.push(seller);
    }

    // 7. Gerar Agenda de Leilões para 2026
    console.log('[DEMO SEED] Gerando Agenda de Leilões 2026...');
    const allSellers = [...judicialSellers.map(s => s.seller), ...extraSellers];
    
    for (let i = 0; i < 400; i++) {
        const auctionDate = new Date('2026-01-01T10:00:00Z');
        auctionDate.setDate(auctionDate.getDate() + Math.floor(i / 1.1));
        auctionDate.setHours(10 + (i % 8));
        
        const isCancelled = i < 10 && auctionDate.getMonth() === 0;
        const isFinished = auctionDate < new Date(); 
        
        let status: AuctionStatus = 'EM_BREVE';
        if (isCancelled) status = 'CANCELADO';
        else if (isFinished) status = 'ENCERRADO';
        else if (i % 20 === 0) status = 'ABERTO_PARA_LANCES';

        const seller = allSellers[i % allSellers.length];
        const auctioneer = auctioneers[i % auctioneers.length];
        
        let judicialProcessId = null;
        if (seller.isJudicial) {
            const context = judicialSellers.find(s => s.seller.id === seller.id);
            if (context) {
                const processNumber = `${Math.floor(Math.random() * 9000000)}-${Math.floor(Math.random() * 99)}.${auctionDate.getFullYear()}.8.${context.state.uf === 'SP' ? '26' : '19'}.${Math.floor(Math.random() * 9999)}`;
                const process = await prisma.judicialProcess.upsert({
                    where: { processNumber_tenantId: { processNumber, tenantId: tenant.id } },
                    update: {},
                    create: {
                        publicId: uuidv4(),
                        processNumber,
                        branchId: context.court.id,
                        districtId: context.district.id,
                        tenantId: tenant.id,
                        parties: {
                            create: [
                                { name: `Autor Demo ${i}`, partyType: 'AUTOR', tenantId: tenant.id },
                                { name: `Réu Demo ${i}`, partyType: 'REU', tenantId: tenant.id }
                            ]
                        }
                    }
                });
                judicialProcessId = process.id;
            }
        }

        const auctionSlug = slugify(`leilao-demo-${i}-2026`);
        const auctionTitle = `${seller.isJudicial ? 'Leilão Judicial' : 'Venda Extrajudicial'} Demo - ${seller.name}`;

        const auction = await prisma.auction.upsert({
             where: { slug: auctionSlug },
             update: {},
             create: {
                publicId: uuidv4(),
                slug: auctionSlug,
                title: auctionTitle,
                description: `Oportunidade Demo para ${seller.name}. Confira os lotes disponíveis.`,
                auctionDate: auctionDate,
                auctionType: seller.isJudicial ? 'JUDICIAL' : 'EXTRAJUDICIAL',
                status: status,
                tenantId: tenant.id,
                sellerId: seller.id,
                auctioneerId: auctioneer.id,
                judicialProcessId: judicialProcessId,
                number: `2026-${i.toString().padStart(4, '0')}`,
            }
        });

        const numLots = 3 + (i % 3);
        const categoryId = categoryIds[i % categoryIds.length];
        
        // Imagens de Exemplo (Placeholders)
        const vehicleImages = [
            'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
            'https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&q=80',
            'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'
        ];
        const propertyImages = [
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
            'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=800&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
        ];

        for (let j = 1; j <= numLots; j++) {
            const initialPrice = 50000 + (Math.random() * 1000000);
            const lotNumber = j.toString().padStart(3, '0');
            const isVehicle = i % 2 !== 0; // Alternar entre Imóvel e Veículo por leilão
            const lotImage = isVehicle ? vehicleImages[j % 3] : propertyImages[j % 3];
            const assetSubtype = isVehicle ? 'VEICULO' : 'IMOVEL';

            // 2. Criar ou Atualizar Lote
            const lot = await prisma.lot.upsert({
                where: { auctionId_number: { auctionId: auction.id, number: lotNumber } },
                update: { imageUrl: lotImage },
                create: {
                    publicId: uuidv4(),
                    number: lotNumber,
                    title: `Lote Demo ${j} - ${auction.title}`,
                    description: `Descrição detalhada do Lote Demo ${j}. Produto em excelente estado de conservação (Fictício).`,
                    initialPrice: initialPrice,
                    price: initialPrice,
                    bidIncrementStep: 1000,
                    status: status === 'ENCERRADO' ? 'VENDIDO' : 'ABERTO_PARA_LANCES',
                    tenantId: tenant.id,
                    auctionId: auction.id,
                    type: assetSubtype,
                    categoryId: categoryId,
                    imageUrl: lotImage
                }
            });

            // Verificar se o lote já possui ativos vinculados
            const existingAssets = await prisma.assetsOnLots.findFirst({
                where: { lotId: lot.id }
            });

            if (!existingAssets) {
                // Criar Asset e Vincular
                 const assetTitle = `${isVehicle ? 'Veículo' : 'Imóvel'} Modelo Demo ${j} - ${seller.state || 'BR'}`;
                 const assetSlug = slugify(`${assetTitle}-${auction.slug}-${lotNumber}`);

                 // Mídia
                 const mediaItem = await prisma.mediaItem.create({
                    data: {
                        fileName: `demo-${assetSlug}.jpg`,
                        storagePath: `demo/${assetSlug}.jpg`,
                        urlOriginal: lotImage,
                        mimeType: 'image/jpeg',
                        tenantId: tenant.id
                    }
                });

                const asset = await prisma.asset.create({
                    data: {
                        publicId: uuidv4(),
                        title: assetTitle,
                        description: `Bem em bom estado de conservação, localizado em ${seller.city || 'Cidade Demo'} - ${seller.state || 'UF'}.`,
                        status: 'DISPONIVEL',
                        tenantId: tenant.id,
                        imageUrl: lotImage,
                        imageMediaId: mediaItem.id,
                        evaluationValue: initialPrice * 1.2,
                        categoryId: categoryId
                    }
                });

                await prisma.assetsOnLots.create({
                    data: {
                        lotId: lot.id,
                        assetId: asset.id,
                        tenantId: tenant.id,
                        assignedBy: 'system'
                    }
                });
            }

            // 3. Gerar Lances Simulados (Bids)
            // Se o leilão estiver Aberto ou Encerrado/Vendido, gerar histórico de lances
            if (status === 'ABERTO_PARA_LANCES' || status === 'ENCERRADO' || status === 'VENDIDO') {
                const numBids = Math.floor(Math.random() * 10) + 1; // 1 a 10 lances
                let currentPrice = Number(initialPrice);
                
                // Pegar um usuário 'Arrematante' aleatório (aqui pegamos o fixo ou criamos outros se necessário, usaremos o fixo por enquanto)
                const bidderUser = await prisma.user.findFirst({ where: { email: 'Arrematante.Demo@bidexpert.com.br' } });

                if (bidderUser) {
                    for (let k = 0; k < numBids; k++) {
                        currentPrice += 1000 + (Math.random() * 500); // Incremento variável
                        
                        await prisma.bid.create({
                            data: {
                                amount: currentPrice,
                                bidderId: bidderUser.id,
                                lotId: lot.id,
                                auctionId: auction.id,
                                tenantId: tenant.id,
                                timestamp: new Date(auctionDate.getTime() - (1000 * 60 * 60) + (k * 1000 * 60 * 5)), // Lances distribuídos na última hora
                                bidderDisplay: 'Arrematante Demo'
                            }
                        });
                    }
                    
                    // Atualizar preço atual do lote
                    await prisma.lot.update({
                        where: { id: lot.id },
                        data: { price: currentPrice, bidsCount: numBids }
                    });

                    // Se vendido, registrar vencedor
                    if (status === 'ENCERRADO' || status === 'VENDIDO') {
                       // Opcional: Criar UserWin se necessário
                    }
                }
            }
        }
    }

    console.log('[DEMO SEED] ✅ Operação concluída com sucesso!');
}

main().catch((e) => {
    console.error('[DEMO SEED] ❌ Erro:', e);
    process.exit(1);
}).finally(() => prisma.$disconnect());
