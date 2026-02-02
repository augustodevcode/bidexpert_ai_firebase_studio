const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@bidexpert.ai' },
    include: {
      UsersOnTenants: {
        include: { Tenant: true }
      },
      UsersOnRoles: {
        include: { Role: true }
      }
    }
  });
  
  if (user) {
    console.log('User found:');
    console.log('  ID:', user.id.toString());
    console.log('  Email:', user.email);
    console.log('  Name:', user.fullName);
    console.log('  Full Password Hash:', user.password);
    console.log('  Tenants:', user.UsersOnTenants.map(ut => ({
      tenantId: ut.tenantId.toString(),
      tenantName: ut.Tenant?.name
    })));
    console.log('  Roles:', user.UsersOnRoles.map(ur => ({
      roleId: ur.roleId.toString(),
      roleName: ur.Role?.name
    })));
    
    // Test password
    const testPassword = 'senha@123';
    console.log('\nTesting password:', testPassword);
    const isValid = await bcryptjs.compare(testPassword, user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      // Create new hash for the password
      const newHash = await bcryptjs.hash(testPassword, 10);
      console.log('\nNew hash for senha@123:', newHash);
    }
  } else {
    console.log('User not found!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
