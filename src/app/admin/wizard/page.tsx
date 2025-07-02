
'use client';

import { useEffect, useMemo, useState } from 'react';
import { WizardProvider, useWizard } from '@/components/admin/wizard/wizard-context';
import WizardStepper from '@/components/admin/wizard/wizard-stepper';
import Step1TypeSelection from '@/components/admin/wizard/steps/step-1-type-selection';
import Step2JudicialSetup from '@/components/admin/wizard/steps/step-2-judicial-setup';
import Step3AuctionDetails from '@/components/admin/wizard/steps/step-3-auction-details';
import { getWizardInitialData } from './actions';
import type { JudicialProcess, LotCategory, AuctioneerProfileInfo, SellerProfileInfo } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Rocket, Loader2 } from 'lucide-react';

const allSteps = [
  { id: 'type', title: 'Tipo de Leilão', description: 'Selecione a modalidade.' },
  { id: 'judicial', title: 'Dados Judiciais', description: 'Informações do processo.' },
  { id: 'auction', title: 'Dados do Leilão', description: 'Detalhes e datas.' },
  { id: 'lotting', title: 'Loteamento', description: 'Agrupe bens em lotes.' },
  { id: 'review', title: 'Revisão', description: 'Revise e publique.' },
];

interface WizardDataForFetching {
    judicialProcesses: JudicialProcess[];
    categories: LotCategory[];
    auctioneers: AuctioneerProfileInfo[];
    sellers: SellerProfileInfo[];
}

function WizardContent({ fetchedData, isLoading }: { fetchedData: WizardDataForFetching | null, isLoading: boolean }) {
  const { currentStep, wizardData, nextStep, prevStep, goToStep } = useWizard();
  
  const stepsToUse = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
      return allSteps;
    }
    return allSteps.filter(step => step.id !== 'judicial');
  }, [wizardData.auctionType]);

  const renderStep = () => {
    if (isLoading || !fetchedData) {
      return <div className="flex items-center justify-center h-full min-h-[250px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const currentStepId = stepsToUse[currentStep]?.id;
    switch (currentStepId) {
      case 'type':
        return <Step1TypeSelection />;
      case 'judicial':
        return <Step2JudicialSetup processes={fetchedData.judicialProcesses} />;
      case 'auction':
        return <Step3AuctionDetails categories={fetchedData.categories} auctioneers={fetchedData.auctioneers} sellers={fetchedData.sellers} />;
      default:
        return (
          <div className="text-center py-10">
            <p>Etapa "{stepsToUse[currentStep]?.title || 'Próxima'}" em desenvolvimento.</p>
          </div>
        );
    }
  };

  const isNextDisabled = () => {
      const currentStepId = stepsToUse[currentStep]?.id;
      if (isLoading) return true;
      if (currentStepId === 'type' && !wizardData.auctionType) return true;
      if (currentStepId === 'judicial' && !wizardData.judicialProcess) return true;
      // Add more validation for future steps here
      return false;
  };
  
  return (
    <Card className="shadow-lg">
       <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Rocket className="h-7 w-7 mr-3 text-primary" />
            Assistente de Criação de Leilão
          </CardTitle>
          <CardDescription>
            Siga os passos para criar um novo leilão de forma completa e guiada.
          </CardDescription>
        </CardHeader>
      <CardContent className="p-6">
        <WizardStepper steps={stepsToUse} currentStep={currentStep} onStepClick={goToStep} />
        <div className="mt-8 p-6 border rounded-lg bg-background min-h-[300px]">
          {renderStep()}
        </div>
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button onClick={nextStep} disabled={currentStep === stepsToUse.length - 1 || isNextDisabled()}>
            Próximo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


export default function WizardPage() {
    const [fetchedData, setFetchedData] = useState<WizardDataForFetching | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        async function loadInitialData() {
            setIsLoadingData(true);
            const result = await getWizardInitialData();
            if (result.success) {
                setFetchedData({
                    judicialProcesses: result.data.judicialProcesses,
                    categories: result.data.categories,
                    auctioneers: result.data.auctioneers,
                    sellers: result.data.sellers
                });
            } else {
                console.error("Failed to load wizard data:", result.message);
                // Handle error state, maybe show a toast
            }
            setIsLoadingData(false);
        }
        loadInitialData();
    }, []);

  return (
    <WizardProvider>
      <WizardContent fetchedData={fetchedData} isLoading={isLoadingData} />
    </WizardProvider>
  );
}
