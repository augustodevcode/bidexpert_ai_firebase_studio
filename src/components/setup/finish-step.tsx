// src/components/setup/finish-step.tsx
'use client';

import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function FinishStep() {
  
  const handleFinish = () => {
      // In a real app, this might set a cookie or database flag
      localStorage.setItem('bidexpert_setup_complete', 'true');
      window.location.href = '/admin/dashboard';
  };
    
  return (
    <>
      <CardHeader className="items-center text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4"/>
        <CardTitle className="text-2xl font-bold">Configuração Concluída!</CardTitle>
        <CardDescription>Sua plataforma BidExpert está pronta para ser utilizada.</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          Você agora pode acessar o painel de administração para começar a cadastrar leilões, lotes e gerenciar sua plataforma.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button size="lg" onClick={handleFinish}>
            Ir para o Painel de Administração
        </Button>
      </CardFooter>
    </>
  );
}
