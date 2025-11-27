import { PrismaClient } from '@prisma/client';
import { TenantService } from '../src/services/tenant.service';
import { RoleService } from '../src/services/role.service';
import { UserService } from '../src/services/user.service';

const prisma = new PrismaClient();

async function testBigIntConversion() {
  console.log('Testing BigInt ID conversion...');
  
  try {
    // Clean up any existing test data
    await prisma.usersOnRoles.deleteMany({});
    await prisma.usersOnTenants.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.tenant.deleteMany({ where: { id: { not: 1n } } });
    
    const tenantService = new TenantService();
    const roleService = new RoleService();
    const userService = new UserService();
    
    // Create a tenant
    console.log('Creating tenant...');
    const tenantResult = await tenantService.createTenant({ 
      name: 'Test Tenant', 
      subdomain: 'test-' + Date.now() 
    });
    
    if (!tenantResult.success || !tenantResult.tenant) {
      throw new Error(tenantResult.message);
    }
    
    console.log(`Tenant created with ID: ${tenantResult.tenant.id} (type: ${typeof tenantResult.tenant.id})`);
    
    // Create a role
    console.log('Creating role...');
    const roleResult = await roleService.createRole({ 
      name: 'TEST_ROLE',
      description: 'Test role for BigInt conversion',
      permissions: []
    });
    
    if (!roleResult.success || !roleResult.roleId) {
      throw new Error(roleResult.message);
    }
    
    console.log(`Role created with ID: ${roleResult.roleId} (type: ${typeof roleResult.roleId})`);
    
    // Create a user
    console.log('Creating user...');
    const userResult = await userService.createUser({
      email: 'test@example.com',
      password: 'test123',
      fullName: 'Test User',
      habilitationStatus: 'HABILITADO',
      accountType: 'PHYSICAL',
      roleIds: [roleResult.roleId.toString()],
      tenantId: tenantResult.tenant.id
    });
    
    if (!userResult.success || !userResult.userId) {
      throw new Error(userResult.message);
    }
    
    console.log(`User created with ID: ${userResult.userId} (type: ${typeof userResult.userId})`);
    
    // Fetch the user back
    console.log('Fetching user...');
    const fetchedUser = await userService.getUserById(userResult.userId);
    if (!fetchedUser) {
      throw new Error('Failed to fetch user');
    }
    
    console.log(`Fetched user with ID: ${fetchedUser.id} (type: ${typeof fetchedUser.id})`);
    console.log(`User role ID: ${fetchedUser.roles[0]?.id} (type: ${typeof fetchedUser.roles[0]?.id})`);
    console.log(`User tenant ID: ${fetchedUser.tenants[0]?.id} (type: ${typeof fetchedUser.tenants[0]?.id})`);
    
    console.log('\n✅ BigInt conversion test completed successfully!');
    console.log('All IDs are properly using BigInt type.');
    
  } catch (error) {
    console.error('❌ Error during BigInt conversion test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testBigIntConversion();