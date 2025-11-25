
import { getAuctions } from '../src/app/admin/auctions/actions';
import { getPlatformSettings } from '../src/app/admin/settings/actions';

async function main() {
  console.log('Testing getAuctions(true)...');
  try {
    const auctions = await getAuctions(true);
    console.log('Auctions fetched successfully:', auctions.length);
  } catch (error) {
    console.error('Error fetching auctions:', error);
  }

  console.log('Testing getPlatformSettings()...');
  try {
    const settings = await getPlatformSettings();
    console.log('Settings fetched successfully:', settings ? 'Found' : 'Null');
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
}

main();
