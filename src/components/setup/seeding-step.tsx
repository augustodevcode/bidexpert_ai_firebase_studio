// src/components/setup/seeding-step.tsx
'use client';

import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SeedingStepProps {
  onNext: () => void;
  onPrev: () => void;
}

// NOTE: The actual seeding logic is now handled server-side by the `npm run db:init` script.
// This component now serves as a user confirmation step to explain what happened.
export default function SeedingStep({ onNext, onPrev }: SeedingStepProps) {
  const [userConfirmation, setUserConfirmation] = useState(false);

  return (
    <>
      <CardHeader>
        <CardTitle>População Inicial do Banco de Dados</CardTitle>
        <CardDescription>
          Seu banco de dados foi inicializado e os dados essenciais (como perfis e categorias) foram inseridos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-500/50">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Inicialização Concluída!</AlertTitle>
          <AlertDescription>
            O script `db:init` foi executado automaticamente na inicialização do servidor, preparando seu banco de dados com as tabelas e dados essenciais. Você pode prosseguir com segurança.
            <br/><br/>
            Se desejar popular o banco com um conjunto completo de dados de **demonstração** (leilões, lotes, etc.), pare o servidor e execute o comando: <code className="font-semibold bg-muted px-1 py-0.5 rounded">npm run db:seed</code>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>Voltar</Button>
        <Button onClick={onNext}>Avançar para Configurações</Button>
      </CardFooter>
    </>
  );
}