// src/app/admin/settings/seeding/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runFullSeedAction } from '@/app/admin/settings/actions';
import SettingsFormWrapper from '../settings-form-wrapper';

export default function SeedingPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeedClick = async () => {
    setIsSeeding(true);
    toast({
      title: "Populando Dados...",
      description: "Este processo pode levar alguns instantes. Por favor, aguarde.",
    });

    const result = await runFullSeedAction();

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
        variant: 'default',
      });
    } else {
      toast({
        title: "Erro no Processo",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSeeding(false);
  };
  
  // O SettingsFormWrapper é usado aqui apenas para manter o layout, sem um formulário real.
  return (
    <SettingsFormWrapper
      title="Dados de Demonstração"
      description="Popule o banco de dados com um conjunto rico de dados para testes e demonstração."
    >
      {() => (
        <Alert variant="outline">
          <Database className="h-4 w-4" />
          <AlertTitle>Popular Banco de Dados</AlertTitle>
          <AlertDescription className="mb-4">
            Clique no botão abaixo para popular sua plataforma com um conjunto completo de dados de demonstração, incluindo leilões, lotes, usuários e comitentes. Isso é ótimo para explorar todas as funcionalidades imediatamente.
          </AlertDescription>
          <Button onClick={handleSeedClick} disabled={isSeeding}>
             {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4" />}
             {isSeeding ? 'Populando...' : 'Popular com Dados de Demonstração'}
          </Button>
        </Alert>
      )}
    </SettingsFormWrapper>
  );
}
