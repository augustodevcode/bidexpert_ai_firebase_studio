import { JudicialProcessService } from './src/services/judicial-process.service';
import { CategoryService } from './src/services/category.service';
import { SellerService } from './src/services/seller.service';
import { Prisma } from '@prisma/client';
import { StateService } from './src/services/state.service';
import { CityService } from './src/services/city.service';

const tenantId = '1'; // Assuming tenant 1

async function checkObject(name: string, obj: any) {
    if (!obj) return;
    const str = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (value.constructor && value.constructor.name === 'Decimal') {
                console.error(`[${name}] Found Decimal at key: ${key}, value: ${value}`);
                return value.toString();
            }
            if (typeof value === 'bigint') {
                 return value.toString();
            }
        }
        return value;
    });
}

async function main() {
    console.log('Starting debug...');

    const judicialProcessService = new JudicialProcessService();
    const categoryService = new CategoryService();
    const sellerService = new SellerService();
    const stateService = new StateService();
    const cityService = new CityService();

    console.log('Checking Judicial Processes...');
    const processes = await judicialProcessService.getJudicialProcesses(tenantId);
    processes.forEach((p, i) => checkObject(`Process[${i}]`, p));

    console.log('Checking Categories...');
    const categories = await categoryService.getCategories();
    categories.forEach((c, i) => checkObject(`Category[${i}]`, c));

    console.log('Checking Sellers...');
    const sellers = await sellerService.getSellers(tenantId);
    sellers.forEach((s, i) => checkObject(`Seller[${i}]`, s));

    console.log('Checking States...');
    const states = await stateService.getStates();
    states.forEach((s, i) => checkObject(`State[${i}]`, s));

    console.log('Checking Cities...');
    // Fetch cities for the first state if available, or just all/some
    // CityService.getCities takes stateIdFilter
    const cities = await cityService.getCities(); 
    cities.forEach((c, i) => checkObject(`City[${i}]`, c));

    console.log('Done.');
}

main().catch(console.error);
