
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente para leituras
import { dbAdmin, ensureAdminInitialized, FieldValue, Timestamp as AdminTimestamp } from '@/lib/firebase/admin'; // SDK Admin para escritas e tipos Admin
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, Timestamp as ClientTimestamp, where, writeBatch } from 'firebase/firestore';
import type { Lot, LotFormData, StateInfo, CityInfo } from '@/types';
import { getState } from '@/app/admin/states/actions'; 
import { getCity } from '@/app/admin/cities/actions';

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
  if (timestampField instanceof Date) {
    return timestampField; 
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`Could not convert lot timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined | null {
    if (timestampField === null || timestampField === undefined) {
      return null;
    }
    return safeConvertToDate(timestampField);
}


export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
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
    const { lotSpecificAuctionDate, secondAuctionDate, endDate, stateId, cityId, mediaItemIds, galleryImageUrls, ...restData } = data;

    const newLotDataForFirestore: any = {
      ...restData,
      views: data.views || 0,
      bidsCount: data.bidsCount || 0,
      auctionName: data.auctionName || `Leilão do Lote ${data.title.substring(0,20)}`,
      endDate: AdminTimestamp.fromDate(new Date(endDate)),
      mediaItemIds: mediaItemIds || [], 
      galleryImageUrls: galleryImageUrls || [], 
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (stateId) {
      const stateDoc = await getDoc(doc(currentDbAdmin, 'states', stateId)); // Use Admin SDK for consistency if possible
      if (stateDoc.exists()) {
        newLotDataForFirestore.stateId = stateId;
        newLotDataForFirestore.stateUf = (stateDoc.data() as StateInfo).uf;
      }
    }
    if (cityId) {
      const cityDoc = await getDoc(doc(currentDbAdmin, 'cities', cityId)); // Use Admin SDK
      if (cityDoc.exists()) {
        newLotDataForFirestore.cityId = cityId;
        newLotDataForFirestore.cityName = (cityDoc.data() as CityInfo).name;
      }
    }
    
    if (lotSpecificAuctionDate !== undefined) {
      newLotDataForFirestore.lotSpecificAuctionDate = lotSpecificAuctionDate
        ? AdminTimestamp.fromDate(new Date(lotSpecificAuctionDate))
        : null;
    } else {
       newLotDataForFirestore.lotSpecificAuctionDate = null;
    }

    if (secondAuctionDate !== undefined) {
      newLotDataForFirestore.secondAuctionDate = secondAuctionDate
        ? AdminTimestamp.fromDate(new Date(secondAuctionDate))
        : null;
    } else {
        newLotDataForFirestore.secondAuctionDate = null;
    }


    const docRef = await addDoc(collection(currentDbAdmin, 'lots'), newLotDataForFirestore);
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    return { success: true, message: 'Lote criado com sucesso!', lotId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createLot] Error creating lot:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao criar lote.' };
  }
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
   if (!firestoreClientDB) {
      console.error("[getLots] Firestore client DB não inicializado. Retornando array vazio.");
      return [];
  }
  try {
    const lotsCollection = collection(firestoreClientDB, 'lots');
    let q;
    if (auctionIdParam) {
      q = query(lotsCollection, where('auctionId', '==', auctionIdParam), orderBy('title', 'asc'));
    } else {
      q = query(lotsCollection, orderBy('title', 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        auctionId: data.auctionId,
        title: data.title,
        number: data.number,
        imageUrl: data.imageUrl,
        dataAiHint: data.dataAiHint,
        galleryImageUrls: data.galleryImageUrls || [],
        mediaItemIds: data.mediaItemIds || [],
        status: data.status,
        stateId: data.stateId,
        cityId: data.cityId,
        cityName: data.cityName,
        stateUf: data.stateUf,
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
    console.error("[Server Action - getLots] Error fetching lots:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

export async function getLot(id: string): Promise<Lot | null> {
  if (!firestoreClientDB) {
    console.error(`[getLot for ID ${id}] Firestore client DB não inicializado. Retornando null.`);
    return null;
  }
  try {
    const lotDocRef = doc(firestoreClientDB, 'lots', id);
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
        galleryImageUrls: data.galleryImageUrls || [],
        mediaItemIds: data.mediaItemIds || [],
        status: data.status,
        stateId: data.stateId,
        cityId: data.cityId,
        cityName: data.cityName,
        stateUf: data.stateUf,
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
    console.error("[Server Action - getLot] Error fetching lot:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function updateLot(
  id: string,
  data: Partial<LotFormData>
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  if (data.title !== undefined && (data.title === null || data.title.trim() === '')) {
     return { success: false, message: 'O título do lote não pode ser vazio se fornecido.' };
  }
  if (data.auctionId !== undefined && (data.auctionId === null || data.auctionId.trim() === '')) {
    return { success: false, message: 'O leilão associado não pode ser vazio se fornecido.' };
  }

  try {
    const lotDocRef = doc(currentDbAdmin, 'lots', id);
    const updateDataForFirestore: any = {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = (data as any)[key];
        
        if (key === 'endDate' || key === 'lotSpecificAuctionDate' || key === 'secondAuctionDate') {
          if (value !== undefined) { 
            updateDataForFirestore[key] = value ? AdminTimestamp.fromDate(new Date(value)) : null;
          } else if (key === 'lotSpecificAuctionDate' || key === 'secondAuctionDate') {
            updateDataForFirestore[key] = null;
          }
        } else if (key === 'stateId') {
            if (value) {
                const stateDoc = await getDoc(doc(currentDbAdmin, 'states', value)); // Use Admin SDK
                if (stateDoc.exists()) {
                    updateDataForFirestore.stateId = value;
                    updateDataForFirestore.stateUf = (stateDoc.data() as StateInfo).uf;
                } else {
                    updateDataForFirestore.stateId = null;
                    updateDataForFirestore.stateUf = null;
                }
            } else {
                 updateDataForFirestore.stateId = null;
                 updateDataForFirestore.stateUf = null;
            }
        } else if (key === 'cityId') {
             if (value) {
                const cityDoc = await getDoc(doc(currentDbAdmin, 'cities', value)); // Use Admin SDK
                if (cityDoc.exists()) {
                    updateDataForFirestore.cityId = value;
                    updateDataForFirestore.cityName = (cityDoc.data() as CityInfo).name;
                } else {
                    updateDataForFirestore.cityId = null;
                    updateDataForFirestore.cityName = null;
                }
            } else {
                updateDataForFirestore.cityId = null;
                updateDataForFirestore.cityName = null;
            }
        } else if (key === 'mediaItemIds' || key === 'galleryImageUrls') {
            updateDataForFirestore[key] = Array.isArray(value) ? value : [];
        }
        else {
           if (value !== undefined) { 
            updateDataForFirestore[key] = value;
           }
        }
      }
    }
    
    updateDataForFirestore.updatedAt = FieldValue.serverTimestamp();

    await updateDoc(lotDocRef, updateDataForFirestore);
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    if (updateDataForFirestore.auctionId || data.auctionId) { 
      revalidatePath(`/admin/auctions/${updateDataForFirestore.auctionId || data.auctionId}/edit`);
    }
    return { success: true, message: 'Lote atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateLot] Error updating lot:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao atualizar lote.' };
  }
}

export async function deleteLot(
  id: string,
  auctionId?: string
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  try {
    const lotDocRef = doc(currentDbAdmin, 'lots', id);
    await deleteDoc(lotDocRef);
    revalidatePath('/admin/lots');
    if (auctionId) {
      revalidatePath(`/admin/auctions/${auctionId}/edit`);
    }
    return { success: true, message: 'Lote excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteLot] Error deleting lot:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao excluir lote.' };
  }
}

