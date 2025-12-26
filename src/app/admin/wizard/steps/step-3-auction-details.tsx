// src/app/admin/wizard/steps/step-3-auction-details.tsx
'use client';

import { useWizard } from '../wizard-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage, Auction, StateInfo, CityInfo, JudicialProcess } from '@/types';
import { Form } from '@/components/ui/form';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import AuctionForm from '@/app/admin/auctions/auction-form';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { Loader2 } from 'lucide-react';


interface Step3AuctionDetailsProps {
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  categories?: LotCategory[];
  states?: StateInfo[];
  allCities?: CityInfo[];
  judicialProcesses?: JudicialProcess[];
}

export default function Step3AuctionDetails({ 
    auctioneers, 
    sellers,
    categories: propCategories,
    states: propStates,
    allCities: propCities,
    judicialProcesses: propProcesses,
}: Step3AuctionDetailsProps) {
  const { wizardData, setWizardData } = useWizard();
  const [states, setStates] = useState<StateInfo[]>(propStates || []);
  const [cities, setCities] = useState<CityInfo[]>(propCities || []);
  const [judicialProcesses, setJudicialProcesses] = useState<JudicialProcess[]>(propProcesses || []);
  const [categories, setCategories] = useState<LotCategory[]>(propCategories || []);
  const [isLoading, setIsLoading] = useState(!propStates || !propCities);

  useEffect(() => {
    // Only fetch if data wasn't provided via props
    if (!propStates || !propCities || !propCategories) {
      async function fetchLocationData() {
          try {
              const [fetchedStates, fetchedCities, fetchedProcesses, fetchedCategories] = await Promise.all([
                  propStates ? Promise.resolve(propStates) : getStates(),
                  propCities ? Promise.resolve(propCities) : getCities(),
                  propProcesses ? Promise.resolve(propProcesses) : getJudicialProcesses(),
                  propCategories ? Promise.resolve(propCategories) : getLotCategories(),
              ]);
              setStates(fetchedStates);
              setCities(fetchedCities);
              setJudicialProcesses(fetchedProcesses);
              setCategories(fetchedCategories);
          } catch (error) {
              console.error("Failed to load location data for wizard form", error);
          } finally {
              setIsLoading(false);
          }
      }
      fetchLocationData();
    } else {
      setIsLoading(false);
    }
  }, [propStates, propCities, propProcesses, propCategories]);

  const handleWizardDataChange = (data: Partial<any>) => {
    setWizardData(prev => ({
        ...prev,
        auctionDetails: {
            ...prev.auctionDetails,
            ...data,
            auctioneer: auctioneers.find(a => a.id === data.auctioneerId)?.name,
            seller: sellers.find(s => s.id === data.sellerId)?.name,
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
        auctioneers={auctioneers}
        sellers={sellers}
        states={states}
        allCities={cities}
        judicialProcesses={judicialProcesses}
        categories={categories}
        formTitle="Detalhes do Leilão"
        formDescription="Preencha as informações principais, datas e configurações do leilão."
        isWizardMode={true}
        onWizardDataChange={handleWizardDataChange}
        onSubmitAction={async () => ({success: true, message: ""})}
    />
  );
}
