// src/app/setup/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Database, Settings, Palette, CheckCircle } from 'lucide-react';
import WelcomeStep from '@/components/setup/welcome-step';
import SeedingStep from '@/components/setup/seeding-step';
import SettingsStep from '@/components/setup/settings-step';
import FinishStep from '@/components/setup/finish-step';

const STEPS = [
  { id: 'welcome', title: 'Boas-Vindas', icon: Rocket },
  { id: 'seeding', title: 'Dados Iniciais', icon: Database },
  { id: 'settings', title: 'Configurações', icon: Settings },
  { id: 'appearance', title: 'Aparência', icon: Palette },
  { id: 'finish', title: 'Finalização', icon: CheckCircle },
];

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0);

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-4xl">
        <ol className="flex items-center w-full mb-8">
            {STEPS.map((step, index) => (
                 <li key={step.id} className="flex w-full items-center">
                    <div className="flex items-center text-sm">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                            <step.icon className="w-4 h-4"/>
                        </span>
                        <span className={`ml-2 font-medium hidden md:block ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{step.title}</span>
                    </div>
                    {index < STEPS.length - 1 && <div className="flex-1 w-full h-px bg-border mx-4"></div>}
                </li>
            ))}
        </ol>
        
        <Card className="shadow-2xl">
          {renderCurrentStep()}
        </Card>
      </div>
    </div>
  );
}