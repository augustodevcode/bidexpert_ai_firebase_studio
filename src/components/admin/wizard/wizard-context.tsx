
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Auction, Asset, JudicialProcess, Lot } from '@/types';

type AuctionType = 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS';

export interface WizardData {
  auctionType?: AuctionType;
  judicialProcess?: JudicialProcess;
  auctionDetails?: Partial<Auction>;
  selectedAssets?: Asset[];
  createdLots?: Lot[];
}

interface WizardContextType {
  currentStep: number;
  wizardData: WizardData;
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({ createdLots: [] });

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => (prev > 0 ? prev - 1 : 0));
  const goToStep = (step: number) => setCurrentStep(step);
  const resetWizard = () => {
    setCurrentStep(0);
    setWizardData({ createdLots: [] });
  };

  return (
    <WizardContext.Provider value={{ currentStep, wizardData, setWizardData, nextStep, prevStep, goToStep, resetWizard }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
