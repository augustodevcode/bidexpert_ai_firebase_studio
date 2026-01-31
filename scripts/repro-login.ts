
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Debugging Login Issue ---');
  
  const email = 'admin@bidexpert.ai';
  const password = 'senha@123';
  const expectedTenantId = '3'; // Demo tenant ID

  // 1. Fetch User with relations
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenants: {
          include: {
              tenant: true
          }
      },
      roles: true
    }
  });

  if (!user) {
    console.error(`❌ User ${email} not found in database.`);
    return;
  }

  console.log(`✅ User found: ID=${user.id}`);
  console.log(`   Hash in DB: ${user.password}`);

  // 2. Validate Password with bcryptjs (same lib as action)
  const isPasswordValid = await bcryptjs.compare(password, user.password || '');
  
  console.log(`   Password 'senha@123' valid? ${isPasswordValid ? 'YES ✅' : 'NO ❌'}`);

  if (!isPasswordValid) {
      console.log('   (Re-hashing password to fix...)');
      const newHash = await bcryptjs.hash(password, 10);
      await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash }
      });
      console.log('   (Password updated with bcryptjs hash)');
  }

  // 3. Validate Tenant Association
  console.log('   Tenants linked:');
  user.tenants.forEach(t => {
      console.log(`   - [${t.tenantId}] ${t.tenant.subdomain}`);
  });

  const isLinked = user.tenants.some(t => t.tenantId.toString() === expectedTenantId);
  console.log(`   Linked to Demo Tenant (${expectedTenantId})? ${isLinked ? 'YES ✅' : 'NO ❌'}`);

}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
