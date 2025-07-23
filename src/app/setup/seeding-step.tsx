// src/components/setup/seeding-step.tsx
'use client';

import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2, Database } from 'lucide-react';
import { runFullSeedAction } from '@/app/admin/settings/actions';
import { useToast } from '@/hooks/use-toast';
import { verifyInitialData } from './actions';


interface SeedingStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function SeedingStep({ onNext, onPrev }: SeedingStepProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
  
  const handleNextClick = async () => {
      setIsVerifying(true);
      const result = await verifyInitialData();
      if (result.success) {
        onNext();
      } else {
        toast({
            title: "Verificação Falhou",
            description: result.message,
            variant: "destructive",
            duration: 7000,
        });
      }
      setIsVerifying(false);
  }


  return (
    <>
      <CardHeader>
        <CardTitle>População do Banco de Dados</CardTitle>
        <CardDescription>
          Sua plataforma precisa de alguns dados para funcionar. Use os botões abaixo para popular seu banco de dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-500/50">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Inicialização Essencial</AlertTitle>
          <AlertDescription>
            A inicialização essencial (`db:init`) já foi executada para criar tabelas e dados básicos como perfis e categorias.
          </AlertDescription>
        </Alert>

        <Alert variant="outline">
          <Database className="h-4 w-4" />
          <AlertTitle>Dados de Demonstração (Recomendado)</AlertTitle>
          <AlertDescription>
            Clique no botão abaixo para popular sua plataforma com um conjunto completo de dados para testes, incluindo leilões, lotes, usuários e o administrador padrão. Você pode executar este comando múltiplas vezes sem problemas.
          </AlertDescription>
          <Button onClick={handleSeedClick} disabled={isSeeding} className="mt-4">
             {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4" />}
             {isSeeding ? 'Populando...' : 'Popular com Dados de Demonstração'}
          </Button>
        </Alert>

      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isSeeding || isVerifying}>Voltar</Button>
        <Button onClick={handleNextClick} disabled={isSeeding || isVerifying}>
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar e Avançar
        </Button>
      </CardFooter>
    </>
  );
}
