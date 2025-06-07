
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where, writeBatch } from 'firebase/firestore';
import type { Lot, LotFormData, StateInfo, CityInfo } from '@/types';

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
  console.warn(`Could not convert lot timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined {
    if (!timestampField) {
      return undefined;
    }
    // Use the main safeConvertToDate which handles various Timestamp-like objects
    return safeConvertToDate(timestampField);
}


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
    const { lotSpecificAuctionDate, secondAuctionDate, endDate, stateId, cityId, mediaItemIds, galleryImageUrls, ...restData } = data;

    const newLotDataForFirestore: any = {
      ...restData,
      views: data.views || 0,
      bidsCount: data.bidsCount || 0,
      auctionName: data.auctionName || `Leilão do Lote ${data.title.substring(0,20)}`,
      endDate: Timestamp.fromDate(new Date(endDate)),
      mediaItemIds: mediaItemIds || [], // Salvar mediaItemIds
      galleryImageUrls: galleryImageUrls || [], // Salvar galleryImageUrls
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (stateId) {
      const stateDoc = await getDoc(doc(db, 'states', stateId));
      if (stateDoc.exists()) {
        newLotDataForFirestore.stateId = stateId;
        newLotDataForFirestore.stateUf = (stateDoc.data() as StateInfo).uf;
      }
    }
    if (cityId) {
      const cityDoc = await getDoc(doc(db, 'cities', cityId));
      if (cityDoc.exists()) {
        newLotDataForFirestore.cityId = cityId;
        newLotDataForFirestore.cityName = (cityDoc.data() as CityInfo).name;
      }
    }
    
    if (lotSpecificAuctionDate !== undefined) {
      newLotDataForFirestore.lotSpecificAuctionDate = lotSpecificAuctionDate
        ? Timestamp.fromDate(new Date(lotSpecificAuctionDate))
        : null;
    } else {
       newLotDataForFirestore.lotSpecificAuctionDate = null;
    }

    if (secondAuctionDate !== undefined) {
      newLotDataForFirestore.secondAuctionDate = secondAuctionDate
        ? Timestamp.fromDate(new Date(secondAuctionDate))
        : null;
    } else {
        newLotDataForFirestore.secondAuctionDate = null;
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
    const updateDataForFirestore: any = {};

    // Iterate over the keys in data and build the update object
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = (data as any)[key];
        
        if (key === 'endDate' || key === 'lotSpecificAuctionDate' || key === 'secondAuctionDate') {
          if (value !== undefined) { 
            updateDataForFirestore[key] = value ? Timestamp.fromDate(new Date(value)) : null;
          } else if (key === 'lotSpecificAuctionDate' || key === 'secondAuctionDate') {
            updateDataForFirestore[key] = null;
          }
        } else if (key === 'stateId') {
            if (value) {
                const stateDoc = await getDoc(doc(db, 'states', value));
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
                const cityDoc = await getDoc(doc(db, 'cities', value));
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
    
    updateDataForFirestore.updatedAt = serverTimestamp();

    await updateDoc(lotDocRef, updateDataForFirestore);
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    if (updateDataForFirestore.auctionId || data.auctionId) { 
      revalidatePath(`/admin/auctions/${updateDataForFirestore.auctionId || data.auctionId}/edit`);
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

