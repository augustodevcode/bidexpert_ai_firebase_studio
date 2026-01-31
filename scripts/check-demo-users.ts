/**
 * Script para verificar usuários na base bidexpert_demo
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  // Usa a DATABASE_URL do .env.demo
  const prisma = new PrismaClient({
    datasources: { db: { url: 'mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_demo' } }
  });
  
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, password: true },
      take: 20
    });
    
    console.log('📋 Usuários na base bidexpert_demo:\n');
    for (const u of users) {
      const testDemo = await bcrypt.compare('demo@123', u.password);
      const testTest = await bcrypt.compare('Test@12345', u.password);
      const testAdmin = await bcrypt.compare('Admin@123', u.password);
      console.log(`  ${u.email}`);
      console.log(`    - demo@123: ${testDemo ? '✅' : '❌'} | Test@12345: ${testTest ? '✅' : '❌'} | Admin@123: ${testAdmin ? '✅' : '❌'}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
