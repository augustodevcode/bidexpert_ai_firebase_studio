// src/components/setup/finish-step.tsx
'use client';

import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { markSetupAsComplete } from '@/app/setup/actions';
import { useToast } from '@/hooks/use-toast';

export default function FinishStep() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      console.log("[FinishStep] Botão Finalizar clicado. Marcando setup como completo no banco de dados...");
      const result = await markSetupAsComplete();

      if (result.success) {
        console.log("[FinishStep] Setup marcado como completo no DB. Redirecionando...");
        toast({
          title: 'Configuração concluída!',
          description: 'Redirecionando para o painel de administração...',
        });
        // Redirecionar para o dashboard de admin
        window.location.href = '/admin/dashboard';
      } else {
        console.error("[FinishStep] Falha ao marcar setup como completo:", result.message);
        toast({
          title: 'Erro',
          description: result.message || 'Falha ao finalizar configuração.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("[FinishStep] Erro inesperado:", error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao finalizar configuração.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
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
