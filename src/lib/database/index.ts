
// src/lib/database/index.ts
import type { IDatabaseAdapter } from '@/types';
import { cookies } from 'next/headers';

let dbInstance: IDatabaseAdapter | undefined;

// Lista de métodos essenciais que o adapter DEVE ter
const ESSENTIAL_ADAPTER_METHODS: (keyof IDatabaseAdapter)[] = [
  'initializeSchema',
  'createLotCategory', 'getLotCategories', 'getLotCategory', 'getLotCategoryByName', 'updateLotCategory', 'deleteLotCategory',
  'createSubcategory', 'getSubcategories', 'getSubcategory', 'getSubcategoryBySlug', 'updateSubcategory', 'deleteSubcategory',
  'createState', 'getStates', 'getState', 'updateState', 'deleteState',
  'createCity', 'getCities', 'getCity', 'updateCity', 'deleteCity',
  'createAuctioneer', 'getAuctioneers', 'getAuctioneer', 'updateAuctioneer', 'deleteAuctioneer', 'getAuctioneerBySlug', 'getAuctioneerByName',
  'createSeller', 'getSellers', 'getSeller', 'updateSeller', 'deleteSeller', 'getSellerBySlug', 'getSellerByName',
  'createAuction', 'getAuctions', 'getAuction', 'updateAuction', 'deleteAuction', 'getAuctionsBySellerSlug', 'getAuctionsByIds', 'getAuctionsByAuctioneerSlug',
  'createLot', 'getLots', 'getLot', 'updateLot', 'deleteLot', 'getLotsByIds',
  'getBidsForLot', 'placeBidOnLot', 'createUserLotMaxBid', 'getActiveUserLotMaxBid', 'getWinsForUser',
  'getReviewsForLot', 'createReview', 'getQuestionsForLot', 'createQuestion', 'answerQuestion',
  'getUserProfileData', 'updateUserProfile', 'ensureUserRole', 'getUsersWithRoles', 'updateUserRole', 'deleteUserProfile', 'getUserByEmail',
  'createRole', 'getRoles', 'getRole', 'getRoleByName', 'updateRole', 'deleteRole', 'ensureDefaultRolesExist',
  'createMediaItem', 'getMediaItems', 'getMediaItem', 'updateMediaItemMetadata', 'deleteMediaItemFromDb', 'linkMediaItemsToLot', 'unlinkMediaItemFromLot',
  'getPlatformSettings', 'updatePlatformSettings',
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
  let dbFromCookie: string | undefined;
  try {
    // This will only work in a server context (Server Components, Route Handlers, Server Actions)
    const cookieStore = cookies();
    dbFromCookie = cookieStore.get('dev-config-db')?.value;
  } catch (e) {
    // This can happen if called outside a request-response cycle (e.g., during build). Fallback to env var.
    console.warn('[DB Factory] Could not access cookies. This is expected during build or in unsupported contexts. Falling back to environment variables.');
  }
  
  const activeSystemEnv = process.env.ACTIVE_DATABASE_SYSTEM;
  const activeSystem = dbFromCookie || activeSystemEnv?.toUpperCase() || 'SAMPLE_DATA';

  console.log(`[DB Factory - getDatabaseAdapter ENTER] Active System: ${activeSystem} (Cookie: ${dbFromCookie || 'N/A'}, Env: ${activeSystemEnv || 'N/A'}).`);

  if (dbInstance) {
    const currentAdapterName = dbInstance.constructor.name.replace('Adapter','').toUpperCase();
    if (currentAdapterName === activeSystem && isAdapterInstanceValid(dbInstance, `cached ${dbInstance.constructor.name}`)) {
        return dbInstance;
    } else {
        console.log(`[DB Factory] System changed from ${currentAdapterName} to ${activeSystem}. Re-initializing adapter.`);
        dbInstance = undefined; // Force re-initialization
    }
  }

  let newInstance: IDatabaseAdapter | undefined;

  switch (activeSystem) {
    case 'SAMPLE_DATA':
      const { SampleDataAdapter } = await import('./sample-data.adapter');
      newInstance = new SampleDataAdapter();
      break;
    case 'POSTGRES':
      const { PostgresAdapter } = await import('./postgres.adapter');
      newInstance = new PostgresAdapter();
      break;
    case 'MYSQL':
      const { MySqlAdapter } = await import('./mysql.adapter');
      newInstance = new MySqlAdapter();
      break;
    case 'FIRESTORE': {
        const { ensureAdminInitialized } = await import('@/lib/firebase/admin');
        const { FirestoreAdapter } = await import('./firestore.adapter');
        const { db: dbAdmin, error: sdkError } = ensureAdminInitialized();
        if (sdkError || !dbAdmin) {
            const errorMessage = `[DB Factory] Failed to initialize Firebase Admin SDK for Firestore Adapter: ${sdkError?.message || 'dbAdmin instance is null'}`;
            throw new Error(errorMessage);
        }
        newInstance = new FirestoreAdapter(dbAdmin);
        break;
    }
    default:
      const errorMessage = `[DB Factory] FATAL: Unsupported or misconfigured database system: '${activeSystem}'.`;
      throw new Error(errorMessage);
  }
  
  if (!newInstance || !isAdapterInstanceValid(newInstance, `newly created ${activeSystem}`)) {
     const criticalError = `[DB Factory] CRITICAL: FAILED to create a VALID dbInstance for system: ${activeSystem}.`;
     throw new Error(criticalError);
  }
  
  dbInstance = newInstance;
  return dbInstance;
}
