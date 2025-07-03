
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { WizardProvider, useWizard } from '@/components/admin/wizard/wizard-context';
import WizardStepper from '@/components/admin/wizard/wizard-stepper';
import Step1TypeSelection from '@/components/admin/wizard/steps/step-1-type-selection';
import Step2JudicialSetup from '@/components/admin/wizard/steps/step-2-judicial-setup';
import Step3AuctionDetails from '@/components/admin/wizard/steps/step-3-auction-details';
import Step4Lotting from '@/components/admin/wizard/steps/step-4-lotting';
import Step5Review from '@/components/admin/wizard/steps/step-5-review';
import { getWizardInitialData } from './actions';
import type { JudicialProcess, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, Bem, Auction, Court, JudicialDistrict, JudicialBranch, Lot } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Rocket, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JudicialProcessForm from '@/app/admin/judicial-processes/judicial-process-form';

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
    availableBens: Bem[];
    courts: Court[];
    districts: JudicialDistrict[];
    branches: JudicialBranch[];
}

function WizardContent({ fetchedData, isLoading, refetchData }: { fetchedData: WizardDataForFetching | null, isLoading: boolean, refetchData: (processId?: string) => void }) {
  const { currentStep, wizardData, nextStep, prevStep, goToStep, setWizardData } = useWizard();
  const [wizardMode, setWizardMode] = useState<'main' | 'judicial_process'>('main');

  const stepsToUse = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
      return allSteps;
    }
    return allSteps.filter(step => step.id !== 'judicial');
  }, [wizardData.auctionType]);

  const currentStepId = stepsToUse[currentStep]?.id;
  const { toast } = useToast();
  
  const handleProcessCreated = (newProcessId?: string) => {
    toast({ title: "Sucesso!", description: "Processo judicial cadastrado." });
    setWizardMode('main');
    refetchData(newProcessId);
  }

  const handleNextStep = () => {
    if (currentStepId === 'auction') {
      if (!wizardData.auctionDetails?.title || !wizardData.auctionDetails.auctioneer || !wizardData.auctionDetails.seller) {
        toast({ title: "Campos Obrigatórios", description: "Por favor, preencha o título, leiloeiro e comitente do leilão.", variant: "destructive" });
        return;
      }
    }
    nextStep();
  }

  const handleLotCreation = () => {
    refetchData(wizardData.judicialProcess?.id); // Refetch bens for the current process
  };


  const renderStep = () => {
    if (isLoading || !fetchedData) {
      return <div className="flex items-center justify-center h-full min-h-[250px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    switch (currentStepId) {
      case 'type':
        return <Step1TypeSelection />;
      case 'judicial':
        return <Step2JudicialSetup processes={fetchedData.judicialProcesses} onAddNewProcess={() => setWizardMode('judicial_process')} />;
      case 'auction':
        return <Step3AuctionDetails 
                    categories={fetchedData.categories} 
                    auctioneers={fetchedData.auctioneers} 
                    sellers={fetchedData.sellers} 
                    wizardData={wizardData}
                    setWizardData={setWizardData}
                />;
      case 'lotting':
        const bensForProcess = wizardData.auctionType === 'JUDICIAL' 
            ? fetchedData.availableBens.filter(bem => wizardData.judicialProcess ? bem.judicialProcessId === wizardData.judicialProcess.id : true)
            : fetchedData.availableBens;
        return <Step4Lotting 
                  availableBens={bensForProcess}
                  auctionData={wizardData.auctionDetails as Partial<Auction>}
                  onLotCreated={handleLotCreation}
                />;
      case 'review':
        return <Step5Review wizardData={wizardData} />;
      default:
        return (
          <div className="text-center py-10">
            <p>Etapa "{stepsToUse[currentStep]?.title || 'Próxima'}" em desenvolvimento.</p>
          </div>
        );
    }
  };

  if (wizardMode === 'judicial_process' && fetchedData) {
      return (
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Passo a Passo: Novo Processo Judicial</CardTitle>
                  <CardDescription>Cadastre as informações do processo judicial. Após salvar, você retornará ao assistente de leilão.</CardDescription>
              </CardHeader>
              <CardContent>
                  <JudicialProcessForm
                    courts={fetchedData.courts}
                    allDistricts={fetchedData.districts}
                    allBranches={fetchedData.branches}
                    onSuccess={handleProcessCreated}
                    onCancel={() => setWizardMode('main')}
                  />
              </CardContent>
          </Card>
      )
  }

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
        <CardFooter className="mt-8 flex justify-between p-0 pt-6">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button onClick={handleNextStep} disabled={currentStep === stepsToUse.length - 1}>
            Próximo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
}


export default function WizardPage() {
    const [fetchedData, setFetchedData] = useState<WizardDataForFetching | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const loadData = useCallback(async (processId?: string) => {
        setIsLoadingData(true);
        const result = await getWizardInitialData(processId);
        if (result.success) {
            setFetchedData(result.data as WizardDataForFetching);
        } else {
            console.error("Failed to load wizard data:", result.message);
        }
        setIsLoadingData(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

  return (
    <WizardProvider>
      <WizardContent fetchedData={fetchedData} isLoading={isLoadingData} refetchData={loadData} />
    </WizardProvider>
  );
}
