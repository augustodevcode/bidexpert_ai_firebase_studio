
'use client';

import type { Lot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface LotDescriptionTabProps {
  lot: Lot;
}

export default function LotDescriptionTab({ lot }: LotDescriptionTabProps) {
  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-1 pt-0">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Info className="h-5 w-5 mr-2 text-muted-foreground" /> Descrição Detalhada do Lote
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1">
        {lot.description ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{lot.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma descrição detalhada fornecida para este lote.</p>
        )}
      </CardContent>
    </Card>
  );
}
