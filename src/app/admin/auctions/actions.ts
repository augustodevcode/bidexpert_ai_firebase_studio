
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Auction, AuctionFormData } from '@/types';
import { slugify, sampleAuctions } from '@/lib/sample-data'; // Import sampleAuctions

// Helper function to safely convert Firestore Timestamp like objects or actual Timestamps to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) {
    return new Date();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) {
    return timestampField;
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`Could not convert auction timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined | null { // Allow null
    if (timestampField === null || timestampField === undefined) { // Check for null or undefined first
      return null; // Return null if the input is null or undefined
    }
    return safeConvertToDate(timestampField);
}


export async function createAuction(
  data: AuctionFormData
): Promise<{ success: boolean; message: string; auctionId?: string }> {
  if (!data.title || data.title.trim() === '') {
    return { success: false, message: 'O título do leilão é obrigatório.' };
  }
  if (!data.auctionDate) {
    return { success: false, message: 'A data do leilão é obrigatória.'};
  }
  if (!data.status) {
    return { success: false, message: 'O status do leilão é obrigatório.'};
  }
  if (!data.category || data.category.trim() === '') {
    return { success: false, message: 'A categoria do leilão é obrigatória.' };
  }
   if (!data.auctioneer || data.auctioneer.trim() === '') {
    return { success: false, message: 'O nome do leiloeiro é obrigatório.' };
  }

  try {
    const newAuctionDataForFirestore = {
      ...data,
      auctionDate: Timestamp.fromDate(new Date(data.auctionDate)),
      endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null,
      totalLots: 0,
      visits: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    if (data.endDate === null || data.endDate === undefined) {
      (newAuctionDataForFirestore as any).endDate = null;
    }

    const docRef = await addDoc(collection(db, 'auctions'), newAuctionDataForFirestore);
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão criado com sucesso!', auctionId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createAuction] Error creating auction:", error);
    return { success: false, message: error.message || 'Falha ao criar leilão.' };
  }
}

export async function getAuctions(): Promise<Auction[]> {
  try {
    const auctionsCollection = collection(db, 'auctions');
    const q = query(auctionsCollection, orderBy('auctionDate', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // console.log('[getAuctions] Fetched from Firestore');
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          fullTitle: data.fullTitle,
          description: data.description,
          status: data.status,
          auctionType: data.auctionType,
          category: data.category,
          auctioneer: data.auctioneer,
          auctioneerId: data.auctioneerId,
          seller: data.seller,
          sellerId: data.sellerId,
          auctionDate: safeConvertToDate(data.auctionDate),
          endDate: safeConvertOptionalDate(data.endDate),
           auctionStages: data.auctionStages?.map((stage: any) => ({
            name: stage.name,
            endDate: safeConvertToDate(stage.endDate),
            statusText: stage.statusText,
          })) || [],
          city: data.city,
          state: data.state,
          imageUrl: data.imageUrl,
          dataAiHint: data.dataAiHint,
          documentsUrl: data.documentsUrl,
          totalLots: data.totalLots || 0,
          visits: data.visits || 0,
          lots: data.lots || [], 
          initialOffer: data.initialOffer,
          isFavorite: data.isFavorite,
          currentBid: data.currentBid,
          bidsCount: data.bidsCount,
          sellingBranch: data.sellingBranch,
          auctioneerLogoUrl: data.auctioneerLogoUrl,
          auctioneerName: data.auctioneerName,
          createdAt: safeConvertToDate(data.createdAt),
          updatedAt: safeConvertToDate(data.updatedAt),
        } as Auction;
      });
    } else {
      // console.log('[getAuctions] Firestore empty, falling back to sampleAuctions');
      return sampleAuctions.map(auction => ({
        ...auction,
        auctionDate: new Date(auction.auctionDate), 
        endDate: auction.endDate ? new Date(auction.endDate) : null,
        auctionStages: auction.auctionStages?.map(stage => ({
            ...stage,
            endDate: new Date(stage.endDate),
        })),
        createdAt: new Date(auction.createdAt || new Date()), 
        updatedAt: new Date(auction.updatedAt || new Date()), 
      }));
    }
  } catch (error: any) {
    console.error("[Server Action - getAuctions] Error fetching auctions:", error);
    
    return sampleAuctions.map(auction => ({
        ...auction,
        auctionDate: new Date(auction.auctionDate),
        endDate: auction.endDate ? new Date(auction.endDate) : null,
         auctionStages: auction.auctionStages?.map(stage => ({
            ...stage,
            endDate: new Date(stage.endDate),
        })),
        createdAt: new Date(auction.createdAt || new Date()),
        updatedAt: new Date(auction.updatedAt || new Date()),
      }));
  }
}

export async function getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> {
  try {
    const allAuctions = await getAuctions(); 
    return allAuctions.filter(auction => auction.seller && slugify(auction.seller) === sellerSlug);
  } catch (error: any) {
    console.error(`[Server Action - getAuctionsBySellerSlug] Error fetching auctions for seller slug ${sellerSlug}:`, error);
    return [];
  }
}


export async function getAuction(id: string): Promise<Auction | null> {
  try {
    const auctionDocRef = doc(db, 'auctions', id);
    const docSnap = await getDoc(auctionDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        fullTitle: data.fullTitle,
        description: data.description,
        status: data.status,
        auctionType: data.auctionType,
        category: data.category,
        auctioneer: data.auctioneer,
        auctioneerId: data.auctioneerId,
        seller: data.seller,
        sellerId: data.sellerId,
        auctionDate: safeConvertToDate(data.auctionDate),
        endDate: safeConvertOptionalDate(data.endDate),
        auctionStages: data.auctionStages?.map((stage: any) => ({
            name: stage.name,
            endDate: safeConvertToDate(stage.endDate),
            statusText: stage.statusText,
        })) || [],
        city: data.city,
        state: data.state,
        imageUrl: data.imageUrl,
        dataAiHint: data.dataAiHint,
        documentsUrl: data.documentsUrl,
        totalLots: data.totalLots || 0,
        visits: data.visits || 0,
        lots: data.lots || [], 
        initialOffer: data.initialOffer,
        isFavorite: data.isFavorite,
        currentBid: data.currentBid,
        bidsCount: data.bidsCount,
        sellingBranch: data.sellingBranch,
        auctioneerLogoUrl: data.auctioneerLogoUrl,
        auctioneerName: data.auctioneerName,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Auction;
    } else {
        
        const foundInSample = sampleAuctions.find(auction => auction.id === id);
        if (foundInSample) {
            return {
                ...foundInSample,
                auctionDate: new Date(foundInSample.auctionDate),
                endDate: foundInSample.endDate ? new Date(foundInSample.endDate) : null,
                auctionStages: foundInSample.auctionStages?.map(stage => ({
                    ...stage,
                    endDate: new Date(stage.endDate),
                })),
                createdAt: new Date(foundInSample.createdAt || new Date()),
                updatedAt: new Date(foundInSample.updatedAt || new Date()),
            };
        }
        return null;
    }
  } catch (error: any) {
    console.error("[Server Action - getAuction] Error fetching auction:", error);
    return null;
  }
}

export async function updateAuction(
  id: string,
  data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string }> {
  if (data.title !== undefined && (data.title === null || data.title.trim() === '')) {
     return { success: false, message: 'O título do leilão não pode ser vazio se fornecido.' };
  }
   if (data.category !== undefined && (data.category === null || data.category.trim() === '')) {
    return { success: false, message: 'A categoria do leilão não pode ser vazia se fornecida.' };
  }
   if (data.auctioneer !== undefined && (data.auctioneer === null || data.auctioneer.trim() === '')) {
    return { success: false, message: 'O nome do leiloeiro não pode ser vazio se fornecido.' };
  }

  try {
    const auctionDocRef = doc(db, 'auctions', id);
    
    const updateDataForFirestore: Partial<any> = { ...data };

    if (data.auctionDate) {
        updateDataForFirestore.auctionDate = Timestamp.fromDate(new Date(data.auctionDate));
    }
    if (data.hasOwnProperty('endDate')) { // Check if endDate is explicitly passed (even if null)
        updateDataForFirestore.endDate = data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null;
    }
    
    updateDataForFirestore.updatedAt = serverTimestamp();

    await updateDoc(auctionDocRef, updateDataForFirestore);
    revalidatePath('/admin/auctions');
    revalidatePath(`/admin/auctions/${id}/edit`);
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateAuction] Error updating auction:", error);
    return { success: false, message: error.message || 'Falha ao atualizar leilão.' };
  }
}

export async function deleteAuction(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const auctionDocRef = doc(db, 'auctions', id);
    await deleteDoc(auctionDocRef);
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteAuction] Error deleting auction:", error);
    return { success: false, message: error.message || 'Falha ao excluir leilão.' };
  }
}


    