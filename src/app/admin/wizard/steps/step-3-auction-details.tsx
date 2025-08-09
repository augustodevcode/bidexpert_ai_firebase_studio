// src/components/admin/wizard/steps/step-3-auction-details.tsx
'use client';

import { useWizard } from '../wizard-context';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, Auction } from '@/types';
import AuctionForm from '@/app/admin/auctions/auction-form';
import { useMemo } from 'react';

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

  const handleWizardDataChange = (data: Partial<Auction>) => {
    setWizardData(prev => ({
        ...prev,
        auctionDetails: {
            ...prev.auctionDetails,
            ...data,
        }
    }));
  };

  // Define o comitente com base no tipo de leilão
  const initialSellerId = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
      return wizardData.judicialProcess?.sellerId || wizardData.auctionDetails?.sellerId;
    }
    return wizardData.auctionDetails?.sellerId;
  }, [wizardData.auctionType, wizardData.judicialProcess, wizardData.auctionDetails?.sellerId]);

  const initialDataForForm = {
    ...wizardData.auctionDetails,
    sellerId: initialSellerId,
    auctionType: wizardData.auctionType,
  };

  return (
    <AuctionForm
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
