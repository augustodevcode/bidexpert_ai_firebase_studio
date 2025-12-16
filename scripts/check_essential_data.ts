
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    console.log('Checking LotCategories...');
    const categories = await prisma.lotCategory.findMany();
    console.log(`Found ${categories.length} categories.`);
    if (categories.length > 0) {
        console.log('Sample categories:', categories.slice(0, 3).map(c => c.name).join(', '));
    }

    console.log('\nChecking Sellers...');
    const sellers = await prisma.seller.findMany();
    console.log(`Found ${sellers.length} sellers.`);
    if (sellers.length > 0) {
        console.log('Sample sellers:', sellers.slice(0, 3).map(s => s.name).join(', '));
    }

    console.log('\nChecking JudicialProcesses...');
    const processes = await prisma.judicialProcess.findMany();
    console.log(`Found ${processes.length} processes.`);

    console.log('\nChecking States...');
    const states = await prisma.state.findMany();
    console.log(`Found ${states.length} states.`);

    console.log('\nChecking Cities...');
    const cities = await prisma.city.findMany(); // Assuming 'city' table exists, verify name
    console.log(`Found ${cities.length} cities.`);
}

checkData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
