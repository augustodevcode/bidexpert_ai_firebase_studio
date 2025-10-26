import { PrismaClient } from '@prisma/client';
import { AssetService } from '../src/services/asset.service';
import { CategoryService } from '../src/services/category.service';
import { SellerService } from '../src/services/seller.service';
import { CityService } from '../src/services/city.service';
import { StateService } from '../src/services/state.service';

const prisma = new PrismaClient();

async function testAssetCreation() {
  console.log('Testing asset creation...');
  
  try {
    // Create a tenant first
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        subdomain: 'test-' + Date.now(),
      }
    });
    
    console.log('Tenant created:', tenant.id);
    
    // Create a category
    const categoryService = new CategoryService();
    const categoryResult = await categoryService.createCategory({
      name: 'Test Category',
      description: 'Test category for asset creation'
    });
    
    if (!categoryResult.success || !categoryResult.category) {
      throw new Error('Failed to create category: ' + categoryResult.message);
    }
    
    console.log('Category created:', categoryResult.category.id);
    
    // Create a state
    const stateService = new StateService();
    const stateResult = await stateService.createState({
      name: 'Test State',
      uf: 'TS'
    });
    
    if (!stateResult.success || !stateResult.stateId) {
      throw new Error('Failed to create state: ' + stateResult.message);
    }
    
    console.log('State created:', stateResult.stateId);
    
    // Create a city
    const cityService = new CityService();
    const cityResult = await cityService.createCity({
      name: 'Test City',
      stateId: stateResult.stateId,
      ibgeCode: '1234567'
    });
    
    if (!cityResult.success || !cityResult.cityId) {
      throw new Error('Failed to create city: ' + cityResult.message);
    }
    
    console.log('City created:', cityResult.cityId);
    
    // Create a seller
    const sellerService = new SellerService();
    const sellerResult = await sellerService.createSeller(tenant.id, {
      name: 'Test Seller',
      isJudicial: false
    });
    
    if (!sellerResult.success || !sellerResult.sellerId) {
      throw new Error('Failed to create seller: ' + sellerResult.message);
    }
    
    console.log('Seller created:', sellerResult.sellerId);
    
    // Create an asset
    const assetService = new AssetService();
    const assetResult = await assetService.createAsset(tenant.id, {
      title: 'Test Asset',
      description: 'Test asset for verification',
      status: 'DISPONIVEL',
      evaluationValue: 1000,
      categoryId: categoryResult.category.id,
      sellerId: sellerResult.sellerId,
      cityId: cityResult.cityId,
      stateId: stateResult.stateId
    } as any);
    
    if (!assetResult.success || !assetResult.assetId) {
      throw new Error('Failed to create asset: ' + assetResult.message);
    }
    
    console.log('Asset created successfully:', assetResult.assetId);
    
    // Verify the asset was created
    const asset = await prisma.asset.findUnique({
      where: { id: assetResult.assetId }
    });
    
    console.log('Asset verification:', asset);
    
    // Clean up
    await prisma.asset.delete({ where: { id: assetResult.assetId } });
    await prisma.seller.delete({ where: { id: sellerResult.sellerId } });
    await prisma.city.delete({ where: { id: cityResult.cityId } });
    await prisma.state.delete({ where: { id: stateResult.stateId } });
    await prisma.lotCategory.delete({ where: { id: categoryResult.category.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssetCreation();