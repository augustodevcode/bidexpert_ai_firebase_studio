
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, BidInfo, IDatabaseAdapter } from '@/types';

interface PlaceBidResult {
  success: boolean;
  message: string;
  updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>;
  newBid?: BidInfo;
}

export async function placeBidOnLot(
  lotId: string,
  auctionId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<PlaceBidResult> {
  const db = await getDatabaseAdapter();
  return db.placeBidOnLot(lotId, auctionId, userId, userDisplayName, bidAmount);
}

export async function getBidsForLot(lotId: string): Promise<BidInfo[]> {
  if (!lotId) {
    console.warn("[Server Action - getBidsForLot] Lot ID is required.");
    return [];
  }
  const db = await getDatabaseAdapter();
  
  // Logs para diagnóstico
  console.log('[Server Action - getBidsForLot] Received db object. Type:', typeof db);
  if (db && typeof db === 'object') {
    console.log('[Server Action - getBidsForLot] db constructor name:', db.constructor?.name);
    console.log('[Server Action - getBidsForLot] typeof db.getBidsForLot:', typeof (db as any).getBidsForLot);
    // Verifica se todos os métodos da interface estão presentes
    const methods: (keyof IDatabaseAdapter)[] = [
        'initializeSchema', 'createLotCategory', 'getLotCategories', 'getLotCategory', 
        'updateLotCategory', 'deleteLotCategory', 'createState', 'getStates', 
        'getState', 'updateState', 'deleteState', 'createCity', 'getCities', 'getCity', 
        'updateCity', 'deleteCity', 'createAuctioneer', 'getAuctioneers', 
        'getAuctioneer', 'updateAuctioneer', 'deleteAuctioneer', 'getAuctioneerBySlug', 
        'createSeller', 'getSellers', 'getSeller', 'updateSeller', 'deleteSeller', 
        'getSellerBySlug', 'createAuction', 'getAuctions', 'getAuction', 
        'updateAuction', 'deleteAuction', 'getAuctionsBySellerSlug', 'createLot', 
        'getLots', 'getLot', 'updateLot', 'deleteLot', 'getBidsForLot', 'placeBidOnLot', 
        'getUserProfileData', 'updateUserProfile', 'ensureUserRole', 'getUsersWithRoles', 
        'updateUserRole', 'deleteUserProfile', 'createRole', 'getRoles', 'getRole', 
        'getRoleByName', 'updateRole', 'deleteRole', 'ensureDefaultRolesExist', 
        'createMediaItem', 'getMediaItems', 'updateMediaItemMetadata', 
        'deleteMediaItemFromDb', 'linkMediaItemsToLot', 'unlinkMediaItemFromLot',
        'getPlatformSettings', 'updatePlatformSettings'
    ];
    let allMethodsPresent = true;
    methods.forEach(method => {
      const methodExists = typeof (db as any)[method] === 'function';
      console.log(`[Server Action - getBidsForLot] db has method ${method}: ${methodExists}`);
      if (!methodExists) allMethodsPresent = false;
    });
    if (!allMethodsPresent) {
        console.error('[Server Action - getBidsForLot] CRITICAL: db object is missing one or more IDatabaseAdapter methods.');
    }
  } else {
    console.error('[Server Action - getBidsForLot] CRITICAL: db object is null, undefined, or not an object after getDatabaseAdapter() call.');
    // Lançar um erro aqui pode ser muito agressivo se o problema for intermitente,
    // mas é uma opção para forçar a parada se o adaptador não estiver sendo criado.
    // Por enquanto, vamos permitir que ele tente chamar o método e falhe, o que já está acontecendo.
    // throw new Error("Database adapter is not available or invalid.");
  }

  if (!db || typeof db.getBidsForLot !== 'function') {
    const adapterType = db?.constructor?.name || (typeof db === 'object' ? 'Object (unknown type)' : String(db));
    console.error(`[Server Action - getBidsForLot] CRITICAL: db.getBidsForLot is NOT a function. DB object type: ${adapterType}. DB object keys: ${db ? Object.keys(db).join(', ') : 'N/A'}`);
    throw new TypeError(`Internal Server Error: Database adapter method getBidsForLot is not available. Adapter type received: ${adapterType}`);
  }
  
  return db.getBidsForLot(lotId);
}

