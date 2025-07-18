// src/app/setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Database, Settings, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import WelcomeStep from '@/components/setup/welcome-step';
import SeedingStep from '@/components/setup/seeding-step';
import SettingsStep from '@/components/setup/settings-step';
import FinishStep from '@/components/setup/finish-step';
import { getSetupStatus, resetSetupStatus } from './actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 'welcome', title: 'Boas-Vindas', icon: Rocket },
  { id: 'seeding', title: 'Dados Iniciais', icon: Database },
  { id: 'settings', title: 'Configurações', icon: Settings },
  { id: 'finish', title: 'Finalização', icon: CheckCircle },
];

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check setup status on mount
    getSetupStatus().then(isComplete => {
      if (isComplete) {
        toast({
          title: "Configuração já realizada",
          description: "Redirecionando para o painel de administração.",
        });
        localStorage.setItem('bidexpert_setup_complete', 'true');
        router.replace('/admin/dashboard');
      } else {
        localStorage.removeItem('bidexpert_setup_complete');
        setIsLoading(false);
      }
    });
  }, [router, toast]);
  
  const handleReset = async () => {
    setIsLoading(true);
    await resetSetupStatus();
    localStorage.removeItem('bidexpert_setup_complete');
    window.location.reload();
  };

  const goToNextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const goToPrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const renderCurrentStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={goToNextStep} />;
      case 'seeding':
        return <SeedingStep onNext={goToNextStep} onPrev={goToPrevStep} />;
      case 'settings':
         return <SettingsStep onNext={goToNextStep} onPrev={goToPrevStep} />;
      case 'finish':
         return <FinishStep />;
      default:
        return <WelcomeStep onNext={goToNextStep} />;
    }
  };

  if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
           <p className="ml-3 text-muted-foreground">Verificando estado da configuração...</p>
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-end mb-2">
            <Button onClick={handleReset} variant="ghost" size="sm">
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Forçar Reinício do Setup
            </Button>
        </div>
        <ol className="flex items-center w-full mb-8">
            {STEPS.map((step, index) => (
                 <li key={step.id} className="relative flex-1">
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
        
        <Card className="shadow-lg">
          {renderCurrentStep()}
        </Card>
      </div>
    </div>
  );
}
