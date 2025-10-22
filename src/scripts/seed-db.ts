
// src/scripts/seed-db.ts
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { slugify } from '../lib/ui-helpers';

const prisma = new PrismaClient();

/**
 * Dados essenciais para o funcionamento da plataforma.
 */
const essentialRoles = [
  { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', description: 'Acesso total a todas as funcionalidades.', permissions: 'manage_all' },
  { name: 'Consignor', nameNormalized: 'CONSIGNOR', description: 'Pode gerenciar próprios leilões e lotes.', permissions: 'consignor_dashboard:view,auctions:manage_own,lots:manage_own' },
  { name: 'Auction Analyst', nameNormalized: 'AUCTION_ANALYST', description: 'Analisa e aprova habilitações de usuários.', permissions: 'users:manage_habilitation,reports:view' },
  { name: 'Bidder', nameNormalized: 'BIDDER', description: 'Usuário habilitado para dar lances.', permissions: 'place_bids' },
  { name: 'User', nameNormalized: 'USER', description: 'Usuário padrão com acesso de visualização.', permissions: 'view_auctions,view_lots' },
  { name: 'Tenant Admin', nameNormalized: 'TENANT_ADMIN', description: 'Administrador de um tenant específico.', permissions: 'manage_tenant_users,manage_tenant_auctions' },
  { name: 'Financeiro', nameNormalized: 'FINANCIAL', description: 'Gerencia pagamentos e faturamento.', permissions: 'financial:view,financial:manage' },
];

const brazilianStates = [
  { name: 'Acre', uf: 'AC' }, { name: 'Alagoas', uf: 'AL' }, { name: 'Amapá', uf: 'AP' },
  { name: 'Amazonas', uf: 'AM' }, { name: 'Bahia', uf: 'BA' }, { name: 'Ceará', uf: 'CE' },
  { name: 'Distrito Federal', uf: 'DF' }, { name: 'Espírito Santo', uf: 'ES' }, { name: 'Goiás', uf: 'GO' },
  { name: 'Maranhão', uf: 'MA' }, { name: 'Mato Grosso', uf: 'MT' }, { name: 'Mato Grosso do Sul', uf: 'MS' },
  { name: 'Minas Gerais', uf: 'MG' }, { name: 'Pará', uf: 'PA' }, { name: 'Paraíba', uf: 'PB' },
  { name: 'Paraná', uf: 'PR' }, { name: 'Pernambuco', uf: 'PE' }, { name: 'Piauí', uf: 'PI' },
  { name: 'Rio de Janeiro', uf: 'RJ' }, { name: 'Rio Grande do Norte', uf: 'RN' },
  { name: 'Rio Grande do Sul', uf: 'RS' }, { name: 'Rondônia', uf: 'RO' }, { name: 'Roraima', uf: 'RR' },
  { name: 'Santa Catarina', uf: 'SC' }, { name: 'São Paulo', uf: 'SP' }, { name: 'Sergipe', uf: 'SE' },
  { name: 'Tocantins', uf: 'TO' }
];

async function seedDataSources() {
    console.log('[DB SEED] Seeding Data Sources for Report Builder...');
    
    const dataSources = [
        {
            name: 'Leilões',
            modelName: 'Auction',
            fields: [
                { name: 'title', type: 'String' },
                { name: 'status', type: 'String' },
                { name: 'auctionDate', type: 'DateTime' },
                { name: 'endDate', type: 'DateTime' },
                { name: 'totalLots', type: 'Int' },
                { name: 'initialOffer', type: 'Decimal' },
                { name: 'visits', type: 'Int' },
            ]
        },
        {
            name: 'Lotes',
            modelName: 'Lot',
            fields: [
                { name: 'title', type: 'String' },
                { name: 'number', type: 'String' },
                { name: 'status', type: 'String' },
                { name: 'price', type: 'Decimal' },
                { name: 'initialPrice', type: 'Decimal' },
                { name: 'bidsCount', type: 'Int' },
                { name: 'views', type: 'Int' },
                { name: 'auctionName', type: 'String' },
            ]
        },
        {
            name: 'Usuários',
            modelName: 'User',
            fields: [
                { name: 'fullName', type: 'String' },
                { name: 'email', type: 'String' },
                { name: 'habilitationStatus', type: 'String' },
                { name: 'accountType', type: 'String' },
            ]
        },
        {
            name: 'Comitentes',
            modelName: 'Seller',
            fields: [
                { name: 'name', type: 'String' },
                { name: 'contactName', type: 'String' },
                { name: 'email', type: 'String' },
                { name: 'city', type: 'String' },
                { name: 'state', type: 'String' },
            ]
        },
         {
            name: 'Leiloeiros',
            modelName: 'Auctioneer',
            fields: [
                { name: 'name', type: 'String' },
                { name: 'registrationNumber', type: 'String' },
                { name: 'email', type: 'String' },
                { name: 'city', type: 'String' },
                { name: 'state', type: 'String' },
            ]
        },
    ];

    for (const source of dataSources) {
        await prisma.dataSource.upsert({
            where: { modelName: source.modelName },
            update: {
                fields: source.fields,
                name: source.name,
            },
            create: {
                name: source.name,
                modelName: source.modelName,
                fields: source.fields,
            },
        });
    }

    console.log(`[DB SEED] ✅ SUCCESS: ${dataSources.length} data sources processed.`);
}

async function seedEssentialData() {
  console.log('--- [DB SEED] Starting essential data seeding ---');
  
  try {
    // 1. Seed Roles
    console.log('[DB SEED] Seeding Roles...');
    for (const role of essentialRoles) {
      await prisma.role.upsert({
        where: { nameNormalized: role.nameNormalized },
        update: {
          description: role.description,
          permissions: role.permissions.split(','),
        },
        create: {
          name: role.name,
          nameNormalized: role.nameNormalized,
          description: role.description,
          permissions: role.permissions.split(','),
        },
      });
    }
    console.log(`[DB SEED] ✅ SUCCESS: ${essentialRoles.length} roles processed.`);

    // 2. Seed Landlord Tenant
    console.log('[DB SEED] Seeding Landlord Tenant...');
    const landlordTenant = await prisma.tenant.upsert({
        where: { id: "1" },
        update: {},
        create: { id: "1", name: 'Landlord', subdomain: 'www', domain: 'bidexpert.com.br' },
    });
    console.log('[DB SEED] ✅ SUCCESS: Landlord tenant ensured.');
    
    // 3. Seed Platform Settings for Landlord
    console.log('[DB SEED] Seeding Platform Settings for Landlord...');
    await prisma.platformSettings.upsert({
        where: { tenantId: landlordTenant.id },
        update: {},
        create: {
            tenant: { connect: { id: landlordTenant.id } },
            siteTitle: 'BidExpert',
            siteTagline: 'Sua plataforma de leilões online.',
            galleryImageBasePath: '/uploads/media/',
            searchPaginationType: 'loadMore',
            searchItemsPerPage: 12,
            searchLoadMoreCount: 12,
            showCountdownOnLotDetail: true,
            showCountdownOnCards: true,
            showRelatedLotsOnLotDetail: true,
            relatedLotsCount: 4,
            defaultListItemsPerPage: 10,
        }
    });
    console.log('[DB SEED] ✅ SUCCESS: Default platform settings for landlord ensured.');

    // 4. Seed Admin User
    console.log('[DB SEED] Seeding Admin User...');
    const adminEmail = 'admin@bidexpert.com.br';
    const adminPassword = 'Admin@123';
    let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!adminUser) {
        const hashedPassword = await bcryptjs.hash(adminPassword, 10);
        const adminRole = await prisma.role.findUnique({ where: { nameNormalized: 'ADMINISTRATOR' } });
        if (!adminRole) {
            throw new Error("ADMINISTRATOR role not found. Seeding roles might have failed.");
        }

        adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                fullName: 'Administrador',
                password: hashedPassword,
                habilitationStatus: 'HABILITADO',
                accountType: 'LEGAL',
                roles: {
                    create: {
                        role: { connect: { id: adminRole.id } },
                        assignedBy: 'system-seed'
                    }
                },
                tenants: {
                    create: {
                        tenant: { connect: { id: landlordTenant.id } },
                        assignedBy: 'system-seed'
                    }
                }
            }
        });
        console.log('[DB SEED] ✅ SUCCESS: Admin user created.');
    } else {
        const adminTenantLink = await prisma.usersOnTenants.findUnique({
            where: { userId_tenantId: { userId: adminUser.id, tenantId: landlordTenant.id } }
        });
        if (!adminTenantLink) {
            await prisma.usersOnTenants.create({
                data: {
                    userId: adminUser.id,
                    tenantId: landlordTenant.id,
                    assignedBy: 'system-seed-fix'
                }
            });
            console.log('[DB SEED] Admin user already existed and was linked to Landlord tenant.');
        } else {
            console.log('[DB SEED] Admin user already exists and is linked.');
        }
    }
    
    // 5. Seed States
    console.log('[DB SEED] Seeding Brazilian States...');
    for (const state of brazilianStates) {
        await prisma.state.upsert({
            where: { uf: state.uf },
            update: { name: state.name },
            create: { name: state.name, uf: state.uf, slug: slugify(state.name) },
        });
    }
    console.log(`[DB SEED] ✅ SUCCESS: ${brazilianStates.length} states processed.`);
    
    // 6. Seed Data Sources
    await seedDataSources();

  } catch (error: any) {
    console.error(`[DB SEED] ❌ ERROR seeding essential data: ${error.message}`);
    throw error; // Throw error to stop the process if essential data fails
  }
}


async function main() {
    console.log('--- [DB SEED] Starting Full Database Seeding Process ---');
    try {
        await seedEssentialData();
        // The seedDataSources function is now called from within seedEssentialData
        // console.log('--- [DB SEED] You can add demo data seeding logic here if needed. ---');
    } catch (error) {
        console.error("[DB SEED] ❌ FATAL ERROR during seeding process:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
