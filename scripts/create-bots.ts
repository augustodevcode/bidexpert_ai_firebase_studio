// Script para criar 10 usuários bot (arrematantes) para teste E2E
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const botNames = [
  'João Silva',
  'Maria Santos',
  'Pedro Oliveira',
  'Ana Costa',
  'Carlos Ferreira',
  'Lucia Rodrigues',
  'Fernando Almeida',
  'Patricia Lima',
  'Ricardo Souza',
  'Juliana Pereira',
];

async function main() {
  console.log('🤖 Criando 10 usuários bot (arrematantes)...');

  // Buscar tenant existente
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('Nenhum tenant encontrado. Rode o seed primeiro.');
  }

  const passwordHash = await bcrypt.hash('Bot@123', 10);
  const bots = [];

  for (let i = 0; i < botNames.length; i++) {
    const name = botNames[i];
    const email = `bot${i + 1}@bidexpert.com.br`;
    const publicId = `BOT-${String(i + 1).padStart(3, '0')}`;

    try {
      const bot = await prisma.user.create({
        data: {
          publicId,
          email,
          name,
          password: passwordHash,
          role: 'BIDDER',
          tenantId: tenant.id,
        },
      });
      bots.push(bot);
      console.log(`✅ Bot criado: ${bot.name} (${bot.email})`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️ Bot já existe: ${email}`);
        const existingBot = await prisma.user.findUnique({ where: { email } });
        if (existingBot) bots.push(existingBot);
      } else {
        throw error;
      }
    }
  }

  console.log(`\n🎉 ${bots.length} bots criados com sucesso!`);
  console.log('\n📋 Credenciais dos bots:');
  console.log('   Email: bot1@bidexpert.com.br até bot10@bidexpert.com.br');
  console.log('   Senha: Bot@123');

  return bots;
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar bots:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
