
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where, limit } from 'firebase/firestore';
import type { SellerProfileInfo, SellerFormData } from '@/types';
import { slugify, getUniqueSellers as getSampleSellers } from '@/lib/sample-data';

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert seller timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined {
    if (!timestampField) return undefined;
    return safeConvertToDate(timestampField);
}

export async function createSeller(
  data: SellerFormData
): Promise<{ success: boolean; message: string; sellerId?: string }> {
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do comitente é obrigatório.' };
  }

  try {
    const newSellerData = {
      ...data,
      slug: slugify(data.name.trim()),
      memberSince: serverTimestamp(),
      rating: 0,
      activeLotsCount: 0,
      totalSalesValue: 0,
      auctionsFacilitatedCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'sellers'), newSellerData);
    revalidatePath('/admin/sellers');
    return { success: true, message: 'Comitente criado com sucesso!', sellerId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createSeller] Error:", error);
    return { success: false, message: error.message || 'Falha ao criar comitente.' };
  }
}

export async function getSellers(): Promise<SellerProfileInfo[]> {
  try {
    const sellersCollection = collection(db, 'sellers');
    const q = query(sellersCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name,
            slug: data.slug,
            contactName: data.contactName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            website: data.website,
            logoUrl: data.logoUrl,
            dataAiHintLogo: data.dataAiHintLogo,
            description: data.description,
            memberSince: safeConvertOptionalDate(data.memberSince),
            rating: data.rating || 0,
            activeLotsCount: data.activeLotsCount || 0,
            totalSalesValue: data.totalSalesValue || 0,
            auctionsFacilitatedCount: data.auctionsFacilitatedCount || 0,
            userId: data.userId,
            createdAt: safeConvertToDate(data.createdAt),
            updatedAt: safeConvertToDate(data.updatedAt),
        } as SellerProfileInfo;
        });
    } else {
        // console.log('[getSellers] Firestore empty, falling back to sample sellers');
        return getSampleSellers();
    }
  } catch (error: any) {
    console.error("[Server Action - getSellers] Error:", error);
    return getSampleSellers(); // Fallback on error as well
  }
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
  try {
    const sellerDocRef = doc(db, 'sellers', id);
    const docSnap = await getDoc(sellerDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        website: data.website,
        logoUrl: data.logoUrl,
        dataAiHintLogo: data.dataAiHintLogo,
        description: data.description,
        memberSince: safeConvertOptionalDate(data.memberSince),
        rating: data.rating || 0,
        activeLotsCount: data.activeLotsCount || 0,
        totalSalesValue: data.totalSalesValue || 0,
        auctionsFacilitatedCount: data.auctionsFacilitatedCount || 0,
        userId: data.userId,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as SellerProfileInfo;
    } else {
        // Fallback for getSeller by ID (less common for slug, but good for consistency)
        const sampleSellers = getSampleSellers();
        const foundInSample = sampleSellers.find(seller => seller.id === id || seller.slug === id); // Check both id and slug
        if (foundInSample) {
            return { ...foundInSample };
        }
        return null;
    }
  } catch (error: any) {
    console.error("[Server Action - getSeller] Error:", error);
    return null;
  }
}

export async function getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
  try {
    const sellersCol = collection(db, 'sellers');
    const q = query(sellersCol, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      // console.log(`[getSellerBySlug] Found seller in Firestore: ${data.name}`);
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        website: data.website,
        logoUrl: data.logoUrl,
        dataAiHintLogo: data.dataAiHintLogo,
        description: data.description,
        memberSince: safeConvertOptionalDate(data.memberSince),
        rating: data.rating || 0,
        activeLotsCount: data.activeLotsCount || 0,
        totalSalesValue: data.totalSalesValue || 0,
        auctionsFacilitatedCount: data.auctionsFacilitatedCount || 0,
        userId: data.userId,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as SellerProfileInfo;
    } else {
      // console.warn(`[getSellerBySlug] Seller with slug "${slug}" not found in Firestore. Trying sample data.`);
      const sampleSellers = getSampleSellers();
      const foundInSample = sampleSellers.find(seller => seller.slug === slug);
      
      if (foundInSample) {
        // console.log(`[getSellerBySlug] Found seller in sample data: ${foundInSample.name}`);
        return { ...foundInSample }; // getUniqueSellers already returns SellerProfileInfo objects
      } else {
        // console.warn(`[getSellerBySlug] Seller with slug "${slug}" not found in sample data either.`);
        return null;
      }
    }
  } catch (error: any) {
    console.error(`[Server Action - getSellerBySlug] Error fetching seller by slug ${slug}:`, error);
    return null;
  }
}


export async function updateSeller(
  id: string,
  data: Partial<SellerFormData>
): Promise<{ success: boolean; message: string }> {
  if (data.name !== undefined && (data.name === null || data.name.trim() === '')) {
     return { success: false, message: 'O nome do comitente não pode ser vazio.' };
  }

  try {
    const sellerDocRef = doc(db, 'sellers', id);
    
    const updateData: Partial<SellerProfileInfo> = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name.trim());
    }
    updateData.updatedAt = serverTimestamp() as any;

    await updateDoc(sellerDocRef, updateData);
    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${id}/edit`);
    revalidatePath(`/consignor-dashboard/overview`); // Revalidate consignor dashboard
    return { success: true, message: 'Comitente atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateSeller] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar comitente.' };
  }
}

export async function deleteSeller(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const sellerDocRef = doc(db, 'sellers', id);
    await deleteDoc(sellerDocRef);
    revalidatePath('/admin/sellers');
    return { success: true, message: 'Comitente excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteSeller] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir comitente.' };
  }
}
