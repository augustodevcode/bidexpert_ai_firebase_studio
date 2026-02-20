/**
 * Seed dedicado para criar 10 bots arrematantes para simulação E2E robótica.
 * Gera usuários novos por execução e salva credenciais em test-results/robot-bots.json.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();

type RobotBot = {
  index: number;
  name: string;
  email: string;
  password: string;
};

async function main() {
  const password = process.env.ROBOT_BOT_PASSWORD || 'Bot@123456';
  const runId = Date.now().toString();

  const tenant = await prisma.tenant.findFirst({ orderBy: { id: 'asc' } });
  if (!tenant) {
    throw new Error('Nenhum tenant encontrado para associar bots.');
  }

  const bidderRole =
    (await prisma.role.findFirst({ where: { name: 'COMPRADOR' } })) ??
    (await prisma.role.findFirst({ where: { name: 'ARREMATANTE' } })) ??
    (await prisma.role.findFirst({ where: { name: 'BIDDER' } }));

  if (!bidderRole) {
    throw new Error('Role de arrematante/comprador não encontrada.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const bots: RobotBot[] = [];

  for (let i = 1; i <= 10; i++) {
    const email = `robot.arrematante.${runId}.${i}@bidexpert.com.br`;
    const name = `Robot Arrematante ${i}`;
    const cpf = `99999999${(100 + i).toString().slice(-3)}`.padEnd(11, '0');

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        fullName: name,
        cpf,
      },
    });

    await (prisma as any).userOnTenant.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id,
        },
      },
      update: { assignedBy: 'robot-seed' },
      create: {
        userId: user.id,
        tenantId: tenant.id,
        assignedBy: 'robot-seed',
      },
    });

    await prisma.usersOnRoles.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: bidderRole.id,
        },
      },
      update: { assignedBy: 'robot-seed' },
      create: {
        userId: user.id,
        roleId: bidderRole.id,
        assignedBy: 'robot-seed',
      },
    });

    bots.push({
      index: i,
      name,
      email,
      password,
    });
  }

  const outputDir = path.join(process.cwd(), 'test-results');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'robot-bots.json');
  fs.writeFileSync(outputFile, JSON.stringify({ runId, tenantId: tenant.id.toString(), bots }, null, 2), 'utf8');

  console.log(`✅ Bots criados: ${bots.length}`);
  console.log(`📄 Credenciais salvas em: ${outputFile}`);
}

main()
  .catch((error) => {
    console.error('❌ Erro ao criar bots robóticos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
