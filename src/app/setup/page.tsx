
// src/app/setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Rocket, Database, UserCog, CheckCircle } from 'lucide-react';
import WelcomeStep from '@/components/setup/welcome-step';
import SeedingStep from '@/components/setup/seeding-step';
import AdminUserStep from '@/components/setup/admin-user-step';
import FinishStep from '@/components/setup/finish-step';
import { verifyInitialData } from './actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 'welcome', title: 'Boas-Vindas', icon: Rocket },
  { id: 'seeding', title: 'Dados Iniciais', icon: Database },
  { id: 'admin', title: 'Administrador', icon: UserCog },
  { id: 'finish', title: 'Finalização', icon: CheckCircle },
];

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const goToNextStep = async () => {
    console.log(`[SetupPage] Tentando avançar do step: ${STEPS[currentStep].id}`);
    if (STEPS[currentStep].id === 'seeding') {
      const result = await verifyInitialData();
      if (!result.success) {
        toast({
            title: "Verificação Falhou",
            description: result.message,
            variant: "destructive",
            duration: 7000,
        });
        console.log('[SetupPage] Verificação do DB falhou. Bloqueando avanço.');
        return;
      }
      console.log('[SetupPage] Verificação do DB passou. Avançando para o próximo step.');
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };
  
  const goToPrevStep = () => {
    console.log(`[SetupPage] Voltando do step: ${STEPS[currentStep].id}`);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderCurrentStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={goToNextStep} />;
      case 'seeding':
        return <SeedingStep onNext={goToNextStep} onPrev={goToPrevStep} />;
      case 'admin':
         return <AdminUserStep onNext={goToNextStep} onPrev={goToPrevStep} />;
      case 'finish':
         return <FinishStep />;
      default:
        return <WelcomeStep onNext={goToNextStep} />;
    }
  };

  return (
    <div data-ai-id="setup-page-container" className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-4xl">
        <ol className="flex items-center w-full mb-8">
            {STEPS.map((step, index) => (
                 <li key={step.id} className="flex w-full items-center">
                    <div className="flex flex-col items-center gap-2">
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                            <step.icon className="w-5 h-5"/>
                        </span>
                        <span className={`text-xs font-medium text-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{step.title}</span>
                    </div>
                    {index < STEPS.length - 1 && <div className="flex-1 w-full h-px bg-border mx-4"></div>}
                </li>
            ))}
        </ol>
        
        <Card className="shadow-2xl" data-ai-id="setup-main-card">
          {renderCurrentStep()}
        </Card>
      </div>
    </div>
  );
}
