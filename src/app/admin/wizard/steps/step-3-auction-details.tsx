// src/components/admin/wizard/steps/step-3-auction-details.tsx
'use client';

import { useWizard } from '../wizard-context';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, Auction } from '@/types';
import AuctionForm from '@/app/admin/auctions/auction-form';
import { useEffect } from 'react';

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

  // Função para o AuctionForm atualizar o estado do wizard
  const handleWizardDataChange = (data: Partial<Auction>) => {
    setWizardData(prev => ({
        ...prev,
        auctionDetails: {
            ...prev.auctionDetails,
            ...data,
        }
    }));
  };

  // Se o tipo de leilão for judicial, e já tivermos um processo com um comitente vinculado,
  // vamos pré-selecionar esse comitente.
  const initialSellerId = wizardData.auctionType === 'JUDICIAL' 
    ? wizardData.judicialProcess?.sellerId || wizardData.auctionDetails?.sellerId
    : wizardData.auctionDetails?.sellerId;
    
  const initialDataForForm = {
    ...wizardData.auctionDetails,
    sellerId: initialSellerId,
    auctionType: wizardData.auctionType, // Passa o tipo do leilão para o formulário
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
