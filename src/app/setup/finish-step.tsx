// src/components/setup/finish-step.tsx
'use client';

import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { markSetupAsComplete } from '@/app/setup/actions';

export default function FinishStep() {
  const { toast } = useToast();
  const [isFinishing, setIsFinishing] = useState(false);
  const router = useRouter();

  const handleFinish = async () => {
    setIsFinishing(true);
    console.log("[FinishStep] Finalizando o setup e marcando como completo no DB...");
    
    // Atualiza a flag no banco de dados.
    const result = await markSetupAsComplete();

    if (result.success) {
      toast({
        title: "Configuração Concluída!",
        description: "Você será redirecionado para o painel de administração.",
      });
      // A sessão do admin já foi criada no passo anterior.
      // Apenas redirecionamos APÓS a confirmação do update no DB.
      router.push('/admin/dashboard');
      router.refresh(); // Força a revalidação do layout raiz para ler o novo estado de `isSetupComplete`.
    } else {
       toast({
        title: "Erro ao Finalizar",
        description: `Não foi possível salvar o estado da configuração: ${result.message}`,
        variant: "destructive"
      });
       setIsFinishing(false);
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
          O usuário administrador foi criado e logado. Você agora pode acessar o painel de administração para começar a cadastrar leilões, lotes e gerenciar sua plataforma.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button size="lg" onClick={handleFinish} disabled={isFinishing}>
            {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {isFinishing ? 'Redirecionando...' : 'Ir para o Painel de Administração'}
        </Button>
      </CardFooter>
    </>
  );
}
