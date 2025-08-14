// src/components/admin/wizard/steps/step-3-auction-details.tsx
'use client';

import { useWizard } from '../wizard-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, AuctionStage, Auction } from '@/types';
import { Form } from '@/components/ui/form';
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import AuctionForm from '@/app/admin/auctions/auction-form'; // Import the main form

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

  // The main AuctionForm now handles its own state via react-hook-form.
  // We just need to pass a callback to receive the data when it changes.
  const handleWizardDataChange = (data: Partial<any>) => {
    setWizardData(prev => ({
        ...prev,
        auctionDetails: {
            ...prev.auctionDetails,
            ...data,
            // Ensure derived names are also updated
            auctioneer: auctioneers.find(a => a.id === data.auctioneerId)?.name,
            seller: sellers.find(s => s.id === data.sellerId)?.name,
        }
    }));
  };

  // Determine the correct sellerId based on the auctionType
  const initialSellerId = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
        const processSellerId = wizardData.judicialProcess?.sellerId;
        // If the process already has a linked seller, use it.
        if (processSellerId) {
            return processSellerId;
        }
    }
    // Otherwise, use whatever is already in the auction details (if any)
    return wizardData.auctionDetails?.sellerId;
  }, [wizardData.auctionType, wizardData.judicialProcess, wizardData.auctionDetails?.sellerId]);

  // Construct the initial data for the form, ensuring dates are Date objects if they exist
  // CORREÇÃO: Simplificamos a inicialização para evitar criar `new Date(undefined)`
  const initialDataForForm = {
    ...wizardData.auctionDetails,
    sellerId: initialSellerId,
    auctionType: wizardData.auctionType,
    auctionDate: wizardData.auctionDetails?.auctionDate ? new Date(wizardData.auctionDetails.auctionDate) : new Date(),
    endDate: wizardData.auctionDetails?.endDate ? new Date(wizardData.auctionDetails.endDate) : undefined,
    // Deixa o AuctionForm lidar com a lógica de default das stages se elas não existirem.
    // Apenas mapeia para Date objects se já existirem no wizard.
    auctionStages: wizardData.auctionDetails?.auctionStages?.map(stage => ({
        ...stage,
        startDate: stage.startDate ? new Date(stage.startDate) : undefined,
        endDate: stage.endDate ? new Date(stage.endDate) : undefined,
    })),
  };
  
  return (
    <AuctionForm
        // @ts-ignore
        initialData={initialDataForForm}
        categories={categories}
        auctioneers={auctioneers}
        sellers={sellers}
        formTitle="Detalhes do Leilão"
        formDescription="Preencha as informações principais, datas e configurações do leilão."
        isWizardMode={true}
        onWizardDataChange={handleWizardDataChange}
    />
  );
}
