// src/components/admin/wizard/wizard-stepper.tsx
'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export default function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Wizard Progress">
      <ol role="list" className="grid grid-cols-5 items-start">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="relative flex flex-col items-center">
            {/* Connector line - needs to be rendered behind the circle */}
            {stepIdx > 0 ? (
                <div
                    className="absolute left-0 top-5 h-0.5 w-full -translate-x-1/2 bg-border"
                    aria-hidden="true"
                >
                    <div
                        className={cn(
                            'h-full w-full bg-primary transition-all duration-300',
                            stepIdx <= currentStep ? 'scale-x-100' : 'scale-x-0'
                        )}
                        style={{ transformOrigin: 'left' }}
                    />
                </div>
            ) : null}

            {/* Step Circle */}
            <button
                type="button"
                onClick={() => onStepClick(stepIdx)}
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  stepIdx < currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : stepIdx === currentStep
                    ? 'border-primary ring-4 ring-primary/20'
                    : 'border-muted-foreground/30 bg-muted/50 hover:border-muted-foreground/50'
                )}
                aria-current={stepIdx === currentStep ? 'step' : undefined}
            >
                {stepIdx < currentStep ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      stepIdx === currentStep ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    0{stepIdx + 1}
                  </span>
                )}
            </button>
            
            {/* Step Label */}
            <div className="mt-2 text-center">
                 <p className={cn(
                     "text-sm font-medium",
                     stepIdx === currentStep ? 'text-primary' : 'text-foreground'
                 )}>
                    {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
