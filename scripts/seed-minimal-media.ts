/**
 * @fileoverview Minimal seed para testes da biblioteca de mídia.
 * Cria apenas 1 tenant (dev) e 1 usuário admin.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed mínima para biblioteca de mídia...');

  // Criar tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'dev' },
    update: {},
    create: {
      name: 'Dev Environment',
      subdomain: 'dev',
    },
  });

  console.log(`✅ Tenant criado: ${tenant.subdomain}`);

  // Criar usuário admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bidexpert.com.br' },
    update: {},
    create: {
      email: 'admin@bidexpert.com.br',
      password: 'Admin@123', // Será hasheado no login
      fullName: 'Admin Dev',
    },
  });

  console.log(`✅ Usuário criado: ${adminUser.email}`);

  // Associar usuário ao tenant
  await prisma.userOnTenant.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: adminUser.id,
      tenantId: tenant.id,
    },
  });

  console.log(`✅ Usuário associado ao tenant`);

  // Criar alguns usuários de teste
  const testUsers = [
    { email: 'user@bidexpert.com.br', name: 'Test User' },
    { email: 'buyer@bidexpert.com.br', name: 'Test Buyer' },
  ];

  for (const testUser of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: {
        email: testUser.email,
        password: 'Test@12345',
        fullName: testUser.name,
      },
    });
    
    await prisma.userOnTenant.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      update: {},
      create: {
        userId: user.id,
        tenantId: tenant.id,
      },
    });
    
    console.log(`✅ Usuário criado: ${testUser.email}`);
  }

  console.log('\n🎉 Seed mínima completa!');
  console.log('Credenciais de teste:');
  console.log('  Email: admin@bidexpert.com.br');
  console.log('  Senha: Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
