// src/app/admin/qa/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { runSellerEndToEndTest } from './actions';
import { Loader2, ClipboardCheck, PlayCircle, ServerCrash, CheckCircle } from 'lucide-react';

export default function QualityAssurancePage() {
    const [testResult, setTestResult] = useState<{ output: string; error?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRunTest = async () => {
        setIsLoading(true);
        setTestResult(null);
        const result = await runSellerEndToEndTest();
        setTestResult(result);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                        Painel de Quality Assurance (QA)
                    </CardTitle>
                    <CardDescription>
                        Execute testes automatizados para verificar a integridade das funcionalidades críticas da plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Card className="bg-secondary/30">
                        <CardHeader>
                            <CardTitle className="text-lg">Teste de Cadastro de Comitente</CardTitle>
                            <CardDescription>
                                Este teste verifica o fluxo completo de criação de um novo comitente, desde a chamada da action até a verificação no banco de dados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleRunTest} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                )}
                                {isLoading ? 'Executando...' : 'Rodar Teste'}
                            </Button>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            {testResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Resultados do Teste</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {testResult.error ? (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                                <div className="flex items-center gap-2 text-destructive font-bold">
                                    <ServerCrash className="h-5 w-5" />
                                    <span>Teste Falhou</span>
                                </div>
                                <pre className="mt-2 whitespace-pre-wrap text-xs font-mono bg-background p-2 rounded">{testResult.error}</pre>
                            </div>
                        ) : (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                                    <div className="flex items-center gap-2 text-green-700 font-bold">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Teste Passou com Sucesso</span>
                                    </div>
                                </div>
                        )}
                        <h4 className="text-sm font-semibold mt-4 mb-2">Saída do Console:</h4>
                        <pre className="bg-muted text-muted-foreground p-4 rounded-md text-xs overflow-x-auto">{testResult.output || "Nenhuma saída no console."}</pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
