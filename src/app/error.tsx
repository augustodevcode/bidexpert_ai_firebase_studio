// src/app/error.tsx
'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { analyzeErrorWithLogsAction } from '@/app/admin/qa/actions';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const handleAnalysis = async () => {
    console.log("Analyzing error:", error.message);
    const result = await analyzeErrorWithLogsAction(error.message);
    // You can display this result in a modal or another component
    console.log("AI Analysis:", result);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-lg text-center shadow-xl">
            <CardHeader>
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <CardTitle className="text-2xl font-bold">Ocorreu um Erro</CardTitle>
                <CardDescription>
                   A aplicação encontrou um problema inesperado.
                </CardDescription>
            </CardHeader>
            <CardContent className="bg-secondary/50 p-4 rounded-md mx-6">
                <p className="text-sm text-destructive-foreground font-mono">{error.message}</p>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6">
                <Button onClick={() => reset()}>
                    Tentar Novamente
                </Button>
                <p className="text-xs text-muted-foreground">
                    Se o problema persistir, entre em contato com o suporte. Digest: {error.digest || 'N/A'}
                </p>
            </CardFooter>
        </Card>
    </div>
  );
}
