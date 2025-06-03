
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { slugify } from '@/lib/sample-data';

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date(); // Fallback
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate(); // Firestore Timestamp
  }
  // Check for plain object {seconds, nanoseconds} - often from server-side fetch then client-side
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField; // Already a Date
  // Try to parse if it's a string or number that can be converted
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`Could not convert auctioneer timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined {
    if (!timestampField) return undefined;
    // Use the main safeConvertToDate which handles various Timestamp-like objects
    return safeConvertToDate(timestampField);
}

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string }> {
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do leiloeiro é obrigatório.' };
  }

  try {
    const newAuctioneerData = {
      ...data,
      slug: slugify(data.name.trim()),
      memberSince: serverTimestamp(),
      rating: 0,
      auctionsConductedCount: 0,
      totalValueSold: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'auctioneers'), newAuctioneerData);
    revalidatePath('/admin/auctioneers');
    return { success: true, message: 'Leiloeiro criado com sucesso!', auctioneerId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createAuctioneer] Error:", error);
    return { success: false, message: error.message || 'Falha ao criar leiloeiro.' };
  }
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  try {
    const auctioneersCollection = collection(db, 'auctioneers');
    const q = query(auctioneersCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        registrationNumber: data.registrationNumber,
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
        auctionsConductedCount: data.auctionsConductedCount || 0,
        totalValueSold: data.totalValueSold || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as AuctioneerProfileInfo;
    });
  } catch (error: any) {
    console.error("[Server Action - getAuctioneers] Error:", error);
    return [];
  }
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  try {
    const auctioneerDocRef = doc(db, 'auctioneers', id);
    const docSnap = await getDoc(auctioneerDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        registrationNumber: data.registrationNumber,
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
        auctionsConductedCount: data.auctionsConductedCount || 0,
        totalValueSold: data.totalValueSold || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as AuctioneerProfileInfo;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getAuctioneer] Error:", error);
    return null;
  }
}

export async function updateAuctioneer(
  id: string,
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  if (data.name !== undefined && (data.name === null || data.name.trim() === '')) {
     return { success: false, message: 'O nome do leiloeiro não pode ser vazio.' };
  }

  try {
    const auctioneerDocRef = doc(db, 'auctioneers', id);
    
    const updateData: Partial<AuctioneerProfileInfo> = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name.trim());
    }
    updateData.updatedAt = serverTimestamp() as any;

    await updateDoc(auctioneerDocRef, updateData);
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${id}/edit`);
    return { success: true, message: 'Leiloeiro atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateAuctioneer] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar leiloeiro.' };
  }
}

export async function deleteAuctioneer(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const auctioneerDocRef = doc(db, 'auctioneers', id);
    await deleteDoc(auctioneerDocRef);
    revalidatePath('/admin/auctioneers');
    return { success: true, message: 'Leiloeiro excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteAuctioneer] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir leiloeiro.' };
  }
}

    