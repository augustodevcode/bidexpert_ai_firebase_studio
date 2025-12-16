
import { getLotCategories } from '@/app/admin/categories/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';

async function main() {
    console.log('Testing Admin Actions...');

    try {
        console.log('Fetching Categories...');
        const categories = await getLotCategories();
        console.log(`Categories: ${categories?.length}`);
    } catch (e) { console.error('Categories Failed:', e); }

    try {
        console.log('Fetching Processes...');
        const processes = await getJudicialProcesses();
        console.log(`Processes: ${processes?.length}`);
    } catch (e) { console.error('Processes Failed:', e); }

    try {
        console.log('Fetching Sellers...');
        const sellers = await getSellers();
        console.log(`Sellers: ${sellers?.length}`);
    } catch (e) { console.error('Sellers Failed:', e); }

    try {
        console.log('Fetching States...');
        const states = await getStates();
        console.log(`States: ${states?.length}`);
    } catch (e) { console.error('States Failed:', e); }

    try {
        console.log('Fetching Cities...');
        const cities = await getCities();
        console.log(`Cities: ${cities?.length}`);
    } catch (e) { console.error('Cities Failed:', e); }

    console.log('Done.');
}

// Mocking Next.js headers/cookies might be needed if these actions use them.
// But usually they just use Prisma.
main();
