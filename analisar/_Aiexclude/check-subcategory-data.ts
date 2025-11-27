import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubcategoryData() {
  console.log('Checking subcategory data...');
  
  // Get a few subcategories to check their fields
  const subcategories = await prisma.subcategory.findMany({
    take: 3,
    orderBy: {
      id: 'desc'
    }
  });
  
  console.log(`Found ${subcategories.length} subcategories:`);
  subcategories.forEach((subcat, index) => {
    console.log(`\nSubcategory ${index + 1}:`);
    console.log(`  Name: ${subcat.name}`);
    console.log(`  Icon URL: ${subcat.iconUrl}`);
    console.log(`  Icon Media ID: ${subcat.iconMediaId}`);
    console.log(`  AI Hint: ${subcat.dataAiHintIcon}`);
    console.log(`  Display Order: ${subcat.displayOrder}`);
  });
  
  await prisma.$disconnect();
}

checkSubcategoryData();