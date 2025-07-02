
'use client';

import { useMemo } from 'react';
import { WizardProvider, useWizard } from '@/components/admin/wizard/wizard-context';
import WizardStepper from '@/components/admin/wizard/wizard-stepper';
import Step1TypeSelection from '@/components/admin/wizard/steps/step-1-type-selection';
import Step2JudicialSetup from '@/components/admin/wizard/steps/step-2-judicial-setup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Rocket } from 'lucide-react';

const steps = [
  { id: 'type', title: 'Tipo de Leilão', description: 'Selecione a modalidade.' },
  { id: 'judicial', title: 'Dados Judiciais', description: 'Informações do processo.' },
  { id: 'auction', title: 'Dados do Leilão', description: 'Detalhes e datas.' },
  { id: 'lotting', title: 'Loteamento', description: 'Agrupe bens em lotes.' },
  { id: 'review', title: 'Revisão', description: 'Revise e publique.' },
];

function WizardContent() {
  const { currentStep, wizardData, nextStep, prevStep, goToStep } = useWizard();
  
  // Determine which steps are applicable based on the selected auction type
  const stepsToUse = useMemo(() => {
    if (wizardData.auctionType === 'JUDICIAL') {
      return steps;
    }
    // Filter out the judicial step if the type is not JUDICIAL
    return steps.filter(step => step.id !== 'judicial');
  }, [wizardData.auctionType]);

  const renderStep = () => {
    const currentStepId = stepsToUse[currentStep]?.id;
    switch (currentStepId) {
      case 'type':
        return <Step1TypeSelection />;
      case 'judicial':
        return <Step2JudicialSetup />;
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
      if (currentStepId === 'type' && !wizardData.auctionType) {
          return true;
      }
      if (currentStepId === 'judicial' && !wizardData.judicialProcess) {
          return true;
      }
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
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
