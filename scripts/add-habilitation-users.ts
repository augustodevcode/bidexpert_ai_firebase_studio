/**
 * Script INCREMENTAL - Adiciona apenas usuários com diferentes status de habilitação
 * Para uso em ambiente DEMO já existenteSEM limpar dados.
 */
import{PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addHabilitationUsers() {
  try {
    console.log('\n📋 Iniciando criação de usuários de habilitação...\n');

    // Buscar tenant DEMO
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'demo' }
    });

    if (!tenant) {
      console.error('❌ Tenant DEMO não encontrado!');
      return;
    }

    console.log(`✅ Usando tenant: ${tenant.name} (ID: ${tenant.id})\n`);

    // Buscar role COMPRADOR
    const compradorRole = await prisma.role.findFirst({
      where: { name: 'COMPRADOR' }
    });

    if (!compradorRole) {
      console.error('❌ Role COMPRADOR não encontrada!');
      return;
    }

    // Buscar tipos de documento
    const rgType = await prisma.documentType.findFirst({ where: { name: 'RG' } });
    const cpfType = await prisma.documentType.findFirst({ where: { name: 'CPF' } });
    const enderecoType = await prisma.documentType.findFirst({ where: { name: 'Comprovante de Endereço' } });

    const senhaHash = await bcrypt.hash('Test@12345', 10);
    const uniqueSuffix = Date.now();
    const habilitationUsers = [];

   // 1. Usuários com PENDING_DOCUMENTS (Aguardando Documentos)
    console.log('📝 Criando usuários com PENDING_DOCUMENTS...');
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          email: `pendente.docs${i}.${uniqueSuffix}@email.com`,
          password: senhaHash,
          fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
          cpf: faker.string.numeric(11),
          cellPhone: faker.phone.number(),
          accountType: 'PHYSICAL',
          habilitationStatus: 'PENDING_DOCUMENTS',
          updatedAt: new Date(Date.now() - i * 86400000),
        },
      });

      await prisma.usersOnRoles.create({
        data: { userId: user.id, roleId: compradorRole.id, assignedBy: 'system' },
      });

      await prisma.usersOnTenants.create({
        data: { userId: user.id, tenantId: tenant.id },
      });

      habilitationUsers.push(user);
    }
    console.log(`✅ 5 usuários PENDING_DOCUMENTS criados\n`);

    // 2. Usuários com PENDING_ANALYSIS (Em Análise)
    console.log('🔍 Criando usuários com PENDING_ANALYSIS...');
    for (let i = 1; i <= 8; i++) {
      const user = await prisma.user.create({
        data: {
          email: `em.analise${i}.${uniqueSuffix}@email.com`,
          password: senhaHash,
          fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
          cpf: faker.string.numeric(11),
          rgNumber: faker.string.numeric(9),
          rgIssuer: 'SSP/SP',
          cellPhone: faker.phone.number(),
          dateOfBirth: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
          accountType: 'PHYSICAL',
          habilitationStatus: 'PENDING_ANALYSIS',
          updatedAt: new Date(Date.now() - i * 43200000),
        },
      });

      await prisma.usersOnRoles.create({
        data: { userId: user.id, roleId: compradorRole.id, assignedBy: 'system' },
      });

      await prisma.usersOnTenants.create({
        data: { userId: user.id, tenantId: tenant.id },
      });

      habilitationUsers.push(user);
    }
    console.log(`✅ 8 usuários PENDING_ANALYSIS criados\n`);

    // 3. Usuários com REJECTED_DOCUMENTS (Documentos Rejeitados)
    console.log('❌ Criando usuários com REJECTED_DOCUMENTS...');
    for (let i = 1; i <= 4; i++) {
      const user = await prisma.user.create({
        data: {
          email: `rejeitado${i}.${uniqueSuffix}@email.com`,
          password: senhaHash,
          fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
          cpf: faker.string.numeric(11),
          cellPhone: faker.phone.number(),
          accountType: 'PHYSICAL',
          habilitationStatus: 'REJECTED_DOCUMENTS',
          updatedAt: new Date(Date.now() - i * 21600000),
        },
      });

      await prisma.usersOnRoles.create({
        data: { userId: user.id, roleId: compradorRole.id, assignedBy: 'system' },
      });

      await prisma.usersOnTenants.create({
        data: { userId: user.id, tenantId: tenant.id },
      });

      habilitationUsers.push(user);
    }
    console.log(`✅ 4 usuários REJECTED_DOCUMENTS criados\n`);

    // 4. Usuários com BLOCKED (Bloqueados)
    console.log('🚫 Criando usuários com BLOCKED...');
    for (let i = 1; i <= 2; i++) {
      const user = await prisma.user.create({
        data: {
          email: `bloqueado${i}.${uniqueSuffix}@email.com`,
          password: senhaHash,
          fullName: `${faker.person.firstName()} ${faker.person.lastName()}`,
          cpf: faker.string.numeric(11),
          accountType: 'PHYSICAL',
          habilitationStatus: 'BLOCKED',
          updatedAt: new Date(Date.now() - i * 172800000),
        },
      });

      await prisma.usersOnRoles.create({
        data: { userId: user.id, roleId: compradorRole.id, assignedBy: 'system' },
      });

      await prisma.usersOnTenants.create({
        data: { userId: user.id, tenantId: tenant.id },
      });

      habilitationUsers.push(user);
    }
    console.log(`✅ 2 usuários BLOCKED criados\n`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`\n📊 Resumo:`);
    console.log(`   - Total de usuários adicionados: ${habilitationUsers.length}`);
    console.log(`   - 5 com PENDING_DOCUMENTS`);
    console.log(`   - 8 com PENDING_ANALYSIS`);
    console.log(`   - 4 com REJECTED_DOCUMENTS`);
    console.log(`   - 2 com BLOCKED`);
    console.log(`\n🔐 Senha para todos: Test@12345\n`);

  } catch (error) {
    console.error('\n❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addHabilitationUsers();
