
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente para leituras
import { dbAdmin, ensureAdminInitialized, FieldValue, Timestamp as AdminTimestamp } from '@/lib/firebase/admin'; // SDK Admin para escritas e tipos Admin
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, Timestamp as ClientTimestamp, where, limit } from 'firebase/firestore';
import type { SellerProfileInfo, SellerFormData } from '@/types';
import { slugify, getUniqueSellers as getSampleSellers } from '@/lib/sample-data';

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof AdminTimestamp) { 
    return timestampField.toDate();
  }
  if (timestampField instanceof ClientTimestamp) { 
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new AdminTimestamp(timestampField.seconds, timestampField.nanoseconds).toDate();
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
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do comitente é obrigatório.' };
  }

  try {
    const newSellerData = {
      ...data,
      slug: slugify(data.name.trim()),
      memberSince: FieldValue.serverTimestamp(),
      rating: 0,
      activeLotsCount: 0,
      totalSalesValue: 0,
      auctionsFacilitatedCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await addDoc(collection(currentDbAdmin, 'sellers'), newSellerData);
    revalidatePath('/admin/sellers');
    return { success: true, message: 'Comitente criado com sucesso!', sellerId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createSeller] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao criar comitente.' };
  }
}

export async function getSellers(): Promise<SellerProfileInfo[]> {
  if (!firestoreClientDB) {
      console.error("[getSellers] Firestore client DB não inicializado. Retornando array de exemplo.");
      return getSampleSellers();
  }
  try {
    const sellersCollection = collection(firestoreClientDB, 'sellers');
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
        return getSampleSellers();
    }
  } catch (error: any) {
    console.error("[Server Action - getSellers] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return getSampleSellers(); // Fallback on error as well
  }
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
  if (!firestoreClientDB) {
    console.error(`[getSeller for ID ${id}] Firestore client DB não inicializado. Retornando null.`);
    return null;
  }
  try {
    const sellerDocRef = doc(firestoreClientDB, 'sellers', id);
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
        const sampleSellers = getSampleSellers();
        const foundInSample = sampleSellers.find(seller => seller.id === id || seller.slug === id); 
        if (foundInSample) {
            return { ...foundInSample };
        }
        return null;
    }
  } catch (error: any) {
    console.error("[Server Action - getSeller] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
  if (!firestoreClientDB) {
    console.warn(`[getSellerBySlug for slug ${slug}] Firestore client DB não inicializado. Tentando sample data.`);
    const sampleSellers = getSampleSellers();
    return sampleSellers.find(seller => seller.slug === slug) || null;
  }
  try {
    const sellersCol = collection(firestoreClientDB, 'sellers');
    const q = query(sellersCol, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
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
      const sampleSellers = getSampleSellers();
      const foundInSample = sampleSellers.find(seller => seller.slug === slug);
      if (foundInSample) return { ...foundInSample };
      return null;
    }
  } catch (error: any) {
    console.error(`[Server Action - getSellerBySlug] Error fetching seller by slug ${slug}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}


export async function updateSeller(
  id: string,
  data: Partial<SellerFormData>
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  if (data.name !== undefined && (data.name === null || data.name.trim() === '')) {
     return { success: false, message: 'O nome do comitente não pode ser vazio.' };
  }

  try {
    const sellerDocRef = doc(currentDbAdmin, 'sellers', id);
    
    const updateData: Partial<SellerProfileInfo> = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name.trim());
    }
    updateData.updatedAt = FieldValue.serverTimestamp() as any;

    await updateDoc(sellerDocRef, updateData);
    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${id}/edit`);
    revalidatePath(`/consignor-dashboard/overview`); 
    return { success: true, message: 'Comitente atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateSeller] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao atualizar comitente.' };
  }
}

export async function deleteSeller(
  id: string
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  try {
    const sellerDocRef = doc(currentDbAdmin, 'sellers', id);
    await deleteDoc(sellerDocRef);
    revalidatePath('/admin/sellers');
    return { success: true, message: 'Comitente excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteSeller] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao excluir comitente.' };
  }
}

