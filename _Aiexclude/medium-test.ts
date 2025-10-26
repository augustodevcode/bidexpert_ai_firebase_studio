import { PrismaClient } from '@prisma/client';
import { TenantService } from '../src/services/tenant.service';
import { RoleService } from '../src/services/role.service';
import { UserService } from '../src/services/user.service';
import { CategoryService } from '../src/services/category.service';
import { SubcategoryService } from '../src/services/subcategory.service';

const prisma = new PrismaClient();

async function testSeed() {
  console.log('🚀 Starting medium test seed process...');
  
  try {
    // Clean up any existing test data
    await prisma.usersOnRoles.deleteMany({});
    await prisma.usersOnTenants.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.subcategory.deleteMany({});
    await prisma.lotCategory.deleteMany({});
    await prisma.tenant.deleteMany({ where: { id: { not: 1n } } });
    
    const tenantService = new TenantService();
    const roleService = new RoleService();
    const userService = new UserService();
    const categoryService = new CategoryService();
    const subcategoryService = new SubcategoryService();
    
    // Create a tenant
    console.log('Creating tenant...');
    const tenantResult = await tenantService.createTenant({ 
      name: 'Test Tenant', 
      subdomain: 'test-' + Date.now() 
    });
    
    if (!tenantResult.success || !tenantResult.tenant) {
      throw new Error(tenantResult.message);
    }
    
    console.log(`✅ Tenant created with ID: ${tenantResult.tenant.id} (type: ${typeof tenantResult.tenant.id})`);
    
    // Create roles
    console.log('Creating roles...');
    const roleNames = ['ADMIN', 'USER', 'BIDDER'];
    const roles: Record<string, bigint> = {};
    
    for (const name of roleNames) {
      const roleResult = await roleService.createRole({ 
        name,
        description: `Role ${name}`,
        permissions: []
      });
      
      if (!roleResult.success || !roleResult.roleId) {
        throw new Error(roleResult.message);
      }
      
      roles[name] = roleResult.roleId;
      console.log(`✅ Role ${name} created with ID: ${roleResult.roleId} (type: ${typeof roleResult.roleId})`);
    }
    
    // Create categories
    console.log('Creating categories...');
    const categoryResult = await categoryService.createCategory({
      name: 'Test Category',
      description: 'Test category for seeding'
    });
    
    if (!categoryResult.success || !categoryResult.category) {
      throw new Error(categoryResult.message);
    }
    
    console.log(`✅ Category created with ID: ${categoryResult.category.id} (type: ${typeof categoryResult.category.id})`);
    
    // Create subcategories
    console.log('Creating subcategories...');
    const subcategoryResult = await subcategoryService.createSubcategory({
      name: 'Test Subcategory',
      parentCategoryId: categoryResult.category.id,
      description: 'Test subcategory for seeding',
      displayOrder: 0,
      iconUrl: null,
      iconMediaId: null,
      dataAiHintIcon: null
    });
    
    console.log(`✅ Subcategory created`);
    
    // Create users
    console.log('Creating users...');
    const userResult = await userService.createUser({
      email: 'test@example.com',
      password: 'test123',
      fullName: 'Test User',
      habilitationStatus: 'HABILITADO',
      accountType: 'PHYSICAL',
      roleIds: [roles.ADMIN],
      tenantId: tenantResult.tenant.id
    });
    
    if (!userResult.success || !userResult.userId) {
      throw new Error(userResult.message);
    }
    
    console.log(`✅ User created with ID: ${userResult.userId} (type: ${typeof userResult.userId})`);
    
    // Fetch the user back
    console.log('Fetching user...');
    const fetchedUser = await userService.getUserById(userResult.userId);
    if (!fetchedUser) {
      throw new Error('Failed to fetch user');
    }
    
    console.log(`✅ Fetched user with ID: ${fetchedUser.id} (type: ${typeof fetchedUser.id})`);
    console.log(`✅ User role ID: ${fetchedUser.roles[0]?.id} (type: ${typeof fetchedUser.roles[0]?.id})`);
    console.log(`✅ User tenant ID: ${fetchedUser.tenants[0]?.id} (type: ${typeof fetchedUser.tenants[0]?.id})`);
    
    console.log('\n✅ Medium test seed completed successfully!');
    console.log('All IDs are properly using BigInt type.');
    
  } catch (error) {
    console.error('❌ Error during medium test seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSeed();