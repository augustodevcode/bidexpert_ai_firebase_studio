import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test creating a simple entity
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        subdomain: 'test-' + Date.now()
      }
    });
    
    console.log(`✅ Tenant created successfully with ID: ${tenant.id} (type: ${typeof tenant.id})`);
    
    // Test querying
    const tenants = await prisma.tenant.findMany();
    console.log(`✅ Found ${tenants.length} tenants`);
    
    // Clean up
    await prisma.tenant.delete({
      where: {
        id: tenant.id
      }
    });
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();