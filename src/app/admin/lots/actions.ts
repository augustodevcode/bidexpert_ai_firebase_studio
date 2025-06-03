
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Lot } from '@/types';

// Helper function to safely convert Firestore Timestamp like objects or actual Timestamps to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) {
    return new Date(); // Fallback or handle as error/undefined
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate(); // Firestore Timestamp
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000); // Plain object {seconds, nanoseconds}
  }
  if (timestampField instanceof Date) {
    return timestampField; // Already a Date
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`Could not convert lot timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined {
    if (!timestampField) {
      return undefined;
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
    console.warn(`Could not convert optional lot timestamp to Date: ${JSON.stringify(timestampField)}. Returning undefined.`);
    return undefined;
}

export type LotFormData = Omit<Lot, 'id' | 'createdAt' | 'updatedAt' | 'endDate' | 'lotSpecificAuctionDate' | 'secondAuctionDate'> & {
  endDate: Date;
  lotSpecificAuctionDate?: Date | null; // Allow null for optional reset
  secondAuctionDate?: Date | null; // Allow null for optional reset
};


export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string }> {
  if (!data.title || data.title.trim() === '') {
    return { success: false, message: 'O título do lote é obrigatório.' };
  }
  if (!data.auctionId || data.auctionId.trim() === '') {
    return { success: false, message: 'O leilão associado é obrigatório.' };
  }
  if (!data.price || data.price <= 0) {
    return { success: false, message: 'O preço inicial deve ser um valor positivo.' };
  }
  if (!data.endDate) {
    return { success: false, message: 'A data de encerramento é obrigatória.'};
  }

  try {
    const newLotDataForFirestore = {
      ...data,
      views: data.views || 0,
      bidsCount: data.bidsCount || 0,
      auctionName: data.auctionName || `Leilão do Lote ${data.title.substring(0,20)}`,
      endDate: Timestamp.fromDate(new Date(data.endDate)),
      lotSpecificAuctionDate: data.lotSpecificAuctionDate ? Timestamp.fromDate(new Date(data.lotSpecificAuctionDate)) : undefined,
      secondAuctionDate: data.secondAuctionDate ? Timestamp.fromDate(new Date(data.secondAuctionDate)) : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (data.lotSpecificAuctionDate === null) {
        delete (newLotDataForFirestore as any).lotSpecificAuctionDate;
    }
    if (data.secondAuctionDate === null) {
        delete (newLotDataForFirestore as any).secondAuctionDate;
    }


    const docRef = await addDoc(collection(db, 'lots'), newLotDataForFirestore);
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    return { success: true, message: 'Lote criado com sucesso!', lotId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createLot] Error creating lot:", error);
    return { success: false, message: error.message || 'Falha ao criar lote.' };
  }
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
  try {
    const lotsCollection = collection(db, 'lots');
    let q;
    if (auctionIdParam) {
      q = query(lotsCollection, where('auctionId', '==', auctionIdParam), orderBy('title', 'asc'));
    } else {
      q = query(lotsCollection, orderBy('title', 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Explicitly map all fields from Lot type
      return {
        id: doc.id,
        auctionId: data.auctionId,
        title: data.title,
        number: data.number,
        imageUrl: data.imageUrl,
        dataAiHint: data.dataAiHint,
        galleryImageUrls: data.galleryImageUrls,
        status: data.status,
        location: data.location,
        type: data.type,
        views: data.views,
        auctionName: data.auctionName,
        price: data.price,
        initialPrice: data.initialPrice,
        endDate: safeConvertToDate(data.endDate),
        bidsCount: data.bidsCount,
        isFavorite: data.isFavorite,
        isFeatured: data.isFeatured,
        description: data.description,
        year: data.year,
        make: data.make,
        model: data.model,
        series: data.series,
        stockNumber: data.stockNumber,
        sellingBranch: data.sellingBranch,
        vin: data.vin,
        vinStatus: data.vinStatus,
        lossType: data.lossType,
        primaryDamage: data.primaryDamage,
        titleInfo: data.titleInfo,
        titleBrand: data.titleBrand,
        startCode: data.startCode,
        hasKey: data.hasKey,
        odometer: data.odometer,
        airbagsStatus: data.airbagsStatus,
        bodyStyle: data.bodyStyle,
        engineDetails: data.engineDetails,
        transmissionType: data.transmissionType,
        driveLineType: data.driveLineType,
        fuelType: data.fuelType,
        cylinders: data.cylinders,
        restraintSystem: data.restraintSystem,
        exteriorInteriorColor: data.exteriorInteriorColor,
        options: data.options,
        manufacturedIn: data.manufacturedIn,
        vehicleClass: data.vehicleClass,
        lotSpecificAuctionDate: safeConvertOptionalDate(data.lotSpecificAuctionDate),
        secondAuctionDate: safeConvertOptionalDate(data.secondAuctionDate),
        secondInitialPrice: data.secondInitialPrice,
        vehicleLocationInBranch: data.vehicleLocationInBranch,
        laneRunNumber: data.laneRunNumber,
        aisleStall: data.aisleStall,
        actualCashValue: data.actualCashValue,
        estimatedRepairCost: data.estimatedRepairCost,
        sellerName: data.sellerName,
        condition: data.condition,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Lot;
    });
  } catch (error: any) {
    console.error("[Server Action - getLots] Error fetching lots:", error);
    return [];
  }
}

export async function getLot(id: string): Promise<Lot | null> {
  try {
    const lotDocRef = doc(db, 'lots', id);
    const docSnap = await getDoc(lotDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        auctionId: data.auctionId,
        title: data.title,
        number: data.number,
        imageUrl: data.imageUrl,
        dataAiHint: data.dataAiHint,
        galleryImageUrls: data.galleryImageUrls,
        status: data.status,
        location: data.location,
        type: data.type,
        views: data.views,
        auctionName: data.auctionName,
        price: data.price,
        initialPrice: data.initialPrice,
        endDate: safeConvertToDate(data.endDate),
        bidsCount: data.bidsCount,
        isFavorite: data.isFavorite,
        isFeatured: data.isFeatured,
        description: data.description,
        year: data.year,
        make: data.make,
        model: data.model,
        series: data.series,
        stockNumber: data.stockNumber,
        sellingBranch: data.sellingBranch,
        vin: data.vin,
        vinStatus: data.vinStatus,
        lossType: data.lossType,
        primaryDamage: data.primaryDamage,
        titleInfo: data.titleInfo,
        titleBrand: data.titleBrand,
        startCode: data.startCode,
        hasKey: data.hasKey,
        odometer: data.odometer,
        airbagsStatus: data.airbagsStatus,
        bodyStyle: data.bodyStyle,
        engineDetails: data.engineDetails,
        transmissionType: data.transmissionType,
        driveLineType: data.driveLineType,
        fuelType: data.fuelType,
        cylinders: data.cylinders,
        restraintSystem: data.restraintSystem,
        exteriorInteriorColor: data.exteriorInteriorColor,
        options: data.options,
        manufacturedIn: data.manufacturedIn,
        vehicleClass: data.vehicleClass,
        lotSpecificAuctionDate: safeConvertOptionalDate(data.lotSpecificAuctionDate),
        secondAuctionDate: safeConvertOptionalDate(data.secondAuctionDate),
        secondInitialPrice: data.secondInitialPrice,
        vehicleLocationInBranch: data.vehicleLocationInBranch,
        laneRunNumber: data.laneRunNumber,
        aisleStall: data.aisleStall,
        actualCashValue: data.actualCashValue,
        estimatedRepairCost: data.estimatedRepairCost,
        sellerName: data.sellerName,
        condition: data.condition,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Lot;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getLot] Error fetching lot:", error);
    return null;
  }
}

export async function updateLot(
  id: string,
  data: Partial<LotFormData>
): Promise<{ success: boolean; message: string }> {

  if (data.title !== undefined && (data.title === null || data.title.trim() === '')) {
     return { success: false, message: 'O título do lote não pode ser vazio se fornecido.' };
  }
  if (data.auctionId !== undefined && (data.auctionId === null || data.auctionId.trim() === '')) {
    return { success: false, message: 'O leilão associado não pode ser vazio se fornecido.' };
  }

  try {
    const lotDocRef = doc(db, 'lots', id);

    const updateDataForFirestore: Partial<any> = { ...data };
    if (data.endDate) {
        updateDataForFirestore.endDate = Timestamp.fromDate(new Date(data.endDate));
    }

    if (data.hasOwnProperty('lotSpecificAuctionDate')) {
        updateDataForFirestore.lotSpecificAuctionDate = data.lotSpecificAuctionDate ? Timestamp.fromDate(new Date(data.lotSpecificAuctionDate)) : undefined;
        if (data.lotSpecificAuctionDate === null) delete updateDataForFirestore.lotSpecificAuctionDate;
    }
     if (data.hasOwnProperty('secondAuctionDate')) {
        updateDataForFirestore.secondAuctionDate = data.secondAuctionDate ? Timestamp.fromDate(new Date(data.secondAuctionDate)) : undefined;
        if (data.secondAuctionDate === null) delete updateDataForFirestore.secondAuctionDate;
    }
    updateDataForFirestore.updatedAt = serverTimestamp();

    await updateDoc(lotDocRef, updateDataForFirestore);
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
    return { success: true, message: 'Lote atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateLot] Error updating lot:", error);
    return { success: false, message: error.message || 'Falha ao atualizar lote.' };
  }
}

export async function deleteLot(
  id: string,
  auctionId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const lotDocRef = doc(db, 'lots', id);
    await deleteDoc(lotDocRef);
    revalidatePath('/admin/lots');
    if (auctionId) {
      revalidatePath(`/admin/auctions/${auctionId}/edit`);
    }
    return { success: true, message: 'Lote excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteLot] Error deleting lot:", error);
    return { success: false, message: error.message || 'Falha ao excluir lote.' };
  }
}
