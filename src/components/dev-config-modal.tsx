
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Cog, Database, Loader2, X } from 'lucide-react';

type DatabaseSystem = 'SAMPLE_DATA' | 'FIRESTORE' | 'MYSQL' | 'POSTGRES';

interface DevConfigModalProps {
  onConfigSet: () => void;
  onClose: () => void;
}

export default function DevConfigModal({ onConfigSet, onClose }: DevConfigModalProps) {
  const [selectedDb, setSelectedDb] = useState<DatabaseSystem>('SAMPLE_DATA');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: selectedDb }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Falha ao definir a configuração.');
      }
      
      onConfigSet();

    } catch (err: any) {
      console.error('Error setting dev config:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <Card id="seletor-database" className="w-full max-w-md shadow-2xl relative">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Cog className="h-6 w-6 text-primary" />
            Configuração de Desenvolvimento
          </CardTitle>
          <CardDescription>
            Selecione a fonte de dados para esta sessão. As opções de banco de dados só funcionarão se as strings de conexão correspondentes estiverem definidas no arquivo `.env.local`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedDb} onValueChange={(value) => setSelectedDb(value as DatabaseSystem)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SAMPLE_DATA" id="db-sample" />
              <Label htmlFor="db-sample">Dados de Exemplo (Rápido, sem persistência)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FIRESTORE" id="db-firestore" />
              <Label htmlFor="db-firestore">Firestore (Requer credenciais)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MYSQL" id="db-mysql" />
              <Label htmlFor="db-mysql">MySQL (Requer string de conexão)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="POSTGRES" id="db-postgres" />
              <Label htmlFor="db-postgres">PostgreSQL (Requer string de conexão)</Label>
            </div>
          </RadioGroup>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Aplicar e Recarregar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
