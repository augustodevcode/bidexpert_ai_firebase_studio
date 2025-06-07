
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente para leituras
import admin from 'firebase-admin';
import { dbAdmin, ensureAdminInitialized } from '@/lib/firebase/admin'; // SDK Admin para escritas
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { slugify } from '@/lib/sample-data';

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date(); 
  if (timestampField instanceof admin.firestore.Timestamp) { 
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
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert auctioneer timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined {
    if (!timestampField) return undefined;
    return safeConvertToDate(timestampField);
}

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string }> {
  const { dbAdmin: currentDbAdmin } = await ensureAdminInitialized();
  if (!currentDbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível.' };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do leiloeiro é obrigatório.' };
  }

  try {
    const newAuctioneerData = {
      ...data,
      slug: slugify(data.name.trim()),
      memberSince: admin.firestore.FieldValue.serverTimestamp(),
      rating: 0,
      auctionsConductedCount: 0,
      totalValueSold: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await addDoc(collection(currentDbAdmin, 'auctioneers'), newAuctioneerData);
    revalidatePath('/admin/auctioneers');
    return { success: true, message: 'Leiloeiro criado com sucesso!', auctioneerId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createAuctioneer] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao criar leiloeiro.' };
  }
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  if (!firestoreClientDB) {
      console.error("[getAuctioneers] Firestore client DB não inicializado. Retornando array vazio.");
      return [];
  }
  try {
    const auctioneersCollection = collection(firestoreClientDB, 'auctioneers');
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
    console.error("[Server Action - getAuctioneers] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  if (!firestoreClientDB) {
    console.error(`[getAuctioneer for ID ${id}] Firestore client DB não inicializado. Retornando null.`);
    return null;
  }
  try {
    const auctioneerDocRef = doc(firestoreClientDB, 'auctioneers', id);
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
    console.error("[Server Action - getAuctioneer] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function updateAuctioneer(
  id: string,
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin } = await ensureAdminInitialized();
  if (!currentDbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível.' };
  }
  if (data.name !== undefined && (data.name === null || data.name.trim() === '')) {
     return { success: false, message: 'O nome do leiloeiro não pode ser vazio.' };
  }

  try {
    const auctioneerDocRef = doc(currentDbAdmin, 'auctioneers', id);
    
    const updateData: Partial<AuctioneerProfileInfo> = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name.trim());
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp() as any;

    await updateDoc(auctioneerDocRef, updateData);
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${id}/edit`);
    return { success: true, message: 'Leiloeiro atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateAuctioneer] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao atualizar leiloeiro.' };
  }
}

export async function deleteAuctioneer(
  id: string
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin } = await ensureAdminInitialized();
  if (!currentDbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível.' };
  }
  try {
    const auctioneerDocRef = doc(currentDbAdmin, 'auctioneers', id);
    await deleteDoc(auctioneerDocRef);
    revalidatePath('/admin/auctioneers');
    return { success: true, message: 'Leiloeiro excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteAuctioneer] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao excluir leiloeiro.' };
  }
}
    
