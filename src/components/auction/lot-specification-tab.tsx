
'use client';

import type { Lot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal } from 'lucide-react';

interface LotSpecificationTabProps {
  lot: Lot;
}

export default function LotSpecificationTab({ lot }: LotSpecificationTabProps) {
  const specifications = [
    { label: "Ano", value: lot.year },
    { label: "Marca", value: lot.make },
    { label: "Modelo", value: lot.model },
    { label: "Série", value: lot.series },
    { label: "Categoria", value: lot.type },
    { label: "Subcategoria", value: lot.subcategoryName },
    { label: "Nº de Estoque", value: lot.stockNumber },
    { label: "Filial de Venda", value: lot.sellingBranch },
    { label: "VIN", value: lot.vin },
    { label: "Status do VIN", value: lot.vinStatus },
    { label: "Tipo de Perda", value: lot.lossType },
    { label: "Dano Primário", value: lot.primaryDamage },
    { label: "Informação do Título", value: lot.titleInfo },
    { label: "Marca do Título", value: lot.titleBrand },
    { label: "Código de Partida", value: lot.startCode },
    { label: "Chave", value: lot.hasKey ? "Presente" : "Ausente" },
    { label: "Odômetro", value: lot.odometer },
    { label: "Status dos Airbags", value: lot.airbagsStatus },
    { label: "Estilo da Carroceria", value: lot.bodyStyle },
    { label: "Detalhes do Motor", value: lot.engineDetails },
    { label: "Tipo de Transmissão", value: lot.transmissionType },
    { label: "Tipo de Tração", value: lot.driveLineType },
    { label: "Tipo de Combustível", value: lot.fuelType },
    { label: "Cilindros", value: lot.cylinders },
    { label: "Sistema de Retenção", value: lot.restraintSystem },
    { label: "Cor Externa/Interna", value: lot.exteriorInteriorColor },
    { label: "Opcionais", value: lot.options },
    { label: "Fabricado em", value: lot.manufacturedIn },
    { label: "Classe do Veículo", value: lot.vehicleClass },
    { label: "Localização no Pátio", value: lot.vehicleLocationInBranch },
    { label: "Pista/Corrida #", value: lot.laneRunNumber },
    { label: "Corredor/Vaga", value: lot.aisleStall },
    { label: "Valor Real em Dinheiro (VCV)", value: lot.actualCashValue },
    { label: "Custo Estimado de Reparo", value: lot.estimatedRepairCost },
    { label: "Condição", value: lot.condition },
  ];

  const availableSpecifications = specifications.filter(spec => spec.value !== undefined && spec.value !== null && String(spec.value).trim() !== '');

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-1 pt-0">
        <CardTitle className="text-xl font-semibold flex items-center">
          <SlidersHorizontal className="h-5 w-5 mr-2 text-muted-foreground" /> Especificações do Lote
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1">
        {availableSpecifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {availableSpecifications.map((spec) => (
              <div key={spec.label} className="flex justify-between border-b pb-1">
                <span className="font-medium text-foreground">{spec.label}</span>
                <span className="text-muted-foreground text-right">{String(spec.value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma especificação adicional detalhada para este lote.</p>
        )}
      </CardContent>
    </Card>
  );
}

