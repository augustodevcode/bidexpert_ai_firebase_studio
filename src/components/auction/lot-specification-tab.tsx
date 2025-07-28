
'use client';

import type { Lot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal } from 'lucide-react';

interface LotSpecificationTabProps {
  lot: Lot;
}

const InfoRow = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between border-b pb-1.5 pt-1.5">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground text-right">{String(value)}</span>
    </div>
  );
};

export default function LotSpecificationTab({ lot }: LotSpecificationTabProps) {
  // Use the first linked bem if available, otherwise fall back to lot data.
  const bem = lot.bens && lot.bens.length > 0 ? lot.bens[0] : null;

  const specifications = [
    { label: "Ano Fabricação", value: bem?.year ?? lot.year },
    { label: "Ano Modelo", value: bem?.modelYear ?? bem?.year ?? lot.year },
    { label: "Marca", value: bem?.make ?? lot.make },
    { label: "Modelo", value: bem?.model ?? lot.model },
    { label: "Versão", value: bem?.version ?? lot.version },
    { label: "Categoria", value: lot.type },
    { label: "Subcategoria", value: lot.subcategoryName },
    { label: "VIN / Chassi", value: bem?.vin ?? lot.vin },
    { label: "Placa", value: bem?.plate },
    { label: "KM Rodado", value: bem?.mileage?.toLocaleString('pt-BR') },
    { label: "Cor", value: bem?.color },
    { label: "Combustível", value: bem?.fuelType },
    { label: "Transmissão", value: bem?.transmissionType },
    { label: "Chave", value: (bem?.hasKey ?? lot.hasKey) ? "Sim" : "Não" },
    { label: "Condição", value: lot.condition },
    // Real Estate
    { label: "Matrícula do Imóvel", value: bem?.propertyRegistrationNumber},
    { label: "Nº Contribuinte/IPTU", value: bem?.iptuNumber},
    { label: "Ocupado", value: bem?.isOccupied ? "Sim" : "Não" },
    { label: "Área Total (m²)", value: bem?.totalArea },
    { label: "Área Construída (m²)", value: bem?.builtArea },
    { label: "Quartos", value: bem?.bedrooms },
    { label: "Suítes", value: bem?.suites },
    { label: "Banheiros", value: bem?.bathrooms },
    { label: "Vagas de Garagem", value: bem?.parkingSpaces },
     // Machinery
    { label: "Nº de Série", value: bem?.serialNumber },
    { label: "Horas de Uso", value: bem?.hoursUsed?.toLocaleString('pt-BR') },
    // Livestock
    { label: "Raça", value: bem?.breed },
    { label: "Sexo", value: bem?.sex },
    { label: "Idade", value: bem?.age },
    { label: "Registro da Raça", value: bem?.breedRegistryDocument },
  ];

  const availableSpecifications = specifications.filter(spec => spec.value !== undefined && spec.value !== null && String(spec.value).trim() !== '');

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-1 pt-0">
        <CardTitle className="text-xl font-semibold flex items-center">
          <SlidersHorizontal className="h-5 w-5 mr-2 text-muted-foreground" /> Especificações do Bem
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1">
        {availableSpecifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {availableSpecifications.map((spec) => (
              <InfoRow key={spec.label} label={spec.label} value={spec.value} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma especificação adicional detalhada para este lote.</p>
        )}
      </CardContent>
    </Card>
  );
}
