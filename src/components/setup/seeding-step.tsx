// src/components/setup/seeding-step.tsx
'use client';

import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2, Database } from 'lucide-react';
import { runFullSeedAction } from '@/app/admin/settings/actions';
import { useToast } from '@/hooks/use-toast';


interface SeedingStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function SeedingStep({ onNext, onPrev }: SeedingStepProps) {
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


  return (
    <>
      <CardHeader>
        <CardTitle>População Inicial do Banco de Dados</CardTitle>
        <CardDescription>
          Sua plataforma já está pronta com os dados essenciais para operar. Opcionalmente, você pode adicionar dados de demonstração.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-500/50">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Inicialização Essencial Concluída!</AlertTitle>
          <AlertDescription>
            Sua plataforma foi preparada com os dados básicos necessários, como perfis de usuário, categorias e localidades. Você já pode avançar para as configurações finais.
          </AlertDescription>
        </Alert>

        <Alert variant="outline">
          <Database className="h-4 w-4" />
          <AlertTitle>Quer ver a plataforma em ação?</AlertTitle>
          <AlertDescription>
            Clique no botão abaixo para popular sua plataforma com um conjunto completo de dados de demonstração, incluindo leilões, lotes, usuários e comitentes. Isso é ótimo para explorar todas as funcionalidades imediatamente.
          </AlertDescription>
          <Button onClick={handleSeedClick} disabled={isSeeding} className="mt-4">
             {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4" />}
             {isSeeding ? 'Populando...' : 'Popular com Dados de Demonstração'}
          </Button>
        </Alert>

      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isSeeding}>Voltar</Button>
        <Button onClick={onNext} disabled={isSeeding}>Avançar para Configurações</Button>
      </CardFooter>
    </>
  );
}
