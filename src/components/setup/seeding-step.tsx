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

export default function SeedingStep({ onNext, onPrev }: SeedingStepProps) {
  const [seedOption, setSeedOption] = useState<'essentials' | 'full' | 'none'>('essentials');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      // Em uma aplicação real, aqui chamaríamos uma server action
      // que executa o script de seed correspondente.
      // Por enquanto, vamos apenas simular.
      console.log(`Simulating seed with option: ${seedOption}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (seedOption === 'none') {
        setSeedResult({ success: true, message: 'Nenhuma ação foi executada.'});
      } else {
        setSeedResult({ success: true, message: `Banco de dados populado com sucesso com dados ${seedOption === 'full' ? 'completos' : 'essenciais'}!` });
      }
    } catch (error: any) {
       setSeedResult({ success: false, message: `Falha ao popular o banco de dados: ${error.message}` });
    } finally {
        setIsSeeding(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>População Inicial do Banco de Dados</CardTitle>
        <CardDescription>Escolha quais dados você deseja inserir no seu banco. Isso só precisa ser feito uma vez.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={seedOption} onValueChange={(val: any) => setSeedOption(val)} className="space-y-3">
          <Label htmlFor="seed-essentials" className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent has-[div>input:checked]:bg-accent has-[div>input:checked]:border-primary">
            <div className="flex items-center h-full"><RadioGroupItem value="essentials" id="seed-essentials" /></div>
            <div className="flex-grow">
              <p className="font-semibold">Apenas Dados Essenciais (Recomendado)</p>
              <p className="text-sm text-muted-foreground">Cria perfis de usuário padrão (admin, user), configurações da plataforma e categorias. Ideal para começar a cadastrar seus próprios dados.</p>
            </div>
          </Label>
          <Label htmlFor="seed-full" className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent has-[div>input:checked]:bg-accent has-[div>input:checked]:border-primary">
            <div className="flex items-center h-full"><RadioGroupItem value="full" id="seed-full" /></div>
            <div className="flex-grow">
              <p className="font-semibold">Dados Completos de Demonstração</p>
              <p className="text-sm text-muted-foreground">Inclui todos os dados essenciais mais leilões, lotes, usuários e comitentes de exemplo para uma experiência de demonstração completa.</p>
            </div>
          </Label>
          <Label htmlFor="seed-none" className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent has-[div>input:checked]:bg-accent has-[div>input:checked]:border-primary">
            <div className="flex items-center h-full"><RadioGroupItem value="none" id="seed-none" /></div>
            <div className="flex-grow">
              <p className="font-semibold">Não inserir nenhum dado</p>
              <p className="text-sm text-muted-foreground">Use esta opção se você já tem dados no seu banco de dados ou prefere cadastrar tudo manualmente desde o início.</p>
            </div>
          </Label>
        </RadioGroup>
        
        <div className="text-center">
            <Button onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Populando... </> : "Executar Ação Selecionada"}
            </Button>
        </div>
        
        {seedResult && (
            <Alert variant={seedResult.success ? 'default' : 'destructive'} className={seedResult.success ? "bg-green-50 dark:bg-green-900/20 border-green-500/50" : ""}>
                 {seedResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>{seedResult.success ? "Sucesso!" : "Erro!"}</AlertTitle>
                <AlertDescription>{seedResult.message}</AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isSeeding}>Voltar</Button>
        <Button onClick={onNext} disabled={isSeeding || !seedResult}>Avançar para Configurações</Button>
      </CardFooter>
    </>
  );
}
