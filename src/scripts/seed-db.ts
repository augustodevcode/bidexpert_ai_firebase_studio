// src/scripts/seed-db.ts
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { slugify } from '../src/lib/ui-helpers';

const prisma = new PrismaClient();

const essentialRoles = [
  { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', description: 'Acesso total a todas as funcionalidades.', permissions: 'manage_all' },
  { name: 'Consignor', nameNormalized: 'CONSIGNOR', description: 'Pode gerenciar próprios leilões e lotes.', permissions: 'consignor_dashboard:view,auctions:manage_own,lots:manage_own' },
  { name: 'Auction Analyst', nameNormalized: 'AUCTION_ANALYST', description: 'Analisa e aprova habilitações de usuários.', permissions: 'users:manage_habilitation,reports:view' },
  { name: 'Bidder', nameNormalized: 'BIDDER', description: 'Usuário habilitado para dar lances.', permissions: 'place_bids' },
  { name: 'User', nameNormalized: 'USER', description: 'Usuário padrão com acesso de visualização.', permissions: 'view_auctions,view_lots' },
  { name: 'Tenant Admin', nameNormalized: 'TENANT_ADMIN', description: 'Administrador de um tenant específico.', permissions: 'manage_tenant_users,manage_tenant_auctions' },
  { name: 'Financial', nameNormalized: 'FINANCIAL', description: 'Gerencia pagamentos e faturamento.', permissions: 'financial:view,financial:manage' },
  { name: 'Auctioneer', nameNormalized: 'AUCTIONEER', description: 'Leiloeiro responsável por conduzir leilões.', permissions: 'conduct_auctions' },
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
        // ... (dataSources array remains the same)
    ];

    for (const source of dataSources) {
        await prisma.dataSource.upsert({
            where: { modelName: source.modelName },
            update: { fields: source.fields as any, name: source.name },
            create: { name: source.name, modelName: source.modelName, fields: source.fields as any },
        });
    }

    console.log(`[DB SEED] ✅ SUCCESS: ${dataSources.length} data sources processed.`);
}

async function seedEssentialData() {
  console.log('--- [DB SEED] Starting essential data seeding ---');
  
  try {
    console.log('[DB SEED] Seeding Roles...');
    for (const role of essentialRoles) {
      await prisma.role.upsert({
        where: { nameNormalized: role.nameNormalized },
        update: { description: role.description, permissions: role.permissions.split(',') },
        create: { name: role.name, nameNormalized: role.nameNormalized, description: role.description, permissions: role.permissions.split(',') },
      });
    }
    console.log(`[DB SEED] ✅ SUCCESS: ${essentialRoles.length} roles processed.`);

    console.log('[DB SEED] Seeding Landlord Tenant...');
    const landlordTenant = await prisma.tenant.upsert({
        where: { id: "1" },
        update: {},
        create: { id: "1", name: 'Landlord', subdomain: 'www', domain: 'bidexpert.com.br' },
    });
    console.log('[DB SEED] ✅ SUCCESS: Landlord tenant ensured.');
    
    console.log('[DB SEED] Seeding Platform Settings for Landlord...');
    const platformSettings = await prisma.platformSettings.upsert({
        where: { tenantId: landlordTenant.id },
        update: {},
        create: {
            tenant: { connect: { id: landlordTenant.id } },
            siteTitle: 'BidExpert',
            siteTagline: 'Sua plataforma de leilões online.',
        }
    });
    console.log('[DB SEED] ✅ SUCCESS: Main platform settings for landlord ensured.');

    // Seed test users
    console.log('[DB SEED] Seeding Test Users...');
    const testUsers = [
        { email: 'bidder@bidexpert.com.br', fullName: 'Arrematante de Teste', password: 'senha@123', roleName: 'BIDDER' },
        { email: 'comit@bidexpert.com.br', fullName: 'Comitente de Teste', password: 'senha@123', roleName: 'CONSIGNOR' },
        { email: 'leilo@bidexpert.com.br', fullName: 'Leiloeiro de Teste', password: 'senha@123', roleName: 'AUCTIONEER' },
    ];

    for (const userData of testUsers) {
        let user = await prisma.user.findUnique({ where: { email: userData.email } });
        if (!user) {
            const hashedPassword = await bcryptjs.hash(userData.password, 10);
            const role = await prisma.role.findUnique({ where: { nameNormalized: userData.roleName } });
            if (!role) {
                console.error(`[DB SEED] ❌ ERROR: Role '${userData.roleName}' not found for test user.`);
                continue;
            }

            user = await prisma.user.create({
                data: {
                    email: userData.email,
                    fullName: userData.fullName,
                    password: hashedPassword,
                    habilitationStatus: 'HABILITADO', // Habilitado para facilitar testes
                    accountType: 'PHYSICAL',
                    roles: { create: { role: { connect: { id: role.id } }, assignedBy: 'system-seed' } },
                    tenants: { create: { tenant: { connect: { id: landlordTenant.id } }, assignedBy: 'system-seed' } }
                }
            });
            console.log(`[DB SEED] ✅ SUCCESS: Test user '${userData.email}' created.`);
        }
    }


    console.log('[DB SEED] Seeding Admin User...');
    const adminEmail = 'admin@bidexpert.com.br';
    const adminPassword = 'Admin@123';
    let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!adminUser) {
        const hashedPassword = await bcryptjs.hash(adminPassword, 10);
        const adminRole = await prisma.role.findUnique({ where: { nameNormalized: 'ADMINISTRATOR' } });
        if (!adminRole) throw new Error("ADMINISTRATOR role not found.");

        adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                fullName: 'Administrador',
                password: hashedPassword,
                habilitationStatus: 'HABILITADO',
                accountType: 'LEGAL',
                roles: { create: { role: { connect: { id: adminRole.id } }, assignedBy: 'system-seed' } },
                tenants: { create: { tenant: { connect: { id: landlordTenant.id } }, assignedBy: 'system-seed' } }
            }
        });
        console.log('[DB SEED] ✅ SUCCESS: Admin user created.');
    } else {
        const adminTenantLink = await prisma.usersOnTenants.findUnique({ where: { userId_tenantId: { userId: adminUser.id, tenantId: landlordTenant.id } } });
        if (!adminTenantLink) {
            await prisma.usersOnTenants.create({ data: { userId: adminUser.id, tenantId: landlordTenant.id, assignedBy: 'system-seed-fix' } });
        }
    }
    
    console.log('[DB SEED] Seeding Brazilian States...');
    for (const state of brazilianStates) {
        await prisma.state.upsert({
            where: { uf: state.uf },
            update: { name: state.name },
            create: { name: state.name, uf: state.uf, slug: slugify(state.name) },
        });
    }
    console.log(`[DB SEED] ✅ SUCCESS: ${brazilianStates.length} states processed.`);
    
    await seedDataSources();

  } catch (error: any) {
    console.error(`[DB SEED] ❌ ERROR seeding essential data: ${error.message}`);
    throw error;
  }
}

async function main() {
    console.log('--- [DB SEED] Starting Full Database Seeding Process ---');
    try {
        await seedEssentialData();
    } catch (error) {
        console.error("[DB SEED] ❌ FATAL ERROR during seeding process:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
