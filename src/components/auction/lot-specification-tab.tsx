// src/components/auction/lot-specification-tab.tsx
'use client';

import type { Lot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal } from 'lucide-react';

interface LotSpecificationTabProps {
  lot: Lot;
}

export default function LotSpecificationTab({ lot }: LotSpecificationTabProps) {
  const propertiesText = lot.properties || lot.assets?.[0]?.properties;

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-1 pt-0">
        <CardTitle className="text-xl font-semibold flex items-center">
          <SlidersHorizontal className="h-5 w-5 mr-2 text-muted-foreground" /> Especificações do Bem
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1">
        {propertiesText ? (
            <div className="text-sm text-muted-foreground whitespace-pre-line bg-muted/50 p-4 rounded-md">
                {propertiesText}
            </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma especificação ou propriedade adicional informada para este lote.</p>
        )}
      </CardContent>
    </Card>
  );
}
