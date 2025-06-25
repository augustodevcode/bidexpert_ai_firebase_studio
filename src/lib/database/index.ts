
// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';

let dbInstance: IDatabaseAdapter | undefined;

// Lista de métodos essenciais que o adapter DEVE ter
const ESSENTIAL_ADAPTER_METHODS: (keyof IDatabaseAdapter)[] = [
  'initializeSchema',
  // Categories
  'createLotCategory', 'getLotCategories', 'getLotCategory', 'getLotCategoryByName', 'updateLotCategory', 'deleteLotCategory',
  // Subcategories
  'createSubcategory', 'getSubcategories', 'getSubcategory', 'getSubcategoryBySlug', 'updateSubcategory', 'deleteSubcategory',
  // States
  'createState', 'getStates', 'getState', 'updateState', 'deleteState',
  // Cities
  'createCity', 'getCities', 'getCity', 'updateCity', 'deleteCity',
  // Auctioneers
  'createAuctioneer', 'getAuctioneers', 'getAuctioneer', 'updateAuctioneer', 'deleteAuctioneer', 'getAuctioneerBySlug', 'getAuctioneerByName',
  // Sellers
  'createSeller', 'getSellers', 'getSeller', 'updateSeller', 'deleteSeller', 'getSellerBySlug', 'getSellerByName',
  // Auctions
  'createAuction', 'getAuctions', 'getAuction', 'updateAuction', 'deleteAuction', 'getAuctionsBySellerSlug', 'getAuctionsByIds', 'getAuctionsByAuctioneerSlug',
  // Lots
  'createLot', 'getLots', 'getLot', 'updateLot', 'deleteLot', 'getLotsByIds',
  // Bids & Proxy
  'getBidsForLot', 'placeBidOnLot', 'createUserLotMaxBid', 'getActiveUserLotMaxBid',
  // Reviews & Questions
  'getReviewsForLot', 'createReview', 'getQuestionsForLot', 'createQuestion', 'answerQuestion',
  // Users & Roles
  'getUserProfileData', 'updateUserProfile', 'ensureUserRole', 'getUsersWithRoles', 'updateUserRole', 'deleteUserProfile', 'getUserByEmail',
  'createRole', 'getRoles', 'getRole', 'getRoleByName', 'updateRole', 'deleteRole', 'ensureDefaultRolesExist',
  // Media
  'createMediaItem', 'getMediaItems', 'updateMediaItemMetadata', 'deleteMediaItemFromDb', 'linkMediaItemsToLot', 'unlinkMediaItemFromLot',
  // Platform Settings
  'getPlatformSettings', 'updatePlatformSettings',
  // Direct Sales
  'getDirectSaleOffers'
];


function isAdapterInstanceValid(adapter: IDatabaseAdapter | undefined, systemContext: string): adapter is IDatabaseAdapter {
  if (!adapter) {
    console.warn(`[DB Factory - Sanity Check for ${systemContext}] Adapter instance is undefined.`);
    return false;
  }
  let allMethodsPresent = true;
  for (const method of ESSENTIAL_ADAPTER_METHODS) {
    if (typeof adapter[method] !== 'function') {
      console.warn(`[DB Factory - Sanity Check for ${systemContext}] Method ${method} is NOT a function on the adapter instance. Adapter constructor: ${adapter?.constructor?.name}`);
      allMethodsPresent = false;
    }
  }
  if (!allMethodsPresent) {
      console.error(`[DB Factory - Sanity Check for ${systemContext}] MALFORMED adapter instance of type ${adapter?.constructor?.name}. See previous warnings for missing methods.`);
  }
  return allMethodsPresent;
}

export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  const activeSystem = activeSystemEnv?.toUpperCase() || 'FIRESTORE'; // Default back to Firestore if not set

  console.log(`[DB Factory - getDatabaseAdapter ENTER] ACTIVE_DATABASE_SYSTEM: ${activeSystem}. Current dbInstance type: ${dbInstance?.constructor?.name}`);

  if (dbInstance) {
    if (isAdapterInstanceValid(dbInstance, `cached ${dbInstance.constructor.name}`)) {
      console.log(`[DB Factory] Reusing valid existing dbInstance of type: ${dbInstance.constructor.name}.`);
      return dbInstance;
    } else {
      console.warn(`[DB Factory] Cached dbInstance of type ${dbInstance?.constructor?.name} was MALFORMED. Forcing re-initialization.`);
      dbInstance = undefined; 
    }
  }

  console.log(`[DB Factory] Initializing new adapter for ACTIVE_DATABASE_SYSTEM (resolved): ${activeSystem}`);
  let newInstance: IDatabaseAdapter | undefined;

  switch (activeSystem) {
    case 'SAMPLE_DATA':
      console.log('[DB Adapter] Dynamically importing Sample Data Adapter...');
      const { SampleDataAdapter } = await import('./sample-data.adapter');
      newInstance = new SampleDataAdapter();
      break;
    case 'POSTGRES':
      console.log('[DB Adapter] Dynamically importing PostgreSQL Adapter...');
      const { PostgresAdapter } = await import('./postgres.adapter');
      newInstance = new PostgresAdapter();
      break;
    case 'MYSQL':
      console.log('[DB Adapter] Dynamically importing MySQL Adapter...');
      const { MySqlAdapter } = await import('./mysql.adapter');
      newInstance = new MySqlAdapter();
      break;
    case 'FIRESTORE': {
        console.log('[DB Adapter] Dynamically importing Firestore Adapter...');
        const { ensureAdminInitialized } = await import('@/lib/firebase/admin');
        const { FirestoreAdapter } = await import('./firestore.adapter');
        const { db: dbAdmin, error: sdkError } = ensureAdminInitialized();
        if (sdkError || !dbAdmin) {
            const errorMessage = `[DB Factory] Failed to initialize Firebase Admin SDK for Firestore Adapter: ${sdkError?.message || 'dbAdmin instance is null'}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        newInstance = new FirestoreAdapter(dbAdmin);
        break;
    }
    default:
      const errorMessage = `[DB Factory] FATAL: Unsupported or misconfigured database system: '${activeSystem}'. Supported: 'SAMPLE_DATA', 'POSTGRES', 'MYSQL', 'FIRESTORE'.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
  }
  
  if (!newInstance) {
    const criticalError = `[DB Factory - getDatabaseAdapter] CRITICAL: newInstance is undefined AFTER switch block for system: ${activeSystem}. This indicates a failure in dynamic import or constructor.`;
    console.error(criticalError);
    throw new Error(criticalError);
  }
  console.log(`[DB Factory] ${activeSystem} Adapter instance created. Constructor name: ${newInstance?.constructor?.name}`);


  if (!isAdapterInstanceValid(newInstance, `newly created ${activeSystem}`)) {
     const criticalError = `[DB Factory - getDatabaseAdapter EXIT] CRITICAL: FAILED to create a VALID dbInstance for system: ${activeSystem}. Instance type: ${newInstance?.constructor?.name}. Check sanity check logs.`;
     console.error(criticalError);
     throw new Error(criticalError);
  }
  
  dbInstance = newInstance;
  console.log(`[DB Factory - getDatabaseAdapter EXIT] New dbInstance created and cached. Type: ${dbInstance.constructor.name}.`);
  return dbInstance;
}
