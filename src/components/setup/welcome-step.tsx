// src/components/setup/welcome-step.tsx
'use client';

import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/setup/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const [activeDbSystem, setActiveDbSystem] = useState('');
  
  useEffect(() => {
    setActiveDbSystem(process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA');
  }, []);

  const isMySqlOrPostgres = activeDbSystem === 'MYSQL' || activeDbSystem === 'POSTGRES';

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Bem-vindo ao Assistente de Configuração do BidExpert!</CardTitle>
        <CardDescription>Vamos configurar sua plataforma de leilões em alguns passos simples.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. Verificação do Banco de Dados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Primeiro, vamos verificar qual banco de dados sua aplicação está configurada para usar. Esta configuração é definida no seu arquivo de ambiente (`.env`).
          </p>
          <Alert variant={isMySqlOrPostgres ? "default" : "destructive"} className={isMySqlOrPostgres ? "bg-green-50 dark:bg-green-900/20 border-green-500/50" : ""}>
             {isMySqlOrPostgres ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle className="font-semibold">
              Banco de Dados Ativo: <span className="font-bold uppercase">{activeDbSystem.replace('_', ' ')}</span>
            </AlertTitle>
            <AlertDescription>
              {isMySqlOrPostgres 
                ? "Ótimo! Sua aplicação está configurada para usar um banco de dados persistente. Podemos prosseguir." 
                : "Atenção: Você está usando dados de exemplo (SAMPLE_DATA), que não são persistentes. Para produção, recomendamos configurar um banco de dados MySQL ou PostgreSQL."
              }
            </AlertDescription>
          </Alert>
        </div>

        {!isMySqlOrPostgres && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Como configurar um banco de dados?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Para alterar para MySQL ou PostgreSQL, crie um arquivo chamado `.env` na raiz do seu projeto e adicione a variável de ambiente correspondente. Após salvar, reinicie a aplicação.
            </p>
            <CodeBlock>
              {`# Exemplo para MySQL
NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=MYSQL
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# Exemplo para PostgreSQL (Em Breve)
# NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=POSTGRES
# POSTGRES_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"`}
            </CodeBlock>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onNext} disabled={!isMySqlOrPostgres}>
            {isMySqlOrPostgres ? "Avançar para Dados Iniciais" : "Configure o DB para Continuar"}
        </Button>
      </CardFooter>
    </>
  );
}
