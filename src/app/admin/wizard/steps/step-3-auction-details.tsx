// src/components/admin/wizard/steps/step-3-auction-details.tsx
'use client';

import { useWizard } from '../wizard-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage, Auction, StateInfo, CityInfo } from '@/types';
import { Form } from '@/components/ui/form';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import AuctionForm from '@/app/admin/auctions/auction-form'; // Import the main form
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';

interface Step3AuctionDetailsProps {
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
}

export default function Step3AuctionDetails({ 
    categories, 
    auctioneers, 
    sellers 
}: Step3AuctionDetailsProps) {
  const { wizardData, setWizardData } = useWizard();
  const [states, setStates] = useState<StateInfo[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLocationData() {
        try {
            const [fetchedStates, fetchedCities] = await Promise.all([
                getStates(),
                getCities()
            ]);
            setStates(fetchedStates);
            setCities(fetchedCities);
        } catch (error) {
            console.error("Failed to load location data for wizard form", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchLocationData();
  }, []);

  const handleWizardDataChange = (data: Partial<any>) => {
    setWizardData(prev => ({
        ...prev,
        auctionDetails: {
            ...prev.auctionDetails,
            ...data,
            // Ensure derived names are also updated
            auctioneerName: auctioneers.find(a => a.id === data.auctioneerId)?.name,
            sellerName: sellers.find(s => s.id === data.sellerId)?.name,
        }
    }));
  };

  const initialSellerId = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
        const processSellerId = wizardData.judicialProcess?.sellerId;
        if (processSellerId) {
            return processSellerId;
        }
    }
    return wizardData.auctionDetails?.sellerId;
  }, [wizardData.auctionType, wizardData.judicialProcess, wizardData.auctionDetails?.sellerId]);

  const initialDataForForm = {
    ...wizardData.auctionDetails,
    sellerId: initialSellerId,
    auctionType: wizardData.auctionType,
    auctionDate: wizardData.auctionDetails?.auctionDate ? new Date(wizardData.auctionDetails.auctionDate) : new Date(),
    endDate: wizardData.auctionDetails?.endDate ? new Date(wizardData.auctionDetails.endDate) : undefined,
    auctionStages: wizardData.auctionDetails?.auctionStages?.map(stage => ({ 
        ...stage, 
        startDate: stage.startDate ? new Date(stage.startDate) : undefined,
        endDate: stage.endDate ? new Date(stage.endDate) : undefined,
    })),
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
  }

  return (
    <AuctionForm
        // @ts-ignore
        initialData={initialDataForForm}
        categories={categories}
        auctioneers={auctioneers}
        sellers={sellers}
        states={states}
        allCities={cities}
        formTitle="Detalhes do Leilão"
        formDescription="Preencha as informações principais, datas e configurações do leilão."
        isWizardMode={true}
        onWizardDataChange={handleWizardDataChange}
    />
  );
}