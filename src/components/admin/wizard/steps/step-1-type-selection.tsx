
'use client';

import { useWizard } from '../wizard-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Scale, Users, Building, FileText as TomadaPrecosIcon } from 'lucide-react';

const auctionTypes = [
  { value: 'JUDICIAL', label: 'Leilão Judicial', description: 'Bens de processos judiciais.', icon: Scale },
  { value: 'EXTRAJUDICIAL', label: 'Leilão Extrajudicial', description: 'Venda de ativos de empresas e bancos.', icon: Building },
  { value: 'PARTICULAR', label: 'Leilão Particular', description: 'Venda de bens de pessoas físicas ou jurídicas.', icon: Users },
  { value: 'TOMADA_DE_PRECOS', label: 'Tomada de Preços', description: 'Processos de compra governamentais.', icon: TomadaPrecosIcon },
];

export default function Step1TypeSelection() {
  const { wizardData, setWizardData } = useWizard();

  const handleTypeChange = (value: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS') => {
    setWizardData(prev => ({ ...prev, auctionType: value }));
  };

  return (
    <div data-ai-id="wizard-step1-type-selection">
      <h3 className="text-lg font-semibold mb-4">Qual é a modalidade do leilão?</h3>
      <RadioGroup
        value={wizardData.auctionType}
        onValueChange={handleTypeChange}
        className="space-y-3"
      >
        {auctionTypes.map(type => {
          const Icon = type.icon;
          return (
            <Label
              key={type.value}
              htmlFor={`type-${type.value}`}
              className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent has-[div>input:checked]:bg-accent has-[div>input:checked]:border-primary"
            >
              <div className="flex items-center h-full">
                  <RadioGroupItem value={type.value} id={`type-${type.value}`} />
              </div>
              <div className="flex-grow">
                <div className="font-semibold flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {type.label}
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
